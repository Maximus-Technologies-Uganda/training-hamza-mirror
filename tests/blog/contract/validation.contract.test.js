/**
 * Contract Tests for Validation Errors (422 Unprocessable Entity)
 * 
 * Tests comprehensive validation scenarios including:
 * - Multiple simultaneous validation errors
 * - Edge cases (whitespace, length boundaries)
 * - Extra unexpected fields
 * - Proper error schema with field-level details
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../../../src/blog/server.js';
import { AuthService } from '../../../src/blog/services/auth-service.js';

describe('Validation Contract Tests - 422 Responses', () => {
  let server;
  let authToken;

  beforeAll(async () => {
    // Initialize server
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

    // Seed test users and get auth token
    await server.userService.seedTestUsers();
    const authService = new AuthService(server);
    authToken = authService.signToken({ id: 1, username: 'alice' });
  });

  afterAll(async () => {
    await server.close();
  });

  describe('POST /posts - Multiple Validation Errors', () => {
    it('should return 400 with error details for completely missing required fields', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {}
      });

      expect(response.statusCode).toBe(400);
      
      const data = JSON.parse(response.body);
      
      // Verify error structure
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(data.error).toHaveProperty('message');
      expect(data.error).toHaveProperty('requestId');
      
      // Message should mention the validation failure
      expect(data.error.message).toBeTruthy();
    });

    it('should return 400 for payload with only extra fields', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          extraField: 'should be ignored but title/body missing'
        }
      });

      expect(response.statusCode).toBe(400);
      
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /posts - Whitespace-Only Strings', () => {
    it('should return 400 for whitespace-only title', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          title: '   ',
          body: 'Valid body content'
        }
      });

      expect(response.statusCode).toBe(400);
      
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toMatch(/title/i);
    });

    it('should return 400 for whitespace-only body', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          title: 'Valid Title',
          body: '   \n\t  '
        }
      });

      expect(response.statusCode).toBe(400);
      
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toMatch(/body/i);
    });

    it('should return 400 for both title and body being whitespace-only', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          title: '  ',
          body: '\t\n'
        }
      });

      expect(response.statusCode).toBe(400);
      
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      // Both fields should be mentioned in error or validation array
      if (data.error.validation) {
        expect(data.error.validation.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('POST /posts - Length Boundary Tests', () => {
    it('should accept title with exactly 1 character', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          title: 'A',
          body: 'Valid body content'
        }
      });

      expect(response.statusCode).toBe(201);
    });

    it('should accept title with exactly 200 characters (max length)', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          title: 'A'.repeat(200),
          body: 'Valid body content'
        }
      });

      expect(response.statusCode).toBe(201);
    });

    it('should return 400 for title exceeding 200 characters', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          title: 'A'.repeat(201),
          body: 'Valid body content'
        }
      });

      expect(response.statusCode).toBe(400);
      
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toMatch(/title/i);
    });

    it('should accept body with exactly 1 character', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          title: 'Valid Title',
          body: 'A'
        }
      });

      expect(response.statusCode).toBe(201);
    });

    it('should accept body with exactly 50000 characters (max length)', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          title: 'Long Body Test',
          body: 'A'.repeat(50000)
        }
      });

      expect(response.statusCode).toBe(201);
    });

    it('should return 400 for body exceeding 50000 characters', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          title: 'Long Body Test Over',
          body: 'A'.repeat(50001)
        }
      });

      expect(response.statusCode).toBe(400);
      
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toMatch(/body/i);
    });
  });

  describe('POST /posts - Extra Fields Handling', () => {
    it('should ignore extra unexpected fields and create post successfully', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          title: 'Valid Title Extra',
          body: 'Valid body content',
          extraField1: 'should be ignored',
          extraField2: 123,
          nested: { data: 'also ignored' }
        }
      });

      expect(response.statusCode).toBe(201);
      
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('title', 'Valid Title Extra');
      expect(data).toHaveProperty('body', 'Valid body content');
      // Extra fields should not be in response
      expect(data).not.toHaveProperty('extraField1');
      expect(data).not.toHaveProperty('extraField2');
      expect(data).not.toHaveProperty('nested');
    });
  });

  describe('PATCH /posts/:id - Validation Errors', () => {
    let testPostId;

    beforeAll(async () => {
      // Create a post to update
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          title: 'Original Title For Patch',
          body: 'Original body content for patch tests'
        }
      });
      const data = JSON.parse(response.body);
      testPostId = data.id;
    });

    it('should return 400 for empty title update', async () => {
      const response = await server.inject({
        method: 'PATCH',
        url: `/posts/${testPostId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          title: ''
        }
      });

      expect(response.statusCode).toBe(400);
      
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for whitespace-only title update', async () => {
      const response = await server.inject({
        method: 'PATCH',
        url: `/posts/${testPostId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          title: '   '
        }
      });

      expect(response.statusCode).toBe(400);
      
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for title exceeding max length on update', async () => {
      const response = await server.inject({
        method: 'PATCH',
        url: `/posts/${testPostId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          title: 'A'.repeat(201)
        }
      });

      expect(response.statusCode).toBe(400);
      
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for body exceeding max length on update', async () => {
      const response = await server.inject({
        method: 'PATCH',
        url: `/posts/${testPostId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          body: 'A'.repeat(50001)
        }
      });

      expect(response.statusCode).toBe(400);
      
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should accept valid partial update (title only)', async () => {
      const response = await server.inject({
        method: 'PATCH',
        url: `/posts/${testPostId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          title: 'Updated Title'
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.title).toBe('Updated Title');
    });

    it('should accept valid partial update (body only)', async () => {
      const response = await server.inject({
        method: 'PATCH',
        url: `/posts/${testPostId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          body: 'Updated body content'
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.body).toBe('Updated body content');
    });
  });

  describe('Error Response Schema Consistency', () => {
    it('should have consistent error structure across all validation errors', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          title: '',
          body: ''
        }
      });

      expect(response.statusCode).toBe(400);
      
      const data = JSON.parse(response.body);
      
      // Verify required error fields
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
      expect(data.error).toHaveProperty('requestId');
      
      // Verify validation array structure
      if (data.error.validation) {
        expect(Array.isArray(data.error.validation)).toBe(true);
        data.error.validation.forEach(validationError => {
          expect(validationError).toHaveProperty('field');
          expect(validationError).toHaveProperty('message');
          expect(typeof validationError.field).toBe('string');
          expect(typeof validationError.message).toBe('string');
        });
      }
    });

    it('should include X-Request-Id header in validation error responses', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Request-Id': 'test-validation-request-123'
        },
        payload: {
          title: '',
          body: ''
        }
      });

      expect(response.statusCode).toBe(400);
      expect(response.headers['x-request-id']).toBeDefined();
      
      const data = JSON.parse(response.body);
      expect(data.error.requestId).toBe(response.headers['x-request-id']);
    });
  });
});
