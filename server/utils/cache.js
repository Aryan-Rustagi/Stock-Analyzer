/**
 * In-Memory TTL Cache Utility
 * Provides lightweight in-memory caching with Time-To-Live (TTL)
 * to avoid hitting external stock API rate limits (HTTP 429).
 */
function createInMemoryCache(ttlMs = 60000) {
    const cacheStore = new Map();

    return {
        get(key) {
            const entry = cacheStore.get(key);
            if (!entry) return null;
            if (Date.now() > entry.expiresAt) {
                cacheStore.delete(key);
                return null;
            }
            return entry.value;
        },
        set(key, value) {
            cacheStore.set(key, {
                value: value,
                expiresAt: Date.now() + ttlMs
            });
            return value;
        },
        has(key) {
            return this.get(key) !== null;
        },
        size() {
            return cacheStore.size;
        },
        clear() {
            cacheStore.clear();
        }
    };
}

module.exports = { createInMemoryCache };
