/**
 * =============================================================================
 * CAMPAIGN TEMPLATE MODULE
 * =============================================================================
 * 
 * Complete system for loading, matching, validating, and applying campaign templates.
 * 
 * =============================================================================
 */

import fs from 'fs/promises';
import path from 'path';

const TEMPLATES_DIR = 'D:\\Codex Folder\\digital-pr-agents\\templates\\campaigns';
const CAMPAIGNS_DIR = 'D:\\Codex Folder\\digital-pr-agents\\pitch-jobs';

// =============================================================================
// TYPES
// =============================================================================

export interface TemplateRegistry {
  version: string;
  lastUpdated: string;
  templates: TemplateSummary[];
  genericTemplate: { templateId: string; templateName: string; file: string; description: string; status: string };
}

export interface TemplateSummary {
  templateId: string;
  templateName: string;
  file: string;
  description: string;
  matchKeywords: string[];
  primaryBeats: string[];
  riskLevel: string;
  status: string;
}

export interface CampaignTemplate {
  templateId: string;
  templateName: string;
  version: string;
  status: string;
  description: string;
  bestForTopics: string[];
  notBestForTopics: string[];
  defaultRiskLevel: string;
  topicExpansionGuidance: {
    relatedTerms: string[];
    entities: string[];
    affectedGroups: string[];
    geographyLevels: string[];
    timeDimensions: string[];
    possibleMetrics: string[];
    possibleBreakdowns: Record<string, string[]>;
  };
  sourcePriorities: {
    tierA: string[];
    tierB: string[];
    tierC: string[];
    tierD: string[];
    avoidOrUseCarefully: string[];
  };
  commonDataPoints: string[];
  commonComparisons: string[];
  localizationStrategy: {
    bestGeographyLevels: string[];
    localHooks: string[];
    localDataNeeded: string[];
    localRiskWarnings: string[];
  };
  journalistBeatMap: {
    primaryBeats: string[];
    secondaryBeats: string[];
    tertiaryBeats: string[];
    avoidBeats: string[];
  };
  angleGuidance: {
    strongAngleTypes: string[];
    weakAngleTypes: string[];
    commonHooks: string[];
    avoidFrames: string[];
  };
  pitchGuidance: {
    recommendedStructure: string[];
    preferredCTAStyle: string;
    clientMentionGuidance: string;
    sourceMentionGuidance: string;
  };
  riskWarnings: string[];
  unsafeClaims: string[];
  safeLanguageExamples: string[];
  validationRules: string[];
  dashboardNotes: string[];
}

export interface TemplateMatchResult {
  recommendedTemplateId: string;
  secondaryTemplateIds: string[];
  confidence: 'high' | 'medium' | 'low';
  matchReasons: string[];
  humanSelectionRecommended: boolean;
}

export interface TemplateSelection {
  campaignSlug: string;
  selectedTemplateId: string;
  selectedTemplateName: string;
  secondaryTemplates: string[];
  selectionMethod: 'auto' | 'human' | 'manual_override' | 'generic';
  confidence: 'high' | 'medium' | 'low';
  selectedAt: string;
  selectedBy: string;
  matchReasons: string[];
  templateVersion: string;
  notes: string[];
}

export interface TemplateApplicationLog {
  campaignSlug: string;
  templateId: string;
  templateVersion: string;
  appliedAt: string;
  appliedToStages: string[];
  injectedGuidance: {
    stageId: string;
    guidanceType: string;
    fieldsApplied: string[];
    notes: string[];
  }[];
  notApplied: string[];
  warnings: string[];
}

export interface TemplateFitReport {
  campaignSlug: string;
  recommendedTemplate: string;
  confidence: 'high' | 'medium' | 'low';
  matchReasons: string[];
  mismatchWarnings: string[];
  secondaryTemplates: string[];
  humanReviewRecommended: boolean;
  notes: string[];
}

// =============================================================================
// REGISTRY LOADING
// =============================================================================

