// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Mesher — Full greedy meshing + AO + water
// SPEC-002: Advanced mesher for voxel-style engine
// ═══════════════════════════════════════════════════════════

import {
  CHUNK_SIZE, CHUNK_HEIGHT, WORLD_MIN_Y, SEA_LEVEL,
  BIOMES, BIOME_COLORS,
  WorldGenPipeline, VoxelChunk,
} from './jardvoxel-survival-engine.js';
import { TOOL_BLOCK_COLORS, TOOL_BLOCK_NAMES, TOOL_BLOCK_HARDNESS, TOOL_PLACEABLE_BLOCKS } from './jardvoxel-survival-tools.js';
import { ENCHANT_BLOCK_COLORS, ENCHANT_BLOCK_NAMES, ENCHANT_BLOCK_HARDNESS, ENCHANT_PLACEABLE_BLOCKS } from './jardvoxel-survival-enchanting.js';
import { VILLAGER_BLOCK_COLORS, VILLAGER_BLOCK_NAMES, VILLAGER_BLOCK_HARDNESS, VILLAGER_PLACEABLE_BLOCKS } from './jardvoxel-survival-villagers.js';
import { FISHING_BLOCK_COLORS, FISHING_BLOCK_NAMES, FISHING_BLOCK_HARDNESS, FISHING_PLACEABLE_BLOCKS } from './jardvoxel-survival-fishing.js';
import { NETHER_BLOCK_COLORS, NETHER_BLOCK_NAMES, NETHER_BLOCK_HARDNESS, NETHER_PLACEABLE_BLOCKS } from './jardvoxel-survival-nether.js';
import { REDSTONE_BLOCK_COLORS, REDSTONE_BLOCK_NAMES, REDSTONE_BLOCK_HARDNESS, REDSTONE_PLACEABLE_BLOCKS } from './jardvoxel-survival-redstone.js';
import { BREWING_BLOCK_COLORS, BREWING_BLOCK_NAMES, BREWING_BLOCK_HARDNESS, BREWING_PLACEABLE_BLOCKS } from './jardvoxel-survival-brewing.js';
import { SHIELD_BLOCK_COLORS, SHIELD_BLOCK_NAMES, SHIELD_BLOCK_HARDNESS, SHIELD_PLACEABLE_BLOCKS } from './jardvoxel-survival-shields.js';
import { ANVIL_BLOCK_COLORS, ANVIL_BLOCK_NAMES, ANVIL_BLOCK_HARDNESS, ANVIL_PLACEABLE_BLOCKS } from './jardvoxel-survival-anvil.js';
import { MAP_BLOCK_COLORS, MAP_BLOCK_NAMES, MAP_BLOCK_HARDNESS, MAP_PLACEABLE_BLOCKS } from './jardvoxel-survival-map.js';

// Block IDs (must match engine's blockTypeToId)
export const BLOCK = {
  AIR: 0, STONE: 1, GRASS: 2, DIRT: 3, SAND: 4,
  WATER: 5, LAVA: 6, SNOW: 7, MUD: 8,
};

// Extended block types for features
export const MC_BLOCKS = {
  ...BLOCK,
  OAK_LOG: 9, OAK_LEAVES: 10, BIRCH_LOG: 11, BIRCH_LEAVES: 12,
  SPRUCE_LOG: 13, SPRUCE_LEAVES: 14, JUNGLE_LOG: 15, JUNGLE_LEAVES: 16,
  COAL_ORE: 17, IRON_ORE: 18, GOLD_ORE: 19, DIAMOND_ORE: 20,
  COBBLESTONE: 21, PLANKS: 22, GLASS: 23, BRICKS: 24,
  TORCH: 25, LANTERN: 26, CACTUS: 27, FLOWER_RED: 28,
  FLOWER_YELLOW: 29, TALL_GRASS: 30, FERN: 31, DEAD_BUSH: 32,
  MOSSY_COBBLE: 33, SANDSTONE: 34, GRAVEL: 35, CLAY: 36,
  OBSIDIAN: 37, BEDROCK: 38, SNOW_BLOCK: 39, ICE: 40,
  PACKED_ICE: 41, MYCELIUM: 42, MOSS: 43, BAMBOO: 44,
  GRANITE: 45, ANDESITE: 46, DIORITE: 47,
  BOOKSHELF: 48, PUMPKIN: 49, MELON: 50,
  CRAFTING_TABLE: 51, STICK: 52, FURNACE: 53,
  LEATHER: 54, RAW_BEEF: 55, RAW_PORKCHOP: 56, FEATHER: 57,
  RAW_CHICKEN: 58, WOOL: 59, RAW_MUTTON: 60,
  COOKED_BEEF: 61, COOKED_PORKCHOP: 62, COOKED_CHICKEN: 63, COOKED_MUTTON: 64,
  IRON_INGOT: 65, GOLD_INGOT: 66,
  ROTTEN_FLESH: 67, BONES: 68, ARROW: 69,
  GUNPOWDER: 70, STRING: 71,
  BOW: 72,
  BED: 74,
  WHEAT_SEEDS: 75, WHEAT_CROP: 76, FARMLAND: 77, HOE: 78, BREAD: 79,
};

