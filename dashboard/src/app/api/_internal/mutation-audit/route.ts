import { NextRequest } from 'next/server';
import { fail, ok } from '@/lib/apiResponse';
import { writeSystemLog } from '@/lib/logger';

type MutationAuditPayload = {
  requestId?: string;
  timestamp?: string;
  method?: string;
  path?: string;
  action?: string | null;
  actor?: string | null;
  campaignId?: string | null;
  ip?: string;
  userAgent?: string;
};

function inferCampaignId(pathname: string): string | null {
  const match = pathname.match(/^\/api\/campaigns\/([^/]+)/i);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function inferStage(pathname: string): number | null {
  if (pathname.includes('/execute-stage')) return null;
  if (pathname.includes('/human-approval')) return 7;
  if (pathname.includes('/extract')) return 2;
  if (pathname.includes('/scripts')) return null;
  if (pathname.includes('/gates')) return null;
  if (pathname.includes('/governance')) return null;
  if (pathname.includes('/template')) return null;
  if (pathname.includes('/backup')) return null;
  return null;
}

function inferAction(method: string, pathname: string, explicitAction?: string | null): string {
  if (explicitAction) {
    return explicitAction;
  }

  if (pathname.includes('/execute-stage')) return method === 'GET' ? 'stage_precheck' : 'execute_stage';
  if (pathname.includes('/human-approval')) return method === 'GET' ? 'human_approval_status' : 'human_approval_mutation';
  if (pathname.includes('/scripts')) return 'run_script_action';
  if (pathname.includes('/backup')) return method === 'GET' ? 'list_backups' : 'backup_mutation';
  if (pathname.includes('/governance')) return method === 'GET' ? 'governance_check' : 'governance_mutation';
  if (pathname.includes('/gates')) return method === 'GET' ? 'gate_status' : 'gate_mutation';
  if (pathname.includes('/template')) return method === 'GET' ? 'template_read' : 'template_mutation';
  if (pathname.includes('/questions')) return method === 'GET' ? 'questions_read' : 'questions_mutation';
  if (pathname.includes('/workflow')) return method === 'GET' ? 'workflow_read' : 'workflow_mutation';
  if (pathname === '/api/campaigns') return method === 'GET' ? 'campaigns_list' : 'campaign_create';
  if (pathname.includes('/api/campaigns/')) return method === 'GET' ? 'campaign_read' : 'campaign_mutation';
  return `api_${method.toLowerCase()}`;
}

function isAuthorized(request: NextRequest) {
  const expected = process.env.INTERNAL_AUDIT_TOKEN;
  if (!expected) {
    return false;
  }
  const received = request.headers.get('x-internal-audit-token');
  return Boolean(received && received === expected);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return fail('FORBIDDEN', 'Invalid internal audit token.', { status: 403 });
  }

  let payload: MutationAuditPayload;
  try {
    payload = (await request.json()) as MutationAuditPayload;
  } catch {
    return fail('INVALID_BODY', 'Mutation audit body must be valid JSON.', { status: 400 });
  }

  if (!payload.method || !payload.path) {
    return fail('INVALID_BODY', 'Missing required mutation audit fields.', { status: 400 });
  }

  const method = String(payload.method).toUpperCase();
  const pathname = String(payload.path);
  const campaignId = payload.campaignId || inferCampaignId(pathname);
  const stage = inferStage(pathname);
  const action = inferAction(method, pathname, payload.action);
  const actor = payload.actor || 'dashboard_user';

  await writeSystemLog({
    level: 'info',
    source: 'mutation-audit',
    message: `${method} ${pathname}`,
    ...(campaignId ? { campaignId } : {}),
    metadata: {
      requestId: payload.requestId || request.headers.get('x-request-id') || null,
      timestamp: payload.timestamp || new Date().toISOString(),
      method,
      route: pathname,
      stage,
      action,
      actor,
      ip: payload.ip || null,
      userAgent: payload.userAgent || null,
    },
  });

  return ok({ logged: true });
}
