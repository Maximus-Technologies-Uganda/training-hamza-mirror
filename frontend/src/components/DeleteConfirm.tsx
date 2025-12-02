/**
 * DeleteConfirm Component
 * Modal dialog for confirming post deletion with accessibility support
 * 
 * Features:
 * - WCAG 2.1 AA compliant
 * - Focus trap within modal
 * - Keyboard navigation (Escape to close, Enter/Space to activate)
 * - Loading and error states
 * - Screen reader announcements
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';

interface DeleteConfirmProps {
  /** ID of the post to delete */
  postId: number;
  /** Title of the post (shown in confirmation message) */
  postTitle: string;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Whether deletion is in progress */
  isLoading?: boolean;
  /** Error message to display */
  error?: string;
  /** Called when the modal should close (Cancel, Escape, backdrop click) */
  onClose: () => void;
  /** Called when the user confirms deletion */
  onConfirm: () => void;
}

export default function DeleteConfirm({
  postId,
  postTitle,
  isOpen,
  isLoading = false,
  error,
  onClose,
  onConfirm,
}: DeleteConfirmProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // IDs for ARIA attributes
  const titleId = `delete-dialog-title-${postId}`;
  const descriptionId = `delete-dialog-description-${postId}`;

  // Handle Escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        onClose();
      }
    },
    [isLoading, onClose]
  );

  // Focus trap implementation
  const handleTabKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Handle Shift+Tab on first element
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
      // Handle Tab on last element
      else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    },
    []
  );

  // Set up event listeners and focus management
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Add event listeners
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keydown', handleTabKey);

      // Focus the cancel button (first focusable element)
      // Use requestAnimationFrame to ensure the modal is rendered
      requestAnimationFrame(() => {
        cancelButtonRef.current?.focus();
      });

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keydown', handleTabKey);
        document.body.style.overflow = '';

        // Restore focus to previously focused element
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen, handleKeyDown, handleTabKey]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !isLoading) {
      onClose();
    }
  };

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-hidden="false"
    >
      {/* Backdrop overlay - not focusable, clicks close modal */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        aria-hidden="true"
        data-testid="modal-backdrop"
        onClick={handleBackdropClick}
        onMouseDown={(e) => e.preventDefault()}
      />

      {/* Modal dialog */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 transform transition-all"
      >
        {/* Screen reader status announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {isLoading ? 'Deleting post, please wait...' : ''}
        </div>

        {/* Warning icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
          <svg
            className="w-6 h-6 text-red-600"
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
        </div>

        {/* Title */}
        <h2
          id={titleId}
          className="text-xl font-bold text-gray-900 text-center mb-2"
        >
          Delete Post?
        </h2>

        {/* Description */}
        <p
          id={descriptionId}
          className="text-gray-600 text-center mb-6"
        >
          Are you sure you want to delete "<span className="font-medium">{postTitle}</span>"? 
          This action cannot be undone.
        </p>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-sm text-red-600 text-center">
              {error}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-disabled={isLoading}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span
                  role="status"
                  aria-label="Deleting post"
                  className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"
                />
                Deleting...
              </>
            ) : error ? (
              'Try Again'
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
