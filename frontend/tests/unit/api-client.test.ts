/**
 * Unit tests for API client module
 * Tests fetch wrapper, error handling, and CRUD operations
 */

import {
  ApiClientError,
  isApiClientError,
  fetchApi,
  getHealth,
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  getPostsByIds,
  API_URL,
} from '@/lib/api-client';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API_URL', () => {
    it('is defined', () => {
      expect(API_URL).toBeDefined();
      expect(typeof API_URL).toBe('string');
    });
  });

  describe('ApiClientError', () => {
    it('creates error with correct properties', () => {
      const error = new ApiClientError(404, 'Not Found', 'Post not found');
      
      expect(error.statusCode).toBe(404);
      expect(error.error).toBe('Not Found');
      expect(error.message).toBe('Post not found');
      expect(error.name).toBe('ApiClientError');
    });

    it('extends Error', () => {
      const error = new ApiClientError(500, 'Server Error', 'Something went wrong');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('isApiClientError', () => {
    it('returns true for ApiClientError instances', () => {
      const error = new ApiClientError(400, 'Bad Request', 'Invalid input');
      expect(isApiClientError(error)).toBe(true);
    });

    it('returns false for regular Error', () => {
      const error = new Error('Regular error');
      expect(isApiClientError(error)).toBe(false);
    });

    it('returns false for non-error objects', () => {
      expect(isApiClientError({})).toBe(false);
      expect(isApiClientError(null)).toBe(false);
      expect(isApiClientError('string')).toBe(false);
    });
  });

  describe('fetchApi', () => {
    it('makes request with correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
      });

      await fetchApi('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.any(Object)
      );
    });

    it('adds Content-Type header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await fetchApi('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('returns undefined for 204 No Content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await fetchApi('/test');
      expect(result).toBeUndefined();
    });

    it('parses JSON response', async () => {
      const responseData = { id: 1, title: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseData,
      });

      const result = await fetchApi<typeof responseData>('/test');
      expect(result).toEqual(responseData);
    });

    it('throws ApiClientError for 4xx responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not Found', message: 'Post not found' }),
      });

      await expect(fetchApi('/posts/999')).rejects.toThrow(ApiClientError);
    });

    it('throws ApiClientError for 5xx responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server Error', message: 'Something went wrong' }),
      });

      await expect(fetchApi('/posts')).rejects.toThrow(ApiClientError);
    });

    it('handles full URL without adding base', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await fetchApi('http://other-api.com/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://other-api.com/test',
        expect.any(Object)
      );
    });

    it('throws Error for network failures', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(fetchApi('/test')).rejects.toThrow('Network error');
    });

    it('re-throws ApiClientError without wrapping', async () => {
      const originalError = new ApiClientError(400, 'Bad Request', 'Invalid');
      mockFetch.mockRejectedValueOnce(originalError);

      await expect(fetchApi('/test')).rejects.toBe(originalError);
    });
  });

  describe('getHealth', () => {
    it('fetches health status from /health endpoint', async () => {
      const healthData = { status: 'ok', timestamp: '2025-11-27T10:00:00Z' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => healthData,
      });

      const result = await getHealth();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.any(Object)
      );
      expect(result).toEqual(healthData);
    });
  });

  describe('getPosts', () => {
    it('fetches all posts from /posts endpoint', async () => {
      const posts = [
        { id: 1, title: 'Post 1', slug: 'post-1', body: 'Content 1', createdAt: '', updatedAt: '' },
        { id: 2, title: 'Post 2', slug: 'post-2', body: 'Content 2', createdAt: '', updatedAt: '' },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => posts,
      });

      const result = await getPosts();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/posts'),
        expect.any(Object)
      );
      expect(result).toEqual(posts);
    });

    it('returns empty array when no posts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      const result = await getPosts();
      expect(result).toEqual([]);
    });
  });

  describe('getPost', () => {
    it('fetches single post by ID', async () => {
      const post = { id: 1, title: 'Test', slug: 'test', body: 'Content', createdAt: '', updatedAt: '' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => post,
      });

      const result = await getPost(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/posts/1'),
        expect.any(Object)
      );
      expect(result).toEqual(post);
    });

    it('throws 404 error for non-existent post', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not Found', message: 'Post not found' }),
      });

      await expect(getPost(999)).rejects.toThrow(ApiClientError);
      
      try {
        await getPost(999);
      } catch (error) {
        if (isApiClientError(error)) {
          expect(error.statusCode).toBe(404);
        }
      }
    });
  });

  describe('createPost', () => {
    it('creates post with POST method', async () => {
      const input = { title: 'New Post', body: 'New content' };
      const createdPost = {
        id: 1,
        ...input,
        slug: 'new-post',
        createdAt: '2025-11-27T10:00:00Z',
        updatedAt: '2025-11-27T10:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => createdPost,
      });

      const result = await createPost(input);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/posts'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(input),
        })
      );
      expect(result).toEqual(createdPost);
    });

    it('throws 400 error for validation failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Bad Request', message: 'Title is required' }),
      });

      await expect(createPost({ title: '', body: 'Content' })).rejects.toThrow(ApiClientError);
    });
  });

  describe('updatePost', () => {
    it('updates post with PATCH method', async () => {
      const input = { title: 'Updated Title' };
      const updatedPost = {
        id: 1,
        title: 'Updated Title',
        slug: 'updated-title',
        body: 'Original content',
        createdAt: '2025-11-27T10:00:00Z',
        updatedAt: '2025-11-27T12:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => updatedPost,
      });

      const result = await updatePost(1, input);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/posts/1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(input),
        })
      );
      expect(result).toEqual(updatedPost);
    });

    it('throws 404 error for non-existent post', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not Found', message: 'Post not found' }),
      });

      await expect(updatePost(999, { title: 'Test' })).rejects.toThrow(ApiClientError);
    });
  });

  describe('deletePost', () => {
    it('deletes post with DELETE method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await deletePost(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/posts/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('throws 404 error for non-existent post', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not Found', message: 'Post not found' }),
      });

      await expect(deletePost(999)).rejects.toThrow(ApiClientError);
    });
  });

  describe('getPostsByIds', () => {
    it('fetches multiple posts in parallel', async () => {
      const posts = [
        { id: 1, title: 'Post 1', slug: 'post-1', body: 'Content', createdAt: '', updatedAt: '' },
        { id: 2, title: 'Post 2', slug: 'post-2', body: 'Content', createdAt: '', updatedAt: '' },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => posts[0],
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => posts[1],
        });

      const result = await getPostsByIds([1, 2]);

      expect(result).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('filters out failed fetches', async () => {
      const post = { id: 1, title: 'Post 1', slug: 'post-1', body: 'Content', createdAt: '', updatedAt: '' };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => post,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => ({ error: 'Not Found', message: 'Post not found' }),
        });

      const result = await getPostsByIds([1, 999]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(post);
    });

    it('returns empty array for all failed fetches', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not Found', message: 'Post not found' }),
      });

      const result = await getPostsByIds([999, 998, 997]);

      expect(result).toEqual([]);
    });

    it('returns empty array for empty input', async () => {
      const result = await getPostsByIds([]);
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
