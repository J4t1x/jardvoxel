// ═══════════════════════════════════════════════════════════
// SPEC-H001: Hard Gate — Tone Checker
// Validates cozy fantasy tone, rejects AI disclaimers and
// modern/anachronistic references.
// ═══════════════════════════════════════════════════════════

import { BANNED_PATTERNS } from '../config.js';

/**
 * @param {string} response - Raw LLM response
 * @returns {{ passed: boolean, violations: string[] }}
 */
export function checkTone(response) {
  const text = response || '';
  const violations = [];

  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(text)) {
      violations.push(pattern.source);
    }
  }

  // Check for excessive violence
  const violencePatterns = [/\bkill\b/i, /\bblood\b/i, /\bgore\b/i, /\bslaughter\b/i, /\bmassacre\b/i];
  for (const pattern of violencePatterns) {
    if (pattern.test(text)) {
      violations.push(`violence: ${pattern.source}`);
    }
  }

  // Check for modern slang
  const modernPatterns = [/\bcool\b/i, /\bawesome\b/i, /\bok\b/i, /\byeah\b/i, /\bguy\b/i, /\bdude\b/i];
  for (const pattern of modernPatterns) {
    if (pattern.test(text)) {
      violations.push(`modern: ${pattern.source}`);
    }
  }

  return { passed: violations.length === 0, violations };
}
