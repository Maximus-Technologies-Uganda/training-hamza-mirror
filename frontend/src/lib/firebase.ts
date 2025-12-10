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
  User
} from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

// Initialize Firebase app (singleton pattern to avoid duplicate initialization)
let app: FirebaseApp;
let auth: Auth;

function initializeFirebase(): { app: FirebaseApp; auth: Auth } {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    // Connect to auth emulator in development
    if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST && typeof window !== 'undefined') {
      const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
      // Check if already connected to avoid error
      if ((auth as unknown as { _canInitEmulator?: boolean })._canInitEmulator !== false) {
        connectAuthEmulator(auth, `http://${emulatorHost}`, { disableWarnings: true });
      }
    }
  } else {
    const existingApp = getApps()[0];
    if (existingApp) {
      app = existingApp;
      auth = getAuth(app);
    } else {
      // Fallback: initialize new app if none exists
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
    }
  }
  
  return { app, auth };
}

// Initialize on module load
const { app: firebaseApp, auth: firebaseAuth } = initializeFirebase();

export { firebaseApp as app, firebaseAuth as auth };

/**
 * Sign in with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise resolving to the authenticated user
 */
export async function signInWithEmail(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  return userCredential.user;
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(firebaseAuth);
}

/**
 * Get the current user's ID token
 * @param forceRefresh - Whether to force refresh the token
 * @returns Promise resolving to the ID token or null if not authenticated
 */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = firebaseAuth.currentUser;
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
  return firebaseAuth.currentUser;
}

/**
 * Subscribe to authentication state changes
 * @param callback - Callback function called when auth state changes
 * @returns Unsubscribe function
 */
export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(firebaseAuth, callback);
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
