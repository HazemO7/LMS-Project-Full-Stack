const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const Progress = require('../models/Progress');
const logger = require('../utils/logger');

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const isValidObjectId = (id) => typeof id === "string" && OBJECT_ID_REGEX.test(id);

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
            const currentModuleId = existingLesson.module || null;
            if (module === null || module === "") {
                if (currentModuleId !== null) {
                    return res.status(400).json({ message: "Changing a lesson's parent module is not supported" });
                }
            } else {
                if (!isValidObjectId(module)) {
                    return res.status(400).json({ message: "Invalid module ID" });
                }
                const requestedObjectId = new mongoose.Types.ObjectId(module);
                if (!currentModuleId || !requestedObjectId.equals(currentModuleId)) {
                    return res.status(400).json({ message: "Changing a lesson's parent module is not supported" });
                }
            }
        }

        const updateFields = {};
        if (title !== undefined) updateFields.title = title;
        if (description !== undefined) updateFields.description = description;
        if (content !== undefined) updateFields.content = content;
        if (videoUrl !== undefined) updateFields.videoUrl = videoUrl;
        if (order !== undefined) updateFields.order = order;

        const lesson = await Lesson.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { returnDocument: "after" }
        );
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
        const lesson = req.lessonDoc || await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        // Remove progress and module references before deleting the lesson so retries remain authorized and clean
        await Progress.deleteMany({ lesson: lesson._id });
        await Module.updateMany({ lesson: lesson._id }, { $pull: { lesson: lesson._id } });
        await Lesson.findByIdAndDelete(lesson._id);

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
