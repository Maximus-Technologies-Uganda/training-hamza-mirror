/**
 * Centralized Error Handler Middleware
 * 
 * Provides consistent error responses across all endpoints.
 * Maps custom error types to HTTP status codes and structured JSON responses.
 */

/**
 * Error codes for standardized error responses
 */
export const ErrorCodes = {
  // Authentication errors (401)
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',
  NOT_OWNER: 'NOT_OWNER',
  CSRF_INVALID: 'CSRF_INVALID',
  ADMIN_REQUIRED: 'ADMIN_REQUIRED',
  
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BODY_TOO_LARGE: 'BODY_TOO_LARGE',
  
  // Rate limit errors (429)
  RATE_LIMITED: 'RATE_LIMITED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  
  // Not found errors (404)
  NOT_FOUND: 'NOT_FOUND',
  
  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

/**
 * Build a readable message from validation errors
 * @param {Array<string | { field?: string, message?: string }>} errors
 * @returns {string}
 */
function formatValidationMessage(errors) {
  return errors.map((err) => {
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') {
      const field = err.field || 'field';
      const message = err.message || 'is invalid';
      return `${field}: ${message}`;
    }
    return String(err);
  }).join(', ');
}

/**
 * Base API Error class
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error (400 Bad Request)
 */
export class ValidationError extends ApiError {
  constructor(message, field = null, validationErrors = null) {
    const hasArrayMessage = Array.isArray(message);
    const normalizedMessage = hasArrayMessage ? formatValidationMessage(message) : message;

    super(normalizedMessage, 400, ErrorCodes.VALIDATION_ERROR);
    this.field = field;
    if (validationErrors) {
      this.validationErrors = validationErrors;
    } else if (hasArrayMessage) {
      this.validationErrors = message;
    }
  }
}

/**
 * Not Found Error (404 Not Found)
 */
export class NotFoundError extends ApiError {
  constructor(message) {
    super(message, 404, ErrorCodes.NOT_FOUND);
  }
}

/**
 * Rate Limit Error (429 Too Many Requests)
 */
export class RateLimitError extends ApiError {
  constructor(message, retryAfter = null) {
    super(message, 429, ErrorCodes.RATE_LIMITED);
    this.retryAfter = retryAfter;
  }
}

/**
 * Unauthorized Error (401 Unauthorized)
 * Used when authentication is required but not provided
 */
export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required', code = ErrorCodes.AUTH_REQUIRED) {
    super(message, 401, code);
  }
}

/**
 * Invalid Token Error (401 Unauthorized)
 * Used when token is expired or invalid
 */
export class InvalidTokenError extends ApiError {
  constructor(message = 'Token expired or invalid', code = ErrorCodes.TOKEN_INVALID) {
    super(message, 401, code);
  }
}

/**
 * Token Expired Error (401 Unauthorized)
 * Specific error for expired tokens
 */
export class TokenExpiredError extends ApiError {
  constructor(message = 'Token has expired') {
    super(message, 401, ErrorCodes.TOKEN_EXPIRED);
  }
}

/**
 * Forbidden Error (403 Forbidden)
 * Used when authenticated but not authorized for the action
 */
export class ForbiddenError extends ApiError {
  constructor(message = 'Not authorized to access this resource', code = ErrorCodes.FORBIDDEN) {
    super(message, 403, code);
  }
}

/**
 * Not Owner Error (403 Forbidden)
 * Used when user tries to modify a resource they don't own
 */
export class NotOwnerError extends ApiError {
  constructor(message = 'You can only modify your own posts') {
    super(message, 403, ErrorCodes.NOT_OWNER);
  }
}

/**
 * CSRF Error (403 Forbidden)
 * Used when CSRF token is invalid or missing
 */
