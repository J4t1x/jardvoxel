---
spec_id: SPEC-052
title: "Experience & Enchanting"
priority: medium
estimated_time: 5h
depends_on: ["SPEC-051"]
status: pending
created_at: 2026-06-25
updated_at: 2026-06-25
---

# SPEC-052: Experience & Enchanting

## Description

Add XP orbs from mining ores and killing mobs. Collect XP to gain levels. Use enchanting table to apply enchantments to tools and armor.

## Requirements

### XP System
- XP orbs drop from: coal ore (1), iron ore (2), gold ore (3), diamond ore (5), mob kills (3-7)
- XP orbs are small glowing particles that float toward player when within 3 blocks
- Player collects XP by walking near orbs
- XP bar in HUD (green bar above hotbar)
- Levels: 1 level = 10 XP, 2 = 20, etc. (linear for simplicity)
- Level number shown in HUD

### Enchanting
- Enchanting Table block (ID 100) crafted with 4 obsidian + 2 diamond + 1 book
- Right-click enchanting table opens enchant UI
- Enchant UI: 3 slot input (tool + lapis + book), 3 enchantment options
- Enchantments (simplified, 1 per item):
  - Efficiency: mining speed +50%
  - Unbreaking: durability ×1.5
  - Sharpness: sword damage +3
  - Protection: armor damage reduction +10%
  - Fortune: ore drops +1
- Cost: 1 level + 1 lapis per enchant
- Enchanted items show purple name text

### New Blocks
- 100: Enchanting Table (purple glow, emissive)
- 101: Lapis Lazuli Block (blue, from lapis ore smelting)
- 102: Book (from 3 paper + 1 leather; paper from 3 sugar cane — simplified to 3 bamboo)

## Acceptance Criteria

- [ ] XP orbs spawn from ore mining and mob kills
- [ ] XP orbs float toward player and get collected
- [ ] XP bar and level number in HUD
- [ ] Enchanting Table block (ID 100) with crafting recipe
- [ ] Enchanting UI with 3-slot input and 3 enchantment options
- [ ] 5 enchantment types with effects
- [ ] Enchanted items show purple name in inventory
- [ ] Lapis block and book items craftable
- [ ] No console errors during enchanting flow
