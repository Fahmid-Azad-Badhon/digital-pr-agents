import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PITCH_JOBS_DIR = path.join(ROOT, 'pitch-jobs');
const MUCK_RACK_ROOT = path.resolve(ROOT, '..', 'muck-rack-automation');
const MUCK_RACK_OUTPUT = path.join(MUCK_RACK_ROOT, 'output');

function usage() {
  console.error('Usage: import-muckrack-output.cmd <job-name> [--all] [--search] [--profiles] [--articles]');
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      args[key] = true;
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

async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, {recursive: true});
  return targetPath;
}

function isValidJobName(value) {
  return Boolean(value) && !value.includes('..') && !value.includes('/') && !value.includes('\\');
}

function relativeToWorkspace(targetPath) {
  return path.relative(path.dirname(ROOT), targetPath).replace(/\\/g, '/');
}

function groupKeyForFile(filePath) {
  const parsed = path.parse(filePath);
  return `${parsed.dir}::${parsed.name}`;
}

async function collectGroups(directoryPath) {
  if (!await pathExists(directoryPath)) {
    return [];
  }

  const entries = await fs.readdir(directoryPath, {withFileTypes: true});
  const groups = new Map();

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    if (!['.json', '.md'].includes(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    if (entry.name === '.gitkeep') {
      continue;
    }

    const fullPath = path.join(directoryPath, entry.name);
    const stat = await fs.stat(fullPath);
    const key = groupKeyForFile(fullPath);
    const existing = groups.get(key) || {
      stem: path.parse(entry.name).name,
      files: [],
      latestMtimeMs: 0
    };

    existing.files.push({
      fullPath,
      name: entry.name,
      mtimeMs: stat.mtimeMs
    });
    existing.latestMtimeMs = Math.max(existing.latestMtimeMs, stat.mtimeMs);
    groups.set(key, existing);
  }

  return [...groups.values()].sort((left, right) => right.latestMtimeMs - left.latestMtimeMs);
}

async function copyGroupFiles(group, destinationDir) {
  await ensureDir(destinationDir);
  const copied = [];

  for (const file of group.files) {
    const destination = path.join(destinationDir, file.name);
    await fs.copyFile(file.fullPath, destination);
    copied.push(destination);
  }

  return copied;
}

function buildManifestMarkdown(jobName, copiedByCategory) {
  const lines = [
    '# Muck Rack Import Manifest',
    '',
    `- Job: ${jobName}`,
    `- Imported: ${new Date().toISOString()}`,
    ''
  ];

  for (const [category, entries] of Object.entries(copiedByCategory)) {
    lines.push(`## ${category}`);
    if (!entries.length) {
      lines.push('- No files imported');
      lines.push('');
      continue;
    }

    for (const item of entries) {
      lines.push(`- ${relativeToWorkspace(item)}`);
    }
    lines.push('');
  }

  lines.push('## Next Step');
  lines.push('- Use these imported files as source material for `06-journalist-intel.md` and `07-journalist-coverage.md`.');
  lines.push('');

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

  const selectedFlags = ['search', 'profiles', 'articles'].filter((flag) => args[flag]);
  const selectedCategories = selectedFlags.length ? selectedFlags : ['search', 'profiles', 'articles'];
  const importAll = Boolean(args.all);

  const jobDir = path.resolve(PITCH_JOBS_DIR, jobName);
  if (!jobDir.startsWith(path.resolve(PITCH_JOBS_DIR))) {
    throw new Error(`Resolved pitch job path escapes pitch-jobs: ${jobDir}`);
  }

  if (!await pathExists(jobDir)) {
    throw new Error(`Pitch job does not exist: ${jobDir}`);
  }

  const journalistDir = path.join(jobDir, 'source-files', 'journalist-intel');
  const exportDir = path.join(journalistDir, 'muck-rack-exports');
  const notesDir = path.join(journalistDir, 'profile-notes');

  await ensureDir(exportDir);
  await ensureDir(notesDir);

  const categories = {
    search: {
      sourceDir: MUCK_RACK_OUTPUT,
      destinationDir: exportDir
    },
    profiles: {
      sourceDir: path.join(MUCK_RACK_OUTPUT, 'profiles'),
      destinationDir: notesDir
    },
    articles: {
      sourceDir: path.join(MUCK_RACK_OUTPUT, 'articles'),
      destinationDir: notesDir
    }
  };

  const copiedByCategory = {
    search: [],
    profiles: [],
    articles: []
  };

  for (const category of selectedCategories) {
    const source = categories[category];
    const groups = await collectGroups(source.sourceDir);
    if (!groups.length) {
      continue;
    }

    const chosenGroups = importAll ? groups : [groups[0]];
    for (const group of chosenGroups) {
      const copied = await copyGroupFiles(group, source.destinationDir);
      copiedByCategory[category].push(...copied);
    }
  }

  const totalImported = Object.values(copiedByCategory).reduce((sum, items) => sum + items.length, 0);
  if (!totalImported) {
    throw new Error(
      `No Muck Rack output files were found to import. Run the browser helpers first in ${MUCK_RACK_ROOT}.`
    );
  }

  const manifestPath = path.join(journalistDir, 'import-manifest.md');
  const manifestJsonPath = path.join(journalistDir, 'import-manifest.json');
  const payload = {
    jobName,
    importedAt: new Date().toISOString(),
    copiedByCategory
  };

  await fs.writeFile(manifestPath, buildManifestMarkdown(jobName, copiedByCategory), 'utf8');
  await fs.writeFile(manifestJsonPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log(`Imported ${totalImported} file(s) into ${journalistDir}`);
  console.log(`Saved manifest to ${manifestPath}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
