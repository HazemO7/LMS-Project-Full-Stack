const User = require("../models/User");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const Enrollment = require("../models/Enrollment");
const Progress = require("../models/Progress");
const PlatformSettings = require("../models/PlatformSettings");
const AuditLog = require("../models/AuditLog");
const { recordAudit } = require("../services/auditService");
const { withSuperAdminLock } = require("../services/governanceLockService");
const logger = require("../utils/logger");
const {
    USER_SAFE_PROJECTION,
    isValidObjectId,
    escapeRegex,
    parsePagination,
    sanitizeUser,
    isPrivilegedRole,
    buildUserFilterQuery,
    fetchUsersByCursor,
    executeUserRoleUpdate,
    executeUserStatusUpdate,
    executeUserDeletion,
    executeCourseTransfer,
    dispatchOnboardingEmail,
    createStaffAccountRecord,
    buildSettingsUpdatePayload,
} = require("../services/adminGovernanceHelper");

const handleServerError = (req, res, context, error) => {
    if (error && error.isOperational) {
        return res.status(error.statusCode).json({ status: "fail", message: error.message });
    }
    logger.error(`Admin controller error (${context})`, {
        error: error?.message,
        stack: error?.stack,
        userId: req.user?._id,
        requestId: req.id,
    });
    return res.status(500).json({
        status: "error",
        message: "An unexpected server error occurred. Please try again later.",
    });
};

const runLockedGovernanceAction = async (req, res, context, idErrorMsg, executor, formatBody) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ status: "fail", message: idErrorMsg });
        }
        const outcome = await withSuperAdminLock(() => executor(req));
        if (outcome.status !== 200) {
            return res.status(outcome.status).json(outcome.body);
        }
        return res.status(200).json(formatBody(outcome));
    } catch (error) {
        return handleServerError(req, res, context, error);
    }
};

const getStats = async (req, res) => {
    try {
        const [
            totalUsers, superAdmins, admins, instructors, students,
            activeUsers, suspendedUsers, totalCourses, totalEnrollments, totalLessons,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: "super_admin" }),
            User.countDocuments({ role: "admin" }),
            User.countDocuments({ role: "instructor" }),
            User.countDocuments({ role: "student" }),
            User.countDocuments({ isActive: { $ne: false } }),
            User.countDocuments({ isActive: false }),
            Course.countDocuments(),
            Enrollment.countDocuments(),
            Lesson.countDocuments(),
        ]);

        return res.status(200).json({
            status: "success",
            data: {
                users: { total: totalUsers, superAdmins, admins, instructors, students, active: activeUsers, suspended: suspendedUsers },
                courses: { total: totalCourses },
                enrollments: { total: totalEnrollments },
                lessons: { total: totalLessons },
            },
        });
    } catch (error) {
        return handleServerError(req, res, "getStats", error);
    }
};

const isCursorRequest = (query) => Boolean(query.cursor) || query.cursorMode === "true";

const getUsers = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query, 10);
        const filter = buildUserFilterQuery(req.query);

        if (isCursorRequest(req.query)) {
            const cursorRes = await fetchUsersByCursor(filter, limit, req.query.cursor || "");
            if (cursorRes.error) return res.status(cursorRes.error.status).json(cursorRes.error.body);
            return res.status(200).json({ status: "success", ...cursorRes });
        }

        const [totalUsers, users] = await Promise.all([
            User.countDocuments(filter),
            User.find(filter).select(USER_SAFE_PROJECTION).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
        ]);

        return res.status(200).json({
            status: "success",
            page,
            limit,
            totalUsers,
            totalPages: Math.max(1, Math.ceil(totalUsers / limit)),
            data: users,
        });
    } catch (error) {
        return handleServerError(req, res, "getUsers", error);
    }
};

const createStaffUser = async (req, res) => {
    try {
        const { email, role, sendEmail = true } = req.body;
        if (req.user.role === "admin" && isPrivilegedRole(role)) {
            return res.status(403).json({ status: "fail", message: "Only a Super Admin can create administrator accounts." });
        }

        const existing = await User.findOne({ email: email.trim().toLowerCase() });
        if (existing) {
            return res.status(400).json({ status: "fail", message: "Account Already Exist" });
        }

        const { newUser, plainTempPassword } = await createStaffAccountRecord(req);
        await recordAudit({
            req,
            action: "USER_CREATED",
            targetType: "User",
            targetId: newUser._id,
            metadata: { email: newUser.email, role: newUser.role },
        });
        const emailSent = await dispatchOnboardingEmail(newUser, plainTempPassword, sendEmail);

        return res.status(201).json({
            status: "success",
            data: sanitizeUser(newUser),
            temporaryPassword: plainTempPassword,
            emailSent,
        });
    } catch (error) {
        return handleServerError(req, res, "createStaffUser", error);
    }
};

