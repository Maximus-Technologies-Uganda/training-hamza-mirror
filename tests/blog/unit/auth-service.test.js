/**
 * Unit Tests for Auth Service
 * 
 * Tests JWT token signing, verification, and decoding.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../../../src/blog/server.js';
import { AuthService } from '../../../src/blog/services/auth-service.js';

describe('AuthService - Unit Tests', () => {
  let server;
  let authService;

  beforeAll(async () => {
    // Create a minimal server to get the JWT plugin
    server = await createServer({
      logger: false,
      skipCors: true,
      skipHelmet: true,
      skipRequestContext: true,
      skipRateLimiting: true,
      jwtSecret: 'test-secret'
    });
    await server.ready();
    
    authService = new AuthService(server);
  });

  afterAll(async () => {
    await server.close();
  });

  describe('T023: signToken', () => {
    it('should sign a token for a valid user', () => {
      const user = { id: 1, username: 'alice' };
      const token = authService.signToken(user);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should create a valid JWT format (three parts separated by dots)', () => {
      const user = { id: 2, username: 'bob' };
      const token = authService.signToken(user);
      
      const parts = token.split('.');
      expect(parts.length).toBe(3);
    });

    it('should include user id and username in token payload', () => {
      const user = { id: 42, username: 'testuser' };
      const token = authService.signToken(user);
      
      // Decode payload (base64url)
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      
      expect(payload.id).toBe(42);
      expect(payload.username).toBe('testuser');
    });

    it('should include iat (issued at) in token payload', () => {
      const user = { id: 1, username: 'alice' };
      const token = authService.signToken(user);
      
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      
      expect(payload.iat).toBeDefined();
      expect(typeof payload.iat).toBe('number');
    });

    it('should include exp (expiration) in token payload', () => {
      const user = { id: 1, username: 'alice' };
      const token = authService.signToken(user);
      
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      
      expect(payload.exp).toBeDefined();
      expect(typeof payload.exp).toBe('number');
      // Token should expire in the future
      expect(payload.exp).toBeGreaterThan(payload.iat);
    });

    it('should set expiration approximately 24 hours from issuance', () => {
      const user = { id: 1, username: 'alice' };
      const token = authService.signToken(user);
      
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      
      const expiryDuration = payload.exp - payload.iat;
      const twentyFourHours = 24 * 60 * 60; // seconds
      
      // Should be within a few seconds of 24 hours
      expect(expiryDuration).toBeCloseTo(twentyFourHours, -1);
    });
  });

  describe('T023: verifyToken', () => {
    it('should verify a valid token and return payload', async () => {
      const user = { id: 1, username: 'alice' };
      const token = authService.signToken(user);
      
      const payload = await authService.verifyToken(token);
      
      expect(payload).toBeDefined();
      expect(payload.id).toBe(1);
      expect(payload.username).toBe('alice');
    });

    it('should throw error for invalid token', async () => {
      await expect(authService.verifyToken('invalid.token.here')).rejects.toThrow();
    });

    it('should throw error for tampered token', async () => {
      const user = { id: 1, username: 'alice' };
      const token = authService.signToken(user);
      
      // Tamper with the signature
      const parts = token.split('.');
      parts[2] = parts[2].split('').reverse().join('');
      const tamperedToken = parts.join('.');
      
      await expect(authService.verifyToken(tamperedToken)).rejects.toThrow();
    });

    it('should throw error for empty token', async () => {
      await expect(authService.verifyToken('')).rejects.toThrow();
    });

    it('should throw error for null token', async () => {
      await expect(authService.verifyToken(null)).rejects.toThrow();
    });
  });

  describe('T023: decodeToken', () => {
    it('should decode a valid token without verification', () => {
      const user = { id: 1, username: 'alice' };
      const token = authService.signToken(user);
      
      const payload = authService.decodeToken(token);
      
      expect(payload).toBeDefined();
      expect(payload.id).toBe(1);
      expect(payload.username).toBe('alice');
    });

    it('should return null for invalid token format', () => {
      const payload = authService.decodeToken('not-a-valid-token');
      
      expect(payload).toBeNull();
    });

    it('should return null for empty string', () => {
      const payload = authService.decodeToken('');
      
      expect(payload).toBeNull();
    });
  });
});
