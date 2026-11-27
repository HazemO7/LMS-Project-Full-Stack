const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const Progress = require('../models/Progress');
const { withSuperAdminLock } = require("../services/governanceLockService");
const { resolveCourseFromModule, resolveCourseFromLesson } = require("../middleware/courseOwnershipGuard");
const { isAdminRole } = require("../middleware/authmiddleware");
const logger = require('../utils/logger');

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const REPARENT_ERROR_MSG = "Changing a lesson's parent module is not supported";
const UNAUTHORIZED_MSG = "Not authorized to modify this course curriculum";

const isValidObjectId = (id) => {
    if (typeof id !== "string") return false;
    return OBJECT_ID_REGEX.test(id);
};

const isOwnedCourse = (course, userId) =>
    Boolean(course && course.instructor && course.instructor.equals(userId));

const verifyModuleCourseOwnership = async (mod, user) => {
    if (isAdminRole(user.role)) return null;
    const course = await resolveCourseFromModule(mod);
    return isOwnedCourse(course, user._id) ? null : { status: 403, message: UNAUTHORIZED_MSG };
};

const authorizeLessonParentModule = async (moduleId, user) => {
    if (!moduleId) {
        return isAdminRole(user.role) ? null : { status: 403, message: UNAUTHORIZED_MSG };
    }
    if (!isValidObjectId(moduleId)) return { status: 400, message: "Invalid module ID" };

    const mod = await Module.findById(moduleId);
    if (!mod) return { status: 404, message: "Module not found" };
    return verifyModuleCourseOwnership(mod, user);
};

const handleLessonMutationError = (res, req, actionLabel, error) => {
    if (error && error.name === "ValidationError") {
        return res.status(400).json({ message: error.message });
    }
    if (error && error.isOperational) {
        return res.status(error.statusCode).json({ message: error.message });
    }
    logger.error(`${actionLabel} error`, { error: error?.message, lessonId: req.params.id, requestId: req.id });
    return res.status(500).json({ message: `Failed to ${actionLabel.toLowerCase()}` });
};

const executeLessonCreate = async (req) => {
    const { module, title, description, content, videoUrl, order } = req.body;
    const authErr = await authorizeLessonParentModule(module, req.user);
    if (authErr) return authErr;

    const lesson = await Lesson.create({
        module: module || null,
        title,
        description,
        content,
        videoUrl,
        order: order ?? 0,
    });
    return { status: 201, lesson };
};

// Create Lesson
const createLesson = async (req, res) => {
    try {
        const outcome = await withSuperAdminLock(() => executeLessonCreate(req));
        if (outcome.status !== 201) {
            return res.status(outcome.status).json({ message: outcome.message });
        }

        logger.info("Lesson created successfully", {
            lessonId: outcome.lesson._id,
            moduleId: req.body.module,
            requestId: req.id,
        });
        return res.status(201).json(outcome.lesson);
    } catch (error) {
        return handleLessonMutationError(res, req, "Create lesson", error);
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

const assertCallerCanMutateLesson = async (req, lesson) => {
    if (isAdminRole(req.user.role)) return true;
    const course = await resolveCourseFromLesson(lesson);
    return isOwnedCourse(course, req.user._id);
};

const executeLessonUpdate = async (req) => {
    const existingLesson = await Lesson.findById(req.params.id);
    if (!existingLesson) return { status: 404, message: 'Lesson not found' };

    const allowed = await assertCallerCanMutateLesson(req, existingLesson);
    if (!allowed) return { status: 403, message: UNAUTHORIZED_MSG };

    const moduleError = validateLessonModuleUnchanged(req.body.module, existingLesson.module || null);
    if (moduleError) return { status: 400, message: moduleError };

    const lesson = await Lesson.findByIdAndUpdate(
        req.params.id,
        buildLessonUpdateFields(req.body),
        { returnDocument: "after" }
    );
    if (!lesson) return { status: 404, message: 'Lesson not found' };
    return { status: 200, lesson };
};

// Update Lesson
const updateLesson = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid lesson ID" });
        }

        const outcome = await withSuperAdminLock(() => executeLessonUpdate(req));
        if (outcome.status !== 200) {
            return res.status(outcome.status).json({ message: outcome.message });
        }

        logger.info("Lesson updated successfully", { lessonId: outcome.lesson._id, requestId: req.id });
        return res.status(200).json(outcome.lesson);
    } catch (error) {
        return handleLessonMutationError(res, req, "Update lesson", error);
    }
};

const executeLessonDelete = async (req) => {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return { status: 404, message: 'Lesson not found' };

    const allowed = await assertCallerCanMutateLesson(req, lesson);
    if (!allowed) {
        return { status: 403, message: UNAUTHORIZED_MSG };
    }

    await Progress.deleteMany({ lesson: lesson._id });
    await Module.updateMany({ lesson: lesson._id }, { $pull: { lesson: lesson._id } });
    await Lesson.findByIdAndDelete(lesson._id);
    return { status: 200 };
};

// Delete Lesson
const deleteLesson = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid lesson ID" });
        }

        const outcome = await withSuperAdminLock(() => executeLessonDelete(req));
        if (outcome.status !== 200) {
            return res.status(outcome.status).json({ message: outcome.message });
        }

        logger.info("Lesson deleted successfully", { lessonId: req.params.id, requestId: req.id });
        return res.status(200).json({ message: 'Lesson deleted successfully' });
    } catch (error) {
        return handleLessonMutationError(res, req, "Delete lesson", error);
    }
};

module.exports = {
    createLesson,
    getLessons,
    getLessonById,
    updateLesson,
    deleteLesson,
};
