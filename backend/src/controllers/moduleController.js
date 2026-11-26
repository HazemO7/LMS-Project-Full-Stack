const mongoose = require("mongoose");
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Course = require("../models/Course");
const { isAdminRole } = require("../middleware/authmiddleware");
const { resolveCourseFromModule } = require("../middleware/courseOwnershipGuard");
const logger = require('../utils/logger');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create Module
const createModule = async (req, res) => {
    try {
        const { title, description, content, course, order } = req.body;
        const module = new Module({ title, description, content, course: course || null, order: order ?? 0 });
        await module.save();

        logger.info("Module created successfully", { moduleId: module._id, requestId: req.id });

        res.status(201).json(module);
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        logger.error("Create module error", { error: error.message, requestId: req.id });
        res.status(500).json({ message: "Failed to create module" });
    }
};
// Get All Modules
const getModules = async (req, res) => {
    try {
        const modules = await Module.find();
        res.status(200).json(modules);
    } catch (error) {
        logger.error("Get modules error", { error: error.message, requestId: req.id });
        res.status(500).json({ message: "Failed to load modules" });
    }
};
// Get Module By ID
const getModuleById = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid module ID" });
        }
        const module = await Module.findById(req.params.id);
        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }
        res.status(200).json(module);
    } catch (error) {
        logger.error("Get module by ID error", { error: error.message, requestId: req.id });
        res.status(500).json({ message: "Failed to load module" });
    }
};

// Update Module
const updateModule = async (req, res) => {
    try {
        const existingModule = req.moduleDoc || await Module.findById(req.params.id);
        if (!existingModule) {
            return res.status(404).json({ message: 'Module not found' });
        }

        const { title, description, content, lesson, order } = req.body;
        const updateFields = {};
        if (title !== undefined) updateFields.title = title;
        if (description !== undefined) updateFields.description = description;
        if (content !== undefined) updateFields.content = content;
        if (order !== undefined) updateFields.order = order;

        let uniqueLessonIds = null;
        if (lesson !== undefined) {
            if (!Array.isArray(lesson)) {
                return res.status(400).json({ message: "Lesson list must be an array of IDs" });
            }

            uniqueLessonIds = [];
            const seen = new Set();
            for (const rawId of lesson) {
                const idStr = String(rawId);
                if (!isValidObjectId(idStr)) {
                    return res.status(400).json({ message: "Invalid lesson ID provided" });
                }
                if (!seen.has(idStr)) {
                    seen.add(idStr);
                    uniqueLessonIds.push(idStr);
                }
            }

            if (uniqueLessonIds.length > 0) {
                const requestedLessons = await Lesson.find({ _id: { $in: uniqueLessonIds } }).select("_id module");
                if (requestedLessons.length !== uniqueLessonIds.length) {
                    return res.status(404).json({ message: "One or more lessons were not found" });
                }

                const otherModules = await Module.find({
                    _id: { $ne: existingModule._id },
                    lesson: { $in: uniqueLessonIds },
                }).select("_id course lesson");

                if (!isAdminRole(req.user.role)) {
                    const existingLessonSet = new Set((existingModule.lesson || []).map((id) => id.toString()));
                    const otherModuleMap = new Map();
                    for (const mod of otherModules) {
                        for (const lid of mod.lesson || []) {
                            const key = lid.toString();
                            if (!otherModuleMap.has(key)) otherModuleMap.set(key, []);
                            otherModuleMap.get(key).push(mod);
                        }
                    }

                    const resolvedCourseCache = new Map();
                    const callerOwnsModuleDoc = async (modDoc) => {
                        if (!modDoc) return false;
                        const modKey = modDoc._id.toString();
                        if (!resolvedCourseCache.has(modKey)) {
                            const resolved = await resolveCourseFromModule(modDoc);
                            resolvedCourseCache.set(modKey, resolved);
                        }
                        const course = resolvedCourseCache.get(modKey);
                        return Boolean(
                            course &&
                            course.instructor &&
                            course.instructor.toString() === req.user._id.toString()
                        );
                    };

                    for (const les of requestedLessons) {
                        const lesIdStr = les._id.toString();
                        const otherHolders = otherModuleMap.get(lesIdStr) || [];
                        const pointedModId = les.module ? les.module.toString() : null;

                        if (pointedModId === existingModule._id.toString() && otherHolders.length === 0) {
                            continue;
                        }
                        if (!pointedModId && existingLessonSet.has(lesIdStr) && otherHolders.length === 0) {
                            continue;
                        }

                        if (!pointedModId && otherHolders.length === 0) {
                            return res.status(403).json({
                                message: "Not authorized to attach lessons from another instructor's course",
                            });
                        }

                        if (pointedModId && pointedModId !== existingModule._id.toString()) {
                            const sourceMod = await Module.findById(pointedModId).select("_id course");
                            if (!(await callerOwnsModuleDoc(sourceMod))) {
                                return res.status(403).json({
                                    message: "Not authorized to attach lessons from another instructor's course",
                                });
                            }
                        }

                        for (const holder of otherHolders) {
                            if (!(await callerOwnsModuleDoc(holder))) {
                                return res.status(403).json({
                                    message: "Not authorized to attach lessons from another instructor's course",
                                });
                            }
                        }
                    }
                }
            }

            updateFields.lesson = uniqueLessonIds;
        }

        if (uniqueLessonIds && uniqueLessonIds.length > 0) {
            await Module.updateMany(
                { _id: { $ne: existingModule._id }, lesson: { $in: uniqueLessonIds } },
                { $pull: { lesson: { $in: uniqueLessonIds } } }
            );
        }

        const module = await Module.findByIdAndUpdate(req.params.id, updateFields, { new: true });
        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        if (uniqueLessonIds && uniqueLessonIds.length > 0) {
            await Lesson.updateMany(
                { _id: { $in: uniqueLessonIds } },
                { $set: { module: module._id } }
            );
        }

        logger.info("Module updated successfully", { moduleId: module._id, requestId: req.id });

        res.status(200).json(module);
    } catch (error) {
        logger.error("Update module error", { error: error.message, moduleId: req.params.id, requestId: req.id });
        res.status(500).json({ message: "Failed to update module" });
    }
};
// Delete Module
const deleteModule = async (req, res) => {
    try {
        const module = req.moduleDoc || await Module.findById(req.params.id);
        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        const lessonIds = Array.isArray(module.lesson) ? module.lesson : [];
        await Lesson.deleteMany({
            $or: [
                { module: module._id },
                ...(lessonIds.length > 0 ? [{ _id: { $in: lessonIds } }] : []),
            ],
        });

        await Course.updateMany({ modules: module._id }, { $pull: { modules: module._id } });
        await Module.findByIdAndDelete(module._id);

        logger.info("Module deleted successfully", { moduleId: module._id, requestId: req.id });

        res.status(200).json({ message: 'Module deleted successfully' });
    } catch (error) {
        logger.error("Delete module error", { error: error.message, moduleId: req.params.id, requestId: req.id });
        res.status(500).json({ message: "Failed to delete module" });
    }
};

module.exports = {
    createModule,
    getModules,
    getModuleById,
    updateModule,
    deleteModule,
};
