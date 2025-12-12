/**
 * Audit Logging Service
 * 
 * Provides structured audit logging for data mutations.
 * Logs are written using Pino logger with audit: true flag for filtering.
 */

/**
 * Audit action types
 */
export const AuditAction = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
};

/**
 * Audit target types
 */
export const AuditTargetType = {
  POST: 'post',
  USER: 'user',
};

/**
 * Audit Service class
 * Handles structured audit logging for mutations
 */
export class AuditService {
  /**
   * Create audit service instance
   * @param {Object} logger - Pino logger instance
   */
  constructor(logger) {
    this.logger = logger;
  }
  
  /**
   * Log an audit entry
   * @param {Object} params - Audit parameters
   * @param {string} params.action - Action type (create, update, delete)
   * @param {string} params.targetType - Resource type (e.g., 'post')
   * @param {string|number} params.targetId - Resource identifier
   * @param {string} params.userId - Firebase UID of actor
   * @param {string} params.requestId - Request correlation ID
   * @param {Object} [params.metadata] - Additional context
   */
  log({ action, targetType, targetId, userId, requestId, metadata = {} }) {
    this.logger.info({
      audit: true,
      requestId,
      userId,
      action,
      targetType,
      targetId: String(targetId),
      metadata,
      msg: `Audit: ${action} ${targetType} ${targetId}`,
    });
  }
  
  /**
   * Log a create operation
   * @param {Object} params - Audit parameters
   * @param {string} params.targetType - Resource type
   * @param {string|number} params.targetId - Resource ID
   * @param {string} params.userId - Actor's Firebase UID
   * @param {string} params.requestId - Request correlation ID
   * @param {Object} [params.data] - Created data (sanitized)
   * @param {string} [params.ip] - Client IP address
   */
  logCreate({ targetType, targetId, userId, requestId, data = null, ip = null }) {
    this.log({
      action: AuditAction.CREATE,
      targetType,
      targetId,
      userId,
      requestId,
      metadata: {
        ...(data && { data }),
        ...(ip && { ip }),
      },
    });
  }
  
  /**
   * Log an update operation
   * @param {Object} params - Audit parameters
   * @param {string} params.targetType - Resource type
   * @param {string|number} params.targetId - Resource ID
   * @param {string} params.userId - Actor's Firebase UID
   * @param {string} params.requestId - Request correlation ID
   * @param {Object} [params.before] - State before update
   * @param {Object} [params.after] - State after update
   * @param {string} [params.ip] - Client IP address
   */
  logUpdate({ targetType, targetId, userId, requestId, before = null, after = null, ip = null }) {
    this.log({
      action: AuditAction.UPDATE,
      targetType,
      targetId,
      userId,
      requestId,
      metadata: {
        ...(before && { before }),
        ...(after && { after }),
        ...(ip && { ip }),
      },
    });
  }
  
  /**
   * Log a delete operation
   * @param {Object} params - Audit parameters
   * @param {string} params.targetType - Resource type
   * @param {string|number} params.targetId - Resource ID
   * @param {string} params.userId - Actor's Firebase UID
   * @param {string} params.requestId - Request correlation ID
   * @param {Object} [params.data] - Deleted data (for recovery)
   * @param {string} [params.ip] - Client IP address
   */
  logDelete({ targetType, targetId, userId, requestId, data = null, ip = null }) {
    this.log({
      action: AuditAction.DELETE,
      targetType,
      targetId,
      userId,
      requestId,
      metadata: {
        ...(data && { data }),
        ...(ip && { ip }),
      },
    });
  }
  
  /**
   * Sanitize sensitive fields from data before logging
   * @param {Object} data - Data to sanitize
   * @param {string[]} sensitiveFields - Fields to remove
   * @returns {Object} Sanitized data
   */
  static sanitize(data, sensitiveFields = ['password', 'passwordHash', 'token']) {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    const sanitized = { ...data };
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}

/**
 * Create audit service instance from Fastify instance
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 * @returns {AuditService} Audit service instance
 */
export function createAuditService(fastify) {
  return new AuditService(fastify.log);
}
