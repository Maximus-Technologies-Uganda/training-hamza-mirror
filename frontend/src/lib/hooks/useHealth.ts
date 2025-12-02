/**
 * Custom hook for API health check
 * Uses SWR with polling for periodic health status updates
 * 
 * @module hooks/useHealth
 * @see {@link https://swr.vercel.app/docs/revalidation#revalidate-on-interval} Polling with SWR
 */

import useSWR from 'swr';
import { getHealth } from '../api';
import type { HealthStatus } from '../types';

/**
 * Return type for useHealth hook
 */
export interface UseHealthReturn {
  /** Health status from API, undefined while loading or if request failed */
  health: HealthStatus | undefined;
  /** True while fetching data */
  isLoading: boolean;
  /** Error object if health check failed, undefined otherwise */
  isError: Error | undefined;
  /** Convenience boolean - true if API responded with status: 'ok' */
  isHealthy: boolean;
}

/**
 * Monitors API health with automatic polling
 * 
 * Polls the /health endpoint every 30 seconds to monitor API availability.
 * Useful for displaying connection status indicators in the UI.
 * 
 * Uses SWR for:
 * - Automatic polling every 30 seconds
 * - Caching with 5-second deduplication
 * - Revalidation on network reconnection
 * 
 * @returns {UseHealthReturn} Object containing health data, loading state, error, and isHealthy flag
 * 
 * @example
 * ```tsx
 * function HealthIndicator() {
 *   const { isHealthy, isLoading, isError } = useHealth();
 * 
 *   if (isLoading) return <span className="text-gray-500">Checking...</span>;
 *   if (isError) return <span className="text-red-500">API Error</span>;
 * 
 *   return (
 *     <span className={isHealthy ? 'text-green-500' : 'text-yellow-500'}>
 *       {isHealthy ? 'Connected' : 'Degraded'}
 *     </span>
 *   );
 * }
 * ```
 */
export function useHealth(): UseHealthReturn {
  const { data, error, isLoading } = useSWR<HealthStatus>(
    '/health',
    getHealth,
    {
      refreshInterval: 30000, // Poll every 30 seconds
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    health: data,
    isLoading,
    isError: error,
    isHealthy: data?.status === 'ok',
  };
}
