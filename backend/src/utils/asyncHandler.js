/**
 * asyncHandler - Wraps an async Express route handler to automatically
 * catch errors and forward them to Express error middleware.
 *
 * Eliminates repetitive try/catch blocks in every route handler.
 *
 * @param {Function} fn - Async route handler (req, res, next) => Promise
 * @returns {Function} Express middleware
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * createApiError - Creates a structured error with an HTTP status code
 * for use with the global error handler.
 *
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @returns {Error} Error object with status property
 */
export function createApiError(statusCode, message) {
  const err = new Error(message);
  err.status = statusCode;
  return err;
}
