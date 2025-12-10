/**
 * Error Mapping Utilities
 * 
 * T062: [Phase 11] Enhanced error handling for auth-related errors.
 * Maps HTTP status codes and error codes to user-friendly error messages.
 * Provides consistent error handling across the frontend.
 */

/**
 * Error code constants matching backend error codes
 */
export const ErrorCode = {
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Authorization errors
  NOT_OWNER: 'NOT_OWNER',
  CSRF_INVALID: 'CSRF_INVALID',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // Rate limiting
  RATE_LIMIT: 'RATE_LIMIT',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

/**
 * API error response structure
 */
export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  code?: ErrorCodeType;
  retryAfter?: number; // For rate limiting
  details?: Record<string, unknown>; // For validation errors
}

/**
 * User-friendly error messages for each error code
 */
export const ErrorMessages: Record<ErrorCodeType, string> = {
  // Authentication errors (401)
  [ErrorCode.AUTH_REQUIRED]: 
    'You need to sign in to perform this action. Please sign in and try again.',
  
  [ErrorCode.TOKEN_INVALID]: 
    'Your session is invalid. Please sign in again.',
  
  [ErrorCode.TOKEN_EXPIRED]: 
    'Your session has expired. Please sign in again to continue.',
  
  // Authorization errors (403)
  [ErrorCode.NOT_OWNER]: 
    'You don\'t have permission to modify this content. Only the owner or an admin can make changes.',
  
  [ErrorCode.CSRF_INVALID]: 
    'Security validation failed. Please refresh the page and try again.',
  
  // Validation errors (400)
  [ErrorCode.VALIDATION_ERROR]: 
    'The information you provided is invalid. Please check your input and try again.',
  
  // Rate limiting (429)
  [ErrorCode.RATE_LIMIT]: 
    'You\'re making requests too quickly. Please wait a moment and try again.',
  
  // Resource errors (404)
  [ErrorCode.NOT_FOUND]: 
    'The content you\'re looking for could not be found. It may have been deleted or moved.',
  
  // Server errors (500, 503)
  [ErrorCode.INTERNAL_ERROR]: 
    'Something went wrong on our end. Please try again later.',
  
  [ErrorCode.SERVICE_UNAVAILABLE]: 
    'The service is temporarily unavailable. Please try again in a few moments.',
};

/**
 * Short titles for error codes (for error boundary headings)
 */
export const ErrorTitles: Record<ErrorCodeType, string> = {
  [ErrorCode.AUTH_REQUIRED]: 'Sign In Required',
  [ErrorCode.TOKEN_INVALID]: 'Invalid Session',
  [ErrorCode.TOKEN_EXPIRED]: 'Session Expired',
  [ErrorCode.NOT_OWNER]: 'Permission Denied',
  [ErrorCode.CSRF_INVALID]: 'Security Check Failed',
  [ErrorCode.VALIDATION_ERROR]: 'Invalid Input',
  [ErrorCode.RATE_LIMIT]: 'Too Many Requests',
  [ErrorCode.NOT_FOUND]: 'Not Found',
  [ErrorCode.INTERNAL_ERROR]: 'Server Error',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service Unavailable',
};

/**
 * HTTP status code to error code mapping
 */
export const StatusToErrorCode: Record<number, ErrorCodeType> = {
  401: ErrorCode.AUTH_REQUIRED,
  403: ErrorCode.NOT_OWNER,
  404: ErrorCode.NOT_FOUND,
  429: ErrorCode.RATE_LIMIT,
  500: ErrorCode.INTERNAL_ERROR,
  503: ErrorCode.SERVICE_UNAVAILABLE,
};

/**
 * Error message configuration for different status codes
 * Per spec FR-022/FR-023: exact wording "Please log in" and "You don't have permission"
 */
const AUTH_ERROR_MESSAGES: Record<number, string> = {
  401: 'Please log in.',
  403: 'You don\'t have permission.',
};

/**
 * Extended error messages for specific error scenarios
 */
