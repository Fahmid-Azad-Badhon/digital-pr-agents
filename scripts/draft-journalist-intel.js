import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PITCH_JOBS_DIR = path.join(ROOT, 'pitch-jobs');
const PLACEHOLDER_PATTERNS = [
  /\|\s{2}\|/,
  /\[Name\]/,
  /\[Selected angle\]/,
  /\[Beat query\]/,
  /\[Preferred geography\]/,
  /\[Preferred outlet tier or type\]/,
  /\[Journalist 1\]/,
  /\[Outlet\]/,
  /\[Primary beat\]/,
  /\[available or missing\]/,
  /\[Profile URL\]/,
  /\[1-10\]/,
  /\[Why prioritized\]/,
  /\[file path or export note\]/,
  /\[Journalist - reason email is missing\]/,
  /\[Journalist name\]/,
  /\[Beat\]/,
  /\[article title\]/,
  /\[article URL\]/,
  /\[why this coverage matters to the current angle\]/,
  /\[coverage-based personalization point\]/,
  /\[Hook\]/,
  /\[Why this matters now\]/,
  /\[Key data point 1\]/,
  /\[Key data point 2\]/,
  /\[Offer \/ asset \/ interview \/ data availability\]/,
  /\[Sender\]/,
  /\[Subject option 1\]/,
  /\[Subject option 2\]/,
  /\[Subject option 3\]/,
  /\[What changed in this pass\]/,
  /\[Final subject option 1\]/,
  /\[Selected angle summary\]/,
  /\[Supporting data point\]/,
  /\[Personalization hook\]/,
  /\[Optional follow-up note\]/,
  /^Title:$/m,
  /^URL:$/m,
  /^Topic fit:$/m,
  /^Takeaway:$/m,
  /^Email:$/m,
  /^Muck Rack Profile:$/m
];

function usage() {
  console.error('Usage: draft-journalist-intel.cmd <job-name> [--force] [--max-journalists 5] [--max-articles 10]');
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
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeName(value) {
  return normalizeText(value).toLowerCase();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isMeaningfulMarkdown(content) {
  const trimmed = String(content || '').trim();
  if (!trimmed) {
    return false;
  }

  return !PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed))
    && !/^\-\s*$/m.test(trimmed);
}

async function ensureMeaningfulFile(filePath, label) {
  if (!await pathExists(filePath)) {
    throw new Error(`${label} is missing: ${filePath}`);
  }

  const content = await fs.readFile(filePath, 'utf8');
  if (!isMeaningfulMarkdown(content)) {
    throw new Error(`${label} still contains placeholder or empty content: ${filePath}`);
  }

  return content;
}

function parseMarkdownTable(markdown) {
  const lines = markdown.split(/\r?\n/).map((line) => line.trim());
  const tableLines = [];
  let collecting = false;

  for (const line of lines) {
    if (line.startsWith('|') && line.endsWith('|')) {
      tableLines.push(line);
      collecting = true;
      continue;
    }

    if (collecting) {
      break;
    }
  }

  if (tableLines.length < 3) {
    return null;
  }

  const header = tableLines[0].split('|').slice(1, -1).map((cell) => normalizeText(cell));
  const rows = tableLines
    .slice(2)
    .map((line) => line.split('|').slice(1, -1).map((cell) => normalizeText(cell)))
    .filter((row) => row.some(Boolean));
  const firstRow = rows[0];
  return firstRow ? {header, row: firstRow, rows} : null;
}

function tableValue(parsed, names) {
  for (const name of names) {
    const target = normalizeText(name).toLowerCase();
    const index = parsed.header.findIndex((heading) => normalizeText(heading).toLowerCase() === target);
    if (index >= 0 && parsed.row[index]) {
      return parsed.row[index];
    }
  }
  return '';
}

function extractSection(markdown, heading) {
  const pattern = new RegExp(`(?:^|\\r?\\n)##\\s+${escapeRegExp(heading)}\\s*\\r?\\n([\\s\\S]*?)(?=\\r?\\n##\\s+|$)`, 'i');
  const match = markdown.match(pattern);
  return match ? match[1].trim() : '';
}

function parseLabeledBullets(sectionText) {
  const fields = {};
  for (const line of String(sectionText || '').split(/\r?\n/)) {
    const match = line.trim().match(/^-\s*([^:]+):\s*(.*)$/);
    if (!match) {
      continue;
    }
    fields[normalizeText(match[1]).toLowerCase()] = normalizeText(match[2]);
  }
  return fields;
}

function isPendingValue(value) {
  return !normalizeText(value) || /^(pending|awaiting|not selected|not yet selected|tbd|n\/a)$/i.test(normalizeText(value));
}

