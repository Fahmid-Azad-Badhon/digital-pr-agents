/**
 * =============================================================================
 * COMPREHENSIVE AGENT DATA - All 13 Digital PR Agents Fully Expanded
 * =============================================================================
 * 
 * Each agent contains:
 * - 15-20 detailed tasks
 * - 10-15 detailed capabilities
 * - Full identity, role, visual, description, responsibilities
 * - Inputs, outputs, workflow connections
 * - Automation, efficiency, metrics, stats
 * - Stage history, quality control, error handling
 * - Limitations, examples, UI, status
 * 
 * Total: 195-260+ tasks, 130+ capabilities across 13 agents
 * 
 * =============================================================================
 */

// =============================================================================
// AGENT 1: ORCHESTRATOR - Workflow Controller
// =============================================================================

export const ORCHESTRATOR_AGENT = {
  identity: {
    id: 'orchestrator',
    slug: 'orchestrator',
    fullName: 'Digital PR Orchestrator Agent',
    shortName: 'Orchestrator',
    displayName: 'Orchestrator',
    internalName: 'agent_orchestrator',
    agentNumber: 1,
    tagline: 'Central command for the entire Digital PR workflow.',
    oneLineSummary: 'Manages stage transitions, delegates tasks, monitors progress, handles human approval gates.',
    category: 'Orchestration',
    subCategory: 'Workflow Management',
    workflowStage: 'strategy' as const,
    complexityLevel: 'expert' as const,
    priority: 'critical' as const
  },
  role: {
    title: 'Workflow Controller',
    primaryPurpose: 'To oversee and coordinate the entire 15-stage Digital PR workflow pipeline.',
    detailedRole: 'The Orchestrator acts as the central command center for the entire workflow. It manages stage transitions, delegates tasks to specialized sub-agents, monitors progress across all stages, manages the human approval gate at Stage 7, handles error recovery, and ensures smooth handoffs between agents.',
    problemSolved: 'Prevents workflow fragmentation by keeping all stages synchronized.',
    businessValue: 'Ensures campaign delivery on time by managing dependencies.',
    userBenefit: 'Users can trust the system to move campaigns forward automatically.',
    workflowImportance: 'Critical - every other agent depends on the Orchestrator.'
  },
  visual: {
    color: { name: 'Orchestrator Blue', hex: '#2563EB', softHex: '#DBEAFE', darkHex: '#1E3A8A', gradientFrom: '#2563EB', gradientTo: '#60A5FA', textColor: '#FFFFFF', usageReason: 'Blue represents authority and control.' },
    avatar: { name: 'Command Center', personality: 'Strategic, organized, decisive.', iconName: 'Brain', emojiFallback: '🧠', avatarStyle: 'Modern comic-style AI with command center aesthetic.' },
    badge: { label: 'Core', tone: 'blue', iconName: 'Activity' }
  },
  description: {
    short: 'Central command for the entire Digital PR workflow.',
    medium: 'The Orchestrator manages stage transitions, delegates tasks, monitors progress.',
    long: 'The Orchestrator is the central nervous system of the Digital PR workflow.',
    userFacingExplanation: 'This agent runs automatically, managing your campaign.',
    adminExplanation: 'Configure with retry logic and human approval triggers.',
    dashboardTooltip: 'Manages the entire workflow pipeline.'
  },
  responsibilities: {
    primaryResponsibilities: [
      'Manage campaign state across all 15 stages',
      'Delegate tasks to appropriate specialized agents',
      'Track workflow progress and completion status',
      'Handle Stage 7 human approval gate',
      'Manage stage transitions and handoffs',
      'Monitor for errors and trigger recovery'
    ],
    secondaryResponsibilities: [
      'Provide real-time progress updates',
      'Generate workflow analytics',
      'Coordinate parallel agent activities',
      'Manage campaign-level metadata'
    ],
    notResponsibleFor: [
      'Writing pitch content',
      'Analyzing journalist profiles',
      'Validating technical outputs',
      'Making editorial decisions'
    ],
    decisionAuthority: [
      'Stage transition timing',
      'Agent delegation routing',
      'Retry vs escalation decisions'
    ]
  },
  tasks: [
    { id: 'orch-1', name: 'Initialize Campaign Workflow', description: 'Set up campaign state and trigger Stage 1 execution.', taskType: 'workflow', frequency: 'per-campaign', estimatedTime: '30 seconds', requiredInput: 'Campaign brief', expectedOutput: 'Campaign record with unique ID', successCondition: 'Campaign record created with unique ID', failureCondition: 'Campaign creation fails', relatedCapabilities: ['orch-c1', 'orch-c9'], workflowStage: 'intake', dependsOn: [], handoffTo: 'extractor', automationLevel: 'fully-automated', qualityCheck: 'Verify unique ID generated', userBenefit: 'Campaign starts immediately' },
    { id: 'orch-2', name: 'Delegate Stage Tasks', description: 'Route tasks to appropriate agents based on stage.', taskType: 'delegation', frequency: 'per-stage', estimatedTime: '5 seconds', requiredInput: 'Stage number and context', expectedOutput: 'Task assignment to agent', successCondition: 'Task routed to correct agent', failureCondition: 'Agent unavailable', relatedCapabilities: ['orch-c2', 'orch-c7'], workflowStage: 'all', dependsOn: [], handoffTo: 'various', automationLevel: 'fully-automated', qualityCheck: 'Verify agent availability', userBenefit: 'Tasks auto-routed to right agent' },
    { id: 'orch-3', name: 'Track Stage Progress', description: 'Monitor completion status in real-time.', taskType: 'monitoring', frequency: 'continuous', estimatedTime: 'Real-time', requiredInput: 'Stage status updates', expectedOutput: 'Progress status', successCondition: 'Progress reflects actual status', failureCondition: 'Stale data', relatedCapabilities: ['orch-c3'], workflowStage: 'all', dependsOn: [], handoffTo: null, automationLevel: 'fully-automated', qualityCheck: 'Verify status freshness', userBenefit: 'Real-time progress visibility' },
    { id: 'orch-4', name: 'Manage Human Gate (Stage 7)', description: 'Trigger and monitor the human approval gate.', taskType: 'gate', frequency: 'per-campaign', estimatedTime: 'Manual duration', requiredInput: 'Angle list', expectedOutput: 'User approval decision', successCondition: 'Human approves, workflow continues', failureCondition: 'User rejects', relatedCapabilities: ['orch-c4', 'orch-c6'], workflowStage: 'review', dependsOn: ['orch-2'], handoffTo: 'human-reviewer', automationLevel: 'semi-automated', qualityCheck: 'Verify approval captured', userBenefit: 'Control over angle selection' },
    { id: 'orch-5', name: 'Handle Stage Transition', description: 'Execute smooth handoff between stages.', taskType: 'transition', frequency: 'per-stage', estimatedTime: '10 seconds', requiredInput: 'Stage output', expectedOutput: 'Validated handoff', successCondition: 'Output validated, next stage starts', failureCondition: 'Validation fails', relatedCapabilities: ['orch-c7'], workflowStage: 'all', dependsOn: [], handoffTo: 'next-stage-agent', automationLevel: 'fully-automated', qualityCheck: 'Verify output format', userBenefit: 'Smooth stage progression' },
    { id: 'orch-6', name: 'Detect and Handle Errors', description: 'Identify failures and trigger recovery.', taskType: 'error-handling', frequency: 'as-needed', estimatedTime: 'Variable', requiredInput: 'Error event', expectedOutput: 'Recovery action', successCondition: 'Error handled gracefully', failureCondition: 'Unrecoverable error', relatedCapabilities: ['orch-c5'], workflowStage: 'all', dependsOn: [], handoffTo: null, automationLevel: 'fully-automated', qualityCheck: 'Log error details', userBenefit: 'Automatic error recovery' },
    { id: 'orch-7', name: 'Coordinate Parallel Agents', description: 'Manage multiple agents working simultaneously.', taskType: 'coordination', frequency: 'as-needed', estimatedTime: 'Variable', requiredInput: 'Parallel agent requests', expectedOutput: 'Coordinated execution', successCondition: 'Agents execute without conflicts', failureCondition: 'Resource contention', relatedCapabilities: ['orch-c8'], workflowStage: 'all', dependsOn: [], handoffTo: 'multiple', automationLevel: 'fully-automated', qualityCheck: 'Verify no conflicts', userBenefit: 'Efficient parallel processing' },
    { id: 'orch-8', name: 'Generate Progress Reports', description: 'Create campaign progress summaries.', taskType: 'reporting', frequency: 'on-demand', estimatedTime: '2 seconds', requiredInput: 'Campaign data', expectedOutput: 'Progress report', successCondition: 'Report accurate', failureCondition: 'Incomplete data', relatedCapabilities: ['orch-c10'], workflowStage: 'all', dependsOn: [], handoffTo: null, automationLevel: 'fully-automated', qualityCheck: 'Verify data accuracy', userBenefit: 'Campaign visibility' },
    { id: 'orch-9', name: 'Trigger Workflow Completion', description: 'Finalize campaign when all stages complete.', taskType: 'completion', frequency: 'per-campaign', estimatedTime: '5 seconds', requiredInput: 'All stages complete', expectedOutput: 'Campaign complete status', successCondition: 'All stages complete', failureCondition: 'Incomplete stages', relatedCapabilities: ['orch-c9'], workflowStage: 'production', dependsOn: [], handoffTo: null, automationLevel: 'fully-automated', qualityCheck: 'Verify all complete', userBenefit: 'Campaign finalized' },
    { id: 'orch-10', name: 'Manage Campaign Pause/Resume', description: 'Handle pause or resume workflow state.', taskType: 'state-management', frequency: 'as-needed', estimatedTime: '3 seconds', requiredInput: 'Pause/resume signal', expectedOutput: 'State preserved', successCondition: 'State preserved correctly', failureCondition: 'State corruption', relatedCapabilities: ['orch-c1'], workflowStage: 'all', dependsOn: [], handoffTo: null, automationLevel: 'fully-automated', qualityCheck: 'Verify state integrity', userBenefit: 'Workflow control' },
    { id: 'orch-11', name: 'Escalate to Human Review', description: 'Trigger human intervention when needed.', taskType: 'escalation', frequency: 'as-needed', estimatedTime: 'Immediate', requiredInput: 'Escalation trigger', expectedOutput: 'Human notification', successCondition: 'Human receives notification', failureCondition: 'Notification fails', relatedCapabilities: ['orch-c6'], workflowStage: 'all', dependsOn: [], handoffTo: 'human', automationLevel: 'fully-automated', qualityCheck: 'Verify notification sent', userBenefit: 'Human oversight when needed' },
    { id: 'orch-12', name: 'Coordinate Agent Handshakes', description: 'Ensure agents acknowledge task receipt.', taskType: 'coordination', frequency: 'per-handoff', estimatedTime: '1 second', requiredInput: 'Task assignment', expectedOutput: 'Ack receipt', successCondition: 'Both agents acknowledge', failureCondition: 'Handshake timeout', relatedCapabilities: ['orch-c2', 'orch-c8'], workflowStage: 'all', dependsOn: [], handoffTo: 'receiving-agent', automationLevel: 'fully-automated', qualityCheck: 'Verify acknowledgment', userBenefit: 'Reliable handoffs' },
    { id: 'orch-13', name: 'Validate Stage Dependencies', description: 'Ensure prerequisites are met before stage.', taskType: 'validation', frequency: 'per-stage', estimatedTime: '2 seconds', requiredInput: 'Stage context', expectedOutput: 'Dependency check result', successCondition: 'All dependencies satisfied', failureCondition: 'Missing dependencies', relatedCapabilities: ['orch-c7'], workflowStage: 'all', dependsOn: [], handoffTo: null, automationLevel: 'fully-automated', qualityCheck: 'Verify dependencies', userBenefit: 'Prevents invalid transitions' },
    { id: 'orch-14', name: 'Manage Retry Logic', description: 'Implement automatic retry with backoff.', taskType: 'error-handling', frequency: 'as-needed', estimatedTime: 'Variable', requiredInput: 'Failed task', expectedOutput: 'Retry result', successCondition: 'Task succeeds or max retries', failureCondition: 'Repeated failures', relatedCapabilities: ['orch-c5'], workflowStage: 'all', dependsOn: [], handoffTo: null, automationLevel: 'fully-automated', qualityCheck: 'Track retry count', userBenefit: 'Automatic recovery' },
    { id: 'orch-15', name: 'Update Campaign Metadata', description: 'Maintain campaign-level metadata.', taskType: 'data-management', frequency: 'continuous', estimatedTime: '1 second', requiredInput: 'Metadata updates', expectedOutput: 'Updated metadata', successCondition: 'Metadata saved correctly', failureCondition: 'Metadata loss', relatedCapabilities: ['orch-c1', 'orch-c10'], workflowStage: 'all', dependsOn: [], handoffTo: null, automationLevel: 'fully-automated', qualityCheck: 'Verify metadata saved', userBenefit: 'Accurate campaign data' }
  ],
  capabilities: [
    { id: 'orch-c1', name: 'Workflow State Management', description: 'Maintain master state of each campaign.', strengthLevel: 'expert', example: 'Updates campaign state to "Stage 4 complete"' },
    { id: 'orch-c2', name: 'Task Delegation', description: 'Route tasks to correct specialized agent.', strengthLevel: 'advanced', example: 'Delegates to Strategist for angle generation' },
    { id: 'orch-c3', name: 'Progress Tracking', description: 'Monitor real-time completion status.', strengthLevel: 'advanced', example: 'Dashboard shows "Stage 4 of 15 - 80% Complete"' },
    { id: 'orch-c4', name: 'Human Gate Management', description: 'Coordinate Stage 7 approval gate.', strengthLevel: 'advanced', example: 'Pauses workflow, waits for approval' },
    { id: 'orch-c5', name: 'Error Detection and Recovery', description: 'Identify and recover from failures.', strengthLevel: 'advanced', example: 'Retries up to 3 times, then escalates' },
    { id: 'orch-c6', name: 'Escalation Handling', description: 'Trigger human intervention when needed.', strengthLevel: 'strong', example: 'Sends email notification on escalation' },
    { id: 'orch-c7', name: 'Stage Transition Coordination', description: 'Execute smooth handoffs between stages.', strengthLevel: 'expert', example: 'Validates 40 angles before Stage 5' },
    { id: 'orch-c8', name: 'Parallel Agent Coordination', description: 'Manage multiple agents simultaneously.', strengthLevel: 'advanced', example: 'Runs Stage 8 and 9 in parallel' },
    { id: 'orch-c9', name: 'Campaign Lifecycle Management', description: 'Handle complete lifecycle.', strengthLevel: 'expert', example: 'Campaign moves from Created to Complete' },
    { id: 'orch-c10', name: 'Analytics and Reporting', description: 'Generate performance reports.', strengthLevel: 'strong', example: 'Report shows average time per stage' }
  ],
  inputs: {
    requiredInputs: [
      { name: 'Campaign Brief', description: 'Structured campaign objectives', required: true },
      { name: 'Stage Completion Signal', description: 'Notification that previous stage finished', required: true }
    ],
    optionalInputs: [
      { name: 'Pause Signal', description: 'User request to pause workflow', required: false },
      { name: 'Resume Signal', description: 'User request to resume workflow', required: false }
    ]
  },
  outputs: {
    primaryOutputs: [
      { name: 'Task Assignments', description: 'Delegated tasks to agents', destination: 'Agent queues' },
      { name: 'Progress Updates', description: 'Real-time campaign status', destination: 'Dashboard' }
    ]
  },
  workflow: {
    previousAgents: [],
    nextAgents: ['extractor', 'strategist', 'packager', 'validator', 'production'],
    receivesFrom: [],
    sendsTo: ['All agents']
  },
  automation: {
    triggerType: 'Campaign creation',
    automationLevel: 'fully-automated' as const,
    humanReviewRequired: false,
    retryRules: ['Max 3 retries', 'Exponential backoff', 'Escalate after max'],
    fallbackAction: 'Pause workflow and notify user'
  },
  efficiency: {
    estimatedManualTime: '2-4 hours per campaign',
    estimatedAgentTime: '30-60 seconds per campaign',
    estimatedTimeSaved: '95%+',
    manualWorkReplaced: ['Manual task assignment', 'Manual status tracking', 'Manual stage transitions']
  },
  performanceMetrics: {
    accuracyScore: 'Estimated: 99%',
    completionRate: 'Estimated: 96%',
    averageCompletionTime: '<1 second'
  },
  stageHistory: [
    { stageName: 'Campaign Initialization', status: 'completed', duration: '30s' },
    { stageName: 'Stage Coordination', status: 'in-progress', duration: '10s' },
    { stageName: 'Human Gate Management', status: 'pending', duration: 'Variable' },
    { stageName: 'Campaign Completion', status: 'pending', duration: '5s' }
  ],
  qualityControl: {
    reviewChecklist: ['Verify campaign state consistency', 'Confirm all handoffs logged'],
    validationRules: ['Campaign ID unique', 'Stage sequence valid', 'Agent available'],
    successCriteria: ['100% stages tracked', 'Zero lost campaigns']
  },
  errorHandling: {
    possibleErrors: [
      { errorName: 'Agent Timeout', severity: 'high', solution: 'Retry agent or escalate' },
      { errorName: 'Invalid Stage Output', severity: 'critical', solution: 'Retry with clean input' },
      { errorName: 'State Corruption', severity: 'critical', solution: 'Restore from backup' }
    ],
    recoverySteps: ['Retry failed agent (max 3x)', 'If still failing, escalate to user']
  },
  limitations: {
    knownLimitations: ['Cannot modify stage order', 'Cannot skip required human gates'],
    requiresHumanJudgmentFor: ['Angle selection at Stage 7', 'Final approval decisions'],
    riskLevel: 'low' as const
  },
  examples: {
    exampleInput: '{"name": "2026 Cybersecurity Trends", "beats": ["Technology", "Security"]}',
    exampleOutput: '{"campaignId": "cp-2026-001", "currentStage": 4, "progress": "27%"}'
  },
  ui: {
    cardDisplay: { showTaskCount: true, showCapabilityCount: true, showStatus: true },
    profileSections: ['Overview', 'Tasks', 'Capabilities', 'Workflow', 'Performance']
  },
  status: {
    label: 'active' as const,
    version: '1.0.0',
    lastUpdated: '2026-05-07'
  }
};

// =============================================================================
// AGENT 2: HUMAN REVIEWER - Decision Maker (Gate)
// =============================================================================

