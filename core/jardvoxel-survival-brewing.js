// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Brewing & Potions — SPEC-062
// Brewing stand, potions, potion effects system
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';
// MC_BLOCKS values inlined to avoid circular dependency with mesher.js
import { NETHER_BLOCKS } from './jardvoxel-survival-nether.js';

// New block IDs for brewing (126-140)
export const BREWING_BLOCKS = {
  BREWING_STAND: 126,
  GLASS_BOTTLE: 127,
  CAULDRON: 128,
  WATER_BOTTLE: 129,
  AWKWARD_POTION: 130,
  POTION_SPEED: 131,
  POTION_STRENGTH: 132,
  POTION_HEALING: 133,
  POTION_NIGHT_VISION: 134,
  POTION_FIRE_RESISTANCE: 135,
  POTION_REGENERATION: 136,
  SPLASH_POTION_HEALING: 137,
  POTION_WATER_BREATHING: 138,
  BLAZE_POWDER: 139,
  SUGAR: 140,
};

export const BREWING_BLOCK_COLORS = {
  126: [0.40, 0.35, 0.30],
  127: [0.85, 0.90, 0.95],
  128: [0.35, 0.35, 0.38],
  129: [0.50, 0.60, 0.80],
  130: [0.70, 0.50, 0.50],
  131: [0.30, 0.85, 0.30],
  132: [0.85, 0.30, 0.30],
  133: [0.90, 0.30, 0.50],
  134: [0.30, 0.40, 0.90],
  135: [0.85, 0.50, 0.20],
  136: [0.90, 0.70, 0.30],
  137: [0.90, 0.30, 0.50],
  138: [0.30, 0.60, 0.90],
  139: [0.90, 0.60, 0.20],
  140: [0.95, 0.90, 0.80],
};

export const BREWING_BLOCK_NAMES = {
  126: 'Brewing Stand',
  127: 'Glass Bottle',
  128: 'Cauldron',
  129: 'Water Bottle',
  130: 'Awkward Potion',
  131: 'Potion of Speed',
  132: 'Potion of Strength',
  133: 'Potion of Healing',
  134: 'Potion of Night Vision',
  135: 'Potion of Fire Resistance',
  136: 'Potion of Regeneration',
  137: 'Splash Potion of Healing',
  138: 'Potion of Water Breathing',
  139: 'Blaze Powder',
  140: 'Sugar',
};

export const BREWING_BLOCK_HARDNESS = {
  126: 0.5,
  127: 0.1,
  128: 1.5,
  129: 0.1,
  130: 0.1,
  131: 0.1,
  132: 0.1,
  133: 0.1,
  134: 0.1,
  135: 0.1,
  136: 0.1,
  137: 0.1,
  138: 0.1,
  139: 0.1,
  140: 0.1,
};

export const BREWING_PLACEABLE_BLOCKS = [126, 128];

// Brewing recipes: ingredient + input potion -> output potion
// Stage 1: Water Bottle + Nether Wart -> Awkward Potion
// Stage 2: Awkward Potion + ingredient -> Specific Potion
// Stage 3: Potion + Gunpowder -> Splash Potion
export const BREWING_RECIPES = [
  // Stage 1: Create Awkward Potion
  { ingredient: NETHER_BLOCKS.NETHER_WART, input: BREWING_BLOCKS.WATER_BOTTLE, output: BREWING_BLOCKS.AWKWARD_POTION, brewTime: 20 },

  // Stage 2: Create specific potions from Awkward Potion
  { ingredient: BREWING_BLOCKS.SUGAR, input: BREWING_BLOCKS.AWKWARD_POTION, output: BREWING_BLOCKS.POTION_SPEED, brewTime: 20 },
  { ingredient: BREWING_BLOCKS.BLAZE_POWDER, input: BREWING_BLOCKS.AWKWARD_POTION, output: BREWING_BLOCKS.POTION_STRENGTH, brewTime: 20 },
  { ingredient: 66, input: BREWING_BLOCKS.AWKWARD_POTION, output: BREWING_BLOCKS.POTION_HEALING, brewTime: 20 },
  { ingredient: 20, input: BREWING_BLOCKS.AWKWARD_POTION, output: BREWING_BLOCKS.POTION_NIGHT_VISION, brewTime: 20 },
  { ingredient: NETHER_BLOCKS.GLOWSTONE, input: BREWING_BLOCKS.AWKWARD_POTION, output: BREWING_BLOCKS.POTION_FIRE_RESISTANCE, brewTime: 20 },
  { ingredient: NETHER_BLOCKS.QUARTZ, input: BREWING_BLOCKS.AWKWARD_POTION, output: BREWING_BLOCKS.POTION_REGENERATION, brewTime: 20 },
  { ingredient: 65, input: BREWING_BLOCKS.AWKWARD_POTION, output: BREWING_BLOCKS.POTION_WATER_BREATHING, brewTime: 20 },

  // Stage 3: Splash potion
  { ingredient: 70, input: BREWING_BLOCKS.POTION_HEALING, output: BREWING_BLOCKS.SPLASH_POTION_HEALING, brewTime: 20 },
];

