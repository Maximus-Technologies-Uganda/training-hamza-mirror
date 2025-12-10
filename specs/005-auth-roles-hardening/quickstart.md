# Quickstart: Auth, Roles, and Production Hardening

**Feature**: 005-auth-roles-hardening  
**Date**: December 9, 2025

This guide covers local development setup for the Firebase Auth integration and production hardening features.

---

## Prerequisites

- Node.js 18+ installed
- npm 9+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- A Firebase project (or create one during setup)

---

## 1. Firebase Project Setup

### Option A: Create New Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the wizard
3. Enable Authentication:
   - Go to **Build > Authentication**
   - Click "Get started"
   - Enable **Email/Password** provider
4. Create a Web App:
   - Go to **Project Settings > General**
   - Click "Add app" → Web
   - Register app and copy the config

### Option B: Use Existing Firebase Project

If you have an existing Firebase project, ensure:
- Authentication is enabled
- Email/Password provider is enabled
- You have a web app registered

---

## 2. Environment Variables

### Backend API (.env)

Create or update `.env` in the project root:

```bash
# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
STORAGE_TYPE=memory

# Firebase Admin SDK (for ID token verification)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Mutation Rate Limit (per user)
MUTATION_RATE_LIMIT_MAX=10
MUTATION_RATE_LIMIT_WINDOW=60000

# For development with Firebase Emulator
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
```

#### Getting Firebase Admin SDK Credentials

1. Go to **Firebase Console > Project Settings > Service accounts**
2. Click "Generate new private key"
3. Download the JSON file
4. Extract values for the environment variables:
   - `FIREBASE_PROJECT_ID` → `project_id`
   - `FIREBASE_CLIENT_EMAIL` → `client_email`
   - `FIREBASE_PRIVATE_KEY` → `private_key` (keep the `\n` escaped)

### Frontend (.env.local)

Create `frontend/.env.local`:

```bash
# Firebase Client SDK (public, safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# API URL (BFF routes to backend)
NEXT_PUBLIC_API_URL=http://localhost:3000

# For development with Firebase Emulator
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
```

---

## 3. Firebase Emulator Setup (Recommended for Development)

The Firebase Emulator provides a local Firebase Auth service for development without affecting production.

### Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### Initialize Firebase in Project

```bash
firebase init emulators
```

Select:
- Authentication Emulator (port 9099)
- Download emulators when prompted

### Configure Emulator (firebase.json)

Create or update `firebase.json` in project root:

```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### Start Emulator

```bash
firebase emulators:start --only auth
```

The Auth Emulator UI will be available at `http://localhost:4000`.

---

## 4. Seed Test Users (Development)

### Using Firebase Emulator UI

1. Start emulator: `firebase emulators:start --only auth`
2. Open `http://localhost:4000`
3. Go to **Authentication** tab
4. Click "Add user" and create:

| Email | Password | Display Name | Notes |
|-------|----------|--------------|-------|
| alice@example.com | password123 | Alice | Regular user |
| bob@example.com | password456 | Bob | Admin user (set custom claims) |

### Using Admin SDK Script

Create `scripts/seed-users.mjs`:

```javascript
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize with emulator
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

const app = initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
});

const auth = getAuth(app);

async function seedUsers() {
  // Create Alice (regular user)
  try {
    const alice = await auth.createUser({
      uid: 'alice-uid',
      email: 'alice@example.com',
      password: 'password123',
      displayName: 'Alice',
    });
    console.log('Created Alice:', alice.uid);
  } catch (e) {
    if (e.code === 'auth/uid-already-exists') {
      console.log('Alice already exists');
    } else throw e;
  }

  // Create Bob (admin user)
  try {
    const bob = await auth.createUser({
      uid: 'bob-uid',
      email: 'bob@example.com',
      password: 'password456',
      displayName: 'Bob',
    });
    await auth.setCustomUserClaims('bob-uid', { admin: true });
    console.log('Created Bob (admin):', bob.uid);
  } catch (e) {
    if (e.code === 'auth/uid-already-exists') {
      console.log('Bob already exists');
      await auth.setCustomUserClaims('bob-uid', { admin: true });
    } else throw e;
  }

  console.log('Users seeded successfully');
}

seedUsers().catch(console.error);
```

Run with:
```bash
node scripts/seed-users.mjs
```

---

## 5. Install Dependencies

### Backend

```bash
# From project root
npm install firebase-admin zod
npm install -D @types/node
```

### Frontend

```bash
cd frontend
npm install firebase
npm install -D @types/firebase
```

---

## 6. Start Development Servers

### Terminal 1: Firebase Emulator

```bash
firebase emulators:start --only auth
```

### Terminal 2: Backend API

```bash
npm run dev
```

Backend will be available at `http://localhost:3000`.

### Terminal 3: Frontend (Next.js)

```bash
cd frontend
npm run dev
```

Frontend will be available at `http://localhost:5000`.

---

## 7. Verify Setup

### Check Backend Health

```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","version":"3.0.0",...}
```

### Check Firebase Emulator

```bash
curl http://localhost:9099
# Expected: {"authEmulator":{"ready":true}}
```

### Test Login Flow (with curl)

```bash
# 1. Sign in with Firebase Auth (via emulator REST API)
curl -X POST "http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key" \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123","returnSecureToken":true}'

# 2. Use the returned idToken to call protected API endpoints
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer <idToken>" \
  -H "Content-Type: application/json" \
  -d '{"title":"My First Post","body":"Hello, Firebase Auth!"}'
```

---

## 8. Running Tests

### Backend Tests

```bash
# Run all tests
npm test

# Run auth-specific tests
npm test -- tests/blog/auth

# Run with coverage
npm run test:coverage
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run a11y tests
npm run test:a11y

# Run integration tests
npm run test:integration
```

---

## Troubleshooting

### "Firebase Admin SDK not initialized"

Ensure environment variables are set:
```bash
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_CLIENT_EMAIL
# FIREBASE_PRIVATE_KEY should start with "-----BEGIN PRIVATE KEY-----"
```

### "Connection refused to emulator"

1. Ensure emulator is running: `firebase emulators:start --only auth`
2. Check emulator host matches env var: `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`

### "Invalid token" errors in development

When using emulator, ensure both backend and frontend point to the same emulator:
- Backend: `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`
- Frontend: `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`

### Rate limit exceeded during testing

Increase limits in development:
```bash
MUTATION_RATE_LIMIT_MAX=1000
MUTATION_RATE_LIMIT_WINDOW=60000
```

---

## Next Steps

After verifying the setup:

1. Review [data-model.md](./data-model.md) for entity schemas
2. Review [contracts/openapi.yaml](./contracts/openapi.yaml) for API specification
3. Run `/speckit.tasks` to generate implementation tasks