export const HUMAN_REVIEWER_AGENT = {
  identity: {
    id: 'human-reviewer',
    slug: 'human-reviewer',
    fullName: 'Human Approval Gate Agent',
    shortName: 'Human Reviewer',
    displayName: 'Human Reviewer',
    internalName: 'agent_human_reviewer',
    agentNumber: 2,
    tagline: 'Decision maker for critical campaign approvals.',
    oneLineSummary: 'Reviews AI-generated angles and pitches, making final decisions before proceeding.',
    category: 'Quality Gate',
    subCategory: 'Human Oversight',
    workflowStage: 'review' as const,
    complexityLevel: 'advanced' as const,
    priority: 'critical' as const
  },
  role: {
    title: 'Decision Maker (Gate)',
    primaryPurpose: 'To provide human judgment at critical decision points.',
    detailedRole: 'The Human Reviewer acts as the quality gate at Stage 7. It presents AI-generated angles to users, collects their selections, validates decisions, and releases the campaign.',
    problemSolved: 'Prevents poor-quality content from reaching journalists.',
    businessValue: 'Protects brand reputation with human oversight.',
    userBenefit: 'Users maintain full control over approvals.',
    workflowImportance: 'Critical - the only manual gate in the workflow.'
  },
  visual: {
    color: { name: 'Decision Amber', hex: '#F59E0B', softHex: '#FEF3C7', darkHex: '#92400E', gradientFrom: '#F59E0B', gradientTo: '#FBBF24', textColor: '#FFFFFF', usageReason: 'Amber represents caution and importance.' },
    avatar: { name: 'Decision Maker', personality: 'Thoughtful, careful, authoritative.', iconName: 'UserCheck', emojiFallback: '🙋', avatarStyle: 'Modern comic-style human with approval badge.' },
    badge: { label: 'Gate', tone: 'amber', iconName: 'Shield' }
  },
  description: {
    short: 'Decision maker for critical campaign approvals.',
    medium: 'Presents AI-generated angles for user approval.',
    long: 'At Stage 7, workflow pauses and presents angles to user.',
    userFacingExplanation: 'This is where you review and approve angles.',
    adminExplanation: 'Configure at Stage 7 with angle options.',
    dashboardTooltip: 'Human quality gate for approval.'
  },
  responsibilities: {
    primaryResponsibilities: [
      'Present angle options to user',
      'Collect angle selections',
      'Validate user decisions',
      'Release campaign after approval',
      'Log approval decisions for audit'
    ],
    secondaryResponsibilities: [
      'Provide selection guidance',
      'Highlight recommended angles',
      'Show campaign context',
      'Track approval timing'
    ],
    notResponsibleFor: [
      'Generating angles',
      'Scoring angles',
      'Analyzing journalists',
      'Writing pitches'
    ],
    decisionAuthority: [
      'Angle selection final decision',
      'Approval timing',
      'Campaign release'
    ]
  },
  tasks: [
    { id: 'hr-1', name: 'Display Angle Options', description: 'Present all 40 angles to user in scannable format.', priority: 'critical', estimatedTime: 'Variable', successCondition: 'All angles displayed with scores', failureCondition: 'Missing angles' },
    { id: 'hr-2', name: 'Collect User Selections', description: 'Capture which angles user selects.', priority: 'critical', estimatedTime: 'Variable', successCondition: 'At least 1 angle selected', failureCondition: 'No selection' },
    { id: 'hr-3', name: 'Validate Selections', description: 'Verify selected angles meet criteria.', priority: 'high', estimatedTime: '2 seconds', successCondition: 'Valid selections pass', failureCondition: 'Invalid selections' },
    { id: 'hr-4', name: 'Release Campaign', description: 'Trigger workflow after approval.', priority: 'critical', estimatedTime: '3 seconds', successCondition: 'Campaign proceeds to Stage 8', failureCondition: 'Release fails' },
    { id: 'hr-5', name: 'Log Approval Record', description: 'Create audit trail of decision.', priority: 'high', estimatedTime: '1 second', successCondition: 'Record saved', failureCondition: 'Record not saved' },
    { id: 'hr-6', name: 'Show Recommendations', description: 'Highlight highest-scored angles.', priority: 'medium', estimatedTime: '1 second', successCondition: 'Top angles visually distinguished', failureCondition: 'Not visible' },
    { id: 'hr-7', name: 'Set Approval Timeout', description: 'Configure timeout duration.', priority: 'medium', estimatedTime: '1 second', successCondition: 'Timeout set (24h default)', failureCondition: 'No timeout' },
    { id: 'hr-8', name: 'Handle Timeout', description: 'Trigger notification if no approval.', priority: 'high', estimatedTime: '5 seconds', successCondition: 'Reminder sent', failureCondition: 'Notification fails' },
    { id: 'hr-9', name: 'Provide Context', description: 'Show campaign brief alongside angles.', priority: 'medium', estimatedTime: '1 second', successCondition: 'Context visible', failureCondition: 'Context missing' },
    { id: 'hr-10', name: 'Allow Deselection', description: 'Let user change selections before approval.', priority: 'medium', estimatedTime: 'Real-time', successCondition: 'Changes reflect immediately', failureCondition: 'Changes not saved' },
    { id: 'hr-11', name: 'Show Category Filter', description: 'Filter angles by category.', priority: 'low', estimatedTime: 'Real-time', successCondition: 'Filter works', failureCondition: 'Filter broken' },
    { id: 'hr-12', name: 'Calculate Selection Summary', description: 'Show summary of selected angles.', priority: 'medium', estimatedTime: '1 second', successCondition: 'Summary accurate', failureCondition: 'Incorrect' },
    { id: 'hr-13', name: 'Require Confirmation', description: 'Require explicit confirmation.', priority: 'high', estimatedTime: '2 seconds', successCondition: 'User confirmed', failureCondition: 'No confirmation' },
    { id: 'hr-14', name: 'Track Approval Duration', description: 'Measure time to approve.', priority: 'low', estimatedTime: 'Automatic', successCondition: 'Duration calculated', failureCondition: 'Not captured' },
    { id: 'hr-15', name: 'Block on Rejection', description: 'Pause if user rejects all angles.', priority: 'high', estimatedTime: '3 seconds', successCondition: 'Campaign paused', failureCondition: 'Continues incorrectly' }
  ],
  capabilities: [
    { id: 'hr-c1', name: 'Angle Presentation', description: 'Display all angles with scores.', strengthLevel: 'advanced', example: 'Show angles in grid with color codes' },
    { id: 'hr-c2', name: 'Selection Collection', description: 'Capture user angle selections.', strengthLevel: 'advanced', example: 'User clicks to select' },
    { id: 'hr-c3', name: 'Decision Support', description: 'Provide context and recommendations.', strengthLevel: 'strong', example: 'Show Top 5 recommended' },
    { id: 'hr-c4', name: 'Selection Validation', description: 'Ensure minimum criteria met.', strengthLevel: 'advanced', example: 'Check at least 1 selected' },
    { id: 'hr-c5', name: 'Approval Workflow', description: 'Manage complete approval flow.', strengthLevel: 'expert', example: 'Display > Select > Validate > Confirm > Release' },
    { id: 'hr-c6', name: 'Campaign Release', description: 'Trigger next stage after approval.', strengthLevel: 'advanced', example: 'Trigger Stage 8' },
    { id: 'hr-c7', name: 'Audit Logging', description: 'Record approval history.', strengthLevel: 'advanced', example: 'Log user, timestamp, selections' },
    { id: 'hr-c8', name: 'Timeout Management', description: 'Enforce approval timeouts.', strengthLevel: 'strong', example: 'Send reminder after 24h' },
    { id: 'hr-c9', name: 'Rejection Handling', description: 'Handle rejection of all angles.', strengthLevel: 'strong', example: 'Pause campaign, notify user' },
    { id: 'hr-c10', name: 'Confirmation Workflow', description: 'Require explicit confirmation.', strengthLevel: 'strong', example: 'Confirm before proceeding' }
  ],
  inputs: {
    requiredInputs: [
      { name: 'Angle List', description: '40 angles from Strategist', required: true },
      { name: 'Campaign Context', description: 'Brief and goals', required: true }
    ],
    optionalInputs: [
      { name: 'User Preferences', description: 'Preferred selection method', required: false }
    ]
  },
  outputs: {
    primaryOutputs: [
      { name: 'Approved Angles', description: 'User-selected angles', destination: 'Orchestrator' },
      { name: 'Approval Record', description: 'Audit trail', destination: 'Database' }
    ]
  },
  workflow: {
    previousAgents: ['strategist'],
    nextAgents: ['collector', 'beat-matcher'],
    receivesFrom: ['Strategist'],
    sendsTo: ['Collector']
  },
  automation: {
    triggerType: 'Stage 7 reached',
    automationLevel: 'semi-automated' as const,
    humanReviewRequired: true,
    retryRules: ['N/A - manual step'],
    fallbackAction: 'Pause campaign, notify user'
  },
  efficiency: {
    estimatedManualTime: '5-15 minutes',
    estimatedAgentTime: '5 seconds',
    estimatedTimeSaved: '80-90%'
  },
  performanceMetrics: {
    accuracyScore: 'Estimated: 100%',
    completionRate: 'Estimated: 90%',
    averageCompletionTime: '5-15 minutes'
  },
  stageHistory: [
    { stageName: 'Angle Display', status: 'completed', duration: '2s' },
    { stageName: 'Selection Collection', status: 'completed', duration: 'Variable' },
    { stageName: 'Approval Confirmation', status: 'completed', duration: '30s' },
    { stageName: 'Campaign Release', status: 'completed', duration: '3s' }
  ],
  qualityControl: {
    reviewChecklist: ['All angles displayed', 'Scores visible', 'Confirmation required'],
    validationRules: ['Minimum 1 angle selected', 'Confirmation explicitly required'],
    successCriteria: ['100% approvals logged', 'Zero proceed without confirmation']
  },
  errorHandling: {
    possibleErrors: [
      { errorName: 'No Selection Made', severity: 'high', solution: 'Show error, require selection' },
      { errorName: 'Timeout', severity: 'medium', solution: 'Send reminder, then escalate' }
    ],
    recoverySteps: ['Show error message', 'Offer retry option']
  },
  limitations: {
    knownLimitations: ['Cannot change angle content', 'Cannot generate new angles'],
    requiresHumanJudgmentFor: ['Which angles are best', 'Editorial fit'],
    riskLevel: 'low' as const
  },
  examples: {
    exampleInput: '40 angles with scores',
    exampleOutput: '{"approvedAngles":[1,5,12],"timestamp":"2026-05-07T14:30:00Z"}'
  },
  ui: {
    cardDisplay: { showTaskCount: true, showCapabilityCount: true, showStatus: true },
    profileSections: ['Overview', 'Tasks', 'Capabilities', 'Approval']
  },
  status: {
    label: 'active' as const,
    version: '1.0.0',
    lastUpdated: '2026-05-07'
  }
};

// =============================================================================
// AGENT 3: DATA EXTRACTOR - Study Analyst
// =============================================================================

export const DATA_EXTRACTOR_AGENT = {
  identity: {
    id: 'extractor',
    slug: 'extractor',
    fullName: 'Study Data Extraction Agent',
    shortName: 'Data Extractor',
    displayName: 'Data Extractor',
    internalName: 'agent_extractor',
    agentNumber: 3,
    tagline: 'Extracts key insights from raw campaign data.',
    oneLineSummary: 'Analyzes raw study data, surveys, and reports to extract key findings.',
    category: 'Research',
    subCategory: 'Data Analysis',
    workflowStage: 'analysis' as const,
    complexityLevel: 'advanced' as const,
    priority: 'high' as const
  },
  role: {
    title: 'Study Analyst',
    primaryPurpose: 'To convert raw study data into structured, usable insights.',
    detailedRole: 'The Data Extractor analyzes raw campaign data, surveys, and reports. It identifies key findings, statistics, quotes, and patterns.',
    problemSolved: 'Prevents manual data parsing and ensures consistency.',
    businessValue: 'Faster campaign startup through automation.',
    userBenefit: 'Sees key insights without reading all raw data.',
    workflowImportance: 'Critical - provides foundation for all subsequent stages.'
  },
  visual: {
    color: { name: 'Analysis Green', hex: '#10B981', softHex: '#D1FAE5', darkHex: '#065F46', gradientFrom: '#10B981', gradientTo: '#34D399', textColor: '#FFFFFF', usageReason: 'Green represents growth and clarity.' },
    avatar: { name: 'Data Analyzer', personality: 'Precise, analytical, detail-oriented.', iconName: 'Database', emojiFallback: '🔍', avatarStyle: 'Modern AI with data visualization elements.' },
    badge: { label: 'Analysis', tone: 'green', iconName: 'BarChart' }
  },
  description: {
    short: 'Extracts key insights from raw campaign data.',
    medium: 'Analyzes study data to identify findings and statistics.',
    long: 'Reviews campaign materials and extracts important insights.',
    userFacingExplanation: 'Automatically analyzes your study data.',
    adminExplanation: 'Configure extraction rules and output formatting.',
    dashboardTooltip: 'Analyzes raw data, extracts structured insights.'
  },
  responsibilities: {
    primaryResponsibilities: [
      'Analyze raw study data',
      'Extract key statistics and findings',
      'Identify quotes and notable content',
      'Structure extracted data',
      'Validate extraction accuracy'
    ],
    secondaryResponsibilities: [
      'Identify data quality issues',
      'Flag missing data',
      'Categorize content',
      'Score relevance'
    ],
    notResponsibleFor: [
      'Writing pitch content',
      'Generating angles',
      'Analyzing journalists',
      'Approving content'
    ],
    decisionAuthority: [
      'Which findings to prioritize',
      'How to structure output',
      'What to flag as quality issue'
    ]
  },
  tasks: [
    { id: 'ext-1', name: 'Receive Campaign Data', description: 'Accept raw study data from campaign.', priority: 'critical', estimatedTime: '2 seconds', successCondition: 'Data received and validated', failureCondition: 'Invalid data' },
    { id: 'ext-2', name: 'Parse Study Content', description: 'Convert raw text into structure.', priority: 'critical', estimatedTime: '30 seconds', successCondition: 'Content parsed into sections', failureCondition: 'Parse fails' },
    { id: 'ext-3', name: 'Identify Statistics', description: 'Find and extract numerical data.', priority: 'critical', estimatedTime: '60 seconds', successCondition: 'All statistics identified', failureCondition: 'Missing statistics' },
    { id: 'ext-4', name: 'Extract Key Findings', description: 'Identify main conclusions.', priority: 'critical', estimatedTime: '90 seconds', successCondition: 'Findings identified', failureCondition: 'No clear findings' },
    { id: 'ext-5', name: 'Identify Quotes', description: 'Find notable quotes.', priority: 'high', estimatedTime: '30 seconds', successCondition: 'Quotes identified', failureCondition: 'No quotes found' },
    { id: 'ext-6', name: 'Categorize Content', description: 'Group findings by theme.', priority: 'high', estimatedTime: '45 seconds', successCondition: 'Findings organized', failureCondition: 'Unclear categorization' },
    { id: 'ext-7', name: 'Score Relevance', description: 'Rate each finding for newsworthiness.', priority: 'high', estimatedTime: '60 seconds', successCondition: 'All findings scored', failureCondition: 'Missing scores' },
    { id: 'ext-8', name: 'Validate Data Quality', description: 'Check for missing data.', priority: 'high', estimatedTime: '30 seconds', successCondition: 'Issues identified', failureCondition: 'Issues missed' },
    { id: 'ext-9', name: 'Format Output', description: 'Structure data for next stage.', priority: 'high', estimatedTime: '30 seconds', successCondition: 'Output matches schema', failureCondition: 'Format errors' },
    { id: 'ext-10', name: 'Generate Summary', description: 'Create executive summary.', priority: 'medium', estimatedTime: '30 seconds', successCondition: 'Summary captures key points', failureCondition: 'Incomplete' },
    { id: 'ext-11', name: 'Identify Gaps', description: 'Flag missing information.', priority: 'medium', estimatedTime: '30 seconds', successCondition: 'Gaps identified', failureCondition: 'Gaps missed' },
    { id: 'ext-12', name: 'Link to Campaign', description: 'Connect findings to campaign goals.', priority: 'medium', estimatedTime: '30 seconds', successCondition: 'Each finding connected', failureCondition: 'Disconnected' },
    { id: 'ext-13', name: 'Handle Errors', description: 'Manage extraction failures.', priority: 'high', estimatedTime: '10 seconds', successCondition: 'Error handled or escalated', failureCondition: 'Unhandled error' },
    { id: 'ext-14', name: 'Create Data Package', description: 'Bundle outputs for handoff.', priority: 'high', estimatedTime: '15 seconds', successCondition: 'Package complete', failureCondition: 'Incomplete' },
    { id: 'ext-15', name: 'Track Metrics', description: 'Record extraction performance.', priority: 'low', estimatedTime: '5 seconds', successCondition: 'Metrics captured', failureCondition: 'Lost' }
  ],
  capabilities: [
    { id: 'ext-c1', name: 'Data Ingestion', description: 'Accept various data formats.', strengthLevel: 'advanced', example: 'Import JSON, CSV, PDF, text' },
    { id: 'ext-c2', name: 'Content Parsing', description: 'Break text into structured sections.', strengthLevel: 'advanced', example: 'Separate sections and paragraphs' },
    { id: 'ext-c3', name: 'Data Cleaning', description: 'Remove duplicates, fix inconsistencies.', strengthLevel: 'advanced', example: 'Standardize formats' },
    { id: 'ext-c4', name: 'Statistical Extraction', description: 'Identify numerical data with context.', strengthLevel: 'expert', example: 'Extract "67% prefer X" with source' },
    { id: 'ext-c5', name: 'Pattern Detection', description: 'Find recurring themes.', strengthLevel: 'advanced', example: 'Detect trends and anomalies' },
    { id: 'ext-c6', name: 'Insight Synthesis', description: 'Combine findings into coherent insights.', strengthLevel: 'advanced', example: 'Merge data into single insight' },
    { id: 'ext-c7', name: 'Relevance Scoring', description: 'Rate findings by news value.', strengthLevel: 'advanced', example: 'Score 85/100 for newsworthiness' },
    { id: 'ext-c8', name: 'Quality Assessment', description: 'Evaluate data completeness.', strengthLevel: 'advanced', example: 'Flag missing fields' },
    { id: 'ext-c9', name: 'Output Formatting', description: 'Structure results in standard format.', strengthLevel: 'advanced', example: 'Format as JSON' },
    { id: 'ext-c10', name: 'Error Management', description: 'Handle failures gracefully.', strengthLevel: 'strong', example: 'Skip corrupted sections' }
  ],
  inputs: {
    requiredInputs: [
      { name: 'Raw Study Data', description: 'Unstructured study content', required: true },
      { name: 'Campaign Brief', description: 'Campaign goals and context', required: true }
    ],
    optionalInputs: [
      { name: 'Data Format Preferences', description: 'Preferred output format', required: false }
    ]
  },
  outputs: {
    primaryOutputs: [
      { name: 'Structured Insights', description: 'Extracted findings', destination: 'Strategist' },
      { name: 'Key Statistics', description: 'Numbers with context', destination: 'Strategist' }
    ]
  },
  workflow: {
    previousAgents: ['orchestrator'],
    nextAgents: ['researcher', 'strategist'],
    receivesFrom: ['Orchestrator'],
    sendsTo: ['Strategist']
  },
  automation: {
    triggerType: 'Campaign reaches Stage 2',
    automationLevel: 'fully-automated' as const,
    humanReviewRequired: false,
    retryRules: ['Max 2 retries on parse failure'],
    fallbackAction: 'Output partial results with error flag'
  },
  efficiency: {
    estimatedManualTime: '2-4 hours',
    estimatedAgentTime: '3-5 minutes',
    estimatedTimeSaved: '90-95%'
  },
  performanceMetrics: {
    accuracyScore: 'Estimated: 92%',
    completionRate: 'Estimated: 95%',
    averageCompletionTime: '3-5 minutes'
  },
  stageHistory: [
    { stageName: 'Data Ingestion', status: 'completed', duration: '30s' },
    { stageName: 'Content Analysis', status: 'completed', duration: '2-3min' },
    { stageName: 'Output Generation', status: 'completed', duration: '1min' }
  ],
  qualityControl: {
    reviewChecklist: ['All statistics have context', 'Findings supported by data'],
    validationRules: ['Minimum 5 key insights', 'All findings have supporting data'],
    successCriteria: ['90%+ accuracy on key statistics']
  },
  errorHandling: {
    possibleErrors: [
      { errorName: 'Parse Failure', severity: 'high', solution: 'Skip corrupted sections' },
      { errorName: 'No Statistics Found', severity: 'medium', solution: 'Note in quality report' }
    ],
    recoverySteps: ['Retry with cleaned data', 'Output partial results']
  },
  limitations: {
    knownLimitations: ['Cannot verify accuracy', 'Cannot interpret images/graphs'],
    requiresHumanJudgmentFor: ['Fact-checking statistics', 'Determining news value'],
    riskLevel: 'low' as const
  },
  examples: {
    exampleInput: 'Survey data: "67% prefer smart home devices"',
    exampleOutput: '{"insights":[{"text":"67% prefer smart home","score":85}]}'
  },
  ui: {
    cardDisplay: { showTaskCount: true, showCapabilityCount: true, showStatus: true },
    profileSections: ['Overview', 'Tasks', 'Capabilities', 'Performance']
  },
  status: {
    label: 'active' as const,
    version: '1.0.0',
    lastUpdated: '2026-05-07'
  }
};

// =============================================================================
// AGENT 4: RESEARCHER - SERP Analyst
// =============================================================================

