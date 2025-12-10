/**
 * Auth Routes
 * 
 * Authentication endpoints for the Blog API.
 * Provides login endpoint with JWT token generation.
 */

import { AuthService } from '../services/auth-service.js';
import { UnauthorizedError, ValidationError } from '../middleware/error-handler.js';

/**
 * Login request schema
 */
const loginSchema = {
  type: 'object',
  required: ['username', 'password'],
  properties: {
    username: {
      type: 'string',
      minLength: 1,
      maxLength: 50
    },
    password: {
      type: 'string',
      minLength: 1,
      maxLength: 128
    }
  }
};

/**
 * Login response schema
 */
const loginResponseSchema = {
  type: 'object',
  properties: {
    token: { type: 'string' },
    user: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        username: { type: 'string' }
      }
    }
  }
};

/**
 * Session response schema (Firebase Auth)
 */
const sessionResponseSchema = {
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: {
        uid: { type: 'string' },
        email: { type: 'string' },
        displayName: { type: ['string', 'null'] },
        role: { type: 'string' },
        isAdmin: { type: 'boolean' }
      }
    }
  }
};

/**
 * Register auth routes
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
export async function authRoutes(fastify) {
  const authService = new AuthService(fastify);

  // POST /auth/login - Authenticate user and return JWT (legacy)
  fastify.post('/auth/login', {
    config: {
      // Stricter rate limiting for login endpoint
      rateLimit: {
        max: 10, // 10 attempts per window
        timeWindow: '1 minute'
      }
    },
    schema: {
      description: 'Authenticate with username and password to receive a JWT token',
      tags: ['auth'],
      body: loginSchema,
      response: {
        200: loginResponseSchema
      }
    }
  }, async (request, reply) => {
    const { username, password } = request.body;

    // Block system accounts from logging in
    const SYSTEM_USERNAMES = ['_system_migration'];
    if (SYSTEM_USERNAMES.includes(username)) {
      throw new UnauthorizedError('Invalid username or password');
    }

    // Validate input
    if (!username || username.trim() === '') {
      throw new ValidationError('Username is required', 'username');
    }
    if (!password || password.trim() === '') {
      throw new ValidationError('Password is required', 'password');
    }

    // Find user by username
    const user = await fastify.userService.findByUsername(username);
    if (!user) {
      // Don't reveal whether username exists
      throw new UnauthorizedError('Invalid username or password');
    }

    // Verify password
    const isValid = await fastify.userService.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid username or password');
    }

    // Sign JWT token
    const token = authService.signToken({
      id: user.id,
      username: user.username
    });

    // Return token and user info (without sensitive data)
    return {
      token,
      user: {
        id: user.id,
        username: user.username
      }
    };
  });

  // POST /auth/session - Validate Firebase ID token (for BFF session creation)
  fastify.post('/auth/session', {
    preHandler: [fastify.verifyFirebaseToken],
    schema: {
      description: 'Validate Firebase ID token and return user session info',
      tags: ['auth'],
      response: {
        200: sessionResponseSchema
      }
    }
  }, async (request, reply) => {
    // User info is already attached by verifyFirebaseToken middleware
    const firebaseUser = request.firebaseUser;
    
    return {
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        role: firebaseUser.role,
        isAdmin: firebaseUser.isAdmin
      }
    };
  });

  // GET /auth/session - Get current session info from Firebase token
  fastify.get('/auth/session', {
    preHandler: [fastify.verifyFirebaseToken],
    schema: {
      description: 'Get current authenticated user session information',
      tags: ['auth'],
      response: {
        200: sessionResponseSchema
      }
    }
  }, async (request, reply) => {
    // User info is already attached by verifyFirebaseToken middleware
    const firebaseUser = request.firebaseUser;
    
    return {
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        role: firebaseUser.role,
        isAdmin: firebaseUser.isAdmin
      }
    };
  });
}
