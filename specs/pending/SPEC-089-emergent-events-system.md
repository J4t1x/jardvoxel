---
spec_id: SPEC-089
title: "Emergent Events System"
priority: critical
estimated_time: 14h
depends_on: ["SPEC-085"]
status: pending
phase: 5
created_at: 2026-06-28
updated_at: 2026-06-28
---

# SPEC-089: Emergent Events System

## Description

Emergent world events: meteor showers, migrations, festivals, eclipses, auroras, earthquakes, trader caravans, lost travelers, ancient discoveries, legend reveals. Probability-based with cooldowns.

## Requirements

### Event Types (10)
1. **Meteor Shower**: sky rocks with rare minerals (night)
2. **Migration**: animal herd crosses biome
3. **Festival**: villagers celebrate, special music, free food
4. **Eclipse**: temporary darkness, special mobs appear
5. **Aurora**: lights in night sky (cold biomes)
6. **Earthquake**: terrain modifies, new caves exposed
7. **Trader Caravan**: wandering merchant with rare items
8. **Lost Traveler**: NPC asks for help (escort quest)
9. **Ancient Discovery**: structure emerges from terrain
10. **Legend Reveal**: NPC tells legend revealing secret location

### Triggers
- Time-based: eclipse, meteor shower, aurora
- Player-based: enter new biome, build large, mine deep
- NPC-based: death, festival, wedding, dispute
- World-based: drought, flood, migration, disease
- Random: low probability, high impact

### Implementation
- Probability check every 5 minutes of game time
- Cooldown: min 30 min between events
- Max 1 active event at a time
- Subtle notification (not intrusive)
- Event duration: 2-10 minutes depending on type

### AI Integration
- AI server can generate custom events
- Events can start quests
- Events can permanently change world state

## Acceptance Criteria

- [ ] 10 event types implemented
- [ ] Probability check every 5 min
- [ ] Cooldown of 30 min between events
- [ ] Max 1 active event
- [ ] Subtle notifications
- [ ] Events last 2-10 min
- [ ] AI server can generate events
- [ ] Events can trigger quests
- [ ] No console errors

## Files to Create

- **Create:** `core/jardvoxel-survival-events.js`
- **Create:** `tests/events.test.js`
