// ═══════════════════════════════════════════════════════════
// SPEC-H001: Hard Gate — Repeat Detector
// Detects identical responses within a test session.
// ═══════════════════════════════════════════════════════════

/**
 * @param {string} response - Current response
 * @param {Set<string>} seenResponses - Set of previously seen responses
 * @returns {{ passed: boolean, isRepeat: boolean }}
 */
export function checkRepeat(response, seenResponses) {
  const normalized = (response || '').trim().toLowerCase();

  if (!normalized) {
    return { passed: false, isRepeat: false };
  }

  const isRepeat = seenResponses.has(normalized);
  if (!isRepeat) {
    seenResponses.add(normalized);
  }

  return { passed: !isRepeat, isRepeat };
}
