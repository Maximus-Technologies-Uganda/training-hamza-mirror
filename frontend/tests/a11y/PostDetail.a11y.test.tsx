/**
 * Accessibility tests for PostDetail component
 * Tests WCAG 2.1 AA compliance using jest-axe
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import { axe } from 'jest-axe';
import PostDetail from '@/components/PostDetail';
import type { Post } from '@/lib/types';

describe('PostDetail Accessibility', () => {
  const mockPost: Post = {
    id: 1,
    title: 'Accessible Post Title',
    slug: 'accessible-post-title',
    body: 'This is the full content of the post. It contains detailed information about the topic.\n\nSecond paragraph with more content.',
    createdAt: '2025-11-27T10:00:00Z',
    updatedAt: '2025-11-28T15:30:00Z',
  };

  it('should not have any accessibility violations', async () => {
    let container: HTMLElement;
    await act(async () => {
      const result = render(<PostDetail post={mockPost} />);
      container = result.container;
    });
    const results = await axe(container!);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading hierarchy', async () => {
    let container: HTMLElement;
    await act(async () => {
      const result = render(<PostDetail post={mockPost} />);
      container = result.container;
    });
    
    const results = await axe(container!, {
      rules: {
        'heading-order': { enabled: true },
      },
    });
    
    expect(results).toHaveNoViolations();
  });

  it('should have only one h1 element', async () => {
    let container: HTMLElement;
    await act(async () => {
      const result = render(<PostDetail post={mockPost} />);
      container = result.container;
    });
    const h1Elements = container!.querySelectorAll('h1');
    expect(h1Elements.length).toBe(1);
  });

  it('should have sufficient color contrast', async () => {
    let container: HTMLElement;
    await act(async () => {
      const result = render(<PostDetail post={mockPost} />);
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
      const result = render(<PostDetail post={mockPost} />);
      container = result.container;
    });
    
    const results = await axe(container!, {
      rules: {
        'link-name': { enabled: true },
      },
    });
    
    expect(results).toHaveNoViolations();
  });

  it('should have accessible buttons', async () => {
    let container: HTMLElement;
    await act(async () => {
      const result = render(<PostDetail post={mockPost} />);
      container = result.container;
    });
    
    const results = await axe(container!, {
      rules: {
        'button-name': { enabled: true },
      },
    });
    
    expect(results).toHaveNoViolations();
  });

  it('should use semantic HTML with article element', async () => {
    let container: HTMLElement;
    await act(async () => {
      const result = render(<PostDetail post={mockPost} />);
      container = result.container;
    });
    expect(container!.querySelector('article')).toBeInTheDocument();
  });

  it('should have proper time elements with dateTime attributes', async () => {
    let container: HTMLElement;
    await act(async () => {
      const result = render(<PostDetail post={mockPost} />);
      container = result.container;
    });
    const timeElements = container!.querySelectorAll('time');
    
    expect(timeElements.length).toBeGreaterThanOrEqual(1);
    timeElements.forEach((time) => {
      expect(time).toHaveAttribute('dateTime');
    });
  });

  it('should have accessible navigation controls', async () => {
    let container: HTMLElement;
    await act(async () => {
      const result = render(<PostDetail post={mockPost} />);
      container = result.container;
    });
    
    const results = await axe(container!, {
      rules: {
        'aria-allowed-attr': { enabled: true },
        'aria-valid-attr': { enabled: true },
      },
    });
    
    expect(results).toHaveNoViolations();
  });

  it('should maintain accessibility with long content', async () => {
    const longPost = {
      ...mockPost,
      title: 'A'.repeat(200),
      body: 'B'.repeat(5000),
    };
    
    let container: HTMLElement;
    await act(async () => {
      const result = render(<PostDetail post={longPost} />);
      container = result.container;
    });
    const results = await axe(container!);
    expect(results).toHaveNoViolations();
  });

  it('should have focus visible styles on interactive elements', async () => {
    let container: HTMLElement;
    await act(async () => {
      const result = render(<PostDetail post={mockPost} />);
      container = result.container;
    });
    
    const results = await axe(container!, {
      rules: {
        'focus-order-semantics': { enabled: true },
      },
    });
    
    expect(results).toHaveNoViolations();
  });
});
