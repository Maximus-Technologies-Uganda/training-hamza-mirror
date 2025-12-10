/**
 * API Route Handler - Auth Session BFF (Backend for Frontend)
 * 
 * Manages Firebase Auth session cookies for secure authentication.
 * POST: Creates session cookie from Firebase ID token
 * GET: Returns current session information
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Session cookie configuration
 */
const SESSION_COOKIE_NAME = 'session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5 days in seconds

/**
 * POST /api/auth/session - Create session cookie from Firebase ID token
 * 
 * Receives Firebase ID token from client, validates it via backend API,
 * and creates an httpOnly session cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'ID token is required' } },
        { status: 400 }
      );
    }

    // Validate token with backend API
    const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.error || { code: 'AUTH_FAILED', message: 'Authentication failed' } },
        { status: response.status }
      );
    }

    const sessionData = await response.json();

    // Create session cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: sessionData.user,
    });
  } catch (error) {
    console.error('[API Route] POST /api/auth/session error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create session' } },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/session - Get current session information
 * 
 * Returns user info from session cookie if authenticated.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    // Validate session with backend API
    const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionCookie.value}`,
      },
    });

    if (!response.ok) {
      // Invalid session - clear cookie
      cookieStore.delete(SESSION_COOKIE_NAME);
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    const sessionData = await response.json();

    return NextResponse.json({
      authenticated: true,
      user: sessionData.user,
    });
  } catch (error) {
    console.error('[API Route] GET /api/auth/session error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to get session' } },
      { status: 500 }
    );
  }
}
