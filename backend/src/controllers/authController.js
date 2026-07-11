const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const { generateResetToken, hashToken } = require("../services/authService");
const { sendPasswordResetEmail } = require("../services/emailService");

// The validation for these is now handled by middleware in authRouters.js
// so we don't need to manually call Joi here for register and login if we update the routes.
// However, to keep existing logic working without breaking things unexpectedly, 
// let's assume validation happens in middleware. But the old code did manual validation.
// I will move validation to routes for the new endpoints, and keep manual for old if necessary,
// OR just update all to use middleware. The plan says "Use Joi validation middleware."

const register = catchAsync(async (req, res, next) => {
    // get Data (assuming validation middleware passed and attached req.body)
    const { name, email, password } = req.body;
    
    const existUser = await User.findOne({ email });
    if (existUser) {
        return next(new AppError("Account Already Exist", 400));
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        name,
        email,
        password: hashPassword,
        role: 'student',
    });

    res.status(201).json({
        msg: "Done Created User",
        data: user,
    });
});

const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return next(new AppError("Your Account Not Found Please Create Account", 404));
    }

    const matchPassword = await bcrypt.compare(password, user.password);
    if (!matchPassword) {
        return next(new AppError("Invalid Password", 400));
    }

    if (!process.env.JWT_SECRET) {
        return next(new AppError("JWT_SECRET is not configured on the server", 500));
    }

    const token = jwt.sign(
        {
            id: user._id,
            role: user.role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d",
        }
    );

    res.status(200).json({
        msg: "Success Login",
        token,
    });
});

const logout = catchAsync(async (req, res, next) => {
    res.status(200).json({
        msg: "Success Logout",
    });
});

// POST /api/auth/forgot-password
const forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    
    // Generic response regardless of whether user exists
    const successMessage = "If an account exists, a password reset email has been sent.";

    if (!user) {
        return res.status(200).json({ message: successMessage });
    }

    const { plainToken, hashedToken } = generateResetToken();

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    user.resetPasswordTokenCreatedAt = Date.now();
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password/${plainToken}`;

    try {
        await sendPasswordResetEmail(user.email, resetUrl);
        res.status(200).json({ message: successMessage });
    } catch (error) {
        // Clear token if email fails
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        user.resetPasswordTokenCreatedAt = undefined;
        await user.save();

        return next(new AppError("Email service temporarily unavailable", 503));
    }
});

// PUT /api/auth/reset-password/:token
const resetPassword = catchAsync(async (req, res, next) => {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = hashToken(token);

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return next(new AppError("Invalid or expired reset token.", 400));
    }

    const hash = await bcrypt.hash(password, 10);
    user.password = hash;
    user.passwordChangedAt = new Date(Date.now() - 1000); // Backdate 1s to avoid race conditions with JWT iat
    
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.resetPasswordTokenCreatedAt = undefined;
    
    await user.save();

    res.status(200).json({ message: "Password reset successfully." });
});


// PUT /api/auth/change-password
const changePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    
    // User is attached by protect middleware
    const user = await User.findById(req.user.id);
    
    if (!user) {
        return next(new AppError("User not found.", 404));
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        return next(new AppError("Incorrect current password.", 401));
    }

    const samePassword = await bcrypt.compare(newPassword, user.password);
    if (samePassword) {
        return next(new AppError("New password cannot be the same as the current password.", 400));
    }

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    user.passwordChangedAt = new Date(Date.now() - 1000);
    await user.save();

    res.status(200).json({ message: "Password changed successfully." });
});

module.exports = {
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
};
