/**
 * Post Detail Client Component
 * Handles data fetching and display of a single blog post
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSWRConfig } from 'swr';
import { usePost } from '@/lib/hooks/usePost';
import { deletePost, isApiError } from '@/lib/api';
import PostDetail from '@/components/PostDetail';
import ErrorMessage from '@/components/ErrorMessage';
import type { Post } from '@/lib/types';

/**
 * Validates that a string is a strictly numeric positive integer
 * Rejects strings like "1abc", "1.5", "-1", etc.
 */
function isStrictlyNumericId(value: string): boolean {
  return /^[1-9]\d*$/.test(value);
}

interface PostDetailClientProps {
  id: string;
}

export default function PostDetailClient({ id }: PostDetailClientProps) {
  const router = useRouter();
  const { mutate: globalMutate } = useSWRConfig();
  
  // Strict validation: ID must be purely numeric (e.g., reject "1abc")
  const isValidId = isStrictlyNumericId(id);
  const postId = isValidId ? parseInt(id, 10) : null;
  const { post, isLoading, isError, mutate } = usePost(postId);

  // Handle invalid ID - redirect to 404
  useEffect(() => {
    if (!isValidId) {
      router.replace('/404');
    }
  }, [isValidId, router]);

  // Handle 404 errors from API - redirect to 404
  useEffect(() => {
    if (isError && isApiError(isError) && isError.statusCode === 404) {
      router.replace('/404');
    }
  }, [isError, router]);

  // Show loading while redirecting for invalid ID
  if (!isValidId) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto" role="status" aria-label="Loading post">
        <div className="animate-pulse space-y-6">
          {/* Back link skeleton */}
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          
          {/* Title skeleton */}
          <div className="h-12 bg-gray-200 rounded w-3/4"></div>
          
          {/* Meta skeleton */}
          <div className="flex gap-4">
            <div className="h-4 bg-gray-200 rounded w-40"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          
          {/* Body skeleton */}
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
          
          {/* Action buttons skeleton */}
          <div className="border-t pt-8 mt-8 flex gap-4">
            <div className="h-10 bg-gray-200 rounded w-28"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        <span className="sr-only">Loading post content...</span>
      </div>
    );
  }

  // Error state (non-404)
  if (isError) {
    return (
      <div className="max-w-4xl mx-auto">
        <ErrorMessage
          message={isError.message || 'Failed to load post. Please try again.'}
          onRetry={() => mutate()}
        />
      </div>
    );
  }

  // No post found (shouldn't happen due to 404 handling, but safety check)
  if (!post) {
    return null;
  }

  // Handle delete with SWR cache mutation
  const handleDelete = async () => {
    // Delete the post via API
    await deletePost(post.id);
    
    // Optimistically update the posts list cache by removing the deleted post
    globalMutate(
      '/posts',
      (currentPosts: Post[] | undefined) => {
        if (!currentPosts) return currentPosts;
        return currentPosts.filter(p => p.id !== post.id);
      },
      { revalidate: false }
    );
    
    // Clear the individual post cache (no revalidation needed, we're navigating away)
    mutate();
    
    // Redirect to homepage
    router.push('/');
  };

  return <PostDetail post={post} onDelete={handleDelete} />;
}
