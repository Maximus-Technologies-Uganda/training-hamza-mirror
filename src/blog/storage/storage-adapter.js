/**
 * Storage Adapter Interface
 * 
 * Defines the contract for all storage implementations (in-memory, SQLite, etc.)
 * All adapters must implement these methods to ensure swappable persistence.
 */

export class StorageAdapter {
  /**
   * Create a new post
   * @param {Object} postData - Post data containing title and body
   * @param {string} postData.title - Post title
   * @param {string} postData.body - Post content
   * @returns {Promise<Object>} Created post with generated fields (id, slug, timestamps)
   */
  async createPost(postData) {
    throw new Error('createPost() must be implemented by storage adapter');
  }

  /**
   * Retrieve all posts
   * @returns {Promise<Array>} Array of all posts (empty array if none exist)
   */
  async getAllPosts() {
    throw new Error('getAllPosts() must be implemented by storage adapter');
  }

  /**
   * Retrieve a single post by ID
   * @param {number} id - Post ID
   * @returns {Promise<Object|null>} Post object or null if not found
   */
  async getPostById(id) {
    throw new Error('getPostById() must be implemented by storage adapter');
  }

  /**
   * Update an existing post
   * @param {number} id - Post ID
   * @param {Object} updates - Fields to update
   * @param {string} [updates.title] - New title
   * @param {string} [updates.body] - New body
   * @returns {Promise<Object|null>} Updated post or null if not found
   */
  async updatePost(id, updates) {
    throw new Error('updatePost() must be implemented by storage adapter');
  }

  /**
   * Delete a post
   * @param {number} id - Post ID
   * @returns {Promise<boolean>} true if deleted, false if not found
   */
  async deletePost(id) {
    throw new Error('deletePost() must be implemented by storage adapter');
  }

  // ==================== User Methods ====================

  /**
   * Create a new user
   * @param {Object} userData - User data containing username and passwordHash
   * @param {string} userData.username - Unique username
   * @param {string} userData.passwordHash - bcrypt hashed password
   * @returns {Promise<Object>} Created user with id and timestamps
   */
  async createUser(userData) {
    throw new Error('createUser() must be implemented by storage adapter');
  }

  /**
   * Retrieve a user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async getUser(id) {
    throw new Error('getUser() must be implemented by storage adapter');
  }

  /**
   * Retrieve a user by username
   * @param {string} username - Username to search for
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async getUserByUsername(username) {
    throw new Error('getUserByUsername() must be implemented by storage adapter');
  }

  /**
   * Determine if at least one user exists
   * @returns {Promise<boolean>} true when any user is present, false otherwise
   */
  async hasAnyUsers() {
    throw new Error('hasAnyUsers() must be implemented by storage adapter');
  }
}
