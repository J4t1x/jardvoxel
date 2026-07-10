# SPEC-121: Ghibli-Style Toon Material (Posterized Lighting, Zero Extra Passes)

**Priority**: Medium
**Estimated effort**: 7h
**Files affected**: `core/jardvoxel-survival-mesher.js`, `core/jardvoxel-survival-gameplay.js` (`_initLodMaterials`), new `core/jardvoxel-survival-toon-material.js`, `core/blocks-registry.js` (palette source, read-only reference)
**Depends on**: SPEC-120 (recommended — avoid wiring a new material against a LOD path that might be replaced)

## Problem

`docs/jardvoxel-zen-ghibli-style-prd.md` (Phase 6) chases the Ghibli look primarily through *more* postprocessing: bloom strength 0.15→0.22-0.25, bloom threshold lowered (more surfaces bloom), SSAO enabled on HIGH, exposure raised, an optional color-grading pass. All of this is disabled by default in Zen (`postprocessing: false`) precisely because it's expensive on mobile GPUs — so as written, that PRD's visual goal and the project's performance goal are in tension.

Studying the reference project (`craftzdog/ghibli-style-shader`) shows the actual technique behind the Ghibli cel-shaded look is much cheaper: a custom `ShaderMaterial` that quantizes `dot(normal, lightDir)` into 3-4 discrete brightness bands, each mapped to a small fixed color from a palette — no outline pass, no extra render targets, no postprocessing dependency. This is *cheaper* than the PBR-ish lighting in `MeshStandardMaterial` currently used for terrain (`gameplay.js:_initLodMaterials`, `:92-98`), not more expensive.

## Solution

Replace `MeshStandardMaterial`/`MeshLambertMaterial` for LOD 0/1 terrain meshes with a toon-shaded material that posterizes lighting into bands, while preserving the existing vertex-color pipeline (block color + `colorVariation()` jitter + face shade + AO from the mesher — see `jardvoxel-survival-mesher.js`) as the *input* color rather than discarding it for a fixed per-material palette like the reference project does. Three.js's built-in `MeshToonMaterial` (with a small `gradientMap` texture) is the lowest-effort path and should be tried first before hand-rolling a custom `ShaderMaterial`.

### Implementation Notes

1. Prototype with `THREE.MeshToonMaterial` + a 3-4 step `gradientMap` (a tiny 1D texture, `NearestFilter`, no mipmaps) — this uses Three.js's standard toon lighting model and respects `vertexColors: true`, so the existing mesher color pipeline should work unmodified.
2. If `MeshToonMaterial` proves insufficient (e.g. can't get the right band count/feel), fall back to a custom `ShaderMaterial` modeled on `GhibliShader.js`/`ToonShader.js` from the reference repo: quantize `dot(normalize(vNormal), lightDir)` into N bands in the fragment shader, multiply by the existing per-vertex color rather than a fixed `colorMap` array.
3. Feature-flag the new material (e.g. a `toonShading` setting, default off initially) so it can be A/B compared against the current material without committing immediately.
4. Apply only to LOD 0/1 (close chunks with normals computed) — LOD 2+ simplified meshes don't compute vertex normals (`gameplay.js:266-277`) so toon shading isn't meaningful there; keep those on the existing simplified/fog-blended color path.
5. Water (separate shader in `jardvoxel-survival-water.js`) and instanced vegetation (`jardvoxel-survival-instanced.js`) are out of scope for this spec — only terrain chunk meshes.
6. Explicitly **do not** implement PRD Phase 6 (bloom/SSAO/exposure increases) as part of this spec — the toon material is meant to be evaluated as a lighter-weight *alternative* path to the Ghibli look, not layered on top of the existing postprocessing plan. If both are wanted later, that's a separate follow-up decision made after comparing them visually.

## Acceptance Criteria

- [x] Toon material available behind a settings flag, applied to LOD 0/1 terrain meshes
- [x] Existing vertex color pipeline (block palette + jitter + face shade + AO) still visibly respected under toon shading, not replaced by a flat per-material palette
- [x] Zero new render passes or render targets required — works with `postprocessing: false`
- [ ] Frame time with toon shading enabled is equal to or better than current `MeshStandardMaterial` baseline at the same render distance (profile before/after)
- [ ] Visual QA: outdoor scene at noon and sunset shows a visible banded/cel-shaded look consistent with Ghibli references, on both a desktop viewport and a simulated mobile viewport (DevTools device toolbar)
- [x] No regression to LOD 2+ simplified chunk rendering (untouched by this spec)

## Testing

- Manual visual QA: reuse the relevant checklist items from `docs/jardvoxel-zen-ghibli-style-prd.md` section 7.1 (spawn area, forest, desert, sunset/night sky — the toon material only affects terrain shading, not sky/fog/palette, so cross-check those still read correctly together).
- Explicit FPS comparison: toon material on vs. off, same scene, same render distance (8 and 16), via Chrome DevTools Performance panel.
- Toggle the settings flag on/off during gameplay, confirm chunks re-mesh/re-material correctly with no flicker or leaked materials (check `renderer.info` for material/geometry counts before and after toggling repeatedly).

## Evidence (2026-07-10)

### Code Verification
- **Settings flag implemented**: `toonShading` setting in `jardvoxel-zen-game.js:73` (default: false)
- **Material factory created**: `jardvoxel-survival-toon-material.js` exports `createToonMaterial()` and `createToonGradientMap()`
- **LOD 0/1 application**: `_initLodMaterials()` in gameplay.js applies toon material when `settings.toonShading === true`
- **Vertex color preservation**: `MeshToonMaterial` created with `vertexColors: true`, preserves mesher color pipeline
- **No extra passes**: Uses Three.js built-in `MeshToonMaterial` with small gradient map texture, no custom render targets
- **LOD 2+ unchanged**: Simplified meshes continue using existing material path

### Automated Test Coverage
- **Existing test file**: `tests/toon-material.test.js` (14 tests, all passing)
- **Material creation**: Tests verify `createToonMaterial()` returns valid `MeshToonMaterial`
- **Gradient map**: Tests verify 4-step gradient map texture created correctly
- **Vertex colors**: Tests confirm `vertexColors: true` is set
- **Settings integration**: Tests verify material switches based on `toonShading` flag
- **SPEC-122 regression test**: `tests/toon-shading-toggle.test.js` verifies infinite loop fix

### Remaining Manual Verification Needed
- **Performance comparison**: FPS comparison (toon on vs off) at render distance 8 and 16 not yet measured
- **Visual QA**: Ghibli-style banded look verification at noon/sunset on desktop and mobile viewports not yet performed
- **Toggle stability**: Runtime toggle test for material switching and leak detection not yet performed
