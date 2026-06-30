---
spec_id: SPEC-065
title: "Anvil & Item Repair"
priority: medium
estimated_time: 3h
depends_on: ["SPEC-051", "SPEC-052"]
status: pending
created_at: 2026-06-25
updated_at: 2026-06-25
---

# SPEC-065: Anvil & Item Repair

## Description

Add anvil block for repairing tools/armor, combining enchantments, and renaming items. Uses XP levels for operations.

## Requirements

### New Block (153)
- 153: Anvil (crafted with 3 iron blocks + 4 iron ingots — heavy, falls like sand)

### Anvil UI
- Right-click anvil opens UI with 3 slots: Input 1 (item to repair), Input 2 (material/second item), Output
- XP level cost shown below output slot
- 3 operations:
  1. **Repair**: Same item type in both slots → merge durability + 10% bonus, cost 1 level
  2. **Combine**: Two enchanted items → merge enchantments onto one, cost 2 levels
  3. **Rename**: No input 2, type new name in text field → rename item, cost 1 level

### Repair Mechanics
- Place damaged tool in slot 1, same material in slot 2 (e.g., iron ingot for iron pickaxe)
- Each material restores 25% durability, cost 1 level per material
- Or place same tool type in slot 2 → merge durabilities + 10% bonus
- Output item has combined durability (max = maxDurability)

### Enchantment Combination
- Two items with different enchantments → output has both
- Same enchantment → higher level (capped at max)
- Cost: 2 XP levels per enchantment merged

### Renaming
- Text input field below slot 1
- Type custom name (max 30 chars)
- Cost: 1 XP level
- Renamed items show custom name in inventory and HUD

### Anvil Falling
- Anvil block falls like sand when placed without support below
- Anvil deals damage to entities it lands on (2-6 HP based on fall distance)
- Anvil has 3 damage states: pristine, chipped, damaged (visual only, degrades with use)
- After 25 uses, anvil breaks into iron ingots

### Visual
- Anvil model: dark gray block with anvil shape on top
- UI: dark panel with 3 slots + name field + XP cost indicator
- XP cost text: green if affordable, red if not

## Acceptance Criteria

- [ ] Anvil block (ID 153) with crafting recipe
- [ ] Anvil falls like sand, damages entities on landing
- [ ] Anvil UI with 3 slots + rename field + XP cost
- [ ] Repair: same material restores 25% durability per unit
- [ ] Repair: same tool merges durability + 10% bonus
- [ ] Enchantment combination: merge different enchants onto one item
- [ ] Rename: custom name with 30 char limit
- [ ] XP level cost per operation
- [ ] Anvil degrades with use (3 visual states)
- [ ] Anvil breaks after 25 uses
- [ ] Renamed items show custom name in inventory
- [ ] No console errors during anvil operations
