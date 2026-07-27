# PRD: JardVoxel Zen 2 — Water Effects Fix

**Version:** 1.0.0
**Date:** 2026-07-25
**Author:** Cascade + User
**Status:** Pending Implementation
**Trigger:** Screenshot from `jardvoxel.vercel.app` (Zen 2, bioma Estepa Patagónica, XYZ -342,65,-1004) showing water rendering as hard, blocky, terraced "rice-paddy" steps instead of a flat animated sea, plus an unexplained artifact near the crosshair.

---

## 1. Overview

The active build is **Zen 2** (`jardvoxel-zen2.html` → `core/jardvoxel-zen-game.js`, class `ZenGame`), NOT the older `jardvoxel.html` / `jardvoxel-engine.js` path (that file is legacy/unlinked — see `jardvoxel-zen-bugfix-prd.md` §2.1 "Files not linked to JardVoxel Zen"). All fixes below target the Zen/Zen2-linked files only.

### 1.1 Goals
- Make water sit at a flat, continuous sea level instead of tracking terrain contour (fixes the terracing seen in the screenshot).
- Confirm the stylized water shader (`WaterMaterialManager`: waves, fresnel, reflections, caustics) is actually the material being rendered, not a silent fallback.
- Investigate the unexplained red artifact floating near the crosshair (separate from water, do not guess-fix blind).

### 1.2 Non-Goals
- New water gameplay mechanics (swimming physics, fishing, boats).
- Survival-mode-only water code (`jardvoxel-engine.js`) — confirmed unused by Zen 2, out of scope.
- Full re-architecture of terrain generation beyond the specific loop-bound bug below.

---

## 2. Technical Context — Linked Files

| File | Role |
|------|------|
| `core/jardvoxel-survival-engine.js` | `VoxelChunk.generate()` — fills terrain + water blocks per column. **Root cause lives here.** |
| `core/jardvoxel-survival-mesher.js` | `buildWaterMesh(chunk, world)` (lines ~475-535) — turns water blocks into a quad-per-column mesh. |
| `core/jardvoxel-survival-gameplay.js` | `SurvivalWorld` — calls `buildWaterMesh`, assigns `waterMaterialManager.getMaterial()` or falls back to plain `MeshStandardMaterial` (lines 447-474). |
| `core/jardvoxel-survival-water.js` | `WaterMaterialManager` — stylized shader (waves, fresnel, reflection RT, caustics). |
| `core/jardvoxel-zen-game.js` | `ZenGame` — constructs `WaterMaterialManager` (line 289), updates it every frame (lines 2106-2111), owns the block-highlight box (lines 552-558) and cached raycast (line 2057-2060). |

---

## 3. Issues by Priority

### 3.1 Critical (P0)

#### WATER-BUG-001: Water Follows Terrain Noise Instead of Flat Sea Level (confirmed root cause of the terracing)

**Problem:** `VoxelChunk.generate()` (`jardvoxel-survival-engine.js:911-981`) computes, per column:

```js
const NOISE_MARGIN = 15;
const terrainTop  = Math.ceil(baseHeight) + NOISE_MARGIN;
const surfaceTopY = Math.min(CHUNK_HEIGHT - 1, Math.ceil(terrainTop - WORLD_MIN_Y)); // loop's upper bound
...
for (let y = stoneEndY; y <= surfaceTopY; y++) {
  const worldY = WORLD_MIN_Y + y;
  if (worldY > terrainTop) {
    if (worldY < SEA_LEVEL) { /* fill water */ }
    else { /* air */ }
    continue;
  }
  ...
}
```

`surfaceTopY` is derived from `terrainTop` (≈ `baseHeight + 15`), not from `SEA_LEVEL`. Since the loop never iterates past `surfaceTopY`, `worldY` can never actually exceed `terrainTop` inside the loop — the `if (worldY > terrainTop)` water-fill branch is effectively dead for any column whose bed is more than ~15 blocks below sea level. The practical result: **water is filled only up to `baseHeight + 15`, not up to the constant `SEA_LEVEL`.** Wherever a lake/pond/ocean floor dips more than 15 blocks below sea level, the water surface height directly tracks that dip (offset by a constant) instead of staying flat — producing the exact rice-paddy/staircase pattern in the screenshot.

