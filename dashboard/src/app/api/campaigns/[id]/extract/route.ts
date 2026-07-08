/**
 * Data Extraction API Route
 * Stage 2: Study to Insights Conversion
 * 
 * This endpoint handles extraction of meaningful data from raw study content
 * and converts it into structured insights for downstream stages.
 * 
 * Flow:
 * 1. Receives campaign ID from frontend
 * 2. Reads raw-study-copy.md from pitch-jobs/<slug>/source-files/study-inputs/
 * 3. Parses content for statistics, findings, locations, timeframes, factors
 * 4. Writes 02-insights.md to pitch-jobs/<slug>/
 * 5. Returns extracted data to frontend
 * 
 * Part of Digital PR Workflow: S1 Campaign → S2 Data Extraction → S3 Research Enrichment → S4 Angle Generation → S5 Beat Matching → S6 Pitch Selection
 */

import { fail, ok } from '@/lib/apiResponse';
import { resolveCampaignPath } from '@/lib/requestGuard';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * POST /api/campaigns/[id]/extract
 * 
 * Extract structured data from raw study content
 * 
 * @param {Request} request - HTTP request (not used directly, params contain campaign ID)
 * @param {Object} params - URL parameters
 * @param {string} params.id - Campaign slug (from URL path)
 * @returns {NextResponse} JSON with success status and extracted content
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  
  try {
    // =====================================================================
    // STEP 1: Define paths
    // =====================================================================
    const pitchJobDir = resolveCampaignPath(id);
    const rawStudyPath = join(pitchJobDir, 'source-files', 'study-inputs', 'raw-study-copy.md');
    const insightsPath = join(pitchJobDir, '02-insights.md');
    const rawExtractedPath = join(pitchJobDir, '02-raw-extracted-data.json');
    const briefPath = join(pitchJobDir, '00-brief.md');
    const stageStatePath = join(pitchJobDir, 'stage-state.json');

    // =====================================================================
    // STEP 2: Validate campaign exists
    // =====================================================================
    if (!existsSync(pitchJobDir)) {
      console.error(`[Extract] Campaign folder not found: ${pitchJobDir}`);
      return fail('CAMPAIGN_NOT_FOUND', 'Campaign not found.', { status: 404 }, `No campaign folder at pitch-jobs/${id}`);
    }

    // =====================================================================
    // STEP 3: Validate required input files exist
    // =====================================================================
    if (!existsSync(rawStudyPath)) {
      console.error(`[Extract] Raw study file not found: ${rawStudyPath}`);
      return fail(
        'RAW_STUDY_NOT_FOUND',
        'Raw study file not found.',
        { status: 404 },
        {
          details: 'Please upload a study to: source-files/study-inputs/raw-study-copy.md',
          path: rawStudyPath,
        }
      );
    }

    // Check for brief (optional but recommended)
    const hasBrief = existsSync(briefPath);
    let briefContent = null;
    if (hasBrief) {
      try {
        briefContent = readFileSync(briefPath, 'utf-8');
      } catch (e) {
        console.warn(`[Extract] Could not read brief file: ${e}`);
      }
    }

    // =====================================================================
    // STEP 4: Read raw study content
    // =====================================================================
    console.log(`[Extract] Reading raw study from: ${rawStudyPath}`);
    const rawContent = readFileSync(rawStudyPath, 'utf-8');
    
    // Validate content is not empty
    if (!rawContent || rawContent.trim().length < 100) {
      return fail('STUDY_CONTENT_TOO_SHORT', 'Raw study must contain at least 100 characters of meaningful content.', { status: 400 });
    }

    // Check for placeholder text
    const placeholderPatterns = [
      '[INSERT',
      '[TO BE ADDED]',
      '[PLACEHOLDER]',
      '{{INSERT',
      'TBD',
      'To be determined'
    ];
    
    const hasPlaceholder = placeholderPatterns.some(pattern => 
      rawContent.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (hasPlaceholder) {
      console.warn(`[Extract] Content contains placeholder text`);
    }

    // =====================================================================
    // STEP 5: Extract data from content
    // =====================================================================
    console.log(`[Extract] Parsing study content (${rawContent.length} characters)`);
    const extracted = extractRealData(rawContent, briefContent);

    // =====================================================================
    // STEP 6: Write insights file
    // =====================================================================
    console.log(`[Extract] Writing insights to: ${insightsPath}`);
    writeFileSync(insightsPath, extracted, 'utf-8');

    const extractionPayload = {
      campaignId: id,
      stage: 2,
      status: 'completed',
      extractedAt: new Date().toISOString(),
      metadata: {
        sourcePath: rawStudyPath,
        contentLength: rawContent.length,
        hasBrief,
      },
      summary: {
        extractedInsightsFile: '02-insights.md',
        extractedWordCount: extracted.split(/\s+/).filter(Boolean).length,
      },
    };
    writeFileSync(rawExtractedPath, JSON.stringify(extractionPayload, null, 2), 'utf-8');

    let nextStageState: any = { currentStage: 2, status: 'running', lastExecutedStage: 2, updatedAt: new Date().toISOString() };
    try {
      if (existsSync(stageStatePath)) {
        const existing = JSON.parse(readFileSync(stageStatePath, 'utf-8'));
        nextStageState = {
          ...existing,
          currentStage: Math.max(2, Number(existing.currentStage || 1)),
          status: 'running',
          lastExecutedStage: 2,
          updatedAt: new Date().toISOString(),
        };
      }
    } catch {
      // ignore invalid stage-state and overwrite with sane default
    }
    writeFileSync(stageStatePath, JSON.stringify(nextStageState, null, 2), 'utf-8');

    // =====================================================================
    // STEP 7: Return success
    // =====================================================================
    console.log(`[Extract] Extraction completed successfully`);
    
    return ok({ 
      success: true, 
      message: 'Study extraction completed',
      extracted: extracted,
      metadata: {
        campaignId: id,
        sourcePath: rawStudyPath,
        outputPath: insightsPath,
        rawExtractedPath,
        contentLength: rawContent.length,
        hasBrief: hasBrief,
        extractedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[Extract] Extraction failed:', error);
    return fail('EXTRACTION_FAILED', 'Extraction failed.', { status: 500 }, String(error));
  }
}

/**
 * GET /api/campaigns/[id]/extract
 * 
 * Check extraction status without re-running
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  
  try {
    const pitchJobDir = resolveCampaignPath(id);
    const rawStudyPath = join(pitchJobDir, 'source-files', 'study-inputs', 'raw-study-copy.md');
    const insightsPath = join(pitchJobDir, '02-insights.md');
    
    const sourceExists = existsSync(rawStudyPath);
    const insightsExists = existsSync(insightsPath);
    
    let insightsContent = null;
    if (insightsExists) {
      insightsContent = readFileSync(insightsPath, 'utf-8');
    }
    
    return ok({
      status: {
        sourceFile: sourceExists ? 'exists' : 'missing',
        insightsFile: insightsExists ? 'exists' : 'missing'
      },
      lastExtracted: insightsExists ? new Date().toISOString() : null,
      preview: insightsExists ? insightsContent?.substring(0, 500) : null
    });
    
  } catch (error) {
    return fail('STATUS_CHECK_FAILED', 'Status check failed.', { status: 500 }, String(error));
  }
}

/**
 * Main extraction function - parses raw study content into structured insights
 * 
 * This function performs regex-based extraction to find:
 * - Statistics (numbers, percentages)
 * - Key findings (sentences with relevant keywords)
 * - Geographic references (states, counties, cities)
 * - Time periods (months, years)
 * - Contributing factors (causes, risk factors)
 * 
 * @param {string} content - Raw study content
 * @param {string | null} briefContent - Optional brief content for context
 * @returns {string} Formatted markdown insights
 */
function extractRealData(content: string, _briefContent: string | null): string {
  // =========================================================================
  // Basic content analysis
  // =========================================================================
  const lines = content.split('\n').filter(l => l.trim());
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const charCount = content.length;
  
  // =========================================================================
  // Extract numbers and percentages
  // =========================================================================
  // Match percentages (e.g., 17.9%, 10.1%)
  const percentages = content.match(/\d+(\.\d+)?%/g) || [];
  
  // =========================================================================
  // Identify key statistics
  // =========================================================================
  const stats: string[] = [];
  
  // Find large numbers (4+ digits) - likely totals
  const bigNumbers = content.match(/(\d{1,3}(,\d{3})+|\d{4,})/g) || [];
  
  if (bigNumbers.length > 0) {
    // First big number is usually the main total
    stats.push(`* **Total:** ${bigNumbers[0]} (key metric from source)`);
    if (bigNumbers[1]) {
      stats.push(`* **Secondary:** ${bigNumbers[1]}`);
    }
  }
  
  // Add found percentages
  if (percentages.length > 0) {
    stats.push(`* **Percentages found:** ${percentages.slice(0, 5).join(', ')}`);
  }
  
  // =========================================================================
  // Extract key findings
  // =========================================================================
  const findings: string[] = [];
  
  // Split content into sentences
  const sentences = content.split(/[.!?]\s+/);
  
  // Filter for meaningful sentences containing relevant keywords
  const keywordPatterns = [
    'fatalit',   // fatalities
    'death',     // deaths
    'pedestrian', // pedestrian-specific
    'percent',   // percentage findings
    'highest',   // superlatives
    'lowest',
    'deadliest',
    'increase',   // trends
    'decrease',
    'risk',      // risk factors
    'most',      // rankings
    'leading',
    'record'     // records
  ];
  
  const importantSentences = sentences.filter(s => {
    const lower = s.toLowerCase();
    const hasKeyword = keywordPatterns.some(pattern => lower.includes(pattern));
    const hasLength = s.length > 40 && s.length < 300;
    const hasNumber = /\d+/.test(s);
    return hasKeyword && hasLength && hasNumber;
  });
  
  // Take top findings
  importantSentences.slice(0, 10).forEach((s, idx) => {
    findings.push(`* ${idx + 1}. ${s.trim().substring(0, 200)}`);
  });
  
  // =========================================================================
  // Extract geographic references
  // =========================================================================
  const locations: string[] = [];
  
  // Match US states
  const statePatterns = [
    'California', 'Texas', 'Florida', 'New Mexico', 'Arizona', 
    'South Carolina', 'Washington', 'Nevada', 'Georgia', 'Louisiana',
    'Alabama', 'Mississippi', 'Oklahoma', 'Arkansas', 'Tennessee',
    'North Carolina', 'Virginia', 'Maryland', 'Delaware', 'Pennsylvania',
    'New York', 'New Jersey', 'Connecticut', 'Massachusetts', 'Illinois',
    'Ohio', 'Michigan', 'Wisconsin', 'Minnesota', 'Colorado', 'Oregon'
  ];
  
  const foundStates = statePatterns.filter(state => 
    content.toLowerCase().includes(state.toLowerCase())
  );
  
  foundStates.slice(0, 8).forEach(state => {
    locations.push(`* ${state}`);
  });
  
  // Match counties/cities
  const localPatterns = [
    'King County', 'Los Angeles', 'Miami-Dade', 'Harris County', 
    'Seattle', 'Phoenix', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'
  ];
  
  const foundLocal = localPatterns.filter(loc => 
    content.toLowerCase().includes(loc.toLowerCase())
  );
  
  if (foundLocal.length > 0) {
    locations.push(...foundLocal.map(loc => `* ${loc}`));
  }
  
  // =========================================================================
  // Extract time periods
  // =========================================================================
  const timeframes: string[] = [];
  
  // Match months with years
  const monthYearPattern = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/gi;
  const monthYears = content.match(monthYearPattern) || [];
  [...new Set(monthYears)].slice(0, 6).forEach(m => {
    timeframes.push(`* ${m}`);
  });
  
  // Match years alone
  const yearPattern = /\b(20\d{2}|201\d|200\d)\b/g;
  const years = content.match(yearPattern) || [];
  const uniqueYears = [...new Set(years)].slice(0, 4);
  if (uniqueYears.length > 0) {
    timeframes.push(`* Years: ${uniqueYears.join(', ')}`);
  }
  
  // =========================================================================
  // Extract contributing factors
  // =========================================================================
  const causes: string[] = [];
  
  const factorKeywords = [
    { keyword: 'alcohol', label: 'Alcohol impairment' },
    { keyword: 'darkness', label: 'Low visibility/darkness' },
    { keyword: 'weather', label: 'Weather conditions' },
    { keyword: 'holiday', label: 'Holiday travel/traffic' },
    { keyword: 'distract', label: 'Distracted driving/walking' },
    { keyword: 'speed', label: 'Excessive speed' },
    { keyword: 'visibility', label: 'Poor visibility' },
    { keyword: 'intersection', label: 'Intersection hazards' },
    { keyword: 'crosswalk', label: 'Crosswalk safety' },
    { keyword: 'lighting', label: 'Inadequate lighting' }
  ];
  
  factorKeywords.forEach(({ keyword, label }) => {
    if (content.toLowerCase().includes(keyword)) {
      causes.push(`* ${label}`);
    }
  });
  
  // =========================================================================
  // Extract methodology clues
  // =========================================================================
  const methodology: string[] = [];
  
  const methodPatterns = [
    { pattern: 'nhtsa', label: 'NHTSA data' },
    { pattern: 'fars', label: 'Fatality Analysis Reporting System' },
    { pattern: 'cdc', label: 'CDC data' },
    { pattern: 'survey', label: 'Survey-based' },
    { pattern: 'sample', label: 'Sample size mentioned' },
    { pattern: 'respondent', label: 'Respondent data' },
    { pattern: 'timeframe', label: 'Defined timeframe' },
    { pattern: 'geography', label: 'Geographic scope defined' }
  ];
  
  methodPatterns.forEach(({ pattern, label }) => {
    if (content.toLowerCase().includes(pattern)) {
      methodology.push(`* ${label}`);
    }
  });
  
  // =========================================================================
  // Build insights output
  // =========================================================================
  const timestamp = new Date().toISOString();
  
  const insights = [
    '# Extracted Study Insights',
    '',
    '## Metadata',
    `* **Extracted:** ${timestamp}`,
    `* **Content length:** ${charCount.toLocaleString()} characters`,
    `* **Word count:** ${wordCount.toLocaleString()} words`,
    `* **Paragraphs:** ${lines.length}`,
    '',
    '---',
    '',
    '## Study Overview',
    `**Total content:** ${wordCount} words across ${lines.length} sections`,
    '',
    '---',
    '',
    '## Key Statistics',
    '',
    ...(stats.length > 0 ? stats : ['* No clear statistics identified']),
    '',
    '---',
    '',
    '## Top Findings',
    '',
    ...(findings.length > 0 ? findings : ['* No specific findings extracted']),
    '',
    '---',
    '',
    '## Geographic Focus',
    '',
    ...(locations.length > 0 ? locations : ['* No specific locations identified']),
    '',
    '---',
    '',
    '## Time Periods',
    '',
    ...(timeframes.length > 0 ? timeframes : ['* No specific time periods identified']),
    '',
    '---',
    '',
    '## Contributing Factors',
    '',
    ...(causes.length > 0 ? causes : ['* No specific factors identified']),
    '',
    '---',
    '',
    '## Methodology Signals',
    '',
    ...(methodology.length > 0 ? methodology : ['* No explicit methodology detected']),
    '',
    '---',
    '',
    '## Data Points Summary',
    '',
    `* Statistics found: ${stats.length}`,
    `* Findings identified: ${findings.length}`,
    `* Locations mentioned: ${locations.length}`,
    `* Time periods: ${timeframes.length}`,
    `* Factors identified: ${causes.length}`,
    '',
    '---',
    '',
    '_Generated by Data Extractor Agent (Stage 2)_',
    `_Timestamp: ${timestamp}_`
  ];
  
  return insights.join('\n');
}
