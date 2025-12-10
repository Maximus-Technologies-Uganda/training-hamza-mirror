#!/usr/bin/env node
/**
 * Data Migration Script: Assign 'system' owner to ownerless posts
 * 
 * This script migrates existing posts that have no owner (NULL or 0) 
 * to have ownerId = 'system', representing legacy posts created before
 * Firebase Auth integration.
 * 
 * Usage:
 *   node scripts/migrate-posts-owner.mjs [--storage=sqlite|firestore] [--db-path=./data/blog.db]
 * 
 * Examples:
 *   node scripts/migrate-posts-owner.mjs
 *   node scripts/migrate-posts-owner.mjs --storage=sqlite --db-path=./data/blog.db
 *   node scripts/migrate-posts-owner.mjs --storage=firestore
 */

import { parseArgs } from 'node:util';
import Database from 'better-sqlite3';
import { existsSync } from 'fs';
import { Firestore } from '@google-cloud/firestore';

// Parse command-line arguments
const { values } = parseArgs({
  options: {
    storage: {
      type: 'string',
      default: process.env.STORAGE_TYPE || 'sqlite'
    },
    'db-path': {
      type: 'string',
      default: './data/blog.db'
    },
    help: {
      type: 'boolean',
      default: false
    }
  }
});

// Show help if requested
if (values.help) {
  console.log(`
Data Migration Script: Assign 'system' owner to ownerless posts

Usage:
  node scripts/migrate-posts-owner.mjs [options]

Options:
  --storage=TYPE       Storage type (sqlite or firestore, default: sqlite)
  --db-path=PATH       Path to SQLite database (default: ./data/blog.db)
  --help               Show this help message

Examples:
  node scripts/migrate-posts-owner.mjs
  node scripts/migrate-posts-owner.mjs --storage=sqlite --db-path=./data/blog.db
  node scripts/migrate-posts-owner.mjs --storage=firestore
`);
  process.exit(0);
}

/**
 * Migrate SQLite database posts
 * @param {string} dbPath - Path to SQLite database file
 * @returns {Promise<{total: number, migrated: number}>}
 */
async function migrateSQLite(dbPath) {
  if (!existsSync(dbPath)) {
    console.error(`❌ Database file not found: ${dbPath}`);
    process.exit(1);
  }

  console.log(`📂 Opening SQLite database: ${dbPath}`);
  const db = new Database(dbPath);

  try {
    // Check if posts table exists
    const tableExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='posts'"
    ).get();

    if (!tableExists) {
      console.log('⚠️  Posts table does not exist. No migration needed.');
      return { total: 0, migrated: 0 };
    }

    // Check if ownerId column exists
    const columns = db.prepare("PRAGMA table_info(posts)").all();
    const ownerIdColumn = columns.find(col => col.name === 'ownerId');

    if (!ownerIdColumn) {
      console.log('⚠️  ownerId column does not exist. Run database initialization first.');
      return { total: 0, migrated: 0 };
    }

    // Count total posts
    const { total } = db.prepare('SELECT COUNT(*) as total FROM posts').get();
    console.log(`📊 Found ${total} total posts`);

    if (total === 0) {
      console.log('✅ No posts to migrate');
      return { total: 0, migrated: 0 };
    }

    // Count posts with NULL or empty ownerId (or integer 0 if still INTEGER type)
    let ownerlessCount;
    if (ownerIdColumn.type === 'INTEGER') {
      ownerlessCount = db.prepare(
        "SELECT COUNT(*) as count FROM posts WHERE ownerId IS NULL OR ownerId = 0"
      ).get().count;
    } else {
      ownerlessCount = db.prepare(
        "SELECT COUNT(*) as count FROM posts WHERE ownerId IS NULL OR ownerId = ''"
      ).get().count;
    }

    console.log(`🔍 Found ${ownerlessCount} posts without owner`);

    if (ownerlessCount === 0) {
      console.log('✅ All posts already have owners. No migration needed.');
      return { total, migrated: 0 };
    }

    // Migrate ownerless posts to 'system'
    console.log('🔄 Migrating ownerless posts to ownerId = "system"...');
    
    let result;
    if (ownerIdColumn.type === 'INTEGER') {
      result = db.prepare(
        "UPDATE posts SET ownerId = 'system' WHERE ownerId IS NULL OR ownerId = 0"
      ).run();
    } else {
      result = db.prepare(
        "UPDATE posts SET ownerId = 'system' WHERE ownerId IS NULL OR ownerId = ''"
      ).run();
    }

    console.log(`✅ Successfully migrated ${result.changes} posts to ownerId = "system"`);
    
    return { total, migrated: result.changes };

  } finally {
    db.close();
    console.log('📂 Database connection closed');
  }
}

