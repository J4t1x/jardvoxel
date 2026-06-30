---
spec_id: SPEC-063
title: "Shields & Combat Defense"
priority: high
estimated_time: 3h
depends_on: ["SPEC-051"]
status: pending
created_at: 2026-06-25
updated_at: 2026-06-25
---

# SPEC-063: Shields & Combat Defense

## Description

Add craftable shields that block incoming mob damage when raised. Shields have durability and can be combined with banners for customization (simplified to color customization).

## Requirements

### New Items (151-152)
- 151: Shield (crafted with 6 planks + 1 iron ingot)
- 152: Banner (crafted with 6 wool of same color — decorative, placed on shield)

### Shield Mechanics
- Equip shield in off-hand slot (new slot in inventory, left of armor slots)
- Right-click (or hold) raises shield: player moves at 50% speed, cannot attack
- Shield blocks 100% of frontal mob damage (within ~120 degree cone)
- Shield has durability (iron: 336 hits)
- Shield takes 1 durability per blocked hit
- Shield breaks at 0 durability
- Axe attacks disable shield for 5 seconds (if mob uses axe — simplified: 10% chance per hit to disable)
- Shield bash: while blocking, if mob is within 2 blocks, knockback mob

### Off-Hand Slot
- New UI slot in inventory panel, left of armor slots
- Can hold shield or any item
- Off-hand item rendered on player model (left arm)

### Combat Improvements
- Mob attack telegraph: mob flashes red 0.2s before attacking (visual cue)
- Knockback resistance: player has 0.4 knockback resistance (mobs push less)
- Critical hits: jumping and attacking deals +50% damage
- Sweep attack: hitting a mob while sprinting hits adjacent mobs too

### Visual
- Shield model: flat quad attached to left arm when equipped
- Block animation: shield moves to front of player when blocking
- Shield durability bar (like tools)
- Mob attack telegraph: red flash overlay on mob

## Acceptance Criteria

- [ ] Shield item (ID 151) with crafting recipe
- [ ] Off-hand slot in inventory UI
- [ ] Right-click raises shield, blocks frontal damage
- [ ] Shield durability decrements per blocked hit
- [ ] Shield breaks at 0 durability
- [ ] Player speed reduced to 50% while blocking
- [ ] Cannot attack while shield is raised
- [ ] Shield bash knockback on close mobs
- [ ] Mob attack telegraph (red flash)
- [ ] Critical hit bonus (+50% when jumping)
- [ ] Sprint sweep attack hits adjacent mobs
- [ ] Shield rendered on player model
- [ ] No console errors during combat with shield