const EXTENDED_ERROR_MESSAGES: Record<string, Record<number, string>> = {
  edit: {
    401: 'Please log in to edit this post.',
    403: 'You can only edit posts that you created.',
  },
  delete: {
    401: 'Please log in to delete this post.',
    403: 'You can only delete posts that you created.',
  },
  create: {
    401: 'Please log in to create a post.',
    403: 'You don\'t have permission to create posts.',
  },
};

/**
 * Map HTTP status code to user-friendly error message
 * 
 * @param status - HTTP status code
 * @param context - Optional context for more specific messages ('edit', 'delete', 'create')
 * @returns User-friendly error message
 */
export function mapAuthError(status: number, context?: 'edit' | 'delete' | 'create'): string {
  // Check for context-specific message first
  if (context && EXTENDED_ERROR_MESSAGES[context]?.[status]) {
    return EXTENDED_ERROR_MESSAGES[context][status];
  }
  
  // Fall back to generic auth error messages
  if (AUTH_ERROR_MESSAGES[status]) {
    return AUTH_ERROR_MESSAGES[status];
  }
  
  // Default messages for other status codes
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'A server error occurred. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Check if an error status code is an authentication error (401)
 */
export function isAuthenticationError(status: number): boolean {
  return status === 401;
}

/**
 * Check if an error status code is an authorization error (403)
 */
export function isAuthorizationError(status: number): boolean {
  return status === 403;
}

/**
 * Check if an error status code is a client error (4xx)
 */
export function isClientError(status: number): boolean {
  return status >= 400 && status < 500;
}

/**
 * Check if an error status code is a server error (5xx)
 */
export function isServerError(status: number): boolean {
  return status >= 500 && status < 600;
}

/**
 * Get action text for an error message
 * 
 * @param status - HTTP status code
 * @returns Action hint for the user
 */
export function getErrorAction(status: number): string | null {
  switch (status) {
    case 401:
      return 'Log in';
    case 403:
      return null; // No action available - user lacks permission
    case 429:
      return 'Wait and retry';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Refresh the page';
    default:
      return 'Try again';
  }
}

/**
 * Get user-friendly error message from API error with error code support
 * 
 * @param error - Error object from API
 * @returns User-friendly error message
 */
export function getErrorMessage(error: ApiError | Error | unknown): string {
  // Handle ApiError with error code
  if (isApiError(error) && error.code) {
    return ErrorMessages[error.code] || error.message || ErrorMessages[ErrorCode.INTERNAL_ERROR];
  }
  
  // Handle ApiError with status code mapping
  if (isApiError(error) && error.statusCode) {
    const code = StatusToErrorCode[error.statusCode];
    if (code) {
      return ErrorMessages[code];
    }
    // Fallback to legacy mapAuthError for basic status codes
    return mapAuthError(error.statusCode);
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message || ErrorMessages[ErrorCode.INTERNAL_ERROR];
  }
  
  // Fallback for unknown errors
  return ErrorMessages[ErrorCode.INTERNAL_ERROR];
}

/**
 * Get error title from API error
 * 
 * @param error - Error object from API
 * @returns Error title
 */
export function getErrorTitle(error: ApiError | Error | unknown): string {
  // Handle ApiError with error code
  if (isApiError(error) && error.code) {
    return ErrorTitles[error.code] || 'Error';
  }
  
  // Handle ApiError with status code mapping
  if (isApiError(error) && error.statusCode) {
    const code = StatusToErrorCode[error.statusCode];
    if (code) {
      return ErrorTitles[code];
    }
  }
  
  // Handle HTTP status codes
  if (isApiError(error)) {
    return error.error || 'Error';
  }
  
  return 'Error';
}

/**
 * Check if error requires authentication
 * 
 * @param error - Error object
 * @returns True if auth is required
 */
export function isAuthError(error: ApiError | Error | unknown): boolean {
  if (!isApiError(error)) return false;
  
  return (
    error.statusCode === 401 ||
    error.code === ErrorCode.AUTH_REQUIRED ||
    error.code === ErrorCode.TOKEN_INVALID ||
    error.code === ErrorCode.TOKEN_EXPIRED
  );
}

/**
 * Check if error is a permission error
 * 
 * @param error - Error object
 * @returns True if permission denied
 */
export function isPermissionError(error: ApiError | Error | unknown): boolean {
  if (!isApiError(error)) return false;
  
  return (
    error.statusCode === 403 ||
    error.code === ErrorCode.NOT_OWNER ||
    error.code === ErrorCode.CSRF_INVALID
  );
}

/**
 * Check if error is a rate limit error
 * 
 * @param error - Error object
 * @returns True if rate limited
 */
export function isRateLimitError(error: ApiError | Error | unknown): boolean {
  if (!isApiError(error)) return false;
  
  return (
    error.statusCode === 429 ||
    error.code === ErrorCode.RATE_LIMIT
  );
}

/**
 * Get retry-after seconds from rate limit error
 * 
 * @param error - Error object
 * @returns Seconds to wait, or null
 */
export function getRetryAfter(error: ApiError | Error | unknown): number | null {
  if (!isApiError(error) || !isRateLimitError(error)) {
    return null;
  }
  
  return error.retryAfter || null;
}

/**
 * Type guard to check if error is an ApiError
 * 
 * @param error - Error object
 * @returns True if error is ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof (error as ApiError).statusCode === 'number'
  );
}

/**
 * Format validation error details
 * 
 * @param error - API error with validation details
 * @returns Array of validation error messages
 */
export function getValidationErrors(error: ApiError): string[] {
  if (!error.details || error.code !== ErrorCode.VALIDATION_ERROR) {
    return [];
  }
  
  const errors: string[] = [];
  
  for (const [field, messages] of Object.entries(error.details)) {
    if (Array.isArray(messages)) {
      errors.push(...messages.map(msg => `${field}: ${msg}`));
    } else if (typeof messages === 'string') {
      errors.push(`${field}: ${messages}`);
    }
  }
  
  return errors;
}

/**
 * Format rate limit error with retry time
 * 
 * @param error - API error
 * @returns Formatted message with retry time
 */
export function formatRateLimitMessage(error: ApiError): string {
  const retryAfter = getRetryAfter(error);
  const baseMessage = ErrorMessages[ErrorCode.RATE_LIMIT];
  
  if (retryAfter && retryAfter > 0) {
    const minutes = Math.ceil(retryAfter / 60);
    if (minutes === 1) {
      return `${baseMessage} Please wait about a minute.`;
    } else if (minutes < 60) {
      return `${baseMessage} Please wait about ${minutes} minutes.`;
    } else {
      return `${baseMessage} Please wait about an hour.`;
    }
  }
  
  return baseMessage;
}

/**
 * Formatted error object for UI display
 */
export interface FormattedError {
  title: string;
  message: string;
  action?: string;
  isAuthError: boolean;
  isPermissionError: boolean;
  isRateLimitError: boolean;
  retryAfter?: number;
  validationErrors?: string[];
}

/**
 * Create a formatted error object for UI display
 * 
 * @param error - Error from API or caught exception
 * @returns Formatted error for display
 */
export function formatError(error: ApiError | Error | unknown): FormattedError {
  const title = getErrorTitle(error);
  let message = getErrorMessage(error);
  
  // Get action from status code if available
  let action: string | null | undefined;
  if (isApiError(error)) {
    action = getErrorAction(error.statusCode);
  }
  
  // Special handling for rate limit
  if (isRateLimitError(error) && isApiError(error)) {
    message = formatRateLimitMessage(error);
  }
  
  // Get validation errors if present
  let validationErrors: string[] | undefined;
  if (isApiError(error) && error.code === ErrorCode.VALIDATION_ERROR) {
    validationErrors = getValidationErrors(error);
  }
  
  return {
    title,
    message,
    action: action || undefined,
    isAuthError: isAuthError(error),
    isPermissionError: isPermissionError(error),
    isRateLimitError: isRateLimitError(error),
    retryAfter: isApiError(error) ? getRetryAfter(error) || undefined : undefined,
    validationErrors,
  };
}
