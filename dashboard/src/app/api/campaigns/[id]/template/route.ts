// GET /api/campaigns/[id]/template - Get template selection and status
// POST /api/campaigns/[id]/template - Select and apply template
// GET /api/campaigns/[id]/template/match - Get template match suggestions
// GET /api/campaigns/[id]/template/fit - Get template fit report
// GET /api/campaigns/[id]/template/guidance - Get guidance for specific stage

import { ok, fail } from '@/lib/apiResponse';
import fs from 'fs/promises';
import path from 'path';
import {
  loadTemplateRegistry,
  loadTemplate,
  matchTemplate,
  selectTemplate,
  getTemplateSelection,
  applyTemplate,
  generateTemplateFitReport,
  getTemplateForStage,
  getActiveTemplates,
  validateTemplate,
  type TemplateMatchResult,
  type TemplateApplicationLog
} from '@/lib/campaignTemplateManager';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const campaignSlug = params.id;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  try {
    switch (action) {
      case 'list': {
        const templates = await getActiveTemplates();
        return ok({ templates });
      }
      
      case 'match': {
        const topic = url.searchParams.get('topic') || '';
        const keywords = url.searchParams.get('keywords')?.split(',') || [];
        const userSelectedType = url.searchParams.get('userSelectedType') || undefined;
        const result = await matchTemplate(topic, keywords, userSelectedType);
        return ok(result);
      }
      
      case 'selection': {
        const selection = await getTemplateSelection(campaignSlug);
        return ok(selection || { selected: false });
      }
      
      case 'fit': {
        const topic = url.searchParams.get('topic') || '';
        const keywords = url.searchParams.get('keywords')?.split(',') || [];
        const report = await generateTemplateFitReport(campaignSlug, topic, keywords);
        return ok(report);
      }
      
      case 'guidance': {
        const stageId = url.searchParams.get('stageId');
        if (!stageId) {
          return fail('STAGE_ID_REQUIRED', 'stageId required', { status: 400 });
        }
        const guidance = await getTemplateForStage(campaignSlug, stageId);
        return ok(guidance || { noGuidance: true });
      }
      
      case 'validate': {
        const templateId = url.searchParams.get('templateId');
        if (!templateId) {
          return fail('TEMPLATE_ID_REQUIRED', 'templateId required', { status: 400 });
        }
        const template = await loadTemplate(templateId);
        const validation = await validateTemplate(template);
        return ok(validation);
      }
      
      default: {
        const selection = await getTemplateSelection(campaignSlug);
        const templates = await getActiveTemplates();
        return ok({
          hasSelection: !!selection,
          selection,
          availableTemplates: templates
        });
      }
    }
  } catch (error) {
    return fail(
      'TEMPLATE_OPERATION_FAILED',
      `Template operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const campaignSlug = params.id;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  try {
    const body = await request.json();
    
    switch (action) {
      case 'select': {
        const { templateId, selectionMethod, topic, keywords } = body;
        if (!templateId) {
          return fail('TEMPLATE_ID_REQUIRED', 'templateId required', { status: 400 });
        }
        
        let matchedResult: TemplateMatchResult | undefined;
        if (topic) {
          matchedResult = await matchTemplate(topic, keywords || [], body.userSelectedType);
        }
        
        const selection = await selectTemplate(
          campaignSlug,
          templateId,
          selectionMethod || 'human',
          matchedResult
        );
        
        return ok(selection);
      }
      
      case 'apply': {
        const { stages } = body;
        const stagesToApply = stages || ['S1_CAMPAIGN_INTAKE', 'S2_DATA_EXTRACTION', 'S3_RESEARCH_ENRICHMENT'];
        const log = await applyTemplate(campaignSlug, stagesToApply);
        return ok(log);
      }
      
      case 'auto_match': {
        const { topic, keywords } = body;
        if (!topic) {
          return fail('TOPIC_REQUIRED', 'topic required', { status: 400 });
        }
        
        const result = await matchTemplate(topic, keywords || [], body.userSelectedType);
        const selection = await selectTemplate(campaignSlug, result.recommendedTemplateId, 'auto', result);
        
        return ok({
          matchResult: result,
          selection
        });
      }
      
      default: {
        const { templateId, topic, keywords, selectionMethod, stages } = body;
        
        if (!templateId) {
          return fail('TEMPLATE_ID_REQUIRED', 'templateId required', { status: 400 });
        }
        
        let matchedResult: TemplateMatchResult | undefined;
        if (topic) {
          matchedResult = await matchTemplate(topic, keywords || [], body.userSelectedType);
        }
        
        const selection = await selectTemplate(
          campaignSlug,
          templateId,
          selectionMethod || 'human',
          matchedResult
        );
        
        if (stages && stages.length > 0) {
          const log = await applyTemplate(campaignSlug, stages);
          return ok({ selection, applicationLog: log });
        }
        
        return ok(selection);
      }
    }
  } catch (error) {
    return fail(
      'TEMPLATE_OPERATION_FAILED',
      `Template operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
}
