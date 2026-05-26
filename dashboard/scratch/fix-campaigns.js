const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const JSON_STORE = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\data\\campaigns.json'
const STAGE_DEFINITIONS = [
  { number: 1, name: 'Campaign Intake', owner: 'digital-pr-orchestrator', inputs: [], outputs: ['00-brief.md'] },
  { number: 2, name: 'Study Extraction', owner: 'study-insight-extractor', inputs: ['00-brief.md', 'source-files/study-inputs/raw-study-copy.md'], outputs: ['01-study-notes.md', '02-insights.md'] },
  { number: 3, name: 'Research Enrichment', owner: 'research-enrichment-agent', inputs: ['01-study-notes.md', '02-insights.md'], outputs: ['03-research.md'] },
  { number: 4, name: 'Angle Generation', owner: 'angle-generator', inputs: ['02-insights.md', '03-research.md'], outputs: ['04-angles.md'] },
  { number: 5, name: 'Beat Matching', owner: 'beat-matcher', inputs: ['04-angles.md'], outputs: ['05-beats.md'] },
  { number: 6, name: 'Journalist Collection', owner: 'journalist-targeting-subagent', inputs: ['05-beats.md'], outputs: ['source-files/journalist-intel/'] },
  { number: 7, name: 'Journalist Intelligence', owner: 'journalist-intelligence-agent', inputs: ['source-files/journalist-intel/'], outputs: ['06-journalist-intel.md', '07-journalist-coverage.md'] },
  { number: 8, name: 'Pitch Drafting', owner: 'pitch-writer', inputs: ['04-angles.md', '05-beats.md', '06-journalist-intel.md', '07-journalist-coverage.md'], outputs: ['draft-variants/', '08-pitch-draft.md'] },
  { number: 9, name: 'Email Optimization', owner: 'email-optimizer', inputs: ['08-pitch-draft.md'], outputs: ['09-optimized-email.md'] },
  { number: 10, name: 'Final Packaging', owner: 'final-doc-packager', inputs: ['09-optimized-email.md'], outputs: ['10-google-doc.md'] },
  { number: 11, name: 'Google Doc Export', owner: 'final-doc-packager', inputs: ['10-google-doc.md'], outputs: [] },
  { number: 12, name: 'Technical Validation', owner: 'digital-pr-orchestrator', inputs: [], outputs: [] },
  { number: 13, name: 'Browser Validation', owner: 'journalist-targeting-subagent', inputs: [], outputs: [] },
  { number: 14, name: 'Production Readiness', owner: 'digital-pr-orchestrator', inputs: [], outputs: [] }
]

function fix() {
  if (!fs.existsSync(JSON_STORE)) return
  const data = JSON.parse(fs.readFileSync(JSON_STORE, 'utf-8'))
  
  data.campaigns.forEach(campaign => {
    const hasStages = data.stages.some(s => s.campaign_id === campaign.id)
    if (!hasStages) {
      console.log(`Fixing campaign: ${campaign.name} (${campaign.id})`)
      STAGE_DEFINITIONS.forEach(stage => {
        data.stages.push({
          id: uuidv4(),
          campaign_id: campaign.id,
          stage_number: stage.number,
          stage_name: stage.name,
          owner: stage.owner,
          status: 'pending',
          input_files: JSON.stringify(stage.inputs),
          output_files: JSON.stringify(stage.outputs),
          started_at: null,
          completed_at: null,
          error: null
        })
      })
      
      data.gates.push(
        { id: uuidv4(), campaign_id: campaign.id, gate_name: 'Outreach Angle Gate', status: 'open', value: null, triggered_at: null, confirmed_at: null },
        { id: uuidv4(), campaign_id: campaign.id, gate_name: '800-Per-Beat Gate', status: 'open', value: null, triggered_at: null, confirmed_at: null }
      )
    }
  })
  
  fs.writeFileSync(JSON_STORE, JSON.stringify(data, null, 2), 'utf-8')
  console.log('Done!')
}

fix()
