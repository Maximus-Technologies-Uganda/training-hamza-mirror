/**
 * Health Check Route
 * 
 * Provides a simple health check endpoint for monitoring and load balancers.
 * Returns 200 OK with status, version, uptime, and timestamp when the service is operational.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('../../../package.json');

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
          required: ['status', 'version', 'uptime', 'timestamp'],
          properties: {
            status: { type: 'string' },
            version: { type: 'string' },
            uptime: { type: 'number' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, async (request, reply) => {
    return {
      status: 'ok',
      version: pkg.version,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  });
}
