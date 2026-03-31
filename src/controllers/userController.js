const User = require('../models/User');
const bcrypt = require('bcrypt');

const getMe = async (req, res) => {
    try {
        res.status(200).json({ status: "success", data: req.user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateMe = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const updateData = {};

        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
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
        if (!['student', 'instructor', 'admin'].includes(role)) {
            return res.status(400).json({ message: "Invalid role specified" });
        }

        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ status: "success", data: user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getMe, updateMe, updateRole };
