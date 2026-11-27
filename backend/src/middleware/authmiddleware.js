const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyPasswordChanged } = require("../services/authService");
const logger = require("../utils/logger");

const isAdminRole = (role) => {
    if (role === "admin") return true;
    return role === "super_admin";
};

const USER_SAFE_PROJECTION = "-password -resetPasswordToken -resetPasswordExpire -resetPasswordTokenCreatedAt";

const PASSWORD_ROTATION_ALLOWLIST = new Set([
    "GET /api/users/me",
    "PUT /api/auth/change-password",
    "POST /api/auth/logout",
]);

const extractBearerToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    if (!authHeader.startsWith("Bearer")) return null;
    const parts = authHeader.split(" ");
    return parts[1] || null;
};

const isBlockedByPasswordRotation = (user, req) => {
    if (user.mustChangePassword !== true) return false;
    const cleanPath = (req.originalUrl || "").split("?")[0];
    const signature = `${req.method.toUpperCase()} ${cleanPath}`;
    return !PASSWORD_ROTATION_ALLOWLIST.has(signature);
};

const buildRejection = (status, body, logMsg = null, logMeta = null) => ({
    status,
    body,
    logMsg,
    logMeta,
});

const isTokenVersionStale = (decoded, user) =>
    (decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0);

const validateAuthenticatedUser = (user, decoded, req) => {
    if (!user) {
        return buildRejection(401, { msg: "User no longer exists" }, "Token verified but user no longer exists", {
            userId: decoded.id,
            requestId: req.id,
        });
    }
    if (user.isActive === false) {
        return buildRejection(
            403,
            { msg: "Your account has been suspended. Please contact administration.", code: "ACCOUNT_SUSPENDED" },
            "Suspended account attempted API access",
            { userId: user.id, requestId: req.id }
        );
    }
    if (isTokenVersionStale(decoded, user) || verifyPasswordChanged(user.passwordChangedAt, decoded.iat)) {
        return buildRejection(
            401,
            { msg: "User recently changed password! Please log in again." },
            "Token rejected because password was changed after issuance",
            { userId: user.id, requestId: req.id }
        );
    }
    if (isBlockedByPasswordRotation(user, req)) {
        return buildRejection(403, {
            msg: "You must change your temporary password before continuing.",
            code: "PASSWORD_CHANGE_REQUIRED",
        });
    }
    return null;
};

const authenticateToken = async (token, req) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(USER_SAFE_PROJECTION);
    const rejection = validateAuthenticatedUser(user, decoded, req);
    return { user, rejection };
};

// Protect routes: Check if user is logged in
const protect = async (req, res, next) => {
    const token = extractBearerToken(req);
    if (!token) {
        logger.warn("Missing or invalid authorization header format", { ip: req.ip, requestId: req.id });
        return res.status(401).json({ msg: "No token provided, authorization denied" });
    }
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ msg: "JWT_SECRET is not configured on the server" });
    }

    try {
        const { user, rejection } = await authenticateToken(token, req);
        if (rejection) {
            if (rejection.logMsg) logger.warn(rejection.logMsg, rejection.logMeta);
            return res.status(rejection.status).json(rejection.body);
        }
        req.user = user;
        return next();
    } catch (error) {
        logger.warn("JWT verification failed", { error: error.message, ip: req.ip, requestId: req.id });
        return res.status(401).json({ msg: "Invalid or expired token", error: error.message });
    }
};

// Authorize roles: e.g. authorize("super_admin", "admin", "instructor")
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            logger.warn(`Access denied. User role '${req.user.role}' lacks required roles: [${roles.join(", ")}]`, {
                userId: req.user.id,
                requestId: req.id,
                url: req.originalUrl,
            });
            return res.status(403).json({
                msg: `Access denied, requires one of roles: ${roles.join(", ")}`,
            });
        }
        next();
    };
};

module.exports = { protect, authorize, isAdminRole };
