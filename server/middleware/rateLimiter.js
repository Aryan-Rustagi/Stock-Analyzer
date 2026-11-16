/**
 * In-Memory Sliding Window Rate Limiting Middleware
 * Zero-dependency protection against brute-force and API abuse.
 */
function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 15, message = 'Too many requests. Please try again later.' } = {}) {
    const hits = new Map();

    // Periodic cleanup of stale client IP records
    const cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [ip, record] of hits.entries()) {
            if (now - record.resetTime > windowMs) {
                hits.delete(ip);
            }
        }
    }, windowMs);

    if (cleanupInterval.unref) {
        cleanupInterval.unref();
    }

    return function rateLimitMiddleware(req, res, next) {
        const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-client';
        const now = Date.now();

        let record = hits.get(clientIp);
        if (!record || now - record.resetTime > windowMs) {
            record = {
                count: 1,
                resetTime: now
            };
            hits.set(clientIp, record);
            return next();
        }

        record.count += 1;

        if (record.count > max) {
            const retryAfterSec = Math.ceil((windowMs - (now - record.resetTime)) / 1000);
            res.setHeader('Retry-After', retryAfterSec);
            return res.status(429).json({
                message: message,
                retryAfterSeconds: retryAfterSec
            });
        }

        return next();
    };
}

module.exports = { createRateLimiter };
