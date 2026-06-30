# SPEC-PERF-002: Cache Biome/Block Lookups in Animate Loop

**Priority**: High
**Estimated effort**: 2h
**Files affected**: `core/jardvoxel-zen-game.js`

## Problem

The `animate()` method caches per-frame values in `this._frame` (line 1051), including `biome`, `headBlock`, and `eyeBlock`. However, at least 6 places in the same animate loop ignore this cache and call `this.world.getBiome()` or `this.world.getBlock()` directly, doing redundant world lookups every frame.

### Redundant calls identified

1. **Line 1122**: `this.world.getBiome(...)` — fallback when `_frame` is null, but _frame is always set when player && world exist
2. **Line 1135**: Same pattern — for fogManager biome name
3. **Line 1160**: Same pattern — for ambientParticles biome
4. **Line 1196**: Same pattern — for chilltune biome key
5. **Line 1215**: Same pattern — for UI biome name
6. **Line 1269**: Same pattern — for wellness biome

Each `getBiome()` call involves noise function evaluation or hash lookups. With 6 redundant calls per frame at 60fps, that's 360 unnecessary lookups per second.

## Solution

Remove all fallback `this.world.getBiome()` / `this.world.getBlock()` calls in the animate loop. The `this._frame` object is guaranteed to be set when `this.player && this.world` (checked at line 1047). Use `this._frame.biome` directly without fallback.

### Implementation

1. Remove all `this._frame ? this._frame.biome : this.world.getBiome(...)` ternary patterns
2. Replace with direct `this._frame.biome` access
3. Same for `this._frame.headBlock` and `this._frame.eyeBlock`
4. Add guard: if `!this._frame`, skip system updates entirely

## Acceptance Criteria

- [ ] Zero redundant `getBiome()` calls in animate loop (only the one at line 1053 in _frame setup)
- [ ] Zero redundant `getBlock()` calls in animate loop (only the two at lines 1054-1055 in _frame setup)
- [ ] `this._frame` used directly without ternary fallbacks
- [ ] Guard added for `!this._frame` case
- [ ] No visual regression in biome indicators, fog, particles, or wellness systems
- [ ] Game runs at 60fps with render distance 16

## Testing

- Open `jardvoxel-zen.html`, traverse multiple biomes
- Verify biome indicator, fog, particles, music, and wellness systems still function
