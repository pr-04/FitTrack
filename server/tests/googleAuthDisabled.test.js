const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('Google OAuth Configuration Unit Tests', () => {
    it('returns JSON 503 when Google OAuth strategy is not registered', async () => {
        // Backup environment variables
        const origId = process.env.GOOGLE_CLIENT_ID;
        const origSecret = process.env.GOOGLE_CLIENT_SECRET;
        delete process.env.GOOGLE_CLIENT_ID;
        delete process.env.GOOGLE_CLIENT_SECRET;

        // Clear require cache for passport and authRoutes
        delete require.cache[require.resolve('../config/passport')];
        delete require.cache[require.resolve('../routes/authRoutes')];

        const passport = require('../config/passport');
        const authRoutes = require('../routes/authRoutes');

        assert.equal(Boolean(passport._strategies?.google), false);

        // Find ensureGoogleConfigured middleware from authRoutes stack
        const googleRouteLayer = authRoutes.stack.find(s => s.route?.path === '/google');
        assert.ok(googleRouteLayer, 'Found /google route layer');
        const ensureGoogleConfigured = googleRouteLayer.route.stack[0].handle;

        let status = null;
        let body = null;
        const req = {};
        const res = {
            status(code) {
                status = code;
                return this;
            },
            json(data) {
                body = data;
                return this;
            }
        };

        let nextCalled = false;
        ensureGoogleConfigured(req, res, () => { nextCalled = true; });

        assert.equal(status, 503);
        assert.deepEqual(body, { message: 'Google login is not configured' });
        assert.equal(nextCalled, false);

        // Restore environment variables
        if (origId) process.env.GOOGLE_CLIENT_ID = origId;
        if (origSecret) process.env.GOOGLE_CLIENT_SECRET = origSecret;
        delete require.cache[require.resolve('../config/passport')];
        delete require.cache[require.resolve('../routes/authRoutes')];
    });
});
