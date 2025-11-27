/**
 * Slug Generator Service
 * 
 * Generates URL-friendly slugs from post titles using the slugify library.
 */

import slugify from 'slugify';

/**
 * Generate a URL-friendly slug from a title
 * @param {string} title - Post title
 * @returns {string} URL-friendly slug
 * 
 * @example
 * generateSlug('Hello World') // 'hello-world'
 * generateSlug('JavaScript: The Good Parts') // 'javascript-the-good-parts'
 * generateSlug('C++ Programming') // 'c-programming'
 */
export function generateSlug(title) {
  return slugify(title, {
    lower: true,      // Convert to lowercase
    strict: true,     // Strip special characters
    remove: /[*+~.()'"!:@]/g  // Remove specific punctuation
  });
}
