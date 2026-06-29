# JardVoxel LLM Testing Harness

Benchmark LLM quality, latency, and reliability for the 4 AI Server tasks.

## Quick Start

```bash
# From ai-server directory
npm run test:llm                          # Default model (gemma3:1b)
npm run test:llm -- --model qwen2.5:3b    # Specific model
npm run test:llm -- --num-predict 200     # Override token limit
npm run test:llm -- --task npc_dialogue   # Single task
npm run test:llm:benchmark -- --models gemma3:1b,qwen2.5:3b,gemma3:4b
```

## Architecture

```
harness/
├── runner.js          # PEV orchestrator + CLI
├── config.js          # Models, gates, thresholds
├── prompt-builder.js  # Task-specific optimized prompts
├── cases/             # 40 test cases (10 per task)
├── gates/             # 6 hard gates
├── reporters/         # JSON + Markdown output
└── state/             # Results + patterns
```

## Tasks

| Task | Type | Output |
|------|------|--------|
| NPC Dialogue | `npc_dialogue` | JSON: text + 3-4 options |
| Quest Generation | `generate_quest` | JSON: type, title, description, objectives, rewards |
| Event Generation | `generate_event` | JSON: type, description, duration, effects |
| Lore Generation | `generate_lore` | Narrative text (max 3 sentences) |

## Hard Gates

| Gate | Criteria |
|------|----------|
| `json_valid` | Quests/events parse as JSON |
| `token_count` | ≤150 tokens (configurable) |
| `response_time_p95` | ≤2000ms p95 |
| `has_options` | NPC dialogue has 3-4 options |
| `no_repeat` | No identical responses in session |
| `tone_check` | Cozy fantasy tone, no AI disclaimers |

## Results

Reports saved to `harness/state/results/` with timestamp:
- `run-{id}-{timestamp}.json` — structured data
- `run-{id}-{timestamp}.md` — human-readable report
