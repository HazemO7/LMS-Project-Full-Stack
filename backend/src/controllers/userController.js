const User = require('../models/User');
const bcrypt = require('bcrypt');
const { validatePasswordPolicy } = require('../utils/passwordUtils');
const { USER_SAFE_PROJECTION, sanitizeUser } = require('../services/adminGovernanceHelper');
const { updateUserRole } = require('./adminController');
const logger = require('../utils/logger');

const EMAIL_TAKEN_RESPONSE = { status: 400, body: { message: 'Account Already Exist' } };
const PASSWORD_POLICY_RESPONSE = {
    status: 400,
    body: {
        message: 'Password must be at least 8 characters long, include uppercase, lowercase, number, and a special character.',
    },
};
const CURRENT_PASSWORD_REQUIRED_RESPONSE = {
    status: 400,
    body: { message: 'Current password is required to set a new password.' },
};
const INCORRECT_CURRENT_PASSWORD_RESPONSE = {
    status: 401,
    body: { message: 'Incorrect current password.' },
};
const SAME_PASSWORD_RESPONSE = {
    status: 400,
    body: { message: 'New password cannot be the same as the current password.' },
};
const PROFILE_FIELD_REQUIRED_RESPONSE = {
    status: 400,
    body: { message: 'Name and email are required.' },
};
const CONCURRENT_PASSWORD_RESPONSE = {
    status: 409,
    body: { message: 'Password was changed concurrently. Please retry.' },
};

const getMe = async (req, res) => {
    try {
        res.status(200).json({ status: "success", data: sanitizeUser(req.user) });
    } catch (error) {
        logger.error("Failed to fetch profile", { error: error.message, userId: req.user?._id, requestId: req.id });
        res.status(500).json({ message: "Failed to load profile" });
    }
};

const resolveUpdatedEmail = async (rawEmail, currentUser) => {
    const normalizedEmail = String(rawEmail).trim().toLowerCase();
    if (!normalizedEmail) return { error: PROFILE_FIELD_REQUIRED_RESPONSE };
    if (normalizedEmail === currentUser.email) {
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

const validatePasswordChangeInputs = (body) => {
    if (!body.currentPassword || typeof body.currentPassword !== 'string') {
        return CURRENT_PASSWORD_REQUIRED_RESPONSE;
    }
    if (typeof body.password !== 'string' || !validatePasswordPolicy(body.password)) {
        return PASSWORD_POLICY_RESPONSE;
    }
    return null;
};

const verifyAndBuildPasswordFields = async (userId, currentPassword, newPassword) => {
    const userDoc = await User.findById(userId).select('password tokenVersion');
    if (!userDoc) return { error: { status: 404, body: { message: 'User not found' } } };

    if (!(await bcrypt.compare(currentPassword, userDoc.password))) {
        return { error: INCORRECT_CURRENT_PASSWORD_RESPONSE };
    }
    if (await bcrypt.compare(newPassword, userDoc.password)) {
        return { error: SAME_PASSWORD_RESPONSE };
    }
    return {
        expectedTokenVersion: userDoc.tokenVersion ?? 0,
        fields: {
            password: await bcrypt.hash(newPassword, 10),
            mustChangePassword: false,
            passwordChangedAt: new Date(),
        },
    };
};

const resolvePasswordUpdate = async (body, userId) => {
    if (body.password === undefined) return { fields: {} };
    const inputErr = validatePasswordChangeInputs(body);
    if (inputErr) return { error: inputErr };
    return verifyAndBuildPasswordFields(userId, body.currentPassword, body.password);
};

const applyNameUpdate = (rawName, updateData) => {
    if (rawName === undefined) return null;
    const name = String(rawName).trim();
    if (!name) return PROFILE_FIELD_REQUIRED_RESPONSE;
    updateData.name = name;
    return null;
};

const buildProfileUpdateData = async (body, currentUser) => {
    const updateData = {};
    const nameErr = applyNameUpdate(body.name, updateData);
    if (nameErr) return { error: nameErr };
    applyStaffFields(body, currentUser, updateData);

    if (body.email !== undefined) {
        const emailResult = await resolveUpdatedEmail(body.email, currentUser);
        if (emailResult.error) return { error: emailResult.error };
        updateData.email = emailResult.email;
    }

    const passwordResult = await resolvePasswordUpdate(body, currentUser._id);
    if (passwordResult.error) return { error: passwordResult.error };

    return {
        expectedTokenVersion: passwordResult.expectedTokenVersion,
        updateData: { ...updateData, ...passwordResult.fields },
    };
};

const persistProfileUpdate = (userId, updateData, expectedTokenVersion) => {
    if (expectedTokenVersion === undefined) {
        return User.findByIdAndUpdate(userId, updateData, { returnDocument: "after" }).select(USER_SAFE_PROJECTION);
    }
    return User.findOneAndUpdate(
        { _id: userId, tokenVersion: expectedTokenVersion },
        { $set: updateData, $inc: { tokenVersion: 1 } },
        { returnDocument: "after" }
    ).select(USER_SAFE_PROJECTION);
};

const updateMe = async (req, res) => {
    try {
        const { error, updateData, expectedTokenVersion } = await buildProfileUpdateData(req.body, req.user);
        if (error) {
            return res.status(error.status).json(error.body);
        }

        const updatedUser = await persistProfileUpdate(req.user._id, updateData, expectedTokenVersion);
        if (!updatedUser) {
            return res.status(CONCURRENT_PASSWORD_RESPONSE.status).json(CONCURRENT_PASSWORD_RESPONSE.body);
        }

        return res.status(200).json({ status: "success", data: updatedUser });
    } catch (error) {
        logger.error("Failed to update profile", { error: error.message, userId: req.user?._id, requestId: req.id });
        return res.status(500).json({ message: "Failed to update profile" });
    }
};

module.exports = { getMe, updateMe, updateRole: updateUserRole };
