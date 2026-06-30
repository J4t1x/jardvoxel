---
spec_id: SPEC-053
title: "Villager NPCs & Trading"
priority: medium
estimated_time: 5h
depends_on: ["SPEC-041"]
status: pending
created_at: 2026-06-25
updated_at: 2026-06-25
---

# SPEC-053: Villager NPCs & Trading

## Description

Add villager NPCs that spawn in villages. Each villager has a profession and offers trades. Right-click to open trading UI.

## Requirements

### Villager Entity
- Spawns in villages (1-3 per village house)
- Has profession: farmer, librarian, blacksmith, butcher
- AI: wander within village bounds, enter houses at night, flee from hostile mobs
- Rendered as humanoid box model (head, body, arms, legs) with profession-colored clothing
- Has 10 HP, no combat capability

### Trading System
- Right-click villager opens trade UI
- Each profession has 3-4 trade offers
- Trade format: give X items → receive Y items
- Farmer: wheat → bread, wheat_seeds → emerald, emerald → bread
- Librarian: paper → emerald, emerald → book, emerald → enchanting table
- Blacksmith: iron_ingot → emerald, emerald → iron_pickaxe, emerald → iron_sword
- Butcher: raw_beef → cooked_beef, raw_porkchop → cooked_porkchop, emerald → cooked_chicken
- Trades have limited uses (3-5 per trade), refresh after sleeping

### New Items
- 103: Emerald (green gem, rare drop from mining or villager trades)
- 104: Emerald Ore (very rare, found in mountain biomes)
- 105: Paper (from 3 bamboo)

### UI
- Trade panel: villager profession name, list of trades
- Each trade shows: required items (left) → received items (right)
- Click trade to execute if player has required items
- Trade uses counter (remaining/total)

## Acceptance Criteria

- [ ] Villagers spawn in villages with profession assignment
- [ ] Villager AI: wander, flee, enter houses at night
- [ ] Villager box model with profession-colored clothing
- [ ] Right-click villager opens trade UI
- [ ] 4 professions with 3-4 trades each
- [ ] Trade execution with inventory check
- [ ] Trade uses limit + refresh after sleep
- [ ] Emerald item (103) and emerald ore (104) added
- [ ] Paper item (105) craftable
- [ ] No console errors during trading
