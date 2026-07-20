// ═══════════════════════════════════════════════════════════
// JardVoxel Engine — Voxel Terrain + Caves + Features + Gameplay
// ═══════════════════════════════════════════════════════════

// Resolved via each page's import map (all pages pin the same three.js build) —
// importing the CDN URL directly here bypassed that indirection, so this file
// would silently keep using a stale version if the project ever repins/self-hosts.
import * as THREE from 'three';
import { WorkerPool } from './jardvoxel-survival-worker-pool.js';

// ═══════════════════════════════════════════════════════════
// PRNG — Xorshift128+ (seeded, reproducible)
// ═══════════════════════════════════════════════════════════
export class PRNG {
  constructor(seed) {
    let s = seed | 0 || 1;
    this.a = s;
    this.b = s ^ 0x6D2B79F5;
    this.c = s ^ 0xB5297A4D;
    this.d = s ^ 0x4B5A3D7C;
  }
  next() {
    const t = this.a << 11;
    this.a = this.b;
    this.b = this.c;
    this.c = this.d;
    this.d = this.d ^ (this.d >>> 19) ^ (t ^ (t >>> 8));
    return (this.d >>> 0) / 4294967296;
  }
}

// ═══════════════════════════════════════════════════════════
// Perlin Noise — 2D + 3D with seeded permutation
// ═══════════════════════════════════════════════════════════
export class PerlinNoise {
  constructor(seed) {
    const prng = new PRNG(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(prng.next() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    this.perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(a, b, t) { return a + t * (b - a); }

  grad2(h, x, y) {
    const u = (h & 1) ? -x : x;
    const v = (h & 2) ? -y : y;
    return u + v;
  }

  grad3(h, x, y, z) {
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }

  noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = this.fade(x), v = this.fade(y);
    const A = this.perm[X] + Y, B = this.perm[X + 1] + Y;
    return this.lerp(
      this.lerp(this.grad2(this.perm[A], x, y), this.grad2(this.perm[B], x - 1, y), u),
      this.lerp(this.grad2(this.perm[A + 1], x, y - 1), this.grad2(this.perm[B + 1], x - 1, y - 1), u),
      v
    );
  }

  noise3D(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = this.fade(x), v = this.fade(y), w = this.fade(z);
    const A = this.perm[X] + Y, AA = this.perm[A] + Z, AB = this.perm[A + 1] + Z;
    const B = this.perm[X + 1] + Y, BA = this.perm[B] + Z, BB = this.perm[B + 1] + Z;
    return this.lerp(
      this.lerp(
        this.lerp(this.grad3(this.perm[AA], x, y, z), this.grad3(this.perm[BA], x - 1, y, z), u),
        this.lerp(this.grad3(this.perm[AB], x, y - 1, z), this.grad3(this.perm[BB], x - 1, y - 1, z), u), v),
      this.lerp(
        this.lerp(this.grad3(this.perm[AA + 1], x, y, z - 1), this.grad3(this.perm[BA + 1], x - 1, y, z - 1), u),
        this.lerp(this.grad3(this.perm[AB + 1], x, y - 1, z - 1), this.grad3(this.perm[BB + 1], x - 1, y - 1, z - 1), u), v),
      w
    );
  }

  fbm(x, y, octaves, persistence, lacunarity, scale) {
    let total = 0, freq = scale, amp = 1, maxVal = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * freq, y * freq) * amp;
      maxVal += amp; amp *= persistence; freq *= lacunarity;
    }
    return (total / maxVal + 1) * 0.5;
  }

  fbm3D(x, y, z, octaves, persistence, lacunarity, scale) {
    let total = 0, freq = scale, amp = 1, maxVal = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise3D(x * freq, y * freq, z * freq) * amp;
      maxVal += amp; amp *= persistence; freq *= lacunarity;
    }
    return total / maxVal;
  }
}

// ═══════════════════════════════════════════════════════════
// Block Types
// ═══════════════════════════════════════════════════════════
export const BLOCKS = {
  AIR: 0, STONE: 1, GRASS: 2, DIRT: 3, SAND: 4,
  WATER: 5, LAVA: 6, SNOW: 7, WOOD: 8, LEAVES: 9,
  COAL_ORE: 10, IRON_ORE: 11, GOLD_ORE: 12, DIAMOND_ORE: 13,
  BEDROCK: 14, PLANKS: 15, COBBLESTONE: 16, CACTUS: 17,
  SANDSTONE: 18, MOSSY_COBBLE: 19, PRISMARINE: 20, CLAY: 21,
  RED_SAND: 22, TERRACOTTA: 23, SNOW_BLOCK: 24, GRAVEL: 25,
  FERN: 26, DEAD_BUSH: 27, GLASS: 28, BRICKS: 29,
  ICE: 30, PACKED_ICE: 31, CALCITE: 32, COARSE_DIRT: 33,
  COPPER_ORE: 34, POWDER_SNOW: 35, GRANITE: 36, ANDESITE: 37,
  DIORITE: 38, MOSSY_STONE: 39, FLOWER_RED: 40, FLOWER_YELLOW: 41,
  TALL_GRASS: 42,
  // SPEC-028: New blocks (43-62)
  BIRCH_WOOD: 43, SPRUCE_WOOD: 44, OAK_LEAVES_DARK: 45,
  MOSS: 46, MYCELIUM: 47, OBSIDIAN: 48,
  LAPIS_ORE: 49, REDSTONE_ORE: 50, EMERALD_ORE: 51,
  NETHERRACK: 52, BASALT: 53, AMETHYST: 54,
  BOOKSHELF: 55, LANTERN: 56, TORCH: 57,
  TNT: 58, SPONGE: 59, PUMPKIN: 60,
  MELON: 61, BAMBOO: 62,
};

export const BLOCK_COLORS = {
  [BLOCKS.STONE]:       [0.55, 0.55, 0.58],
  [BLOCKS.GRASS]:       [0.40, 0.80, 0.30],
  [BLOCKS.DIRT]:        [0.60, 0.45, 0.28],
  [BLOCKS.SAND]:        [0.95, 0.88, 0.65],
  [BLOCKS.WATER]:       [0.10, 0.35, 0.65],
  [BLOCKS.LAVA]:        [0.90, 0.35, 0.05],
  [BLOCKS.SNOW]:        [0.95, 0.95, 0.98],
  [BLOCKS.WOOD]:        [0.45, 0.30, 0.15],
  [BLOCKS.LEAVES]:      [0.20, 0.55, 0.20],
  [BLOCKS.COAL_ORE]:    [0.25, 0.25, 0.25],
  [BLOCKS.IRON_ORE]:    [0.65, 0.55, 0.40],
  [BLOCKS.GOLD_ORE]:    [0.80, 0.65, 0.15],
  [BLOCKS.DIAMOND_ORE]: [0.30, 0.85, 0.85],
  [BLOCKS.BEDROCK]:     [0.20, 0.20, 0.22],
  [BLOCKS.PLANKS]:      [0.65, 0.45, 0.25],
  [BLOCKS.COBBLESTONE]: [0.45, 0.45, 0.47],
  [BLOCKS.CACTUS]:      [0.35, 0.60, 0.30],
  [BLOCKS.SANDSTONE]:   [0.92, 0.82, 0.55],
  [BLOCKS.MOSSY_COBBLE]: [0.40, 0.50, 0.35],
  [BLOCKS.PRISMARINE]:  [0.25, 0.70, 0.65],
  [BLOCKS.CLAY]:        [0.60, 0.65, 0.70],
  [BLOCKS.RED_SAND]:    [0.85, 0.50, 0.25],
  [BLOCKS.TERRACOTTA]:  [0.75, 0.50, 0.35],
  [BLOCKS.SNOW_BLOCK]:  [0.98, 0.98, 1.0],
  [BLOCKS.GRAVEL]:      [0.55, 0.52, 0.48],
  [BLOCKS.FERN]:        [0.25, 0.50, 0.20],
  [BLOCKS.DEAD_BUSH]:   [0.55, 0.40, 0.25],
  [BLOCKS.GLASS]:       [0.80, 0.90, 0.95],
  [BLOCKS.BRICKS]:      [0.60, 0.35, 0.30],
  [BLOCKS.ICE]:         [0.70, 0.88, 0.98],
  [BLOCKS.PACKED_ICE]:  [0.60, 0.82, 0.95],
  [BLOCKS.CALCITE]:     [0.92, 0.92, 0.90],
  [BLOCKS.COARSE_DIRT]: [0.50, 0.38, 0.22],
  [BLOCKS.COPPER_ORE]:  [0.72, 0.55, 0.40],
  [BLOCKS.POWDER_SNOW]: [0.88, 0.88, 0.92],
  [BLOCKS.GRANITE]:     [0.68, 0.45, 0.40],
  [BLOCKS.ANDESITE]:    [0.58, 0.58, 0.62],
  [BLOCKS.DIORITE]:     [0.82, 0.80, 0.78],
  [BLOCKS.MOSSY_STONE]: [0.40, 0.50, 0.35],
  [BLOCKS.FLOWER_RED]:  [0.90, 0.30, 0.25],
  [BLOCKS.FLOWER_YELLOW]: [0.95, 0.85, 0.25],
  [BLOCKS.TALL_GRASS]:  [0.45, 0.75, 0.35],
  // SPEC-028: New block colors
  [BLOCKS.BIRCH_WOOD]:     [0.85, 0.82, 0.68],
  [BLOCKS.SPRUCE_WOOD]:    [0.28, 0.20, 0.14],
  [BLOCKS.OAK_LEAVES_DARK]: [0.15, 0.40, 0.18],
  [BLOCKS.MOSS]:           [0.30, 0.55, 0.25],
  [BLOCKS.MYCELIUM]:       [0.60, 0.55, 0.62],
  [BLOCKS.OBSIDIAN]:       [0.08, 0.06, 0.14],
  [BLOCKS.LAPIS_ORE]:      [0.15, 0.25, 0.55],
  [BLOCKS.REDSTONE_ORE]:   [0.45, 0.10, 0.10],
  [BLOCKS.EMERALD_ORE]:    [0.10, 0.65, 0.30],
  [BLOCKS.NETHERRACK]:     [0.40, 0.12, 0.10],
  [BLOCKS.BASALT]:         [0.15, 0.15, 0.18],
  [BLOCKS.AMETHYST]:       [0.55, 0.30, 0.70],
  [BLOCKS.BOOKSHELF]:      [0.65, 0.45, 0.25],
  [BLOCKS.LANTERN]:        [0.95, 0.75, 0.25],
  [BLOCKS.TORCH]:          [0.90, 0.55, 0.15],
  [BLOCKS.TNT]:            [0.75, 0.20, 0.15],
  [BLOCKS.SPONGE]:         [0.85, 0.78, 0.30],
  [BLOCKS.PUMPKIN]:        [0.85, 0.55, 0.15],
  [BLOCKS.MELON]:          [0.55, 0.75, 0.30],
  [BLOCKS.BAMBOO]:         [0.55, 0.70, 0.25],
};

export const BLOCK_NAMES = {
  [BLOCKS.STONE]: 'Stone', [BLOCKS.GRASS]: 'Grass', [BLOCKS.DIRT]: 'Dirt',
  [BLOCKS.SAND]: 'Sand', [BLOCKS.WATER]: 'Water', [BLOCKS.LAVA]: 'Lava',
  [BLOCKS.SNOW]: 'Snow', [BLOCKS.WOOD]: 'Wood', [BLOCKS.LEAVES]: 'Leaves',
  [BLOCKS.COAL_ORE]: 'Coal Ore', [BLOCKS.IRON_ORE]: 'Iron Ore',
  [BLOCKS.GOLD_ORE]: 'Gold Ore', [BLOCKS.DIAMOND_ORE]: 'Diamond Ore',
  [BLOCKS.BEDROCK]: 'Bedrock', [BLOCKS.PLANKS]: 'Planks',
  [BLOCKS.COBBLESTONE]: 'Cobblestone', [BLOCKS.CACTUS]: 'Cactus',
  [BLOCKS.SANDSTONE]: 'Sandstone', [BLOCKS.MOSSY_COBBLE]: 'Mossy Cobblestone',
  [BLOCKS.PRISMARINE]: 'Prismarine', [BLOCKS.CLAY]: 'Clay',
  [BLOCKS.RED_SAND]: 'Red Sand', [BLOCKS.TERRACOTTA]: 'Terracotta',
  [BLOCKS.SNOW_BLOCK]: 'Snow Block', [BLOCKS.GRAVEL]: 'Gravel',
  [BLOCKS.FERN]: 'Fern', [BLOCKS.DEAD_BUSH]: 'Dead Bush',
  [BLOCKS.GLASS]: 'Glass', [BLOCKS.BRICKS]: 'Bricks',
  [BLOCKS.ICE]: 'Ice', [BLOCKS.PACKED_ICE]: 'Packed Ice',
  [BLOCKS.CALCITE]: 'Calcite', [BLOCKS.COARSE_DIRT]: 'Coarse Dirt',
  [BLOCKS.COPPER_ORE]: 'Copper Ore', [BLOCKS.POWDER_SNOW]: 'Powder Snow',
  [BLOCKS.GRANITE]: 'Granite', [BLOCKS.ANDESITE]: 'Andesite',
  [BLOCKS.DIORITE]: 'Diorite', [BLOCKS.MOSSY_STONE]: 'Mossy Stone',
  [BLOCKS.FLOWER_RED]: 'Poppy', [BLOCKS.FLOWER_YELLOW]: 'Dandelion',
  [BLOCKS.TALL_GRASS]: 'Tall Grass',
  // SPEC-028: New block names
  [BLOCKS.BIRCH_WOOD]: 'Birch Wood',
  [BLOCKS.SPRUCE_WOOD]: 'Spruce Wood',
  [BLOCKS.OAK_LEAVES_DARK]: 'Dark Oak Leaves',
  [BLOCKS.MOSS]: 'Moss', [BLOCKS.MYCELIUM]: 'Mycelium',
  [BLOCKS.OBSIDIAN]: 'Obsidian', [BLOCKS.LAPIS_ORE]: 'Lapis Ore',
  [BLOCKS.REDSTONE_ORE]: 'Redstone Ore', [BLOCKS.EMERALD_ORE]: 'Emerald Ore',
  [BLOCKS.NETHERRACK]: 'Netherrack', [BLOCKS.BASALT]: 'Basalt',
  [BLOCKS.AMETHYST]: 'Amethyst', [BLOCKS.BOOKSHELF]: 'Bookshelf',
  [BLOCKS.LANTERN]: 'Lantern', [BLOCKS.TORCH]: 'Torch',
  [BLOCKS.TNT]: 'TNT', [BLOCKS.SPONGE]: 'Sponge',
  [BLOCKS.PUMPKIN]: 'Pumpkin', [BLOCKS.MELON]: 'Melon',
  [BLOCKS.BAMBOO]: 'Bamboo',
};

// ═══════════════════════════════════════════════════════════
// World Generator — Voxel terrain + caves + biomes + ores + trees
// ═══════════════════════════════════════════════════════════
export const WATER_LEVEL = 20;
export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 64;
export const WORLD_MIN_Y = 0;
export const RENDER_DIST = 32; // SPEC-CHUNK-OPT: Max render distance (chunks) — adaptive scales down from this

// SPEC-CHUNK-OPT: View-direction-aware chunk generation priority — lower =
// generated sooner. Continuous cosine weighting (front chunks win at equal
// distance, back chunks still queue, just later) instead of a hard front/
// side/back cutoff, so a chunk directly behind the player still eventually
// loads even though the queue is only re-sorted on chunk-boundary crossing
// (see ChunkManager._fullChunkScan) rather than every frame the player turns.
function _chunkGenPriority(dx, dz, dist, cameraYaw, hasCamera, K = 1.5) {
  if (!hasCamera || dist <= 1.5) return dist;
  const chunkAngle = Math.atan2(dx, dz);
  const angleDiff = Math.abs(chunkAngle - cameraYaw);
  const wrapped = angleDiff > Math.PI ? 2 * Math.PI - angleDiff : angleDiff;
  const cosWeight = Math.cos(wrapped);
  return dist - cosWeight * K;
}