export const MC_BLOCK_COLORS = {
  [BLOCK.STONE]: [0.50, 0.50, 0.52],
  [BLOCK.GRASS]: [0.35, 0.72, 0.25],
  [BLOCK.DIRT]: [0.55, 0.40, 0.25],
  [BLOCK.SAND]: [0.93, 0.83, 0.55],
  [BLOCK.WATER]: [0.15, 0.40, 0.70],
  [BLOCK.LAVA]: [0.90, 0.35, 0.05],
  [BLOCK.SNOW]: [0.92, 0.92, 0.96],
  [BLOCK.MUD]: [0.40, 0.35, 0.20],
  [MC_BLOCKS.OAK_LOG]: [0.45, 0.30, 0.15],
  [MC_BLOCKS.OAK_LEAVES]: [0.15, 0.50, 0.15],
  [MC_BLOCKS.BIRCH_LOG]: [0.82, 0.78, 0.62],
  [MC_BLOCKS.BIRCH_LEAVES]: [0.20, 0.55, 0.20],
  [MC_BLOCKS.SPRUCE_LOG]: [0.25, 0.18, 0.12],
  [MC_BLOCKS.SPRUCE_LEAVES]: [0.10, 0.35, 0.15],
  [MC_BLOCKS.JUNGLE_LOG]: [0.30, 0.25, 0.10],
  [MC_BLOCKS.JUNGLE_LEAVES]: [0.10, 0.52, 0.10],
  [MC_BLOCKS.COAL_ORE]: [0.25, 0.25, 0.25],
  [MC_BLOCKS.IRON_ORE]: [0.65, 0.55, 0.40],
  [MC_BLOCKS.GOLD_ORE]: [0.80, 0.65, 0.15],
  [MC_BLOCKS.DIAMOND_ORE]: [0.30, 0.85, 0.85],
  [MC_BLOCKS.COBBLESTONE]: [0.45, 0.45, 0.47],
  [MC_BLOCKS.PLANKS]: [0.65, 0.45, 0.25],
  [MC_BLOCKS.GLASS]: [0.80, 0.90, 0.95],
  [MC_BLOCKS.BRICKS]: [0.60, 0.35, 0.30],
  [MC_BLOCKS.TORCH]: [0.90, 0.55, 0.15],
  [MC_BLOCKS.LANTERN]: [0.95, 0.75, 0.25],
  [MC_BLOCKS.CACTUS]: [0.30, 0.55, 0.25],
  [MC_BLOCKS.FLOWER_RED]: [0.85, 0.25, 0.20],
  [MC_BLOCKS.FLOWER_YELLOW]: [0.90, 0.80, 0.20],
  [MC_BLOCKS.TALL_GRASS]: [0.38, 0.62, 0.25],
  [MC_BLOCKS.FERN]: [0.30, 0.55, 0.20],
  [MC_BLOCKS.DEAD_BUSH]: [0.50, 0.35, 0.20],
  [MC_BLOCKS.MOSSY_COBBLE]: [0.35, 0.45, 0.30],
  [MC_BLOCKS.SANDSTONE]: [0.88, 0.78, 0.50],
  [MC_BLOCKS.GRAVEL]: [0.48, 0.45, 0.42],
  [MC_BLOCKS.CLAY]: [0.70, 0.70, 0.75],
  [MC_BLOCKS.OBSIDIAN]: [0.08, 0.06, 0.14],
  [MC_BLOCKS.BEDROCK]: [0.20, 0.20, 0.22],
  [MC_BLOCKS.SNOW_BLOCK]: [0.92, 0.92, 0.96],
  [MC_BLOCKS.ICE]: [0.60, 0.80, 0.95],
  [MC_BLOCKS.PACKED_ICE]: [0.55, 0.75, 0.92],
  [MC_BLOCKS.MYCELIUM]: [0.55, 0.50, 0.58],
  [MC_BLOCKS.MOSS]: [0.25, 0.45, 0.20],
  [MC_BLOCKS.BAMBOO]: [0.55, 0.70, 0.25],
  [MC_BLOCKS.GRANITE]: [0.62, 0.40, 0.35],
  [MC_BLOCKS.ANDESITE]: [0.52, 0.52, 0.55],
  [MC_BLOCKS.DIORITE]: [0.78, 0.75, 0.72],
  [MC_BLOCKS.BOOKSHELF]: [0.65, 0.45, 0.25],
  [MC_BLOCKS.PUMPKIN]: [0.85, 0.55, 0.15],
  [MC_BLOCKS.MELON]: [0.55, 0.75, 0.30],
  [MC_BLOCKS.CRAFTING_TABLE]: [0.55, 0.38, 0.20],
  [MC_BLOCKS.STICK]: [0.65, 0.45, 0.25],
  [MC_BLOCKS.FURNACE]: [0.45, 0.45, 0.47],
  [MC_BLOCKS.LEATHER]: [0.65, 0.45, 0.30],
  [MC_BLOCKS.RAW_BEEF]: [0.75, 0.40, 0.35],
  [MC_BLOCKS.RAW_PORKCHOP]: [0.85, 0.55, 0.55],
  [MC_BLOCKS.FEATHER]: [0.90, 0.90, 0.85],
  [MC_BLOCKS.RAW_CHICKEN]: [0.85, 0.75, 0.65],
  [MC_BLOCKS.WOOL]: [0.92, 0.92, 0.92],
  [MC_BLOCKS.RAW_MUTTON]: [0.80, 0.50, 0.45],
  [MC_BLOCKS.COOKED_BEEF]: [0.55, 0.30, 0.20],
  [MC_BLOCKS.COOKED_PORKCHOP]: [0.70, 0.40, 0.35],
  [MC_BLOCKS.COOKED_CHICKEN]: [0.75, 0.60, 0.40],
  [MC_BLOCKS.COOKED_MUTTON]: [0.65, 0.35, 0.30],
  [MC_BLOCKS.IRON_INGOT]: [0.80, 0.80, 0.85],
  [MC_BLOCKS.GOLD_INGOT]: [0.85, 0.70, 0.20],
  [MC_BLOCKS.ROTTEN_FLESH]: [0.55, 0.45, 0.40],
  [MC_BLOCKS.BONES]: [0.90, 0.88, 0.82],
  [MC_BLOCKS.ARROW]: [0.60, 0.50, 0.30],
  [MC_BLOCKS.GUNPOWDER]: [0.30, 0.30, 0.28],
  [MC_BLOCKS.STRING]: [0.85, 0.82, 0.78],
  [MC_BLOCKS.BOW]: [0.65, 0.45, 0.25],
  [MC_BLOCKS.BED]: [0.85, 0.25, 0.25],
  [MC_BLOCKS.WHEAT_SEEDS]: [0.65, 0.55, 0.20],
  [MC_BLOCKS.WHEAT_CROP]: [0.85, 0.75, 0.30],
  [MC_BLOCKS.FARMLAND]: [0.50, 0.38, 0.22],
  [MC_BLOCKS.HOE]: [0.65, 0.45, 0.25],
  [MC_BLOCKS.BREAD]: [0.90, 0.70, 0.40],
  ...TOOL_BLOCK_COLORS,
  ...ENCHANT_BLOCK_COLORS,
  ...VILLAGER_BLOCK_COLORS,
  ...FISHING_BLOCK_COLORS,
  ...NETHER_BLOCK_COLORS,
  ...REDSTONE_BLOCK_COLORS,
  ...BREWING_BLOCK_COLORS,
  ...SHIELD_BLOCK_COLORS,
  ...ANVIL_BLOCK_COLORS,
  ...MAP_BLOCK_COLORS,
};

