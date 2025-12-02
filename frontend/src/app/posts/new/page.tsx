/**
 * Create New Post Page
 * Renders PostForm in create mode for adding new blog posts
 */

import type { Metadata } from 'next';
import PostForm from '@/components/PostForm';

export const metadata: Metadata = {
  title: 'Create New Post | Blog',
  description: 'Create a new blog post with a title and content.',
};

export default function CreatePostPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Create New Post
        </h1>
        <p className="text-gray-600">
          Share your thoughts with the world. Fill in the title and content below.
        </p>
      </header>

      {/* Post Form */}
      <PostForm />
    </main>
  );
}
