import { describe, it, expect } from 'vitest';
import {
  FurnaceEntity, FurnaceManager,
  SMELTING_RECIPES, FUEL_TYPES, SMELTED_BLOCKS,
} from '../core/jardvoxel-survival-furnace.js';
import { MC_BLOCKS, BLOCK } from '../core/blocks-registry.js';

describe('Smelting recipes', () => {
  it('has recipe for iron ore', () => {
    expect(SMELTING_RECIPES[MC_BLOCKS.IRON_ORE]).toBeDefined();
    expect(SMELTING_RECIPES[MC_BLOCKS.IRON_ORE].output).toBe(SMELTED_BLOCKS.IRON_INGOT);
    expect(SMELTING_RECIPES[MC_BLOCKS.IRON_ORE].cookTime).toBe(10);
  });

  it('has recipe for sand → glass', () => {
    expect(SMELTING_RECIPES[MC_BLOCKS.SAND].output).toBe(MC_BLOCKS.GLASS);
  });

  it('has recipe for raw beef → cooked beef', () => {
    expect(SMELTING_RECIPES[MC_BLOCKS.RAW_BEEF].output).toBe(MC_BLOCKS.COOKED_BEEF);
  });
});

describe('Fuel types', () => {
  it('coal ore burns for 80s', () => {
    expect(FUEL_TYPES[MC_BLOCKS.COAL_ORE]).toBe(80);
  });

  it('planks burn for 15s', () => {
    expect(FUEL_TYPES[MC_BLOCKS.PLANKS]).toBe(15);
  });

  it('stick burns for 5s', () => {
    expect(FUEL_TYPES[MC_BLOCKS.STICK]).toBe(5);
  });
});

describe('FurnaceEntity', () => {
  it('starts empty', () => {
    const f = new FurnaceEntity(0, 0, 0);
    expect(f.fuelSlot).toBeNull();
    expect(f.inputSlot).toBeNull();
    expect(f.outputSlot).toBeNull();
    expect(f.isBurning()).toBe(false);
  });

  it('canCook returns false with no input', () => {
    const f = new FurnaceEntity(0, 0, 0);
    expect(f.canCook()).toBe(false);
  });

  it('canCook returns true with valid input and fuel', () => {
    const f = new FurnaceEntity(0, 0, 0);
    f.inputSlot = { block: MC_BLOCKS.SAND, count: 1 };
    f.fuelSlot = { block: MC_BLOCKS.PLANKS, count: 1 };
    expect(f.canCook()).toBe(true);
  });

  it('canCook returns false for non-smeltable input', () => {
    const f = new FurnaceEntity(0, 0, 0);
    f.inputSlot = { block: MC_BLOCKS.DIAMOND_ORE, count: 1 };
    expect(f.canCook()).toBe(false);
  });

  it('tick consumes fuel and cooks', () => {
    const f = new FurnaceEntity(0, 0, 0);
    f.inputSlot = { block: MC_BLOCKS.SAND, count: 1 };
    f.fuelSlot = { block: MC_BLOCKS.PLANKS, count: 1 };
    // Cook time for sand = 8s, fuel = 15s
    f.tick(8.1);
    expect(f.outputSlot).not.toBeNull();
    expect(f.outputSlot.block).toBe(MC_BLOCKS.GLASS);
    expect(f.outputSlot.count).toBe(1);
    expect(f.inputSlot).toBeNull();
  });

  it('tick does not cook without fuel', () => {
    const f = new FurnaceEntity(0, 0, 0);
    f.inputSlot = { block: MC_BLOCKS.SAND, count: 1 };
    f.tick(10);
    expect(f.outputSlot).toBeNull();
  });

  it('serialize/deserialize round-trip', () => {
    const f = new FurnaceEntity(1, 2, 3);
    f.inputSlot = { block: MC_BLOCKS.SAND, count: 2 };
    f.fuelSlot = { block: MC_BLOCKS.PLANKS, count: 3 };
    f.burnTime = 5;
    f.cookTime = 3;
    const data = f.serialize();
    const f2 = new FurnaceEntity(0, 0, 0);
    f2.deserialize(data);
    expect(f2.inputSlot.block).toBe(MC_BLOCKS.SAND);
    expect(f2.fuelSlot.count).toBe(3);
    expect(f2.burnTime).toBe(5);
  });
});

describe('FurnaceManager', () => {
  it('addFurnace creates and stores furnace', () => {
    const fm = new FurnaceManager(null);
    const f = fm.addFurnace(0, 0, 0);
    expect(f).toBeDefined();
    expect(fm.getFurnace(0, 0, 0)).toBe(f);
  });

  it('addFurnace returns existing if already present', () => {
    const fm = new FurnaceManager(null);
    const f1 = fm.addFurnace(0, 0, 0);
    const f2 = fm.addFurnace(0, 0, 0);
    expect(f1).toBe(f2);
  });

  it('removeFurnace deletes furnace', () => {
    const fm = new FurnaceManager(null);
    fm.addFurnace(1, 1, 1);
    fm.removeFurnace(1, 1, 1);
    expect(fm.getFurnace(1, 1, 1)).toBeUndefined();
  });

  it('update ticks all furnaces', () => {
    const mockScene = { add: () => {}, remove: () => {} };
    const fm = new FurnaceManager(mockScene);
    const f = fm.addFurnace(0, 0, 0);
    f.inputSlot = { block: MC_BLOCKS.SAND, count: 1 };
    f.fuelSlot = { block: MC_BLOCKS.PLANKS, count: 1 };
    fm.update(8.1);
    expect(f.outputSlot).not.toBeNull();
  });
});
