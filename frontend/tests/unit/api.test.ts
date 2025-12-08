/**
 * Unit tests for API module
 * Tests ApiError class, type guards, and API functions
 */

import {
  ApiError,
  isApiError,
  API_BASE_URL,
  fetchApi,
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  getHealth,
} from '@/lib/api';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

/**
 * Helper to create a properly mocked Response object
 * The api.ts uses response.text() and response.headers.get() instead of response.json()
 */
function createMockResponse(data: unknown, options: { ok?: boolean; status?: number; statusText?: string } = {}) {
  const { ok = true, status = 200, statusText = 'OK' } = options;
  const body = data !== undefined ? JSON.stringify(data) : '';
  return {
    ok,
    status,
    statusText,
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'content-length') {
          return body.length > 0 ? String(body.length) : '0';
        }
        return null;
      },
    },
    text: async () => body,
    json: async () => (data !== undefined ? data : null),
  };
}

describe('API Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API_BASE_URL', () => {
    it('is defined as a string', () => {
      expect(API_BASE_URL).toBeDefined();
      expect(typeof API_BASE_URL).toBe('string');
    });
  });

  describe('ApiError', () => {
    describe('constructor', () => {
      it('creates error with all parameters', () => {
        const error = new ApiError(404, 'Not Found', 'Error', 'Details', [
          { field: 'title', message: 'Required' },
        ]);

        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Not Found');
        expect(error.error).toBe('Error');
        expect(error.details).toBe('Details');
        expect(error.validation).toEqual([{ field: 'title', message: 'Required' }]);
      });

      it('creates error with minimal parameters', () => {
        const error = new ApiError(500, 'Server error');

        expect(error.statusCode).toBe(500);
        expect(error.message).toBe('Server error');
        expect(error.error).toBe('Error');
        expect(error.details).toBeUndefined();
        expect(error.validation).toBeUndefined();
      });

      it('extends Error', () => {
        const error = new ApiError(400, 'Bad Request');
        expect(error instanceof Error).toBe(true);
      });

      it('has name "ApiError"', () => {
        const error = new ApiError(400, 'Bad Request');
        expect(error.name).toBe('ApiError');
      });
    });

    describe('fromResponse', () => {
      it('creates error from response body', () => {
        const body = {
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation failed',
          details: 'Title too long',
          validation: [{ field: 'title', message: 'Max 200 chars' }],
        };

        const error = ApiError.fromResponse(body);

        expect(error.statusCode).toBe(400);
        expect(error.error).toBe('Bad Request');
        expect(error.message).toBe('Validation failed');
        expect(error.details).toBe('Title too long');
        expect(error.validation).toEqual([{ field: 'title', message: 'Max 200 chars' }]);
      });

      it('uses fallback values for missing properties', () => {
        const error = ApiError.fromResponse({});

        expect(error.statusCode).toBe(500);
        expect(error.message).toBe('An unexpected error occurred');
        expect(error.error).toBe('Error');
      });

      it('uses fallback status parameter', () => {
        const error = ApiError.fromResponse({}, 404);
        expect(error.statusCode).toBe(404);
      });
    });

    describe('hasFieldErrors', () => {
      it('returns true when validation array has items', () => {
        const error = new ApiError(400, 'Error', 'Error', undefined, [
          { field: 'title', message: 'Required' },
        ]);
        expect(error.hasFieldErrors()).toBe(true);
      });

      it('returns false when validation is undefined', () => {
        const error = new ApiError(400, 'Error');
        expect(error.hasFieldErrors()).toBe(false);
      });

      it('returns false when validation is empty array', () => {
        const error = new ApiError(400, 'Error', 'Error', undefined, []);
        expect(error.hasFieldErrors()).toBe(false);
      });
    });

    describe('getFieldError', () => {
      it('returns error message for matching field', () => {
        const error = new ApiError(400, 'Error', 'Error', undefined, [
          { field: 'title', message: 'Title is required' },
          { field: 'body', message: 'Body is required' },
        ]);
        expect(error.getFieldError('title')).toBe('Title is required');
        expect(error.getFieldError('body')).toBe('Body is required');
      });

      it('returns undefined for non-matching field', () => {
        const error = new ApiError(400, 'Error', 'Error', undefined, [
          { field: 'title', message: 'Required' },
        ]);
        expect(error.getFieldError('body')).toBeUndefined();
      });

      it('returns undefined when no validation', () => {
        const error = new ApiError(400, 'Error');
        expect(error.getFieldError('title')).toBeUndefined();
      });
    });

    describe('isValidationError', () => {
      it('returns true for status 400', () => {
        const error = new ApiError(400, 'Bad Request');
        expect(error.isValidationError()).toBe(true);
      });

      it('returns false for other status codes', () => {
        expect(new ApiError(404, 'Not Found').isValidationError()).toBe(false);
        expect(new ApiError(500, 'Server Error').isValidationError()).toBe(false);
      });
    });

    describe('isNotFoundError', () => {
      it('returns true for status 404', () => {
        const error = new ApiError(404, 'Not Found');
        expect(error.isNotFoundError()).toBe(true);
      });

      it('returns false for other status codes', () => {
        expect(new ApiError(400, 'Bad Request').isNotFoundError()).toBe(false);
        expect(new ApiError(500, 'Server Error').isNotFoundError()).toBe(false);
      });
    });

    describe('isServerError', () => {
      it('returns true for 5xx status codes', () => {
        expect(new ApiError(500, 'Error').isServerError()).toBe(true);
        expect(new ApiError(502, 'Error').isServerError()).toBe(true);
        expect(new ApiError(503, 'Error').isServerError()).toBe(true);
        expect(new ApiError(599, 'Error').isServerError()).toBe(true);
      });

      it('returns false for non-5xx status codes', () => {
        expect(new ApiError(400, 'Error').isServerError()).toBe(false);
        expect(new ApiError(404, 'Error').isServerError()).toBe(false);
        expect(new ApiError(200, 'OK').isServerError()).toBe(false);
      });
    });
  });

  describe('isApiError', () => {
    it('returns true for ApiError instances', () => {
      const error = new ApiError(400, 'Bad Request');
      expect(isApiError(error)).toBe(true);
    });

    it('returns false for regular Error', () => {
      const error = new Error('Regular error');
      expect(isApiError(error)).toBe(false);
    });

    it('returns false for non-error values', () => {
      expect(isApiError(null)).toBe(false);
      expect(isApiError(undefined)).toBe(false);
      expect(isApiError('string')).toBe(false);
      expect(isApiError({})).toBe(false);
    });
  });

  describe('fetchApi', () => {
    it('makes request with correct URL', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}));

      await fetchApi('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.any(Object)
      );
    });

    it('includes Content-Type header', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}));

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

    it('returns undefined for 204 status', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(undefined, { status: 204 }));

      const result = await fetchApi('/test');
      expect(result).toBeUndefined();
    });

    it('parses JSON response', async () => {
      const data = { id: 1, title: 'Test' };
      mockFetch.mockResolvedValueOnce(createMockResponse(data));

      const result = await fetchApi<typeof data>('/test');
      expect(result).toEqual(data);
    });

    it('throws ApiError for error responses', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(
        {
          statusCode: 404,
          error: 'Not Found',
          message: 'Post not found',
        },
        { ok: false, status: 404, statusText: 'Not Found' }
      ));

      await expect(fetchApi('/posts/999')).rejects.toThrow(ApiError);
    });

    it('throws ApiError for network errors (TypeError)', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(fetchApi('/test')).rejects.toThrow(ApiError);
    });

    it('includes network error message in ApiError', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      try {
        await fetchApi('/test');
      } catch (error) {
        if (isApiError(error)) {
          expect(error.statusCode).toBe(0);
          expect(error.message).toContain('Unable to reach server');
        }
      }
    });

    it('re-throws ApiError without wrapping', async () => {
      const originalError = new ApiError(400, 'Original error');
      mockFetch.mockRejectedValueOnce(originalError);

      await expect(fetchApi('/test')).rejects.toBe(originalError);
    });

    it('wraps unknown errors in ApiError', async () => {
      mockFetch.mockRejectedValueOnce('Unknown error');

      await expect(fetchApi('/test')).rejects.toThrow(ApiError);
    });
  });

  describe('getPosts', () => {
    it('fetches from /posts endpoint', async () => {
      const posts = [{ id: 1, title: 'Test', slug: 'test', body: 'Content', createdAt: '', updatedAt: '' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(posts));

      const result = await getPosts();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/posts'),
        expect.any(Object)
      );
      expect(result).toEqual(posts);
    });
  });

  describe('getPost', () => {
    it('fetches from /posts/:id endpoint', async () => {
      const post = { id: 42, title: 'Test', slug: 'test', body: 'Content', createdAt: '', updatedAt: '' };
      mockFetch.mockResolvedValueOnce(createMockResponse(post));

      const result = await getPost(42);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/posts/42'),
        expect.any(Object)
      );
      expect(result).toEqual(post);
    });
  });

  describe('createPost', () => {
    it('sends POST request with body', async () => {
      const input = { title: 'New Post', body: 'Content' };
      const created = { id: 1, ...input, slug: 'new-post', createdAt: '', updatedAt: '' };

      mockFetch.mockResolvedValueOnce(createMockResponse(created, { status: 201 }));

      const result = await createPost(input);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/posts'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(input),
        })
      );
      expect(result).toEqual(created);
    });
  });

  describe('updatePost', () => {
    it('sends PATCH request with partial body', async () => {
      const input = { title: 'Updated Title' };
      const updated = { id: 1, title: 'Updated Title', slug: 'updated-title', body: 'Content', createdAt: '', updatedAt: '' };

      mockFetch.mockResolvedValueOnce(createMockResponse(updated));

      const result = await updatePost(1, input);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/posts/1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(input),
        })
      );
      expect(result).toEqual(updated);
    });
  });

  describe('deletePost', () => {
    it('sends DELETE request', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(undefined, { status: 204 }));

      await deletePost(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/posts/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('getHealth', () => {
    it('fetches from /health endpoint', async () => {
      const health = { status: 'ok', timestamp: '2025-11-27T10:00:00Z' };
      mockFetch.mockResolvedValueOnce(createMockResponse(health));

      const result = await getHealth();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.any(Object)
      );
      expect(result).toEqual(health);
    });
  });
});
