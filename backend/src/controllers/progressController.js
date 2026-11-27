const Progress = require('../models/Progress');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { withSuperAdminLock } = require('../services/governanceLockService');
const logger = require('../utils/logger');

const executeLessonCompletion = async (req, lessonId, courseId) => {
    const actor = await User.findById(req.user._id).select('_id role isActive');
    if (!actor) return { status: 401, message: 'User no longer exists' };
    if (actor.isActive === false) {
        return { status: 403, message: 'Your account has been suspended. Please contact administration.' };
    }

    const enrollment = await Enrollment.findOne({ user: actor._id, course: courseId });
    if (!enrollment && actor.role === 'student') {
        return { status: 403, message: 'You must be enrolled to complete lessons' };
    }

    let progress = await Progress.findOne({ user: actor._id, lesson: lessonId });
    if (progress) {
        progress.completed = !progress.completed;
        await progress.save();
    } else {
        progress = await Progress.create({
            user: actor._id,
            course: courseId,
            lesson: lessonId,
            completed: true,
        });
    }
    return { status: 200, progress };
};

// when a student clicks "complete" on a lesson, we toggle their progress for that lesson
const completeLesson = async (req, res) => {
    try {
        const lessonId = req.params.id;
        const { courseId } = req.body;

        if (!courseId) return res.status(400).json({ message: "courseId is required in request body" });

        const outcome = await withSuperAdminLock(() => executeLessonCompletion(req, lessonId, courseId));
        if (outcome.status !== 200) {
            return res.status(outcome.status).json({ message: outcome.message });
        }

        const { progress } = outcome;
        logger.info(`Lesson progress toggled to ${progress.completed ? 'complete' : 'incomplete'}`, {
            lessonId, courseId, userId: req.user._id, completed: progress.completed, requestId: req.id,
        });

        return res.status(200).json({ status: "success", data: progress });
    } catch (error) {
        if (error && error.isOperational) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        logger.error("Lesson completion error", { error: error?.message, lessonId: req.params.id, requestId: req.id });
        return res.status(500).json({ message: "Failed to update lesson progress" });
    }
};


// get overall course progress for the logged-in user, including percentage and completed lessons

const getCourseProgress = async (req, res) => {
    try {
        const courseId = req.params.id;

        const course = await Course.findById(courseId).populate({
            path: 'modules',
            populate: { path: 'lesson' }
        });

        if (!course) return res.status(404).json({ message: "Course not found" });

        const currentLessonIds = course.modules.flatMap((m) =>
            Array.isArray(m.lesson) ? m.lesson.map((l) => l._id) : []
        );
        const totalLessons = currentLessonIds.length;

        const completedDocs = totalLessons === 0
            ? []
            : await Progress.find({
                user: req.user._id,
                course: courseId,
                completed: true,
                lesson: { $in: currentLessonIds },
            });

        const completedCount = completedDocs.length;
        const percentage = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

        res.status(200).json({
            status: "success",
            percentage,
            completedCount,
            totalLessons,
            completedLessons: completedDocs.map(p => p.lesson)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { completeLesson, getCourseProgress };