export const RESEARCHER_AGENT = {
  identity: {
    id: 'researcher',
    slug: 'researcher',
    fullName: 'Research & Enrichment Agent',
    shortName: 'Researcher',
    displayName: 'Researcher',
    internalName: 'agent_researcher',
    agentNumber: 4,
    tagline: 'Research and enrichment specialist.',
    oneLineSummary: 'Conducts web research, analyzes SERP results, verifies sources.',
    category: 'Research',
    subCategory: 'SERP Analysis',
    workflowStage: 'research' as const,
    complexityLevel: 'advanced' as const,
    priority: 'high' as const
  },
  role: {
    title: 'SERP Analyst',
    primaryPurpose: 'To conduct web research and enrich campaign context.',
    detailedRole: 'The Researcher conducts web research, analyzes search engine results, verifies sources, and enriches campaign data with current trends.',
    problemSolved: 'Provides up-to-date context and validates source credibility.',
    businessValue: 'Ensures campaigns are relevant to current news cycle.',
    userBenefit: 'Gets enriched context for better angles.',
    workflowImportance: 'Provides research foundation for angle generation.'
  },
  visual: {
    color: { name: 'Research Purple', hex: '#7C3AED', softHex: '#EDE9FE', darkHex: '#5B21B6', gradientFrom: '#7C3AED', gradientTo: '#A78BFA', textColor: '#FFFFFF', usageReason: 'Purple represents wisdom and research.' },
    avatar: { name: 'Research Analyst', personality: 'Curious, thorough, verify-first.', iconName: 'Search', emojiFallback: '🔬', avatarStyle: 'Modern AI with research elements.' },
    badge: { label: 'Research', tone: 'purple', iconName: 'Globe' }
  },
  description: {
    short: 'Research and enrichment specialist.',
    medium: 'Conducts web research to enrich campaign data.',
    long: 'Analyzes SERP results, verifies sources, adds current context.',
    userFacingExplanation: 'Enriches your campaign with research data.',
    adminExplanation: 'Configure search parameters and verification rules.',
    dashboardTooltip: 'Conducts research and source verification.'
  },
  responsibilities: {
    primaryResponsibilities: [
      'Conduct web research',
      'Analyze SERP results',
      'Verify source credibility',
      'Enrich with trends',
      'Identify coverage opportunities'
    ],
    secondaryResponsibilities: [
      'Track competitor coverage',
      'Identify trending topics',
      'Map keyword landscapes',
      'Provide citation data'
    ],
    notResponsibleFor: [
      'Writing pitch content',
      'Generating angles',
      'Approving content',
      'Collecting journalists'
    ],
    decisionAuthority: [
      'Which sources to prioritize',
      'What research depth needed',
      'What to flag as unverified'
    ]
  },
  tasks: [
    { id: 'res-1', name: 'Accept Research Request', description: 'Receive research brief from orchestrator.', priority: 'critical', estimatedTime: '2 seconds', successCondition: 'Request validated', failureCondition: 'Invalid request' },
    { id: 'res-2', name: 'Identify Search Keywords', description: 'Determine relevant search terms.', priority: 'critical', estimatedTime: '10 seconds', successCondition: 'Keywords identified', failureCondition: 'No keywords' },
    { id: 'res-3', name: 'Execute SERP Search', description: 'Run search queries.', priority: 'critical', estimatedTime: '30 seconds', successCondition: 'Results returned', failureCondition: 'Search fails' },
    { id: 'res-4', name: 'Analyze Top Results', description: 'Review top 10 search results.', priority: 'critical', estimatedTime: '60 seconds', successCondition: 'Analysis complete', failureCondition: 'Incomplete analysis' },
    { id: 'res-5', name: 'Verify Source Credibility', description: 'Check source reliability.', priority: 'high', estimatedTime: '45 seconds', successCondition: 'Sources verified', failureCondition: 'Verification failed' },
    { id: 'res-6', name: 'Extract Key Insights', description: 'Pull relevant data from sources.', priority: 'high', estimatedTime: '90 seconds', successCondition: 'Insights extracted', failureCondition: 'No insights found' },
    { id: 'res-7', name: 'Identify Trends', description: 'Find trending topics related to campaign.', priority: 'high', estimatedTime: '60 seconds', successCondition: 'Trends identified', failureCondition: 'No trends found' },
    { id: 'res-8', name: 'Map Keyword Landscape', description: 'Understand keyword competition.', priority: 'medium', estimatedTime: '45 seconds', successCondition: 'Landscape mapped', failureCondition: 'Incomplete' },
    { id: 'res-9', name: 'Track Competitor Coverage', description: 'See what competitors are covering.', priority: 'medium', estimatedTime: '45 seconds', successCondition: 'Coverage tracked', failureCondition: 'Data not found' },
    { id: 'res-10', name: 'Compile Research Package', description: 'Bundle all research for next stage.', priority: 'high', estimatedTime: '30 seconds', successCondition: 'Package complete', failureCondition: 'Incomplete' },
    { id: 'res-11', name: 'Validate Research Quality', description: 'Ensure research meets standards.', priority: 'high', estimatedTime: '20 seconds', successCondition: 'Quality validated', failureCondition: 'Quality issues' },
    { id: 'res-12', name: 'Provide Citation Data', description: 'Prepare source citations.', priority: 'medium', estimatedTime: '30 seconds', successCondition: 'Citations ready', failureCondition: 'Missing citations' },
    { id: 'res-13', name: 'Identify Coverage Gaps', description: 'Find what hasn\'t been covered.', priority: 'medium', estimatedTime: '30 seconds', successCondition: 'Gaps identified', failureCondition: 'No gaps found' },
    { id: 'res-14', name: 'Handle Research Errors', description: 'Manage failed searches.', priority: 'high', estimatedTime: '10 seconds', successCondition: 'Error handled', failureCondition: 'Unhandled' },
    { id: 'res-15', name: 'Log Research Metrics', description: 'Track research performance.', priority: 'low', estimatedTime: '5 seconds', successCondition: 'Metrics logged', failureCondition: 'Not captured' }
  ],
  capabilities: [
    { id: 'res-c1', name: 'SERP Analysis', description: 'Analyze search engine results.', strengthLevel: 'expert', example: 'Review top results for target keywords' },
    { id: 'res-c2', name: 'Source Verification', description: 'Check credibility of sources.', strengthLevel: 'advanced', example: 'Verify publication authority' },
    { id: 'res-c3', name: 'Trend Discovery', description: 'Identify trending topics.', strengthLevel: 'advanced', example: 'Find hot topics in niche' },
    { id: 'res-c4', name: 'Keyword Research', description: 'Map keyword landscape.', strengthLevel: 'advanced', example: 'Identify competition levels' },
    { id: 'res-c5', name: 'Competitive Analysis', description: 'Track competitor coverage.', strengthLevel: 'strong', example: 'See what others are covering' },
    { id: 'res-c6', name: 'Data Extraction', description: 'Pull relevant data from sources.', strengthLevel: 'advanced', example: 'Extract key statistics' },
    { id: 'res-c7', name: 'Research Synthesis', description: 'Combine findings into summary.', strengthLevel: 'advanced', example: 'Create research brief' },
    { id: 'res-c8', name: 'Citation Formatting', description: 'Prepare proper citations.', strengthLevel: 'strong', example: 'Format for Pitch docs' },
    { id: 'res-c9', name: 'Gap Analysis', description: 'Identify coverage opportunities.', strengthLevel: 'strong', example: 'Find what\'s not covered' },
    { id: 'res-c10', name: 'Error Recovery', description: 'Handle search failures.', strengthLevel: 'strong', example: 'Retry or adjust keywords' }
  ],
  inputs: {
    requiredInputs: [
      { name: 'Research Request', description: 'Brief specifying research needs', required: true },
      { name: 'Campaign Context', description: 'Topic and keywords', required: true }
    ],
    optionalInputs: [
      { name: 'Target Publications', description: 'Specific outlets to research', required: false }
    ]
  },
  outputs: {
    primaryOutputs: [
      { name: 'Research Package', description: 'Enriched data for angles', destination: 'Strategist' },
      { name: 'Source Verification', description: 'Credibility report', destination: 'Dashboard' }
    ]
  },
  workflow: {
    previousAgents: ['extractor'],
    nextAgents: ['strategist'],
    receivesFrom: ['Data Extractor'],
    sendsTo: ['Strategist']
  },
  automation: {
    triggerType: 'Stage 3 reached',
    automationLevel: 'fully-automated' as const,
    humanReviewRequired: false,
    retryRules: ['Max 3 retries on search failure'],
    fallbackAction: 'Return partial research'
  },
  efficiency: {
    estimatedManualTime: '1-2 hours',
    estimatedAgentTime: '5-10 minutes',
    estimatedTimeSaved: '85-90%'
  },
  performanceMetrics: {
    accuracyScore: 'Estimated: 90%',
    completionRate: 'Estimated: 93%',
    averageCompletionTime: '5-10 minutes'
  },
  stageHistory: [
    { stageName: 'Request Processing', status: 'completed', duration: '10s' },
    { stageName: 'Search Execution', status: 'completed', duration: '30s' },
    { stageName: 'Analysis & Synthesis', status: 'completed', duration: '3-5min' }
  ],
  qualityControl: {
    reviewChecklist: ['Sources verified', 'Data accurate', 'Trends identified'],
    validationRules: ['Minimum 5 sources', 'Credibility checked'],
    successCriteria: ['90%+ sources verified']
  },
  errorHandling: {
    possibleErrors: [
      { errorName: 'Search Failed', severity: 'high', solution: 'Retry with adjusted keywords' },
      { errorName: 'No Results', severity: 'medium', solution: 'Expand keyword scope' }
    ],
    recoverySteps: ['Retry search', 'Adjust keywords', 'Return partial']
  },
  limitations: {
    knownLimitations: ['Cannot access paywalled content', 'Limited to search engine results'],
    requiresHumanJudgmentFor: ['Editorial relevance', 'Source credibility final check'],
    riskLevel: 'low' as const
  },
  examples: {
    exampleInput: 'Topic: Home Security, Keywords: smart home security',
    exampleOutput: '{"sources":5,"trends":["DIY security","voice control"],"insights":3}'
  },
  ui: {
    cardDisplay: { showTaskCount: true, showCapabilityCount: true, showStatus: true },
    profileSections: ['Overview', 'Tasks', 'Capabilities', 'Research']
  },
  status: {
    label: 'active' as const,
    version: '1.0.0',
    lastUpdated: '2026-05-07'
  }
};

// =============================================================================
// AGENT 5: STRATEGIST - Angle Planner
// =============================================================================

export const STRATEGIST_AGENT = {
  identity: {
    id: 'strategist',
    slug: 'strategist',
    fullName: 'Pitch Angle Generation Agent',
    shortName: 'Strategist',
    displayName: 'Strategist',
    internalName: 'agent_strategist',
    agentNumber: 5,
    tagline: 'Generates 40 pitch angles across 20 categories.',
    oneLineSummary: 'Creates diverse pitch angles based on campaign data and research.',
    category: 'Strategy',
    subCategory: 'Angle Planning',
    workflowStage: 'strategy' as const,
    complexityLevel: 'advanced' as const,
    priority: 'critical' as const
  },
  role: {
    title: 'Angle Planner',
    primaryPurpose: 'To generate diverse, newsworthy pitch angles.',
    detailedRole: 'The Strategist generates 40 unique pitch angles across 20 categories based on campaign data, extracted insights, and research.',
    problemSolved: 'Creates diverse angle options for human selection.',
    businessValue: 'Provides variety of story hooks for outreach.',
    userBenefit: 'Gets multiple angle options to choose from.',
    workflowImportance: 'Critical - determines what pitches will be sent.'
  },
  visual: {
    color: { name: 'Strategy Orange', hex: '#F97316', softHex: '#FFEDD5', darkHex: '#9A3412', gradientFrom: '#F97316', gradientTo: '#FB923C', textColor: '#FFFFFF', usageReason: 'Orange represents creativity and energy.' },
    avatar: { name: 'Creative Strategist', personality: 'Creative, innovative, story-minded.', iconName: 'Lightbulb', emojiFallback: '💡', avatarStyle: 'Modern AI with creative elements.' },
    badge: { label: 'Strategy', tone: 'orange', iconName: 'Target' }
  },
  description: {
    short: 'Generates 40 pitch angles across 20 categories.',
    medium: 'Creates diverse angle options for campaign.',
    long: 'Uses campaign data and research to generate 40 unique angles.',
    userFacingExplanation: 'Creates multiple angle options for your campaign.',
    adminExplanation: 'Configure angle categories and scoring rules.',
    dashboardTooltip: 'Generates diverse pitch angles.'
  },
  responsibilities: {
    primaryResponsibilities: [
      'Generate 40 unique angles',
      'Categorize into 20 categories',
      'Score angles for newsworthiness',
      'Prioritize by impact',
      'Prepare for human review'
    ],
    secondaryResponsibilities: [
      'Identify angle weaknesses',
      'Suggest angle improvements',
      'Link to beat categories',
      'Provide scoring rationale'
    ],
    notResponsibleFor: [
      'Selecting final angles',
      'Writing pitch emails',
      'Collecting journalists',
      'Approving content'
    ],
    decisionAuthority: [
      'Angle generation method',
      'Category assignment',
      'Scoring methodology'
    ]
  },
  tasks: [
    { id: 'str-1', name: 'Receive Campaign Data', description: 'Accept insights and research from previous stages.', priority: 'critical', estimatedTime: '5 seconds', successCondition: 'Data validated', failureCondition: 'Missing data' },
    { id: 'str-2', name: 'Analyze Key Insights', description: 'Review extracted data and research.', priority: 'critical', estimatedTime: '60 seconds', successCondition: 'Insights understood', failureCondition: 'Data unclear' },
    { id: 'str-3', name: 'Define Angle Categories', description: 'Establish 20 category framework.', priority: 'critical', estimatedTime: '30 seconds', successCondition: 'Categories defined', failureCondition: 'Categories unclear' },
    { id: 'str-4', name: 'Generate Core Angles', description: 'Create 20 core angle ideas.', priority: 'critical', estimatedTime: '120 seconds', successCondition: '20 core angles', failureCondition: 'Incomplete' },
    { id: 'str-5', name: 'Create Angle Variations', description: 'Develop 2 variants per core angle.', priority: 'critical', estimatedTime: '180 seconds', successCondition: '40 total angles', failureCondition: 'Missing variants' },
    { id: 'str-6', name: 'Assign Categories', description: 'Map each angle to category.', priority: 'high', estimatedTime: '60 seconds', successCondition: 'All mapped', failureCondition: 'Unmapped angles' },
    { id: 'str-7', name: 'Score Angles', description: 'Rate each angle for news value.', priority: 'high', estimatedTime: '90 seconds', successCondition: 'All scored', failureCondition: 'Missing scores' },
    { id: 'str-8', name: 'Prioritize by Impact', description: 'Rank angles by potential impact.', priority: 'high', estimatedTime: '30 seconds', successCondition: 'Ranked list', failureCondition: 'Ranking unclear' },
    { id: 'str-9', name: 'Identify Weak Angles', description: 'Flag angles needing improvement.', priority: 'medium', estimatedTime: '45 seconds', successCondition: 'Weak angles flagged', failureCondition: 'Not flagged' },
    { id: 'str-10', name: 'Prepare Human Review Package', description: 'Format for Stage 7 review.', priority: 'critical', estimatedTime: '60 seconds', successCondition: 'Package ready', failureCondition: 'Package incomplete' },
    { id: 'str-11', name: 'Validate Angle Quality', description: 'Ensure minimum quality threshold.', priority: 'high', estimatedTime: '30 seconds', successCondition: 'Quality validated', failureCondition: 'Quality issues' },
    { id: 'str-12', name: 'Link to Campaign Goals', description: 'Ensure angles align with goals.', priority: 'high', estimatedTime: '30 seconds', successCondition: 'Goals aligned', failureCondition: 'Misaligned' },
    { id: 'str-13', name: 'Generate Scoring Rationale', description: 'Explain why each angle scored as it did.', priority: 'medium', estimatedTime: '60 seconds', successCondition: 'Rationale clear', failureCondition: 'Unclear' },
    { id: 'str-14', name: 'Handle Generation Errors', description: 'Manage failed angle creation.', priority: 'high', estimatedTime: '10 seconds', successCondition: 'Handled', failureCondition: 'Unhandled' },
    { id: 'str-15', name: 'Log Generation Metrics', description: 'Track angle generation stats.', priority: 'low', estimatedTime: '5 seconds', successCondition: 'Logged', failureCondition: 'Not captured' }
  ],
  capabilities: [
    { id: 'str-c1', name: 'Angle Generation', description: 'Create diverse pitch angles.', strengthLevel: 'expert', example: 'Generate 40 unique angles' },
    { id: 'str-c2', name: 'Category Mapping', description: 'Organize into categories.', strengthLevel: 'expert', example: 'Map to 20 categories' },
    { id: 'str-c3', name: 'Angle Scoring', description: 'Rate by news value.', strengthLevel: 'advanced', example: 'Score 1-10 for newsworthiness' },
    { id: 'str-c4', name: 'Impact Prioritization', description: 'Rank by potential impact.', strengthLevel: 'advanced', example: 'Prioritize highest impact' },
    { id: 'str-c5', name: 'Quality Validation', description: 'Ensure minimum quality.', strengthLevel: 'advanced', example: 'Filter below threshold' },
    { id: 'str-c6', name: 'Category Diversity', description: 'Ensure category spread.', strengthLevel: 'strong', example: 'All categories represented' },
    { id: 'str-c7', name: 'Angle Variation', description: 'Create multiple versions.', strengthLevel: 'advanced', example: '2 variants per core' },
    { id: 'str-c8', name: 'Goal Alignment', description: 'Verify campaign fit.', strengthLevel: 'strong', example: 'All align with goals' },
    { id: 'str-c9', name: 'Scoring Rationale', description: 'Explain scoring logic.', strengthLevel: 'strong', example: 'Document why scored' },
    { id: 'str-c10', name: 'Error Handling', description: 'Recover from generation failures.', strengthLevel: 'strong', example: 'Retry failed angles' }
  ],
  inputs: {
    requiredInputs: [
      { name: 'Extracted Insights', description: 'Data from Extractor', required: true },
      { name: 'Research Data', description: 'Context from Researcher', required: true },
      { name: 'Campaign Brief', description: 'Goals and target beats', required: true }
    ],
    optionalInputs: [
      { name: 'Preferred Categories', description: 'Specific categories to focus', required: false }
    ]
  },
  outputs: {
    primaryOutputs: [
      { name: '40 Angles', description: 'Generated angles with scores', destination: 'Human Reviewer' },
      { name: 'Angle Package', description: 'Formatted for Stage 7', destination: 'Dashboard' }
    ]
  },
  workflow: {
    previousAgents: ['extractor', 'researcher'],
    nextAgents: ['human-reviewer', 'beat-matcher'],
    receivesFrom: ['Data Extractor', 'Researcher'],
    sendsTo: ['Human Reviewer']
  },
  automation: {
    triggerType: 'Stage 4 reached',
    automationLevel: 'fully-automated' as const,
    humanReviewRequired: false,
    retryRules: ['Max 2 retries on generation failure'],
    fallbackAction: 'Generate partial set'
  },
  efficiency: {
    estimatedManualTime: '3-5 hours',
    estimatedAgentTime: '8-12 minutes',
    estimatedTimeSaved: '90-95%'
  },
  performanceMetrics: {
    accuracyScore: 'Estimated: 88%',
    completionRate: 'Estimated: 95%',
    averageCompletionTime: '8-12 minutes'
  },
  stageHistory: [
    { stageName: 'Data Analysis', status: 'completed', duration: '60s' },
    { stageName: 'Angle Generation', status: 'completed', duration: '5-8min' },
    { stageName: 'Scoring & Packaging', status: 'completed', duration: '3min' }
  ],
  qualityControl: {
    reviewChecklist: ['40 angles generated', 'All categorized', 'Scoring applied'],
    validationRules: ['Minimum 40 angles', 'All with scores', 'Categories valid'],
    successCriteria: ['All angles viable', 'Quality threshold met']
  },
  errorHandling: {
    possibleErrors: [
      { errorName: 'Insufficient Data', severity: 'high', solution: 'Generate with partial data' },
      { errorName: 'Generation Timeout', severity: 'medium', solution: 'Return partial set' }
    ],
    recoverySteps: ['Retry with adjusted parameters', 'Generate subset']
  },
  limitations: {
    knownLimitations: ['Cannot verify facts', 'Cannot assess editorial fit'],
    requiresHumanJudgmentFor: ['Final angle selection', 'Editorial appropriateness'],
    riskLevel: 'low' as const
  },
  examples: {
    exampleInput: 'Insights: 67% prefer smart home, Trends: DIY security popular',
    exampleOutput: '{"angles":[{"id":1,"text":"67% adoption story","category":"Consumer","score":9.2}]}'
  },
  ui: {
    cardDisplay: { showTaskCount: true, showCapabilityCount: true, showStatus: true },
    profileSections: ['Overview', 'Tasks', 'Capabilities', 'Angles']
  },
  status: {
    label: 'active' as const,
    version: '1.0.0',
    lastUpdated: '2026-05-07'
  }
};

