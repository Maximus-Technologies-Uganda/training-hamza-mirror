/**
 * Post Entity Model
 * 
 * Defines the Post entity structure and validation rules.
 * Used for both storage and API contract validation.
 */

/**
 * Post validation rules (for JSON Schema)
 */
export const postValidation = {
  title: {
    minLength: 1,
    maxLength: 200,
    pattern: '\\S' // Must contain at least one non-whitespace character
  },
  body: {
    minLength: 1,
    maxLength: 50000,
    pattern: '\\S' // Must contain at least one non-whitespace character
  }
};

/**
 * JSON Schema for Post entity (complete post object)
 */
export const postSchema = {
  $id: 'post',
  type: 'object',
  required: ['id', 'title', 'slug', 'body', 'createdAt', 'updatedAt'],
  properties: {
    id: {
      type: 'integer',
      minimum: 1,
      description: 'Unique post identifier'
    },
    title: {
      type: 'string',
      minLength: postValidation.title.minLength,
      maxLength: postValidation.title.maxLength,
      pattern: postValidation.title.pattern,
      description: 'Post title (non-whitespace)'
    },
    slug: {
      type: 'string',
      pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
      description: 'URL-friendly slug'
    },
    body: {
      type: 'string',
      minLength: postValidation.body.minLength,
      maxLength: postValidation.body.maxLength,
      pattern: postValidation.body.pattern,
      description: 'Post content (non-whitespace)'
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'Creation timestamp (ISO 8601)'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'Last update timestamp (ISO 8601)'
    }
  }
};

/**
 * JSON Schema for creating a post (only title and body required)
 */
export const createPostSchema = {
  type: 'object',
  required: ['title', 'body'],
  properties: {
    title: {
      type: 'string',
      minLength: postValidation.title.minLength,
      maxLength: postValidation.title.maxLength,
      pattern: postValidation.title.pattern
    },
    body: {
      type: 'string',
      minLength: postValidation.body.minLength,
      maxLength: postValidation.body.maxLength,
      pattern: postValidation.body.pattern
    }
  },
  additionalProperties: false
};

/**
 * JSON Schema for updating a post (at least one field required)
 */
export const updatePostSchema = {
  type: 'object',
  minProperties: 1,
  properties: {
    title: {
      type: 'string',
      minLength: postValidation.title.minLength,
      maxLength: postValidation.title.maxLength,
      pattern: postValidation.title.pattern
    },
    body: {
      type: 'string',
      minLength: postValidation.body.minLength,
      maxLength: postValidation.body.maxLength,
      pattern: postValidation.body.pattern
    }
  },
  additionalProperties: false
};

/**
 * Validate a post object
 * @param {Object} post - Post data
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
export function validatePost(post) {
  const errors = [];

  // Title validation
  if (!post.title || typeof post.title !== 'string') {
    errors.push('title is required and must be a string');
  } else if (post.title.length < 1 || post.title.length > 200) {
    errors.push('title must be between 1 and 200 characters');
  } else if (!/\S/.test(post.title)) {
    errors.push('title must contain at least one non-whitespace character');
  }

  // Body validation
  if (!post.body || typeof post.body !== 'string') {
    errors.push('body is required and must be a string');
  } else if (post.body.length < 1 || post.body.length > 50000) {
    errors.push('body must be between 1 and 50000 characters');
  } else if (!/\S/.test(post.body)) {
    errors.push('body must contain at least one non-whitespace character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