export const MC_BLOCK_NAMES = {
  [BLOCK.STONE]: 'Stone', [BLOCK.GRASS]: 'Grass', [BLOCK.DIRT]: 'Dirt',
  [BLOCK.SAND]: 'Sand', [BLOCK.WATER]: 'Water', [BLOCK.LAVA]: 'Lava',
  [BLOCK.SNOW]: 'Snow', [BLOCK.MUD]: 'Mud',
  [MC_BLOCKS.OAK_LOG]: 'Oak Log', [MC_BLOCKS.OAK_LEAVES]: 'Oak Leaves',
  [MC_BLOCKS.BIRCH_LOG]: 'Birch Log', [MC_BLOCKS.BIRCH_LEAVES]: 'Birch Leaves',
  [MC_BLOCKS.SPRUCE_LOG]: 'Spruce Log', [MC_BLOCKS.SPRUCE_LEAVES]: 'Spruce Leaves',
  [MC_BLOCKS.JUNGLE_LOG]: 'Jungle Log', [MC_BLOCKS.JUNGLE_LEAVES]: 'Jungle Leaves',
  [MC_BLOCKS.COAL_ORE]: 'Coal Ore', [MC_BLOCKS.IRON_ORE]: 'Iron Ore',
  [MC_BLOCKS.GOLD_ORE]: 'Gold Ore', [MC_BLOCKS.DIAMOND_ORE]: 'Diamond Ore',
  [MC_BLOCKS.COBBLESTONE]: 'Cobblestone', [MC_BLOCKS.PLANKS]: 'Planks',
  [MC_BLOCKS.GLASS]: 'Glass', [MC_BLOCKS.BRICKS]: 'Bricks',
  [MC_BLOCKS.TORCH]: 'Torch', [MC_BLOCKS.LANTERN]: 'Lantern',
  [MC_BLOCKS.CACTUS]: 'Cactus', [MC_BLOCKS.FLOWER_RED]: 'Poppy',
  [MC_BLOCKS.FLOWER_YELLOW]: 'Dandelion', [MC_BLOCKS.TALL_GRASS]: 'Tall Grass',
  [MC_BLOCKS.FERN]: 'Fern', [MC_BLOCKS.DEAD_BUSH]: 'Dead Bush',
  [MC_BLOCKS.MOSSY_COBBLE]: 'Mossy Cobblestone', [MC_BLOCKS.SANDSTONE]: 'Sandstone',
  [MC_BLOCKS.GRAVEL]: 'Gravel', [MC_BLOCKS.CLAY]: 'Clay',
  [MC_BLOCKS.OBSIDIAN]: 'Obsidian', [MC_BLOCKS.BEDROCK]: 'Bedrock',
  [MC_BLOCKS.SNOW_BLOCK]: 'Snow Block', [MC_BLOCKS.ICE]: 'Ice',
  [MC_BLOCKS.PACKED_ICE]: 'Packed Ice', [MC_BLOCKS.MYCELIUM]: 'Mycelium',
  [MC_BLOCKS.MOSS]: 'Moss', [MC_BLOCKS.BAMBOO]: 'Bamboo',
  [MC_BLOCKS.GRANITE]: 'Granite', [MC_BLOCKS.ANDESITE]: 'Andesite',
  [MC_BLOCKS.DIORITE]: 'Diorite', [MC_BLOCKS.BOOKSHELF]: 'Bookshelf',
  [MC_BLOCKS.PUMPKIN]: 'Pumpkin', [MC_BLOCKS.MELON]: 'Melon',
  [MC_BLOCKS.CRAFTING_TABLE]: 'Crafting Table', [MC_BLOCKS.STICK]: 'Stick',
  [MC_BLOCKS.FURNACE]: 'Furnace',
  [MC_BLOCKS.LEATHER]: 'Leather', [MC_BLOCKS.RAW_BEEF]: 'Raw Beef',
  [MC_BLOCKS.RAW_PORKCHOP]: 'Raw Porkchop', [MC_BLOCKS.FEATHER]: 'Feather',
  [MC_BLOCKS.RAW_CHICKEN]: 'Raw Chicken', [MC_BLOCKS.WOOL]: 'Wool',
  [MC_BLOCKS.RAW_MUTTON]: 'Raw Mutton', [MC_BLOCKS.COOKED_BEEF]: 'Cooked Beef',
  [MC_BLOCKS.COOKED_PORKCHOP]: 'Cooked Porkchop', [MC_BLOCKS.COOKED_CHICKEN]: 'Cooked Chicken',
  [MC_BLOCKS.COOKED_MUTTON]: 'Cooked Mutton',
  [MC_BLOCKS.IRON_INGOT]: 'Iron Ingot', [MC_BLOCKS.GOLD_INGOT]: 'Gold Ingot',
  [MC_BLOCKS.ROTTEN_FLESH]: 'Rotten Flesh', [MC_BLOCKS.BONES]: 'Bones',
  [MC_BLOCKS.ARROW]: 'Arrow', [MC_BLOCKS.GUNPOWDER]: 'Gunpowder',
  [MC_BLOCKS.STRING]: 'String',
  [MC_BLOCKS.BOW]: 'Bow',
  [MC_BLOCKS.BED]: 'Bed',
  [MC_BLOCKS.WHEAT_SEEDS]: 'Wheat Seeds',
  [MC_BLOCKS.WHEAT_CROP]: 'Wheat',
  [MC_BLOCKS.FARMLAND]: 'Farmland',
  [MC_BLOCKS.HOE]: 'Hoe',
  [MC_BLOCKS.BREAD]: 'Bread',
  ...TOOL_BLOCK_NAMES,
  ...ENCHANT_BLOCK_NAMES,
  ...VILLAGER_BLOCK_NAMES,
  ...FISHING_BLOCK_NAMES,
  ...NETHER_BLOCK_NAMES,
  ...REDSTONE_BLOCK_NAMES,
  ...BREWING_BLOCK_NAMES,
  ...SHIELD_BLOCK_NAMES,
  ...ANVIL_BLOCK_NAMES,
  ...MAP_BLOCK_NAMES,
};

