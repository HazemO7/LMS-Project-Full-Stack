const bcrypt = require("bcrypt");
const User = require("../models/User");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const Enrollment = require("../models/Enrollment");
const Progress = require("../models/Progress");
const PlatformSettings = require("../models/PlatformSettings");
const AuditLog = require("../models/AuditLog");
const { generateTemporaryPassword } = require("../utils/passwordUtils");
const { sendStaffOnboardingEmail } = require("../services/emailService");
const { recordAudit } = require("../services/auditService");
const { withSuperAdminLock } = require("../services/governanceLockService");
const logger = require("../utils/logger");

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const isValidObjectId = (id) => typeof id === "string" && OBJECT_ID_REGEX.test(id);
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePagination = (query, defaultLimit = 10) => {
    let page = parseInt(query.page, 10);
    let limit = parseInt(query.limit, 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1 || limit > 100) limit = defaultLimit;
    return { page, limit, skip: (page - 1) * limit };
};

const sanitizeUser = (userDoc) => {
    const obj = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
    delete obj.password;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpire;
    delete obj.resetPasswordTokenCreatedAt;
    return obj;
};

const handleServerError = (req, res, context, error) => {
    if (error?.statusCode && error.isOperational) {
        return res.status(error.statusCode).json({
            status: "fail",
            message: error.message,
        });
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

const getStats = async (req, res) => {
    try {
        const [
            totalUsers,
            superAdmins,
            admins,
            instructors,
            students,
            activeUsers,
            suspendedUsers,
            totalCourses,
            totalEnrollments,
            totalLessons,
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

        res.status(200).json({
            status: "success",
            data: {
                users: {
                    total: totalUsers,
                    superAdmins,
                    admins,
                    instructors,
                    students,
                    active: activeUsers,
                    suspended: suspendedUsers,
                },
                courses: { total: totalCourses },
                enrollments: { total: totalEnrollments },
                lessons: { total: totalLessons },
            },
        });
    } catch (error) {
        return handleServerError(req, res, "getStats", error);
    }
};

const getUsers = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query, 10);
        const { role = "all", status = "all", search = "" } = req.query;

        const filter = {};
        if (role && role !== "all") {
            filter.role = role;
        }
        if (status === "active") {
            filter.isActive = { $ne: false };
        } else if (status === "suspended") {
            filter.isActive = false;
        } else if (status === "locked") {
            filter.lockUntil = { $gt: new Date() };
        }

        if (search && String(search).trim()) {
            const regex = { $regex: escapeRegex(String(search).trim()), $options: "i" };
            filter.$or = [{ name: regex }, { email: regex }];
        }

        const [totalUsers, users] = await Promise.all([
            User.countDocuments(filter),
            User.find(filter)
                .select("-password -resetPasswordToken -resetPasswordExpire -resetPasswordTokenCreatedAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
        ]);

        res.status(200).json({
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
        const { name, email, role, temporaryPassword, specialty = "", bio = "", sendEmail = true } = req.body;
        const normalizedEmail = email.trim().toLowerCase();

        if (req.user.role === "admin" && (role === "admin" || role === "super_admin")) {
            return res.status(403).json({
                status: "fail",
                message: "Only a Super Admin can create administrator accounts.",
            });
        }

        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(400).json({
                status: "fail",
                message: "Account Already Exist",
            });
        }

        const plainTempPassword =
            temporaryPassword && temporaryPassword.trim()
                ? temporaryPassword.trim()
                : generateTemporaryPassword(12);

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

        await recordAudit({
            req,
            action: "USER_CREATED",
            targetType: "User",
            targetId: newUser._id,
            metadata: { email: newUser.email, role: newUser.role },
        });

        let emailSent = false;
        if (sendEmail !== false) {
            try {
                const loginUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/login`;
                const emailResult = await sendStaffOnboardingEmail({
                    email: newUser.email,
                    name: newUser.name,
                    role: newUser.role,
                    temporaryPassword: plainTempPassword,
                    loginUrl,
                });
                emailSent = emailResult?.mocked === false;
            } catch (emailErr) {
                logger.warn("User created but onboarding email failed to send", {
                    userId: newUser._id,
                    error: emailErr.message,
                });
            }
        }

        res.status(201).json({
            status: "success",
            data: sanitizeUser(newUser),
            temporaryPassword: plainTempPassword,
            emailSent,
        });
    } catch (error) {
        return handleServerError(req, res, "createStaffUser", error);
    }
};

const updateUserRole = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ status: "fail", message: "Invalid user ID" });
        }

        const { role } = req.body;
        if (req.user.role === "admin" && (role === "admin" || role === "super_admin")) {
            return res.status(403).json({
                status: "fail",
                message: "Only a Super Admin can assign administrator roles.",
            });
        }

        const outcome = await withSuperAdminLock(async () => {
            const target = await User.findById(req.params.id);
            if (!target) {
                return { status: 404, body: { status: "fail", message: "User not found" } };
            }

            if (req.user.role === "admin") {
                if (target.role === "admin" || target.role === "super_admin") {
                    return {
                        status: 403,
                        body: { status: "fail", message: "Only a Super Admin can modify administrator roles." },
                    };
                }

                const updated = await User.findOneAndUpdate(
                    { _id: target._id, role: { $nin: ["admin", "super_admin"] } },
                    { $set: { role } },
                    { returnDocument: "after" }
                );

                if (!updated) {
                    const latest = await User.findById(target._id);
                    if (!latest) {
                        return { status: 404, body: { status: "fail", message: "User not found" } };
                    }
                    return {
                        status: 403,
                        body: { status: "fail", message: "Only a Super Admin can modify administrator roles." },
                    };
                }

                return { status: 200, updated, previousRole: target.role };
            }

            if (target.role === "super_admin" && role !== "super_admin") {
                const activeSuperAdmins = await User.countDocuments({
                    role: "super_admin",
                    isActive: { $ne: false },
                });
                if (activeSuperAdmins <= 1) {
                    return {
                        status: 400,
                        body: { status: "fail", message: "Cannot demote the last active Super Admin." },
                    };
                }
            }

            const previousRole = target.role;
            target.role = role;
            await target.save();

            return { status: 200, updated: target, previousRole };
        });

        if (outcome.status !== 200) {
            return res.status(outcome.status).json(outcome.body);
        }

        await recordAudit({
            req,
            action: "ROLE_UPDATED",
            targetType: "User",
            targetId: outcome.updated._id,
            metadata: {
                email: outcome.updated.email,
                previousRole: outcome.previousRole,
                newRole: role,
            },
        });

        res.status(200).json({ status: "success", data: sanitizeUser(outcome.updated) });
    } catch (error) {
        return handleServerError(req, res, "updateUserRole", error);
    }
};

const updateUserStatus = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ status: "fail", message: "Invalid user ID" });
        }

        const { isActive, unlock } = req.body;

        const outcome = await withSuperAdminLock(async () => {
            const target = await User.findById(req.params.id);
            if (!target) {
                return { status: 404, body: { status: "fail", message: "User not found" } };
            }

            if (req.user.role === "admin" && (target.role === "admin" || target.role === "super_admin")) {
                return {
                    status: 403,
                    body: { status: "fail", message: "Only a Super Admin can change administrator account status." },
                };
            }

            if (typeof isActive === "boolean") {
                if (!isActive && target._id.toString() === req.user._id.toString()) {
                    return {
                        status: 400,
                        body: { status: "fail", message: "You cannot suspend your own account." },
                    };
                }
                if (!isActive && target.role === "super_admin") {
                    const activeSuperAdmins = await User.countDocuments({
                        role: "super_admin",
                        isActive: { $ne: false },
                    });
                    if (activeSuperAdmins <= 1) {
                        return {
                            status: 400,
                            body: { status: "fail", message: "Cannot suspend the last active Super Admin." },
                        };
                    }
                }
            }

            const updateFields = {};
            if (typeof isActive === "boolean") {
                updateFields.isActive = isActive;
            }
            if (unlock === true) {
                updateFields.loginAttempts = 0;
                updateFields.lockUntil = null;
            }

            const filter =
                req.user.role === "admin"
                    ? { _id: target._id, role: { $nin: ["admin", "super_admin"] } }
                    : { _id: target._id };

            const updated = await User.findOneAndUpdate(
                filter,
                { $set: updateFields },
                { returnDocument: "after" }
            );

            if (!updated) {
                const latest = await User.findById(target._id);
                if (!latest) {
                    return { status: 404, body: { status: "fail", message: "User not found" } };
                }
                return {
                    status: 403,
                    body: { status: "fail", message: "Only a Super Admin can change administrator account status." },
                };
            }

            return { status: 200, updated };
        });

        if (outcome.status !== 200) {
            return res.status(outcome.status).json(outcome.body);
        }

        if (typeof isActive === "boolean") {
            await recordAudit({
                req,
                action: "USER_STATUS_CHANGED",
                targetType: "User",
                targetId: outcome.updated._id,
                metadata: { email: outcome.updated.email, isActive },
            });
        }

        if (unlock === true) {
            await recordAudit({
                req,
                action: "USER_UNLOCKED",
                targetType: "User",
                targetId: outcome.updated._id,
                metadata: { email: outcome.updated.email },
            });
        }

        res.status(200).json({ status: "success", data: sanitizeUser(outcome.updated) });
    } catch (error) {
        return handleServerError(req, res, "updateUserStatus", error);
    }
};

const deleteUser = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ status: "fail", message: "Invalid user ID" });
        }

        const outcome = await withSuperAdminLock(async () => {
            const target = await User.findById(req.params.id);
            if (!target) {
                return { status: 404, body: { status: "fail", message: "User not found" } };
            }

            if (target._id.toString() === req.user._id.toString()) {
                return {
                    status: 400,
                    body: { status: "fail", message: "You cannot delete your own account." },
                };
            }

            if (target.role === "super_admin") {
                const totalSuperAdmins = await User.countDocuments({ role: "super_admin" });
                if (totalSuperAdmins <= 1) {
                    return {
                        status: 400,
                        body: { status: "fail", message: "Cannot delete the last Super Admin." },
                    };
                }
                if (target.isActive !== false) {
                    const activeSuperAdmins = await User.countDocuments({
                        role: "super_admin",
                        isActive: { $ne: false },
                    });
                    if (activeSuperAdmins <= 1) {
                        return {
                            status: 400,
                            body: { status: "fail", message: "Cannot delete the last active Super Admin." },
                        };
                    }
                }
            }

            const ownedCoursesCount = await Course.countDocuments({ instructor: target._id });
            if (ownedCoursesCount > 0) {
                return {
                    status: 400,
                    body: {
                        status: "fail",
                        message: "This user owns active courses. Please transfer or delete their courses before permanent deletion.",
                    },
                };
            }

            // Delete dependent records before removing the user document so retries remain recoverable
            await Enrollment.deleteMany({ user: target._id });
            await Progress.deleteMany({ user: target._id });
            await User.findByIdAndDelete(target._id);

            return { status: 200, target };
        });

        if (outcome.status !== 200) {
            return res.status(outcome.status).json(outcome.body);
        }

        await recordAudit({
            req,
            action: "USER_DELETED",
            targetType: "User",
            targetId: outcome.target._id,
            metadata: { email: outcome.target.email, role: outcome.target.role },
        });

        res.status(200).json({ status: "success", message: "User deleted successfully" });
    } catch (error) {
        return handleServerError(req, res, "deleteUser", error);
    }
};

const getAdminCourses = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query, 10);
        const { search = "", instructorId = "" } = req.query;

        const filter = {};
        if (search && String(search).trim()) {
            filter.title = { $regex: escapeRegex(String(search).trim()), $options: "i" };
        }
        if (instructorId) {
            if (!isValidObjectId(String(instructorId))) {
                return res.status(400).json({ status: "fail", message: "Invalid instructor ID" });
            }
            filter.instructor = instructorId;
        }

        const [totalCourses, courses] = await Promise.all([
            Course.countDocuments(filter),
            Course.find(filter)
                .populate("instructor", "name email role specialty isActive")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
        ]);

        const courseIds = courses.map((c) => c._id);
        const enrollmentCounts = await Enrollment.aggregate([
            { $match: { course: { $in: courseIds } } },
            { $group: { _id: "$course", count: { $sum: 1 } } },
        ]);

        const countMap = new Map(enrollmentCounts.map((item) => [item._id.toString(), item.count]));

        const enriched = courses.map((c) => {
            const obj = c.toObject();
            obj.enrollmentCount = countMap.get(c._id.toString()) || 0;
            obj.moduleCount = Array.isArray(c.modules) ? c.modules.length : 0;
            return obj;
        });

        res.status(200).json({
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

const transferCourseOwnership = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ status: "fail", message: "Invalid course ID" });
        }

        const { newInstructorId } = req.body;
        const [course, newInstructor] = await Promise.all([
            Course.findById(req.params.id),
            User.findById(newInstructorId),
        ]);

        if (!course) {
            return res.status(404).json({ status: "fail", message: "Course not found" });
        }
        if (
            !newInstructor ||
            newInstructor.isActive === false ||
            !["instructor", "admin", "super_admin"].includes(newInstructor.role)
        ) {
            return res.status(400).json({
                status: "fail",
                message: "Target user must be an active instructor or administrator.",
            });
        }

        const previousInstructorId = course.instructor ? course.instructor.toString() : null;
        if (previousInstructorId && previousInstructorId === newInstructor._id.toString()) {
            return res.status(400).json({
                status: "fail",
                message: "This user is already the owner of the course.",
            });
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

        res.status(200).json({ status: "success", data: course });
    } catch (error) {
        return handleServerError(req, res, "transferCourseOwnership", error);
    }
};

const getCourseEnrollments = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ status: "fail", message: "Invalid course ID" });
        }

        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ status: "fail", message: "Course not found" });
        }

        const enrollments = await Enrollment.find({ course: course._id })
            .populate("user", "name email role isActive")
            .sort({ createdAt: -1 });

        res.status(200).json({ status: "success", data: enrollments });
    } catch (error) {
        return handleServerError(req, res, "getCourseEnrollments", error);
    }
};

const manualEnrollUser = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ status: "fail", message: "Invalid course ID" });
        }

        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ status: "fail", message: "Course not found" });
        }

        const query = req.body.userId
            ? { _id: req.body.userId }
            : { email: req.body.email.trim().toLowerCase() };

        const student = await User.findOne(query);
        if (!student) {
            return res.status(404).json({ status: "fail", message: "User not found" });
        }

        const existing = await Enrollment.findOne({ user: student._id, course: course._id });
        if (existing) {
            return res.status(400).json({
                status: "fail",
                message: "User is already enrolled in this course",
            });
        }

        const enrollment = await Enrollment.create({ user: student._id, course: course._id });
        await enrollment.populate("user", "name email role isActive");

        await recordAudit({
            req,
            action: "ENROLLMENT_ADDED",
            targetType: "Enrollment",
            targetId: enrollment._id,
            metadata: { courseId: course._id.toString(), courseTitle: course.title, studentEmail: student.email },
        });

        res.status(201).json({ status: "success", data: enrollment });
    } catch (error) {
        return handleServerError(req, res, "manualEnrollUser", error);
    }
};

const manualUnenrollUser = async (req, res) => {
    try {
        const { id: courseId, userId } = req.params;
        if (!isValidObjectId(courseId) || !isValidObjectId(userId)) {
            return res.status(400).json({ status: "fail", message: "Invalid course or user ID" });
        }

        const existingEnrollment = await Enrollment.findOne({ course: courseId, user: userId });
        if (!existingEnrollment) {
            // Allow retrying cleanup if enrollment was already deleted before progress cleanup completed
            const progressCleanup = await Progress.deleteMany({ course: courseId, user: userId });
            if (progressCleanup.deletedCount === 0) {
                return res.status(404).json({ status: "fail", message: "Enrollment not found" });
            }

            await recordAudit({
                req,
                action: "ENROLLMENT_REMOVED",
                targetType: "Enrollment",
                targetId: null,
                metadata: { courseId, userId, progressCleanupOnly: true },
            });

            return res.status(200).json({ status: "success", message: "Enrollment removed successfully" });
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

        res.status(200).json({ status: "success", message: "Enrollment removed successfully" });
    } catch (error) {
        return handleServerError(req, res, "manualUnenrollUser", error);
    }
};

const getPlatformSettings = async (req, res) => {
    try {
        const settings = await PlatformSettings.getSingleton();
        res.status(200).json({ status: "success", data: settings });
    } catch (error) {
        return handleServerError(req, res, "getPlatformSettings", error);
    }
};

const updatePlatformSettings = async (req, res) => {
    try {
        const { allowPublicRegistration, maxVideoSizeMB, maxDocumentSizeMB, maxImageSizeMB } = req.body;
        const settings = await PlatformSettings.findOneAndUpdate(
            { singletonKey: "default" },
            {
                allowPublicRegistration,
                maxVideoSizeMB,
                maxDocumentSizeMB,
                maxImageSizeMB,
                updatedBy: req.user._id,
            },
            { returnDocument: "after", upsert: true }
        );

        await recordAudit({
            req,
            action: "SETTINGS_UPDATED",
            targetType: "PlatformSettings",
            targetId: settings._id,
            metadata: { allowPublicRegistration, maxVideoSizeMB, maxDocumentSizeMB, maxImageSizeMB },
        });

        res.status(200).json({ status: "success", data: settings });
    } catch (error) {
        return handleServerError(req, res, "updatePlatformSettings", error);
    }
};

const getAuditLogs = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query, 15);
        const { action = "all" } = req.query;

        const filter = {};
        if (action && action !== "all") {
            filter.action = action;
        }

        const [totalLogs, logs] = await Promise.all([
            AuditLog.countDocuments(filter),
            AuditLog.find(filter)
                .populate("actor", "name email role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
        ]);

        res.status(200).json({
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
