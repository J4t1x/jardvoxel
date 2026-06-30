---
spec_id: SPEC-064
title: "Achievements / Advancements System"
priority: medium
estimated_time: 3h
depends_on: []
status: pending
created_at: 2026-06-25
updated_at: 2026-06-25
---

# SPEC-064: Achievements / Advancements System

## Description

Add an in-game achievement system that tracks player milestones. Achievements pop up as toast notifications when unlocked and are viewable in an achievements panel.

## Requirements

### Achievement Categories
1. **Mining**: First block broken, mine 100 blocks, mine diamond ore, mine obsidian
2. **Building**: Place first block, place 100 blocks, build a structure (place 50 blocks in one area)
3. **Combat**: First mob kill, kill 10 mobs, kill 50 mobs, survive a night without armor
4. **Exploration**: Travel 1000 blocks from spawn, discover all biomes, enter nether, find a village
5. **Crafting**: Craft first tool, craft full iron armor, craft enchanting table, craft brewing stand
6. **Survival": Eat first food, survive first night, reach full health, reach full hunger, sleep in bed
7. **Farming**: Harvest first crop, catch first fish, breed first animal
8. **Redstone**: Place first redstone, create a circuit (lever + lamp)

### Achievement Data Structure
```javascript
const ACHIEVEMENTS = {
  'first_block': { id: 'first_block', name: 'Getting Wood', desc: 'Break a wood block', icon: '🪵', category: 'mining', hidden: false },
  'mine_100': { id: 'mine_100', name: 'Quarry Master', desc: 'Break 100 blocks', icon: '⛏', category: 'mining' },
  // ... 30+ achievements
};
```

### Tracking System
- `this.achievementManager` tracks progress
- Checks achievements every second in game loop
- Persists unlocked achievements in save data (localStorage)
- Toast notification on unlock: slide-in from right, 3s display, slide-out
- Sound effect on unlock (ascending chime)

### UI
- Achievements button in pause screen and main menu
- Achievements panel: grid of all achievements (locked = grayed out, unlocked = colored)
- Category filter tabs
- Progress bar: X/Y achievements unlocked
- Click achievement for description

### Toast Notification
- Position: top-right corner, below minimap
- Size: 300px wide, 60px tall
- Content: icon + name + description
- Animation: slide-in from right (0.3s), hold 3s, slide-out (0.3s)
- Stack: if multiple unlock at once, queue them

## Acceptance Criteria

- [ ] 30+ achievements defined across 8 categories
- [ ] Achievement tracking in game loop
- [ ] Toast notification on unlock with slide animation
- [ ] Achievement sound effect (Web Audio API chime)
- [ ] Achievements panel accessible from pause/main menu
- [ ] Locked achievements grayed out, unlocked colored
- [ ] Category filter tabs in achievements panel
- [ ] Progress counter (X/Y unlocked)
- [ ] Achievements persist in save data
- [ ] No console errors when unlocking achievements
