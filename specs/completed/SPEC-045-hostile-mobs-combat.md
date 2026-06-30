# SPEC-045: Hostile Mobs + Combat System

## Priority: Critical
## Estimate: 6h
## Depends on: SPEC-041 (Passive Mobs)

## Description

Add hostile mobs that spawn at night or in dark areas (caves), creating danger in survival mode. Extends the existing `MobManager` and `Mob` classes from `jardvoxel-survival-mobs.js`.

## Mob Types

### Zombie
- **Spawn**: Night + dark caves (light level < 4)
- **HP**: 20, **Damage**: 4
- **AI**: Walk toward player, attack on contact (melee)
- **Speed**: 4.3 blocks/sec (slower than player sprint)
- **Drops**: Rotten Flesh (new block ID 67)
- **Visual**: Green humanoid box (2 blocks tall)
- **Burns in daylight** (sun exposure > 0.5 = take damage)

### Skeleton
- **Spawn**: Night + dark caves
- **HP**: 20, **Damage**: 3 (ranged)
- **AI**: Keep distance, shoot arrows at player (every 2s within 10 blocks)
- **Speed**: 4.3 blocks/sec
- **Drops**: Bones (new block ID 68), Arrows (new block ID 69)
- **Visual**: White/gray humanoid (2 blocks tall)
- **Burns in daylight**

### Creeper
- **Spawn**: Night (not caves, surface only)
- **HP**: 20, **Damage**: 12 (explosion, AoE 3 blocks)
- **AI**: Walk toward player, explode when within 2 blocks (1.5s fuse)
- **Speed**: 4.3 blocks/sec
- **Drops**: Gunpowder (new block ID 70)
- **Visual**: Green tall box (2 blocks, no arms)
- **Does NOT burn in daylight**
- **Explosion**: Destroy blocks in 3-block radius, damage player + other mobs

### Spider
- **Spawn**: Night + dark caves
- **HP**: 16, **Damage**: 3
- **AI**: Fast approach, leap attack, can climb walls
- **Speed**: 6 blocks/sec (faster than zombie)
- **Drops**: String (new block ID 71)
- **Visual**: Dark brown low box (1 block tall, wider)
- **Neutral in daylight** (only attacks if provoked)

## New Block IDs

```
67: Rotten Flesh    68: Bones    69: Arrow
70: Gunpowder       71: String
```

## Mob Spawning Rules

- **Night spawn**: When `dayFactor < 0.3` (nighttime), spawn hostile mobs near player (16-32 block radius)
- **Cave spawn**: When `lightLevel < 4` (underground, no sky light), spawn regardless of time
- **Max hostile mobs**: 8 near player
- **Despawn**: When > 48 blocks from player or in daylight (except creepers/spiders)
- **Spawn check**: Every 3 seconds, attempt 1-2 spawns

## Combat Mechanics

- **Player attack**: Left-click on mob (raycast hit test) → 4 damage (fist) or more with tools
- **Attack cooldown**: 0.5s between hits
- **Mob death animation**: Flash white, shrink, fade out (0.5s)
- **Hit flash**: Mob flashes red when hit (0.1s)
- **Knockback**: Mob pushed back 1 block on hit
- **Player knockback**: Player pushed back when hit by mob

## Acceptance Criteria

- [ ] 4 hostile mob types (zombie, skeleton, creeper, spider) with distinct AI
- [ ] Mobs spawn at night and in dark caves
- [ ] Mobs despawn in daylight (zombie, skeleton burn; spider goes neutral)
- [ ] Creeper explosion destroys blocks + damages entities in AoE
- [ ] Skeleton shoots arrows at player
- [ ] Spider can leap and is faster than other mobs
- [ ] Player can attack mobs with left-click (raycast hit test)
- [ ] Hit flash + knockback + death animation
- [ ] Mob drops (rotten flesh, bones, arrows, gunpowder, string)
- [ ] Max 8 hostile mobs near player
- [ ] No console errors
- [ ] 60fps maintained with 8 hostile + 15 passive mobs

## Files to Modify

- `jardvoxel-survival-mobs.js` — Add hostile mob types, combat AI, spawning logic
- `jardvoxel-survival.html` — Add combat input handling, mob health bars, spawn integration
- `jardvoxel-survival-mesher.js` — Add new block IDs (67-71)
