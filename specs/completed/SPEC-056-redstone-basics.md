---
spec_id: SPEC-056
title: "Redstone Basics"
priority: medium
estimated_time: 5h
depends_on: []
status: pending
created_at: 2026-06-25
updated_at: 2026-06-25
---

# SPEC-056: Redstone Basics

## Description

Add redstone dust, power sources (lever, pressure plate, redstone torch), and powered components (lamp, piston). Enable simple circuit building.

## Requirements

### New Blocks (129-135)
- 129: Redstone Dust (placed on top of blocks, conducts power up to 15 blocks)
- 130: Redstone Ore (red, found underground, glows when stepped on)
- 131: Lever (toggle power on/off, placed on block face)
- 132: Redstone Torch (power source, emits light, placed on block face)
- 133: Stone Pressure Plate (activates when player/mob stands on it)
- 134: Redstone Lamp (lights up when powered)
- 135: Piston (pushes blocks when powered, up to 12 blocks)

### Redstone Power System
- Power level: 0-15 (15 = full power from source)
- Power decreases by 1 per block of redstone dust
- Sources: lever (15), redstone torch (15), pressure plate (15)
- Powered components activate when receiving power > 0
- Redstone update tick: every 0.1s, check all connected dust + components

### Redstone Dust
- Placed on top of solid blocks
- Connects to adjacent dust and power sources
- Visual: red line on block surface, brightness indicates power level
- Power propagation: BFS from sources, decrease level per block

### Piston
- Pushes up to 12 blocks in facing direction when powered
- Retracts when unpowered
- Pushed blocks update neighbors
- Cannot push bedrock, obsidian, or other pistons

### Lever
- Right-click to toggle on/off
- Visual: lever arm position changes
- Emits power to adjacent dust and components

### Pressure Plate
- Activates when entity stands on it
- Deactivates when entity steps off
- Emits power to adjacent dust

### Redstone Lamp
- Emits light (level 15) when powered
- Visual: bright orange when on, dark when off

## Acceptance Criteria

- [ ] 7 new block IDs (129-135) with colors, names, hardness
- [ ] Redstone ore generates underground
- [ ] Redstone dust placed on blocks, connects to adjacent dust/sources
- [ ] Power propagation: BFS from sources, level decreases per block
- [ ] Lever toggles power on/off with right-click
- [ ] Redstone torch emits constant power
- [ ] Pressure plate activates on entity step
- [ ] Redstone lamp lights up when powered
- [ ] Piston pushes blocks when powered, retracts when unpowered
- [ ] Redstone update tick runs at 0.1s interval
- [ ] No console errors with redstone circuits
