---
spec_id: SPEC-087
title: "Natural Conversation System"
priority: critical
estimated_time: 18h
depends_on: ["SPEC-085", "SPEC-086"]
status: pending
phase: 5
created_at: 2026-06-28
updated_at: 2026-06-28
---

# SPEC-087: Natural Conversation System

## Description

Natural conversations with NPCs via AI server. Right-click NPC triggers conversation. AI generates NPC response + player options. Fallback to template-based responses when AI server unavailable.

## Requirements

### Conversation Flow
- Trigger: right-click on NPC (existing interaction hook)
- Context sent to AI Server: NPC identity + personality + memory, player recent actions, current biome + time + weather, nearby structures + events, active quests
- AI Server generates: NPC response (max 2 sentences), 3-4 player response options, relationship change, possible quest trigger

### Fallback (no AI server)
- Template-based responses by personality + mood
- 20+ templates per NPC type
- Variation by hash of name + day

### UI
- Bottom panel with NPC pixel art portrait
- Typewriter text effect
- Numbered options (1-4)
- Scroll for long responses
- Close with click/ESC

## Acceptance Criteria

- [ ] Right-click NPC opens conversation
- [ ] AI server generates contextual responses
- [ ] 3-4 player response options
- [ ] Relationship changes based on conversation
- [ ] Fallback templates work without AI server
- [ ] 20+ templates per NPC type
- [ ] Typewriter text effect
- [ ] Pixel art portrait in dialog panel
- [ ] No console errors

## Files to Create/Modify

- **Create:** `core/jardvoxel-survival-conversation.js`
- **Modify:** `core/jardvoxel-survival-villagers.js` (trigger hook)
- **Create:** `tests/conversation.test.js`
