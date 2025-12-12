/**
 * Request ID Middleware
 * 
 * Handles X-Request-Id propagation for request tracing.
 * Uses Fastify's request.id as the single source of truth.
 * Adds request ID to all responses.
 */

import fp from 'fastify-plugin';

/**
 * Register request-id hooks on the Fastify instance
 * 
 * This middleware:
 * 1. Uses Fastify's request.id as the single source of truth
 *    (Fastify's genReqId in server.js handles client X-Request-Id or generates UUID)
 * 2. Asserts/stashes requestId early via onRequest hook for upstream consumers
 * 3. Adds X-Request-Id to all responses using request.id
 * 
 * NOTE: Fastify's genReqId config in server.js already handles:
 *   - Using client-provided X-Request-Id header if present
 *   - Generating a UUID if no client header provided
 * This plugin ensures the ID is available early and appears in response headers.
 * 
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
async function requestIdPluginInner(fastify) {
  // onRequest: Assert/stash requestId early in the lifecycle
  // This ensures requestId is available to any hook or handler that runs before onSend
  fastify.addHook('onRequest', async (request) => {
    // Stash requestId in request context for easy access by other middleware/handlers
    // request.id is already set by Fastify's genReqId at this point
    // Note: @fastify/request-context provides request.requestContext as a getter,
    // so we use its .set() method if available, otherwise use the getter's store
    if (request.requestContext && typeof request.requestContext.set === 'function') {
      request.requestContext.set('requestId', request.id);
    } else if (request.requestContext) {
      // requestContext from @fastify/request-context is a Map-like store
      request.requestContext.requestId = request.id;
    }
  });

  // onSend: Add X-Request-Id header to all responses
  // Uses request.id which is set by Fastify's genReqId function
  fastify.addHook('onSend', async (request, reply) => {
    // request.id is the single source of truth (set by genReqId in server.js)
    if (request.id) {
      reply.header('X-Request-Id', request.id);
    }
  });
}

// Export with fastify-plugin to break encapsulation
// This ensures the hook applies to all routes
export const requestIdPlugin = fp(requestIdPluginInner, {
  name: 'request-id-plugin'
});

/**
 * Get request ID from request object
 * @param {import('fastify').FastifyRequest} request - Fastify request
 * @returns {string} Request ID
 */
export function getRequestId(request) {
  // request.id is the single source of truth
  return request.id || 'unknown';
}
