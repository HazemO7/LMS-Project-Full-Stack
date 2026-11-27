const Module = require("../models/Module");
const { withSuperAdminLock } = require("../services/governanceLockService");
const {
    isValidObjectId,
    parseIdList,
    executeModuleUpdate,
    executeModuleDelete,
} = require("../services/curriculumService");
const logger = require("../utils/logger");

// Create Module
const createModule = async (req, res) => {
    try {
        const { title, description, content, course, order } = req.body;
        const moduleDoc = await Module.create({
            title,
            description,
            content,
            course: course || null,
            order: order ?? 0,
        });

        logger.info("Module created successfully", { moduleId: moduleDoc._id, requestId: req.id });
        return res.status(201).json(moduleDoc);
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        logger.error("Create module error", { error: error.message, requestId: req.id });
        return res.status(500).json({ message: "Failed to create module" });
    }
};

// Get All Modules
const getModules = async (req, res) => {
    try {
        const modules = await Module.find();
        return res.status(200).json(modules);
    } catch (error) {
        logger.error("Get modules error", { error: error.message, requestId: req.id });
        return res.status(500).json({ message: "Failed to load modules" });
    }
};

// Get Module By ID
const getModuleById = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid module ID" });
        }
        const moduleDoc = await Module.findById(req.params.id);
        if (!moduleDoc) {
            return res.status(404).json({ message: "Module not found" });
        }
        return res.status(200).json(moduleDoc);
    } catch (error) {
        logger.error("Get module by ID error", { error: error.message, requestId: req.id });
        return res.status(500).json({ message: "Failed to load module" });
    }
};

const buildModuleUpdateFields = (body, uniqueLessonIds) => {
    const { title, description, content, order } = body;
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (content !== undefined) updateFields.content = content;
    if (order !== undefined) updateFields.order = order;
    if (uniqueLessonIds !== null) updateFields.lesson = uniqueLessonIds;
    return updateFields;
};

const handleModuleMutationError = (res, req, actionLabel, error) => {
    if (error && error.isOperational) {
        return res.status(error.statusCode).json({ message: error.message });
    }
    logger.error(`${actionLabel} error`, { error: error?.message, moduleId: req.params.id, requestId: req.id });
    return res.status(500).json({ message: `Failed to ${actionLabel.toLowerCase()}` });
};

const runModuleMutation = async (req, res, actionLabel, mutationFn, formatResponse) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid module ID" });
        }

        const outcome = await withSuperAdminLock(mutationFn);
        if (outcome.status !== 200) {
            return res.status(outcome.status).json(outcome.body);
        }

        logger.info(`Module ${actionLabel} succeeded`, { moduleId: req.params.id, requestId: req.id });
        return res.status(200).json(formatResponse(outcome));
    } catch (error) {
        return handleModuleMutationError(res, req, actionLabel, error);
    }
};

// Update Module
const updateModule = (req, res) => {
    const { error, uniqueIds } = parseIdList(
        req.body.lesson,
        "Lesson list must be an array of IDs",
        "Invalid lesson ID provided"
    );
    if (error) return res.status(error.status).json(error.body);

    const updateFields = buildModuleUpdateFields(req.body, uniqueIds);
    return runModuleMutation(
        req,
        res,
        "Update module",
        () => executeModuleUpdate(req, updateFields, uniqueIds),
        (outcome) => outcome.module
    );
};

// Delete Module
const deleteModule = (req, res) =>
    runModuleMutation(
        req,
        res,
        "Delete module",
        () => executeModuleDelete(req),
        () => ({ message: "Module deleted successfully" })
    );

module.exports = {
    createModule,
    getModules,
    getModuleById,
    updateModule,
    deleteModule,
};
