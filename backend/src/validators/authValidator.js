const Joi = require('joi');
const { validatePasswordPolicy } = require('../utils/passwordUtils');

// Custom Joi validation using the password policy utility
const passwordMethod = (value, helpers) => {
    if (!validatePasswordPolicy(value)) {
        return helpers.message('Password must be at least 8 characters long, include uppercase, lowercase, number, and a special character.');
    }
    return value;
};

const registerSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().custom(passwordMethod).required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
    password: Joi.string().custom(passwordMethod).required()
});

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().custom(passwordMethod).required()
});

const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            return res.status(400).json({
                msg: error.details.map((err) => err.message).join(', '),
            });
        }
        
        req.body = value;
        next();
    };
};

module.exports = {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    validateRequest
};
