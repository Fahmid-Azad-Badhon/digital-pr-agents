import fs from 'fs/promises';

const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_RETRY_DELAY_MS = 60;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function safeReadJsonFile<T>(
  filePath: string,
  options?: {
    retries?: number;
    retryDelayMs?: number;
  }
): Promise<T | null> {
  const retries = options?.retries ?? DEFAULT_RETRY_COUNT;
  const retryDelayMs = options?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const normalized = content.replace(/^\uFEFF/, '');
      return JSON.parse(normalized) as T;
    } catch (error) {
      const isParseError = error instanceof SyntaxError;
      const isFinalAttempt = attempt === retries;

      if (!isParseError || isFinalAttempt) {
        return null;
      }

      await sleep(retryDelayMs * (attempt + 1));
    }
  }

  return null;
}
