// ═══════════════════════════════════════════════════════════
// SPEC-H001: LLM Testing Harness — Configuration
// Models, gates, thresholds, num_predict defaults.
// ═══════════════════════════════════════════════════════════

import { DEFAULT_MODEL } from '../llm-interface.js';

export const HARNESS_CONFIG = {
  // Default model under test (single source of truth: llm-interface.js)
  defaultModel: DEFAULT_MODEL,

  // Default judge model (more capable)
  defaultJudgeModel: 'qwen2.5:3b',

  // Ollama endpoint
  ollamaUrl: 'http://localhost:11434',

  // Throttle between requests (ms)
  throttleMs: 2000,

  // Token limits
  numPredict: 150,

  // Latency threshold (ms) for p95
  latencyP95Threshold: 2000,

  // Hard gate thresholds
  gates: {
    json_valid: { enabled: true },
    token_count: { enabled: true, max: 150 },
    response_time_p95: { enabled: true, max: 2000 },
    has_options: { enabled: true, min: 3, max: 4 },
    no_repeat: { enabled: true },
    tone_check: { enabled: true },
  },

  // Soft gate (judge) thresholds
  judges: {
    creativity: { enabled: false, threshold: 3.0 },
    coherence: { enabled: false, threshold: 3.0 },
    engagement: { enabled: false, threshold: 3.0 },
    lore_accuracy: { enabled: false, threshold: 3.0 },
  },

  // Re-plan: if hard gate fail rate > 30%, recommend alternative model
  replanThreshold: 0.30,

  // Tasks
  tasks: ['npc_dialogue', 'generate_quest', 'generate_event', 'generate_lore'],

  // Cases per task
  casesPerTask: 10,

  // Results directory
  resultsDir: 'harness/state/results',

  // Patterns file
  patternsFile: 'harness/state/patterns.json',

  // Baselines file
  baselinesFile: 'harness/state/baselines.json',
};

// Models to evaluate (from user's ollama list)
export const AVAILABLE_MODELS = [
  { id: 'gemma3:1b', size: '815 MB', params: '1B', role: 'primary' },
  { id: 'qwen2.5:3b', size: '1.9 GB', params: '3B', role: 'candidate' },
  { id: 'gemma3:4b', size: '3.3 GB', params: '4B', role: 'judge' },
  { id: 'phi4-mini', size: '2.5 GB', params: '3.8B', role: 'alternative' },
  { id: 'gemma3:270m', size: '291 MB', params: '270M', role: 'baseline' },
];

// Banned patterns for tone_check gate
export const BANNED_PATTERNS = [
  /as an ai/i,
  /i cannot/i,
  /i can't/i,
  /i'm sorry/i,
  /language model/i,
  /openai/i,
  /assistant/i,
  /\binternet\b/i,
  /\bcomputer\b/i,
  /\bsoftware\b/i,
  /\breal world\b/i,
  /\biphone\b/i,
  /\bgoogle\b/i,
];

// Cozy fantasy tone keywords (positive signals)
export const TONE_KEYWORDS = [
  'village', 'forest', 'mountain', 'river', 'stone', 'iron', 'gold',
  'adventure', 'quest', 'journey', 'traveler', 'merchant', 'guard',
  'scholar', 'elder', 'herbal', 'potion', 'spell', 'ancient', 'ruins',
  'temple', 'library', 'compass', 'map', 'lantern', 'torch',
];
