/**
 * Health Endpoint Contract Tests
 * 
 * Verifies that GET /health returns the required operational data:
 * - status: service health status
 * - version: application version from package.json
 * - uptime: server uptime in seconds (number)
 * - timestamp: current time in ISO 8601 format
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../../../src/blog/server.js';

describe('Health Endpoint Contract', () => {
  let app;

  beforeAll(async () => {
    app = await createServer({ 
      logger: false,
      skipCors: true,
      skipHelmet: true,
      skipRequestContext: true,
      skipRateLimiting: true,
      jwtSecret: 'test-secret'
    });
    await app.ready();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /health', () => {
    it('should return version field from package.json', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('version');
      expect(typeof body.version).toBe('string');
      // Version should match semver pattern (e.g., "1.0.0")
      expect(body.version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should return uptime as a number', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('uptime');
      expect(typeof body.uptime).toBe('number');
      // Uptime should be a positive number (seconds since start)
      expect(body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return timestamp in ISO 8601 format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('timestamp');
      expect(typeof body.timestamp).toBe('string');
      // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
      expect(body.timestamp).toMatch(isoDateRegex);
      // Should be a valid date
      const parsedDate = new Date(body.timestamp);
      expect(parsedDate.toISOString()).toBe(body.timestamp);
    });

    it('should return status field with "ok" value', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('status', 'ok');
    });

    it('should return all required health fields', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      
      // Verify all four required fields are present
      expect(body).toEqual(expect.objectContaining({
        status: expect.any(String),
        version: expect.any(String),
        uptime: expect.any(Number),
        timestamp: expect.any(String)
      }));
    });
  });
});
