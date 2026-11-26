const mongoose = require("mongoose");
const crypto = require("crypto");
const GovernanceLock = require("../models/GovernanceLock");
const AppError = require("../utils/AppError");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Include all Mongoose operations in the callback (including helper queries) in the transaction.
mongoose.set("transactionAsyncLocalStorage", true);

/**
 * Serializes cross-document governance operations using a leased MongoDB lock document.
 */
const withGovernanceLock = async (key, fn, { leaseMs = 10000, timeoutMs = 5000 } = {}) => {
    const ownerToken = crypto.randomUUID();
    const deadline = Date.now() + timeoutMs;
    let acquired = false;

    while (Date.now() < deadline) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + leaseMs);

        const existing = await GovernanceLock.findOneAndUpdate(
            {
                _id: key,
                $or: [{ ownerToken: null }, { expiresAt: { $lte: now } }],
            },
            { $set: { ownerToken, expiresAt } },
            { returnDocument: "after" }
        );

        if (existing) {
            acquired = true;
            break;
        }

        try {
            await GovernanceLock.create({ _id: key, ownerToken, expiresAt });
            acquired = true;
            break;
        } catch (err) {
            if (err?.code !== 11000) {
                throw err;
            }
        }

        await sleep(15 + Math.floor(Math.random() * 25));
    }

    if (!acquired) {
        throw new AppError("Another privileged administrative change is in progress. Please retry.", 409);
    }

    const released = { ownerToken: null, expiresAt: new Date(0) };

    try {
        return await mongoose.connection.transaction(async () => {
            const result = await fn();
            // Fence the commit: a takeover conflicts with this write and an expired lease aborts all work.
            const fence = await GovernanceLock.updateOne(
                { _id: key, ownerToken, expiresAt: { $gt: new Date() } },
                { $set: released }
            );
            if (!fence.matchedCount) {
                throw new AppError("Governance lock expired before commit. Please retry.", 409);
            }
            return result;
        });
    } catch (error) {
        await GovernanceLock.updateOne(
            { _id: key, ownerToken },
            { $set: released }
        ).catch(() => {});
        throw error;
    }
};

/**
 * Shared serialization boundary for operations that can demote, suspend, delete a super_admin,
 * or transfer course ownership.
 */
const withSuperAdminLock = (fn, options) => withGovernanceLock("super_admin_mutation", fn, options);

module.exports = {
    withGovernanceLock,
    withSuperAdminLock,
};
