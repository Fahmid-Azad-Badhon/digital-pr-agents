import { NextRequest } from 'next/server';
import { AuthRole, getSessionTokenFromRequest, verifySessionToken } from '@/lib/sessionAuth';

function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) {
    return null;
  }
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function shouldRequireAuth(): boolean {
  const explicit = (process.env.DASHBOARD_AUTH_REQUIRED || '').toLowerCase();
  if (explicit === 'true') {
    return true;
  }
  return Boolean(process.env.DASHBOARD_API_TOKEN);
}

function getTokenRoleMap(): Record<string, AuthRole> {
  const raw = process.env.DASHBOARD_API_TOKENS_JSON;
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const entries = Object.entries(parsed).filter(([, role]) =>
      role === 'admin' || role === 'operator' || role === 'viewer'
    ) as Array<[string, AuthRole]>;
    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

function shouldEnforceOrigin(): boolean {
  const explicit = (process.env.DASHBOARD_ENFORCE_ORIGIN || '').toLowerCase();
  if (explicit === 'false') {
    return false;
  }
  return true;
}

export function evaluateMutationAuth(request: NextRequest): { allowed: true } | { allowed: false; reason: string } {
  if (!shouldRequireAuth()) {
    return { allowed: true };
  }

  const expectedToken = process.env.DASHBOARD_API_TOKEN;
  if (!expectedToken) {
    return { allowed: false, reason: 'DASHBOARD_API_TOKEN is not configured.' };
  }

  const headerToken = request.headers.get('x-dashboard-token');
  const bearerToken = extractBearerToken(request.headers.get('authorization'));
  const token = (headerToken || bearerToken || '').trim();
  const sessionToken = getSessionTokenFromRequest(request);
  const session = sessionToken ? verifySessionToken(sessionToken) : null;

  const tokenRoles = getTokenRoleMap();
  const primaryRole = ((process.env.DASHBOARD_API_TOKEN_ROLE || 'admin').toLowerCase() === 'operator'
    ? 'operator'
    : (process.env.DASHBOARD_API_TOKEN_ROLE || 'admin').toLowerCase() === 'viewer'
      ? 'viewer'
      : 'admin') as AuthRole;
  const role = session?.role || (token === expectedToken ? primaryRole : tokenRoles[token]);

  if (!role) {
    return { allowed: false, reason: 'Missing or invalid API token.' };
  }

  const requiredRole = getRequiredRoleForPath(request.nextUrl.pathname);
  if (!hasRequiredRole(role, requiredRole)) {
    return { allowed: false, reason: `Insufficient role for route. Required: ${requiredRole}, received: ${role}.` };
  }

  if (shouldEnforceOrigin()) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return { allowed: false, reason: 'Origin host does not match request host.' };
        }
      } catch {
        return { allowed: false, reason: 'Invalid origin header.' };
      }
    }
  }

  return { allowed: true };
}

const ROLE_RANK: Record<AuthRole, number> = {
  viewer: 1,
  operator: 2,
  admin: 3,
};

const DEFAULT_ROUTE_POLICIES: Array<{ prefix: string; role: AuthRole }> = [
  { prefix: '/api/brains/run', role: 'admin' },
  { prefix: '/api/campaigns/', role: 'operator' },
  { prefix: '/api/integrations/', role: 'admin' },
  { prefix: '/api/_internal/', role: 'admin' },
  { prefix: '/api/logs', role: 'operator' },
];

function parseRoutePolicies(): Array<{ prefix: string; role: AuthRole }> {
  const raw = process.env.DASHBOARD_ROUTE_POLICIES_JSON;
  if (!raw) return DEFAULT_ROUTE_POLICIES;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const dynamic = Object.entries(parsed)
      .map(([prefix, role]) => ({ prefix, role }))
      .filter(item => item.role === 'admin' || item.role === 'operator' || item.role === 'viewer') as Array<{ prefix: string; role: AuthRole }>;
    return [...DEFAULT_ROUTE_POLICIES, ...dynamic];
  } catch {
    return DEFAULT_ROUTE_POLICIES;
  }
}

function getRequiredRoleForPath(pathname: string): AuthRole {
  const policies = parseRoutePolicies();
  const matched = policies.find(policy => pathname.startsWith(policy.prefix));
  return matched?.role || 'operator';
}

function hasRequiredRole(currentRole: AuthRole, requiredRole: AuthRole): boolean {
  return ROLE_RANK[currentRole] >= ROLE_RANK[requiredRole];
}
