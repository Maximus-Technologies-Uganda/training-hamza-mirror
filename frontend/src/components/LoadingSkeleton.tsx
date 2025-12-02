/**
 * LoadingSkeleton Component
 * Displays animated skeleton UI during data loading
 * 
 * @module components/LoadingSkeleton
 * 
 * @description
 * Renders a set of placeholder skeleton elements that animate
 * to indicate content is loading. Uses Tailwind CSS animation
 * classes for the pulse effect.
 * 
 * @example
 * ```tsx
 * // Use while waiting for blog posts to load
 * if (isLoading) {
 *   return <LoadingSkeleton />;
 * }
 * ```
 * 
 * @returns {JSX.Element} Skeleton UI with ARIA status for accessibility
 */
export default function LoadingSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading posts">
      <div className="skeleton h-10 w-64" aria-hidden="true"></div>
      <div className="skeleton h-32 w-full" aria-hidden="true"></div>
      <div className="skeleton h-32 w-full" aria-hidden="true"></div>
      <div className="skeleton h-32 w-full" aria-hidden="true"></div>
      <span className="sr-only">Loading blog posts...</span>
    </div>
  );
}
