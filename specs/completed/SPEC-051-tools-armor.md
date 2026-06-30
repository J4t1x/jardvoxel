---
spec_id: SPEC-051
title: "Tools & Armor System"
priority: high
estimated_time: 6h
depends_on: []
status: pending
created_at: 2026-06-25
updated_at: 2026-06-25
---

# SPEC-051: Tools & Armor System

## Description

Add craftable tools (pickaxe, axe, shovel, sword) and wearable armor (helmet, chestplate, leggings, boots) with material tiers (wood, stone, iron, diamond). Tools increase mining speed; armor reduces damage taken.

## Requirements

### New Block IDs (80-99)
- 80: Wood Pickaxe, 81: Stone Pickaxe, 82: Iron Pickaxe, 83: Diamond Pickaxe
- 84: Wood Axe, 85: Stone Axe, 86: Iron Axe, 87: Diamond Axe
- 88: Wood Shovel, 89: Stone Shovel, 90: Iron Shovel, 91: Diamond Shovel
- 92: Wood Sword, 93: Stone Sword, 94: Iron Sword, 95: Diamond Sword
- 96: Iron Helmet, 97: Iron Chestplate, 98: Iron Leggings, 99: Iron Boots

### Tool Mechanics
- Equipped tool affects mining speed multiplier: wood=2x, stone=4x, iron=6x, diamond=10x
- Pickaxe: affects stone/ore blocks only
- Axe: affects wood/log blocks only
- Shovel: affects dirt/sand/gravel blocks only
- Sword: affects mob damage (+2 to +8 per tier)
- Tools have durability (wood=60, stone=130, iron=250, diamond=1560)
- Tool breaks when durability reaches 0, removed from inventory

### Armor Mechanics
- 4 slots: helmet, chestplate, leggings, boots
- Each piece reduces damage by a percentage (iron: 8% helmet, 12% chest, 10% legs, 4% boots)
- Full iron set = ~34% damage reduction
- Armor has durability (iron: 165 helmet, 240 chest, 225 legs, 195 boots)
- Armor breaks when durability reaches 0

### Crafting Recipes
- Pickaxe: 3 material on top row + 2 sticks in middle column
- Axe: 3 material (L-shape) + 1 stick
- Shovel: 1 material on top + 2 sticks below
- Sword: 2 material vertical + 1 stick at bottom
- Armor: iron ingots in shape patterns (helmet = U-shape, chest = torso, legs = inverted U, boots = feet)

### UI
- Tool/armor slots in inventory panel
- Armor slots panel (4 slots) above crafting grid
- Equipped armor shown as icons in HUD
- Tool durability bar (colored overlay on item icon)
- Current tool indicator in HUD

## Acceptance Criteria

- [ ] 20 new block IDs (80-99) with colors, names, hardness
- [ ] Tool type enum (pickaxe, axe, shovel, sword) with material tiers
- [ ] Mining speed multiplier applied based on equipped tool + block type match
- [ ] Tool durability decrements on use, breaks at 0
- [ ] Sword increases mob damage
- [ ] Armor slots in inventory UI (4 slots)
- [ ] Armor damage reduction applied to player damage
- [ ] Armor durability decrements on hit, breaks at 0
- [ ] 16 crafting recipes (4 tools × 4 tiers + 4 armor pieces)
- [ ] Tool/armor items placeable in inventory and equippable
- [ ] HUD shows equipped tool name + armor icons
- [ ] No console errors when equipping/using tools/armor