// =============================================================================
// Continue with remaining agents 6-13 (Beat Matcher, Collector, Intelligence, Copywriter, Optimizer, Packager, Validator, Production)
// =============================================================================

// =============================================================================
// AGENT 6: BEAT MATCHER - Category Connector
// =============================================================================

export const BEAT_MATCHER_AGENT = {
  identity: {
    id: 'beat-matcher',
    slug: 'beat-matcher',
    fullName: 'Beat Matching & Category Mapping Agent',
    shortName: 'Beat Matcher',
    displayName: 'Beat Matcher',
    internalName: 'agent_beat_matcher',
    agentNumber: 6,
    tagline: 'Maps angles to appropriate journalist beats.',
    oneLineSummary: 'Connects selected angles to relevant journalist beats and categories.',
    category: 'Matching',
    subCategory: 'Beat Mapping',
    workflowStage: 'matching' as const,
    complexityLevel: 'advanced' as const,
    priority: 'high' as const
  },
  role: {
    title: 'Category Connector',
    primaryPurpose: 'To map selected angles to appropriate journalist beats.',
    detailedRole: 'The Beat Matcher analyzes selected angles and maps them to relevant journalist beats, ensuring pitch-journalist alignment. It identifies beat categories, prioritizes beats by relevance, and prepares beat-specific packages.',
    problemSolved: 'Ensures angles reach journalists who cover relevant topics.',
    businessValue: 'Improves pitch acceptance by targeting right beats.',
    userBenefit: 'Gets beat-organized angle packages.',
    workflowImportance: 'Critical - determines journalist targeting strategy.'
  },
  visual: {
    color: { name: 'Match Teal', hex: '#14B8A6', softHex: '#CCFBF1', darkHex: '#0F766E', gradientFrom: '#14B8A6', gradientTo: '#2DD4BF', textColor: '#FFFFFF', usageReason: 'Teal represents connection and mapping.' },
    avatar: { name: 'Beat Mapper', personality: 'Analytical, organized, structured.', iconName: 'MapPin', emojiFallback: '🎯', avatarStyle: 'Modern AI with mapping elements.' },
    badge: { label: 'Match', tone: 'teal', iconName: 'Link' }
  },
  description: {
    short: 'Maps angles to appropriate journalist beats.',
    medium: 'Connects angles to relevant beat categories.',
    long: 'Maps selected angles to journalist beats for proper targeting.',
    userFacingExplanation: 'Organizes angles by beat category for targeting.',
    adminExplanation: 'Configure beat categories and mapping rules.',
    dashboardTooltip: 'Matches angles to journalist beats.'
  },
  responsibilities: {
    primaryResponsibilities: [
      'Analyze selected angles',
      'Identify relevant beats',
      'Map angles to beat categories',
      'Prioritize beats by relevance',
      'Prepare beat-specific packages'
    ],
    secondaryResponsibilities: [
      'Identify beat overlaps',
      'Flag beat conflicts',
      'Score beat-angle fit',
      'Track beat coverage',
      'Provide beat recommendations'
    ],
    notResponsibleFor: [
      'Collecting journalist contacts',
      'Writing pitch content',
      'Sending emails',
      'Approving content'
    ],
    decisionAuthority: [
      'Beat categorization',
      'Priority ranking',
      'Package organization'
    ]
  },
  tasks: [
    { id: 'bm-1', name: 'Receive Selected Angles', description: 'Accept angles approved at Stage 7.', priority: 'critical', estimatedTime: '2 seconds', successCondition: 'Angles validated', failureCondition: 'Missing angles' },
    { id: 'bm-2', name: 'Analyze Angle Content', description: 'Understand angle context and focus.', priority: 'critical', estimatedTime: '30 seconds', successCondition: 'Analysis complete', failureCondition: 'Analysis fails' },
    { id: 'bm-3', name: 'Identify Beat Categories', description: 'Determine relevant beat categories.', priority: 'critical', estimatedTime: '45 seconds', successCondition: 'Beats identified', failureCondition: 'No beats found' },
    { id: 'bm-4', name: 'Map Angles to Beats', description: 'Connect each angle to best beat.', priority: 'critical', estimatedTime: '60 seconds', successCondition: 'All mapped', failureCondition: 'Unmapped angles' },
    { id: 'bm-5', name: 'Score Beat-Angle Fit', description: 'Rate relevance of match.', priority: 'high', estimatedTime: '45 seconds', successCondition: 'All scored', failureCondition: 'Missing scores' },
    { id: 'bm-6', name: 'Prioritize Beat Order', description: 'Rank beats by relevance.', priority: 'high', estimatedTime: '30 seconds', successCondition: 'Beats ranked', failureCondition: 'No ranking' },
    { id: 'bm-7', name: 'Group by Beat', description: 'Organize angles into beat packages.', priority: 'high', estimatedTime: '45 seconds', successCondition: 'Packages created', failureCondition: 'Grouping fails' },
    { id: 'bm-8', name: 'Identify Beat Overlaps', description: 'Find angles that fit multiple beats.', priority: 'medium', estimatedTime: '30 seconds', successCondition: 'Overlaps identified', failureCondition: 'Missed overlaps' },
    { id: 'bm-9', name: 'Create Beat Profiles', description: 'Generate summary for each beat.', priority: 'medium', estimatedTime: '45 seconds', successCondition: 'Profiles complete', failureCondition: 'Incomplete' },
    { id: 'bm-10', name: 'Validate Mapping Quality', description: 'Ensure accurate beat assignments.', priority: 'high', estimatedTime: '30 seconds', successCondition: 'Quality validated', failureCondition: 'Quality issues' },
    { id: 'bm-11', name: 'Handle Mapping Errors', description: 'Manage failed beat assignments.', priority: 'high', estimatedTime: '10 seconds', successCondition: 'Errors handled', failureCondition: 'Unhandled' },
    { id: 'bm-12', name: 'Prepare Handoff Package', description: 'Bundle for next stage.', priority: 'high', estimatedTime: '30 seconds', successCondition: 'Package ready', failureCondition: 'Incomplete' },
    { id: 'bm-13', name: 'Track Mapping Metrics', description: 'Log mapping performance.', priority: 'low', estimatedTime: '5 seconds', successCondition: 'Metrics logged', failureCondition: 'Not captured' },
    { id: 'bm-14', name: 'Provide Beat Recommendations', description: 'Suggest optimal beat focus.', priority: 'medium', estimatedTime: '20 seconds', successCondition: 'Recommendations provided', failureCondition: 'No suggestions' },
    { id: 'bm-15', name: 'Flag Coverage Gaps', description: 'Identify unrepresented beats.', priority: 'low', estimatedTime: '15 seconds', successCondition: 'Gaps flagged', failureCondition: 'Not flagged' }
  ],
  capabilities: [
    { id: 'bm-c1', name: 'Angle Analysis', description: 'Understand angle content and context.', strengthLevel: 'advanced', example: 'Parse angle text for key topics' },
    { id: 'bm-c2', name: 'Beat Identification', description: 'Determine relevant journalist beats.', strengthLevel: 'expert', example: 'Identify 8-12 relevant beats' },
    { id: 'bm-c3', name: 'Beat-Angle Mapping', description: 'Connect angles to best beats.', strengthLevel: 'expert', example: 'Map 10 angles to 8 beats' },
    { id: 'bm-c4', name: 'Relevance Scoring', description: 'Rate beat-angle fit.', strengthLevel: 'advanced', example: 'Score 8/10 for Tech beat' },
    { id: 'bm-c5', name: 'Beat Prioritization', description: 'Rank beats by importance.', strengthLevel: 'advanced', example: 'Priority: Tech, Business, Consumer' },
    { id: 'bm-c6', name: 'Package Generation', description: 'Create beat-specific bundles.', strengthLevel: 'advanced', example: 'Generate 8 beat packages' },
    { id: 'bm-c7', name: 'Overlap Detection', description: 'Find multi-beat angles.', strengthLevel: 'strong', example: 'Identify 3 overlapping angles' },
    { id: 'bm-c8', name: 'Quality Validation', description: 'Verify mapping accuracy.', strengthLevel: 'strong', example: 'Check mapping quality' },
    { id: 'bm-c9', name: 'Error Recovery', description: 'Handle mapping failures.', strengthLevel: 'strong', example: 'Retry failed mappings' },
    { id: 'bm-c10', name: 'Metrics Tracking', description: 'Log mapping performance.', strengthLevel: 'strong', example: 'Track beats per angle' }
  ],
  inputs: {
    requiredInputs: [
      { name: 'Selected Angles', description: 'User-approved angles from Stage 7', required: true },
      { name: 'Campaign Brief', description: 'Target beats and goals', required: true }
    ],
    optionalInputs: [
      { name: 'Preferred Beats', description: 'Specific beats to prioritize', required: false }
    ]
  },
  outputs: {
    primaryOutputs: [
      { name: 'Beat Packages', description: 'Angles organized by beat', destination: 'Collector' },
      { name: 'Beat Map', description: 'Complete mapping document', destination: 'Dashboard' }
    ]
  },
  workflow: {
    previousAgents: ['human-reviewer', 'strategist'],
    nextAgents: ['collector'],
    receivesFrom: ['Human Reviewer', 'Strategist'],
    sendsTo: ['Collector']
  },
  automation: {
    triggerType: 'Stage 5 complete',
    automationLevel: 'fully-automated' as const,
    humanReviewRequired: false,
    retryRules: ['Max 2 retries on mapping failure'],
    fallbackAction: 'Return partial mapping'
  },
  efficiency: {
    estimatedManualTime: '1-2 hours',
    estimatedAgentTime: '3-5 minutes',
    estimatedTimeSaved: '85-90%'
  },
  performanceMetrics: {
    accuracyScore: 'Estimated: 90%',
    completionRate: 'Estimated: 94%',
    averageCompletionTime: '3-5 minutes'
  },
  stageHistory: [
    { stageName: 'Angle Analysis', status: 'completed', duration: '30s' },
    { stageName: 'Beat Mapping', status: 'completed', duration: '2-3min' },
    { stageName: 'Package Generation', status: 'completed', duration: '1min' }
  ],
  qualityControl: {
    reviewChecklist: ['All angles mapped', 'Beats identified', 'Packages complete'],
    validationRules: ['Minimum 5 beats', 'All angles mapped', 'Quality validated'],
    successCriteria: ['90%+ mapping accuracy']
  },
  errorHandling: {
    possibleErrors: [
      { errorName: 'No Beats Found', severity: 'high', solution: 'Expand beat scope' },
      { errorName: 'Mapping Failure', severity: 'medium', solution: 'Retry with adjusted parameters' }
    ],
    recoverySteps: ['Retry mapping', 'Return partial results']
  },
  limitations: {
    knownLimitations: ['Cannot verify journalist availability', 'Cannot predict beat interest'],
    requiresHumanJudgmentFor: ['Final beat selection', 'Priority decisions'],
    riskLevel: 'low' as const
  },
  examples: {
    exampleInput: 'Selected angles: ["67% smart home", "DIY security trend"]',
    exampleOutput: '{"beats":["Technology","Business","Consumer"],"mappings":10}'
  },
  ui: {
    cardDisplay: { showTaskCount: true, showCapabilityCount: true, showStatus: true },
    profileSections: ['Overview', 'Tasks', 'Capabilities', 'Mapping']
  },
  status: {
    label: 'active' as const,
    version: '1.0.0',
    lastUpdated: '2026-05-07'
  }
};

// =============================================================================
// AGENT 7: COLLECTOR - Journalist Gatherer
// =============================================================================

export const COLLECTOR_AGENT = {
  identity: {
    id: 'collector',
    slug: 'collector',
    fullName: 'Journalist Collection Agent',
    shortName: 'Collector',
    displayName: 'Collector',
    internalName: 'agent_collector',
    agentNumber: 7,
    tagline: 'Collects journalist contacts for targeted beats.',
    oneLineSummary: 'Gathers journalist profiles and contact information for each beat.',
    category: 'Outreach',
    subCategory: 'Contact Collection',
    workflowStage: 'collection' as const,
    complexityLevel: 'advanced' as const,
    priority: 'critical' as const
  },
  role: {
    title: 'Journalist Gatherer',
    primaryPurpose: 'To collect journalist contacts for each beat category.',
    detailedRole: 'The Collector gathers journalist profiles, contact information, and publication details for each beat category. It searches databases, validates contacts, and creates a structured journalist database.',
    problemSolved: 'Automates manual journalist research and contact gathering.',
    businessValue: 'Provides ready-to-use contact lists for outreach.',
    userBenefit: 'Gets verified journalist contacts for each beat.',
    workflowImportance: 'Critical - provides the contact data for all outreach.'
  },
  visual: {
    color: { name: 'Collection Coral', hex: '#F43F5E', softHex: '#FFE4E6', darkHex: '#9F1239', gradientFrom: '#F43F5E', gradientTo: '#FB7185', textColor: '#FFFFFF', usageReason: 'Coral represents active gathering.' },
    avatar: { name: 'Contact Hunter', personality: 'Resourceful, thorough, connected.', iconName: 'Users', emojiFallback: '📇', avatarStyle: 'Modern AI with contact database elements.' },
    badge: { label: 'Collect', tone: 'coral', iconName: 'Contact' }
  },
  description: {
    short: 'Collects journalist contacts for targeted beats.',
    medium: 'Gathers journalist profiles and contact info.',
    long: 'Searches and collects journalist contacts for each beat category.',
    userFacingExplanation: 'Collects journalist contacts for your campaign.',
    adminExplanation: 'Configure contact sources and validation rules.',
    dashboardTooltip: 'Gathers journalist contacts.'
  },
  responsibilities: {
    primaryResponsibilities: [
      'Search journalist databases',
      'Collect profiles and contacts',
      'Validate contact information',
      'Organize by beat',
      'Create contact database'
    ],
    secondaryResponsibilities: [
      'Verify publication affiliations',
      'Check recent coverage',
      'Score journalist fit',
      'Flag duplicates',
      'Track collection metrics'
    ],
    notResponsibleFor: [
      'Writing pitch content',
      'Sending emails',
      'Analyzing coverage',
      'Approving content'
    ],
    decisionAuthority: [
      'Which sources to search',
      'Contact priority ranking',
      'Validation thresholds'
    ]
  },
  tasks: [
    { id: 'col-1', name: 'Receive Beat Packages', description: 'Accept beat-organized angle packages.', priority: 'critical', estimatedTime: '2 seconds', successCondition: 'Packages validated', failureCondition: 'Missing packages' },
    { id: 'col-2', name: 'Identify Target Beats', description: 'Extract beat list from packages.', priority: 'critical', estimatedTime: '10 seconds', successCondition: 'Beats identified', failureCondition: 'No beats' },
    { id: 'col-3', name: 'Search Journalist Databases', description: 'Query for contacts per beat.', priority: 'critical', estimatedTime: '120 seconds', successCondition: 'Results returned', failureCondition: 'Search fails' },
    { id: 'col-4', name: 'Extract Journalist Profiles', description: 'Pull key details from results.', priority: 'critical', estimatedTime: '90 seconds', successCondition: 'Profiles extracted', failureCondition: 'No profiles' },
    { id: 'col-5', name: 'Validate Contact Information', description: 'Verify email addresses.', priority: 'high', estimatedTime: '60 seconds', successCondition: 'Contacts validated', failureCondition: 'Validation fails' },
    { id: 'col-6', name: 'Verify Publication Affiliation', description: 'Confirm current publication.', priority: 'high', estimatedTime: '45 seconds', successCondition: 'Affiliations verified', failureCondition: 'Unverified' },
    { id: 'col-7', name: 'Organize by Beat', description: 'Group contacts by beat category.', priority: 'high', estimatedTime: '45 seconds', successCondition: 'Grouped correctly', failureCondition: 'Grouping fails' },
    { id: 'col-8', name: 'Score Journalist Fit', description: 'Rate relevance to angles.', priority: 'medium', estimatedTime: '60 seconds', successCondition: 'All scored', failureCondition: 'Missing scores' },
    { id: 'col-9', name: 'Flag Duplicate Contacts', description: 'Identify and remove duplicates.', priority: 'medium', estimatedTime: '30 seconds', successCondition: 'Duplicates flagged', failureCondition: 'Duplicates remain' },
    { id: 'col-10', name: 'Create Contact Database', description: 'Build structured database.', priority: 'high', estimatedTime: '60 seconds', successCondition: 'Database created', failureCondition: 'Creation fails' },
    { id: 'col-11', name: 'Check Recent Coverage', description: 'Verify active journalists.', priority: 'medium', estimatedTime: '45 seconds', successCondition: 'Coverage checked', failureCondition: 'Not checked' },
    { id: 'col-12', name: 'Prioritize Contact List', description: 'Rank by relevance.', priority: 'medium', estimatedTime: '30 seconds', successCondition: 'Priorities set', failureCondition: 'No ranking' },
    { id: 'col-13', name: 'Handle Collection Errors', description: 'Manage failed searches.', priority: 'high', estimatedTime: '10 seconds', successCondition: 'Errors handled', failureCondition: 'Unhandled' },
    { id: 'col-14', name: 'Validate Collection Quality', description: 'Ensure minimum quality.', priority: 'high', estimatedTime: '30 seconds', successCondition: 'Quality validated', failureCondition: 'Quality issues' },
    { id: 'col-15', name: 'Prepare Handoff Package', description: 'Bundle contacts for next stage.', priority: 'high', estimatedTime: '30 seconds', successCondition: 'Package ready', failureCondition: 'Incomplete' }
  ],
  capabilities: [
    { id: 'col-c1', name: 'Database Search', description: 'Query journalist databases.', strengthLevel: 'advanced', example: 'Search by beat and topic' },
    { id: 'col-c2', name: 'Profile Extraction', description: 'Pull journalist details.', strengthLevel: 'advanced', example: 'Extract name, outlet, beat' },
    { id: 'col-c3', name: 'Contact Validation', description: 'Verify email addresses.', strengthLevel: 'advanced', example: 'Validate 80%+ contacts' },
    { id: 'col-c4', name: 'Affiliation Verification', description: 'Confirm current publication.', strengthLevel: 'strong', example: 'Verify current role' },
    { id: 'col-c5', name: 'Beat Organization', description: 'Group by beat category.', strengthLevel: 'expert', example: 'Organize 100+ contacts' },
    { id: 'col-c6', name: 'Relevance Scoring', description: 'Rate journalist fit.', strengthLevel: 'advanced', example: 'Score fit 1-10' },
    { id: 'col-c7', name: 'Deduplication', description: 'Remove duplicate contacts.', strengthLevel: 'strong', example: 'Dedupe 95%+' },
    { id: 'col-c8', name: 'Coverage Checking', description: 'Verify active status.', strengthLevel: 'strong', example: 'Check recent articles' },
    { id: 'col-c9', name: 'Database Creation', description: 'Build structured database.', strengthLevel: 'advanced', example: 'Create contact DB' },
    { id: 'col-c10', name: 'Error Recovery', description: 'Handle collection failures.', strengthLevel: 'strong', example: 'Retry failed searches' }
  ],
  inputs: {
    requiredInputs: [
      { name: 'Beat Packages', description: 'Angles organized by beat', required: true },
      { name: 'Collection Criteria', description: 'Target publication types', required: true }
    ],
    optionalInputs: [
      { name: 'Specific Journalists', description: 'Named contacts to prioritize', required: false }
    ]
  },
  outputs: {
    primaryOutputs: [
      { name: 'Journalist Database', description: 'Organized contacts by beat', destination: 'Intelligence' },
      { name: 'Contact List', description: 'Prioritized contact list', destination: 'Dashboard' }
    ]
  },
  workflow: {
    previousAgents: ['beat-matcher'],
    nextAgents: ['intelligence', 'copywriter'],
    receivesFrom: ['Beat Matcher'],
    sendsTo: ['Intelligence', 'Copywriter']
  },
  automation: {
    triggerType: 'Stage 5 complete',
    automationLevel: 'fully-automated' as const,
    humanReviewRequired: false,
    retryRules: ['Max 3 retries on search failure'],
    fallbackAction: 'Return partial contacts'
  },
  efficiency: {
    estimatedManualTime: '3-5 hours',
    estimatedAgentTime: '10-15 minutes',
    estimatedTimeSaved: '90-95%'
  },
  performanceMetrics: {
    accuracyScore: 'Estimated: 85%',
    completionRate: 'Estimated: 92%',
    averageCompletionTime: '10-15 minutes'
  },
  stageHistory: [
    { stageName: 'Beat Processing', status: 'completed', duration: '30s' },
    { stageName: 'Database Search', status: 'completed', duration: '2-3min' },
    { stageName: 'Validation & Packaging', status: 'completed', duration: '5min' }
  ],
  qualityControl: {
    reviewChecklist: ['Contacts validated', 'Beats organized', 'Duplicates removed'],
    validationRules: ['Minimum 20 contacts per beat', '80%+ validation rate', 'No duplicates'],
    successCriteria: ['90%+ contacts valid']
  },
  errorHandling: {
    possibleErrors: [
      { errorName: 'Search Returns No Results', severity: 'high', solution: 'Expand search criteria' },
      { errorName: 'Validation Failures', severity: 'medium', solution: 'Mark as unverified' }
    ],
    recoverySteps: ['Retry search', 'Adjust criteria', 'Return partial']
  },
  limitations: {
    knownLimitations: ['Cannot access all databases', 'Cannot verify personal emails'],
    requiresHumanJudgmentFor: ['Contact quality final check', 'Priority decisions'],
    riskLevel: 'medium' as const
  },
  examples: {
    exampleInput: 'Beats: ["Technology", "Business", "Consumer"]',
    exampleOutput: '{"contacts":150,"validated":120,"byBeat":{"Technology":50,"Business":45,"Consumer":25}}'
  },
  ui: {
    cardDisplay: { showTaskCount: true, showCapabilityCount: true, showStatus: true },
    profileSections: ['Overview', 'Tasks', 'Capabilities', 'Contacts']
  },
  status: {
    label: 'active' as const,
    version: '1.0.0',
    lastUpdated: '2026-05-07'
  }
};

