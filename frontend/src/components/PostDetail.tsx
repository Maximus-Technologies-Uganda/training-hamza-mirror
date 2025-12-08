/**
 * PostDetail Component
 * Displays full post content with title, body, dates, and navigation
 */

'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';
import type { Post } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { isApiError } from '@/lib/api';
import { mapAuthError, isAuthenticationError, isAuthorizationError } from '@/lib/errors';
import DeleteConfirm from './DeleteConfirm';
import PostActions from './PostActions';

interface PostDetailProps {
  post: Post;
  onDelete?: () => Promise<void> | void;
}

export default function PostDetail({ post, onDelete }: PostDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>(undefined);
  const [deleteAuthErrorStatus, setDeleteAuthErrorStatus] = useState<number | undefined>(undefined);
  
  // Check if post was updated after creation (compare timestamps directly)
  const wasUpdated = post.updatedAt !== post.createdAt;

  // Handle delete confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (isDeleting || !onDelete) return;
    
    setIsDeleting(true);
    setDeleteError(undefined);
    setDeleteAuthErrorStatus(undefined);
    
    try {
      await onDelete();
      // If successful, the parent component will handle redirect
      // Close modal in case of optimistic update
      setShowDeleteConfirm(false);
    } catch (error) {
      // Keep modal open on error
      // Use mapAuthError for 401/403 errors to show friendly messages (US7)
      if (isApiError(error) && (isAuthenticationError(error.statusCode) || isAuthorizationError(error.statusCode))) {
        setDeleteError(mapAuthError(error.statusCode, 'delete'));
        setDeleteAuthErrorStatus(error.statusCode);
      } else {
        setDeleteError(
          error instanceof Error 
            ? error.message 
            : 'Failed to delete post. Please try again.'
        );
        setDeleteAuthErrorStatus(undefined);
      }
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, onDelete]);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    if (!isDeleting) {
      setShowDeleteConfirm(false);
      setDeleteError(undefined);
      setDeleteAuthErrorStatus(undefined);
    }
  }, [isDeleting]);

  return (
    <article className="max-w-4xl mx-auto">
      {/* Navigation */}
      <nav className="mb-6" aria-label="Post navigation">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs md:text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          aria-label="Back to home"
        >
          <svg
            className="w-3 h-3"
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
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">
          {post.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-500">
          <time 
            dateTime={post.createdAt} 
            aria-label={`Published on ${formatDate(post.createdAt)}`}
            className="flex items-center"
          >
            <svg
              className="w-3.5 h-3.5 mr-1"
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
                  className="w-3.5 h-3.5 mr-1"
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
            className="font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded"
            aria-label={`Post slug: ${post.slug}`}
          >
            {post.slug}
          </span>
        </div>
      </header>

      {/* Post Body */}
      <div 
        className="prose prose-sm prose-gray max-w-none mb-8"
        role="region"
        aria-label="Post content"
      >
        {post.body.split('\n').map((paragraph, index) => (
          paragraph.trim() ? (
            <p key={index} className="mb-3 text-gray-700 leading-relaxed">
              {paragraph}
            </p>
          ) : null
        ))}
      </div>

      {/* Action Buttons - Only shown if user owns the post */}
      <footer className="border-t pt-6 mt-6">
        <PostActions 
          post={post} 
          onDelete={() => setShowDeleteConfirm(true)}
          isDeleting={isDeleting}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirm
          postId={post.id}
          postTitle={post.title}
          isOpen={showDeleteConfirm}
          isLoading={isDeleting}
          error={deleteError}
          authErrorStatus={deleteAuthErrorStatus}
          onClose={handleCloseModal}
          onConfirm={handleConfirmDelete}
        />
      </footer>
    </article>
  );
}
