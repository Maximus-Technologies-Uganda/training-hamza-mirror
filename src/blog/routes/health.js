/**
 * Health Check Route
 * 
 * Provides a simple health check endpoint for monitoring and load balancers.
 * Returns 200 OK with current timestamp when the service is operational.
 */

/**
 * Register health check routes
 * @param {Object} fastify - Fastify instance
 */
export async function healthRoutes(fastify) {
  // GET /health - Health check endpoint
  fastify.get('/health', {
    schema: {
      description: 'Check API health status',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  });
}