export async function loadTemplateRegistry(): Promise<TemplateRegistry> {
  const registryPath = path.join(TEMPLATES_DIR, 'template-registry.json');
  try {
    const data = await fs.readFile(registryPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to load template registry: ${error}`);
  }
}

// =============================================================================
// TEMPLATE LOADING
// =============================================================================

export async function loadTemplate(templateId: string): Promise<CampaignTemplate> {
  const registry = await loadTemplateRegistry();
  const templateSummary = registry.templates.find(t => t.templateId === templateId);
  
  if (!templateSummary) {
    if (templateId === 'generic' || templateId === registry.genericTemplate.templateId) {
      const genericPath = path.join(TEMPLATES_DIR, registry.genericTemplate.file);
      const data = await fs.readFile(genericPath, 'utf-8');
      return JSON.parse(data);
    }
    throw new Error(`Template not found: ${templateId}`);
  }
  
  const templatePath = path.join(TEMPLATES_DIR, templateSummary.file);
  const data = await fs.readFile(templatePath, 'utf-8');
  return JSON.parse(data);
}

export async function loadAllTemplates(): Promise<CampaignTemplate[]> {
  const registry = await loadTemplateRegistry();
  const templates: CampaignTemplate[] = [];
  
  for (const summary of registry.templates) {
    if (summary.status === 'active') {
      try {
        const template = await loadTemplate(summary.templateId);
        templates.push(template);
      } catch {
        // Skip invalid templates
      }
    }
  }
  
  return templates;
}

// =============================================================================
// TEMPLATE VALIDATION
// =============================================================================

export async function validateTemplate(template: CampaignTemplate): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  if (!template.templateId) errors.push('Missing templateId');
  if (!template.templateName) errors.push('Missing templateName');
  if (!template.version) errors.push('Missing version');
  if (!template.status) errors.push('Missing status');
  if (!['active', 'draft', 'archived'].includes(template.status)) errors.push('Invalid status');
  
  if (!template.sourcePriorities) errors.push('Missing sourcePriorities');
  else {
    if (!template.sourcePriorities.tierA) errors.push('Missing sourcePriorities.tierA');
    if (!template.sourcePriorities.avoidOrUseCarefully) errors.push('Missing sourcePriorities.avoidOrUseCarefully');
  }
  
  if (!template.riskWarnings) errors.push('Missing riskWarnings');
  if (!template.journalistBeatMap) errors.push('Missing journalistBeatMap');
  if (!template.journalistBeatMap.primaryBeats) errors.push('Missing journalistBeatMap.primaryBeats');
  if (!template.unsafeClaims) errors.push('Missing unsafeClaims');
  if (!template.safeLanguageExamples) errors.push('Missing safeLanguageExamples');
  if (!template.validationRules) errors.push('Missing validationRules');
  
  return { valid: errors.length === 0, errors };
}

// =============================================================================
// TEMPLATE MATCHING
// =============================================================================

export async function matchTemplate(
  topic: string,
  keywords: string[] = [],
  userSelectedType?: string
): Promise<TemplateMatchResult> {
  const registry = await loadTemplateRegistry();
  const allKeywords = [...keywords];
  
  if (userSelectedType) {
    allKeywords.push(...userSelectedType.split(/[\s,-]/));
  }
  
  const topicLower = topic.toLowerCase();
  allKeywords.push(...topicLower.split(/[\s,-]/));
  
  const scores: { templateId: string; score: number; reasons: string[] }[] = [];
  
  for (const template of registry.templates) {
    if (template.status !== 'active') continue;
    
    let score = 0;
    const reasons: string[] = [];
    
    for (const keyword of template.matchKeywords) {
      const keywordLower = keyword.toLowerCase();
      if (topicLower.includes(keywordLower)) {
        score += 3;
        reasons.push(`topic contains "${keyword}"`);
      } else if (allKeywords.some(k => k.includes(keywordLower) || keywordLower.includes(k))) {
        score += 2;
        reasons.push(`keyword "${keyword}" matches`);
      }
    }
    
    if (score > 0) {
      scores.push({ templateId: template.templateId, score, reasons });
    }
  }
  
  scores.sort((a, b) => b.score - a.score);
  
  if (scores.length === 0) {
    return {
      recommendedTemplateId: 'generic',
      secondaryTemplateIds: [],
      confidence: 'low',
      matchReasons: ['No specific template matched, using generic'],
      humanSelectionRecommended: true
    };
  }
  
  const topScore = scores[0].score;
  const topTemplates = scores.filter(s => s.score === topScore);
  
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (topScore >= 5) confidence = 'high';
  else if (topScore >= 2) confidence = 'medium';
  
  return {
    recommendedTemplateId: topTemplates[0].templateId,
    secondaryTemplateIds: topTemplates.slice(1).map(t => t.templateId),
    confidence,
    matchReasons: topTemplates[0].reasons,
    humanSelectionRecommended: confidence === 'low' || topTemplates.length > 2
  };
}

// =============================================================================
// TEMPLATE SELECTION
// =============================================================================

export async function selectTemplate(
  campaignSlug: string,
  templateId: string,
  selectionMethod: 'auto' | 'human' | 'manual_override',
  matchedResult?: TemplateMatchResult
): Promise<TemplateSelection> {
  const template = await loadTemplate(templateId);
  
  const selection: TemplateSelection = {
    campaignSlug,
    selectedTemplateId: templateId,
    selectedTemplateName: template.templateName,
    secondaryTemplates: matchedResult?.secondaryTemplateIds || [],
    selectionMethod,
    confidence: matchedResult?.confidence || 'medium',
    selectedAt: new Date().toISOString(),
    selectedBy: selectionMethod === 'auto' ? 'system' : 'human',
    matchReasons: matchedResult?.matchReasons || [],
    templateVersion: template.version,
    notes: []
  };
  
  const selectionPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'template-selection.json');
  await fs.writeFile(selectionPath, JSON.stringify(selection, null, 2), 'utf-8');
  
  return selection;
}

export async function getTemplateSelection(campaignSlug: string): Promise<TemplateSelection | null> {
  const selectionPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'template-selection.json');
  try {
    const data = await fs.readFile(selectionPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// =============================================================================
// TEMPLATE APPLICATION
// =============================================================================

export async function applyTemplate(
  campaignSlug: string,
  stagesToApply: string[]
): Promise<TemplateApplicationLog> {
  const selection = await getTemplateSelection(campaignSlug);
  if (!selection) {
    throw new Error('No template selected for this campaign');
  }
  
  const template = await loadTemplate(selection.selectedTemplateId);
  
  const injectedGuidance: TemplateApplicationLog['injectedGuidance'] = [];
  const notApplied: string[] = [];
  
  for (const stageId of stagesToApply) {
    switch (stageId) {
      case 'S1_CAMPAIGN_INTAKE':
        if (template.topicExpansionGuidance) {
          injectedGuidance.push({
            stageId,
            guidanceType: 'topic_expansion',
            fieldsApplied: ['relatedTerms', 'possibleMetrics', 'affectedGroups', 'geographyLevels'],
            notes: ['Injected from template topicExpansionGuidance']
          });
        } else {
          notApplied.push(stageId);
        }
        break;
        
      case 'S2_DATA_EXTRACTION':
        if (template.commonDataPoints && template.topicExpansionGuidance?.possibleBreakdowns) {
          injectedGuidance.push({
            stageId,
            guidanceType: 'extraction_focus',
            fieldsApplied: ['commonDataPoints', 'possibleBreakdowns'],
            notes: ['Injected from template commonDataPoints']
          });
        } else {
          notApplied.push(stageId);
        }
        break;
        
      case 'S3_RESEARCH_ENRICHMENT':
        if (template.sourcePriorities && template.localizationStrategy) {
          injectedGuidance.push({
            stageId,
            guidanceType: 'research_strategy',
            fieldsApplied: ['sourcePriorities', 'commonComparisons', 'localizationStrategy'],
            notes: ['Injected from template sourcePriorities']
          });
        } else {
          notApplied.push(stageId);
        }
        break;
        
      case 'S4A_DATA_RESEARCH_ANALYST':
        if (template.riskWarnings && template.unsafeClaims) {
          injectedGuidance.push({
            stageId,
            guidanceType: 'verification_guidance',
            fieldsApplied: ['riskWarnings', 'unsafeClaims', 'validationRules', 'safeLanguageExamples'],
            notes: ['Injected from template riskWarnings']
          });
        } else {
          notApplied.push(stageId);
        }
        break;
        
      case 'S5_ANGLE_GENERATION':
        if (template.angleGuidance) {
          injectedGuidance.push({
            stageId,
            guidanceType: 'angle_guidance',
            fieldsApplied: ['strongAngleTypes', 'weakAngleTypes', 'commonHooks', 'avoidFrames'],
            notes: ['Injected from template angleGuidance']
          });
        } else {
          notApplied.push(stageId);
        }
        break;
        
      case 'S6_BEAT_MATCHING':
        if (template.journalistBeatMap) {
          injectedGuidance.push({
            stageId,
            guidanceType: 'beat_matching',
            fieldsApplied: ['primaryBeats', 'secondaryBeats', 'avoidBeats'],
            notes: ['Injected from template journalistBeatMap']
          });
        } else {
          notApplied.push(stageId);
        }
        break;
        
      case 'S10_PITCH_DRAFTING':
        if (template.pitchGuidance) {
          injectedGuidance.push({
            stageId,
            guidanceType: 'pitch_structure',
            fieldsApplied: ['recommendedStructure', 'preferredCTAStyle', 'sourceMentionGuidance'],
            notes: ['Injected from template pitchGuidance']
          });
        } else {
          notApplied.push(stageId);
        }
        break;
        
      case 'S13_VALIDATION':
        if (template.riskWarnings && template.validationRules) {
          injectedGuidance.push({
            stageId,
            guidanceType: 'validation_rules',
            fieldsApplied: ['riskWarnings', 'unsafeClaims', 'validationRules'],
            notes: ['Injected from template validationRules']
          });
        } else {
          notApplied.push(stageId);
        }
        break;
        
      default:
        notApplied.push(stageId);
    }
  }
  
  const log: TemplateApplicationLog = {
    campaignSlug,
    templateId: template.templateId,
    templateVersion: template.version,
    appliedAt: new Date().toISOString(),
    appliedToStages: stagesToApply.filter(s => !notApplied.includes(s)),
    injectedGuidance,
    notApplied,
    warnings: []
  };
  
  const logPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'template-application-log.json');
  await fs.writeFile(logPath, JSON.stringify(log, null, 2), 'utf-8');
  
  return log;
}

// =============================================================================
// TEMPLATE FIT REPORT
// =============================================================================

export async function generateTemplateFitReport(
  campaignSlug: string,
  topic: string,
  keywords: string[] = []
): Promise<TemplateFitReport> {
  const currentSelection = await getTemplateSelection(campaignSlug);
  const matchResult = await matchTemplate(topic, keywords);
  
  const mismatchWarnings: string[] = [];
  
  if (currentSelection) {
    if (currentSelection.selectedTemplateId !== matchResult.recommendedTemplateId) {
      mismatchWarnings.push(`Current selection (${currentSelection.selectedTemplateId}) differs from recommended (${matchResult.recommendedTemplateId})`);
    }
    if (currentSelection.confidence !== matchResult.confidence) {
      mismatchWarnings.push(`Confidence changed from ${currentSelection.confidence} to ${matchResult.confidence}`);
    }
  }
  
  return {
    campaignSlug,
    recommendedTemplate: matchResult.recommendedTemplateId,
    confidence: matchResult.confidence,
    matchReasons: matchResult.matchReasons,
    mismatchWarnings,
    secondaryTemplates: matchResult.secondaryTemplateIds,
    humanReviewRecommended: matchResult.humanSelectionRecommended,
    notes: []
  };
}

// =============================================================================
// GETTERS
// =============================================================================

export async function getActiveTemplates(): Promise<TemplateSummary[]> {
  const registry = await loadTemplateRegistry();
  return registry.templates.filter(t => t.status === 'active');
}

export async function getTemplateById(templateId: string): Promise<CampaignTemplate | null> {
  try {
    return await loadTemplate(templateId);
  } catch {
    return null;
  }
}

export async function getTemplateRiskLevel(templateId: string): Promise<string> {
  const template = await loadTemplate(templateId);
  return template.defaultRiskLevel;
}

export async function getTemplateForStage(
  campaignSlug: string,
  stageId: string
): Promise<Record<string, any> | null> {
  const selection = await getTemplateSelection(campaignSlug);
  if (!selection) return null;
  
  const template = await loadTemplate(selection.selectedTemplateId);
  
  switch (stageId) {
    case 'S1_CAMPAIGN_INTAKE':
      return template.topicExpansionGuidance || null;
    case 'S2_DATA_EXTRACTION':
      return {
        commonDataPoints: template.commonDataPoints,
        possibleBreakdowns: template.topicExpansionGuidance?.possibleBreakdowns
      };
    case 'S3_RESEARCH_ENRICHMENT':
      return {
        sourcePriorities: template.sourcePriorities,
        commonComparisons: template.commonComparisons,
        localizationStrategy: template.localizationStrategy
      };
    case 'S4A_DATA_RESEARCH_ANALYST':
    case 'S13_VALIDATION':
      return {
        riskWarnings: template.riskWarnings,
        unsafeClaims: template.unsafeClaims,
        safeLanguageExamples: template.safeLanguageExamples,
        validationRules: template.validationRules
      };
    case 'S5_ANGLE_GENERATION':
      return template.angleGuidance || null;
    case 'S6_BEAT_MATCHING':
      return template.journalistBeatMap || null;
    case 'S10_PITCH_DRAFTING':
      return template.pitchGuidance || null;
    default:
      return null;
  }
}