---
spec_id: SPEC-055
title: "Nether Dimension"
priority: high
estimated_time: 8h
depends_on: []
status: pending
created_at: 2026-06-25
updated_at: 2026-06-25
---

# SPEC-055: Nether Dimension

## Description

Add a second dimension: the Nether. Accessible via nether portal (obsidian frame + flint/steel). Completely different terrain generation, blocks, and mobs.

## Requirements

### Portal System
- Nether Portal: 4x5 obsidian frame (minimum), activated with Flint & Steel (ID 111)
- Portal blocks (ID 112): purple emissive, animated texture
- Stepping into portal teleports to Nether dimension
- Return portal generates automatically in Nether
- Dimension switching: save current world state, load nether chunks

### Nether Terrain
- Flat lava sea at Y=8, netherrack terrain above
- No sky: black fog ceiling at Y=64
- Biomes: Nether Wastes (flat), Soul Sand Valley (soul sand + blue fog), Crimson Forest (crimson fungi)
- No water (water evaporates instantly)
- No day/night cycle (perpetual dim red lighting)

### New Blocks (113-120)
- 113: Netherrack (red, everywhere)
- 114: Soul Sand (dark brown, slows movement)
- 115: Glowstone (yellow emissive, ceiling)
- 116: Nether Quartz Ore (white veins in netherrack)
- 117: Crimson Nylium (red ground)
- 118: Crimson Fungus (red mushroom-like)
- 119: Magma Block (orange emissive, damages player)
- 120: Basalt (dark pillar formations)

### Nether Mobs
- Zombie Pigman (ID 121): neutral, attacks in groups if provoked, drops gold nugget
- Blaze (ID 122): floating, shoots fireballs, drops blaze rod
- Ghast (ID 123): large floating, shoots explosive fireballs, drops gunpowder + tear

### New Items
- 111: Flint & Steel (iron + flint, flint from gravel drop)
- 124: Nether Quartz (from quartz ore)
- 125: Gold Nugget (from pigman drop)
- 126: Blaze Rod (from blaze drop)
- 127: Ghast Tear (from ghast drop)

### Flint
- 128: Flint (10% chance drop from breaking gravel)

## Acceptance Criteria

- [ ] Nether portal built with obsidian frame + flint/steel activation
- [ ] Portal teleportation between overworld and nether
- [ ] Nether terrain: lava sea, netherrack, no water, no sky
- [ ] 3 nether biomes with distinct features
- [ ] 8 new nether blocks (113-120) with colors/names/hardness
- [ ] 3 nether mobs (121-123) with AI and drops
- [ ] Flint & Steel item (111) with crafting recipe
- [ ] 4 new items (124-128) from nether activities
- [ ] Nether chunks load/unload independently from overworld
- [ ] Return portal works correctly
- [ ] No console errors during dimension travel
