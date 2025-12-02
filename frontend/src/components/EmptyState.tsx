/**
 * EmptyState Component
 * Displays friendly message when no posts exist
 */

import Link from 'next/link';

export default function EmptyState() {
  return (
    <div className="card text-center py-12" role="status">
      <div className="text-gray-400 mb-4 flex justify-center" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">No Posts Yet</h2>
      <p className="text-gray-600 mb-6">
        Be the first to create a blog post and share your thoughts!
      </p>
      <Link href="/posts/new" className="btn btn-primary">
        Create Your First Post
      </Link>
    </div>
  );
}
