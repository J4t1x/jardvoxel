// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Crafting — Recipes, grid matching, output
// SPEC-038: Crafting System
// ═══════════════════════════════════════════════════════════

import { MC_BLOCKS, BLOCK } from './jardvoxel-survival-mesher.js';
import { TOOL_RECIPES } from './jardvoxel-survival-tools.js';
import { ENCHANT_RECIPES } from './jardvoxel-survival-enchanting.js';
import { FISHING_RECIPES } from './jardvoxel-survival-fishing.js';
import { NETHER_RECIPES } from './jardvoxel-survival-nether.js';
import { REDSTONE_RECIPES } from './jardvoxel-survival-redstone.js';
import { BREWING_CRAFT_RECIPES, BREWING_BLOCKS } from './jardvoxel-survival-brewing.js';
import { SHIELD_RECIPES, SHIELD_BLOCKS } from './jardvoxel-survival-shields.js';
import { ANVIL_RECIPES, ANVIL_BLOCKS } from './jardvoxel-survival-anvil.js';
import { MAP_RECIPES, MAP_BLOCKS } from './jardvoxel-survival-map.js';

// Crafting Table block ID (extends MC_BLOCKS)
export const CRAFTING_TABLE = 51;

// Recipe types: 'shaped' (pattern-based) or 'shapeless' (ingredient list)
export const RECIPES = [
  // Planks from logs (shapeless — any log = 4 planks)
  { type: 'shapeless', ingredients: [MC_BLOCKS.OAK_LOG], output: { block: MC_BLOCKS.PLANKS, count: 4 } },
  { type: 'shapeless', ingredients: [MC_BLOCKS.BIRCH_LOG], output: { block: MC_BLOCKS.PLANKS, count: 4 } },
  { type: 'shapeless', ingredients: [MC_BLOCKS.SPRUCE_LOG], output: { block: MC_BLOCKS.PLANKS, count: 4 } },
  { type: 'shapeless', ingredients: [MC_BLOCKS.JUNGLE_LOG], output: { block: MC_BLOCKS.PLANKS, count: 4 } },

  // Sticks (shaped — 2 planks vertical)
  { type: 'shaped', pattern: [['planks'], ['planks']], output: { block: 52, count: 4 } }, // STICK = 52

  // Crafting Table (shaped — 2x2 planks)
  { type: 'shaped', pattern: [['planks', 'planks'], ['planks', 'planks']], output: { block: CRAFTING_TABLE, count: 1 } },

  // Torch (shapeless — stick + coal)
  { type: 'shapeless', ingredients: [52, MC_BLOCKS.COAL_ORE], output: { block: MC_BLOCKS.TORCH, count: 4 } },

  // Cobblestone → Furnace (shaped 3x3 — ring of cobblestone)
  { type: 'shaped', pattern: [
    ['cobblestone', 'cobblestone', 'cobblestone'],
    ['cobblestone', null, 'cobblestone'],
    ['cobblestone', 'cobblestone', 'cobblestone'],
  ], output: { block: 53, count: 1 } }, // FURNACE = 53

  // Bricks (shaped — brick items 2x2)
  { type: 'shaped', pattern: [['bricks', 'bricks'], ['bricks', 'bricks']], output: { block: MC_BLOCKS.BRICKS, count: 4 } },

  // Glass from sand (shapeless — 1 sand = 1 glass, simplified)
  { type: 'shapeless', ingredients: [BLOCK.SAND], output: { block: MC_BLOCKS.GLASS, count: 1 } },

  // Sandstone (shaped — 2x2 sand)
  { type: 'shaped', pattern: [['sand', 'sand'], ['sand', 'sand']], output: { block: MC_BLOCKS.SANDSTONE, count: 4 } },

  // Mossy Cobblestone (shapeless — cobblestone + moss)
  { type: 'shapeless', ingredients: [MC_BLOCKS.COBBLESTONE, MC_BLOCKS.MOSS], output: { block: MC_BLOCKS.MOSSY_COBBLE, count: 1 } },

  // Bookshelf (shaped — planks + planks + planks vertical with planks horizontal)
  { type: 'shaped', pattern: [
    ['planks', 'planks', 'planks'],
    ['bookshelf', 'bookshelf', 'bookshelf'],
    ['planks', 'planks', 'planks'],
  ], output: { block: MC_BLOCKS.BOOKSHELF, count: 1 } },

  // Obsidian (shapeless — 4 cobblestone, simplified)
  { type: 'shapeless', ingredients: [MC_BLOCKS.COBBLESTONE, MC_BLOCKS.COBBLESTONE, MC_BLOCKS.COBBLESTONE, MC_BLOCKS.COBBLESTONE], output: { block: MC_BLOCKS.OBSIDIAN, count: 1 } },

  // Lantern (shapeless — torch + iron)
  { type: 'shapeless', ingredients: [MC_BLOCKS.TORCH, MC_BLOCKS.IRON_ORE], output: { block: MC_BLOCKS.LANTERN, count: 1 } },

  // Pumpkin (shapeless — 4 flower_red)
  { type: 'shapeless', ingredients: [MC_BLOCKS.FLOWER_RED, MC_BLOCKS.FLOWER_RED, MC_BLOCKS.FLOWER_RED, MC_BLOCKS.FLOWER_RED], output: { block: MC_BLOCKS.PUMPKIN, count: 1 } },

  // Melon (shapeless — 4 flower_yellow)
  { type: 'shapeless', ingredients: [MC_BLOCKS.FLOWER_YELLOW, MC_BLOCKS.FLOWER_YELLOW, MC_BLOCKS.FLOWER_YELLOW, MC_BLOCKS.FLOWER_YELLOW], output: { block: MC_BLOCKS.MELON, count: 1 } },

  // Bow (shaped 3x3 — sticks in diagonal)
  { type: 'shaped', pattern: [
    [null, 'stick', null],
    ['stick', null, 'stick'],
    [null, 'stick', null],
  ], output: { block: MC_BLOCKS.BOW, count: 1 } },

  // Arrows x4 (shapeless — iron + stick + feather)
  { type: 'shapeless', ingredients: [MC_BLOCKS.IRON_INGOT, 52, MC_BLOCKS.FEATHER], output: { block: MC_BLOCKS.ARROW, count: 4 } },

  // Bed (shaped 3x3 — 3 wool on top, 3 planks on bottom)
  { type: 'shaped', pattern: [
    ['wool', 'wool', 'wool'],
    ['planks', 'planks', 'planks'],
    [null, null, null],
  ], output: { block: MC_BLOCKS.BED, count: 1 } },

  // Hoe (shaped 3x3 — 2 iron on top, 1 stick below)
  { type: 'shaped', pattern: [
    ['iron_ingot', 'iron_ingot', null],
    [null, 'stick', null],
    [null, 'stick', null],
  ], output: { block: MC_BLOCKS.HOE, count: 1 } },

  // Bread (shapeless — 3 wheat crops)
  { type: 'shapeless', ingredients: [MC_BLOCKS.WHEAT_CROP, MC_BLOCKS.WHEAT_CROP, MC_BLOCKS.WHEAT_CROP], output: { block: MC_BLOCKS.BREAD, count: 1 } },

  // Tools & Armor (SPEC-051)
  ...TOOL_RECIPES,

  // Enchanting items (SPEC-052)
  ...ENCHANT_RECIPES,

  // Fishing (SPEC-054)
  ...FISHING_RECIPES,

  // Nether (SPEC-055)
  ...NETHER_RECIPES,

  // Redstone (SPEC-056)
  ...REDSTONE_RECIPES,

  // Brewing (SPEC-062)
  ...BREWING_CRAFT_RECIPES,

  // Shields (SPEC-063)
  ...SHIELD_RECIPES,

  // Anvil (SPEC-065)
  ...ANVIL_RECIPES,

  // Map & Cartography (SPEC-066)
  ...MAP_RECIPES,
];

