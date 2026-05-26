import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Root path of the project (set in .env.local as ROOT_PATH)
const ROOT_PATH = process.env.ROOT_PATH || path.resolve(__dirname, '../../../');
const DATA_DIR = path.join(ROOT_PATH, 'data');
const CAMPAIGNS_FILE = path.join(DATA_DIR, 'campaigns.json');

export interface Stage {
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
}

export interface Campaign {
  id: string;
  name: string;
  brief: string; // campaign brief text
  rawStudy: string; // raw study copy text
  stages: Stage[];
  selectedAngle?: string; // angle chosen by user
}

/** Ensure the data directory and campaigns file exist */
async function ensureStore(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(CAMPAIGNS_FILE);
  } catch {
    // If file does not exist, create an empty array
    await fs.writeFile(CAMPAIGNS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

/** Load all campaigns from the JSON file */
async function loadAll(): Promise<Campaign[]> {
  await ensureStore();
  const raw = await fs.readFile(CAMPAIGNS_FILE, 'utf8');
  try {
    return JSON.parse(raw) as Campaign[];
  } catch {
    // If JSON is corrupted, reset to empty array
    await fs.writeFile(CAMPAIGNS_FILE, JSON.stringify([], null, 2), 'utf8');
    return [];
  }
}

/** Persist the entire campaigns array back to disk */
async function saveAll(campaigns: Campaign[]): Promise<void> {
  await fs.writeFile(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2), 'utf8');
}

/** Public API */
export async function initStore(): Promise<void> {
  await ensureStore();
}

export async function getAllCampaigns(): Promise<Campaign[]> {
  return loadAll();
}

export async function getCampaign(id: string): Promise<Campaign | undefined> {
  const campaigns = await loadAll();
  return campaigns.find((c) => c.id === id);
}

export async function createCampaign(data: {
  name: string;
  brief: string;
  rawStudy: string;
  stages: Stage[];
}): Promise<Campaign> {
  const campaigns = await loadAll();
  const newCampaign: Campaign = {
    id: uuidv4(),
    ...data,
  };
  campaigns.push(newCampaign);
  await saveAll(campaigns);
  return newCampaign;
}

export async function updateCampaign(updated: Campaign): Promise<void> {
  const campaigns = await loadAll();
  const idx = campaigns.findIndex((c) => c.id === updated.id);
  if (idx === -1) throw new Error('Campaign not found');
  campaigns[idx] = updated;
  await saveAll(campaigns);
}

export async function updateStage(
  campaignId: string,
  stageName: string,
  newStatus: Stage['status'],
): Promise<void> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error('Campaign not found');
  const stage = campaign.stages.find((s) => s.name === stageName);
  if (!stage) throw new Error('Stage not found');
  stage.status = newStatus;
  await updateCampaign(campaign);
}

// Helper to initialise default stages for a new campaign
export function defaultStages(): Stage[] {
  const stageNames = [
    'Campaign Intake',
    'Study Extraction',
    'Audience Research',
    'Angle Generation',
    // Stages after the angle gate
    'Journalist Search',
    'Pitch Drafting',
    'Email Optimization',
    'Final Package',
    'Validation',
    'Google Doc Export',
  ];
  return stageNames.map((name) => ({ name, status: 'pending' as const }));
}
