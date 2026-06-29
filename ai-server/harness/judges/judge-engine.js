// ═══════════════════════════════════════════════════════════
// SPEC-H002: Inferential Judges — Judge Engine
// Uses a more capable model to score responses on:
// creativity, coherence, engagement, lore accuracy (1-5).
// ═══════════════════════════════════════════════════════════

import { HARNESS_CONFIG } from '../config.js';

const OLLAMA_URL = HARNESS_CONFIG.ollamaUrl;

/**
 * Judge a single response across all 4 criteria.
 * @param {string} judgeModel - Model to use as judge
 * @param {string} response - LLM response under test
 * @param {string} taskType - Task type
 * @param {object} context - Original test case context
 * @returns {{ creativity: number, coherence: number, engagement: number, loreAccuracy: number, justifications: object }}
 */
export async function judgeResponse(judgeModel, response, taskType, context) {
  if (!response) {
    return { creativity: 0, coherence: 0, engagement: 0, loreAccuracy: 0, justifications: {} };
  }

  const prompt = _buildJudgePrompt(response, taskType, context);

  try {
    const result = await _queryOllama(judgeModel, prompt);
    return _parseJudgeResponse(result);
  } catch (e) {
    return { creativity: 0, coherence: 0, engagement: 0, loreAccuracy: 0, justifications: { error: e.message } };
  }
}

/**
 * Judge multiple responses in batch.
 * @param {string} judgeModel
 * @param {Array<{response, taskType, context}>} items
 * @returns {Array>} Judge results in same order
 */
export async function judgeBatch(judgeModel, items) {
  const results = [];
  for (let i = 0; i < items.length; i++) {
    if (i > 0) await _sleep(HARNESS_CONFIG.throttleMs);
    const { response, taskType, context } = items[i];
    const result = await judgeResponse(judgeModel, response, taskType, context);
    results.push(result);
    console.log(`    Judge: creativity=${result.creativity} coherence=${result.coherence} engagement=${result.engagement} lore=${result.loreAccuracy}`);
  }
  return results;
}

/**
 * Calculate aggregate judge scores.
 * @param {Array} judgeResults
 * @returns {{ avgCreativity, avgCoherence, avgEngagement, avgLore, overall }}
 */
export function aggregateJudgeScores(judgeResults) {
  if (judgeResults.length === 0) {
    return { avgCreativity: 0, avgCoherence: 0, avgEngagement: 0, avgLore: 0, overall: 0 };
  }

  const sum = judgeResults.reduce((acc, r) => ({
    creativity: acc.creativity + r.creativity,
    coherence: acc.coherence + r.coherence,
    engagement: acc.engagement + r.engagement,
    loreAccuracy: acc.loreAccuracy + r.loreAccuracy,
  }), { creativity: 0, coherence: 0, engagement: 0, loreAccuracy: 0 });

  const n = judgeResults.length;
  const avgCreativity = sum.creativity / n;
  const avgCoherence = sum.coherence / n;
  const avgEngagement = sum.engagement / n;
  const avgLore = sum.loreAccuracy / n;
  const overall = (avgCreativity + avgCoherence + avgEngagement + avgLore) / 4;

  return { avgCreativity, avgCoherence, avgEngagement, avgLore, overall };
}

// ── Internal helpers ──

function _buildJudgePrompt(response, taskType, context) {
  const ctxStr = context ? JSON.stringify(context) : '{}';

  return `You are evaluating an AI response for a cozy fantasy voxel game.

Task type: ${taskType}
Context: ${ctxStr}

Response to evaluate:
"${response.substring(0, 500)}"

Score this response on 4 criteria (1-5 scale):
1. creativity: 1=generic/template, 5=unique and surprising
2. coherence: 1=incoherent/contradictory, 5=perfectly contextual
3. engagement: 1=boring/dead-end, 5=invites interaction
4. lore_accuracy: 1=breaks lore/anachronistic, 5=enriches lore

Respond as JSON: {"creativity": N, "coherence": N, "engagement": N, "lore_accuracy": N, "justification": "brief reason"}`;
}

async function _queryOllama(model, prompt) {
  const body = {
    model,
    prompt,
    stream: false,
    options: { temperature: 0.3, top_p: 0.9, num_predict: 200 },
  };

  const resp = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) throw new Error(`Ollama HTTP ${resp.status}`);
  const data = await resp.json();
  return data.response || '';
}

function _parseJudgeResponse(text) {
  // Try JSON parse
  try {
    const parsed = JSON.parse(text.trim());
    return {
      creativity: _clampScore(parsed.creativity),
      coherence: _clampScore(parsed.coherence),
      engagement: _clampScore(parsed.engagement),
      loreAccuracy: _clampScore(parsed.lore_accuracy),
      justifications: { general: parsed.justification || '' },
    };
  } catch (e) {
    // Try extracting JSON
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return {
          creativity: _clampScore(parsed.creativity),
          coherence: _clampScore(parsed.coherence),
          engagement: _clampScore(parsed.engagement),
          loreAccuracy: _clampScore(parsed.lore_accuracy),
          justifications: { general: parsed.justification || '' },
        };
      } catch (e2) {
        // Fall through
      }
    }
  }

  // Fallback: extract numbers
  const numbers = text.match(/\b[1-5]\b/g);
  if (numbers && numbers.length >= 4) {
    return {
      creativity: parseInt(numbers[0]),
      coherence: parseInt(numbers[1]),
      engagement: parseInt(numbers[2]),
      loreAccuracy: parseInt(numbers[3]),
      justifications: { general: 'extracted from text' },
    };
  }

  return { creativity: 0, coherence: 0, engagement: 0, loreAccuracy: 0, justifications: { error: 'parse_failed' } };
}

function _clampScore(n) {
  const num = typeof n === 'number' ? n : parseInt(n);
  if (isNaN(num)) return 0;
  return Math.max(0, Math.min(5, num));
}

function _sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
