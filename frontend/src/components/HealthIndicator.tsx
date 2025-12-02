/**
 * HealthIndicator component
 * Displays API health status with visual indicator
 * Shows green when healthy, yellow when error, red when unhealthy
 */

'use client';

import { useHealth } from '@/lib/hooks/useHealth';

interface HealthIndicatorProps {
  className?: string;
}

/**
 * Health status indicator component that displays the Blog API's current status.
 * Uses SWR to poll the /health endpoint every 30 seconds.
 * Displays visual indicators:
 * - Green badge: API is healthy and responding
 * - Yellow badge: Error communicating with API (network issues)
 * - Red badge: API reports unhealthy status
 * 
 * @param className - Optional additional CSS classes
 */
export default function HealthIndicator({ className = '' }: HealthIndicatorProps) {
  const { health, isLoading, isError, isHealthy } = useHealth();

  // Determine status and styling
  let statusText: string;
  let bgColorClass: string;
  let textColorClass: string;
  let dotColorClass: string;
  let ariaLabel: string;

  if (isLoading) {
    statusText = 'Checking API...';
    bgColorClass = 'bg-gray-100';
    textColorClass = 'text-gray-700';
    dotColorClass = 'bg-gray-400';
    ariaLabel = 'Checking API health status';
  } else if (isError) {
    statusText = 'API Unavailable';
    bgColorClass = 'bg-yellow-100';
    textColorClass = 'text-yellow-800';
    dotColorClass = 'bg-yellow-500';
    ariaLabel = 'API is currently unavailable due to connection error';
  } else if (isHealthy) {
    statusText = 'API Healthy';
    bgColorClass = 'bg-green-100';
    textColorClass = 'text-green-800';
    dotColorClass = 'bg-green-500';
    ariaLabel = 'API is healthy and responding normally';
  } else {
    // API responded but status is unhealthy
    statusText = 'API Unhealthy';
    bgColorClass = 'bg-red-100';
    textColorClass = 'text-red-800';
    dotColorClass = 'bg-red-500';
    ariaLabel = 'API is reporting unhealthy status';
  }

  return (
    <div
      data-testid="health-indicator"
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${bgColorClass} ${textColorClass} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      {/* Status dot with pulse animation when loading */}
      <span
        className={`w-2 h-2 rounded-full ${dotColorClass} ${isLoading ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      
      {/* Status text */}
      <span>{statusText}</span>
    </div>
  );
}
