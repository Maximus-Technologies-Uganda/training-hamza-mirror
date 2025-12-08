/**
 * Integration tests for Create Post page
 * Tests the new post creation workflow
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreatePostPage from '@/app/posts/new/page';
import { AuthProvider } from '@/components/AuthProvider';

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

// Mock auth functions - authenticated user by default for create page
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(() => ({ id: 1, username: 'alice' })),
  isAuthenticated: jest.fn(() => true),
  getToken: jest.fn(() => 'mock-token'),
  login: jest.fn(),
  logout: jest.fn(),
  getAuthHeaders: jest.fn(() => ({ Authorization: 'Bearer mock-token' })),
}));

// Helper to render with AuthProvider
const renderWithAuth = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      {ui}
    </AuthProvider>
  );
};

describe('Create Post Page', () => {
  describe('Rendering', () => {
    it('renders the page heading', () => {
      renderWithAuth(<CreatePostPage />);
      
      expect(screen.getByRole('heading', { level: 1, name: /create new post/i })).toBeInTheDocument();
    });

    it('renders description text', () => {
      renderWithAuth(<CreatePostPage />);
      
      expect(screen.getByText(/share your thoughts with the world/i)).toBeInTheDocument();
    });

    it('renders the PostForm component', () => {
      renderWithAuth(<CreatePostPage />);
      
      // PostForm should render title and body inputs
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/body/i)).toBeInTheDocument();
    });

    it('has create post button', () => {
      renderWithAuth(<CreatePostPage />);
      
      expect(screen.getByRole('button', { name: /create post/i })).toBeInTheDocument();
    });

    it('has cancel button', () => {
      renderWithAuth(<CreatePostPage />);
      
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('Structure', () => {
    it('renders within main element', () => {
      renderWithAuth(<CreatePostPage />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('has header section', () => {
      renderWithAuth(<CreatePostPage />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible heading structure', () => {
      renderWithAuth(<CreatePostPage />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/create new post/i);
    });

    it('form inputs have labels', () => {
      renderWithAuth(<CreatePostPage />);
      
      const titleInput = screen.getByLabelText(/title/i);
      const bodyInput = screen.getByLabelText(/body/i);
      
      expect(titleInput).toHaveAccessibleName();
      expect(bodyInput).toHaveAccessibleName();
    });

    it('buttons are accessible', () => {
      renderWithAuth(<CreatePostPage />);
      
      const createButton = screen.getByRole('button', { name: /create post/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      expect(createButton).toBeEnabled();
      expect(cancelButton).toBeEnabled();
    });
  });
});