export const MC_BLOCK_HARDNESS = {
  [BLOCK.STONE]: 1.0, [BLOCK.DIRT]: 0.3, [BLOCK.GRASS]: 0.3,
  [BLOCK.SAND]: 0.3, [BLOCK.SNOW]: 0.2, [BLOCK.MUD]: 0.4,
  [MC_BLOCKS.OAK_LOG]: 0.8, [MC_BLOCKS.BIRCH_LOG]: 0.8,
  [MC_BLOCKS.SPRUCE_LOG]: 0.8, [MC_BLOCKS.JUNGLE_LOG]: 0.8,
  [MC_BLOCKS.OAK_LEAVES]: 0.2, [MC_BLOCKS.BIRCH_LEAVES]: 0.2,
  [MC_BLOCKS.SPRUCE_LEAVES]: 0.2, [MC_BLOCKS.JUNGLE_LEAVES]: 0.2,
  [MC_BLOCKS.COAL_ORE]: 1.5, [MC_BLOCKS.IRON_ORE]: 1.5,
  [MC_BLOCKS.GOLD_ORE]: 1.5, [MC_BLOCKS.DIAMOND_ORE]: 1.8,
  [MC_BLOCKS.COBBLESTONE]: 1.0, [MC_BLOCKS.PLANKS]: 0.8,
  [MC_BLOCKS.GLASS]: 0.3, [MC_BLOCKS.BRICKS]: 1.0,
  [MC_BLOCKS.TORCH]: 0.1, [MC_BLOCKS.LANTERN]: 0.3,
  [MC_BLOCKS.CACTUS]: 0.3, [MC_BLOCKS.OBSIDIAN]: 3.0,
  [MC_BLOCKS.BEDROCK]: Infinity, [MC_BLOCKS.SANDSTONE]: 0.8,
  [MC_BLOCKS.MOSSY_COBBLE]: 1.0, [MC_BLOCKS.GRAVEL]: 0.3,
  [MC_BLOCKS.GRANITE]: 1.2, [MC_BLOCKS.ANDESITE]: 1.1,
  [MC_BLOCKS.DIORITE]: 1.1, [MC_BLOCKS.ICE]: 0.3,
  [MC_BLOCKS.PACKED_ICE]: 0.5, [MC_BLOCKS.BOOKSHELF]: 0.8,
  [MC_BLOCKS.CRAFTING_TABLE]: 1.0, [MC_BLOCKS.STICK]: 0.2,
  [MC_BLOCKS.FURNACE]: 1.5,
  ...TOOL_BLOCK_HARDNESS,
  ...ENCHANT_BLOCK_HARDNESS,
  ...VILLAGER_BLOCK_HARDNESS,
  ...FISHING_BLOCK_HARDNESS,
  ...NETHER_BLOCK_HARDNESS,
  ...REDSTONE_BLOCK_HARDNESS,
  ...BREWING_BLOCK_HARDNESS,
  ...SHIELD_BLOCK_HARDNESS,
  ...ANVIL_BLOCK_HARDNESS,
  ...MAP_BLOCK_HARDNESS,
};

