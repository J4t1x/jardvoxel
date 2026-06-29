// ═══════════════════════════════════════════════════════════
// SPEC-H001: Hard Gate — Token Counter
// Estimates token count of response (rough: 1 token ≈ 4 chars).
// ═══════════════════════════════════════════════════════════

const CHARS_PER_TOKEN = 4;

/**
 * @param {string} response - Raw LLM response
 * @param {number} max - Max tokens allowed (default 150)
 * @returns {{ passed: boolean, count: number, max: number }}
 */
export function countTokens(response, max = 150) {
  const count = Math.ceil((response || '').length / CHARS_PER_TOKEN);
  return { passed: count <= max, count, max };
}
