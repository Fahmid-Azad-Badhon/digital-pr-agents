import crypto from 'crypto';
import { NextRequest } from 'next/server';

export type AuthRole = 'admin' | 'operator' | 'viewer';

type SessionPayload = {
  sub: string;
  role: AuthRole;
  iat: number;
  exp: number;
  sid: string;
};

const SESSION_COOKIE_NAME = 'dashboard_session';
const CSRF_COOKIE_NAME = 'dashboard_csrf';

function getSessionSecret() {
  return process.env.DASHBOARD_SESSION_SECRET || '';
}

function getSessionTtlSeconds() {
  const raw = Number(process.env.DASHBOARD_SESSION_TTL_SECONDS || 60 * 60 * 12);
  if (!Number.isFinite(raw) || raw < 300) return 60 * 60 * 12;
  return Math.floor(raw);
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString('base64url');
}

function parseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function signPayload(payloadPart: string, secret: string) {
  return crypto
    .createHmac('sha256', secret)
    .update(payloadPart)
    .digest('base64url');
}

export function issueSessionToken(subject: string, role: AuthRole): { token: string; expiresAt: number } {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error('DASHBOARD_SESSION_SECRET is required for session auth.');
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + getSessionTtlSeconds();
  const payload: SessionPayload = {
    sub: subject,
    role,
    iat: now,
    exp,
    sid: crypto.randomUUID(),
  };
  const payloadPart = base64url(JSON.stringify(payload));
  const sigPart = signPayload(payloadPart, secret);
  return {
    token: `${payloadPart}.${sigPart}`,
    expiresAt: exp * 1000,
  };
}

export function verifySessionToken(token: string): SessionPayload | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  const [payloadPart, sigPart] = token.split('.');
  if (!payloadPart || !sigPart) return null;

  const expectedSig = signPayload(payloadPart, secret);
  if (expectedSig !== sigPart) return null;

  const payloadRaw = Buffer.from(payloadPart, 'base64url').toString('utf-8');
  const payload = parseJson<SessionPayload>(payloadRaw);
  if (!payload) return null;
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  if (!payload.role || !['admin', 'operator', 'viewer'].includes(payload.role)) return null;
  return payload;
}

function readBearer(request: NextRequest): string | null {
  const authorization = request.headers.get('authorization');
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export function getSessionTokenFromRequest(request: NextRequest): string | null {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value?.trim();
  if (cookie) return cookie;
  const bearer = readBearer(request);
  if (bearer && bearer.startsWith('sess_')) {
    return bearer.slice('sess_'.length);
  }
  return null;
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getCsrfCookieName() {
  return CSRF_COOKIE_NAME;
}

export function generateCsrfToken() {
  return crypto.randomBytes(24).toString('hex');
}

export function parseAuthUsers(): Record<string, { password: string; role: AuthRole }> {
  const raw = process.env.DASHBOARD_AUTH_USERS_JSON;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, { password?: string; role?: string }>;
    const entries = Object.entries(parsed)
      .filter(([, value]) => Boolean(value?.password && value?.role))
      .map(([username, value]) => ({
        username,
        password: String(value.password),
        role: value.role as AuthRole,
      }))
      .filter((entry) => ['admin', 'operator', 'viewer'].includes(entry.role));
    return Object.fromEntries(entries.map((entry) => [entry.username, { password: entry.password, role: entry.role }]));
  } catch {
    return {};
  }
}
