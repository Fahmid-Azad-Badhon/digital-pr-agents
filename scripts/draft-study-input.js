import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PITCH_JOBS_DIR = path.join(ROOT, 'pitch-jobs');
const MIN_RAW_COPY_LENGTH = 120;

function usage() {
  console.error('Usage: draft-study-input.cmd <job-name> [--force] [--max-findings 5]');
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token.startsWith('--')) {
      const [key, inlineValue] = token.slice(2).split('=');
      if (inlineValue !== undefined) {
        args[key] = inlineValue;
      } else {
        const next = argv[index + 1];
        if (next && !next.startsWith('--')) {
          args[key] = next;
          index += 1;
        } else {
          args[key] = true;
        }
      }
    } else {
      args._.push(token);
    }
  }
  return args;
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function isValidJobName(value) {
  return Boolean(value) && !value.includes('..') && !value.includes('/') && !value.includes('\\');
}

function normalizeText(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

function isMeaningfulMarkdown(content) {
  const trimmed = String(content || '').trim();
  const placeholderOnly = /^\[[^\]\n]{1,160}\]$/.test(trimmed);
  return Boolean(trimmed)
    && !placeholderOnly
    && !/\|\s{2}\|/.test(trimmed)
    && !/^\-\s*$/m.test(trimmed);
}

async function ensureMeaningfulFile(filePath, label) {
  if (!await pathExists(filePath)) {
    throw new Error(`${label} is missing: ${filePath}`);
  }

  const content = await fs.readFile(filePath, 'utf8');
  if (!isMeaningfulMarkdown(content)) {
    throw new Error(`${label} is empty or still contains placeholder content: ${filePath}`);
  }

  return content;
}

