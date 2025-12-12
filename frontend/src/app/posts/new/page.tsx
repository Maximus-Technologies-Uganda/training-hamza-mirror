'use client';

/**
 * Create New Post Page
 * Renders PostForm in create mode for adding new blog posts
 * Requires authentication - redirects to login if not authenticated
 * 
 * Feature: 004-blog-auth - Added auth requirement with redirect
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PostForm from '@/components/PostForm';
import { useAuth } from '@/components/AuthProvider';

export default function CreatePostPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store the intended destination for post-login redirect
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_redirect', '/posts/new');
      }
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </main>
    );
  }

  // Don't render form if not authenticated (redirect in progress)
  if (!isAuthenticated) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-8">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Create New Post
        </h1>
        <p className="text-gray-600 text-sm">
          Share your thoughts with the world. Fill in the title and content below.
        </p>
      </header>

      {/* Post Form */}
      <PostForm />
    </main>
  );
}
