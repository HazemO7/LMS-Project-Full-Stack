const nodemailer = require('nodemailer');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const HTML_ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

const escapeHtml = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch]);

const createTransporter = () => {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !port || !user || !pass) {
        return null;
    }

    const portNum = Number(port);
    return nodemailer.createTransport({
        host,
        port: portNum,
        secure: portNum === 465, // Use implicit TLS on port 465
        requireTLS: portNum !== 465, // Require STARTTLS on non-465 ports
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
        // Fallback for local development when no SMTP credentials are provided
        logger.info(`MOCK EMAIL DISPATCHED (No SMTP credentials found) | To: ${email} | Link: ${resetUrl}`);
        return;
    }

    const safeResetUrl = escapeHtml(resetUrl);

    const mailOptions = {
        from: process.env.SMTP_FROM || '"LMS Support" <noreply@example.com>',
        to: email,
        subject: 'Your Password Reset Request',
        html: `
            <h1>Password Reset Request</h1>
            <p>You are receiving this email because you (or someone else) requested a password reset for your account.</p>
            <p>Please click on the following link, or paste it into your browser to complete the process:</p>
            <a href="${safeResetUrl}">${safeResetUrl}</a>
            <p>This reset link will expire in 15 minutes.</p>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`Password reset email successfully sent via SMTP to: ${email}`);
    } catch (error) {
        logger.error(`Failed to send email to ${email}`, { error: error.message });
        throw new AppError("Email service temporarily unavailable", 503);
    }
};

/**
 * Sends a staff onboarding welcome email with temporary credentials.
 */
const sendStaffOnboardingEmail = async ({ email, name, role, temporaryPassword, loginUrl }) => {
    const transporter = createTransporter();

    if (!transporter) {
        logger.info(
            `MOCK STAFF ONBOARDING EMAIL (No SMTP credentials found) | To: ${email} | Role: ${role} | Login: ${loginUrl}`
        );
        return { mocked: true };
    }

    const roleLabel =
        role === 'super_admin'
            ? 'Super Admin'
            : role === 'admin'
            ? 'Administrator'
            : role === 'instructor'
            ? 'Instructor'
            : 'Student';

    const safeName = escapeHtml(name);
    const safeRoleLabel = escapeHtml(roleLabel);
    const safeEmail = escapeHtml(email);
    const safeTempPassword = escapeHtml(temporaryPassword);
    const safeLoginUrl = escapeHtml(loginUrl);

    const mailOptions = {
        from: process.env.SMTP_FROM || '"Foundry LMS" <noreply@example.com>',
        to: email,
        subject: `Your Foundry LMS ${roleLabel} Account`,
        text: [
            `Welcome to Foundry LMS, ${name}`,
            `Role: ${roleLabel}`,
            `Sign-in Email: ${email}`,
            `Temporary Password: ${temporaryPassword}`,
            `For security, you will be required to change this temporary password immediately after your first sign-in.`,
            `Sign in: ${loginUrl}`,
        ].join('\n'),
        html: `
            <h1>Welcome to Foundry LMS, ${safeName}</h1>
            <p>An account has been created for you with the role: <strong>${safeRoleLabel}</strong>.</p>
            <p><strong>Sign-in Email:</strong> ${safeEmail}</p>
            <p><strong>Temporary Password:</strong></p>
            <pre style="display:inline-block;margin:0;padding:2px 6px;white-space:pre-wrap;font-family:monospace;">${safeTempPassword}</pre>
            <p>For security, you will be required to change this temporary password immediately after your first sign-in.</p>
            <p><a href="${safeLoginUrl}">Sign in to Foundry LMS</a></p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`Staff onboarding email successfully sent via SMTP to: ${email}`);
        return { mocked: false };
    } catch (error) {
        logger.error(`Failed to send staff onboarding email to ${email}`, { error: error.message });
        throw new AppError("Email service temporarily unavailable", 503);
    }
};

module.exports = {
    escapeHtml,
    sendPasswordResetEmail,
    sendStaffOnboardingEmail
};
