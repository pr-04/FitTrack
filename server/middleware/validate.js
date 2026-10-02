const { z } = require('zod');

/**
 * Higher-order middleware for Zod validation
 * Validates req.body, req.query, or req.params against a provided schema
 */
const validate = (schema) => (req, res, next) => {
    try {
        const validated = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        // Replace with parsed/transformed data if present
        if (validated.body !== undefined) req.body = validated.body;
        if (validated.query !== undefined) req.query = validated.query;
        if (validated.params !== undefined) req.params = validated.params;

        next();
    } catch (error) {
        const issues = error.issues || error.errors || [];
        if (issues.length > 0) {
            const firstError = issues[0];
            return res.status(400).json({
                message: firstError.message,
                errors: issues.map(err => ({
                    field: err.path.slice(1).join('.') || err.path[0],
                    message: err.message
                }))
            });
        }
        return res.status(400).json({ message: error.message || 'Validation failed' });
    }
};

module.exports = validate;
