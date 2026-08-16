/**
 * ==============================================================================
 * JavaScript Concept: Closures
 * ==============================================================================
 * Definition:
 * A closure is the combination of a function bundled together with references to its
 * surrounding state (lexical environment). In JavaScript, closures give an inner
 * function access to an outer function's scope even after the outer function has
 * finished executing.
 *
 * Use Cases in this Project:
 * 1. `createApiKeyGetter`: Encapsulates private API keys in lexical scope.
 * 2. `createInMemoryCache`: Encapsulates a private Map and TTL logic without exposing
 *    the raw storage map to external mutation.
 * 3. `createRateLimiter`: Encapsulates private token count and timestamps.
 * ==============================================================================
 */

/**
 * 1. API Key Getter Factory Closure
 * The returned function retains access to `envVarName` and reads process.env on demand.
 */
function createApiKeyGetter(envVarName) {
    return function getSecretKey() {
        // Lexical access to `envVarName` from outer scope
        return process.env[envVarName];
    };
}

/**
 * 2. In-Memory TTL Cache Closure
 * The internal `cacheStore` Map is completely private and hidden from global/outer scope.
 */
function createInMemoryCache(ttlMs = 60000) {
    // Private state held inside the closure
    const cacheStore = new Map();

    return {
        get: function(key) {
            const entry = cacheStore.get(key);
            if (!entry) return null;
            if (Date.now() > entry.expiresAt) {
                cacheStore.delete(key);
                return null;
            }
            return entry.value;
        },
        set: function(key, value) {
            cacheStore.set(key, {
                value: value,
                expiresAt: Date.now() + ttlMs
            });
            return value;
        },
        has: function(key) {
            return this.get(key) !== null;
        },
        size: function() {
            return cacheStore.size;
        },
        clear: function() {
            cacheStore.clear();
        }
    };
}

/**
 * 3. Rate Limiter Closure
 * Encapsulates hit counters and window expiry per client/route.
 */
function createRateLimiter(maxRequests = 10, windowMs = 60000) {
    // Private hits map enclosed in lexical scope
    const requestLog = new Map();

    return function isAllowed(clientId) {
        const now = Date.now();
        const timestamps = requestLog.get(clientId) || [];

        // Filter out expired timestamps
        const validTimestamps = timestamps.filter(ts => (now - ts) < windowMs);

        if (validTimestamps.length >= maxRequests) {
            requestLog.set(clientId, validTimestamps);
            return false; // Rate limit exceeded
        }

        validTimestamps.push(now);
        requestLog.set(clientId, validTimestamps);
        return true; // Allowed
    };
}

module.exports = {
    createApiKeyGetter,
    createInMemoryCache,
    createRateLimiter
};
