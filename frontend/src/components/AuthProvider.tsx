'use client';

/**
 * Authentication Provider Component
 * 
 * Provides authentication context to the entire application.
 * Manages login state, user info, and authentication actions.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  login as authLogin,
  logout as authLogout,
  getCurrentUser,
  isAuthenticated as checkIsAuthenticated,
  type AuthUser,
  type LoginCredentials,
  type LoginResponse,
} from '@/lib/auth';

/**
 * Authentication context state
 */
interface AuthContextState {
  /** Current authenticated user or null */
  user: AuthUser | null;
  
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  
  /** Whether auth state is being initialized */
  isLoading: boolean;
  
  /** Login function */
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  
  /** Logout function */
  logout: () => void;
  
  /** Refresh auth state from storage */
  refreshAuth: () => void;
}

/**
 * Default context value (used when no provider is present)
 */
const defaultContextValue: AuthContextState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {
    throw new Error('AuthProvider not mounted');
  },
  logout: () => {
    throw new Error('AuthProvider not mounted');
  },
  refreshAuth: () => {
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
 * Authentication Provider Component
 * 
 * Wraps the application to provide authentication state and actions.
 * Initializes auth state from localStorage on mount.
 */
export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Refresh auth state from localStorage
   */
  const refreshAuth = useCallback(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  /**
   * Listen for storage changes (login/logout in other tabs)
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'blog_auth_token' || e.key === null) {
        refreshAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshAuth]);

  /**
   * Login handler
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await authLogin(credentials);
    setUser(response.user);
    return response;
  }, []);

  /**
   * Logout handler
   */
  const logout = useCallback(() => {
    authLogout();
    setUser(null);
  }, []);

  /**
   * Computed authentication status
   */
  const isAuthenticated = useMemo(() => {
    return user !== null && checkIsAuthenticated();
  }, [user]);

  /**
   * Context value
   */
  const contextValue = useMemo<AuthContextState>(() => ({
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshAuth,
  }), [user, isAuthenticated, isLoading, login, logout, refreshAuth]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
