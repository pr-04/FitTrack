// Global error handling middleware
const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    console.error(`[Error] ${err.message}`);

    res.status(statusCode).json({
        message: err.message,
        // Show stack trace only in development
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

// 404 Not Found middleware
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = { errorHandler, notFound };
