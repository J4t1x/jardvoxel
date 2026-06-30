---
spec_id: SPEC-088
title: "Dynamic Quest System"
priority: critical
estimated_time: 16h
depends_on: ["SPEC-086", "SPEC-087"]
status: pending
phase: 5
created_at: 2026-06-28
updated_at: 2026-06-28
---

# SPEC-088: Dynamic Quest System

## Description

Procedural quest system with 7 quest types, difficulty scaling, rewards, quest tracker UI, and AI integration for custom quests.

## Requirements

### Quest Types (7)
1. **Fetch**: bring X items from Y location
2. **Explore**: visit structure/location
3. **Defeat**: eliminate N mobs of type Z
4. **Build**: construct structure with requirements
5. **Escort**: accompany NPC to destination
6. **Deliver**: take item from NPC A to NPC B
7. **Discover**: find archaeological site/ruins

### Quest Generation
- Trigger: NPC conversation, structure discovery, event
- Difficulty scaling: based on player level + equipment
- Rewards: items, XP, NPC relationship, lore, area access

### Quest State
- `active`: in progress (tracker visible)
- `completed`: finished (reward given)
- `failed`: time out or objective destroyed
- `abandoned`: cancelled by player

### Quest Tracker UI
- Max 5 active quests
- Real-time progress
- Notification on objective completion
- Map markers for locations

### AI Integration
- AI server can generate custom quests based on context
- Quests unique per world (non-repeatable)
- Quests can trigger chain events

## Acceptance Criteria

- [ ] 7 quest types implemented
- [ ] Quests trigger from conversations, discoveries, events
- [ ] Difficulty scales with player level
- [ ] Rewards appropriate to difficulty
- [ ] Quest tracker shows max 5 active quests
- [ ] Real-time progress tracking
- [ ] Map markers for quest locations
- [ ] Quest state transitions work (active→completed/failed/abandoned)
- [ ] AI server can generate custom quests
- [ ] No console errors

## Files to Create

- **Create:** `core/jardvoxel-survival-quests.js`
- **Create:** `tests/quests.test.js`
