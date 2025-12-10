'use client';

/**
 * Error Boundary Component
 * 
 * T061: [Phase 11] Catches React errors and displays user-friendly error messages.
 * Provides special handling for authentication (401) and authorization (403) errors.
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<CustomError />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { 
  formatError, 
  isAuthError, 
  isPermissionError,
  FormattedError,
  ApiError 
} from '@/lib/errors';

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  
  /** Optional custom fallback UI */
  fallback?: ReactNode;
  
  /** Optional callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  
  /** Optional callback to reset error state */
  onReset?: () => void;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  formattedError: FormattedError | null;
}

/**
 * Error Boundary Component
 * 
 * Catches errors in child components and displays a fallback UI.
 * Provides special handling for auth errors (401) and permission errors (403).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      formattedError: null,
    };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Check if error has API error structure
    const apiError = error as unknown as ApiError;
    const formattedError = formatError(apiError.statusCode ? apiError : error);
    
    return {
      hasError: true,
      error,
      formattedError,
    };
  }

  /**
   * Log error details and call onError callback
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo,
    });
    
    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Reset error state and allow retry
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      formattedError: null,
    });
    
    // Call optional reset callback
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  /**
   * Handle sign-in action for auth errors
   */
  handleSignIn = (): void => {
    // Redirect to login page
    window.location.href = '/login';
  };

  /**
   * Handle go back action
   */
  handleGoBack = (): void => {
    window.history.back();
  };

  /**
   * Render fallback UI when error occurs
   */
  render(): ReactNode {
    const { hasError, formattedError } = this.state;
    const { children, fallback } = this.props;

    if (hasError && formattedError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Render appropriate error UI based on error type
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full">
            {/* Error Card */}
            <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
              {/* Error Icon */}
              <div className="flex justify-center mb-4">
                {formattedError.isAuthError ? (
                  // Lock icon for auth errors
                  <svg
                    className="w-16 h-16 text-yellow-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                ) : formattedError.isPermissionError ? (
                  // Shield icon for permission errors
                  <svg
                    className="w-16 h-16 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                ) : (
                  // Alert icon for other errors
                  <svg
                    className="w-16 h-16 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>

              {/* Error Title */}
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                {formattedError.title}
              </h1>

              {/* Error Message */}
              <p className="text-gray-600 text-center mb-6">
                {formattedError.message}
              </p>

              {/* Validation Errors */}
              {formattedError.validationErrors && formattedError.validationErrors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h2 className="text-sm font-semibold text-red-800 mb-2">
                    Validation Errors:
                  </h2>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {formattedError.validationErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Rate Limit Info */}
              {formattedError.isRateLimitError && formattedError.retryAfter && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 text-center">
                    Please wait {Math.ceil(formattedError.retryAfter / 60)} minute(s) before trying again.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {/* Primary Action */}
                {formattedError.isAuthError ? (
                  <button
                    onClick={this.handleSignIn}
                    className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    Sign In
                  </button>
                ) : formattedError.action === 'Refresh page' ? (
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    Refresh Page
                  </button>
                ) : formattedError.action === 'Try again' ? (
                  <button
                    onClick={this.resetError}
                    className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    Try Again
                  </button>
                ) : null}

                {/* Secondary Action - Go Back */}
                {formattedError.isPermissionError || formattedError.action === 'Go back' ? (
                  <button
                    onClick={this.handleGoBack}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Go Back
                  </button>
                ) : null}

                {/* Always show a home link as fallback */}
                <a
                  href="/"
                  className="w-full px-4 py-2 text-center text-gray-600 font-medium hover:text-gray-900 transition-colors"
                >
                  Return to Home
                </a>
              </div>
            </div>

            {/* Development Mode Error Details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-gray-100 rounded-lg">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs text-gray-600 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      {'\n\nComponent Stack:\n'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
