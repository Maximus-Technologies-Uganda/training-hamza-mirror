/**
 * PostDetail Component
 * Displays full post content with title, body, dates, and navigation
 */

'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';
import type { Post } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import DeleteConfirm from './DeleteConfirm';

interface PostDetailProps {
  post: Post;
  onDelete?: () => Promise<void> | void;
}

export default function PostDetail({ post, onDelete }: PostDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>(undefined);
  
  // Check if post was updated after creation (compare timestamps directly)
  const wasUpdated = post.updatedAt !== post.createdAt;

  // Handle delete confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (isDeleting || !onDelete) return;
    
    setIsDeleting(true);
    setDeleteError(undefined);
    
    try {
      await onDelete();
      // If successful, the parent component will handle redirect
      // Close modal in case of optimistic update
      setShowDeleteConfirm(false);
    } catch (error) {
      // Keep modal open on error
      setDeleteError(
        error instanceof Error 
          ? error.message 
          : 'Failed to delete post. Please try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, onDelete]);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    if (!isDeleting) {
      setShowDeleteConfirm(false);
      setDeleteError(undefined);
    }
  }, [isDeleting]);

  return (
    <article className="max-w-4xl mx-auto">
      {/* Navigation */}
      <nav className="mb-8" aria-label="Post navigation">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          aria-label="Back to home"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Home
        </Link>
      </nav>

      {/* Post Header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          {post.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <time 
            dateTime={post.createdAt} 
            aria-label={`Published on ${formatDate(post.createdAt)}`}
            className="flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Published {formatDate(post.createdAt)}</span>
          </time>
          
          {wasUpdated && (
            <>
              <span aria-hidden="true">•</span>
              <time 
                dateTime={post.updatedAt}
                aria-label={`Last updated on ${formatDate(post.updatedAt)}`}
                className="flex items-center text-gray-400"
              >
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Updated {formatDate(post.updatedAt)}</span>
              </time>
            </>
          )}
          
          <span aria-hidden="true">•</span>
          <span 
            className="font-mono text-xs bg-gray-100 px-2 py-1 rounded"
            aria-label={`Post slug: ${post.slug}`}
          >
            {post.slug}
          </span>
        </div>
      </header>

      {/* Post Body */}
      <div 
        className="prose prose-lg prose-gray max-w-none mb-12"
        role="region"
        aria-label="Post content"
      >
        {post.body.split('\n').map((paragraph, index) => (
          paragraph.trim() ? (
            <p key={index} className="mb-4 text-gray-700 leading-relaxed">
              {paragraph}
            </p>
          ) : null
        ))}
      </div>

      {/* Action Buttons */}
      <footer className="border-t pt-8 mt-8">
        <div className="flex flex-wrap gap-4">
          <Link
            href={`/posts/${post.id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={`Edit post: ${post.title}`}
          >
            <svg
              className="w-4 h-4 mr-2"
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
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label={`Delete post: ${post.title}`}
          >
            <svg
              className="w-4 h-4 mr-2"
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
            Delete Post
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        <DeleteConfirm
          postId={post.id}
          postTitle={post.title}
          isOpen={showDeleteConfirm}
          isLoading={isDeleting}
          error={deleteError}
          onClose={handleCloseModal}
          onConfirm={handleConfirmDelete}
        />
      </footer>
    </article>
  );
}
