const User = require('../models/User');
const bcrypt = require('bcrypt');
const { validatePasswordPolicy } = require('../utils/passwordUtils');
const { updateUserRole } = require('./adminController');
const logger = require('../utils/logger');

const getMe = async (req, res) => {
    try {
        res.status(200).json({ status: "success", data: req.user });
    } catch (error) {
        logger.error("Failed to fetch profile", { error: error.message, userId: req.user?._id, requestId: req.id });
        res.status(500).json({ message: "Failed to load profile" });
    }
};

const updateMe = async (req, res) => {
    try {
        const { name, email, password, specialty, bio } = req.body;
        const updateData = {};

        if (name !== undefined) updateData.name = String(name).trim();
        if (email !== undefined) {
            const normalizedEmail = String(email).trim().toLowerCase();
            if (normalizedEmail !== req.user.email.toLowerCase()) {
                const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: req.user._id } });
                if (existing) {
                    return res.status(400).json({ message: "Account Already Exist" });
                }
            }
            updateData.email = normalizedEmail;
        }
        if (specialty !== undefined && req.user.role !== 'student') {
            updateData.specialty = String(specialty).trim();
        }
        if (bio !== undefined && req.user.role !== 'student') {
            updateData.bio = String(bio).trim();
        }
        if (password) {
            if (!validatePasswordPolicy(password)) {
                return res.status(400).json({
                    message: 'Password must be at least 8 characters long, include uppercase, lowercase, number, and a special character.'
                });
            }
            updateData.password = await bcrypt.hash(password, 10);
            updateData.mustChangePassword = false;
            updateData.passwordChangedAt = new Date(Date.now() - 1000);
        }

        const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, { returnDocument: "after" }).select("-password");

        res.status(200).json({ status: "success", data: updatedUser });
    } catch (error) {
        logger.error("Failed to update profile", { error: error.message, userId: req.user?._id, requestId: req.id });
        res.status(500).json({ message: "Failed to update profile" });
    }
};

module.exports = { getMe, updateMe, updateRole: updateUserRole };
