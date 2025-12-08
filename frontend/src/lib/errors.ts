/**
 * Error Mapping Utilities
 * 
 * T060: [US4] Maps HTTP status codes to user-friendly error messages.
 * Provides consistent error handling across the frontend.
 */

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