// Tag mappings for pattern matching
const TAG_MAP = {
  'planks': MC_BLOCKS.PLANKS,
  'wood': MC_BLOCKS.PLANKS,
  'cobblestone': MC_BLOCKS.COBBLESTONE,
  'sand': BLOCK.SAND,
  'bricks': MC_BLOCKS.BRICKS,
  'bookshelf': MC_BLOCKS.BOOKSHELF,
  'stick': 52,
  'wool': MC_BLOCKS.WOOL,
  'iron_ingot': MC_BLOCKS.IRON_INGOT,
  'diamond': MC_BLOCKS.DIAMOND_ORE,
  'gold_ingot': MC_BLOCKS.GOLD_INGOT,
  'obsidian': MC_BLOCKS.OBSIDIAN,
  'book': 102,
  'redstone_dust': 120,
  'quartz': 117,
  'blaze_rod': 118,
  'glass': MC_BLOCKS.GLASS,
  'blaze_powder': BREWING_BLOCKS.BLAZE_POWDER,
  'paper': MC_BLOCKS.BAMBOO,
  'compass': MAP_BLOCKS.COMPASS,
};

function blockMatchesTag(block, tag) {
  if (tag === null || tag === undefined) return block === BLOCK.AIR || block === 0;
  const tagBlock = typeof tag === 'string' ? TAG_MAP[tag] : tag;
  return block === tagBlock;
}

