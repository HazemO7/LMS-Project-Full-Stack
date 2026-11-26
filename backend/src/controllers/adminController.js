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
const logger = require("../utils/logger");

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
        res.status(500).json({ status: "error", message: error.message });
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

        if (search && search.trim()) {
            const regex = { $regex: search.trim(), $options: "i" };
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
        res.status(500).json({ status: "error", message: error.message });
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
                await sendStaffOnboardingEmail({
                    email: newUser.email,
                    name: newUser.name,
                    role: newUser.role,
                    temporaryPassword: plainTempPassword,
                    loginUrl,
                });
                emailSent = true;
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
        res.status(500).json({ status: "error", message: error.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const target = await User.findById(req.params.id);
        if (!target) {
            return res.status(404).json({ status: "fail", message: "User not found" });
        }

        if (req.user.role === "admin") {
            if (target.role === "admin" || target.role === "super_admin") {
                return res.status(403).json({
                    status: "fail",
                    message: "Only a Super Admin can modify administrator roles.",
                });
            }
            if (role === "admin" || role === "super_admin") {
                return res.status(403).json({
                    status: "fail",
                    message: "Only a Super Admin can assign administrator roles.",
                });
            }
        }

        if (target.role === "super_admin" && role !== "super_admin") {
            const activeSuperAdmins = await User.countDocuments({
                role: "super_admin",
                isActive: { $ne: false },
            });
            if (activeSuperAdmins <= 1) {
                return res.status(400).json({
                    status: "fail",
                    message: "Cannot demote the last active Super Admin.",
                });
            }
        }

        const previousRole = target.role;
        target.role = role;
        await target.save();

        await recordAudit({
            req,
            action: "ROLE_UPDATED",
            targetType: "User",
            targetId: target._id,
            metadata: { email: target.email, previousRole, newRole: role },
        });

        res.status(200).json({ status: "success", data: sanitizeUser(target) });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const { isActive, unlock } = req.body;
        const target = await User.findById(req.params.id);
        if (!target) {
            return res.status(404).json({ status: "fail", message: "User not found" });
        }

        if (req.user.role === "admin" && (target.role === "admin" || target.role === "super_admin")) {
            return res.status(403).json({
                status: "fail",
                message: "Only a Super Admin can change administrator account status.",
            });
        }

        if (typeof isActive === "boolean") {
            if (!isActive && target._id.toString() === req.user._id.toString()) {
                return res.status(400).json({
                    status: "fail",
                    message: "You cannot suspend your own account.",
                });
            }
            if (!isActive && target.role === "super_admin") {
                const activeSuperAdmins = await User.countDocuments({
                    role: "super_admin",
                    isActive: { $ne: false },
                });
                if (activeSuperAdmins <= 1) {
                    return res.status(400).json({
                        status: "fail",
                        message: "Cannot suspend the last active Super Admin.",
                    });
                }
            }

            target.isActive = isActive;
            await recordAudit({
                req,
                action: "USER_STATUS_CHANGED",
                targetType: "User",
                targetId: target._id,
                metadata: { email: target.email, isActive },
            });
        }

        if (unlock === true) {
            target.resetLoginAttempts();
            await recordAudit({
                req,
                action: "USER_UNLOCKED",
                targetType: "User",
                targetId: target._id,
                metadata: { email: target.email },
            });
        }

        await target.save();
        res.status(200).json({ status: "success", data: sanitizeUser(target) });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const target = await User.findById(req.params.id);
        if (!target) {
            return res.status(404).json({ status: "fail", message: "User not found" });
        }

        if (target._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                status: "fail",
                message: "You cannot delete your own account.",
            });
        }

        if (target.role === "super_admin") {
            const totalSuperAdmins = await User.countDocuments({ role: "super_admin" });
            if (totalSuperAdmins <= 1) {
                return res.status(400).json({
                    status: "fail",
                    message: "Cannot delete the last Super Admin.",
                });
            }
        }

        const ownedCoursesCount = await Course.countDocuments({ instructor: target._id });
        if (ownedCoursesCount > 0) {
            return res.status(400).json({
                status: "fail",
                message: "This user owns active courses. Please transfer or delete their courses before permanent deletion.",
            });
        }

        await Promise.all([
            Enrollment.deleteMany({ user: target._id }),
            Progress.deleteMany({ user: target._id }),
            User.findByIdAndDelete(target._id),
        ]);

        await recordAudit({
            req,
            action: "USER_DELETED",
            targetType: "User",
            targetId: target._id,
            metadata: { email: target.email, role: target.role },
        });

        res.status(200).json({ status: "success", message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

const getAdminCourses = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query, 10);
        const { search = "", instructorId = "" } = req.query;

        const filter = {};
        if (search && search.trim()) {
            filter.title = { $regex: search.trim(), $options: "i" };
        }
        if (instructorId) {
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
        res.status(500).json({ status: "error", message: error.message });
    }
};

const transferCourseOwnership = async (req, res) => {
    try {
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
        res.status(500).json({ status: "error", message: error.message });
    }
};

const getCourseEnrollments = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ status: "fail", message: "Course not found" });
        }

        const enrollments = await Enrollment.find({ course: course._id })
            .populate("user", "name email role isActive")
            .sort({ createdAt: -1 });

        res.status(200).json({ status: "success", data: enrollments });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

const manualEnrollUser = async (req, res) => {
    try {
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
        res.status(500).json({ status: "error", message: error.message });
    }
};

const manualUnenrollUser = async (req, res) => {
    try {
        const { id: courseId, userId } = req.params;
        const removed = await Enrollment.findOneAndDelete({ course: courseId, user: userId });
        if (!removed) {
            return res.status(404).json({ status: "fail", message: "Enrollment not found" });
        }

        await Progress.deleteMany({ course: courseId, user: userId });

        await recordAudit({
            req,
            action: "ENROLLMENT_REMOVED",
            targetType: "Enrollment",
            targetId: removed._id,
            metadata: { courseId, userId },
        });

        res.status(200).json({ status: "success", message: "Enrollment removed successfully" });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

const getPlatformSettings = async (req, res) => {
    try {
        const settings = await PlatformSettings.getSingleton();
        res.status(200).json({ status: "success", data: settings });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
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
            { new: true, upsert: true }
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
        res.status(500).json({ status: "error", message: error.message });
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
        res.status(500).json({ status: "error", message: error.message });
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
