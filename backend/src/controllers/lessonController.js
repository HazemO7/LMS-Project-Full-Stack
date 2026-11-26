const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const logger = require('../utils/logger');

// Create Lesson
const createLesson = async (req, res) => {
    try {
        const { module, title, description, content, videoUrl, order } = req.body;

        const lesson = new Lesson({ module: module || null, title, description, content, videoUrl, order: order ?? 0 });
        await lesson.save();
        
        logger.info("Lesson created successfully", { lessonId: lesson._id, moduleId: module, requestId: req.id });

        res.status(201).json(lesson);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// Get All Lessons
const getLessons = async (req, res) => {
    try {
        const lessons = await Lesson.find();
        res.status(200).json(lessons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Get Lesson By ID
const getLessonById = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        res.status(200).json(lesson);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Update Lesson
const updateLesson = async (req, res) => {
    try {
        const { module, title, description, content, videoUrl, order } = req.body;
        const updateFields = {};
        if (module !== undefined) updateFields.module = module;
        if (title !== undefined) updateFields.title = title;
        if (description !== undefined) updateFields.description = description;
        if (content !== undefined) updateFields.content = content;
        if (videoUrl !== undefined) updateFields.videoUrl = videoUrl;
        if (order !== undefined) updateFields.order = order;

        const lesson = await Lesson.findByIdAndUpdate(req.params.id, updateFields, { new: true });
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        
        logger.info("Lesson updated successfully", { lessonId: lesson._id, requestId: req.id });

        res.status(200).json(lesson);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete Lesson
const deleteLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findByIdAndDelete(req.params.id);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        await Module.updateMany({ lesson: lesson._id }, { $pull: { lesson: lesson._id } });
        
        logger.info("Lesson deleted successfully", { lessonId: lesson._id, requestId: req.id });

        res.status(200).json({ message: 'Lesson deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createLesson,
    getLessons,
    getLessonById,
    updateLesson,
    deleteLesson
};
