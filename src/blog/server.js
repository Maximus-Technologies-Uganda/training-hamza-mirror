/**
 * Fastify HTTP Server
 * 
 * Entry point for the Blog Posts API.
 * Configures Fastify with middleware, routes, and error handling.
 */

import 'dotenv/config';
import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import fastifyRequestContext from '@fastify/request-context';
import { randomUUID, randomBytes } from 'crypto';
import { errorHandler } from './middleware/error-handler.js';
import { requestIdPlugin } from './middleware/request-id.js';
import { authPlugin } from './middleware/auth.js';
import { firebaseAuthPlugin } from './middleware/firebase-auth.js';
import { authorizationPlugin } from './middleware/authorization.js';
import { csrfPlugin } from './middleware/csrf.js';
import { auditPlugin } from './middleware/audit.js';
import { generateMutationRateLimitKey, generateGlobalRateLimitKey, createRateLimitErrorResponse } from './middleware/rate-limit.js';
import { MemoryStorage } from './storage/memory-storage.js';
import { UserService } from './services/user-service.js';
import { healthRoutes } from './routes/health.js';
import { postsRoutes } from './routes/posts.js';
import { authRoutes } from './routes/auth.js';

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

// Rate limiting for mutations (per spec: 10 req/min per user)
const MUTATION_RATE_LIMIT_MAX = parseInt(process.env.MUTATION_RATE_LIMIT_MAX || '10', 10);
const MUTATION_RATE_LIMIT_WINDOW = parseInt(process.env.MUTATION_RATE_LIMIT_WINDOW || '60000', 10); // 1 minute

// Use JWT Auth instead of Firebase Auth (for local testing with newman/postman)
// Default to JWT in non-production unless explicitly disabled
const USE_JWT_AUTH = process.env.USE_JWT_AUTH !== 'false';

// Auto-generate JWT_SECRET in development if not provided
// In production, JWT_SECRET must be explicitly set
let JWT_SECRET = process.env.JWT_SECRET;
let generatedDevSecret = false;
if (!JWT_SECRET && NODE_ENV !== 'production') {
  JWT_SECRET = randomBytes(32).toString('hex');
  generatedDevSecret = true;
}

// Trust proxy headers only when explicitly enabled or running on Cloud Run (K_SERVICE is set by Cloud Run)
// SECURITY: Do not enable in untrusted environments - attackers can spoof X-Forwarded-For to bypass rate limiting
const TRUST_PROXY = process.env.TRUST_PROXY === 'true' || !!process.env.K_SERVICE;

/**
 * Validate required environment variables
 * Fail-fast if JWT_SECRET is missing in production
 */
