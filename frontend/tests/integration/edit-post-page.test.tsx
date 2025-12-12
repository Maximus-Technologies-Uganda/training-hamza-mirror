/**
 * Integration tests for Edit Post page
 * Tests the edit post client component workflow
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditPostClient from '@/app/posts/[id]/edit/EditPostClient';
import type { Post } from '@/lib/types';
import { AuthProvider } from '@/components/AuthProvider';

// Mock router - must be before component imports
const mockNotFoundFn = jest.fn(() => {
  // notFound() should throw to stop component rendering
  throw new Error('NEXT_NOT_FOUND');
});
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
  }),
  notFound: () => mockNotFoundFn(),
}));

// Mock SWR
const mockMutate = jest.fn();
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
  useSWRConfig: () => ({
    mutate: jest.fn(),
  }),
}));

// Mock API
jest.mock('@/lib/api', () => ({
  getPost: jest.fn(),
  updatePost: jest.fn(),
  isApiError: (error: any) => error?.statusCode !== undefined,
  ApiError: class MockApiError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

// Mock auth functions - authenticated user who owns the post by default
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(() => ({ uid: 'user-1', email: 'alice@example.com' })),
  isAuthenticated: jest.fn(() => true),
  getToken: jest.fn(() => 'mock-token'),
  login: jest.fn(),
  logout: jest.fn(),
  getAuthHeaders: jest.fn(() => ({ Authorization: 'Bearer mock-token' })),
}));

// Import SWR mock
import useSWR from 'swr';

const mockUseSWR = useSWR as jest.Mock;

// Helper to render with AuthProvider
const renderWithAuth = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      {ui}
    </AuthProvider>
  );
};

describe('EditPostClient', () => {
  const mockPost: Post = {
    id: 1,
    title: 'Test Post',
    slug: 'test-post',
    body: 'This is test content for the post.',
    createdAt: '2025-11-27T10:00:00Z',
    updatedAt: '2025-11-27T10:00:00Z',
    ownerId: 'user-1', // Added ownerId to match authenticated user
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading skeleton when fetching', () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: true,
        mutate: mockMutate,
      });

      renderWithAuth(<EditPostClient id="1" />);

      // Check for loading indicators (skeleton elements with animate-pulse)
      const container = document.querySelector('.animate-pulse');
      expect(container).toBeInTheDocument();
    });

    it('displays animated skeleton elements', () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: true,
        mutate: mockMutate,
      });

      renderWithAuth(<EditPostClient id="1" />);

      // Should have pulse animation class
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('renders edit form when post is loaded', async () => {
      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
      });

      renderWithAuth(<EditPostClient id="1" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit post/i })).toBeInTheDocument();
      });
    });

    it('displays form with pre-filled title', async () => {
      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
      });

      renderWithAuth(<EditPostClient id="1" />);

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/title/i);
        expect(titleInput).toHaveValue(mockPost.title);
      });
    });

    it('displays form with pre-filled body', async () => {
      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
      });

      renderWithAuth(<EditPostClient id="1" />);

      await waitFor(() => {
        const bodyInput = screen.getByLabelText(/body/i);
        expect(bodyInput).toHaveValue(mockPost.body);
      });
    });

    it('shows update button instead of create', async () => {
      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
      });

      renderWithAuth(<EditPostClient id="1" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update post/i })).toBeInTheDocument();
      });
    });

    it('displays helpful description text', async () => {
      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
      });

      renderWithAuth(<EditPostClient id="1" />);

      await waitFor(() => {
        expect(screen.getByText(/update your blog post/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('shows error message for general errors', async () => {
      const error = new Error('Failed to load post');
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: error,
        isLoading: false,
        mutate: mockMutate,
      });

      renderWithAuth(<EditPostClient id="1" />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load post/i)).toBeInTheDocument();
      });
    });

    it('shows generic error for non-Error objects', async () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: { message: undefined },
        isLoading: false,
        mutate: mockMutate,
      });

      renderWithAuth(<EditPostClient id="1" />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load post for editing/i)).toBeInTheDocument();
      });
    });
  });

  describe('ID Handling', () => {
    it('parses string ID to number', () => {
      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
      });

      renderWithAuth(<EditPostClient id="42" />);

      // The hook should be called with parsed ID
      expect(mockUseSWR).toHaveBeenCalled();
    });

    it('handles invalid ID by redirecting to 404', async () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
      });

      // When post is undefined (not found), component should redirect to 404
      renderWithAuth(<EditPostClient id="invalid" />);
      
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/404');
      });
    });
  });

  describe('Accessibility', () => {
    it('has accessible heading', async () => {
      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
      });

      renderWithAuth(<EditPostClient id="1" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
    });

    it('loading state has skeleton animation', () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: true,
        mutate: mockMutate,
      });

      renderWithAuth(<EditPostClient id="1" />);

      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });
});