const updateUserRole = (req, res) =>
    runLockedGovernanceAction(
        req,
        res,
        "updateUserRole",
        "Invalid user ID",
        executeUserRoleUpdate,
        (outcome) => ({ status: "success", data: sanitizeUser(outcome.updated) })
    );

const updateUserStatus = (req, res) =>
    runLockedGovernanceAction(
        req,
        res,
        "updateUserStatus",
        "Invalid user ID",
        executeUserStatusUpdate,
        (outcome) => ({ status: "success", data: sanitizeUser(outcome.updated) })
    );

const deleteUser = (req, res) =>
    runLockedGovernanceAction(
        req,
        res,
        "deleteUser",
        "Invalid user ID",
        executeUserDeletion,
        () => ({ status: "success", message: "User deleted successfully" })
    );

const transferCourseOwnership = (req, res) =>
    runLockedGovernanceAction(
        req,
        res,
        "transferCourseOwnership",
        "Invalid course ID",
        executeCourseTransfer,
        (outcome) => ({ status: "success", data: outcome.data })
    );

const enrichCoursesWithCounts = async (courses) => {
    const courseIds = courses.map((c) => c._id);
    const enrollmentCounts = await Enrollment.aggregate([
        { $match: { course: { $in: courseIds } } },
        { $group: { _id: "$course", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(enrollmentCounts.map((item) => [item._id.toString(), item.count]));
    return courses.map((c) => {
        const obj = c.toObject();
        obj.enrollmentCount = countMap.get(c._id.toString()) || 0;
        obj.moduleCount = Array.isArray(c.modules) ? c.modules.length : 0;
        return obj;
    });
};

const buildAdminCourseFilter = ({ search = "", instructorId = "" }) => {
    const filter = {};
    const searchTerm = search ? String(search).trim() : "";
    if (searchTerm) filter.title = { $regex: escapeRegex(searchTerm), $options: "i" };
    if (!instructorId) return { filter };
    if (!isValidObjectId(String(instructorId))) {
        return { error: { status: 400, body: { status: "fail", message: "Invalid instructor ID" } } };
    }
    filter.instructor = instructorId;
    return { filter };
};

const getAdminCourses = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query, 10);
        const { filter, error } = buildAdminCourseFilter(req.query);
        if (error) return res.status(error.status).json(error.body);

        const [totalCourses, courses] = await Promise.all([
            Course.countDocuments(filter),
            Course.find(filter).populate("instructor", "name email role specialty isActive").sort({ createdAt: -1 }).skip(skip).limit(limit),
        ]);

        const enriched = await enrichCoursesWithCounts(courses);
        return res.status(200).json({
            status: "success",
            page,
            limit,
            totalCourses,
            totalPages: Math.max(1, Math.ceil(totalCourses / limit)),
            data: enriched,
        });
    } catch (error) {
        return handleServerError(req, res, "getAdminCourses", error);
    }
};

const getCourseEnrollments = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ status: "fail", message: "Invalid course ID" });
        }
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ status: "fail", message: "Course not found" });

        const enrollments = await Enrollment.find({ course: course._id })
            .populate("user", "name email role isActive")
            .sort({ createdAt: -1 });
        return res.status(200).json({ status: "success", data: enrollments });
    } catch (error) {
        return handleServerError(req, res, "getCourseEnrollments", error);
    }
};

const createManualEnrollment = async (req, course, student) => {
    const existing = await Enrollment.findOne({ user: student._id, course: course._id });
    if (existing) return { error: { status: 400, body: { status: "fail", message: "User is already enrolled in this course" } } };

    const enrollment = await Enrollment.create({ user: student._id, course: course._id });
    await enrollment.populate("user", "name email role isActive");

    await recordAudit({
        req,
        action: "ENROLLMENT_ADDED",
        targetType: "Enrollment",
        targetId: enrollment._id,
        metadata: { courseId: course._id.toString(), courseTitle: course.title, studentEmail: student.email },
    });
    return { enrollment };
};

