/**
 * PostCard Component
 * Displays a single blog post preview with link to full post
 */

import Link from 'next/link';
import type { Post } from '@/lib/types';
import { formatDate, extractExcerpt } from '@/lib/utils';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const excerpt = extractExcerpt(post.body, 150);

  return (
    <article className="card hover:shadow-lg transition-shadow">
      <Link 
        href={`/posts/${post.id}`}
        className="block no-underline"
        aria-label={`Read full post: ${post.title}`}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
          {post.title}
        </h2>
      </Link>
      
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <time dateTime={post.createdAt} aria-label={`Published on ${formatDate(post.createdAt)}`}>
          {formatDate(post.createdAt)}
        </time>
        <span aria-hidden="true">•</span>
        <span className="text-gray-400 font-mono text-xs" aria-label={`Post slug: ${post.slug}`}>
          {post.slug}
        </span>
      </div>

      <p className="text-gray-700 mb-4 line-clamp-3">
        {excerpt}
      </p>

      <Link
        href={`/posts/${post.id}`}
        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
      >
        Read more →
      </Link>
    </article>
  );
}
