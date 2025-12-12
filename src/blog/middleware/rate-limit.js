/**
 * Rate Limit Middleware
 * 
 * Provides key generation and utilities for rate limiting.
 * Used by @fastify/rate-limit for per-user and per-IP rate limiting.
 */

/**
 * Generate rate limit key based on user authentication status
 * 
 * For authenticated users: Uses Firebase UID for accurate per-user tracking
 * For unauthenticated users: Uses IP address
 * 
 * @param {Object} request - Fastify request object
 * @param {string} prefix - Prefix for the key (e.g., 'mutation', 'global')
 * @returns {string} Rate limit key
 */
export function generateRateLimitKey(request, prefix = 'global') {
  // Priority: Firebase UID > Legacy user ID > IP address
  const identifier = request.firebaseUser?.uid || request.user?.id || request.ip;
  return `${prefix}:${identifier}`;
}

/**
 * Generate rate limit key for mutation endpoints (POST, PATCH, DELETE)
 * 
 * @param {Object} request - Fastify request object
 * @returns {string} Rate limit key for mutations
 */
export function generateMutationRateLimitKey(request) {
  return generateRateLimitKey(request, 'mutation');
}

/**
 * Generate rate limit key for global endpoints
 * 
 * @param {Object} request - Fastify request object
 * @returns {string} Rate limit key for global rate limiting
 */
export function generateGlobalRateLimitKey(request) {
  return generateRateLimitKey(request, 'global');
}

/**
 * Create error response for rate limit exceeded
 * Follows the API error format: { error: { code, message, requestId, retryAfter } }
 * 
 * @param {Object} request - Fastify request object
 * @param {number} retryAfterSeconds - Seconds until retry is allowed
 * @returns {Object} Error response object
 */
export function createRateLimitErrorResponse(request, retryAfterSeconds) {
  const requestId = request.id || 'unknown';
  return {
    error: {
      code: 'RATE_LIMITED',
      message: `Too many requests. Please wait ${retryAfterSeconds} seconds before trying again.`,
      requestId,
      retryAfter: retryAfterSeconds
    }
  };
}

/**
 * Fastify plugin to register rate limit utilities
 * Decorates fastify instance with rate limit helper functions
 * 
 * @param {Object} fastify - Fastify instance
 */
export async function rateLimitUtilsPlugin(fastify) {
  fastify.decorate('rateLimitUtils', {
    generateRateLimitKey,
    generateMutationRateLimitKey,
    generateGlobalRateLimitKey,
    createRateLimitErrorResponse
  });
}
