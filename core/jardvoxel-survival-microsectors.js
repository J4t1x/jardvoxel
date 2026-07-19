// ═══════════════════════════════════════════════════════════
// JardVoxel 7.0 — Microsector Generator (Level 6)
// SPEC-105: Fine-grained decoration per 4x4 sector within chunks
// ═══════════════════════════════════════════════════════════

import { SimplexNoise, FastNoiseLite, FN_NOISE_TYPE, FN_CELLULAR_RETURN } from './jardvoxel-survival-noise.js';
import { BIOMES, ZONE_TYPES, CHUNK_SIZE } from './jardvoxel-survival-world-hierarchy.js';

const SECTOR_SIZE = 4; // 4x4 blocks per sector
// SECTORS_PER_SIDE derived lazily from CHUNK_SIZE to avoid circular-dep TDZ
// (world-hierarchy.js imports this module before CHUNK_SIZE is initialized).
function sectorsPerSide() { return CHUNK_SIZE / SECTOR_SIZE; }

// Decoration types mapped to block IDs
const DECORATION_BLOCKS = {
  flowers: [
    { block: 'FLOWER_RED', weight: 0.5 },
    { block: 'FLOWER_YELLOW', weight: 0.3 },
    { block: 'TALL_GRASS', weight: 0.2 },
  ],
  mushrooms: [
    { block: 'MUSHROOM_BROWN', weight: 0.6 },
    { block: 'MUSHROOM_RED', weight: 0.4 },
  ],
  rocks: [
    { block: 'COBBLESTONE', weight: 0.7 },
    { block: 'STONE', weight: 0.3 },
  ],
  moss: [
    { block: 'MOSS_BLOCK', weight: 1.0 },
  ],
  bushes: [
    { block: 'FERN', weight: 0.6 },
    { block: 'TALL_GRASS', weight: 0.4 },
  ],
  fallen_leaves: [
    { block: 'LEAVES', weight: 1.0 },
  ],
  dead_bush: [
    { block: 'DEAD_BUSH', weight: 1.0 },
  ],
  bamboo: [
    { block: 'BAMBOO', weight: 1.0 },
  ],
  none: [],
};

// Biome → decoration type mapping
// Built lazily on first use to avoid circular-dependency evaluation order
// (world-hierarchy.js imports this module before its BIOMES const is initialized).
let _BIOME_DECORATION = null;
function getBiomeDecoration() {
  if (!_BIOME_DECORATION) {
    _BIOME_DECORATION = {
      [BIOMES.PLAINS]: { primary: 'flowers', secondary: 'bushes', density: 0.08 },
      [BIOMES.FOREST]: { primary: 'mushrooms', secondary: 'moss', density: 0.15 },
      [BIOMES.JUNGLE]: { primary: 'bushes', secondary: 'bamboo', density: 0.20 },
      [BIOMES.TAIGA]: { primary: 'moss', secondary: 'mushrooms', density: 0.10 },
      [BIOMES.SWAMP]: { primary: 'mushrooms', secondary: 'moss', density: 0.18 },
      [BIOMES.DESERT]: { primary: 'dead_bush', secondary: 'rocks', density: 0.04 },
      [BIOMES.SAVANNA]: { primary: 'dead_bush', secondary: 'bushes', density: 0.06 },
      [BIOMES.MEADOW]: { primary: 'flowers', secondary: 'flowers', density: 0.25 },
      [BIOMES.CHERRY_GROVE]: { primary: 'flowers', secondary: 'fallen_leaves', density: 0.20 },
      [BIOMES.AUTUMN_FOREST]: { primary: 'fallen_leaves', secondary: 'mushrooms', density: 0.18 },
      [BIOMES.SNOWY_PLAINS]: { primary: 'none', secondary: 'none', density: 0.01 },
      [BIOMES.MOUNTAINS]: { primary: 'rocks', secondary: 'none', density: 0.05 },
      [BIOMES.STONY_PEAKS]: { primary: 'rocks', secondary: 'none', density: 0.08 },
      [BIOMES.BEACH]: { primary: 'none', secondary: 'rocks', density: 0.02 },
      [BIOMES.ZEN_GARDEN]: { primary: 'moss', secondary: 'rocks', density: 0.12 },
      [BIOMES.BAMBOO_GROVE]: { primary: 'bamboo', secondary: 'bushes', density: 0.22 },
      [BIOMES.AURORA_TUNDRA]: { primary: 'none', secondary: 'moss', density: 0.03 },
      [BIOMES.MYSTIC_GROVE]: { primary: 'mushrooms', secondary: 'flowers', density: 0.15 },
    };
  }
  return _BIOME_DECORATION;
}

