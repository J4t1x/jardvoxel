# SPEC-061: Minecraft Variant — Audio Expansion

## Priority: Medium
## Estimated: 1.5h
## Depends on: -

## Problem
Only break, place, and step sounds exist. Missing splash, jump, land, and ambient cave sounds.

## Requirements

### 1. Splash Sound
- Triggered when player enters water (transition from dry to in-water)
- Low-pass filtered noise burst with frequency sweep (800→200Hz)
- Duration 0.3s, gain 0.15

### 2. Jump Sound
- Triggered when player jumps (space + onGround)
- Sine wave with frequency sweep (300→500Hz)
- Duration 0.1s, gain 0.08

### 3. Land Sound
- Triggered when player lands on ground (was airborne → onGround)
- Low-pass filtered noise burst at 300Hz
- Duration 0.15s, gain 0.12

### 4. Ambient Cave Sound
- Triggered when player is underground (Y < WORLD_MIN_Y + 30)
- Random chance every 15s (30% base + 40% at night)
- Sawtooth wave at low frequency (30-70Hz) with low-pass filter
- Duration 2s with fade in/out

### 5. Player State Tracking
- `justJumped`, `justLanded`, `justSplashed` flags on PlayerController
- Flags consumed in animate loop, reset after playing sound
- `wasInWater` and `wasOnGround` track previous state

## Acceptance Criteria
- [x] Splash sound plays when entering water
- [x] Jump sound plays when jumping
- [x] Land sound plays when landing
- [x] Ambient cave sound plays randomly underground
- [x] Cave sound more frequent at night
- [x] All sounds use Web Audio API (no external files)
- [x] No console errors
