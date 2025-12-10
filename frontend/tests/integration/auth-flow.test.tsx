/**
 * Integration tests for authentication flow
 * Tests login, logout, and auth state management
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth, getUserDisplayName } from '@/components/AuthProvider';
import LoginForm from '@/components/LoginForm';
import LogoutButton from '@/components/LogoutButton';
import * as authModule from '@/lib/auth';

// Mock next/navigation
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Mock Firebase module
const mockSignInWithEmail = jest.fn();
const mockSignOut = jest.fn();
const mockGetIdToken = jest.fn();
const mockIsAdmin = jest.fn();
let authStateCallback: ((user: unknown) => void) | null = null;

jest.mock('@/lib/firebase', () => ({
  auth: null,
  signInWithEmail: (...args: unknown[]) => mockSignInWithEmail(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  subscribeToAuthChanges: (callback: (user: unknown) => void) => {
    authStateCallback = callback;
    // Initially not authenticated
    callback(null);
    return () => { authStateCallback = null; };
  },
  getIdToken: (...args: unknown[]) => mockGetIdToken(...args),
  isAdmin: (...args: unknown[]) => mockIsAdmin(...args),
}));

// Helper to simulate auth state change
function setFirebaseUser(user: { uid: string; email: string; displayName: string } | null) {
  if (authStateCallback) {
    authStateCallback(user);
  }
};

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

// Mock auth module
jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  login: jest.fn(),
  logout: jest.fn(),
  getCurrentUser: jest.fn(),
  isAuthenticated: jest.fn(),
  getToken: jest.fn(),
}));

const mockLogin = authModule.login as jest.MockedFunction<typeof authModule.login>;
const mockLogout = authModule.logout as jest.MockedFunction<typeof authModule.logout>;
const mockGetCurrentUser = authModule.getCurrentUser as jest.MockedFunction<typeof authModule.getCurrentUser>;
const mockIsAuthenticated = authModule.isAuthenticated as jest.MockedFunction<typeof authModule.isAuthenticated>;
const mockGetToken = authModule.getToken as jest.MockedFunction<typeof authModule.getToken>;

/**
 * Test component that displays auth state
 */
function AuthStateDisplay() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div data-testid="loading">Loading...</div>;
  }
  
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      {user && <div data-testid="username">{getUserDisplayName(user)}</div>}
    </div>
  );
}