// Crafting recipes for brewing items
export const BREWING_CRAFT_RECIPES = [
  // Glass Bottle (3 glass blocks)
  { type: 'shaped', pattern: [
    ['glass', null, 'glass'],
    [null, 'glass', null],
  ], output: { block: BREWING_BLOCKS.GLASS_BOTTLE, count: 3 } },

  // Brewing Stand (3 cobblestone + 1 blaze rod)
  { type: 'shaped', pattern: [
    [null, 'blaze_rod', null],
    ['cobblestone', null, 'cobblestone'],
    ['cobblestone', 'cobblestone', 'cobblestone'],
  ], output: { block: BREWING_BLOCKS.BREWING_STAND, count: 1 } },

  // Cauldron (7 iron ingots)
  { type: 'shaped', pattern: [
    ['iron_ingot', null, 'iron_ingot'],
    ['iron_ingot', null, 'iron_ingot'],
    ['iron_ingot', 'iron_ingot', 'iron_ingot'],
  ], output: { block: BREWING_BLOCKS.CAULDRON, count: 1 } },

  // Blaze Powder (1 blaze rod = 2 blaze powder)
  { type: 'shapeless', ingredients: [NETHER_BLOCKS.BLAZE_ROD], output: { block: BREWING_BLOCKS.BLAZE_POWDER, count: 2 } },

  // Sugar (1 sugar cane / bamboo = 1 sugar, simplified)
  { type: 'shapeless', ingredients: [44], output: { block: BREWING_BLOCKS.SUGAR, count: 1 } },
];

// Potion effect definitions
export const POTION_EFFECTS = {
  [BREWING_BLOCKS.POTION_SPEED]: {
    id: 'speed',
    name: 'Speed',
    duration: 180, // 3 minutes
    color: 0x00ff44,
    apply: (player) => { player.speedMultiplier = 1.2; },
    remove: (player) => { player.speedMultiplier = 1.0; },
  },
  [BREWING_BLOCKS.POTION_STRENGTH]: {
    id: 'strength',
    name: 'Strength',
    duration: 180,
    color: 0xff3030,
    apply: (player) => { player.damageBonus = 3; },
    remove: (player) => { player.damageBonus = 0; },
  },
  [BREWING_BLOCKS.POTION_HEALING]: {
    id: 'healing',
    name: 'Instant Healing',
    duration: 0, // instant
    color: 0xff3060,
    apply: (player, healthSystem) => { if (healthSystem) healthSystem.heal(4); },
    remove: () => {},
  },
  [BREWING_BLOCKS.POTION_NIGHT_VISION]: {
    id: 'night_vision',
    name: 'Night Vision',
    duration: 180,
    color: 0x3060ff,
    apply: (player) => { player.nightVision = true; },
    remove: (player) => { player.nightVision = false; },
  },
  [BREWING_BLOCKS.POTION_FIRE_RESISTANCE]: {
    id: 'fire_resistance',
    name: 'Fire Resistance',
    duration: 180,
    color: 0xff8020,
    apply: (player) => { player.fireResistant = true; },
    remove: (player) => { player.fireResistant = false; },
  },
  [BREWING_BLOCKS.POTION_REGENERATION]: {
    id: 'regeneration',
    name: 'Regeneration',
    duration: 45,
    color: 0xffb030,
    apply: () => {},
    remove: () => {},
    tick: (player, healthSystem, dt) => {
      player._regenAccum = (player._regenAccum || 0) + dt;
      if (player._regenAccum >= 1.0) {
        player._regenAccum = 0;
        if (healthSystem) healthSystem.heal(1);
      }
    },
  },
  [BREWING_BLOCKS.POTION_WATER_BREATHING]: {
    id: 'water_breathing',
    name: 'Water Breathing',
    duration: 180,
    color: 0x30a0ff,
    apply: (player) => { player.waterBreathing = true; },
    remove: (player) => { player.waterBreathing = false; },
  },
};

