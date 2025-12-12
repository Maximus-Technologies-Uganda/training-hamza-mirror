#!/usr/bin/env node
/**
 * Seed Users Script
 * 
 * Creates test users for development with Firebase Auth Emulator.
 * - alice@example.com (regular user)
 * - bob@example.com (admin user with custom claims)
 * 
 * Usage:
 *   # Ensure Firebase Auth Emulator is running first:
 *   firebase emulators:start --only auth
 *   
 *   # Then run this script:
 *   node scripts/seed-users.mjs
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Set emulator host for development
const EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.FIREBASE_AUTH_EMULATOR_HOST = EMULATOR_HOST;

// Initialize Firebase Admin (emulator mode)
if (!getApps().length) {
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
  });
}

const auth = getAuth();

// Test user definitions
const USERS = [
  {
    uid: 'alice-uid-001',
    email: 'alice@example.com',
    password: 'password123',
    displayName: 'Alice',
    isAdmin: false,
  },
  {
    uid: 'bob-uid-002',
    email: 'bob@example.com',
    password: 'password456',
    displayName: 'Bob',
    isAdmin: true,
  },
];

/**
 * Create a user in Firebase Auth
 * @param {object} userData - User data to create
 */
async function createUser(userData) {
  const { uid, email, password, displayName, isAdmin } = userData;
  
  try {
    // Try to create the user
    const user = await auth.createUser({
      uid,
      email,
      password,
      displayName,
      emailVerified: true,
    });
    console.log(`✓ Created user: ${email} (${user.uid})`);
    
    // Set admin custom claims if needed
    if (isAdmin) {
      await auth.setCustomUserClaims(uid, { admin: true });
      console.log(`  → Set admin claims for ${email}`);
    }
    
    return user;
  } catch (error) {
    if (error.code === 'auth/uid-already-exists' || error.code === 'auth/email-already-exists') {
      console.log(`⊘ User already exists: ${email}`);
      
      // Ensure admin claims are set correctly even if user exists
      if (isAdmin) {
        try {
          await auth.setCustomUserClaims(uid, { admin: true });
          console.log(`  → Updated admin claims for ${email}`);
        } catch (claimError) {
          console.error(`  ✗ Failed to set admin claims: ${claimError.message}`);
        }
      }
      
      return await auth.getUser(uid).catch(() => null);
    }
    
    console.error(`✗ Failed to create ${email}: ${error.message}`);
    throw error;
  }
}

/**
 * Main function to seed all users
 */
async function seedUsers() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Firebase Auth Seed Users');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Emulator Host: ${EMULATOR_HOST}`);
  console.log(`  Project ID: ${process.env.FIREBASE_PROJECT_ID || 'demo-project'}`);
  console.log('───────────────────────────────────────────────────────────');
  console.log('');
  
  const results = {
    created: [],
    existing: [],
    failed: [],
  };
  
  for (const userData of USERS) {
    try {
      const user = await createUser(userData);
      if (user) {
        results.created.push(userData.email);
      }
    } catch (error) {
      results.failed.push({ email: userData.email, error: error.message });
    }
  }
  
  console.log('');
  console.log('───────────────────────────────────────────────────────────');
  console.log('  Summary');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`  Users processed: ${USERS.length}`);
  console.log(`  Successfully created/verified: ${results.created.length}`);
  console.log(`  Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('');
    console.log('  Failed users:');
    results.failed.forEach(({ email, error }) => {
      console.log(`    - ${email}: ${error}`);
    });
  }
  
  console.log('');
  console.log('───────────────────────────────────────────────────────────');
  console.log('  Test Credentials');
  console.log('───────────────────────────────────────────────────────────');
  console.log('  Regular User (alice):');
  console.log('    Email:    alice@example.com');
  console.log('    Password: password123');
  console.log('');
  console.log('  Admin User (bob):');
  console.log('    Email:    bob@example.com');
  console.log('    Password: password456');
  console.log('═══════════════════════════════════════════════════════════');
}

// Run the script
seedUsers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
