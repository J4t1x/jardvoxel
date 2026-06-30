# SPEC-050: Food Farming (Wheat, Seeds, Hoe, Bread)

## Priority: Medium
## Estimate: 4h
## Depends on: SPEC-042 (Health & Hunger)

## Description

Add a farming loop: till grass with hoe → plant seeds → wheat grows → harvest → craft bread. Completes the survival food chain beyond just killing passive mobs for meat.

## New Block IDs

```
75: Wheat Seeds (item)
76: Wheat Crop (stage 0-7, grows over time)
77: Wheat (item, harvest result)
78: Hoe (tool, not placeable)
79: Farmland (tilled dirt, moist)
80: Bread (food item, +5 hunger)
```

## Crafting Recipes

### Hoe
```
I I .
. S .    →  Hoe (1)
. S .
```
Where I = Iron Ingot (ID 65), S = Stick (ID 52). 3x3 crafting table.

### Bread
```
W W W    →  Bread (1)
```
Where W = Wheat (ID 77). Shapeless recipe, 3x3 or 2x2.

## Farming Mechanics

### Tilling
- **Right-click grass/dirt with hoe**: Converts to Farmland (ID 79)
- **Farmland visual**: Darker brown, textured top, slightly lower than normal block
- **Moisture**: If water within 4 blocks, farmland is "moist" (darker color)
- **Dry farmland**: If no water nearby for 30s, reverts to dirt

### Planting
- **Right-click farmland with seeds**: Places wheat crop (stage 0)
- **Seeds drop**: Breaking tall grass has 25% chance to drop seeds

### Growth
- **7 stages**: Stage 0 (sprout) → Stage 7 (mature, golden)
- **Growth time**: 60-120 seconds per stage (randomized)
- **Growth conditions**: 
  - Must be on farmland
  - Must have light (daytime or torch nearby)
  - Moist farmland grows 2x faster
- **Visual per stage**: 
  - 0-2: Small green sprout (0.2 blocks tall)
  - 3-5: Medium green plant (0.5 blocks tall)
  - 6-7: Tall golden wheat (0.8 blocks tall)

### Harvesting
- **Break mature wheat (stage 7)**: Drops 1-3 Wheat + 0-2 Seeds
- **Break immature wheat**: Drops 1 Seed only
- **Breaking with any tool**: Instant (no hardness)

### Eating Bread
- **Right-click with bread selected**: Eat, +5 hunger, +6 saturation
- **Eat animation**: 1.6s cooldown, screen subtle zoom
- **Sound**: Eating sound (crunch, Web Audio API)

## Acceptance Criteria

- [ ] Hoe craftable at crafting table (2 iron + 2 sticks)
- [ ] Right-click grass/dirt with hoe → farmland
- [ ] Farmland has moisture system (water within 4 blocks)
- [ ] Dry farmland reverts to dirt after 30s
- [ ] Seeds drop from tall grass (25% chance)
- [ ] Right-click farmland with seeds → plant wheat crop
- [ ] Wheat grows through 7 stages over time
- [ ] Growth requires light + farmland
- [ ] Moist farmland grows 2x faster
- [ ] Mature wheat (stage 7) drops wheat + seeds
- [ ] Bread craftable (3 wheat → 1 bread)
- [ ] Right-click with bread → eat → +5 hunger
- [ ] Eating sound effect
- [ ] No console errors
- [ ] 60fps maintained

## Files to Modify

- `jardvoxel-survival-crafting.js` — Add hoe + bread recipes
- `jardvoxel-survival-mesher.js` — Add block IDs 75-80
- `jardvoxel-survival.html` — Add tilling, planting, growth, harvesting, eating mechanics
- `jardvoxel-survival-gameplay.js` — Add crop growth update in game loop
- `jardvoxel-survival-save.js` — Persist crop stages in save data
