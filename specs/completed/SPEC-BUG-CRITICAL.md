---
spec_id: SPEC-BUG-CRITICAL
title: "Fix critical bugs in JardVoxel — seed mismatch, structure placement, survival inventory"
priority: critical
estimated_time: 30min
status: pending
created_at: 2026-06-25
---

# SPEC-BUG-CRITICAL: Fix Critical Bugs in JardVoxel

## Requirements

Fix 3 critical bugs identified in BUGS-FOUND.md that break core gameplay.

## Bugs

### BUG-001: Worker seed mismatch
- **File:** `jardvoxel-worker.js`
- **Issue:** Worker hardcodes seed 42, main thread uses random seed
- **Fix:** Pass seed via postMessage init message

### BUG-002: _setBlockSafe only overwrites AIR
- **File:** `jardvoxel-engine.js:1404-1411`
- **Issue:** Structures can't place non-wood blocks on terrain
- **Fix:** Add force parameter, use force=true in structure methods

### BUG-003: Survival mode doesn't check inventory
- **File:** `jardvoxel.html:665-679`
- **Issue:** _placeBlock doesn't check/decrement inventory in survival
- **Fix:** Add inventory count check and decrement

## Acceptance Criteria

- [ ] Worker receives seed from main thread via init message
- [ ] Worker uses same WorldGenerator seed as main thread
- [ ] _setBlockSafe has force parameter for structure placement
- [ ] All _place* structure methods use force=true
- [ ] _placeBlock checks inventory count in survival mode
- [ ] _placeBlock decrements inventory after placing in survival mode
- [ ] No regressions in creative mode behavior
