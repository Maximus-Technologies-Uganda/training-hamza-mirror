/**
 * Firestore Storage Adapter
 *
 * Implements the StorageAdapter interface using Firestore (native REST API).
 * Provides durable persistence suitable for Cloud Run with Workload Identity.
 * 
 * Supports local development via Firestore Emulator:
 *   Set FIRESTORE_EMULATOR_HOST=localhost:8080 to use the emulator.
 */

import { StorageAdapter } from './storage-adapter.js';
import { generateSlug } from '../services/slug-generator.js';

/**
 * Sentinel value for legacy posts that predate the ownership feature.
 * These posts cannot be modified by regular users until they are migrated.
 * Using -1 distinguishes legacy posts from invalid data (0) and valid users (>0).
 */
export const LEGACY_OWNER_ID = -1;

// Firestore REST endpoints
const METADATA_TOKEN_URL = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token';

// Timeout for metadata server requests (5 seconds) - fail fast if not running on GCP
const METADATA_TIMEOUT_MS = parseInt(process.env.FIRESTORE_METADATA_TIMEOUT_MS || '5000', 10);

// Firestore Emulator support
const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;

/**
 * Check if running with Firestore emulator
 */
function isEmulatorMode() {
  return Boolean(FIRESTORE_EMULATOR_HOST);
}

/**
 * Fetch access token from GCP metadata server with timeout.
 * Fails fast with AbortController if metadata server is unreachable (e.g., running outside GCP).
 * Returns null when running in emulator mode (no auth needed).
 */
