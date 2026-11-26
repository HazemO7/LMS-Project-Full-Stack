const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        actor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        action: {
            type: String,
            required: true,
            enum: [
                "USER_CREATED",
                "ROLE_UPDATED",
                "USER_STATUS_CHANGED",
                "USER_UNLOCKED",
                "USER_DELETED",
                "COURSE_TRANSFERRED",
                "ENROLLMENT_ADDED",
                "ENROLLMENT_REMOVED",
                "SETTINGS_UPDATED",
            ],
        },
        targetType: {
            type: String,
            enum: ["User", "Course", "Enrollment", "PlatformSettings"],
            required: true,
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        ip: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;
