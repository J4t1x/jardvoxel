// ═══════════════════════════════════════════════════════════
// SPEC-H001: Hard Gate — JSON Validator
// Validates that quest/event responses parse as JSON.
// ═══════════════════════════════════════════════════════════

/**
 * @param {string} response - Raw LLM response
 * @param {string} taskType - generate_quest | generate_event | npc_dialogue
 * @returns {{ passed: boolean, parsed: object|null, error: string|null }}
 */
export function validateJSON(response, taskType) {
  if (!response || typeof response !== 'string') {
    return { passed: false, parsed: null, error: 'empty_response' };
  }

  // For tasks that don't require JSON, skip
  if (taskType === 'generate_lore') {
    return { passed: true, parsed: null, error: null };
  }

  try {
    const parsed = JSON.parse(response.trim());
    return { passed: true, parsed, error: null };
  } catch (e) {
    // Try to extract JSON from text (some models wrap JSON in prose)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return { passed: true, parsed, error: null };
      } catch (e2) {
        return { passed: false, parsed: null, error: 'json_parse_failed' };
      }
    }
    return { passed: false, parsed: null, error: 'no_json_found' };
  }
}
