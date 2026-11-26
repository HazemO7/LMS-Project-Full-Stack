const User = require('../models/User');
const bcrypt = require('bcrypt');
const { validatePasswordPolicy } = require('../utils/passwordUtils');
const { updateUserRole } = require('./adminController');
const logger = require('../utils/logger');

const EMAIL_TAKEN_RESPONSE = { status: 400, body: { message: 'Account Already Exist' } };
const PASSWORD_POLICY_RESPONSE = {
    status: 400,
    body: {
        message: 'Password must be at least 8 characters long, include uppercase, lowercase, number, and a special character.',
    },
};

const getMe = async (req, res) => {
    try {
        res.status(200).json({ status: "success", data: req.user });
    } catch (error) {
        logger.error("Failed to fetch profile", { error: error.message, userId: req.user?._id, requestId: req.id });
        res.status(500).json({ message: "Failed to load profile" });
    }
};

const resolveUpdatedEmail = async (rawEmail, currentUser) => {
    const normalizedEmail = String(rawEmail).trim().toLowerCase();
    if (normalizedEmail === currentUser.email.toLowerCase()) {
        return { email: normalizedEmail };
    }
    const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: currentUser._id } });
    if (existing) {
        return { error: EMAIL_TAKEN_RESPONSE };
    }
    return { email: normalizedEmail };
};

const applyStaffFields = (body, currentUser, updateData) => {
    if (currentUser.role === 'student') return;
    if (body.specialty !== undefined) updateData.specialty = String(body.specialty).trim();
    if (body.bio !== undefined) updateData.bio = String(body.bio).trim();
};

const applyPasswordUpdate = async (password, updateData) => {
    if (!password) return null;
    if (!validatePasswordPolicy(password)) {
        return PASSWORD_POLICY_RESPONSE;
    }
    updateData.password = await bcrypt.hash(password, 10);
    updateData.mustChangePassword = false;
    updateData.passwordChangedAt = new Date(Date.now() - 1000);
    return null;
};

const buildProfileUpdateData = async (body, currentUser) => {
    const updateData = {};
    if (body.name !== undefined) updateData.name = String(body.name).trim();
    applyStaffFields(body, currentUser, updateData);

    if (body.email !== undefined) {
        const emailResult = await resolveUpdatedEmail(body.email, currentUser);
        if (emailResult.error) return { error: emailResult.error };
        updateData.email = emailResult.email;
    }

    const passwordErr = await applyPasswordUpdate(body.password, updateData);
    if (passwordErr) return { error: passwordErr };

    return { updateData };
};

const updateMe = async (req, res) => {
    try {
        const { error, updateData } = await buildProfileUpdateData(req.body, req.user);
        if (error) {
            return res.status(error.status).json(error.body);
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { returnDocument: "after" }
        ).select("-password");

        res.status(200).json({ status: "success", data: updatedUser });
    } catch (error) {
        logger.error("Failed to update profile", { error: error.message, userId: req.user?._id, requestId: req.id });
        res.status(500).json({ message: "Failed to update profile" });
    }
};

module.exports = { getMe, updateMe, updateRole: updateUserRole };
