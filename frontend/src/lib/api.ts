/**
 * API client wrapper for Blog Posts API
 * Handles all HTTP communication with typed request/response
 * 
 * Generated from: specs/002-blog-api/contracts/openapi.yaml
 * Feature: 003-frontend-blog-integration
 * Updated: 004-blog-auth - Added Authorization headers for write operations
 */

import type { Post, CreatePostInput, UpdatePostInput, HealthStatus } from './types';
import { getAuthHeaders } from './auth';
import { API_BASE_URL } from './config';
import { ApiError, isApiError, type FieldValidationError } from './api-errors';

// Re-export for backward compatibility
export { API_BASE_URL };
export { ApiError, isApiError, type FieldValidationError };

/**
 * Generate a unique request ID for tracing
 * Uses crypto.randomUUID() if available, falls back to timestamp-based ID
 */
function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generic fetch wrapper with error handling
 * Throws ApiError on non-2xx responses
 * Automatically adds X-Request-ID header for request tracing
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
  const requestId = generateRequestId();
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        ...options?.headers,
      },
    });

    // Handle non-JSON responses (e.g., 204 No Content, or empty body)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
    }

    // Clone response to safely check for empty body
    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    const data = JSON.parse(text);

    // Handle error responses - use fromResponse to capture full error structure
    // Backend returns nested format: { error: { code, message, validation, requestId } }
    if (!response.ok) {
      throw ApiError.fromResponse(data, response.status);
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
 * Requires authentication - includes Authorization header if token exists
 * 
 * @param input - Post title and body
 * @returns Created post with auto-generated fields
 * @throws ApiError on validation failure (400) or unauthorized (401)
 */
export async function createPost(input: CreatePostInput): Promise<Post> {
  return fetchApi<Post>('/posts', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });
}

/**
 * Update an existing blog post
 * Requires authentication - includes Authorization header if token exists
 * 
 * @param id - Post ID
 * @param input - Fields to update (partial)
 * @returns Updated post
 * @throws ApiError on failure (404 if not found, 400 on validation error, 401/403 on auth error)
 */
export async function updatePost(
  id: number,
  input: UpdatePostInput
): Promise<Post> {
  return fetchApi<Post>(`/posts/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });
}

/**
 * Delete a blog post
 * Requires authentication - includes Authorization header if token exists
 * 
 * @param id - Post ID
 * @throws ApiError on failure (404 if not found, 401/403 on auth error)
 */
export async function deletePost(id: number): Promise<void> {
  return fetchApi<void>(`/posts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
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
