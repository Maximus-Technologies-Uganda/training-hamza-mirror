/**
 * PostForm Component
 * Reusable form for creating and editing blog posts
 * Uses react-hook-form for validation and state management
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import type { Post, CreatePostInput, UpdatePostInput } from '@/lib/types';
import { createPost, updatePost, isApiError, type FieldValidationError } from '@/lib/api';
import { titleValidation, bodyValidation } from '@/lib/validation';

interface PostFormProps {
  /** Existing post data for edit mode */
  post?: Post;
  /** Whether the form is in edit mode */
  isEditMode?: boolean;
}

interface FormData {
  title: string;
  body: string;
}

export default function PostForm({ post, isEditMode = false }: PostFormProps) {
  const router = useRouter();
  const { mutate: globalMutate } = useSWRConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiFieldErrors, setApiFieldErrors] = useState<FieldValidationError[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    defaultValues: {
      title: post?.title || '',
      body: post?.body || '',
    },
    mode: 'onBlur',
  });

  const watchedTitle = watch('title', post?.title || '');
  
  // Show unsaved changes indicator in edit mode when form is dirty
  const hasUnsavedChanges = isEditMode && isDirty;

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setApiError(null);
    setApiFieldErrors([]);
    setStatusMessage(isEditMode ? 'Updating post...' : 'Creating post...');

    try {
      let result: Post;

      if (isEditMode && post) {
        // Update existing post
        const updateData: UpdatePostInput = {
          title: data.title,
          body: data.body,
        };
        result = await updatePost(post.id, updateData);
        
        // Mutate SWR caches to ensure changes are immediately reflected
        // Update the individual post cache with the new data
        await globalMutate(`/posts/${post.id}`, result, false);
        // Revalidate the posts list to update the list view
        await globalMutate('/posts');
        setStatusMessage('Post updated successfully! Redirecting...');
      } else {
        // Create new post
        const createData: CreatePostInput = {
          title: data.title,
          body: data.body,
        };
        result = await createPost(createData);
        setStatusMessage('Post created successfully! Redirecting...');
      }

      // Redirect to the post detail page on success
      router.push(`/posts/${result.id}`);
    } catch (error) {
      if (isApiError(error)) {
        // Capture field-level validation errors if available
        if (error.hasFieldErrors() && error.validation) {
          setApiFieldErrors(error.validation);
        }
        setApiError(error.message);
      } else if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
      setStatusMessage('Error occurred. Please review and try again.');
      setIsSubmitting(false);
      // Return focus to submit button on error
      requestAnimationFrame(() => {
        submitButtonRef.current?.focus();
      });
    }
  };

  /**
   * Get API field error for a specific field
   */
  const getApiFieldError = (fieldName: string): string | undefined => {
    return apiFieldErrors.find(e => e.field === fieldName)?.message;
  };

  const handleCancel = () => {
    if (isEditMode && post) {
      // In edit mode, always return to the post detail page for predictability
      router.push(`/posts/${post.id}`);
    } else {
      // In create mode, navigate to homepage
      // (Phase 5 requirement: "navigates back to home without saving")
      router.push('/');
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl mx-auto space-y-6"
      noValidate
    >
      {/* Screen reader status announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>

      {/* Unsaved Changes Indicator */}
      {hasUnsavedChanges && (
        <div
          role="status"
          aria-live="polite"
          className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-center"
        >
          <svg
            className="w-5 h-5 mr-3 flex-shrink-0"
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
          <span className="text-sm font-medium">
            You have unsaved changes
          </span>
        </div>
      )}

      {/* API Error Display */}
      {apiError && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start"
        >
          <svg
            className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{apiError}</p>
          </div>
        </div>
      )}

      {/* Title Field */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Title <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <input
          id="title"
          type="text"
          {...register('title', titleValidation)}
          className={`
            w-full px-4 py-2 border rounded-lg transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${(errors.title || getApiFieldError('title'))
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          placeholder="Enter your post title"
          aria-required="true"
          aria-invalid={(errors.title || getApiFieldError('title')) ? 'true' : 'false'}
          aria-describedby={(errors.title || getApiFieldError('title')) ? 'title-error' : 'title-hint'}
          disabled={isSubmitting}
          required
        />
        <div className="mt-1 flex justify-between items-start">
          <div>
            {(errors.title || getApiFieldError('title')) && (
              <p
                id="title-error"
                role="alert"
                className="text-sm text-red-600"
              >
                {errors.title?.message || getApiFieldError('title')}
              </p>
            )}
          </div>
          <p
            id="title-hint"
            className={`text-sm ${
              watchedTitle.length > 200 ? 'text-red-600' : 'text-gray-500'
            }`}
            aria-live="polite"
          >
            {watchedTitle.length}/200
          </p>
        </div>
      </div>

      {/* Body Field */}
      <div>
        <label
          htmlFor="body"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Body <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <textarea
          id="body"
          {...register('body', bodyValidation)}
          rows={12}
          className={`
            w-full px-4 py-2 border rounded-lg transition-colors resize-y
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${(errors.body || getApiFieldError('body'))
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          placeholder="Write your post content here..."
          aria-required="true"
          aria-invalid={(errors.body || getApiFieldError('body')) ? 'true' : 'false'}
          aria-describedby={(errors.body || getApiFieldError('body')) ? 'body-error' : 'body-hint'}
          disabled={isSubmitting}
          required
        />
        {(errors.body || getApiFieldError('body')) && (
          <p
            id="body-error"
            role="alert"
            className="mt-1 text-sm text-red-600"
          >
            {errors.body?.message || getApiFieldError('body')}
          </p>
        )}
        <p id="body-hint" className="mt-1 text-sm text-gray-500">
          Maximum 50,000 characters. Markdown is supported.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          ref={submitButtonRef}
          type="submit"
          disabled={isSubmitting}
          className={`
            flex-1 sm:flex-none inline-flex items-center justify-center 
            px-6 py-3 rounded-lg font-medium text-white
            transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
            ${isSubmitting
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {isEditMode ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {isEditMode ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                )}
              </svg>
              {isEditMode ? 'Update Post' : 'Create Post'}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className={`
            flex-1 sm:flex-none inline-flex items-center justify-center
            px-6 py-3 rounded-lg font-medium border
            transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
            ${isSubmitting
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }
          `}
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Cancel
        </button>
      </div>
    </form>
  );
}
