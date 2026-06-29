// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Furnace & Smelting
// SPEC-043: Furnace & Smelting
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';
import { MC_BLOCKS, BLOCK } from './blocks-registry.js';
import { FISHING_BLOCKS } from './jardvoxel-survival-fishing.js';

// Smelting recipes: input -> output + cook time (seconds)
export const SMELTING_RECIPES = {
  [MC_BLOCKS.IRON_ORE]: { output: 18, cookTime: 10 }, // iron ingot (reuse ore id space, use 65+)
  [MC_BLOCKS.GOLD_ORE]: { output: 19, cookTime: 10 },
  [MC_BLOCKS.SAND]: { output: MC_BLOCKS.GLASS, cookTime: 8 },
  [MC_BLOCKS.COBBLESTONE]: { output: BLOCK.STONE, cookTime: 10 },
  [MC_BLOCKS.RAW_BEEF]: { output: MC_BLOCKS.COOKED_BEEF, cookTime: 6 },
  [MC_BLOCKS.RAW_PORKCHOP]: { output: MC_BLOCKS.COOKED_PORKCHOP, cookTime: 6 },
  [MC_BLOCKS.RAW_CHICKEN]: { output: MC_BLOCKS.COOKED_CHICKEN, cookTime: 6 },
  [MC_BLOCKS.RAW_MUTTON]: { output: MC_BLOCKS.COOKED_MUTTON, cookTime: 6 },
  [MC_BLOCKS.CLAY]: { output: MC_BLOCKS.BRICKS, cookTime: 8 },
  [FISHING_BLOCKS.RAW_FISH]: { output: FISHING_BLOCKS.COOKED_FISH, cookTime: 6 },
};

// Fuel: block -> burn time (seconds)
export const FUEL_TYPES = {
  [MC_BLOCKS.COAL_ORE]: 80, // coal ore acts as coal source
  [MC_BLOCKS.PLANKS]: 15,
  [MC_BLOCKS.OAK_LOG]: 15,
  [MC_BLOCKS.BIRCH_LOG]: 15,
  [MC_BLOCKS.SPRUCE_LOG]: 15,
  [MC_BLOCKS.JUNGLE_LOG]: 15,
  [MC_BLOCKS.STICK]: 5,
  [MC_BLOCKS.CRAFTING_TABLE]: 15,
  [MC_BLOCKS.FURNACE]: 15,
  [MC_BLOCKS.BOOKSHELF]: 15,
};

// New smelting output IDs (ingots)
export const SMELTED_BLOCKS = {
  IRON_INGOT: 65,
  GOLD_INGOT: 66,
};

// Extend recipes with proper ingot IDs
SMELTING_RECIPES[MC_BLOCKS.IRON_ORE].output = SMELTED_BLOCKS.IRON_INGOT;
SMELTING_RECIPES[MC_BLOCKS.GOLD_ORE].output = SMELTED_BLOCKS.GOLD_INGOT;

// ═══════════════════════════════════════════════════════════
// Furnace Entity — placed furnace with state
// ═══════════════════════════════════════════════════════════