export const MC_PLACEABLE_BLOCKS = [
  BLOCK.GRASS, BLOCK.DIRT, BLOCK.STONE, BLOCK.SAND,
  MC_BLOCKS.OAK_LOG, MC_BLOCKS.OAK_LEAVES, MC_BLOCKS.BIRCH_LOG,
  MC_BLOCKS.SPRUCE_LOG, MC_BLOCKS.PLANKS, MC_BLOCKS.COBBLESTONE,
  MC_BLOCKS.GLASS, MC_BLOCKS.BRICKS, MC_BLOCKS.SANDSTONE,
  MC_BLOCKS.MOSSY_COBBLE, MC_BLOCKS.GRAVEL, MC_BLOCKS.TORCH,
  MC_BLOCKS.LANTERN, MC_BLOCKS.OBSIDIAN, MC_BLOCKS.SNOW_BLOCK,
  MC_BLOCKS.ICE, MC_BLOCKS.GRANITE, MC_BLOCKS.ANDESITE, MC_BLOCKS.DIORITE,
  MC_BLOCKS.COAL_ORE, MC_BLOCKS.IRON_ORE, MC_BLOCKS.GOLD_ORE,
  MC_BLOCKS.DIAMOND_ORE, MC_BLOCKS.CACTUS, MC_BLOCKS.FLOWER_RED,
  MC_BLOCKS.FLOWER_YELLOW, MC_BLOCKS.TALL_GRASS, MC_BLOCKS.BOOKSHELF,
  MC_BLOCKS.PUMPKIN, MC_BLOCKS.MELON, MC_BLOCKS.BAMBOO, MC_BLOCKS.MOSS,
  MC_BLOCKS.CRAFTING_TABLE, MC_BLOCKS.STICK, MC_BLOCKS.FURNACE,
  MC_BLOCKS.LEATHER, MC_BLOCKS.RAW_BEEF, MC_BLOCKS.RAW_PORKCHOP,
  MC_BLOCKS.FEATHER, MC_BLOCKS.RAW_CHICKEN, MC_BLOCKS.WOOL,
  MC_BLOCKS.RAW_MUTTON, MC_BLOCKS.COOKED_BEEF, MC_BLOCKS.COOKED_PORKCHOP,
  MC_BLOCKS.COOKED_CHICKEN, MC_BLOCKS.COOKED_MUTTON,
  MC_BLOCKS.IRON_INGOT, MC_BLOCKS.GOLD_INGOT,
  MC_BLOCKS.ROTTEN_FLESH, MC_BLOCKS.BONES, MC_BLOCKS.ARROW,
  MC_BLOCKS.GUNPOWDER, MC_BLOCKS.STRING,
  MC_BLOCKS.BOW,
  MC_BLOCKS.BED,
  MC_BLOCKS.WHEAT_SEEDS, MC_BLOCKS.WHEAT_CROP, MC_BLOCKS.FARMLAND,
  MC_BLOCKS.HOE, MC_BLOCKS.BREAD,
  ...TOOL_PLACEABLE_BLOCKS,
  ...ENCHANT_PLACEABLE_BLOCKS,
  ...VILLAGER_PLACEABLE_BLOCKS,
  ...FISHING_PLACEABLE_BLOCKS,
  ...NETHER_PLACEABLE_BLOCKS,
  ...REDSTONE_PLACEABLE_BLOCKS,
  ...BREWING_PLACEABLE_BLOCKS,
  ...SHIELD_PLACEABLE_BLOCKS,
  ...ANVIL_PLACEABLE_BLOCKS,
  ...MAP_PLACEABLE_BLOCKS,
];

