/**
 * Zod Validation Utilities for Fastify
 * 
 * Provides utilities to integrate Zod validation schemas with Fastify routes.
 * Creates preHandler functions that validate request body/query/params against Zod schemas.
 */

import { ValidationError } from './error-handler.js';
import { formatZodErrors } from '../models/post.zod.js';

/**
 * Create a preHandler that validates request body against a Zod schema
 * 
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Fastify preHandler function
 * 
 * @example
 * // In route definition:
 * {
 *   preHandler: [validateBody(createPostSchema)],
 *   handler: async (request, reply) => {
 *     // request.body is now validated
 *   }
 * }
 */
export function validateBody(schema) {
  return async function zodValidateBody(request, reply) {
    const result = schema.safeParse(request.body);
    
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      const errorMessage = errors.map(e => `${e.field}: ${e.message}`).join(', ');
      
      // Attach validation details to the error for the error handler
      const error = new ValidationError(errorMessage);
      error.validationErrors = errors;
      throw error;
    }
    
    // Replace body with parsed/transformed data (handles defaults, coercion, etc.)
    request.body = result.data;
  };
}

/**
 * Create a preHandler that validates query parameters against a Zod schema
 * 
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Fastify preHandler function
 */
export function validateQuery(schema) {
  return async function zodValidateQuery(request, reply) {
    const result = schema.safeParse(request.query);
    
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      const errorMessage = errors.map(e => `${e.field}: ${e.message}`).join(', ');
      
      const error = new ValidationError(errorMessage);
      error.validationErrors = errors;
      throw error;
    }
    
    request.query = result.data;
  };
}

/**
 * Create a preHandler that validates URL parameters against a Zod schema
 * 
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Fastify preHandler function
 */
export function validateParams(schema) {
  return async function zodValidateParams(request, reply) {
    const result = schema.safeParse(request.params);
    
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      const errorMessage = errors.map(e => `${e.field}: ${e.message}`).join(', ');
      
      const error = new ValidationError(errorMessage);
      error.validationErrors = errors;
      throw error;
    }
    
    request.params = result.data;
  };
}

/**
 * Validate data against a Zod schema and throw ValidationError if invalid
 * Useful for validating within route handlers
 * 
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {unknown} data - Data to validate
 * @returns {T} Parsed/validated data
 * @throws {ValidationError} If validation fails
 * @template T
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = formatZodErrors(result.error);
    const errorMessage = errors.map(e => `${e.field}: ${e.message}`).join(', ');
    
    const error = new ValidationError(errorMessage);
    error.validationErrors = errors;
    throw error;
  }
  
  return result.data;
}

/**
 * Safe validation - returns result instead of throwing
 * 
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {unknown} data - Data to validate
 * @returns {{ success: true, data: T } | { success: false, errors: Array<{field: string, message: string}> }}
 * @template T
 */
export function safeValidate(schema, data) {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false,
      errors: formatZodErrors(result.error),
    };
  }
  
  return {
    success: true,
    data: result.data,
  };
}