// =============================================================================
// AGENT 8: INTELLIGENCE - Journalist Analyzer
// =============================================================================

export const INTELLIGENCE_AGENT = {
  identity: {
    id: 'intelligence',
    slug: 'intelligence',
    fullName: 'Journalist Intelligence & Enrichment Agent',
    shortName: 'Intelligence',
    displayName: 'Intelligence',
    internalName: 'agent_intelligence',
    agentNumber: 8,
    tagline: 'Enriches journalist profiles with coverage data.',
    oneLineSummary: 'Analyzes journalist coverage history and personalizes outreach.',
    category: 'Outreach',
    subCategory: 'Journalist Analysis',
    workflowStage: 'enrichment' as const,
    complexityLevel: 'advanced' as const,
    priority: 'high' as const
  },
  role: {
    title: 'Journalist Analyzer',
    primaryPurpose: 'To enrich journalist profiles with coverage intelligence.',
    detailedRole: 'The Intelligence Agent analyzes journalist coverage history, identifies recent stories, and enriches profiles with personalization data. It enables personalized pitch content based on actual journalist interests.',
    problemSolved: 'Enables personalized outreach with real journalist data.',
    businessValue: 'Improves pitch response rates through personalization.',
    userBenefit: 'Gets enriched profiles for better outreach.',
    workflowImportance: 'High - enables Stage 8 personalization.'
  },
  visual: {
    color: { name: 'Intelligence Indigo', hex: '#6366F1', softHex: '#E0E7FF', darkHex: '#3730A3', gradientFrom: '#6366F1', gradientTo: '#818CF8', textColor: '#FFFFFF', usageReason: 'Indigo represents deep analysis.' },
    avatar: { name: 'Profile Analyst', personality: 'Insightful, thorough, curious.', iconName: 'UserSearch', emojiFallback: '🔍', avatarStyle: 'Modern AI with analysis elements.' },
    badge: { label: 'Intel', tone: 'indigo', iconName: 'Search' }
  },
  description: {
    short: 'Enriches journalist profiles with coverage data.',
    medium: 'Analyzes coverage history and recent stories.',
    long: 'Provides intelligence on each journalist for personalization.',
    userFacingExplanation: 'Enriches journalist contacts with coverage data.',
    adminExplanation: 'Configure enrichment sources and depth.',
    dashboardTooltip: 'Analyzes journalist coverage.'
  },
  responsibilities: {
    primaryResponsibilities: [
      'Analyze coverage history',
      'Identify recent stories',
      'Extract interests and beats',
      'Enrich journalist profiles',
      'Generate personalization data'
    ],
    secondaryResponsibilities: [
      'Track journalist preferences',
      'Identify story patterns',
      'Score angle fit',
      'Flag inactive journalists',
      'Provide outreach recommendations'
    ],
    notResponsibleFor: [
      'Writing pitch content',
      'Sending emails',
      'Collecting initial contacts',
      'Approving content'
    ],
    decisionAuthority: [
      'Enrichment depth',
      'Which data to include',
      'Profile completeness thresholds'
    ]
  },
  tasks: [
    { id: 'int-1', name: 'Receive Journalist Database', description: 'Accept contacts from Collector.', priority: 'critical', estimatedTime: '2 seconds', successCondition: 'Database received', failureCondition: 'Missing database' },
    { id: 'int-2', name: 'Identify Target Journalists', description: 'Extract contact list.', priority: 'critical', estimatedTime: '10 seconds', successCondition: 'List extracted', failureCondition: 'Empty list' },
    { id: 'int-3', name: 'Search Coverage History', description: 'Find recent articles.', priority: 'critical', estimatedTime: '90 seconds', successCondition: 'Coverage found', failureCondition: 'No coverage' },
    { id: 'int-4', name: 'Analyze Story Topics', description: 'Identify coverage themes.', priority: 'critical', estimatedTime: '60 seconds', successCondition: 'Topics identified', failureCondition: 'No topics' },
    { id: 'int-5', name: 'Extract Journalist Interests', description: 'Determine beat preferences.', priority: 'high', estimatedTime: '45 seconds', successCondition: 'Interests extracted', failureCondition: 'Not found' },
    { id: 'int-6', name: 'Identify Personalization Hooks', description: 'Find story angles for outreach.', priority: 'high', estimatedTime: '60 seconds', successCondition: 'Hooks identified', failureCondition: 'No hooks' },
    { id: 'int-7', name: 'Enrich Journalist Profiles', description: 'Add intelligence data.', priority: 'high', estimatedTime: '60 seconds', successCondition: 'Profiles enriched', failureCondition: 'Enrichment fails' },
    { id: 'int-8', name: 'Score Angle-Journalist Fit', description: 'Rate relevance to angles.', priority: 'medium', estimatedTime: '45 seconds', successCondition: 'All scored', failureCondition: 'Missing scores' },
    { id: 'int-9', name: 'Flag Inactive Journalists', description: 'Identify inactive contacts.', priority: 'medium', estimatedTime: '30 seconds', successCondition: 'Inactive flagged', failureCondition: 'Not flagged' },
    { id: 'int-10', name: 'Generate Outreach Recommendations', description: 'Suggest personalization approach.', priority: 'medium', estimatedTime: '30 seconds', successCondition: 'Recommendations ready', failureCondition: 'Not provided' },
    { id: 'int-11', name: 'Validate Intelligence Quality', description: 'Ensure minimum data quality.', priority: 'high', estimatedTime: '20 seconds', successCondition: 'Quality validated', failureCondition: 'Quality issues' },
    { id: 'int-12', name: 'Handle Enrichment Errors', description: 'Manage failed enrichments.', priority: 'high', estimatedTime: '10 seconds', successCondition: 'Errors handled', failureCondition: 'Unhandled' },
    { id: 'int-13', name: 'Create Intelligence Package', description: 'Bundle enriched profiles.', priority: 'high', estimatedTime: '45 seconds', successCondition: 'Package ready', failureCondition: 'Incomplete' },
    { id: 'int-14', name: 'Track Intelligence Metrics', description: 'Log enrichment performance.', priority: 'low', estimatedTime: '5 seconds', successCondition: 'Metrics logged', failureCondition: 'Not captured' },
    { id: 'int-15', name: 'Prioritize by Fit', description: 'Rank journalists by relevance.', priority: 'medium', estimatedTime: '20 seconds', successCondition: 'Priorities set', failureCondition: 'No ranking' }
  ],
  capabilities: [
    { id: 'int-c1', name: 'Coverage Analysis', description: 'Analyze journalist articles.', strengthLevel: 'advanced', example: 'Review last 20 articles' },
    { id: 'int-c2', name: 'Topic Extraction', description: 'Identify coverage themes.', strengthLevel: 'expert', example: 'Extract 3-5 topics' },
    { id: 'int-c3', name: 'Interest Profiling', description: 'Determine beat preferences.', strengthLevel: 'advanced', example: 'Map to 2-3 beats' },
    { id: 'int-c4', name: 'Hook Generation', description: 'Create personalization angles.', strengthLevel: 'advanced', example: 'Suggest 2-3 hooks' },
    { id: 'int-c5', name: 'Profile Enrichment', description: 'Add intelligence data.', strengthLevel: 'advanced', example: 'Add coverage data' },
    { id: 'int-c6', name: 'Relevance Scoring', description: 'Rate angle fit.', strengthLevel: 'strong', example: 'Score fit 1-10' },
    { id: 'int-c7', name: 'Activity Detection', description: 'Identify active journalists.', strengthLevel: 'strong', example: 'Flag inactive' },
    { id: 'int-c8', name: 'Recommendation Generation', description: 'Suggest outreach approach.', strengthLevel: 'strong', example: 'Provide strategy' },
    { id: 'int-c9', name: 'Quality Validation', description: 'Ensure data completeness.', strengthLevel: 'strong', example: 'Check minimum data' },
    { id: 'int-c10', name: 'Error Recovery', description: 'Handle enrichment failures.', strengthLevel: 'strong', example: 'Retry failed profiles' }
  ],
  inputs: {
    requiredInputs: [
      { name: 'Journalist Database', description: 'Contacts from Collector', required: true },
      { name: 'Selected Angles', description: 'Campaign angles', required: true }
    ],
    optionalInputs: [
      { name: 'Enrichment Depth', description: 'How deep to enrich', required: false }
    ]
  },
  outputs: {
    primaryOutputs: [
      { name: 'Enriched Profiles', description: 'Intelligence-enhanced contacts', destination: 'Copywriter' },
      { name: 'Intelligence Report', description: 'Analysis summary', destination: 'Dashboard' }
    ]
  },
  workflow: {
    previousAgents: ['collector'],
    nextAgents: ['copywriter', 'optimizer'],
    receivesFrom: ['Collector'],
    sendsTo: ['Copywriter']
  },
  automation: {
    triggerType: 'Stage 7 complete',
    automationLevel: 'fully-automated' as const,
    humanReviewRequired: false,
    retryRules: ['Max 2 retries on enrichment failure'],
    fallbackAction: 'Return partial profiles'
  },
  efficiency: {
    estimatedManualTime: '2-3 hours',
    estimatedAgentTime: '8-12 minutes',
    estimatedTimeSaved: '85-90%'
  },
  performanceMetrics: {
    accuracyScore: 'Estimated: 88%',
    completionRate: 'Estimated: 91%',
    averageCompletionTime: '8-12 minutes'
  },
  stageHistory: [
    { stageName: 'Database Processing', status: 'completed', duration: '20s' },
    { stageName: 'Coverage Analysis', status: 'completed', duration: '5-8min' },
    { stageName: 'Profile Enrichment', status: 'completed', duration: '3min' }
  ],
  qualityControl: {
    reviewChecklist: ['Profiles enriched', 'Coverage analyzed', 'Hooks identified'],
    validationRules: ['Minimum 5 data points per profile', 'Coverage found for 80%+'],
    successCriteria: ['90%+ profiles enriched']
  },
  errorHandling: {
    possibleErrors: [
      { errorName: 'No Coverage Found', severity: 'high', solution: 'Mark as minimal data' },
      { errorName: 'Enrichment Timeout', severity: 'medium', solution: 'Return partial' }
    ],
    recoverySteps: ['Retry enrichment', 'Adjust scope', 'Return partial']
  },
  limitations: {
    knownLimitations: ['Cannot access paywalled content', 'Limited to public articles'],
    requiresHumanJudgmentFor: ['Final profile quality', 'Outreach approach'],
    riskLevel: 'low' as const
  },
  examples: {
    exampleInput: 'Journalist: "John Smith, Tech Reporter"',
    exampleOutput: '{"recentTopics":["AI","cybersecurity"],"interests":["enterprise"],"hooks":["recent AI piece"]}'
  },
  ui: {
    cardDisplay: { showTaskCount: true, showCapabilityCount: true, showStatus: true },
    profileSections: ['Overview', 'Tasks', 'Capabilities', 'Intelligence']
  },
  status: {
    label: 'active' as const,
    version: '1.0.0',
    lastUpdated: '2026-05-07'
  }
};

// =============================================================================
// AGENT 9: COPYWRITER - Pitch Composer
// =============================================================================

export const COPYWRITER_AGENT = {
  identity: {
    id: 'copywriter',
    slug: 'copywriter',
    fullName: 'Pitch Drafting Agent',
    shortName: 'Copywriter',
    displayName: 'Copywriter',
    internalName: 'agent_copywriter',
    agentNumber: 9,
    tagline: 'Creates personalized pitch email drafts.',
    oneLineSummary: 'Drafts personalized pitch emails based on angles and journalist data.',
    category: 'Outreach',
    subCategory: 'Content Creation',
    workflowStage: 'drafting' as const,
    complexityLevel: 'advanced' as const,
    priority: 'critical' as const
  },
  role: {
    title: 'Pitch Composer',
    primaryPurpose: 'To create personalized pitch email drafts.',
    detailedRole: 'The Copywriter generates 6 different pitch variants based on angles, journalist profiles, and intelligence data. It creates personalized content that aligns with journalist interests.',
    problemSolved: 'Automates pitch writing while maintaining personalization.',
    businessValue: 'Provides ready-to-review pitch drafts.',
    userBenefit: 'Gets multiple pitch options to choose from.',
    workflowImportance: 'Critical - creates the actual outreach content.'
  },
  visual: {
    color: { name: 'Drafting Gold', hex: '#EAB308', softHex: '#FEF9C3', darkHex: '#854D0E', gradientFrom: '#EAB308', gradientTo: '#FACC15', textColor: '#1F2937', usageReason: 'Gold represents quality content.' },
    avatar: { name: 'Pitch Writer', personality: 'Creative, persuasive, articulate.', iconName: 'PenTool', emojiFallback: '✍️', avatarStyle: 'Modern AI with writing elements.' },
    badge: { label: 'Draft', tone: 'yellow', iconName: 'FileText' }
  },
  description: {
    short: 'Creates personalized pitch email drafts.',
    medium: 'Generates 6 pitch variants per angle.',
    long: 'Writes personalized pitch emails using angle and journalist data.',
    userFacingExplanation: 'Creates pitch drafts for your campaign.',
    adminExplanation: 'Configure tone, length, and variant styles.',
    dashboardTooltip: 'Drafts personalized pitches.'
  },
  responsibilities: {
    primaryResponsibilities: [
      'Generate 6 pitch variants',
      'Personalize for each journalist',
      'Align with angle content',
      'Follow email best practices',
      'Prepare for optimization'
    ],
    secondaryResponsibilities: [
      'Ensure subject line quality',
      'Match tone to beat',
      'Include relevant data',
      'Follow length guidelines',
      'Track drafting metrics'
    ],
    notResponsibleFor: [
      'Sending emails',
      'Selecting final variant',
      'Collecting contacts',
      'Approving content'
    ],
    decisionAuthority: [
      'Pitch variant style',
      'Personalization depth',
      'Content structure'
    ]
  },
  tasks: [
    { id: 'cw-1', name: 'Receive Angle and Profile Data', description: 'Accept angles and journalist info.', priority: 'critical', estimatedTime: '2 seconds', successCondition: 'Data received', failureCondition: 'Missing data' },
    { id: 'cw-2', name: 'Analyze Journalist Preferences', description: 'Understand target audience.', priority: 'critical', estimatedTime: '20 seconds', successCondition: 'Preferences understood', failureCondition: 'Unclear' },
    { id: 'cw-3', name: 'Select Angle for Drafting', description: 'Choose angle to pitch.', priority: 'critical', estimatedTime: '10 seconds', successCondition: 'Angle selected', failureCondition: 'No selection' },
    { id: 'cw-4', name: 'Draft Straight News Variant', description: 'Create formal news style pitch.', priority: 'critical', estimatedTime: '60 seconds', successCondition: 'Draft complete', failureCondition: 'Draft fails' },
    { id: 'cw-5', name: 'Draft Short Punchy Variant', description: 'Create brief impactful pitch.', priority: 'critical', estimatedTime: '45 seconds', successCondition: 'Draft complete', failureCondition: 'Draft fails' },
    { id: 'cw-6', name: 'Draft Data-Heavy Variant', description: 'Create statistics-focused pitch.', priority: 'critical', estimatedTime: '60 seconds', successCondition: 'Draft complete', failureCondition: 'Draft fails' },
    { id: 'cw-7', name: 'Draft Personalized Variant', description: 'Create journalist-specific pitch.', priority: 'critical', estimatedTime: '75 seconds', successCondition: 'Draft complete', failureCondition: 'Draft fails' },
    { id: 'cw-8', name: 'Draft Storytelling Variant', description: 'Create narrative-style pitch.', priority: 'critical', estimatedTime: '60 seconds', successCondition: 'Draft complete', failureCondition: 'Draft fails' },
    { id: 'cw-9', name: 'Draft Localized Variant', description: 'Create local-angle pitch.', priority: 'high', estimatedTime: '50 seconds', successCondition: 'Draft complete', failureCondition: 'Draft fails' },
    { id: 'cw-10', name: 'Create Compelling Subject Lines', description: 'Write engaging subject lines.', priority: 'high', estimatedTime: '30 seconds', successCondition: 'Subjects ready', failureCondition: 'Not created' },
    { id: 'cw-11', name: 'Add Personalization Elements', description: 'Include journalist-specific details.', priority: 'high', estimatedTime: '30 seconds', successCondition: 'Personalization added', failureCondition: 'Not added' },
    { id: 'cw-12', name: 'Validate Content Quality', description: 'Check for errors.', priority: 'high', estimatedTime: '20 seconds', successCondition: 'Quality validated', failureCondition: 'Quality issues' },
    { id: 'cw-13', name: 'Format for Review', description: 'Prepare drafts for Stage 9.', priority: 'high', estimatedTime: '30 seconds', successCondition: 'Formatted correctly', failureCondition: 'Format errors' },
    { id: 'cw-14', name: 'Handle Drafting Errors', description: 'Manage failed drafts.', priority: 'high', estimatedTime: '10 seconds', successCondition: 'Errors handled', failureCondition: 'Unhandled' },
    { id: 'cw-15', name: 'Track Drafting Metrics', description: 'Log drafting performance.', priority: 'low', estimatedTime: '5 seconds', successCondition: 'Metrics logged', failureCondition: 'Not captured' }
  ],
  capabilities: [
    { id: 'cw-c1', name: 'Pitch Writing', description: 'Create email pitch content.', strengthLevel: 'expert', example: 'Write engaging pitch' },
    { id: 'cw-c2', name: 'Variant Generation', description: 'Create multiple versions.', strengthLevel: 'expert', example: 'Generate 6 variants' },
    { id: 'cw-c3', name: 'Personalization', description: 'Add journalist-specific details.', strengthLevel: 'advanced', example: 'Reference recent article' },
    { id: 'cw-c4', name: 'Subject Line Creation', description: 'Write engaging subjects.', strengthLevel: 'advanced', example: 'Create compelling subject' },
    { id: 'cw-c5', name: 'Tone Matching', description: 'Match journalist beat.', strengthLevel: 'advanced', example: 'Match tech beat tone' },
    { id: 'cw-c6', name: 'Data Integration', description: 'Include statistics.', strengthLevel: 'strong', example: 'Add key statistic' },
    { id: 'cw-c7', name: 'Length Optimization', description: 'Adjust for ideal length.', strengthLevel: 'strong', example: 'Keep under 150 words' },
    { id: 'cw-c8', name: 'Quality Validation', description: 'Check content quality.', strengthLevel: 'strong', example: 'Check grammar and flow' },
    { id: 'cw-c9', name: 'Format Standardization', description: 'Follow email format.', strengthLevel: 'strong', example: 'Standard email structure' },
    { id: 'cw-c10', name: 'Error Recovery', description: 'Handle drafting failures.', strengthLevel: 'strong', example: 'Retry failed variant' }
  ],
  inputs: {
    requiredInputs: [
      { name: 'Selected Angles', description: 'Approved angles', required: true },
      { name: 'Journalist Profiles', description: 'Enriched contacts', required: true },
      { name: 'Intelligence Data', description: 'Personalization data', required: true }
    ],
    optionalInputs: [
      { name: 'Tone Preferences', description: 'Preferred writing style', required: false }
    ]
  },
  outputs: {
    primaryOutputs: [
      { name: '6 Pitch Variants', description: 'Draft pitches for review', destination: 'Optimizer' },
      { name: 'Pitch Package', description: 'Formatted drafts', destination: 'Dashboard' }
    ]
  },
  workflow: {
    previousAgents: ['collector', 'intelligence'],
    nextAgents: ['optimizer'],
    receivesFrom: ['Collector', 'Intelligence'],
    sendsTo: ['Optimizer']
  },
  automation: {
    triggerType: 'Stage 7 complete',
    automationLevel: 'fully-automated' as const,
    humanReviewRequired: false,
    retryRules: ['Max 2 retries on draft failure'],
    fallbackAction: 'Generate partial set'
  },
  efficiency: {
    estimatedManualTime: '2-4 hours',
    estimatedAgentTime: '6-10 minutes',
    estimatedTimeSaved: '90-95%'
  },
  performanceMetrics: {
    accuracyScore: 'Estimated: 86%',
    completionRate: 'Estimated: 93%',
    averageCompletionTime: '6-10 minutes'
  },
  stageHistory: [
    { stageName: 'Data Preparation', status: 'completed', duration: '20s' },
    { stageName: 'Variant Drafting', status: 'completed', duration: '5-8min' },
    { stageName: 'Quality Check', status: 'completed', duration: '2min' }
  ],
  qualityControl: {
    reviewChecklist: ['6 variants generated', 'Personalization included', 'Subjects created'],
    validationRules: ['Minimum 6 variants', 'All personalized', 'Quality threshold met'],
    successCriteria: ['85%+ variants usable']
  },
  errorHandling: {
    possibleErrors: [
      { errorName: 'Drafting Failure', severity: 'high', solution: 'Retry with adjusted parameters' },
      { errorName: 'Personalization Missing', severity: 'medium', solution: 'Add generic personalization' }
    ],
    recoverySteps: ['Retry variant', 'Generate partial', 'Add fallback']
  },
  limitations: {
    knownLimitations: ['Cannot verify facts', 'Cannot guarantee delivery'],
    requiresHumanJudgmentFor: ['Final variant selection', 'Content approval'],
    riskLevel: 'low' as const
  },
  examples: {
    exampleInput: 'Angle: "67% smart home", Journalist: "Tech Reporter"',
    exampleOutput: '{"variants":6,"subjects":["67% of Americans prefer..."],"personalized":true}'
  },
  ui: {
    cardDisplay: { showTaskCount: true, showCapabilityCount: true, showStatus: true },
    profileSections: ['Overview', 'Tasks', 'Capabilities', 'Drafts']
  },
  status: {
    label: 'active' as const,
    version: '1.0.0',
    lastUpdated: '2026-05-07'
  }
};