// SPEC-033: Block hardness — time in seconds to mine
export const BLOCK_HARDNESS = {
  [BLOCKS.STONE]: 1.0, [BLOCKS.COBBLESTONE]: 1.0, [BLOCKS.GRANITE]: 1.2,
  [BLOCKS.ANDESITE]: 1.1, [BLOCKS.DIORITE]: 1.1, [BLOCKS.BASALT]: 1.5,
  [BLOCKS.OBSIDIAN]: 3.0, [BLOCKS.BEDROCK]: Infinity,
  [BLOCKS.DIRT]: 0.3, [BLOCKS.GRASS]: 0.3, [BLOCKS.COARSE_DIRT]: 0.3,
  [BLOCKS.SAND]: 0.3, [BLOCKS.RED_SAND]: 0.3, [BLOCKS.GRAVEL]: 0.3,
  [BLOCKS.SANDSTONE]: 0.8, [BLOCKS.CLAY]: 0.5, [BLOCKS.TERRACOTTA]: 0.8,
  [BLOCKS.WOOD]: 0.8, [BLOCKS.PLANKS]: 0.8, [BLOCKS.BIRCH_WOOD]: 0.8,
  [BLOCKS.SPRUCE_WOOD]: 0.8, [BLOCKS.BOOKSHELF]: 0.8,
  [BLOCKS.LEAVES]: 0.2, [BLOCKS.OAK_LEAVES_DARK]: 0.2,
  [BLOCKS.COAL_ORE]: 1.5, [BLOCKS.IRON_ORE]: 1.5, [BLOCKS.GOLD_ORE]: 1.5,
  [BLOCKS.DIAMOND_ORE]: 1.8, [BLOCKS.COPPER_ORE]: 1.3,
  [BLOCKS.LAPIS_ORE]: 1.5, [BLOCKS.REDSTONE_ORE]: 1.5,
  [BLOCKS.EMERALD_ORE]: 1.8,
  [BLOCKS.SNOW]: 0.2, [BLOCKS.SNOW_BLOCK]: 0.2, [BLOCKS.POWDER_SNOW]: 0.2,
  [BLOCKS.ICE]: 0.3, [BLOCKS.PACKED_ICE]: 0.5, [BLOCKS.CALCITE]: 0.8,
  [BLOCKS.GLASS]: 0.3, [BLOCKS.BRICKS]: 1.0, [BLOCKS.MOSSY_COBBLE]: 1.0,
  [BLOCKS.MOSSY_STONE]: 1.0, [BLOCKS.PRISMARINE]: 1.2,
  [BLOCKS.NETHERRACK]: 0.5, [BLOCKS.AMETHYST]: 1.5,
  [BLOCKS.LANTERN]: 0.3, [BLOCKS.TORCH]: 0.1,
  [BLOCKS.TNT]: 0.1, [BLOCKS.SPONGE]: 0.3,
  [BLOCKS.PUMPKIN]: 0.5, [BLOCKS.MELON]: 0.5, [BLOCKS.BAMBOO]: 0.1,
  [BLOCKS.MOSS]: 0.1, [BLOCKS.MYCELIUM]: 0.3,
  [BLOCKS.CACTUS]: 0.3, [BLOCKS.FERN]: 0.1, [BLOCKS.DEAD_BUSH]: 0.1,
  [BLOCKS.FLOWER_RED]: 0.1, [BLOCKS.FLOWER_YELLOW]: 0.1,
  [BLOCKS.TALL_GRASS]: 0.1,
};

// Blocks that can be placed in the inventory
export const PLACEABLE_BLOCKS = [
  BLOCKS.GRASS, BLOCKS.DIRT, BLOCKS.STONE, BLOCKS.SAND, BLOCKS.RED_SAND,
  BLOCKS.WOOD, BLOCKS.BIRCH_WOOD, BLOCKS.SPRUCE_WOOD, BLOCKS.PLANKS,
  BLOCKS.COBBLESTONE, BLOCKS.MOSSY_COBBLE, BLOCKS.MOSSY_STONE,
  BLOCKS.GLASS, BLOCKS.BRICKS, BLOCKS.SANDSTONE, BLOCKS.PRISMARINE,
  BLOCKS.LEAVES, BLOCKS.OAK_LEAVES_DARK, BLOCKS.GRAVEL, BLOCKS.CLAY,
  BLOCKS.SNOW_BLOCK, BLOCKS.ICE, BLOCKS.PACKED_ICE, BLOCKS.CALCITE,
  BLOCKS.GRANITE, BLOCKS.ANDESITE, BLOCKS.DIORITE, BLOCKS.BASALT,
  BLOCKS.OBSIDIAN, BLOCKS.TERRACOTTA, BLOCKS.TORCH, BLOCKS.LANTERN,
  BLOCKS.TNT, BLOCKS.SPONGE, BLOCKS.PUMPKIN, BLOCKS.MELON,
  BLOCKS.BOOKSHELF, BLOCKS.BAMBOO, BLOCKS.MOSS, BLOCKS.MYCELIUM,
  BLOCKS.COAL_ORE, BLOCKS.IRON_ORE, BLOCKS.GOLD_ORE, BLOCKS.DIAMOND_ORE,
  BLOCKS.COPPER_ORE, BLOCKS.LAPIS_ORE, BLOCKS.REDSTONE_ORE, BLOCKS.EMERALD_ORE,
  BLOCKS.AMETHYST, BLOCKS.NETHERRACK, BLOCKS.CACTUS,
  BLOCKS.FERN, BLOCKS.FLOWER_RED, BLOCKS.FLOWER_YELLOW, BLOCKS.TALL_GRASS,
];

export const BIOME_NAMES = {
  ocean: 'Ocean', beach: 'Beach', plains: 'Plains', forest: 'Forest',
  desert: 'Desert', jungle: 'Jungle', tundra: 'Tundra',
  mountain: 'Mountain', snow: 'Snowy Peaks', swamp: 'Swamp',
  savanna: 'Savanna', taiga: 'Taiga', badlands: 'Badlands',
  river: 'River', mangrove: 'Mangrove', frozen_ocean: 'Frozen Ocean',
};

export class WorldGenerator {
  constructor(seed) {
    this.seed = seed;
    this.heightNoise = new PerlinNoise(seed);
    this.detailNoise = new PerlinNoise(seed + 100);
    this.tempNoise = new PerlinNoise(seed + 200);
    this.humidNoise = new PerlinNoise(seed + 300);
    this.continentalNoise = new PerlinNoise(seed + 400);
    this.erosionNoise = new PerlinNoise(seed + 500);
    this.caveNoise = new PerlinNoise(seed + 600);
    this.caveNoise2 = new PerlinNoise(seed + 700);
    this.oreNoise = new PerlinNoise(seed + 800);
    this.treeRng = new PRNG(seed + 900);
    this.riverNoise = new PerlinNoise(seed + 1000);
    this.ravineNoise = new PerlinNoise(seed + 1100);
    this.structRng = new PRNG(seed + 1200);
    // 3D density noise for overhangs
    this.densityNoise = new PerlinNoise(seed + 1300);
    // Noodle cave noise
    this.noodleNoise = new PerlinNoise(seed + 1400);
    this.noodleNoise2 = new PerlinNoise(seed + 1401);
    // Aquifer noise (barrier + fluid level)
    this.aquiferNoise = new PerlinNoise(seed + 1500);
    this.aquiferBarrier = new PerlinNoise(seed + 1501);
    // Carver noise (branching caves)
    this.carverNoise = new PerlinNoise(seed + 1600);
    this.carverNoise2 = new PerlinNoise(seed + 1601);
    // Ore vein noises (toggle, ridge, gap)
    this.oreToggleNoise = new PerlinNoise(seed + 1700);
    this.oreRidgeNoise = new PerlinNoise(seed + 1701);
    this.oreGapNoise = new PerlinNoise(seed + 1702);
    // Lava lake + spring noise
    this.lavaLakeNoise = new PerlinNoise(seed + 1800);
    this.springNoise = new PerlinNoise(seed + 1801);
    // Freeze noise (ice on water)
    this.freezeNoise = new PerlinNoise(seed + 1900);
    // Stone variant noise (granite/andesite/diorite)
    this.stoneVarNoise = new PerlinNoise(seed + 2000);
    // Vegetation noise (flowers, tall grass)
    this.vegNoise = new PRNG(seed + 2100);

    this.heightCache = new Map();
    this.cacheSize = 50000;
  }

  _cacheKey(x, z) { return `${Math.floor(x)},${Math.floor(z)}`; }

  getHeight(x, z) {
    const key = this._cacheKey(x, z);
    if (this.heightCache.has(key)) return this.heightCache.get(key);

    const ox = x + 10000, oz = z + 10000;
    const cont = this.continentalNoise.fbm(ox, oz, 4, 0.5, 2.0, 0.0008);
    const base = this.heightNoise.fbm(ox, oz, 5, 0.5, 2.0, 0.005);
    const erosion = this.erosionNoise.fbm(ox, oz, 4, 0.5, 2.0, 0.002);
    const detail = this.detailNoise.fbm(ox, oz, 3, 0.3, 2.5, 0.02);

    // River noise — low freq, creates winding rivers
    const river = this.riverNoise.fbm(ox, oz, 2, 0.5, 2.0, 0.002);
    const riverVal = Math.abs(river - 0.5);
    const isRiver = riverVal < 0.02;

    let h;
    if (cont < 0.38) {
      h = WATER_LEVEL - 3 + (cont - 0.38) * 60;
    } else {
      const landBase = (cont - 0.38) * 80;
      h = landBase + WATER_LEVEL;
      h += (base - 0.5) * 20;
      h += (erosion - 0.5) * 15;
      h += (detail - 0.5) * 4;
      if (cont > 0.6) {
        const mf = (cont - 0.6) * 3;
        h += mf * mf * 120;
      }
      h = Math.max(h, WATER_LEVEL + 1);

      // Rivers carve through terrain at sea level
      if (isRiver && h > WATER_LEVEL - 2) {
        h = WATER_LEVEL - 1;
      }
    }
    h = Math.floor(h);
    h = Math.max(1, Math.min(h, CHUNK_HEIGHT - 5));

    if (this.heightCache.size > this.cacheSize) {
      const firstKey = this.heightCache.keys().next().value;
      this.heightCache.delete(firstKey);
    }
    this.heightCache.set(key, h);
    return h;
  }

  getBiome(x, z, height) {
    const ox = x + 10000, oz = z + 10000;
    const temp = this.tempNoise.fbm(ox, oz, 3, 0.5, 2.0, 0.003);
    const humid = this.humidNoise.fbm(ox, oz, 3, 0.5, 2.0, 0.003);
    const river = this.riverNoise.fbm(ox, oz, 2, 0.5, 2.0, 0.002);
    const isRiver = Math.abs(river - 0.5) < 0.02;

    if (height < WATER_LEVEL - 2) {
      if (temp < 0.25) return 'frozen_ocean';
      return 'ocean';
    }
    if (isRiver && height <= WATER_LEVEL) return 'river';
    if (height < WATER_LEVEL + 2) return 'beach';

    if (height > 50) return 'snow';
    if (height > 38) return 'mountain';
    if (temp < 0.2) return 'tundra';
    if (temp < 0.35 && humid > 0.4) return 'taiga';
    const cont = this.continentalNoise.fbm(ox, oz, 2, 0.5, 2.0, 0.0008);
    if (temp > 0.7 && humid < 0.2) {
      if (cont > 0.5) return 'badlands';
      return 'desert';
    }
    if (temp > 0.65 && humid < 0.35) return 'savanna';
    if (temp > 0.55 && humid > 0.6) return 'jungle';
    if (humid > 0.7 && height <= WATER_LEVEL + 3) return 'mangrove';
    if (humid > 0.55 && height < WATER_LEVEL + 8) return 'swamp';
    if (humid > 0.5) return 'forest';
    return 'plains';
  }

  // Check if a block position is a cave (air underground)
  isCave(x, y, z) {
    if (y < 3 || y > CHUNK_HEIGHT - 10) return false;
    const n1 = this.caveNoise.fbm3D(x, y, z, 2, 0.5, 2.0, 0.05);
    const n2 = this.caveNoise2.fbm3D(x, y, z, 2, 0.5, 2.0, 0.08);
    // Spaghetti caves: two noise fields close to zero create tunnels
    if (Math.abs(n1) < 0.08 && Math.abs(n2) < 0.08) return true;
    // Cheese caves: large chambers
    const cheese = this.caveNoise.fbm3D(x, y * 0.5, z, 3, 0.5, 2.0, 0.03);
    if (cheese > 0.55) return true;
    // Noodle caves: thinner, squigglier tunnels using two offset noises
    const noodle1 = this.noodleNoise.fbm3D(x, y * 1.5, z, 2, 0.5, 2.0, 0.06);
    const noodle2 = this.noodleNoise2.fbm3D(x * 1.3, y * 1.5, z * 1.3, 2, 0.5, 2.0, 0.06);
    if (Math.abs(noodle1) < 0.05 && Math.abs(noodle2) < 0.05) return true;
    return false;
  }

  // Check if a block is in a ravine (vertical cuts)
  isRavine(x, y, z, height) {
    if (y < 2 || y > height - 1) return false;
    const n = this.ravineNoise.fbm3D(x, y * 2, z, 3, 0.5, 2.0, 0.02);
    // Ravines are tall narrow cuts — noise close to 0 in a vertical strip
    const horiz = this.ravineNoise.noise2D(x * 0.02, z * 0.02);
    if (Math.abs(horiz - 0.5) < 0.03 && n > -0.1 && n < 0.15) return true;
    return false;
  }

  // 3D density check for overhangs in mountainous biomes
  isOverhangSolid(x, y, z, height, biome) {
    if (biome !== 'mountain' && biome !== 'snow' && biome !== 'badlands') return false;
    if (y <= height || y > height + 18) return false;
    const n = this.densityNoise.fbm3D(x, y, z, 3, 0.5, 2.0, 0.015);
    // Bias: less likely to be solid the higher above heightmap
    const heightBias = (y - height) / 18;
    return n > 0.12 + heightBias * 0.35;
  }

  // Carver caves — branching tunnel systems with main chamber
  isCarver(x, y, z, height) {
    if (y < 4 || y > height - 2 || y > CHUNK_HEIGHT - 12) return false;
    // Main tunnel: winding horizontal tunnel with vertical variation
    const main = this.carverNoise.fbm3D(x, y * 0.7, z, 3, 0.5, 2.0, 0.015);
    if (Math.abs(main) < 0.04) return true;
    // Branch tunnel: thinner, different direction
    const branch = this.carverNoise2.fbm3D(x * 1.5, y * 1.2, z * 1.5, 2, 0.5, 2.0, 0.025);
    if (Math.abs(branch) < 0.03) return true;
    return false;
  }

  // Aquifer system — determines fluid in underground cavities
  // Returns: BLOCKS.WATER, BLOCKS.LAVA, or BLOCKS.AIR
  getAquiferFluid(x, y, z, surfaceHeight) {
    // Barrier noise: separates fluid cells from air cells
    const barrier = this.aquiferBarrier.noise3D(x * 0.04, y * 0.06, z * 0.04);
    if (barrier > 0.3) return BLOCKS.AIR; // Barrier = always air

    // Local fluid level: varies by position in 16-block cells
    const cellX = Math.floor(x / 16), cellZ = Math.floor(z / 16);
    const fluidLevelNoise = this.aquiferNoise.noise2D(cellX * 0.5, cellZ * 0.5);
    // Local fluid level ranges from WATER_LEVEL-8 to WATER_LEVEL+4
    const localFluidLevel = Math.floor(WATER_LEVEL - 8 + fluidLevelNoise * 12);

    if (y > localFluidLevel) return BLOCKS.AIR;
    // Lava below Y=8, water above
    if (y <= 8) return BLOCKS.LAVA;
    return BLOCKS.WATER;
  }