function isConfirmedStatus(value) {
  return /^confirmed$/i.test(normalizeText(value));
}

function requireSelectedAngleGate(beatsMarkdown) {
  const selectedSection = extractSection(beatsMarkdown, 'Selected Outreach Angle');
  if (!selectedSection) {
    throw new Error('05-beats.md is missing the Selected Outreach Angle gate. Stop after Stage 05 and have the user choose one angle before drafting journalist intelligence.');
  }

  const fields = parseLabeledBullets(selectedSection);
  const status = fields['selection status'] || fields.status || '';
  const selectedAngle = fields['selected angle / pitch angle'] || fields['selected angle'] || fields['selected pitch angle'] || '';
  const selectedBeat = fields['selected journalist beat'] || fields['selected beat'] || '';

  if (!isConfirmedStatus(status) || isPendingValue(selectedAngle) || isPendingValue(selectedBeat)) {
    throw new Error('05-beats.md is still awaiting user angle selection. Set "Selection status: confirmed" with exactly one selected outreach angle and beat before running draft-journalist-intel.');
  }

  return {
    selectedAngle,
    selectedBeat,
    selectedCategory: fields['selected category'] || '',
    selectedOutletScale: fields['selected outlet scale'] || '',
    selectedGeography: fields['selected geography'] || '',
    selectedCollectionLane: fields['selected collection lane'] || '',
    evidenceSupport: fields['evidence support to carry forward'] || '',
    searchStartPoint: fields['search start point'] || ''
  };
}

function rowMatchesSelection(row, selectedAngle) {
  const target = normalizeText(selectedAngle).toLowerCase();
  if (!target) {
    return false;
  }
  return row.some((cell) => {
    const value = normalizeText(cell).toLowerCase();
    return value && (value.includes(target) || target.includes(value));
  });
}

function extractAngleContext(markdown, selectedGate = null) {
  const parsed = parseMarkdownTable(markdown);
  if (!parsed) {
    return {
      selectedAngle: selectedGate?.selectedAngle || 'Not yet selected in 04-angles.md',
      bestBeat: selectedGate?.selectedBeat || 'Not yet selected in 04-angles.md',
      thesis: selectedGate?.selectedAngle || 'Not yet selected in 04-angles.md',
      selectedCategory: selectedGate?.selectedCategory || '',
      selectedOutletScale: selectedGate?.selectedOutletScale || '',
      selectedGeography: selectedGate?.selectedGeography || '',
      selectedCollectionLane: selectedGate?.selectedCollectionLane || '',
      evidenceSupport: selectedGate?.evidenceSupport || '',
      searchStartPoint: selectedGate?.searchStartPoint || ''
    };
  }

  const row = selectedGate
    ? (parsed.rows.find((candidate) => rowMatchesSelection(candidate, selectedGate.selectedAngle)) || parsed.row)
    : parsed.row;
  const angleName = tableValue({header: parsed.header, row}, ['Angle Name', 'Pitch Angle', 'Core Thesis']) || selectedGate?.selectedAngle || row[1];
  const coreThesis = selectedGate?.selectedAngle || tableValue({header: parsed.header, row}, ['Core Thesis', 'Pitch Angle', 'Angle Name']) || row[2];
  const bestBeat = selectedGate?.selectedBeat || tableValue({header: parsed.header, row}, ['Best Beat', 'Journalist Beats']) || row[3];
  return {
    selectedAngle: selectedGate?.selectedAngle || angleName || coreThesis || 'Not yet selected in 04-angles.md',
    bestBeat: bestBeat || 'Not yet selected in 04-angles.md',
    thesis: coreThesis || angleName || 'Not yet selected in 04-angles.md',
    selectedCategory: selectedGate?.selectedCategory || '',
    selectedOutletScale: selectedGate?.selectedOutletScale || '',
    selectedGeography: selectedGate?.selectedGeography || '',
    selectedCollectionLane: selectedGate?.selectedCollectionLane || '',
    evidenceSupport: selectedGate?.evidenceSupport || '',
    searchStartPoint: selectedGate?.searchStartPoint || ''
  };
}

