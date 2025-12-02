'use client';

/**
 * Homepage - View All Blog Posts
 * Displays list of all published blog posts
 */

import { usePosts } from '@/lib/hooks/usePosts';
import PostList from '@/components/PostList';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ErrorMessage from '@/components/ErrorMessage';
import Link from 'next/link';

export default function HomePage() {
  const { posts, isLoading, isError, mutate } = usePosts();

  return (
    <div>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Blog Posts</h1>
          <p className="text-gray-600">
            Discover and read our latest blog posts
          </p>
        </div>
        <Link
          href="/posts/new"
          className="btn btn-primary"
          aria-label="Create new blog post"
        >
          + New Post
        </Link>
      </header>

      {isLoading && <LoadingSkeleton />}
      
      {isError && (
        <ErrorMessage
          message={isError.message || 'Failed to load blog posts. Please try again.'}
          onRetry={() => mutate()}
        />
      )}

      {!isLoading && !isError && posts && <PostList posts={posts} />}
    </div>
  );
}
