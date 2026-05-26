/**
 * Canonical fallback markers list - SINGLE SOURCE OF TRUTH
 *
 * All modules that detect fallback/scaffold/mock content MUST import from here.
 * Never maintain separate marker lists in multiple files.
 */

export const FALLBACK_MARKERS = [
  // Explicit fallback labels
  '(Fallback)',
  '(fallback)',
  'fallback extraction',
  'fallback angle',
  'fallback mapping',
  'fallback generation',

  // Stage-specific markers
  'stage 2 insights (Fallback)',
  'stage 2 insights (fallback)',
  'stage 2 study notes (Fallback)',
  'stage 2 study notes (fallback)',
  'created by built-in fallback extractor',
  'fallback extraction payload',

  // Auto-generated / scaffold indicators
  'auto-generated',
  'generated from s3 research',
  'no external source pull attached',
  'inventory scaffold',
  'placeholder',
  'scaffold',
  'sample output',
  'demo content',
  'demo',
  'mock data',
  'synthetic data',
  'package summary',
  'core narrative',
  'included assets',
  'placeholder narrative',

  // Generic weak indicators
  'integration failed',
  'script failed',
  'no data available',
  'no findings extracted',
  'no numeric signals detected',
  'no sufficient insights',

  // Dev-only markers
  'dev only',
  '(dev only)',
  'development mode',
  'test mode',
  'lorem ipsum',
  'todo',
  'stub',
  
  // Additional fallback/synthetic data markers
  'fake data',
  'fake dataset',
  'fake output',
  'synthetic output',
  'generated test data',
  'dummy data',
  'dummy output',
];

export function looksLikeFallback(content: string): boolean {
  const lowered = content.toLowerCase();
  return FALLBACK_MARKERS.some(marker => lowered.includes(marker.toLowerCase()));
}