---
spec_id: SPEC-062
title: "Brewing & Potions System"
priority: high
estimated_time: 5h
depends_on: ["SPEC-052"]
status: pending
created_at: 2026-06-25
updated_at: 2026-06-25
---

# SPEC-062: Brewing & Potions System

## Description

Add brewing stand block, potion items, and potion effects. Players craft a brewing stand, brew potions from ingredients, and drink them for timed effects (speed, strength, healing, night vision, etc.).

## Requirements

### New Blocks (136-140)
- 136: Brewing Stand (block, placed in world, right-click to open brewing UI)
- 137: Blaze Rod (from nether — blaze mob drop or nether crafting)
- 138: Nether Wart (found in nether fortresses, grows on soul sand)
- 139: Glass Bottle (crafted from 3 glass blocks)
- 140: Cauldron (holds water for filling bottles)

### Potion Items (141-150)
- 141: Water Bottle (glass bottle filled with water)
- 142: Awkward Potion (base potion from nether wart + water bottle)
- 143: Potion of Speed (sugar + awkward potion) — speed +20% for 3 min
- 144: Potion of Strength (blaze powder + awkward potion) — damage +3 for 3 min
- 145: Potion of Healing (glistering melon + awkward potion) — instant +4 HP
- 146: Potion of Night Vision (golden carrot + awkward potion) — full brightness for 3 min
- 147: Potion of Fire Resistance (magma cream + awkward potion) — immune to lava/fire for 3 min
- 148: Potion of Regeneration (ghast tear + awkward potion) — +1 HP/sec for 45s
- 149: Splash Potion of Healing (gunpowder + healing potion) — AoE heal on throw
- 150: Potion of Water Breathing (pufferfish + awkward potion) — breathe underwater for 3 min

### Brewing Mechanics
- Place brewing stand → right-click opens 3-slot UI (ingredient + 2 bottle slots)
- Put water bottles in bottle slots, add ingredient in top slot
- Brewing takes 20 seconds, consumes ingredient, transforms bottles
- Fuel: blaze powder (1 powder = 20 brewing operations)

### Potion Effects System
- Active effects stored on player: `this.activeEffects = [{ type, duration, amplifier }]`
- Effects tick down each frame, apply modifiers
- Speed: multiply moveSpeed by (1 + 0.2 * amplifier)
- Strength: add damageBonus to mob attacks
- Healing: instant HP restore on drink
- Night Vision: set ambient light to full brightness
- Fire Resistance: cancel lava/fire damage
- Regeneration: +1 HP per second
- Water Breathing: cancel oxygen depletion underwater
- Effect particles: colored aura around player (green=speed, red=strength, etc.)
- Effect timer shown in HUD (icon + countdown bar)

### UI
- Brewing stand UI: 3 slots (1 ingredient top, 2 bottle bottom) + fuel indicator
- Potion drinking: right-click potion in hotbar → drink → effect starts
- Splash potion: right-click to throw → projectile → AoE on impact
- Active effects panel: top-center HUD, small icons with timer bars

## Acceptance Criteria

- [ ] Brewing Stand block (ID 136) with crafting recipe (3 cobblestone + 1 blaze rod)
- [ ] Glass Bottle item (ID 139) craftable from 3 glass
- [ ] Water Bottle: fill bottle at water block or cauldron
- [ ] Brewing UI with ingredient + bottle slots + fuel
- [ ] 8 potion types with distinct effects
- [ ] Potion effects system: timed, stacking, with modifiers
- [ ] Effect particles (colored aura) visible on player
- [ ] Effect timers in HUD
- [ ] Splash potion throwing mechanic with AoE
- [ ] Cauldron block holds water for bottle filling
- [ ] No console errors during brewing/drinking
