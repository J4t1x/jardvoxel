// ═══════════════════════════════════════════════════════════
// SPEC-H003: Comparative Benchmark + Model Ranker
// Runs all models through the test suite and produces
// a comparative matrix with rankings and recommendations.
// ═══════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { HARNESS_CONFIG } from '../config.js';
import { buildPrompt } from '../prompt-builder.js';
import { validateJSON } from '../gates/json-validator.js';
import { countTokens } from '../gates/token-counter.js';
import { checkLatency } from '../gates/latency-checker.js';
import { checkOptions } from '../gates/options-checker.js';
import { checkRepeat } from '../gates/repeat-detector.js';
import { checkTone } from '../gates/tone-checker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OLLAMA_URL = HARNESS_CONFIG.ollamaUrl;
const THROTTLE_MS = HARNESS_CONFIG.throttleMs;

// ── Run one model through all tasks ──

async function runModelInternal(model, numPredict, taskFilter = null) {
  const tasks = taskFilter ? [taskFilter] : HARNESS_CONFIG.tasks;
  const results = { model, numPredict, tasks: {} };

  let totalCases = 0;
  let totalPassed = 0;
  let allLatencies = [];
  let totalJSONValid = 0;
  let totalOptionsPassed = 0;
  let totalToneViolations = 0;
  let totalRepeats = 0;

  // Per-task stats for ranking
  const perTaskStats = {};

  for (const taskType of tasks) {
    const cases = _loadCases(taskType);
    const seenResponses = new Set();
    const taskCases = [];
    let taskPassed = 0;

    for (let i = 0; i < cases.length; i++) {
      const testCase = cases[i];
      const prompt = buildPrompt(taskType, testCase);

      try {
        if (i > 0) await _sleep(THROTTLE_MS);
        const { response, latency } = await _queryOllama(model, prompt, numPredict);
        allLatencies.push(latency);

        const gates = _runGates(response, taskType, latency, seenResponses);
        const allPassed = Object.values(gates).every(v => v === true);

        if (allPassed) { totalPassed++; taskPassed++; }
        if (gates.json_valid) totalJSONValid++;
        if (gates.has_options) totalOptionsPassed++;
        if (!gates.tone_check) totalToneViolations++;
        if (!gates.no_repeat) totalRepeats++;

        taskCases.push({ id: testCase.id, response: response.substring(0, 500), latency, gates });
        totalCases++;
      } catch (e) {
        taskCases.push({ id: testCase.id, response: null, latency: 0, gates: {}, error: e.message });
        totalCases++;
      }
    }

    const taskPassRate = cases.length > 0 ? taskPassed / cases.length : 0;
    perTaskStats[taskType] = { passRate: taskPassRate, passed: taskPassed, total: cases.length };
    results.tasks[taskType] = { cases: taskCases, passRate: taskPassRate };
  }

  const latencyResult = checkLatency(allLatencies, HARNESS_CONFIG.latencyP95Threshold);
  results.summary = {
    totalCases,
    hardGatePassRate: totalCases > 0 ? totalPassed / totalCases : 0,
    p50Latency: latencyResult.p50,
    p95Latency: latencyResult.p95,
    p99Latency: latencyResult.p99,
    jsonValidityRate: totalCases > 0 ? totalJSONValid / totalCases : 0,
    optionsPassRate: totalCases > 0 ? totalOptionsPassed / totalCases : 0,
    toneViolations: totalToneViolations,
    repeatRate: totalCases > 0 ? totalRepeats / totalCases : 0,
    perTask: perTaskStats,
  };

  return results;
}

// ── Run benchmark across multiple models ──

export async function runBenchmark(models, numPredict, taskFilter = null) {
  const allResults = [];

  for (const model of models) {
    console.log(`\n${'─'.repeat(55)}`);
    console.log(`  Benchmarking: ${model}`);
    console.log('─'.repeat(55));

    const results = await runModelInternal(model, numPredict, taskFilter);
    allResults.push(results);

    const s = results.summary;
    console.log(`  Pass rate: ${(s.hardGatePassRate * 100).toFixed(1)}%`);
    console.log(`  p95 latency: ${s.p95Latency}ms`);
    console.log(`  JSON validity: ${(s.jsonValidityRate * 100).toFixed(1)}%`);
  }

  return rankModels(allResults);
}

// ── Rank models ──

export function rankModels(allResults) {
  const rankings = allResults.map(r => {
    const s = r.summary;
    // Weighted score: 50% hard gates, 20% JSON validity, 15% latency, 15% options
    const latencyScore = s.p95Latency > 0 ? Math.max(0, 1 - (s.p95Latency / HARNESS_CONFIG.latencyP95Threshold)) : 0;
    const weightedScore =
      (s.hardGatePassRate * 0.50) +
      (s.jsonValidityRate * 0.20) +
      (latencyScore * 0.15) +
      (s.optionsPassRate * 0.15);

    return {
      model: r.model,
      weightedScore,
      hardGatePassRate: s.hardGatePassRate,
      jsonValidityRate: s.jsonValidityRate,
      optionsPassRate: s.optionsPassRate,
      p50Latency: s.p50Latency,
      p95Latency: s.p95Latency,
      p99Latency: s.p99Latency,
      toneViolations: s.toneViolations,
      repeatRate: s.repeatRate,
      perTask: s.perTask,
    };
  });

  // Sort by weighted score descending
  rankings.sort((a, b) => b.weightedScore - a.weightedScore);

  // Best model per task
  const bestPerTask = {};
  for (const taskType of HARNESS_CONFIG.tasks) {
    let best = null;
    let bestRate = -1;
    for (const r of rankings) {
      const taskStat = r.perTask[taskType];
      if (taskStat && taskStat.passRate > bestRate) {
        bestRate = taskStat.passRate;
        best = r.model;
      }
    }
    bestPerTask[taskType] = best;
  }

  // Fallback order (best → worst)
  const fallbackOrder = rankings.map(r => r.model);

  return {
    rankings,
    bestOverall: rankings[0]?.model || null,
    bestPerTask,
    fallbackOrder,
    results: allResults,
  };
}

