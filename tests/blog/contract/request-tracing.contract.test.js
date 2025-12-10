/**
 * Contract Tests for Request Tracing (US8)
 * 
 * T079: Any request returns X-Request-Id header
 * T080: Client-provided X-Request-Id is echoed back
 * T081: Error responses include requestId in body
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../../../src/blog/server.js';

describe('Request Tracing - Contract Tests (US8)', () => {
  let server;

  beforeAll(async () => {
    // Initialize server (skip CORS, Helmet, request context, and rate limiting for cleaner test output)
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

    // Seed test users for auth-related tests
    await server.userService.seedTestUsers();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('T079: X-Request-Id header in responses', () => {
    it('GET /health returns X-Request-Id header', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-request-id']).toBeDefined();
      expect(typeof response.headers['x-request-id']).toBe('string');
      expect(response.headers['x-request-id'].length).toBeGreaterThan(0);
    });

    it('GET /posts returns X-Request-Id header', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/posts'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-request-id']).toBeDefined();
      expect(typeof response.headers['x-request-id']).toBe('string');
    });

    it('POST /auth/login returns X-Request-Id header', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'alice',
          password: 'password123'
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-request-id']).toBeDefined();
      expect(typeof response.headers['x-request-id']).toBe('string');
    });

    it('404 response includes X-Request-Id header', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/posts/999999'
      });

      expect(response.statusCode).toBe(404);
      expect(response.headers['x-request-id']).toBeDefined();
      expect(typeof response.headers['x-request-id']).toBe('string');
    });

    it('401 response includes X-Request-Id header', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        payload: {
          title: 'Test',
          body: 'Test body content'
        }
      });

      expect(response.statusCode).toBe(401);
      expect(response.headers['x-request-id']).toBeDefined();
      expect(typeof response.headers['x-request-id']).toBe('string');
    });
  });

  describe('T080: Client-provided X-Request-Id echoed back', () => {
    it('echoes back client-provided X-Request-Id on GET /health', async () => {
      const clientRequestId = 'client-test-id-health-12345';
      
      const response = await server.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'x-request-id': clientRequestId
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-request-id']).toBe(clientRequestId);
    });

    it('echoes back client-provided X-Request-Id on GET /posts', async () => {
      const clientRequestId = 'client-test-id-posts-67890';
      
      const response = await server.inject({
        method: 'GET',
        url: '/posts',
        headers: {
          'x-request-id': clientRequestId
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-request-id']).toBe(clientRequestId);
    });

    it('echoes back client-provided X-Request-Id on POST /auth/login', async () => {
      const clientRequestId = 'client-test-id-login-abcdef';
      
      const response = await server.inject({
        method: 'POST',
        url: '/auth/login',
        headers: {
          'x-request-id': clientRequestId
        },
        payload: {
          username: 'alice',
          password: 'password123'
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-request-id']).toBe(clientRequestId);
    });

    it('echoes back client-provided X-Request-Id on error responses', async () => {
      const clientRequestId = 'client-test-id-error-xyz789';
      
      const response = await server.inject({
        method: 'GET',
        url: '/posts/999999',
        headers: {
          'x-request-id': clientRequestId
        }
      });

      expect(response.statusCode).toBe(404);
      expect(response.headers['x-request-id']).toBe(clientRequestId);
    });

    it('preserves UUID format for client-provided X-Request-Id', async () => {
      const clientRequestId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await server.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'x-request-id': clientRequestId
        }
      });

      expect(response.headers['x-request-id']).toBe(clientRequestId);
    });
  });

  describe('T081: Error responses include requestId in body', () => {
    it('401 Unauthorized includes requestId in error body', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        payload: {
          title: 'Test',
          body: 'Test body content'
        }
      });

      expect(response.statusCode).toBe(401);
      
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('requestId');
      expect(typeof data.error.requestId).toBe('string');
      expect(data.error.requestId.length).toBeGreaterThan(0);
      // requestId in body should match X-Request-Id header
      expect(data.error.requestId).toBe(response.headers['x-request-id']);
    });

    it('404 Not Found includes requestId in error body', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/posts/999999'
      });

      expect(response.statusCode).toBe(404);
      
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('requestId');
      expect(typeof data.error.requestId).toBe('string');
      expect(data.error.requestId).toBe(response.headers['x-request-id']);
    });

    it('400 Bad Request includes requestId in error body', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'alice'
          // missing password
        }
      });

      expect(response.statusCode).toBe(400);
      
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('requestId');
      expect(typeof data.error.requestId).toBe('string');
      expect(data.error.requestId).toBe(response.headers['x-request-id']);
    });

    it('client-provided X-Request-Id appears in error body', async () => {
      const clientRequestId = 'client-error-trace-id-123';
      
      const response = await server.inject({
        method: 'GET',
        url: '/posts/999999',
        headers: {
          'x-request-id': clientRequestId
        }
      });

      expect(response.statusCode).toBe(404);
      
      const data = JSON.parse(response.body);
      expect(data.error.requestId).toBe(clientRequestId);
      expect(response.headers['x-request-id']).toBe(clientRequestId);
    });

    it('403 Forbidden includes requestId in error body', async () => {
      // First login as alice to get a token
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'alice',
          password: 'password123'
        }
      });
      const { token: aliceToken } = JSON.parse(loginResponse.body);

      // Create a post as alice
      const createResponse = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          authorization: `Bearer ${aliceToken}`
        },
        payload: {
          title: `Alice Post ${Date.now()}`,
          body: 'Content by Alice'
        }
      });
      const alicePost = JSON.parse(createResponse.body);

      // Login as bob
      const bobLoginResponse = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'bob',
          password: 'password456'
        }
      });
      const { token: bobToken } = JSON.parse(bobLoginResponse.body);

      // Try to delete alice's post as bob
      const response = await server.inject({
        method: 'DELETE',
        url: `/posts/${alicePost.id}`,
        headers: {
          authorization: `Bearer ${bobToken}`
        }
      });

      expect(response.statusCode).toBe(403);
      
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('requestId');
      expect(typeof data.error.requestId).toBe('string');
      expect(data.error.requestId).toBe(response.headers['x-request-id']);
    });
  });
});
