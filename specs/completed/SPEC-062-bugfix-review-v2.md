---
spec_id: SPEC-062
title: "Bugfix Review v2 — 15 bugs across gameplay, rendering, save/load, and features"
priority: critical
estimated_time: 90min
status: pending
created_at: 2026-06-25
---

# SPEC-062: Bugfix Review v2 — JardVoxel Survival

## Context

Full code review of `jardvoxel-survival.html`, `jardvoxel-survival-gameplay.js`,
`jardvoxel-survival-engine.js`, `jardvoxel-survival-mesher.js`, and
`jardvoxel-survival-features.js` identified 15 bugs across 3 severity levels.

Previous bug specs (SPEC-BUG-CRITICAL/MODERATE/MINOR) covered different bugs
and are already completed. This spec covers newly discovered issues.

## Critical Bugs (5)

### C1: Sprint and fly-down broken with keyboard

- **File:** `jardvoxel-survival.html:1871-1873`
- **Issue:** Keydown handler maps `e.code` via `toLowerCase().replace('key', '')`.
  Shift produces `ShiftLeft`/`ShiftRight` → `shiftleft`/`shiftright`, but
  `PlayerController.update()` checks `keys.shift`. Sprint and fly-down only
  work via touch controls.
- **Fix:** Add `this.keys.shift = true` when `e.code === 'ShiftLeft' || e.code === 'ShiftRight'`
  in keydown, and `false` in keyup. Same for `Space` → `keys.space`.

### C2: _switchDimension() doesn't clean up meshes — memory leak + visual artifacts

- **File:** `jardvoxel-survival.html:1115-1125`
- **Issue:** Iterates `this.world.chunks` checking `chunk.mesh` and `chunk.waterMesh`
  which are always `undefined`. Meshes are stored in `this.world.meshes` and
  `this.world.waterMeshes` Maps. All Three.js meshes remain orphaned in scene.
- **Fix:** Iterate `this.world.meshes` and `this.world.waterMeshes` Maps,
  remove each mesh from scene, dispose geometry+material, clear both Maps,
  then clear `this.world.chunks`.

### C3: _growCrops() checks wrong Y coordinates

- **File:** `jardvoxel-survival.html:1689-1692`
- **Issue:** Y range is `-4` to `4` in absolute world coordinates. With
  `WORLD_MIN_Y = -64`, these are below terrain. Crops never grow.
- **Fix:** Use `py + y` where `py = Math.floor(this.player.position.y)`.
  Change loop to `for (let y = -4; y <= 4; y++)` and use
  `this.world.getBlock(x, py + y, z)`.

### C4: placeWell() can't create water — well is solid cobblestone

- **File:** `jardvoxel-survival-features.js:368-384`
- **Issue:** `setBlockSafe` only places on AIR. Cobblestone is set first,
  then water placement fails because block is no longer AIR.
- **Fix:** Reorder: place water first (inner), then cobblestone (outer ring).
  Or add a `force` parameter to `setBlockSafe` for structure methods.

### C5: Bow fires without arrows in survival mode

- **File:** `jardvoxel-survival.html:2321-2348`
- **Issue:** Arrow is spawned unconditionally. Inventory consumption only
  happens if arrow is found in hotbar. Bow fires with no arrows.
- **Fix:** Check for arrows in inventory first. If none found, return early
  without spawning arrow. Only spawn after confirming consumption.

## Moderate Bugs (6)

### M1: Clouds toggle has no effect

- **File:** `jardvoxel-survival-gameplay.js:537` + `jardvoxel-survival.html:1480-1482`
- **Issue:** `DayNightCycle` sets `this.clouds = null` and never assigns it.
  `_initClouds()` populates `this.cloudPlanes = []`. Toggle checks
  `this.dayNight.clouds` which is always `null`.
- **Fix:** In `_initClouds()`, set `this.clouds = this.cloudPlanes` or
  iterate `cloudPlanes` in toggle handler. Update toggle to set
  `visible` on all `cloudPlanes`.

### M2: Mining overlay stays visible after releasing mouse

- **File:** `jardvoxel-survival.html:2074-2075`
- **Issue:** Mouseup clears `mouseLeftDown` but not `miningTarget`/`miningProgress`.
  Overlay persists. Touch controls handle this correctly (line 817).
- **Fix:** In mouseup handler for button 0, also set
  `this.miningTarget = null; this.miningProgress = 0;`

### M3: showFPS and showCoords toggles control same element

