const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const seedAdmin = async () => {
    try {
        // Check if there is at least one admin
        const adminExists = await User.findOne({ role: "admin" });
        if (adminExists) {
            console.log("Admin already exists.");
            return;
        }

        // Check if admin credentials are provided in env
        const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
        if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
            console.log("Admin credentials not found in environment variables. Skipping admin seed.");
            return;
        }

        // Check if a user with the admin email already exists (even if not admin)
        const emailExists = await User.findOne({ email: ADMIN_EMAIL });
        if (emailExists) {
            console.log("A user with the admin email already exists.");
            return;
        }

        // Hash the password using the same mechanism as registration
        const hashPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

        // Create the admin user
        await User.create({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: hashPassword,
            role: "admin",
        });

        console.log("Default admin created successfully.");
    } catch (error) {
        console.error("Error seeding default admin:", error);
    }
};

module.exports = seedAdmin;
