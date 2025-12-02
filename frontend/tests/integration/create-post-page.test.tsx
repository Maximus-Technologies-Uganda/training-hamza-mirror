/**
 * Integration tests for Create Post page
 * Tests the new post creation workflow
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreatePostPage from '@/app/posts/new/page';

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock API
jest.mock('@/lib/api', () => ({
  createPost: jest.fn(),
  isApiError: jest.fn(() => false),
}));

describe('Create Post Page', () => {
  describe('Rendering', () => {
    it('renders the page heading', () => {
      render(<CreatePostPage />);
      
      expect(screen.getByRole('heading', { level: 1, name: /create new post/i })).toBeInTheDocument();
    });

    it('renders description text', () => {
      render(<CreatePostPage />);
      
      expect(screen.getByText(/share your thoughts with the world/i)).toBeInTheDocument();
    });

    it('renders the PostForm component', () => {
      render(<CreatePostPage />);
      
      // PostForm should render title and body inputs
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/body/i)).toBeInTheDocument();
    });

    it('has create post button', () => {
      render(<CreatePostPage />);
      
      expect(screen.getByRole('button', { name: /create post/i })).toBeInTheDocument();
    });

    it('has cancel button', () => {
      render(<CreatePostPage />);
      
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('Structure', () => {
    it('renders within main element', () => {
      render(<CreatePostPage />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('has header section', () => {
      render(<CreatePostPage />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible heading structure', () => {
      render(<CreatePostPage />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/create new post/i);
    });

    it('form inputs have labels', () => {
      render(<CreatePostPage />);
      
      const titleInput = screen.getByLabelText(/title/i);
      const bodyInput = screen.getByLabelText(/body/i);
      
      expect(titleInput).toHaveAccessibleName();
      expect(bodyInput).toHaveAccessibleName();
    });

    it('buttons are accessible', () => {
      render(<CreatePostPage />);
      
      const createButton = screen.getByRole('button', { name: /create post/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      expect(createButton).toBeEnabled();
      expect(cancelButton).toBeEnabled();
    });
  });
});
