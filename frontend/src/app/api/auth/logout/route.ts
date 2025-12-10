/**
 * API Route Handler - Auth Logout BFF (Backend for Frontend)
 * 
 * Handles user logout by clearing the session cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Session cookie name
 */
const SESSION_COOKIE_NAME = 'session';

/**
 * POST /api/auth/logout - Clear session cookie
 * 
 * Logs out the user by removing the session cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Delete session cookie
    cookieStore.delete(SESSION_COOKIE_NAME);

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('[API Route] POST /api/auth/logout error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to logout' } },
      { status: 500 }
    );
  }
}
