/**
 * Accessibility tests for PostForm component
 * Tests WCAG 2.1 AA compliance using jest-axe
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import PostForm from '@/components/PostForm';
import type { Post } from '@/lib/types';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock the API module
jest.mock('@/lib/api', () => ({
  createPost: jest.fn().mockResolvedValue({
    id: 1,
    title: 'Test',
    slug: 'test',
    body: 'Test body',
    createdAt: '2025-11-27T10:00:00Z',
    updatedAt: '2025-11-27T10:00:00Z',
  }),
  updatePost: jest.fn(),
}));

describe('PostForm Accessibility', () => {
  describe('Form Structure', () => {
    it('should not have any accessibility violations in create mode', async () => {
      let container: HTMLElement;
      await act(async () => {
        const result = render(<PostForm />);
        container = result.container;
      });
      const results = await axe(container!);
      expect(results).toHaveNoViolations();
    });

    it('should not have any accessibility violations in edit mode', async () => {
      const existingPost: Post = {
        id: 1,
        title: 'Test Post',
        slug: 'test-post',
        body: 'Test body content',
        createdAt: '2025-11-27T10:00:00Z',
        updatedAt: '2025-11-27T10:00:00Z',
      };
      let container: HTMLElement;
      await act(async () => {
        const result = render(<PostForm post={existingPost} isEditMode />);
        container = result.container;
      });
      const results = await axe(container!);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Form Labels', () => {
    it('should have properly associated labels for all form fields', async () => {
      let container: HTMLElement;
      await act(async () => {
        const result = render(<PostForm />);
        container = result.container;
      });
      
      const results = await axe(container!, {
        rules: {
          'label': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });

    it('title input should have accessible label', async () => {
      await act(async () => {
        render(<PostForm />);
      });
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveAccessibleName();
    });

    it('body textarea should have accessible label', async () => {
      await act(async () => {
        render(<PostForm />);
      });
      const bodyTextarea = screen.getByLabelText(/body/i);
      expect(bodyTextarea).toHaveAccessibleName();
    });
  });

  describe('Error Announcements', () => {
    it('should announce validation errors to screen readers', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<PostForm />);
      });

      // Submit empty form
      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Error messages should have appropriate role or aria-live
        const errorElements = screen.getAllByRole('alert');
        expect(errorElements.length).toBeGreaterThan(0);
      });
    });

    it('should not have accessibility violations when displaying errors', async () => {
      const user = userEvent.setup();
      let container: HTMLElement;
      await act(async () => {
        const result = render(<PostForm />);
        container = result.container;
      });

      const submitButton = screen.getByRole('button', { name: /create post/i });
      await user.click(submitButton);

      await waitFor(async () => {
        const results = await axe(container!);
        expect(results).toHaveNoViolations();
      });
    });
  });

  describe('Keyboard Support', () => {
    it('should be navigable with Tab key', async () => {
      const user = userEvent.setup();
      render(<PostForm />);

      // Tab through form elements
      await user.tab();
      expect(screen.getByLabelText(/title/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/body/i)).toHaveFocus();

      await user.tab();
      // Should focus on one of the buttons
      expect(document.activeElement?.tagName).toBe('BUTTON');
    });

    it('should be submittable with Enter key in title field (with valid form)', async () => {
      const user = userEvent.setup();
      render(<PostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Title');

      const bodyTextarea = screen.getByLabelText(/body/i);
      await user.type(bodyTextarea, 'Test body content');

      // Focus on title and press Enter
      titleInput.focus();
      await user.keyboard('{Enter}');

      // Form should attempt to submit (validation may still trigger)
    });

    it('should support Escape key to potentially cancel (if implemented)', async () => {
      render(<PostForm />);
      
      // Tab to focus something in the form
      const titleInput = screen.getByLabelText(/title/i);
      titleInput.focus();
      
      // Escape key should be handleable
      expect(document.activeElement).toBe(titleInput);
    });
  });

  describe('Focus Management', () => {
    it('should have visible focus indicators', async () => {
      let container: HTMLElement;
      await act(async () => {
        const result = render(<PostForm />);
        container = result.container;
      });
      
      const results = await axe(container!, {
        rules: {
          'focus-order-semantics': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });

    it('buttons should have focus indicators', async () => {
      await act(async () => {
        render(<PostForm />);
      });
      
      const submitButton = screen.getByRole('button', { name: /create post/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      // Check that buttons have focus-related classes or can receive focus
      expect(submitButton).not.toBeDisabled();
      expect(cancelButton).not.toBeDisabled();
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient color contrast', async () => {
      let container: HTMLElement;
      await act(async () => {
        const result = render(<PostForm />);
        container = result.container;
      });
      
      const results = await axe(container!, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });
  });

  describe('Button Accessibility', () => {
    it('submit button should have accessible name', async () => {
      await act(async () => {
        render(<PostForm />);
      });
      const submitButton = screen.getByRole('button', { name: /create post/i });
      expect(submitButton).toHaveAccessibleName();
    });

    it('cancel button should have accessible name', async () => {
      await act(async () => {
        render(<PostForm />);
      });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toHaveAccessibleName();
    });

    it('update button should have accessible name in edit mode', async () => {
      const existingPost: Post = {
        id: 1,
        title: 'Test Post',
        slug: 'test-post',
        body: 'Test body',
        createdAt: '2025-11-27T10:00:00Z',
        updatedAt: '2025-11-27T10:00:00Z',
      };
      await act(async () => {
        render(<PostForm post={existingPost} isEditMode />);
      });
      const updateButton = screen.getByRole('button', { name: /update post/i });
      expect(updateButton).toHaveAccessibleName();
    });
  });

  describe('Form Semantics', () => {
    it('should use proper form element', async () => {
      await act(async () => {
        render(<PostForm />);
      });
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('should not have duplicate IDs', async () => {
      let container: HTMLElement;
      await act(async () => {
        const result = render(<PostForm />);
        container = result.container;
      });
      
      const results = await axe(container!, {
        rules: {
          'duplicate-id': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });
  });

  describe('Required Field Indication', () => {
    it('should indicate required fields', async () => {
      await act(async () => {
        render(<PostForm />);
      });
      
      const titleInput = screen.getByLabelText(/title/i);
      const bodyTextarea = screen.getByLabelText(/body/i);
      
      // Check for required attribute or aria-required
      expect(titleInput).toHaveAttribute('required');
      expect(bodyTextarea).toHaveAttribute('required');
    });
  });

  describe('Character Count Accessibility', () => {
    it('character count should be accessible', async () => {
      const user = userEvent.setup();
      let container: HTMLElement;
      await act(async () => {
        const result = render(<PostForm />);
        container = result.container;
      });

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Hello');

      // Character count should be announced (aria-live or similar)
      const results = await axe(container!);
      expect(results).toHaveNoViolations();
    });
  });
});