function validateEnvironment({ jwtSecret } = {}) {
  if (!jwtSecret && !JWT_SECRET && NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
}

function resolveJwtSecret(options = {}) {
  const secret = options.jwtSecret ?? JWT_SECRET;
  if (!secret && NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  if (!secret) {
    // This shouldn't happen since we auto-generate in dev, but just in case
    throw new Error('JWT_SECRET environment variable is required. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  return secret;
}

/**
 * Create storage adapter based on configuration
 * Uses dynamic import for SQLite to avoid loading native module when not needed
 */
async function createStorage() {
  const effectiveStorage = NODE_ENV === 'test' ? 'memory' : STORAGE_TYPE;

  if (effectiveStorage === 'firestore') {
    // In non-production, avoid reaching out to Firestore unless explicitly forced
    if (NODE_ENV !== 'production') {
      console.warn('[WARN] Firestore storage disabled in non-production; using in-memory storage instead. Set STORAGE_TYPE=firestore with proper credentials to enable.');
      return new MemoryStorage();
    }

    if (!GCP_PROJECT_ID) {
      throw new Error('GCP_PROJECT_ID is required when using Firestore storage');
    }
    const { FirestoreStorage } = await import('./storage/firestore-storage.js');
    return new FirestoreStorage({
      projectId: GCP_PROJECT_ID,
      collection: FIRESTORE_COLLECTION
    });
  }

  if (effectiveStorage === 'sqlite') {
    const { SQLiteStorage } = await import('./storage/sqlite-storage.js');
    return new SQLiteStorage(SQLITE_DB_PATH);
  }
  return new MemoryStorage();
}

/**
 * Create and configure Fastify instance
 */
export async function createServer(options = {}) {
  const {
    skipRequestContext,
    skipCors,
    skipHelmet,
    skipRateLimiting,
    skipCSRF,
    jwtSecret: providedJwtSecret,
    logger: providedLogger,
    useJwtAuth = USE_JWT_AUTH,
    ...fastifyOptions
  } = options;

  validateEnvironment({ jwtSecret: providedJwtSecret });

  const fastify = Fastify({
    // Trust proxy headers (X-Forwarded-For) only when behind a trusted proxy like Cloud Run
    // SECURITY: Disabled by default to prevent X-Forwarded-For spoofing attacks on rate limiting
    // Enable via TRUST_PROXY=true env var or automatically on Cloud Run (K_SERVICE detected)
    trustProxy: TRUST_PROXY,
    // Pino logger configuration with audit log support
    // Audit logs are tagged with { audit: true } for filtering
    // Filter audit logs with: jq 'select(.audit == true)' logs.json
    logger: providedLogger ?? (NODE_ENV === 'production' ? {
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
    }),
    genReqId: (req) => req.headers['x-request-id'] || randomUUID(),
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    ...fastifyOptions
  });

  // Register request context for request ID tracking (if not in test mode)
  if (!skipRequestContext) {
    fastify.register(fastifyRequestContext, {
      hook: 'preValidation',
      defaultStoreValues: {
        requestId: () => randomUUID()
      }
    });
  }

  // Initialize storage adapter based on configuration (dynamic import for SQLite)
  const storage = await createStorage();
  
  fastify.decorate('storage', storage);
  
  // Log storage type on startup (note: tests force memory; firestore is disabled in non-prod unless explicitly enabled)
  const storageTypeForLog = NODE_ENV === 'test'
    ? 'memory (forced for test)'
    : (STORAGE_TYPE === 'firestore' && NODE_ENV !== 'production')
      ? 'memory (firestore disabled in non-prod)'
      : STORAGE_TYPE;
  fastify.log.info(`Using ${storageTypeForLog} storage adapter`);

  // Register request-id middleware (adds X-Request-Id to all responses)
  fastify.register(requestIdPlugin);

  // Register cookie plugin (required for CSRF middleware)
  await fastify.register(cookie, {
    secret: providedJwtSecret || JWT_SECRET, // Use same secret for signed cookies
    parseOptions: {}
  });

  // Register JWT plugin for authentication (fails fast if secret is missing)
  const jwtSecret = resolveJwtSecret({ jwtSecret: providedJwtSecret });
  await fastify.register(jwt, { secret: jwtSecret });
  
  // Register auth middleware (adds fastify.authenticate decorator)
  await fastify.register(authPlugin);
  
  // Register Firebase Auth middleware (adds verifyFirebaseToken, optionalFirebaseAuth)
  // In test mode with useJwtAuth: true, uses Fastify JWT instead of Firebase Admin SDK
  await fastify.register(firebaseAuthPlugin, { useJwtAuth });
  
  // Register authorization middleware (adds requireOwnerOrAdmin, requireAdmin)
  await fastify.register(authorizationPlugin);
  
  // Register CSRF middleware (adds setCSRFToken, requireCSRF)
  // In test mode with skipCSRF: true, CSRF validation is disabled
  await fastify.register(csrfPlugin, { disabled: skipCSRF });
  
  // Register audit logging middleware (adds auditService, request.auditCreate/Update/Delete)
  await fastify.register(auditPlugin);
  
  if (useJwtAuth) {
    fastify.log.info('JWT authentication mode enabled (USE_JWT_AUTH=true) - use /auth/login for tokens');
  } else {
    fastify.log.info('Firebase authentication enabled');
  }

  // Populate firebaseUser early so rate limit keys can use per-user identity even in onRequest
  fastify.addHook('onRequest', fastify.optionalFirebaseAuth);

  // Create UserService and decorate fastify instance
  const userService = new UserService(storage);
  fastify.decorate('userService', userService);

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
  if (!skipCors) {
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
      credentials: true, // Required for cookies (CSRF)
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-CSRF-Token']
    });
  }

  // Register security headers with Helmet (skip in test mode if requested)
  if (!skipHelmet) {
    fastify.register(helmet, {
      contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false, // Disable CSP in dev for Swagger UI
      global: true
    });
  }

  // Register rate limiting middleware (before routes) - skip in test mode if requested
  if (!skipRateLimiting) {
    // Global rate limiting (100 req/min default)
    fastify.register(rateLimit, {
      global: true,
      max: RATE_LIMIT_MAX,
      timeWindow: RATE_LIMIT_WINDOW,
      // Key generator: use user ID if authenticated, otherwise IP
      keyGenerator: generateGlobalRateLimitKey,
      errorResponseBuilder: (request) => {
        const retryAfter = Math.ceil(RATE_LIMIT_WINDOW / 1000);
        return createRateLimitErrorResponse(request, retryAfter);
      },
      addHeadersOnExceeding: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true
      },
      addHeaders: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
        'retry-after': true
      }
    });
  }
  
  // Decorate fastify with mutation rate limit config for use in routes
  // Routes apply this as route-specific config for POST, PATCH, DELETE
  fastify.decorate('mutationRateLimitConfig', {
    max: MUTATION_RATE_LIMIT_MAX,
    timeWindow: MUTATION_RATE_LIMIT_WINDOW,
    keyGenerator: generateMutationRateLimitKey,
    errorResponseBuilder: (request) => {
      const retryAfter = Math.ceil(MUTATION_RATE_LIMIT_WINDOW / 1000);
      return createRateLimitErrorResponse(request, retryAfter);
    },
    addHeadersOnExceeding: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true
    },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true
    }
  });

  // Register error handler
  fastify.setErrorHandler(errorHandler);

  // Register routes
  fastify.register(healthRoutes);
  fastify.register(postsRoutes);
  fastify.register(authRoutes);

  return fastify;
}

