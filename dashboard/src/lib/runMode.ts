import { z } from 'zod';

export const RUN_MODES = ['dry_run', 'preview', 'live', 'test'] as const;

export type RunMode = (typeof RUN_MODES)[number];

export const RunModeSchema = z.enum(RUN_MODES);

export function parseRunMode(raw: unknown): RunMode {
  const result = RunModeSchema.safeParse(raw);
  return result.success ? result.data : 'dry_run';
}

export function getRunModeFromEnv(): RunMode {
  return parseRunMode(process.env.RUN_MODE);
}

interface HeaderLike {
  get(name: string): string | null;
}

interface RequestLike {
  headers: HeaderLike;
}

export function getRunModeFromRequest(request: RequestLike): RunMode {
  const headerValue = request.headers.get('x-run-mode');
  if (headerValue !== null) {
    return parseRunMode(headerValue);
  }
  return getRunModeFromEnv();
}

export function shouldBlockExternalAction(mode: RunMode): boolean {
  return mode === 'dry_run' || mode === 'preview' || mode === 'test';
}

export function describeRunMode(mode: RunMode): string {
  switch (mode) {
    case 'dry_run':
      return 'Dry run: external API calls and unsafe scripts are blocked.';
    case 'preview':
      return 'Preview: external API calls and unsafe scripts are blocked.';
    case 'test':
      return 'Test: external API calls and unsafe scripts are blocked.';
    case 'live':
      return 'Live: external API calls and unsafe scripts are allowed.';
  }
}