  // Ore vein generation using toggle/ridge/gap noise system
  getOreAt(x, y, z) {
    if (y < 1 || y > 52) return 0;

    // Vein system: toggle determines ore type, ridge skips, gap controls density
    const toggle = this.oreToggleNoise.noise3D(x * 0.08, y * 0.08, z * 0.08);
    const ridge = this.oreRidgeNoise.noise3D(x * 0.06, y * 0.06, z * 0.06);
    const gap = this.oreGapNoise.noise3D(x * 0.12, y * 0.12, z * 0.12);

    // Skip if ridge says no vein here
    if (ridge > 0.2) return 0;

    // Gap controls ore-to-filler ratio (10-30% of vein blocks are ore)
    if (gap < 0.55) return 0;

    // Toggle selects ore type by depth
    if (y <= 14) {
      // Deep: diamond + gold + lapis + redstone
      if (toggle < -0.4) return BLOCKS.DIAMOND_ORE;
      if (toggle < -0.2) return BLOCKS.LAPIS_ORE;
      if (toggle < 0.0) return BLOCKS.REDSTONE_ORE;
      if (toggle < 0.3) return BLOCKS.GOLD_ORE;
      return BLOCKS.IRON_ORE;
    }
    if (y <= 30) {
      // Mid: gold + iron + copper + coal + redstone
      if (toggle < -0.3) return BLOCKS.GOLD_ORE;
      if (toggle < -0.1) return BLOCKS.REDSTONE_ORE;
      if (toggle < 0.15) return BLOCKS.IRON_ORE;
      if (toggle < 0.4) return BLOCKS.COPPER_ORE;
      return BLOCKS.COAL_ORE;
    }
    // Shallow: iron + coal + copper + lapis
    if (toggle < -0.2) return BLOCKS.LAPIS_ORE;
    if (toggle < 0.1) return BLOCKS.IRON_ORE;
    if (toggle < 0.35) return BLOCKS.COPPER_ORE;
    return BLOCKS.COAL_ORE;
  }

  // Stone variant: granite, andesite, diorite underground
  getStoneVariant(x, y, z) {
    const n = this.stoneVarNoise.noise3D(x * 0.02, y * 0.01, z * 0.02);
    if (n > 0.5) return BLOCKS.GRANITE;
    if (n < -0.5) return BLOCKS.DIORITE;
    if (n > 0.2 && n < 0.4) return BLOCKS.ANDESITE;
    return 0;
  }

  // Lava lake at surface (rare, in low areas)
  isLavaLake(x, z, height) {
    if (height > 10) return false;
    const n = this.lavaLakeNoise.noise2D(x * 0.01, z * 0.01);
    return n > 0.7;
  }

  // Fluid spring (water or lava seeping from walls)
  isSpring(x, y, z) {
    if (y < 2 || y > CHUNK_HEIGHT - 5) return 0;
    const n = this.springNoise.noise3D(x * 0.1, y * 0.1, z * 0.1);
    if (n > 0.82) return y <= 10 ? BLOCKS.LAVA : BLOCKS.WATER;
    return 0;
  }

  // Freeze top layer — ice on water in cold biomes
  isFrozenTop(x, z, biome) {
    if (biome !== 'frozen_ocean' && biome !== 'tundra' && biome !== 'snow') return false;
    const n = this.freezeNoise.noise2D(x * 0.03, z * 0.03);
    return n > -0.2;
  }

  // Get block type at world position
  getBlock(x, y, z) {
    if (y < 0 || y >= CHUNK_HEIGHT) return BLOCKS.AIR;
    if (y === 0) return BLOCKS.BEDROCK;

    const height = this.getHeight(x, z);
    const biome = this.getBiome(x, z, height);

    // 3D overhang — solid blocks above heightmap in mountainous biomes
    if (y > height && this.isOverhangSolid(x, y, z, height, biome)) {
      // Top of overhang gets surface coating
      const aboveSolid = this.isOverhangSolid(x, y + 1, z, height, biome);
      if (!aboveSolid) {
        if (biome === 'snow') return BLOCKS.SNOW_BLOCK;
        if (biome === 'badlands') return BLOCKS.RED_SAND;
        return BLOCKS.STONE;
      }
      return BLOCKS.STONE;
    }

    // Above terrain
    if (y > height) {
      if (y <= WATER_LEVEL) {
        // Freeze top layer — ice on water surface in cold biomes
        if (y === WATER_LEVEL && this.isFrozenTop(x, z, biome)) return BLOCKS.ICE;
        if (biome === 'frozen_ocean' && y === WATER_LEVEL) return BLOCKS.SNOW_BLOCK;
        return BLOCKS.WATER;
      }
      // Snow layer on top of blocks in cold biomes
      if (y === height + 1 && (biome === 'tundra' || biome === 'taiga' || biome === 'snow') && this._hasSnowAt(x, z)) {
        return BLOCKS.SNOW;
      }
      return BLOCKS.AIR;
    }

    // Check caves (spaghetti + cheese + noodle)
    if (y < height - 1 && y > 2 && this.isCave(x, y, z)) {
      const fluid = this.getAquiferFluid(x, y, z, height);
      if (fluid !== BLOCKS.AIR) return fluid;
      if (y <= WATER_LEVEL && height <= WATER_LEVEL) return BLOCKS.WATER;
      return BLOCKS.AIR;
    }

    // Check carver caves (branching tunnels)
    if (y < height - 1 && y > 3 && this.isCarver(x, y, z, height)) {
      const fluid = this.getAquiferFluid(x, y, z, height);
      if (fluid !== BLOCKS.AIR) return fluid;
      if (y <= WATER_LEVEL) return BLOCKS.WATER;
      return BLOCKS.AIR;
    }

    // Check ravines
    if (y < height - 1 && y > 2 && this.isRavine(x, y, z, height)) {
      const fluid = this.getAquiferFluid(x, y, z, height);
      if (fluid !== BLOCKS.AIR) return fluid;
      if (y <= WATER_LEVEL) return BLOCKS.WATER;
      return BLOCKS.AIR;
    }

    // Fluid springs (water/lava seeping from cave walls)
    const spring = this.isSpring(x, y, z);
    if (spring && y < height - 1) return spring;

    // Surface block — detailed surface rules per biome
    if (y === height) {
      // Lava lakes in very low areas
      if (this.isLavaLake(x, z, height)) return BLOCKS.LAVA;
      if (biome === 'desert' || biome === 'beach') return BLOCKS.SAND;
      if (biome === 'badlands') return BLOCKS.RED_SAND;
      if (biome === 'snow') return BLOCKS.SNOW_BLOCK;
      if (biome === 'tundra') return BLOCKS.SNOW;
      if (biome === 'taiga') return BLOCKS.GRASS;
      if (biome === 'river') return BLOCKS.SAND;
      if (biome === 'mangrove') return BLOCKS.DIRT;
      if (biome === 'frozen_ocean') return BLOCKS.PACKED_ICE;
      // SPEC-028: Mycelium in swamps
      if (biome === 'swamp') {
        const mycelN = this.stoneVarNoise.noise2D(x * 0.05, z * 0.05);
        if (mycelN > 0.3) return BLOCKS.MYCELIUM;
      }
      if (height <= WATER_LEVEL + 1) return BLOCKS.SAND;
      // Stony peaks for very high mountains
      if (height > 55) return BLOCKS.CALCITE;
      return BLOCKS.GRASS;
    }

    // Subsurface (3 blocks below surface)
    if (y >= height - 3) {
      if (biome === 'desert' || biome === 'beach') return BLOCKS.SAND;
      if (biome === 'badlands') return BLOCKS.RED_SAND;
      if (biome === 'mangrove') return BLOCKS.DIRT;
      if (biome === 'snow' && y >= height - 1) return BLOCKS.PACKED_ICE;
      return BLOCKS.DIRT;
    }

    // Deeper subsurface (5 blocks below surface)
    if (y >= height - 5) {
      if (biome === 'desert' || biome === 'beach') return BLOCKS.SANDSTONE;
      if (biome === 'badlands') return BLOCKS.TERRACOTTA;
      if (biome === 'snow') return BLOCKS.STONE;
    }

    // Ocean floor — clay and gravel
    if (height < WATER_LEVEL && y < WATER_LEVEL - 2) {
      const clayN = this.oreNoise.noise2D(x * 0.05, z * 0.05);
      if (clayN > 0.6) return BLOCKS.CLAY;
      if (clayN < -0.5) return BLOCKS.GRAVEL;
    }

    // Deep underground — stone variants (granite/andesite/diorite)
    const stoneVar = this.getStoneVariant(x, y, z);
    if (stoneVar) return stoneVar;

    // SPEC-028: Basalt in very deep caves
    if (y <= 5) {
      const basaltN = this.stoneVarNoise.noise3D(x * 0.05, y * 0.1, z * 0.05);
      if (basaltN > 0.4) return BLOCKS.BASALT;
    }

    // SPEC-028: Obsidian near lava (y <= 12)
    if (y <= 12) {
      const obsN = this.lavaLakeNoise.noise3D(x * 0.08, y * 0.08, z * 0.08);
      if (obsN > 0.75) return BLOCKS.OBSIDIAN;
    }

    // SPEC-028: Emerald ore in mountains (rare)
    if (height > 38 && y > 20 && y < 45) {
      const emeraldN = this.oreToggleNoise.noise3D(x * 0.15, y * 0.15, z * 0.15);
      if (emeraldN > 0.85) return BLOCKS.EMERALD_ORE;
    }

    // Deep underground — check for ore veins
    const ore = this.getOreAt(x, y, z);
    if (ore) return ore;

    return BLOCKS.STONE;
  }

  _hasSnowAt(x, z) {
    const h = ((x * 2654435761) ^ (z * 40503) ^ (this.seed * 31)) & 0x7fffffff;
    return (h / 0x7fffffff) < 0.7;
  }

  // Tree placement check
  hasTreeAt(x, z) {
    const height = this.getHeight(x, z);
    const biome = this.getBiome(x, z, height);
    if (height <= WATER_LEVEL + 1) return false;
    if (biome === 'desert' || biome === 'beach' || biome === 'ocean' || biome === 'river') return false;
    if (biome === 'badlands' || biome === 'savanna') return false;
    if (biome === 'snow' || biome === 'mountain') return false;
    // Use deterministic hash for tree placement
    const h = ((x * 73856093) ^ (z * 19349663) ^ this.seed) & 0x7fffffff;
    const density = biome === 'jungle' ? 0.12 : biome === 'forest' ? 0.08 : biome === 'taiga' ? 0.06 : biome === 'swamp' ? 0.04 : biome === 'mangrove' ? 0.07 : 0.02;
    return (h / 0x7fffffff) < density;
  }

  // Cactus placement for deserts
  hasCactusAt(x, z) {
    const height = this.getHeight(x, z);
    const biome = this.getBiome(x, z, height);
    if (biome !== 'desert' && biome !== 'badlands') return false;
    if (height <= WATER_LEVEL + 1) return false;
    const h = ((x * 73856093) ^ (z * 19349663) ^ (this.seed ^ 0xABCDEF)) & 0x7fffffff;
    return (h / 0x7fffffff) < 0.03;
  }

  // Dead bush for badlands/desert
  hasDeadBushAt(x, z) {
    const height = this.getHeight(x, z);
    const biome = this.getBiome(x, z, height);
    if (biome !== 'desert' && biome !== 'badlands' && biome !== 'savanna') return false;
    const h = ((x * 73856093) ^ (z * 19349663) ^ (this.seed ^ 0x123456)) & 0x7fffffff;
    return (h / 0x7fffffff) < 0.04;
  }

  // Structure placement — villages, mines, temples + SPEC-031 new types
  getStructureAt(cx, cz) {
    const h = ((cx * 73856093) ^ (cz * 19349663) ^ (this.seed ^ 0xDEADBEEF)) & 0x7fffffff;
    const r = h / 0x7fffffff;
    // ~2% chance for a structure per chunk (increased for more variety)
    if (r > 0.02) return null;
    const wx = cx * CHUNK_SIZE + CHUNK_SIZE / 2;
    const wz = cz * CHUNK_SIZE + CHUNK_SIZE / 2;
    const height = this.getHeight(wx, wz);
    const biome = this.getBiome(wx, wz, height);
    // Major structures (~1%)
    if (r < 0.01) {
      if (biome === 'desert' || biome === 'badlands') return 'temple';
      if (biome === 'ocean' || biome === 'frozen_ocean') return 'monument';
      if (biome === 'jungle') return 'jungle_temple';
      if (height > 15 && height < 45) return 'village';
      if (height < 20) return 'mineshaft';
      return 'village';
    }
    // Minor structures (~1%)
    if (biome === 'ocean') return r < 0.015 ? 'shipwreck' : 'coral_reef';
    if (biome === 'frozen_ocean') return 'ice_spike';
    if (biome === 'tundra' || biome === 'snow') return r < 0.015 ? 'igloo' : 'ice_spike';
    if (biome === 'desert') return 'desert_well';
    if (biome === 'mountain') return 'boulder';
    if (biome === 'swamp') return 'swamp_hut';
    if (biome === 'forest') return 'forest_rock';
    return 'ruined_portal';
  }

  // Vegetation placement — flowers, tall grass, ferns
  getVegetationAt(x, z) {
    const height = this.getHeight(x, z);
    const biome = this.getBiome(x, z, height);
    if (height <= WATER_LEVEL + 1) return 0;
    if (biome === 'desert' || biome === 'beach' || biome === 'ocean' || biome === 'river') return 0;
    if (biome === 'badlands' || biome === 'snow' || biome === 'mountain') return 0;
    if (biome === 'frozen_ocean') return 0;

    const h = ((x * 73856093) ^ (z * 19349663) ^ (this.seed ^ 0xBEEF42)) & 0x7fffffff;
    const r = h / 0x7fffffff;

    // Tall grass in plains, forest, savanna
    if (biome === 'plains' || biome === 'forest' || biome === 'savanna') {
      if (r < 0.08) return BLOCKS.TALL_GRASS;
      if (r < 0.10) return BLOCKS.FLOWER_RED;
      if (r < 0.12) return BLOCKS.FLOWER_YELLOW;
    }
    // Ferns in jungle, taiga, swamp
    if (biome === 'jungle' || biome === 'taiga' || biome === 'swamp' || biome === 'mangrove') {
      if (r < 0.06) return BLOCKS.FERN;
      if (r < 0.08) return BLOCKS.TALL_GRASS;
    }
    return 0;
  }

  clearCache() { this.heightCache.clear(); }
}

// ═══════════════════════════════════════════════════════════
// Voxel Chunk — 16x64x16 blocks with greedy meshing
// ═══════════════════════════════════════════════════════════
export class VoxelChunk {
  // SPEC-PERF-004: Object pool — reuse chunks to avoid 64KB Uint8Array allocations
  static _pool = [];
  static _poolMax = 32;

  static acquire(cx, cz, world) {
    const chunk = VoxelChunk._pool.pop();
    if (chunk) {
      chunk.cx = cx;
      chunk.cz = cz;
      chunk.world = world;
      chunk.generated = false;
      chunk.modified.clear();
      chunk.blocks.fill(0);
      chunk.minContentY = undefined;
      chunk.maxContentY = undefined;
      return chunk;
    }
    return new VoxelChunk(cx, cz, world);
  }

