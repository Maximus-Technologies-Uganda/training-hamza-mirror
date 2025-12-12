/**
 * User Entity Model
 * 
 * Defines the User entity structure and validation rules.
 * Used for authentication and post ownership.
 */

/**
 * User validation rules (for JSON Schema)
 */
export const userValidation = {
  username: {
    minLength: 3,
    maxLength: 50,
    // Lowercase alphanumeric, no spaces
    pattern: '^[a-z0-9]+$'
  },
  password: {
    minLength: 1,
    maxLength: 128
  }
};

/**
 * JSON Schema for User entity (complete user object - internal only)
 */
export const userSchema = {
  $id: 'user',
  type: 'object',
  required: ['id', 'username', 'passwordHash', 'createdAt'],
  properties: {
    id: {
      type: 'integer',
      minimum: 1,
      description: 'Unique user identifier'
    },
    username: {
      type: 'string',
      minLength: userValidation.username.minLength,
      maxLength: userValidation.username.maxLength,
      pattern: userValidation.username.pattern,
      description: 'Login identifier (lowercase alphanumeric)'
    },
    passwordHash: {
      type: 'string',
      description: 'bcrypt hash of password (60 characters)'
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'Account creation timestamp (ISO 8601)'
    }
  }
};

/**
 * JSON Schema for public user representation (excludes passwordHash)
 */
export const publicUserSchema = {
  $id: 'publicUser',
  type: 'object',
  required: ['id', 'username'],
  properties: {
    id: {
      type: 'integer',
      minimum: 1,
      description: 'Unique user identifier'
    },
    username: {
      type: 'string',
      minLength: userValidation.username.minLength,
      maxLength: userValidation.username.maxLength,
      description: 'Login identifier'
    }
  }
};

/**
 * JSON Schema for login request
 */
export const loginRequestSchema = {
  $id: 'loginRequest',
  type: 'object',
  required: ['username', 'password'],
  properties: {
    username: {
      type: 'string',
      minLength: userValidation.username.minLength,
      maxLength: userValidation.username.maxLength,
      pattern: userValidation.username.pattern,
      description: 'Username (lowercase alphanumeric, 3-50 characters)'
    },
    password: {
      type: 'string',
      minLength: userValidation.password.minLength,
      maxLength: userValidation.password.maxLength,
      description: 'Password'
    }
  },
  additionalProperties: false
};

/**
 * JSON Schema for login response
 */
export const loginResponseSchema = {
  $id: 'loginResponse',
  type: 'object',
  required: ['token', 'user'],
  properties: {
    token: {
      type: 'string',
      description: 'JWT access token (24-hour expiry)'
    },
    user: {
      $ref: 'publicUser#'
    }
  }
};

/**
 * Create a new user object
 * @param {Object} data - User data
 * @param {number} data.id - User ID
 * @param {string} data.username - Username
 * @param {string} data.passwordHash - bcrypt password hash
 * @returns {Object} User object
 */
export function createUser({ id, username, passwordHash }) {
  return {
    id,
    username,
    passwordHash,
    createdAt: new Date().toISOString()
  };
}

/**
 * Convert user to public representation (exclude sensitive data)
 * @param {Object} user - User object
 * @returns {Object} Public user object
 */
export function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username
  };
}
