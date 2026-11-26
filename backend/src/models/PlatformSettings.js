const mongoose = require("mongoose");

const platformSettingsSchema = new mongoose.Schema(
    {
        singletonKey: {
            type: String,
            default: "default",
            unique: true,
        },
        allowPublicRegistration: {
            type: Boolean,
            default: true,
        },
        maxVideoSizeMB: {
            type: Number,
            default: 250,
            min: 10,
            max: 2048,
        },
        maxDocumentSizeMB: {
            type: Number,
            default: 25,
            min: 1,
            max: 250,
        },
        maxImageSizeMB: {
            type: Number,
            default: 10,
            min: 1,
            max: 50,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

/**
 * Returns the singleton platform settings document, creating it on first access.
 */
platformSettingsSchema.statics.getSingleton = async function () {
    return this.findOneAndUpdate(
        { singletonKey: "default" },
        { $setOnInsert: { singletonKey: "default" } },
        { returnDocument: "after", upsert: true }
    );
};

const PlatformSettings = mongoose.model("PlatformSettings", platformSettingsSchema);

module.exports = PlatformSettings;
