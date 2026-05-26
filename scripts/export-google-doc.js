import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SECRETS_DIR = path.join(ROOT, '.secrets', 'google');
const CREDENTIALS_PATH = path.join(SECRETS_DIR, 'credentials.json');
const TOKEN_PATH = path.join(SECRETS_DIR, 'token.json');
const PITCH_JOBS_DIR = path.join(ROOT, 'pitch-jobs');
let googleClient;
let localAuth;

function usage() {
  console.error('Usage: export-google-doc.cmd <job-name> ["Optional Google Doc Title"]');
}

function slugToTitle(value) {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function markdownToPlainText(markdown) {
  const normalized = markdown.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n').map((line) => {
    if (/^#{1,6}\s+/.test(line)) {
      return line.replace(/^#{1,6}\s+/, '').trim();
    }
    return line;
  });

  return `${lines.join('\n').trim()}\n`;
}

async function ensureFileExists(filePath, label) {
  try {
    await fs.access(filePath);
  }
  catch {
    throw new Error(`${label} not found: ${filePath}`);
  }
}

async function loadSavedCredentialsIfExist() {
  try {
    const {google} = await loadGoogleClient();
    const content = await fs.readFile(TOKEN_PATH, 'utf8');
    return google.auth.fromJSON(JSON.parse(content));
  }
  catch {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH, 'utf8');
  const normalized = content.replace(/^\uFEFF/, '');
  const keys = JSON.parse(normalized);
  const key = keys.installed || keys.web;

  if (!client.credentials?.refresh_token) {
    return;
  }

  const payload = {
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token
  };

  await fs.writeFile(TOKEN_PATH, JSON.stringify(payload, null, 2));
}

async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }

  const {authenticate} = await loadLocalAuth();
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
    access_type: 'offline',
    prompt: 'consent'
  });

  await saveCredentials(client);
  return client;
}

async function main() {
  const [jobName, ...titleParts] = process.argv.slice(2);
  if (!jobName) {
    usage();
    process.exit(1);
  }

  if (jobName.includes('..') || jobName.includes('/') || jobName.includes('\\')) {
    throw new Error(`Invalid job name: ${jobName}`);
  }

  await ensureFileExists(CREDENTIALS_PATH, 'Google OAuth credentials file');

  const jobDir = path.resolve(PITCH_JOBS_DIR, jobName);
  if (!jobDir.startsWith(path.resolve(PITCH_JOBS_DIR))) {
    throw new Error(`Resolved job path escapes pitch-jobs: ${jobDir}`);
  }

  const sourcePath = path.join(jobDir, '10-google-doc.md');
  const linkPath = path.join(jobDir, 'google-doc-link.txt');
  const metadataPath = path.join(jobDir, 'google-doc-metadata.json');

  await ensureFileExists(sourcePath, 'Final Google Doc stage file');

  const {google} = await loadGoogleClient();
  const auth = await authorize();
  const docs = google.docs({version: 'v1', auth});
  const drive = google.drive({version: 'v3', auth});

  const markdown = await fs.readFile(sourcePath, 'utf8');
  const bodyText = markdownToPlainText(markdown);
  const title = titleParts.length > 0
    ? titleParts.join(' ')
    : `${slugToTitle(jobName)} - Final Pitch Package`;

  const created = await docs.documents.create({
    requestBody: {title}
  });

  const documentId = created.data.documentId;
  if (!documentId) {
    throw new Error('Google Docs API did not return a document ID.');
  }

  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [
        {
          insertText: {
            location: {index: 1},
            text: bodyText
          }
        }
      ]
    }
  });

  const file = await drive.files.get({
    fileId: documentId,
    fields: 'id,name,webViewLink'
  });

  const webViewLink = file.data.webViewLink || `https://docs.google.com/document/d/${documentId}/edit`;
  const metadata = {
    jobName,
    title,
    documentId,
    webViewLink
  };

  await fs.writeFile(linkPath, `${webViewLink}\n`);
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

  console.log(`Created Google Doc: ${webViewLink}`);
  console.log(`Saved link to: ${linkPath}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

async function loadGoogleClient() {
  if (!googleClient) {
    googleClient = await import('googleapis');
  }

  return googleClient;
}

async function loadLocalAuth() {
  if (!localAuth) {
    localAuth = await import('@google-cloud/local-auth');
  }

  return localAuth;
}
