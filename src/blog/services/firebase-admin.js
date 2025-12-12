/**
 * Firebase Admin SDK Configuration
 * 
 * This file initializes the Firebase Admin SDK for server-side authentication.
 * It provides utilities for verifying ID tokens and managing user custom claims.
 */

import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Singleton instance (lazy initialized)
let adminApp = null;
let adminAuth = null;
let initialized = false;

/**
 * Initialize the Firebase Admin SDK (lazy - called on first use)
 * Uses environment variables for credentials
 * @returns {{ app: import('firebase-admin/app').App, auth: import('firebase-admin/auth').Auth }}
 */
function initializeFirebaseAdmin() {
  if (initialized) {
    return { app: adminApp, auth: adminAuth };
  }

  if (!getApps().length) {
    // Check if running with emulator
    const isEmulator = process.env.FIREBASE_AUTH_EMULATOR_HOST;
    
    if (isEmulator) {
      // When using emulator, only need projectId
      adminApp = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
      });
    } else {
      // Production: use service account credentials
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        throw new Error(
          'Firebase Admin SDK requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables'
        );
      }
      
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
    }
  } else {
    adminApp = getApp();
  }
  
  adminAuth = getAuth(adminApp);
  initialized = true;
  
  return { app: adminApp, auth: adminAuth };
}

/**
 * Get the Firebase Admin App (lazy initialized)
 * @returns {import('firebase-admin/app').App}
 */
export function getAdminApp() {
  const { app } = initializeFirebaseAdmin();
  return app;
}

/**
 * Get the Firebase Admin Auth (lazy initialized)
 * @returns {import('firebase-admin/auth').Auth}
 */
export function getAdminAuth() {
  const { auth } = initializeFirebaseAdmin();
  return auth;
}

// Legacy exports for backwards compatibility (now lazy via getters)
export { getAdminApp as adminApp, getAdminAuth as adminAuth };

/**
 * Verify a Firebase ID token
 * @param {string} idToken - The ID token to verify
 * @returns {Promise<import('firebase-admin/auth').DecodedIdToken>} The decoded token
 * @throws {Error} If token is invalid or expired
 */
export async function verifyIdToken(idToken) {
  return getAdminAuth().verifyIdToken(idToken);
}

/**
 * Create a session cookie from an ID token
 * @param {string} idToken - The ID token to exchange
 * @param {number} expiresIn - Cookie expiration time in milliseconds (default: 5 days)
 * @returns {Promise<string>} The session cookie
 */
export async function createSessionCookie(idToken, expiresIn = 5 * 24 * 60 * 60 * 1000) {
  return getAdminAuth().createSessionCookie(idToken, { expiresIn });
}

/**
 * Verify a session cookie
 * @param {string} sessionCookie - The session cookie to verify
 * @param {boolean} checkRevoked - Whether to check if the session has been revoked
 * @returns {Promise<import('firebase-admin/auth').DecodedIdToken>} The decoded token
 */
export async function verifySessionCookie(sessionCookie, checkRevoked = true) {
  return getAdminAuth().verifySessionCookie(sessionCookie, checkRevoked);
}

/**
 * Set custom claims on a user (e.g., admin role)
 * @param {string} uid - The user's Firebase UID
 * @param {object} claims - The custom claims to set
 */
export async function setCustomClaims(uid, claims) {
  return getAdminAuth().setCustomUserClaims(uid, claims);
}

/**
 * Get user by UID
 * @param {string} uid - The user's Firebase UID
 * @returns {Promise<import('firebase-admin/auth').UserRecord>} The user record
 */
export async function getUserByUid(uid) {
  return getAdminAuth().getUser(uid);
}

/**
 * Get user by email
 * @param {string} email - The user's email address
 * @returns {Promise<import('firebase-admin/auth').UserRecord>} The user record
 */
export async function getUserByEmail(email) {
  return getAdminAuth().getUserByEmail(email);
}

/**
 * Check Firebase connectivity (for health checks)
 * @returns {Promise<{connected: boolean, projectId: string|null, error: string|null}>}
 */
export async function verifyFirebaseConnection() {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-project';
    const isEmulator = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);

    // In production, ensure required credentials exist before initialization
    if (!isEmulator) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      const missingVars = [];

      if (!process.env.FIREBASE_PROJECT_ID) missingVars.push('FIREBASE_PROJECT_ID');
      if (!process.env.FIREBASE_CLIENT_EMAIL) missingVars.push('FIREBASE_CLIENT_EMAIL');
      if (!privateKey) missingVars.push('FIREBASE_PRIVATE_KEY');

      if (missingVars.length) {
        throw new Error(`Missing Firebase credentials: ${missingVars.join(', ')}`);
      }
    }

    // Try to initialize the admin SDK; this will throw if credentials are invalid
    const { app, auth } = initializeFirebaseAdmin();

    // For production, fetch an access token to confirm credentials are usable
    if (!isEmulator) {
      if (typeof app.options?.credential?.getAccessToken === 'function') {
        await app.options.credential.getAccessToken();
      } else {
        await auth.listUsers(1);
      }
    }

    return {
      connected: true,
      projectId,
      emulator: isEmulator,
      error: null
    };
  } catch (error) {
    const isEmulator = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);
    return {
      connected: false,
      projectId: isEmulator ? (process.env.FIREBASE_PROJECT_ID || 'demo-project') : (process.env.FIREBASE_PROJECT_ID || null),
      emulator: isEmulator,
      error: error.message
    };
  }
}
