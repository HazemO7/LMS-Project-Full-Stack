const crypto = require('crypto');

/**
 * Generates a secure random reset token and its sha256 hash
 * @returns {Object} { plainToken, hashedToken }
 */
const generateResetToken = () => {
    const plainToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');
    
    return { plainToken, hashedToken };
};

/**
 * Hashes a given plain token for DB comparison
 * @param {string} plainToken 
 * @returns {string} hashedToken
 */
const hashToken = (plainToken) => {
    return crypto.createHash('sha256').update(plainToken).digest('hex');
};

/**
 * Verifies if the password was changed after the JWT was issued
 * @param {Date} passwordChangedAt 
 * @param {number} jwtTimestamp (iat)
 * @returns {boolean} true if changed after token issued
 */
const verifyPasswordChanged = (passwordChangedAt, jwtTimestamp) => {
    if (passwordChangedAt) {
        // passwordChangedAt is a Date object. Convert to seconds.
        const changedTimestamp = parseInt(passwordChangedAt.getTime() / 1000, 10);
        return jwtTimestamp < changedTimestamp;
    }
    return false; // Not changed
};

module.exports = {
    generateResetToken,
    hashToken,
    verifyPasswordChanged
};