- **File:** `jardvoxel-survival.html:1614-1621`
- **Issue:** Both toggles set `document.getElementById('info').style.display`.
  Toggling FPS off hides coordinates too.
- **Fix:** Wrap FPS and coords in separate child elements (e.g. `#fps-row`,
  `#coords-row`) and toggle each independently. Or check both settings:
  `el.style.display = (this.settings.showFPS || this.settings.showCoords) ? 'block' : 'none'`
  and toggle individual child visibility.

### M4: Enchanting always costs 1 level regardless of enchant cost

- **File:** `jardvoxel-survival.html:2483-2485`
- **Issue:** `spendLevel()` called without `ench.cost` argument.
- **Fix:** Pass `ench.cost` to `spendLevel()`: `this.xpManager.spendLevel(ench.cost)`.
  Verify `XPManager.spendLevel` accepts a cost parameter.

### M5: Save/load: creative mode Infinity count becomes null

- **File:** `jardvoxel-survival-gameplay.js:471`
- **Issue:** `JSON.stringify({ count: Infinity })` → `{"count":null}`.
  On reload, count is `null`. In survival, `null--` → `NaN`, items never deplete.
- **Fix:** Use a sentinel value like `999` or `-1` for creative mode instead
  of `Infinity`. On load, restore to `Infinity` if count is `999` or `-1`.

### M6: Save/load: equipment tool not restored correctly

- **File:** `jardvoxel-survival.html:1054-1056`
- **Issue:** Only updates durability/enchantments of currently equipped tool.
  If saved tool's `blockId` differs or no tool equipped, saved tool is lost.
- **Fix:** Create a new `ToolItem` from saved data:
  `this.equipment.tool = new ToolItem(d.equipment.tool.blockId);`
  then restore durability/enchantments. Same pattern for armor pieces.

## Minor Issues (4)

### m1: setBlockSafe allows logs to overwrite any block

- **File:** `jardvoxel-survival-features.js:118`
- **Issue:** Logs can replace stone, ores, water, etc.
- **Fix:** Only allow logs to overwrite AIR and leaves, not solid blocks.

### m2: Dual auto-save systems

- **File:** `jardvoxel-survival.html:983` and `2761`
- **Issue:** `SaveManager.startAutoSave()` at 30s + game's `autoSaveTimer`
  at user-configurable interval. Two systems run simultaneously.
- **Fix:** Remove `SaveManager.startAutoSave()` call, keep only the
  game's `autoSaveTimer` which respects user settings. Or vice versa.

### m3: Underwater fog creates new Fog object every frame

- **File:** `jardvoxel-survival.html:2820`
- **Issue:** `new THREE.Fog(...)` allocated every frame while underwater.
- **Fix:** Modify existing fog's `near`, `far`, `color` properties instead
  of creating new object. Or cache an underwater fog instance.

### m4: Double raycast per frame

- **File:** `jardvoxel-survival.html:2251` and `2802`
- **Issue:** `updateHUD()` and block highlight each call `raycast(5)`.
- **Fix:** Cache raycast result once per frame, reuse in both places.

## Acceptance Criteria

### Critical
- [ ] Sprint works with keyboard Shift key
- [ ] Fly-down works with keyboard Shift key
- [ ] Dimension switch properly removes all meshes from scene
- [ ] Dimension switch disposes geometry+material of removed meshes
- [ ] Crops grow when player is near at correct Y level
- [ ] Wells generate with water in center
- [ ] Bow does not fire without arrows in survival mode
- [ ] Bow consumes arrow from inventory when firing

### Moderate
- [ ] Clouds toggle shows/hides all cloud planes
- [ ] Mining overlay disappears when mouse released
- [ ] FPS toggle and coords toggle work independently
- [ ] Enchanting deducts correct number of levels based on enchant cost
- [ ] Creative mode items save and load with correct count
- [ ] Equipment tool restored correctly on load regardless of current equip state

### Minor
- [ ] Tree logs no longer replace stone/ores/water
- [ ] Only one auto-save system active, respects user interval setting
- [ ] No new THREE.Fog allocation per frame underwater
- [ ] Raycast called once per frame, result cached and reused

## Files to Modify

1. `jardvoxel-survival.html` — C1, C2, C3, C5, M2, M3, M4, M6, m2, m3, m4
2. `jardvoxel-survival-gameplay.js` — M1, M5
3. `jardvoxel-survival-features.js` — C4, m1

## No Regressions

- Creative mode behavior unchanged
- Touch controls still work
- Existing save files still load
- All biomes generate correctly
- All structures generate correctly (except wells now have water)
