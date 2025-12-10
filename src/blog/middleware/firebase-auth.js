/**
 * Firebase Authentication Middleware
 * 
 * Provides Firebase Auth token verification for protected routes.
 * Uses Firebase Admin SDK to verify ID tokens.
 */

import fp from 'fastify-plugin';
import { verifyIdToken } from '../services/firebase-admin.js';
import { extractUserFromToken } from '../models/firebase-user.js';

/**
 * Error codes for authentication failures
 */
export const AuthErrorCodes = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
};

/**
 * Authentication Error class
 */
export class FirebaseAuthError extends Error {
  constructor(message, code, statusCode = 401) {
    super(message);
    this.name = 'FirebaseAuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Extract Bearer token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null if not present/invalid
 */
function extractBearerToken(authHeader) {
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Firebase Auth Plugin
 * Registers authentication decorators on Fastify instance
 * 
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Plugin options
 * @param {boolean} options.useJwtAuth - Use Fastify JWT auth instead of Firebase (for tests)
 */
async function firebaseAuthPluginInner(fastify, options = {}) {
  const { useJwtAuth = false } = options;

  function mapJwtPayloadToFirebaseUser(decodedToken) {
    const isAdmin = decodedToken.admin === true || decodedToken.role === 'admin';
    return {
      uid: String(decodedToken.id),
      email: decodedToken.email || `${decodedToken.username}@test.local`,
      displayName: decodedToken.username || null,
      isAdmin,
      role: isAdmin ? 'admin' : 'user',
    };
  }
  
  /**
   * Verify JWT token using Fastify's JWT plugin (test mode)
   * Maps JWT payload to firebaseUser format for compatibility
   * 
   * @param {import('fastify').FastifyRequest} request - Fastify request
   * @param {import('fastify').FastifyReply} reply - Fastify reply
   * @throws {FirebaseAuthError} If authentication fails
   */
  async function verifyJwtToken(request, reply) {
    // If a previous hook already verified the token, reuse it to avoid double work
    if (request.firebaseUser && request.firebaseToken) {
      return;
    }

    const authHeader = request.headers.authorization;
    const token = extractBearerToken(authHeader);
    
    if (!token) {
      throw new FirebaseAuthError(
        'Authentication required',
        AuthErrorCodes.AUTH_REQUIRED
      );
    }
    
    try {
      // Verify the token with Fastify JWT
      const decodedToken = await fastify.jwt.verify(token);
      
      // Map JWT payload to firebaseUser format
      // JWT tokens from tests use { id, username } format
      request.firebaseUser = mapJwtPayloadToFirebaseUser(decodedToken);
      request.firebaseToken = decodedToken;
      
    } catch (error) {
      // Handle JWT errors
      if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
        throw new FirebaseAuthError(
          'Token has expired',
          AuthErrorCodes.TOKEN_EXPIRED
        );
      }
      
      throw new FirebaseAuthError(
        'Invalid token',
        AuthErrorCodes.TOKEN_INVALID
      );
    }
  }
  
  /**
   * Verify Firebase ID token and attach user info to request
   * Use as preHandler for protected routes
   * 
   * @param {import('fastify').FastifyRequest} request - Fastify request
   * @param {import('fastify').FastifyReply} reply - Fastify reply
   * @throws {FirebaseAuthError} If authentication fails
   */
  async function verifyFirebaseTokenImpl(request, reply) {
    // If a previous hook already verified the token, reuse it to avoid double work
    if (request.firebaseUser && request.firebaseToken) {
      return;
    }

    const authHeader = request.headers.authorization;
    const token = extractBearerToken(authHeader);
    
    if (!token) {
      throw new FirebaseAuthError(
        'Authentication required',
        AuthErrorCodes.AUTH_REQUIRED
      );
    }
    
    try {
      // Verify the token with Firebase Admin SDK
      const decodedToken = await verifyIdToken(token);
      
      // Extract user info from token and attach to request
      request.firebaseUser = extractUserFromToken(decodedToken);
      request.firebaseToken = decodedToken;
      
    } catch (error) {
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/id-token-expired') {
        throw new FirebaseAuthError(
          'Token has expired',
          AuthErrorCodes.TOKEN_EXPIRED
        );
      }
      
      if (error.code === 'auth/argument-error' || 
          error.code === 'auth/id-token-revoked' ||
          error.code === 'auth/invalid-id-token') {
        throw new FirebaseAuthError(
          'Invalid token',
          AuthErrorCodes.TOKEN_INVALID
        );
      }
      
      // Generic authentication error
      request.log.error({ error: error.message }, 'Firebase token verification failed');
      throw new FirebaseAuthError(
        'Invalid token',
        AuthErrorCodes.TOKEN_INVALID
      );
    }
  }
  
  // Use JWT auth in test mode, Firebase auth otherwise
  const verifyFirebaseToken = useJwtAuth ? verifyJwtToken : verifyFirebaseTokenImpl;
  
  /**
   * Optional authentication - verify token if present, but don't require it
   * Useful for routes that have different behavior for authenticated vs anonymous users
   * 
   * @param {import('fastify').FastifyRequest} request - Fastify request
   * @param {import('fastify').FastifyReply} reply - Fastify reply
   */
  async function optionalFirebaseAuth(request, reply) {
    // Skip work if a previous hook already populated authentication context
    if (request.firebaseUser && request.firebaseToken) {
      return;
    }

    const authHeader = request.headers.authorization;
    const token = extractBearerToken(authHeader);
    
    if (!token) {
      // No token provided - that's okay for optional auth
      request.firebaseUser = null;
      request.firebaseToken = null;
      return;
    }
    
    try {
      if (useJwtAuth) {
        const decodedToken = await fastify.jwt.verify(token);
        request.firebaseUser = mapJwtPayloadToFirebaseUser(decodedToken);
        request.firebaseToken = decodedToken;
        return;
      }

      const decodedToken = await verifyIdToken(token);
      request.firebaseUser = extractUserFromToken(decodedToken);
      request.firebaseToken = decodedToken;
    } catch (error) {
      // Token provided but invalid - log but don't fail
      request.log.warn({ error: error.message }, 'Invalid token in optional auth');
      request.firebaseUser = null;
      request.firebaseToken = null;
    }
  }
  
  // Decorate Fastify instance with authentication methods
  fastify.decorate('verifyFirebaseToken', verifyFirebaseToken);
  fastify.decorate('optionalFirebaseAuth', optionalFirebaseAuth);
  
  // Also expose as request decorators for type safety
  fastify.decorateRequest('firebaseUser', null);
  fastify.decorateRequest('firebaseToken', null);
}

// Export plugin with fastify-plugin to break encapsulation
export const firebaseAuthPlugin = fp(firebaseAuthPluginInner, {
  name: 'firebase-auth-plugin',
});

export { extractBearerToken };
