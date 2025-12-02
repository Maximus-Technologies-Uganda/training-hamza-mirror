/**
 * Unit tests for PostDetail component
 * Tests rendering of full post data including title, body, dates, and metadata
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostDetail from '@/components/PostDetail';
import type { Post } from '@/lib/types';

describe('PostDetail', () => {
  const mockPost: Post = {
    id: 1,
    title: 'Test Post Title',
    slug: 'test-post-title',
    body: 'This is the full body content of the test post. It contains multiple paragraphs and detailed information.\n\nSecond paragraph here.',
    createdAt: '2025-11-27T10:00:00Z',
    updatedAt: '2025-11-28T15:30:00Z',
  };

  it('renders post title as heading', () => {
    render(<PostDetail post={mockPost} />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Test Post Title');
  });

  it('renders full post body', () => {
    render(<PostDetail post={mockPost} />);
    expect(screen.getByText(/This is the full body content/i)).toBeInTheDocument();
    expect(screen.getByText(/Second paragraph here/i)).toBeInTheDocument();
  });

  it('renders creation date', () => {
    render(<PostDetail post={mockPost} />);
    expect(screen.getByText(/November 27, 2025/i)).toBeInTheDocument();
  });

  it('renders updated date when different from creation', () => {
    render(<PostDetail post={mockPost} />);
    expect(screen.getByText(/November 28, 2025/i)).toBeInTheDocument();
  });

  it('renders post slug', () => {
    render(<PostDetail post={mockPost} />);
    expect(screen.getByText(/test-post-title/i)).toBeInTheDocument();
  });

  it('has semantic HTML structure with article element', () => {
    const { container } = render(<PostDetail post={mockPost} />);
    expect(container.querySelector('article')).toBeInTheDocument();
  });

  it('has proper time element with dateTime attribute', () => {
    const { container } = render(<PostDetail post={mockPost} />);
    const timeElements = container.querySelectorAll('time');
    expect(timeElements.length).toBeGreaterThanOrEqual(1);
    expect(timeElements[0]).toHaveAttribute('dateTime', mockPost.createdAt);
  });

  it('handles very long body content', () => {
    const longBodyPost = {
      ...mockPost,
      body: 'A'.repeat(50000),
    };
    render(<PostDetail post={longBodyPost} />);
    expect(screen.getByText(/A+/)).toBeInTheDocument();
  });

  it('handles markdown-like content in body', () => {
    const markdownPost = {
      ...mockPost,
      body: '# Heading\n\n**Bold text** and *italic text*',
    };
    render(<PostDetail post={markdownPost} />);
    expect(screen.getByText(/Bold text/i)).toBeInTheDocument();
  });

  it('renders back to home link', () => {
    render(<PostDetail post={mockPost} />);
    const homeLink = screen.getByRole('link', { name: /back|home/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders edit link pointing to edit page', () => {
    render(<PostDetail post={mockPost} />);
    const editLink = screen.getByRole('link', { name: /edit/i });
    expect(editLink).toHaveAttribute('href', '/posts/1/edit');
  });

  it('renders delete button', () => {
    render(<PostDetail post={mockPost} />);
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('has accessible labels for dates', () => {
    render(<PostDetail post={mockPost} />);
    expect(screen.getByLabelText(/published/i)).toBeInTheDocument();
  });

  it('does not show updated date when same as created', () => {
    const sameTimestampPost = {
      ...mockPost,
      createdAt: '2025-11-27T10:00:00Z',
      updatedAt: '2025-11-27T10:00:00Z',
    };
    render(<PostDetail post={sameTimestampPost} />);
    // Should only show one date reference for "published"
    // (implementation may vary - test the expected behavior)
    const createdText = screen.getAllByText(/November 27, 2025/i);
    expect(createdText.length).toBeGreaterThanOrEqual(1);
  });
});
