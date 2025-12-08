'use client';

/**
 * Header Navigation Component
 * 
 * Displays navigation with auth-aware login/logout buttons.
 * Shows different navigation items based on authentication state.
 */

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import LogoutButton from '@/components/LogoutButton';
import HealthIndicator from '@/components/HealthIndicator';

/**
 * Props for HeaderNav component
 */
interface HeaderNavProps {
  /** Optional CSS class name */
  className?: string;
}

/**
 * Header Navigation Component
 */
export function HeaderNav({ className = '' }: HeaderNavProps): React.JSX.Element {
  const { isAuthenticated, isLoading, user } = useAuth();

  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
      <div className="container mx-auto px-4 py-3 max-w-4xl flex justify-between items-center">
        {/* Logo / Brand */}
        <Link href="/" className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors">
          Blog
        </Link>

        {/* Navigation items */}
        <div className="flex items-center gap-4">
          {/* Health indicator */}
          <HealthIndicator />

          {/* Auth-aware navigation */}
          {!isLoading && (
            <>
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  {/* Create post link (only for authenticated users) */}
                  <Link
                    href="/posts/new"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    New Post
                  </Link>
                  
                  {/* User info and logout */}
                  <LogoutButton showUsername variant="secondary" />
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none transition-colors"
                >
                  Sign In
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default HeaderNav;