  static release(chunk) {
    if (VoxelChunk._pool.length < VoxelChunk._poolMax) {
      chunk.world = null;
      VoxelChunk._pool.push(chunk);
    }
  }

  constructor(cx, cz, world) {
    this.cx = cx;
    this.cz = cz;
    this.world = world;
    this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
    this.generated = false;
    this.modified = new Map(); // Track player modifications
  }

  _idx(x, y, z) { return x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE; }

  generate() {
    if (this.generated) return;
    const ox = this.cx * CHUNK_SIZE;
    const oz = this.cz * CHUNK_SIZE;

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const wx = ox + x, wz = oz + z;
        const height = this.world.getHeight(wx, wz);
        const biome = this.world.getBiome(wx, wz, height);

        // Extend y range for mountainous biomes to capture overhangs
        const maxY = (biome === 'mountain' || biome === 'snow' || biome === 'badlands')
          ? Math.min(height + 20, CHUNK_HEIGHT - 1)
          : Math.min(height + 1, CHUNK_HEIGHT - 1);

        for (let y = 0; y <= maxY; y++) {
          this.blocks[this._idx(x, y, z)] = this.world.getBlock(wx, y, wz);
        }
      }
    }

    // Generate trees
    for (let x = 2; x < CHUNK_SIZE - 2; x++) {
      for (let z = 2; z < CHUNK_SIZE - 2; z++) {
        const wx = ox + x, wz = oz + z;
        if (this.world.hasTreeAt(wx, wz)) {
          this._placeTree(x, this.world.getHeight(wx, wz) + 1, z);
        }
      }
    }

    // Generate cacti
    for (let x = 1; x < CHUNK_SIZE - 1; x++) {
      for (let z = 1; z < CHUNK_SIZE - 1; z++) {
        const wx = ox + x, wz = oz + z;
        if (this.world.hasCactusAt(wx, wz)) {
          this._placeCactus(x, this.world.getHeight(wx, wz) + 1, z);
        }
        if (this.world.hasDeadBushAt(wx, wz)) {
          const h = this.world.getHeight(wx, wz);
          const idx = this._idx(x, h + 1, z);
          if (this.blocks[idx] === BLOCKS.AIR) this.blocks[idx] = BLOCKS.DEAD_BUSH;
        }
      }
    }

    // Generate vegetation (flowers, tall grass, ferns)
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const wx = ox + x, wz = oz + z;
        const veg = this.world.getVegetationAt(wx, wz);
        if (veg) {
          const h = this.world.getHeight(wx, wz);
          const idx = this._idx(x, h + 1, z);
          if (this.blocks[idx] === BLOCKS.AIR) this.blocks[idx] = veg;
        }
      }
    }

    // Generate structures
    const structure = this.world.getStructureAt(this.cx, this.cz);
    if (structure) {
      this._placeStructure(structure, ox, oz);
    }

    // SPEC-PERF-001: Apply player modifications — numeric keys, no string parsing
    for (const [idx, block] of this.modified) {
      this.blocks[idx] = block;
    }

    this.generated = true;
  }

  _placeCactus(x, y, z) {
    const cactusHeight = 1 + Math.floor(this.world.treeRng.next() * 3);
    for (let i = 0; i < cactusHeight; i++) {
      if (y + i < CHUNK_HEIGHT) {
        this.blocks[this._idx(x, y + i, z)] = BLOCKS.CACTUS;
      }
    }
  }

  _placeStructure(type, ox, oz) {
    this._forcePlace = true;
    const centerX = Math.floor(CHUNK_SIZE / 2);
    const centerZ = Math.floor(CHUNK_SIZE / 2);
    const wx = ox + centerX, wz = oz + centerZ;
    const groundHeight = this.world.getHeight(wx, wz);

    if (type === 'village') {
      this._placeVillage(centerX, centerZ, groundHeight, ox, oz);
    } else if (type === 'temple') {
      this._placeTemple(centerX, centerZ, groundHeight);
    } else if (type === 'mineshaft') {
      this._placeMineshaft(centerX, centerZ, groundHeight);
    } else if (type === 'monument') {
      this._placeMonument(centerX, centerZ, groundHeight);
    } else if (type === 'jungle_temple') {
      this._placeJungleTemple(centerX, centerZ, groundHeight);
    } else if (type === 'shipwreck') {
      this._placeShipwreck(centerX, centerZ, groundHeight);
    } else if (type === 'igloo') {
      this._placeIgloo(centerX, centerZ, groundHeight);
    } else if (type === 'desert_well') {
      this._placeDesertWell(centerX, centerZ, groundHeight);
    } else if (type === 'ice_spike') {
      this._placeIceSpike(centerX, centerZ, groundHeight);
    } else if (type === 'boulder') {
      this._placeBoulder(centerX, centerZ, groundHeight);
    } else if (type === 'swamp_hut') {
      this._placeSwampHut(centerX, centerZ, groundHeight);
    } else if (type === 'ruined_portal') {
      this._placeRuinedPortal(centerX, centerZ, groundHeight);
    } else if (type === 'coral_reef') {
      this._placeCoralReef(centerX, centerZ, groundHeight);
    } else if (type === 'forest_rock') {
      this._placeForestRock(centerX, centerZ, groundHeight);
    }
    this._forcePlace = false;
  }

  _placeVillage(cx, cz, groundY, ox, oz) {
    // Place 3-4 houses with variety
    const houseCount = 3 + Math.floor(this.world.structRng.next() * 2);
    const housePositions = [];
    for (let i = 0; i < houseCount; i++) {
      const hx = cx + Math.floor((this.world.structRng.next() - 0.5) * 8);
      const hz = cz + Math.floor((this.world.structRng.next() - 0.5) * 8);
      const hw = 3 + Math.floor(this.world.structRng.next() * 3);
      const hd = 3 + Math.floor(this.world.structRng.next() * 3);
      const wx = ox + hx, wz = oz + hz;
      const hGround = this.world.getHeight(wx, wz);
      if (hGround <= WATER_LEVEL) continue;
      const houseType = this.world.structRng.next();
      if (houseType < 0.4) {
        this._placeHouseSmall(hx, hz, hGround, hw, hd);
      } else {
        this._placeHouseLarge(hx, hz, hGround, hw, hd);
      }
      housePositions.push({ x: hx, z: hz, w: hw, d: hd, ground: hGround });
    }
    // Place well at center
    this._placeWell(cx, cz, groundY);
    // Place lamp posts near houses
    for (const hp of housePositions) {
      this._placeLampPost(hp.x - 1, hp.z - 1, hp.ground);
    }
    // Place gravel paths between houses and well
    for (const hp of housePositions) {
      this._placePath(hp.x, hp.z, cx, cz, hp.ground, groundY);
    }
  }

  _placeHouseSmall(x, z, groundY, w, d) {
    const h = 3;
    // Cobblestone floor
    for (let dx = 0; dx < w; dx++) {
      for (let dz = 0; dz < d; dz++) {
        this._setBlockSafe(x + dx, groundY, z + dz, BLOCKS.COBBLESTONE);
      }
    }
    // Walls with door + window
    for (let dy = 1; dy <= h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        for (let dz = 0; dz < d; dz++) {
          if (dx === 0 || dx === w - 1 || dz === 0 || dz === d - 1) {
            // Door gap
            if (dy <= 2 && dx === Math.floor(w / 2) && dz === 0) continue;
            // Window
            if (dy === 2 && dx === Math.floor(w / 2) && dz === d - 1) {
              this._setBlockSafe(x + dx, groundY + dy, z + dz, BLOCKS.GLASS);
              continue;
            }
            this._setBlockSafe(x + dx, groundY + dy, z + dz, BLOCKS.PLANKS);
          }
        }
      }
    }
    // Roof — flat wood
    for (let dx = -1; dx <= w; dx++) {
      for (let dz = -1; dz <= d; dz++) {
        this._setBlockSafe(x + dx, groundY + h + 1, z + dz, BLOCKS.WOOD);
      }
    }
  }

  _placeHouseLarge(x, z, groundY, w, d) {
    const h = 4;
    // Stone floor
    for (let dx = 0; dx < w; dx++) {
      for (let dz = 0; dz < d; dz++) {
        this._setBlockSafe(x + dx, groundY, z + dz, BLOCKS.STONE);
      }
    }
    // Walls with door + 2 windows
    for (let dy = 1; dy <= h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        for (let dz = 0; dz < d; dz++) {
          if (dx === 0 || dx === w - 1 || dz === 0 || dz === d - 1) {
            // Door gap
            if (dy <= 2 && dx === Math.floor(w / 2) && dz === 0) continue;
            // Windows on side walls
            if (dy === 2 && (dx === 1 || dx === w - 2) && dz === d - 1) {
              this._setBlockSafe(x + dx, groundY + dy, z + dz, BLOCKS.GLASS);
              continue;
            }
            this._setBlockSafe(x + dx, groundY + dy, z + dz, BLOCKS.PLANKS);
          }
        }
      }
    }
    // Chimney
    this._setBlockSafe(x + w - 1, groundY + h + 1, z + d - 1, BLOCKS.COBBLESTONE);
    this._setBlockSafe(x + w - 1, groundY + h + 2, z + d - 1, BLOCKS.COBBLESTONE);
    // Roof — gabled (peaked)
    for (let dx = -1; dx <= w; dx++) {
      for (let dz = -1; dz <= d; dz++) {
        this._setBlockSafe(x + dx, groundY + h + 1, z + dz, BLOCKS.WOOD);
      }
    }
    // Peak row
    for (let dz = -1; dz <= d; dz++) {
      this._setBlockSafe(x + Math.floor(w / 2), groundY + h + 2, z + dz, BLOCKS.WOOD);
    }
  }

  _placeWell(cx, cz, groundY) {
    // 3x3 well with water in center
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dz === 0) {
          this._setBlockSafe(cx + dx, groundY, cz + dz, BLOCKS.WATER);
        } else {
          this._setBlockSafe(cx + dx, groundY, cz + dz, BLOCKS.COBBLESTONE);
        }
        // Wall around well
        if (Math.abs(dx) === 1 || Math.abs(dz) === 1) {
          this._setBlockSafe(cx + dx, groundY + 1, cz + dz, BLOCKS.COBBLESTONE);
        }
      }
    }
    // Corner posts
    this._setBlockSafe(cx - 1, groundY + 2, cz - 1, BLOCKS.WOOD);
    this._setBlockSafe(cx + 1, groundY + 2, cz - 1, BLOCKS.WOOD);
    this._setBlockSafe(cx - 1, groundY + 2, cz + 1, BLOCKS.WOOD);
    this._setBlockSafe(cx + 1, groundY + 2, cz + 1, BLOCKS.WOOD);
    // Roof
    for (let dx = -2; dx <= 2; dx++) {
      this._setBlockSafe(cx + dx, groundY + 3, cz - 2, BLOCKS.WOOD);
      this._setBlockSafe(cx + dx, groundY + 3, cz + 2, BLOCKS.WOOD);
    }
  }

  _placeLampPost(x, z, groundY) {
    this._setBlockSafe(x, groundY + 1, z, BLOCKS.WOOD);
    this._setBlockSafe(x, groundY + 2, z, BLOCKS.WOOD);
    this._setBlockSafe(x, groundY + 3, z, BLOCKS.LANTERN);
  }

  _placePath(x1, z1, x2, z2, y1, y2) {
    // Simple L-shaped gravel path
    const dx = Math.sign(x2 - x1), dz = Math.sign(z2 - z1);
    let cx = x1, cz = z1;
    while (cx !== x2) {
      this._setBlockSafe(cx, y1, cz, BLOCKS.GRAVEL);
      cx += dx;
    }
    while (cz !== z2) {
      this._setBlockSafe(cx, y2, cz, BLOCKS.GRAVEL);
      cz += dz;
    }
  }

  _placeTemple(cx, cz, groundY) {
    // 5-layer stepped pyramid
    const baseSize = 9;
    const half = Math.floor(baseSize / 2);
    for (let layer = 0; layer < 5; layer++) {
      const s = baseSize - layer * 2;
      if (s < 1) break;
      for (let dx = 0; dx < s; dx++) {
        for (let dz = 0; dz < s; dz++) {
          const bx = cx - Math.floor(s / 2) + dx, bz = cz - Math.floor(s / 2) + dz;
          const by = groundY + layer;
          this._setBlockSafe(bx, by, bz, BLOCKS.SANDSTONE);
        }
      }
    }
    // Corner pillars on top layer
    const topSize = baseSize - 4 * 2;
    if (topSize >= 1) {
      const topHalf = Math.floor(topSize / 2);
      for (let dy = 1; dy <= 2; dy++) {
        this._setBlockSafe(cx - topHalf, groundY + 5 + dy - 1, cz - topHalf, BLOCKS.SANDSTONE);
        this._setBlockSafe(cx + topHalf, groundY + 5 + dy - 1, cz - topHalf, BLOCKS.SANDSTONE);
        this._setBlockSafe(cx - topHalf, groundY + 5 + dy - 1, cz + topHalf, BLOCKS.SANDSTONE);
        this._setBlockSafe(cx + topHalf, groundY + 5 + dy - 1, cz + topHalf, BLOCKS.SANDSTONE);
      }
    }
    // Entrance gap on first layer
    for (let dy = 0; dy < 2; dy++) {
      this._setBlockSafe(cx, groundY + dy, cz - half, BLOCKS.AIR);
    }
    // Chamber inside
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        this._setBlockSafe(cx + dx, groundY + 1, cz + dz, BLOCKS.AIR);
      }
    }
  }

  _placeMineshaft(cx, cz, groundY) {
    const tunnelY = Math.max(3, groundY - 8);
    const tunnelLen = 12;
    // Main tunnel with branches
    for (let dx = -tunnelLen; dx <= tunnelLen; dx++) {
      const bx = cx + dx;
      if (bx < 0 || bx >= CHUNK_SIZE) continue;
      for (let dy = 0; dy < 2; dy++) {
        this._setBlockSafe(bx, tunnelY + dy, cz, BLOCKS.AIR);
      }
      // Wood supports every 3 blocks
      if (dx % 3 === 0) {
        for (let dy = -1; dy <= 2; dy++) {
          this._setBlockSafe(bx, tunnelY + dy, cz - 1, BLOCKS.WOOD);
          this._setBlockSafe(bx, tunnelY + dy, cz + 1, BLOCKS.WOOD);
        }
        this._setBlockSafe(bx, tunnelY - 1, cz, BLOCKS.PLANKS);
        // SPEC-031: Torch on support
        this._setBlockSafe(bx, tunnelY + 2, cz - 1, BLOCKS.TORCH);
      }
      // Branch tunnels at 1/3 and 2/3
      if (dx === -Math.floor(tunnelLen / 3) || dx === Math.floor(tunnelLen / 3)) {
        for (let dz = 1; dz <= 4; dz++) {
          if (cz + dz >= CHUNK_SIZE) break;
          this._setBlockSafe(bx, tunnelY, cz + dz, BLOCKS.AIR);
          this._setBlockSafe(bx, tunnelY + 1, cz + dz, BLOCKS.AIR);
        }
      }
    }
  }

  _placeMonument(cx, cz, groundY) {
    // 9x9 underwater temple with dome
    const size = 9;
    const half = Math.floor(size / 2);
    const baseY = Math.max(1, groundY - 2);
    for (let dx = -half; dx <= half; dx++) {
      for (let dz = -half; dz <= half; dz++) {
        for (let dy = 0; dy < 5; dy++) {
          const bx = cx + dx, bz = cz + dz, by = baseY + dy;
          const isEdge = dx === -half || dx === half || dz === -half || dz === half;
          const isFloor = dy === 0;
          const isDome = dy === 4 && Math.abs(dx) <= 1 && Math.abs(dz) <= 1;
          if (isEdge || isFloor || isDome) {
            this._setBlockSafe(bx, by, bz, BLOCKS.PRISMARINE);
          } else {
            this._setBlockSafe(bx, by, bz, BLOCKS.WATER);
          }
        }
      }
    }
    // Internal pillars
    for (let dy = 1; dy <= 3; dy++) {
      this._setBlockSafe(cx - 2, baseY + dy, cz - 2, BLOCKS.PRISMARINE);
      this._setBlockSafe(cx + 2, baseY + dy, cz - 2, BLOCKS.PRISMARINE);
      this._setBlockSafe(cx - 2, baseY + dy, cz + 2, BLOCKS.PRISMARINE);
      this._setBlockSafe(cx + 2, baseY + dy, cz + 2, BLOCKS.PRISMARINE);
    }
    // Entrance arch
    this._setBlockSafe(cx, baseY + 1, cz - half, BLOCKS.AIR);
    this._setBlockSafe(cx, baseY + 2, cz - half, BLOCKS.AIR);
  }

  _placeJungleTemple(cx, cz, groundY) {
    // 7x5 mossy cobble structure
    const w = 7, d = 5;
    const halfW = Math.floor(w / 2), halfD = Math.floor(d / 2);
    for (let dy = 0; dy <= 4; dy++) {
      for (let dx = -halfW; dx <= halfW; dx++) {
        for (let dz = -halfD; dz <= halfD; dz++) {
          const isEdge = dx === -halfW || dx === halfW || dz === -halfD || dz === halfD;
          if (dy === 0) {
            this._setBlockSafe(cx + dx, groundY + dy, cz + dz, BLOCKS.MOSSY_COBBLE);
          } else if (isEdge && dy <= 3) {
            this._setBlockSafe(cx + dx, groundY + dy, cz + dz, BLOCKS.MOSSY_COBBLE);
          } else if (dy === 4) {
            this._setBlockSafe(cx + dx, groundY + dy, cz + dz, BLOCKS.MOSSY_COBBLE);
          }
        }
      }
    }
    // Entrance
    this._setBlockSafe(cx, groundY + 1, cz + halfD, BLOCKS.AIR);
    this._setBlockSafe(cx, groundY + 2, cz + halfD, BLOCKS.AIR);
    // Interior torches
    this._setBlockSafe(cx - 2, groundY + 2, cz, BLOCKS.TORCH);
    this._setBlockSafe(cx + 2, groundY + 2, cz, BLOCKS.TORCH);
  }

  _placeShipwreck(cx, cz, groundY) {
    // Hull — tilted wooden structure
    const len = 7, height = 3;
    for (let dx = 0; dx < len; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        for (let dy = 0; dy < height; dy++) {
          const tilt = Math.floor(dx / 3);
          const by = groundY + dy + tilt;
          if (dz === -1 || dz === 1 || dy === 0) {
            this._setBlockSafe(cx - 3 + dx, by, cz + dz, BLOCKS.WOOD);
          }
        }
      }
    }
    // Hole in hull
    this._setBlockSafe(cx, groundY + 1, cz - 1, BLOCKS.AIR);
  }

  _placeIgloo(cx, cz, groundY) {
    // Snow dome 5x3
    const r = 2;
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= r + 0.5) {
          this._setBlockSafe(cx + dx, groundY, cz + dz, BLOCKS.SNOW_BLOCK);
          if (dist > r - 1) {
            this._setBlockSafe(cx + dx, groundY + 1, cz + dz, BLOCKS.SNOW_BLOCK);
          }
          if (dist > r - 0.5) {
            this._setBlockSafe(cx + dx, groundY + 2, cz + dz, BLOCKS.SNOW_BLOCK);
          }
        }
      }
    }
    // Entrance
    this._setBlockSafe(cx, groundY, cz + r, BLOCKS.AIR);
    this._setBlockSafe(cx, groundY + 1, cz + r, BLOCKS.AIR);
  }

  _placeDesertWell(cx, cz, groundY) {
    // 3x3 sandstone well
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dz === 0) {
          this._setBlockSafe(cx, groundY, cz, BLOCKS.WATER);
        } else {
          this._setBlockSafe(cx + dx, groundY, cz + dz, BLOCKS.SANDSTONE);
        }
        if (Math.abs(dx) === 1 || Math.abs(dz) === 1) {
          this._setBlockSafe(cx + dx, groundY + 1, cz + dz, BLOCKS.SANDSTONE);
        }
      }
    }
  }

  _placeIceSpike(cx, cz, groundY) {
    // Tall narrow spike of packed ice
    const height = 4 + Math.floor(this.world.structRng.next() * 4);
    for (let dy = 0; dy < height; dy++) {
      const r = Math.max(0, 2 - Math.floor(dy / 2));
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.sqrt(dx * dx + dz * dz) <= r + 0.5) {
            this._setBlockSafe(cx + dx, groundY + dy, cz + dz, BLOCKS.PACKED_ICE);
          }
        }
      }
    }
  }

  _placeBoulder(cx, cz, groundY) {
    // Random rock formation
    const rockType = this.world.structRng.next();
    const block = rockType < 0.33 ? BLOCKS.GRANITE : rockType < 0.66 ? BLOCKS.ANDESITE : BLOCKS.DIORITE;
    const r = 2;
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = 0; dy <= r; dy++) {
        for (let dz = -r; dz <= r; dz++) {
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist <= r + 0.5) {
            this._setBlockSafe(cx + dx, groundY + dy, cz + dz, block);
          }
        }
      }
    }
  }

  _placeSwampHut(cx, cz, groundY) {
    // Hut on stilts
    // Stilts
    this._setBlockSafe(cx - 2, groundY, cz - 2, BLOCKS.WOOD);
    this._setBlockSafe(cx + 2, groundY, cz - 2, BLOCKS.WOOD);
    this._setBlockSafe(cx - 2, groundY, cz + 2, BLOCKS.WOOD);
    this._setBlockSafe(cx + 2, groundY, cz + 2, BLOCKS.WOOD);
    const hutY = groundY + 2;
    // Floor
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        this._setBlockSafe(cx + dx, hutY, cz + dz, BLOCKS.PLANKS);
      }
    }
    // Walls
    for (let dy = 1; dy <= 3; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          if (Math.abs(dx) === 2 || Math.abs(dz) === 2) {
            if (dy <= 2 && dx === 0 && dz === 2) continue;
            this._setBlockSafe(cx + dx, hutY + dy, cz + dz, BLOCKS.PLANKS);
          }
        }
      }
    }
    // Roof
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        this._setBlockSafe(cx + dx, hutY + 4, cz + dz, BLOCKS.WOOD);
      }
    }
  }

  _placeRuinedPortal(cx, cz, groundY) {
    // Obsidian portal frame with lava base
    const w = 4, h = 5;
    for (let dy = 0; dy < h; dy++) {
      this._setBlockSafe(cx - 2, groundY + dy, cz, BLOCKS.OBSIDIAN);
      this._setBlockSafe(cx + 2, groundY + dy, cz, BLOCKS.OBSIDIAN);
    }
    for (let dx = -2; dx <= 2; dx++) {
      this._setBlockSafe(cx + dx, groundY, cz, BLOCKS.OBSIDIAN);
      this._setBlockSafe(cx + dx, groundY + h - 1, cz, BLOCKS.OBSIDIAN);
    }
    // Lava at bottom
    this._setBlockSafe(cx - 1, groundY + 1, cz, BLOCKS.LAVA);
    this._setBlockSafe(cx, groundY + 1, cz, BLOCKS.LAVA);
    this._setBlockSafe(cx + 1, groundY + 1, cz, BLOCKS.LAVA);
  }

  _placeCoralReef(cx, cz, groundY) {
    // Colorful coral blocks underwater
    const colors = [BLOCKS.PRISMARINE, BLOCKS.CLAY, BLOCKS.TERRACOTTA, BLOCKS.SANDSTONE];
    for (let i = 0; i < 8; i++) {
      const dx = Math.floor((this.world.structRng.next() - 0.5) * 8);
      const dz = Math.floor((this.world.structRng.next() - 0.5) * 8);
      const dy = Math.floor(this.world.structRng.next() * 3);
      const block = colors[Math.floor(this.world.structRng.next() * colors.length)];
      this._setBlockSafe(cx + dx, groundY + dy, cz + dz, block);
    }
  }

  _placeForestRock(cx, cz, groundY) {
    // Mossy stone formation
    const r = 2;
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = 0; dy <= 2; dy++) {
        for (let dz = -r; dz <= r; dz++) {
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist <= r + 0.3) {
            this._setBlockSafe(cx + dx, groundY + dy, cz + dz, BLOCKS.MOSSY_STONE);
          }
        }
      }
    }
  }

  _placeTree(x, y, z) {
    const biome = this.world.getBiome(this.cx * CHUNK_SIZE + x, this.cz * CHUNK_SIZE + z, y - 1);
    const treeType = this._getTreeType(biome);
    switch (treeType) {
      case 'jungle': this._placeJungleTree(x, y, z); break;
      case 'spruce': this._placeSpruceTree(x, y, z); break;
      case 'mangrove': this._placeMangroveTree(x, y, z); break;
      case 'dead': this._placeDeadTree(x, y, z); break;
      case 'savanna': this._placeSavannaTree(x, y, z); break;
      default: this._placeOakTree(x, y, z); break;
    }
  }

  _getTreeType(biome) {
    if (biome === 'jungle') return 'jungle';
    if (biome === 'taiga') return 'spruce';
    if (biome === 'mangrove') return 'mangrove';
    if (biome === 'swamp') return 'dead';
    if (biome === 'savanna') return 'savanna';
    return 'oak';
  }

  _setBlockSafe(x, y, z, block, force = false) {
    if (x >= 0 && x < CHUNK_SIZE && y >= 0 && y < CHUNK_HEIGHT && z >= 0 && z < CHUNK_SIZE) {
      const idx = this._idx(x, y, z);
      if (force || this._forcePlace || this.blocks[idx] === BLOCKS.AIR || block === BLOCKS.WOOD || block === BLOCKS.BIRCH_WOOD || block === BLOCKS.SPRUCE_WOOD) {
        this.blocks[idx] = block;
      }
    }
  }

  _placeOakTree(x, y, z) {
    const treeHeight = 4 + Math.floor(this.world.treeRng.next() * 3);
    const trunkBlock = this.world.treeRng.next() > 0.5 ? BLOCKS.WOOD : BLOCKS.BIRCH_WOOD;
    for (let i = 0; i < treeHeight; i++) {
      this._setBlockSafe(x, y + i, z, trunkBlock);
    }
    const topY = y + treeHeight - 1;
    const leafRadius = 2;
    for (let dy = -1; dy <= 2; dy++) {
      const r = dy <= 0 ? leafRadius : leafRadius - 1;
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          const dist = Math.sqrt(dx * dx + dz * dz + (dy < 0 ? 0 : dy * dy));
          if (dist <= r + 0.5) {
            this._setBlockSafe(x + dx, topY + dy, z + dz, BLOCKS.LEAVES);
          }
        }
      }
    }
  }

  _placeJungleTree(x, y, z) {
    const treeHeight = 8 + Math.floor(this.world.treeRng.next() * 4);
    // 2x2 trunk
    for (let i = 0; i < treeHeight; i++) {
      this._setBlockSafe(x, y + i, z, BLOCKS.WOOD);
      this._setBlockSafe(x + 1, y + i, z, BLOCKS.WOOD);
      this._setBlockSafe(x, y + i, z + 1, BLOCKS.WOOD);
      this._setBlockSafe(x + 1, y + i, z + 1, BLOCKS.WOOD);
    }
    // Large canopy
    const topY = y + treeHeight - 1;
    const leafRadius = 3;
    for (let dy = -1; dy <= 2; dy++) {
      const r = dy <= 0 ? leafRadius : leafRadius - dy + 1;
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist <= r + 0.5) {
            this._setBlockSafe(x + dx + 1, topY + dy, z + dz + 1, BLOCKS.LEAVES);
          }
        }
      }
    }
  }

  _placeSpruceTree(x, y, z) {
    const treeHeight = 6 + Math.floor(this.world.treeRng.next() * 4);
    for (let i = 0; i < treeHeight; i++) {
      this._setBlockSafe(x, y + i, z, BLOCKS.SPRUCE_WOOD);
    }
    // Conical leaves — widest at bottom, narrowing to top
    const topY = y + treeHeight - 1;
    const baseRadius = 2;
    for (let dy = -2; dy <= 1; dy++) {
      const layerY = topY + dy;
      const r = Math.max(0, baseRadius - Math.floor((dy + 2) / 1.5));
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist <= r + 0.3) {
            this._setBlockSafe(x + dx, layerY, z + dz, BLOCKS.OAK_LEAVES_DARK);
          }
        }
      }
    }
  }

  _placeMangroveTree(x, y, z) {
    const treeHeight = 4 + Math.floor(this.world.treeRng.next() * 2);
    // Roots — short trunk segments going down and outward
    for (let i = 0; i < 2; i++) {
      this._setBlockSafe(x - 1, y - 1 - i, z, BLOCKS.WOOD);
      this._setBlockSafe(x + 1, y - 1 - i, z, BLOCKS.WOOD);
      this._setBlockSafe(x, y - 1 - i, z - 1, BLOCKS.WOOD);
      this._setBlockSafe(x, y - 1 - i, z + 1, BLOCKS.WOOD);
    }
    // Trunk
    for (let i = 0; i < treeHeight; i++) {
      this._setBlockSafe(x, y + i, z, BLOCKS.WOOD);
    }
    // Sparse canopy
    const topY = y + treeHeight - 1;
    for (let dy = 0; dy <= 2; dy++) {
      const r = 2 - dy;
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) + Math.abs(dz) <= r + 1) {
            this._setBlockSafe(x + dx, topY + dy, z + dz, BLOCKS.LEAVES);
          }
        }
      }
    }
  }

  _placeDeadTree(x, y, z) {
    const treeHeight = 3 + Math.floor(this.world.treeRng.next() * 3);
    for (let i = 0; i < treeHeight; i++) {
      this._setBlockSafe(x, y + i, z, BLOCKS.WOOD);
    }
    // Branches — no leaves
    const topY = y + treeHeight - 1;
    const branches = 2 + Math.floor(this.world.treeRng.next() * 3);
    for (let b = 0; b < branches; b++) {
      const bdy = Math.floor(this.world.treeRng.next() * treeHeight);
      const bdx = Math.floor((this.world.treeRng.next() - 0.5) * 4);
      const bdz = Math.floor((this.world.treeRng.next() - 0.5) * 4);
      const len = Math.max(Math.abs(bdx), Math.abs(bdz));
      for (let s = 0; s <= len; s++) {
        const sx = x + Math.round(bdx * s / len);
        const sz = z + Math.round(bdz * s / len);
        this._setBlockSafe(sx, y + bdy, sz, BLOCKS.WOOD);
      }
    }
  }

  _placeSavannaTree(x, y, z) {
    const treeHeight = 3 + Math.floor(this.world.treeRng.next() * 2);
    // Thick short trunk
    for (let i = 0; i < treeHeight; i++) {
      this._setBlockSafe(x, y + i, z, BLOCKS.WOOD);
      if (i < treeHeight - 1) {
        this._setBlockSafe(x + 1, y + i, z, BLOCKS.WOOD);
        this._setBlockSafe(x, y + i, z + 1, BLOCKS.WOOD);
      }
    }
    // Flat wide canopy
    const topY = y + treeHeight - 1;
    for (let dy = 0; dy <= 1; dy++) {
      const r = dy === 0 ? 3 : 2;
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist <= r + 0.3) {
            this._setBlockSafe(x + dx, topY + dy, z + dz, BLOCKS.LEAVES);
          }
        }
      }
    }
  }

  getBlock(x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) return BLOCKS.AIR;
    return this.blocks[this._idx(x, y, z)];
  }

  setBlock(x, y, z, block) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) return;
    this.blocks[this._idx(x, y, z)] = block;
    this.modified.set(this._idx(x, y, z), block);
  }

  isSolid(x, y, z) {
    const b = this.getBlock(x, y, z);
    return b !== BLOCKS.AIR && b !== BLOCKS.WATER && b !== BLOCKS.LAVA;
  }
}