// =============================================================================
// AGENT 10: OPTIMIZER - Email Refiner
// =============================================================================

export const OPTIMIZER_AGENT = {
  identity: {
    id: 'optimizer',
    slug: 'optimizer',
    fullName: 'Pitch Optimization & Refinement Agent',
    shortName: 'Optimizer',
    displayName: 'Optimizer',
    internalName: 'agent_optimizer',
    agentNumber: 10,
    tagline: 'Optimizes pitch content for maximum engagement.',
    oneLineSummary: 'Refines pitch drafts, improves subject lines, and enhances copy.',
    category: 'Optimization',
    subCategory: 'Content Refinement',
    workflowStage: 'optimization' as const,
    complexityLevel: 'advanced' as const,
    priority: 'high' as const
  },
  role: {
    title: 'Email Refiner',
    primaryPurpose: 'To optimize pitch content for better response rates.',
    detailedRole: 'The Optimizer refines pitch drafts, improves subject lines, enhances copy for engagement, and ensures best practices. It selects the best variant and prepares final email.',
    problemSolved: 'Improves pitch effectiveness through optimization.',
    businessValue: 'Increases email response rates.',
    userBenefit: 'Gets optimized, high-converting pitches.',
    workflowImportance: 'High - ensures pitch quality before sending.'
  },
  visual: {
    color: { name: 'Optimize Emerald', hex: '#059669', softHex: '#D1FAE5', darkHex: '#065F46', gradientFrom: '#059669', gradientTo: '#34D399', textColor: '#FFFFFF', usageReason: 'Emerald represents improvement.' },
    avatar: { name: 'Content Optimizer', personality: 'Detail-oriented, strategic, improvement-focused.', iconName: 'Settings', emojiFallback: '⚡', avatarStyle: 'Modern AI with optimization elements.' },
    badge: { label: 'Optimize', tone: 'green', iconName: 'Zap' }
  },
  description: {
    short: 'Optimizes pitch content for maximum engagement.',
    medium: 'Refines drafts and improves response rates.',
    long: 'Enhances pitch content for better engagement and conversion.',
    userFacingExplanation: 'Optimizes your pitch drafts.',
    adminExplanation: 'Configure optimization rules and thresholds.',
    dashboardTooltip: 'Optimizes pitch content.'
  },
  responsibilities: {
    primaryResponsibilities: [
      'Analyze pitch variants',
      'Select best variant',
      'Optimize subject lines',
      'Enhance email copy',
      'Ensure best practices'
    ],
    secondaryResponsibilities: [
      'Improve call-to-action',
      'Fix grammar issues',
      'Enhance readability',
      'Test variations',
      'Track optimization metrics'
    ],
    notResponsibleFor: [
      'Sending emails',
      'Selecting final recipients',
      'Collecting contacts',
      'Approving final send'
    ],
    decisionAuthority: [
      'Variant selection',
      'Optimization approach',
      'Quality thresholds'
    ]
  },
  tasks: [
    { id: 'opt-1', name: 'Receive Pitch Variants', description: 'Accept 6 draft variants.', priority: 'critical', estimatedTime: '2 seconds', successCondition: 'Variants received', failureCondition: 'Missing variants' },
    { id: 'opt-2', name: 'Analyze Each Variant', description: 'Review content and structure.', priority: 'critical', estimatedTime: '60 seconds', successCondition: 'Analysis complete', failureCondition: 'Analysis fails' },
    { id: 'opt-3', name: 'Score Variant Performance', description: 'Rate each variant.', priority: 'critical', estimatedTime: '45 seconds', successCondition: 'All scored', failureCondition: 'Missing scores' },
    { id: 'opt-4', name: 'Select Best Variant', description: 'Choose optimal draft.', priority: 'critical', estimatedTime: '30 seconds', successCondition: 'Variant selected', failureCondition: 'Selection fails' },
    { id: 'opt-5', name: 'Optimize Subject Line', description: 'Improve email subject.', priority: 'critical', estimatedTime: '30 seconds', successCondition: 'Subject optimized', failureCondition: 'No improvement' },
    { id: 'opt-6', name: 'Enhance Email Body', description: 'Improve copy engagement.', priority: 'high', estimatedTime: '60 seconds', successCondition: 'Content enhanced', failureCondition: 'Enhancement fails' },
    { id: 'opt-7', name: 'Improve Call-to-Action', description: 'Strengthen CTA.', priority: 'high', estimatedTime: '20 seconds', successCondition: 'CTA improved', failureCondition: 'No change' },
    { id: 'opt-8', name: 'Fix Grammar and Syntax', description: 'Correct errors.', priority: 'high', estimatedTime: '15 seconds', successCondition: 'Errors fixed', failureCondition: 'Errors remain' },
    { id: 'opt-9', name: 'Enhance Readability', description: 'Improve flow and clarity.', priority: 'medium', estimatedTime: '30 seconds', successCondition: 'Readability improved', failureCondition: 'No improvement' },
    { id: 'opt-10', name: 'Check Length Compliance', description: 'Ensure optimal length.', priority: 'medium', estimatedTime: '10 seconds', successCondition: 'Length validated', failureCondition: 'Too long/short' },
    { id: 'opt-11', name: 'Validate Best Practices', description: 'Check email standards.', priority: 'high', estimatedTime: '20 seconds', successCondition: 'Best practices met', failureCondition: 'Standards not met' },
    { id: 'opt-12', name: 'Finalize Optimized Email', description: 'Create final version.', priority: 'critical', estimatedTime: '30 seconds', successCondition: 'Email finalized', failureCondition: 'Finalize fails' },
    { id: 'opt-13', name: 'Handle Optimization Errors', description: 'Manage failed optimizations.', priority: 'high', estimatedTime: '10 seconds', successCondition: 'Errors handled', failureCondition: 'Unhandled' },
    { id: 'opt-14', name: 'Track Optimization Metrics', description: 'Log performance data.', priority: 'low', estimatedTime: '5 seconds', successCondition: 'Metrics logged', failureCondition: 'Not captured' },
    { id: 'opt-15', name: 'Prepare Final Package', description: 'Bundle for next stage.', priority: 'high', estimatedTime: '20 seconds', successCondition: 'Package ready', failureCondition: 'Incomplete' }
  ],
  capabilities: [
    { id: 'opt-c1', name: 'Variant Analysis', description: 'Review pitch content.', strengthLevel: 'advanced', example: 'Analyze 6 variants' },
    { id: 'opt-c2', name: 'Performance Scoring', description: 'Rate variant effectiveness.', strengthLevel: 'expert', example: 'Score each variant' },
    { id: 'opt-c3', name: 'Best Variant Selection', description: 'Choose optimal draft.', strengthLevel: 'expert', example: 'Select winner' },
    { id: 'opt-c4', name: 'Subject Line Optimization', description: 'Improve email subject.', strengthLevel: 'advanced', example: 'Optimize for open rate' },
    { id: 'opt-c5', name: 'Copy Enhancement', description: 'Improve engagement.', strengthLevel: 'advanced', example: 'Enhance copy flow' },
    { id: 'opt-c6', name: 'CTA Improvement', description: 'Strengthen call-to-action.', strengthLevel: 'strong', example: 'Add compelling CTA' },
    { id: 'opt-c7', name: 'Grammar Correction', description: 'Fix language errors.', strengthLevel: 'strong', example: 'Correct errors' },
    { id: 'opt-c8', name: 'Readability Enhancement', description: 'Improve clarity.', strengthLevel: 'strong', example: 'Simplify complex sentences' },
    { id: 'opt-c9', name: 'Best Practice Validation', description: 'Check standards.', strengthLevel: 'strong', example: 'Verify email standards' },
    { id: 'opt-c10', name: 'Finalization', description: 'Create final version.', strengthLevel: 'advanced', example: 'Package final email' }
  ],
  inputs: {
    requiredInputs: [
      { name: 'Pitch Variants', description: '6 draft pitches', required: true },
      { name: 'Journalist Profiles', description: 'Target contacts', required: true },
      { name: 'Campaign Goals', description: 'Objective and KPIs', required: true }
    ],
    optionalInputs: [
      { name: 'Optimization Preferences', description: 'Specific focus areas', required: false }
    ]
  },
  outputs: {
    primaryOutputs: [
      { name: 'Optimized Email', description: 'Refined final pitch', destination: 'Packager' },
      { name: 'Optimization Report', description: 'Improvement summary', destination: 'Dashboard' }
    ]
  },
  workflow: {
    previousAgents: ['copywriter', 'intelligence'],
    nextAgents: ['packager', 'validator'],
    receivesFrom: ['Copywriter'],
    sendsTo: ['Packager', 'Validator']
  },
  automation: {
    triggerType: 'Stage 8 complete',
    automationLevel: 'fully-automated' as const,
    humanReviewRequired: false,
    retryRules: ['Max 2 retries on optimization failure'],
    fallbackAction: 'Return best of partial'
  },
  efficiency: {
    estimatedManualTime: '1-2 hours',
    estimatedAgentTime: '4-6 minutes',
    estimatedTimeSaved: '85-90%'
  },
  performanceMetrics: {
    accuracyScore: 'Estimated: 90%',
    completionRate: 'Estimated: 94%',
    averageCompletionTime: '4-6 minutes'
  },
  stageHistory: [
    { stageName: 'Variant Analysis', status: 'completed', duration: '60s' },
    { stageName: 'Optimization', status: 'completed', duration: '3min' },
    { stageName: 'Finalization', status: 'completed', duration: '1min' }
  ],
  qualityControl: {
    reviewChecklist: ['Best variant selected', 'Subject optimized', 'Copy enhanced'],
    validationRules: ['Quality threshold met', 'Best practices followed', 'Final version complete'],
    successCriteria: ['90%+ optimization improvement']
  },
  errorHandling: {
    possibleErrors: [
      { errorName: 'No Clear Winner', severity: 'high', solution: 'Select by default criteria' },
      { errorName: 'Optimization Fails', severity: 'medium', solution: 'Return original' }
    ],
    recoverySteps: ['Retry optimization', 'Use fallback selection', 'Return original']
  },
  limitations: {
    knownLimitations: ['Cannot predict recipient response', 'Cannot guarantee delivery'],
    requiresHumanJudgmentFor: ['Final send decision', 'Content approval'],
    riskLevel: 'low' as const
  },
  examples: {
    exampleInput: '6 pitch variants for review',
    exampleOutput: '{"selected":3,"optimizedSubject":"67% of Americans prefer...","improvements":["cta","readability"]}'
  },
  ui: {
    cardDisplay: { showTaskCount: true, showCapabilityCount: true, showStatus: true },
    profileSections: ['Overview', 'Tasks', 'Capabilities', 'Optimization']
  },
  status: {
    label: 'active' as const,
    version: '1.0.0',
    lastUpdated: '2026-05-07'
  }
};

// =============================================================================
// AGENT 11: PACKAGER - Delivery Preparer
// =============================================================================

export const PACKAGER_AGENT = {
  identity: {
    id: 'packager',
    slug: 'packager',
    fullName: 'Email Package Creation Agent',
    shortName: 'Packager',
    displayName: 'Packager',
    internalName: 'agent_packager',
    agentNumber: 11,
    tagline: 'Prepares email packages for delivery.',
    oneLineSummary: 'Bundles optimized pitches with contact data and assets.',
    category: 'Delivery',
    subCategory: 'Package Creation',
    workflowStage: 'packaging' as const,
    complexityLevel: 'advanced' as const,
    priority: 'high' as const
  },
  role: {
    title: 'Delivery Preparer',
    primaryPurpose: 'To prepare complete email packages for delivery.',
    detailedRole: 'The Packager bundles optimized pitches with contact data, attachments, and tracking elements. It creates ready-to-send email packages with all necessary components.',
    problemSolved: 'Ensures complete package for successful delivery.',
    businessValue: 'Provides properly formatted delivery packages.',
    userBenefit: 'Gets ready-to-send email packages.',
    workflowImportance: 'High - prepares for final delivery.'
  },
  visual: {
    color: { name: 'Package Violet', hex: '#8B5CF6', softHex: '#EDE9FE', darkHex: '#5B21B6', gradientFrom: '#8B5CF6', gradientTo: '#A78BFA', textColor: '#FFFFFF', usageReason: 'Violet represents complete bundles.' },
    avatar: { name: 'Package Builder', personality: 'Organized, thorough, complete.', iconName: 'Package', emojiFallback: '📦', avatarStyle: 'Modern AI with packaging elements.' },
    badge: { label: 'Package', tone: 'purple', iconName: 'Box' }
  },
  description: {
    short: 'Prepares email packages for delivery.',
    medium: 'Bundles pitches with contacts and assets.',
    long: 'Creates complete delivery packages with all required elements.',
    userFacingExplanation: 'Prepares email packages for delivery.',
    adminExplanation: 'Configure package components and formatting.',
    dashboardTooltip: 'Prepares delivery packages.'
  },
  responsibilities: {
    primaryResponsibilities: [
      'Bundle pitch with contacts',
      'Add attachment assets',
      'Include tracking elements',
      'Format for delivery system',
      'Create package manifest'
    ],
    secondaryResponsibilities: [
      'Verify package completeness',
      'Check file sizes',
      'Validate contact data',
      'Set up tracking',
      'Track packaging metrics'
    ],
    notResponsibleFor: [
      'Sending emails',
      'Selecting recipients',
      'Approving send',
      'Analyzing results'
    ],
    decisionAuthority: [
      'Package components',
      'Formatting standards',
      'Asset inclusion'
    ]
  },
  tasks: [
    { id: 'pkg-1', name: 'Receive Optimized Email', description: 'Accept final pitch content.', priority: 'critical', estimatedTime: '2 seconds', successCondition: 'Email received', failureCondition: 'Missing email' },
    { id: 'pkg-2', name: 'Receive Journalist Contacts', description: 'Accept target contacts.', priority: 'critical', estimatedTime: '2 seconds', successCondition: 'Contacts received', failureCondition: 'Missing contacts' },
    { id: 'pkg-3', name: 'Review Email Content', description: 'Validate final pitch.', priority: 'critical', estimatedTime: '20 seconds', successCondition: 'Content validated', failureCondition: 'Content issues' },
    { id: 'pkg-4', name: 'Prepare Email Template', description: 'Format for email system.', priority: 'critical', estimatedTime: '30 seconds', successCondition: 'Template ready', failureCondition: 'Format fails' },
    { id: 'pkg-5', name: 'Add Contact Data', description: 'Include recipient info.', priority: 'critical', estimatedTime: '15 seconds', successCondition: 'Contacts added', failureCondition: 'Not added' },
    { id: 'pkg-6', name: 'Attach Assets', description: 'Include supporting files.', priority: 'high', estimatedTime: '30 seconds', successCondition: 'Assets attached', failureCondition: 'Attachment fails' },
    { id: 'pkg-7', name: 'Add Tracking Elements', description: 'Include open/click tracking.', priority: 'high', estimatedTime: '10 seconds', successCondition: 'Tracking added', failureCondition: 'Not added' },
    { id: 'pkg-8', name: 'Create Package Manifest', description: 'List all package contents.', priority: 'high', estimatedTime: '20 seconds', successCondition: 'Manifest created', failureCondition: 'Creation fails' },
    { id: 'pkg-9', name: 'Validate Package Completeness', description: 'Ensure all elements present.', priority: 'high', estimatedTime: '20 seconds', successCondition: 'Validation passed', failureCondition: 'Incomplete' },
    { id: 'pkg-10', name: 'Check File Sizes', description: 'Verify attachment limits.', priority: 'medium', estimatedTime: '10 seconds', successCondition: 'Sizes validated', failureCondition: 'Too large' },
    { id: 'pkg-11', name: 'Format for Delivery', description: 'Prepare for send system.', priority: 'high', estimatedTime: '20 seconds', successCondition: 'Format ready', failureCondition: 'Format error' },
    { id: 'pkg-12', name: 'Handle Package Errors', description: 'Manage failed packaging.', priority: 'high', estimatedTime: '10 seconds', successCondition: 'Errors handled', failureCondition: 'Unhandled' },
    { id: 'pkg-13', name: 'Create Delivery Package', description: 'Finalize bundle.', priority: 'critical', estimatedTime: '30 seconds', successCondition: 'Package created', failureCondition: 'Creation fails' },
    { id: 'pkg-14', name: 'Track Packaging Metrics', description: 'Log packaging performance.', priority: 'low', estimatedTime: '5 seconds', successCondition: 'Metrics logged', failureCondition: 'Not captured' },
    { id: 'pkg-15', name: 'Prepare Handoff to Validator', description: 'Send package for validation.', priority: 'high', estimatedTime: '15 seconds', successCondition: 'Handoff ready', failureCondition: 'Handoff fails' }
  ],
  capabilities: [
    { id: 'pkg-c1', name: 'Content Integration', description: 'Combine email and data.', strengthLevel: 'advanced', example: 'Merge pitch with contacts' },
    { id: 'pkg-c2', name: 'Attachment Handling', description: 'Manage included files.', strengthLevel: 'advanced', example: 'Add press release PDF' },
    { id: 'pkg-c3', name: 'Tracking Setup', description: 'Configure tracking.', strengthLevel: 'advanced', example: 'Add pixel tracking' },
    { id: 'pkg-c4', name: 'Format Standardization', description: 'Follow delivery format.', strengthLevel: 'expert', example: 'Match ESP format' },
    { id: 'pkg-c5', name: 'Manifest Creation', description: 'Document package contents.', strengthLevel: 'strong', example: 'Create content list' },
    { id: 'pkg-c6', name: 'Validation', description: 'Verify package completeness.', strengthLevel: 'strong', example: 'Check all elements' },
    { id: 'pkg-c7', name: 'Size Management', description: 'Control attachment sizes.', strengthLevel: 'strong', example: 'Compress if needed' },
    { id: 'pkg-c8', name: 'Error Recovery', description: 'Handle packaging failures.', strengthLevel: 'strong', example: 'Retry failed element' },
    { id: 'pkg-c9', name: 'Package Finalization', description: 'Complete delivery bundle.', strengthLevel: 'advanced', example: 'Finalize package' },
    { id: 'pkg-c10', name: 'Metrics Tracking', description: 'Log packaging stats.', strengthLevel: 'strong', example: 'Track package size' }
  ],
  inputs: {
    requiredInputs: [
      { name: 'Optimized Email', description: 'Final pitch content', required: true },
      { name: 'Journalist Contacts', description: 'Target recipients', required: true },
      { name: 'Attachment Assets', description: 'Supporting files', required: false }
    ],
    optionalInputs: [
      { name: 'Delivery System', description: 'Target email platform', required: false }
    ]
  },
  outputs: {
    primaryOutputs: [
      { name: 'Delivery Package', description: 'Complete email bundle', destination: 'Validator' },
      { name: 'Package Manifest', description: 'Contents list', destination: 'Dashboard' }
    ]
  },
  workflow: {
    previousAgents: ['optimizer'],
    nextAgents: ['validator', 'production'],
    receivesFrom: ['Optimizer'],
    sendsTo: ['Validator']
  },
  automation: {
    triggerType: 'Stage 9 complete',
    automationLevel: 'fully-automated' as const,
    humanReviewRequired: false,
    retryRules: ['Max 2 retries on packaging failure'],
    fallbackAction: 'Create partial package'
  },
  efficiency: {
    estimatedManualTime: '30-60 minutes',
    estimatedAgentTime: '2-4 minutes',
    estimatedTimeSaved: '85-90%'
  },
  performanceMetrics: {
    accuracyScore: 'Estimated: 95%',
    completionRate: 'Estimated: 96%',
    averageCompletionTime: '2-4 minutes'
  },
  stageHistory: [
    { stageName: 'Content Integration', status: 'completed', duration: '30s' },
    { stageName: 'Package Assembly', status: 'completed', duration: '1-2min' },
    { stageName: 'Validation & Finalization', status: 'completed', duration: '1min' }
  ],
  qualityControl: {
    reviewChecklist: ['All elements included', 'Format validated', 'Tracking added'],
    validationRules: ['Package complete', 'Format correct', 'Assets attached'],
    successCriteria: ['98%+ packages valid']
  },
  errorHandling: {
    possibleErrors: [
      { errorName: 'Attachment Too Large', severity: 'high', solution: 'Compress or remove' },
      { errorName: 'Format Error', severity: 'medium', solution: 'Retry formatting' }
    ],
    recoverySteps: ['Compress attachments', 'Retry format', 'Create partial']
  },
  limitations: {
    knownLimitations: ['Cannot send emails', 'Cannot verify delivery'],
    requiresHumanJudgmentFor: ['Final send approval', 'Recipient selection'],
    riskLevel: 'low' as const
  },
  examples: {
    exampleInput: 'Optimized email + 5 contacts + press release',
    exampleOutput: '{"packageId":"pkg-001","recipients":5,"assets":["press-release.pdf"],"tracking":true}'
  },
  ui: {
    cardDisplay: { showTaskCount: true, showCapabilityCount: true, showStatus: true },
    profileSections: ['Overview', 'Tasks', 'Capabilities', 'Package']
  },
  status: {
    label: 'active' as const,
    version: '1.0.0',
    lastUpdated: '2026-05-07'
  }
};

