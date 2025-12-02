/**
 * Integration tests for post list page
 * Tests data fetching, rendering, and error handling
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '@/app/page';
import type { Post } from '@/lib/types';
import * as api from '@/lib/api';

// Mock the API module
jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  getPosts: jest.fn(),
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

const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;

// Mock API responses
const mockPosts: Post[] = [
  {
    id: 1,
    title: 'Integration Test Post 1',
    slug: 'integration-test-post-1',
    body: 'This is the first test post content.',
    createdAt: '2025-11-27T10:00:00Z',
    updatedAt: '2025-11-27T10:00:00Z',
  },
  {
    id: 2,
    title: 'Integration Test Post 2',
    slug: 'integration-test-post-2',
    body: 'This is the second test post content.',
    createdAt: '2025-11-26T10:00:00Z',
    updatedAt: '2025-11-26T10:00:00Z',
  },
];

describe('Home Page Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and displays posts from API', async () => {
    mockUseSWR.mockReturnValue({
      data: mockPosts,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as any);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Integration Test Post 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Integration Test Post 2')).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: false,
      mutate: jest.fn(),
    } as any);

    render(<Home />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays empty state when no posts exist', async () => {
    mockUseSWR.mockReturnValue({
      data: [],
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as any);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/no posts/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const mockError = new Error('Failed to fetch posts');
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as any);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('provides retry functionality on error', async () => {
    const mutateFn = jest.fn();
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: new Error('Server Error'),
      isLoading: false,
      isValidating: false,
      mutate: mutateFn,
    } as any);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Should have retry button (aria-label is "Retry loading")
    const retryButton = screen.getByRole('button', { name: /retry loading/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('renders page with correct metadata', () => {
    mockUseSWR.mockReturnValue({
      data: mockPosts,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as any);

    render(<Home />);
    // Page should have heading
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('displays create new post button', () => {
    mockUseSWR.mockReturnValue({
      data: mockPosts,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as any);

    render(<Home />);
    
    const createButton = screen.getByRole('link', { name: /create new blog post/i });
    expect(createButton).toHaveAttribute('href', '/posts/new');
  });
});
