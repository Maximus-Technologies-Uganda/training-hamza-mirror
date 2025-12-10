'use client';

/**
 * Authentication Provider Component
 * 
 * Provides authentication context to the entire application.
 * Integrates with Firebase Auth for email/password authentication.
 * Manages login state, user info, and authentication actions.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  auth,
  signInWithEmail,
  signOut as firebaseSignOut,
  subscribeToAuthChanges,
  getIdToken,
  isAdmin as checkIsAdmin,
} from '@/lib/firebase';
import {
  login as legacyLogin,
  logout as legacyLogout,
  getCurrentUser as getLegacyUser,
  isAuthenticated as checkLegacyAuthenticated,
  type AuthUser as LegacyAuthUser,
  type LoginCredentials,
  type LoginResponse,
} from '@/lib/auth';

/**
 * User information from Firebase Auth
 */
export interface FirebaseAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAdmin: boolean;
}

/**
 * Merged auth user type (supports both Firebase and legacy JWT)
 */
export type AuthUser = FirebaseAuthUser | LegacyAuthUser;

/**
 * Helper to check if user is Firebase user
 */
export function isFirebaseUser(user: AuthUser | null): user is FirebaseAuthUser {
  return user !== null && 'uid' in user;
}

/**
 * Helper to get user ID (uid for Firebase, id for legacy)
 */
export function getUserId(user: AuthUser | null): string | number | null {
  if (!user) return null;
  return 'uid' in user ? user.uid : user.id;
}

/**
 * Helper to get user display name (email for Firebase, username for legacy)
 */
export function getUserDisplayName(user: AuthUser | null): string | null {
  if (!user) return null;
  if ('uid' in user) {
    return user.displayName || user.email;
  }
  return user.username;
}

/**
 * Authentication context state
 */
interface AuthContextState {
  /** Current authenticated user or null */
  user: AuthUser | null;
  
  /** Firebase user object (if using Firebase auth) */
  firebaseUser: FirebaseUser | null;
  
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  
  /** Whether user has admin role */
  isAdmin: boolean;
  
  /** Whether auth state is being initialized */
  isLoading: boolean;
  
  /** Login function (supports both Firebase and legacy) */
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  
  /** Firebase sign in with email/password */
  signInWithEmail: (email: string, password: string) => Promise<FirebaseUser>;
  
  /** Logout function */
  logout: () => Promise<void>;
  
  /** Refresh auth state */
  refreshAuth: () => void;
  
  /** Get current ID token for API calls */
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
}

/**
 * Default context value (used when no provider is present)
 */
const defaultContextValue: AuthContextState = {
  user: null,
  firebaseUser: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,
  login: async () => {
    throw new Error('AuthProvider not mounted');
  },
  signInWithEmail: async () => {
    throw new Error('AuthProvider not mounted');
  },
  logout: async () => {
    throw new Error('AuthProvider not mounted');
  },
  refreshAuth: () => {
    throw new Error('AuthProvider not mounted');
  },
  getIdToken: async () => {
    throw new Error('AuthProvider not mounted');
  },
};

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextState>(defaultContextValue);

/**
 * Hook to access auth context
 * Must be used within an AuthProvider
 */
export function useAuth(): AuthContextState {
  const context = useContext(AuthContext);
  if (context === defaultContextValue) {
    console.warn('useAuth called outside of AuthProvider');
  }
  return context;
}

/**
 * Props for AuthProvider component
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Convert Firebase user to AuthUser format
 */
function firebaseUserToAuthUser(fbUser: FirebaseUser, isAdmin: boolean): FirebaseAuthUser {
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName,
    isAdmin,
  };
}

/**
 * Authentication Provider Component
 * 
 * Wraps the application to provide authentication state and actions.
 * Supports both Firebase Auth and legacy JWT authentication.
 */
export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [legacyUser, setLegacyUser] = useState<LegacyAuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Refresh legacy auth state from localStorage
   */
  const refreshLegacyAuth = useCallback(() => {
    const currentUser = getLegacyUser();
    setLegacyUser(currentUser);
  }, []);

  /**
   * Refresh auth state
   */
  const refreshAuth = useCallback(() => {
    refreshLegacyAuth();
    // Firebase auth state is managed by onAuthStateChanged
  }, [refreshLegacyAuth]);

  /**
   * Subscribe to Firebase auth state changes
   */
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        // Check if user is admin
        const adminStatus = await checkIsAdmin(fbUser);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Initialize legacy auth state on mount
   */
  useEffect(() => {
    refreshLegacyAuth();
  }, [refreshLegacyAuth]);

  /**
   * Listen for storage changes (legacy auth - login/logout in other tabs)
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'blog_auth_token' || e.key === null) {
        refreshLegacyAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshLegacyAuth]);

  /**
   * Firebase email/password sign in
   */
  const handleFirebaseSignIn = useCallback(async (email: string, password: string): Promise<FirebaseUser> => {
    const user = await signInWithEmail(email, password);
    return user;
  }, []);

  /**
   * Legacy login handler (for backwards compatibility)
   */
  const handleLogin = useCallback(async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await legacyLogin(credentials);
    setLegacyUser(response.user);
    return response;
  }, []);

  /**
   * Logout handler (handles both Firebase and legacy)
   */
  const handleLogout = useCallback(async () => {
    // Sign out from Firebase
    await firebaseSignOut();
    
    // Also clear legacy auth
    legacyLogout();
    setLegacyUser(null);
  }, []);

  /**
   * Get ID token for API calls
   */
  const handleGetIdToken = useCallback(async (forceRefresh = false): Promise<string | null> => {
    return getIdToken(forceRefresh);
  }, []);

  /**
   * Computed user (prefer Firebase user over legacy)
   */
  const user = useMemo<AuthUser | null>(() => {
    if (firebaseUser) {
      return firebaseUserToAuthUser(firebaseUser, isAdmin);
    }
    return legacyUser;
  }, [firebaseUser, legacyUser, isAdmin]);

  /**
   * Computed authentication status
   */
  const isAuthenticated = useMemo(() => {
    if (firebaseUser) {
      return true;
    }
    return legacyUser !== null && checkLegacyAuthenticated();
  }, [firebaseUser, legacyUser]);

  /**
   * Context value
   */
  const contextValue = useMemo<AuthContextState>(() => ({
    user,
    firebaseUser,
    isAuthenticated,
    isAdmin,
    isLoading,
    login: handleLogin,
    signInWithEmail: handleFirebaseSignIn,
    logout: handleLogout,
    refreshAuth,
    getIdToken: handleGetIdToken,
  }), [user, firebaseUser, isAuthenticated, isAdmin, isLoading, handleLogin, handleFirebaseSignIn, handleLogout, refreshAuth, handleGetIdToken]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
