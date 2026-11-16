const { test, describe } = require('node:test');
const assert = require('node:assert');
const { createRateLimiter } = require('../middleware/rateLimiter');

describe('Sliding Window Rate Limiter Middleware', () => {
    test('should allow requests below maximum limit', () => {
        const limiter = createRateLimiter({ windowMs: 10000, max: 3 });

        let nextCalled = 0;
        const fakeReq = { ip: '127.0.0.1', headers: {}, socket: {} };
        const fakeRes = {
            setHeader: () => {},
            status: () => ({ json: () => {} })
        };

        limiter(fakeReq, fakeRes, () => { nextCalled++; });
        limiter(fakeReq, fakeRes, () => { nextCalled++; });
        limiter(fakeReq, fakeRes, () => { nextCalled++; });

        assert.strictEqual(nextCalled, 3);
    });

    test('should block and return 429 when limit is exceeded', () => {
        const limiter = createRateLimiter({ windowMs: 10000, max: 2, message: 'Rate limit exceeded' });

        let blockedStatus = null;
        let blockedBody = null;
        const fakeReq = { ip: '192.168.1.1', headers: {}, socket: {} };
        const fakeRes = {
            setHeader: () => {},
            status: (code) => {
                blockedStatus = code;
                return {
                    json: (body) => { blockedBody = body; }
                };
            }
        };

        // Call 1 & 2 pass
        limiter(fakeReq, fakeRes, () => {});
        limiter(fakeReq, fakeRes, () => {});

        // Call 3 should be blocked
        limiter(fakeReq, fakeRes, () => {});

        assert.strictEqual(blockedStatus, 429);
        assert.strictEqual(blockedBody.message, 'Rate limit exceeded');
        assert.ok(blockedBody.retryAfterSeconds > 0);
    });
});
