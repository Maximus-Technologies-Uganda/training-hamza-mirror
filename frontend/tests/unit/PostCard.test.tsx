/**
 * Unit tests for PostCard component
 * Tests rendering of post preview card with title, date, slug, excerpt, and link
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostCard from '@/components/PostCard';
import type { Post } from '@/lib/types';

describe('PostCard', () => {
  const mockPost: Post = {
    id: 1,
    title: 'Test Post Title',
    slug: 'test-post-title',
    body: 'This is the full body content of the test post. It contains multiple sentences to test excerpt extraction.',
    createdAt: '2025-11-27T10:00:00Z',
    updatedAt: '2025-11-27T10:00:00Z',
    ownerId: 'user-1',
  };

  it('renders post title', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
  });

  it('renders post creation date', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText(/November 27, 2025/i)).toBeInTheDocument();
  });

  it('renders post slug', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText(/test-post-title/i)).toBeInTheDocument();
  });

  it('renders post excerpt (truncated body)', () => {
    render(<PostCard post={mockPost} />);
    const excerpt = screen.getByText(/This is the full body content/i);
    expect(excerpt).toBeInTheDocument();
    // Excerpt should be shorter than or equal to full body
    expect(excerpt.textContent?.length).toBeLessThanOrEqual(mockPost.body.length);
  });

  it('links to post detail page', () => {
    render(<PostCard post={mockPost} />);
    const links = screen.getAllByRole('link');
    // PostCard has 2 links: title link and "Read more" link
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute('href', '/posts/1');
  });

  it('displays as a card with proper styling', () => {
    const { container } = render(<PostCard post={mockPost} />);
    const card = container.firstChild;
    expect(card).toHaveClass('card');
  });

  it('handles very long titles gracefully', () => {
    const longTitlePost = {
      ...mockPost,
      title: 'A'.repeat(200),
    };
    render(<PostCard post={longTitlePost} />);
    expect(screen.getByText('A'.repeat(200))).toBeInTheDocument();
  });

  it('handles empty body gracefully', () => {
    const emptyBodyPost = {
      ...mockPost,
      body: '',
    };
    render(<PostCard post={emptyBodyPost} />);
    // Should still render without crashing
    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
  });

  it('has accessible link text', () => {
    render(<PostCard post={mockPost} />);
    const links = screen.getAllByRole('link');
    // PostCard has 2 links: title link and "Read more" link
    links.forEach(link => {
      expect(link).toHaveAccessibleName();
    });
  });
});
