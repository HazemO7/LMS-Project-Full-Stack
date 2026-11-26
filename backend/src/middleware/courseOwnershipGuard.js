const mongoose = require("mongoose");
const Course = require("../models/Course");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const Enrollment = require("../models/Enrollment");
const { isAdminRole } = require("./authmiddleware");
const logger = require("../utils/logger");

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const isValidObjectId = (id) => typeof id === "string" && OBJECT_ID_REGEX.test(id);

const isCourseOwner = (course, userId) =>
    Boolean(course && course.instructor && course.instructor.toString() === userId.toString());

const resolveCourseFromModule = async (moduleDoc) => {
    if (!moduleDoc) return null;
    if (moduleDoc.course) {
        return Course.findById(moduleDoc.course);
    }
    return Course.findOne({ modules: moduleDoc._id });
};

const resolveCourseFromLesson = async (lessonDoc) => {
    if (!lessonDoc) return null;
    const mod = lessonDoc.module
        ? await Module.findById(lessonDoc.module)
        : await Module.findOne({ lesson: lessonDoc._id });
    if (!mod) return null;
    return resolveCourseFromModule(mod);
};

/**
 * Ensures only super_admin, admin, or the owning instructor can mutate a course, module, or lesson.
 * Fails closed when parent course ownership cannot be resolved for non-admins.
 */
const courseOwnershipGuard = (resourceType) => {
    return async (req, res, next) => {
        try {
            const adminBypass = isAdminRole(req.user.role);

            if (resourceType === "course") {
                if (!isValidObjectId(req.params.id)) {
                    return res.status(400).json({ status: "fail", message: "Invalid course ID" });
                }
                const course = await Course.findById(req.params.id);
                if (!course) {
                    return res.status(404).json({ status: "fail", message: "Course not found" });
                }
                if (!adminBypass && !isCourseOwner(course, req.user._id)) {
                    return res.status(403).json({ status: "fail", message: "Not authorized to modify this course curriculum" });
                }
                req.course = course;
                return next();
            }

            if (resourceType === "module") {
                if (!req.params.id) {
                    // POST /api/modules
                    if (!req.body.course) {
                        if (!adminBypass) {
                            return res.status(403).json({ message: "Not authorized to modify this course curriculum" });
                        }
                        return next();
                    }
                    if (!isValidObjectId(req.body.course)) {
                        return res.status(400).json({ message: "Invalid course ID" });
                    }
                    const course = await Course.findById(req.body.course);
                    if (!course) {
                        return res.status(404).json({ message: "Course not found" });
                    }
                    if (!adminBypass && !isCourseOwner(course, req.user._id)) {
                        return res.status(403).json({ message: "Not authorized to modify this course curriculum" });
                    }
                    req.course = course;
                    return next();
                }

                if (!isValidObjectId(req.params.id)) {
                    return res.status(400).json({ message: "Invalid module ID" });
                }
                const mod = await Module.findById(req.params.id);
                if (!mod) {
                    return res.status(404).json({ message: "Module not found" });
                }
                const course = await resolveCourseFromModule(mod);
                if (!adminBypass && !isCourseOwner(course, req.user._id)) {
                    return res.status(403).json({ message: "Not authorized to modify this course curriculum" });
                }
                req.course = course;
                req.moduleDoc = mod;
                return next();
            }

            if (resourceType === "lesson") {
                if (!req.params.id) {
                    // POST /api/lessons
                    if (!req.body.module) {
                        if (!adminBypass) {
                            return res.status(403).json({ message: "Not authorized to modify this course curriculum" });
                        }
                        return next();
                    }
                    if (!isValidObjectId(req.body.module)) {
                        return res.status(400).json({ message: "Invalid module ID" });
                    }
                    const mod = await Module.findById(req.body.module);
                    if (!mod) {
                        return res.status(404).json({ message: "Module not found" });
                    }
                    const course = await resolveCourseFromModule(mod);
                    if (!adminBypass && !isCourseOwner(course, req.user._id)) {
                        return res.status(403).json({ message: "Not authorized to modify this course curriculum" });
                    }
                    req.course = course;
                    req.moduleDoc = mod;
                    return next();
                }

                if (!isValidObjectId(req.params.id)) {
                    return res.status(400).json({ message: "Invalid lesson ID" });
                }
                const lesson = await Lesson.findById(req.params.id);
                if (!lesson) {
                    return res.status(404).json({ message: "Lesson not found" });
                }
                const course = await resolveCourseFromLesson(lesson);
                if (!adminBypass && !isCourseOwner(course, req.user._id)) {
                    return res.status(403).json({ message: "Not authorized to modify this course curriculum" });
                }
                req.course = course;
                req.lessonDoc = lesson;
                return next();
            }

            return next();
        } catch (error) {
            logger.error("Ownership check error", { error: error.message, resourceType, userId: req.user?._id, requestId: req.id });
            return res.status(500).json({ message: "Server error during ownership check" });
        }
    };
};

/**
 * Ensures standalone GET /:id for a module or lesson is accessible only to admins,
 * the owning instructor, or an enrolled student.
 */
const curriculumReadGuard = (resourceType) => {
    return async (req, res, next) => {
        try {
            if (!isValidObjectId(req.params.id)) {
                return res.status(400).json({ message: `Invalid ${resourceType} ID` });
            }

            if (isAdminRole(req.user.role)) return next();

            let course = null;
            if (resourceType === "module") {
                const mod = await Module.findById(req.params.id);
                if (!mod) return res.status(404).json({ message: "Module not found" });
                course = await resolveCourseFromModule(mod);
            } else if (resourceType === "lesson") {
                const lesson = await Lesson.findById(req.params.id);
                if (!lesson) return res.status(404).json({ message: "Lesson not found" });
                course = await resolveCourseFromLesson(lesson);
            }

            if (!course) {
                return res.status(403).json({ message: "Access denied" });
            }

            if (req.user.role === "instructor" && isCourseOwner(course, req.user._id)) {
                return next();
            }

            if (req.user.role === "student") {
                const enrolled = await Enrollment.findOne({ user: req.user._id, course: course._id });
                if (enrolled) return next();
                return res.status(403).json({ message: "You must be enrolled to access this course content" });
            }

            return res.status(403).json({ message: "Access denied" });
        } catch (error) {
            logger.error("Curriculum read check error", { error: error.message, resourceType, userId: req.user?._id, requestId: req.id });
            return res.status(500).json({ message: "Server error during access check" });
        }
    };
};

module.exports = {
    courseOwnershipGuard,
    curriculumReadGuard,
    resolveCourseFromModule,
    resolveCourseFromLesson,
};
