/**
 * API Error Classes
 * 
 * Separated from api.ts to avoid circular dependencies.
 * auth.ts needs ApiError, and api.ts needs getAuthHeaders from auth.ts.
 */

/**
 * Field-level validation error from API
 */
export interface FieldValidationError {
  field: string;
  message: string;
}

/**
 * Custom error class for API errors
 * Extends Error with HTTP status code and full error details from the API response
 * Matches the error contract: { statusCode, error, message, details, validation }
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly error: string;
  public readonly details?: string;
  public readonly validation?: FieldValidationError[];

  constructor(
    statusCode: number,
    message: string,
    error: string = 'Error',
    details?: string,
    validation?: FieldValidationError[]
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.error = error;
    this.details = details;
    this.validation = validation;
    
    // Maintains proper stack trace for where error was thrown (only in V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Create ApiError from API response body
   * Handles both legacy flat format and new nested format:
   * - New: { error: { code, message, validation, requestId } }
   * - Legacy: { statusCode, error, message, details, validation }
   */
  static fromResponse(body: {
    statusCode?: number;
    error?: string | { code?: string; message?: string; validation?: FieldValidationError[]; requestId?: string };
    message?: string;
    details?: string;
    validation?: FieldValidationError[];
  }, fallbackStatus: number = 500): ApiError {
    // Handle new nested error format: { error: { code, message, validation, requestId } }
    if (body.error && typeof body.error === 'object') {
      const nestedError = body.error;
      return new ApiError(
        fallbackStatus,
        nestedError.message || 'An unexpected error occurred',
        nestedError.code || 'Error',
        undefined,
        nestedError.validation
      );
    }
    
    // Handle legacy flat format: { statusCode, error, message, details, validation }
    return new ApiError(
      body.statusCode || fallbackStatus,
      body.message || 'An unexpected error occurred',
      typeof body.error === 'string' ? body.error : 'Error',
      body.details,
      body.validation
    );
  }

  /**
   * Check if this error has field-level validation errors
   */
  hasFieldErrors(): boolean {
    return Array.isArray(this.validation) && this.validation.length > 0;
  }

  /**
   * Get validation error message for a specific field
   */
  getFieldError(fieldName: string): string | undefined {
    return this.validation?.find(v => v.field === fieldName)?.message;
  }

  /**
   * Check if this is a validation error (400)
   */
  isValidationError(): boolean {
    return this.statusCode === 400;
  }

  /**
   * Check if this is a not found error (404)
   */
  isNotFoundError(): boolean {
    return this.statusCode === 404;
  }

  /**
   * Check if this is a server error (5xx)
   */
  isServerError(): boolean {
    return this.statusCode >= 500 && this.statusCode < 600;
  }
}

/**
 * Type guard to check if error is ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
