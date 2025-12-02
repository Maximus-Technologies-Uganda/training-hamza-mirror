/**
 * Custom hook for fetching all blog posts
 * Uses SWR for caching, revalidation, and error handling
 * 
 * @module hooks/usePosts
 * @see {@link https://swr.vercel.app/docs/getting-started} SWR Documentation
 */

import useSWR from 'swr';
import { getPosts } from '../api';
import type { Post } from '../types';

/**
 * Return type for usePosts hook
 */
export interface UsePostsReturn {
  /** Array of blog posts, undefined while loading */
  posts: Post[] | undefined;
  /** True while fetching data */
  isLoading: boolean;
  /** Error object if fetch failed, undefined otherwise */
  isError: Error | undefined;
  /** Function to manually revalidate the posts cache */
  mutate: () => void;
}

/**
 * Fetches and caches all blog posts from the API
 * 
 * Uses SWR for:
 * - Automatic caching with 5-second deduplication
 * - Revalidation on network reconnection
 * - No revalidation on window focus (to reduce API calls)
 * 
 * @returns {UsePostsReturn} Object containing posts data, loading state, error, and mutate function
 * 
 * @example
 * ```tsx
 * function PostList() {
 *   const { posts, isLoading, isError, mutate } = usePosts();
 * 
 *   if (isLoading) return <div>Loading...</div>;
 *   if (isError) return <div>Error loading posts</div>;
 * 
 *   return (
 *     <ul>
 *       {posts?.map(post => <li key={post.id}>{post.title}</li>)}
 *     </ul>
 *   );
 * }
 * ```
 */
export function usePosts(): UsePostsReturn {
  const { data, error, isLoading, mutate } = useSWR<Post[]>(
    '/posts',
    getPosts,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    posts: data,
    isLoading,
    isError: error,
    mutate,
  };
}
