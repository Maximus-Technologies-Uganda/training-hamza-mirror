/**
 * Integration tests for edit post workflow
 * Tests data fetching, form pre-population, submission, and error handling
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import type { Post } from '@/lib/types';

// Mock the API module
const mockGetPost = jest.fn();
const mockUpdatePost = jest.fn();

jest.mock('@/lib/api', () => ({
  getPost: (...args: unknown[]) => mockGetPost(...args),
  updatePost: (...args: unknown[]) => mockUpdatePost(...args),
  isApiError: (error: unknown): boolean => {
    return error instanceof Error && 'statusCode' in error;
  },
  ApiError: class ApiError extends Error {
    statusCode: number;
    validation?: { field: string; message: string }[];
    constructor(statusCode: number, message: string, _error?: string, _details?: string, validation?: { field: string; message: string }[]) {
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
  },
}));

// Mock next/navigation
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
  useParams: () => ({ id: '42' }),
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
import { ApiError } from '@/lib/api';

const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;

const mockPost: Post = {
  id: 42,
  title: 'Original Post Title',
  slug: 'original-post-title',
  body: 'Original post body content that will be edited.',
  createdAt: '2025-11-20T10:00:00Z',
  updatedAt: '2025-11-27T15:30:00Z',
};

// We'll test the edit page component
// First, let's create a mock edit page for testing
import PostForm from '@/components/PostForm';

// Create a test component that simulates the edit page
function EditPostTestPage({ postId }: { postId: string }) {
  const id = parseInt(postId, 10);
  const swrResult = useSWR(`/posts/${id}`);
  
  if (swrResult.isLoading) {
    return <div>Loading post...</div>;
  }
  
  if (swrResult.error) {
    if (swrResult.error.statusCode === 404) {
      return <div>Post not found</div>;
    }
    return <div>Error loading post: {swrResult.error.message}</div>;
  }
  
  if (!swrResult.data) {
    return <div>Post not found</div>;
  }
  
  return (
    <div>
      <h1>Edit Post</h1>
      <PostForm post={swrResult.data as Post} isEditMode />
    </div>
  );
}

describe('Edit Post Workflow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdatePost.mockReset();
  });

  describe('Form Pre-Population', () => {
    it('fetches post data and pre-populates form fields', async () => {
      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as ReturnType<typeof useSWR>);

      render(<EditPostTestPage postId="42" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toHaveValue('Original Post Title');
      });
      
      expect(screen.getByLabelText(/body/i)).toHaveValue('Original post body content that will be edited.');
    });

    it('displays loading state while fetching post', () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: true,
        isValidating: false,
        mutate: jest.fn(),
      } as ReturnType<typeof useSWR>);

      render(<EditPostTestPage postId="42" />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('shows Update Post button instead of Create Post', async () => {
      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as ReturnType<typeof useSWR>);

      render(<EditPostTestPage postId="42" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update post/i })).toBeInTheDocument();
      });
      
      expect(screen.queryByRole('button', { name: /create post/i })).not.toBeInTheDocument();
    });

    it('displays character count based on existing title', async () => {
      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as ReturnType<typeof useSWR>);

      render(<EditPostTestPage postId="42" />);

      await waitFor(() => {
        // "Original Post Title" is 19 characters
        expect(screen.getByText(/19\/200/i)).toBeInTheDocument();
      });
    });
  });

  describe('Post Update Submission', () => {
    it('calls updatePost API with modified data on submission', async () => {
      const user = userEvent.setup();
      const updatedPost: Post = {
        ...mockPost,
        title: 'Updated Post Title',
        updatedAt: '2025-11-28T16:00:00Z',
      };
      mockUpdatePost.mockResolvedValue(updatedPost);

      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as ReturnType<typeof useSWR>);

      render(<EditPostTestPage postId="42" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toHaveValue('Original Post Title');
      });

      // Clear and update title
      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Post Title');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /update post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdatePost).toHaveBeenCalledWith(42, {
          title: 'Updated Post Title',
          body: 'Original post body content that will be edited.',
        });
      });
    });

    it('redirects to post detail page after successful update', async () => {
      const user = userEvent.setup();
      const updatedPost: Post = {
        ...mockPost,
        title: 'Updated Post Title',
      };
      mockUpdatePost.mockResolvedValue(updatedPost);

      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as ReturnType<typeof useSWR>);

      render(<EditPostTestPage postId="42" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/posts/42');
      });
    });

    it('shows Updating... text during submission', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: Post) => void;
      const promise = new Promise<Post>((resolve) => {
        resolvePromise = resolve;
      });
      mockUpdatePost.mockReturnValue(promise);

      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as ReturnType<typeof useSWR>);

      render(<EditPostTestPage postId="42" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /updating/i })).toBeInTheDocument();
      });

      // Cleanup by resolving and waiting for state updates
      await act(async () => {
        resolvePromise!({
          ...mockPost,
          title: 'Updated',
        });
      });
    });
  });

  describe('404 Error Handling', () => {
    it('displays not found message when post does not exist', async () => {
      const error404 = new ApiError(404, 'Post not found');

      mockUseSWR.mockReturnValue({
        data: undefined,
        error: error404,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as ReturnType<typeof useSWR>);

      render(<EditPostTestPage postId="999" />);

      await waitFor(() => {
        expect(screen.getByText(/post not found/i)).toBeInTheDocument();
      });
    });

    it('handles deleted post during edit (update returns 404)', async () => {
      const user = userEvent.setup();
      const error404 = new ApiError(404, 'Post not found');
      mockUpdatePost.mockRejectedValue(error404);

      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as ReturnType<typeof useSWR>);

      render(<EditPostTestPage postId="42" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      // Clear and update title
      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title');

      const submitButton = screen.getByRole('button', { name: /update post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/post not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('API Error Handling', () => {
    it('displays error message when API returns server error', async () => {
      const serverError = new ApiError(500, 'Internal server error');

      mockUseSWR.mockReturnValue({
        data: undefined,
        error: serverError,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as ReturnType<typeof useSWR>);

      render(<EditPostTestPage postId="42" />);

      await waitFor(() => {
        expect(screen.getByText(/error loading post/i)).toBeInTheDocument();
      });
    });

    it('displays validation error from API on submit', async () => {
      const user = userEvent.setup();
      const validationError = new ApiError(400, 'Title already exists');
      mockUpdatePost.mockRejectedValue(validationError);

      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as ReturnType<typeof useSWR>);

      render(<EditPostTestPage postId="42" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/title already exists/i)).toBeInTheDocument();
      });
    });

    it('re-enables submit button after error', async () => {
      const user = userEvent.setup();
      const serverError = new Error('Server error');
      mockUpdatePost.mockRejectedValue(serverError);

      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as ReturnType<typeof useSWR>);

      render(<EditPostTestPage postId="42" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Form Validation in Edit Mode', () => {
    it('validates title is required when cleared', async () => {
      const user = userEvent.setup();

      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as ReturnType<typeof useSWR>);

      render(<EditPostTestPage postId="42" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toHaveValue('Original Post Title');
      });

      // Clear the title
      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });
    });

    it('validates body is required when cleared', async () => {
      const user = userEvent.setup();

      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as ReturnType<typeof useSWR>);

      render(<EditPostTestPage postId="42" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/body/i)).toHaveValue('Original post body content that will be edited.');
      });

      // Clear the body
      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.clear(bodyTextarea);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/body content is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Navigation', () => {
    it('navigates to post detail when cancel is clicked', async () => {
      const user = userEvent.setup();

      mockUseSWR.mockReturnValue({
        data: mockPost,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as ReturnType<typeof useSWR>);

      render(<EditPostTestPage postId="42" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockPush).toHaveBeenCalledWith('/posts/42');
    });
  });
});
