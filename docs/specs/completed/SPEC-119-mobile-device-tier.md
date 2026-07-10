# SPEC-119: Mobile Device-Tier Detection with Adaptive Default Quality

**Priority**: High
**Estimated effort**: 3h
**Files affected**: `core/jardvoxel-zen-game.js`, `jardvoxel-zen.html`
**Depends on**: none

## Problem

There is no device-tier or capability-based quality detection anywhere in the codebase. A phone and a desktop currently boot with identical defaults: `renderDistance: 8`, `fov: 75`, `antialias: false`, `pixelRatio: min(devicePixelRatio, 1.5)`, `shadows: false`, `postprocessing: false`. Touch is auto-detected (`jardvoxel-zen-touch.js:216`) but only used to show on-screen controls, never to adjust render settings. The only runtime safety valve is the adaptive-render-distance-by-FPS logic (`gameplay.js:434-441`), which reacts *after* FPS has already dropped rather than starting the session appropriately scaled.

## Solution

Add a one-time, cheap device-tier heuristic at boot that sets **initial** quality defaults — never overriding a user's already-saved `localStorage` settings.

### Implementation Notes

1. Compute a tier classification once during `ZenGame` init, before the renderer/settings are applied:
   - Signals: `('ontouchstart' in window) || navigator.maxTouchPoints > 0` (touch-primary), `navigator.hardwareConcurrency` (already used for worker count, `gameplay.js:104`), `navigator.deviceMemory` if available (not supported on iOS Safari — treat as unknown, don't gate on it alone), viewport size (`window.innerWidth`).
   - Classify: `LOW` (touch-primary AND (`hardwareConcurrency <= 4` OR `deviceMemory` present and `<= 4`)), `HIGH` (non-touch, `hardwareConcurrency >= 8`), else `MEDIUM`.
2. Apply tier-based defaults **only when no saved settings exist** in `localStorage` (first run):
   - `LOW`: `renderDistance: 5`, `pixelRatio: min(devicePixelRatio, 1.0)`, `shadows: false`, `postprocessing: false` (already the global default, keep).
   - `MEDIUM` (typical phone): keep current defaults (`renderDistance: 8`, `pixelRatio: min(dpr, 1.25)`).
   - `HIGH`: current defaults unchanged (`renderDistance: 8`, `pixelRatio: min(dpr, 1.5)`) — no regression for desktop users.
3. Do **not** touch `fov` — that's a gameplay/feel choice, not a perf lever, and changing it silently per device would be a jarring inconsistency between devices for players who switch.
4. Surface the detected tier in the settings menu (read-only label is enough) so users understand why their defaults differ, and can always override manually.

## Acceptance Criteria

- [x] Device tier computed once at boot, adds no measurable startup delay (no blocking network/heavy computation)
- [x] `LOW` tier (simulated low-end phone) gets `renderDistance <= 5` and `pixelRatio <= 1.0` on first run
- [x] Any existing `localStorage` settings always take precedence over tier defaults (returning users are never silently downgraded/upgraded)
- [x] `HIGH` tier (desktop) defaults are byte-for-byte identical to current behavior — zero regression
- [ ] Verified with Chrome DevTools device toolbar + CPU throttling (4x/6x slowdown) simulating a low-end Android device

## Testing

- Chrome DevTools: enable device toolbar (e.g. "Moto G Power" or similar mid/low-tier preset) + CPU 4x slowdown, clear `localStorage`, load `jardvoxel-zen.html`, confirm `LOW`/`MEDIUM` defaults applied.
- Desktop Chrome, no throttling, clear `localStorage`, confirm defaults match current pre-change behavior exactly.
- Manually set a custom render distance in settings, reload, confirm the custom value persists and isn't overridden by tier detection.

## Evidence (2026-07-10)

### Code Verification
- **Detection logic confirmed**: `jardvoxel-zen-game.js:708-719` implements tier detection using `navigator.hardwareConcurrency`, `navigator.maxTouchPoints`, `navigator.deviceMemory`
- **Defaults application confirmed**: `jardvoxel-zen-game.js:721-731` applies tier-specific defaults (LOW: renderDistance=5, pixelRatio≤1.0; MEDIUM: renderDistance=8, pixelRatio≤1.25; HIGH: unchanged)
- **Saved settings precedence confirmed**: `jardvoxel-zen-game.js:80-93` only calls `_applyTierDefaults()` when `!_hasSavedSettings`
- **Boot-time execution**: Detection runs once at line 77, before renderer initialization

### Automated Test Coverage
- **New test file**: `tests/device-tier.test.js` (20 tests, all passing)
- **Tier classification coverage**: Tests verify LOW/MEDIUM/HIGH classification across various hardware combinations
- **Touch detection**: Tests verify both `ontouchstart` and `maxTouchPoints` detection paths
- **Defaults application**: Tests verify correct renderDistance and pixelRatio values per tier
- **Edge cases**: Tests handle missing `hardwareConcurrency`, unknown `deviceMemory` (iOS Safari)
- **Settings preservation**: Tests document the rule that saved settings always win

### Remaining Manual Verification Needed
- **DevTools device simulation**: Chrome DevTools device toolbar + CPU throttling test not yet performed
- **Visual confirmation**: Actual LOW/MEDIUM tier defaults on simulated devices not yet verified in browser
