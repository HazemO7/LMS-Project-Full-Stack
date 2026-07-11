const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["admin", "instructor", "student"],
            default: "student",
        },
        resetPasswordToken: {
            type: String,
        },
        resetPasswordExpire: {
            type: Date,
        },
        resetPasswordTokenCreatedAt: {
            type: Date,
        },
        passwordChangedAt: {
            type: Date,
        },
    },
    { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;
