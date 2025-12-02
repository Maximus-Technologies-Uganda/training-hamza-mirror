/**
 * API client wrapper for Blog Posts API
 * Handles all HTTP communication with typed request/response
 * 
 * Generated from: specs/002-blog-api/contracts/openapi.yaml
 * Feature: 003-frontend-blog-integration
 */

import type { Post, CreatePostInput, UpdatePostInput, HealthStatus } from './types';

/**
 * Get API base URL from environment variable
 * Falls back to localhost if not configured
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
   */
  static fromResponse(body: {
    statusCode?: number;
    error?: string;
    message?: string;
    details?: string;
    validation?: FieldValidationError[];
  }, fallbackStatus: number = 500): ApiError {
    return new ApiError(
      body.statusCode || fallbackStatus,
      body.message || 'An unexpected error occurred',
      body.error || 'Error',
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

/**
 * Generic fetch wrapper with error handling
 * Throws ApiError on non-2xx responses
 * 
 * @param endpoint - API endpoint path (e.g., '/posts')
 * @param options - Fetch options (method, headers, body)
 * @returns Parsed JSON response
 */
export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    // Handle non-JSON responses (e.g., 204 No Content)
    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json();

    // Handle error responses - use fromResponse to capture full error structure
    if (!response.ok) {
      throw ApiError.fromResponse(
        {
          statusCode: data.statusCode || response.status,
          error: data.error || response.statusText,
          message: data.message || `HTTP ${response.status}: ${response.statusText}`,
          details: data.details,
          validation: data.validation,
        },
        response.status
      );
    }

    return data;
  } catch (error) {
    // Network errors (no response from server)
    if (error instanceof TypeError) {
      throw new ApiError(
        0,
        'Unable to reach server. Please check your connection.',
        'NetworkError',
        error.message
      );
    }
    
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Unknown errors
    throw new ApiError(
      500,
      'An unexpected error occurred',
      'UnknownError',
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Fetch all blog posts
 * 
 * @returns Array of all posts
 * @throws ApiError on failure
 */
export async function getPosts(): Promise<Post[]> {
  return fetchApi<Post[]>('/posts');
}

/**
 * Fetch a single blog post by ID
 * 
 * @param id - Post ID
 * @returns Post object
 * @throws ApiError on failure (404 if not found)
 */
export async function getPost(id: number): Promise<Post> {
  return fetchApi<Post>(`/posts/${id}`);
}

/**
 * Create a new blog post
 * 
 * @param input - Post title and body
 * @returns Created post with auto-generated fields
 * @throws ApiError on validation failure (400)
 */
export async function createPost(input: CreatePostInput): Promise<Post> {
  return fetchApi<Post>('/posts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Update an existing blog post
 * 
 * @param id - Post ID
 * @param input - Fields to update (partial)
 * @returns Updated post
 * @throws ApiError on failure (404 if not found, 400 on validation error)
 */
export async function updatePost(
  id: number,
  input: UpdatePostInput
): Promise<Post> {
  return fetchApi<Post>(`/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

/**
 * Delete a blog post
 * 
 * @param id - Post ID
 * @throws ApiError on failure (404 if not found)
 */
export async function deletePost(id: number): Promise<void> {
  return fetchApi<void>(`/posts/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Check API health status
 * 
 * @returns Health status object
 * @throws ApiError if health check fails
 */
export async function getHealth(): Promise<HealthStatus> {
  return fetchApi<HealthStatus>('/health');
}
