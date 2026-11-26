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
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        logger.error("Create lesson error", { error: error.message, requestId: req.id });
        res.status(500).json({ message: "Failed to create lesson" });
    }
};
// Get All Lessons
const getLessons = async (req, res) => {
    try {
        const lessons = await Lesson.find();
        res.status(200).json(lessons);
    } catch (error) {
        logger.error("Get lessons error", { error: error.message, requestId: req.id });
        res.status(500).json({ message: "Failed to load lessons" });
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
        logger.error("Get lesson by ID error", { error: error.message, requestId: req.id });
        res.status(500).json({ message: "Failed to load lesson" });
    }
};
// Update Lesson
const updateLesson = async (req, res) => {
    try {
        const existingLesson = req.lessonDoc || await Lesson.findById(req.params.id);
        if (!existingLesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        const { module, title, description, content, videoUrl, order } = req.body;
        if (module !== undefined) {
            const currentModuleId = existingLesson.module ? existingLesson.module.toString() : "";
            const requestedModuleId = module ? String(module) : "";
            if (requestedModuleId !== currentModuleId) {
                return res.status(400).json({ message: "Changing a lesson's parent module is not supported" });
            }
        }

        const updateFields = {};
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
        logger.error("Update lesson error", { error: error.message, lessonId: req.params.id, requestId: req.id });
        res.status(500).json({ message: "Failed to update lesson" });
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
        logger.error("Delete lesson error", { error: error.message, lessonId: req.params.id, requestId: req.id });
        res.status(500).json({ message: "Failed to delete lesson" });
    }
};

module.exports = {
    createLesson,
    getLessons,
    getLessonById,
    updateLesson,
    deleteLesson
};