/**
 * Migrate Firestore posts
 * @returns {Promise<{total: number, migrated: number}>}
 */
async function migrateFirestore() {
  console.log('🔥 Connecting to Firestore...');
  
  const firestore = new Firestore({
    projectId: process.env.FIREBASE_PROJECT_ID,
    // Uses Application Default Credentials or GOOGLE_APPLICATION_CREDENTIALS env var
  });

  try {
    const postsRef = firestore.collection('posts');
    const snapshot = await postsRef.get();
    
    const total = snapshot.size;
    console.log(`📊 Found ${total} total posts`);

    if (total === 0) {
      console.log('✅ No posts to migrate');
      return { total: 0, migrated: 0 };
    }

    // Find posts without ownerId
    const ownerlessQuery = postsRef.where('ownerId', '==', null);
    const ownerlessSnapshot = await ownerlessQuery.get();
    
    let ownerlessCount = ownerlessSnapshot.size;
    
    // Also check for empty string ownerIds
    const emptyOwnerQuery = postsRef.where('ownerId', '==', '');
    const emptyOwnerSnapshot = await emptyOwnerQuery.get();
    ownerlessCount += emptyOwnerSnapshot.size;

    console.log(`🔍 Found ${ownerlessCount} posts without owner`);

    if (ownerlessCount === 0) {
      console.log('✅ All posts already have owners. No migration needed.');
      return { total, migrated: 0 };
    }

    console.log('🔄 Migrating ownerless posts to ownerId = "system"...');

    // Batch update posts
    const batch = firestore.batch();
    let batchCount = 0;
    let migratedCount = 0;

    for (const doc of [...ownerlessSnapshot.docs, ...emptyOwnerSnapshot.docs]) {
      batch.update(doc.ref, { ownerId: 'system' });
      batchCount++;
      migratedCount++;

      // Firestore batch limit is 500 operations
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`  ✓ Committed batch of ${batchCount} updates`);
        batchCount = 0;
      }
    }

    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  ✓ Committed final batch of ${batchCount} updates`);
    }

    console.log(`✅ Successfully migrated ${migratedCount} posts to ownerId = "system"`);
    
    return { total, migrated: migratedCount };

  } finally {
    console.log('🔥 Firestore connection closed');
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting post owner migration...\n');
  console.log(`Storage type: ${values.storage}`);

  try {
    let result;

    if (values.storage === 'sqlite') {
      result = await migrateSQLite(values['db-path']);
    } else if (values.storage === 'firestore') {
      result = await migrateFirestore();
    } else {
      console.error(`❌ Unsupported storage type: ${values.storage}`);
      console.error('Supported types: sqlite, firestore');
      process.exit(1);
    }

    console.log('\n📋 Migration Summary:');
    console.log(`  Total posts: ${result.total}`);
    console.log(`  Migrated posts: ${result.migrated}`);
    console.log(`  Unchanged posts: ${result.total - result.migrated}`);

    if (result.migrated > 0) {
      console.log('\n✨ Migration completed successfully!');
      console.log('   Legacy posts now have ownerId = "system"');
    } else {
      console.log('\n✨ Migration completed (no changes needed)');
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
main();
