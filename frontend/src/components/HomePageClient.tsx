/**
 * HomePageClient - Client Component for Homepage Interactivity
 * 
 * Receives server-fetched posts as initialData for SWR hydration.
 * Handles loading, error states, and mutations (create/delete).
 */

'use client';

import { usePosts } from '@/lib/hooks/usePosts';
import PostList from '@/components/PostList';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ErrorMessage from '@/components/ErrorMessage';
import type { Post } from '@/lib/types';

interface HomePageClientProps {
  initialPosts: Post[];
}

export default function HomePageClient({ initialPosts }: HomePageClientProps) {
  // Use SWR with initialData for hydration
  // This avoids a flash of loading state on client-side navigation
  const { posts, isLoading, isError, mutate } = usePosts({
    fallbackData: initialPosts,
  });

  // During initial hydration, show server-rendered posts
  // SWR will revalidate in the background
  if (isLoading && !posts?.length) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return (
      <ErrorMessage
        message={isError.message || 'Failed to load blog posts. Please try again.'}
        onRetry={() => mutate()}
      />
    );
  }

  // Use posts from SWR (may be updated) or fall back to initial
  const displayPosts = posts ?? initialPosts;

  return <PostList posts={displayPosts} />;
}
