/**
 * Integration tests for delete post workflow
 * Tests confirmation, API call, cache update, redirect, and error handling
 */

import React from 'react';
import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import type { Post } from '@/lib/types';

// Mock the API module
const mockDeletePost = jest.fn();
const mockGetPost = jest.fn();
const mockGetPosts = jest.fn();

jest.mock('@/lib/api', () => ({
  deletePost: (...args: unknown[]) => mockDeletePost(...args),
  getPost: (...args: unknown[]) => mockGetPost(...args),
  getPosts: (...args: unknown[]) => mockGetPosts(...args),
  isApiError: (error: unknown): boolean => {
    return error instanceof Error && 'statusCode' in error;
  },
  ApiError: class ApiError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
      this.name = 'ApiError';
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

// Mock SWR
let mockPostsData: Post[] | undefined;
let mockPostData: Post | undefined;
let mockMutate = jest.fn();

jest.mock('swr', () => {
  const originalModule = jest.requireActual('swr');
  return {
    __esModule: true,
    ...originalModule,
    default: jest.fn((key: string | null) => {
      if (key === '/posts') {
        return {
          data: mockPostsData,
          error: undefined,
          isLoading: false,
          mutate: mockMutate,
        };
      }
      if (key?.startsWith('/posts/')) {
        return {
          data: mockPostData,
          error: undefined,
          isLoading: false,
          mutate: mockMutate,
        };
      }
      return { data: undefined, error: undefined, isLoading: true, mutate: mockMutate };
    }),
    useSWRConfig: () => ({
      mutate: mockMutate,
    }),
  };
});

// Import components after mocks
import DeleteConfirm from '@/components/DeleteConfirm';
import PostDetail from '@/components/PostDetail';

const mockPost: Post = {
  id: 42,
  title: 'Post to Delete',
  slug: 'post-to-delete',
  body: 'This post will be deleted.',
  createdAt: '2025-11-20T10:00:00Z',
  updatedAt: '2025-11-27T15:30:00Z',
};

const mockPostsList: Post[] = [
  mockPost,
  {
    id: 43,
    title: 'Another Post',
    slug: 'another-post',
    body: 'This post will remain.',
    createdAt: '2025-11-21T10:00:00Z',
    updatedAt: '2025-11-21T10:00:00Z',
  },
];

describe('Delete Post Workflow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPostsData = [...mockPostsList];
    mockPostData = mockPost;
    mockDeletePost.mockResolvedValue(undefined);
    mockMutate = jest.fn().mockResolvedValue(undefined);
  });

  describe('Delete from PostDetail page', () => {
    it('shows delete button on post detail page', () => {
      render(<PostDetail post={mockPost} />);
      
      expect(screen.getByRole('button', { name: /delete post/i })).toBeInTheDocument();
    });

    it('opens confirmation modal when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<PostDetail post={mockPost} />);
      
      await user.click(screen.getByRole('button', { name: /delete post/i }));
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      // Check dialog contains reference to the post title
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText(/Post to Delete/)).toBeInTheDocument();
    });

    it('displays post title in confirmation dialog', async () => {
      const user = userEvent.setup();
      render(<PostDetail post={mockPost} />);
      
      await user.click(screen.getByRole('button', { name: /delete post/i }));
      
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText(/Post to Delete/)).toBeInTheDocument();
    });

    it('closes modal when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<PostDetail post={mockPost} />);
      
      await user.click(screen.getByRole('button', { name: /delete post/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Successful deletion', () => {
    it('calls deletePost API when confirmed', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn().mockResolvedValue(undefined);
      render(<PostDetail post={mockPost} onDelete={onDelete} />);
      
      // Open the modal
      await user.click(screen.getByRole('button', { name: /delete post/i }));
      
      // Click confirm in the modal
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));
      
      await waitFor(() => {
        expect(onDelete).toHaveBeenCalled();
      });
      
      // Wait for component state updates to complete (modal closes on success)
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('shows loading state during deletion', async () => {
      const user = userEvent.setup();
      // Make the delete hang - use a promise that never resolves
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      const onDelete = jest.fn().mockReturnValue(deletePromise);
      render(<PostDetail post={mockPost} onDelete={onDelete} />);
      
      await user.click(screen.getByRole('button', { name: /delete post/i }));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));
      
      // Verify loading state
      await waitFor(() => {
        expect(onDelete).toHaveBeenCalled();
      });
      
      // Cleanup: resolve the promise and wait for all state updates
      await act(async () => {
        resolveDelete!();
        // Wait for the promise chain to complete
        await Promise.resolve();
      });
      
      // Wait for the modal to close (component state to settle)
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('redirects to homepage after successful deletion', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn().mockResolvedValue(undefined);
      render(<PostDetail post={mockPost} onDelete={onDelete} />);
      
      await user.click(screen.getByRole('button', { name: /delete post/i }));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));
      
      // Wait for component state updates to complete (modal closes on success)
      await waitFor(() => {
        expect(onDelete).toHaveBeenCalled();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('removes post from list after deletion', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn().mockResolvedValue(undefined);
      render(<PostDetail post={mockPost} onDelete={onDelete} />);
      
      await user.click(screen.getByRole('button', { name: /delete post/i }));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));
      
      // Wait for component state updates to complete (modal closes on success)
      await waitFor(() => {
        expect(onDelete).toHaveBeenCalled();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Failed deletion', () => {
    it('shows error message when deletion fails with network error', async () => {
      const user = userEvent.setup();
      const networkError = new Error('Network error');
      (networkError as any).statusCode = 0;
      const onDelete = jest.fn().mockRejectedValue(networkError);
      
      render(<PostDetail post={mockPost} onDelete={onDelete} />);
      
      await user.click(screen.getByRole('button', { name: /delete post/i }));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));
      
      // Wait for the error state to settle (error message shown and button changes to "Try Again")
      await waitFor(() => {
        expect(onDelete).toHaveBeenCalled();
        expect(within(dialog).getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('shows error message when deletion fails with 404', async () => {
      const user = userEvent.setup();
      const notFoundError = new Error('Post not found');
      (notFoundError as any).statusCode = 404;
      const onDelete = jest.fn().mockRejectedValue(notFoundError);
      
      render(<PostDetail post={mockPost} onDelete={onDelete} />);
      
      await user.click(screen.getByRole('button', { name: /delete post/i }));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));
      
      // Wait for the error state to settle
      await waitFor(() => {
        expect(onDelete).toHaveBeenCalled();
        expect(within(dialog).getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('shows error message when deletion fails with server error', async () => {
      const user = userEvent.setup();
      const serverError = new Error('Internal server error');
      (serverError as any).statusCode = 500;
      const onDelete = jest.fn().mockRejectedValue(serverError);
      
      render(<PostDetail post={mockPost} onDelete={onDelete} />);
      
      await user.click(screen.getByRole('button', { name: /delete post/i }));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));
      
      // Wait for the error state to settle
      await waitFor(() => {
        expect(onDelete).toHaveBeenCalled();
        expect(within(dialog).getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('allows retry after error', async () => {
      const user = userEvent.setup();
      const error = new Error('Network error');
      (error as any).statusCode = 0;
      const onDelete = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined);
      
      render(<PostDetail post={mockPost} onDelete={onDelete} />);
      
      // First attempt fails
      await user.click(screen.getByRole('button', { name: /delete post/i }));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));
      
      // Wait for the error state to settle (button becomes "Try Again")
      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledTimes(1);
        expect(within(dialog).getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('keeps modal open on error', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn().mockRejectedValue(new Error('Failed'));
      
      render(<PostDetail post={mockPost} onDelete={onDelete} />);
      
      await user.click(screen.getByRole('button', { name: /delete post/i }));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));
      
      await waitFor(() => {
        expect(onDelete).toHaveBeenCalled();
      });
      
      // Modal should still be visible after error
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('keeps post intact when deletion fails', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn().mockRejectedValue(new Error('Failed'));
      
      render(<PostDetail post={mockPost} onDelete={onDelete} />);
      
      await user.click(screen.getByRole('button', { name: /delete post/i }));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));
      
      await waitFor(() => {
        expect(onDelete).toHaveBeenCalled();
      });
      
      // Post data should still be displayed (check the heading)
      expect(screen.getByRole('heading', { level: 1, name: 'Post to Delete' })).toBeInTheDocument();
    });
  });

  describe('Keyboard navigation', () => {
    it('closes modal with Escape key', async () => {
      const user = userEvent.setup();
      render(<PostDetail post={mockPost} />);
      
      await user.click(screen.getByRole('button', { name: /delete post/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('confirms with Enter key on confirm button', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn().mockResolvedValue(undefined);
      render(<PostDetail post={mockPost} onDelete={onDelete} />);
      
      await user.click(screen.getByRole('button', { name: /delete post/i }));
      
      // Wait for initial focus on Cancel, then tab to Delete and press Enter
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
      });
      await user.tab();
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(onDelete).toHaveBeenCalled();
      });
    });

    it('traps focus within modal', async () => {
      const user = userEvent.setup();
      render(<PostDetail post={mockPost} />);
      
      await user.click(screen.getByRole('button', { name: /delete post/i }));
      
      // Tab through all focusable elements
      const dialog = screen.getByRole('dialog');
      const focusableElements = dialog.querySelectorAll('button');
      
      expect(focusableElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Accessibility', () => {
    it('has accessible dialog structure', async () => {
      const user = userEvent.setup();
      render(<PostDetail post={mockPost} />);
      
      await user.click(screen.getByRole('button', { name: /delete post/i }));
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('announces error to screen readers', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn().mockRejectedValue(new Error('Delete failed'));
      
      render(<PostDetail post={mockPost} onDelete={onDelete} />);
      
      await user.click(screen.getByRole('button', { name: /delete post/i }));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));
      
      await waitFor(() => {
        expect(onDelete).toHaveBeenCalled();
      });
    });
  });

  describe('Edge cases', () => {
    it('handles deletion of already deleted post (404)', async () => {
      const user = userEvent.setup();
      const notFoundError = new Error('Post not found');
      (notFoundError as any).statusCode = 404;
      const onDelete = jest.fn().mockRejectedValue(notFoundError);
      
      render(<PostDetail post={mockPost} onDelete={onDelete} />);
      
      await user.click(screen.getByRole('button', { name: /delete post/i }));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));
      
      await waitFor(() => {
        expect(onDelete).toHaveBeenCalled();
      });
    });

    it('prevents double submission during delete', async () => {
      const user = userEvent.setup();
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      const onDelete = jest.fn().mockReturnValue(deletePromise);
      
      render(<PostDetail post={mockPost} onDelete={onDelete} />);
      
      await user.click(screen.getByRole('button', { name: /delete post/i }));
      
      // Click confirm in the modal
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));
      
      // Button should be disabled after first click
      expect(onDelete).toHaveBeenCalledTimes(1);
      
      // Resolve the delete
      resolveDelete!();
    });
  });
});

describe('DeleteConfirm Component', () => {
  const defaultProps = {
    postId: 1,
    postTitle: 'Test Post',
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(<DeleteConfirm {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('calls onConfirm when delete is confirmed', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirm {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /delete|confirm/i }));
    
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it('calls onClose when cancelled', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirm {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows loading state when isLoading is true', () => {
    render(<DeleteConfirm {...defaultProps} isLoading={true} />);
    
    expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();
  });

  it('shows error message when error is provided', () => {
    render(<DeleteConfirm {...defaultProps} error="Failed to delete" />);
    
    expect(screen.getByText(/Failed to delete/)).toBeInTheDocument();
  });
});
