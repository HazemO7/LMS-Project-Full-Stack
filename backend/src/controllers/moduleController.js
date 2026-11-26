const mongoose = require("mongoose");
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Course = require("../models/Course");
const Progress = require("../models/Progress");
const { isAdminRole } = require("../middleware/authmiddleware");
const { resolveCourseFromModule } = require("../middleware/courseOwnershipGuard");
const { withGovernanceLock } = require("../services/governanceLockService");
const logger = require('../utils/logger');

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const isValidObjectId = (id) => typeof id === "string" && OBJECT_ID_REGEX.test(id);

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
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid module ID" });
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
                const idStr = typeof rawId === "string" ? rawId : null;
                if (!idStr || !isValidObjectId(idStr)) {
                    return res.status(400).json({ message: "Invalid lesson ID provided" });
                }
                const canonicalId = new mongoose.Types.ObjectId(idStr).toString();
                if (!seen.has(canonicalId)) {
                    seen.add(canonicalId);
                    uniqueLessonIds.push(canonicalId);
                }
            }
            updateFields.lesson = uniqueLessonIds;
        }

        const outcome = await withGovernanceLock("curriculum_mutation", async () => {
            const existingModule = await Module.findById(req.params.id);
            if (!existingModule) {
                return { status: 404, body: { message: 'Module not found' } };
            }

            const previousLessonIds = (existingModule.lesson || []).map((id) => id.toString());

            if (uniqueLessonIds !== null && uniqueLessonIds.length > 0) {
                const requestedLessons = await Lesson.find({ _id: { $in: uniqueLessonIds } }).select("_id module");
                if (requestedLessons.length !== uniqueLessonIds.length) {
                    return { status: 404, body: { message: "One or more lessons were not found" } };
                }

                const otherModules = await Module.find({
                    _id: { $ne: existingModule._id },
                    lesson: { $in: uniqueLessonIds },
                }).select("_id course lesson");

                if (!isAdminRole(req.user.role)) {
                    const existingLessonSet = new Set(previousLessonIds);
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
                            return {
                                status: 403,
                                body: { message: "Not authorized to attach lessons from another instructor's course" },
                            };
                        }

                        if (pointedModId && pointedModId !== existingModule._id.toString()) {
                            const sourceMod = await Module.findById(pointedModId).select("_id course");
                            if (!(await callerOwnsModuleDoc(sourceMod))) {
                                return {
                                    status: 403,
                                    body: { message: "Not authorized to attach lessons from another instructor's course" },
                                };
                            }
                        }

                        for (const holder of otherHolders) {
                            if (!(await callerOwnsModuleDoc(holder))) {
                                return {
                                    status: 403,
                                    body: { message: "Not authorized to attach lessons from another instructor's course" },
                                };
                            }
                        }
                    }
                }
            }

            const updatedModule = await Module.findByIdAndUpdate(
                req.params.id,
                updateFields,
                { returnDocument: "after" }
            );
            if (!updatedModule) {
                return { status: 404, body: { message: 'Module not found' } };
            }

            if (uniqueLessonIds !== null) {
                if (uniqueLessonIds.length > 0) {
                    await Lesson.updateMany(
                        { _id: { $in: uniqueLessonIds } },
                        { $set: { module: updatedModule._id } }
                    );
                }

                const newLessonSet = new Set(uniqueLessonIds);
                const removedLessonIds = previousLessonIds.filter((id) => !newLessonSet.has(id));
                if (removedLessonIds.length > 0) {
                    await Lesson.updateMany(
                        { _id: { $in: removedLessonIds }, module: existingModule._id },
                        { $set: { module: null } }
                    );
                }

                if (uniqueLessonIds.length > 0) {
                    await Module.updateMany(
                        { _id: { $ne: existingModule._id }, lesson: { $in: uniqueLessonIds } },
                        { $pull: { lesson: { $in: uniqueLessonIds } } }
                    );
                }
            }

            return { status: 200, module: updatedModule };
        });

        if (outcome.status !== 200) {
            return res.status(outcome.status).json(outcome.body);
        }

        logger.info("Module updated successfully", { moduleId: outcome.module._id, requestId: req.id });

        res.status(200).json(outcome.module);
    } catch (error) {
        if (error?.statusCode && error.isOperational) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        logger.error("Update module error", { error: error.message, moduleId: req.params.id, requestId: req.id });
        res.status(500).json({ message: "Failed to update module" });
    }
};
// Delete Module
const deleteModule = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid module ID" });
        }

        const outcome = await withGovernanceLock("curriculum_mutation", async () => {
            const module = await Module.findById(req.params.id);
            if (!module) {
                return { status: 404, body: { message: 'Module not found' } };
            }

            const lessonIds = Array.isArray(module.lesson) ? module.lesson : [];
            const membership = {
                $or: [
                    { module: module._id },
                    ...(lessonIds.length > 0 ? [{ _id: { $in: lessonIds }, module: null }] : []),
                ],
            };
            const lessonsToDelete = await Lesson.find(membership).select("_id");
            const deleteLessonIds = lessonsToDelete.map((l) => l._id);

            if (deleteLessonIds.length > 0) {
                await Progress.deleteMany({ lesson: { $in: deleteLessonIds } });
                await Lesson.deleteMany(membership);
            }

            await Course.updateMany({ modules: module._id }, { $pull: { modules: module._id } });
            await Module.findByIdAndDelete(module._id);

            return { status: 200, moduleId: module._id };
        });

        if (outcome.status !== 200) {
            return res.status(outcome.status).json(outcome.body);
        }

        logger.info("Module deleted successfully", { moduleId: outcome.moduleId, requestId: req.id });

        res.status(200).json({ message: 'Module deleted successfully' });
    } catch (error) {
        if (error?.statusCode && error.isOperational) {
            return res.status(error.statusCode).json({ message: error.message });
        }
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
