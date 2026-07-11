const bcrypt = require('bcrypt');

/**
 * Validates a password against the security policy.
 * Policy:
 * - Minimum length: 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * @param {string} password 
 * @returns {boolean} true if valid, false otherwise
 */
const validatePasswordPolicy = (password) => {
    if (!password || password.length < 8) return false;
    
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasUppercase && hasLowercase && hasNumber && hasSpecial;
};

module.exports = {
    validatePasswordPolicy
};
