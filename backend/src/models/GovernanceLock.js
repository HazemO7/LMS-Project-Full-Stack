const mongoose = require("mongoose");

const governanceLockSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
            required: true,
        },
        ownerToken: {
            type: String,
            default: null,
        },
        expiresAt: {
            type: Date,
            default: () => new Date(0),
        },
    },
    { timestamps: true }
);

const GovernanceLock = mongoose.model("GovernanceLock", governanceLockSchema);

module.exports = GovernanceLock;
