import { describe, it, expect } from 'vitest';
import { CraftingManager, RECIPES, CRAFTING_TABLE } from '../core/jardvoxel-survival-crafting.js';
import { MC_BLOCKS, BLOCK } from '../core/blocks-registry.js';

describe('CraftingManager', () => {
  const cm = new CraftingManager();

  describe('RECIPES', () => {
    it('has recipes array', () => {
      expect(Array.isArray(RECIPES)).toBe(true);
      expect(RECIPES.length).toBeGreaterThan(10);
    });

    it('each recipe has type and output', () => {
      for (const r of RECIPES) {
        expect(r.type).toMatch(/^(shaped|shapeless)$/);
        expect(r.output).toBeDefined();
        expect(r.output.block).toBeGreaterThan(0);
        expect(r.output.count).toBeGreaterThan(0);
      }
    });
  });

  describe('Shapeless recipes', () => {
    it('matches planks from oak log', () => {
      const grid = [MC_BLOCKS.OAK_LOG, 0, 0, 0];
      const result = cm.matchRecipe(grid, 2);
      expect(result).not.toBeNull();
      expect(result.block).toBe(MC_BLOCKS.PLANKS);
      expect(result.count).toBe(4);
    });

    it('matches planks from birch log', () => {
      const grid = [MC_BLOCKS.BIRCH_LOG, 0, 0, 0];
      const result = cm.matchRecipe(grid, 2);
      expect(result).not.toBeNull();
      expect(result.block).toBe(MC_BLOCKS.PLANKS);
    });

    it('matches glass from sand', () => {
      const grid = [BLOCK.SAND, 0, 0, 0];
      const result = cm.matchRecipe(grid, 2);
      expect(result).not.toBeNull();
      expect(result.block).toBe(MC_BLOCKS.GLASS);
    });

    it('returns null for no match', () => {
      const grid = [MC_BLOCKS.DIAMOND_ORE, 0, 0, 0];
      const result = cm.matchRecipe(grid, 2);
      expect(result).toBeNull();
    });

    it('returns null for empty grid', () => {
      const grid = [0, 0, 0, 0];
      const result = cm.matchRecipe(grid, 2);
      expect(result).toBeNull();
    });
  });

  describe('Shaped recipes', () => {
    it('matches crafting table (2x2 planks)', () => {
      const grid = [
        MC_BLOCKS.PLANKS, MC_BLOCKS.PLANKS,
        MC_BLOCKS.PLANKS, MC_BLOCKS.PLANKS,
      ];
      const result = cm.matchRecipe(grid, 2);
      expect(result).not.toBeNull();
      expect(result.block).toBe(CRAFTING_TABLE);
      expect(result.count).toBe(1);
    });

    it('matches furnace (ring of cobblestone 3x3)', () => {
      const grid = [
        MC_BLOCKS.COBBLESTONE, MC_BLOCKS.COBBLESTONE, MC_BLOCKS.COBBLESTONE,
        MC_BLOCKS.COBBLESTONE, 0, MC_BLOCKS.COBBLESTONE,
        MC_BLOCKS.COBBLESTONE, MC_BLOCKS.COBBLESTONE, MC_BLOCKS.COBBLESTONE,
      ];
      const result = cm.matchRecipe(grid, 3);
      expect(result).not.toBeNull();
      expect(result.block).toBe(53); // FURNACE
    });

    it('does not match wrong pattern', () => {
      const grid = [
        MC_BLOCKS.PLANKS, 0,
        0, MC_BLOCKS.PLANKS,
      ];
      const result = cm.matchRecipe(grid, 2);
      // This diagonal pattern should not match crafting table
      expect(result).toBeNull();
    });
  });

  describe('consumeGrid', () => {
    it('clears the grid', () => {
      const grid = [MC_BLOCKS.OAK_LOG, 0, 0, 0];
      cm.consumeGrid(grid, 2);
      expect(grid).toEqual([0, 0, 0, 0]);
    });
  });

  describe('Normalization', () => {
    it('trims empty rows and columns', () => {
      // Planks in bottom-right of 3x3 should still match 2x2 pattern
      const grid = [
        0, 0, 0,
        0, MC_BLOCKS.PLANKS, MC_BLOCKS.PLANKS,
        0, MC_BLOCKS.PLANKS, MC_BLOCKS.PLANKS,
      ];
      const result = cm.matchRecipe(grid, 3);
      expect(result).not.toBeNull();
      expect(result.block).toBe(CRAFTING_TABLE);
    });
  });
});
