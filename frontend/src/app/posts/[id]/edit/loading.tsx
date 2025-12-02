/**
 * Loading state for Edit Post page
 * Displayed while fetching post data for editing
 */

export default function EditPostLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-9 bg-gray-200 rounded w-40 mb-2"></div>
          <div className="h-5 bg-gray-200 rounded w-72"></div>
        </div>

        {/* Form skeleton */}
        <div className="space-y-6 animate-pulse">
          {/* Title field skeleton */}
          <div>
            <div className="h-5 bg-gray-200 rounded w-12 mb-2"></div>
            <div className="h-11 bg-gray-200 rounded-lg w-full"></div>
            <div className="flex justify-between mt-1">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
          </div>

          {/* Body field skeleton */}
          <div>
            <div className="h-5 bg-gray-200 rounded w-10 mb-2"></div>
            <div className="h-64 bg-gray-200 rounded-lg w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mt-1"></div>
          </div>

          {/* Button skeleton */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <div className="h-12 bg-gray-200 rounded-lg w-32"></div>
            <div className="h-12 bg-gray-200 rounded-lg w-24"></div>
          </div>
        </div>

        {/* Screen reader text */}
        <p className="sr-only" aria-live="polite">
          Loading post for editing, please wait...
        </p>
      </div>
    </div>
  );
}
