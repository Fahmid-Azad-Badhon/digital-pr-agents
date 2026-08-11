import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import { detectPipelineGap, getPipelineRequirements } from '@/lib/llmService';

describe('pipeline-gaps path regression', () => {
  const expectedPath = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\data\\pipeline-gaps.json';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes pipeline gaps to the correct data file path', () => {
    const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    detectPipelineGap('S4', 'S5', 'beat-match');

    expect(writeSpy).toHaveBeenCalledTimes(1);
    const pathArg = writeSpy.mock.calls[0][0] as string;
    expect(pathArg).toBe(expectedPath);
    expect(pathArg).not.toContain('Folderdigital');
  });

  it('reads pipeline gaps from the correct data file path', () => {
    const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    getPipelineRequirements();

    expect(existsSpy).toHaveBeenCalledTimes(1);
    const pathArg = existsSpy.mock.calls[0][0] as string;
    expect(pathArg).toBe(expectedPath);
  });
});
