/**
 * Integration tests for health check functionality
 * Tests API polling, error handling, and status updates
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import HealthIndicator from '@/components/HealthIndicator';
import type { HealthStatus } from '@/lib/types';

// Mock the API module
jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  getHealth: jest.fn(),
}));

import * as api from '@/lib/api';

const mockGetHealth = api.getHealth as jest.MockedFunction<typeof api.getHealth>;

// Mock SWR
jest.mock('swr', () => {
  const originalModule = jest.requireActual('swr');
  return {
    __esModule: true,
    ...originalModule,
    default: jest.fn(),
  };
});

import useSWR from 'swr';

const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;

describe('Health Check Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('API Polling', () => {
    it('fetches health status on initial render', () => {
      mockUseSWR.mockReturnValue({
        data: { status: 'ok', timestamp: new Date().toISOString() },
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      render(<HealthIndicator />);

      // SWR should be called with health endpoint
      expect(mockUseSWR).toHaveBeenCalledWith(
        '/health',
        expect.any(Function),
        expect.objectContaining({
          refreshInterval: 30000,
        })
      );
    });

    it('polls API every 30 seconds', () => {
      mockUseSWR.mockReturnValue({
        data: { status: 'ok', timestamp: new Date().toISOString() },
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      render(<HealthIndicator />);

      // Verify SWR is configured with 30-second refresh interval
      expect(mockUseSWR).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({
          refreshInterval: 30000,
        })
      );
    });

    it('displays loading state during initial fetch', () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: true,
        isValidating: true,
        mutate: jest.fn(),
      } as any);

      render(<HealthIndicator />);

      expect(screen.getByText(/checking/i)).toBeInTheDocument();
    });

    it('displays healthy status after successful fetch', async () => {
      mockUseSWR.mockReturnValue({
        data: { status: 'ok', timestamp: new Date().toISOString() },
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      render(<HealthIndicator />);

      await waitFor(() => {
        expect(screen.getByText(/api.*healthy/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API unreachable error', async () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: new Error('Network error: Failed to fetch'),
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      render(<HealthIndicator />);

      await waitFor(() => {
        expect(screen.getByText(/api.*unavailable|error/i)).toBeInTheDocument();
      });
    });

    it('handles 500 server error gracefully', async () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: new Error('Server Error: 500'),
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      render(<HealthIndicator />);

      await waitFor(() => {
        expect(screen.getByText(/api.*unavailable|error/i)).toBeInTheDocument();
      });
    });

    it('handles timeout error', async () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: new Error('Request timeout'),
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      render(<HealthIndicator />);

      await waitFor(() => {
        expect(screen.getByText(/api.*unavailable|error/i)).toBeInTheDocument();
      });
    });

    it('handles API returning error status', async () => {
      mockUseSWR.mockReturnValue({
        data: { status: 'error', timestamp: new Date().toISOString() },
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      const { container } = render(<HealthIndicator />);

      await waitFor(() => {
        const indicator = container.querySelector('[data-testid="health-indicator"]');
        expect(indicator).toHaveClass('bg-red-100');
      });
    });

    it('shows warning visual indicator on error', async () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: new Error('Network error'),
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      const { container } = render(<HealthIndicator />);

      await waitFor(() => {
        const indicator = container.querySelector('[data-testid="health-indicator"]');
        expect(indicator).toHaveClass('bg-yellow-100');
      });
    });
  });

  describe('Status Transitions', () => {
    it('updates from healthy to unhealthy when API fails', async () => {
      // Start healthy
      mockUseSWR.mockReturnValue({
        data: { status: 'ok', timestamp: new Date().toISOString() },
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      const { rerender, container } = render(<HealthIndicator />);

      expect(container.querySelector('[data-testid="health-indicator"]')).toHaveClass('bg-green-100');

      // API becomes unreachable
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: new Error('Network error'),
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      rerender(<HealthIndicator />);

      await waitFor(() => {
        expect(container.querySelector('[data-testid="health-indicator"]')).toHaveClass('bg-yellow-100');
      });
    });

    it('updates from error to healthy when API recovers', async () => {
      // Start with error
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: new Error('Network error'),
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      const { rerender, container } = render(<HealthIndicator />);

      expect(container.querySelector('[data-testid="health-indicator"]')).toHaveClass('bg-yellow-100');

      // API recovers
      mockUseSWR.mockReturnValue({
        data: { status: 'ok', timestamp: new Date().toISOString() },
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      rerender(<HealthIndicator />);

      await waitFor(() => {
        expect(container.querySelector('[data-testid="health-indicator"]')).toHaveClass('bg-green-100');
      });
    });
  });

  describe('SWR Configuration', () => {
    it('disables revalidation on focus', () => {
      mockUseSWR.mockReturnValue({
        data: { status: 'ok', timestamp: new Date().toISOString() },
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      render(<HealthIndicator />);

      expect(mockUseSWR).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({
          revalidateOnFocus: false,
        })
      );
    });

    it('enables revalidation on reconnect', () => {
      mockUseSWR.mockReturnValue({
        data: { status: 'ok', timestamp: new Date().toISOString() },
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      render(<HealthIndicator />);

      expect(mockUseSWR).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({
          revalidateOnReconnect: true,
        })
      );
    });
  });

  describe('Accessibility Integration', () => {
    it('announces status to screen readers via ARIA live region', async () => {
      mockUseSWR.mockReturnValue({
        data: { status: 'ok', timestamp: new Date().toISOString() },
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      render(<HealthIndicator />);

      await waitFor(() => {
        const liveRegion = screen.getByRole('status');
        expect(liveRegion).toBeInTheDocument();
        expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('provides meaningful status text for screen readers', async () => {
      mockUseSWR.mockReturnValue({
        data: { status: 'ok', timestamp: new Date().toISOString() },
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      render(<HealthIndicator />);

      await waitFor(() => {
        const statusElement = screen.getByRole('status');
        expect(statusElement.textContent).toMatch(/api|healthy/i);
      });
    });
  });
});
