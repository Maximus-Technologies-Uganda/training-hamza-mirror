/**
 * API Route Handler - Single Post BFF (Backend for Frontend)
 * 
 * Handles GET, PATCH, DELETE for individual posts.
 * Acts as a proxy to the backend Blog API.
 */

import { NextRequest, NextResponse } from 'next/server';

// Server-side API URL - not exposed to browser
const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/posts/[id] - Get a single post
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      headers: {
        'Accept': 'application/json',
      },
      // Revalidate every 60 seconds for ISR
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || { message: 'Post not found' } },
        { status: response.status }
      );
    }

    const post = await response.json();
    return NextResponse.json(post);
  } catch (error) {
    console.error('[API Route] GET /api/posts/[id] error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch post' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/posts/[id] - Update a post (requires auth + ownership)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
      credentials: 'include',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || { message: 'Failed to update post' } },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API Route] PATCH /api/posts/[id] error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update post' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/[id] - Delete a post (requires auth + ownership)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const csrfToken = request.headers.get('x-csrf-token');
    const cookieHeader = request.headers.get('cookie');

    const headers: HeadersInit = {
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

    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || { message: 'Failed to delete post' } },
        { status: response.status }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[API Route] DELETE /api/posts/[id] error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete post' } },
      { status: 500 }
    );
  }
}
