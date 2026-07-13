const rateLimit = require('express-rate-limit');

// Forgot Password: 5 requests per hour per IP
const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { msg: 'Too many password reset requests from this IP, please try again after an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Reset Password: 10 requests per hour per IP
const resetPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: { msg: 'Too many password reset attempts from this IP, please try again after an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Change Password: 5 requests per 15 minutes per IP
const changePasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: { msg: 'Too many password change attempts from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Login: 20 requests per 15 minutes per IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { message: 'Too many login attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    forgotPasswordLimiter,
    resetPasswordLimiter,
    changePasswordLimiter,
    loginLimiter
};