// ═══════════════════════════════════════════════════════════
// BrewingStandEntity — placed brewing stand with state
// ═══════════════════════════════════════════════════════════

export class BrewingStandEntity {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.fuelSlot = null;       // { block, count } — blaze powder
    this.ingredientSlot = null;  // { block, count }
    this.bottleSlots = [null, null]; // 2 bottle slots: { block, count }
    this.brewTime = 0;
    this.maxBrewTime = 0;
    this.fuelCount = 0; // number of brewing operations available
    this.light = null;
  }

  isBrewing() {
    return this.brewTime > 0;
  }

  canBrew() {
    if (!this.ingredientSlot) return false;
    if (this.fuelCount <= 0) return false;
    const filledBottles = this.bottleSlots.filter(s => s !== null);
    if (filledBottles.length === 0) return false;
    // Check at least one bottle matches a recipe
    for (const bottle of filledBottles) {
      const recipe = BREWING_RECIPES.find(r => r.ingredient === this.ingredientSlot.block && r.input === bottle.block);
      if (recipe) return true;
    }
    return false;
  }

  tick(dt) {
    let updated = false;

    // Consume fuel if needed
    if (this.fuelCount <= 0 && this.fuelSlot && this.fuelSlot.block === BREWING_BLOCKS.BLAZE_POWDER) {
      this.fuelCount = 20; // 20 brewing operations per powder
      this.fuelSlot.count--;
      if (this.fuelSlot.count <= 0) this.fuelSlot = null;
      updated = true;
    }

    // Start brewing
    if (this.brewTime <= 0 && this.canBrew()) {
      this.maxBrewTime = 20;
      this.brewTime = 20;
      updated = true;
    }

    // Brewing progress
    if (this.brewTime > 0) {
      this.brewTime -= dt;
      updated = true;

      if (this.brewTime <= 0) {
        this.brewTime = 0;
        // Complete brewing: transform bottles
        const recipe = BREWING_RECIPES.find(r => r.ingredient === this.ingredientSlot.block);
        if (recipe) {
          for (let i = 0; i < this.bottleSlots.length; i++) {
            if (this.bottleSlots[i] && this.bottleSlots[i].block === recipe.input) {
              this.bottleSlots[i] = { block: recipe.output, count: this.bottleSlots[i].count };
            }
          }
          // Consume ingredient
          this.ingredientSlot.count--;
          if (this.ingredientSlot.count <= 0) this.ingredientSlot = null;
          // Consume fuel
          this.fuelCount--;
          updated = true;
        }
      }
    }

    return updated;
  }

  serialize() {
    return {
      x: this.x, y: this.y, z: this.z,
      fuelSlot: this.fuelSlot,
      ingredientSlot: this.ingredientSlot,
      bottleSlots: this.bottleSlots,
      brewTime: this.brewTime,
      fuelCount: this.fuelCount,
    };
  }

  deserialize(data) {
    this.fuelSlot = data.fuelSlot || null;
    this.ingredientSlot = data.ingredientSlot || null;
    this.bottleSlots = data.bottleSlots || [null, null];
    this.brewTime = data.brewTime || 0;
    this.fuelCount = data.fuelCount || 0;
  }
}

// ═══════════════════════════════════════════════════════════
// BrewingManager — tracks all placed brewing stands
// ═══════════════════════════════════════════════════════════

export class BrewingManager {
  constructor(scene) {
    this.scene = scene;
    this.stands = new Map();
    this.maxProcessing = 10;
  }

  _key(x, y, z) { return `${x},${y},${z}`; }

  addStand(x, y, z) {
    const key = this._key(x, y, z);
    if (this.stands.has(key)) return this.stands.get(key);
    const stand = new BrewingStandEntity(x, y, z);
    this.stands.set(key, stand);
    return stand;
  }

  removeStand(x, y, z) {
    const key = this._key(x, y, z);
    const stand = this.stands.get(key);
    if (stand && stand.light) {
      this.scene.remove(stand.light);
      stand.light = null;
    }
    this.stands.delete(key);
  }

  getStand(x, y, z) {
    return this.stands.get(this._key(x, y, z));
  }

