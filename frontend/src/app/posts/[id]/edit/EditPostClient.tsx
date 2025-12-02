/**
 * Edit Post Client Component
 * Fetches existing post and renders PostForm in edit mode
 */

'use client';

import { notFound } from 'next/navigation';
import { usePost } from '@/lib/hooks/usePost';
import PostForm from '@/components/PostForm';
import ErrorMessage from '@/components/ErrorMessage';
import { isApiError } from '@/lib/api';

interface EditPostClientProps {
  id: string;
}

export default function EditPostClient({ id }: EditPostClientProps) {
  const postId = parseInt(id, 10);
  
  const { post, isLoading, isError } = usePost(postId);

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
    if (isApiError(isError) && isError.statusCode === 404) {
      notFound();
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
    notFound();
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
