/**
 * Auth Service
 * 
 * Handles JWT token signing and verification.
 * Integrates with @fastify/jwt plugin registered on the Fastify instance.
 */

/**
 * Token expiration time in seconds (24 hours)
 */
const TOKEN_EXPIRY = '24h';

export class AuthService {
  /**
   * @param {import('fastify').FastifyInstance} fastify - Fastify instance with jwt plugin
   */
  constructor(fastify) {
    this.fastify = fastify;
  }

  /**
   * Sign a JWT token for a user
   * @param {Object} user - User object
   * @param {number} user.id - User ID
   * @param {string} user.username - Username
   * @returns {string} Signed JWT token
   */
  signToken(user) {
    return this.fastify.jwt.sign(
      {
        id: user.id,
        username: user.username
      },
      { expiresIn: TOKEN_EXPIRY }
    );
  }

  /**
   * Verify a JWT token
   * @param {string} token - JWT token to verify
   * @returns {Promise<Object>} Decoded token payload
   * @throws {Error} If token is invalid or expired
   */
  async verifyToken(token) {
    return await this.fastify.jwt.verify(token);
  }

  /**
   * Decode a JWT token without verification (for client-side checks)
   * @param {string} token - JWT token to decode
   * @returns {Object|null} Decoded token payload or null if invalid
   */
  decodeToken(token) {
    try {
      return this.fastify.jwt.decode(token);
    } catch {
      return null;
    }
  }
}
