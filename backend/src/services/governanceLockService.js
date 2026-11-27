const { AsyncLocalStorage } = require("async_hooks");
const mongoose = require("mongoose");
const crypto = require("crypto");
const GovernanceLock = require("../models/GovernanceLock");
const AppError = require("../utils/AppError");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const postCommitStorage = new AsyncLocalStorage();

// Include all Mongoose operations in the callback (including helper queries) in the transaction.
mongoose.set("transactionAsyncLocalStorage", true);

const afterTransactionCommit = (fn) => {
    const queue = postCommitStorage.getStore();
    if (queue) {
        queue.push(fn);
        return;
    }
    fn();
};

const createLockDocument = async (key, ownerToken, expiresAt) => {
    try {
        await GovernanceLock.create({ _id: key, ownerToken, expiresAt });
        return true;
    } catch (err) {
        if (err && err.code === 11000) return false;
        throw err;
    }
};

const tryAcquireLock = async (key, ownerToken, leaseMs) => {
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
    if (existing) return true;
    return createLockDocument(key, ownerToken, expiresAt);
};

const acquireLock = async (key, ownerToken, options) => {
    const deadline = Date.now() + options.timeoutMs;
    while (Date.now() < deadline) {
        const acquired = await tryAcquireLock(key, ownerToken, options.leaseMs);
        if (acquired) return;
        await sleep(15 + Math.floor(Math.random() * 25));
    }
    throw new AppError("Another privileged administrative change is in progress. Please retry.", 409);
};

const releaseLock = async (key, ownerToken, released) => {
    await GovernanceLock.updateOne(
        { _id: key, ownerToken },
        { $set: released }
    ).catch(() => {});
};

const runFencedTransaction = async (key, ownerToken, fn, released) => {
    const postCommitCallbacks = [];
    const result = await postCommitStorage.run(postCommitCallbacks, () =>
        mongoose.connection.transaction(async () => {
            postCommitCallbacks.length = 0;
            const value = await fn();
            // Fence the commit: a takeover conflicts with this write and an expired lease aborts all work.
            const fence = await GovernanceLock.updateOne(
                { _id: key, ownerToken, expiresAt: { $gt: new Date() } },
                { $set: released }
            );
            if (!fence.matchedCount) {
                throw new AppError("Governance lock expired before commit. Please retry.", 409);
            }
            return value;
        })
    );
    for (const cb of postCommitCallbacks) cb();
    return result;
};

const resolveLockOptions = (options) => ({
    leaseMs: options?.leaseMs ?? 10000,
    timeoutMs: options?.timeoutMs ?? 5000,
});

/**
 * Serializes cross-document governance operations using a leased MongoDB lock document.
 */
const withGovernanceLock = async (key, fn, options = {}) => {
    const resolved = resolveLockOptions(options);
    const ownerToken = crypto.randomUUID();
    await acquireLock(key, ownerToken, resolved);
    const released = { ownerToken: null, expiresAt: new Date(0) };
    try {
        return await runFencedTransaction(key, ownerToken, fn, released);
    } catch (error) {
        await releaseLock(key, ownerToken, released);
        throw error;
    }
};

/**
 * Serializes account governance and curriculum changes that depend on current ownership
 * or user existence, including course transfers.
 */
const withSuperAdminLock = (fn, options) => withGovernanceLock("super_admin_mutation", fn, options);

module.exports = {
    afterTransactionCommit,
    withGovernanceLock,
    withSuperAdminLock,
};
