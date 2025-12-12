/**
 * Health Check Route
 * 
 * Provides a simple health check endpoint for monitoring and load balancers.
 * Returns 200 OK with status, version, uptime, and timestamp when the service is operational.
 */

import { createRequire } from 'module';
import { verifyFirebaseConnection } from '../services/firebase-admin.js';

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

  // GET /health/ready - Readiness check endpoint
  fastify.get('/health/ready', {
    schema: {
      description: 'Check API readiness (database and Firebase connectivity)',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          required: ['status', 'checks', 'timestamp'],
          properties: {
            status: { type: 'string', enum: ['ready', 'degraded'] },
            checks: {
              type: 'object',
              properties: {
                database: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['ok', 'error'] },
                    error: { type: 'string' }
                  }
                },
                firebase: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['ok', 'error'] },
                    connected: { type: 'boolean' },
                    projectId: { type: 'string' },
                    emulator: { type: 'boolean' },
                    error: { type: 'string' }
                  }
                }
              }
            },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        503: {
          type: 'object',
          required: ['status', 'checks', 'timestamp'],
          properties: {
            status: { type: 'string', enum: ['not_ready'] },
            checks: {
              type: 'object',
              properties: {
                database: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['ok', 'error'] },
                    error: { type: 'string' }
                  }
                },
                firebase: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['ok', 'error'] },
                    connected: { type: 'boolean' },
                    projectId: { type: 'string' },
                    emulator: { type: 'boolean' },
                    error: { type: 'string' }
                  }
                }
              }
            },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const checks = {
      database: { status: 'ok' },
      firebase: { status: 'ok', connected: false, projectId: null, emulator: false }
    };

    // Check database connectivity
    try {
      // Access the storage instance via fastify decorator
      const storage = fastify.storage;
      
      if (storage && storage.db) {
        // For SQLite storage, try a simple query
        storage.db.prepare('SELECT 1').get();
        checks.database.status = 'ok';
      } else if (storage && typeof storage.healthCheck === 'function') {
        // For other storage types (Firestore, Memory), call healthCheck if available
        await storage.healthCheck();
        checks.database.status = 'ok';
      } else {
        // No storage available or no way to check
        checks.database.status = 'ok'; // Assume ok if no storage check available
      }
    } catch (error) {
      checks.database.status = 'error';
      checks.database.error = error.message;
    }

    // Check Firebase connectivity
    try {
      const firebaseCheck = await verifyFirebaseConnection();
      checks.firebase = {
        status: firebaseCheck.connected ? 'ok' : 'error',
        connected: firebaseCheck.connected,
        projectId: firebaseCheck.projectId,
        emulator: firebaseCheck.emulator || false,
        error: firebaseCheck.error
      };
    } catch (error) {
      checks.firebase = {
        status: 'error',
        connected: false,
        projectId: null,
        emulator: false,
        error: error.message
      };
    }

    // Determine overall status
    const allOk = checks.database.status === 'ok' && checks.firebase.status === 'ok';
    const anyError = checks.database.status === 'error' || checks.firebase.status === 'error';

    if (anyError) {
      reply.code(503);
      return {
        status: 'not_ready',
        checks,
        timestamp: new Date().toISOString()
      };
    }

    return {
      status: allOk ? 'ready' : 'degraded',
      checks,
      timestamp: new Date().toISOString()
    };
  });
}
