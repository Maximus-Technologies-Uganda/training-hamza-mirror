/**
 * Homepage - View All Blog Posts (Server Component with SSR)
 * 
 * This is a Server Component that fetches posts on the server
 * for first-paint SSR. The data is passed to client components
 * for interactivity.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import PostList from '@/components/PostList';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import HomePageClient from '@/components/HomePageClient';
import type { Post } from '@/lib/types';

// Server-side API URL (not exposed to browser)
const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Fetch posts on the server for SSR first-paint
 */
async function getPosts(): Promise<Post[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      headers: {
        'Accept': 'application/json',
      },
      // Revalidate every 60 seconds (ISR)
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`[SSR] Failed to fetch posts: ${response.status}`);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('[SSR] Error fetching posts:', error);
    return [];
  }
}

/**
 * Server-rendered posts list component
 */
async function PostsSection() {
  const posts = await getPosts();
  
  // Pass server-fetched data to client component for interactivity (SWR hydration)
  return <HomePageClient initialPosts={posts} />;
}

export default function HomePage() {
  return (
    <div>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Blog Posts</h1>
          <p className="text-gray-600 text-sm">
            Discover and read our latest blog posts
          </p>
        </div>
        <Link
          href="/posts/new"
          className="btn btn-primary"
          aria-label="Create new blog post"
        >
          + New Post
        </Link>
      </header>

      {/* SSR with Suspense fallback */}
      <Suspense fallback={<LoadingSkeleton />}>
        <PostsSection />
      </Suspense>
    </div>
  );
}
