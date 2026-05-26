import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { SCRIPTS_ROOT, REPO_ROOT } from '@/lib/requestGuard';

export type ScriptAction =
  | 'validate_stage'
  | 'draft_study_input'
  | 'import_muckrack_output'
  | 'draft_journalist_intel'
  | 'draft_pitch_draft'
  | 'export_google_doc';

type ScriptSpec = {
  fileName: string;
  args: (payload: Record<string, unknown>) => string[];
  timeoutMs: number;
};

const SCRIPT_MAP: Record<ScriptAction, ScriptSpec> = {
  validate_stage: {
    fileName: 'validate-stage.cmd',
    args: payload => [String(payload.campaignId), String(payload.stageFile)],
    timeoutMs: 120000,
  },
  draft_study_input: {
    fileName: 'draft-study-input.cmd',
    args: payload => [String(payload.campaignId)],
    timeoutMs: 300000,
  },
  import_muckrack_output: {
    fileName: 'import-muckrack-output.cmd',
    args: payload => {
      const base = [String(payload.campaignId)];
      if (payload.all === true) {
        base.push('--all');
      }
      return base;
    },
    timeoutMs: 300000,
  },
  draft_journalist_intel: {
    fileName: 'draft-journalist-intel.cmd',
    args: payload => [String(payload.campaignId)],
    timeoutMs: 300000,
  },
  draft_pitch_draft: {
    fileName: 'draft-pitch-draft.cmd',
    args: payload => [String(payload.campaignId)],
    timeoutMs: 300000,
  },
  export_google_doc: {
    fileName: 'export-google-doc.cmd',
    args: payload => {
      const base = [String(payload.campaignId)];
      if (payload.title) {
        base.push(String(payload.title));
      }
      return base;
    },
    timeoutMs: 300000,
  },
};

export function isScriptAction(value: unknown): value is ScriptAction {
  return typeof value === 'string' && Object.keys(SCRIPT_MAP).includes(value);
}

export async function runScriptAction(
  action: ScriptAction,
  payload: Record<string, unknown>
): Promise<{ exitCode: number; stdout: string; stderr: string; durationMs: number; command: string }> {
  const spec = SCRIPT_MAP[action];
  const scriptPath = path.join(SCRIPTS_ROOT, spec.fileName);
  await fs.access(scriptPath);

  const args = spec.args(payload);
  const start = Date.now();
  const commandDisplay = `${spec.fileName} ${args.join(' ')}`.trim();

  return await new Promise((resolve, reject) => {
    const cmdExe = process.env.ComSpec || 'cmd.exe';
    const child = spawn(`"${scriptPath}"`, args, {
      cwd: REPO_ROOT,
      env: process.env,
      windowsHide: true,
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Script timeout: ${commandDisplay}`));
    }, spec.timeoutMs);

    child.stdout.on('data', chunk => {
      stdout += String(chunk);
    });
    child.stderr.on('data', chunk => {
      stderr += String(chunk);
    });
    child.on('error', error => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', code => {
      clearTimeout(timer);
      resolve({
        exitCode: typeof code === 'number' ? code : 1,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        durationMs: Date.now() - start,
        command: commandDisplay,
      });
    });
  });
}