**Files:** `core/jardvoxel-survival-engine.js:916,928,934-935,948-970`

**Fix:**
- Extend the loop's ceiling for underwater columns so it actually reaches `SEA_LEVEL`, e.g.:
  ```js
  const terrainTop  = Math.ceil(baseHeight) + NOISE_MARGIN;
  const waterCeiling = Math.max(terrainTop, SEA_LEVEL);
  const surfaceTopY  = Math.min(CHUNK_HEIGHT - 1, Math.ceil(waterCeiling - WORLD_MIN_Y));
  ```
- Keep `stoneEndY`/`NOISE_MARGIN` untouched for the terrain-noise band itself — only the water-fill ceiling needs to move.
- Re-check `minContentY`/`maxContentY` bookkeeping still accounts for the extra water rows (used by occlusion + meshing skip, lines 919-921, 942-969).
- Watch performance: this widens the per-column loop for deep-water columns (more iterations for `getAquiferState`). Should still be cheap since it's a simple fill, but profile chunk-gen time before/after in open ocean.

**Acceptance Criteria:**
- [ ] Any column with `baseHeight < SEA_LEVEL` gets water filled flat up to `SEA_LEVEL`, regardless of how deep the floor is.
- [ ] Flying over a lake/ocean at the reported coords (or any deep body of water) shows one continuous flat water plane, no steps.
- [ ] Shallow water (puddles, shorelines) unaffected — still renders correctly.
- [ ] No regression in cave/ore generation immediately above `stoneEndY` (terrain-noise band untouched).
- [ ] Chunk generation time for ocean-heavy chunks does not regress beyond ~10%.

---

#### WATER-BUG-002: Confirm Stylized Water Shader Is Actually Rendering (not a silent fallback)

**Problem:** `SurvivalWorld` (`jardvoxel-survival-gameplay.js:460-466`) does correctly wire `this.waterMaterialManager.getMaterial()` as the water mesh's material when `waterMaterialManager` is set, falling back to a plain `MeshStandardMaterial` with per-vertex colors only if it's missing. `WaterMaterialManager` is constructed and updated every frame from `ZenGame` (`jardvoxel-zen-game.js:289,2106-2111`), so on paper the shader (waves, fresnel, reflection, caustics — `jardvoxel-survival-water.js:12-104`) should be what's on screen.

However: the shader's fragment stage **never reads vertex colors** — water color comes purely from `uShallowColor`/`uDeepColor` uniforms + fresnel (`jardvoxel-survival-water.js:83`). The hard, flat, per-tile color banding visible in the screenshot looks like the `buildWaterMesh` per-vertex `depthFactor` coloring (mesher.js:518-523), which is exactly what the *fallback* material would show, not the shader. This may simply be an artifact of WATER-BUG-001 (extreme per-column height variance breaking up what should be smooth shading) rather than a real fallback — needs runtime confirmation, not a code-only diagnosis.

