/**
 * PostList Component
 * Displays a list of blog posts or empty state
 */

import type { Post } from '@/lib/types';
import PostCard from './PostCard';
import EmptyState from './EmptyState';

interface PostListProps {
  posts: Post[];
}

export default function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return <EmptyState />;
  }

  return (
    <section aria-label="Blog posts">
      {/* Screen reader announcement for post count */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {posts.length} {posts.length === 1 ? 'post' : 'posts'} available
      </div>
      <ul className="space-y-6 list-none p-0" role="list">
        {posts.map((post) => (
          <li key={post.id}>
            <PostCard post={post} />
          </li>
        ))}
      </ul>
    </section>
  );
}
