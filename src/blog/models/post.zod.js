/**
 * Post Zod Validation Schemas
 * 
 * Type-safe validation schemas for post operations.
 * Replaces JSON Schema validation with Zod for better error messages
 * and type inference.
 */

import { z } from 'zod';

/**
 * Post validation constants
 */
export const POST_VALIDATION = {
  title: {
    minLength: 1,
    maxLength: 200,
  },
  body: {
    minLength: 1,
    maxLength: 50000,
  },
};

/**
 * Non-whitespace regex pattern
 * Ensures the string contains at least one non-whitespace character
 */
const nonWhitespacePattern = /\S/;

/**
 * Schema for creating a new post
 * Validates title and body fields with appropriate constraints
 */
export const createPostSchema = z.object({
  title: z.string()
    .min(POST_VALIDATION.title.minLength, 'Title is required')
    .max(POST_VALIDATION.title.maxLength, `Title must be ${POST_VALIDATION.title.maxLength} characters or less`)
    .regex(nonWhitespacePattern, 'Title must contain non-whitespace characters'),
  body: z.string()
    .min(POST_VALIDATION.body.minLength, 'Body is required')
    .max(POST_VALIDATION.body.maxLength, `Body must be ${POST_VALIDATION.body.maxLength} characters or less`)
    .regex(nonWhitespacePattern, 'Body must contain non-whitespace characters'),
}).strict(); // Disallow additional properties

/**
 * Schema for updating an existing post
 * At least one field must be provided
 */
export const updatePostSchema = z.object({
  title: z.string()
    .min(POST_VALIDATION.title.minLength, 'Title cannot be empty')
    .max(POST_VALIDATION.title.maxLength, `Title must be ${POST_VALIDATION.title.maxLength} characters or less`)
    .regex(nonWhitespacePattern, 'Title must contain non-whitespace characters')
    .optional(),
  body: z.string()
    .min(POST_VALIDATION.body.minLength, 'Body cannot be empty')
    .max(POST_VALIDATION.body.maxLength, `Body must be ${POST_VALIDATION.body.maxLength} characters or less`)
    .regex(nonWhitespacePattern, 'Body must contain non-whitespace characters')
    .optional(),
}).strict() // Disallow additional properties
  .refine(
    (data) => data.title !== undefined || data.body !== undefined,
    { message: 'At least one field (title or body) must be provided' }
  );

/**
 * Full post schema (for internal use / responses)
 */
export const postSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(POST_VALIDATION.title.maxLength),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  body: z.string().min(1).max(POST_VALIDATION.body.maxLength),
  ownerId: z.string(), // Firebase UID (string)
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Validate create post input
 * @param {unknown} data - Input data to validate
 * @returns {{ success: true, data: { title: string, body: string } } | { success: false, error: z.ZodError }}
 */
export function validateCreatePost(data) {
  return createPostSchema.safeParse(data);
}

/**
 * Validate update post input
 * @param {unknown} data - Input data to validate
 * @returns {{ success: true, data: { title?: string, body?: string } } | { success: false, error: z.ZodError }}
 */
export function validateUpdatePost(data) {
  return updatePostSchema.safeParse(data);
}

/**
 * Format Zod validation errors for API response
 * @param {z.ZodError} error - Zod error object
 * @returns {{ field: string, message: string }[]}
 */
export function formatZodErrors(error) {
  return error.errors.map((err) => ({
    field: err.path.join('.') || 'body',
    message: err.message,
  }));
}
