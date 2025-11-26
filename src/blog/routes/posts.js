/**
 * Posts Routes
 * 
 * CRUD endpoints for blog posts.
 * Provides POST, GET (list and single), PATCH, and DELETE operations.
 */

import { PostService } from '../services/post-service.js';
import { createPostSchema, updatePostSchema, postSchema } from '../models/post.js';

/**
 * Register posts routes
 * @param {Object} fastify - Fastify instance
 */
export async function postsRoutes(fastify) {
  // Initialize PostService with storage adapter
  const postService = new PostService(fastify.storage);

  // POST /posts - Create a new post
  fastify.post('/posts', {
    schema: {
      description: 'Create a new blog post',
      tags: ['posts'],
      body: createPostSchema,
      response: {
        201: postSchema
      }
    }
  }, async (request, reply) => {
    const post = await postService.createPost(request.body);
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

  // PATCH /posts/:id - Update an existing post
  fastify.patch('/posts/:id', {
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
    const post = await postService.updatePost(request.params.id, request.body);
    return post;
  });

  // DELETE /posts/:id - Delete a post
  fastify.delete('/posts/:id', {
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
    await postService.deletePost(request.params.id);
    reply.code(204).send();
  });
}