export class CSRFError extends ApiError {
  constructor(message = 'Invalid CSRF token') {
    super(message, 403, ErrorCodes.CSRF_INVALID);
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
  
  // Get request ID for tracing
  const requestId = request.id || 'unknown';
  
  // Get userId if authenticated (from Firebase or JWT)
  const userId = request.firebaseUser?.uid || request.user?.id || null;
  
  // Build structured log context
  const logContext = {
    level: 'error',
    msg: error.message,
    route: request.routeOptions?.url || request.url,
    status: error.statusCode || 500,
    requestId,
    errorCode: error.code || null,
    ...(userId && { userId })
  };
  
  if (isDevelopment) {
    request.log.error(error);
  } else {
    request.log.error(logContext);
  }

  // Map error to HTTP response
  let statusCode = error.statusCode || 500;
  let errorType;
  let errorCode = error.code || null;
  let message = error.message || 'An unexpected error occurred';
  let retryAfter = null;

  // Handle Firebase Auth errors (from firebase-auth middleware)
  if (error.name === 'FirebaseAuthError') {
    statusCode = error.statusCode || 401;
    errorType = statusCode === 401 ? 'Unauthorized' : 'Forbidden';
    errorCode = error.code;
  // Handle custom API errors
  } else if (error instanceof TokenExpiredError) {
    statusCode = 401;
    errorType = 'Unauthorized';
    errorCode = ErrorCodes.TOKEN_EXPIRED;
  } else if (error instanceof UnauthorizedError || error instanceof InvalidTokenError) {
    statusCode = 401;
    errorType = 'Unauthorized';
    errorCode = error.code;
  } else if (error instanceof NotOwnerError) {
    statusCode = 403;
    errorType = 'Forbidden';
    errorCode = ErrorCodes.NOT_OWNER;
  } else if (error instanceof CSRFError || error.name === 'CSRFError') {
    statusCode = 403;
    errorType = 'Forbidden';
    errorCode = ErrorCodes.CSRF_INVALID;
  } else if (error instanceof ForbiddenError) {
    statusCode = 403;
    errorType = 'Forbidden';
    errorCode = error.code;
  } else if (error instanceof ValidationError) {
    statusCode = 400;
    errorType = 'Bad Request';
    errorCode = ErrorCodes.VALIDATION_ERROR;
    if (Array.isArray(error.validationErrors) && error.validationErrors.length > 0) {
      // Ensure message is readable even if an array was passed to the constructor
      message = error.message || formatValidationMessage(error.validationErrors);
    }
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    errorType = 'Not Found';
    errorCode = ErrorCodes.NOT_FOUND;
  } else if (error instanceof RateLimitError) {
    statusCode = 429;
    errorType = 'Too Many Requests';
    errorCode = ErrorCodes.RATE_LIMITED;
    retryAfter = error.retryAfter;
  } else if (error instanceof ApiError) {
    // Generic API errors with code
    errorType = 'Error';
    errorCode = error.code;
  } else if (error.validation) {
    // Handle Fastify validation errors
    statusCode = 400;
    errorType = 'Bad Request';
    errorCode = ErrorCodes.VALIDATION_ERROR;
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
    errorCode = ErrorCodes.INTERNAL_ERROR;
    message = 'An unexpected error occurred';
  } else {
    // Use original error name for other errors
    errorType = error.name || 'Error';
  }

  // Build error response (OpenAPI-compliant JSON structure)
  const errorResponse = {
    error: {
      statusCode,
      code: errorCode || errorType?.toUpperCase().replace(/ /g, '_') || 'ERROR',
      message,
      requestId
    }
  };

  // Add validation details for ValidationError with field information
  if (error instanceof ValidationError) {
    if (Array.isArray(error.validationErrors) && error.validationErrors.length > 0) {
      errorResponse.error.validation = error.validationErrors;
    } else if (error.field) {
      errorResponse.error.validation = [{
        field: error.field,
        message: message
      }];
    }
  }

  // Add retry-after for rate limit errors
  if (retryAfter) {
    errorResponse.error.retryAfter = retryAfter;
    reply.header('Retry-After', retryAfter);
  }

  // Strip stack traces in production (security best practice)
  if (isDevelopment && error.stack) {
    errorResponse.error.stack = error.stack;
  }

  // Send error response
  reply.code(statusCode).send(errorResponse);
}
