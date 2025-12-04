/**
 * Fastify HTTP Server
 * 
 * Entry point for the Blog Posts API.
 * Configures Fastify with middleware, routes, and error handling.
 */

import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyRequestContext from '@fastify/request-context';
import { randomUUID } from 'crypto';
import { errorHandler } from './middleware/error-handler.js';
import { MemoryStorage } from './storage/memory-storage.js';
import { healthRoutes } from './routes/health.js';
import { postsRoutes } from './routes/posts.js';

// Environment configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';
const STORAGE_TYPE = process.env.STORAGE_TYPE || (NODE_ENV === 'production' ? 'sqlite' : 'memory');
const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH || './data/blog.db';
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
const FIRESTORE_COLLECTION = process.env.FIRESTORE_COLLECTION || 'posts';
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10); // 1 minute default

/**
 * Create storage adapter based on configuration
 * Uses dynamic import for SQLite to avoid loading native module when not needed
 */
async function createStorage() {
  if (STORAGE_TYPE === 'firestore') {
    if (!GCP_PROJECT_ID) {
      throw new Error('GCP_PROJECT_ID is required when using Firestore storage');
    }
    const { FirestoreStorage } = await import('./storage/firestore-storage.js');
    return new FirestoreStorage({
      projectId: GCP_PROJECT_ID,
      collection: FIRESTORE_COLLECTION
    });
  }

  if (STORAGE_TYPE === 'sqlite') {
    const { SQLiteStorage } = await import('./storage/sqlite-storage.js');
    return new SQLiteStorage(SQLITE_DB_PATH);
  }
  return new MemoryStorage();
}

/**
 * Create and configure Fastify instance
 */
export async function createServer(options = {}) {
  const fastify = Fastify({
    logger: NODE_ENV === 'production' ? {
      level: 'info',
      serializers: {
        req(request) {
          return {
            method: request.method,
            url: request.url,
            requestId: request.id
          };
        }
      }
    } : {
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      }
    },
    genReqId: (req) => req.headers['x-request-id'] || randomUUID(),
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    ...options
  });

  // Register request context for request ID tracking (if not in test mode)
  if (!options.skipRequestContext) {
    fastify.register(fastifyRequestContext, {
      hook: 'preValidation',
      defaultStoreValues: (req) => ({
        requestId: req?.id || 'unknown'
      })
    });
  }

  // Initialize storage adapter based on configuration (dynamic import for SQLite)
  const storage = await createStorage();
  
  fastify.decorate('storage', storage);
  
  // Log storage type on startup
  fastify.log.info(`Using ${STORAGE_TYPE} storage adapter`);

  // Register Swagger for OpenAPI documentation
  fastify.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Blog Posts API',
        description: 'A production-shaped REST API for blog post management with CRUD operations, validation, error handling, rate limiting, and swappable persistence.',
        version: '1.0.0',
        contact: {
          name: 'Training Project',
          url: 'https://github.com/Maximus-Technologies-Uganda/training-hamza'
        }
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Local development server'
        }
      ],
      tags: [
        { name: 'health', description: 'Service health monitoring' },
        { name: 'posts', description: 'Blog post CRUD operations' }
      ]
    }
  });

  // Register Swagger UI
  fastify.register(swaggerUi, {
    routePrefix: '/docs',
    exposeRoute: true,
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true
    },
    staticCSP: true,
    transformStaticCSP: (header) => header
  });

  // Register CORS (skip in test mode if requested)
  if (!options.skipCors) {
    fastify.register(cors, {
      origin: NODE_ENV === 'production' 
        ? (origin, cb) => {
            // In production, whitelist specific origins
            const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
            if (!origin || allowedOrigins.includes(origin)) {
              cb(null, true);
            } else {
              cb(new Error('Not allowed by CORS'), false);
            }
          }
        : true, // Allow all origins in development
      credentials: false,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
    });
  }

  // Register security headers with Helmet (skip in test mode if requested)
  if (!options.skipHelmet) {
    fastify.register(helmet, {
      contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false, // Disable CSP in dev for Swagger UI
      global: true
    });
  }

  // Register rate limiting middleware (before routes)
  fastify.register(rateLimit, {
    max: RATE_LIMIT_MAX,
    timeWindow: RATE_LIMIT_WINDOW,
    errorResponseBuilder: (request, context) => {
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.'
      };
    },
    addHeadersOnExceeding: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true
    },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true
    }
  });

  // Register error handler
  fastify.setErrorHandler(errorHandler);

  // Register routes
  fastify.register(healthRoutes);
  fastify.register(postsRoutes);

  return fastify;
}

/**
 * Start the server
 */
async function start() {
  const server = await createServer();

  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`✓ Server listening on http://${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Start server if running as main module
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  start();
}

export default createServer;
