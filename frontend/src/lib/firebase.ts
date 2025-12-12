/**
 * Firebase Client SDK Configuration
 * 
 * This file initializes the Firebase client SDK for use in the frontend.
 * It provides authentication utilities for email/password sign-in.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

type FirebaseContext = {
  app: FirebaseApp | null;
  auth: Auth | null;
  initialized: boolean;
};

let firebaseContext: FirebaseContext | null = null;
let warnedMissingConfig = false;

function hasClientFirebaseConfig(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);
}

function initFirebaseClient(): FirebaseContext {
  if (firebaseContext) {
    return firebaseContext;
  }

  // Avoid initializing Firebase during SSR/SSG when env vars may be absent
  if (typeof window === 'undefined') {
    firebaseContext = { app: null, auth: null, initialized: false };
    return firebaseContext;
  }

  if (!hasClientFirebaseConfig()) {
    if (!warnedMissingConfig) {
      console.warn('[firebase] Missing NEXT_PUBLIC_FIREBASE_* env vars. Firebase auth disabled.');
      warnedMissingConfig = true;
    }
    firebaseContext = { app: null, auth: null, initialized: false };
    return firebaseContext;
  }

  const appInstance = getApps()[0] ?? initializeApp(firebaseConfig);
  const authInstance = getAuth(appInstance);

  // Connect to auth emulator in development
  if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST) {
    const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
    if ((authInstance as unknown as { _canInitEmulator?: boolean })._canInitEmulator !== false) {
      connectAuthEmulator(authInstance, `http://${emulatorHost}`, { disableWarnings: true });
    }
  }

  firebaseContext = { app: appInstance, auth: authInstance, initialized: true };
  return firebaseContext;
}

function requireAuthInstance(): Auth {
  const context = initFirebaseClient();
  if (!context.auth) {
    throw new Error('Firebase Auth is not initialized. Ensure NEXT_PUBLIC_FIREBASE_* env vars are set in the client runtime.');
  }
  return context.auth;
}

// Exported for compatibility; may be null during SSR/SSG when Firebase is disabled
const { app: firebaseApp, auth: firebaseAuth } = initFirebaseClient();

export { firebaseApp as app, firebaseAuth as auth };

/**
 * Sign in with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise resolving to the authenticated user
 */
export async function signInWithEmail(email: string, password: string): Promise<User> {
  const authInstance = requireAuthInstance();
  const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
  return userCredential.user;
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  const authInstance = initFirebaseClient().auth;
  if (!authInstance) {
    return;
  }
  await firebaseSignOut(authInstance);
}

/**
 * Get the current user's ID token
 * @param forceRefresh - Whether to force refresh the token
 * @returns Promise resolving to the ID token or null if not authenticated
 */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const authInstance = initFirebaseClient().auth;
  const user = authInstance?.currentUser;
  if (!user) {
    return null;
  }
  return user.getIdToken(forceRefresh);
}

/**
 * Get the current authenticated user
 * @returns The current user or null if not authenticated
 */
export function getCurrentUser(): User | null {
  return initFirebaseClient().auth?.currentUser ?? null;
}

/**
 * Subscribe to authentication state changes
 * @param callback - Callback function called when auth state changes
 * @returns Unsubscribe function
 */
export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  const authInstance = initFirebaseClient().auth;
  if (!authInstance) {
    return () => undefined;
  }
  return onAuthStateChanged(authInstance, callback);
}

/**
 * Check if user has admin role from custom claims
 * @param user - Firebase user object
 * @returns Promise resolving to boolean indicating admin status
 */
export async function isAdmin(user: User | null): Promise<boolean> {
  if (!user) {
    return false;
  }
  const tokenResult = await user.getIdTokenResult();
  return tokenResult.claims.admin === true;
}
