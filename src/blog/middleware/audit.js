/**
 * Audit Logging Middleware
 * 
 * Wraps route handlers to automatically log audit entries for mutations.
 * Integrates with the AuditService for structured logging.
 */

import fp from 'fastify-plugin';
import { AuditService, AuditTargetType, AuditAction } from '../services/audit-service.js';

/**
 * Get client IP address from request
 * Handles X-Forwarded-For header when behind a proxy
 * 
 * @param {import('fastify').FastifyRequest} request - Fastify request
 * @returns {string} Client IP address
 */
function getClientIP(request) {
  // Trust X-Forwarded-For only if trustProxy is enabled
  const forwardedFor = request.headers['x-forwarded-for'];
  if (forwardedFor && request.server.trustProxy) {
    // Get first IP from comma-separated list
    return forwardedFor.split(',')[0].trim();
  }
  return request.ip;
}

/**
 * Audit Middleware Plugin
 * Decorates Fastify with audit logging utilities
 * 
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
async function auditPluginInner(fastify) {
  // Create audit service instance
  const auditService = new AuditService(fastify.log);
  
  // Decorate fastify with audit service
  fastify.decorate('auditService', auditService);
  
  /**
   * Create an audit context from the current request
   * @param {import('fastify').FastifyRequest} request - Fastify request
   * @returns {Object} Audit context with userId, requestId, ip
   */
  function getAuditContext(request) {
    return {
      userId: request.firebaseUser?.uid || request.user?.id || 'anonymous',
      requestId: request.id,
      ip: getClientIP(request),
    };
  }
  
  /**
   * Log a create audit entry
   * @param {import('fastify').FastifyRequest} request - Fastify request
   * @param {string} targetType - Resource type
   * @param {string|number} targetId - Created resource ID
   * @param {Object} [data] - Created data
   */
  function logCreate(request, targetType, targetId, data = null) {
    const context = getAuditContext(request);
    auditService.logCreate({
      targetType,
      targetId,
      ...context,
      data: data ? AuditService.sanitize(data) : null,
    });
  }
  
  /**
   * Log an update audit entry
   * @param {import('fastify').FastifyRequest} request - Fastify request
   * @param {string} targetType - Resource type
   * @param {string|number} targetId - Updated resource ID
   * @param {Object} [before] - State before update
   * @param {Object} [after] - State after update
   */
  function logUpdate(request, targetType, targetId, before = null, after = null) {
    const context = getAuditContext(request);
    auditService.logUpdate({
      targetType,
      targetId,
      ...context,
      before: before ? AuditService.sanitize(before) : null,
      after: after ? AuditService.sanitize(after) : null,
    });
  }
  
  /**
   * Log a delete audit entry
   * @param {import('fastify').FastifyRequest} request - Fastify request
   * @param {string} targetType - Resource type
   * @param {string|number} targetId - Deleted resource ID
   * @param {Object} [data] - Deleted data for recovery
   */
  function logDelete(request, targetType, targetId, data = null) {
    const context = getAuditContext(request);
    auditService.logDelete({
      targetType,
      targetId,
      ...context,
      data: data ? AuditService.sanitize(data) : null,
    });
  }
  
  // Decorate request with audit helper methods
  fastify.decorateRequest('auditCreate', null);
  fastify.decorateRequest('auditUpdate', null);
  fastify.decorateRequest('auditDelete', null);
  
  // Add hooks to bind audit methods to each request
  fastify.addHook('onRequest', async (request) => {
    request.auditCreate = (targetType, targetId, data) => logCreate(request, targetType, targetId, data);
    request.auditUpdate = (targetType, targetId, before, after) => logUpdate(request, targetType, targetId, before, after);
    request.auditDelete = (targetType, targetId, data) => logDelete(request, targetType, targetId, data);
  });
}

// Export plugin with fastify-plugin
export const auditPlugin = fp(auditPluginInner, {
  name: 'audit-plugin',
});

export { getClientIP };
