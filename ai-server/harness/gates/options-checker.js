// ═══════════════════════════════════════════════════════════
// SPEC-H001: Hard Gate — Options Checker
// Validates that NPC dialogue includes 3-4 player options
// from the raw LLM response (not server fallback).
// ═══════════════════════════════════════════════════════════

import { validateJSON } from './json-validator.js';

/**
 * @param {string} response - Raw LLM response
 * @param {string} taskType - Only checked for npc_dialogue
 * @returns {{ passed: boolean, optionCount: number, options: string[]|null }}
 */
export function checkOptions(response, taskType) {
  if (taskType !== 'npc_dialogue') {
    return { passed: true, optionCount: 0, options: null };
  }

  const { parsed } = validateJSON(response, taskType);

  if (parsed && Array.isArray(parsed.options)) {
    const options = parsed.options.filter(o => typeof o === 'string' && o.length > 0);
    return {
      passed: options.length >= 3 && options.length <= 4,
      optionCount: options.length,
      options,
    };
  }

  // Check if response contains options-like patterns (numbered list)
  const optionMatches = response.match(/^\s*\d+\.\s+.+/gm);
  if (optionMatches && optionMatches.length >= 3) {
    return {
      passed: optionMatches.length >= 3 && optionMatches.length <= 4,
      optionCount: optionMatches.length,
      options: optionMatches.map(m => m.trim()),
    };
  }

  return { passed: false, optionCount: 0, options: null };
}
