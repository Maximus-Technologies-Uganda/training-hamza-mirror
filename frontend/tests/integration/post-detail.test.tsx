/**
 * Integration tests for post detail page
 * Tests data fetching, rendering, and error handling
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Post } from '@/lib/types';
import { ApiError } from '@/lib/api';
import { AuthProvider } from '@/components/AuthProvider';

// Mock the API module
jest.mock('@/lib/api', () => {
  const actualApi = jest.requireActual('@/lib/api');
  return {
    ...actualApi,
    getPost: jest.fn(),
  };
});

// Mock auth functions
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
  isAuthenticated: jest.fn(() => false),
  getToken: jest.fn(() => null),
  login: jest.fn(),
  logout: jest.fn(),
  getAuthHeaders: jest.fn(() => ({})),
}));

import * as authModule from '@/lib/auth';

// Mock next/navigation
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: mockReplace,
  }),
  useParams: () => ({ id: '1' }),
  notFound: jest.fn(),
}));

// Mock SWR to control its behavior
jest.mock('swr', () => {
  const originalModule = jest.requireActual('swr');
  return {
    __esModule: true,
    ...originalModule,
    default: jest.fn(),
  };
});

import useSWR from 'swr';
import PostDetailPage from '@/app/posts/[id]/page';

const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;

const mockPost: Post = {
  id: 1,
  title: 'Integration Test Post',
  slug: 'integration-test-post',
  body: 'This is the full content of the integration test post.\n\nIt has multiple paragraphs for testing.',
  createdAt: '2025-11-27T10:00:00Z',
  updatedAt: '2025-11-28T15:30:00Z',
  ownerId: 'user-1', // Added ownerId for auth tests
};

// Helper to render with AuthProvider
const renderWithAuth = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      {ui}
    </AuthProvider>
  );
};

describe('Post Detail Page Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auth to unauthenticated state by default
    (authModule.getCurrentUser as jest.Mock).mockReturnValue(null);
    (authModule.isAuthenticated as jest.Mock).mockReturnValue(false);
    (authModule.getToken as jest.Mock).mockReturnValue(null);
  });

  it('fetches and displays post from API', async () => {
    mockUseSWR.mockReturnValue({
      data: mockPost,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as any);

    renderWithAuth(<PostDetailPage params={{ id: '1' }} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Integration Test Post');
    });

    expect(screen.getByText(/This is the full content/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: false,
      mutate: jest.fn(),
    } as any);

    renderWithAuth(<PostDetailPage params={{ id: '1' }} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('handles 404 error when post not found', async () => {
    // Create a proper ApiError instance for 404
    const error404 = new ApiError(404, 'Post not found');
    
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: error404,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as any);

    renderWithAuth(<PostDetailPage params={{ id: '999' }} />);

    // Component redirects to 404 page via router.replace
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/404');
    });
  });

  it('displays error state for non-404 errors', async () => {
    // Create a proper ApiError instance for 500 error
    const error500 = new ApiError(500, 'Internal Server Error');
    
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: error500,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as any);

    renderWithAuth(<PostDetailPage params={{ id: '1' }} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('displays post creation date in human-readable format', async () => {
    mockUseSWR.mockReturnValue({
      data: mockPost,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as any);

    renderWithAuth(<PostDetailPage params={{ id: '1' }} />);

    await waitFor(() => {
      expect(screen.getByText(/November 27, 2025/i)).toBeInTheDocument();
    });
  });

  it('displays post slug', async () => {
    mockUseSWR.mockReturnValue({
      data: mockPost,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as any);

    renderWithAuth(<PostDetailPage params={{ id: '1' }} />);

    await waitFor(() => {
      expect(screen.getByText(/integration-test-post/i)).toBeInTheDocument();
    });
  });

  it('renders back to home navigation link', async () => {
    mockUseSWR.mockReturnValue({
      data: mockPost,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as any);

    renderWithAuth(<PostDetailPage params={{ id: '1' }} />);

    await waitFor(() => {
      const homeLink = screen.getByRole('link', { name: /back|home/i });
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });

  it('renders edit link when user is owner', async () => {
    // Mock authenticated user who owns the post
    (authModule.getCurrentUser as jest.Mock).mockReturnValue({ uid: 'user-1', email: 'alice@example.com' });
    (authModule.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authModule.getToken as jest.Mock).mockReturnValue('mock-token');

    mockUseSWR.mockReturnValue({
      data: mockPost,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as any);

    renderWithAuth(<PostDetailPage params={{ id: '1' }} />);

    await waitFor(() => {
      const editLink = screen.getByRole('link', { name: /edit/i });
      expect(editLink).toHaveAttribute('href', '/posts/1/edit');
    });
  });

  it('handles invalid post ID gracefully', async () => {
    // With invalid ID, the component redirects to 404 via router.replace
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as any);

    renderWithAuth(<PostDetailPage params={{ id: 'invalid' }} />);

    // Should call router.replace with 404 when ID is invalid
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/404');
    });
  });
});