  update(dt) {
    let processing = 0;
    for (const stand of this.stands.values()) {
      if (processing >= this.maxProcessing && !stand.isBrewing()) continue;
      const updated = stand.tick(dt);
      if (stand.isBrewing()) processing++;

      // Manage light
      if (stand.isBrewing() && !stand.light) {
        stand.light = new THREE.PointLight(0xff8800, 0.8, 6);
        stand.light.position.set(stand.x + 0.5, stand.y + 0.5, stand.z + 0.5);
        this.scene.add(stand.light);
      } else if (!stand.isBrewing() && stand.light) {
        this.scene.remove(stand.light);
        stand.light = null;
      }
    }
  }

  serialize() {
    return Array.from(this.stands.values()).map(s => s.serialize());
  }

  deserialize(data) {
    for (const sdata of data) {
      const stand = new BrewingStandEntity(sdata.x, sdata.y, sdata.z);
      stand.deserialize(sdata);
      this.stands.set(this._key(sdata.x, sdata.y, sdata.z), stand);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// PotionEffectManager — manages active potion effects on player
// ═══════════════════════════════════════════════════════════

export class PotionEffectManager {
  constructor() {
    this.activeEffects = []; // [{ effect, timeRemaining }]
    this.particleTimer = 0;
  }

  drinkPotion(potionBlock, player, healthSystem) {
    const effectDef = POTION_EFFECTS[potionBlock];
    if (!effectDef) return false;

    // Instant effect
    if (effectDef.duration === 0) {
      effectDef.apply(player, healthSystem);
      return true;
    }

    // Timed effect — check if already active (refresh duration)
    const existing = this.activeEffects.find(e => e.effect.id === effectDef.id);
    if (existing) {
      existing.timeRemaining = effectDef.duration;
    } else {
      effectDef.apply(player);
      this.activeEffects.push({ effect: effectDef, timeRemaining: effectDef.duration });
    }
    return true;
  }

  throwSplashPotion(potionBlock, player, healthSystem, mobs, impactPos) {
    const effectDef = POTION_EFFECTS[potionBlock];
    if (!effectDef) return;

    // AoE: apply to player if within 4 blocks
    if (player.position.distanceTo(impactPos) < 4) {
      if (effectDef.duration === 0) {
        effectDef.apply(player, healthSystem);
      } else {
        const existing = this.activeEffects.find(e => e.effect.id === effectDef.id);
        if (existing) {
          existing.timeRemaining = effectDef.duration;
        } else {
          effectDef.apply(player);
          this.activeEffects.push({ effect: effectDef, timeRemaining: effectDef.duration });
        }
      }
    }

    // AoE: apply to nearby mobs (healing damages undead, etc.)
    if (mobs) {
      for (const mob of mobs) {
        if (mob.dead) continue;
        const mobPos = new THREE.Vector3(mob.x, mob.y, mob.z);
        if (mobPos.distanceTo(impactPos) < 4) {
          if (effectDef.id === 'healing') {
            mob.takeDamage(4); // healing damages undead
          }
        }
      }
    }
  }

  update(dt, player, healthSystem) {
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const active = this.activeEffects[i];
      active.timeRemaining -= dt;

      // Tick effect (for regeneration etc.)
      if (active.effect.tick) {
        active.effect.tick(player, healthSystem, dt);
      }

      if (active.timeRemaining <= 0) {
        active.effect.remove(player);
        this.activeEffects.splice(i, 1);
      }
    }

    // Particle timer for effect aura
    this.particleTimer += dt;
  }

  hasEffect(effectId) {
    return this.activeEffects.some(e => e.effect.id === effectId);
  }

  getActiveEffects() {
    return this.activeEffects.map(e => ({ id: e.effect.id, name: e.effect.name, timeRemaining: e.timeRemaining, color: e.effect.color }));
  }

  clearAll(player) {
    for (const active of this.activeEffects) {
      active.effect.remove(player);
    }
    this.activeEffects = [];
  }

  serialize() {
    return this.activeEffects.map(e => ({ id: e.effect.id, time: e.timeRemaining }));
  }

  deserialize(data, player) {
    this.activeEffects = [];
    for (const saved of data) {
      const effectDef = Object.values(POTION_EFFECTS).find(e => e.id === saved.id);
      if (effectDef) {
        effectDef.apply(player);
        this.activeEffects.push({ effect: effectDef, timeRemaining: saved.time });
      }
    }
  }
}
