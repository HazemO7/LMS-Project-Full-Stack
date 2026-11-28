const { AsyncLocalStorage } = require("async_hooks");
const mongoose = require("mongoose");
const crypto = require("crypto");
const GovernanceLock = require("../models/GovernanceLock");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const postCommitStorage = new AsyncLocalStorage();
let standaloneWarningLogged = false;

// Include all Mongoose operations in the callback (including helper queries) in the transaction.
mongoose.set("transactionAsyncLocalStorage", true);

const isStandaloneTopology = () => {
    const description = mongoose.connection.getClient?.()?.topology?.description;
    if (!description || description.type !== "Single") return false;
    const servers = Array.from(description.servers?.values?.() || []);
    return servers.length > 0 && servers.every((server) => server.type === "Standalone");
};

const isTransactionUnsupportedError = (error) =>
    Boolean(
        error &&
        /Transaction numbers are only allowed on a replica set member or mongos/i.test(error.message || "")
    );

const canUseStandaloneForTopology = () =>
    process.env.NODE_ENV !== "production" && isStandaloneTopology();

const canUseStandaloneForError = (error) =>
    process.env.NODE_ENV !== "production" && isTransactionUnsupportedError(error);

const logStandaloneFallbackOnce = () => {
    if (standaloneWarningLogged) return;
    standaloneWarningLogged = true;
    logger.warn("MongoDB standalone topology detected in non-production; running governance operation without ACID transaction.");
};

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

const runPostCommitCallbacks = (callbacks) => {
    for (const cb of callbacks) {
        try {
            cb();
        } catch (err) {
            try {
                logger.error("Post-commit callback failed", { error: err?.message });
            } catch {
                // Never allow reporting failures to escape after commit.
            }
        }
    }
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
    runPostCommitCallbacks(postCommitCallbacks);
    return result;
};

const runStandaloneLocked = async (key, ownerToken, fn, released) => {
    logStandaloneFallbackOnce();
    const postCommitCallbacks = [];
    let result;
    try {
        result = await postCommitStorage.run(postCommitCallbacks, async () => {
            postCommitCallbacks.length = 0;
            return fn();
        });
    } finally {
        await releaseLock(key, ownerToken, released);
    }
    runPostCommitCallbacks(postCommitCallbacks);
    return result;
};

const executeLockedWork = async (key, ownerToken, fn, released) => {
    if (canUseStandaloneForTopology()) {
        return runStandaloneLocked(key, ownerToken, fn, released);
    }
    try {
        return await runFencedTransaction(key, ownerToken, fn, released);
    } catch (error) {
        if (canUseStandaloneForError(error)) {
            return runStandaloneLocked(key, ownerToken, fn, released);
        }
        throw error;
    }
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
        return await executeLockedWork(key, ownerToken, fn, released);
    } catch (error) {
        await releaseLock(key, ownerToken, released);
        throw error;
    }
};

const runOptionalTransaction = async (fn) => {
    if (canUseStandaloneForTopology()) {
        logStandaloneFallbackOnce();
        return fn();
    }
    try {
        return await mongoose.connection.transaction(fn);
    } catch (error) {
        if (canUseStandaloneForError(error)) {
            logStandaloneFallbackOnce();
            return fn();
        }
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
    runOptionalTransaction,
    withGovernanceLock,
    withSuperAdminLock,
};