// =============================================================================
// AGENT 12: VALIDATOR - Quality Gate
// =============================================================================

export const VALIDATOR_AGENT = {
  identity: {
    id: 'validator',
    slug: 'validator',
    fullName: 'Quality Validation & Compliance Agent',
    shortName: 'Validator',
    displayName: 'Validator',
    internalName: 'agent_validator',
    agentNumber: 12,
    tagline: 'Validates email packages for quality and compliance.',
    oneLineSummary: 'Performs final quality check on email packages before send.',
    category: 'Quality Gate',
    subCategory: 'Compliance Check',
    workflowStage: 'validation' as const,
    complexityLevel: 'advanced' as const,
    priority: 'critical' as const
  },
  role: {
    title: 'Quality Gate',
    primaryPurpose: 'To validate email packages for quality and compliance.',
    detailedRole: 'The Validator performs final quality checks on email packages, verifies compliance with regulations, checks for errors, and ensures readiness for delivery.',
    problemSolved: 'Prevents low-quality or non-compliant emails from sending.',
    businessValue: 'Protects brand reputation through quality control.',
    userBenefit: 'Gets validated, send-ready packages.',
    workflowImportance: 'Critical - final quality gate before delivery.'
  },
  visual: {
    color: { name: 'Validation Red', hex: '#DC2626', softHex: '#FEE2E2', darkHex: '#991B1B', gradientFrom: '#DC2626', gradientTo: '#EF4444', textColor: '#FFFFFF', usageReason: 'Red represents strict validation.' },
    avatar: { name: 'Quality Checker', personality: 'Thorough, exacting, compliant.', iconName: 'ShieldCheck', emojiFallback: '✅', avatarStyle: 'Modern AI with validation elements.' },
    badge: { label: 'Validate', tone: 'red', iconName: 'Shield' }
  },
  description: {
    short: 'Validates email packages for quality and compliance.',
    medium: 'Performs final quality and compliance check.',
    long: 'Ensures email packages meet quality standards and regulations.',
    userFacingExplanation: 'Validates your email packages.',
    adminExplanation: 'Configure validation rules and compliance standards.',
    dashboardTooltip: 'Validates quality and compliance.'
  },
  responsibilities: {
    primaryResponsibilities: [
      'Verify content quality',
      'Check compliance requirements',
      'Validate contact data',
      'Ensure technical correctness',
      'Approve for delivery'
    ],
    secondaryResponsibilities: [
      'Check spam score',
      'Verify legal compliance',
      'Test rendering',
      'Track validation metrics',
      'Flag issues for review'
    ],
    notResponsibleFor: [
      'Sending emails',
      'Selecting recipients',
      'Creating content',
      'Analyzing results'
    ],
    decisionAuthority: [
      'Validation pass/fail',
      'Compliance approval',
      'Send readiness'
    ]
  },
  tasks: [
    { id: 'val-1', name: 'Receive Delivery Package', description: 'Accept package from Packager.', priority: 'critical', estimatedTime: '2 seconds', successCondition: 'Package received', failureCondition: 'Missing package' },
    { id: 'val-2', name: 'Verify Content Quality', description: 'Check pitch content.', priority: 'critical', estimatedTime: '30 seconds', successCondition: 'Quality verified', failureCondition: 'Quality issues' },
    { id: 'val-3', name: 'Validate Contact Data', description: 'Verify recipient information.', priority: 'critical', estimatedTime: '20 seconds', successCondition: 'Contacts validated', failureCondition: 'Invalid contacts' },
    { id: 'val-4', name: 'Check Spam Score', description: 'Test email spam likelihood.', priority: 'critical', estimatedTime: '15 seconds', successCondition: 'Score acceptable', failureCondition: 'High spam score' },
    { id: 'val-5', name: 'Verify Legal Compliance', description: 'Check CAN-SPAM/GDPR.', priority: 'high', estimatedTime: '20 seconds', successCondition: 'Compliant', failureCondition: 'Compliance issues' },
    { id: 'val-6', name: 'Test Email Rendering', description: 'Check how email displays.', priority: 'high', estimatedTime: '30 seconds', successCondition: 'Renders correctly', failureCondition: 'Display issues' },
    { id: 'val-7', name: 'Verify Attachment Integrity', description: 'Ensure attachments work.', priority: 'high', estimatedTime: '15 seconds', successCondition: 'Attachments valid', failureCondition: 'Corrupted files' },
    { id: 'val-8', name: 'Check Link Validity', description: 'Verify all links work.', priority: 'medium', estimatedTime: '20 seconds', successCondition: 'All links valid', failureCondition: 'Broken links' },
    { id: 'val-9', name: 'Validate Personalization', description: 'Check merge fields.', priority: 'high', estimatedTime: '15 seconds', successCondition: 'Personalization correct', failureCondition: 'Missing data' },
    { id: 'val-10', name: 'Check Character Encoding', description: 'Verify special characters.', priority: 'medium', estimatedTime: '10 seconds', successCondition: 'Encoding correct', failureCondition: 'Encoding errors' },
    { id: 'val-11', name: 'Generate Validation Report', description: 'Document check results.', priority: 'high', estimatedTime: '20 seconds', successCondition: 'Report generated', failureCondition: 'Report fails' },
    { id: 'val-12', name: 'Make Pass/Fail Decision', description: 'Approve or reject package.', priority: 'critical', estimatedTime: '10 seconds', successCondition: 'Decision made', failureCondition: 'No decision' },
    { id: 'val-13', name: 'Handle Validation Failures', description: 'Manage failed checks.', priority: 'high', estimatedTime: '10 seconds', successCondition: 'Failures flagged', failureCondition: 'Not flagged' },
    { id: 'val-14', name: 'Track Validation Metrics', description: 'Log validation stats.', priority: 'low', estimatedTime: '5 seconds', successCondition: 'Metrics logged', failureCondition: 'Not captured' },
    { id: 'val-15', name: 'Approve for Delivery', description: 'Release package to Production.', priority: 'critical', estimatedTime: '10 seconds', successCondition: 'Approved', failureCondition: 'Rejected' }
  ],
  capabilities: [
    { id: 'val-c1', name: 'Content Quality Check', description: 'Verify pitch quality.', strengthLevel: 'expert', example: 'Check for errors' },
    { id: 'val-c2', name: 'Contact Validation', description: 'Verify recipient data.', strengthLevel: 'advanced', example: 'Validate email addresses' },
    { id: 'val-c3', name: 'Spam Testing', description: 'Check spam score.', strengthLevel: 'advanced', example: 'Test deliverability' },
    { id: 'val-c4', name: 'Compliance Checking', description: 'Verify legal requirements.', strengthLevel: 'expert', example: 'Check CAN-SPAM' },
    { id: 'val-c5', name: 'Rendering Testing', description: 'Test email display.', strengthLevel: 'advanced', example: 'Check across clients' },
    { id: 'val-c6', name: 'Attachment Verification', description: 'Ensure file integrity.', strengthLevel: 'strong', example: 'Verify PDF works' },
    { id: 'val-c7', name: 'Link Validation', description: 'Check URL validity.', strengthLevel: 'strong', example: 'Test all links' },
    { id: 'val-c8', name: 'Personalization Check', description: 'Verify merge fields.', strengthLevel: 'strong', example: 'Check placeholders' },
    { id: 'val-c9', name: 'Decision Making', description: 'Approve or reject.', strengthLevel: 'expert', example: 'Pass or fail' },
    { id: 'val-c10', name: 'Reporting', description: 'Generate validation report.', strengthLevel: 'strong', example: 'Document results' }
  ],
  inputs: {
    requiredInputs: [
      { name: 'Delivery Package', description: 'Complete email bundle', required: true },
      { name: 'Compliance Rules', description: 'Required standards', required: true }
    ],
    optionalInputs: [
      { name: 'Custom Validation Rules', description: 'Specific checks to run', required: false }
    ]
  },
  outputs: {
    primaryOutputs: [
      { name: 'Validation Result', description: 'Pass/fail decision', destination: 'Production' },
      { name: 'Validation Report', description: 'Detailed check results', destination: 'Dashboard' }
    ]
  },
  workflow: {
    previousAgents: ['optimizer', 'packager'],
    nextAgents: ['production'],
    receivesFrom: ['Packager'],
    sendsTo: ['Production']
  },
  automation: {
    triggerType: 'Stage 10 reached',
    automationLevel: 'fully-automated' as const,
    humanReviewRequired: false,
    retryRules: ['Max 2 retries on check failure'],
    fallbackAction: 'Flag for manual review'
  },
  efficiency: {
    estimatedManualTime: '20-40 minutes',
    estimatedAgentTime: '2-3 minutes',
    estimatedTimeSaved: '90-95%'
  },
  performanceMetrics: {
    accuracyScore: 'Estimated: 97%',
    completionRate: 'Estimated: 98%',
    averageCompletionTime: '2-3 minutes'
  },
  stageHistory: [
    { stageName: 'Package Receipt', status: 'completed', duration: '10s' },
    { stageName: 'Validation Checks', status: 'completed', duration: '2min' },
    { stageName: 'Decision & Handoff', status: 'completed', duration: '30s' }
  ],
  qualityControl: {
    reviewChecklist: ['Quality verified', 'Compliance met', 'Technical correct'],
    validationRules: ['All checks pass', 'Score acceptable', 'No critical errors'],
    successCriteria: ['98%+ packages pass']
  },
  errorHandling: {
    possibleErrors: [
      { errorName: 'Validation Failure', severity: 'high', solution: 'Reject and flag issues' },
      { errorName: 'Compliance Issue', severity: 'critical', solution: 'Block send, notify' }
    ],
    recoverySteps: ['Retry checks', 'Fix issues', 'Flag for review']
  },
  limitations: {
    knownLimitations: ['Cannot test actual delivery', 'Cannot predict inbox placement'],
    requiresHumanJudgmentFor: ['Exception handling', 'Final send approval'],
    riskLevel: 'low' as const
  },
  examples: {
    exampleInput: 'Package: pitch + 5 contacts + PDF',
    exampleOutput: '{"passed":true,"checks":15,"spamScore":2,"issues":0,"approved":true}'
  },
  ui: {
    cardDisplay: { showTaskCount: true, showCapabilityCount: true, showStatus: true },
    profileSections: ['Overview', 'Tasks', 'Capabilities', 'Validation']
  },
  status: {
    label: 'active' as const,
    version: '1.0.0',
    lastUpdated: '2026-05-07'
  }
};

// =============================================================================
// AGENT 13: PRODUCTION - Delivery Execute
// =============================================================================

export const PRODUCTION_AGENT = {
  identity: {
    id: 'production',
    slug: 'production',
    fullName: 'Email Delivery Execution Agent',
    shortName: 'Production',
    displayName: 'Production',
    internalName: 'agent_production',
    agentNumber: 13,
    tagline: 'Executes email delivery to journalist contacts.',
    oneLineSummary: 'Sends validated email packages to target recipients.',
    category: 'Delivery',
    subCategory: 'Send Execution',
    workflowStage: 'delivery' as const,
    complexityLevel: 'advanced' as const,
    priority: 'critical' as const
  },
  role: {
    title: 'Delivery Execute',
    primaryPurpose: 'To execute email delivery to target journalists.',
    detailedRole: 'The Production Agent sends validated email packages to target recipients, manages send schedules, tracks delivery status, and reports results.',
    problemSolved: 'Automates the actual email sending process.',
    businessValue: 'Completes the outreach workflow.',
    userBenefit: 'Campaign reaches target journalists.',
    workflowImportance: 'Critical - final stage that delivers the campaign.'
  },
  visual: {
    color: { name: 'Delivery Cyan', hex: '#06B6D4', softHex: '#CFFAFE', darkHex: '#0E7490', gradientFrom: '#06B6D4', gradientTo: '#22D3EE', textColor: '#FFFFFF', usageReason: 'Cyan represents final delivery.' },
    avatar: { name: 'Send Executor', personality: 'Reliable, precise, timely.', iconName: 'Send', emojiFallback: '🚀', avatarStyle: 'Modern AI with delivery elements.' },
    badge: { label: 'Send', tone: 'cyan', iconName: 'Rocket' }
  },
  description: {
    short: 'Executes email delivery to journalist contacts.',
    medium: 'Sends validated email packages to targets.',
    long: 'Delivers validated email packages to target recipients.',
    userFacingExplanation: 'Sends your campaign to journalists.',
    adminExplanation: 'Configure send limits and scheduling.',
    dashboardTooltip: 'Delivers email campaigns.'
  },
  responsibilities: {
    primaryResponsibilities: [
      'Execute email send',
      'Manage send schedule',
      'Track delivery status',
      'Report send results',
      'Handle delivery errors'
    ],
    secondaryResponsibilities: [
      'Monitor send queue',
      'Handle bounces',
      'Manage retry logic',
      'Track engagement',
      'Report campaign metrics'
    ],
    notResponsibleFor: [
      'Creating content',
      'Selecting angles',
      'Collecting contacts',
      'Approving send'
    ],
    decisionAuthority: [
      'Send execution',
      'Retry attempts',
      'Bounce handling'
    ]
  },
  tasks: [
    { id: 'prod-1', name: 'Receive Validated Package', description: 'Accept approved package.', priority: 'critical', estimatedTime: '2 seconds', successCondition: 'Package received', failureCondition: 'Missing package' },
    { id: 'prod-2', name: 'Verify Send Authorization', description: 'Confirm approval to send.', priority: 'critical', estimatedTime: '5 seconds', successCondition: 'Authorized', failureCondition: 'Not authorized' },
    { id: 'prod-3', name: 'Prepare Send Queue', description: 'Queue emails for delivery.', priority: 'critical', estimatedTime: '20 seconds', successCondition: 'Queue ready', failureCondition: 'Queue fails' },
    { id: 'prod-4', name: 'Execute Email Send', description: 'Send to first batch.', priority: 'critical', estimatedTime: '60 seconds', successCondition: 'Send initiated', failureCondition: 'Send fails' },
    { id: 'prod-5', name: 'Monitor Send Status', description: 'Track delivery progress.', priority: 'high', estimatedTime: 'Real-time', successCondition: 'Status tracked', failureCondition: 'Not tracked' },
    { id: 'prod-6', name: 'Handle Bounces', description: 'Process failed deliveries.', priority: 'high', estimatedTime: '30 seconds', successCondition: 'Bounces handled', failureCondition: 'Not processed' },
    { id: 'prod-7', name: 'Retry Failed Sends', description: 'Resend failed emails.', priority: 'high', estimatedTime: '60 seconds', successCondition: 'Retries complete', failureCondition: 'Retries fail' },
    { id: 'prod-8', name: 'Track Delivery Metrics', description: 'Log send results.', priority: 'high', estimatedTime: 'Real-time', successCondition: 'Metrics captured', failureCondition: 'Not captured' },
    { id: 'prod-9', name: 'Generate Delivery Report', description: 'Create send summary.', priority: 'medium', estimatedTime: '30 seconds', successCondition: 'Report generated', failureCondition: 'Report fails' },
    { id: 'prod-10', name: 'Handle Send Errors', description: 'Manage failed sends.', priority: 'high', estimatedTime: '30 seconds', successCondition: 'Errors handled', failureCondition: 'Unhandled' },
    { id: 'prod-11', name: 'Complete Campaign', description: 'Mark campaign complete.', priority: 'critical', estimatedTime: '10 seconds', successCondition: 'Completed', failureCondition: 'Not marked' },
    { id: 'prod-12', name: 'Archive Campaign Data', description: 'Store campaign records.', priority: 'medium', estimatedTime: '20 seconds', successCondition: 'Data archived', failureCondition: 'Not archived' },
    { id: 'prod-13', name: 'Notify Campaign Complete', description: 'Alert user of completion.', priority: 'medium', estimatedTime: '10 seconds', successCondition: 'Notification sent', failureCondition: 'Not sent' },
    { id: 'prod-14', name: 'Track Production Metrics', description: 'Log send performance.', priority: 'low', estimatedTime: '5 seconds', successCondition: 'Metrics logged', failureCondition: 'Not captured' },
    { id: 'prod-15', name: 'Handoff to Analytics', description: 'Send data for analysis.', priority: 'low', estimatedTime: '15 seconds', successCondition: 'Handoff complete', failureCondition: 'Handoff fails' }
  ],
  capabilities: [
    { id: 'prod-c1', name: 'Send Execution', description: 'Deliver emails to recipients.', strengthLevel: 'expert', example: 'Send 5-15 emails' },
    { id: 'prod-c2', name: 'Queue Management', description: 'Manage email queue.', strengthLevel: 'advanced', example: 'Queue 100+ emails' },
    { id: 'prod-c3', name: 'Bounce Handling', description: 'Process failed deliveries.', strengthLevel: 'advanced', example: 'Handle hard/soft bounces' },
    { id: 'prod-c4', name: 'Retry Logic', description: 'Resend failed emails.', strengthLevel: 'advanced', example: 'Retry up to 3x' },
    { id: 'prod-c5', name: 'Status Tracking', description: 'Monitor send progress.', strengthLevel: 'strong', example: 'Track in real-time' },
    { id: 'prod-c6', name: 'Metrics Recording', description: 'Log send results.', strengthLevel: 'strong', example: 'Record sent/failed' },
    { id: 'prod-c7', name: 'Error Management', description: 'Handle send failures.', strengthLevel: 'strong', example: 'Log and notify' },
    { id: 'prod-c8', name: 'Campaign Completion', description: 'Mark workflow complete.', strengthLevel: 'strong', example: 'Complete campaign' },
    { id: 'prod-c9', name: 'Data Archiving', description: 'Store campaign records.', strengthLevel: 'strong', example: 'Archive for history' },
    { id: 'prod-c10', name: 'Reporting', description: 'Generate delivery report.', strengthLevel: 'strong', example: 'Create summary' }
  ],
  inputs: {
    requiredInputs: [
      { name: 'Validated Package', description: 'Approved email bundle', required: true },
      { name: 'Send Authorization', description: 'Permission to send', required: true }
    ],
    optionalInputs: [
      { name: 'Send Schedule', description: 'Specific send time', required: false }
    ]
  },
  outputs: {
    primaryOutputs: [
      { name: 'Delivery Report', description: 'Send results summary', destination: 'Dashboard' },
      { name: 'Campaign Complete', description: 'Workflow finished', destination: 'Orchestrator' }
    ]
  },
  workflow: {
    previousAgents: ['validator', 'packager'],
    nextAgents: [],
    receivesFrom: ['Validator'],
    sendsTo: ['Orchestrator']
  },
  automation: {
    triggerType: 'Stage 11 passed',
    automationLevel: 'fully-automated' as const,
    humanReviewRequired: false,
    retryRules: ['Max 3 retries per email'],
    fallbackAction: 'Flag failed emails for review'
  },
  efficiency: {
    estimatedManualTime: '1-2 hours',
    estimatedAgentTime: '3-5 minutes',
    estimatedTimeSaved: '90-95%'
  },
  performanceMetrics: {
    accuracyScore: 'Estimated: 98%',
    completionRate: 'Estimated: 97%',
    averageCompletionTime: '3-5 minutes'
  },
  stageHistory: [
    { stageName: 'Package Receipt', status: 'completed', duration: '10s' },
    { stageName: 'Send Execution', status: 'completed', duration: '2-3min' },
    { stageName: 'Completion & Reporting', status: 'completed', duration: '1min' }
  ],
  qualityControl: {
    reviewChecklist: ['Authorization verified', 'Send initiated', 'Results tracked'],
    validationRules: ['Send attempted', 'Bounces handled', 'Metrics captured'],
    successCriteria: ['95%+ emails sent successfully']
  },
  errorHandling: {
    possibleErrors: [
      { errorName: 'Send Failure', severity: 'high', solution: 'Retry up to 3 times' },
      { errorName: 'Bounce Rate High', severity: 'medium', solution: 'Flag for review' }
    ],
    recoverySteps: ['Retry failed', 'Handle bounces', 'Report errors']
  },
  limitations: {
    knownLimitations: ['Cannot guarantee inbox placement', 'Cannot control recipient actions'],
    requiresHumanJudgmentFor: ['Exception handling', 'Campaign analysis'],
    riskLevel: 'medium' as const
  },
  examples: {
    exampleInput: 'Validated package + 5 contacts',
    exampleOutput: '{"sent":5,"delivered":5,"failed":0,"bounces":0,"completed":true}'
  },
  ui: {
    cardDisplay: { showTaskCount: true, showCapabilityCount: true, showStatus: true },
    profileSections: ['Overview', 'Tasks', 'Capabilities', 'Delivery']
  },
  status: {
    label: 'active' as const,
    version: '1.0.0',
    lastUpdated: '2026-05-07'
  }
};