// Zone decoration multipliers (lazy for same circular-dep reason)
let _ZONE_DECORATION_MULT = null;
function getZoneDecorationMult() {
  if (!_ZONE_DECORATION_MULT) {
    _ZONE_DECORATION_MULT = {
      [ZONE_TYPES.CLEARING]: 2.0,
      [ZONE_TYPES.MEADOW]: 2.5,
      [ZONE_TYPES.DENSE_FOREST]: 1.5,
      [ZONE_TYPES.GROVE]: 1.8,
      [ZONE_TYPES.LAKE]: 0.3,
      [ZONE_TYPES.CLIFFS]: 0.2,
      [ZONE_TYPES.GORGE]: 0.1,
      [ZONE_TYPES.WETLANDS]: 1.3,
      [ZONE_TYPES.DEFAULT]: 1.0,
    };
  }
  return _ZONE_DECORATION_MULT;
}

export class MicrosectorGenerator {
  constructor(seed) {
    this.seed = seed;
    this.detailNoise = new SimplexNoise(seed + 14000);
    // G-03: Cellular F1 noise for organic clearing boundaries
    this._clearingNoise = new FastNoiseLite(seed + 14001);
    this._clearingNoise.setNoiseType(FN_NOISE_TYPE.CELLULAR);
    this._clearingNoise.setCellularReturnType(FN_CELLULAR_RETURN.F1);
  }

  // Generate microsector decorations for a chunk
  generateMicrosectors(chunk, context, placeBlockFn) {
    const { biomeWeights, zone, ox, oz } = context;
    const primaryBiome = this._getPrimaryBiome(biomeWeights);
    const biomeDeco = getBiomeDecoration()[primaryBiome] || getBiomeDecoration()[BIOMES.PLAINS];
    const zoneMult = getZoneDecorationMult()[zone.type] || 1.0;
    const baseDensity = biomeDeco.density * zoneMult * (context.vegetationBoost || 1.0);

    // Dead code above kept for reference — correct loop below
    const SECTORS_PER_SIDE = sectorsPerSide();
    for (let sx = 0; sx < SECTORS_PER_SIDE; sx++) {
      for (let sz = 0; sz < SECTORS_PER_SIDE; sz++) {
        // G-03: Use cellular F1 for organic clearing boundaries
        const sectorHash = this._clearingNoise.cellular2D(
          (ox + sx * SECTOR_SIZE) * 0.03,
          (oz + sz * SECTOR_SIZE) * 0.03
        );
        const sectorDensity = baseDensity * (0.5 + sectorHash * 0.5);

        // Pick decoration type for this sector
        const useSecondary = sectorHash > 0.6;
        const decoType = useSecondary ? biomeDeco.secondary : biomeDeco.primary;
        const decoBlocks = DECORATION_BLOCKS[decoType] || [];

        if (decoBlocks.length === 0) continue;

        // Place decorations within the 4x4 sector
        for (let bx = 0; bx < SECTOR_SIZE; bx++) {
          for (let bz = 0; bz < SECTOR_SIZE; bz++) {
            const wx = ox + sx * SECTOR_SIZE + bx;
            const wz = oz + sz * SECTOR_SIZE + bz;
            const blockHash = this._hash(wx * 31, wz * 17);

            if (blockHash < sectorDensity) {
              // Pick block from weighted list
              const blockType = this._pickBlock(decoBlocks, blockHash);
              if (blockType && placeBlockFn) {
                placeBlockFn(wx, wz, blockType);
              }
            }
          }
        }
      }
    }
  }

  // Generate micro elevation offsets (±1 block)
  getMicroElevation(cx, cz, lx, lz) {
    const wx = cx * CHUNK_SIZE + lx;
    const wz = cz * CHUNK_SIZE + lz;
    return Math.round(this.detailNoise.noise2D(wx * 0.05, wz * 0.05) * 1.5);
  }

  _getPrimaryBiome(biomeWeights) {
    let maxWeight = 0;
    let primary = BIOMES.PLAINS;
    for (const [biome, weight] of biomeWeights) {
      if (weight > maxWeight) {
        maxWeight = weight;
        primary = biome;
      }
    }
    return primary;
  }

  _pickBlock(blocks, hash) {
    let cumulative = 0;
    for (const { block, weight } of blocks) {
      cumulative += weight;
      if (hash < cumulative) return block;
    }
    return blocks[0]?.block || null;
  }

  _hash(x, z) {
    const h = ((x * 374761393 + z * 668265263) ^ 0x5BF03625) & 0x7FFFFFFF;
    return h / 0x7FFFFFFF;
  }
}
