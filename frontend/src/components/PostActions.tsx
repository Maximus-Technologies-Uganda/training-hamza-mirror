/**
 * PostActions Component
 * 
 * T057: [US4] Show Edit/Delete buttons only if user.id === post.ownerId
 * Renders ownership-aware action buttons for post management.
 */

'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import type { Post } from '@/lib/types';

interface PostActionsProps {
  /** The post to render actions for */
  post: Post;
  /** Callback when delete is requested */
  onDelete?: () => Promise<void> | void;
  /** Whether delete is in progress */
  isDeleting?: boolean;
}

/**
 * PostActions renders Edit and Delete buttons based on ownership.
 * Only shows action buttons if the current user owns the post.
 */
export default function PostActions({ post, onDelete, isDeleting = false }: PostActionsProps) {
  const { user, isAuthenticated } = useAuth();

  // Check if current user is the owner of this post
  const isOwner = isAuthenticated && user?.id === post.ownerId;

  // Don't render anything if user doesn't own the post
  if (!isOwner) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {/* Edit Button */}
      <Link
        href={`/posts/${post.id}/edit`}
        className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={`Edit post: ${post.title}`}
      >
        <svg
          className="w-3.5 h-3.5 mr-1.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        Edit Post
      </Link>

      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="inline-flex items-center px-3 py-1.5 text-sm bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isDeleting ? 'Deleting post...' : `Delete post: ${post.title}`}
        >
          <svg
            className="w-3.5 h-3.5 mr-1.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          {isDeleting ? 'Deleting...' : 'Delete Post'}
        </button>
      )}
    </div>
  );
}