function extractBeatContext(markdown, selectedGate = null) {
  const parsed = parseMarkdownTable(markdown);
  if (!parsed) {
    return {
      beatType: selectedGate?.selectedBeat || 'Not yet selected in 05-beats.md',
      outletType: selectedGate?.selectedOutletScale || 'Not yet selected in 05-beats.md',
      personalizationNote: selectedGate?.searchStartPoint || 'Not yet selected in 05-beats.md'
    };
  }

  const [angle, beatType, outletType, journalistProfile, personalizationNote] = parsed.row;
  return {
    beatType: selectedGate?.selectedBeat || beatType || 'Not yet selected in 05-beats.md',
    outletType: selectedGate?.selectedOutletScale || outletType || 'Not yet selected in 05-beats.md',
    personalizationNote: selectedGate?.searchStartPoint || personalizationNote || journalistProfile || 'Not yet selected in 05-beats.md'
  };
}

async function listFiles(directoryPath, extension) {
  if (!await pathExists(directoryPath)) {
    return [];
  }

  const entries = await fs.readdir(directoryPath, {withFileTypes: true});
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(extension))
    .map((entry) => path.join(directoryPath, entry.name))
    .sort();
}

async function readJsonFiles(directoryPath) {
  const files = await listFiles(directoryPath, '.json');
  const loaded = [];

  for (const filePath of files) {
    try {
      const raw = (await fs.readFile(filePath, 'utf8')).replace(/^\uFEFF/, '');
      loaded.push({
        filePath,
        data: JSON.parse(raw)
      });
    } catch (_) {
      // skip malformed files
    }
  }

  return loaded;
}

function unique(values) {
  return [...new Set((values || []).map(normalizeText).filter(Boolean))];
}

function clampScore(value) {
  return Math.max(1, Math.min(10, Math.round(value)));
}

function relativeToRoot(targetPath) {
  return path.relative(ROOT, targetPath).replace(/\\/g, '/');
}

function firstMeaningfulText(...values) {
  for (const value of values) {
    const text = normalizeText(value);
    if (text) {
      return text;
    }
  }
  return '';
}

