const Course = require("../models/Course");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const Enrollment = require("../models/Enrollment");
const { isAdminRole } = require("./authmiddleware");

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
 */
const courseOwnershipGuard = (resourceType) => {
    return async (req, res, next) => {
        try {
            const adminBypass = isAdminRole(req.user.role);

            if (resourceType === "course") {
                const course = await Course.findById(req.params.id);
                if (!course) {
                    return res.status(404).json({ status: "fail", message: "Course not found" });
                }
                if (!adminBypass && course.instructor?.toString() !== req.user._id.toString()) {
                    return res.status(403).json({ status: "fail", message: "Not authorized to modify this course curriculum" });
                }
                req.course = course;
                return next();
            }

            if (resourceType === "module") {
                if (!req.params.id) {
                    // POST /api/modules
                    if (req.body.course) {
                        const course = await Course.findById(req.body.course);
                        if (!course) {
                            return res.status(404).json({ message: "Course not found" });
                        }
                        if (!adminBypass && course.instructor?.toString() !== req.user._id.toString()) {
                            return res.status(403).json({ message: "Not authorized to modify this course curriculum" });
                        }
                        req.course = course;
                    }
                    return next();
                }

                const mod = await Module.findById(req.params.id);
                if (!mod) {
                    return res.status(404).json({ message: "Module not found" });
                }
                const course = await resolveCourseFromModule(mod);
                if (course && !adminBypass && course.instructor?.toString() !== req.user._id.toString()) {
                    return res.status(403).json({ message: "Not authorized to modify this course curriculum" });
                }
                req.course = course;
                return next();
            }

            if (resourceType === "lesson") {
                if (!req.params.id) {
                    // POST /api/lessons
                    if (req.body.module) {
                        const mod = await Module.findById(req.body.module);
                        if (!mod) {
                            return res.status(404).json({ message: "Module not found" });
                        }
                        const course = await resolveCourseFromModule(mod);
                        if (course && !adminBypass && course.instructor?.toString() !== req.user._id.toString()) {
                            return res.status(403).json({ message: "Not authorized to modify this course curriculum" });
                        }
                        req.course = course;
                    }
                    return next();
                }

                const lesson = await Lesson.findById(req.params.id);
                if (!lesson) {
                    return res.status(404).json({ message: "Lesson not found" });
                }
                const course = await resolveCourseFromLesson(lesson);
                if (course && !adminBypass && course.instructor?.toString() !== req.user._id.toString()) {
                    return res.status(403).json({ message: "Not authorized to modify this course curriculum" });
                }
                req.course = course;
                return next();
            }

            return next();
        } catch (error) {
            return res.status(500).json({ message: "Server error during ownership check", error: error.message });
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

            if (req.user.role === "instructor" && course.instructor?.toString() === req.user._id.toString()) {
                return next();
            }

            if (req.user.role === "student") {
                const enrolled = await Enrollment.findOne({ user: req.user._id, course: course._id });
                if (enrolled) return next();
                return res.status(403).json({ message: "You must be enrolled to access this course content" });
            }

            return res.status(403).json({ message: "Access denied" });
        } catch (error) {
            return res.status(500).json({ message: "Server error during access check", error: error.message });
        }
    };
};

module.exports = { courseOwnershipGuard, curriculumReadGuard };
