/**
 * Unit tests for Error Mapping Utilities
 * T074: [US7] Tests mapAuthError returns correct messages for different status codes
 */

import {
  mapAuthError,
  isAuthenticationError,
  isAuthorizationError,
  isClientError,
  isServerError,
  getErrorAction,
  getValidationErrors,
  formatError,
} from '@/lib/errors';

describe('Error Mapping Utilities', () => {
  describe('mapAuthError', () => {
    describe('generic auth error messages', () => {
      it('returns "Please log in" message for 401 status', () => {
        const message = mapAuthError(401);
        expect(message).toBe('Please log in.');
      });

      it('returns "You don\'t have permission" message for 403 status', () => {
        const message = mapAuthError(403);
        expect(message).toBe("You don't have permission.");
      });
    });

    describe('context-specific error messages', () => {
      describe('edit context', () => {
        it('returns specific message for 401 in edit context', () => {
          const message = mapAuthError(401, 'edit');
          expect(message).toBe('Please log in to edit this post.');
        });

        it('returns specific message for 403 in edit context', () => {
          const message = mapAuthError(403, 'edit');
          expect(message).toBe('You can only edit posts that you created.');
        });
      });

      describe('delete context', () => {
        it('returns specific message for 401 in delete context', () => {
          const message = mapAuthError(401, 'delete');
          expect(message).toBe('Please log in to delete this post.');
        });

        it('returns specific message for 403 in delete context', () => {
          const message = mapAuthError(403, 'delete');
          expect(message).toBe('You can only delete posts that you created.');
        });
      });

      describe('create context', () => {
        it('returns specific message for 401 in create context', () => {
          const message = mapAuthError(401, 'create');
          expect(message).toBe('Please log in to create a post.');
        });

        it('returns specific message for 403 in create context', () => {
          const message = mapAuthError(403, 'create');
          expect(message).toBe("You don't have permission to create posts.");
        });
      });
    });

    describe('other HTTP status codes', () => {
      it('returns message for 400 bad request', () => {
        const message = mapAuthError(400);
        expect(message).toBe('Invalid request. Please check your input and try again.');
      });

      it('returns message for 404 not found', () => {
        const message = mapAuthError(404);
        expect(message).toBe('The requested resource was not found.');
      });

      it('returns message for 429 rate limit', () => {
        const message = mapAuthError(429);
        expect(message).toBe('Too many requests. Please wait a moment and try again.');
      });

      it('returns server error message for 500', () => {
        const message = mapAuthError(500);
        expect(message).toBe('A server error occurred. Please try again later.');
      });

      it('returns server error message for 502', () => {
        const message = mapAuthError(502);
        expect(message).toBe('A server error occurred. Please try again later.');
      });

      it('returns server error message for 503', () => {
        const message = mapAuthError(503);
        expect(message).toBe('A server error occurred. Please try again later.');
      });

      it('returns server error message for 504', () => {
        const message = mapAuthError(504);
        expect(message).toBe('A server error occurred. Please try again later.');
      });

      it('returns default message for unknown status codes', () => {
        const message = mapAuthError(418); // I'm a teapot
        expect(message).toBe('An unexpected error occurred. Please try again.');
      });
    });
  });

  describe('isAuthenticationError', () => {
    it('returns true for 401 status', () => {
      expect(isAuthenticationError(401)).toBe(true);
    });

    it('returns false for 403 status', () => {
      expect(isAuthenticationError(403)).toBe(false);
    });

    it('returns false for other status codes', () => {
      expect(isAuthenticationError(400)).toBe(false);
      expect(isAuthenticationError(500)).toBe(false);
    });
  });

  describe('isAuthorizationError', () => {
    it('returns true for 403 status', () => {
      expect(isAuthorizationError(403)).toBe(true);
    });

    it('returns false for 401 status', () => {
      expect(isAuthorizationError(401)).toBe(false);
    });

    it('returns false for other status codes', () => {
      expect(isAuthorizationError(400)).toBe(false);
      expect(isAuthorizationError(500)).toBe(false);
    });
  });

  describe('isClientError', () => {
    it('returns true for 4xx status codes', () => {
      expect(isClientError(400)).toBe(true);
      expect(isClientError(401)).toBe(true);
      expect(isClientError(403)).toBe(true);
      expect(isClientError(404)).toBe(true);
      expect(isClientError(429)).toBe(true);
      expect(isClientError(499)).toBe(true);
    });

    it('returns false for 3xx status codes', () => {
      expect(isClientError(301)).toBe(false);
      expect(isClientError(302)).toBe(false);
    });

    it('returns false for 5xx status codes', () => {
      expect(isClientError(500)).toBe(false);
      expect(isClientError(503)).toBe(false);
    });

    it('returns false for 2xx status codes', () => {
      expect(isClientError(200)).toBe(false);
      expect(isClientError(201)).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('returns true for 5xx status codes', () => {
      expect(isServerError(500)).toBe(true);
      expect(isServerError(502)).toBe(true);
      expect(isServerError(503)).toBe(true);
      expect(isServerError(504)).toBe(true);
      expect(isServerError(599)).toBe(true);
    });

    it('returns false for 4xx status codes', () => {
      expect(isServerError(400)).toBe(false);
      expect(isServerError(401)).toBe(false);
      expect(isServerError(404)).toBe(false);
    });

    it('returns false for 2xx status codes', () => {
      expect(isServerError(200)).toBe(false);
      expect(isServerError(201)).toBe(false);
    });

    it('returns false for 3xx status codes', () => {
      expect(isServerError(301)).toBe(false);
      expect(isServerError(302)).toBe(false);
    });
  });

  describe('getErrorAction', () => {
    it('returns "Log in" for 401 status', () => {
      expect(getErrorAction(401)).toBe('Log in');
    });

    it('returns null for 403 status (no action available)', () => {
      expect(getErrorAction(403)).toBeNull();
    });

    it('returns "Wait and retry" for 429 status', () => {
      expect(getErrorAction(429)).toBe('Wait and retry');
    });

    it('returns "Refresh the page" for server errors', () => {
      expect(getErrorAction(500)).toBe('Refresh the page');
      expect(getErrorAction(502)).toBe('Refresh the page');
      expect(getErrorAction(503)).toBe('Refresh the page');
      expect(getErrorAction(504)).toBe('Refresh the page');
    });

    it('returns "Try again" for other status codes', () => {
      expect(getErrorAction(400)).toBe('Try again');
      expect(getErrorAction(404)).toBe('Try again');
      expect(getErrorAction(418)).toBe('Try again');
    });
  });

  describe('getValidationErrors', () => {
    it('extracts validation errors from ApiError with validation array', () => {
      // Simulate ApiError class structure with error property (not code)
      const error = {
        statusCode: 400,
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        validation: [
          { field: 'title', message: 'Title is required' },
          { field: 'content', message: 'Content must be at least 10 characters' },
        ],
      };

      const errors = getValidationErrors(error);

      expect(errors).toHaveLength(2);
      expect(errors[0]).toBe('title: Title is required');
      expect(errors[1]).toBe('content: Content must be at least 10 characters');
    });

    it('extracts validation errors when code getter is available', () => {
      // Simulate ApiError class with code getter
      const error = {
        statusCode: 400,
        error: 'VALIDATION_ERROR',
        get code() { return this.error as 'VALIDATION_ERROR'; },
        message: 'Validation failed',
        validation: [
          { field: 'email', message: 'Invalid email format' },
        ],
      };

      const errors = getValidationErrors(error);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toBe('email: Invalid email format');
    });

    it('returns empty array for non-validation errors', () => {
      const error = {
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Not found',
      };

      const errors = getValidationErrors(error);

      expect(errors).toHaveLength(0);
    });

    it('handles legacy details format', () => {
      const error = {
        statusCode: 400,
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: {
          title: ['Title is required', 'Title must be unique'],
          content: 'Content is too short',
        },
      };

      const errors = getValidationErrors(error);

      expect(errors).toContain('title: Title is required');
      expect(errors).toContain('title: Title must be unique');
      expect(errors).toContain('content: Content is too short');
    });
  });

  describe('formatError', () => {
    it('includes validation errors in formatted output', () => {
      const error = {
        statusCode: 400,
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        validation: [
          { field: 'title', message: 'Title is required' },
        ],
      };

      const formatted = formatError(error);

      expect(formatted.validationErrors).toBeDefined();
      expect(formatted.validationErrors).toHaveLength(1);
      expect(formatted.validationErrors![0]).toBe('title: Title is required');
    });
  });
});
