const rateLimit = require('express-rate-limit');

// General API limiter: 200 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Outer Total AI Generation Limiter: Counts ALL attempts including failures
// Default: 30 requests per hour per user (env-configurable: AI_GENERATE_TOTAL_LIMIT_PER_HOUR)
const aiGenerateTotalLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: process.env.AI_GENERATE_TOTAL_LIMIT_PER_HOUR ? parseInt(process.env.AI_GENERATE_TOTAL_LIMIT_PER_HOUR, 10) : 30,
    keyGenerator: (req) => req.user?.id || req.user?._id?.toString() || req.ip,
    validate: { keyGeneratorIpFallback: false },
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Hourly total AI generation limit reached (30 attempts/hour). Please try again later.' }
});

// AI Generation limiter: 10 requests per 15 minutes per authenticated user (successes only)
// Note: Must run AFTER protect middleware so req.user is populated
// Provider 5xx and 429 errors do not count against the user limit
const aiGenerateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.user?.id || req.user?._id?.toString() || req.ip,
    validate: { keyGeneratorIpFallback: false },
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: true,
    requestWasSuccessful: (req, res) => res.statusCode < 500 && res.statusCode !== 429,
    message: { message: 'AI generation limit reached. You can generate up to 10 plans per 15 minutes.' }
});

// Outer Total Diet Nutrition Lookup Limiter: Counts ALL attempts including failures
// Default: 300 requests per hour per user (env-configurable: AI_LOOKUP_TOTAL_LIMIT_PER_HOUR)
const dietLookupTotalLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: process.env.AI_LOOKUP_TOTAL_LIMIT_PER_HOUR ? parseInt(process.env.AI_LOOKUP_TOTAL_LIMIT_PER_HOUR, 10) : 300,
    keyGenerator: (req) => req.user?.id || req.user?._id?.toString() || req.ip,
    validate: { keyGeneratorIpFallback: false },
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Hourly total nutrition lookup limit reached (300 attempts/hour). Please try again later.' }
});

// Diet nutrition lookup limiter: 60 requests per 15 minutes per user (debounced while typing, successes only)
// Note: Must run AFTER protect middleware
// Provider 5xx and 429 errors do not count against the user limit
const dietLookupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    keyGenerator: (req) => req.user?.id || req.user?._id?.toString() || req.ip,
    validate: { keyGeneratorIpFallback: false },
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: true,
    requestWasSuccessful: (req, res) => res.statusCode < 500 && res.statusCode !== 429,
    message: { message: 'Nutrition lookup limit reached. Please wait a few minutes before trying again.' }
});

module.exports = {
    apiLimiter,
    aiGenerateTotalLimiter,
    aiGenerateLimiter,
    dietLookupTotalLimiter,
    dietLookupLimiter
};