// ── Generate comparative Markdown report ──

export function generateComparativeReport(benchmark) {
  const lines = [];
  lines.push('# LLM Testing Harness — Comparative Benchmark');
  lines.push('');
  lines.push(`**Date:** ${new Date().toISOString()}`);
  lines.push(`**Models tested:** ${benchmark.rankings.length}`);
  lines.push('');

  // Comparative matrix
  lines.push('## Comparative Matrix');
  lines.push('');
  lines.push('| Model | Pass% | JSON% | Options% | p50ms | p95ms | p99ms | Repeats | Tone | Score |');
  lines.push('|-------|-------|-------|----------|-------|-------|-------|---------|------|-------|');
  for (const r of benchmark.rankings) {
    lines.push(`| ${r.model} | ${(r.hardGatePassRate * 100).toFixed(0)}% | ${(r.jsonValidityRate * 100).toFixed(0)}% | ${(r.optionsPassRate * 100).toFixed(0)}% | ${r.p50Latency} | ${r.p95Latency} | ${r.p99Latency} | ${(r.repeatRate * 100).toFixed(1)}% | ${r.toneViolations} | ${r.weightedScore.toFixed(2)} |`);
  }
  lines.push('');

  // Per-task breakdown
  lines.push('## Per-Task Pass Rates');
  lines.push('');
  lines.push('| Model | NPC | Quest | Event | Lore |');
  lines.push('|-------|-----|-------|-------|------|');
  for (const r of benchmark.rankings) {
    const npc = r.perTask.npc_dialogue ? `${(r.perTask.npc_dialogue.passRate * 100).toFixed(0)}%` : '-';
    const quest = r.perTask.generate_quest ? `${(r.perTask.generate_quest.passRate * 100).toFixed(0)}%` : '-';
    const event = r.perTask.generate_event ? `${(r.perTask.generate_event.passRate * 100).toFixed(0)}%` : '-';
    const lore = r.perTask.generate_lore ? `${(r.perTask.generate_lore.passRate * 100).toFixed(0)}%` : '-';
    lines.push(`| ${r.model} | ${npc} | ${quest} | ${event} | ${lore} |`);
  }
  lines.push('');

  // Rankings
  lines.push('## Rankings');
  lines.push('');
  lines.push(`**Best overall:** ${benchmark.bestOverall || 'N/A'}`);
  lines.push('');
  lines.push('**Best per task:**');
  for (const [task, model] of Object.entries(benchmark.bestPerTask)) {
    lines.push(`- ${task}: ${model || 'N/A'}`);
  }
  lines.push('');

  // Fallback order
  lines.push('**Recommended fallback order:**');
  lines.push('');
  for (let i = 0; i < benchmark.fallbackOrder.length; i++) {
    lines.push(`${i + 1}. ${benchmark.fallbackOrder[i]}`);
  }
  lines.push('');

  // Scoring methodology
  lines.push('## Scoring Methodology');
  lines.push('');
  lines.push('| Component | Weight |');
  lines.push('|-----------|--------|');
  lines.push('| Hard gate pass rate | 50% |');
  lines.push('| JSON validity rate | 20% |');
  lines.push('| Latency score (p95) | 15% |');
  lines.push('| Options pass rate | 15% |');
  lines.push('');

  return lines.join('\n');
}

// ── Save benchmark results ──

export function saveBenchmarkReport(benchmark) {
  const resultsDir = path.join(__dirname, '..', 'state', 'results');
  fs.mkdirSync(resultsDir, { recursive: true });

  const timestamp = Date.now();

  // JSON
  const jsonPath = path.join(resultsDir, `benchmark-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(benchmark, null, 2));

  // Markdown
  const mdReport = generateComparativeReport(benchmark);
  const mdPath = path.join(resultsDir, `benchmark-${timestamp}.md`);
  fs.writeFileSync(mdPath, mdReport);

  return { jsonPath, mdPath };
}

// ── Helpers ──

function _loadCases(taskType) {
  const fileMap = {
    npc_dialogue: 'npc-dialogue.json',
    generate_quest: 'quest-generation.json',
    generate_event: 'event-generation.json',
    generate_lore: 'lore-generation.json',
  };
  const filepath = path.join(__dirname, '..', 'cases', fileMap[taskType]);
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

async function _queryOllama(model, prompt, numPredict) {
  const body = {
    model,
    prompt,
    stream: false,
    options: { temperature: 0.7, top_p: 0.9, num_predict: numPredict },
  };

  const start = Date.now();
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
  const data = await response.json();
  return { response: data.response || '', latency: Date.now() - start };
}

function _runGates(response, taskType, latency, seenResponses) {
  const jsonResult = validateJSON(response, taskType);
  const tokenResult = countTokens(response, HARNESS_CONFIG.gates.token_count.max);
  const optionsResult = checkOptions(response, taskType);
  const repeatResult = checkRepeat(response, seenResponses);
  const toneResult = checkTone(response);

  return {
    json_valid: jsonResult.passed,
    token_count: tokenResult.passed,
    has_options: optionsResult.passed,
    no_repeat: repeatResult.passed,
    tone_check: toneResult.passed,
    response_time: latency <= HARNESS_CONFIG.latencyP95Threshold,
  };
}

function _sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
