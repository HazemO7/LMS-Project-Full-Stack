const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Course = require("../models/Course");
const logger = require('../utils/logger');

// Create Module
const createModule = async (req, res) => {
    try {
        const { title, description, content, course, order } = req.body;
        const module = new Module({ title, description, content, course: course || null, order: order ?? 0 });
        await module.save();
        
        logger.info("Module created successfully", { moduleId: module._id, requestId: req.id });
        
        res.status(201).json(module);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// Get All Modules
const getModules = async (req, res) => {
    try {
        const modules = await Module.find();
        res.status(200).json(modules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Get Module By ID
const getModuleById = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id);
        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }
        res.status(200).json(module);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Module
const updateModule = async (req, res) => {
    try {
        const { title, description, content, lesson, order } = req.body;
        const updateFields = {};
        if (title !== undefined) updateFields.title = title;
        if (description !== undefined) updateFields.description = description;
        if (content !== undefined) updateFields.content = content;
        if (Array.isArray(lesson)) updateFields.lesson = lesson;
        if (order !== undefined) updateFields.order = order;

        const module = await Module.findByIdAndUpdate(req.params.id, updateFields, { new: true });
        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        if (Array.isArray(lesson) && lesson.length > 0) {
            await Lesson.updateMany(
                { _id: { $in: lesson } },
                { $set: { module: module._id } }
            );
        }
        
        logger.info("Module updated successfully", { moduleId: module._id, requestId: req.id });
        
        res.status(200).json(module);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// Delete Module
const deleteModule = async (req, res) => {
    try {
        const module = await Module.findByIdAndDelete(req.params.id);
        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        await Course.updateMany({ modules: module._id }, { $pull: { modules: module._id } });

        logger.info("Module deleted successfully", { moduleId: module._id, requestId: req.id });

        res.status(200).json({ message: 'Module deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createModule,
    getModules,
    getModuleById,
    updateModule,
    deleteModule,
};

