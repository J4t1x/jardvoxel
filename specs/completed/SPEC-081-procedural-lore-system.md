---
spec_id: SPEC-081
title: "Procedural Lore System"
priority: medium
estimated_time: 16h
depends_on: []
status: pending
phase: 3
created_at: 2026-06-28
updated_at: 2026-06-28
---

# SPEC-081: Procedural Lore System

## Description

Procedural lore generation: names for villages/characters/structures, historical events, procedural books (lore, recipes, maps, journals), and legends that circulate among NPCs.

## Requirements

### LoreGenerator
- **NameGenerator**: procedural names for villages, characters, structures
  - Syllable-based generation (prefixes + roots + suffixes)
  - Biome-appropriate naming (desert names differ from forest names)
  - Unique per world (seeded by world seed)

- **HistoryGenerator**: events per structure
  - `founding_event`: what originated the structure
  - `decline_event`: why abandoned/destroyed
  - `notable_figure`: who inhabited it

- **BookGenerator**: procedural books
  - Lore books: world history, legends
  - Recipe books: unique crafting recipes
  - Maps: treasure locations
  - Journals: NPC diaries
  - Books are readable items in inventory

- **LegendSystem**: legends circulating among NPCs
  - Each world generates 5-10 unique legends
  - Legends reference real locations
  - NPCs can tell legends in conversation

### Implementation
- Pure JS module, no external dependencies
- Seeded random (world seed) for reproducibility
- Text generation via templates + word banks
- Book content stored as string in item data

## Acceptance Criteria

- [ ] NameGenerator produces unique names per world seed
- [ ] HistoryGenerator creates founding/decline/figure for structures
- [ ] BookGenerator creates 4 book types (lore, recipe, map, journal)
- [ ] Books are readable in inventory (text display)
- [ ] LegendSystem generates 5-10 legends per world
- [ ] Legends reference real world locations
- [ ] All generation is seeded (reproducible)
- [ ] No console errors

## Files to Create

- **Create:** `core/jardvoxel-survival-lore.js`
- **Create:** `tests/lore.test.js`
