const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const logger = require('../utils/logger');

const enrollCourse = async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.user._id;

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: "Course not found" });

        const existingEnrollment = await Enrollment.findOne({ user: userId, course: courseId });
        if (existingEnrollment) {
            return res.status(400).json({ message: "You are already enrolled in this course" });
        }

        const enrollment = new Enrollment({ user: userId, course: courseId });
        await enrollment.save();

        logger.info("User enrolled in course successfully", { userId, courseId, requestId: req.id });

        res.status(201).json({ status: "success", data: enrollment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMyCourses = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ user: req.user._id }).populate('course');
        res.status(200).json({ status: "success", data: enrollments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { enrollCourse, getMyCourses };
