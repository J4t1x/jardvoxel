---
spec_id: SPEC-083
title: "ChillTune 2.0"
priority: medium
estimated_time: 15h
depends_on: []
status: pending
phase: 4
created_at: 2026-06-28
updated_at: 2026-06-28
---

# SPEC-083: ChillTune 2.0

## Description

Evolve ChillTuneEngine from 7 game states to system that reacts to biome, time of day, weather, exploration events, villages, and special events.

## Requirements

### New Reactivity
- **Biome**: Plains (pentatonic, medium tempo), Forest (dorian, slow), Desert (phrygian, mysterious), Mountains (lydian, epic), Swamp (chromatic, drone), Mystic Grove (lydian + bright arpeggios), Ocean (aeolian + waves), Caves (dark drone + echoes)
- **Time of day**: Dawn (ascending soft), Day (full melody), Sunset (descending nostalgic), Night (minimalist + drone)
- **Weather**: Rain (percussion + attenuated melody), Snow (silence + crystal highs), Thunder (silences + dramatic impacts)
- **Exploration**: Structure discovery (3-note fanfare), new biome (scale transition), deep caves (echo + reverb)
- **Combat**: Fast transition (1s) to tension, tempo up, return to previous state after
- **Villages**: Warm melody, soft instruments, tempo up when approaching, silence in shops
- **Special events**: Archaeological discovery (mystic arpeggio), NPC death (silence + grave tone), legendary event (epic fanfare), first night in new biome (unique melody)

### Implementation
- Extend existing ChillTuneEngine in `jardvoxel-survival-chilltune.js`
- Add biome scale mapping (8 scales)
- Add time-of-day modulation
- Add weather percussion layer
- Add event stingers (short musical phrases)
- Crossfade between states (2s)

## Acceptance Criteria

- [ ] Music reacts to biome (8 biome-specific scales)
- [ ] Music reacts to time of day (4 phases)
- [ ] Music reacts to weather (3 weather types)
- [ ] Structure discovery triggers fanfare
- [ ] New biome triggers scale transition
- [ ] Combat transitions in <1s
- [ ] Village music warm and inviting
- [ ] Special event stingers work
- [ ] Crossfade between states (2s)
- [ ] No audio glitches/clicks
- [ ] No console errors

## Files to Modify

- **Modify:** `core/jardvoxel-survival-chilltune.js`
- **Create:** `tests/chilltune2.test.js`
