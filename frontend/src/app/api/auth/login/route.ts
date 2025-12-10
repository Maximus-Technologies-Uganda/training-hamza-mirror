/**
 * API Route Handler - Auth Login BFF (Backend for Frontend)
 * 
 * Proxies login requests to the backend Blog API.
 */

import { NextRequest, NextResponse } from 'next/server';

// Server-side API URL - not exposed to browser
const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * POST /api/auth/login - Authenticate user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || { message: 'Authentication failed' } },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API Route] POST /api/auth/login error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Authentication failed' } },
      { status: 500 }
    );
  }
}
