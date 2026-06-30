const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

const enrollmentGuard = async (req, res, next) => {
    try {
        const courseId = req.params.id;

        // If they are admin allow access immediately
        if (req.user.role === 'admin') return next();

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
        return res.status(500).json({ message: "Server Error during enrollment check", error: error.message });
    }
};

module.exports = enrollmentGuard;
