// SQLite-based storage for campaigns (MVP)
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const ROOT = "D:\\Codex Folder\\digital-pr-agents";
const DB_FILE = path.join(ROOT, 'data', 'pr_orchestrator.sqlite3');

let db = null;

function initDb() {
  if (db) return Promise.resolve(db);
  return new Promise((resolve, reject) => {
    // Ensure data directory exists
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    db = new sqlite3.Database(DB_FILE, (err) => {
      if (err) return reject(err);
      // Create campaigns table if not exists
      db.run(`CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        name TEXT,
        client TEXT,
        studyTitle TEXT,
        topic TEXT,
        region TEXT,
        beats TEXT,
        goal TEXT,
        tone TEXT,
        notes TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        stage INTEGER,
        currentStage INTEGER,
        angleSelection TEXT,
        progress INTEGER,
        path TEXT
      )`, (err2) => {
        if (err2) return reject(err2);
        resolve(db);
      });
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    initDb().then((d) => {
      d.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve(this);
      });
    }).catch(reject);
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    initDb().then((d) => {
      d.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    }).catch(reject);
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    initDb().then((d) => {
      d.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    }).catch(reject);
  });
}

function close() {
  if (!db) return Promise.resolve();
  return new Promise((resolve, reject) => db.close((e) => (e ? reject(e) : resolve())));
}

async function createCampaign(data) {
  const id = 'cmp-' + Date.now();
  const now = new Date().toISOString();
  const pathRoot = require('path').join(ROOT, 'CAMPAIGNS', id);
  await initDb();
  await new Promise((resolve, reject) => {
    const stmt = `INSERT INTO campaigns (id, name, client, studyTitle, topic, region, beats, goal, tone, notes, createdAt, updatedAt, stage, currentStage, angleSelection, progress, path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(
      stmt,
      [id, data.name, data.client, data.studyTitle, data.topic, data.region, JSON.stringify(data.beats || []), data.goal, data.tone, data.notes || '', now, now, 1, 1, JSON.stringify({}), 0, pathRoot],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
  // Create campaign folder on disk
  require('./fileOps').ensureCampaignFolder(id);
  return { id, path: pathRoot };
}

async function getCampaign(id) {
  await initDb();
  const row = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM campaigns WHERE id = ?', [id], (err, row) => (err ? reject(err) : resolve(row)));
  });
  if (!row) return null;
  // Parse JSON fields
  let beats = [];
  try { beats = row.beats ? JSON.parse(row.beats) : []; } catch { beats = []; }
  let angleSelection = {};
  try { angleSelection = row.angleSelection ? JSON.parse(row.angleSelection) : {}; } catch { angleSelection = {}; }
  return {
    id: row.id,
    name: row.name,
    client: row.client,
    studyTitle: row.studyTitle,
    topic: row.topic,
    region: row.region,
    beats,
    goal: row.goal,
    tone: row.tone,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    stage: row.stage,
    currentStage: row.currentStage,
    angleSelection,
    progress: row.progress,
    path: row.path
  };
}

async function saveCampaign(cam) {
  await initDb();
  const angleSel = cam.angleSelection ? JSON.stringify(cam.angleSelection) : '{}';
  const beats = cam.beats ? JSON.stringify(cam.beats) : '[]';
  await new Promise((resolve, reject) => {
    db.run(`UPDATE campaigns SET name=?, client=?, studyTitle=?, topic=?, region=?, beats=?, goal=?, tone=?, notes=?, updatedAt=?, stage=?, currentStage=?, angleSelection=?, progress=?, path=? WHERE id=?`,
      [cam.name, cam.client, cam.studyTitle, cam.topic, cam.region, beats, cam.goal, cam.tone, cam.notes, cam.updatedAt, cam.stage, cam.currentStage, angleSel, cam.progress, cam.path, cam.id], (err) => {
        if (err) return reject(err);
        resolve();
      });
  });
  return cam;
}

module.exports = {
  initDb,
  createCampaign,
  getCampaign,
  saveCampaign
};
