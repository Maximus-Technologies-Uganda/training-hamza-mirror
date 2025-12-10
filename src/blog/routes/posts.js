/**
 * Posts Routes
 * 
 * CRUD endpoints for blog posts.
 * Provides POST, GET (list and single), PATCH, and DELETE operations.
 */

import { PostService } from '../services/post-service.js';
import { createPostSchema, updatePostSchema, postSchema } from '../models/post.js';
import { validateCreatePost, formatZodErrors } from '../models/post.zod.js';
import { ValidationError } from '../middleware/error-handler.js';
import { AuditTargetType, AuditAction } from '../services/audit-service.js';

/**
 * Register posts routes
 * @param {Object} fastify - Fastify instance
 */
export async function postsRoutes(fastify) {
  // Initialize PostService with storage adapter
  const postService = new PostService(fastify.storage);

  // POST /posts - Create a new post (requires authentication, CSRF protection, with audit logging and mutation rate limiting)
  fastify.post('/posts', {
    config: {
      rateLimit: fastify.mutationRateLimitConfig
    },
    preHandler: [
      fastify.verifyFirebaseToken,
      fastify.requireCSRF
    ],
    schema: {
      description: 'Create a new blog post',
      tags: ['posts'],
      body: createPostSchema,
      response: {
        201: postSchema
      }
    }
  }, async (request, reply) => {
    // Validate input with Zod
    const validationResult = validateCreatePost(request.body);
    if (!validationResult.success) {
      const zodErrors = formatZodErrors(validationResult.error);
      const message = zodErrors.map(({ field, message }) => `${field}: ${message}`).join(', ');
      throw new ValidationError(message, null, zodErrors);
    }

    // Extract user UID from Firebase token for ownership
    const ownerId = request.firebaseUser.uid;
    
    // Create post
    const post = await postService.createPost({ 
      ...validationResult.data, 
      ownerId 
    });
    
    // Log audit entry for post creation
    request.auditCreate(
      AuditTargetType.POST,
      post.id,
      { title: post.title, slug: post.slug }
    );
    
    reply.code(201).send(post);
  });

  // GET /posts - List all posts
  fastify.get('/posts', {
    schema: {
      description: 'Retrieve all blog posts',
      tags: ['posts'],
      response: {
        200: {
          type: 'array',
          items: postSchema
        }
      }
    }
  }, async (request, reply) => {
    const posts = await postService.getAllPosts();
    return posts;
  });

  // GET /posts/:id - Get a single post by ID
  fastify.get('/posts/:id', {
    schema: {
      description: 'Retrieve a single blog post by ID',
      tags: ['posts'],
      params: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            minimum: 1,
            description: 'Post ID'
          }
        },
        required: ['id']
      },
      response: {
        200: postSchema
      }
    }
  }, async (request, reply) => {
    const post = await postService.getPostById(request.params.id);
    return post;
  });

  // PATCH /posts/:id - Update an existing post (requires authentication, ownership or admin, CSRF protection, with audit logging and mutation rate limiting)
  fastify.patch('/posts/:id', {
    config: {
      rateLimit: fastify.mutationRateLimitConfig
    },
    preHandler: [
      fastify.verifyFirebaseToken,
      fastify.requireOwnerOrAdmin(async (request) => {
        const post = await postService.getPostById(request.params.id);
        return post?.ownerId;
      }),
      fastify.requireCSRF
    ],
    schema: {
      description: 'Update an existing blog post',
      tags: ['posts'],
      params: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            minimum: 1,
            description: 'Post ID'
          }
        },
        required: ['id']
      },
      body: updatePostSchema,
      response: {
        200: postSchema
      }
    }
  }, async (request, reply) => {
    // Get post before update for audit logging
    const postId = request.params.id;
    const beforePost = await postService.getPostById(postId);
    
    if (!beforePost) {
      return reply.code(404).send({ message: 'Not Found' });
    }
    
    // Update post (ownership already verified by middleware)
    const updatedPost = await postService.updatePost(postId, request.body);
    
    // Log audit entry for post update
    request.auditUpdate(
      AuditTargetType.POST,
      postId,
      { title: beforePost.title, body: beforePost.body },
      { title: updatedPost.title, body: updatedPost.body }
    );
    
    return updatedPost;
  });

  // DELETE /posts/:id - Delete a post (requires authentication, ownership or admin, CSRF protection, with audit logging and mutation rate limiting)
  fastify.delete('/posts/:id', {
    config: {
      rateLimit: fastify.mutationRateLimitConfig
    },
    preHandler: [
      fastify.verifyFirebaseToken,
      fastify.requireOwnerOrAdmin(async (request) => {
        const post = await postService.getPostById(request.params.id);
        return post?.ownerId;
      }),
      fastify.requireCSRF
    ],
    schema: {
      description: 'Delete a blog post',
      tags: ['posts'],
      params: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            minimum: 1,
            description: 'Post ID'
          }
        },
        required: ['id']
      },
      response: {
        204: {
          type: 'null',
          description: 'No Content'
        }
      }
    }
  }, async (request, reply) => {
    const postId = request.params.id;
    
    // Get post before deletion for audit logging
    const post = await postService.getPostById(postId);
    
    if (!post) {
      return reply.code(404).send({ message: 'Not Found' });
    }
    
    // Delete post (ownership already verified by middleware)
    await postService.deletePost(postId);
    
    // Log audit entry for post deletion
    request.auditDelete(
      AuditTargetType.POST,
      postId,
      { title: post.title, slug: post.slug }
    );
    
    reply.code(204).send();
  });
}
