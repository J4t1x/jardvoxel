import { describe, it, expect } from 'vitest';
import { VEGETATION_BLOCKS, ALL_BLOCK_COLORS, ALL_BLOCK_NAMES, ALL_BLOCK_HARDNESS, MC_BLOCKS } from '../core/blocks-registry.js';
import { BIOMES } from '../core/jardvoxel-survival-engine.js';

describe('Ground Vegetation — SPEC-078', () => {
  it('should define 14 vegetation block IDs', () => {
    const keys = Object.keys(VEGETATION_BLOCKS);
    expect(keys.length).toBe(14);
  });

  it('should have all vegetation block IDs in range 157-170', () => {
    for (const key of Object.keys(VEGETATION_BLOCKS)) {
      const id = VEGETATION_BLOCKS[key];
      expect(id).toBeGreaterThanOrEqual(157);
      expect(id).toBeLessThanOrEqual(170);
    }
  });

  it('should have colors for all vegetation blocks', () => {
    for (const key of Object.keys(VEGETATION_BLOCKS)) {
      const id = VEGETATION_BLOCKS[key];
      expect(ALL_BLOCK_COLORS[id]).toBeDefined();
      expect(ALL_BLOCK_COLORS[id]).toHaveLength(3);
    }
  });

  it('should have names for all vegetation blocks', () => {
    for (const key of Object.keys(VEGETATION_BLOCKS)) {
      const id = VEGETATION_BLOCKS[key];
      expect(ALL_BLOCK_NAMES[id]).toBeDefined();
      expect(ALL_BLOCK_NAMES[id]).toBeTypeOf('string');
    }
  });

  it('should have hardness for all vegetation blocks', () => {
    for (const key of Object.keys(VEGETATION_BLOCKS)) {
      const id = VEGETATION_BLOCKS[key];
      expect(ALL_BLOCK_HARDNESS[id]).toBeDefined();
    }
  });

  it('should have 8 flower types', () => {
    const flowerKeys = Object.keys(VEGETATION_BLOCKS).filter(k => k.startsWith('FLOWER_'));
    expect(flowerKeys.length).toBe(8);
  });

  it('should have mushroom types', () => {
    expect(VEGETATION_BLOCKS.MUSHROOM_RED).toBeDefined();
    expect(VEGETATION_BLOCKS.MUSHROOM_BROWN).toBeDefined();
  });

  it('should have berry bush', () => {
    expect(VEGETATION_BLOCKS.BERRY_BUSH).toBeDefined();
  });

  it('should have vines', () => {
    expect(VEGETATION_BLOCKS.VINES).toBeDefined();
  });

  it('should have lily pad', () => {
    expect(VEGETATION_BLOCKS.LILY_PAD).toBeDefined();
  });

  it('should have coral fan', () => {
    expect(VEGETATION_BLOCKS.CORAL_FAN).toBeDefined();
  });

  it('should have unique block IDs', () => {
    const ids = Object.values(VEGETATION_BLOCKS);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('should have existing flower and grass blocks still defined', () => {
    expect(MC_BLOCKS.TALL_GRASS).toBeDefined();
    expect(MC_BLOCKS.FLOWER_RED).toBeDefined();
    expect(MC_BLOCKS.FLOWER_YELLOW).toBeDefined();
    expect(MC_BLOCKS.FERN).toBeDefined();
    expect(MC_BLOCKS.DEAD_BUSH).toBeDefined();
  });
});