// ═══════════════════════════════════════════════════════════
// Mesher Helpers — AO, Color Variation, Grass Per-Face, Ore Patterns
// ═══════════════════════════════════════════════════════════
const GRASS_TOP_COLOR = [0.35, 0.72, 0.25];
const GRASS_SIDE_TOP = [0.35, 0.65, 0.22];
const GRASS_SIDE_BOTTOM = [0.55, 0.40, 0.25];
const GRASS_BOTTOM_COLOR = [0.55, 0.40, 0.25];

const ORE_BLOCKS = new Set([BLOCKS.COAL_ORE, BLOCKS.IRON_ORE, BLOCKS.GOLD_ORE, BLOCKS.DIAMOND_ORE, BLOCKS.COPPER_ORE, BLOCKS.LAPIS_ORE, BLOCKS.REDSTONE_ORE, BLOCKS.EMERALD_ORE]);
const STONE_COLOR_REF = BLOCK_COLORS[BLOCKS.STONE];

function colorVariation(x, y, z, baseColor) {
  const h = ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) & 0x7fffffff;
  const v = ((h / 0x7fffffff) - 0.5) * 0.10;
  return [baseColor[0] * (1 + v), baseColor[1] * (1 + v), baseColor[2] * (1 + v)];
}

function _isSolid(block) {
  return block !== BLOCKS.AIR && block !== BLOCKS.WATER;
}