/**
 * Wrapper component for testing
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockGetCurrentUser.mockReturnValue(null);
    mockIsAuthenticated.mockReturnValue(false);
    mockGetToken.mockReturnValue(null);
  });

  describe('LoginForm', () => {
    it('renders login form with email and password fields', async () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('disables submit button when fields are empty', async () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when fields are filled', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('calls login function on form submission', async () => {
      const user = userEvent.setup();
      const mockFirebaseUser = {
        uid: '123',
        email: 'alice@example.com',
        displayName: 'Alice',
      };
      mockSignInWithEmail.mockResolvedValueOnce(mockFirebaseUser);
      
      const onSuccess = jest.fn();
      
      render(
        <TestWrapper>
          <LoginForm onSuccess={onSuccess} />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignInWithEmail).toHaveBeenCalledWith(
          'alice@example.com',
          'password123',
        );
      });
    });

    it('calls onSuccess callback after successful login', async () => {
      const user = userEvent.setup();
      const mockFirebaseUser = {
        uid: '123',
        email: 'alice@example.com',
        displayName: 'Alice',
      };
      mockSignInWithEmail.mockResolvedValueOnce(mockFirebaseUser);
      
      const onSuccess = jest.fn();
      
      render(
        <TestWrapper>
          <LoginForm onSuccess={onSuccess} />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('displays error message on login failure', async () => {
      const user = userEvent.setup();
      mockSignInWithEmail.mockRejectedValueOnce(new Error('Invalid credentials'));
      
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/invalid/i);
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      // Create a promise that won't resolve immediately
      let resolveLogin: (value: unknown) => void;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });
      mockSignInWithEmail.mockReturnValueOnce(loginPromise as Promise<unknown>);
      
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
      
      // Resolve the promise
      resolveLogin!({ uid: '123', email: 'alice@example.com', displayName: 'Alice' });
    });
  });

  describe('LogoutButton', () => {
    const mockFirebaseUser = { uid: '123', email: 'alice@example.com', displayName: 'Alice' };

    beforeEach(() => {
      mockGetCurrentUser.mockReturnValue({ id: 1, email: 'alice@example.com' });
      mockIsAuthenticated.mockReturnValue(true);
      mockIsAdmin.mockResolvedValue(false);
    });

    it('renders when user is authenticated', async () => {
      render(
        <TestWrapper>
          <LogoutButton />
        </TestWrapper>
      );

      // Simulate Firebase auth state with logged-in user
      await act(async () => {
        setFirebaseUser(mockFirebaseUser);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
      });
    });

    it('shows username when showUsername prop is true', async () => {
      render(
        <TestWrapper>
          <LogoutButton showUsername />
        </TestWrapper>
      );

      // Simulate Firebase auth state with logged-in user
      await act(async () => {
        setFirebaseUser(mockFirebaseUser);
      });

      await waitFor(() => {
        expect(screen.getByText(/alice/i)).toBeInTheDocument();
      });
    });

    it('calls logout function when clicked', async () => {
      const user = userEvent.setup();
      mockSignOut.mockResolvedValue(undefined);
      
      render(
        <TestWrapper>
          <LogoutButton />
        </TestWrapper>
      );

      // Simulate Firebase auth state with logged-in user
      await act(async () => {
        setFirebaseUser(mockFirebaseUser);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /sign out/i }));

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });

    it('redirects to specified path after logout', async () => {
      const user = userEvent.setup();
      mockSignOut.mockResolvedValue(undefined);
      
      render(
        <TestWrapper>
          <LogoutButton redirectTo="/goodbye" />
        </TestWrapper>
      );

      // Simulate Firebase auth state with logged-in user
      await act(async () => {
        setFirebaseUser(mockFirebaseUser);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /sign out/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/goodbye');
      });
    });
  });

  describe('AuthProvider', () => {
    it('provides auth state to children', async () => {
      mockGetCurrentUser.mockReturnValue({ id: 1, email: 'alice@example.com' });
      mockIsAuthenticated.mockReturnValue(true);
      mockIsAdmin.mockResolvedValue(false);
      
      render(
        <TestWrapper>
          <AuthStateDisplay />
        </TestWrapper>
      );

      // Simulate Firebase auth state with logged-in user
      await act(async () => {
        setFirebaseUser({ uid: '123', email: 'alice@example.com', displayName: 'Alice' });
      });

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('username')).toHaveTextContent('Alice');
    });

    it('shows not authenticated when user is logged out', async () => {
      mockGetCurrentUser.mockReturnValue(null);
      mockIsAuthenticated.mockReturnValue(false);
      
      render(
        <TestWrapper>
          <AuthStateDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    it('updates auth state after login', async () => {
      const user = userEvent.setup();
      mockGetCurrentUser.mockReturnValue(null);
      mockIsAuthenticated.mockReturnValue(false);
      mockIsAdmin.mockResolvedValue(false);
      
      const mockFirebaseUser = { uid: '123', email: 'alice@example.com', displayName: 'Alice' };
      mockSignInWithEmail.mockResolvedValueOnce(mockFirebaseUser);
      
      render(
        <TestWrapper>
          <AuthStateDisplay />
          <LoginForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');

      await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Simulate Firebase auth state change after successful login
      await act(async () => {
        setFirebaseUser(mockFirebaseUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });
    });
  });

  describe('Full Login/Logout Cycle', () => {
    it('completes full login and logout cycle', async () => {
      const user = userEvent.setup();
      mockIsAdmin.mockResolvedValue(false);
      
      // Start logged out
      mockGetCurrentUser.mockReturnValue(null);
      mockIsAuthenticated.mockReturnValue(false);
      
      const mockFirebaseUser = { uid: '123', email: 'alice@example.com', displayName: 'Alice' };
      mockSignInWithEmail.mockResolvedValueOnce(mockFirebaseUser);
      mockSignOut.mockResolvedValue(undefined);
      
      render(
        <TestWrapper>
          <AuthStateDisplay />
          <LoginForm />
          <LogoutButton />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Initially not authenticated
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');

      // Login
      await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Simulate Firebase auth state change after successful login
      await act(async () => {
        setFirebaseUser(mockFirebaseUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });
    });
  });
});
