/**
 * Integration tests for create post workflow
 * Tests form submission, API interaction, and navigation
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PostForm from '@/components/PostForm';
import * as api from '@/lib/api';
import type { Post } from '@/lib/types';

// Mock next/navigation
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Create custom error class for testing that matches the real ApiError interface
class MockApiError extends Error {
  statusCode: number;
  error: string;
  details?: string;
  validation?: Array<{ field: string; message: string }>;
  
  constructor(
    statusCode: number,
    message: string,
    error: string = 'Error',
    details?: string,
    validation?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    this.details = details;
    this.name = 'ApiError';
    this.validation = validation;
  }

  hasFieldErrors(): boolean {
    return Array.isArray(this.validation) && this.validation.length > 0;
  }

  getFieldError(fieldName: string): string | undefined {
    return this.validation?.find(v => v.field === fieldName)?.message;
  }
}

// Mock the API module - use inline class definition to avoid hoisting issues
jest.mock('@/lib/api', () => {
  // Define class inside the factory to avoid hoisting issues
  class InnerMockApiError extends Error {
    statusCode: number;
    error: string;
    details?: string;
    validation?: Array<{ field: string; message: string }>;
    
    constructor(
      statusCode: number,
      message: string,
      error: string = 'Error',
      details?: string,
      validation?: Array<{ field: string; message: string }>
    ) {
      super(message);
      this.statusCode = statusCode;
      this.error = error;
      this.details = details;
      this.name = 'ApiError';
      this.validation = validation;
    }

    hasFieldErrors(): boolean {
      return Array.isArray(this.validation) && this.validation.length > 0;
    }

    getFieldError(fieldName: string): string | undefined {
      return this.validation?.find(v => v.field === fieldName)?.message;
    }
  }

  return {
    createPost: jest.fn(),
    updatePost: jest.fn(),
    isApiError: (error: unknown): boolean => error instanceof InnerMockApiError,
    ApiError: InnerMockApiError,
  };
});

const mockCreatePost = api.createPost as jest.MockedFunction<typeof api.createPost>;

describe('Create Post Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Full Create Workflow', () => {
    it('submits form and redirects to new post detail page on success', async () => {
      const user = userEvent.setup();
      const createdPost: Post = {
        id: 123,
        title: 'My New Blog Post',
        slug: 'my-new-blog-post',
        body: 'This is the content of my new blog post.',
        createdAt: '2025-11-27T10:00:00Z',
        updatedAt: '2025-11-27T10:00:00Z',
        ownerId: 'user-1',
      };
      mockCreatePost.mockResolvedValue(createdPost);

      render(<PostForm />);

      // Fill in the form
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'My New Blog Post');

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, 'This is the content of my new blog post.');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      // Wait for API call and redirect
      await waitFor(() => {
        expect(mockCreatePost).toHaveBeenCalledWith({
          title: 'My New Blog Post',
          body: 'This is the content of my new blog post.',
        });
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/posts/123');
      });
    });

    it('shows validation errors and prevents submission with invalid data', async () => {
      const user = userEvent.setup();

      render(<PostForm />);

      // Try to submit without filling any fields
      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });

      // API should not be called
      expect(mockCreatePost).not.toHaveBeenCalled();
    });

    it('handles API errors gracefully', async () => {
      const user = userEvent.setup();
      mockCreatePost.mockRejectedValue(new api.ApiError(400, 'Title already exists'));

      render(<PostForm />);

      // Fill in the form
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Duplicate Title');

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, 'Some content');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      // Should display error message
      await waitFor(() => {
        expect(screen.getByText(/title already exists/i)).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();
      mockCreatePost.mockRejectedValue(new Error('Network error'));

      render(<PostForm />);

      // Fill in the form
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Post');

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, 'Test content');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      // Should display error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Form State Management', () => {
    it('maintains form data when validation fails', async () => {
      const user = userEvent.setup();

      render(<PostForm />);

      // Fill in title only
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'My Title');

      // Submit without body
      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      // Title should still have value
      await waitFor(() => {
        expect(titleInput).toHaveValue('My Title');
      });
    });

    it('clears error when user corrects input', async () => {
      const user = userEvent.setup();

      render(<PostForm />);

      // Submit empty form to trigger errors
      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });

      // Fill in title
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Fixed Title');

      // Error should clear on blur/change
      await waitFor(() => {
        expect(screen.queryByText(/title is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Cancel Flow', () => {
    it('navigates to home without saving when cancel is clicked', async () => {
      const user = userEvent.setup();

      render(<PostForm />);

      // Fill in some data
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Unsaved Title');

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Should navigate to home (not back)
      expect(mockPush).toHaveBeenCalledWith('/');

      // API should not be called
      expect(mockCreatePost).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator and disables form during submission', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: Post) => void;
      const promise = new Promise<Post>((resolve) => {
        resolvePromise = resolve;
      });
      mockCreatePost.mockReturnValue(promise);

      render(<PostForm />);

      // Fill in the form
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Post');

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, 'Test content');

      // Submit
      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(screen.getByRole('button', { name: /creating/i })).toBeInTheDocument();
      });

      // Resolve and wait for state updates to complete
      await act(async () => {
        resolvePromise!({
          id: 1,
          title: 'Test Post',
          slug: 'test-post',
          body: 'Test content',
          createdAt: '2025-11-27T10:00:00Z',
          updatedAt: '2025-11-27T10:00:00Z',
          ownerId: 'user-1',
        });
      });
    });
  });

  describe('Character Limits', () => {
    it('displays updated character count as user types title', async () => {
      const user = userEvent.setup();

      render(<PostForm />);

      expect(screen.getByText(/0\/200/i)).toBeInTheDocument();

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Hello World');

      expect(screen.getByText(/11\/200/i)).toBeInTheDocument();
    });

    it('prevents submission when title exceeds 200 characters', async () => {
      const user = userEvent.setup();

      render(<PostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      // Use fireEvent.change for long strings to avoid timeout from typing 201 chars one by one
      fireEvent.change(titleInput, { target: { value: 'A'.repeat(201) } });

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, 'Valid body');

      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title must be 200 characters or less/i)).toBeInTheDocument();
      });

      expect(mockCreatePost).not.toHaveBeenCalled();
    });
  });

  describe('API Field-Level Validation Errors', () => {
    it('displays field-level validation errors inline from API response', async () => {
      const user = userEvent.setup();
      mockCreatePost.mockRejectedValue(
        new api.ApiError(400, 'Validation failed', 'Bad Request', undefined, [
          { field: 'title', message: 'A post with this title already exists' },
        ])
      );

      render(<PostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Duplicate Title');

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, 'Some content');

      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      // Should display field-specific error inline near the title field
      await waitFor(() => {
        expect(screen.getByText(/a post with this title already exists/i)).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('displays body field validation error inline', async () => {
      const user = userEvent.setup();
      mockCreatePost.mockRejectedValue(
        new api.ApiError(400, 'Validation failed', 'Bad Request', undefined, [
          { field: 'body', message: 'Body content is too short' },
        ])
      );

      render(<PostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Valid Title');

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, 'X');

      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      // Should display field-specific error inline near the body field
      await waitFor(() => {
        expect(screen.getByText(/body content is too short/i)).toBeInTheDocument();
      });
    });

    it('handles API error without field-level validation gracefully', async () => {
      const user = userEvent.setup();
      // API error without validation array (e.g., server error)
      mockCreatePost.mockRejectedValue(
        new api.ApiError(500, 'Internal server error')
      );

      render(<PostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Post');

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, 'Test content');

      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      // Should display top-level error message
      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
      });

      // Form should still be usable
      expect(submitButton).not.toBeDisabled();
    });

    it('marks fields with API validation errors as invalid for accessibility', async () => {
      const user = userEvent.setup();
      mockCreatePost.mockRejectedValue(
        new api.ApiError(400, 'Validation failed', 'Bad Request', undefined, [
          { field: 'title', message: 'Title taken' },
        ])
      );

      render(<PostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Duplicate Title');

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, 'Valid content');

      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      // Should display inline field error
      await waitFor(() => {
        expect(screen.getByText(/title taken/i)).toBeInTheDocument();
      });

      // Title field should be marked as invalid for accessibility
      expect(titleInput).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
