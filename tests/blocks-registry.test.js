import { describe, it, expect } from 'vitest';
import {
  BLOCK, MC_BLOCKS, TOOL_BLOCKS, ENCHANT_BLOCKS,
  VILLAGER_BLOCKS, FISHING_BLOCKS, NETHER_BLOCKS,
  REDSTONE_BLOCKS, BREWING_BLOCKS, SHIELD_BLOCKS,
  ANVIL_BLOCKS, MAP_BLOCKS,
  ALL_BLOCK_COLORS, ALL_BLOCK_NAMES, ALL_BLOCK_HARDNESS,
  ALL_PLACEABLE_BLOCKS, ALL_MAP_ITEMS,
} from '../core/blocks-registry.js';

describe('blocks-registry', () => {
  describe('BLOCK constants', () => {
    it('AIR = 0', () => { expect(BLOCK.AIR).toBe(0); });
    it('STONE = 1', () => { expect(BLOCK.STONE).toBe(1); });
    it('has 9 base blocks', () => { expect(Object.keys(BLOCK).length).toBe(9); });
  });

  describe('MC_BLOCKS', () => {
    it('extends BLOCK', () => {
      expect(MC_BLOCKS.STONE).toBe(BLOCK.STONE);
      expect(MC_BLOCKS.AIR).toBe(BLOCK.AIR);
    });
    it('OAK_LOG = 9', () => { expect(MC_BLOCKS.OAK_LOG).toBe(9); });
    it('has unique IDs', () => {
      const ids = Object.values(MC_BLOCKS);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  });

  describe('TOOL_BLOCKS', () => {
    it('WOOD_PICKAXE = 80', () => { expect(TOOL_BLOCKS.WOOD_PICKAXE).toBe(80); });
    it('IRON_BOOTS = 99', () => { expect(TOOL_BLOCKS.IRON_BOOTS).toBe(99); });
    it('has 20 tools', () => { expect(Object.keys(TOOL_BLOCKS).length).toBe(20); });
  });

  describe('ALL_BLOCK_COLORS', () => {
    it('has color for STONE', () => {
      expect(ALL_BLOCK_COLORS[BLOCK.STONE]).toHaveLength(3);
    });
    it('colors are between 0 and 1', () => {
      for (const color of Object.values(ALL_BLOCK_COLORS)) {
        expect(color[0]).toBeGreaterThanOrEqual(0);
        expect(color[0]).toBeLessThanOrEqual(1);
        expect(color[1]).toBeGreaterThanOrEqual(0);
        expect(color[1]).toBeLessThanOrEqual(1);
        expect(color[2]).toBeGreaterThanOrEqual(0);
        expect(color[2]).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('ALL_BLOCK_NAMES', () => {
    it('has name for STONE', () => {
      expect(ALL_BLOCK_NAMES[BLOCK.STONE]).toBe('Stone');
    });
    it('has name for DIAMOND_PICKAXE (83)', () => {
      expect(ALL_BLOCK_NAMES[83]).toBe('Diamond Pickaxe');
    });
  });

  describe('ALL_BLOCK_HARDNESS', () => {
    it('BEDROCK has Infinity hardness', () => {
      expect(ALL_BLOCK_HARDNESS[MC_BLOCKS.BEDROCK]).toBe(Infinity);
    });
    it('STONE has hardness 1.0', () => {
      expect(ALL_BLOCK_HARDNESS[BLOCK.STONE]).toBe(1.0);
    });
    it('ANVIL has hardness 5.0', () => {
      expect(ALL_BLOCK_HARDNESS[ANVIL_BLOCKS.ANVIL]).toBe(5.0);
    });
  });

  describe('ALL_PLACEABLE_BLOCKS', () => {
    it('is a non-empty array', () => {
      expect(Array.isArray(ALL_PLACEABLE_BLOCKS)).toBe(true);
      expect(ALL_PLACEABLE_BLOCKS.length).toBeGreaterThan(10);
    });
    it('does not include AIR (0)', () => {
      expect(ALL_PLACEABLE_BLOCKS).not.toContain(0);
    });
    it('includes GRASS', () => {
      expect(ALL_PLACEABLE_BLOCKS).toContain(BLOCK.GRASS);
    });
  });

  describe('ALL_MAP_ITEMS', () => {
    it('contains map (154) and compass (155)', () => {
      expect(ALL_MAP_ITEMS).toContain(154);
      expect(ALL_MAP_ITEMS).toContain(155);
    });
  });

  describe('Cross-consistency', () => {
    it('every placeable block has a color', () => {
      for (const id of ALL_PLACEABLE_BLOCKS) {
        expect(ALL_BLOCK_COLORS[id]).toBeDefined();
      }
    });
    it('every placeable block has a name', () => {
      for (const id of ALL_PLACEABLE_BLOCKS) {
        expect(ALL_BLOCK_NAMES[id]).toBeDefined();
      }
    });
  });
});
