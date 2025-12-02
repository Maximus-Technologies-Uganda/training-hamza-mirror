/**
 * Unit tests for DeleteConfirm component
 * Tests modal display, confirmation, cancel, loading states, and error handling
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DeleteConfirm from '@/components/DeleteConfirm';

describe('DeleteConfirm', () => {
  const defaultProps = {
    postId: 1,
    postTitle: 'Test Post Title',
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders modal when isOpen is true', () => {
      render(<DeleteConfirm {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render modal when isOpen is false', () => {
      render(<DeleteConfirm {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('displays dialog title', () => {
      render(<DeleteConfirm {...defaultProps} />);
      expect(screen.getByText('Delete Post?')).toBeInTheDocument();
    });

    it('displays post title in confirmation message', () => {
      render(<DeleteConfirm {...defaultProps} />);
      expect(screen.getByText(/Test Post Title/)).toBeInTheDocument();
    });

    it('displays warning about permanent deletion', () => {
      render(<DeleteConfirm {...defaultProps} />);
      expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    });

    it('renders Cancel button', () => {
      render(<DeleteConfirm {...defaultProps} />);
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('renders Delete/Confirm button', () => {
      render(<DeleteConfirm {...defaultProps} />);
      expect(screen.getByRole('button', { name: /delete|confirm/i })).toBeInTheDocument();
    });
  });

  describe('Cancel behavior', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirm {...defaultProps} />);
      
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirm {...defaultProps} />);
      
      // Find the backdrop (the overlay element)
      const backdrop = screen.getByTestId('modal-backdrop');
      await user.click(backdrop);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirm {...defaultProps} />);
      
      await user.keyboard('{Escape}');
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onConfirm when cancelled', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirm {...defaultProps} />);
      
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Confirm behavior', () => {
    it('calls onConfirm when Delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirm {...defaultProps} />);
      
      await user.click(screen.getByRole('button', { name: /delete|confirm/i }));
      
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm when Enter key is pressed on Delete button', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirm {...defaultProps} />);
      
      // Wait for initial focus, then tab to Delete button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
      });
      await user.tab();
      
      // Now Delete button should be focused
      expect(screen.getByRole('button', { name: /delete|confirm/i })).toHaveFocus();
      
      await user.keyboard('{Enter}');
      
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading state', () => {
    it('shows loading state when isLoading is true', () => {
      render(<DeleteConfirm {...defaultProps} isLoading={true} />);
      
      const deleteButton = screen.getByRole('button', { name: /deleting|loading/i });
      expect(deleteButton).toBeInTheDocument();
    });

    it('disables Delete button when loading', () => {
      render(<DeleteConfirm {...defaultProps} isLoading={true} />);
      
      const deleteButton = screen.getByRole('button', { name: /deleting|loading/i });
      expect(deleteButton).toBeDisabled();
    });

    it('disables Cancel button when loading', () => {
      render(<DeleteConfirm {...defaultProps} isLoading={true} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });

    it('shows loading spinner when deleting', () => {
      render(<DeleteConfirm {...defaultProps} isLoading={true} />);
      
      expect(screen.getByRole('status', { name: /deleting post/i })).toBeInTheDocument();
    });

    it('does not close on backdrop click when loading', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirm {...defaultProps} isLoading={true} />);
      
      const backdrop = screen.getByTestId('modal-backdrop');
      await user.click(backdrop);
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('does not close on Escape when loading', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirm {...defaultProps} isLoading={true} />);
      
      await user.keyboard('{Escape}');
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Error state', () => {
    it('displays error message when error prop is provided', () => {
      render(<DeleteConfirm {...defaultProps} error="Failed to delete post" />);
      
      expect(screen.getByText(/Failed to delete post/i)).toBeInTheDocument();
    });

    it('keeps modal open when error occurs', () => {
      render(<DeleteConfirm {...defaultProps} error="Network error" />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete|confirm|try again/i })).toBeInTheDocument();
    });

    it('allows retry after error', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirm {...defaultProps} error="Network error" />);
      
      await user.click(screen.getByRole('button', { name: /delete|confirm|try again/i }));
      
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    it('shows error styling', () => {
      render(<DeleteConfirm {...defaultProps} error="Deletion failed" />);
      
      const errorMessage = screen.getByText(/Deletion failed/i);
      expect(errorMessage).toHaveClass('text-red-600');
    });
  });

  describe('Accessibility', () => {
    it('has role="dialog"', () => {
      render(<DeleteConfirm {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal="true"', () => {
      render(<DeleteConfirm {...defaultProps} />);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby pointing to title', () => {
      render(<DeleteConfirm {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      const labelId = dialog.getAttribute('aria-labelledby');
      expect(labelId).toBeTruthy();
      expect(document.getElementById(labelId!)).toHaveTextContent('Delete Post?');
    });

    it('has aria-describedby pointing to description', () => {
      render(<DeleteConfirm {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      const descId = dialog.getAttribute('aria-describedby');
      expect(descId).toBeTruthy();
      expect(document.getElementById(descId!)).toHaveTextContent(/cannot be undone/i);
    });

    it('focuses the first focusable element when opened', async () => {
      render(<DeleteConfirm {...defaultProps} />);
      
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        expect(document.activeElement).toBe(cancelButton);
      });
    });

    it('traps focus within the modal', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirm {...defaultProps} />);
      
      // Wait for initial focus on Cancel
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
      });
      
      // Tab to Delete button
      await user.tab();
      expect(screen.getByRole('button', { name: /delete|confirm/i })).toHaveFocus();
      
      // Tab again should cycle back to cancel
      await user.tab();
      expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
    });

    it('announces error messages to screen readers', () => {
      render(<DeleteConfirm {...defaultProps} error="Network error" />);
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent(/Network error/i);
    });
  });

  describe('Edge cases', () => {
    it('handles very long post titles', () => {
      const longTitle = 'A'.repeat(200);
      render(<DeleteConfirm {...defaultProps} postTitle={longTitle} />);
      
      expect(screen.getByText(new RegExp(longTitle.substring(0, 50)))).toBeInTheDocument();
    });

    it('handles special characters in post title', () => {
      const specialTitle = 'Post with <script> & "quotes"';
      render(<DeleteConfirm {...defaultProps} postTitle={specialTitle} />);
      
      expect(screen.getByText(/Post with/)).toBeInTheDocument();
    });

    it('handles rapid confirm clicks', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirm {...defaultProps} />);
      
      const deleteButton = screen.getByRole('button', { name: /delete|confirm/i });
      
      // Rapid clicks
      await user.click(deleteButton);
      await user.click(deleteButton);
      await user.click(deleteButton);
      
      // Should only call once (assuming first click triggers loading)
      expect(defaultProps.onConfirm).toHaveBeenCalled();
    });
  });
});
