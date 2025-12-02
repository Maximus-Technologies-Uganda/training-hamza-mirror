/**
 * Accessibility tests for PostList component
 * Tests WCAG 2.1 AA compliance using jest-axe
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import { axe } from 'jest-axe';
import PostList from '@/components/PostList';
import type { Post } from '@/lib/types';

describe('PostList Accessibility', () => {
  const mockPosts: Post[] = [
    {
      id: 1,
      title: 'Accessible Post 1',
      slug: 'accessible-post-1',
      body: 'This is accessible content.',
      createdAt: '2025-11-27T10:00:00Z',
      updatedAt: '2025-11-27T10:00:00Z',
    },
    {
      id: 2,
      title: 'Accessible Post 2',
      slug: 'accessible-post-2',
      body: 'More accessible content.',
      createdAt: '2025-11-26T10:00:00Z',
      updatedAt: '2025-11-26T10:00:00Z',
    },
  ];

  it('should not have any accessibility violations with posts', async () => {
    let container: HTMLElement;
    await act(async () => {
      const result = render(<PostList posts={mockPosts} />);
      container = result.container;
    });
    const results = await axe(container!);
    expect(results).toHaveNoViolations();
  });

  it('should not have any accessibility violations when empty', async () => {
    let container: HTMLElement;
    await act(async () => {
      const result = render(<PostList posts={[]} />);
      container = result.container;
    });
    const results = await axe(container!);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading hierarchy', async () => {
    let container: HTMLElement;
    await act(async () => {
      const result = render(<PostList posts={mockPosts} />);
      container = result.container;
    });
    
    // Check that headings exist and are properly structured
    const results = await axe(container!, {
      rules: {
        'heading-order': { enabled: true },
      },
    });
    
    expect(results).toHaveNoViolations();
  });

  it('should have sufficient color contrast', async () => {
    let container: HTMLElement;
    await act(async () => {
      const result = render(<PostList posts={mockPosts} />);
      container = result.container;
    });
    
    const results = await axe(container!, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });
    
    expect(results).toHaveNoViolations();
  });

  it('should have accessible links', async () => {
    let container: HTMLElement;
    await act(async () => {
      const result = render(<PostList posts={mockPosts} />);
      container = result.container;
    });
    
    const results = await axe(container!, {
      rules: {
        'link-name': { enabled: true },
      },
    });
    
    expect(results).toHaveNoViolations();
  });

  it('should use semantic HTML', async () => {
    let container: HTMLElement;
    await act(async () => {
      const result = render(<PostList posts={mockPosts} />);
      container = result.container;
    });
    
    const results = await axe(container!, {
      rules: {
        'list': { enabled: true },
        'listitem': { enabled: true },
      },
    });
    
    expect(results).toHaveNoViolations();
  });
});
