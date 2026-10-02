const rateLimit = require('express-rate-limit');

// General API limiter: 200 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// AI Generation limiter: 10 requests per 15 minutes per authenticated user
// Note: Must run AFTER protect middleware so req.user is populated
const aiGenerateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.user?.id || req.user?._id?.toString() || req.ip,
    validate: { keyGeneratorIpFallback: false },
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'AI generation limit reached. You can generate up to 10 plans per 15 minutes.' }
});

// Diet nutrition lookup limiter: 60 requests per 15 minutes per user (debounced while typing)
// Note: Must run AFTER protect middleware
const dietLookupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    keyGenerator: (req) => req.user?.id || req.user?._id?.toString() || req.ip,
    validate: { keyGeneratorIpFallback: false },
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Nutrition lookup limit reached. Please wait a few minutes before trying again.' }
});

module.exports = {
    apiLimiter,
    aiGenerateLimiter,
    dietLookupLimiter
};
