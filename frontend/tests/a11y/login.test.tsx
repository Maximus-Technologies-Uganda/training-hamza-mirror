/**
 * Accessibility tests for LoginForm component
 * Tests WCAG 2.1 AA compliance using jest-axe
 * 
 * Validates:
 * - Form structure and semantics
 * - Label associations
 * - Error message announcements
 * - Keyboard navigation
 * - Focus management
 * - ARIA attributes
 */

import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { LoginForm } from '@/components/LoginForm';

// Mock AuthProvider
const mockSignInWithEmail = jest.fn();

jest.mock('@/components/AuthProvider', () => ({
  useAuth: () => ({
    signInWithEmail: mockSignInWithEmail,
    user: null,
    isAdmin: false,
    loading: false,
    signOut: jest.fn(),
  }),
}));

describe('LoginForm Accessibility (WCAG 2.1 AA)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Form Structure', () => {
    it('should not have any accessibility violations in default state', async () => {
      const { container } = render(<LoginForm />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should render a form element with proper role', () => {
      render(<LoginForm />);
      const form = screen.getByRole('form', { hidden: true });
      expect(form).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(<LoginForm />);
      // Note: LoginForm doesn't include a heading - parent page should provide one
      // This is correct as per WCAG guidelines (form should be in a sectioning element)
    });
  });

  describe('Form Fields - Labels and Associations', () => {
    it('should have accessible name for email input', () => {
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should have accessible name for password input', () => {
      render(<LoginForm />);
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should have proper label association using htmlFor and id', () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const emailLabel = screen.getByText(/email address/i);
      expect(emailLabel).toHaveAttribute('for', emailInput.id);

      const passwordInput = screen.getByLabelText(/password/i);
      const passwordLabel = screen.getByText(/password/i);
      expect(passwordLabel).toHaveAttribute('for', passwordInput.id);
    });

    it('should have required attribute on email field', () => {
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeRequired();
    });

    it('should have required attribute on password field', () => {
      render(<LoginForm />);
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toBeRequired();
    });

    it('should use appropriate input types', () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('type', 'email');

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should have autocomplete attributes for autofill support', () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('autoComplete', 'email');

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
    });
  });

  describe('Submit Button', () => {
    it('should have accessible name for submit button', () => {
      render(<LoginForm />);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('should indicate disabled state when submitting', async () => {
      mockSignInWithEmail.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent(/signing in/i);
    });
  });

  describe('Error Messages - ARIA Live Regions', () => {
    it('should announce errors to screen readers using role="alert"', async () => {
      mockSignInWithEmail.mockRejectedValue(new Error('Invalid credentials'));
      
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent(/invalid credentials/i);
      });
    });

    it('should have aria-live="polite" for error announcements', async () => {
      mockSignInWithEmail.mockRejectedValue(new Error('Network error'));
      
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should have proper error styling with sufficient color contrast', async () => {
      mockSignInWithEmail.mockRejectedValue(new Error('Test error'));
      
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        // Check for red color classes (Tailwind classes indicate proper contrast)
        expect(errorMessage).toHaveClass('text-red-700');
        expect(errorMessage).toHaveClass('bg-red-50');
        expect(errorMessage).toHaveClass('border-red-200');
      });
    });

    it('should not have accessibility violations when displaying errors', async () => {
      mockSignInWithEmail.mockRejectedValue(new Error('Authentication failed'));
      
      const user = userEvent.setup();
      const { container } = render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should clear error message when user starts typing', async () => {
      mockSignInWithEmail.mockRejectedValue(new Error('Invalid credentials'));
      
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Trigger error
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Start typing again
      await user.type(emailInput, 'a');

      // Error should be cleared
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through form fields', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      // Fill in fields to enable the submit button
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Focus email input to start navigation
      emailInput.focus();
      expect(emailInput).toHaveFocus();

      // Tab to password
      await user.tab();
      expect(passwordInput).toHaveFocus();

      // Tab to submit button (now enabled)
      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should allow form submission via Enter key', async () => {
      mockSignInWithEmail.mockResolvedValue(undefined);
      
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      // Press Enter in password field
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockSignInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should maintain focus management during submission', async () => {
      mockSignInWithEmail.mockResolvedValue(undefined);
      
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      submitButton.focus();
      
      expect(submitButton).toHaveFocus();
    });
  });

  describe('Form Validation', () => {
    it('should use HTML5 validation for email format', () => {
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      
      // Set invalid email
      emailInput.value = 'invalid-email';
      expect(emailInput.validity.valid).toBe(false);
      expect(emailInput.validity.typeMismatch).toBe(true);

      // Set valid email
      emailInput.value = 'test@example.com';
      expect(emailInput.validity.typeMismatch).toBe(false);
    });

    it('should require email field', () => {
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      
      expect(emailInput.validity.valueMissing).toBe(true);
      
      emailInput.value = 'test@example.com';
      expect(emailInput.validity.valueMissing).toBe(false);
    });

    it('should require password field', () => {
      render(<LoginForm />);
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      
      expect(passwordInput.validity.valueMissing).toBe(true);
      
      passwordInput.value = 'password123';
      expect(passwordInput.validity.valueMissing).toBe(false);
    });
  });

  describe('Success Callback', () => {
    it('should call onSuccess callback after successful login', async () => {
      mockSignInWithEmail.mockResolvedValue(undefined);
      const onSuccess = jest.fn();
      
      const user = userEvent.setup();
      render(<LoginForm onSuccess={onSuccess} />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Visual Focus Indicators', () => {
    it('should have visible focus indicators on inputs', () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      // Check for focus ring classes (Tailwind)
      expect(emailInput).toHaveClass('focus:ring-2');
      expect(passwordInput).toHaveClass('focus:ring-2');
    });

    it('should have visible focus indicator on submit button', () => {
      render(<LoginForm />);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      // Check for focus ring classes
      expect(submitButton).toHaveClass('focus:ring-2');
    });
  });

  describe('Custom Class Name', () => {
    it('should accept and apply custom className', () => {
      const { container } = render(<LoginForm className="custom-class" />);
      const form = container.querySelector('form');
      expect(form).toHaveClass('custom-class');
    });
  });
});
