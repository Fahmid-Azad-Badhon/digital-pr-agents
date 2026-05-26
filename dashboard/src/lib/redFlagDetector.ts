export interface RedFlag {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  location?: string;
  suggestion?: string;
}

export interface RedFlagResult {
  passed: boolean;
  flags: RedFlag[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}

const RED_FLAGS = {
  unsupportedStatistics: {
    pattern: /\d+%|\d+\.\d+%|\d+ in \d+|one in \d+/gi,
    severity: 'critical' as const,
    message: 'Unsupported statistic detected - must have source',
    suggestion: 'Add source citation or remove statistic'
  },
  noSourceMention: {
    pattern: /(?:according to|from|per|via|via the|as per|as reported by)/i,
    severity: 'warning' as const,
    message: 'Source attribution missing',
    suggestion: 'Add source attribution (e.g., "according to CDC...")'
  },
  overhypedLanguage: {
    pattern: /revolutionary|game-changing|breakthrough|unprecedented|amazing|incredible|phenomenal|world-class|best-in-class|industry-leading|first-ever/gi,
    severity: 'warning' as const,
    message: 'Overhyped promotional language detected',
    suggestion: 'Use professional, factual language'
  },
  tooMuchPromotion: {
    pattern: /(?:our|we|our client|our brand)(?:\s+(?:are|is|have|offer|provide|deliver))/gi,
    severity: 'warning' as const,
    message: 'Excessive promotional content',
    suggestion: 'Focus on news angle, not product promotion'
  },
  fakeUrgency: {
    pattern: /limited time|act now|don'?t miss|only|urgent|immediate action|deadline is (?:today|now|coming)/gi,
    severity: 'warning' as const,
    message: 'Artificial urgency detected',
    suggestion: 'Remove false urgency tactics'
  },
  weakJournalistFit: {
    pattern: /(?:I am|we are|I'd like to|we'd like to) (?:reach out|contact|send you|share)/gi,
    severity: 'info' as const,
    message: 'Generic outreach without journalist relevance',
    suggestion: 'Personalize to journalist beat and recent coverage'
  },
  missingLocalAngle: {
    pattern: /national|across the country|nationwide/gi,
    severity: 'info' as const,
    message: 'Missing local angle for regional targeting',
    suggestion: 'Consider localizing for target market'
  },
  missingCTA: {
    pattern: /call me|email me|contact me|reach out/gi,
    severity: 'warning' as const,
    message: 'Weak or missing call-to-action',
    suggestion: 'Include clear, specific CTA'
  },
  tooLongPitch: {
    threshold: 800,
    severity: 'info' as const,
    message: 'Pitch exceeds recommended length',
    suggestion: 'Keep pitch under 800 words for better response rate'
  },
  noClearNewsHook: {
    pattern: /^(?:dear|hi|hello|thanks|thank you)/gi,
    severity: 'warning' as const,
    message: 'No clear news hook in opening',
    suggestion: 'Lead with news angle in first sentence'
  }
};

export function scanForRedFlags(content: string, context?: { stageId?: string; campaignId?: string }): RedFlagResult {
  const flags: RedFlag[] = [];
  
  if (!content || content.length < 10) {
    return {
      passed: true,
      flags: [],
      criticalCount: 0,
      warningCount: 0,
      infoCount: 0
    };
  }
  
  const contentLower = content.toLowerCase();
  
  for (const [flagType, rule] of Object.entries(RED_FLAGS)) {
    if ('pattern' in rule) {
      const matches = content.matchAll(rule.pattern);
      let matchCount = 0;
      
      for (const match of matches) {
        if (matchCount >= 3) break;
        
        flags.push({
          type: flagType,
          severity: rule.severity,
          message: rule.message,
          location: match.input?.substring(Math.max(0, match.index - 20), match.index + 50),
          suggestion: rule.suggestion
        });
        matchCount++;
      }
    }
    
    if (flagType === 'tooLongPitch' && 'threshold' in rule && content.length > (rule as { threshold: number }).threshold) {
      flags.push({
        type: flagType,
        severity: rule.severity,
        message: `Pitch is ${content.length} words - exceeds ${rule.threshold} recommended`,
        suggestion: rule.suggestion
      });
    }
  }
  
  const criticalCount = flags.filter(f => f.severity === 'critical').length;
  const warningCount = flags.filter(f => f.severity === 'warning').length;
  const infoCount = flags.filter(f => f.severity === 'info').length;
  
  return {
    passed: criticalCount === 0,
    flags,
    criticalCount,
    warningCount,
    infoCount
  };
}

export function formatRedFlagReport(result: RedFlagResult): string {
  const lines: string[] = [];
  
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('                    RED FLAG SCAN REPORT');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');
  
  if (result.passed) {
    lines.push('✅ NO CRITICAL FLAGS DETECTED');
  } else {
    lines.push('❌ CRITICAL FLAGS FOUND - Review before proceeding');
  }
  lines.push('');
  lines.push(`Critical: ${result.criticalCount} | Warnings: ${result.warningCount} | Info: ${result.infoCount}`);
  lines.push('');
  
  if (result.flags.length > 0) {
    lines.push('─── Issues Found ───');
    
    for (const flag of result.flags) {
      const icon = flag.severity === 'critical' ? '❌' : flag.severity === 'warning' ? '⚠️' : 'ℹ️';
      lines.push(`${icon} [${flag.severity.toUpperCase()}] ${flag.type}: ${flag.message}`);
      if (flag.suggestion) {
        lines.push(`   → Fix: ${flag.suggestion}`);
      }
    }
    lines.push('');
  }
  
  return lines.join('\n');
}