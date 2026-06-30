---
spec_id: SPEC-066
title: "Map & Cartography"
priority: medium
estimated_time: 4h
depends_on: []
status: pending
created_at: 2026-06-25
updated_at: 2026-06-25
---

# SPEC-066: Map & Cartography

## Description

Add craftable map item that renders explored terrain in real-time on a canvas. Map updates as player moves, showing blocks, biomes, and structures. Map can be zoomed and expanded.

## Requirements

### New Items (154-156)
- 154: Map (crafted with 8 paper + 1 compass — compass = 4 iron ingots + 1 redstone)
- 155: Compass (crafted with 4 iron ingots in cross pattern + 1 redstone center)
- 156: Cartography Table (crafted with 4 planks + 2 paper — used to zoom/clone maps)

### Map Item
- Right-click map in hotbar → opens map overlay (fullscreen, semi-transparent)
- Map renders top-down view of explored area centered on player
- Resolution: 1 pixel = 1 block, map covers 128x128 block area
- Colors match block types: grass=green, water=blue, sand=yellow, stone=gray, etc.
- Player position: white arrow showing direction
- Structures: marked with icons (house=village, pyramid=temple, X=mineshaft)
- Unexplored areas: black/void
- Map updates in real-time as player explores

### Map Tiers
- Tier 0: 128x128 blocks (default)
- Tier 1: 256x256 (zoom out at cartography table, costs 1 paper)
- Tier 2: 512x512 (zoom out again, costs 1 paper)
- Tier 3: 1024x1024 (max zoom, costs 1 paper)
- Each zoom: map re-centered on player, previous data preserved but scaled

### Map Rendering
- Use offscreen canvas (128x128 or scaled) for map data
- Store explored block data in `this.mapData = { pixels: Uint8Array(128*128), centerX, centerZ, tier }`
- Update map when player moves to new chunk: sample top block at each position
- Render map as canvas texture on UI overlay
- Player marker: white triangle rotated by yaw

### Compass
- Compass item: needle points to world spawn (north = spawn direction)
- Compass rendered in HUD when in hotbar (small compass icon with rotating needle)
- Compass used as crafting ingredient for map

### Cartography Table
- Right-click opens UI with 2 input slots + 1 output
- Input 1: map, Input 2: paper → output: zoomed map (next tier)
- Input 1: map, Input 2: empty map → output: copy of map (clone)

### UI
- Map overlay: centered, 70% of screen, semi-transparent border
- Close map: right-click or ESC
- Map in hotbar: shows as item with mini-map preview icon
- Coordinates display on map: X/Z at player position

## Acceptance Criteria

- [ ] Map item (ID 154) craftable with paper + compass
- [ ] Compass item (ID 155) points to spawn
- [ ] Cartography table (ID 156) for zooming/cloning
- [ ] Right-click map opens fullscreen overlay
- [ ] Map renders explored terrain with block-appropriate colors
- [ ] Player marker (white arrow) shows position and direction
- [ ] Unexplored areas show as black
- [ ] Map updates in real-time as player explores
- [ ] 4 zoom tiers (128, 256, 512, 1024 blocks)
- [ ] Cartography table zooms and clones maps
- [ ] Structures marked with icons on map
- [ ] Coordinates displayed on map overlay
- [ ] No console errors during map rendering
