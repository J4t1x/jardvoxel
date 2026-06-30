# SPEC-046: Bows + Arrows + Ranged Combat

## Priority: High
## Estimate: 4h
## Depends on: SPEC-045 (Hostile Mobs)

## Description

Add bow crafting and ranged combat. Player can craft a bow, shoot arrows at mobs, and skeletons already shoot arrows (from SPEC-045). Arrows are physical projectiles with gravity.

## New Block IDs

```
72: Bow    73: Arrow (item, not placeable)
```

## Crafting Recipes

### Bow
```
. S .
S . S    →  Bow (1)
. S S
```
Where S = Stick (ID 52). Requires 3x3 crafting table.

### Arrows (x4)
```
. . F
. S F    →  Arrows (4)
. S F
```
Where F = Feather (ID 57), S = Stick (ID 52), I = Iron Ingot (ID 65).
Actually: Flint (or Iron Ingot) + Stick + Feather → 4 Arrows.

Simplified recipe:
```
I . .
S . .
F . .    →  Arrows (4)
```

## Bow Mechanics

- **Equip**: Select bow from hotbar (slot with bow item)
- **Draw**: Hold right-click to draw bow (charge time 0-1.5s)
- **Release**: Release right-click to fire arrow
- **Arrow speed**: 30 blocks/sec at full draw, 15 at half draw
- **Arrow gravity**: -20 blocks/sec² (arcs downward)
- **Arrow range**: ~50 blocks at full draw
- **Arrow damage**: 6 HP at full draw, 3 HP at half draw
- **Arrow hit**: Raycast or AABB collision with mobs + blocks
- **Arrow stick**: Arrow sticks into blocks on hit (visual, disappears after 10s)
- **Arrow pickup**: Walk over dropped arrows to pick up (survival mode)

## Visual

- **Bow in hand**: Simple bow shape (arc + string) rendered as overlay when equipped
- **Arrow projectile**: Small thin box (0.1 x 0.1 x 0.8) with arrow color (brown + gray tip)
- **Arrow trail**: Optional subtle trail particle
- **Crosshair**: Changes to bow indicator when bow equipped

## Acceptance Criteria

- [ ] Bow craftable at crafting table (3 sticks, shapeless or shaped)
- [ ] Arrows craftable (iron + stick + feather → 4 arrows)
- [ ] Hold right-click to draw bow, release to fire
- [ ] Arrow has gravity and arcs
- [ ] Arrow damages mobs on hit (6 HP full draw, 3 HP half draw)
- [ ] Arrow sticks into blocks visually
- [ ] Arrow disappears after 10s if stuck
- [ ] Arrows can be picked up in survival mode
- [ ] Bow visual overlay when equipped
- [ ] No console errors
- [ ] 60fps maintained

## Files to Modify

- `jardvoxel-survival-crafting.js` — Add bow + arrow recipes
- `jardvoxel-survival.html` — Add bow draw/fire mechanics, arrow projectiles, collision
- `jardvoxel-survival-mesher.js` — Add block IDs 72-73
- `jardvoxel-survival-mobs.js` — Arrow hit detection on mobs
