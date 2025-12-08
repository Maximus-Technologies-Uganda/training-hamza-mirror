/**
 * Integration tests for authentication flow
 * Tests login, logout, and auth state management
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
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
      {user && <div data-testid="username">{user.username}</div>}
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
    it('renders login form with username and password fields', async () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
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

      await user.type(screen.getByLabelText(/username/i), 'alice');
      await user.type(screen.getByLabelText(/password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('calls login function on form submission', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce({
        token: 'test-token',
        user: { id: 1, username: 'alice' },
      });
      
      const onSuccess = jest.fn();
      
      render(
        <TestWrapper>
          <LoginForm onSuccess={onSuccess} />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/username/i), 'alice');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          username: 'alice',
          password: 'password123',
        });
      });
    });

    it('calls onSuccess callback after successful login', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce({
        token: 'test-token',
        user: { id: 1, username: 'alice' },
      });
      
      const onSuccess = jest.fn();
      
      render(
        <TestWrapper>
          <LoginForm onSuccess={onSuccess} />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/username/i), 'alice');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('displays error message on login failure', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error('Invalid username or password'));
      
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/username/i), 'alice');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/invalid/i);
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      // Create a promise that won't resolve immediately
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });
      mockLogin.mockReturnValueOnce(loginPromise as any);
      
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/username/i), 'alice');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
      
      // Resolve the promise
      resolveLogin!({ token: 'test-token', user: { id: 1, username: 'alice' } });
    });
  });

  describe('LogoutButton', () => {
    beforeEach(() => {
      mockGetCurrentUser.mockReturnValue({ id: 1, username: 'alice' });
      mockIsAuthenticated.mockReturnValue(true);
    });

    it('renders when user is authenticated', async () => {
      render(
        <TestWrapper>
          <LogoutButton />
        </TestWrapper>
      );

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

      await waitFor(() => {
        expect(screen.getByText(/alice/i)).toBeInTheDocument();
      });
    });

    it('calls logout function when clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <LogoutButton />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /sign out/i }));

      expect(mockLogout).toHaveBeenCalled();
    });

    it('redirects to specified path after logout', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <LogoutButton redirectTo="/goodbye" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /sign out/i }));

      expect(mockPush).toHaveBeenCalledWith('/goodbye');
    });
  });

  describe('AuthProvider', () => {
    it('provides auth state to children', async () => {
      mockGetCurrentUser.mockReturnValue({ id: 1, username: 'alice' });
      mockIsAuthenticated.mockReturnValue(true);
      
      render(
        <TestWrapper>
          <AuthStateDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('username')).toHaveTextContent('alice');
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
      
      mockLogin.mockImplementation(async () => {
        // Simulate successful login updating the state
        mockGetCurrentUser.mockReturnValue({ id: 1, username: 'alice' });
        mockIsAuthenticated.mockReturnValue(true);
        return { token: 'test-token', user: { id: 1, username: 'alice' } };
      });
      
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

      await user.type(screen.getByLabelText(/username/i), 'alice');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });
    });
  });

  describe('Full Login/Logout Cycle', () => {
    it('completes full login and logout cycle', async () => {
      const user = userEvent.setup();
      
      // Start logged out
      mockGetCurrentUser.mockReturnValue(null);
      mockIsAuthenticated.mockReturnValue(false);
      
      mockLogin.mockImplementation(async () => {
        mockGetCurrentUser.mockReturnValue({ id: 1, username: 'alice' });
        mockIsAuthenticated.mockReturnValue(true);
        return { token: 'test-token', user: { id: 1, username: 'alice' } };
      });

      mockLogout.mockImplementation(() => {
        mockGetCurrentUser.mockReturnValue(null);
        mockIsAuthenticated.mockReturnValue(false);
      });
      
      const { rerender } = render(
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
      await user.type(screen.getByLabelText(/username/i), 'alice');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });
    });
  });
});
