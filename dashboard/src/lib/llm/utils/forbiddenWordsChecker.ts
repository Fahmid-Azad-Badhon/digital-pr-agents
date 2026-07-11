/**
 * Forbidden words checker for generated copy
 */
const FORBIDDEN_WORDS = ['synergy', 'paradigm shift', 'game-changer', 'leverage', 'deep dive', 'circle back', 'low-hanging fruit']

export function containsForbiddenWords(text: string): string[] {
  const lower = text.toLowerCase()
  return FORBIDDEN_WORDS.filter(word => lower.includes(word))
}
