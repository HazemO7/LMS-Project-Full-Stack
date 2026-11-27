const Joi = require("joi");
const { validatePasswordPolicy } = require("../utils/passwordUtils");

const optionalPasswordMethod = (value, helpers) => {
    if (!value) return value;
    if (Buffer.byteLength(value, "utf8") > 72) {
        return helpers.message("Password must not exceed 72 bytes.");
    }
    if (!validatePasswordPolicy(value)) {
        return helpers.message(
            "Password must be at least 8 characters long, include uppercase, lowercase, number, and a special character."
        );
    }
    return value;
};

const createStaffUserSchema = Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email: Joi.string().trim().email().required(),
    role: Joi.string().valid("student", "instructor", "admin", "super_admin").default("instructor"),
    temporaryPassword: Joi.string().allow("").custom(optionalPasswordMethod).optional(),
    specialty: Joi.string().trim().max(120).allow("").optional(),
    bio: Joi.string().trim().max(1000).allow("").optional(),
    sendEmail: Joi.boolean().default(true),
});

const updateUserRoleSchema = Joi.object({
    role: Joi.string().valid("student", "instructor", "admin", "super_admin").required(),
});

const updateUserStatusSchema = Joi.object({
    isActive: Joi.boolean().optional(),
    unlock: Joi.boolean().optional(),
}).or("isActive", "unlock");

const transferCourseSchema = Joi.object({
    newInstructorId: Joi.string().hex().length(24).required(),
});

const manualEnrollSchema = Joi.object({
    email: Joi.string().trim().email().optional(),
    userId: Joi.string().hex().length(24).optional(),
}).or("email", "userId");

const updatePlatformSettingsSchema = Joi.object({
    allowPublicRegistration: Joi.boolean().optional(),
    maxVideoSizeMB: Joi.number().integer().min(10).max(2048).optional(),
    maxDocumentSizeMB: Joi.number().integer().min(1).max(250).optional(),
    maxImageSizeMB: Joi.number().integer().min(1).max(50).optional(),
}).min(1);

module.exports = {
    createStaffUserSchema,
    updateUserRoleSchema,
    updateUserStatusSchema,
    transferCourseSchema,
    manualEnrollSchema,
    updatePlatformSettingsSchema,
};
