/**
 * TypeScript API Client for Blog Posts API
 * 
 * Copied from: specs/003-frontend-blog-integration/contracts/api-client.ts
 * Generated from: specs/002-blog-api/contracts/openapi.yaml
 * Feature: 003-frontend-blog-integration
 * Date: November 27, 2025
 * 
 * This file provides typed API client functions that match the Blog Posts API
 * OpenAPI 3.1 specification. All functions use the configured API_URL from
 * environment variables.
 * 
 * NOTE: This is the contract reference. The implementation is in ./api.ts
 */

import type { Post, CreatePostInput, UpdatePostInput, HealthStatus } from './types';

// ============================================================================
// Configuration
// ============================================================================

/**
 * API base URL from environment variable
 * Must be set in .env.local for development and at build time for production
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Custom error class for API errors
 * Extends Error with status code and structured message
 */
export class ApiClientError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Type guard to check if error is ApiClientError
 */
export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

// ============================================================================
// Fetch Wrapper
// ============================================================================

/**
 * Generic fetch wrapper with error handling and type safety
 * 
 * @param url - Full URL or path (will be prefixed with API_URL if relative)
 * @param options - Fetch options (headers, method, body, etc.)
 * @returns Typed response data
 * @throws ApiClientError for 4xx/5xx responses
 * @throws Error for network failures
 */
export async function fetchApi<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    // Handle 204 No Content (e.g., DELETE success)
    if (response.status === 204) {
      return undefined as T;
    }

    // Parse response body
    const data = await response.json().catch(() => null);

    // Handle error responses
    if (!response.ok) {
      const errorData = data as { error?: string; message?: string } | null;
      throw new ApiClientError(
        response.status,
        errorData?.error || response.statusText,
        errorData?.message || `Request failed with status ${response.status}`
      );
    }

    return data as T;
  } catch (error) {
    // Re-throw ApiClientError as-is
    if (isApiClientError(error)) {
      throw error;
    }

    // Network errors, CORS errors, etc.
    throw new Error(
      error instanceof Error 
        ? `Network error: ${error.message}` 
        : 'An unexpected error occurred'
    );
  }
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * GET /health
 * Check API health status
 * 
 * @returns Health status object
 * @throws Error on network failure
 * 
 * @example
 * const status = await getHealth();
 * if (status.status === 'ok') {
 *   console.log('API is healthy');
 * }
 */
export async function getHealth(): Promise<HealthStatus> {
  return fetchApi<HealthStatus>('/health');
}

// ============================================================================
// Posts - Read Operations
// ============================================================================

/**
 * GET /posts
 * Retrieve all blog posts
 * 
 * @returns Array of all posts (empty array if none exist)
 * @throws ApiClientError for API errors (500, etc.)
 * @throws Error for network failures
 * 
 * @example
 * const posts = await getPosts();
 * console.log(`Found ${posts.length} posts`);
 */
export async function getPosts(): Promise<Post[]> {
  return fetchApi<Post[]>('/posts');
}

/**
 * GET /posts/{id}
 * Retrieve a single post by ID
 * 
 * @param id - Post ID (positive integer)
 * @returns Post object
 * @throws ApiClientError with status 404 if post not found
 * @throws ApiClientError for other API errors
 * @throws Error for network failures
 * 
 * @example
 * try {
 *   const post = await getPost(123);
 *   console.log(post.title);
 * } catch (error) {
 *   if (isApiClientError(error) && error.statusCode === 404) {
 *     console.log('Post not found');
 *   }
 * }
 */
export async function getPost(id: number): Promise<Post> {
  return fetchApi<Post>(`/posts/${id}`);
}

// ============================================================================
// Posts - Create Operation
// ============================================================================

/**
 * POST /posts
 * Create a new blog post
 * 
 * @param data - Post creation data (title and body)
 * @returns Created post with generated id, slug, and timestamps
 * @throws ApiClientError with status 400 for validation errors
 * @throws ApiClientError for other API errors (500, etc.)
 * @throws Error for network failures
 * 
 * Validation rules:
 * - title: Required, 1-200 characters, non-whitespace
 * - body: Required, 1-50000 characters, non-whitespace
 * 
 * @example
 * const newPost = await createPost({
 *   title: 'Getting Started',
 *   body: 'This is my first post...'
 * });
 * console.log(`Created post #${newPost.id}`);
 */
export async function createPost(data: CreatePostInput): Promise<Post> {
  return fetchApi<Post>('/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================================
// Posts - Update Operation
// ============================================================================

/**
 * PATCH /posts/{id}
 * Update an existing blog post
 * 
 * @param id - Post ID to update
 * @param data - Partial post data (only fields to update)
 * @returns Updated post with new updatedAt timestamp
 * @throws ApiClientError with status 404 if post not found
 * @throws ApiClientError with status 400 for validation errors
 * @throws ApiClientError for other API errors
 * @throws Error for network failures
 * 
 * Notes:
 * - Only provided fields are updated
 * - Omitted fields retain their existing values
 * - createdAt is immutable
 * - updatedAt is automatically set by API
 * - Slug regenerated if title changes
 * 
 * @example
 * // Update only the title
 * const updated = await updatePost(123, { title: 'New Title' });
 * 
 * // Update both title and body
 * const updated = await updatePost(123, {
 *   title: 'Updated Title',
 *   body: 'Updated content...'
 * });
 */
export async function updatePost(
  id: number,
  data: UpdatePostInput
): Promise<Post> {
  return fetchApi<Post>(`/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ============================================================================
// Posts - Delete Operation
// ============================================================================

/**
 * DELETE /posts/{id}
 * Permanently delete a blog post
 * 
 * @param id - Post ID to delete
 * @returns void (204 No Content on success)
 * @throws ApiClientError with status 404 if post not found
 * @throws ApiClientError for other API errors
 * @throws Error for network failures
 * 
 * Warning: This operation is permanent and cannot be undone
 * 
 * @example
 * try {
 *   await deletePost(123);
 *   console.log('Post deleted successfully');
 * } catch (error) {
 *   if (isApiClientError(error) && error.statusCode === 404) {
 *     console.log('Post already deleted or does not exist');
 *   }
 * }
 */
export async function deletePost(id: number): Promise<void> {
  return fetchApi<void>(`/posts/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Batch Operations (Optional Utilities)
// ============================================================================

/**
 * Fetch multiple posts by IDs in parallel
 * 
 * @param ids - Array of post IDs to fetch
 * @returns Array of posts (successful fetches only)
 * 
 * Note: Failed fetches (404, etc.) are silently filtered out
 * Use individual getPost() if you need error handling per ID
 * 
 * @example
 * const posts = await getPostsByIds([1, 2, 3, 999]);
 * // Returns posts 1, 2, 3 (999 not found, filtered out)
 */
export async function getPostsByIds(ids: number[]): Promise<Post[]> {
  const promises = ids.map(id => 
    getPost(id).catch(() => null)
  );
  const results = await Promise.all(promises);
  return results.filter((post): post is Post => post !== null);
}

// ============================================================================
// Type Exports
// ============================================================================

// Re-export types for convenience
export type {
  Post,
  CreatePostInput,
  UpdatePostInput,
  HealthStatus,
};
