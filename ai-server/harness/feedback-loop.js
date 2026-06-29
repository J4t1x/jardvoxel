// ═══════════════════════════════════════════════════════════
// SPEC-H004: Feedback Loop + Pattern Detector
// Analyzes historical results to detect recurring failures,
// track model degradation, and recommend model switches.
// ═══════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { HARNESS_CONFIG } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PATTERNS_FILE = path.join(__dirname, 'state', 'patterns.json');
const RESULTS_DIR = path.join(__dirname, 'state', 'results');
const DECISIONS_FILE = path.join(__dirname, 'state', 'decisions.json');

// ── Pattern Detector ──

/**
 * Load historical results from the last N runs.
 * @param {number} maxRuns - Max runs to load (default 5)
 * @returns {Array} Array of result objects
 */
export function loadHistoricalResults(maxRuns = 5) {
  if (!fs.existsSync(RESULTS_DIR)) return [];

  const files = fs.readdirSync(RESULTS_DIR)
    .filter(f => f.startsWith('run-') && f.endsWith('.json'))
    .sort()
    .reverse()
    .slice(0, maxRuns);

  return files.map(f => {
    try {
      return JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, f), 'utf-8'));
    } catch (e) {
      return null;
    }
  }).filter(Boolean);
}

/**
 * Detect recurring failure patterns from historical results.
 * @param {Array} historicalResults
 * @returns {Array} Detected patterns
 */
export function detectPatterns(historicalResults) {
  const patterns = [];
  const gateFailCounts = {};
  const toneViolationCounts = {};
  const judgeLowScores = {};

  for (const result of historicalResults) {
    if (!result.tasks) continue;

    for (const [taskType, taskResult] of Object.entries(result.tasks)) {
      for (const c of taskResult.cases || []) {
        // Gate failures
        for (const [gate, passed] of Object.entries(c.gates || {})) {
          if (passed === false) {
            const key = `${taskType}.${gate}`;
            gateFailCounts[key] = (gateFailCounts[key] || 0) + 1;
          }
        }

        // Tone violations
        if (c.gates?.tone_check === false) {
          toneViolationCounts[taskType] = (toneViolationCounts[taskType] || 0) + 1;
        }
      }
    }

    // Judge scores
    if (result.judgeScores?.perCase) {
      for (const judge of result.judgeScores.perCase) {
        if (judge.creativity < 3) judgeLowScores.creativity = (judgeLowScores.creativity || 0) + 1;
        if (judge.coherence < 3) judgeLowScores.coherence = (judgeLowScores.coherence || 0) + 1;
        if (judge.engagement < 3) judgeLowScores.engagement = (judgeLowScores.engagement || 0) + 1;
        if (judge.loreAccuracy < 3) judgeLowScores.lore = (judgeLowScores.lore || 0) + 1;
      }
    }
  }

  // Gate fail patterns (≥3 occurrences)
  for (const [key, count] of Object.entries(gateFailCounts)) {
    if (count >= 3) {
      patterns.push({
        type: 'gate_failure',
        key,
        count,
        severity: count >= 10 ? 'systemic' : count >= 5 ? 'critical' : 'pattern',
        recommendation: count >= 10
          ? `BLOCK model — ${key} failed ${count} times. Manual audit required.`
          : count >= 5
            ? `ALERT — ${key} failed ${count} times. Consider model switch.`
            : `Pattern detected — ${key} failed ${count} times. Preventive rule proposed.`,
      });
    }
  }

  // Tone violation patterns (≥2 occurrences)
  for (const [task, count] of Object.entries(toneViolationCounts)) {
    if (count >= 2) {
      patterns.push({
        type: 'tone_violation',
        key: `${task}.tone`,
        count,
        severity: count >= 5 ? 'critical' : 'pattern',
        recommendation: `Tone violations in ${task} (${count}x). Review prompt or add tone guard.`,
      });
    }
  }

  // Judge low score patterns (≥3 occurrences)
  for (const [criterion, count] of Object.entries(judgeLowScores)) {
    if (count >= 3) {
      patterns.push({
        type: 'low_judge_score',
        key: criterion,
        count,
        severity: 'pattern',
        recommendation: `Judge score <3 for ${criterion} (${count}x). Model may lack ${criterion}.`,
      });
    }
  }

  return patterns;
}

/**
 * Save detected patterns to state file.
 * @param {Array} patterns
 */
export function savePatterns(patterns) {
  const data = { patterns, version: 1, updatedAt: new Date().toISOString() };
  fs.writeFileSync(PATTERNS_FILE, JSON.stringify(data, null, 2));
}

/**
 * Load existing patterns.
 * @returns {Array}
 */
export function loadPatterns() {
  try {
    const data = JSON.parse(fs.readFileSync(PATTERNS_FILE, 'utf-8'));
    return data.patterns || [];
  } catch (e) {
    return [];
  }
}

// ── Model Ranker / Degradation Detection ──

/**
 * Track model performance across runs and detect degradation.
 * @param {Array} historicalResults
 * @returns {{ degradation: Array, recommendations: Array }}
 */
export function detectDegradation(historicalResults) {
  const modelPerformance = {};

  for (const result of historicalResults) {
    const model = result.model;
    if (!model) continue;

    if (!modelPerformance[model]) {
      modelPerformance[model] = [];
    }

    modelPerformance[model].push({
      passRate: result.summary?.hardGatePassRate || 0,
      timestamp: result.timestamp || result.runId,
    });
  }

  const degradation = [];
  const recommendations = [];

  for (const [model, runs] of Object.entries(modelPerformance)) {
    if (runs.length < 2) continue;

    const recent = runs[0].passRate;
    const previous = runs[runs.length - 1].passRate;
    const drop = previous - recent;

    if (drop > 0.20) {
      degradation.push({ model, drop: drop * 100, previous, recent });
      recommendations.push({
        type: 'model_switch',
        model,
        reason: `Quality dropped ${ (drop * 100).toFixed(1)}% (from ${(previous * 100).toFixed(0)}% to ${(recent * 100).toFixed(0)}%)`,
        action: `Consider switching from ${model} to alternative model.`,
      });
    }

    // Auto-switch: if model fails >50% hard gates
    if (recent < 0.50) {
      recommendations.push({
        type: 'auto_switch',
        model,
        reason: `Pass rate below 50% (${(recent * 100).toFixed(0)}%)`,
        action: `Switch ${model} to fallback model immediately.`,
      });
    }
  }

  return { degradation, recommendations };
}

/**
 * Save decisions log.
 * @param {Array} recommendations
 */
export function saveDecisions(recommendations) {
  const data = {
    decisions: recommendations,
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(DECISIONS_FILE, JSON.stringify(data, null, 2));
}

// ── Full feedback loop analysis ──

/**
 * Run full feedback loop: load history, detect patterns,
 * check degradation, save results.
 * @returns {{ patterns: Array, degradation: Array, recommendations: Array }}
 */
export function runFeedbackLoop() {
  const history = loadHistoricalResults();
  const patterns = detectPatterns(history);
  const { degradation, recommendations } = detectDegradation(history);

  savePatterns(patterns);
  saveDecisions(recommendations);

  return { patterns, degradation, recommendations };
}
