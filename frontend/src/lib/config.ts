/**
 * Configuration values for the Blog Frontend
 * 
 * This file contains configuration constants that are used across
 * multiple modules. Kept separate to avoid circular dependencies.
 */

/**
 * Get API base URL from environment variable
 * Falls back to localhost if not configured
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
