const crypto = require('crypto');

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
const MAX_BCRYPT_BYTES = 72;

const validatePasswordPolicy = (password) => {
    if (typeof password !== 'string' || password.length < 8) return false;
    if (Buffer.byteLength(password, 'utf8') > MAX_BCRYPT_BYTES) return false;

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasUppercase && hasLowercase && hasNumber && hasSpecial;
};

/**
 * Generates a cryptographically random temporary password satisfying validatePasswordPolicy.
 * @param {number} length
 * @returns {string}
 */
const generateTemporaryPassword = (length = 12) => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const special = '!@#$%^&*';
    const all = upper + lower + digits + special;

    const pick = (chars) => chars[crypto.randomInt(0, chars.length)];
    const required = [pick(upper), pick(lower), pick(digits), pick(special)];
    const targetLength = Math.max(length, 10);

    for (let i = required.length; i < targetLength; i += 1) {
        required.push(pick(all));
    }

    // Fisher-Yates shuffle using crypto.randomInt
    for (let i = required.length - 1; i > 0; i -= 1) {
        const j = crypto.randomInt(0, i + 1);
        [required[i], required[j]] = [required[j], required[i]];
    }

    return required.join('');
};

module.exports = {
    validatePasswordPolicy,
    generateTemporaryPassword
};
