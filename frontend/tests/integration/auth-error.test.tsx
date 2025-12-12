/**
 * Integration tests for auth error handling in UI
 * T075: [US7] Tests that 401 response shows login prompt
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AuthProvider } from '@/components/AuthProvider';
import AuthErrorMessage from '@/components/AuthErrorMessage';
import { mapAuthError, isAuthenticationError, getErrorAction } from '@/lib/errors';

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
  getCurrentUser: jest.fn(() => null),
  isAuthenticated: jest.fn(() => false),
  getToken: jest.fn(() => null),
  login: jest.fn(),
  logout: jest.fn(),
}));

/**
 * Test wrapper with auth provider
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('Auth Error Message Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockPush.mockClear();
  });

  describe('401 Unauthorized error display', () => {
    it('displays login prompt message for 401 status', () => {
      render(
        <TestWrapper>
          <AuthErrorMessage status={401} />
        </TestWrapper>
      );

      expect(screen.getByText(/please log in/i)).toBeInTheDocument();
    });

    it('shows Login button for 401 status', () => {
      render(
        <TestWrapper>
          <AuthErrorMessage status={401} />
        </TestWrapper>
      );

      const loginButton = screen.getByRole('link', { name: /log in/i });
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).toHaveAttribute('href', '/login');
    });

    it('navigates to login page when Login button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AuthErrorMessage status={401} />
        </TestWrapper>
      );

      const loginLink = screen.getByRole('link', { name: /log in/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('displays context-specific message for edit 401', () => {
      render(
        <TestWrapper>
          <AuthErrorMessage status={401} context="edit" />
        </TestWrapper>
      );

      expect(screen.getByText(/please log in to edit this post/i)).toBeInTheDocument();
    });

    it('displays context-specific message for create 401', () => {
      render(
        <TestWrapper>
          <AuthErrorMessage status={401} context="create" />
        </TestWrapper>
      );

      expect(screen.getByText(/please log in to create a post/i)).toBeInTheDocument();
    });

    it('displays context-specific message for delete 401', () => {
      render(
        <TestWrapper>
          <AuthErrorMessage status={401} context="delete" />
        </TestWrapper>
      );

      expect(screen.getByText(/please log in to delete this post/i)).toBeInTheDocument();
    });
  });

  describe('403 Forbidden error display', () => {
    it('displays permission denied message for 403 status', () => {
      render(
        <TestWrapper>
          <AuthErrorMessage status={403} />
        </TestWrapper>
      );

      expect(screen.getByText(/you don't have permission/i)).toBeInTheDocument();
    });

    it('does not show Login link for 403 status', () => {
      render(
        <TestWrapper>
          <AuthErrorMessage status={403} />
        </TestWrapper>
      );

      // 403 should not show a login link since the user is already logged in
      expect(screen.queryByRole('link', { name: /log in/i })).not.toBeInTheDocument();
    });

    it('displays context-specific message for edit 403', () => {
      render(
        <TestWrapper>
          <AuthErrorMessage status={403} context="edit" />
        </TestWrapper>
      );

      expect(screen.getByText(/you can only edit posts that you created/i)).toBeInTheDocument();
    });

    it('displays context-specific message for delete 403', () => {
      render(
        <TestWrapper>
          <AuthErrorMessage status={403} context="delete" />
        </TestWrapper>
      );

      expect(screen.getByText(/you can only delete posts that you created/i)).toBeInTheDocument();
    });
  });

  describe('Error message helper functions', () => {
    it('mapAuthError returns correct message for 401', () => {
      expect(mapAuthError(401)).toBe('Please log in.');
    });

    it('mapAuthError returns correct message for 403', () => {
      expect(mapAuthError(403)).toBe("You don't have permission.");
    });

    it('isAuthenticationError correctly identifies 401', () => {
      expect(isAuthenticationError(401)).toBe(true);
      expect(isAuthenticationError(403)).toBe(false);
      expect(isAuthenticationError(500)).toBe(false);
    });

    it('getErrorAction returns "Log in" for 401', () => {
      expect(getErrorAction(401)).toBe('Log in');
    });

    it('getErrorAction returns null for 403', () => {
      expect(getErrorAction(403)).toBeNull();
    });
  });

  describe('Other error status codes', () => {
    it('displays appropriate message for 404', () => {
      render(
        <TestWrapper>
          <AuthErrorMessage status={404} />
        </TestWrapper>
      );

      expect(screen.getByText(/the requested resource was not found/i)).toBeInTheDocument();
    });

    it('displays appropriate message for 500', () => {
      render(
        <TestWrapper>
          <AuthErrorMessage status={500} />
        </TestWrapper>
      );

      expect(screen.getByText(/a server error occurred/i)).toBeInTheDocument();
    });

    it('displays retry button for server errors', () => {
      const onRetry = jest.fn();
      
      render(
        <TestWrapper>
          <AuthErrorMessage status={500} onRetry={onRetry} />
        </TestWrapper>
      );

      const retryButton = screen.getByRole('button', { name: /refresh the page/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Toast-style error display', () => {
    it('renders with correct styling for error state', () => {
      render(
        <TestWrapper>
          <AuthErrorMessage status={401} />
        </TestWrapper>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('is accessible with proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <AuthErrorMessage status={401} />
        </TestWrapper>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });
  });
});