const TRANSPARENT_BLOCKS = new Set([
  BLOCK.AIR, BLOCK.WATER, MC_BLOCKS.OAK_LEAVES, MC_BLOCKS.BIRCH_LEAVES,
  MC_BLOCKS.SPRUCE_LEAVES, MC_BLOCKS.JUNGLE_LEAVES, MC_BLOCKS.GLASS,
  MC_BLOCKS.TORCH, MC_BLOCKS.FLOWER_RED, MC_BLOCKS.FLOWER_YELLOW,
  MC_BLOCKS.TALL_GRASS, MC_BLOCKS.FERN, MC_BLOCKS.DEAD_BUSH,
  MC_BLOCKS.BAMBOO, MC_BLOCKS.MOSS,
  MC_BLOCKS.WHEAT_CROP,
  116, // Nether portal block
  120, // Redstone dust
  121, // Redstone torch
  122, // Lever
  125, // Redstone repeater
]);

const EMISSIVE_BLOCKS = new Set([BLOCK.LAVA, MC_BLOCKS.TORCH, MC_BLOCKS.LANTERN, 113, 116, 121]);

// Redstone block IDs for visual checks
const RS_LAMP = 124;
const RS_DUST = 120;

const FACES = [
  { dir: [0, 1, 0], corners: [[0,1,0],[0,1,1],[1,1,1],[1,1,0]], shade: 1.0 },
  { dir: [0,-1, 0], corners: [[0,0,1],[0,0,0],[1,0,0],[1,0,1]], shade: 0.6 },
  { dir: [1, 0, 0], corners: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]], shade: 0.8 },
  { dir: [-1,0, 0], corners: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]], shade: 0.8 },
  { dir: [0, 0, 1], corners: [[1,0,1],[1,1,1],[0,1,1],[0,0,1]], shade: 0.7 },
  { dir: [0, 0,-1], corners: [[0,0,0],[0,1,0],[1,1,0],[1,0,0]], shade: 0.7 },
];

const FACE_AXES = [
  { du: [0,0,1], dv: [1,0,0] },
  { du: [0,0,1], dv: [1,0,0] },
  { du: [0,1,0], dv: [0,0,1] },
  { du: [0,1,0], dv: [0,0,1] },
  { du: [1,0,0], dv: [0,1,0] },
  { du: [1,0,0], dv: [0,1,0] },
];

function hash3(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function colorVariation(x, y, z, baseColor) {
  const v = (hash3(x, y, z) - 0.5) * 0.08;
  return [
    Math.max(0, Math.min(1, baseColor[0] + v)),
    Math.max(0, Math.min(1, baseColor[1] + v)),
    Math.max(0, Math.min(1, baseColor[2] + v)),
  ];
}

function getGrassFaceColor(face, baseColor) {
  if (face.dir[1] > 0) return [0.35, 0.72, 0.25];
  if (face.dir[1] < 0) return [0.55, 0.40, 0.25];
  return [0.45, 0.50, 0.22];
}

function getVertexAO(chunk, world, x, y, z, dir, corner, ox, oz) {
  const dx = dir[0], dy = dir[1], dz = dir[2];
  const cx = corner[0], cy = corner[1], cz = corner[2];

  function isSolid(lx, ly, lz) {
    if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_HEIGHT) {
      const wx = ox + lx, wy = ly + WORLD_MIN_Y, wz = oz + lz;
      return world.getBlock(wx, wy, wz) !== BLOCK.AIR;
    }
    const b = chunk.getBlock(lx, ly, lz);
    return b !== BLOCK.AIR && b !== BLOCK.WATER;
  }

  const sx = x + dx, sy = y + dy, sz = z + dz;
  const s1 = isSolid(sx + (cx === 0 ? -1 : 1), sy, sz) ? 1 : 0;
  const s2 = isSolid(sx, sy, sz + (cz === 0 ? -1 : 1)) ? 1 : 0;
  const c = isSolid(sx + (cx === 0 ? -1 : 1), sy, sz + (cz === 0 ? -1 : 1)) ? 1 : 0;

  if (s1 && s2) return 0.5;
  return 0.5 + 0.5 * (3 - (s1 + s2 + c)) / 3;
}

