/**
 * Authorization Middleware
 * 
 * Provides role-based authorization for protected resources.
 * Implements owner-or-admin access pattern for post mutations.
 */

import fp from 'fastify-plugin';
import { UserRole } from '../models/firebase-user.js';

/**
 * Authorization Error class
 */
export class AuthorizationError extends Error {
  constructor(message = 'Not authorized to access this resource', code = 'FORBIDDEN') {
    super(message);
    this.name = 'AuthorizationError';
    this.code = code;
    this.statusCode = 403;
  }
}

/**
 * Not Owner Error - specific error for ownership violations
 */
export class NotOwnerError extends AuthorizationError {
  constructor(message = 'You can only modify your own posts') {
    super(message, 'NOT_OWNER');
  }
}

/**
 * Authorization Plugin
 * Adds authorization decorators to Fastify
 * 
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
async function authorizationPluginInner(fastify) {
  /**
   * Check if the current user is an admin
   * @param {import('fastify').FastifyRequest} request - Fastify request
   * @returns {boolean} True if user is admin
   */
  function isAdmin(request) {
    return request.firebaseUser?.isAdmin === true || 
           request.firebaseUser?.role === UserRole.ADMIN;
  }
  
  /**
   * Check if the current user owns a resource
   * @param {import('fastify').FastifyRequest} request - Fastify request
   * @param {string} ownerId - Resource owner's UID
   * @returns {boolean} True if user owns the resource
   */
  function isOwner(request, ownerId) {
    const userId = request.firebaseUser?.uid;
    if (!userId || !ownerId) {
      return false;
    }
    return userId === ownerId;
  }
  
  /**
   * Check if the current user can modify a resource (is owner OR admin)
   * @param {import('fastify').FastifyRequest} request - Fastify request
   * @param {string} ownerId - Resource owner's UID
   * @returns {boolean} True if user can modify
   */
  function canModify(request, ownerId) {
    return isOwner(request, ownerId) || isAdmin(request);
  }
  
  /**
   * Require that the current user is an admin
   * Use as preHandler for admin-only routes
   * 
   * @param {import('fastify').FastifyRequest} request - Fastify request
   * @param {import('fastify').FastifyReply} reply - Fastify reply
   * @throws {AuthorizationError} If user is not an admin
   */
  async function requireAdmin(request, reply) {
    if (!request.firebaseUser) {
      throw new AuthorizationError('Authentication required', 'AUTH_REQUIRED');
    }
    
    if (!isAdmin(request)) {
      throw new AuthorizationError('Admin access required', 'ADMIN_REQUIRED');
    }
  }
  
  /**
   * Create a preHandler that requires owner or admin access
   * The ownerId is extracted from the resource using a getter function
   * 
   * @param {Function} getOwnerId - Async function to get owner ID from request
   * @returns {Function} preHandler function
   * 
   * @example
   * // In route definition:
   * preHandler: [
   *   fastify.verifyFirebaseToken,
   *   fastify.requireOwnerOrAdmin(async (request) => {
   *     const post = await storage.getById(request.params.id);
   *     return post?.ownerId;
   *   })
   * ]
   */
  function requireOwnerOrAdmin(getOwnerId) {
    return async function checkOwnership(request, reply) {
      if (!request.firebaseUser) {
        throw new AuthorizationError('Authentication required', 'AUTH_REQUIRED');
      }
      
      const ownerId = await getOwnerId(request);
      
      if (ownerId === null || ownerId === undefined) {
        // Resource not found - let the route handler deal with 404
        return;
      }
      
      if (!canModify(request, ownerId)) {
        throw new NotOwnerError();
      }
      
      // Attach ownership info to request for audit logging
      request.resourceOwner = ownerId;
      request.isOwnerAccess = isOwner(request, ownerId);
      request.isAdminAccess = isAdmin(request);
    };
  }
  
  /**
   * Simple ownership check that takes ownerId directly
   * Use when you already have the ownerId from a previous operation
   * 
   * @param {import('fastify').FastifyRequest} request - Fastify request
   * @param {string} ownerId - Resource owner's UID
   * @throws {NotOwnerError} If user cannot modify
   */
  function checkOwnership(request, ownerId) {
    if (!request.firebaseUser) {
      throw new AuthorizationError('Authentication required', 'AUTH_REQUIRED');
    }
    
    if (!canModify(request, ownerId)) {
      throw new NotOwnerError();
    }
  }
  
  // Decorate Fastify with authorization utilities
  fastify.decorate('isAdmin', isAdmin);
  fastify.decorate('isOwner', isOwner);
  fastify.decorate('canModify', canModify);
  fastify.decorate('requireAdmin', requireAdmin);
  fastify.decorate('requireOwnerOrAdmin', requireOwnerOrAdmin);
  fastify.decorate('checkOwnership', checkOwnership);
  
  // Decorate request with ownership info
  fastify.decorateRequest('resourceOwner', null);
  fastify.decorateRequest('isOwnerAccess', false);
  fastify.decorateRequest('isAdminAccess', false);
}

// Export plugin with fastify-plugin
export const authorizationPlugin = fp(authorizationPluginInner, {
  name: 'authorization-plugin',
  dependencies: ['firebase-auth-plugin'],
});
