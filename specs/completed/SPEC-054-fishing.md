---
spec_id: SPEC-054
title: "Fishing System"
priority: medium
estimated_time: 3h
depends_on: []
status: pending
created_at: 2026-06-25
updated_at: 2026-06-25
---

# SPEC-054: Fishing System

## Description

Add fishing rod item. Right-click on water to cast bobber. Wait for bite, right-click again to reel in and catch fish.

## Requirements

### Fishing Rod
- New block ID 106: Fishing Rod
- Crafted with 3 sticks + 2 string (diagonal pattern)
- Has durability (64 uses)

### Fishing Mechanic
- Right-click while looking at water block within 5 blocks → cast bobber
- Bobber: small red/white sphere that floats on water surface
- Random wait time: 5-15 seconds before bite
- Bite indicator: bobber dips underwater + splash sound
- Right-click during bite window (1.5s) → catch fish
- If too early or too late: no catch, can recast

### Catches
- Raw Fish (ID 107): 70% chance, food item (2 hunger)
- Raw Salmon (ID 108): 20% chance, food item (3 hunger)
- Junk (leather, string, bones): 8% chance
- Treasure (iron_ingot, gold_ingot, emerald): 2% chance

### Cooking
- Raw Fish + furnace → Cooked Fish (ID 109): 5 hunger
- Raw Salmon + furnace → Cooked Salmon (ID 110): 6 hunger

### Audio
- Cast sound: splash (low pitch)
- Bite sound: splash (high pitch)
- Reel sound: splash (medium pitch)

## Acceptance Criteria

- [ ] Fishing Rod item (ID 106) with crafting recipe
- [ ] Right-click on water casts bobber entity
- [ ] Bobber floats on water, dips on bite
- [ ] Random 5-15s wait before bite
- [ ] 1.5s bite window for catching
- [ ] 4 catch types with probability table
- [ ] Raw/cooked fish and salmon food items
- [ ] Fishing rod durability decrements per use
- [ ] Splash sounds for cast/bite/reel
- [ ] No console errors during fishing
