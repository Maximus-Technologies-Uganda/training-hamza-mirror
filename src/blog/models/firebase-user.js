/**
 * Firebase User Entity Model
 * 
 * Defines the User entity structure for Firebase Auth integration.
 * Users are authenticated via Firebase; this model syncs user data locally.
 */

import { z } from 'zod';

/**
 * User roles enumeration
 */
export const UserRole = {
  USER: 'user',
  ADMIN: 'admin',
};

/**
 * Firebase User validation constants
 */
export const FIREBASE_USER_VALIDATION = {
  uid: {
    // Firebase UIDs are typically 28 characters
    minLength: 1,
    maxLength: 128,
  },
  email: {
    maxLength: 254, // RFC 5321 max email length
  },
  displayName: {
    maxLength: 100,
  },
};

/**
 * Zod schema for Firebase User (complete user object)
 */
export const firebaseUserSchema = z.object({
  uid: z.string()
    .min(FIREBASE_USER_VALIDATION.uid.minLength, 'User ID is required')
    .max(FIREBASE_USER_VALIDATION.uid.maxLength),
  email: z.string()
    .email('Invalid email format')
    .max(FIREBASE_USER_VALIDATION.email.maxLength),
  displayName: z.string()
    .max(FIREBASE_USER_VALIDATION.displayName.maxLength)
    .nullable()
    .optional(),
  role: z.enum([UserRole.USER, UserRole.ADMIN]).default(UserRole.USER),
  createdAt: z.string().datetime(),
  lastLoginAt: z.string().datetime().nullable().optional(),
});

/**
 * Zod schema for public Firebase User (API responses)
 */
export const publicFirebaseUserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable().optional(),
  role: z.enum([UserRole.USER, UserRole.ADMIN]),
});

/**
 * JSON Schema for Firebase User entity (for Fastify validation / OpenAPI)
 */
export const firebaseUserJsonSchema = {
  $id: 'firebaseUser',
  type: 'object',
  required: ['uid', 'email', 'role', 'createdAt'],
  properties: {
    uid: {
      type: 'string',
      minLength: FIREBASE_USER_VALIDATION.uid.minLength,
      maxLength: FIREBASE_USER_VALIDATION.uid.maxLength,
      description: 'Firebase UID (unique user identifier)',
    },
    email: {
      type: 'string',
      format: 'email',
      maxLength: FIREBASE_USER_VALIDATION.email.maxLength,
      description: 'User email address',
    },
    displayName: {
      type: ['string', 'null'],
      maxLength: FIREBASE_USER_VALIDATION.displayName.maxLength,
      description: 'User display name',
    },
    role: {
      type: 'string',
      enum: [UserRole.USER, UserRole.ADMIN],
      default: UserRole.USER,
      description: 'User role (user or admin)',
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'Account creation timestamp (ISO 8601)',
    },
    lastLoginAt: {
      type: ['string', 'null'],
      format: 'date-time',
      description: 'Last login timestamp (ISO 8601)',
    },
  },
};

/**
 * JSON Schema for public Firebase User (API responses, excludes sensitive data)
 */
export const publicFirebaseUserJsonSchema = {
  $id: 'publicFirebaseUser',
  type: 'object',
  required: ['uid', 'email'],
  properties: {
    uid: {
      type: 'string',
      description: 'Firebase UID',
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'User email address',
    },
    displayName: {
      type: ['string', 'null'],
      description: 'User display name',
    },
    role: {
      type: 'string',
      enum: [UserRole.USER, UserRole.ADMIN],
      description: 'User role',
    },
  },
};

/**
 * Create a new Firebase user object
 * @param {Object} data - User data from Firebase Auth
 * @param {string} data.uid - Firebase UID
 * @param {string} data.email - User email
 * @param {string} [data.displayName] - User display name
 * @param {string} [data.role] - User role (defaults to 'user')
 * @returns {Object} Firebase User object
 */
export function createFirebaseUser({ uid, email, displayName = null, role = UserRole.USER }) {
  const now = new Date().toISOString();
  return {
    uid,
    email,
    displayName,
    role,
    createdAt: now,
    lastLoginAt: now,
  };
}

/**
 * Convert Firebase user to public representation
 * @param {Object} user - Firebase User object
 * @returns {Object} Public user object
 */
export function toPublicFirebaseUser(user) {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || null,
    role: user.role || UserRole.USER,
  };
}

/**
 * Extract user info from decoded Firebase ID token
 * @param {Object} decodedToken - Decoded Firebase ID token
 * @returns {Object} User info extracted from token
 */
export function extractUserFromToken(decodedToken) {
  return {
    uid: decodedToken.uid || decodedToken.sub,
    email: decodedToken.email,
    displayName: decodedToken.name || null,
    isAdmin: decodedToken.admin === true,
    role: decodedToken.admin === true ? UserRole.ADMIN : UserRole.USER,
  };
}

/**
 * Validate Firebase user data
 * @param {unknown} data - Data to validate
 * @returns {{ success: true, data: Object } | { success: false, error: z.ZodError }}
 */
export function validateFirebaseUser(data) {
  return firebaseUserSchema.safeParse(data);
}
