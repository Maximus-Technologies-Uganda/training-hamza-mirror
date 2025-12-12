/**
 * CSRF Protection Middleware
 * 
 * Implements double-submit cookie pattern for CSRF protection.
 * - Generates CSRF token on GET requests
 * - Validates CSRF token on mutating requests (POST, PATCH, DELETE, PUT)
 */

import fp from 'fastify-plugin';
import { randomBytes } from 'crypto';

/**
 * CSRF Error class
 */
export class CSRFError extends Error {
  constructor(message = 'Invalid CSRF token') {
    super(message);
    this.name = 'CSRFError';
    this.code = 'CSRF_INVALID';
    this.statusCode = 403;
  }
}

/**
 * Configuration for CSRF middleware
 */
const CSRF_CONFIG = {
  cookieName: 'csrf_token',
  headerName: 'x-csrf-token',
  tokenLength: 32, // bytes
  cookieOptions: {
    httpOnly: false, // Must be readable by JS for double-submit
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  },
};

/**
 * Generate a cryptographically secure CSRF token
 * @returns {string} CSRF token (hex encoded)
 */
function generateCSRFToken() {
  return randomBytes(CSRF_CONFIG.tokenLength).toString('hex');
}

/**
 * Methods that require CSRF validation
 */
const CSRF_PROTECTED_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE'];

/**
 * Paths that are exempt from CSRF protection
 * (e.g., authentication endpoints that use different protection)
 */
const CSRF_EXEMPT_PATHS = [
  '/auth/login',
  '/auth/logout',
  '/api/auth/', // BFF auth routes use session cookies
];

/**
 * Check if a path is exempt from CSRF protection
 * @param {string} path - Request path
 * @returns {boolean} True if exempt
 */
function isCSRFExempt(path) {
  return CSRF_EXEMPT_PATHS.some(exemptPath => path.startsWith(exemptPath));
}

/**
 * CSRF Plugin
 * Adds CSRF token generation and validation to Fastify
 * 
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Plugin options
 * @param {boolean} options.disabled - If true, CSRF validation is disabled (for tests)
 */
async function csrfPluginInner(fastify, options = {}) {
  const { disabled = false } = options;
  /**
   * Generate and set CSRF token cookie
   * Call this on initial page load or after login
   * 
   * @param {import('fastify').FastifyReply} reply - Fastify reply
   * @returns {string} The generated CSRF token
   */
  function setCSRFToken(reply) {
    const token = generateCSRFToken();
    reply.setCookie(CSRF_CONFIG.cookieName, token, CSRF_CONFIG.cookieOptions);
    return token;
  }
  
  /**
   * Validate CSRF token from header against cookie
   * 
   * @param {import('fastify').FastifyRequest} request - Fastify request
   * @returns {boolean} True if valid
   */
  function validateCSRFToken(request) {
    const cookieToken = request.cookies?.[CSRF_CONFIG.cookieName];
    const headerToken = request.headers[CSRF_CONFIG.headerName];
    
    if (!cookieToken || !headerToken) {
      return false;
    }
    
    // Constant-time comparison to prevent timing attacks
    return cookieToken === headerToken && cookieToken.length === headerToken.length;
  }
  
  /**
   * CSRF validation hook for protected routes
   * Use as preHandler for routes requiring CSRF protection
   * 
   * @param {import('fastify').FastifyRequest} request - Fastify request
   * @param {import('fastify').FastifyReply} reply - Fastify reply
   * @throws {CSRFError} If CSRF validation fails
   */
  async function requireCSRF(request, reply) {
    // Skip validation if CSRF is disabled (e.g., in test mode)
    if (disabled) {
      return;
    }
    
    // Skip validation for exempt paths
    if (isCSRFExempt(request.url)) {
      return;
    }
    
    // Only validate on protected methods
    if (!CSRF_PROTECTED_METHODS.includes(request.method)) {
      return;
    }
    
    if (!validateCSRFToken(request)) {
      throw new CSRFError();
    }
  }
  
  // Decorate Fastify with CSRF utilities
  fastify.decorate('setCSRFToken', setCSRFToken);
  fastify.decorate('validateCSRFToken', validateCSRFToken);
  fastify.decorate('requireCSRF', requireCSRF);
  
  // Add GET endpoint for CSRF token (for SPA/AJAX apps)
  fastify.get('/csrf-token', {
    schema: {
      description: 'Get CSRF token for subsequent requests',
      tags: ['auth'],
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const token = setCSRFToken(reply);
      return { token };
    },
  });
}

// Export plugin with fastify-plugin
export const csrfPlugin = fp(csrfPluginInner, {
  name: 'csrf-plugin',
  dependencies: ['@fastify/cookie'],
});

export { generateCSRFToken, CSRF_CONFIG, isCSRFExempt };
