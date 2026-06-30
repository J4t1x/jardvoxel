---
spec_id: SPEC-090
title: "Ancient Civilizations"
priority: critical
estimated_time: 16h
depends_on: ["SPEC-081", "SPEC-080"]
status: pending
phase: 5
created_at: 2026-06-28
updated_at: 2026-06-28
---

# SPEC-090: Ancient Civilizations

## Description

Each world generates 1-3 ancient civilizations with unique history. Player discovers ruins gradually, each discovery reveals part of the story. Artifacts can combine to reveal more lore.

## Requirements

### Civilization Generation
- Each world generates 1-3 ancient civilizations
- Each civilization has:
  - `name`: procedural
  - `era`: age of stone, age of bronze, age of magic
  - `culture`: builders, warriors, scholars, mystics
  - `decline_reason`: war, plague, cataclysm, mystery
  - `remnants`: structures, artifacts, texts
- Distribution: structures in specific biomes

### Discovery System
- Player finds ruins gradually
- Each discovery reveals part of history
- Artifacts can combine to reveal more lore
- Books found tell the complete history

### Archaeological Sites
- Partial excavation in terrain
- Fossils: extinct creature skeletons
- Artifacts: tools, weapons, ornaments (unique)
- Texts: ancient language fragments
- Each site connects to its civilization

### Rewards
- Unique artifacts (non-craftable)
- Knowledge: unlock ancient recipes
- Access to hidden structures
- Lore: complete world history

## Acceptance Criteria

- [ ] 1-3 civilizations generated per world
- [ ] Each civilization has name, era, culture, decline reason
- [ ] Ruins distribute across appropriate biomes
- [ ] Discoveries reveal history progressively
- [ ] Artifacts are unique (non-craftable)
- [ ] Books tell civilization history
- [ ] Archaeological sites with fossils + artifacts + texts
- [ ] Ancient recipes unlockable
- [ ] No console errors

## Files to Create/Modify

- **Create:** `core/jardvoxel-survival-civilizations.js`
- **Modify:** `core/jardvoxel-survival-features.js` (integrate into world gen)
- **Create:** `tests/civilizations.test.js`