function _getBlockAt(chunk, world, x, y, z, ox, oz) {
  if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT) {
    return world.getBlock(ox + x, y, oz + z);
  }
  return chunk.getBlock(x, y, z);
}

function getVertexAO(chunk, world, x, y, z, dir, corner, ox, oz) {
  const axes = [];
  for (let i = 0; i < 3; i++) {
    if (dir[i] !== 0) continue;
    axes.push(i);
  }
  const a1 = corner[axes[0]] === 0 ? -1 : 1;
  const a2 = corner[axes[1]] === 0 ? -1 : 1;

  const s1 = [dir[0], dir[1], dir[2]]; s1[axes[0]] += a1;
  const s2 = [dir[0], dir[1], dir[2]]; s2[axes[1]] += a2;
  const co = [dir[0], dir[1], dir[2]]; co[axes[0]] += a1; co[axes[1]] += a2;

  const b1 = _isSolid(_getBlockAt(chunk, world, x + s1[0], y + s1[1], z + s1[2], ox, oz));
  const b2 = _isSolid(_getBlockAt(chunk, world, x + s2[0], y + s2[1], z + s2[2], ox, oz));
  const bc = _isSolid(_getBlockAt(chunk, world, x + co[0], y + co[1], z + co[2], ox, oz));

  let aoLevel = 0;
  if (b1) aoLevel++;
  if (b2) aoLevel++;
  if (bc && aoLevel < 2) aoLevel++;
  return 1.0 - aoLevel * 0.15;
}

function getGrassFaceColor(face, corner) {
  if (face.dir[1] === 1) return GRASS_TOP_COLOR;
  if (face.dir[1] === -1) return GRASS_BOTTOM_COLOR;
  return corner[1] === 1 ? GRASS_SIDE_TOP : GRASS_SIDE_BOTTOM;
}

function getOreVertexColor(x, y, z, oreColor) {
  const h = ((x * 374761393) ^ (y * 668265263) ^ (z * 1274126177)) & 0x7fffffff;
  return (h / 0x7fffffff) > 0.6 ? oreColor : STONE_COLOR_REF;
}

// SPEC-CHUNK-OPT: Procedural detail helpers — deterministic noise for visual richness

// Micro-height variation for surface (±0.15 blocks)
function _microHeight(worldX, worldZ, seed) {
  const h = ((worldX * 374761393) ^ (worldZ * 668265263) ^ (seed * 1274126177)) & 0x7fffffff;
  return ((h / 0x7fffffff) - 0.5) * 0.3;
}

// Altitude-based color multiplier (higher = darker)
function _altitudeColorMul(worldY) {
  if (worldY > 45) return 0.85;
  if (worldY > 30) return 0.92;
  if (worldY > 20) return 1.0;
  return 0.75;
}

// Dirt patches on grass (~25% of surface)
function _isDirtPatch(worldX, worldZ, seed) {
  const h = ((worldX * 2246822519) ^ (worldZ * 3266489917) ^ (seed * 668265263)) & 0x7fffffff;
  return (h / 0x7fffffff) > 0.75;
}

// Erosion color for cliff faces (darker, worn look)
function _erosionColor(baseColor, heightDiff) {
  if (heightDiff > 3) {
    return [baseColor[0] * 0.7, baseColor[1] * 0.65, baseColor[2] * 0.6];
  }
  return baseColor;
}

// Moisture variation for grass color (greener in moist areas)
function _moistureVariation(worldX, worldZ, baseColor, seed) {
  const h = ((worldX * 40503) ^ (worldZ * 65599) ^ (seed * 2246822519)) & 0x7fffffff;
  const moisture = h / 0x7fffffff;
  if (moisture > 0.6) {
    return [baseColor[0] * 0.9, Math.min(1, baseColor[1] * 1.1), baseColor[2] * 0.9];
  }
  return baseColor;
}

// SPEC-CHUNK-OPT: Simplified mesh for distant chunks (LOD 2/3/4)
// LOD 2: 2x2 block merge — top faces only, averaged colors
// LOD 3: 4x4 block merge — top faces only, flat bioma color
// LOD 4: Heightmap only — 1 quad per XZ column, silhouette + fog blend
function _buildSimplifiedMesh(chunk, world, lodLevel, ox, oz) {
  const positions = [];
  const colors = [];
  const indices = [];
  let vertexCount = 0;

  const mergeSize = lodLevel >= 4 ? 1 : lodLevel >= 3 ? 4 : 2;
  const topOnly = lodLevel >= 2; // All simplified LODs only render top faces

  for (let bx = 0; bx < CHUNK_SIZE; bx += mergeSize) {
    for (let bz = 0; bz < CHUNK_SIZE; bz += mergeSize) {
      // Find the highest solid block in the merge area
      let topY = -1;
      let topBlock = BLOCKS.AIR;
      let colorSum = [0, 0, 0];
      let colorCount = 0;

      for (let mx = 0; mx < mergeSize && bx + mx < CHUNK_SIZE; mx++) {
        for (let mz = 0; mz < mergeSize && bz + mz < CHUNK_SIZE; mz++) {
          for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
            const b = chunk.getBlock(bx + mx, y, bz + mz);
            if (b !== BLOCKS.AIR && b !== BLOCKS.WATER) {
              if (y > topY) {
                topY = y;
                topBlock = b;
              }
              const bc = BLOCK_COLORS[b] || [0.5, 0.5, 0.5];
              colorSum[0] += bc[0];
              colorSum[1] += bc[1];
              colorSum[2] += bc[2];
              colorCount++;
              break;
            }
          }
        }
      }

      if (topY < 0 || topBlock === BLOCKS.AIR) continue;

      // Averaged color
      const avgColor = colorCount > 0
        ? [colorSum[0] / colorCount, colorSum[1] / colorCount, colorSum[2] / colorCount]
        : (BLOCK_COLORS[topBlock] || [0.5, 0.5, 0.5]);

      // Apply altitude shading
      const altMul = _altitudeColorMul(topY);
      let r = avgColor[0] * altMul;
      let g = avgColor[1] * altMul;
      let b = avgColor[2] * altMul;

      // SPEC-CHUNK-OPT: LOD 4 — blend with fog color for distant horizon
      if (lodLevel >= 4) {
        const fogR = 0xA8 / 255;
        const fogG = 0xC8 / 255;
        const fogB = 0xE0 / 255;
        r = r * 0.4 + fogR * 0.6;
        g = g * 0.4 + fogG * 0.6;
        b = b * 0.4 + fogB * 0.6;
      }

      // Emit top face quad for the merged area
      const x0 = ox + bx;
      const z0 = oz + bz;
      const x1 = ox + bx + mergeSize;
      const z1 = oz + bz + mergeSize;
      const y = topY + 1;

      positions.push(x0, y, z0, x0, y, z1, x1, y, z1, x1, y, z0);
      colors.push(r, g, b, r, g, b, r, g, b, r, g, b);
      indices.push(vertexCount, vertexCount + 1, vertexCount + 2, vertexCount, vertexCount + 2, vertexCount + 3);
      vertexCount += 4;

      // LOD 2: Also emit side faces for height differences with neighbors (simplified)
      if (lodLevel === 2) {
        // Check neighbor heights for side faces
        const neighbors = [
          { dir: [-1, 0], face: [x0, y, z0, x0, y, z1] }, // -X face
          { dir: [1, 0], face: [x1, y, z0, x1, y, z1] },  // +X face
          { dir: [0, -1], face: [x0, y, z0, x1, y, z0] }, // -Z face
          { dir: [0, 1], face: [x0, y, z1, x1, y, z1] },  // +Z face
        ];

        for (const n of neighbors) {
          // Check if neighbor area is lower (would expose a side face)
          let neighborTopY = -1;
          const nwx = ox + bx + n.dir[0] * mergeSize;
          const nwz = oz + bz + n.dir[1] * mergeSize;

          // Sample world height at neighbor position
          if (nwx >= 0 && nwz >= 0) {
            for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
              const wb = world.getBlock(nwx, y, nwz);
              if (wb !== BLOCKS.AIR && wb !== BLOCKS.WATER) {
                neighborTopY = y;
                break;
              }
            }
          }

          if (neighborTopY < topY - 1) {
            // Emit side face from neighborTopY+1 to topY+1
            const sideY0 = neighborTopY < 0 ? 0 : neighborTopY + 1;
            const sideY1 = topY + 1;
            const sr = r * 0.8;
            const sg = g * 0.8;
            const sb = b * 0.8;

            if (n.dir[0] === -1) {
              positions.push(x0, sideY0, z0, x0, sideY0, z1, x0, sideY1, z1, x0, sideY1, z0);
            } else if (n.dir[0] === 1) {
              positions.push(x1, sideY0, z0, x1, sideY1, z0, x1, sideY1, z1, x1, sideY0, z1);
            } else if (n.dir[1] === -1) {
              positions.push(x0, sideY0, z0, x0, sideY1, z0, x1, sideY1, z0, x1, sideY0, z0);
            } else {
              positions.push(x0, sideY0, z1, x1, sideY0, z1, x1, sideY1, z1, x0, sideY1, z1);
            }
            colors.push(sr, sg, sb, sr, sg, sb, sr, sg, sb, sr, sg, sb);
            indices.push(vertexCount, vertexCount + 1, vertexCount + 2, vertexCount, vertexCount + 2, vertexCount + 3);
            vertexCount += 4;
          }
        }
      }
    }
  }

  return { positions, colors, indices };
}

// ═══════════════════════════════════════════════════════════
// Chunk Mesher — Greedy meshing with face culling + AO + color variation
// SPEC-036: Greedy meshing merges adjacent same-block faces into larger quads
// ═══════════════════════════════════════════════════════════

// AO cache — avoids recomputing AO for the same block positions
const _aoCache = new Map();

function _getCachedAO(chunk, world, x, y, z, dir, corner, ox, oz) {
  const key = `${x},${y},${z},${dir[0]},${dir[1]},${dir[2]},${corner[0]},${corner[1]},${corner[2]}`;
  if (_aoCache.has(key)) return _aoCache.get(key);
  const ao = getVertexAO(chunk, world, x, y, z, dir, corner, ox, oz);
  _aoCache.set(key, ao);
  return ao;
}

