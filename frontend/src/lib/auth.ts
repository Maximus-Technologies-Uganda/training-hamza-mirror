/**
 * Authentication Library for Blog Frontend
 * 
 * Handles login, logout, token storage, and auth state management.
 * Uses localStorage for token persistence.
 */

import { API_BASE_URL } from './config';
import { ApiError } from './api-errors';

/**
 * Key used for storing JWT token in localStorage
 */
const TOKEN_STORAGE_KEY = 'blog_auth_token';

/**
 * User information extracted from JWT token or login response
 */
export interface AuthUser {
  id: number;
  username: string;
}

/**
 * Response from successful login
 */
export interface LoginResponse {
  token: string;
  user: AuthUser;
}

/**
 * Decoded JWT payload (without verification)
 */
export interface JWTPayload {
  id: number;
  username: string;
  iat: number;
  exp: number;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Login with username and password
 * On success, stores the JWT token in localStorage
 * 
 * @param credentials - Username and password
 * @returns Promise resolving to login response with token and user
 * @throws ApiError if login fails
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      body.error?.message || body.message || 'Login failed',
      body.error?.code || 'LOGIN_FAILED'
    );
  }

  const data: LoginResponse = await response.json();
  
  // Store token in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
  }
  
  return data;
}

/**
 * Logout the current user
 * Clears the JWT token from localStorage
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

/**
 * Get the current JWT token from localStorage
 * 
 * @returns The stored token or null if not logged in
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * Check if user is currently authenticated
 * Validates that token exists and is not expired
 * 
 * @returns true if user has a valid (non-expired) token
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) {
    return false;
  }
  
  // Decode token and check expiration
  const payload = decodeToken(token);
  if (!payload) {
    return false;
  }
  
  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now;
}

/**
 * Decode a base64url string to a regular string
 * Handles the differences between base64url (used in JWT) and standard base64:
 * - Replaces '-' with '+'
 * - Replaces '_' with '/'
 * - Adds padding '=' as needed
 * 
 * @param base64url - Base64url encoded string
 * @returns Decoded string
 */
function decodeBase64Url(base64url: string): string {
  // Replace base64url characters with standard base64 characters
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if necessary
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  
  return atob(base64);
}

/**
 * Decode a JWT token without verification
 * Used for client-side checks like expiration
 * 
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid format
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payloadPart = parts[1];
    if (!payloadPart) {
      return null;
    }
    
    const payload = JSON.parse(decodeBase64Url(payloadPart));
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Get the current authenticated user from the stored token
 * 
 * @returns User information or null if not authenticated
 */
export function getCurrentUser(): AuthUser | null {
  const token = getToken();
  if (!token) {
    return null;
  }
  
  const payload = decodeToken(token);
  if (!payload) {
    return null;
  }
  
  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    // Token expired, clear it
    logout();
    return null;
  }
  
  return {
    id: payload.id,
    username: payload.username,
  };
}

/**
 * Get authorization headers for API requests
 * 
 * @returns Headers object with Authorization header if logged in
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) {
    return {};
  }
  return {
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Check if a token will expire within a given number of seconds
 * Useful for proactive token refresh (future enhancement)
 * 
 * @param seconds - Number of seconds before expiration to check
 * @returns true if token will expire within the specified time
 */
export function willExpireSoon(seconds: number = 300): boolean {
  const token = getToken();
  if (!token) {
    return true;
  }
  
  const payload = decodeToken(token);
  if (!payload) {
    return true;
  }
  
  const now = Math.floor(Date.now() / 1000);
  return payload.exp - now <= seconds;
}
