'use client';

/**
 * Logout Button Component
 * 
 * A button that logs out the current user when clicked.
 * Shows username and handles logout with optional redirect.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

/**
 * Props for LogoutButton component
 */
interface LogoutButtonProps {
  /** Redirect path after logout (defaults to home) */
  redirectTo?: string;
  
  /** Optional CSS class name */
  className?: string;
  
  /** Whether to show the username next to the button */
  showUsername?: boolean;
  
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'text';
}

/**
 * Logout Button Component
 */
export function LogoutButton({
  redirectTo = '/',
  className = '',
  showUsername = false,
  variant = 'secondary',
}: LogoutButtonProps): React.JSX.Element | null {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  /**
   * Handle logout
   */
  const handleLogout = () => {
    logout();
    router.push(redirectTo);
  };

  // Button styles based on variant
  const buttonStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300',
    text: 'text-gray-600 hover:text-gray-900 hover:underline',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showUsername && (
        <span className="text-sm text-gray-600">
          Signed in as <strong className="font-medium text-gray-900">{user.username}</strong>
        </span>
      )}
      <button
        type="button"
        onClick={handleLogout}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none ${buttonStyles[variant]}`}
      >
        Sign Out
      </button>
    </div>
  );
}

export default LogoutButton;