/**
 * Start the server
 */
async function start() {
  // Validate required environment variables before starting
  validateEnvironment();
  
  const server = await createServer();

  try {
    // Seed users for environment
    if (NODE_ENV === 'production') {
      const bootstrapUsername = process.env.ADMIN_USERNAME
        || process.env.DEFAULT_ADMIN_USERNAME
        || 'admin';
      const bootstrapPassword = process.env.ADMIN_PASSWORD
        || process.env.DEFAULT_ADMIN_PASSWORD;

      const bootstrapResult = await server.userService.ensureAdminUser({
        username: bootstrapUsername,
        password: bootstrapPassword,
        logger: server.log
      });

      if (!bootstrapResult.created && bootstrapResult.reason === 'users-exist') {
        server.log.info('Existing users detected; skipping bootstrap admin creation');
      } else if (!bootstrapResult.created && bootstrapResult.reason === 'username-exists') {
        server.log.info('Bootstrap admin username already exists; no new user created');
      }
    } else {
      await server.userService.seedTestUsers();
    }
    
    await server.listen({ port: PORT, host: HOST });
    console.log(`[OK] Server listening on http://${HOST}:${PORT}`);
    
    // Warn about auto-generated JWT secret in development
    if (generatedDevSecret) {
      server.log.warn('JWT_SECRET was auto-generated for development. Set JWT_SECRET env var for persistent sessions.');
    }
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