export function buildChunkMesh(chunk, world, lodLevel = 0) {
  chunk.generate();
  const positions = [];
  const colors = [];
  const indices = [];
  let vertexCount = 0;

  const ox = chunk.cx * CHUNK_SIZE;
  const oz = chunk.cz * CHUNK_SIZE;

  function getNeighborBlock(x, y, z, dir) {
    const nx = x + dir[0], ny = y + dir[1], nz = z + dir[2];
    if (nx < 0 || nx >= CHUNK_SIZE || nz < 0 || nz >= CHUNK_SIZE || ny < 0 || ny >= CHUNK_HEIGHT) {
      return world.getBlock(ox + nx, ny + WORLD_MIN_Y, oz + nz);
    }
    return chunk.getBlock(nx, ny, nz);
  }

  for (let f = 0; f < FACES.length; f++) {
    const face = FACES[f];
    const dir = face.dir;
    const axes = FACE_AXES[f];
    const du = axes.du, dv = axes.dv;
    const faceShade = face.shade;

    const [uSize, vSize, sRange] = (() => {
      if (dir[0] !== 0) return [CHUNK_HEIGHT, CHUNK_SIZE, CHUNK_SIZE];
      if (dir[1] !== 0) return [CHUNK_SIZE, CHUNK_SIZE, CHUNK_HEIGHT];
      return [CHUNK_SIZE, CHUNK_HEIGHT, CHUNK_SIZE];
    })();

    for (let s = 0; s < sRange; s++) {
      const mask = new Array(uSize * vSize).fill(0);

      for (let u = 0; u < uSize; u++) {
        for (let v = 0; v < vSize; v++) {
          let x, y, z;
          if (dir[0] !== 0) { x = s; y = u; z = v; }
          else if (dir[1] !== 0) { y = s; x = u; z = v; }
          else { z = s; x = u; y = v; }

          const block = chunk.getBlock(x, y, z);
          if (block === BLOCK.AIR || block === BLOCK.WATER) {
            const nb = getNeighborBlock(x, y, z, dir);
            if (nb !== BLOCK.AIR && nb !== BLOCK.WATER) {
              const nx = x + dir[0], ny = y + dir[1], nz = z + dir[2];
              const isCrossChunk = nx < 0 || nx >= CHUNK_SIZE || nz < 0 || nz >= CHUNK_SIZE || ny < 0 || ny >= CHUNK_HEIGHT;
              if (!isCrossChunk) continue;
              const isTrans = TRANSPARENT_BLOCKS.has(nb);
              if (lodLevel >= 2 && isTrans) continue;
              if (!isTrans || nb !== block) {
                mask[u * vSize + v] = nb;
              }
            }
          } else {
            const nb = getNeighborBlock(x, y, z, dir);
            const isTrans = TRANSPARENT_BLOCKS.has(block);
            if (lodLevel >= 2 && isTrans) continue;
            const neighborIsAir = nb === BLOCK.AIR || nb === BLOCK.WATER;
            const neighborIsTransparent = TRANSPARENT_BLOCKS.has(nb);
            if (neighborIsAir || (neighborIsTransparent && !isTrans) || (isTrans && nb !== block)) {
              mask[u * vSize + v] = block;
            }
          }
        }
      }

      // Greedy merge
      for (let u = 0; u < uSize; u++) {
        let v = 0;
        while (v < vSize) {
          const blockType = mask[u * vSize + v];
          if (blockType === 0) { v++; continue; }

          let vEnd = v + 1;
          while (vEnd < vSize && mask[u * vSize + vEnd] === blockType) vEnd++;

          let uEnd = u + 1;
          outer: for (; uEnd < uSize; uEnd++) {
            for (let vv = v; vv < vEnd; vv++) {
              if (mask[uEnd * vSize + vv] !== blockType) break outer;
            }
          }

          function toXYZ(uu, vv, offset) {
            let x, y, z;
            if (dir[0] !== 0) { x = s + offset; y = uu; z = vv; }
            else if (dir[1] !== 0) { y = s + offset; x = uu; z = vv; }
            else { z = s + offset; x = uu; y = vv; }
            return [ox + x, y + WORLD_MIN_Y, oz + z];
          }

          const offset = dir[0] > 0 || dir[1] > 0 || dir[2] > 0 ? 1 : 0;
          const isEmissive = EMISSIVE_BLOCKS.has(blockType);
          const isGrass = blockType === BLOCK.GRASS;
          let baseColor = MC_BLOCK_COLORS[blockType] || BIOME_COLORS[BIOMES.PLAINS] || [0.5, 0.5, 0.5];

          // Compute block world position for redstone visual checks
          let blkWX, blkWY, blkWZ;
          if (dir[0] !== 0) { blkWX = ox + s; blkWY = WORLD_MIN_Y + u; blkWZ = oz + v; }
          else if (dir[1] !== 0) { blkWX = ox + u; blkWY = WORLD_MIN_Y + s; blkWZ = oz + v; }
          else { blkWX = ox + u; blkWY = WORLD_MIN_Y + v; blkWZ = oz + s; }

          // Redstone lamp lit state — bright yellow when powered
          if (blockType === RS_LAMP && world.redstoneManager && world.redstoneManager.isLampLit(blkWX, blkWY, blkWZ)) {
            baseColor = [1.0, 0.9, 0.4];
          }
          // Redstone dust — brightness varies with power level
          if (blockType === RS_DUST && world.redstoneManager) {
            const brightness = world.redstoneManager.getDustBrightness(blkWX, blkWY, blkWZ);
            baseColor = [0.3 + brightness * 0.5, 0.05 + brightness * 0.1, 0.05 + brightness * 0.1];
          }

          const c0 = toXYZ(u, v, offset);
          const c1 = toXYZ(u, vEnd, offset);
          const c2 = toXYZ(uEnd, vEnd, offset);
          const c3 = toXYZ(uEnd, v, offset);

          function blockAt(uu, vv) {
            let x, y, z;
            if (dir[0] !== 0) { x = s; y = uu; z = vv; }
            else if (dir[1] !== 0) { y = s; x = uu; z = vv; }
            else { z = s; x = uu; y = vv; }
            return [x, y, z];
          }

          const aoBlocks = [blockAt(u, v), blockAt(u, vEnd - 1), blockAt(uEnd - 1, vEnd - 1), blockAt(uEnd - 1, v)];
          const aoCorners = face.corners;

          for (let ci = 0; ci < 4; ci++) {
            const corner = [c0, c1, c2, c3][ci];
            let vc;
            if (isGrass) {
              vc = getGrassFaceColor(face, baseColor);
            } else {
              vc = colorVariation(corner[0], corner[1], corner[2], baseColor);
            }

            let r = vc[0] * faceShade;
            let g = vc[1] * faceShade;
            let b = vc[2] * faceShade;

            if (isEmissive) {
              r = Math.min(1, vc[0] * 1.5);
              g = Math.min(1, vc[1] * 1.5);
              b = Math.min(1, vc[2] * 1.5);
            }

            if (!isEmissive && lodLevel === 0) {
              const bk = aoBlocks[ci];
              const ao = getVertexAO(chunk, world, bk[0], bk[1], bk[2], dir, aoCorners[ci], ox, oz);
              r *= ao; g *= ao; b *= ao;
            }

            positions.push(corner[0], corner[1], corner[2]);
            colors.push(r, g, b);
          }

          const reverseWinding = dir[1] < 0 || dir[0] > 0 || dir[2] > 0;
          if (reverseWinding) {
            indices.push(vertexCount, vertexCount + 2, vertexCount + 1, vertexCount, vertexCount + 3, vertexCount + 2);
          } else {
            indices.push(vertexCount, vertexCount + 1, vertexCount + 2, vertexCount, vertexCount + 2, vertexCount + 3);
          }
          vertexCount += 4;

          for (let uu = u; uu < uEnd; uu++) {
            for (let vv = v; vv < vEnd; vv++) {
              mask[uu * vSize + vv] = 0;
            }
          }

          v = vEnd;
        }
      }
    }
  }

  return { positions, colors, indices };
}

