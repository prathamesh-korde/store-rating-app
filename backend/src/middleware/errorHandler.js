'use strict';
const env = require('../config/env');

/**
 * Global Express error-handling middleware.
 * Must be registered last (after all routes).
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (env.NODE_ENV === 'development') {
    console.error('[Error]', err.stack);
  } else {
    console.error('[Error]', message);
  }

  return res.status(statusCode).json({
    success: false,
    error: message,
    details: err.details || [],
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Wraps async route handlers to catch rejected promises.
 * @param {Function} fn - Async route handler
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Create an HTTP error with a status code.
 */
const createError = (statusCode, message, details = []) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.details = details;
  return err;
};

module.exports = { errorHandler, catchAsync, createError };