**Fix (investigation, not a blind code change):**
- After fixing WATER-BUG-001, re-take a screenshot at the same spot and compare.
- In the browser console on the live page, grab a water mesh and check `mesh.material.type` — should be `ShaderMaterial`, not `MeshStandardMaterial`.
- If it is somehow the fallback, check `WaterMaterialManager._init()` (`jardvoxel-survival-water.js:124-163`) for a runtime failure — e.g. `HalfFloatType` WebGLRenderTarget support on the browser/GPU in use (Safari, per the screenshot's browser chrome).

**Acceptance Criteria:**
- [ ] Confirmed via DevTools that water meshes use the `ShaderMaterial` from `WaterMaterialManager`, not the plain fallback.
- [ ] Visible waves, fresnel brightening at grazing angles, and reflection are present in-game (not just in theory).
- [ ] If a fallback is happening, root cause identified and fixed (or documented as an intentional perf/compat trade-off).

---

### 3.2 Medium (P2) — Needs Reproduction, Do Not Guess-Fix

#### WATER-BUG-003: Unexplained Red Artifact Floating Near Crosshair Over Water

**Problem:** The screenshot shows a small red angular/diagonal shape floating over the water near the crosshair, while the HUD shows `Mirando: --` / `Seleccionado: --` (nothing currently targeted). Investigation ruled out the obvious suspects:
- The block-selection highlight box (`jardvoxel-zen-game.js:552-558`) is a **green** (`0x00ff88`) wireframe cube — wrong color, and it's the only highlight-mesh code in the whole codebase. Confirmed: `blockHighlight.visible = false` when raycast returns nothing (line 2066), and the screenshot shows `Mirando: --`.
- `OceanSystem` marine life (`core/jardvoxel-survival-ocean.js`, e.g. `seabird`/`v_shape` birds) is never rendered in Zen mode — `InstancedFeatureRenderer` is only wired in the survival-only path (`jardvoxel-survival-gameplay.js`), not imported by `jardvoxel-zen-game.js`.
- The on-screen crosshair itself is a fixed white CSS `+` at viewport center (`jardvoxel-zen2.html:23-26`) — a 2D overlay, not a 3D world object, and not red.
- `Player.raycast()` (`jardvoxel-survival-gameplay.js:1276-1314`) explicitly skips `BLOCK.WATER` — intentional, lets you target things through water, not itself a bug — but combined with WATER-BUG-001's broken water heights, a correctly-targeted solid block could visually read as "floating" relative to a water surface that's sitting at the wrong height. Fixing WATER-BUG-001 may make this artifact disappear or become easier to identify.

**Additional suspects ruled out by code audit (post-PRD):**
- `FishingSystem.bobberMesh` (`jardvoxel-survival-fishing.js:125`) is a red `MeshBasicMaterial(0xff0000)` sphere — but `FishingSystem` is never imported/wired by `jardvoxel-zen-game.js` (grep confirms 0 matches). Survival-only.
- `Mob.hitFlash` emissive (`jardvoxel-survival-mobs.js:383`) flashes `0xff0000` — but `MobSystem` is also never imported by `jardvoxel-zen-game.js`. Survival-only.
- `ParticleSystem` block-break particles (`jardvoxel-survival-particles.js:22-30`) use `vertexColors` from block color — would only be red if breaking a red block; not spawned in Zen flying mode.
- `AmbientParticleSystem` biome particles (`jardvoxel-survival-ambient-particles.js`) — Estepa Patagónica = `BIOMES.PLAINS` = `BIOME_PARTICLES.POLLEN` (color `0xF2D048`, yellow). No red particle config exists in the entire `PARTICLE_CONFIGS` table.
- `WeatherManager` lightning (`jardvoxel-survival-weather.js:440`) is `AmbientLight(0xffffff)` — white, not red. No red weather visuals.
- `SkyDome` (`jardvoxel-survival-gameplay.js:1656`) uses a gradient shader — no red vertex/fragment.
- Sun mesh (`jardvoxel-survival-gameplay.js:1578`) is `0xFFE8B8` (warm yellow), not red.
- `Character` model (`jardvoxel-survival-character.js`) — no red materials; only `0xffffff` sclera and Lambert materials.
- `Landmark`/`MeditationSpace`/`Restoration` systems — no 3D meshes with red materials; they place blocks (red_leaves, FLOWER_RED) but those are voxel blocks in terrain, not floating meshes.
- `scene.add()` calls in `jardvoxel-zen-game.js` — only 3: `character.group`, `blockHighlight`, and a `PointLight(0xffaa44)` (warm orange, not red). No debug helpers, no `BoxHelper`/`AxesHelper`/`ArrowHelper`.
- `frustumCulled = false` objects — only `stars`, `skyDome`, `clouds`, and `particleSystem`. None red.

**Remaining hypotheses (cannot confirm without runtime reproduction):**
1. **Visual artifact of WATER-BUG-001**: water quads at inconsistent heights create broken normals → fresnel/reflection shader produces unexpected colors at certain angles. Most likely.
2. **Corrupt mesh fragment**: a chunk mesh with bad geometry producing a stray triangle. Would be a meshing bug, not an intentional red color.
3. **Z-fighting/depth issue**: water quad fighting with another surface at the same depth.
4. **Reflection RT sampling glitch**: the water shader samples `uReflectionMap` (the flipped-scene render target); if the RT contains unexpected content at certain camera angles, it could tint quads red.

All four hypotheses predict the artifact either disappears or becomes diagnosable once WATER-BUG-001 is fixed and water is flat.

**Fix:** Do not implement a fix yet. After WATER-BUG-001 is deployed, reproduce at the same coordinates (or similar terrain) and inspect live via DevTools (toggle scene layers, `renderer.info`, click-inspect the object under the cursor) to identify the actual source before scoping any change.

**Acceptance Criteria:**
- [ ] Artifact reproduced live and its source object identified (mesh name/class).
- [ ] Root cause documented; if it disappears after WATER-BUG-001, note that as the resolution.
- [ ] Only file a follow-up fix once the source is confirmed — no speculative changes.

---

## 4. Implementation Order

1. **WATER-BUG-001** — fix the water-fill loop bound in `VoxelChunk.generate()`. This is the one concrete, high-confidence code change; everything else depends on seeing water rendered at the correct flat height first.
2. **WATER-BUG-002** — re-screenshot and verify in DevTools whether the stylized shader is actually active now that heights are correct.
3. **WATER-BUG-003** — reproduce and diagnose the red artifact with the corrected water in place.

---

## 5. Estimated Effort

| Item | Est. Time | Risk |
|------|-----------|------|
| WATER-BUG-001 | 1-2h (fix + manual test across biomes/depths) | Medium — touches core terrain generation, must not regress caves/ore bands |
| WATER-BUG-002 | 0.5-1h (mostly verification, code fix only if fallback confirmed) | Low |
| WATER-BUG-003 | 0.5-1h investigation; fix TBD once source is known | Unknown until reproduced |
| **Total** | **2-4h** | |

---

## 6. Testing Strategy

- [ ] Fly to a deep lake/ocean area (e.g. near the reported coords XYZ -342,65,-1004, biome Estepa Patagónica) → water surface is flat, no steps.
- [ ] Fly over shallow water/shoreline → still renders correctly, no regression.
- [ ] Check a river/valley biome (different `baseHeight` profile) → water still flat.
- [ ] Confirm waves animate and shift with `uTime` (shader path) rather than a static texture.
- [ ] Confirm reflections/fresnel brighten at grazing view angles near the sun.
- [ ] Verify caves/ore/terrain immediately below the water line are unaffected (no floating stone, no missing terrain).
- [ ] Reproduce the red artifact scenario and capture what object it is.
- [ ] Regression: chunk generation time in open-ocean areas within ~10% of baseline (profile before/after).

---

## 7. Risks

| Risk | Mitigation |
|------|------------|
| Widening the water-fill loop bound regresses cave generation or ore placement just above `stoneEndY` | Keep `NOISE_MARGIN`/`stoneEndY` untouched; only extend the *water* ceiling, verify with a cave-heavy test chunk |
| Deeper per-column loops slow chunk generation in open ocean | Profile before/after; the added work is a cheap water/air fill, not new noise sampling |
| Shader turns out to have a real runtime fallback (WATER-BUG-002) requiring a deeper fix (e.g. RT format on Safari/mobile) | Scope as a separate follow-up if confirmed — don't block WATER-BUG-001 on it |
| Red artifact (WATER-BUG-003) turns out to be unrelated to water entirely | Fine — file as its own bug once identified, don't force it into this PRD's scope |

---

## 8. Cómo ejecutar con `/loop`

Este PRD está pensado para ejecutarse iterativamente:

```
/loop /cascade-dev Implementa el siguiente ítem pendiente de docs/jardvoxel-zen-water-effects-prd.md (jard-games), en orden: WATER-BUG-001 → WATER-BUG-002 → WATER-BUG-003. Marca cada checkbox de Acceptance Criteria al completarlo y corre el juego (skill /run) para verificar visualmente antes de pasar al siguiente ítem.
```

Cada bug tiene sus propios Acceptance Criteria — no marcar como resuelto sin verificación visual en el navegador (no solo lint/build), dado que el bug es puramente visual/de generación de mundo.
