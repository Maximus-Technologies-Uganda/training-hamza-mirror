/**
 * SSR Snapshot Test for Posts Page
 * 
 * Validates that the posts page components render correctly.
 * This test verifies:
 * 1. PostList renders posts correctly
 * 2. HomePageClient handles SSR hydration properly
 * 3. SEO-critical content is present in initial HTML
 * 
 * Note: Since HomePage is a Server Component with async data fetching,
 * we test the client components that receive server-fetched data.
 */

import { render } from '@testing-library/react';
import HomePageClient from '@/components/HomePageClient';
import PostList from '@/components/PostList';
import type { Post } from '@/lib/types';

// Mock posts data
const mockPosts: Post[] = [
  {
    id: 1,
    title: 'First SSR Post',
    slug: 'first-ssr-post',
    body: 'This post should appear in server HTML',
    ownerId: 1,
    createdAt: '2025-12-01T10:00:00.000Z',
    updatedAt: '2025-12-01T10:00:00.000Z',
  },
  {
    id: 2,
    title: 'Second SSR Post',
    slug: 'second-ssr-post',
    body: 'Another server-rendered post',
    ownerId: 1,
    createdAt: '2025-12-02T10:00:00.000Z',
    updatedAt: '2025-12-02T10:00:00.000Z',
  },
];

// Mock SWR to return initialPosts directly for SSR simulation
jest.mock('swr', () => {
  return {
    __esModule: true,
    default: jest.fn((key, fetcher, options) => {
      // Return fallbackData directly to simulate SSR hydration
      return {
        data: options?.fallbackData,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      };
    }),
  };
});

describe('SSR Posts Page', () => {
  it('renders posts in server HTML (first paint)', () => {
    const { container, getByText, getAllByRole } = render(
      <HomePageClient initialPosts={mockPosts} />
    );
    
    // Verify posts are rendered
    expect(getByText('First SSR Post')).toBeInTheDocument();
    expect(getByText('Second SSR Post')).toBeInTheDocument();
    
    // Verify post list structure
    const articles = getAllByRole('article');
    expect(articles).toHaveLength(2);
  });

  it('contains SEO-critical elements in PostList', () => {
    const { getByRole, getAllByRole } = render(
      <PostList posts={mockPosts} />
    );
    
    // H2 headings for posts (for SEO)
    const headings = getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveTextContent('First SSR Post');
    expect(headings[1]).toHaveTextContent('Second SSR Post');
    
    // Links to post detail pages
    const links = getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('renders posts data from initial props', () => {
    const { getByText } = render(
      <HomePageClient initialPosts={mockPosts} />
    );
    
    // Verify post content is rendered
    expect(getByText('First SSR Post')).toBeInTheDocument();
    expect(getByText('Second SSR Post')).toBeInTheDocument();
  });

  it('handles empty posts gracefully', () => {
    const { getByText } = render(
      <HomePageClient initialPosts={[]} />
    );
    
    // Should show empty state
    expect(getByText(/no posts/i)).toBeInTheDocument();
  });

  it('PostList handles empty posts', () => {
    const { getByText } = render(
      <PostList posts={[]} />
    );
    
    // Should show empty state message
    expect(getByText(/no posts/i)).toBeInTheDocument();
  });

  it('matches SSR snapshot', () => {
    const { container } = render(
      <HomePageClient initialPosts={mockPosts} />
    );
    
    // Snapshot test to catch unintended SSR output changes
    expect(container).toMatchSnapshot();
  });
});
