import { NextRequest, NextResponse } from 'next/server';
import { fail, ok } from '@/lib/apiResponse';
import {
  generateCsrfToken,
  getCsrfCookieName,
  getSessionCookieName,
  issueSessionToken,
  parseAuthUsers,
} from '@/lib/sessionAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null) as { username?: string; password?: string } | null;
    const username = body?.username?.trim() || '';
    const password = body?.password || '';
    if (!username || !password) {
      return fail('INVALID_CREDENTIALS', 'username and password are required.', { status: 400 });
    }

    const users = parseAuthUsers();
    const record = users[username];
    if (!record || record.password !== password) {
      return fail('AUTH_FAILED', 'Invalid username or password.', { status: 401 });
    }

    const issued = issueSessionToken(username, record.role);
    const csrfToken = generateCsrfToken();
    const response = ok({
      user: { username, role: record.role },
      expiresAt: new Date(issued.expiresAt).toISOString(),
      csrfToken,
    }) as NextResponse;

    response.cookies.set({
      name: getSessionCookieName(),
      value: issued.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(issued.expiresAt),
    });
    response.cookies.set({
      name: getCsrfCookieName(),
      value: csrfToken,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(issued.expiresAt),
    });
    return response;
  } catch (error) {
    return fail(
      'LOGIN_FAILED',
      'Failed to create session.',
      { status: 500 },
      error instanceof Error ? error.message : String(error)
    );
  }
}