function mergeJournalistData(profileFiles, articleFiles) {
  const map = new Map();

  function getEntry(name, fallbackKey) {
    const key = normalizeName(name) || fallbackKey;
    if (!map.has(key)) {
      map.set(key, {
        name: normalizeText(name) || 'Unknown Journalist',
        outlet: '',
        emails: [],
        beats: [],
        profileUrl: '',
        summary: '',
        articles: [],
        sourceFiles: []
      });
    }
    return map.get(key);
  }

  for (const file of profileFiles) {
    const data = file.data || {};
    const entry = getEntry(data.name, `profile:${path.basename(file.filePath)}`);
    entry.name = normalizeText(data.name) || entry.name;
    entry.outlet = normalizeText(data.outlet) || entry.outlet;
    entry.profileUrl = normalizeText(data.pageUrl) || entry.profileUrl;
    entry.summary = normalizeText(data.summary) || entry.summary;
    entry.emails = unique([...entry.emails, ...(data.emails || [])]);
    entry.beats = unique([...entry.beats, ...(data.beats || [])]);
    entry.sourceFiles.push(relativeToRoot(file.filePath));

    const embeddedArticles = Array.isArray(data.recentCoverage) ? data.recentCoverage : [];
    for (const article of embeddedArticles) {
      const title = normalizeText(article.title);
      const url = normalizeText(article.url);
      if (!title || !url) {
        continue;
      }
      entry.articles.push({
        title,
        url,
        meta: normalizeText(article.meta),
        text: normalizeText(article.text),
        source: relativeToRoot(file.filePath)
      });
    }
  }

  for (const file of articleFiles) {
    const data = file.data || {};
    const entry = getEntry(data.journalistName, `article:${path.basename(file.filePath)}`);
    entry.name = normalizeText(data.journalistName) || entry.name;
    entry.outlet = normalizeText(data.outlet) || entry.outlet;
    entry.sourceFiles.push(relativeToRoot(file.filePath));

    for (const article of Array.isArray(data.articles) ? data.articles : []) {
      const title = normalizeText(article.title);
      const url = normalizeText(article.url);
      if (!title || !url) {
        continue;
      }
      entry.articles.push({
        title,
        url,
        meta: normalizeText(article.meta),
        text: normalizeText(article.text),
        source: relativeToRoot(file.filePath)
      });
    }
  }

  return [...map.values()].map((entry) => {
    const seen = new Set();
    entry.articles = entry.articles.filter((article) => {
      const key = `${article.title}::${article.url}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    entry.sourceFiles = unique(entry.sourceFiles);
    return entry;
  });
}

function scoreJournalist(entry) {
  let score = 3;
  if (entry.emails.length) score += 2;
  if (entry.beats.length) score += 1;
  score += Math.min(entry.articles.length, 4);
  if (entry.profileUrl) score += 1;
  return clampScore(score);
}

function buildJournalistNote(entry, beatContext) {
  const noteParts = [];
  if (entry.articles.length) {
    noteParts.push(`${entry.articles.length} recent coverage item(s) imported`);
    noteParts.push(`latest usable title: "${entry.articles[0].title}"`);
  }
  if (entry.summary) {
    noteParts.push(entry.summary.slice(0, 140));
  }
  if (!noteParts.length) {
    noteParts.push(`Imported profile data aligned to the target beat "${beatContext.beatType}" and outlet type "${beatContext.outletType}"`);
  }
  return noteParts.join('; ');
}

function buildTopicFit(article, item, angleContext, beatContext) {
  const reference = firstMeaningfulText(article.meta, article.text, article.title);
  return `This coverage shows ${item.name} already writing on "${reference}", which overlaps with the selected angle "${angleContext.selectedAngle}" and beat "${item.beats[0] || beatContext.beatType}".`;
}

function buildCoverageTakeaway(article, item, beatContext) {
  return `Reference "${article.title}" to show the pitch extends ${item.name}'s recent ${item.beats[0] || beatContext.beatType} reporting instead of introducing an unrelated topic.`;
}

function buildPersonalizationHook(article, item, beatContext) {
  return `Mention "${article.title}" as a recent example of ${item.name}'s interest in ${item.beats[0] || beatContext.beatType}.`;
}

function buildJournalistIntelMarkdown({angleContext, beatContext, searchQueries, searchSourceFiles, journalists, maxJournalists}) {
  const selected = journalists.slice(0, maxJournalists);
  const directEmailTargets = selected.filter((item) => item.emails.length);
  const missingEmailTargets = selected.filter((item) => !item.emails.length);
  const tierOne = selected.filter((item) => scoreJournalist(item) >= 8);
  const tierTwo = selected.filter((item) => scoreJournalist(item) >= 5 && scoreJournalist(item) < 8);
  const tierThree = selected.filter((item) => scoreJournalist(item) < 5);
  const lines = [
    '# Journalist Intelligence',
    '',
    '## Stage Purpose',
    'This file is the Stage 06 journalist targeting package for the confirmed selected angle. It records target fit, contact status, source traceability, and the handoff logic needed before Stage 07 coverage review and Stage 08 pitch drafting.',
    '',
    '## Read Before Writing',
    '- This file must remain locked to the confirmed selected angle from `05-beats.md`.',
    '- Do not treat raw collection volume as outreach readiness.',
    '- Every included journalist needs a defensible fit reason, honest contact status, and a clear next action.',
    '',
    '## Selected Outreach Angle',
    '- Selection status from `05-beats.md`: confirmed',
    `- Angle: ${angleContext.selectedAngle}`,
    `- Beat: ${angleContext.bestBeat || beatContext.beatType}`,
    `- Category: ${angleContext.selectedCategory || 'Not captured'}`,
    `- Outlet scale: ${angleContext.selectedOutletScale || beatContext.outletType || 'Not captured'}`,
    `- Geography: ${angleContext.selectedGeography || 'Not captured'}`,
    `- Collection lane: ${angleContext.selectedCollectionLane || 'Not captured'}`,
    `- Evidence support: ${angleContext.evidenceSupport || 'Not captured'}`,
    `- Search start point: ${angleContext.searchStartPoint || searchQueries[0] || beatContext.beatType}`,
    '',
    '## Scope Lock',
    '- Search was limited to this selected angle and selected beat only.',
    '- Secondary backlog angles were not included in this target package.',
    '- Each journalist below must have a fit reason tied to the selected angle.',
    '',
    '## Automatic Stop Conditions',
    '- Stop if the selected angle, selected beat, or selected collection lane no longer matches `05-beats.md`.',
    '- Stop if imported profiles appear to belong to another campaign, topic, geography, or backlog angle.',
    '- Stop if no source can verify the journalist role, outlet, or beat.',
    '',
    '## Collection Lane Execution',
    `- Lane used: ${angleContext.selectedCollectionLane || 'Not captured'}`,
    `- Collection started from: ${angleContext.searchStartPoint || searchQueries[0] || beatContext.beatType}`,
    '- Muck Rack access status: imported source files reviewed',
    '- SERP access status: not captured by this bridge unless included in source files',
    '- Outlet-page review status: not captured by this bridge unless included in source files',
    `- Known collection limitations: ${missingEmailTargets.length} target(s) missing direct email; coverage depth depends on imported article captures`,
    '',
    '## Search Inputs',
    `- Selected angle: ${angleContext.selectedAngle}`,
    `- Selected beat: ${angleContext.bestBeat || beatContext.beatType}`,
    `- Beat query: ${searchQueries[0] || angleContext.searchStartPoint || beatContext.beatType}`,
    `- Geography: ${angleContext.selectedGeography || 'Not captured'}`,
    `- Outlet preference: ${angleContext.selectedOutletScale || beatContext.outletType || 'Not captured'}`,
    `- Query family count: ${searchQueries.length || 0}`,
    '',
    '## Query Expansion Rules',
    '- Start with selected topic, selected beat, selected geography, and selected outlet scale.',
    '- Expand only with controlled synonyms, adjacent beat terms, local/regional terms, or outlet-type phrases.',
    '- Label broad fallback queries honestly if they were used.',
    '- Do not mix in search terms from secondary backlog angles.',
    '',
    '## Journalist Inclusion Rules',
    '- Include only journalists with direct beat fit, relevant recent coverage, correct geography or outlet scale, or another clear selected-angle fit signal.',
    '- Do not include a journalist only because the outlet is high-profile.',
    '- Do not include stale profiles without current-role verification when outreach depends on that role.',
    '',
    '| Rank | Journalist | Outlet | Primary Beat | Email Status | Muck Rack Profile | Priority Score | Notes |',
    '|------|------------|--------|--------------|--------------|-------------------|----------------|-------|'
  ];

  for (let index = 0; index < selected.length; index += 1) {
    const item = selected[index];
    const emailStatus = item.emails.length ? `available: ${item.emails[0]}` : 'missing';
    const beat = item.beats[0] || beatContext.beatType;
    const profile = item.profileUrl || 'Not captured';

    lines.push(
      `| ${index + 1} | ${item.name} | ${item.outlet || 'Unknown outlet'} | ${beat || 'Not captured'} | ${emailStatus} | ${profile} | ${scoreJournalist(item)} | ${buildJournalistNote(item, beatContext)} |`
    );
  }

  if (!selected.length) {
    lines.push('| 1 | No imported journalists found | N/A | N/A | missing | Not captured | 1 | Import profile captures first. |');
  }

  lines.push('');
  lines.push('## Journalist Qualification Rubric');
  lines.push('- `9-10`: direct selected-beat fit, recent relevant coverage, correct outlet scale, usable contact route, strong personalization potential');
  lines.push('- `7-8`: good selected-beat fit with one minor caveat');
  lines.push('- `5-6`: possible fit that needs manual review before outreach');
  lines.push('- `3-4`: weak fit; hold unless better targets are unavailable');
  lines.push('- `1-2`: do not target');
  lines.push('');
  lines.push('## Priority Score Formula');
  lines.push('- Add weight for direct selected-beat match, relevant coverage, outlet scale, geography, contact route, personalization potential, data-story fit, and current-role verification.');
  lines.push('- Cap at `6` if no relevant recent coverage is available yet.');
  lines.push('- Cap at `6` if contact route is completely missing.');
  lines.push('- Cap at `5` if beat fit is inferred only from outlet type.');
  lines.push('- Cap at `4` if the only fit is geography.');
  lines.push('- Never assign `9-10` unless direct beat fit, coverage evidence, outlet fit, and contact route are all strong.');
  lines.push('');
  lines.push('## Row Writing Instructions');
  lines.push('- `Notes` must explain why the journalist is prioritized, the strongest fit signal, and the best next action.');
  lines.push('- `Fit Reason` should connect journalist, beat, outlet scale, and selected angle.');
  lines.push('- Any risk or caveat should name missing email, weak coverage evidence, stale profile risk, geography mismatch, or manual verification need.');
  lines.push('');
  lines.push('## Priority Tiers');
  lines.push('### Tier 1: Outreach-Ready');
  if (tierOne.length) {
    for (const item of tierOne) {
      lines.push(`- ${item.name} - score ${scoreJournalist(item)}; ${buildJournalistNote(item, beatContext)}`);
    }
  } else {
    lines.push('- None identified from imported data');
  }
  lines.push('');
  lines.push('### Tier 2: Review Before Outreach');
  if (tierTwo.length) {
    for (const item of tierTwo) {
      lines.push(`- ${item.name} - score ${scoreJournalist(item)}; review contact route, coverage depth, or beat fit before outreach`);
    }
  } else {
    lines.push('- None identified from imported data');
  }
  lines.push('');
  lines.push('### Tier 3: Hold / Do Not Pitch Yet');
  if (tierThree.length) {
    for (const item of tierThree) {
      lines.push(`- ${item.name} - score ${scoreJournalist(item)}; hold unless manually upgraded`);
    }
  } else {
    lines.push('- None identified from imported data');
  }
  lines.push('');
  lines.push('## Media List / Export Source');

  const sources = unique([
    ...searchSourceFiles,
    ...selected.flatMap((item) => item.sourceFiles)
  ]);

  if (sources.length) {
    for (const source of sources) {
      lines.push(`- ${source}`);
    }
  } else {
    lines.push('- No imported Muck Rack source files found');
  }

  lines.push('');
  lines.push('## Source Inventory');
  lines.push('| Source Type | File / URL / Location | What It Provided | Reliability | Notes |');
  lines.push('|-------------|-----------------------|------------------|-------------|-------|');
  if (sources.length) {
    for (const source of sources) {
      lines.push(`| imported file | ${source} | journalist profile, search result, or article capture | medium | verify manually before outreach if critical |`);
    }
  } else {
    lines.push('| none | Not captured | No source inventory available | low | Import profile and article captures first |');
  }

  lines.push('');
  lines.push('## Source Reliability Standards');
  lines.push('- High: current journalist profile, outlet author page, recent byline page, official staff page, or verified current Muck Rack profile.');
  lines.push('- Medium: older profile, article history without current staff confirmation, or secondary database profile with limited recency.');
  lines.push('- Low: old article only, scraped directory, broad search snippet, or stale cross-campaign artifact.');
  lines.push('- Do not use low-reliability sources as the only reason for Tier 1.');

  lines.push('');
  lines.push('## Contact Status Rules');
  lines.push('- `available: [email]` means the email was captured from an allowed source.');
  lines.push('- `missing` means no direct email was captured.');
  lines.push('- Do not guess email patterns.');
  lines.push('- Do not infer personal emails from outlet naming conventions.');
  lines.push('');
  lines.push('## Contact Verification Rules');
  lines.push('- Confirm journalist name, outlet, and contact route all belong together.');
  lines.push('- Distinguish direct email, newsroom email, contact form, and profile-only route.');
  lines.push('- Mark uncertain contact routes as `missing` or `needs verification`.');

  lines.push('');
  lines.push('## Missing Email Log');
  const missing = selected.filter((item) => !item.emails.length);
  if (missing.length) {
    for (const item of missing) {
      lines.push(`- ${item.name} - no email captured in imported profile data`);
    }
  } else {
    lines.push('- None');
  }

  lines.push('');
  lines.push('## Duplicate And Cleanup Log');
  lines.push('- Duplicate removal was handled by profile-name merge and article URL/title dedupe during bridge generation.');
  lines.push('- Re-check manually if the imported folder contains several profiles for the same journalist under different outlets.');
  lines.push('');
  lines.push('## Weak Fits Excluded');
  lines.push('- Not captured by this bridge. Add any manually excluded journalists here before Stage 07 if needed.');
  lines.push('');
  lines.push('## Manual Review Queue');
  if (tierTwo.length || missingEmailTargets.length) {
    for (const item of unique([...tierTwo.map((entry) => entry.name), ...missingEmailTargets.map((entry) => entry.name)])) {
      lines.push(`- ${item} - review contact route, beat fit, or coverage depth before outreach`);
    }
  } else {
    lines.push('- None identified from imported data');
  }
  lines.push('');
  lines.push('## Coverage Handoff To Stage 07');
  lines.push('- Stage 07 must collect or summarize coverage only for the selected-angle target list.');
  lines.push('- Prioritize Tier 1 journalists with available email and relevant recent coverage.');
  lines.push('- Do not spend Stage 07 time on Tier 3 unless the user asks.');
  lines.push('');
  lines.push('## Handoff Notes For Pitch Writer');
  lines.push(`- Primary outreach target: ${selected[0]?.name || 'Not captured'}`);
  lines.push(`- Backup outreach target: ${selected[1]?.name || 'Not captured'}`);
  lines.push(`- Best journalist beat to reference: ${selected[0]?.beats[0] || beatContext.beatType}`);
  lines.push(`- Strongest personalization bridge: ${selected[0]?.articles[0]?.title || 'Capture coverage in Stage 07 before drafting'}`);
  lines.push(`- Contact caveat: ${missingEmailTargets.length ? `${missingEmailTargets.length} target(s) missing direct email` : 'No missing direct emails among selected targets'}`);
  lines.push(`- Data point to lead with: ${angleContext.evidenceSupport || 'Use Stage 04 and Stage 03 evidence before drafting'}`);
  lines.push('- Journalist-specific caution: verify coverage hook before using it in the email body');
  lines.push('- Claims to avoid: unsupported claims outside the selected angle evidence frame');
  lines.push('- Do not draft for any secondary backlog angle.');
  lines.push('');
  lines.push('## Stage 08 Readiness Decision');
  lines.push(`- Ready for Stage 08: ${tierOne.length && selected.some((item) => item.articles.length) ? 'yes, after Stage 07 coverage review confirms hooks' : 'no'}`);
  lines.push(`- Targets safe to pitch now: ${tierOne.map((item) => item.name).join(', ') || 'none identified'}`);
  lines.push(`- Targets requiring contact verification first: ${missingEmailTargets.map((item) => item.name).join(', ') || 'none identified'}`);
  lines.push('- Minimum action needed before drafting: confirm Stage 07 coverage hooks for the selected target');
  lines.push('');
  lines.push('## Quality Assurance Check');
  lines.push('- Selected Angle Confirmed: pass - selected angle metadata was read from `05-beats.md`');
  lines.push('- Single-Angle Scope: pass - bridge output is tied to one selected angle');
  lines.push(`- Beat Fit: review - ${selected.length} target(s) require human beat-fit review before outreach`);
  lines.push(`- Contact Honesty: pass - ${directEmailTargets.length} available email target(s), ${missingEmailTargets.length} missing email target(s)`);
  lines.push('- Source Traceability: pass - imported file list recorded');
  lines.push('- Source Reliability Labeled: review - verify reliability before outreach');
  lines.push('- Priority Scores Defensible: review - bridge scores are heuristic and should be checked by a human');
  lines.push('- Manual Review Queue Clear: review - clear review items before drafting');
  lines.push('- Coverage Handoff Ready: review - confirm Stage 07 has enough recent coverage before pitch writing');
  lines.push('');
  lines.push('## Definition Of Done');
  lines.push('1. This file matches the confirmed selected angle in `05-beats.md`.');
  lines.push('2. Every included journalist has an honest contact status.');
  lines.push('3. Every included journalist has a clear fit reason or a review note.');
  lines.push('4. Tier 1 targets are clear enough for Stage 07 coverage review.');
  lines.push('5. The pitch writer can understand who to pitch, why they fit, and what caveats must be respected.');
  lines.push('');
  return lines.join('\n');
}

function buildCoverageMarkdown({angleContext, beatContext, journalists, maxJournalists, maxArticles}) {
  const selected = journalists
    .filter((item) => item.articles.length)
    .slice(0, maxJournalists);

  const lines = [
    '# Journalist Coverage',
    '',
    '## Selected Outreach Angle',
    `- Angle: ${angleContext.selectedAngle}`,
    `- Beat: ${angleContext.bestBeat || beatContext.beatType}`,
    `- Outlet scale: ${angleContext.selectedOutletScale || beatContext.outletType || 'Not captured'}`,
    `- Geography: ${angleContext.selectedGeography || 'Not captured'}`,
    `- Collection lane: ${angleContext.selectedCollectionLane || 'Not captured'}`,
    '',
  ];

  if (!selected.length) {
    lines.push('## No Imported Coverage');
    lines.push('- Name: No journalist coverage was imported');
    lines.push(`- Outlet: ${beatContext.outletType}`);
    lines.push(`- Beat: ${beatContext.beatType}`);
    lines.push('- Email: missing');
    lines.push('- Muck Rack Profile: Not captured');
    lines.push('');
    lines.push('### Last 10 Relevant Coverage Items');
    lines.push('1. Title: No imported coverage items were available');
    lines.push('   URL: N/A');
    lines.push(`   Topic fit: Manual review needed against the selected angle "${angleContext.selectedAngle}"`);
    lines.push('   Takeaway: Capture profile/article exports before drafting personalization hooks.');
    lines.push('');
    lines.push('## Personalization Hooks');
    lines.push('- No imported coverage items were available for personalization.');
    lines.push('');
    return lines.join('\n');
  }

  for (const item of selected) {
    lines.push(`## ${item.name}`);
    lines.push(`- Name: ${item.name}`);
    lines.push(`- Outlet: ${item.outlet || 'Unknown outlet'}`);
    lines.push(`- Beat: ${item.beats[0] || beatContext.beatType}`);
    lines.push(`- Email: ${item.emails[0] || 'missing'}`);
    lines.push(`- Muck Rack Profile: ${item.profileUrl || 'Not captured'}`);
    lines.push('');
    lines.push('### Last 10 Relevant Coverage Items');

    const articles = item.articles.slice(0, maxArticles);
    for (let index = 0; index < articles.length; index += 1) {
      const article = articles[index];
      lines.push(`${index + 1}. Title: ${article.title}`);
      lines.push(`   URL: ${article.url}`);
      lines.push(`   Topic fit: ${buildTopicFit(article, item, angleContext, beatContext)}`);
      lines.push(`   Takeaway: ${buildCoverageTakeaway(article, item, beatContext)}`);
    }

    lines.push('');
    lines.push('## Personalization Hooks');
    for (let index = 0; index < Math.min(3, articles.length); index += 1) {
      lines.push(`- ${buildPersonalizationHook(articles[index], item, beatContext)}`);
    }
    lines.push('');
  }

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

  const maxJournalists = Math.max(1, Number(args['max-journalists'] || 5));
  const maxArticles = Math.max(1, Number(args['max-articles'] || 10));
  const force = Boolean(args.force);

  const jobDir = path.resolve(PITCH_JOBS_DIR, jobName);
  if (!jobDir.startsWith(path.resolve(PITCH_JOBS_DIR))) {
    throw new Error(`Resolved pitch job path escapes pitch-jobs: ${jobDir}`);
  }
  if (!await pathExists(jobDir)) {
    throw new Error(`Pitch job does not exist: ${jobDir}`);
  }

  const stage06Path = path.join(jobDir, '06-journalist-intel.md');
  const stage07Path = path.join(jobDir, '07-journalist-coverage.md');
  const sourceRoot = path.join(jobDir, 'source-files', 'journalist-intel');
  const exportDir = path.join(sourceRoot, 'muck-rack-exports');
  const notesDir = path.join(sourceRoot, 'profile-notes');

  const briefMarkdown = await ensureMeaningfulFile(path.join(jobDir, '00-brief.md'), '00-brief.md');
  const notesMarkdown = await ensureMeaningfulFile(path.join(jobDir, '01-study-notes.md'), '01-study-notes.md');
  const insightsMarkdown = await ensureMeaningfulFile(path.join(jobDir, '02-insights.md'), '02-insights.md');
  const researchMarkdown = await ensureMeaningfulFile(path.join(jobDir, '03-research.md'), '03-research.md');
  const anglesMarkdown = await ensureMeaningfulFile(path.join(jobDir, '04-angles.md'), '04-angles.md');
  const beatsMarkdown = await ensureMeaningfulFile(path.join(jobDir, '05-beats.md'), '05-beats.md');
  const selectedGate = requireSelectedAngleGate(beatsMarkdown);

  const stage06Exists = await pathExists(stage06Path);
  if (stage06Exists && !force) {
    const existing = await fs.readFile(stage06Path, 'utf8');
    if (isMeaningfulMarkdown(existing)) {
      throw new Error(`06-journalist-intel.md already contains non-placeholder content. Use --force to overwrite.`);
    }
  }

  const stage07Exists = await pathExists(stage07Path);
  if (stage07Exists && !force) {
    const existing = await fs.readFile(stage07Path, 'utf8');
    if (isMeaningfulMarkdown(existing)) {
      throw new Error(`07-journalist-coverage.md already contains non-placeholder content. Use --force to overwrite.`);
    }
  }

  const searchFiles = await readJsonFiles(exportDir);
  const profileFiles = await readJsonFiles(notesDir);
  const profileJson = profileFiles.filter((file) => file.data && (file.data.name || file.data.emails || file.data.pageUrl));
  const articleJson = profileFiles.filter((file) => file.data && Array.isArray(file.data.articles));

  const journalists = mergeJournalistData(profileJson, articleJson)
    .sort((left, right) => scoreJournalist(right) - scoreJournalist(left));

  if (!journalists.length) {
    throw new Error(`No imported journalist profile/article JSON was found in ${sourceRoot}. Run the Muck Rack capture tools and import step first.`);
  }

  if (!journalists.some((item) => item.articles.length)) {
    throw new Error(`Imported journalist data did not include any recent coverage items in ${sourceRoot}. Capture article cards before drafting stages 06 and 07.`);
  }

  const angleContext = extractAngleContext(anglesMarkdown, selectedGate);
  const beatContext = extractBeatContext(beatsMarkdown, selectedGate);
  const searchQueries = unique(searchFiles.map((file) => normalizeText(file.data.query)));
  const searchSourceFiles = unique(searchFiles.map((file) => relativeToRoot(file.filePath)));

  const stage06 = buildJournalistIntelMarkdown({
    angleContext,
    beatContext,
    searchQueries,
    searchSourceFiles,
    journalists,
    maxJournalists
  });

  const stage07 = buildCoverageMarkdown({
    angleContext,
    beatContext,
    journalists,
    maxJournalists,
    maxArticles
  });

  await fs.writeFile(stage06Path, stage06, 'utf8');
  await fs.writeFile(stage07Path, stage07, 'utf8');

  console.log(`Drafted ${stage06Path}`);
  console.log(`Drafted ${stage07Path}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
