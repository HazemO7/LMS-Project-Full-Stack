const AuditLog = require("../models/AuditLog");
const logger = require("../utils/logger");

/**
 * Persists an administrative audit event and mirrors it to the application logger.
 */
const recordAudit = async ({ req, action, targetType, targetId = null, metadata = {} }) => {
    try {
        if (!req?.user?._id) return null;

        const entry = await AuditLog.create({
            actor: req.user._id,
            action,
            targetType,
            targetId,
            metadata,
            ip: req.ip || "",
        });

        logger.info(`Audit: ${action}`, {
            auditId: entry._id,
            actorId: req.user._id,
            targetType,
            targetId,
            requestId: req.id,
        });

        return entry;
    } catch (error) {
        logger.error("Failed to record audit log", {
            action,
            targetType,
            error: error.message,
        });
        return null;
    }
};

module.exports = { recordAudit };
