/**
 * ErrorMessage Component
 * Displays user-friendly error messages with optional retry functionality
 * 
 * @module components/ErrorMessage
 * 
 * @description
 * A reusable error display component styled as a card with a red accent.
 * Includes an icon, heading, message, and optional retry button.
 * Uses ARIA role="alert" for accessibility announcements.
 * 
 * @example
 * ```tsx
 * // Basic error display
 * <ErrorMessage message="Failed to load posts" />
 * 
 * // With retry callback
 * <ErrorMessage 
 *   message="Network error occurred" 
 *   onRetry={() => refetch()} 
 * />
 * ```
 */

'use client';

import { useRef, useEffect } from 'react';

/**
 * Props for the ErrorMessage component
 */
interface ErrorMessageProps {
  /** The error message to display to the user */
  message: string;
  /** Optional callback function to retry the failed operation */
  onRetry?: () => void;
}

/**
 * Renders an error alert with optional retry button
 * 
 * @param {ErrorMessageProps} props - Component props
 * @returns {JSX.Element} Error alert with ARIA role for accessibility
 */
export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  const retryButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the retry button when error appears (for keyboard accessibility)
  useEffect(() => {
    if (onRetry && retryButtonRef.current) {
      retryButtonRef.current.focus();
    }
  }, [message, onRetry]);

  return (
    <div 
      className="card border-l-4 border-red-500 bg-red-50" 
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 text-red-600 mr-3" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Something went wrong
          </h3>
          <p className="text-red-700 mb-4">{message}</p>
          {onRetry && (
            <button
              ref={retryButtonRef}
              onClick={onRetry}
              className="btn btn-secondary text-sm"
              aria-label="Retry loading"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
