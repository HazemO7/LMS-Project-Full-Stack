const User = require('../models/User');
const bcrypt = require('bcrypt');
const { validatePasswordPolicy } = require('../utils/passwordUtils');
const { recordAudit } = require('../services/auditService');

const getMe = async (req, res) => {
    try {
        res.status(200).json({ status: "success", data: req.user });
    } catch (error) {
        res.status(500).json({ message: error.message });
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

        const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, { new: true }).select("-password");

        res.status(200).json({ status: "success", data: updatedUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateRole = async (req, res) => {
    try {
        const { role } = req.body;
        const allowedRoles = ['student', 'instructor', 'admin', 'super_admin'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role specified" });
        }

        const targetUser = await User.findById(req.params.id).select("-password");
        if (!targetUser) return res.status(404).json({ message: "User not found" });

        const callerRole = req.user.role;
        const targetCurrentRole = targetUser.role;

        if (callerRole === 'admin') {
            if (targetCurrentRole === 'admin' || targetCurrentRole === 'super_admin') {
                return res.status(403).json({ message: "Only a Super Admin can modify administrator roles." });
            }
            if (role === 'admin' || role === 'super_admin') {
                return res.status(403).json({ message: "Only a Super Admin can assign administrator roles." });
            }
        }

        if (targetCurrentRole === 'super_admin' && role !== 'super_admin') {
            const activeSuperAdmins = await User.countDocuments({ role: 'super_admin', isActive: { $ne: false } });
            if (activeSuperAdmins <= 1) {
                return res.status(400).json({ message: "Cannot demote the last active Super Admin." });
            }
        }

        const previousRole = targetUser.role;
        targetUser.role = role;
        await targetUser.save();

        await recordAudit({
            req,
            action: "ROLE_UPDATED",
            targetType: "User",
            targetId: targetUser._id,
            metadata: { email: targetUser.email, previousRole, newRole: role },
        });

        res.status(200).json({ status: "success", data: targetUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getMe, updateMe, updateRole };
