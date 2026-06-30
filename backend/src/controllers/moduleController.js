const Module = require('../models/Module');

// Create Module
const createModule = async (req, res) => {
    try {
        const { title, description, content } = req.body;
        const module = new Module({ title, description, content });
        await module.save();
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
const Course = require("../models/Course");


// Update Module
const updateModule = async (req, res) => {
    try {
        const module = await Module.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }
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

