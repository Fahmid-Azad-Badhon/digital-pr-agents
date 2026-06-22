import fs from 'fs/promises';
import path from 'path';
import { DATA_ROOT } from '@/lib/requestGuard';

export interface ModelPerformanceEntry {
  id: string;
  modelKey: string;
  stageId: string;
  campaignId: string;
  timestamp: string;
  success: boolean;
  qualityScore?: number;
  durationMs: number;
  fallbackTriggered: boolean;
  fallbackReason?: string;
  errorMessage?: string;
  tokensUsed?: number;
  costUSD?: number;
  promptVersion?: string;
  temperature?: number;
}

export interface ModelPerformanceAggregate {
  modelKey: string;
  totalCalls: number;
  successCount: number;
  fallbackCount: number;
  averageQualityScore: number;
  averageDurationMs: number;
  averageTokensUsed: number;
  averageCostUSD: number;
  successRate: number;
  fallbackRate: number;
  commonFailureReasons: string[];
  bestForStages: string[];
  lastUpdated: string;
}

const PERFORMANCE_LOG_PATH = path.join(DATA_ROOT, 'model-performance.json');

export async function getModelPerformanceByModel(modelKey: string): Promise<ModelPerformanceAggregate | null> {
  try {
    const content = await fs.readFile(PERFORMANCE_LOG_PATH, 'utf-8');
    const logs: ModelPerformanceEntry[] = JSON.parse(content);
    
    const modelLogs = logs.filter(l => l.modelKey === modelKey);
    
    if (modelLogs.length === 0) {
      return null;
    }

    const successCount = modelLogs.filter(l => l.success).length;
    const fallbackCount = modelLogs.filter(l => l.fallbackTriggered).length;
    
    const qualityScores = modelLogs.filter(l => l.qualityScore !== undefined).map(l => l.qualityScore!);
    const avgQuality = qualityScores.length > 0 
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length 
      : 0;

    const failureReasons = modelLogs
      .filter(l => !l.success && l.fallbackReason)
      .map(l => l.fallbackReason!);

    const reasonCounts: Record<string, number> = {};
    for (const reason of failureReasons) {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    }
    const commonReasons = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason]) => reason);

    const stageSuccessRates: Record<string, { success: number; total: number }> = {};
    for (const log of modelLogs) {
      if (!stageSuccessRates[log.stageId]) {
        stageSuccessRates[log.stageId] = { success: 0, total: 0 };
      }
      stageSuccessRates[log.stageId].total++;
      if (log.success) {
        stageSuccessRates[log.stageId].success++;
      }
    }
    const bestStages = Object.entries(stageSuccessRates)
      .filter(([, stats]) => stats.success / stats.total >= 0.8)
      .map(([stage]) => stage);

    return {
      modelKey,
      totalCalls: modelLogs.length,
      successCount,
      fallbackCount,
      averageQualityScore: Math.round(avgQuality * 10) / 10,
      averageDurationMs: Math.round(modelLogs.reduce((a, l) => a + l.durationMs, 0) / modelLogs.length),
      averageTokensUsed: Math.round(modelLogs.reduce((a, l) => a + (l.tokensUsed || 0), 0) / modelLogs.length),
      averageCostUSD: Math.round(modelLogs.reduce((a, l) => a + (l.costUSD || 0), 0) / modelLogs.length * 1000) / 1000,
      successRate: Math.round((successCount / modelLogs.length) * 100),
      fallbackRate: Math.round((fallbackCount / modelLogs.length) * 100),
      commonFailureReasons: commonReasons,
      bestForStages: bestStages,
      lastUpdated: new Date().toISOString()
    };
  } catch {
    return null;
  }
}

export async function getAllModelPerformance(): Promise<Record<string, ModelPerformanceAggregate>> {
  const models = [
    'nemotron_3_ultra', 'nemotron_3_super', 'minimax_m25',
    'gpt_oss_120b', 'hermes_3_405b', 'qwen3_coder',
    'gemma_4_31b', 'nemotron_3_nano_30b'
  ];

  const results: Record<string, ModelPerformanceAggregate> = {};
  
  for (const model of models) {
    const aggregate = await getModelPerformanceByModel(model);
    if (aggregate) {
      results[model] = aggregate;
    }
  }

  return results;
}

export async function getAutoRecommendations(): Promise<string[]> {
  const recommendations: string[] = [];
  const performance = await getAllModelPerformance();

  for (const [model, stats] of Object.entries(performance)) {
    if (stats.fallbackRate > 30) {
      recommendations.push(`⚠️ ${model}: Fallback rate ${stats.fallbackRate}% - consider reordering fallbacks`);
    }
    if (stats.successRate < 70) {
      recommendations.push(`❌ ${model}: Success rate ${stats.successRate}% - consider disabling for production`);
    }
    if (stats.averageDurationMs > 60000) {
      recommendations.push(`⏱️ ${model}: Average latency ${Math.round(stats.averageDurationMs/1000)}s - may need timeout adjustment`);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All models performing within acceptable parameters');
  }

  return recommendations;
}