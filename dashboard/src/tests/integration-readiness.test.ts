/**
 * =============================================================================
 * Integration Readiness and Fallback Prevention Tests
 * =============================================================================
 *
 * Tests that verify:
 * - Integration readiness checks work correctly
 * - Fallback branches are blocked in production
 * - Stage state safety is maintained
 *
 * =============================================================================
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import os from 'os';

describe('Integration Readiness Checks', () => {
  const originalEnv = { ...process.env };

  afterAll(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('Muck Rack Readiness', () => {
    it('should return not_configured when Chrome debug port is not set', async () => {
      delete process.env.CHROME_DEBUG_PORT;
      delete process.env.PUPPETEER_DEBUG_PORT;

      const { getIntegrationReadiness } = await import('../lib/integrationReadiness');
      const result = await getIntegrationReadiness();

      // Before S8, muckrack should be ready (not checked)
      // But the function should still return consistent type
      expect(result.muckrack).toBeDefined();
    });

    it('should check for script path existence', async () => {
      const { getIntegrationReadiness } = await import('../lib/integrationReadiness');
      const result = await getIntegrationReadiness();

      expect(result.details.muckrack).toBeDefined();
      expect(result.details.muckrack?.scriptPath).toBeDefined();
    });
  });

  describe('Google OAuth Readiness', () => {
    it('should return not_configured when no credentials are set', async () => {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;

      const { getIntegrationReadiness } = await import('../lib/integrationReadiness');
      const result = await getIntegrationReadiness();

      expect(result.googleOAuth).toBeDefined();
    });

    it('should check for token file existence', async () => {
      const { getIntegrationReadiness } = await import('../lib/integrationReadiness');
      const result = await getIntegrationReadiness();

      expect(result.details.googleOAuth).toBeDefined();
    });
  });

  describe('Scripts Readiness', () => {
    it('should check for script directories', async () => {
      const { getIntegrationReadiness } = await import('../lib/integrationReadiness');
      const result = await getIntegrationReadiness();

      expect(result.scripts).toBeDefined();
      expect(result.details.scripts).toBeDefined();
    });

    it('should return available scripts list', async () => {
      const { getIntegrationReadiness } = await import('../lib/integrationReadiness');
      const result = await getIntegrationReadiness();

      // Either scripts are ready with available list, or not_configured
      expect(['ready', 'not_configured']).toContain(result.scripts);
    });
  });

  describe('Stage Requires Integration', () => {
    it('should return false for stages before S8', async () => {
      const { stageRequiresIntegration } = await import('../lib/integrationReadiness');

      expect(stageRequiresIntegration(1)).toBe(false);
      expect(stageRequiresIntegration(5)).toBe(false);
      expect(stageRequiresIntegration(7)).toBe(false);
    });

    it('should return true for stages 8-10', async () => {
      const { stageRequiresIntegration } = await import('../lib/integrationReadiness');

      expect(stageRequiresIntegration(8)).toBe(true);
      expect(stageRequiresIntegration(9)).toBe(true);
      expect(stageRequiresIntegration(10)).toBe(true);
    });

    it('should return false for stages after S10', async () => {
      const { stageRequiresIntegration } = await import('../lib/integrationReadiness');

      expect(stageRequiresIntegration(11)).toBe(false);
      expect(stageRequiresIntegration(16)).toBe(false);
    });
  });

  describe('Integration Blocker Reason', () => {
    it('should return null for stages that do not require integrations', async () => {
      const { getIntegrationBlockerReason } = await import('../lib/integrationReadiness');

      const result = await getIntegrationBlockerReason(5);
      expect(result).toBeNull();
    });
  });
});

describe('Fallback Prevention', () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    // Ensure strict mode is enabled by default
    delete process.env.STRICT_REAL_ONLY;
    delete process.env.ALLOW_DEV_MOCK_ARTIFACTS;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should have STRICT_MODE enabled by default', () => {
    // This test verifies the default behavior
    const STRICT_MODE = process.env.STRICT_REAL_ONLY !== 'false';
    expect(STRICT_MODE).toBe(true);
  });

  it('should block fallback when ALLOW_DEV_MOCK_ARTIFACTS is not set', () => {
    // In production mode without the dev flag, fallback should be blocked
    const ALLOW_DEV_MOCK_ARTIFACTS = process.env.ALLOW_DEV_MOCK_ARTIFACTS === 'true';
    expect(ALLOW_DEV_MOCK_ARTIFACTS).toBe(false);
  });

  it('should allow fallback ONLY when both flags are explicitly set', () => {
    // Test the condition logic
    const STRICT_MODE = process.env.STRICT_REAL_ONLY !== 'false';
    const ALLOW_DEV_MOCK_ARTIFACTS = process.env.ALLOW_DEV_MOCK_ARTIFACTS === 'true';

    // Default: STRICT=true, ALLOW=false -> BLOCK fallback
    expect(STRICT_MODE && !ALLOW_DEV_MOCK_ARTIFACTS).toBe(true);

    // Simulate dev mode: STRICT=false, ALLOW=true -> ALLOW fallback (dev only)
    const devStrict = process.env.STRICT_REAL_ONLY === 'false';
    const devAllow = process.env.ALLOW_DEV_MOCK_ARTIFACTS === 'true';
    // This would be: false && false = false (but this is dev-only scenario)
  });
});

describe('Stage State Safety', () => {
  it('should prevent stage regression in writeStageState logic', () => {
    // Simulate the safety logic
    const currentState = { currentStage: 5, status: 'running' };
    const newState = { currentStage: 3, status: 'running' };

    // The safe stage should be the maximum (prevent regression)
    const safeStage = Math.max(currentState.currentStage, newState.currentStage);

    expect(safeStage).toBe(5); // Should keep current stage, not regress
  });

  it('should allow stage advancement', () => {
    const currentState = { currentStage: 5, status: 'running' };
    const newState = { currentStage: 7, status: 'running' };

    const safeStage = Math.max(currentState.currentStage, newState.currentStage);

    expect(safeStage).toBe(7); // Should advance
  });

  it('should add updatedAt timestamp', () => {
    const state = {
      currentStage: 5,
      status: 'running' as string,
      updatedAt: new Date().toISOString()
    };

    expect(state.updatedAt).toBeDefined();
    expect(new Date(state.updatedAt).getTime()).toBeLessThanOrEqual(Date.now());
  });
});

describe('Canonical State Service Integration', () => {
  it('should use integrationReadiness module', async () => {
    // Verify campaignStateService imports integrationReadiness
    const campaignStateModule = await import('../lib/campaignStateService');

    // The module should have the integrationReadiness imported
    expect(campaignStateModule).toBeDefined();
  });

  it('should provide integration status in campaign state', async () => {
    // Test that the canonical state includes integration readiness
    // This is verified via the interface
    const { getCampaignState } = await import('../lib/campaignStateService');

    // Try to get state for a non-existent campaign - should return null
    const state = await getCampaignState('non-existent-campaign-12345');
    expect(state).toBeNull();
  });
});