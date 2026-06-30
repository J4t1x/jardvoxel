# SPEC-047: Sleep/Bed + Skip Night + Set Spawn

## Priority: High
## Estimate: 3h
## Depends on: SPEC-044 (Weather)

## Description

Add bed block that allows sleeping at night to skip to morning, and sets the player's spawn point. Core survival gameplay loop — avoids nighttime danger.

## New Block ID

```
74: Bed (red wool color, placeable, 2 blocks wide)
```

## Crafting Recipe

```
W W W
P P P    →  Bed (1)
```
Where W = Wool (ID 59), P = Planks (ID 3). Requires 3x3 crafting table.

## Sleep Mechanics

- **Place bed**: Right-click with bed selected → places 2-block-wide bed on ground
- **Sleep**: Right-click on placed bed → if nighttime (dayFactor < 0.3), start sleeping
- **Sleep animation**: Screen fades to black over 1s, then fades back at dawn
- **Skip time**: `dayTime` advances to 0.25 (morning, 06:00)
- **Set spawn**: Player's spawn point set to bed location
- **Wake conditions**: 
  - Must be nighttime to sleep
  - Cannot sleep if hostile mobs within 8 blocks
  - Cannot sleep in creative mode (no need)
- **Sleep message**: "Durmiendo..." → "Buenos dias!" on wake
- **Weather reset**: Sleeping clears weather (rain/snow/thunder → clear)

## Visual

- **Bed block**: 2 blocks wide, red wool top, wood frame bottom, low height (0.5 blocks)
- **Sleep overlay**: Black fade overlay (CSS div, opacity 0→1→0 over 3s)
- **Bed orientation**: Faces player direction when placed

## Acceptance Criteria

- [ ] Bed craftable at crafting table (3 wool + 3 planks)
- [ ] Bed placeable as 2-block-wide block
- [ ] Right-click bed at night → sleep → skip to morning
- [ ] Cannot sleep during day (message: "Solo puedes dormir de noche")
- [ ] Cannot sleep if mobs within 8 blocks (message: "No puedes dormir, hay monstruos cerca")
- [ ] Sleeping sets spawn point to bed location
- [ ] Death respawns player at bed (if set) or world spawn
- [ ] Sleep clears weather
- [ ] Screen fade animation during sleep
- [ ] No console errors
- [ ] 60fps maintained

## Files to Modify

- `jardvoxel-survival-crafting.js` — Add bed recipe
- `jardvoxel-survival.html` — Add sleep mechanics, bed interaction, spawn point, fade overlay
- `jardvoxel-survival-mesher.js` — Add block ID 74
- `jardvoxel-survival-save.js` — Persist spawn point in save data