function buildChunkMesh(chunk, world, lodLevel = 0) {
  chunk.generate();
  _aoCache.clear();

  const positions = [];
  const colors = [];
  const indices = [];
  let vertexCount = 0;

  const ox = chunk.cx * CHUNK_SIZE;
  const oz = chunk.cz * CHUNK_SIZE;

  // SPEC-CHUNK-OPT: LOD 2/3/4 — Simplified meshing for distant chunks
  if (lodLevel >= 2) {
    return _buildSimplifiedMesh(chunk, world, lodLevel, ox, oz);
  }

  const TRANSPARENT_BLOCKS = new Set([BLOCKS.GLASS, BLOCKS.LEAVES, BLOCKS.FERN, BLOCKS.DEAD_BUSH, BLOCKS.FLOWER_RED, BLOCKS.FLOWER_YELLOW, BLOCKS.TALL_GRASS, BLOCKS.ICE, BLOCKS.OAK_LEAVES_DARK, BLOCKS.MOSS, BLOCKS.TORCH, BLOCKS.BAMBOO, BLOCKS.LANTERN]);
  const EMISSIVE_BLOCKS = new Set([BLOCKS.TORCH, BLOCKS.LANTERN, BLOCKS.LAVA, BLOCKS.AMETHYST]);

  // Face definitions: dir + 4 corners (CCW when viewed from outside)
  const FACES = [
    { dir: [0, 1, 0], corners: [[0,1,0],[0,1,1],[1,1,1],[1,1,0]], shade: 1.0 },
    { dir: [0,-1, 0], corners: [[0,0,1],[0,0,0],[1,0,0],[1,0,1]], shade: 0.6 },
    { dir: [1, 0, 0], corners: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]], shade: 0.8 },
    { dir: [-1,0, 0], corners: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]], shade: 0.8 },
    { dir: [0, 0, 1], corners: [[1,0,1],[1,1,1],[0,1,1],[0,0,1]], shade: 0.7 },
    { dir: [0, 0,-1], corners: [[0,0,0],[0,1,0],[1,1,0],[1,0,0]], shade: 0.7 },
  ];

  // SPEC-036: Real greedy meshing — merge adjacent same-block faces into larger quads
  // For each face direction, scan slices perpendicular to that direction,
  // build a mask of which cells need a face, then merge runs of same block type.

  function getNeighborBlock(x, y, z, dir) {
    const nx = x + dir[0], ny = y + dir[1], nz = z + dir[2];
    if (nx < 0 || nx >= CHUNK_SIZE || nz < 0 || nz >= CHUNK_SIZE || ny < 0 || ny >= CHUNK_HEIGHT) {
      return world.getBlock(ox + nx, ny, oz + nz);
    }
    return chunk.getBlock(nx, ny, nz);
  }

  // Determine which two axes are the "u" and "v" for each face direction
  const faceAxes = [
    { du: [0,0,1], dv: [1,0,0] }, // top: u=z, v=x
    { du: [0,0,1], dv: [1,0,0] }, // bottom
    { du: [0,1,0], dv: [0,0,1] }, // +x: u=y, v=z
    { du: [0,1,0], dv: [0,0,1] }, // -x
    { du: [1,0,0], dv: [0,1,0] }, // +z: u=x, v=y
    { du: [1,0,0], dv: [0,1,0] }, // -z
  ];

  for (let f = 0; f < FACES.length; f++) {
    const face = FACES[f];
    const dir = face.dir;
    const axes = faceAxes[f];
    const du = axes.du, dv = axes.dv;
    const faceShade = face.shade;

    // Determine the range for the slice axis (the one dir points along)
    // and the u/v ranges
    const [uSize, vSize, sRange] = (() => {
      if (dir[0] !== 0) return [CHUNK_HEIGHT, CHUNK_SIZE, CHUNK_SIZE]; // x faces: u=y(0..H), v=z(0..S), slice=x(0..S)
      if (dir[1] !== 0) return [CHUNK_SIZE, CHUNK_SIZE, CHUNK_HEIGHT]; // y faces: u=x, v=z, slice=y
      return [CHUNK_SIZE, CHUNK_HEIGHT, CHUNK_SIZE]; // z faces: u=x, v=y, slice=z
    })();

    for (let s = 0; s < sRange; s++) {
      // Build mask: for each (u,v) cell, store block type or 0 if no face needed
      const mask = new Array(uSize * vSize).fill(0);
      const maskBlock = new Array(uSize * vSize).fill(0);

      for (let u = 0; u < uSize; u++) {
        for (let v = 0; v < vSize; v++) {
          // Convert (s, u, v) back to (x, y, z)
          let x, y, z;
          if (dir[0] !== 0) { x = s; y = u; z = v; }
          else if (dir[1] !== 0) { y = s; x = u; z = v; }
          else { z = s; x = u; y = v; }

          const block = chunk.getBlock(x, y, z);
          if (block === BLOCKS.AIR || block === BLOCKS.WATER) {
            // Check if neighbor in dir needs a face from its side
            const nb = getNeighborBlock(x, y, z, dir);
            if (nb !== BLOCKS.AIR && nb !== BLOCKS.WATER) {
              // Only create face for cross-chunk boundaries — same-chunk neighbors
              // will emit their own face from the opposite direction
              const nx = x + dir[0], ny = y + dir[1], nz = z + dir[2];
              const isCrossChunk = nx < 0 || nx >= CHUNK_SIZE || nz < 0 || nz >= CHUNK_SIZE || ny < 0 || ny >= CHUNK_HEIGHT;
              if (!isCrossChunk) continue;
              const isTrans = TRANSPARENT_BLOCKS.has(nb);
              // SPEC-037: LOD 2 — skip transparent neighbor faces
              if (lodLevel >= 2 && isTrans) continue;
              if (!isTrans || nb !== block) {
                mask[u * vSize + v] = nb;
                maskBlock[u * vSize + v] = nb;
              }
            }
          } else {
            const nb = getNeighborBlock(x, y, z, dir);
            const isTrans = TRANSPARENT_BLOCKS.has(block);
            // SPEC-037: LOD 2 — skip transparent block faces
            if (lodLevel >= 2 && isTrans) continue;
            const neighborIsAir = nb === BLOCKS.AIR || nb === BLOCKS.WATER;
            const neighborIsTransparent = TRANSPARENT_BLOCKS.has(nb);
            if (neighborIsAir || (neighborIsTransparent && !isTrans) || (isTrans && nb !== block)) {
              mask[u * vSize + v] = block;
              maskBlock[u * vSize + v] = block;
            }
          }
        }
      }

      // Greedy merge: scan mask and merge runs
      for (let u = 0; u < uSize; u++) {
        let v = 0;
        while (v < vSize) {
          const blockType = mask[u * vSize + v];
          if (blockType === 0) { v++; continue; }

          // Find how far we can extend in v (same block type)
          let vEnd = v + 1;
          while (vEnd < vSize && mask[u * vSize + vEnd] === blockType) vEnd++;

          // Find how far we can extend in u (same block type for all v in [v, vEnd))
          let uEnd = u + 1;
          outer: for (; uEnd < uSize; uEnd++) {
            for (let vv = v; vv < vEnd; vv++) {
              if (mask[uEnd * vSize + vv] !== blockType) break outer;
            }
          }

          // Emit merged quad: (u..uEnd) x (v..vEnd)
          // Convert back to (x, y, z) for the 4 corners
          function toXYZ(uu, vv, offset) {
            let x, y, z;
            if (dir[0] !== 0) { x = s + offset; y = uu; z = vv; }
            else if (dir[1] !== 0) { y = s + offset; x = uu; z = vv; }
            else { z = s + offset; x = uu; y = vv; }
            return [ox + x, y, oz + z];
          }

          // offset: 0 for negative dir faces (face at block start), 1 for positive
          const offset = dir[0] > 0 || dir[1] > 0 || dir[2] > 0 ? 1 : 0;
          const isEmissive = EMISSIVE_BLOCKS.has(blockType);
          const isGrass = blockType === BLOCKS.GRASS;
          const isOre = ORE_BLOCKS.has(blockType);
          const baseColor = BLOCK_COLORS[blockType] || [0.5, 0.5, 0.5];

          // 4 corners of the merged quad
          const c0 = toXYZ(u, v, offset);
          const c1 = toXYZ(u, vEnd, offset);
          const c2 = toXYZ(uEnd, vEnd, offset);
          const c3 = toXYZ(uEnd, v, offset);

          // Block positions for AO: each corner uses the block at that corner of the rectangle
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
              vc = getGrassFaceColor(face, aoCorners[ci]);
              // SPEC-CHUNK-OPT: Procedural details for grass (LOD 0 only)
              if (lodLevel === 0) {
                // Dirt patches: replace some grass with dirt color
                if (_isDirtPatch(corner[0], corner[2], world.seed)) {
                  vc = BLOCK_COLORS[BLOCKS.DIRT] || [0.55, 0.40, 0.25];
                } else {
                  // Moisture variation: greener in moist areas
                  vc = _moistureVariation(corner[0], corner[2], vc, world.seed);
                }
              }
            } else if (isOre) {
              vc = getOreVertexColor(corner[0], corner[1], corner[2], baseColor);
            } else {
              vc = colorVariation(corner[0], corner[1], corner[2], baseColor);
            }

            // SPEC-CHUNK-OPT: Altitude-based color variation (LOD 0 only)
            if (lodLevel === 0 && !isEmissive) {
              const altMul = _altitudeColorMul(corner[1]);
              vc = [vc[0] * altMul, vc[1] * altMul, vc[2] * altMul];
            }

            let r = vc[0] * faceShade;
            let g = vc[1] * faceShade;
            let b = vc[2] * faceShade;

            if (isEmissive) {
              r = Math.min(1, vc[0] * 1.5);
              g = Math.min(1, vc[1] * 1.5);
              b = Math.min(1, vc[2] * 1.5);
            }

            // SPEC-CHUNK-OPT: Erosion visual on cliff side faces (LOD 0 only)
            if (lodLevel === 0 && !isEmissive && face.dir[1] === 0) {
              // Check if block above this face is air (exposed cliff)
              const bk = aoBlocks[ci];
              const aboveBlock = getNeighborBlock(bk[0], bk[1], bk[2], [0, 1, 0]);
              if (aboveBlock === BLOCKS.AIR) {
                // This face is exposed vertically — apply erosion darkening
                r *= 0.85; g *= 0.82; b *= 0.80;
              }
            }

            if (!isEmissive && lodLevel === 0) {
              const bk = aoBlocks[ci];
              const ao = _getCachedAO(chunk, world, bk[0], bk[1], bk[2], dir, aoCorners[ci], ox, oz);
              r *= ao; g *= ao; b *= ao;
            }

            // SPEC-CHUNK-OPT: Micro-height variation for top faces (LOD 0)
            if (lodLevel === 0 && face.dir[1] === 1) {
              const microH = _microHeight(corner[0], corner[2], world.seed);
              corner[1] += microH;
            }

            positions.push(corner[0], corner[1], corner[2]);
            colors.push(r, g, b);
          }

          // Winding: reverse for -Y, +X, +Z faces to get CCW from outside
          // (Y faces: negative needs reversal; X/Z faces: positive needs reversal)
          const reverseWinding = dir[1] < 0 || dir[0] > 0 || dir[2] > 0;
          if (reverseWinding) {
            indices.push(vertexCount, vertexCount + 2, vertexCount + 1, vertexCount, vertexCount + 3, vertexCount + 2);
          } else {
            indices.push(vertexCount, vertexCount + 1, vertexCount + 2, vertexCount, vertexCount + 2, vertexCount + 3);
          }
          vertexCount += 4;

          // Clear the merged region from mask
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

// Water depth colors — shallow turquoise to deep blue
const WATER_SHALLOW = [0.20, 0.60, 0.65];
const WATER_DEEP = [0.05, 0.20, 0.50];

function buildWaterMesh(chunk, world) {
  const positions = [];
  const colors = [];
  const indices = [];
  const waveOffsets = []; // base Y for wave animation
  let vertexCount = 0;
  const ox = chunk.cx * CHUNK_SIZE;
  const oz = chunk.cz * CHUNK_SIZE;

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        if (chunk.getBlock(x, y, z) !== BLOCKS.WATER) continue;
        // Only render top face of water if block above is air
        if (chunk.getBlock(x, y + 1, z) === BLOCKS.AIR) {
          const wx = ox + x, wz = oz + z;
          const baseY = y + 0.9;

          // Depth: how far below WATER_LEVEL is the ocean floor
          let depth = 0;
          for (let dy = y; dy >= 0; dy--) {
            const b = chunk.getBlock(x, dy, z);
            if (b !== BLOCKS.WATER && b !== BLOCKS.AIR) { depth = y - dy; break; }
          }
          const depthFactor = Math.min(1, depth / 12);

          // Color: interpolate shallow→deep
          const r = WATER_SHALLOW[0] + (WATER_DEEP[0] - WATER_SHALLOW[0]) * depthFactor;
          const g = WATER_SHALLOW[1] + (WATER_DEEP[1] - WATER_SHALLOW[1]) * depthFactor;
          const b = WATER_SHALLOW[2] + (WATER_DEEP[2] - WATER_SHALLOW[2]) * depthFactor;

          // Shoreline: lighten color near edges (neighbor is sand/air below)
          const shoreN = chunk.getBlock(x, y - 1, z);
          const isShore = shoreN === BLOCKS.SAND || shoreN === BLOCKS.SANDSTONE;
          const shoreBoost = isShore ? 0.12 : 0;

          const fr = Math.min(1, r + shoreBoost);
          const fg = Math.min(1, g + shoreBoost);
          const fb = Math.min(1, b + shoreBoost);

          positions.push(wx, baseY, wz, wx + 1, baseY, wz, wx + 1, baseY, wz + 1, wx, baseY, wz + 1);
          colors.push(fr, fg, fb, fr, fg, fb, fr, fg, fb, fr, fg, fb);
          waveOffsets.push(wx, baseY, wz, wx + 1, baseY, wz, wx + 1, baseY, wz + 1, wx, baseY, wz + 1);
          indices.push(vertexCount, vertexCount + 1, vertexCount + 2, vertexCount, vertexCount + 2, vertexCount + 3);
          vertexCount += 4;
        }
      }
    }
  }

  return { positions, colors, indices, waveOffsets };
}

