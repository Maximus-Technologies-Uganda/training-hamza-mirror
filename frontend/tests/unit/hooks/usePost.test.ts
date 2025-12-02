/**
 * Unit tests for usePost hook
 * Tests fetching single posts with SWR
 */

import { renderHook, waitFor } from '@testing-library/react';
import { usePost } from '@/lib/hooks/usePost';
import type { Post } from '@/lib/types';

// Mock SWR
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Import the mock
import useSWR from 'swr';
const mockUseSWR = useSWR as jest.Mock;

describe('usePost', () => {
  const mockPost: Post = {
    id: 1,
    title: 'Test Post',
    slug: 'test-post',
    body: 'Test content',
    createdAt: '2025-11-27T10:00:00Z',
    updatedAt: '2025-11-27T10:00:00Z',
  };

  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('returns isLoading true while fetching', () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: true,
        mutate: mockMutate,
      });

      const { result } = renderHook(() => usePost(1));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.post).toBeUndefined();
      expect(result.current.isError).toBeUndefined();
    });
  });

  describe('Success State', () => {
    it('returns post data when fetched', () => {
      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
      });

      const { result } = renderHook(() => usePost(1));

      expect(result.current.post).toEqual(mockPost);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBeUndefined();
    });

    it('returns mutate function', () => {
      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
      });

      const { result } = renderHook(() => usePost(1));

      expect(typeof result.current.mutate).toBe('function');
    });
  });

  describe('Error State', () => {
    it('returns error when fetch fails', () => {
      const error = new Error('Post not found');
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: error,
        isLoading: false,
        mutate: mockMutate,
      });

      const { result } = renderHook(() => usePost(999));

      expect(result.current.isError).toBe(error);
      expect(result.current.post).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Conditional Fetching', () => {
    it('does not fetch when id is null', () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
      });

      renderHook(() => usePost(null));

      // First argument should be null to skip fetching
      expect(mockUseSWR).toHaveBeenCalledWith(
        null,
        null,
        expect.any(Object)
      );
    });

    it('fetches when id is provided', () => {
      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
      });

      renderHook(() => usePost(42));

      expect(mockUseSWR).toHaveBeenCalledWith(
        '/posts/42',
        expect.any(Function),
        expect.any(Object)
      );
    });
  });

  describe('SWR Configuration', () => {
    it('passes correct SWR options', () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: true,
        mutate: mockMutate,
      });

      renderHook(() => usePost(1));

      expect(mockUseSWR).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({
          revalidateOnFocus: false,
          revalidateOnReconnect: true,
          dedupingInterval: 5000,
        })
      );
    });
  });

  describe('Cache Key', () => {
    it('uses post ID in cache key', () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: true,
        mutate: mockMutate,
      });

      renderHook(() => usePost(123));

      expect(mockUseSWR).toHaveBeenCalledWith(
        '/posts/123',
        expect.any(Function),
        expect.any(Object)
      );
    });

    it('different IDs use different cache keys', () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
      });

      const { rerender } = renderHook(
        ({ id }) => usePost(id),
        { initialProps: { id: 1 as number | null } }
      );

      expect(mockUseSWR).toHaveBeenLastCalledWith(
        '/posts/1',
        expect.any(Function),
        expect.any(Object)
      );

      rerender({ id: 2 });

      expect(mockUseSWR).toHaveBeenLastCalledWith(
        '/posts/2',
        expect.any(Function),
        expect.any(Object)
      );
    });
  });
});
