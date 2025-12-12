/**
 * Unit tests for Auth module
 * Tests login, logout, token storage, and auth state functions
 */

import {
  login,
  logout,
  getToken,
  isAuthenticated,
  decodeToken,
  getCurrentUser,
  getAuthHeaders,
  willExpireSoon,
  type LoginCredentials,
  type LoginResponse,
  type JWTPayload,
} from '@/lib/auth';
import { ApiError } from '@/lib/api';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: jest.fn((key: string) => mockLocalStorage[key] ?? null),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockLocalStorage[key];
  }),
  clear: jest.fn(() => {
    Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]);
  }),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Auth Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('login', () => {
    const validCredentials: LoginCredentials = {
      username: 'alice',
      password: 'password123',
    };

    const successResponse: LoginResponse = {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhbGljZSIsImlhdCI6MTczMzQwMDAwMCwiZXhwIjoxNzMzNDg2NDAwfQ.signature',
      user: { id: 1, username: 'alice' },
    };

    it('successfully logs in with valid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(successResponse),
      });

      const result = await login(validCredentials);

      expect(result).toEqual(successResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validCredentials),
        })
      );
    });

    it('stores token in localStorage on successful login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(successResponse),
      });

      await login(validCredentials);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'blog_auth_token',
        successResponse.token
      );
    });

    it('throws ApiError on invalid credentials (401)', async () => {
      const errorResponse = {
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          error: { code: 'UNAUTHORIZED', message: 'Invalid username or password' },
        }),
      };
      
      // Mock both calls to login - toThrow and toMatchObject each call login()
      mockFetch.mockResolvedValueOnce(errorResponse);
      mockFetch.mockResolvedValueOnce(errorResponse);

      await expect(login(validCredentials)).rejects.toThrow(ApiError);
      await expect(login(validCredentials)).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('throws ApiError on validation error (400)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: { code: 'BAD_REQUEST', message: 'Username is required' },
        }),
      });

      await expect(login({ username: '', password: 'pass' })).rejects.toThrow(ApiError);
    });
  });

  describe('logout', () => {
    it('removes token from localStorage', () => {
      mockLocalStorage['blog_auth_token'] = 'some-token';

      logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('blog_auth_token');
    });
  });

  describe('getToken', () => {
    it('returns token from localStorage', () => {
      mockLocalStorage['blog_auth_token'] = 'stored-token';

      const token = getToken();

      expect(token).toBe('stored-token');
    });

    it('returns null when no token is stored', () => {
      const token = getToken();

      expect(token).toBeNull();
    });
  });

  describe('decodeToken', () => {
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhbGljZSIsImlhdCI6MTczMzQwMDAwMCwiZXhwIjoxNzMzNDg2NDAwfQ.signature';

    it('decodes a valid JWT token', () => {
      const payload = decodeToken(validToken);

      expect(payload).toEqual({
        id: 1,
        username: 'alice',
        iat: 1733400000,
        exp: 1733486400,
      });
    });

    it('returns null for invalid token format', () => {
      expect(decodeToken('invalid-token')).toBeNull();
      expect(decodeToken('')).toBeNull();
      expect(decodeToken('a.b')).toBeNull();
    });

    it('returns null for malformed base64', () => {
      expect(decodeToken('a.!!!invalid!!!.c')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when token exists and is not expired', () => {
      // Token with exp in the future (year 2099)
      const futureToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhbGljZSIsImlhdCI6MTczMzQwMDAwMCwiZXhwIjo0MTAyNDQ0ODAwfQ.signature';
      mockLocalStorage['blog_auth_token'] = futureToken;

      expect(isAuthenticated()).toBe(true);
    });

    it('returns false when no token exists', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('returns false when token is expired', () => {
      // Token with exp in the past
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhbGljZSIsImlhdCI6MTUwMDAwMDAwMCwiZXhwIjoxNTAwMDAwMDAxfQ.signature';
      mockLocalStorage['blog_auth_token'] = expiredToken;

      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('returns user from valid non-expired token', () => {
      // Token with exp in the future
      const futureToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhbGljZSIsImlhdCI6MTczMzQwMDAwMCwiZXhwIjo0MTAyNDQ0ODAwfQ.signature';
      mockLocalStorage['blog_auth_token'] = futureToken;

      const user = getCurrentUser();

      expect(user).toEqual({ id: 1, username: 'alice' });
    });

    it('returns null when no token', () => {
      expect(getCurrentUser()).toBeNull();
    });

    it('returns null and clears token when expired', () => {
      // Token with exp in the past
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhbGljZSIsImlhdCI6MTUwMDAwMDAwMCwiZXhwIjoxNTAwMDAwMDAxfQ.signature';
      mockLocalStorage['blog_auth_token'] = expiredToken;

      const user = getCurrentUser();

      expect(user).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('blog_auth_token');
    });
  });

  describe('getAuthHeaders', () => {
    it('returns Authorization header when token exists', () => {
      mockLocalStorage['blog_auth_token'] = 'test-token';

      const headers = getAuthHeaders();

      expect(headers).toEqual({ 'Authorization': 'Bearer test-token' });
    });

    it('returns empty object when no token', () => {
      const headers = getAuthHeaders();

      expect(headers).toEqual({});
    });
  });

  describe('willExpireSoon', () => {
    it('returns true when no token', () => {
      expect(willExpireSoon()).toBe(true);
    });

    it('returns true when token expires soon', () => {
      // Create token that expires in 60 seconds
      const now = Math.floor(Date.now() / 1000);
      const payload = { id: 1, username: 'alice', iat: now, exp: now + 60 };
      const base64Payload = btoa(JSON.stringify(payload));
      const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${base64Payload}.signature`;
      mockLocalStorage['blog_auth_token'] = token;

      expect(willExpireSoon(300)).toBe(true); // expires within 5 minutes
    });

    it('returns false when token has plenty of time', () => {
      // Token with exp far in the future
      const futureToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhbGljZSIsImlhdCI6MTczMzQwMDAwMCwiZXhwIjo0MTAyNDQ0ODAwfQ.signature';
      mockLocalStorage['blog_auth_token'] = futureToken;

      expect(willExpireSoon(300)).toBe(false);
    });
  });
});
