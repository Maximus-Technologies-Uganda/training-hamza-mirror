/**
 * AuthErrorMessage Component
 * 
 * T077: [US7] Display user-friendly auth error messages with login prompt for 401.
 * Shows appropriate messages based on HTTP status codes with actions.
 */

'use client';

import Link from 'next/link';
import { mapAuthError, isAuthenticationError, getErrorAction } from '@/lib/errors';

/**
 * Props for AuthErrorMessage component
 */
interface AuthErrorMessageProps {
  /** HTTP status code of the error */
  status: number;
  /** Optional context for more specific error messages */
  context?: 'edit' | 'delete' | 'create';
  /** Optional retry callback for server errors */
  onRetry?: () => void;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * AuthErrorMessage displays user-friendly error messages based on HTTP status codes.
 * 
 * - For 401: Shows login prompt with link to login page
 * - For 403: Shows permission denied message
 * - For 5xx: Shows server error with retry option
 * - For others: Shows appropriate generic message
 */
export default function AuthErrorMessage({
  status,
  context,
  onRetry,
  className = '',
}: AuthErrorMessageProps): React.JSX.Element {
  const message = mapAuthError(status, context);
  const action = getErrorAction(status);
  const showLoginPrompt = isAuthenticationError(status);

  // Determine background color based on error type
  const bgColor = status >= 500 ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200';
  const textColor = status >= 500 ? 'text-orange-700' : 'text-red-700';
  const iconColor = status >= 500 ? 'text-orange-500' : 'text-red-500';

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`p-4 rounded-lg border ${bgColor} ${className}`}
    >
      <div className="flex items-start gap-3">
        {/* Error Icon */}
        <div className={`flex-shrink-0 ${iconColor}`} aria-hidden="true">
          {status >= 500 ? (
            // Server error icon
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : status === 401 ? (
            // Lock icon for auth errors
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          ) : status === 403 ? (
            // Shield icon for forbidden
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01"
              />
            </svg>
          ) : (
            // Generic warning icon
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1">
          <p className={`text-sm font-medium ${textColor}`}>{message}</p>

          {/* Action buttons */}
          <div className="mt-3 flex gap-3">
            {/* T078: Show login link on 401 */}
            {showLoginPrompt && (
              <Link
                href="/login"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                {action || 'Log in'}
              </Link>
            )}

            {/* Retry button for server errors */}
            {onRetry && action && !showLoginPrompt && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                {action}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
