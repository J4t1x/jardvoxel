# PRD: JardVoxel Zen Performance Optimization

**Version**: 1.0
**Date**: 2026-07-01
**Target**: v8.1.0 — Zen Optimized

## Objective

Optimize JardVoxel Zen's render loop and memory management to achieve stable 60fps at render distance 16 on mid-range hardware, eliminating GC spikes and reducing per-frame CPU overhead.

## Background

Performance audit of v8.0.0 identified 5 bottlenecks:
1. Per-frame garbage from string key parsing in chunk manager (hundreds of temp arrays per 0.15s)
2. 6x redundant biome/block lookups per frame in animate loop (~360 unnecessary calls/sec)
3. Minimap scanning ~1800 getBlock() calls per update
4. Chunk object pool declared but never used (constant allocation/deallocation of 64KB arrays)
5. Pixel ratio regression (capped at 1.0 instead of 1.5, causing blurry rendering on Retina)

## Specs

| Spec | Title | Priority | Effort | Status |
|------|-------|----------|--------|--------|
| SPEC-PERF-001 | Eliminate string key parsing garbage | High | 3h | ✅ Implemented (2026-06-29) |
| SPEC-PERF-002 | Cache biome/block lookups in animate | High | 2h | ✅ Completed |
| SPEC-PERF-003 | Minimap heightmap optimization | Medium | 2h | ✅ Completed |
| SPEC-PERF-004 | Chunk object pooling | Medium | 3h | ✅ Completed |
| FIX-PERF-005 | Pixel ratio regression fix | High | 0.1h | ✅ Applied |

**Total estimated effort**: 10h

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| GC events per minute (render dist 16) | ~20-30 | <5 |
| getBiome() calls per frame | 7 (1 cached + 6 redundant) | 1 |
| getBlock() calls per frame (non-cached) | ~10 | 2 |
| Minimap getBlock() calls per update | ~1800 | <900 |
| Chunk allocations per minute (steady state) | ~30-50 | 0 (pool warm) |
| Pixel ratio on Retina | 1.0 (blurry) | 1.5 (sharp) |
| FPS at render distance 16 | ~45-55 | 60 stable |

## Execution

```bash
/cascade-dev SPEC-PERF-001
/cascade-dev SPEC-PERF-002
/cascade-dev SPEC-PERF-003
/cascade-dev SPEC-PERF-004
```

## Dependencies

- SPEC-PERF-001 has no dependencies
- SPEC-PERF-002 has no dependencies
- SPEC-PERF-003 depends on heightmap data from chunk manager (already available)
- SPEC-PERF-004 has no dependencies
- All specs can be executed in parallel or any order
