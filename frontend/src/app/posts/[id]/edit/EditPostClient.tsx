/**
 * Edit Post Client Component
 * Fetches existing post and renders PostForm in edit mode
 * 
 * Feature: 004-blog-auth - Added auth/ownership gating
 * Only allows access if user is authenticated AND is the post owner
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePost } from '@/lib/hooks/usePost';
import PostForm from '@/components/PostForm';
import ErrorMessage from '@/components/ErrorMessage';
import { useAuth } from '@/components/AuthProvider';
import { isApiError } from '@/lib/api';

interface EditPostClientProps {
  id: string;
}

export default function EditPostClient({ id }: EditPostClientProps) {
  const postId = parseInt(id, 10);
  const router = useRouter();
  
  const { post, isLoading: postLoading, isError } = usePost(postId);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Combined loading state
  const isLoading = postLoading || authLoading;

  const isNotFoundError = isError && isApiError(isError) && isError.statusCode === 404;

  useEffect(() => {
    if (!isLoading && (isNotFoundError || (!post && !postLoading))) {
      router.replace('/404');
    }
  }, [isLoading, isNotFoundError, post, postLoading, router]);

  // Check if current user is the owner of this post
  const isOwner = isAuthenticated && user?.id === post?.ownerId;

  // Redirect to login if not authenticated (after loading completes)
  useEffect(() => {
    if (!isLoading && !authLoading && !isAuthenticated && post) {
      // Store the intended destination for post-login redirect
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_redirect', `/posts/${id}/edit`);
      }
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, isLoading, post, id, router]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            {/* Header skeleton */}
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            
            {/* Title field skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            
            {/* Body field skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-12"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
            
            {/* Button skeleton */}
            <div className="flex gap-4">
              <div className="h-12 bg-gray-200 rounded w-32"></div>
              <div className="h-12 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle 404 error
  if (isError) {
    if (isNotFoundError) {
      return null;
    }
    
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <ErrorMessage
            message={
              isError instanceof Error
                ? isError.message
                : 'Failed to load post for editing. Please try again later.'
            }
          />
        </div>
      </div>
    );
  }

  // Handle case where post is not found
  if (!post) {
    return null;
  }

  // Handle unauthenticated state (redirect in progress)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center py-8">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Handle unauthorized state (not the owner)
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <svg
              className="w-12 h-12 text-yellow-500 mx-auto mb-4"
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
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">
              Permission Denied
            </h2>
            <p className="text-yellow-700 mb-4">
              You can only edit posts that you created.
            </p>
            <Link
              href={`/posts/${post.id}`}
              className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            >
              View Post Instead
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Post</h1>
          <p className="mt-2 text-gray-600">
            Update your blog post. Changes will be saved immediately.
          </p>
        </header>

        {/* Edit Form */}
        <PostForm post={post} isEditMode />
      </div>
    </div>
  );
}
