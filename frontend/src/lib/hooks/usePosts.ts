/**
 * Custom hook for fetching all blog posts
 * Uses SWR for caching, revalidation, and error handling
 * 
 * @module hooks/usePosts
 * @see {@link https://swr.vercel.app/docs/getting-started} SWR Documentation
 */

import useSWR, { SWRConfiguration } from 'swr';
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
 * Options for usePosts hook
 */
export interface UsePostsOptions {
  /** Initial data for SSR hydration (avoids loading flash) */
  fallbackData?: Post[];
}

/**
 * Fetches and caches all blog posts from the API
 * 
 * Uses SWR for:
 * - Automatic caching with 5-second deduplication
 * - Revalidation on network reconnection
 * - No revalidation on window focus (to reduce API calls)
 * - SSR hydration with fallbackData
 * 
 * @param options - Optional configuration including fallbackData for SSR
 * @returns {UsePostsReturn} Object containing posts data, loading state, error, and mutate function
 * 
 * @example
 * ```tsx
 * // Client-only usage
 * function PostList() {
 *   const { posts, isLoading, isError, mutate } = usePosts();
 *   // ...
 * }
 * 
 * // SSR hydration usage
 * function PostList({ initialPosts }) {
 *   const { posts } = usePosts({ fallbackData: initialPosts });
 *   // No loading flash - uses server-fetched data immediately
 * }
 * ```
 */
export function usePosts(options?: UsePostsOptions): UsePostsReturn {
  const swrConfig: SWRConfiguration<Post[]> = {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
  };

  // Add fallbackData for SSR hydration if provided
  if (options?.fallbackData) {
    swrConfig.fallbackData = options.fallbackData;
  }

  const { data, error, isLoading, mutate } = useSWR<Post[]>(
    '/posts',
    getPosts,
    swrConfig
  );

  return {
    posts: data,
    isLoading,
    isError: error,
    mutate,
  };
}
