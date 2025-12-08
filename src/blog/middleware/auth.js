/**
 * Authentication Middleware
 * 
 * Provides JWT authentication decorator for protected routes.
 * Uses @fastify/jwt plugin for token verification.
 */

import fp from 'fastify-plugin';
import { UnauthorizedError, InvalidTokenError } from './error-handler.js';

/**
 * Register the authenticate decorator on the Fastify instance
 * 
 * Usage in routes:
 *   fastify.post('/posts', { preHandler: [fastify.authenticate] }, handler)
 * 
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
async function authPluginInner(fastify) {
  /**
   * Authenticate decorator - verifies JWT token
   * Adds decoded token to request.user
   * 
   * @param {import('fastify').FastifyRequest} request - Fastify request
   * @param {import('fastify').FastifyReply} reply - Fastify reply
   * @throws {UnauthorizedError} If no token provided
   * @throws {InvalidTokenError} If token is invalid or expired
   */
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      // jwtVerify extracts token from Authorization header and verifies it
      // On success, decoded token is attached to request.user
      await request.jwtVerify();
    } catch (err) {
      // Map JWT errors to our custom error types
      if (err.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER' || 
          err.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
        throw new UnauthorizedError('Authentication required');
      }
      if (err.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
        throw new InvalidTokenError('Token expired');
      }
      // For any other JWT error, treat as invalid token
      throw new InvalidTokenError('Invalid token');
    }
  });
}

// Export with fastify-plugin to break encapsulation
// This makes fastify.authenticate available to all routes
export const authPlugin = fp(authPluginInner, {
  name: 'auth-plugin',
  dependencies: ['@fastify/jwt']
});
