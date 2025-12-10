/**
 * Contract Tests for Blog Authentication API
 * 
 * Validates that auth API responses conform to the OpenAPI specification.
 * Tests login endpoint against defined JSON schemas.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { createServer } from '../../../src/blog/server.js';

describe('Blog Auth API - Contract Tests', () => {
  let server;
  let ajv;
  let openApiSpec;

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

    // Seed test users (alice, bob) for authentication tests
    await server.userService.seedTestUsers();

    // Get OpenAPI specification
    openApiSpec = server.swagger();

    // Initialize AJV with OpenAPI schemas
    ajv = new Ajv({ 
      strict: false,
      allErrors: true,
      validateFormats: true
    });
    addFormats(ajv);
  });

  afterAll(async () => {
    await server.close();
  });

  /**
   * Helper function to validate response against OpenAPI schema
   */
  function validateResponse(path, method, statusCode, responseData) {
    const pathSpec = openApiSpec.paths[path];
    const methodSpec = pathSpec?.[method.toLowerCase()];
    const responseSpec = methodSpec?.responses?.[statusCode];

    if (!responseSpec) {
      throw new Error(`No schema defined for ${method} ${path} ${statusCode}`);
    }

    const schema = responseSpec.content?.['application/json']?.schema;
    
    if (!schema) {
      // No content expected (e.g., 204 No Content)
      return true;
    }

    // Resolve $ref if present
    const resolvedSchema = resolveSchema(schema, openApiSpec);
    
    const validate = ajv.compile(resolvedSchema);
    const valid = validate(responseData);

    if (!valid) {
      console.error('Validation errors:', validate.errors);
    }

    return valid;
  }

  /**
   * Helper to resolve $ref in schemas
   */
  function resolveSchema(schema, spec) {
    if (schema.$ref) {
      const refPath = schema.$ref.split('/').slice(1); // Remove leading '#'
      let resolved = spec;
      for (const part of refPath) {
        resolved = resolved[part];
      }
      return resolved;
    }
    
    // Handle array items with $ref
    if (schema.type === 'array' && schema.items?.$ref) {
      return {
        ...schema,
        items: resolveSchema(schema.items, spec)
      };
    }
    
    return schema;
  }

  describe('POST /auth/login - User Authentication', () => {
    it('T020: should return 200 with valid token schema for successful login', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'alice',
          password: 'password123'
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      
      // Validate against OpenAPI schema
      const isValid = validateResponse('/auth/login', 'POST', '200', data);
      expect(isValid).toBe(true);

      // Contract checks for LoginResponse
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('user');
      expect(typeof data.token).toBe('string');
      expect(data.token.length).toBeGreaterThan(0);
      
      // User object checks
      expect(data.user).toHaveProperty('id');
      expect(data.user).toHaveProperty('username');
      expect(typeof data.user.id).toBe('number');
      expect(data.user.id).toBeGreaterThan(0);
      expect(data.user.username).toBe('alice');
    });

    it('T020: should return valid JWT token that can be decoded', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'bob',
          password: 'password456'
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      
      // JWT format: header.payload.signature
      const parts = data.token.split('.');
      expect(parts.length).toBe(3);

      // Decode payload (base64url)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      expect(payload).toHaveProperty('id');
      expect(payload).toHaveProperty('username');
      expect(payload).toHaveProperty('iat');
      expect(payload).toHaveProperty('exp');
      expect(payload.username).toBe('bob');
    });

    it('T021: should return 401 for invalid credentials', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'alice',
          password: 'wrongpassword'
        }
      });

      expect(response.statusCode).toBe(401);
      
      const data = JSON.parse(response.body);
      
      // Error response structure
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
      expect(['UNAUTHORIZED', 'AUTH_REQUIRED']).toContain(data.error.code);
    });

    it('T021: should return 401 for non-existent user', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'nonexistent',
          password: 'password123'
        }
      });

      expect(response.statusCode).toBe(401);
      
      const data = JSON.parse(response.body);
      expect(['UNAUTHORIZED', 'AUTH_REQUIRED']).toContain(data.error.code);
      expect(data.error.message).toContain('Invalid');
    });

    it('T022: should return 400 for missing username', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          password: 'password123'
        }
      });

      expect(response.statusCode).toBe(400);
      
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('error');
    });

    it('T022: should return 400 for missing password', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'alice'
        }
      });

      expect(response.statusCode).toBe(400);
      
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('error');
    });

    it('T022: should return 400 for empty request body', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
      
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('error');
    });

    it('T022: should return 400 for empty username', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: '',
          password: 'password123'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('T022: should return 400 for empty password', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'alice',
          password: ''
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should include X-Request-Id header in response', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'alice',
          password: 'password123'
        }
      });

      expect(response.headers['x-request-id']).toBeDefined();
      expect(typeof response.headers['x-request-id']).toBe('string');
    });

    it('should echo client-provided X-Request-Id', async () => {
      const clientRequestId = 'test-request-id-12345';
      
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

      expect(response.headers['x-request-id']).toBe(clientRequestId);
    });
  });
});
