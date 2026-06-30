---
spec_id: SPEC-086
title: "NPC Memory System"
priority: critical
estimated_time: 16h
depends_on: ["SPEC-085"]
status: pending
phase: 5
created_at: 2026-06-28
updated_at: 2026-06-28
---

# SPEC-086: NPC Memory System

## Description

NPCs with persistent memory: identity (name, profession, personality, backstory), memory (interactions, relationship, known facts, preferences, quests given), state (mood, daily routine, current activity, location), and persistence via IndexedDB.

## Requirements

### NPC Identity
- `name`: procedural (from LoreGenerator)
- `profession`: farmer, blacksmith, merchant, scholar, guard
- `personality`: friendly, grumpy, mysterious, cheerful, stoic
- `backstory`: procedural (2-3 sentences)

### NPC Memory
- `playerInteractions`: Map<timestamp, interaction>
- `relationship`: -100 (hostile) → +100 (friend)
- `knownFacts`: Set<factId> (things NPC knows about the world)
- `preferences`: items liked/disliked
- `questsGiven`: list of quests given to player

### NPC State
- `mood`: happy, sad, angry, scared, neutral
- `dailyRoutine`: schedule of activities
- `currentActivity`: mining, farming, sleeping, talking, wandering
- `location`: home, workplace, wandering

### Persistence
- Serialize NPC memory to IndexedDB (existing SaveManager)
- Load on world restore
- LRU cache for NPC memory (max 50 NPCs in memory)

## Acceptance Criteria

- [ ] NPCs have procedural identity (name, profession, personality, backstory)
- [ ] NPC remembers player interactions
- [ ] Relationship score changes with interactions
- [ ] NPCs have mood that affects behavior
- [ ] Daily routine with activities
- [ ] Memory persists across save/load
- [ ] LRU cache prevents memory bloat
- [ ] No console errors

## Files to Create/Modify

- **Create:** `core/jardvoxel-survival-npc-memory.js`
- **Modify:** `core/jardvoxel-survival-villagers.js` (integrate memory)
- **Modify:** `core/jardvoxel-survival-save.js` (persist NPC memory)
- **Create:** `tests/npc-memory.test.js`
