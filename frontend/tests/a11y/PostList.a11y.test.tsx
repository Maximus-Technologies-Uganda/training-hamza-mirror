/**
 * Accessibility tests for PostList component
 * Tests WCAG 2.1 AA compliance using jest-axe
 */

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import PostList from '@/components/PostList';
import type { Post } from '@/lib/types';

expect.extend(toHaveNoViolations);

describe('PostList Accessibility', () => {
  const mockPosts: Post[] = [
    {
      id: 1,
      title: 'Accessible Post 1',
      slug: 'accessible-post-1',
      body: 'This is accessible content.',
      createdAt: '2025-11-27T10:00:00Z',
      updatedAt: '2025-11-27T10:00:00Z',
      ownerId: 1,
    },
    {
      id: 2,
      title: 'Accessible Post 2',
      slug: 'accessible-post-2',
      body: 'More accessible content.',
      createdAt: '2025-11-26T10:00:00Z',
      updatedAt: '2025-11-26T10:00:00Z',
      ownerId: 1,
    },
  ];

  afterEach(() => {
    cleanup();
  });

  it('should not have any accessibility violations with posts', async () => {
    const { container } = render(<PostList posts={mockPosts} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have any accessibility violations when empty', async () => {
    const { container } = render(<PostList posts={[]} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading hierarchy', async () => {
    const { container } = render(<PostList posts={mockPosts} />);
    
    // Check that headings exist and are properly structured
    const results = await axe(container, {
      rules: {
        'heading-order': { enabled: true },
      },
    });
    
    expect(results).toHaveNoViolations();
  });

  it('should have sufficient color contrast', async () => {
    const { container } = render(<PostList posts={mockPosts} />);
    
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });
    
    expect(results).toHaveNoViolations();
  });

  it('should have accessible links', async () => {
    const { container } = render(<PostList posts={mockPosts} />);
    
    const results = await axe(container, {
      rules: {
        'link-name': { enabled: true },
      },
    });
    
    expect(results).toHaveNoViolations();
  });

  it('should use semantic HTML', async () => {
    const { container } = render(<PostList posts={mockPosts} />);
    
    const results = await axe(container, {
      rules: {
        'list': { enabled: true },
        'listitem': { enabled: true },
      },
    });
    
    expect(results).toHaveNoViolations();
  });
});
