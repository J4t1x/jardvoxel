#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// SPEC-H001: LLM Testing Harness — Test Runner
// PEV orchestrator: Plan → Execute → Verify
//
// CLI usage:
//   node harness/runner.js --model gemma3:1b
//   node harness/runner.js --model gemma3:1b --num-predict 200
//   node harness/runner.js --model gemma3:1b --task npc_dialogue
//   node harness/runner.js --benchmark --models gemma3:1b,qwen2.5:3b
// ═══════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { HARNESS_CONFIG } from './config.js';
import { buildPrompt } from './prompt-builder.js';
import { validateJSON } from './gates/json-validator.js';
import { countTokens } from './gates/token-counter.js';
import { checkLatency } from './gates/latency-checker.js';
import { checkOptions } from './gates/options-checker.js';
import { checkRepeat } from './gates/repeat-detector.js';
import { checkTone } from './gates/tone-checker.js';
import { generateJSONReport } from './reporters/json-reporter.js';
import { generateMarkdownReport } from './reporters/md-reporter.js';
import { runBenchmark, saveBenchmarkReport, generateComparativeReport } from './reporters/comparative.js';
import { judgeBatch, aggregateJudgeScores } from './judges/judge-engine.js';
import { runFeedbackLoop } from './feedback-loop.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OLLAMA_URL = HARNESS_CONFIG.ollamaUrl;
const THROTTLE_MS = HARNESS_CONFIG.throttleMs;

// ── CLI arg parsing ──

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    model: HARNESS_CONFIG.defaultModel,
    numPredict: HARNESS_CONFIG.numPredict,
    task: null,
    benchmark: false,
    models: null,
    judge: null,
    feedback: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--model':
        opts.model = args[++i];
        break;
      case '--num-predict':
        opts.numPredict = parseInt(args[++i]);
        break;
      case '--task':
        opts.task = args[++i];
        break;
      case '--benchmark':
        opts.benchmark = true;
        break;
      case '--models':
        opts.models = args[++i].split(',');
        break;
      case '--judge':
        opts.judge = args[++i];
        break;
      case '--feedback':
        opts.feedback = true;
        break;
      case '--help':
      case '-h':
        console.log(`JardVoxel LLM Testing Harness

Usage:
  node harness/runner.js [options]

Options:
  --model <model>          Model to test (default: ${HARNESS_CONFIG.defaultModel})
  --num-predict <n>        Max tokens (default: ${HARNESS_CONFIG.numPredict})
  --task <task>            Run only one task (npc_dialogue, generate_quest, generate_event, generate_lore)
  --benchmark              Run in benchmark mode (multiple models)
  --models <m1,m2,...>     Comma-separated list of models for benchmark
  --judge <model>          Judge model for inferential scoring
  --feedback               Enable feedback loop analysis
  -h, --help               Show this help

Examples:
  node harness/runner.js --model gemma3:1b
  node harness/runner.js --model gemma3:1b --num-predict 200
  node harness/runner.js --benchmark --models gemma3:1b,qwen2.5:3b,gemma3:4b
  node harness/runner.js --model gemma3:1b --task npc_dialogue
`);
        process.exit(0);
    }
  }

  return opts;
}

// ── Load test cases ──

function loadCases(taskType) {
  const fileMap = {
    npc_dialogue: 'npc-dialogue.json',
    generate_quest: 'quest-generation.json',
    generate_event: 'event-generation.json',
    generate_lore: 'lore-generation.json',
  };
  const filepath = path.join(__dirname, 'cases', fileMap[taskType]);
  const raw = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(raw);
}

// ── Query Ollama directly (no LLMInterface) ──

async function queryOllama(model, prompt, numPredict) {
  const body = {
    model,
    prompt,
    stream: false,
    options: {
      temperature: 0.7,
      top_p: 0.9,
      num_predict: numPredict,
    },
  };

  const start = Date.now();
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
  const data = await response.json();
  const latency = Date.now() - start;

  return {
    response: data.response || '',
    latency,
    tokens: data.eval_count || 0,
  };
}

// ── Run gates on a response ──