export function buildWaterMesh(chunk, world) {
  chunk.generate();
  const positions = [];
  const colors = [];
  const indices = [];
  let vertexCount = 0;

  const ox = chunk.cx * CHUNK_SIZE;
  const oz = chunk.cz * CHUNK_SIZE;

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        const block = chunk.getBlock(x, y, z);
        if (block !== BLOCK.WATER) continue;
        const above = chunk.getBlock(x, y + 1, z);
        if (above === BLOCK.WATER) continue;

        const worldX = ox + x;
        const worldY = y + WORLD_MIN_Y;
        const worldZ = oz + z;
        const surfaceY = worldY + 0.9;

        const below = chunk.getBlock(x, y - 1, z);
        const isShallow = below === BLOCK.SAND || below === BLOCK.GRASS;
        const depthFactor = Math.min(1, (SEA_LEVEL - worldY) / 20);
        const r = 0.15 + (1 - depthFactor) * 0.15;
        const g = 0.40 + (1 - depthFactor) * 0.20;
        const b = 0.70 + (1 - depthFactor) * 0.10;
        const boost = isShallow ? 0.12 : 0;

        positions.push(worldX, surfaceY, worldZ, worldX + 1, surfaceY, worldZ, worldX + 1, surfaceY, worldZ + 1, worldX, surfaceY, worldZ + 1);
        colors.push(r + boost, g + boost, b + boost, r + boost, g + boost, b + boost, r + boost, g + boost, b + boost, r + boost, g + boost, b + boost);
        indices.push(vertexCount, vertexCount + 1, vertexCount + 2, vertexCount, vertexCount + 2, vertexCount + 3);
        vertexCount += 4;
      }
    }
  }

  return { positions, colors, indices };
}
