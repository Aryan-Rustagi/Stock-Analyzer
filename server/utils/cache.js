/**
 * In-Memory TTL Cache Utility with Automatic Cleanup & Max Size Safeguard
 * Provides lightweight in-memory caching with Time-To-Live (TTL)
 * to avoid hitting external stock API rate limits (HTTP 429).
 */
function createInMemoryCache(ttlMs = 60000, maxEntries = 500) {
    const cacheStore = new Map();

    // Periodic cleanup of expired entries
    const cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of cacheStore.entries()) {
            if (now > entry.expiresAt) {
                cacheStore.delete(key);
            }
        }
    }, Math.max(ttlMs, 60000));

    if (cleanupInterval.unref) {
        cleanupInterval.unref();
    }

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
            // Evict oldest entry if at capacity
            if (cacheStore.size >= maxEntries && !cacheStore.has(key)) {
                const firstKey = cacheStore.keys().next().value;
                if (firstKey !== undefined) {
                    cacheStore.delete(firstKey);
                }
            }

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
