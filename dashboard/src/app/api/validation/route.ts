import fs from 'fs/promises';
import path from 'path';
import { fail, ok } from '@/lib/apiResponse';
import { PITCH_JOBS_ROOT } from '@/lib/requestGuard';
import { validateStagePitchGovernance } from '@/lib/pitchGovernanceValidator';

type ValidationStatus = 'passed' | 'failed' | 'warning' | 'pending';
type ValidationCategory = 'technical' | 'browser' | 'regression' | 'production';

interface ValidationCheck {
  id: string;
  category: ValidationCategory;
  name: string;
  status: ValidationStatus;
  message: string;
  checkedAt: string;
}

interface GovernanceSummary {
  stage: 10 | 11 | 12;
  filePath: string | null;
  valid: boolean;
  issueCount: number;
  warningCount: number;
  issues: Array<{ code: string; severity: 'critical' | 'high' | 'medium' | 'low'; message: string; evidence?: string }>;
  warnings: Array<{ code: string; severity: 'critical' | 'high' | 'medium' | 'low'; message: string; evidence?: string }>;
}



function toCheck(
  id: string,
  category: ValidationCategory,
  name: string,
  status: ValidationStatus,
  message: string
): ValidationCheck {
  return {
    id,
    category,
    name,
    status,
    message,
    checkedAt: new Date().toISOString(),
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return fail('CAMPAIGN_ID_REQUIRED', 'campaignId is required.', { status: 400 });
    }

    const campaignPath = path.join(PITCH_JOBS_ROOT, campaignId);
    const stageStatePath = path.join(campaignPath, 'stage-state.json');
    const validationPath = path.join(campaignPath, '13-validation-report.json');
    const finalPackagePath = path.join(campaignPath, '14-final-formatted-package.md');
    const outreachAssetsPath = path.join(campaignPath, '15-outreach-assets.md');
    const learningLogPath = path.join(campaignPath, '16-campaign-learning-log.json');
    const errorsPath = path.join(campaignPath, 'errors.json');

    const [hasStageState, hasValidation, hasFinalPackage, hasOutreachAssets, hasLearningLog] = await Promise.all([
      fileExists(stageStatePath),
      fileExists(validationPath),
      fileExists(finalPackagePath),
      fileExists(outreachAssetsPath),
      fileExists(learningLogPath),
    ]);

    let currentStage = 0;
    if (hasStageState) {
      const parsed = await fs.readFile(stageStatePath, 'utf-8')
        .then(content => JSON.parse(content) as { currentStage?: number })
        .catch(() => null);
      currentStage = parsed?.currentStage ?? 0;
    }

    let validationDocStatus: string | null = null;
    let validationSummaryMessage = 'Validation report is missing.';
    if (hasValidation) {
      const parsed = await fs.readFile(validationPath, 'utf-8')
        .then(content => JSON.parse(content) as { status?: string; nextStage?: string; stage?: string })
        .catch(() => null);
      validationDocStatus = parsed?.status ?? null;
      validationSummaryMessage = validationDocStatus
        ? `Validation report status: ${validationDocStatus}.`
        : 'Validation report found and parsed.';
    }

    const errors = await fs.readFile(errorsPath, 'utf-8')
      .then(content => JSON.parse(content) as { errors?: unknown[]; warnings?: unknown[] })
      .catch(() => ({ errors: [], warnings: [] }));

    const errorCount = Array.isArray(errors.errors) ? errors.errors.length : 0;
    const warningCount = Array.isArray(errors.warnings) ? errors.warnings.length : 0;

    const checks: ValidationCheck[] = [
      toCheck(
        'technical-validation-report',
        'technical',
        'Validation Report Artifact',
        hasValidation ? (validationDocStatus === 'failed' ? 'failed' : 'passed') : 'pending',
        validationSummaryMessage
      ),
      toCheck(
        'technical-errors-json',
        'technical',
        'Workflow Error Scan',
        errorCount > 0 ? 'failed' : warningCount > 0 ? 'warning' : 'passed',
        `Errors: ${errorCount}, warnings: ${warningCount}.`
      ),
      toCheck(
        'browser-assets',
        'browser',
        'Browser Validation Output',
        hasOutreachAssets ? 'passed' : 'pending',
        hasOutreachAssets
          ? 'Outreach assets file exists (Stage 15 output).'
          : 'Stage 15 output not found yet.'
      ),
      toCheck(
        'regression-stage-state',
        'regression',
        'Stage State Progress',
        currentStage >= 13 ? 'passed' : 'pending',
        `Current stage: S${currentStage || 0}.`
      ),
      toCheck(
        'production-final-package',
        'production',
        'Final Formatted Package',
        hasFinalPackage ? 'passed' : 'pending',
        hasFinalPackage
          ? 'Final formatted package exists.'
          : 'Final formatted package not generated yet.'
      ),
      toCheck(
        'production-learning-log',
        'production',
        'Campaign Learning Log',
        hasLearningLog ? 'passed' : 'pending',
        hasLearningLog
          ? 'Campaign learning log exists.'
          : 'Campaign learning log not generated yet.'
      ),
    ];

    const governanceSummaries: GovernanceSummary[] = [];
    if (currentStage >= 10) {
      const governanceStages: Array<10 | 11 | 12> = [10, 11, 12];
      for (const stage of governanceStages) {
        if (stage > currentStage) {
          continue;
        }
        const governance = await validateStagePitchGovernance(campaignPath, stage);
        governanceSummaries.push({
          stage,
          filePath: governance.filePath,
          valid: governance.valid,
          issueCount: governance.issues.length,
          warningCount: governance.warnings.length,
          issues: governance.issues,
          warnings: governance.warnings,
        });

        checks.push(
          toCheck(
            `governance-s${stage}`,
            'technical',
            `S${stage} Claim/Lang Governance`,
            governance.valid ? (governance.warnings.length > 0 ? 'warning' : 'passed') : 'failed',
            governance.valid
              ? `S${stage} governance checks passed${governance.warnings.length ? ` with ${governance.warnings.length} warning(s).` : '.'}`
              : `S${stage} governance blocked: ${governance.issues.length} issue(s).`
          )
        );
      }
    }

    const totals = {
      total: checks.length,
      passed: checks.filter(check => check.status === 'passed').length,
      failed: checks.filter(check => check.status === 'failed').length,
      warning: checks.filter(check => check.status === 'warning').length,
      pending: checks.filter(check => check.status === 'pending').length,
    };

    return ok({
      campaignId,
      currentStage,
      checks,
      governance: {
        hasBlockingIssues: governanceSummaries.some(summary => !summary.valid),
        summaries: governanceSummaries,
      },
      totals,
      readinessScore: Math.round((totals.passed / totals.total) * 100),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return fail(
      'FAILED_TO_LOAD_VALIDATION',
      'Failed to load validation status.',
      { status: 500 },
      error instanceof Error ? error.message : String(error)
    );
  }
}
