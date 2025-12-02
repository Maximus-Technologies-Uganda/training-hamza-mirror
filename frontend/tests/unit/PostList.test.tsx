/**
 * Unit tests for PostList component
 * Tests rendering of post array and empty state handling
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostList from '@/components/PostList';
import type { Post } from '@/lib/types';

describe('PostList', () => {
  const mockPosts: Post[] = [
    {
      id: 1,
      title: 'First Post',
      slug: 'first-post',
      body: 'First post content',
      createdAt: '2025-11-27T10:00:00Z',
      updatedAt: '2025-11-27T10:00:00Z',
    },
    {
      id: 2,
      title: 'Second Post',
      slug: 'second-post',
      body: 'Second post content',
      createdAt: '2025-11-26T10:00:00Z',
      updatedAt: '2025-11-26T10:00:00Z',
    },
    {
      id: 3,
      title: 'Third Post',
      slug: 'third-post',
      body: 'Third post content',
      createdAt: '2025-11-25T10:00:00Z',
      updatedAt: '2025-11-25T10:00:00Z',
    },
  ];

  it('renders all posts in the array', () => {
    render(<PostList posts={mockPosts} />);
    expect(screen.getByText('First Post')).toBeInTheDocument();
    expect(screen.getByText('Second Post')).toBeInTheDocument();
    expect(screen.getByText('Third Post')).toBeInTheDocument();
  });

  it('renders correct number of post cards', () => {
    render(<PostList posts={mockPosts} />);
    const articles = screen.getAllByRole('article');
    // Each post should render as an article element
    expect(articles).toHaveLength(3);
  });

  it('shows empty state when posts array is empty', () => {
    render(<PostList posts={[]} />);
    expect(screen.getByText(/no posts/i)).toBeInTheDocument();
  });

  it('shows empty state with helpful message', () => {
    render(<PostList posts={[]} />);
    expect(screen.getByText(/create.*first post/i)).toBeInTheDocument();
  });

  it('renders posts in order provided', () => {
    render(<PostList posts={mockPosts} />);
    const titles = screen.getAllByRole('heading', { level: 2 });
    expect(titles[0]).toHaveTextContent('First Post');
    expect(titles[1]).toHaveTextContent('Second Post');
    expect(titles[2]).toHaveTextContent('Third Post');
  });

  it('handles single post correctly', () => {
    render(<PostList posts={[mockPosts[0]!]} />);
    expect(screen.getByText('First Post')).toBeInTheDocument();
    expect(screen.queryByText('Second Post')).not.toBeInTheDocument();
  });

  it('handles large number of posts', () => {
    const manyPosts = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      title: `Post ${i}`,
      slug: `post-${i}`,
      body: `Content ${i}`,
      createdAt: '2025-11-27T10:00:00Z',
      updatedAt: '2025-11-27T10:00:00Z',
    }));
    render(<PostList posts={manyPosts} />);
    expect(screen.getByText('Post 0')).toBeInTheDocument();
    expect(screen.getByText('Post 99')).toBeInTheDocument();
  });

  it('uses semantic list markup', () => {
    const { container } = render(<PostList posts={mockPosts} />);
    const list = container.querySelector('ul, ol');
    expect(list).toBeInTheDocument();
  });
});
