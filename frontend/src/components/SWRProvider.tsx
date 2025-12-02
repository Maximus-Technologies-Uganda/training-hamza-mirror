'use client';

import { SWRConfig } from 'swr';
import type { ReactNode } from 'react';
import { API_BASE_URL } from '@/lib/api';

/**
 * Default SWR fetcher function
 * Uses fetch to get JSON data from the API
 */
async function fetcher<T>(url: string): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  const response = await fetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }

  return response.json();
}

/**
 * SWR Configuration Provider
 * Wraps the application with SWR context for data fetching
 * 
 * Features:
 * - Automatic revalidation on focus
 * - Error retry with exponential backoff
 * - Dedupe requests within 2 seconds
 */
export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 2000,
        errorRetryCount: 3,
        shouldRetryOnError: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}
