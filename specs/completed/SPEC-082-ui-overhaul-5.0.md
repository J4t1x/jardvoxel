---
spec_id: SPEC-082
title: "UI Overhaul 5.0"
priority: medium
estimated_time: 18h
depends_on: []
status: pending
phase: 4
created_at: 2026-06-28
updated_at: 2026-06-28
---

# SPEC-082: UI Overhaul 5.0

## Description

Complete UI redesign with pixel typography (Press Start 2P), minimalist panels, subtle animations, consistent pixel art iconography, and contextual information display.

## Requirements

### Pixel Font
- Load Press Start 2P from Google Fonts via CSS @import
- Apply to all UI text: HUD, inventory, dialogs, toasts, menus
- Fallback: monospace

### HUD Redesign
- **Hotbar**: center bottom, pixel art slots, slide animation on slot change
- **Health/Hunger**: pixel art hearts/hunger icons
- **Minimap**: top right corner, pixel art border
- **Clock**: pixel art day/night indicator
- **Biome indicator**: shows on entering new biome, fades out after 3s
- **Compass**: shows when looking around, fades out

### Dialog System
- Bottom panel with NPC pixel art portrait
- Typewriter text effect
- 4 numbered response options
- Close with click/ESC
- Slide up animation from bottom

### Quest Tracker
- Right side panel (collapsible)
- Max 3 active quests visible
- Pixel art progress bar
- Toast notification on quest completion

### Inventory Redesign
- Grid with pixel art slots
- Contextual tooltips
- Smooth drag & drop
- Categories: blocks, items, tools, food

### Map (expanded)
- Fullscreen on open
- Markers for discovered structures
- Known legends marked
- Zoom with scroll

### Animations
- Hotbar: horizontal slide on slot change
- Inventory: fade + scale on open/close
- Dialog: slide up from bottom
- Toast: slide in from right, auto-dismiss 4s
- Quest complete: golden flash + sound
- Death screen: fade to dark + centered text

## Acceptance Criteria

- [ ] Press Start 2P font loaded and applied to all UI
- [ ] HUD redesigned with pixel art style
- [ ] Dialog system with typewriter effect and 4 options
- [ ] Quest tracker with progress bars
- [ ] Inventory redesigned with categories
- [ ] Map with structure markers and zoom
- [ ] All UI animations work smoothly
- [ ] Biome indicator fades in/out
- [ ] Compass fades in/out
- [ ] No console errors

## Files to Modify

- **Modify:** `jardvoxel-survival.html` (CSS + UI elements)
- **Modify:** `core/jardvoxel-survival-gameplay.js` (UI logic)
- **Create:** `tests/ui-overhaul.test.js`
