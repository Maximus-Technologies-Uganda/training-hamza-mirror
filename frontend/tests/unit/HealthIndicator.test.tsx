/**
 * Unit tests for HealthIndicator component
 * Tests API health status display, loading states, and status changes
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HealthIndicator from '@/components/HealthIndicator';

// Mock the useHealth hook
jest.mock('@/lib/hooks/useHealth', () => ({
  useHealth: jest.fn(),
}));

import { useHealth } from '@/lib/hooks/useHealth';

const mockUseHealth = useHealth as jest.MockedFunction<typeof useHealth>;

describe('HealthIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Healthy Status', () => {
    it('displays healthy status with green indicator', () => {
      mockUseHealth.mockReturnValue({
        health: { status: 'ok', timestamp: new Date().toISOString() },
        isLoading: false,
        isError: undefined,
        isHealthy: true,
      });

      render(<HealthIndicator />);

      expect(screen.getByText(/api.*healthy/i)).toBeInTheDocument();
    });

    it('shows green visual indicator when healthy', () => {
      mockUseHealth.mockReturnValue({
        health: { status: 'ok', timestamp: new Date().toISOString() },
        isLoading: false,
        isError: undefined,
        isHealthy: true,
      });

      const { container } = render(<HealthIndicator />);

      // Should have green color class
      const indicator = container.querySelector('[data-testid="health-indicator"]');
      expect(indicator).toHaveClass('bg-green-100');
    });
  });

  describe('Unhealthy Status', () => {
    it('displays unhealthy status with warning indicator', () => {
      mockUseHealth.mockReturnValue({
        health: undefined,
        isLoading: false,
        isError: undefined,
        isHealthy: false,
      });

      render(<HealthIndicator />);

      expect(screen.getByText(/api.*unavailable|unhealthy/i)).toBeInTheDocument();
    });

    it('shows red/yellow visual indicator when unhealthy', () => {
      mockUseHealth.mockReturnValue({
        health: undefined,
        isLoading: false,
        isError: undefined,
        isHealthy: false,
      });

      const { container } = render(<HealthIndicator />);

      const indicator = container.querySelector('[data-testid="health-indicator"]');
      expect(indicator).toHaveClass('bg-red-100');
    });

    it('shows red styling when API returns error status', () => {
      mockUseHealth.mockReturnValue({
        health: { status: 'error', timestamp: new Date().toISOString() },
        isLoading: false,
        isError: undefined,
        isHealthy: false,
      });

      const { container } = render(<HealthIndicator />);

      const indicator = container.querySelector('[data-testid="health-indicator"]');
      expect(indicator).toHaveClass('bg-red-100');
    });
  });

  describe('Loading State', () => {
    it('displays loading state during initial fetch', () => {
      mockUseHealth.mockReturnValue({
        health: undefined,
        isLoading: true,
        isError: undefined,
        isHealthy: false,
      });

      render(<HealthIndicator />);

      expect(screen.getByText(/checking/i)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('displays error state when API is unreachable', () => {
      mockUseHealth.mockReturnValue({
        health: undefined,
        isLoading: false,
        isError: new Error('Network error'),
        isHealthy: false,
      });

      render(<HealthIndicator />);

      expect(screen.getByText(/api.*unavailable|error/i)).toBeInTheDocument();
    });

    it('shows warning indicator on error', () => {
      mockUseHealth.mockReturnValue({
        health: undefined,
        isLoading: false,
        isError: new Error('Network error'),
        isHealthy: false,
      });

      const { container } = render(<HealthIndicator />);

      const indicator = container.querySelector('[data-testid="health-indicator"]');
      expect(indicator).toHaveClass('bg-yellow-100');
    });
  });

  describe('Status Updates', () => {
    it('updates display when status changes from healthy to unhealthy', () => {
      // Start healthy
      mockUseHealth.mockReturnValue({
        health: { status: 'ok', timestamp: new Date().toISOString() },
        isLoading: false,
        isError: undefined,
        isHealthy: true,
      });

      const { rerender, container } = render(<HealthIndicator />);

      expect(container.querySelector('[data-testid="health-indicator"]')).toHaveClass('bg-green-100');

      // Change to unhealthy
      mockUseHealth.mockReturnValue({
        health: undefined,
        isLoading: false,
        isError: undefined,
        isHealthy: false,
      });

      rerender(<HealthIndicator />);

      expect(container.querySelector('[data-testid="health-indicator"]')).toHaveClass('bg-red-100');
    });

    it('updates display when status recovers from error to healthy', () => {
      // Start with error
      mockUseHealth.mockReturnValue({
        health: undefined,
        isLoading: false,
        isError: new Error('Network error'),
        isHealthy: false,
      });

      const { rerender, container } = render(<HealthIndicator />);

      expect(container.querySelector('[data-testid="health-indicator"]')).toHaveClass('bg-yellow-100');

      // Recover to healthy
      mockUseHealth.mockReturnValue({
        health: { status: 'ok', timestamp: new Date().toISOString() },
        isLoading: false,
        isError: undefined,
        isHealthy: true,
      });

      rerender(<HealthIndicator />);

      expect(container.querySelector('[data-testid="health-indicator"]')).toHaveClass('bg-green-100');
    });
  });

  describe('Accessibility', () => {
    it('has ARIA live region for screen reader announcements', () => {
      mockUseHealth.mockReturnValue({
        health: { status: 'ok', timestamp: new Date().toISOString() },
        isLoading: false,
        isError: undefined,
        isHealthy: true,
      });

      render(<HealthIndicator />);

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('announces status changes to screen readers', () => {
      mockUseHealth.mockReturnValue({
        health: { status: 'ok', timestamp: new Date().toISOString() },
        isLoading: false,
        isError: undefined,
        isHealthy: true,
      });

      render(<HealthIndicator />);

      // The status text should be within an ARIA live region
      const statusElement = screen.getByRole('status');
      expect(statusElement).toBeInTheDocument();
      expect(statusElement.textContent).toMatch(/healthy/i);
    });

    it('has appropriate aria-label for the indicator', () => {
      mockUseHealth.mockReturnValue({
        health: { status: 'ok', timestamp: new Date().toISOString() },
        isLoading: false,
        isError: undefined,
        isHealthy: true,
      });

      const { container } = render(<HealthIndicator />);

      const indicator = container.querySelector('[data-testid="health-indicator"]');
      expect(indicator).toHaveAttribute('aria-label');
    });
  });

  describe('Display Format', () => {
    it('displays as a compact badge', () => {
      mockUseHealth.mockReturnValue({
        health: { status: 'ok', timestamp: new Date().toISOString() },
        isLoading: false,
        isError: undefined,
        isHealthy: true,
      });

      const { container } = render(<HealthIndicator />);

      const indicator = container.querySelector('[data-testid="health-indicator"]');
      expect(indicator).toHaveClass('inline-flex');
    });
  });
});