function extractSection(markdown, heading) {
  const pattern = new RegExp(`##\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, 'i');
  const match = markdown.match(pattern);
  return match ? match[1].trim() : '';
}

function parseBullets(sectionText) {
  return sectionText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('-'))
    .map((line) => normalizeText(line.replace(/^-+\s*/, '')));
}

function parseBrief(markdown) {
  const fields = [
    'Campaign Goal',
    'Brand / Client',
    'Study or Data Source',
    'Audience',
    'Geography',
    'Desired Publications or Beat Types',
    'Must-Use Findings',
    'Hard Constraints',
    'Notes'
  ];

  const parsed = {};
  for (const field of fields) {
    parsed[field] = parseBullets(extractSection(markdown, field));
  }

  return {
    campaignGoal: parsed['Campaign Goal'][0] || 'Campaign goal not specified in detail.',
    brandClient: parsed['Brand / Client'][0] || 'Brand/client not specified.',
    studySource: parsed['Study or Data Source'][0] || 'Study source not specified in brief.',
    audience: parsed['Audience'][0] || 'Audience not specified.',
    geography: parsed['Geography'][0] || 'Geography not specified.',
    desiredBeats: parsed['Desired Publications or Beat Types'][0] || 'Desired beats not specified.',
    mustUseFindings: parsed['Must-Use Findings'].filter(Boolean),
    hardConstraints: parsed['Hard Constraints'].filter(Boolean),
    notes: parsed['Notes'].filter(Boolean)
  };
}

function parseSourceMetadata(sectionText) {
  const metadata = {};
  for (const line of sectionText.split(/\r?\n/)) {
    const match = line.trim().match(/^-\s*([^:]+):\s*(.*)$/);
    if (!match) {
      continue;
    }

    metadata[match[1].toLowerCase()] = normalizeText(match[2]);
  }

  return {
    name: metadata.name || '',
    url: metadata.url || '',
    date: metadata.date || ''
  };
}

function extractRawStudy(markdown) {
  const sourceInfo = parseSourceMetadata(extractSection(markdown, 'Source'));
  const rawSection = extractSection(markdown, 'Raw Paste');
  const rawBody = normalizeText(rawSection || markdown.replace(/^#.*$/m, ''));

  if (rawBody.length < MIN_RAW_COPY_LENGTH) {
    throw new Error(
      'raw-study-copy.md does not contain enough pasted source text yet. Add the actual study copy under "## Raw Paste" first.'
    );
  }

  return { sourceInfo, rawBody };
}

function splitIntoSentences(text) {
  return text
    .replace(/\r\n/g, '\n')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => normalizeText(sentence))
    .filter((sentence) => sentence.length >= 35);
}

function uniqueByNormalized(values) {
  const seen = new Set();
  const results = [];
  for (const value of values) {
    const key = normalizeText(value).toLowerCase();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    results.push(normalizeText(value));
  }
  return results;
}

function detectSourceType(rawBody) {
  const lower = rawBody.toLowerCase();
  if (/(survey|respondents|participants|poll)/.test(lower)) {
    return 'survey or poll-style study';
  }
  if (/(dataset|database|records|transactions|rows)/.test(lower)) {
    return 'dataset or records analysis';
  }
  if (/(report|whitepaper|analysis|study)/.test(lower)) {
    return 'report or study summary';
  }
  return 'source copy requiring manual classification';
}

function extractMethodology(sentences, rawBody) {
  const methodologyKeywords = [
    /respondents|participants|survey|poll|sample|n=/i,
    /methodology|fieldwork|margin of error|weighted|representative/i,
    /dataset|records|analysis|reviewed|tracked|compiled/i,
    /between|from .* to|during|in \d{4}|over the past/i,
    /states|cities|countries|markets|companies|industries/i
  ];

  const matches = [];
  for (const sentence of sentences) {
    if (methodologyKeywords.some((pattern) => pattern.test(sentence))) {
      matches.push(sentence);
    }
  }

  const unique = uniqueByNormalized(matches).slice(0, 4);
  if (unique.length) {
    return unique;
  }

  return [
    `The pasted source appears to be a ${detectSourceType(rawBody)}.`,
    'The copy does not clearly state full methodology details, so sample size, timeframe, and collection method still need manual verification.'
  ];
}

function extractCaveats(sentences, rawBody, brief) {
  const caveats = [];
  if (/(fixture|not for public use|not a real official dataset|audit fixture)/i.test(rawBody)) {
    caveats.push('Source is labeled as a fixture or non-public audit input; do not present it as real public data.');
  }
  if (/(conflict|contradict|mismatch|duplicate|unresolved)/i.test(rawBody)) {
    caveats.push('Source contains conflicting or duplicate values; affected claims require verification before outreach.');
  }
  if (/(missing|unavailable|incomplete)/i.test(rawBody)) {
    caveats.push('Source contains missing or incomplete fields; do not fill gaps with assumptions.');
  }
  if (/(proxy|index)/i.test(rawBody)) {
    caveats.push('Some values are proxies or indexes, not direct measurements; explain limits before using them in a pitch.');
  }
  if (!/(respondents|participants|sample|n=|margin of error|methodology|survey)/i.test(rawBody)) {
    caveats.push('Methodology is not fully stated in the pasted copy, so sample size and collection details should be checked before outreach.');
  }
  if (!/(202\d|january|february|march|april|may|june|july|august|september|october|november|december|q[1-4])/i.test(rawBody)) {
    caveats.push('Timeframe is not explicit in the pasted source copy, so the why-now framing may need a manual refresh.');
  }
  if (brief.hardConstraints.length) {
    caveats.push(`Hard constraints noted in the brief: ${brief.hardConstraints.join('; ')}`);
  }
  if (!caveats.length) {
    caveats.push('Use the original source to verify exact methodology wording before external use.');
  }
  return caveats.slice(0, 8);
}

function hasClaimRisk(sentence) {
  return /(conflict|contradict|mismatch|duplicate|unresolved|missing|unavailable|incomplete|fixture|not for public use|not a real official dataset|proxy|index|listed as .* and .* table|listed as .* and .* source|two .* values|potential weak claim|no percentage|no ranking|no dates|no source url|no journalist coverage|no local data|no expert quote|does not include a dataset|without evidence)/i.test(sentence);
}

function hasUnsupportedWeakness(sentence) {
  return /(potential weak claim|no percentage|no ranking|no dates|no source url|no journalist coverage|no local data|no expert quote|does not include a dataset|without evidence)/i.test(sentence);
}

function scoreFinding(sentence) {
  let score = 1;
  if (/\d/.test(sentence)) score += 2;
  if (/%/.test(sentence)) score += 1;
  if (/(highest|lowest|top|bottom|more likely|less likely|increase|decrease|grew|fell|compared|versus|vs\.?|ranked|average)/i.test(sentence)) score += 2;
  if (/(state|city|country|region|industry|age|gender|consumers|workers|brands|companies)/i.test(sentence)) score += 1;
  if (sentence.length >= 70 && sentence.length <= 190) score += 1;
  if (hasClaimRisk(sentence)) score -= 3;
  if (hasUnsupportedWeakness(sentence)) score -= 2;
  return score;
}

function selectFindings(sentences, maxFindings) {
  const scored = sentences
    .map((sentence) => ({ sentence, score: scoreFinding(sentence) }))
    .sort((left, right) => right.score - left.score || left.sentence.length - right.sentence.length);

  const chosen = uniqueByNormalized(scored.map((entry) => entry.sentence)).slice(0, maxFindings);
  if (chosen.length) {
    return chosen;
  }

  return sentences.slice(0, maxFindings);
}

function inferWhyItMatters(sentence, brief) {
  if (/(highest|lowest|top|bottom|ranked|more likely|less likely|compared|versus|vs\.?)/i.test(sentence)) {
    return `Creates a clear contrast angle for ${brief.desiredBeats}.`;
  }
  if (/%|\d/.test(sentence)) {
    return `Provides a concrete data point that can anchor a pitch for ${brief.audience}.`;
  }
  if (/(state|city|country|region)/i.test(sentence)) {
    return `Supports a geography-led hook tied to ${brief.geography}.`;
  }
  return 'Useful as a supporting proof point, but should be paired with a stronger headline statistic.';
}

function inferFindingCaveat(sentence, caveats) {
  if (/(fixture|not for public use|not a real official dataset|audit fixture)/i.test(sentence)) {
    return 'Do not use externally as a factual claim; this is fixture or internal audit material.';
  }
  if (hasUnsupportedWeakness(sentence)) {
    return 'Do not use for outreach yet: claim lacks verified data, source, timeframe, or local evidence.';
  }
  if (/(conflict|contradict|mismatch|duplicate|unresolved)/i.test(sentence)) {
    return 'Verification required: source reports conflicting or duplicate values for this claim.';
  }
  if (/(listed as .* and .* table|listed as .* and .* source|two .* values)/i.test(sentence)) {
    return 'Verification required: source lists competing values for the same benchmark.';
  }
  if (/(missing|unavailable|incomplete)/i.test(sentence)) {
    return 'Information unavailable. Verification required before use.';
  }
  if (/(proxy|index)/i.test(sentence)) {
    return 'Use as directional context only; explain that this is a proxy or index, not a direct measurement.';
  }
  if (!/(respondents|participants|sample|survey|dataset|records)/i.test(sentence)) {
    return caveats[0] || 'Verify methodology details against the original source before use.';
  }
  return 'Keep the wording close to the source and avoid overstating causation.';
}

function escapeTableCell(value) {
  return normalizeText(value).replace(/\|/g, '/');
}

function buildStudyNotes({brief, sourceInfo, rawBody, sentences, methodology, caveats, findings}) {
  const wordCount = rawBody.split(/\s+/).filter(Boolean).length;
  const sourceSummary = [
    sourceInfo.name ? `Source name: ${sourceInfo.name}` : `Source name: ${brief.studySource}`,
    sourceInfo.url ? `Source URL: ${sourceInfo.url}` : 'Source URL: not included in the pasted copy',
    sourceInfo.date ? `Source date: ${sourceInfo.date}` : 'Source date: not included in the pasted copy',
    `Source type: ${detectSourceType(rawBody)}`,
    `Campaign goal context: ${brief.campaignGoal}`,
    `Raw copy size: ${wordCount} words from the pasted study source`
  ];

  const observations = findings.map((finding) => finding.sentence);
  if (brief.mustUseFindings.length) {
    observations.unshift(...brief.mustUseFindings.map((value) => `Brief priority: ${value}`));
  }

  return [
    '# Study Notes',
    '',
    '## Source Summary',
    ...sourceSummary.map((line) => `- ${line}`),
    '',
    '## Methodology',
    ...methodology.map((line) => `- ${line}`),
    '',
    '## Caveats',
    ...caveats.map((line) => `- ${line}`),
    '',
    '## Raw Observations',
    ...uniqueByNormalized(observations).slice(0, 6).map((line) => `- ${line}`)
  ].join('\n');
}

function buildInsights({brief, findings, caveats}) {
  const lines = [
    '# Insights',
    '',
    '| Rank | Finding | Evidence | Why It Matters | Novelty Score | Caveat |',
    '|------|---------|----------|----------------|---------------|--------|'
  ];

  findings.forEach((entry, index) => {
    const noveltyScore = hasClaimRisk(entry.sentence)
      ? Math.min(hasUnsupportedWeakness(entry.sentence) ? 3 : 7, Math.max(1, entry.score + 2))
      : Math.min(10, Math.max(5, entry.score + 3));
    lines.push(
      `| ${index + 1} | ${escapeTableCell(entry.sentence)} | ${escapeTableCell(entry.sentence)} | ${escapeTableCell(inferWhyItMatters(entry.sentence, brief))} | ${noveltyScore} | ${escapeTableCell(inferFindingCaveat(entry.sentence, caveats))} |`
    );
  });

  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    usage();
    return;
  }

  const jobName = args._[0];
  if (!isValidJobName(jobName)) {
    usage();
    throw new Error('Provide a valid pitch job name as the first argument.');
  }

  const maxFindings = Math.max(3, Number(args['max-findings'] || 5));
  const force = Boolean(args.force);
  const jobDir = path.resolve(PITCH_JOBS_DIR, jobName);

  if (!jobDir.startsWith(path.resolve(PITCH_JOBS_DIR))) {
    throw new Error(`Resolved pitch job path escapes pitch-jobs: ${jobDir}`);
  }
  if (!await pathExists(jobDir)) {
    throw new Error(`Pitch job does not exist: ${jobDir}`);
  }

  const briefPath = path.join(jobDir, '00-brief.md');
  const rawStudyPath = path.join(jobDir, 'source-files', 'study-inputs', 'raw-study-copy.md');
  const stage01Path = path.join(jobDir, '01-study-notes.md');
  const stage02Path = path.join(jobDir, '02-insights.md');

  const briefMarkdown = await ensureMeaningfulFile(briefPath, '00-brief.md');
  const rawStudyMarkdown = await ensureMeaningfulFile(rawStudyPath, 'raw-study-copy.md');

  if (!force && await pathExists(stage01Path)) {
    const current = await fs.readFile(stage01Path, 'utf8');
    if (isMeaningfulMarkdown(current)) {
      throw new Error('01-study-notes.md already contains non-placeholder content. Use --force to overwrite.');
    }
  }

  if (!force && await pathExists(stage02Path)) {
    const current = await fs.readFile(stage02Path, 'utf8');
    if (isMeaningfulMarkdown(current)) {
      throw new Error('02-insights.md already contains non-placeholder content. Use --force to overwrite.');
    }
  }

  const brief = parseBrief(briefMarkdown);
  const { sourceInfo, rawBody } = extractRawStudy(rawStudyMarkdown);
  const sentences = splitIntoSentences(rawBody);
  const methodology = extractMethodology(sentences, rawBody);
  const caveats = extractCaveats(sentences, rawBody, brief);
  const findings = selectFindings(sentences, maxFindings).map((sentence) => ({
    sentence,
    score: scoreFinding(sentence)
  }));

  if (!findings.length) {
    throw new Error('Could not extract any usable findings from raw-study-copy.md. Add more source copy first.');
  }

  const stage01 = buildStudyNotes({
    brief,
    sourceInfo,
    rawBody,
    sentences,
    methodology,
    caveats,
    findings
  });
  const stage02 = buildInsights({ brief, findings, caveats });

  await fs.writeFile(stage01Path, `${stage01}\n`, 'utf8');
  await fs.writeFile(stage02Path, `${stage02}\n`, 'utf8');

  console.log(`Drafted ${stage01Path}`);
  console.log(`Drafted ${stage02Path}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
