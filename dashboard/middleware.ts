import { NextFetchEvent, NextRequest, NextResponse } from 'next/server';
import { evaluateMutationAuth } from '@/lib/authGuard';
import { checkRateLimit } from '@/lib/rateLimiter';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const INTERNAL_AUDIT_PATH = '/api/_internal/mutation-audit';
const SESSION_COOKIE_NAME = 'dashboard_session';
const CSRF_COOKIE_NAME = 'dashboard_csrf';
const PUBLIC_MUTATION_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/logout',
]);
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;

function unauthorizedEnvelope(reason: string) {
  return NextResponse.json(
    {
      success: false,
      error: 'AUTH_REQUIRED',
      code: 'AUTH_REQUIRED',
      message: reason,
    },
    { status: 401 }
  );
}

function rateLimitedEnvelope(requestId: string, resetAt: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return NextResponse.json(
    {
      success: false,
      error: 'RATE_LIMITED',
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please retry shortly.',
    },
    {
      status: 429,
      headers: {
        'x-request-id': requestId,
        'retry-after': String(retryAfter),
      },
    }
  );
}

function csrfFailedEnvelope(requestId: string) {
  return NextResponse.json(
    {
      success: false,
      error: 'CSRF_REQUIRED',
      code: 'CSRF_REQUIRED',
      message: 'Missing or invalid CSRF token for session-authenticated mutation request.',
    },
    {
      status: 403,
      headers: {
        'x-request-id': requestId,
      },
    }
  );
}

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return request.ip || 'unknown';
}

function buildRequestId() {
  return crypto.randomUUID();
}

function hasSessionCookie(request: NextRequest) {
  return Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}

function hasValidCsrfToken(request: NextRequest) {
  const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value?.trim();
  const csrfHeader = request.headers.get('x-csrf-token')?.trim();
  if (!csrfCookie || !csrfHeader) return false;
  return csrfCookie === csrfHeader;
}

async function emitMutationAudit(request: NextRequest, requestId: string) {
  const token = process.env.INTERNAL_AUDIT_TOKEN;
  if (!token) {
    return;
  }

  const payload = {
    requestId,
    timestamp: new Date().toISOString(),
    method: request.method.toUpperCase(),
    path: request.nextUrl.pathname,
    action: request.nextUrl.searchParams.get('action') || null,
    campaignId: request.nextUrl.searchParams.get('campaignId') || null,
    actor: request.headers.get('x-actor')
      || (request.headers.get('authorization') ? 'authenticated' : 'dashboard_user'),
    ip: getClientIp(request),
    userAgent: request.headers.get('user-agent') || '',
  };

  await fetch(new URL(INTERNAL_AUDIT_PATH, request.url), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-internal-audit-token': token,
      'x-request-id': requestId,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  }).catch(() => undefined);
}

export function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname === INTERNAL_AUDIT_PATH) {
    return NextResponse.next();
  }

  const method = request.method.toUpperCase();
  const requestId = buildRequestId();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  const isMutation = MUTATION_METHODS.has(method);
  if (isMutation) {
    if (PUBLIC_MUTATION_PATHS.has(request.nextUrl.pathname)) {
      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const auth = evaluateMutationAuth(request);
    if (!auth.allowed) {
      const denied = unauthorizedEnvelope(auth.reason);
      denied.headers.set('x-request-id', requestId);
      return denied;
    }

    if (hasSessionCookie(request) && !hasValidCsrfToken(request)) {
      return csrfFailedEnvelope(requestId);
    }

    const rateKey = `${getClientIp(request)}:${method}:${request.nextUrl.pathname}`;
    const rate = checkRateLimit(rateKey, {
      max: RATE_LIMIT_MAX,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });

    if (!rate.allowed) {
      return rateLimitedEnvelope(requestId, rate.resetAt);
    }

    event.waitUntil(emitMutationAudit(request, requestId));

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.headers.set('x-request-id', requestId);
    response.headers.set('x-ratelimit-limit', String(RATE_LIMIT_MAX));
    response.headers.set('x-ratelimit-remaining', String(rate.remaining));
    response.headers.set('x-ratelimit-reset', String(Math.ceil(rate.resetAt / 1000)));
    return response;
  }

  const passthrough = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  passthrough.headers.set('x-request-id', requestId);
  return passthrough;
}

export const config = {
  matcher: ['/api/:path*'],
};
