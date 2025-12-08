'use client';

/**
 * Login Page
 * 
 * Displays the login form for user authentication.
 * Redirects to home page on successful login.
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoginForm from '@/components/LoginForm';
import { useAuth } from '@/components/AuthProvider';

/**
 * Login Page Component
 */
export default function LoginPage(): React.JSX.Element {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Check for stored redirect destination
      const redirectTo = typeof window !== 'undefined' 
        ? sessionStorage.getItem('auth_redirect') 
        : null;
      if (redirectTo) {
        sessionStorage.removeItem('auth_redirect');
        router.push(redirectTo);
      } else {
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  /**
   * Handle successful login
   * Redirects to stored destination or home page
   */
  const handleLoginSuccess = () => {
    // Check for stored redirect destination from protected routes
    const redirectTo = typeof window !== 'undefined' 
      ? sessionStorage.getItem('auth_redirect') 
      : null;
    if (redirectTo) {
      sessionStorage.removeItem('auth_redirect');
      router.push(redirectTo);
    } else {
      router.push('/');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  // If already authenticated, show redirecting message
  if (isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gray-500">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sign in to your account
          </h1>
          <p className="text-gray-600">
            Enter your credentials to access the blog
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
          <LoginForm onSuccess={handleLoginSuccess} />
          
          {/* Test users hint (development only) */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center mb-2">
                Test accounts for development:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="bg-gray-50 p-2 rounded">
                  <span className="font-medium">alice</span> / password123
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="font-medium">bob</span> / password456
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Back to home link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
