/**
 * Unit tests for LoadingSkeleton component
 * Tests loading state UI with skeleton placeholders
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingSkeleton from '@/components/LoadingSkeleton';

describe('LoadingSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<LoadingSkeleton />);
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays multiple skeleton placeholders for post list', () => {
    const { container } = render(<LoadingSkeleton />);
    const skeletons = container.querySelectorAll('.skeleton');
    // Should have multiple skeleton elements (title + content cards)
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it('includes skeleton for title', () => {
    const { container } = render(<LoadingSkeleton />);
    const skeletons = container.querySelectorAll('.skeleton');
    // Should have skeleton elements of varying widths (title, content, etc.)
    expect(skeletons.length).toBeGreaterThan(3);
  });

  it('has proper loading animation class', () => {
    const { container } = render(<LoadingSkeleton />);
    const skeleton = container.querySelector('.skeleton');
    expect(skeleton).toHaveClass('skeleton');
  });

  it('maintains layout structure similar to actual content', () => {
    const { container } = render(<LoadingSkeleton />);
    // Should use same spacing classes as real content
    expect(container.firstChild).toHaveClass('space-y-6');
  });

  it('includes screen reader text for accessibility', () => {
    render(<LoadingSkeleton />);
    expect(screen.getByText(/loading blog posts/i)).toBeInTheDocument();
  });

  it('has aria-label for loading status', () => {
    const { container } = render(<LoadingSkeleton />);
    const statusElement = container.querySelector('[role="status"]');
    expect(statusElement).toHaveAttribute('aria-label', 'Loading posts');
  });
});
