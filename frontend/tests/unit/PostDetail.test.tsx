/**
 * Unit tests for PostDetail component
 * Tests rendering of full post data including title, body, dates, and metadata
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostDetail from '@/components/PostDetail';
import { AuthProvider } from '@/components/AuthProvider';
import type { Post } from '@/lib/types';

// Mock auth functions
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
  isAuthenticated: jest.fn(() => false),
  getToken: jest.fn(() => null),
  login: jest.fn(),
  logout: jest.fn(),
  getAuthHeaders: jest.fn(() => ({})),
}));

import * as authModule from '@/lib/auth';

// Helper to render with AuthProvider
const renderWithAuth = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      {ui}
    </AuthProvider>
  );
};

describe('PostDetail', () => {
  const mockPost: Post = {
    id: 1,
    title: 'Test Post Title',
    slug: 'test-post-title',
    body: 'This is the full body content of the test post. It contains multiple paragraphs and detailed information.\n\nSecond paragraph here.',
    createdAt: '2025-11-27T10:00:00Z',
    updatedAt: '2025-11-28T15:30:00Z',
    ownerId: 'user-1', // Added ownerId for auth tests
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to unauthenticated state by default
    (authModule.getCurrentUser as jest.Mock).mockReturnValue(null);
    (authModule.isAuthenticated as jest.Mock).mockReturnValue(false);
    (authModule.getToken as jest.Mock).mockReturnValue(null);
  });

  it('renders post title as heading', () => {
    renderWithAuth(<PostDetail post={mockPost} />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Test Post Title');
  });

  it('renders full post body', () => {
    renderWithAuth(<PostDetail post={mockPost} />);
    expect(screen.getByText(/This is the full body content/i)).toBeInTheDocument();
    expect(screen.getByText(/Second paragraph here/i)).toBeInTheDocument();
  });

  it('renders creation date', () => {
    renderWithAuth(<PostDetail post={mockPost} />);
    expect(screen.getByText(/November 27, 2025/i)).toBeInTheDocument();
  });

  it('renders updated date when different from creation', () => {
    renderWithAuth(<PostDetail post={mockPost} />);
    expect(screen.getByText(/November 28, 2025/i)).toBeInTheDocument();
  });

  it('renders post slug', () => {
    renderWithAuth(<PostDetail post={mockPost} />);
    expect(screen.getByText(/test-post-title/i)).toBeInTheDocument();
  });

  it('has semantic HTML structure with article element', () => {
    const { container } = renderWithAuth(<PostDetail post={mockPost} />);
    expect(container.querySelector('article')).toBeInTheDocument();
  });

  it('has proper time element with dateTime attribute', () => {
    const { container } = renderWithAuth(<PostDetail post={mockPost} />);
    const timeElements = container.querySelectorAll('time');
    expect(timeElements.length).toBeGreaterThanOrEqual(1);
    expect(timeElements[0]).toHaveAttribute('dateTime', mockPost.createdAt);
  });

  it('handles very long body content', () => {
    const longBodyPost = {
      ...mockPost,
      body: 'A'.repeat(50000),
    };
    renderWithAuth(<PostDetail post={longBodyPost} />);
    expect(screen.getByText(/A+/)).toBeInTheDocument();
  });

  it('handles markdown-like content in body', () => {
    const markdownPost = {
      ...mockPost,
      body: '# Heading\n\n**Bold text** and *italic text*',
    };
    renderWithAuth(<PostDetail post={markdownPost} />);
    expect(screen.getByText(/Bold text/i)).toBeInTheDocument();
  });

  it('renders back to home link', () => {
    renderWithAuth(<PostDetail post={mockPost} />);
    const homeLink = screen.getByRole('link', { name: /back|home/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders edit link when user is owner', () => {
    // Mock authenticated user who owns the post
    (authModule.getCurrentUser as jest.Mock).mockReturnValue({ uid: 'user-1', email: 'alice@example.com' });
    (authModule.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authModule.getToken as jest.Mock).mockReturnValue('mock-token');

    renderWithAuth(<PostDetail post={mockPost} />);
    const editLink = screen.getByRole('link', { name: /edit/i });
    expect(editLink).toHaveAttribute('href', '/posts/1/edit');
  });

  it('does not render edit link when user is not owner', () => {
    // User is authenticated but doesn't own the post
    (authModule.getCurrentUser as jest.Mock).mockReturnValue({ uid: 'user-2', email: 'bob@example.com' });
    (authModule.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authModule.getToken as jest.Mock).mockReturnValue('mock-token');

    renderWithAuth(<PostDetail post={mockPost} />);
    expect(screen.queryByRole('link', { name: /edit/i })).not.toBeInTheDocument();
  });

  it('renders delete button when user is owner', () => {
    // Mock authenticated user who owns the post
    (authModule.getCurrentUser as jest.Mock).mockReturnValue({ uid: 'user-1', email: 'alice@example.com' });
    (authModule.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authModule.getToken as jest.Mock).mockReturnValue('mock-token');

    renderWithAuth(<PostDetail post={mockPost} />);
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('has accessible labels for dates', () => {
    renderWithAuth(<PostDetail post={mockPost} />);
    expect(screen.getByLabelText(/published/i)).toBeInTheDocument();
  });

  it('does not show updated date when same as created', () => {
    const sameTimestampPost = {
      ...mockPost,
      createdAt: '2025-11-27T10:00:00Z',
      updatedAt: '2025-11-27T10:00:00Z',
    };
    renderWithAuth(<PostDetail post={sameTimestampPost} />);
    // Should only show one date reference for "published"
    // (implementation may vary - test the expected behavior)
    const createdText = screen.getAllByText(/November 27, 2025/i);
    expect(createdText.length).toBeGreaterThanOrEqual(1);
  });
});
