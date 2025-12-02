/**
 * Post Detail Page (Server Component)
 * Wraps client component and provides generateStaticParams for static export
 */

import PostDetailClient from './PostDetailClient';

interface PostDetailPageProps {
  params: {
    id: string;
  };
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  return <PostDetailClient id={params.id} />;
}

/**
 * Generate static params for static export
 * Returns placeholder IDs - actual content is loaded client-side
 * Additional IDs are handled by 404.html SPA fallback
 */
export function generateStaticParams() {
  // Pre-generate a range of common IDs
  // Additional IDs beyond this will use the SPA fallback via 404.html
  return Array.from({ length: 100 }, (_, i) => ({
    id: String(i + 1),
  }));
}
