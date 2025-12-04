/**
 * Firestore Storage Adapter
 *
 * Implements the StorageAdapter interface using Firestore (native REST API).
 * Provides durable persistence suitable for Cloud Run with Workload Identity.
 */

import { StorageAdapter } from './storage-adapter.js';
import { generateSlug } from '../services/slug-generator.js';

// Firestore REST endpoints
const METADATA_TOKEN_URL = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token';

async function fetchAccessToken() {
  const response = await fetch(METADATA_TOKEN_URL, {
    headers: { 'Metadata-Flavor': 'Google' }
  });

  if (!response.ok) {
    throw new Error(`Failed to retrieve access token: ${response.statusText}`);
  }

  const data = await response.json();
  return { token: data.access_token, expiresAt: Date.now() + (data.expires_in * 1000) - 60000 };
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
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/${this.collection}`;
    this.tokenCache = { token: null, expiresAt: 0 };
  }

  async authorizedFetch(url, options = {}) {
    if (!this.tokenCache.token || Date.now() >= this.tokenCache.expiresAt) {
      this.tokenCache = await fetchAccessToken();
    }

    const { query, allowNotFound = false, ...rest } = options;
    const queryString = query && Array.isArray(query) && query.length > 0
      ? `?${query.map(q => `updateMask.fieldPaths=${encodeURIComponent(q)}`).join('&')}`
      : '';
    const requestUrl = `${url}${queryString}`;

    const headers = {
      'Authorization': `Bearer ${this.tokenCache.token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const response = await fetch(requestUrl, { ...rest, headers });
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
        createdAt: { stringValue: post.createdAt },
        updatedAt: { stringValue: post.updatedAt }
      }
    };
  }

  fromFirestoreDocument(doc) {
    const fields = doc?.fields || {};
    return {
      id: parseInt(fields.id?.integerValue ?? '0', 10),
      title: fields.title?.stringValue ?? '',
      slug: fields.slug?.stringValue ?? '',
      body: fields.body?.stringValue ?? '',
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

    const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents:runQuery`;
    const response = await this.authorizedFetch(url, { method: 'POST', body: JSON.stringify(queryBody) });
    const match = response.find(r => r.document)?.document;
    return match ? this.fromFirestoreDocument(match) : null;
  }

  async getNextId() {
    // Use a counter document with optimistic locking for atomic ID generation
    const counterUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/counters/posts`;
    
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Try to read the current counter
        const counterDoc = await this.authorizedFetch(counterUrl, { allowNotFound: true });
        
        if (!counterDoc) {
          // Counter doesn't exist, create it with ID 1
          // Use currentDocument.exists=false precondition to ensure atomicity
          const createUrl = `${counterUrl}?currentDocument.exists=false`;
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
            // Another request created it first, retry
            if (err.code === 409) continue;
            throw err;
          }
        }
        
        // Counter exists, increment it atomically using updateTime precondition
        const currentNextId = parseInt(counterDoc.fields?.nextId?.integerValue ?? '1', 10);
        const updateTime = counterDoc.updateTime;
        const updateUrl = `${counterUrl}?currentDocument.updateTime=${encodeURIComponent(updateTime)}`;
        
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
          // Concurrent modification, retry
          if (err.code === 409) continue;
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
    const slug = postData.slug ?? generateSlug(postData.title);

    const existing = await this.findBySlug(slug);
    if (existing) {
      const error = new Error('UNIQUE constraint failed: posts.slug');
      error.code = 'SQLITE_CONSTRAINT_UNIQUE';
      throw error;
    }

    const now = new Date().toISOString();
    const nextId = await this.getNextId();
    const post = {
      id: nextId,
      title: postData.title,
      slug,
      body: postData.body,
      createdAt: now,
      updatedAt: now
    };

    const url = `${this.baseUrl}?documentId=${nextId}`;
    const response = await this.authorizedFetch(url, {
      method: 'POST',
      body: JSON.stringify(this.toFirestoreDocument(post))
    });
    return this.fromFirestoreDocument(response);
  }

  async getAllPosts() {
    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: this.collection }],
        orderBy: [{
          field: { fieldPath: 'id' },
          direction: 'ASCENDING'
        }]
      }
    };

    const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents:runQuery`;
    const response = await this.authorizedFetch(url, { method: 'POST', body: JSON.stringify(queryBody) });
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

    if (nextSlug !== currentPost.slug) {
      const existing = await this.findBySlug(nextSlug);
      if (existing && existing.id !== id) {
        const error = new Error('UNIQUE constraint failed: posts.slug');
        error.code = 'SQLITE_CONSTRAINT_UNIQUE';
        throw error;
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
    const deleted = await this.authorizedFetch(url, { method: 'DELETE', allowNotFound: true });
    if (deleted === null) {
      return false;
    }
    return true;
  }
}
