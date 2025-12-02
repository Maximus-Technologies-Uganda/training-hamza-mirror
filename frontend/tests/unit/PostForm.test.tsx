/**
 * Unit tests for PostForm component
 * Tests form rendering, validation, submission handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PostForm from '@/components/PostForm';
import type { Post } from '@/lib/types';

// Mock router functions
const mockPush = jest.fn();
const mockBack = jest.fn();

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Create custom error class for testing that matches the real ApiError interface
class MockApiError extends Error {
  statusCode: number;
  validation?: Array<{ field: string; message: string }>;
  
  constructor(
    statusCode: number,
    message: string,
    validation?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.statusCode = statusCode;
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

// Mock the API module
const mockCreatePost = jest.fn();
const mockUpdatePost = jest.fn();
jest.mock('@/lib/api', () => ({
  createPost: (...args: any[]) => mockCreatePost(...args),
  updatePost: (...args: any[]) => mockUpdatePost(...args),
  isApiError: (error: unknown): error is MockApiError => error instanceof MockApiError,
}));

describe('PostForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreatePost.mockReset();
    mockUpdatePost.mockReset();
  });

  describe('Rendering', () => {
    it('renders title input field', () => {
      render(<PostForm />);
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });

    it('renders body textarea field', () => {
      render(<PostForm />);
      expect(screen.getByLabelText(/body/i)).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<PostForm />);
      expect(screen.getByRole('button', { name: /create post/i })).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      render(<PostForm />);
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('displays character count for title', () => {
      render(<PostForm />);
      expect(screen.getByText(/0\/200/i)).toBeInTheDocument();
    });

    it('has accessible form labels', () => {
      render(<PostForm />);
      const titleInput = screen.getByLabelText(/title/i);
      const bodyTextarea = screen.getByLabelText(/body/i);
      expect(titleInput).toHaveAccessibleName();
      expect(bodyTextarea).toHaveAccessibleName();
    });
  });

  describe('Validation', () => {
    it('shows error when title is empty on submit', async () => {
      const user = userEvent.setup();
      render(<PostForm />);

      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });
    });

    it('shows error when body is empty on submit', async () => {
      const user = userEvent.setup();
      render(<PostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Title');

      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/body content is required/i)).toBeInTheDocument();
      });
    });

    it('shows error when title exceeds 200 characters', async () => {
      const user = userEvent.setup();
      render(<PostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'A'.repeat(201));

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, 'Valid body');

      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title must be 200 characters or less/i)).toBeInTheDocument();
      });
      expect(mockCreatePost).not.toHaveBeenCalled();
    });

    it('shows error when title is only whitespace', async () => {
      const user = userEvent.setup();
      render(<PostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, '   ');

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, 'Valid body content');

      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title cannot be only whitespace/i)).toBeInTheDocument();
      });
      expect(mockCreatePost).not.toHaveBeenCalled();
    });

    it('shows error when body is only whitespace', async () => {
      const user = userEvent.setup();
      render(<PostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Valid Title');

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, '   ');

      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/body cannot be only whitespace/i)).toBeInTheDocument();
      });
    });

    it('updates character count as user types', async () => {
      const user = userEvent.setup();
      render(<PostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Hello');

      expect(screen.getByText(/5\/200/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls createPost API on valid submission', async () => {
      const user = userEvent.setup();
      const mockPost: Post = {
        id: 1,
        title: 'New Post',
        slug: 'new-post',
        body: 'Post content here',
        createdAt: '2025-11-27T10:00:00Z',
        updatedAt: '2025-11-27T10:00:00Z',
      };
      mockCreatePost.mockResolvedValue(mockPost);

      render(<PostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'New Post');

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, 'Post content here');

      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreatePost).toHaveBeenCalledWith({
          title: 'New Post',
          body: 'Post content here',
        });
      });
    });

    it('disables submit button during submission', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: Post) => void;
      const promise = new Promise<Post>((resolve) => {
        resolvePromise = resolve;
      });
      mockCreatePost.mockReturnValue(promise);

      render(<PostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Post');

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, 'Test content');

      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Resolve the promise to clean up
      resolvePromise!({
        id: 1,
        title: 'Test Post',
        slug: 'test-post',
        body: 'Test content',
        createdAt: '2025-11-27T10:00:00Z',
        updatedAt: '2025-11-27T10:00:00Z',
      });
    });

    it('shows loading indicator during submission', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: Post) => void;
      const promise = new Promise<Post>((resolve) => {
        resolvePromise = resolve;
      });
      mockCreatePost.mockReturnValue(promise);

      render(<PostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Post');

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, 'Test content');

      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /creating/i })).toBeInTheDocument();
      });

      // Resolve to clean up
      resolvePromise!({
        id: 1,
        title: 'Test Post',
        slug: 'test-post',
        body: 'Test content',
        createdAt: '2025-11-27T10:00:00Z',
        updatedAt: '2025-11-27T10:00:00Z',
      });
    });
  });

  describe('Error Handling', () => {
    it('displays API error message on submission failure', async () => {
      const user = userEvent.setup();
      mockCreatePost.mockRejectedValue(new MockApiError(400, 'Validation failed'));

      render(<PostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Post');

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, 'Test content');

      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/validation failed/i)).toBeInTheDocument();
      });
    });

    it('re-enables submit button after error', async () => {
      const user = userEvent.setup();
      mockCreatePost.mockRejectedValue(new MockApiError(500, 'Server error'));

      render(<PostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Post');

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, 'Test content');

      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Edit Mode', () => {
    const existingPost: Post = {
      id: 42,
      title: 'Existing Post Title',
      slug: 'existing-post-title',
      body: 'Existing post body content',
      createdAt: '2025-11-20T10:00:00Z',
      updatedAt: '2025-11-27T10:00:00Z',
    };

    it('pre-populates fields with post data in edit mode', () => {
      render(<PostForm post={existingPost} isEditMode />);

      expect(screen.getByLabelText(/title/i)).toHaveValue('Existing Post Title');
      expect(screen.getByLabelText(/body/i)).toHaveValue('Existing post body content');
    });

    it('displays "Update Post" button in edit mode', () => {
      render(<PostForm post={existingPost} isEditMode />);
      expect(screen.getByRole('button', { name: /update post/i })).toBeInTheDocument();
    });

    it('calls updatePost API on edit submission', async () => {
      const user = userEvent.setup();
      mockUpdatePost.mockResolvedValue({
        ...existingPost,
        title: 'Updated Title',
      });

      render(<PostForm post={existingPost} isEditMode />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title');

      const submitButton = screen.getByRole('button', { name: /update post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdatePost).toHaveBeenCalledWith(42, {
          title: 'Updated Title',
          body: 'Existing post body content',
        });
      });
    });

    it('shows "Updating..." during edit submission', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: Post) => void;
      const promise = new Promise<Post>((resolve) => {
        resolvePromise = resolve;
      });
      mockUpdatePost.mockReturnValue(promise);

      render(<PostForm post={existingPost} isEditMode />);

      const submitButton = screen.getByRole('button', { name: /update post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /updating/i })).toBeInTheDocument();
      });

      // Resolve to clean up
      resolvePromise!({
        ...existingPost,
        title: 'Updated',
      });
    });

    it('shows unsaved changes indicator when form is modified', async () => {
      const user = userEvent.setup();
      render(<PostForm post={existingPost} isEditMode />);

      // Initially no unsaved changes indicator
      expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument();

      // Modify the title
      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Modified Title');

      // Now should show unsaved changes indicator
      await waitFor(() => {
        expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
      });
    });

    it('does not show unsaved changes indicator in create mode', async () => {
      const user = userEvent.setup();
      render(<PostForm />);

      // Modify the title
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'New Post Title');

      // Should NOT show unsaved changes indicator in create mode
      await waitFor(() => {
        expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Cancel Navigation', () => {
    it('navigates to home when cancel is clicked', async () => {
      const user = userEvent.setup();

      render(<PostForm />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('API Field-Level Validation Errors', () => {
    it('displays field-level validation errors inline from API response', async () => {
      const user = userEvent.setup();
      mockCreatePost.mockRejectedValue(
        new MockApiError(400, 'Validation failed', [
          { field: 'title', message: 'Title must be unique' },
        ])
      );

      render(<PostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Duplicate Title');

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, 'Some content');

      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      // Should display field-specific error inline
      await waitFor(() => {
        expect(screen.getByText(/title must be unique/i)).toBeInTheDocument();
      });
    });

    it('displays multiple field-level validation errors inline', async () => {
      const user = userEvent.setup();
      mockCreatePost.mockRejectedValue(
        new MockApiError(400, 'Validation failed', [
          { field: 'title', message: 'Title is too short' },
          { field: 'body', message: 'Body contains invalid characters' },
        ])
      );

      render(<PostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'X');

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, 'Some <script> content');

      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      // Should display both field-specific errors inline
      await waitFor(() => {
        expect(screen.getByText(/title is too short/i)).toBeInTheDocument();
        expect(screen.getByText(/body contains invalid characters/i)).toBeInTheDocument();
      });
    });

    it('marks fields with API errors as invalid for accessibility', async () => {
      const user = userEvent.setup();
      mockCreatePost.mockRejectedValue(
        new MockApiError(400, 'Validation failed', [
          { field: 'title', message: 'Title already exists' },
        ])
      );

      render(<PostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Duplicate Title');

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, 'Valid content');

      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      // Title field should be marked as invalid
      await waitFor(() => {
        expect(titleInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('shows top-level error message alongside field errors', async () => {
      const user = userEvent.setup();
      mockCreatePost.mockRejectedValue(
        new MockApiError(400, 'Validation failed', [
          { field: 'title', message: 'Title is required' },
        ])
      );

      render(<PostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test');

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, 'Content');

      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      // Should show both top-level and field-level errors
      await waitFor(() => {
        expect(screen.getByText(/validation failed/i)).toBeInTheDocument();
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });
    });
  });
});
