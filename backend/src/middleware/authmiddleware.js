const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyPasswordChanged } = require("../services/authService");
const logger = require("../utils/logger");

// Protect routes: Check if user is logged in
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer")) {
            logger.warn("Missing or invalid authorization header format", { ip: req.ip, requestId: req.id });
            return res.status(401).json({ msg: "No token provided, authorization denied" });
        }

        const token = authHeader.split(" ")[1];
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ msg: "JWT_SECRET is not configured on the server" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user completely to attach to req
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            logger.warn("Token verified but user no longer exists", { userId: decoded.id, requestId: req.id });
            return res.status(401).json({ msg: "User no longer exists" });
        }

        // Check if user changed password after the token was issued
        if (verifyPasswordChanged(user.passwordChangedAt, decoded.iat)) {
            logger.warn("Token rejected because password was changed after issuance", { userId: user.id, requestId: req.id });
            return res.status(401).json({ msg: "User recently changed password! Please log in again." });
        }

        req.user = user;
        next();
    } catch (error) {
        logger.warn("JWT verification failed", { error: error.message, ip: req.ip, requestId: req.id });
        return res.status(401).json({ msg: "Invalid or expired token", error: error.message });
    }
};

// Authorize roles: e.g. authorize("admin", "instructor")
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            logger.warn(`Access denied. User role '${req.user.role}' lacks required roles: [${roles.join(", ")}]`, { userId: req.user.id, requestId: req.id, url: req.originalUrl });
            return res.status(403).json({
                msg: `Access denied, requires one of roles: ${roles.join(", ")}`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
