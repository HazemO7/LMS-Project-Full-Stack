const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const Progress = require('../models/Progress');
const { withSuperAdminLock } = require("../services/governanceLockService");
const { resolveCourseFromLesson } = require("../middleware/courseOwnershipGuard");
const { isAdminRole } = require("../middleware/authmiddleware");
const logger = require('../utils/logger');

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const REPARENT_ERROR_MSG = "Changing a lesson's parent module is not supported";

const isValidObjectId = (id) => {
    if (typeof id !== "string") return false;
    return OBJECT_ID_REGEX.test(id);
};

// Create Lesson
const createLesson = async (req, res) => {
    try {
        const { module, title, description, content, videoUrl, order } = req.body;
        const lesson = new Lesson({
            module: module || null,
            title,
            description,
            content,
            videoUrl,
            order: order ?? 0,
        });
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

const isClearedModuleError = (requestedModule, currentModuleId) => {
    if (requestedModule === null) return currentModuleId !== null;
    if (requestedModule === "") return currentModuleId !== null;
    return false;
};

const validateLessonModuleUnchanged = (requestedModule, currentModuleId) => {
    if (requestedModule === undefined) return null;
    if (requestedModule === null || requestedModule === "") {
        return isClearedModuleError(requestedModule, currentModuleId) ? REPARENT_ERROR_MSG : null;
    }
    if (!isValidObjectId(requestedModule)) {
        return "Invalid module ID";
    }
    const requestedObjectId = new mongoose.Types.ObjectId(requestedModule);
    if (!currentModuleId) return REPARENT_ERROR_MSG;
    return requestedObjectId.equals(currentModuleId) ? null : REPARENT_ERROR_MSG;
};

const buildLessonUpdateFields = ({ title, description, content, videoUrl, order }) => {
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (content !== undefined) updateFields.content = content;
    if (videoUrl !== undefined) updateFields.videoUrl = videoUrl;
    if (order !== undefined) updateFields.order = order;
    return updateFields;
};

// Update Lesson
const updateLesson = async (req, res) => {
    try {
        const existingLesson = req.lessonDoc || await Lesson.findById(req.params.id);
        if (!existingLesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        const moduleError = validateLessonModuleUnchanged(req.body.module, existingLesson.module || null);
        if (moduleError) {
            return res.status(400).json({ message: moduleError });
        }

        const lesson = await Lesson.findByIdAndUpdate(
            req.params.id,
            buildLessonUpdateFields(req.body),
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

const assertCallerCanDeleteLesson = async (req, lesson) => {
    if (isAdminRole(req.user.role)) return true;
    const course = await resolveCourseFromLesson(lesson);
    if (!course) return false;
    return Boolean(course.instructor && course.instructor.equals(req.user._id));
};

const executeLessonDelete = async (req) => {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return { status: 404, message: 'Lesson not found' };

    const allowed = await assertCallerCanDeleteLesson(req, lesson);
    if (!allowed) {
        return { status: 403, message: "Not authorized to modify this course curriculum" };
    }

    await Progress.deleteMany({ lesson: lesson._id });
    await Module.updateMany({ lesson: lesson._id }, { $pull: { lesson: lesson._id } });
    await Lesson.findByIdAndDelete(lesson._id);
    return { status: 200 };
};

// Delete Lesson
const deleteLesson = async (req, res) => {
    try {
        const outcome = await withSuperAdminLock(() => executeLessonDelete(req));
        if (outcome.status !== 200) {
            return res.status(outcome.status).json({ message: outcome.message });
        }

        logger.info("Lesson deleted successfully", { lessonId: req.params.id, requestId: req.id });
        res.status(200).json({ message: 'Lesson deleted successfully' });
    } catch (error) {
        if (error.isOperational) return res.status(error.statusCode).json({ message: error.message });
        logger.error("Delete lesson error", { error: error.message, lessonId: req.params.id, requestId: req.id });
        res.status(500).json({ message: "Failed to delete lesson" });
    }
};

module.exports = {
    createLesson,
    getLessons,
    getLessonById,
    updateLesson,
    deleteLesson,
};
