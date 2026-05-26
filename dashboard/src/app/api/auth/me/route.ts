import { NextRequest } from 'next/server';
import { fail, ok } from '@/lib/apiResponse';
import {
  getCsrfCookieName,
  getSessionTokenFromRequest,
  verifySessionToken,
} from '@/lib/sessionAuth';

export async function GET(request: NextRequest) {
  const token = getSessionTokenFromRequest(request);
  if (!token) {
    return fail('UNAUTHENTICATED', 'No active session.', { status: 401 });
  }
  const session = verifySessionToken(token);
  if (!session) {
    return fail('UNAUTHENTICATED', 'Session is invalid or expired.', { status: 401 });
  }
  return ok({
    authenticated: true,
    user: {
      username: session.sub,
      role: session.role,
    },
    csrfToken: request.cookies.get(getCsrfCookieName())?.value || null,
    expiresAt: new Date(session.exp * 1000).toISOString(),
  });
}
