module.exports = function handler(req, res) {
  const routes = [
    { stageName: 'Campaign Intake', owner: 'digital-pr-orchestrator', taskType: 'data-collection', recommendedModel: 'tiny-qa', fallbackModel: 'basic-lm', cost: 'low', speed: 'fast', reason: 'light-weight intake' },
    { stageName: 'Study Extraction', owner: 'study-insight-extractor', taskType: 'info-extraction', recommendedModel: 'mid-level-rl', fallbackModel: 'low-latency', cost: 'low-mid', speed: 'medium' , reason: 'reasoning + extraction' },
    { stageName: 'Research Enrichment', owner: 'research-enrichment-agent', taskType: 'search+reasoning', recommendedModel: 'search+reasoning-model', fallbackModel: 'quick-answer', cost: 'medium', speed: 'medium', reason: 'combine fetch + synthesis' },
    { stageName: 'Angle Generation', owner: 'angle-generator', taskType: 'creative', recommendedModel: 'high-reasoning', fallbackModel: 'mid', cost: 'high', speed: 'slow', reason: 'creative synthesis' },
    { stageName: 'Beat Matching + Outreach Gate', owner: 'beat-matcher', taskType: 'planning', recommendedModel: 'high-reasoning', fallbackModel: 'mid', cost: 'high', speed: 'medium', reason: 'matching angles to beats' },
    { stageName: 'Journalist Targeting + Intelligence', owner: 'journalist-intelligence', taskType: 'automation+analysis', recommendedModel: 'mid', fallbackModel: 'low', cost: 'mid', speed: 'medium', reason: 'targeting + scoring' },
    { stageName: 'Pitch Drafting', owner: 'pitch-writer', taskType: 'writing', recommendedModel: 'high-quality-writing', fallbackModel: 'mid', cost: 'high', speed: 'medium', reason: 'creative writing' },
    { stageName: 'Email Optimization', owner: 'email-optimizer', taskType: 'writing+reasoning', recommendedModel: 'high-writing', fallbackModel: 'mid', cost: 'high', speed: 'fast', reason: 'email craft' },
    { stageName: 'Final Packaging', owner: 'final-doc-packager', taskType: 'assembly', recommendedModel: 'small-mid', fallbackModel: 'tiny', cost: 'low-mid', speed: 'fast', reason: 'packaging' },
    { stageName: 'Google Doc Export', owner: 'export-automation', taskType: 'scripting', recommendedModel: 'automation', fallbackModel: 'script', cost: 'low', speed: 'fast', reason: 'doc export' },
    { stageName: 'Technical Validation', owner: 'digital-pr-orchestrator', taskType: 'deterministic', recommendedModel: 'deterministic-scripts', fallbackModel: 'basic', cost: 'low', speed: 'fast', reason: 'validation scripts' }
  ];
  res.status(200).json(routes);
};
