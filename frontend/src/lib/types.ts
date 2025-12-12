/**
 * Type definitions for the Blog Frontend application
 * Based on specs/003-frontend-blog-integration/data-model.md
 */

/**
 * Blog Post entity
 * Represents a complete blog post with all metadata
 */
export interface Post {
  /** Unique identifier (auto-generated) */
  id: number;
  
  /** Post title (1-200 characters) */
  title: string;
  
  /** URL-friendly slug (auto-generated from title) */
  slug: string;
  
  /** Post content (1-50000 characters, Markdown supported) */
  body: string;
  
  /** Firebase UID string of the post owner (matches backend auth model) */
  ownerId: string;
  
  /** ISO 8601 timestamp when post was created */
  createdAt: string;
  
  /** ISO 8601 timestamp when post was last updated */
  updatedAt: string;
}

/**
 * Input for creating a new post
 * Only title and body are required; other fields are auto-generated
 */
export interface CreatePostInput {
  /** Post title (required, 1-200 characters) */
  title: string;
  
  /** Post content (required, 1-50000 characters) */
  body: string;
}

/**
 * Input for updating an existing post
 * All fields are optional; only provided fields will be updated
 */
export interface UpdatePostInput {
  /** Updated post title (optional, 1-200 characters) */
  title?: string;
  
  /** Updated post content (optional, 1-50000 characters) */
  body?: string;
}

/**
 * API Error response structure (matches backend contract)
 * Returned when an API request fails
 * 
 * Backend format (phases 5/6 auth enforcement):
 * { error: { code, message, requestId?, validation? } }
 */
export interface ApiErrorResponse {
  error: {
    /** Error code identifier (e.g., 'VALIDATION_ERROR', 'UNAUTHORIZED', 'FORBIDDEN') */
    code: string;
    
    /** Human-readable error message */
    message: string;
    
    /** Request ID for tracing (optional) */
    requestId?: string;
    
    /** Validation errors for form fields (optional) */
    validation?: Array<{
      field: string;
      message: string;
    }>;
  };
}

/**
 * Health check response
 * Indicates API availability status
 */
export interface HealthStatus {
  /** API operational status - 'ok' indicates healthy, 'error' indicates unhealthy */
  status: 'ok' | 'error';
  
  /** ISO 8601 timestamp of health check */
  timestamp: string;
}

/**
 * Form validation errors
 * Maps field names to error messages
 */
export interface ValidationErrors {
  [key: string]: string;
}
