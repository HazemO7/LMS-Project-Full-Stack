const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const { withSuperAdminLock } = require('../services/governanceLockService');
const { PUBLIC_INSTRUCTOR_FIELDS } = require('../services/curriculumService');
const logger = require('../utils/logger');

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const resolveEligibleStudent = async (userId) => {
    const user = await User.findById(userId).select('_id role isActive');
    if (!user) return { error: { status: 401, message: 'User no longer exists' } };
    if (user.isActive === false) {
        return { error: { status: 403, message: 'Your account has been suspended. Please contact administration.' } };
    }
    if (user.role !== 'student') {
        return { error: { status: 403, message: 'Access denied' } };
    }
    return { user };
};

const createStudentEnrollment = async (userId, courseId) => {
    const actorRes = await resolveEligibleStudent(userId);
    if (actorRes.error) return actorRes;

    const course = await Course.findById(courseId);
    if (!course) return { error: { status: 404, message: 'Course not found' } };

    const existingEnrollment = await Enrollment.findOne({ user: userId, course: courseId });
    if (existingEnrollment) {
        return { error: { status: 400, message: 'You are already enrolled in this course' } };
    }

    const enrollment = await Enrollment.create({ user: userId, course: courseId });
    return { enrollment };
};

const handleEnrollError = (res, req, error) => {
    if (error && error.code === 11000) {
        return res.status(400).json({ message: 'You are already enrolled in this course' });
    }
    if (error && error.isOperational) {
        return res.status(error.statusCode).json({ message: error.message });
    }
    logger.error('Enrollment error', { error: error?.message, userId: req.user?._id, courseId: req.params.id, requestId: req.id });
    return res.status(500).json({ message: 'Failed to enroll in course' });
};

const enrollCourse = async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.user._id;
        if (typeof courseId !== 'string' || !OBJECT_ID_REGEX.test(courseId)) {
            return res.status(400).json({ message: 'Invalid course ID' });
        }

        const outcome = await withSuperAdminLock(() => createStudentEnrollment(userId, courseId));
        if (outcome.error) {
            return res.status(outcome.error.status).json({ message: outcome.error.message });
        }

        logger.info('User enrolled in course successfully', { userId, courseId, requestId: req.id });
        return res.status(201).json({ status: 'success', data: outcome.enrollment });
    } catch (error) {
        return handleEnrollError(res, req, error);
    }
};

const getMyCourses = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ user: req.user._id }).populate({
            path: 'course',
            populate: { path: 'instructor', select: PUBLIC_INSTRUCTOR_FIELDS },
        });
        res.status(200).json({ status: 'success', data: enrollments });
    } catch (error) {
        logger.error('Failed to load user courses', { error: error?.message, userId: req.user?._id, requestId: req.id });
        res.status(500).json({ message: 'Failed to load enrolled courses' });
    }
};

module.exports = { enrollCourse, getMyCourses };
