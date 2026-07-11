const nodemailer = require('nodemailer');
const AppError = require('../utils/AppError');

const createTransporter = () => {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !port || !user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465, // Use secure=true only when port is 465
        auth: {
            user,
            pass
        }
    });
};

/**
 * Sends a password reset email
 * @param {string} email 
 * @param {string} resetUrl 
 */
const sendPasswordResetEmail = async (email, resetUrl) => {
    const transporter = createTransporter();

    if (!transporter) {
        throw new AppError("Email service temporarily unavailable", 503);
    }

    const mailOptions = {
        from: process.env.SMTP_FROM || '"LMS Support" <noreply@example.com>',
        to: email,
        subject: 'Your Password Reset Request',
        html: `
            <h1>Password Reset Request</h1>
            <p>You are receiving this email because you (or someone else) requested a password reset for your account.</p>
            <p>Please click on the following link, or paste it into your browser to complete the process:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>This reset link will expire in 15 minutes.</p>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        throw new AppError("Email service temporarily unavailable", 503);
    }
};

module.exports = {
    sendPasswordResetEmail
};