function normalizeGrid(grid, size) {
  // Trim empty rows/cols and return compact grid
  const rows = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    let hasContent = false;
    for (let c = 0; c < size; c++) {
      const val = grid[r * size + c];
      if (val && val !== 0) hasContent = true;
      row.push(val || 0);
    }
    if (hasContent) rows.push(row);
  }
  if (rows.length === 0) return null;
  // Trim leading/trailing empty columns
  let minCol = size, maxCol = -1;
  for (const row of rows) {
    for (let c = 0; c < size; c++) {
      if (row[c] && row[c] !== 0) {
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
      }
    }
  }
  return rows.map(row => row.slice(minCol, maxCol + 1));
}

function gridsMatch(crafted, pattern) {
  if (!crafted || !pattern) return false;
  if (crafted.length !== pattern.length) return false;
  for (let r = 0; r < crafted.length; r++) {
    if (crafted[r].length !== pattern[r].length) return false;
    for (let c = 0; c < crafted[r].length; c++) {
      if (!blockMatchesTag(crafted[r][c], pattern[r][c])) return false;
    }
  }
  return true;
}

export class CraftingManager {
  constructor() {
    this.recipes = RECIPES;
  }

  // grid: array of block IDs (0 = empty), size: 2 or 3
  // Returns output item or null
  matchRecipe(grid, size) {
    const normalized = normalizeGrid(grid, size);
    if (!normalized) return null;

    for (const recipe of this.recipes) {
      if (recipe.type === 'shaped') {
        if (gridsMatch(normalized, recipe.pattern)) {
          return recipe.output;
        }
      } else if (recipe.type === 'shapeless') {
        if (this._matchShapeless(normalized, recipe.ingredients)) {
          return recipe.output;
        }
      }
    }
    return null;
  }

  _matchShapeless(normalized, ingredients) {
    const flat = [];
    for (const row of normalized) {
      for (const val of row) {
        if (val && val !== 0) flat.push(val);
      }
    }
    if (flat.length !== ingredients.length) return false;
    const used = new Array(flat.length).fill(false);
    for (const ing of ingredients) {
      let found = false;
      for (let i = 0; i < flat.length; i++) {
        if (used[i]) continue;
        const ingBlock = typeof ing === 'string' ? TAG_MAP[ing] : ing;
        if (flat[i] === ingBlock) {
          used[i] = true;
          found = true;
          break;
        }
      }
      if (!found) return false;
    }
    return true;
  }

  // Consume ingredients from grid after crafting
  consumeGrid(grid, size) {
    for (let i = 0; i < grid.length; i++) {
      grid[i] = 0;
    }
  }
}

// Extended block IDs for crafting
export const CRAFTING_BLOCK_IDS = {
  CRAFTING_TABLE: 51,
  STICK: 52,
  FURNACE: 53,
};

// Add to MC_BLOCK_COLORS and MC_BLOCK_NAMES via prototype extension
export const CRAFTING_BLOCK_COLORS = {
  51: [0.55, 0.38, 0.20], // Crafting table
  52: [0.65, 0.45, 0.25], // Stick
  53: [0.45, 0.45, 0.47], // Furnace
};

export const CRAFTING_BLOCK_NAMES = {
  51: 'Crafting Table',
  52: 'Stick',
  53: 'Furnace',
};

export const CRAFTING_BLOCK_HARDNESS = {
  51: 1.0,
  52: 0.2,
  53: 1.5,
};
