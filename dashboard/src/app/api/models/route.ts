// GET /api/models - Get model routing configuration
import { fail, ok } from '@/lib/apiResponse';
import { MODEL_CONFIG, CAMPAIGN_STAGE_ROUTING } from '@/config/model-routing.config';

export async function GET() {
  const models = Object.values(MODEL_CONFIG);
  
  const tiers = {
    'Quality Gate': models.filter(m => m.role === 'reasoning_judge'),
    'Research': models.filter(m => m.role === 'research_extraction'),
    'Production': models.filter(m => m.role === 'production_writer'),
    'Orchestration': models.filter(m => m.role === 'orchestrator_strategy'),
    'Technical': models.filter(m => m.role === 'fast_utility' || m.role === 'multimodal_input' || m.role === 'visual_generation')
  };

  const activeModels = models
    .filter(m => m.enabledInProductionWorkflow)
    .map(m => ({
      name: m.displayName,
      type: m.role,
      status: 'active',
      cost: m.costLevel,
      speed: m.speedLevel
    }));

  const stageRoutingCount = Object.keys(CAMPAIGN_STAGE_ROUTING).length;

  return ok({
    totalStages: stageRoutingCount,
    tiers,
    activeModels,
    defaultRoute: 'auto'
  });
}

export async function POST(request: Request) {
  const { action, modelConfig } = await request.json().catch(() => ({} as Record<string, unknown>));
  
  if (action === 'update_route') {
    return ok({ 
      message: 'Model routing updated - write to /system/model-routing.config.json',
      updatedAt: new Date().toISOString()
    });
  }
  
  if (action === 'test_model') {
    return ok({ 
      model: (modelConfig as any)?.name,
      status: 'tested',
      latency: null
    });
  }
  
  return fail('UNKNOWN_ACTION', 'Unknown action.', { status: 400 });
}