const manualEnrollUser = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ status: "fail", message: "Invalid course ID" });
        }
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ status: "fail", message: "Course not found" });

        const query = req.body.userId ? { _id: req.body.userId } : { email: req.body.email.trim().toLowerCase() };
        const student = await User.findOne(query);
        if (!student) return res.status(404).json({ status: "fail", message: "User not found" });

        const result = await createManualEnrollment(req, course, student);
        if (result.error) return res.status(result.error.status).json(result.error.body);
        return res.status(201).json({ status: "success", data: result.enrollment });
    } catch (error) {
        if (error && error.code === 11000) {
            return res.status(400).json({ status: "fail", message: "User is already enrolled in this course" });
        }
        return handleServerError(req, res, "manualEnrollUser", error);
    }
};

const handleOrphanProgressCleanup = async (req, courseId, userId) => {
    const progressCleanup = await Progress.deleteMany({ course: courseId, user: userId });
    if (progressCleanup.deletedCount === 0) {
        return { status: 404, body: { status: "fail", message: "Enrollment not found" } };
    }
    await recordAudit({
        req,
        action: "ENROLLMENT_REMOVED",
        targetType: "Enrollment",
        targetId: null,
        metadata: { courseId, userId, progressCleanupOnly: true },
    });
    return { status: 200, body: { status: "success", message: "Enrollment removed successfully" } };
};

const manualUnenrollUser = async (req, res) => {
    try {
        const { id: courseId, userId } = req.params;
        if (!isValidObjectId(courseId) || !isValidObjectId(userId)) {
            return res.status(400).json({ status: "fail", message: "Invalid course or user ID" });
        }

        const existingEnrollment = await Enrollment.findOne({ course: courseId, user: userId });
        if (!existingEnrollment) {
            const cleanupRes = await handleOrphanProgressCleanup(req, courseId, userId);
            return res.status(cleanupRes.status).json(cleanupRes.body);
        }

        await Progress.deleteMany({ course: courseId, user: userId });
        await Enrollment.deleteOne({ _id: existingEnrollment._id });
        await recordAudit({
            req,
            action: "ENROLLMENT_REMOVED",
            targetType: "Enrollment",
            targetId: existingEnrollment._id,
            metadata: { courseId, userId },
        });
        return res.status(200).json({ status: "success", message: "Enrollment removed successfully" });
    } catch (error) {
        return handleServerError(req, res, "manualUnenrollUser", error);
    }
};

const getPlatformSettings = async (req, res) => {
    try {
        const settings = await PlatformSettings.getSingleton();
        return res.status(200).json({ status: "success", data: settings });
    } catch (error) {
        return handleServerError(req, res, "getPlatformSettings", error);
    }
};

const updatePlatformSettings = async (req, res) => {
    try {
        const { updateSet, auditMetadata } = buildSettingsUpdatePayload(req.body, req.user._id);
        const settings = await PlatformSettings.findOneAndUpdate(
            { singletonKey: "default" },
            { $set: updateSet, $setOnInsert: { singletonKey: "default" } },
            { returnDocument: "after", upsert: true }
        );
        await recordAudit({ req, action: "SETTINGS_UPDATED", targetType: "PlatformSettings", targetId: settings._id, metadata: auditMetadata });
        return res.status(200).json({ status: "success", data: settings });
    } catch (error) {
        return handleServerError(req, res, "updatePlatformSettings", error);
    }
};

const getAuditLogs = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query, 15);
        const { action = "all" } = req.query;
        const filter = action && action !== "all" ? { action } : {};

        const [totalLogs, logs] = await Promise.all([
            AuditLog.countDocuments(filter),
            AuditLog.find(filter).populate("actor", "name email role").sort({ createdAt: -1 }).skip(skip).limit(limit),
        ]);

        return res.status(200).json({
            status: "success",
            page,
            limit,
            totalLogs,
            totalPages: Math.max(1, Math.ceil(totalLogs / limit)),
            data: logs,
        });
    } catch (error) {
        return handleServerError(req, res, "getAuditLogs", error);
    }
};

module.exports = {
    getStats,
    getUsers,
    createStaffUser,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    getAdminCourses,
    transferCourseOwnership,
    getCourseEnrollments,
    manualEnrollUser,
    manualUnenrollUser,
    getPlatformSettings,
    updatePlatformSettings,
    getAuditLogs,
};
