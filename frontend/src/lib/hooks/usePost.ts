/**
 * Custom hook for fetching a single blog post
 * Uses SWR for caching, revalidation, and error handling
 * 
 * @module hooks/usePost
 * @see {@link https://swr.vercel.app/docs/conditional-fetching} Conditional Fetching
 */

import useSWR from 'swr';
import { getPost } from '../api';
import type { Post } from '../types';

/**
 * Return type for usePost hook
 */
export interface UsePostReturn {
  /** Post data, undefined while loading or if id is null */
  post: Post | undefined;
  /** True while fetching data */
  isLoading: boolean;
  /** Error object if fetch failed (e.g., 404), undefined otherwise */
  isError: Error | undefined;
  /** Function to manually revalidate the post cache */
  mutate: (data?: Post | undefined, opts?: { revalidate?: boolean }) => Promise<Post | undefined>;
  /** The SWR cache key for this post */
  cacheKey: string | null;
}

/**
 * Fetches and caches a single blog post by ID
 * 
 * Supports conditional fetching - pass null to skip the request.
 * Uses SWR for:
 * - Automatic caching with 5-second deduplication
 * - Revalidation on network reconnection
 * - No revalidation on window focus (to reduce API calls)
 * 
 * @param {number | null} id - Post ID to fetch, or null to skip fetching
 * @returns {UsePostReturn} Object containing post data, loading state, error, and mutate function
 * 
 * @example
 * ```tsx
 * function PostDetail({ postId }: { postId: number }) {
 *   const { post, isLoading, isError, mutate } = usePost(postId);
 * 
 *   if (isLoading) return <div>Loading...</div>;
 *   if (isError) return <div>Post not found</div>;
 * 
 *   return (
 *     <article>
 *       <h1>{post?.title}</h1>
 *       <p>{post?.body}</p>
 *     </article>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Conditional fetching - skip when id is not known
 * const [selectedId, setSelectedId] = useState<number | null>(null);
 * const { post } = usePost(selectedId); // No request until selectedId is set
 * ```
 */
export function usePost(id: number | null): UsePostReturn {
  const cacheKey = id ? `/posts/${id}` : null;
  const { data, error, isLoading, mutate } = useSWR<Post>(
    cacheKey,
    id ? () => getPost(id) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    post: data,
    isLoading,
    isError: error,
    mutate,
    cacheKey,
  };
}