function runGates(response, taskType, latency, seenResponses) {
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

// ── Run a single model through all tasks ──

async function runModel(model, numPredict, taskFilter = null) {
  const runId = `RUN-${Date.now()}`;
  const tasks = taskFilter ? [taskFilter] : HARNESS_CONFIG.tasks;
  const results = {
    runId,
    model,
    numPredict,
    tasks: {},
  };

  let totalCases = 0;
  let totalPassed = 0;
  let allLatencies = [];
  let totalJSONValid = 0;
  let totalOptionsPassed = 0;
  let totalToneViolations = 0;
  let totalRepeats = 0;

  for (const taskType of tasks) {
    const cases = loadCases(taskType);
    const seenResponses = new Set();
    const taskResult = { cases: [] };

    console.log(`\n▶ Task: ${taskType} (${cases.length} cases)`);

    for (let i = 0; i < cases.length; i++) {
      const testCase = cases[i];
      const prompt = buildPrompt(taskType, testCase);

      try {
        // Throttle
        if (i > 0) await sleep(THROTTLE_MS);

        const { response, latency } = await queryOllama(model, prompt, numPredict);
        allLatencies.push(latency);

        const gates = runGates(response, taskType, latency, seenResponses);
        const allPassed = Object.values(gates).every(v => v === true);

        if (allPassed) totalPassed++;
        if (gates.json_valid) totalJSONValid++;
        if (gates.has_options) totalOptionsPassed++;
        if (!gates.tone_check) totalToneViolations++;
        if (!gates.no_repeat) totalRepeats++;

        const tokenResult = countTokens(response, HARNESS_CONFIG.gates.token_count.max);

        taskResult.cases.push({
          id: testCase.id,
          response: response.substring(0, 500),
          latency,
          gates,
          token_count: tokenResult.count,
          token_max: HARNESS_CONFIG.gates.token_count.max,
        });

        totalCases++;

        const status = allPassed ? '✓' : '✗';
        console.log(`  ${status} ${testCase.id} (${latency}ms, ${tokenResult.count} tokens)`);
      } catch (e) {
        taskResult.cases.push({
          id: testCase.id,
          response: null,
          latency: 0,
          gates: { json_valid: false, token_count: false, has_options: false, no_repeat: false, tone_check: false, response_time: false },
          error: e.message,
        });
        totalCases++;
        console.log(`  ✗ ${testCase.id} (ERROR: ${e.message})`);
      }
    }

    results.tasks[taskType] = taskResult;
  }

  // Calculate summary
  const latencyResult = checkLatency(allLatencies, HARNESS_CONFIG.latencyP95Threshold);
  results.summary = {
    totalCases,
    hardGatePassRate: totalCases > 0 ? totalPassed / totalCases : 0,
    p95Latency: latencyResult.p95,
    p50Latency: latencyResult.p50,
    jsonValidityRate: totalCases > 0 ? totalJSONValid / totalCases : 0,
    optionsPassRate: totalCases > 0 ? totalOptionsPassed / totalCases : 0,
    toneViolations: totalToneViolations,
    repeatRate: totalCases > 0 ? totalRepeats / totalCases : 0,
  };

  return results;
}

// ── Main ──

async function main() {
  const opts = parseArgs();

  console.log('═══════════════════════════════════════════════════════');
  console.log('  JardVoxel LLM Testing Harness');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Model: ${opts.model}`);
  console.log(`  num_predict: ${opts.numPredict}`);
  console.log(`  Ollama: ${OLLAMA_URL}`);

  // Check Ollama availability
  try {
    const resp = await fetch(`${OLLAMA_URL}/api/tags`, { method: 'GET' });
    if (!resp.ok) throw new Error('not ok');
    console.log('  Ollama: ✓ Available');
  } catch (e) {
    console.error('  Ollama: ✗ Not available. Start Ollama first.');
    process.exit(1);
  }

  if (opts.benchmark && opts.models) {
    // SPEC-H003: Benchmark mode using comparative module
    console.log(`\n  Mode: Benchmark (${opts.models.length} models)`);

    const benchmark = await runBenchmark(opts.models, opts.numPredict, opts.task);

    // Print comparative table
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Comparative Results');
    console.log('═══════════════════════════════════════════════════════');
    console.log('| Model | Pass% | JSON% | Opt% | p50ms | p95ms | Score |');
    console.log('|-------|-------|-------|------|-------|-------|-------|');
    for (const r of benchmark.rankings) {
      console.log(`| ${r.model} | ${(r.hardGatePassRate * 100).toFixed(0)}% | ${(r.jsonValidityRate * 100).toFixed(0)}% | ${(r.optionsPassRate * 100).toFixed(0)}% | ${r.p50Latency} | ${r.p95Latency} | ${r.weightedScore.toFixed(2)} |`);
    }

    // Print rankings
    console.log('\n  Rankings:');
    console.log(`    Best overall: ${benchmark.bestOverall}`);
    for (const [task, model] of Object.entries(benchmark.bestPerTask)) {
      console.log(`    Best ${task}: ${model}`);
    }
    console.log(`    Fallback order: ${benchmark.fallbackOrder.join(' → ')}`);

    // Save reports
    const { jsonPath, mdPath } = saveBenchmarkReport(benchmark);
    console.log(`\n  Benchmark JSON: ${jsonPath}`);
    console.log(`  Benchmark MD:   ${mdPath}`);
  } else {
    // Single model mode
    const results = await runModel(opts.model, opts.numPredict, opts.task);

    // SPEC-H002: Run inferential judges if --judge specified
    if (opts.judge) {
      console.log(`\n  Running inferential judges with: ${opts.judge}`);
      const judgeItems = [];
      for (const [taskType, taskResult] of Object.entries(results.tasks)) {
        for (const c of taskResult.cases) {
          if (c.response) {
            judgeItems.push({ response: c.response, taskType, context: {} });
          }
        }
      }
      if (judgeItems.length > 0) {
        const judgeResults = await judgeBatch(opts.judge, judgeItems);
        const agg = aggregateJudgeScores(judgeResults);
        results.judgeScores = { perCase: judgeResults, aggregate: agg };
        console.log(`\n  Judge Scores:`);
        console.log(`    Creativity:   ${agg.avgCreativity.toFixed(1)}/5`);
        console.log(`    Coherence:    ${agg.avgCoherence.toFixed(1)}/5`);
        console.log(`    Engagement:   ${agg.avgEngagement.toFixed(1)}/5`);
        console.log(`    Lore accuracy:${agg.avgLore.toFixed(1)}/5`);
        console.log(`    Overall:      ${agg.overall.toFixed(1)}/5`);
      }
    }

    // Print summary
    const s = results.summary;
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Summary');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  Total cases: ${s.totalCases}`);
    console.log(`  Hard gate pass rate: ${(s.hardGatePassRate * 100).toFixed(1)}%`);
    console.log(`  p50 latency: ${s.p50Latency}ms`);
    console.log(`  p95 latency: ${s.p95Latency}ms`);
    console.log(`  JSON validity: ${(s.jsonValidityRate * 100).toFixed(1)}%`);
    console.log(`  Options pass: ${(s.optionsPassRate * 100).toFixed(1)}%`);
    console.log(`  Tone violations: ${s.toneViolations}`);
    console.log(`  Repeat rate: ${(s.repeatRate * 100).toFixed(1)}%`);

    // Save reports
    const jsonPath = generateJSONReport(results);
    const mdReport = generateMarkdownReport(results);
    const mdPath = path.join(path.dirname(jsonPath), path.basename(jsonPath, '.json') + '.md');
    fs.writeFileSync(mdPath, mdReport);
    console.log(`\n  JSON report: ${jsonPath}`);
    console.log(`  MD report:   ${mdPath}`);

    // Re-plan recommendation
    if (s.hardGatePassRate < 1 - HARNESS_CONFIG.replanThreshold) {
      console.log(`\n  ⚠ Fail rate > 30%. Consider testing alternative model.`);
    }

    // SPEC-H004: Feedback loop analysis
    if (opts.feedback) {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('  Feedback Loop Analysis');
      console.log('═══════════════════════════════════════════════════════');
      const { patterns, degradation, recommendations } = runFeedbackLoop();

      if (patterns.length > 0) {
        console.log(`\n  Patterns detected (${patterns.length}):`);
        for (const p of patterns) {
          console.log(`    [${p.severity.toUpperCase()}] ${p.key} (${p.count}x) — ${p.recommendation}`);
        }
      } else {
        console.log('\n  No patterns detected.');
      }

      if (degradation.length > 0) {
        console.log(`\n  Model degradation detected:`);
        for (const d of degradation) {
          console.log(`    ${d.model}: dropped ${d.drop.toFixed(1)}% (from ${(d.previous * 100).toFixed(0)}% to ${(d.recent * 100).toFixed(0)}%)`);
        }
      }

      if (recommendations.length > 0) {
        console.log(`\n  Recommendations:`);
        for (const r of recommendations) {
          console.log(`    [${r.type}] ${r.model}: ${r.reason}`);
          console.log(`      → ${r.action}`);
        }
      }

      console.log(`\n  Patterns saved: harness/state/patterns.json`);
      console.log(`  Decisions saved: harness/state/decisions.json`);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(e => {
  console.error('Harness error:', e);
  process.exit(1);
});