export class FurnaceEntity {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.fuelSlot = null;   // { block, count }
    this.inputSlot = null;  // { block, count }
    this.outputSlot = null; // { block, count }
    this.burnTime = 0;      // seconds remaining for current fuel
    this.cookTime = 0;      // seconds elapsed cooking current item
    this.maxCookTime = 0;   // total cook time for current recipe
    this.light = null;      // PointLight when active
  }

  isBurning() {
    return this.burnTime > 0;
  }

  canCook() {
    if (!this.inputSlot) return false;
    const recipe = SMELTING_RECIPES[this.inputSlot.block];
    if (!recipe) return false;
    // Check output slot can accept
    if (this.outputSlot) {
      if (this.outputSlot.block !== recipe.output) return false;
      if (this.outputSlot.count >= 64) return false;
    }
    return true;
  }

  tick(dt) {
    let updated = false;

    // Burning fuel
    if (this.burnTime > 0) {
      this.burnTime -= dt;
      if (this.burnTime < 0) this.burnTime = 0;
      updated = true;
    }

    // Need fuel? Try consume
    if (this.burnTime <= 0 && this.canCook() && this.fuelSlot) {
      const fuelTime = FUEL_TYPES[this.fuelSlot.block];
      if (fuelTime) {
        this.burnTime = fuelTime;
        this.fuelSlot.count--;
        if (this.fuelSlot.count <= 0) this.fuelSlot = null;
        updated = true;
      }
    }

    // Cooking
    if (this.burnTime > 0 && this.canCook()) {
      if (this.maxCookTime === 0) {
        this.maxCookTime = SMELTING_RECIPES[this.inputSlot.block].cookTime;
      }
      this.cookTime += dt;
      updated = true;

      if (this.cookTime >= this.maxCookTime) {
        // Produce output
        const recipe = SMELTING_RECIPES[this.inputSlot.block];
        if (this.outputSlot) {
          this.outputSlot.count++;
        } else {
          this.outputSlot = { block: recipe.output, count: 1 };
        }
        this.inputSlot.count--;
        if (this.inputSlot.count <= 0) this.inputSlot = null;
        this.cookTime = 0;
        this.maxCookTime = 0;
        updated = true;
      }
    } else if (!this.canCook()) {
      this.cookTime = 0;
      this.maxCookTime = 0;
    }

    return updated;
  }

  serialize() {
    return {
      x: this.x, y: this.y, z: this.z,
      fuelSlot: this.fuelSlot,
      inputSlot: this.inputSlot,
      outputSlot: this.outputSlot,
      burnTime: this.burnTime,
      cookTime: this.cookTime,
    };
  }

  deserialize(data) {
    this.fuelSlot = data.fuelSlot || null;
    this.inputSlot = data.inputSlot || null;
    this.outputSlot = data.outputSlot || null;
    this.burnTime = data.burnTime || 0;
    this.cookTime = data.cookTime || 0;
  }
}

// ═══════════════════════════════════════════════════════════
// Furnace Manager — tracks all placed furnaces
// ═══════════════════════════════════════════════════════════

export class FurnaceManager {
  constructor(scene) {
    this.scene = scene;
    this.furnaces = new Map(); // key "x,y,z" -> FurnaceEntity
    this.maxProcessing = 20;
  }

  _key(x, y, z) { return `${x},${y},${z}`; }

  addFurnace(x, y, z) {
    const key = this._key(x, y, z);
    if (this.furnaces.has(key)) return this.furnaces.get(key);
    const furnace = new FurnaceEntity(x, y, z);
    this.furnaces.set(key, furnace);
    return furnace;
  }

  removeFurnace(x, y, z) {
    const key = this._key(x, y, z);
    const furnace = this.furnaces.get(key);
    if (furnace && furnace.light) {
      this.scene.remove(furnace.light);
      furnace.light = null;
    }
    this.furnaces.delete(key);
  }

  getFurnace(x, y, z) {
    return this.furnaces.get(this._key(x, y, z));
  }

  update(dt) {
    let processing = 0;
    for (const furnace of this.furnaces.values()) {
      if (processing >= this.maxProcessing && !furnace.isBurning()) continue;
      const updated = furnace.tick(dt);
      if (furnace.isBurning()) processing++;

      // Manage light
      if (furnace.isBurning() && !furnace.light) {
        furnace.light = new THREE.PointLight(0xff6600, 1.5, 8);
        furnace.light.position.set(furnace.x + 0.5, furnace.y + 0.5, furnace.z + 0.5);
        this.scene.add(furnace.light);
      } else if (!furnace.isBurning() && furnace.light) {
        this.scene.remove(furnace.light);
        furnace.light = null;
      }
    }
  }

  serialize() {
    return Array.from(this.furnaces.values()).map(f => f.serialize());
  }

  deserialize(data, scene) {
    for (const fdata of data) {
      const furnace = new FurnaceEntity(fdata.x, fdata.y, fdata.z);
      furnace.deserialize(fdata);
      this.furnaces.set(this._key(fdata.x, fdata.y, fdata.z), furnace);
    }
  }
}