// =============================================================================
// AGENT 14: DATA & RESEARCH ANALYST - Internal Stage 4 Agent 1
// =============================================================================

export const DATA_ANALYST_AGENT = {
  identity: {
    id: 'data-analyst',
    slug: 'data-analyst',
    fullName: 'Data & Research Analyst Agent',
    shortName: 'Data Analyst',
    displayName: 'Data & Research Analyst',
    internalName: 'agent_data_analyst',
    agentNumber: 14,
    tagline: 'Validates evidence and statistics from research.',
    oneLineSummary: 'First layer of Stage 4 - validates statistics, claims, sources, and evidence quality.',
    category: 'Analysis',
    subCategory: 'Evidence Validation',
    workflowStage: 'analysis' as const,
    complexityLevel: 'expert' as const,
    priority: 'critical' as const
  },
  role: {
    title: 'Evidence Validator',
    primaryPurpose: 'To validate all statistics, claims, sources, and evidence quality from Stage 3 research.',
    detailedRole: 'The Data & Research Analyst is the first internal agent in Stage 4 Data & Research Analysis. It validates all extracted insights, verifies source credibility, checks statistical accuracy, and produces verified-findings.json for the Insight Analyst.',
    problemSolved: 'Ensures only validated evidence flows to angle generation.',
    businessValue: 'Prevents hallucinated statistics in final pitches.',
    userBenefit: 'Users receive pitches grounded in verified data.',
    workflowImportance: 'Critical - blocks false evidence from reaching pitches.'
  },
  visual: {
    color: { name: 'Analysis Teal', hex: '#0D9488', softHex: '#CCFBF1', darkHex: '#0F766E', gradientFrom: '#0D9488', gradientTo: '#14B8A6', textColor: '#FFFFFF', usageReason: 'Teal represents data validation.' },
    avatar: { name: 'Evidence Validator', personality: 'Precise, skeptical, thorough.', iconName: 'CheckShield', emojiFallback: '🔬', avatarStyle: 'Modern AI with analysis elements.' },
    badge: { label: 'Validate', tone: 'teal', iconName: 'Shield' }
  },
  description: {
    short: 'Validates statistics, claims, and evidence quality.',
    medium: 'First layer of Stage 4 - validates all research evidence.',
    long: 'Validates statistics, claims, sources, and evidence quality from Stage 3. Produces verified-findings.json.',
    userFacingExplanation: 'Validates research data before angles are generated.',
    adminExplanation: 'Configure validation rules and thresholds.',
    dashboardTooltip: 'Validates evidence quality.'
  },
  responsibilities: {
    primaryResponsibilities: [
      'Validate statistics and claims',
      'Verify source credibility',
      'Check data accuracy',
      'Flag questionable evidence',
      'Produce verified-findings.json'
    ],
    secondaryResponsibilities: [
      'Cross-reference claims with sources',
      'Assess statistical significance',
      'Document validation process',
      'Provide confidence scores',
      'Flag placeholder research'
    ],
    notResponsibleFor: [
      'Generating angles',
      'Selecting beats',
      'Writing pitches',
      'Collecting journalists'
    ],
    decisionAuthority: [
      'Evidence approval',
      'Source credibility assessment',
      'Validation thresholds'
    ]
  },
  tasks: [
    { id: 'da-1', name: 'Receive Extracted Insights', description: 'Accept 02-insights from extractor.', priority: 'critical', estimatedTime: '2 seconds', successCondition: 'Received', failureCondition: 'Missing' },
    { id: 'da-2', name: 'Receive Research Enrichment', description: 'Accept 03-research from researcher.', priority: 'critical', estimatedTime: '2 seconds', successCondition: 'Received', failureCondition: 'Missing' },
    { id: 'da-3', name: 'Validate Each Statistic', description: 'Verify each numeric claim.', priority: 'critical', estimatedTime: '30 seconds', successCondition: 'All validated', failureCondition: 'Incomplete' },
    { id: 'da-4', name: 'Verify Source Citations', description: 'Check source credibility.', priority: 'critical', estimatedTime: '20 seconds', successCondition: 'Sources verified', failureCondition: 'Missing sources' },
    { id: 'da-5', name: 'Flag Placeholder Research', description: 'Mark unverified research.', priority: 'high', estimatedTime: '10 seconds', successCondition: 'Flagged', failureCondition: 'Not flagged' },
    { id: 'da-6', name: 'Produce Verified Findings', description: 'Generate verified-findings.json.', priority: 'critical', estimatedTime: '15 seconds', successCondition: 'Generated', failureCondition: 'Failed' },
    { id: 'da-7', name: 'Handoff to Insight Analyst', description: 'Pass validated findings.', priority: 'critical', estimatedTime: '5 seconds', successCondition: 'Handoff complete', failureCondition: 'Failed' }
  ],
  capabilities: [
    { id: 'da-c1', name: 'Statistical Validation', description: 'Verify numeric claims.', strengthLevel: 'expert', example: 'Validate percentages and averages' },
    { id: 'da-c2', name: 'Source Verification', description: 'Check source credibility.', strengthLevel: 'expert', example: 'Verify publication credibility' },
    { id: 'da-c3', name: 'Claim Cross-Reference', description: 'Cross-check claims.', strengthLevel: 'strong', example: 'Compare multiple sources' },
    { id: 'da-c4', name: 'Placeholder Detection', description: 'Identify unverified data.', strengthLevel: 'strong', example: 'Flag placeholder research' },
    { id: 'da-c5', name: 'Confidence Scoring', description: 'Score evidence quality.', strengthLevel: 'strong', example: 'High/Medium/Low confidence' }
  ],
  inputs: {
    requiredInputs: [
      { name: 'campaignId', description: 'Campaign identifier', required: true },
      { name: '02-insights.md', description: 'Extracted insights from Stage 2', required: true },
      { name: '03-research.md', description: 'Research enrichment from Stage 3', required: true }
    ],
    optionalInputs: []
  },
  outputs: {
    primaryOutput: 'verified-findings.json',
    secondaryOutputs: ['04-analysis.md'],
    artifactFiles: ['verified-findings.json', '04-analysis.md']
  },
  workflow: {
    receivesFrom: ['extractor', 'researcher'],
    sendsTo: ['insight-analyst'],
    previousAgents: ['extractor', 'researcher'],
    nextAgents: ['insight-analyst']
  },
  automation: {
    automationLevel: 'agent' as const,
    requiresHumanApproval: false,
    estimatedRunTime: '60-90 seconds',
    retryPolicy: '3 retries with backoff'
  },
  efficiency: {
    estimatedManualTime: '45 minutes',
    estimatedAgentTime: '90 seconds',
    estimatedTimeSaved: '97%',
    efficiencyScore: 98
  },
  metrics: {
    accuracyRate: 99.5,
    validationCoverage: 100,
    falsePositiveRate: 0.5,
    processingSpeed: 'Fast'
  },
  quality: {
    validationRequired: true,
    approvalGate: 'automatic',
    qualityGateModel: 'hy3-preview',
    errorThreshold: 0.01
  },
  limitations: {
    cannotValidate: ['Real-world claims beyond sources', 'Future predictions', 'Unverifiable statistics'],
    requires: ['Source documents', 'Research data'],
    boundaries: ['Only validates existing data', 'Cannot create new evidence']
  },
  examples: {
    validEvidence: 'Source: Pew Research 2024, stat: 73% of journalists prefer data-driven pitches',
    invalidEvidence: 'Claim without source or with contradictory sources',
    placeholderEvidence: 'Research marked as "placeholder" when realSearchAvailable=false'
  },
  ui: {
    cardDisplay: { showTaskCount: true, showCapabilityCount: true, showStatus: true },
    profileSections: ['Overview', 'Tasks', 'Capabilities', 'Validation']
  },
  status: {
    label: 'active' as const,
    version: '1.0.0',
    lastUpdated: '2026-05-08'
  }
};

// =============================================================================
// AGENT 15: INSIGHT ANALYST - Internal Stage 4 Agent 2
// =============================================================================

export const INSIGHT_ANALYST_AGENT = {
  identity: {
    id: 'insight-analyst',
    slug: 'insight-analyst',
    fullName: 'Insight Analyst Agent',
    shortName: 'Insight Analyst',
    displayName: 'Insight Analyst',
    internalName: 'agent_insight_analyst',
    agentNumber: 15,
    tagline: 'Generates strategic storylines from validated evidence.',
    oneLineSummary: 'Second layer of Stage 4 - creates data-backed storylines and angle directions.',
    category: 'Analysis',
    subCategory: 'Storyline Strategy',
    workflowStage: 'analysis' as const,
    complexityLevel: 'expert' as const,
    priority: 'critical' as const
  },
  role: {
    title: 'Storyline Strategist',
    primaryPurpose: 'To create data-backed storylines and strategic angle directions from validated evidence.',
    detailedRole: 'The Insight Analyst is the second internal agent in Stage 4 Data & Research Analysis. It uses verified findings from Data & Research Analyst to generate strategic storylines, identify angle directions, and produce InsightAnalysisMap and AngleGenerationHandoff for the Strategist.',
    problemSolved: 'Transforms raw data into strategic pitch angles.',
    businessValue: 'Creates compelling narrative angles from evidence.',
    userBenefit: 'Users receive strategic angles grounded in validated data.',
    workflowImportance: 'Critical - bridges data validation to angle generation.'
  },
  visual: {
    color: { name: 'Strategy Amber', hex: '#D97706', softHex: '#FEF3C7', darkHex: '#B45309', gradientFrom: '#D97706', gradientTo: '#F59E0B', textColor: '#FFFFFF', usageReason: 'Amber represents strategic insight.' },
    avatar: { name: 'Storyline Creator', personality: 'Creative, strategic, data-informed.', iconName: 'Lightbulb', emojiFallback: '💡', avatarStyle: 'Modern AI with strategy elements.' },
    badge: { label: 'Insights', tone: 'amber', iconName: 'Lightbulb' }
  },
  description: {
    short: 'Creates data-backed storylines and angle directions.',
    medium: 'Second layer of Stage 4 - generates strategic storylines from validated evidence.',
    long: 'Creates data-backed storylines and strategic angle directions from verified findings. Produces InsightAnalysisMap and AngleGenerationHandoff.',
    userFacingExplanation: 'Generates storylines from validated data.',
    adminExplanation: 'Configure storyline templates and angle categories.',
    dashboardTooltip: 'Generates strategic insights.'
  },
  responsibilities: {
    primaryResponsibilities: [
      'Analyze verified findings',
      'Identify storyline opportunities',
      'Generate angle directions',
      'Produce InsightAnalysisMap',
      'Create AngleGenerationHandoff'
    ],
    secondaryResponsibilities: [
      'Map findings to beat categories',
      'Identify risk factors',
      'Recommend evidence usage',
      'Flag angle directions to avoid',
      'Provide strategic context'
    ],
    notResponsibleFor: [
      'Validating evidence',
      'Collecting journalists',
      'Writing pitches',
      'Sending emails'
    ],
    decisionAuthority: [
      'Storyline creation',
      'Angle direction selection',
      'Risk factor identification'
    ]
  },
  tasks: [
    { id: 'ia-1', name: 'Receive Verified Findings', description: 'Accept verified-findings.json from Data Analyst.', priority: 'critical', estimatedTime: '2 seconds', successCondition: 'Received', failureCondition: 'Missing' },
    { id: 'ia-2', name: 'Analyze Data Patterns', description: 'Identify patterns in validated data.', priority: 'critical', estimatedTime: '30 seconds', successCondition: 'Patterns identified', failureCondition: 'Incomplete' },
    { id: 'ia-3', name: 'Generate Storylines', description: 'Create data-backed storylines.', priority: 'critical', estimatedTime: '45 seconds', successCondition: 'Storylines generated', failureCondition: 'Failed' },
    { id: 'ia-4', name: 'Map to Beat Categories', description: 'Map storylines to journalist beats.', priority: 'high', estimatedTime: '20 seconds', successCondition: 'Mapped', failureCondition: 'Incomplete' },
    { id: 'ia-5', name: 'Identify Risk Warnings', description: 'Flag claims to avoid.', priority: 'high', estimatedTime: '15 seconds', successCondition: 'Risks identified', failureCondition: 'Missed' },
    { id: 'ia-6', name: 'Produce InsightAnalysisMap', description: 'Generate insight mapping.', priority: 'critical', estimatedTime: '20 seconds', successCondition: 'Generated', failureCondition: 'Failed' },
    { id: 'ia-7', name: 'Create AngleGenerationHandoff', description: 'Build handoff package for Strategist.', priority: 'critical', estimatedTime: '15 seconds', successCondition: 'Created', failureCondition: 'Failed' },
    { id: 'ia-8', name: 'Handoff to Strategist', description: 'Pass complete package to Stage 5.', priority: 'critical', estimatedTime: '5 seconds', successCondition: 'Handoff complete', failureCondition: 'Failed' }
  ],
  capabilities: [
    { id: 'ia-c1', name: 'Pattern Analysis', description: 'Identify data patterns.', strengthLevel: 'expert', example: 'Find trends in validated statistics' },
    { id: 'ia-c2', name: 'Storyline Generation', description: 'Create narrative angles.', strengthLevel: 'expert', example: 'Generate 10+ storylines per campaign' },
    { id: 'ia-c3', name: 'Beat Mapping', description: 'Map to journalist beats.', strengthLevel: 'strong', example: 'Map to 20+ beat categories' },
    { id: 'ia-c4', name: 'Risk Identification', description: 'Flag dangerous claims.', strengthLevel: 'strong', example: 'Identify claims to avoid' },
    { id: 'ia-c5', name: 'Strategic Packaging', description: 'Package insights for Strategist.', strengthLevel: 'strong', example: 'Create complete handoff' }
  ],
  inputs: {
    requiredInputs: [
      { name: 'campaignId', description: 'Campaign identifier', required: true },
      { name: 'verified-findings.json', description: 'Validated findings from Data Analyst', required: true },
      { name: '04-analysis.md', description: 'Analysis report from Data Analyst', required: true }
    ],
    optionalInputs: []
  },
  outputs: {
    primaryOutput: 'InsightAnalysisMap',
    secondaryOutputs: ['AngleGenerationHandoff', '04-analysis.md'],
    artifactFiles: ['InsightAnalysisMap.json', 'angle-guidance.json', '04-analysis.md']
  },
  workflow: {
    receivesFrom: ['data-analyst'],
    sendsTo: ['strategist'],
    previousAgents: ['data-analyst'],
    nextAgents: ['strategist']
  },
  automation: {
    automationLevel: 'agent' as const,
    requiresHumanApproval: false,
    estimatedRunTime: '90-120 seconds',
    retryPolicy: '3 retries with backoff'
  },
  efficiency: {
    estimatedManualTime: '60 minutes',
    estimatedAgentTime: '2 minutes',
    estimatedTimeSaved: '98%',
    efficiencyScore: 97
  },
  metrics: {
    accuracyRate: 98,
    storylineCoverage: 100,
    angleDirectionQuality: 95,
    processingSpeed: 'Fast'
  },
  quality: {
    validationRequired: true,
    approvalGate: 'automatic',
    qualityGateModel: 'hy3-preview',
    errorThreshold: 0.05
  },
  limitations: {
    cannotCreate: ['Angles without validated evidence', 'Fictional storylines', 'Angles from unverified data'],
    requires: ['Verified findings', 'Analysis report'],
    boundaries: ['Only creates storylines from approved evidence']
  },
  examples: {
    validStoryline: 'Finding: 73% prefer data-driven pitches → Storyline: "Data showsPR pitches with statistics get 3x more responses"',
    riskWarning: 'Claim: "AI will replace journalists" - avoid, requires more evidence',
    handoffField: 'mustUseEvidence: ["VF_001", "VF_003"], mustAvoidClaims: ["AI replacement"]'
  },
  ui: {
    cardDisplay: { showTaskCount: true, showCapabilityCount: true, showStatus: true },
    profileSections: ['Overview', 'Tasks', 'Capabilities', 'Insights']
  },
  status: {
    label: 'active' as const,
    version: '1.0.0',
    lastUpdated: '2026-05-08'
  }
};

// =============================================================================
// ALL AGENTS EXPORT
// =============================================================================

export const ALL_AGENTS = [
  ORCHESTRATOR_AGENT,
  HUMAN_REVIEWER_AGENT,
  DATA_EXTRACTOR_AGENT,
  RESEARCHER_AGENT,
  DATA_ANALYST_AGENT,
  INSIGHT_ANALYST_AGENT,
  STRATEGIST_AGENT,
  BEAT_MATCHER_AGENT,
  COLLECTOR_AGENT,
  INTELLIGENCE_AGENT,
  COPYWRITER_AGENT,
  OPTIMIZER_AGENT,
  PACKAGER_AGENT,
  VALIDATOR_AGENT,
  PRODUCTION_AGENT
];

export default ALL_AGENTS;
