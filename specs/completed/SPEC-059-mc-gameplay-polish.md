# SPEC-059: Minecraft Variant — Gameplay Polish

## Priority: High
## Estimated: 3h
## Depends on: —

## Problem
Several gameplay issues in `jardvoxel-survival.html`:
1. Mining progress uses hardcoded `1/60` instead of `dt` — frame-rate dependent
2. No hold-to-mine — must click repeatedly
3. No lava collision damage
4. No minimap for navigation
5. Placeholder comment in lapis block recipe (confusing)

## Requirements

### 1. Hold-to-Mine + dt Fix
- Track `mouseLeftDown` state on mousedown/mouseup
- Call `_breakBlock()` in animate loop when mouse held
- Store `currentDt` from animate loop
- Replace `(1/60)` with `this.currentDt` in mining progress
- Skip mining when UI panels are open

### 2. Lava Collision Damage
- Check player feet block for lava each frame
- Apply 4 HP damage every 1 second in survival mode
- Trigger damage flash effect

### 3. Minimap
- 120px circular canvas in top-right corner
- Top-down terrain rendering with block color mapping
- Player direction arrow (white triangle)
- Throttled to 2fps for performance
- Limited Y scan range (player Y +10 to -30)

### 4. Lapis Block Comment Cleanup
- Remove confusing placeholder comments
- Document recipe as intentional simplification

## Acceptance Criteria
- [x] Hold-to-mine works (hold left click to mine continuously)
- [x] Mining speed is frame-rate independent (uses dt)
- [x] Lava deals 4 HP/second damage in survival
- [x] Minimap shows terrain colors in top-right
- [x] Minimap shows player facing direction
- [x] Minimap doesn't impact FPS (throttled)
- [x] Lapis block comment is clean
- [x] No console errors