async function fetchAccessToken() {
  // Emulator mode - no authentication needed
  if (isEmulatorMode()) {
    return { token: 'emulator-token', expiresAt: Date.now() + 3600000 };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), METADATA_TIMEOUT_MS);

  try {
    const response = await fetch(METADATA_TOKEN_URL, {
      headers: { 'Metadata-Flavor': 'Google' },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Failed to retrieve access token: ${response.statusText}`);
    }

    const data = await response.json();
    return { token: data.access_token, expiresAt: Date.now() + (data.expires_in * 1000) - 60000 };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(
        `Metadata server timeout after ${METADATA_TIMEOUT_MS}ms. ` +
        'Firestore storage requires running on GCP with Workload Identity, ' +
        'or set FIRESTORE_EMULATOR_HOST=localhost:8080 for local development with emulator, ' +
        'or set STORAGE_TYPE to "memory" or "sqlite" for local development.'
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export class FirestoreStorage extends StorageAdapter {
  /**
   * @param {Object} options
   * @param {string} options.projectId - GCP project ID
   * @param {string} [options.collection='posts'] - Firestore collection name
   */
  constructor({ projectId, collection = 'posts' }) {
    super();
    this.projectId = projectId;
    this.collection = collection;
    this.isEmulator = isEmulatorMode();
    
    // Use emulator URL if FIRESTORE_EMULATOR_HOST is set
    if (this.isEmulator) {
      const emulatorHost = FIRESTORE_EMULATOR_HOST.startsWith('http') 
        ? FIRESTORE_EMULATOR_HOST 
        : `http://${FIRESTORE_EMULATOR_HOST}`;
      this.documentsBaseUrl = `${emulatorHost}/v1/projects/${this.projectId}/databases/(default)/documents`;
    } else {
      this.documentsBaseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
    }
    this.baseUrl = `${this.documentsBaseUrl}/${this.collection}`;
    this.queryUrl = `${this.documentsBaseUrl}:runQuery`;
    this.tokenCache = { token: null, expiresAt: 0 };
  }

  async authorizedFetch(url, options = {}) {
    if (!this.tokenCache.token || Date.now() >= this.tokenCache.expiresAt) {
      this.tokenCache = await fetchAccessToken();
    }

    const { query, allowNotFound = false, timeout = 30000, ...rest } = options;
    const queryString = query && Array.isArray(query) && query.length > 0
      ? `?${query.map(q => `updateMask.fieldPaths=${encodeURIComponent(q)}`).join('&')}`
      : '';
    const requestUrl = `${url}${queryString}`;

    // Emulator doesn't require Authorization header
    const headers = {
      ...(this.isEmulator ? {} : { 'Authorization': `Bearer ${this.tokenCache.token}` }),
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    // Add timeout via AbortController to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let response;
    try {
      response = await fetch(requestUrl, { ...rest, headers, signal: controller.signal });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Firestore request timeout after ${timeout}ms: ${url}`);
      }
      throw error;
    }
    clearTimeout(timeoutId);
    if (response.status === 404 && allowNotFound) {
      return null;
    }

    if (!response.ok) {
      const body = await response.text();
      const error = new Error(`Firestore request failed: ${response.status} ${response.statusText} - ${body}`);
      error.code = response.status;
      throw error;
    }
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  toFirestoreDocument(post) {
    return {
      fields: {
        id: { integerValue: String(post.id) },
        title: { stringValue: post.title },
        slug: { stringValue: post.slug },
        body: { stringValue: post.body },
        ownerId: { integerValue: String(post.ownerId) },
        createdAt: { stringValue: post.createdAt },
        updatedAt: { stringValue: post.updatedAt }
      }
    };
  }

  fromFirestoreDocument(doc) {
    const fields = doc?.fields || {};
    // For legacy posts without ownerId, use LEGACY_OWNER_ID (-1) sentinel value.
    // This distinguishes legacy posts from invalid data and marks them as protected.
    const rawOwnerId = fields.ownerId?.integerValue;
    const ownerId = rawOwnerId !== undefined && rawOwnerId !== null
      ? parseInt(rawOwnerId, 10)
      : LEGACY_OWNER_ID;
    return {
      id: parseInt(fields.id?.integerValue ?? '0', 10),
      title: fields.title?.stringValue ?? '',
      slug: fields.slug?.stringValue ?? '',
      body: fields.body?.stringValue ?? '',
      ownerId,
      createdAt: fields.createdAt?.stringValue ?? '',
      updatedAt: fields.updatedAt?.stringValue ?? ''
    };
  }

  async findBySlug(slug) {
    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: this.collection }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'slug' },
            op: 'EQUAL',
            value: { stringValue: slug }
          }
        },
        limit: 1
      }
    };

    const response = await this.authorizedFetch(this.queryUrl, { method: 'POST', body: JSON.stringify(queryBody) });
    const match = response.find(r => r.document)?.document;
    return match ? this.fromFirestoreDocument(match) : null;
  }

  async getNextId() {
    // Use a counter document with optimistic locking for atomic ID generation
    const counterUrl = `${this.documentsBaseUrl}/counters/posts`;
    
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Try to read the current counter
        const counterDoc = await this.authorizedFetch(counterUrl, { allowNotFound: true });
        
        if (!counterDoc) {
          // Counter doesn't exist, create it with ID 1
          // In emulator mode, skip preconditions as they behave differently
          const createUrl = this.isEmulator
            ? counterUrl
            : `${counterUrl}?currentDocument.exists=false`;
          try {
            await this.authorizedFetch(createUrl, {
              method: 'PATCH',
              body: JSON.stringify({
                fields: {
                  nextId: { integerValue: '2' }
                }
              })
            });
            return 1;
          } catch (err) {
            // 409 Conflict or 400 FAILED_PRECONDITION means concurrent create
            if (err.code === 409 || err.code === 400) continue;
            throw err;
          }
        }
        
        // Counter exists, increment it atomically using updateTime precondition
        const currentNextId = parseInt(counterDoc.fields?.nextId?.integerValue ?? '1', 10);
        
        // In emulator mode, skip updateTime preconditions as they behave differently
        const updateUrl = this.isEmulator
          ? counterUrl
          : `${counterUrl}?currentDocument.updateTime=${encodeURIComponent(counterDoc.updateTime)}`;
        
        try {
          await this.authorizedFetch(updateUrl, {
            method: 'PATCH',
            body: JSON.stringify({
              fields: {
                nextId: { integerValue: String(currentNextId + 1) }
              }
            })
          });
          return currentNextId;
        } catch (err) {
          // 409 Conflict or 400 FAILED_PRECONDITION means concurrent modification
          if (err.code === 409 || err.code === 400) continue;
          throw err;
        }
      } catch (err) {
        if (attempt === maxRetries - 1) throw err;
        // Small backoff before retry
        await new Promise(resolve => setTimeout(resolve, 10 * (attempt + 1)));
      }
    }
    
    throw new Error('Failed to generate unique ID after maximum retries');
  }

  async createPost(postData) {
    if (postData.ownerId === null || postData.ownerId === undefined) {
      const error = new Error('ownerId is required');
      error.code = 'SQLITE_CONSTRAINT_NOTNULL';
      throw error;
    }

    const slug = postData.slug ?? generateSlug(postData.title);
    const now = new Date().toISOString();
    const nextId = await this.getNextId();
    const post = {
      id: nextId,
      title: postData.title,
      slug,
      body: postData.body,
      ownerId: postData.ownerId,
      createdAt: now,
      updatedAt: now
    };

    // Use slug as the document ID to enforce uniqueness atomically.
    // The precondition currentDocument.exists=false ensures the create fails
    // if a document with this slug already exists, preventing race conditions.
    const slugDocUrl = `${this.documentsBaseUrl}/slugs/${encodeURIComponent(slug)}?currentDocument.exists=false`;
    
    try {
      // First, atomically reserve the slug by creating a slug document
      await this.authorizedFetch(slugDocUrl, {
        method: 'PATCH',
        body: JSON.stringify({
          fields: {
            postId: { integerValue: String(nextId) },
            createdAt: { stringValue: now }
          }
        })
      });
    } catch (err) {
      // 409 Conflict means the slug document already exists (duplicate slug)
      if (err.code === 409) {
        const error = new Error('UNIQUE constraint failed: posts.slug');
        error.code = 'SQLITE_CONSTRAINT_UNIQUE';
        throw error;
      }
      throw err;
    }

    // Slug reserved successfully, now create the actual post document
    try {
      const url = `${this.baseUrl}?documentId=${nextId}`;
      const response = await this.authorizedFetch(url, {
        method: 'POST',
        body: JSON.stringify(this.toFirestoreDocument(post))
      });
      return this.fromFirestoreDocument(response);
    } catch (err) {
      // If post creation fails, clean up the slug reservation
      const cleanupUrl = `${this.documentsBaseUrl}/slugs/${encodeURIComponent(slug)}`;
      try {
        await this.authorizedFetch(cleanupUrl, { method: 'DELETE', allowNotFound: true });
      } catch {
        // Best effort cleanup, ignore errors
      }
      throw err;
    }
  }

  async getAllPosts() {
    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: this.collection }],
        orderBy: [{
          field: { fieldPath: 'createdAt' },
          direction: 'DESCENDING'
        }]
      }
    };

    const response = await this.authorizedFetch(this.queryUrl, { method: 'POST', body: JSON.stringify(queryBody) });
    return response
      .filter(r => r.document)
      .map(r => this.fromFirestoreDocument(r.document));
  }

  async getPostById(id) {
    const url = `${this.baseUrl}/${id}`;
    const response = await this.authorizedFetch(url, { allowNotFound: true });
    if (!response) {
      return null;
    }
    return this.fromFirestoreDocument(response);
  }

  async updatePost(id, updates) {
    const url = `${this.baseUrl}/${id}`;
    const currentDoc = await this.authorizedFetch(url, { allowNotFound: true });
    if (!currentDoc) {
      return null;
    }

    const currentPost = this.fromFirestoreDocument(currentDoc);
    const nextSlug = updates.slug !== undefined
      ? updates.slug
      : (updates.title !== undefined ? generateSlug(updates.title) : currentPost.slug);

    // If slug is changing, atomically reserve the new slug
    if (nextSlug !== currentPost.slug) {
      const slugDocUrl = `${this.documentsBaseUrl}/slugs/${encodeURIComponent(nextSlug)}?currentDocument.exists=false`;
      
      try {
        // Atomically reserve the new slug
        await this.authorizedFetch(slugDocUrl, {
          method: 'PATCH',
          body: JSON.stringify({
            fields: {
              postId: { integerValue: String(id) },
              createdAt: { stringValue: new Date().toISOString() }
            }
          })
        });
      } catch (err) {
        // 409 Conflict means the slug document already exists (duplicate slug)
        if (err.code === 409) {
          const error = new Error('UNIQUE constraint failed: posts.slug');
          error.code = 'SQLITE_CONSTRAINT_UNIQUE';
          throw error;
        }
        throw err;
      }

      // Delete the old slug document
      const oldSlugUrl = `${this.documentsBaseUrl}/slugs/${encodeURIComponent(currentPost.slug)}`;
      try {
        await this.authorizedFetch(oldSlugUrl, { method: 'DELETE', allowNotFound: true });
      } catch {
        // Best effort cleanup, ignore errors
      }
    }

    const updated = {
      ...currentPost,
      ...updates,
      slug: nextSlug,
      updatedAt: new Date().toISOString()
    };

    const fieldMasks = Object.keys(this.toFirestoreDocument(updated).fields);
    await this.authorizedFetch(url, {
      method: 'PATCH',
      body: JSON.stringify(this.toFirestoreDocument(updated)),
      query: fieldMasks
    });

    return updated;
  }

  async deletePost(id) {
    const url = `${this.baseUrl}/${id}`;
    
    // First get the post to find its slug
    const currentDoc = await this.authorizedFetch(url, { allowNotFound: true });
    if (!currentDoc) {
      return false;
    }

    const currentPost = this.fromFirestoreDocument(currentDoc);
    
    // Delete the post document
    await this.authorizedFetch(url, { method: 'DELETE', allowNotFound: true });
    
    // Clean up the slug document
    const slugUrl = `${this.documentsBaseUrl}/slugs/${encodeURIComponent(currentPost.slug)}`;
    try {
      await this.authorizedFetch(slugUrl, { method: 'DELETE', allowNotFound: true });
    } catch {
      // Best effort cleanup, ignore errors
    }
    
    return true;
  }

  // ==================== User Methods ====================

  /**
   * Convert user object to Firestore document format
   */
  toFirestoreUserDocument(user) {
    return {
      fields: {
        id: { integerValue: String(user.id) },
        username: { stringValue: user.username },
        passwordHash: { stringValue: user.passwordHash },
        createdAt: { stringValue: user.createdAt }
      }
    };
  }

  /**
   * Convert Firestore document to user object
   */
  fromFirestoreUserDocument(doc) {
    const fields = doc?.fields || {};
    return {
      id: parseInt(fields.id?.integerValue ?? '0', 10),
      username: fields.username?.stringValue ?? '',
      passwordHash: fields.passwordHash?.stringValue ?? '',
      createdAt: fields.createdAt?.stringValue ?? ''
    };
  }

  /**
   * Get next user ID atomically
   */
  async getNextUserId() {
    const counterUrl = `${this.documentsBaseUrl}/counters/users`;
    
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const counterDoc = await this.authorizedFetch(counterUrl, { allowNotFound: true });
        
        if (!counterDoc) {
          // Counter doesn't exist, create it
          // In emulator mode, skip preconditions as they behave differently
          const createUrl = this.isEmulator 
            ? counterUrl 
            : `${counterUrl}?currentDocument.exists=false`;
          try {
            await this.authorizedFetch(createUrl, {
              method: 'PATCH',
              body: JSON.stringify({
                fields: {
                  nextId: { integerValue: '2' }
                }
              })
            });
            return 1;
          } catch (err) {
            // 409 Conflict or 400 FAILED_PRECONDITION means concurrent create
            if (err.code === 409 || err.code === 400) continue;
            throw err;
          }
        }
        
        const currentNextId = parseInt(counterDoc.fields?.nextId?.integerValue ?? '1', 10);
        
        // In emulator mode, skip updateTime preconditions as they behave differently
        const updateUrl = this.isEmulator
          ? counterUrl
          : `${counterUrl}?currentDocument.updateTime=${encodeURIComponent(counterDoc.updateTime)}`;
        
        try {
          await this.authorizedFetch(updateUrl, {
            method: 'PATCH',
            body: JSON.stringify({
              fields: {
                nextId: { integerValue: String(currentNextId + 1) }
              }
            })
          });
          return currentNextId;
        } catch (err) {
          // 409 Conflict or 400 FAILED_PRECONDITION means concurrent modification
          if (err.code === 409 || err.code === 400) continue;
          throw err;
        }
      } catch (err) {
        if (attempt === maxRetries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, 10 * (attempt + 1)));
      }
    }
    
    throw new Error('Failed to generate unique user ID after maximum retries');
  }

  /**
   * Create a new user
   * @param {Object} userData - User data containing username and passwordHash
   * @returns {Promise<Object>} Created user with id and timestamps
   */
  async createUser(userData) {
    const now = new Date().toISOString();
    const nextId = await this.getNextUserId();
    
    const user = {
      id: nextId,
      username: userData.username,
      passwordHash: userData.passwordHash,
      createdAt: now
    };

    // Use username as the document ID to enforce uniqueness atomically
    const usernameDocUrl = `${this.documentsBaseUrl}/usernames/${encodeURIComponent(userData.username)}?currentDocument.exists=false`;
    
    try {
      // Atomically reserve the username
      await this.authorizedFetch(usernameDocUrl, {
        method: 'PATCH',
        body: JSON.stringify({
          fields: {
            userId: { integerValue: String(nextId) },
            createdAt: { stringValue: now }
          }
        })
      });
    } catch (err) {
      if (err.code === 409) {
        const error = new Error('UNIQUE constraint failed: users.username');
        error.code = 'SQLITE_CONSTRAINT_UNIQUE';
        throw error;
      }
      throw err;
    }

    // Username reserved, now create the user document
    try {
      const usersBaseUrl = `${this.documentsBaseUrl}/users`;
      const url = `${usersBaseUrl}?documentId=${nextId}`;
      const response = await this.authorizedFetch(url, {
        method: 'POST',
        body: JSON.stringify(this.toFirestoreUserDocument(user))
      });
      return this.fromFirestoreUserDocument(response);
    } catch (err) {
      // Clean up username reservation on failure
      const cleanupUrl = `${this.documentsBaseUrl}/usernames/${encodeURIComponent(userData.username)}`;
      try {
        await this.authorizedFetch(cleanupUrl, { method: 'DELETE', allowNotFound: true });
      } catch {
        // Best effort cleanup
      }
      throw err;
    }
  }

  /**
   * Retrieve a user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async getUser(id) {
    const url = `${this.documentsBaseUrl}/users/${id}`;
    const response = await this.authorizedFetch(url, { allowNotFound: true });
    if (!response) {
      return null;
    }
    return this.fromFirestoreUserDocument(response);
  }

  /**
   * Retrieve a user by username
   * @param {string} username - Username to search for
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async getUserByUsername(username) {
    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: 'users' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'username' },
            op: 'EQUAL',
            value: { stringValue: username }
          }
        },
        limit: 1
      }
    };

    const response = await this.authorizedFetch(this.queryUrl, { method: 'POST', body: JSON.stringify(queryBody) });
    const match = response.find(r => r.document)?.document;
    return match ? this.fromFirestoreUserDocument(match) : null;
  }

  /**
   * Determine whether any user documents exist
   * @returns {Promise<boolean>} true if at least one user exists
   */
  async hasAnyUsers() {
    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: 'users' }],
        limit: 1
      }
    };

    const response = await this.authorizedFetch(this.queryUrl, { method: 'POST', body: JSON.stringify(queryBody) });
    return response.some(result => Boolean(result.document));
  }
}
