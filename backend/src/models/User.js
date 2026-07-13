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
        loginAttempts: {
            type: Number,
            default: 0,
        },
        lockUntil: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true });

userSchema.methods.isLocked = function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.resetLoginAttempts = function() {
    this.loginAttempts = 0;
    this.lockUntil = null;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
