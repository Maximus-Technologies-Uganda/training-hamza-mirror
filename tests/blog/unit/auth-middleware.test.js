/**
 * Unit Tests for Auth Middleware
 * 
 * Tests the authenticate decorator for JWT validation.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createServer } from '../../../src/blog/server.js';
import { AuthService } from '../../../src/blog/services/auth-service.js';

describe('Auth Middleware - Unit Tests', () => {
  let server;
  let authService;
  let validToken;
  let aliceUser;

  beforeAll(async () => {
    // Create server with auth enabled
    server = await createServer({
      logger: false,
      skipCors: true,
      skipHelmet: true,
      skipRequestContext: true,
      skipRateLimiting: true,
      skipCSRF: true,
      jwtSecret: 'test-secret',
      useJwtAuth: true
    });
    await server.ready();
    
    // Seed test users for authentication tests
    await server.userService.seedTestUsers();
    
    authService = new AuthService(server);
    aliceUser = { id: 1, username: 'alice' };
    validToken = authService.signToken(aliceUser);
  });

  afterAll(async () => {
    await server.close();
  });

  describe('T024: authenticate decorator', () => {
    it('should allow request with valid Bearer token', async () => {
      // Test against a protected endpoint with unique slug to avoid collisions
      const uniqueTitle = `Protected Test Post ${Date.now()}`;
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${validToken}`
        },
        payload: {
          title: uniqueTitle,
          body: 'This post requires authentication'
        }
      });

      // Should succeed (201 Created) not fail with auth error
      expect(response.statusCode).toBe(201);
    });

    it('should reject request without Authorization header', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        payload: {
          title: 'Should Fail',
          body: 'This should not be created'
        }
      });

      expect(response.statusCode).toBe(401);
      
      const data = JSON.parse(response.body);
      expect(['UNAUTHORIZED', 'AUTH_REQUIRED']).toContain(data.error.code);
    });

    it('should reject request with invalid token format', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': 'Bearer invalid-token-here'
        },
        payload: {
          title: 'Should Fail',
          body: 'This should not be created'
        }
      });

      expect(response.statusCode).toBe(401);
      
      const data = JSON.parse(response.body);
      expect(['UNAUTHORIZED', 'TOKEN_INVALID', 'AUTH_REQUIRED']).toContain(data.error.code);
    });

    it('should reject request with tampered token', async () => {
      // Tamper with the signature
      const parts = validToken.split('.');
      parts[2] = parts[2].split('').reverse().join('');
      const tamperedToken = parts.join('.');
      
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${tamperedToken}`
        },
        payload: {
          title: 'Should Fail',
          body: 'This should not be created'
        }
      });

      expect(response.statusCode).toBe(401);
      
      const data = JSON.parse(response.body);
      // Accept either TOKEN_INVALID or UNAUTHORIZED for tampered tokens
      expect(['TOKEN_INVALID', 'UNAUTHORIZED', 'AUTH_REQUIRED']).toContain(data.error.code);
    });

    it('should reject request with wrong auth scheme (Basic instead of Bearer)', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Basic ${validToken}`
        },
        payload: {
          title: 'Should Fail',
          body: 'This should not be created'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject request with empty Bearer token', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': 'Bearer '
        },
        payload: {
          title: 'Should Fail',
          body: 'This should not be created'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should attach user info to request on successful auth', async () => {
      // Create a post and verify ownerId is set from the token
      const uniqueTitle = `Check Owner ${Date.now()}`;
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${validToken}`
        },
        payload: {
          title: uniqueTitle,
          body: 'This post should have ownerId from token'
        }
      });

      expect(response.statusCode).toBe(201);
      
      const data = JSON.parse(response.body);
      expect(data.ownerId).toBe(String(aliceUser.id));
    });

    it('should allow public endpoints without authentication', async () => {
      // GET /posts should work without auth
      const response = await server.inject({
        method: 'GET',
        url: '/posts'
      });

      expect(response.statusCode).toBe(200);
    });

    it('should allow health check without authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
