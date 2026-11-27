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

const buildTokenVersionFilter = (userId, expectedVersion) => {
    const versionMatch = expectedVersion === 0
        ? { $or: [{ tokenVersion: 0 }, { tokenVersion: { $exists: false } }] }
        : { tokenVersion: expectedVersion };
    return { _id: userId, ...versionMatch };
};

const replaceUserPassword = async ({ User, user, newPasswordHash, extraFilter = {}, clearReset = false }) => {
    const filter = { ...buildTokenVersionFilter(user._id, user.tokenVersion ?? 0), ...extraFilter };
    const update = {
        $set: {
            password: newPasswordHash,
            passwordChangedAt: new Date(),
            mustChangePassword: false,
        },
        $inc: { tokenVersion: 1 },
    };
    if (clearReset) {
        update.$unset = {
            resetPasswordToken: 1,
            resetPasswordExpire: 1,
            resetPasswordTokenCreatedAt: 1,
        };
    }
    return User.findOneAndUpdate(filter, update, { returnDocument: 'after' });
};

module.exports = {
    generateResetToken,
    hashToken,
    verifyPasswordChanged,
    buildTokenVersionFilter,
    replaceUserPassword,
};
