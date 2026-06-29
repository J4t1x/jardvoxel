// ═══════════════════════════════════════════════════════════
// SPEC-H001: LLM Testing Harness — Prompt Builder
// Task-specific optimized prompts. Does NOT use _buildPrompt
// from llm-interface.js (that's the system under test).
// ═══════════════════════════════════════════════════════════

/**
 * Build a prompt for a specific task type.
 * These prompts are optimized for small models (1B-4B params).
 * They avoid conflicting instructions and are explicit about format.
 *
 * @param {string} taskType - npc_dialogue | generate_quest | generate_event | generate_lore
 * @param {object} testCase - Test case with context data
 * @returns {string} Complete prompt string
 */
export function buildPrompt(taskType, testCase) {
  const ctx = testCase.context || {};

  switch (taskType) {
    case 'npc_dialogue':
      return _buildNPCDialoguePrompt(ctx, testCase);
    case 'generate_quest':
      return _buildQuestPrompt(ctx, testCase);
    case 'generate_event':
      return _buildEventPrompt(ctx, testCase);
    case 'generate_lore':
      return _buildLorePrompt(ctx, testCase);
    default:
      throw new Error(`Unknown task type: ${taskType}`);
  }
}

function _contextBlock(ctx) {
  const entries = Object.entries(ctx).filter(([k, v]) => v != null);
  if (entries.length === 0) return '';
  const lines = entries.map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
  return `Context:\n${lines.join('\n')}\n\n`;
}

function _buildNPCDialoguePrompt(ctx, testCase) {
  const npc = testCase.npc || {};
  const parts = [];

  if (npc.name) parts.push(`NPC: ${npc.name} (${npc.profession || 'villager'}, ${npc.personality || 'friendly'})`);
  if (npc.mood) parts.push(`Mood: ${npc.mood}`);
  if (npc.relationship !== undefined) parts.push(`Relationship: ${npc.relationship}`);

  const npcBlock = parts.length > 0 ? parts.join('\n') + '\n\n' : '';
  const ctxBlock = ctx.playerContext ? `Player context: ${JSON.stringify(ctx.playerContext)}\n\n` : '';

  return `${npcBlock}${ctxBlock}Generate a response and 3-4 player options.

Respond as JSON: {"text": "...", "options": ["...", "...", "..."], "relationshipChange": 0}`;
}

function _buildQuestPrompt(ctx, testCase) {
  const ctxBlock = _contextBlock(ctx);
  return `${ctxBlock}Generate a quest for the player.

Return JSON with this exact structure:
{"type": "fetch|explore|talk|craft", "title": "...", "description": "...", "objectives": [...], "rewards": [...]}

Respond with ONLY the JSON, no other text.`;
}

function _buildEventPrompt(ctx, testCase) {
  const ctxBlock = _contextBlock(ctx);
  return `${ctxBlock}Generate an emergent event for the game world.

Return JSON with this exact structure:
{"type": "storm|festival|discovery|danger|mystery", "description": "...", "duration": 300, "effects": [...]}

Respond with ONLY the JSON, no other text.`;
}

function _buildLorePrompt(ctx, testCase) {
  const ctxBlock = _contextBlock(ctx);
  return `${ctxBlock}Generate atmospheric lore text for this location or subject.

Respond with evocative narrative text (max 3 sentences). Keep it cozy and mysterious.`;
}
