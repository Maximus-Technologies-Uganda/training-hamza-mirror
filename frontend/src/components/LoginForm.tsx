'use client';

/**
 * Login Form Component
 * 
 * Renders a login form with email and password fields.
 * Handles form submission and displays validation errors.
 * Supports WCAG 2.1 AA accessibility standards.
 */

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

/**
 * Props for LoginForm component
 */
interface LoginFormProps {
  /** Callback function called on successful login */
  onSuccess?: () => void;
  
  /** Optional CSS class name */
  className?: string;
}

/**
 * Login credentials for email/password authentication
 */
interface EmailLoginCredentials {
  email: string;
  password: string;
}

/**
 * Login Form Component
 */
export function LoginForm({ onSuccess, className = '' }: LoginFormProps): React.JSX.Element {
  const { signInWithEmail } = useAuth();
  const [credentials, setCredentials] = useState<EmailLoginCredentials>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle form input changes
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signInWithEmail(credentials.email, credentials.password);
      onSuccess?.();
    } catch (err) {
      if (err instanceof Error) {
        // Firebase auth errors are descriptive
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`} aria-label="Login form">
      {/* Error message */}
      {error && (
        <div
          id="login-error"
          role="alert"
          aria-live="polite"
          className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
        >
          {error}
        </div>
      )}

      {/* Email field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={credentials.email}
          onChange={handleChange}
          required
          autoComplete="email"
          aria-required="true"
          aria-describedby={error ? 'login-error' : undefined}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          placeholder="your.email@example.com"
          disabled={isSubmitting}
        />
      </div>

      {/* Password field */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={credentials.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
          aria-required="true"
          aria-describedby={error ? 'login-error' : undefined}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          placeholder="Enter your password"
          disabled={isSubmitting}
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting || !credentials.email || !credentials.password}
        aria-busy={isSubmitting}
        className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}

export default LoginForm;
