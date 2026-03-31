const Progress = require('../models/Progress');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');


// when a student clicks "complete" on a lesson, we toggle their progress for that lesson
const completeLesson = async (req, res) => {
    try {
        const lessonId = req.params.id;
        const { courseId } = req.body;

        if (!courseId) return res.status(400).json({ message: "courseId is required in request body" });

        // Ensure student is truly enrolled
        const enrollment = await Enrollment.findOne({ user: req.user._id, course: courseId });
        if (!enrollment && req.user.role === 'student') {
            return res.status(403).json({ message: "You must be enrolled to complete lessons" });
        }

        let progress = await Progress.findOne({ user: req.user._id, lesson: lessonId });
        if (progress) {
            // Toggle completed status to switch between complete/incomplete
            progress.completed = !progress.completed;
            await progress.save();
        } else {
            progress = new Progress({
                user: req.user._id,
                course: courseId,
                lesson: lessonId,
                completed: true
            });
            await progress.save();
        }

        res.status(200).json({ 
            status: "success", data: progress 
        });
    } catch (error) {
        res.status(500).json({
             message: error.message
             });
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

        let totalLessons = 0;
        course.modules.forEach(m => {
            if (m.lesson) totalLessons += m.lesson.length;
        });

        const completedDocs = await Progress.find({ user: req.user._id, course: courseId, completed: true });

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
