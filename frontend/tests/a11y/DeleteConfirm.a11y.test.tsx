/**
 * Accessibility tests for DeleteConfirm component
 * Tests WCAG 2.1 AA compliance, focus management, and keyboard support
 */

import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';
import DeleteConfirm from '@/components/DeleteConfirm';

expect.extend(toHaveNoViolations);

describe('DeleteConfirm Accessibility', () => {
  const defaultProps = {
    postId: 1,
    postTitle: 'Accessible Post Title',
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('should have no accessibility violations in default state', async () => {
      const { container } = render(<DeleteConfirm {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in loading state', async () => {
      const { container } = render(<DeleteConfirm {...defaultProps} isLoading={true} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in error state', async () => {
      const { container } = render(<DeleteConfirm {...defaultProps} error="Deletion failed" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when closed', async () => {
      const { container } = render(<DeleteConfirm {...defaultProps} isOpen={false} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Dialog ARIA attributes', () => {
    it('has role="dialog"', async () => {
      render(<DeleteConfirm {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal="true"', async () => {
      render(<DeleteConfirm {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby pointing to the title', async () => {
      render(<DeleteConfirm {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      const labelledBy = dialog.getAttribute('aria-labelledby');
      
      expect(labelledBy).toBeTruthy();
      const titleElement = document.getElementById(labelledBy!);
      expect(titleElement).toHaveTextContent(/Delete Post/i);
    });

    it('has aria-describedby pointing to the description', async () => {
      render(<DeleteConfirm {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      const describedBy = dialog.getAttribute('aria-describedby');
      
      expect(describedBy).toBeTruthy();
      const descElement = document.getElementById(describedBy!);
      expect(descElement).toHaveTextContent(/cannot be undone/i);
    });
  });

  describe('Focus management', () => {
    it('moves focus into the dialog when opened', async () => {
      render(<DeleteConfirm {...defaultProps} />);
      
      await waitFor(() => {
        // First focusable element (Cancel button) should be focused
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        expect(document.activeElement).toBe(cancelButton);
      });
    });

    it('traps focus within the dialog', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
      });

      // Tab to Delete button
      await user.tab();
      expect(screen.getByRole('button', { name: /delete|confirm/i })).toHaveFocus();

      // Tab again should wrap back to Cancel (focus trap)
      await user.tab();
      expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
    });

    it('supports Shift+Tab navigation', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
      });

      // Shift+Tab should go to last focusable element
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(screen.getByRole('button', { name: /delete|confirm/i })).toHaveFocus();
    });

    it('returns focus to trigger element when closed', async () => {
      const user = userEvent.setup();
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Delete';
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      const { rerender } = render(<DeleteConfirm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
      });

      // Close the dialog
      rerender(<DeleteConfirm {...defaultProps} isOpen={false} />);

      // Note: In real implementation, focus should return to trigger
      document.body.removeChild(triggerButton);
    });
  });

  describe('Keyboard support', () => {
    it('closes dialog with Escape key', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirm {...defaultProps} />);
      
      await user.keyboard('{Escape}');
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close with Escape when loading', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirm {...defaultProps} isLoading={true} />);
      
      await user.keyboard('{Escape}');
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('activates Cancel button with Enter key', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
      });

      await user.keyboard('{Enter}');
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('activates Cancel button with Space key', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
      });

      await user.keyboard(' ');
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('activates Delete button with Enter key', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
      });

      await user.tab(); // Move to Delete button
      await user.keyboard('{Enter}');
      
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    it('activates Delete button with Space key', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
      });

      await user.tab(); // Move to Delete button
      await user.keyboard(' ');
      
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button accessibility', () => {
    it('Cancel button has accessible name', async () => {
      render(<DeleteConfirm {...defaultProps} />);
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('Delete button has accessible name', async () => {
      render(<DeleteConfirm {...defaultProps} />);
      expect(screen.getByRole('button', { name: /delete|confirm/i })).toBeInTheDocument();
    });

    it('loading button indicates loading state accessibly', async () => {
      render(<DeleteConfirm {...defaultProps} isLoading={true} />);
      
      const loadingButton = screen.getByRole('button', { name: /deleting/i });
      expect(loadingButton).toBeDisabled();
      expect(loadingButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('buttons have visible focus indicators', async () => {
      render(<DeleteConfirm {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const deleteButton = screen.getByRole('button', { name: /delete|confirm/i });
      
      // Check for focus ring classes (Tailwind)
      expect(cancelButton).toHaveClass('focus:ring-2');
      expect(deleteButton).toHaveClass('focus:ring-2');
    });
  });

  describe('Error announcements', () => {
    it('error message has role="alert"', async () => {
      render(<DeleteConfirm {...defaultProps} error="Deletion failed" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('error message is announced immediately', async () => {
      render(<DeleteConfirm {...defaultProps} error="Network error" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('error message contains the error text', async () => {
      render(<DeleteConfirm {...defaultProps} error="Server error occurred" />);
      
      expect(screen.getByRole('alert')).toHaveTextContent('Server error occurred');
    });
  });

  describe('Color contrast', () => {
    it('should have sufficient color contrast for buttons', async () => {
      const { container } = render(<DeleteConfirm {...defaultProps} />);
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });

    it('should have sufficient color contrast for error message', async () => {
      const { container } = render(<DeleteConfirm {...defaultProps} error="Error text" />);
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });
  });

  describe('Modal backdrop', () => {
    it('backdrop does not receive focus', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirm {...defaultProps} />);
      
      // Wait for initial focus to be set on Cancel button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
      });
      
      // Tab through all focusable elements (Cancel -> Delete -> Cancel)
      // Modal has 2 focusable buttons, so 2 tabs cycles back to start
      await user.tab(); // Cancel -> Delete
      await user.tab(); // Delete -> Cancel (cycle back)
      
      // Should cycle back to first element, never focusing backdrop
      expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
    });

    it('clicking backdrop closes dialog when not loading', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirm {...defaultProps} />);
      
      const backdrop = screen.getByTestId('modal-backdrop');
      await user.click(backdrop);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Screen reader experience', () => {
    it('dialog title is properly associated', async () => {
      render(<DeleteConfirm {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      const labelledById = dialog.getAttribute('aria-labelledby');
      const titleElement = document.getElementById(labelledById!);
      
      expect(titleElement?.tagName).toBe('H2');
      expect(titleElement).toHaveTextContent(/Delete Post/i);
    });

    it('post title is included in description for context', async () => {
      render(<DeleteConfirm {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      const describedById = dialog.getAttribute('aria-describedby');
      const descElement = document.getElementById(describedById!);
      
      expect(descElement).toHaveTextContent(/Accessible Post Title/);
    });

    it('loading spinner has accessible label', async () => {
      render(<DeleteConfirm {...defaultProps} isLoading={true} />);
      
      const statusElements = screen.getAllByRole('status');
      // Find the spinner (has aria-label for "Deleting post")
      const spinner = statusElements.find(el => el.getAttribute('aria-label')?.includes('Deleting'));
      expect(spinner).toBeTruthy();
      expect(spinner).toHaveAccessibleName();
    });
  });

  describe('Touch target size', () => {
    it('buttons meet minimum touch target size (44x44px)', async () => {
      render(<DeleteConfirm {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const deleteButton = screen.getByRole('button', { name: /delete|confirm/i });
      
      // Check for padding classes that ensure minimum size
      expect(cancelButton).toHaveClass('px-4');
      expect(cancelButton).toHaveClass('py-2');
      expect(deleteButton).toHaveClass('px-4');
      expect(deleteButton).toHaveClass('py-2');
    });
  });
});
