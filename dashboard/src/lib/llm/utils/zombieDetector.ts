/**
 * Zombie Check: Detect hidden refusals in short responses
 */
export function isZombieResponse(content: string): boolean {
  if (!content || content.length < 100) {
    const zombiePatterns = [
      /i cannot/i,
      /i'm sorry/i,
      /cannot fulfill/i,
      /cannot complete/i,
      /unable to/i,
      /not able to/i,
      /do not have the ability/i,
      /cannot assist/i,
      /safety guidelines/i,
      /content policy/i
    ];

    return zombiePatterns.some(pattern => pattern.test(content));
  }
  return false;
}
