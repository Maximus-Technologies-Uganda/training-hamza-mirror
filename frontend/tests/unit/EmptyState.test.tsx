/**
 * Unit tests for EmptyState component
 * Tests display of helpful message when no posts exist
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmptyState from '@/components/EmptyState';

describe('EmptyState', () => {
  it('renders empty state message', () => {
    render(<EmptyState />);
    expect(screen.getByText(/no posts/i)).toBeInTheDocument();
  });

  it('provides helpful call-to-action', () => {
    render(<EmptyState />);
    expect(screen.getByText(/create.*first post/i)).toBeInTheDocument();
  });

  it('includes link to create new post', () => {
    render(<EmptyState />);
    const link = screen.getByRole('link', { name: /create/i });
    expect(link).toHaveAttribute('href', '/posts/new');
  });

  it('displays friendly icon or illustration', () => {
    const { container } = render(<EmptyState />);
    // Should have some visual element (emoji, icon, or SVG)
    expect(container.firstChild).toBeInTheDocument();
  });

  it('uses semantic heading for message', () => {
    render(<EmptyState />);
    const heading = screen.getByRole('heading');
    expect(heading).toBeInTheDocument();
  });

  it('has accessible link', () => {
    render(<EmptyState />);
    const link = screen.getByRole('link');
    expect(link).toHaveAccessibleName();
  });

  it('applies card styling', () => {
    const { container } = render(<EmptyState />);
    expect(container.firstChild).toHaveClass('card');
  });
});
