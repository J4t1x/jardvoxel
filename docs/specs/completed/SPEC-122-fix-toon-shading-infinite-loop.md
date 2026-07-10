# SPEC-122: Fix Infinite Loop in setToonShading() + Wire Toon Shading to Settings UI

**Priority**: Critical
**Estimated effort**: 3h
**Files affected**: `core/jardvoxel-survival-gameplay.js`, `core/jardvoxel-zen-game.js`, `jardvoxel-zen.html`, `tests/toon-material.test.js`
**Depends on**: SPEC-121 (completed, but shipped with this bug — do not re-edit the completed spec doc, this is a follow-up)

## Problem

Verification of SPEC-121 (Ghibli toon material) found two issues via a live browser smoke test (Playwright + real chunk worker + real WebGL, not just `vitest`'s mocked environment — this class of bug is invisible to the current unit tests because they only test `createToonTerrainMaterial()` in isolation, never the actual toggle path):

### 1. `SurvivalWorld.setToonShading()` causes an unbounded infinite loop (confirmed reproduced)

```js
// core/jardvoxel-survival-gameplay.js
setToonShading(enabled) {
  this._toonShading = !!enabled;
  if (this._lodMaterials) {
    disposeToonMaterial(this._lodMaterials.near);
    this._lodMaterials = null;
  }
  for (const [key, mesh] of this.meshes) {          // ← live Map iterator
    const { cx, cz } = mesh.userData;
    this._rebuildChunkMesh(cx, cz, true);            // ← mutates this.meshes
  }
}
```

`_rebuildChunkMesh()` does `this.meshes.delete(key)` followed by `this.meshes.set(key, newMesh)` (`gameplay.js:285`, `:336`). Per the JS spec, deleting and re-inserting a key during `for...of` iteration over a `Map` moves that entry to the **end** of the live iterator's remaining sequence — so the loop visits it again, rebuilds it again, re-inserts it again, forever. With no cap and no break condition, this never terminates.

**Reproduced live**: loaded the real game in a browser (11 chunks loaded), called `world.setToonShading(true)` from the console — it hung for 60+ seconds and left the page **permanently unresponsive** (a follow-up `2+2` evaluate and even a screenshot both timed out). This is a full page freeze, not a slow operation.

Note: a structurally similar pattern exists at `gameplay.js:667-687` (the periodic LOD upgrade/downgrade loop also calls `_rebuildChunkMesh` while iterating `this.meshes`), but it's saved from this fate by hard caps (`maxUpgrades = 6, maxDowngrades = 4` + a `break`) that bound the damage to a handful of redundant rebuilds per tick. `setToonShading()` has no such cap because it intentionally means to rebuild *every* loaded chunk — which is exactly the case that turns the same hazard into a true infinite loop.

### 2. The feature is unreachable by players (currently masking the bug)

`SurvivalWorld.setToonShading()` is never called anywhere outside its own definition. There is no `toonShading` key in `ZenGame`'s settings object, no checkbox in `jardvoxel-zen.html`, and `_applySettings()` never references it. SPEC-121's core deliverable — a player-facing Ghibli toon-shading option — does not currently exist in the running game. This is also why the crash above hasn't been hit by any player yet.

## Solution

### Fix the infinite loop

Snapshot the chunk coordinates to a plain array **before** iterating, so mutating `this.meshes` mid-loop can't feed back into the iteration:

```js
setToonShading(enabled) {
  this._toonShading = !!enabled;
  if (this._lodMaterials) {
    disposeToonMaterial(this._lodMaterials.near);
    this._lodMaterials = null;
  }
  const targets = Array.from(this.meshes.values(), m => ({ cx: m.userData.cx, cz: m.userData.cz }));
  for (const { cx, cz } of targets) {
    this._rebuildChunkMesh(cx, cz, true);
  }
}
```

### Wire it to the settings UI

1. Add `toonShading: false` to `ZenGame`'s `settings` object (`jardvoxel-zen-game.js:55-72`), default off (consistent with SPEC-121's original intent of an opt-in A/B toggle).
2. Add a checkbox/toggle in the settings panel in `jardvoxel-zen.html`, near the other visual toggles (fog/shadows/postprocessing).
3. Wire it in `_applySettings()` / the settings change handler to call `this.world.setToonShading(this.settings.toonShading)`.
4. Apply the saved setting on game boot (after `this.world` is constructed), same as other visual settings.

### Add regression coverage

Add a test that would have caught this: construct a `SurvivalWorld`-like object with several entries in `this.meshes`, stub `_rebuildChunkMesh` to actually perform a delete+set on `this.meshes` (mimicking the real mutation), call `setToonShading(true)`, and assert it terminates (e.g. wrap in a call-count guard or `expect(...).not.toThrow()` combined with a bounded iteration count assertion — the test must fail against the current buggy implementation and pass against the fix).

## Acceptance Criteria

- [ ] `setToonShading(true)` and `setToonShading(false)` both terminate promptly (sub-second) with a realistic number of loaded chunks (test with at least 20-50 mock entries in `this.meshes`)
- [ ] Regression test added that fails against the pre-fix implementation and passes against the fix (iterate-over-snapshot pattern)
- [ ] `toonShading` setting exists in `ZenGame.settings`, persists via the existing `localStorage` save/load path
- [ ] Checkbox present in the settings UI (`jardvoxel-zen.html`), toggling it calls `world.setToonShading()`
- [ ] Live browser verification: toggle the setting on/off repeatedly during gameplay, confirm no freeze, no leaked materials (check `renderer.info.memory` before/after a few toggles for growing counts)
- [ ] Visual QA: with toon shading on, outdoor terrain shows visible banded/cel-shaded lighting; existing vertex color pipeline (palette + jitter + AO) still visible underneath the banding

## Testing

- Automated: new test in `tests/toon-material.test.js` or a new `tests/toon-shading-toggle.test.js`, per "Add regression coverage" above.
- Live browser smoke test (Playwright or manual): load the game, open dev console (or use the new settings checkbox once wired), toggle toon shading, confirm the page stays responsive and a screenshot after toggling shows changed terrain shading.
- Full `vitest` suite must still pass.
