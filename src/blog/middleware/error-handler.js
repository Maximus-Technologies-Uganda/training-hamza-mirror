/**
 * Centralized Error Handler Middleware
 * 
 * Provides consistent error responses across all endpoints.
 * Maps custom error types to HTTP status codes and structured JSON responses.
 */

/**
 * Base API Error class
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error (400 Bad Request)
 */
export class ValidationError extends ApiError {
  constructor(message, field = null) {
    super(message, 400);
    this.field = field;
  }
}

/**
 * Not Found Error (404 Not Found)
 */
export class NotFoundError extends ApiError {
  constructor(message) {
    super(message, 404);
  }
}

/**
 * Rate Limit Error (429 Too Many Requests)
 */
export class RateLimitError extends ApiError {
  constructor(message) {
    super(message, 429);
  }
}

/**
 * Fastify error handler
 * @param {Error} error - Error object
 * @param {Object} request - Fastify request
 * @param {Object} reply - Fastify reply
 */
export async function errorHandler(error, request, reply) {
  // Log error for debugging (with stack trace in development)
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  if (isDevelopment) {
    request.log.error(error);
  } else {
    request.log.error({ message: error.message, statusCode: error.statusCode });
  }

  // Map error to HTTP response
  let statusCode = error.statusCode || 500;
  let errorType;
  let message = error.message || 'An unexpected error occurred';

  // Handle custom API errors
  if (error instanceof ValidationError) {
    statusCode = 400;
    errorType = 'Bad Request';
    // Keep the detailed validation message
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    errorType = 'Not Found';
    // Keep the specific not found message (e.g., "Post with id 1 not found")
  } else if (error instanceof RateLimitError) {
    statusCode = 429;
    errorType = 'Too Many Requests';
    // Keep the rate limit message
  } else if (error instanceof ApiError) {
    // Generic API errors
    errorType = 'Error';
  } else if (error.validation) {
    // Handle Fastify validation errors
    statusCode = 400;
    errorType = 'Bad Request';
    // Provide field-specific error messages
    if (error.validation.length > 0) {
      const fieldErrors = error.validation.map(v => {
        const field = v.instancePath?.replace('/', '') || v.params?.missingProperty || 'body';
        return `${field}: ${v.message}`;
      });
      message = fieldErrors.join(', ');
    }
  } else if (statusCode === 500) {
    // Generic server errors - hide implementation details
    errorType = 'Internal Server Error';
    message = 'An unexpected error occurred';
  } else {
    // Use original error name for other errors
    errorType = error.name || 'Error';
  }

  // Build error response (consistent JSON structure)
  const errorResponse = {
    statusCode,
    error: errorType,
    message
  };

  // Add validation details for ValidationError with field information
  if (error instanceof ValidationError && error.field) {
    errorResponse.validation = [{
      field: error.field,
      message: message
    }];
  }

  // Strip stack traces in production (security best practice)
  if (isDevelopment && error.stack) {
    errorResponse.stack = error.stack;
  }

  // Send error response
  reply.code(statusCode).send(errorResponse);
}
