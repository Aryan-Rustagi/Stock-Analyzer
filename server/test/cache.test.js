const { test, describe } = require('node:test');
const assert = require('node:assert');
const { createInMemoryCache } = require('../utils/cache');

describe('In-Memory TTL Cache Utility', () => {
    test('should store and retrieve cached values', () => {
        const cache = createInMemoryCache(1000);
        cache.set('AAPL', { price: 150 });

        assert.strictEqual(cache.has('AAPL'), true);
        assert.deepStrictEqual(cache.get('AAPL'), { price: 150 });
        assert.strictEqual(cache.size(), 1);
    });

    test('should expire entries after TTL', async () => {
        const cache = createInMemoryCache(50); // 50ms TTL
        cache.set('RELIANCE', { price: 2500 });

        assert.strictEqual(cache.has('RELIANCE'), true);

        // Wait 70ms for TTL to expire
        await new Promise(resolve => setTimeout(resolve, 70));

        assert.strictEqual(cache.get('RELIANCE'), null);
        assert.strictEqual(cache.has('RELIANCE'), false);
    });

    test('should evict oldest entry when capacity is exceeded', () => {
        const cache = createInMemoryCache(60000, 2); // max 2 entries
        cache.set('A', 1);
        cache.set('B', 2);
        cache.set('C', 3); // should evict A

        assert.strictEqual(cache.get('A'), null);
        assert.strictEqual(cache.get('B'), 2);
        assert.strictEqual(cache.get('C'), 3);
        assert.strictEqual(cache.size(), 2);
    });

    test('should clear all entries', () => {
        const cache = createInMemoryCache(60000);
        cache.set('X', 10);
        cache.set('Y', 20);
        assert.strictEqual(cache.size(), 2);

        cache.clear();
        assert.strictEqual(cache.size(), 0);
        assert.strictEqual(cache.get('X'), null);
    });
});
