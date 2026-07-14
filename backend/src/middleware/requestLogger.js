const morgan = require('morgan');
const logger = require('../utils/logger');
const crypto = require('crypto');

// Generate unique ID for each request
const assignId = (req, res, next) => {
    req.id = crypto.randomUUID();
    next();
};

// Custom Morgan tokens
morgan.token('id', (req) => req.id);
morgan.token('user-id', (req) => req.user ? req.user.id : 'unauthenticated');
morgan.token('client-ip', (req) => req.ip);

const requestLogger = morgan(
    ':client-ip - :user-id [:id] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms',
    {
        stream: {
            write: (message) => {
                logger.info(message.trim(), { type: 'http_request' });
            },
        },
        skip: (req, res) => {
            // Skip logging for static assets or health checks if needed
            if (req.originalUrl === '/favicon.ico') return true;
            return false;
        }
    }
);

module.exports = { assignId, requestLogger };
