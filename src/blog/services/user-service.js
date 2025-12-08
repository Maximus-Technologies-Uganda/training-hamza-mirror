/**
 * User Service
 * 
 * Core business logic for user operations.
 * Handles user lookup, password verification, and test user seeding.
 */

import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const SALT_ROUNDS = 10;

/**
 * Test users to seed in development/test environments
 */
const TEST_USERS = [
  { username: 'alice', password: 'password123' },
  { username: 'bob', password: 'password456' }
];

export class UserService {
  /**
   * @param {StorageAdapter} storage - Storage adapter instance
   */
  constructor(storage) {
    this.storage = storage;
  }

  /**
   * Find a user by username
   * @param {string} username - Username to search for
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async findByUsername(username) {
    return await this.storage.getUserByUsername(username);
  }

  /**
   * Find a user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async findById(id) {
    return await this.storage.getUser(id);
  }

  /**
   * Verify a password against a stored hash
   * @param {string} password - Plain text password
   * @param {string} passwordHash - bcrypt hash to compare against
   * @returns {Promise<boolean>} true if password matches
   */
  async verifyPassword(password, passwordHash) {
    return await bcrypt.compare(password, passwordHash);
  }

  /**
   * Hash a password for storage
   * @param {string} password - Plain text password
   * @returns {Promise<string>} bcrypt hash
   */
  async hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Generate a reasonably strong random password
   * @param {number} length - Desired password length
   * @returns {string} random password string
   */
  generateRandomPassword(length = 24) {
    const raw = randomBytes(Math.ceil(length * 1.5)).toString('base64');
    return raw.replace(/[^a-zA-Z0-9]/g, '').slice(0, length);
  }

  /**
   * Ensure at least one user exists (production bootstrap)
   * @param {Object} options
   * @param {string} [options.username] - Username to seed (defaults to 'admin')
   * @param {string} [options.password] - Password to seed; generates if omitted
   * @param {import('pino').Logger | Console} [options.logger] - Optional logger for notices
   * @returns {Promise<{created: boolean, user?: Object, password?: string, generatedPassword?: boolean, reason?: string}>}
   */
  async ensureAdminUser({ username, password, logger } = {}) {
    const hasUsers = await this.storage.hasAnyUsers();
    if (hasUsers) {
      return { created: false, reason: 'users-exist' };
    }

    const adminUsername = (username || 'admin').trim();
    const passwordProvided = Boolean(password && password.trim().length > 0);
    const adminPassword = passwordProvided ? password : this.generateRandomPassword();

    const passwordHash = await this.hashPassword(adminPassword);

    try {
      const user = await this.storage.createUser({
        username: adminUsername,
        passwordHash
      });

      if (logger) {
        const logContext = { userId: user.id, username: user.username };
        if (!passwordProvided) {
          logger.warn({ ...logContext, password: adminPassword }, 'Generated bootstrap admin user credentials');
        } else {
          logger.info(logContext, 'Created bootstrap admin user from provided credentials');
        }
      }

      return {
        created: true,
        user,
        password: adminPassword,
        generatedPassword: !passwordProvided
      };
    } catch (error) {
      const isUniqueUsername = error.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
        (error.message && error.message.includes('UNIQUE constraint failed'));

      if (isUniqueUsername) {
        return { created: false, reason: 'username-exists' };
      }

      throw error;
    }
  }

  /**
   * Seed test users in development/test environments
   * Creates alice and bob if they don't already exist
   * 
   * IMPORTANT: Only runs when:
   * - SEED_USERS=true environment variable is set, OR
   * - NODE_ENV is explicitly 'development' or 'test'
   * 
   * This prevents accidental seeding in staging or production-like environments.
   * @returns {Promise<void>}
   */
  async seedTestUsers() {
    const env = process.env.NODE_ENV || 'development';
    const seedUsersFlag = process.env.SEED_USERS;
    
    // Only seed if explicitly enabled via SEED_USERS=true OR in development/test
    const allowedEnvironments = ['development', 'test'];
    const explicitlyEnabled = seedUsersFlag === 'true';
    const implicitlyAllowed = allowedEnvironments.includes(env) && seedUsersFlag !== 'false';
    
    if (!explicitlyEnabled && !implicitlyAllowed) {
      console.log(`[SKIP] Test user seeding disabled for environment '${env}' (set SEED_USERS=true to override)`);
      return;
    }
    
    // Extra guard: never seed in production even if SEED_USERS is somehow set
    if (env === 'production') {
      console.warn('[WARN] seedTestUsers called in production - skipping regardless of SEED_USERS flag');
      return;
    }

    for (const testUser of TEST_USERS) {
      try {
        // Check if user already exists
        const existing = await this.storage.getUserByUsername(testUser.username);
        if (existing) {
          console.log(`[OK] Test user '${testUser.username}' already exists (id: ${existing.id})`);
          continue;
        }

        // Create user with hashed password
        const passwordHash = await this.hashPassword(testUser.password);
        const user = await this.storage.createUser({
          username: testUser.username,
          passwordHash
        });

        console.log(`[OK] Created test user '${user.username}' (id: ${user.id})`);
      } catch (error) {
        // Handle race condition where user was created between check and insert
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || 
            (error.message && error.message.includes('UNIQUE constraint failed'))) {
          console.log(`[OK] Test user '${testUser.username}' already exists (race condition)`);
        } else {
          throw error;
        }
      }
    }
  }
}
