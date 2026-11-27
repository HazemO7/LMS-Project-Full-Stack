const bcrypt = require("bcrypt");
const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Progress = require("../models/Progress");
const { generateTemporaryPassword } = require("../utils/passwordUtils");
const { sendStaffOnboardingEmail } = require("./emailService");
const { recordAudit } = require("./auditService");
const logger = require("../utils/logger");

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const USER_SAFE_PROJECTION = "-password -tokenVersion -resetPasswordToken -resetPasswordExpire -resetPasswordTokenCreatedAt";
const PRIVILEGED_ROLES = new Set(["admin", "super_admin"]);
const COURSE_OWNER_ROLES = new Set(["instructor", "admin", "super_admin"]);
const SETTINGS_KEYS = ["allowPublicRegistration", "maxVideoSizeMB", "maxDocumentSizeMB", "maxImageSizeMB"];

const isValidObjectId = (id) => {
    if (typeof id !== "string") return false;
    return OBJECT_ID_REGEX.test(id);
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isPrivilegedRole = (role) => PRIVILEGED_ROLES.has(role);
const failOutcome = (status, message, extra = {}) => ({ status, body: { status: "fail", message, ...extra } });

const parsePositiveInt = (rawValue, fallback, max = Infinity) => {
    const parsed = parseInt(rawValue, 10);
    if (Number.isNaN(parsed)) return fallback;
    if (parsed < 1) return fallback;
    if (parsed > max) return fallback;
    return parsed;
};

const parsePagination = (query, defaultLimit = 10) => {
    const page = parsePositiveInt(query.page, 1);
    const limit = parsePositiveInt(query.limit, defaultLimit, 100);
    return { page, limit, skip: (page - 1) * limit };
};

const sanitizeUser = (userDoc) => {
    const obj = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
    delete obj.password;
    delete obj.tokenVersion;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpire;
    delete obj.resetPasswordTokenCreatedAt;
    return obj;
};

const applyStatusFilter = (filter, status) => {
    if (status === "active") filter.isActive = { $ne: false };
    if (status === "suspended") filter.isActive = false;
    if (status === "locked") filter.lockUntil = { $gt: new Date() };
};

const buildUserFilterQuery = ({ role = "all", status = "all", search = "" }) => {
    const filter = {};
    if (role && role !== "all") filter.role = role;
    applyStatusFilter(filter, status);

    const trimmedSearch = search ? String(search).trim() : "";
    if (trimmedSearch) {
        const regex = { $regex: escapeRegex(trimmedSearch), $options: "i" };
        filter.$or = [{ name: regex }, { email: regex }];
    }
    return filter;
};

const fetchUsersByCursor = async (filter, limit, cursor) => {
    const queryFilter = { ...filter };
    if (cursor) {
        if (!isValidObjectId(String(cursor))) {
            return { error: failOutcome(400, "Invalid cursor ID") };
        }
        queryFilter._id = { $lt: String(cursor) };
    }

    const rows = await User.find(queryFilter).select(USER_SAFE_PROJECTION).sort({ _id: -1 }).limit(limit + 1);
    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore && data.length > 0 ? data[data.length - 1]._id.toString() : null;
    return { limit, nextCursor, data };
};

const resolveActiveActor = async (req, requireSuperAdmin = false) => {
    const actor = await User.findById(req.user._id).select("role isActive");
    if (!actor) return { error: failOutcome(401, "User no longer exists") };
    if (actor.isActive === false) {
        return {
            error: failOutcome(403, "Your account has been suspended. Please contact administration.", {
                code: "ACCOUNT_SUSPENDED",
            }),
        };
    }
    const allowed = requireSuperAdmin ? actor.role === "super_admin" : isPrivilegedRole(actor.role);
    if (!allowed) {
        return { error: failOutcome(403, "Forbidden: insufficient role privileges") };
    }
    return { actor };
};

const countActiveSuperAdmins = () =>
    User.countDocuments({ role: "super_admin", isActive: { $ne: false } });

const isLastActiveSuperAdmin = async (target) => {
    if (target.role !== "super_admin") return false;
    if (target.isActive === false) return false;
    return (await countActiveSuperAdmins()) <= 1;
};

const applyAdminRoleMutation = async (target, role) => {
    if (isPrivilegedRole(target.role)) {
        return { error: failOutcome(403, "Only a Super Admin can modify administrator roles.") };
    }

    const updated = await User.findOneAndUpdate(
        { _id: target._id, role: { $nin: ["admin", "super_admin"] } },
        { $set: { role } },
        { returnDocument: "after" }
    );
    if (updated) return { updated };

    const latest = await User.findById(target._id);
    if (!latest) return { error: failOutcome(404, "User not found") };
    return { error: failOutcome(403, "Only a Super Admin can modify administrator roles.") };
};

const commitRoleChange = async (actor, target, role) => {
    if (actor.role === "admin") {
        return applyAdminRoleMutation(target, role);
    }
    if (role !== "super_admin") {
        const isLast = await isLastActiveSuperAdmin(target);
        if (isLast) return { error: failOutcome(400, "Cannot demote the last active Super Admin.") };
    }
    target.role = role;
    const updated = await target.save();
    return { updated };
};

const executeUserRoleUpdate = async (req) => {
    const { actor, error: actorError } = await resolveActiveActor(req);
    if (actorError) return actorError;

    const { role } = req.body;
    if (actor.role === "admin" && isPrivilegedRole(role)) {
        return failOutcome(403, "Only a Super Admin can assign administrator roles.");
    }

    const target = await User.findById(req.params.id);
    if (!target) return failOutcome(404, "User not found");

    const previousRole = target.role;
    const result = await commitRoleChange(actor, target, role);
    if (result.error) return result.error;

    await recordAudit({
        req,
        action: "ROLE_UPDATED",
        targetType: "User",
        targetId: result.updated._id,
        metadata: { email: result.updated.email, previousRole, newRole: role },
    });
    return { status: 200, updated: result.updated };
};

const validateStatusChange = async (actor, target, isActive, currentUserId) => {
    if (actor.role === "admin" && isPrivilegedRole(target.role)) {
        return failOutcome(403, "Only a Super Admin can change administrator account status.");
    }
    if (typeof isActive !== "boolean") return null;
    if (isActive) return null;

    if (target._id.toString() === currentUserId.toString()) {
        return failOutcome(400, "You cannot suspend your own account.");
    }
    if (await isLastActiveSuperAdmin(target)) {
        return failOutcome(400, "Cannot suspend the last active Super Admin.");
    }
    return null;
};

const buildStatusUpdateFields = ({ isActive, unlock }) => {
    const updateFields = {};
    if (typeof isActive === "boolean") updateFields.isActive = isActive;
    if (unlock === true) {
        updateFields.loginAttempts = 0;
        updateFields.lockUntil = null;
    }
    return updateFields;
};

const commitStatusUpdate = async (actor, target, body) => {
    const filter = actor.role === "admin"
        ? { _id: target._id, role: { $nin: ["admin", "super_admin"] } }
        : { _id: target._id };

    const updated = await User.findOneAndUpdate(
        filter,
        { $set: buildStatusUpdateFields(body) },
        { returnDocument: "after" }
    );
    if (updated) return { updated };

    const latest = await User.findById(target._id);
    if (!latest) return { error: failOutcome(404, "User not found") };
    return { error: failOutcome(403, "Only a Super Admin can change administrator account status.") };
};

const recordStatusAudits = async (req, updated, { isActive, unlock }) => {
    if (typeof isActive === "boolean") {
        await recordAudit({
            req,
            action: "USER_STATUS_CHANGED",
            targetType: "User",
            targetId: updated._id,
            metadata: { email: updated.email, isActive },
        });
    }
    if (unlock === true) {
        await recordAudit({
            req,
            action: "USER_UNLOCKED",
            targetType: "User",
            targetId: updated._id,
            metadata: { email: updated.email },
        });
    }
};

const executeUserStatusUpdate = async (req) => {
    const { actor, error: actorError } = await resolveActiveActor(req);
    if (actorError) return actorError;

    const target = await User.findById(req.params.id);
    if (!target) return failOutcome(404, "User not found");

    const validationErr = await validateStatusChange(actor, target, req.body.isActive, req.user._id);
    if (validationErr) return validationErr;

    const result = await commitStatusUpdate(actor, target, req.body);
    if (result.error) return result.error;

    await recordStatusAudits(req, result.updated, req.body);
    return { status: 200, updated: result.updated };
};

const validateSuperAdminDeletion = async (target) => {
    if (target.role !== "super_admin") return null;
    if ((await User.countDocuments({ role: "super_admin" })) <= 1) {
        return failOutcome(400, "Cannot delete the last Super Admin.");
    }
    if (await isLastActiveSuperAdmin(target)) {
        return failOutcome(400, "Cannot delete the last active Super Admin.");
    }
    return null;
};

const validateUserDeletion = async (target, currentUserId) => {
    if (!target) return failOutcome(404, "User not found");
    if (target._id.toString() === currentUserId.toString()) {
        return failOutcome(400, "You cannot delete your own account.");
    }
    const superAdminErr = await validateSuperAdminDeletion(target);
    if (superAdminErr) return superAdminErr;

    if ((await Course.countDocuments({ instructor: target._id })) > 0) {
        return failOutcome(
            400,
            "This user owns active courses. Please transfer or delete their courses before permanent deletion."
        );
    }
    return null;
};

const executeUserDeletion = async (req) => {
    const { error: actorError } = await resolveActiveActor(req, true);
    if (actorError) return actorError;

    const target = await User.findById(req.params.id);
    const validationErr = await validateUserDeletion(target, req.user._id);
    if (validationErr) return validationErr;

    // Delete dependent records before removing the user document so retries remain recoverable
    await Enrollment.deleteMany({ user: target._id });
    await Progress.deleteMany({ user: target._id });
    await User.findByIdAndDelete(target._id);

    await recordAudit({
        req,
        action: "USER_DELETED",
        targetType: "User",
        targetId: target._id,
        metadata: { email: target.email, role: target.role },
    });
    return { status: 200 };
};

const isEligibleCourseOwner = (user) => {
    if (!user) return false;
    if (user.isActive === false) return false;
    return COURSE_OWNER_ROLES.has(user.role);
};

const executeCourseTransfer = async (req) => {
    const { error: actorError } = await resolveActiveActor(req, true);
    if (actorError) return actorError;

    const course = await Course.findById(req.params.id);
    if (!course) return failOutcome(404, "Course not found");

    const newInstructor = await User.findById(req.body.newInstructorId);
    if (!isEligibleCourseOwner(newInstructor)) {
        return failOutcome(400, "Target user must be an active instructor or administrator.");
    }

    const previousInstructorId = course.instructor ? course.instructor.toString() : null;
    if (previousInstructorId === newInstructor._id.toString()) {
        return failOutcome(400, "This user is already the owner of the course.");
    }

    course.instructor = newInstructor._id;
    await course.save();
    await course.populate("instructor", "name email role specialty");

    await recordAudit({
        req,
        action: "COURSE_TRANSFERRED",
        targetType: "Course",
        targetId: course._id,
        metadata: {
            courseTitle: course.title,
            previousInstructorId,
            newInstructorId: newInstructor._id.toString(),
            newInstructorEmail: newInstructor.email,
        },
    });
    return { status: 200, data: course };
};

const dispatchOnboardingEmail = async (newUser, plainTempPassword, sendEmail) => {
    if (sendEmail === false) return false;
    try {
        const loginUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/login`;
        const emailResult = await sendStaffOnboardingEmail({
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            temporaryPassword: plainTempPassword,
            loginUrl,
        });
        return emailResult?.mocked === false;
    } catch (emailErr) {
        logger.warn("User created but onboarding email failed to send", { userId: newUser._id, error: emailErr.message });
        return false;
    }
};

const createStaffAccountRecord = async (req) => {
    const { name, email, role, temporaryPassword, specialty = "", bio = "" } = req.body;
    if (temporaryPassword && Buffer.byteLength(temporaryPassword, "utf8") > 72) {
        return { error: failOutcome(400, "Password must not exceed 72 bytes.") };
    }
    const normalizedEmail = email.trim().toLowerCase();
    const plainTempPassword = temporaryPassword || generateTemporaryPassword(12);
    const hashedPassword = await bcrypt.hash(plainTempPassword, 10);

    const newUser = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role,
        isActive: true,
        mustChangePassword: true,
        specialty: specialty.trim(),
        bio: bio.trim(),
        createdBy: req.user._id,
    });
    return { newUser, plainTempPassword };
};

const buildSettingsUpdatePayload = (body, actorId) => {
    const updateSet = { updatedBy: actorId };
    const auditMetadata = {};
    for (const key of SETTINGS_KEYS) {
        if (body[key] !== undefined) {
            updateSet[key] = body[key];
            auditMetadata[key] = body[key];
        }
    }
    return { updateSet, auditMetadata };
};

module.exports = {
    USER_SAFE_PROJECTION,
    isValidObjectId,
    escapeRegex,
    parsePagination,
    sanitizeUser,
    isPrivilegedRole,
    buildUserFilterQuery,
    fetchUsersByCursor,
    resolveActiveActor,
    executeUserRoleUpdate,
    executeUserStatusUpdate,
    executeUserDeletion,
    executeCourseTransfer,
    dispatchOnboardingEmail,
    createStaffAccountRecord,
    buildSettingsUpdatePayload,
};
