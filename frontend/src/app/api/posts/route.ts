/**
 * API Route Handler - Posts BFF (Backend for Frontend)
 * 
 * This route handler acts as a proxy between the Next.js frontend and the
 * backend Blog API. Browser calls stay behind Next.js; the server-side
 * fetches from API_BASE_URL.
 * 
 * Benefits:
 * - Hides backend URL from browser (security)
 * - Enables SSR data fetching
 * - Allows request/response transformation
 * - Centralized error handling
 */

import { NextRequest, NextResponse } from 'next/server';

// Server-side API URL - not exposed to browser
const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * GET /api/posts - List all posts (SSR-compatible)
 */
export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      headers: {
        'Accept': 'application/json',
      },
      // Revalidate every 60 seconds for ISR
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || { message: 'Failed to fetch posts' } },
        { status: response.status }
      );
    }

    const posts = await response.json();
    return NextResponse.json(posts);
  } catch (error) {
    console.error('[API Route] GET /api/posts error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch posts' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/posts - Create a new post (requires auth)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    const csrfToken = request.headers.get('x-csrf-token');
    const cookieHeader = request.headers.get('cookie');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'include',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || { message: 'Failed to create post' } },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[API Route] POST /api/posts error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create post' } },
      { status: 500 }
    );
  }
}