// ═══════════════════════════════════════════════════════════
// Chunk Manager — Dynamic loading/unloading with voxel chunks
// ═══════════════════════════════════════════════════════════
export class ChunkManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.chunks = new Map();
    this.meshes = new Map();
    this.waterMeshes = new Map();
    this.terrainMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.0,
      flatShading: true,
      side: THREE.FrontSide,
    });
    this.waterMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      roughness: 0.15,
      metalness: 0.3,
      side: THREE.DoubleSide,
      emissive: 0x112244,
      emissiveIntensity: 0.15,
    });
    this.waterTime = 0;
    // SPEC-037: adaptive LOD. Frustum culling is left to THREE's own
    // automatic per-mesh bounding-sphere test (see update() for why a
    // hand-rolled version used to live here).
    this._adaptiveRenderDist = RENDER_DIST;
    this._fpsHistory = [];
    // SPEC-CHUNK-OPT: User-configured render distance (from settings)
    this.renderDistance = 5;
    // SPEC-CHUNK-OPT: Heightmap cache for occlusion culling
    this._heightmaps = new Map();
    // SPEC-CHUNK-OPT: Incremental chunk generation queue — rebuilt only on
    // chunk-boundary crossing or render-distance change, not every frame.
    this._chunkGenQueue = [];
    this._queueReadIdx = 0;
    this._lastQueuePCX = null;
    this._lastQueuePCZ = null;
    this._lastQueueRD = null;
    // SPEC-036: PointLight pool for torches/lanterns (max 8 active)
    this.pointLights = [];
    for (let i = 0; i < 8; i++) {
      const pl = new THREE.PointLight(0xffaa44, 0, 12, 2);
      pl.visible = false;
      this.scene.add(pl);
      this.pointLights.push(pl);
    }
    // SPEC-CHUNK-OPT: Worker pool for chunk generation. This used to spin up
    // a single `new Worker('./jardvoxel-worker.js')` by hand — that file
    // didn't exist, so the constructor's onerror always fired and every
    // chunk silently generated synchronously on the main thread. Reusing the
    // WorkerPool class already used (and tested) by the modern engine fixes
    // that and gets 2 parallel workers for free instead of 1.
    this.pendingChunks = new Set(); // chunks sent to the pool, awaiting response
    this._useWorkerPool = false;
    try {
      this._workerPool = new WorkerPool(new URL('./jardvoxel-worker.js', import.meta.url), 2);
      this._workerPool.init({ seed: world.seed }).then(count => {
        this._useWorkerPool = count > 0;
        if (count === 0) console.warn('[JardVoxel] WorkerPool created no workers, using sync generation');
      });
    } catch (e) {
      console.warn('[JardVoxel] WorkerPool unavailable, using sync generation:', e.message);
      this._workerPool = null;
    }
  }

  // SPEC-PERF-001: Numeric chunk key — eliminates string allocation garbage
  _chunkKey(cx, cz) { return (cx + 32768) * 65536 + (cz + 32768); }

  // SPEC-037: Build mesh from a pre-generated chunk (used by worker responses and sync fallback)
  _buildMeshForChunk(cx, cz, chunk) {
    const key = this._chunkKey(cx, cz);
    // Determine LOD level based on distance from player
    const lodLevel = this._getLODLevel(cx, cz);

    // SPEC-CHUNK-OPT: Build heightmap for occlusion culling
    this._buildHeightmap(cx, cz, chunk);

    // Build terrain mesh
    const meshData = buildChunkMesh(chunk, this.world, lodLevel);
    if (meshData.positions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(meshData.positions, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(meshData.colors, 3));
      geo.setIndex(meshData.indices);
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, this.terrainMaterial);
      mesh.castShadow = lodLevel === 0;
      mesh.receiveShadow = true;
      mesh.userData.cx = cx;
      mesh.userData.cz = cz;
      this.scene.add(mesh);
      this.meshes.set(key, mesh);
    }

    // Build water mesh (skip for LOD 3+ — too far for water detail)
    if (lodLevel < 3) {
      const waterData = buildWaterMesh(chunk, this.world);
      if (waterData.positions.length > 0) {
        const wgeo = new THREE.BufferGeometry();
        wgeo.setAttribute('position', new THREE.Float32BufferAttribute(waterData.positions, 3));
        wgeo.setAttribute('color', new THREE.Float32BufferAttribute(waterData.colors, 3));
        wgeo.setIndex(waterData.indices);
        wgeo.computeVertexNormals();
        const wmesh = new THREE.Mesh(wgeo, this.waterMaterial);
        wmesh.userData.cx = cx;
        wmesh.userData.cz = cz;
        wmesh.userData.waveOffsets = waterData.waveOffsets;
        wmesh.userData.basePositions = new Float32Array(waterData.positions);
        this.scene.add(wmesh);
        this.waterMeshes.set(key, wmesh);
      }
    }
  }

  // SPEC-CHUNK-OPT: Build heightmap for a chunk (used for occlusion culling)
  _buildHeightmap(cx, cz, chunk) {
    const heights = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);
    let sum = 0;
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        let topY = 0;
        for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
          const b = chunk.getBlock(x, y, z);
          if (b !== BLOCKS.AIR && b !== BLOCKS.WATER) {
            topY = y;
            break;
          }
        }
        heights[x + z * CHUNK_SIZE] = topY;
        sum += topY;
      }
    }
    this._heightmaps.set(this._chunkKey(cx, cz), {
      heights,
      avgHeight: sum / (CHUNK_SIZE * CHUNK_SIZE),
    });
  }

  // SPEC-CHUNK-OPT: LOD level — 5 levels for progressive detail
  // 0=full (close), 1=no AO (medium), 2=2x2 merge (far), 3=4x4 merge (very far), 4=heightmap only (horizon)
  _getLODLevel(cx, cz) {
    if (this._playerCX === undefined) return 0;
    const dx = cx - this._playerCX;
    const dz = cz - this._playerCZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist <= 3) return 0;
    if (dist <= 6) return 1;
    if (dist <= 10) return 2;
    if (dist <= 14) return 3;
    return 4;
  }

  generateChunk(cx, cz, priority = 0) {
    const key = this._chunkKey(cx, cz);
    if (this.chunks.has(key) || this.pendingChunks.has(key)) return;

    // SPEC-CHUNK-OPT: Use the worker pool if available
    if (this._useWorkerPool && this._workerPool) {
      this.pendingChunks.add(key);
      this._workerPool.generateChunk(cx, cz, priority).then(data => {
        this.pendingChunks.delete(key);
        if (this.chunks.has(key)) return; // already exists (e.g. player modified, or unloaded+reloaded)
        const chunk = VoxelChunk.acquire(cx, cz, this.world);
        chunk.blocks = new Uint8Array(data.blocks);
        chunk.generated = true;
        this.chunks.set(key, chunk);
        this._buildMeshForChunk(cx, cz, chunk);
      }).catch(err => {
        console.warn(`[JardVoxel] WorkerPool chunk generation failed for (${cx},${cz}), falling back to sync:`, err.message);
        this.pendingChunks.delete(key);
        if (this.chunks.has(key)) return;
        const chunk = VoxelChunk.acquire(cx, cz, this.world);
        chunk.generate();
        this.chunks.set(key, chunk);
        this._buildMeshForChunk(cx, cz, chunk);
      });
      return;
    }

    // Fallback: synchronous generation
    const chunk = VoxelChunk.acquire(cx, cz, this.world);
    chunk.generate();
    this.chunks.set(key, chunk);
    this._buildMeshForChunk(cx, cz, chunk);
  }

  rebuildChunkMesh(cx, cz) {
    const key = this._chunkKey(cx, cz);
    const chunk = this.chunks.get(key);
    if (!chunk) return;

    // Remove old meshes
    const oldMesh = this.meshes.get(key);
    if (oldMesh) {
      this.scene.remove(oldMesh);
      oldMesh.geometry.dispose();
      this.meshes.delete(key);
    }
    const oldWater = this.waterMeshes.get(key);
    if (oldWater) {
      this.scene.remove(oldWater);
      oldWater.geometry.dispose();
      this.waterMeshes.delete(key);
    }

    // Rebuild using shared helper
    this._buildMeshForChunk(cx, cz, chunk);
  }

  unloadChunk(cx, cz) {
    const key = this._chunkKey(cx, cz);
    const mesh = this.meshes.get(key);
    if (mesh) { this.scene.remove(mesh); mesh.geometry.dispose(); this.meshes.delete(key); }
    const wmesh = this.waterMeshes.get(key);
    if (wmesh) { this.scene.remove(wmesh); wmesh.geometry.dispose(); this.waterMeshes.delete(key); }
    const chunk = this.chunks.get(key);
    if (chunk) VoxelChunk.release(chunk);
    this.chunks.delete(key);
    // SPEC-CHUNK-OPT: cancel any in-flight generation for this chunk — without
    // this, a stale worker response could still land after unload (player flew
    // away and back) and silently resurrect a chunk that was just released.
    if (this.pendingChunks.has(key)) {
      this.pendingChunks.delete(key);
      if (this._workerPool) this._workerPool.cancelChunk(cx, cz);
    }
    this._heightmaps.delete(key);
  }

  // SPEC-CHUNK-OPT: (Re)builds the chunk generation queue from scratch for
  // the current render disc, sorted by view-direction-aware priority. Only
  // called from update() when the disc actually needs re-evaluating.
  _fullChunkScan(pcx, pcz, renderDist, cameraYaw, hasCamera) {
    this._chunkGenQueue = [];
    for (let dx = -renderDist; dx <= renderDist; dx++) {
      for (let dz = -renderDist; dz <= renderDist; dz++) {
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > renderDist) continue;
        const cx = pcx + dx, cz = pcz + dz;
        const key = this._chunkKey(cx, cz);
        if (this.chunks.has(key) || this.pendingChunks.has(key)) continue;
        const priority = _chunkGenPriority(dx, dz, dist, cameraYaw, hasCamera);
        this._chunkGenQueue.push({ cx, cz, dist, priority });
      }
    }
    this._chunkGenQueue.sort((a, b) => a.priority - b.priority);
    this._queueReadIdx = 0;
  }

  update(playerX, playerZ, camera, fps) {
    const pcx = Math.floor(playerX / CHUNK_SIZE);
    const pcz = Math.floor(playerZ / CHUNK_SIZE);
    this._playerCX = pcx;
    this._playerCZ = pcz;

    // SPEC-CHUNK-OPT: Adaptive render distance — capped by user setting.
    // A change here flips the ROUNDED renderDist integer, which triggers a
    // full chunk-queue rescan + unload sweep (see rdChanged below) — without
    // a cooldown, avgFps sitting right at the 30/55 threshold (the adaptive
    // system's natural steady state, since it's designed to hover at the fps
    // target) could nudge _adaptiveRenderDist every single time update() ran
    // (every ~150ms, per chunkMgr.update's caller), constantly flipping the
    // rounded value and re-triggering generation/unload for the chunks at
    // the render-distance edge — visible as terrain endlessly reloading.
    // Mirrors the modern engine's SPEC-HORIZON-FIX (1.5s cooldown).
    const maxDist = this.renderDistance || RENDER_DIST;
    const nowTs = performance.now();
    if (fps !== undefined) {
      this._fpsHistory.push(fps);
      if (this._fpsHistory.length > 60) this._fpsHistory.shift();
      if (this._fpsHistory.length >= 30 && nowTs >= (this._adaptiveCooldownUntil || 0)) {
        const avgFps = this._fpsHistory.reduce((a, b) => a + b, 0) / this._fpsHistory.length;
        if (avgFps < 30 && this._adaptiveRenderDist > 3) {
          this._adaptiveRenderDist = Math.max(3, this._adaptiveRenderDist - 0.5);
          this._adaptiveCooldownUntil = nowTs + 1500;
        } else if (avgFps > 55 && this._adaptiveRenderDist < maxDist) {
          this._adaptiveRenderDist = Math.min(maxDist, this._adaptiveRenderDist + 0.2);
          this._adaptiveCooldownUntil = nowTs + 1500;
        }
      }
    }
    const renderDist = Math.min(Math.round(this._adaptiveRenderDist), maxDist);

    // SPEC-CHUNK-OPT: Camera direction for view-direction chunk prioritization
    let cameraYaw = 0;
    const hasCamera = !!camera;
    if (hasCamera) {
      if (!this._tmpCamDir) this._tmpCamDir = new THREE.Vector3();
      camera.getWorldDirection(this._tmpCamDir);
      cameraYaw = Math.atan2(this._tmpCamDir.x, this._tmpCamDir.z);
    }

    // SPEC-CHUNK-OPT: Incremental chunk queue — only rescan the render disc
    // (and sweep for chunks to unload) when something that actually affects
    // it changed: first frame, a chunk-boundary crossing, or a render-
    // distance change. This used to rebuild + sort a ~(2*renderDist+1)^2
    // candidate array and walk every loaded chunk to check for unloads EVERY
    // frame, even standing still with nothing to do — same pattern already
    // fixed in the modern engine (SPEC-117).
    const chunkChanged = this._lastQueuePCX !== pcx || this._lastQueuePCZ !== pcz;
    const rdChanged = this._lastQueueRD !== renderDist;
    if (this._lastQueuePCX === null || chunkChanged || rdChanged) {
      this._fullChunkScan(pcx, pcz, renderDist, cameraYaw, hasCamera);

      // Unload distant chunks — only worth sweeping right after a boundary
      // crossing or render-distance change, not every frame.
      for (const key of this.chunks.keys()) {
        const chunk = this.chunks.get(key);
        const dx = chunk.cx - pcx, dz = chunk.cz - pcz;
        if (Math.sqrt(dx * dx + dz * dz) > renderDist + 1) {
          this.unloadChunk(chunk.cx, chunk.cz);
        }
      }
    } else if (this._queueReadIdx >= this._chunkGenQueue.length) {
      // Queue drained and nothing changed — nothing left to do until the
      // player moves or renderDist changes.
      this._chunkGenQueue = [];
      this._queueReadIdx = 0;
    }
    this._lastQueuePCX = pcx;
    this._lastQueuePCZ = pcz;
    this._lastQueueRD = renderDist;

    // SPEC-CHUNK-OPT: Generate up to 3 per frame (more budget with a camera present)
    const genBudget = camera ? 3 : 2;
    let dispatched = 0;
    while (this._queueReadIdx < this._chunkGenQueue.length && dispatched < genBudget) {
      const candidate = this._chunkGenQueue[this._queueReadIdx++];
      const key = this._chunkKey(candidate.cx, candidate.cz);
      if (this.chunks.has(key) || this.pendingChunks.has(key)) continue; // stale — generated/pending since scan
      this.generateChunk(candidate.cx, candidate.cz, candidate.priority);
      dispatched++;
    }

    // SPEC-CHUNK-OPT: Visibility used to be hand-managed here in two layers:
    // a single-point frustum test (removed earlier for popping fully-
    // generated terrain invisible on any small look-around — the XZ center
    // of a 16x64x16 chunk at a fixed y=CHUNK_HEIGHT/2 could flip outside the
    // frustum while most of the mesh was still on screen), and heightmap-
    // based occlusion culling (hide a chunk if some intermediate chunk's
    // AVERAGE height was 5+ blocks taller). The occlusion heuristic never
    // accounted for the player's actual eye height or the real terrain
    // shape in between — just a coarse per-chunk average sampled at
    // whichever intermediate chunk happened to round to — so it kept
    // mis-hiding terrain that was legitimately in view, worse depending on
    // exactly where the player stood (a valley vs a hill crest gives very
    // different results for the same target chunk). That's what kept
    // reproducing as "chunks disappear when I aim at them, fine again
    // higher up." Both are gone now; visibility is left entirely to THREE's
    // own automatic per-mesh frustum culling (correct — uses the real
    // geometry bounds) plus the GPU's normal depth test for anything
    // actually behind a hill — pixel-accurate, no heuristics, no more
    // popping.

    // SPEC-036: Update point lights for torches/lanterns near player
    this._updatePointLights(playerX, camera ? camera.position.y : 0, playerZ);
  }

  // SPEC-036: Find nearest torch/lantern blocks and assign PointLights
  _updatePointLights(px, py, pz) {
    const candidates = [];
    const pcx = Math.floor(px / CHUNK_SIZE);
    const pcz = Math.floor(pz / CHUNK_SIZE);

    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        const key = this._chunkKey(pcx + dx, pcz + dz);
        const chunk = this.chunks.get(key);
        if (!chunk) continue;
        // Scan chunk for emissive blocks (torch, lantern)
        for (let i = 0; i < chunk.blocks.length; i++) {
          const b = chunk.blocks[i];
          if (b !== BLOCKS.TORCH && b !== BLOCKS.LANTERN) continue;
          const x = i % CHUNK_SIZE;
          const y = Math.floor(i / (CHUNK_SIZE * CHUNK_SIZE));
          const z = Math.floor(i / CHUNK_SIZE) % CHUNK_SIZE;
          const wx = chunk.cx * CHUNK_SIZE + x;
          const wz = chunk.cz * CHUNK_SIZE + z;
          const dist = (wx - px) ** 2 + (y - py) ** 2 + (wz - pz) ** 2;
          candidates.push({ x: wx + 0.5, y: y + 0.7, z: wz + 0.5, dist });
        }
      }
    }

    candidates.sort((a, b) => a.dist - b.dist);

    for (let i = 0; i < this.pointLights.length; i++) {
      const pl = this.pointLights[i];
      if (i < candidates.length && candidates[i].dist < 144) { // within 12 blocks
        pl.position.set(candidates[i].x, candidates[i].y, candidates[i].z);
        pl.intensity = 1.5;
        pl.visible = true;
      } else {
        pl.visible = false;
        pl.intensity = 0;
      }
    }
  }

  // Get block at world coordinates
  getBlock(wx, wy, wz) {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return BLOCKS.AIR;
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const key = this._chunkKey(cx, cz);
    const chunk = this.chunks.get(key);
    if (!chunk) return BLOCKS.AIR;
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk.getBlock(lx, wy, lz);
  }

  // Set block at world coordinates (player interaction)
  setBlock(wx, wy, wz, block) {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return;
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const key = this._chunkKey(cx, cz);
    const chunk = this.chunks.get(key);
    if (!chunk) return;
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    chunk.setBlock(lx, wy, lz, block);
    this.rebuildChunkMesh(cx, cz);

    // Rebuild neighbor chunks if on border
    if (lx === 0) this.rebuildChunkMesh(cx - 1, cz);
    if (lx === CHUNK_SIZE - 1) this.rebuildChunkMesh(cx + 1, cz);
    if (lz === 0) this.rebuildChunkMesh(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) this.rebuildChunkMesh(cx, cz + 1);
  }

  // Check collision at world position
  isSolidAt(wx, wy, wz) {
    const b = this.getBlock(Math.floor(wx), Math.floor(wy), Math.floor(wz));
    if (b === BLOCKS.AIR || b === BLOCKS.WATER || b === BLOCKS.LAVA) return false;
    // Vegetation + non-solid blocks (walk-through)
    if (b === BLOCKS.FERN || b === BLOCKS.DEAD_BUSH || b === BLOCKS.FLOWER_RED || b === BLOCKS.FLOWER_YELLOW || b === BLOCKS.TALL_GRASS || b === BLOCKS.TORCH || b === BLOCKS.BAMBOO) return false;
    return true;
  }

  getChunkCount() { return this.chunks.size + this.pendingChunks.size; }

  // Animate water waves — called each frame from game loop
  updateWaterWaves(dt) {
    this.waterTime += dt;
    const t = this.waterTime;
    for (const wmesh of this.waterMeshes.values()) {
      const offsets = wmesh.userData.waveOffsets;
      if (!offsets) continue;
      const posAttr = wmesh.geometry.getAttribute('position');
      const base = wmesh.userData.basePositions;
      const arr = posAttr.array;
      const count = arr.length / 3;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const bx = offsets[i3];
        const by = offsets[i3 + 1];
        const bz = offsets[i3 + 2];
        // Wave: two superposed sine waves for organic motion
        const wave = Math.sin(bx * 0.3 + t * 1.5) * 0.08 + Math.sin(bz * 0.2 + t * 1.2) * 0.06;
        arr[i3 + 1] = by + wave;
      }
      posAttr.needsUpdate = true;
      wmesh.geometry.computeVertexNormals();
    }
  }

  dispose() {
    if (this._workerPool) { this._workerPool.dispose(); this._workerPool = null; }
    for (const mesh of this.meshes.values()) { this.scene.remove(mesh); mesh.geometry.dispose(); }
    for (const wmesh of this.waterMeshes.values()) { this.scene.remove(wmesh); wmesh.geometry.dispose(); }
    for (const pl of this.pointLights) { this.scene.remove(pl); }
    this.meshes.clear();
    this.waterMeshes.clear();
    this.chunks.clear();
  }
}
