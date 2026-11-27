const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { isAdminRole } = require('./authmiddleware');
const logger = require('../utils/logger');

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const enrollmentGuard = async (req, res, next) => {
    try {
        const courseId = req.params.id;
        if (typeof courseId !== 'string' || !OBJECT_ID_REGEX.test(courseId)) {
            return res.status(400).json({ message: "Invalid course ID" });
        }

        // Super admins and admins have immediate access
        if (isAdminRole(req.user.role)) return next();

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: "Course not found" });

        // If they are the instructor of the course, allow access
        if (req.user.role === 'instructor' && course.instructor && course.instructor.toString() === req.user._id.toString()) {
            return next();
        }

        // For students, query enrollment checks
        if (req.user.role === 'student') {
            const enrollment = await Enrollment.findOne({ user: req.user._id, course: courseId });
            if (!enrollment) {
                return res.status(403).json({ message: "You must be enrolled to access this course content" });
            }
            return next();
        }

        return res.status(403).json({ message: "Access denied" });
    } catch (error) {
        logger.error("Enrollment check error", {
            error: error.message,
            courseId: req.params.id,
            userId: req.user?._id,
            requestId: req.id,
        });
        return res.status(500).json({ message: "Server Error during enrollment check" });
    }
};

module.exports = enrollmentGuard;
