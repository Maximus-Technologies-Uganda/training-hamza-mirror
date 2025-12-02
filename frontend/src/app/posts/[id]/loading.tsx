/**
 * Loading state for Post Detail Page
 * Displays skeleton UI while post data is being fetched
 */

export default function PostDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto" role="status" aria-label="Loading post">
      <div className="animate-pulse space-y-6">
        {/* Back link skeleton */}
        <div className="h-6 bg-gray-200 rounded w-32" aria-hidden="true"></div>
        
        {/* Title skeleton */}
        <div className="h-12 bg-gray-200 rounded w-3/4" aria-hidden="true"></div>
        
        {/* Meta skeleton */}
        <div className="flex gap-4">
          <div className="h-4 bg-gray-200 rounded w-40" aria-hidden="true"></div>
          <div className="h-4 bg-gray-200 rounded w-32" aria-hidden="true"></div>
        </div>
        
        {/* Body skeleton */}
        <div className="space-y-4" aria-hidden="true">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
        
        {/* Action buttons skeleton */}
        <div className="border-t pt-8 mt-8 flex gap-4" aria-hidden="true">
          <div className="h-10 bg-gray-200 rounded w-28"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
      <span className="sr-only">Loading post content...</span>
    </div>
  );
}
