const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const seedAdmin = async () => {
    try {
        // Check if there is at least one super_admin
        const superAdminExists = await User.findOne({ role: "super_admin" });
        if (superAdminExists) {
            console.log("Super Admin already exists.");
            return;
        }

        // Check if admin credentials are provided in env
        const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
        if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
            console.log("Admin credentials not found in environment variables. Skipping super_admin seed.");
            return;
        }

        // Check if a user with the admin email already exists
        const existingByEmail = await User.findOne({ email: ADMIN_EMAIL });
        if (existingByEmail) {
            if (existingByEmail.role === "admin") {
                existingByEmail.role = "super_admin";
                existingByEmail.isActive = true;
                existingByEmail.mustChangePassword = false;
                await existingByEmail.save();
                console.log("Promoted existing owner admin account to super_admin.");
                return;
            }
            console.log("A user with the admin email already exists.");
            return;
        }

        // Hash the password using the same mechanism as registration
        const hashPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

        // Create the default super_admin user
        await User.create({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: hashPassword,
            role: "super_admin",
            isActive: true,
            mustChangePassword: false,
        });

        console.log("Default super_admin created successfully.");
    } catch (error) {
        console.error("Error seeding default super_admin:", error);
    }
};

module.exports = seedAdmin;
