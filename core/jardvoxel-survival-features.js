// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Features — Trees, ores, structures, decoration
// SPEC-002: World features for voxel-style engine
// ═══════════════════════════════════════════════════════════

import {
  CHUNK_SIZE, CHUNK_HEIGHT, WORLD_MIN_Y, SEA_LEVEL,
  BIOMES, WorldGenPipeline, VoxelChunk,
} from './jardvoxel-survival-engine.js';
import { MC_BLOCKS, BLOCK, VEGETATION_BLOCKS, TREE_DETAIL_BLOCKS } from './blocks-registry.js';
import { PRNG } from './jardvoxel-survival-engine.js';
import { NetherGenerator } from './jardvoxel-survival-nether.js';
import { generateTree, getTreeTypeForBiome, TREE_TYPES } from './jardvoxel-survival-tree-personality.js';
import { biomeIdentityManager } from './jardvoxel-survival-biome-identity.js';
import { generateNarrativeStructure, getStructureDescription, STRUCTURE_TYPES } from './jardvoxel-survival-narrative-structures.js';
import { PoissonDiskSampler } from './jardvoxel-survival-poisson.js';

// ═══════════════════════════════════════════════════════════
// Ore generation — vein-based, depth-dependent
// ═══════════════════════════════════════════════════════════

const ORE_CONFIG = {
  [MC_BLOCKS.COAL_ORE]:    { minY: WORLD_MIN_Y + 10, maxY: 128, rarity: 0.08, veinSize: 12 },
  [MC_BLOCKS.IRON_ORE]:    { minY: WORLD_MIN_Y + 5,  maxY: 72,  rarity: 0.06, veinSize: 8 },
  [MC_BLOCKS.GOLD_ORE]:    { minY: WORLD_MIN_Y + 5,  maxY: 32,  rarity: 0.02, veinSize: 6 },
  [MC_BLOCKS.DIAMOND_ORE]: { minY: WORLD_MIN_Y + 5,  maxY: 16,  rarity: 0.008, veinSize: 4 },
};

export function generateOres(chunk, world) {
  // Zen2: no ore veins — nothing underground to mine toward, keeps digging calm/plain
  if (world.generator && world.generator._worldMode === 'zen2') return;
  const ox = chunk.cx * CHUNK_SIZE;
  const oz = chunk.cz * CHUNK_SIZE;
  const rng = new PRNG(chunk.cx * 73856093 ^ chunk.cz * 19349663);

  for (const [oreId, cfg] of Object.entries(ORE_CONFIG)) {
    const id = parseInt(oreId);
    const attempts = Math.floor(cfg.rarity * 100);
    for (let a = 0; a < attempts; a++) {
      const cx = Math.floor(rng.next() * CHUNK_SIZE);
      const cz = Math.floor(rng.next() * CHUNK_SIZE);
      const cy = Math.floor(rng.next() * (cfg.maxY - cfg.minY)) + cfg.minY - WORLD_MIN_Y;
      if (cy < 0 || cy >= CHUNK_HEIGHT) continue;

      const veinSize = Math.floor(rng.next() * cfg.veinSize) + 1;
      for (let v = 0; v < veinSize; v++) {
        const dx = Math.floor((rng.next() - 0.5) * 3);
        const dy = Math.floor((rng.next() - 0.5) * 3);
        const dz = Math.floor((rng.next() - 0.5) * 3);
        const x = cx + dx, y = cy + dy, z = cz + dz;
        if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) continue;
        if (y < 0 || y >= CHUNK_HEIGHT) continue;
        const idx = x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
        if (chunk.blocks[idx] === BLOCK.STONE) {
          chunk.blocks[idx] = id;
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
// Tree generation — 4 types by biome
// ═══════════════════════════════════════════════════════════

function findSurfaceY(chunk, world, x, z) {
  const worldX = chunk.cx * CHUNK_SIZE + x;
  const worldZ = chunk.cz * CHUNK_SIZE + z;
  const baseHeight = world.generator.getBaseHeight(worldX, worldZ);
  const startY = Math.min(CHUNK_HEIGHT - 1, Math.ceil(baseHeight) + 16 - WORLD_MIN_Y);
  for (let y = startY; y >= 0; y--) {
    const block = chunk.getBlock(x, y, z);
    if (block !== BLOCK.AIR && block !== BLOCK.WATER) {
      return y;
    }
  }
  return -1;
}

const _treePoisson = new PoissonDiskSampler(42);
const _treePoissonCache = new Map();

export function generateTrees(chunk, world, densityMod = 1.0) {
  if (world._poissonEnabled === false) return;
  const ox = chunk.cx * CHUNK_SIZE;
  const oz = chunk.cz * CHUNK_SIZE;
  const rng = new PRNG(chunk.cx * 1234567 ^ chunk.cz * 7654321 + 999);

  const cacheKey = `${chunk.cx},${chunk.cz}`;
  let points = _treePoissonCache.get(cacheKey);
  if (!points) {
    points = _treePoisson.sampleChunk(CHUNK_SIZE, 3, 30, ox, oz);
    if (_treePoissonCache.size > 200) _treePoissonCache.clear();
    _treePoissonCache.set(cacheKey, points);
  }

  for (const pt of points) {
    // SPEC-111: Apply scene density modifier
    if (densityMod < 1.0 && rng.next() > densityMod) continue;
    const x = Math.floor(pt.x);
    const z = Math.floor(pt.z);
    if (x < 2 || x >= CHUNK_SIZE - 2 || z < 2 || z >= CHUNK_SIZE - 2) continue;

    const surfaceY = findSurfaceY(chunk, world, x, z);
    if (surfaceY < 0 || surfaceY < SEA_LEVEL - WORLD_MIN_Y) continue;

    const worldX = ox + x;
    const worldZ = oz + z;
    const biome = world.getBiome(worldX, worldZ);

    const treeType = getTreeTypeForBiome(biome);
    if (!treeType) continue;

    const treeChance = biomeIdentityManager.getTreeChance(biome);
    if (rng.next() > treeChance) continue;

    const surfaceBlock = chunk.getBlock(x, surfaceY, z);
    if (surfaceBlock !== BLOCK.GRASS && surfaceBlock !== BLOCK.DIRT && surfaceBlock !== BLOCK.MUD) continue;

    generateTree(chunk, x, surfaceY + 1, z, treeType, worldX, worldZ, rng);
  }
}

function setBlockSafe(chunk, x, y, z, block, force = false) {
  if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return;
  if (y < 0 || y >= CHUNK_HEIGHT) return;
  const idx = x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
  const existing = chunk.blocks[idx];
  if (force) {
    chunk.blocks[idx] = block;
  } else if (existing === BLOCK.AIR) {
    chunk.blocks[idx] = block;
  } else {
    const isLog = block === MC_BLOCKS.OAK_LOG || block === MC_BLOCKS.BIRCH_LOG || block === MC_BLOCKS.SPRUCE_LOG || block === MC_BLOCKS.JUNGLE_LOG;
    const isLeaf = block === MC_BLOCKS.OAK_LEAVES || block === MC_BLOCKS.BIRCH_LEAVES || block === MC_BLOCKS.SPRUCE_LEAVES || block === MC_BLOCKS.JUNGLE_LEAVES;
    if (isLog && (existing === BLOCK.AIR || existing === MC_BLOCKS.OAK_LEAVES || existing === MC_BLOCKS.BIRCH_LEAVES || existing === MC_BLOCKS.SPRUCE_LEAVES || existing === MC_BLOCKS.JUNGLE_LEAVES || existing === BLOCK.WATER)) {
      chunk.blocks[idx] = block;
    } else if (isLeaf) {
      chunk.blocks[idx] = block;
    }
  }
}

function placeOakTree(chunk, x, y, z, rng) {
  const height = 4 + Math.floor(rng.next() * 3);
  for (let i = 0; i < height; i++) {
    setBlockSafe(chunk, x, y + i, z, MC_BLOCKS.OAK_LOG);
  }
  const top = y + height;
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      for (let dy = -1; dy <= 1; dy++) {
        const dist = Math.abs(dx) + Math.abs(dz) + Math.abs(dy);
        if (dist > 3) continue;
        if (dx === 0 && dz === 0 && dy < 1) continue;
        setBlockSafe(chunk, x + dx, top + dy, z + dz, MC_BLOCKS.OAK_LEAVES);
      }
    }
  }
  setBlockSafe(chunk, x, top + 1, z, MC_BLOCKS.OAK_LEAVES);
}

function placeBirchTree(chunk, x, y, z, rng) {
  const height = 5 + Math.floor(rng.next() * 3);
  for (let i = 0; i < height; i++) {
    setBlockSafe(chunk, x, y + i, z, MC_BLOCKS.BIRCH_LOG);
  }
  const top = y + height;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dy = 0; dy <= 2; dy++) {
        if (Math.abs(dx) + Math.abs(dz) > 1 && dy < 2) continue;
        if (dx === 0 && dz === 0) continue;
        setBlockSafe(chunk, x + dx, top + dy - 1, z + dz, MC_BLOCKS.BIRCH_LEAVES);
      }
    }
  }
  setBlockSafe(chunk, x, top + 1, z, MC_BLOCKS.BIRCH_LEAVES);
}

function placeSpruceTree(chunk, x, y, z, rng) {
  const height = 6 + Math.floor(rng.next() * 4);
  for (let i = 0; i < height; i++) {
    setBlockSafe(chunk, x, y + i, z, MC_BLOCKS.SPRUCE_LOG);
  }
  // Conical canopy
  for (let layer = 0; layer < 4; layer++) {
    const ly = y + height - 1 - layer * 2;
    const radius = layer === 0 ? 1 : 2;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        if (Math.abs(dx) + Math.abs(dz) > radius + 1) continue;
        if (dx === 0 && dz === 0) continue;
        setBlockSafe(chunk, x + dx, ly, z + dz, MC_BLOCKS.SPRUCE_LEAVES);
      }
    }
  }
  setBlockSafe(chunk, x, y + height, z, MC_BLOCKS.SPRUCE_LEAVES);
}

function placeJungleTree(chunk, x, y, z, rng) {
  const height = 8 + Math.floor(rng.next() * 5);
  // 2x2 trunk
  for (let i = 0; i < height; i++) {
    setBlockSafe(chunk, x, y + i, z, MC_BLOCKS.JUNGLE_LOG);
    setBlockSafe(chunk, x + 1, y + i, z, MC_BLOCKS.JUNGLE_LOG);
    setBlockSafe(chunk, x, y + i, z + 1, MC_BLOCKS.JUNGLE_LOG);
    setBlockSafe(chunk, x + 1, y + i, z + 1, MC_BLOCKS.JUNGLE_LOG);
  }
  const top = y + height;
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      for (let dy = -2; dy <= 1; dy++) {
        const dist = Math.abs(dx) + Math.abs(dz) + Math.abs(dy);
        if (dist > 4) continue;
        if (Math.abs(dx) <= 1 && Math.abs(dz) <= 1 && dy < 1) continue;
        setBlockSafe(chunk, x + dx, top + dy, z + dz, MC_BLOCKS.JUNGLE_LEAVES);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
// Decoration — flowers, grass, cactus, dead bushes
// ═══════════════════════════════════════════════════════════

export function generateDecoration(chunk, world, densityMod = 1.0) {
  const ox = chunk.cx * CHUNK_SIZE;
  const oz = chunk.cz * CHUNK_SIZE;
  const rng = new PRNG(chunk.cx * 98765 ^ chunk.cz * 43210 + 555);
  const flowerMod = densityMod;

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const surfaceY = findSurfaceY(chunk, world, x, z);
      if (surfaceY < 0) continue;

      const worldX = ox + x;
      const worldZ = oz + z;
      const biome = world.getBiome(worldX, worldZ);
      const surfaceBlock = chunk.getBlock(x, surfaceY, z);
      const placeY = surfaceY + 1;

      if (placeY >= CHUNK_HEIGHT) continue;

      switch (biome) {
        case BIOMES.PLAINS:
        case BIOMES.MEADOW:
          if (rng.next() < 0.05) setBlockSafe(chunk, x, placeY, z, MC_BLOCKS.TALL_GRASS);
          if (rng.next() < 0.02 * flowerMod) setBlockSafe(chunk, x, placeY, z, MC_BLOCKS.FLOWER_RED);
          if (rng.next() < 0.02 * flowerMod) setBlockSafe(chunk, x, placeY, z, MC_BLOCKS.FLOWER_YELLOW);
          if (rng.next() < 0.01 * flowerMod) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.FLOWER_WHITE);
          if (rng.next() < 0.01 * flowerMod) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.FLOWER_ORANGE);
          if (rng.next() < 0.01 * flowerMod) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.FLOWER_SUNFLOWER);
          if (rng.next() < 0.005 * flowerMod) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.BERRY_BUSH);
          break;
        case BIOMES.FOREST:
          if (rng.next() < 0.06) setBlockSafe(chunk, x, placeY, z, MC_BLOCKS.TALL_GRASS);
          if (rng.next() < 0.03) setBlockSafe(chunk, x, placeY, z, MC_BLOCKS.FERN);
          if (rng.next() < 0.02) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.MUSHROOM_BROWN);
          if (rng.next() < 0.01) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.FLOWER_PURPLE);
          if (rng.next() < 0.01) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.BERRY_BUSH);
          if (rng.next() < 0.015) placeBush(chunk, x, placeY, z, rng);
          if (rng.next() < 0.008) placeFallenLog(chunk, x, placeY, z, rng);
          break;
        case BIOMES.DESERT:
          if (rng.next() < 0.02) setBlockSafe(chunk, x, placeY, z, MC_BLOCKS.DEAD_BUSH);
          if (rng.next() < 0.01) {
            const cactusHeight = 1 + Math.floor(rng.next() * 3);
            for (let c = 0; c < cactusHeight; c++) {
              setBlockSafe(chunk, x, placeY + c, z, MC_BLOCKS.CACTUS);
            }
          }
          break;
        case BIOMES.SAVANNA:
          if (rng.next() < 0.03) setBlockSafe(chunk, x, placeY, z, MC_BLOCKS.TALL_GRASS);
          if (rng.next() < 0.01) setBlockSafe(chunk, x, placeY, z, MC_BLOCKS.DEAD_BUSH);
          if (rng.next() < 0.01) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.FLOWER_YELLOW);
          break;
        case BIOMES.SWAMP:
          if (rng.next() < 0.04) setBlockSafe(chunk, x, placeY, z, MC_BLOCKS.MOSS);
          if (rng.next() < 0.02) setBlockSafe(chunk, x, placeY, z, MC_BLOCKS.FERN);
          if (rng.next() < 0.03) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.VINES);
          if (surfaceBlock === BLOCK.WATER && rng.next() < 0.08) {
            setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.LILY_PAD);
          }
          break;
        case BIOMES.TAIGA:
          if (rng.next() < 0.03) setBlockSafe(chunk, x, placeY, z, MC_BLOCKS.FERN);
          if (rng.next() < 0.01) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.MUSHROOM_RED);
          if (rng.next() < 0.008) placeFallenLog(chunk, x, placeY, z, rng);
          break;
        case BIOMES.JUNGLE:
          if (rng.next() < 0.08) setBlockSafe(chunk, x, placeY, z, MC_BLOCKS.TALL_GRASS);
          if (rng.next() < 0.03) setBlockSafe(chunk, x, placeY, z, MC_BLOCKS.FLOWER_RED);
          if (rng.next() < 0.02) setBlockSafe(chunk, x, placeY, z, MC_BLOCKS.BAMBOO);
          if (rng.next() < 0.04) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.VINES);
          if (rng.next() < 0.02) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.MUSHROOM_BROWN);
          if (rng.next() < 0.01) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.FLOWER_ORANGE);
          if (rng.next() < 0.02) placeBush(chunk, x, placeY, z, rng);
          break;
        case BIOMES.SNOWY_PLAINS:
          if (rng.next() < 0.02) setBlockSafe(chunk, x, placeY, z, MC_BLOCKS.SNOW_BLOCK);
          if (rng.next() < 0.005) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.FLOWER_WHITE);
          break;
        case BIOMES.CHERRY_GROVE:
          if (rng.next() < 0.04) setBlockSafe(chunk, x, placeY, z, MC_BLOCKS.TALL_GRASS);
          if (rng.next() < 0.03) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.FLOWER_PINK);
          if (rng.next() < 0.02) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.FLOWER_LILY);
          if (rng.next() < 0.01) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.BERRY_BUSH);
          break;
        case BIOMES.MYSTIC_GROVE:
          if (rng.next() < 0.04) setBlockSafe(chunk, x, placeY, z, MC_BLOCKS.TALL_GRASS);
          if (rng.next() < 0.03) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.MUSHROOM_RED);
          if (rng.next() < 0.02) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.MUSHROOM_BROWN);
          if (rng.next() < 0.02) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.FLOWER_PURPLE);
          break;
        case BIOMES.AUTUMN_FOREST:
          if (rng.next() < 0.06) setBlockSafe(chunk, x, placeY, z, MC_BLOCKS.TALL_GRASS);
          if (rng.next() < 0.03) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.FLOWER_ORANGE);
          if (rng.next() < 0.02) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.FLOWER_TULIP);
          if (rng.next() < 0.02) setBlockSafe(chunk, x, placeY, z, MC_BLOCKS.FERN);
          if (rng.next() < 0.01) setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.BERRY_BUSH);
          if (rng.next() < 0.015) placeBush(chunk, x, placeY, z, rng);
          if (rng.next() < 0.008) placeFallenLog(chunk, x, placeY, z, rng);
          break;
        case BIOMES.OCEAN:
        case BIOMES.DEEP_OCEAN:
          if (surfaceBlock === BLOCK.WATER && rng.next() < 0.02) {
            setBlockSafe(chunk, x, placeY, z, VEGETATION_BLOCKS.CORAL_FAN);
          }
          break;
      }
    }
  }
}

function placeBush(chunk, x, y, z, rng) {
  const bushBlock = TREE_DETAIL_BLOCKS.BUSH;
  setBlockSafe(chunk, x, y, z, bushBlock);
  setBlockSafe(chunk, x + 1, y, z, bushBlock);
  setBlockSafe(chunk, x - 1, y, z, bushBlock);
  setBlockSafe(chunk, x, y, z + 1, bushBlock);
  setBlockSafe(chunk, x, y, z - 1, bushBlock);
  setBlockSafe(chunk, x, y + 1, z, bushBlock);
  if (rng.next() < 0.3) {
    setBlockSafe(chunk, x + 1, y + 1, z, bushBlock);
  }
  if (rng.next() < 0.3) {
    setBlockSafe(chunk, x, y + 1, z + 1, bushBlock);
  }
  if (rng.next() < 0.2) {
    setBlockSafe(chunk, x, y + 1, z, VEGETATION_BLOCKS.BERRY_BUSH);
  }
}

function placeFallenLog(chunk, x, y, z, rng) {
  const logBlock = rng.next() < 0.5 ? MC_BLOCKS.OAK_LOG : MC_BLOCKS.SPRUCE_LOG;
  const len = 2 + Math.floor(rng.next() * 3);
  const dir = rng.next() < 0.5 ? 'x' : 'z';
  if (dir === 'x') {
    for (let i = 0; i < len; i++) {
      setBlockSafe(chunk, x + i, y, z, logBlock);
    }
    if (rng.next() < 0.4) setBlockSafe(chunk, x, y + 1, z, MC_BLOCKS.MOSS);
    if (rng.next() < 0.3) setBlockSafe(chunk, x + len - 1, y + 1, z, VEGETATION_BLOCKS.MUSHROOM_BROWN);
  } else {
    for (let i = 0; i < len; i++) {
      setBlockSafe(chunk, x, y, z + i, logBlock);
    }
    if (rng.next() < 0.4) setBlockSafe(chunk, x, y + 1, z, MC_BLOCKS.MOSS);
    if (rng.next() < 0.3) setBlockSafe(chunk, x, y + 1, z + len - 1, VEGETATION_BLOCKS.MUSHROOM_BROWN);
  }
}

// ═══════════════════════════════════════════════════════════
// Structure generation — villages, temples
// ═══════════════════════════════════════════════════════════

export function generateStructures(chunk, world) {
  const ox = chunk.cx * CHUNK_SIZE;
  const oz = chunk.cz * CHUNK_SIZE;
  const rng = new PRNG(chunk.cx * 31337 ^ chunk.cz * 1337 + 42);

  // One structure attempt per chunk
  if (rng.next() > 0.08) return;

  // Find center surface
  const cx = Math.floor(CHUNK_SIZE / 2);
  const cz = Math.floor(CHUNK_SIZE / 2);
  const surfaceY = findSurfaceY(chunk, world, cx, cz);
  if (surfaceY < 0 || surfaceY < SEA_LEVEL - WORLD_MIN_Y) return;

  const worldX = ox + cx;
  const worldZ = oz + cz;
  const biome = world.getBiome(worldX, worldZ);
  const worldSeed = world.seed || 0;

  // INT-003: Map biome+roll to narrative structure type
  let narrativeType = null;
  const structureRoll = rng.next();
  if (biome === BIOMES.PLAINS || biome === BIOMES.SAVANNA || biome === BIOMES.MEADOW) {
    if (structureRoll < 0.4) {
      placeVillageHouse(chunk, cx, surfaceY + 1, cz, rng);
      narrativeType = STRUCTURE_TYPES.VILLAGE;
    } else if (structureRoll < 0.6) {
      placeWell(chunk, cx, surfaceY + 1, cz);
    } else if (structureRoll < 0.75) {
      narrativeType = STRUCTURE_TYPES.CAMP;
    } else if (structureRoll < 0.85) {
      narrativeType = STRUCTURE_TYPES.RUINED_TOWER;
    }
  } else if (biome === BIOMES.DESERT) {
    if (structureRoll < 0.3) {
      placeDesertTemple(chunk, cx, surfaceY + 1, cz);
      narrativeType = STRUCTURE_TYPES.ANCIENT_TEMPLE;
    } else if (structureRoll < 0.5) {
      placeWell(chunk, cx, surfaceY + 1, cz);
    } else if (structureRoll < 0.6) {
      narrativeType = STRUCTURE_TYPES.ARCHAEOLOGICAL_SITE;
    }
  } else if (biome === BIOMES.JUNGLE) {
    if (structureRoll < 0.2) {
      placeJungleTemple(chunk, cx, surfaceY + 1, cz);
      narrativeType = STRUCTURE_TYPES.ANCIENT_TEMPLE;
    } else if (structureRoll < 0.3) {
      narrativeType = STRUCTURE_TYPES.LIBRARY;
    }
  } else if (biome === BIOMES.OCEAN || biome === BIOMES.DEEP_OCEAN) {
    if (structureRoll < 0.15) {
      placeOceanMonument(chunk, cx, surfaceY + 1, cz);
      narrativeType = STRUCTURE_TYPES.SHIPWRECK;
    }
  } else if (biome === BIOMES.MOUNTAINS || biome === BIOMES.SNOWY_PEAKS || biome === BIOMES.STONY_PEAKS) {
    if (structureRoll < 0.15) {
      narrativeType = STRUCTURE_TYPES.OBSERVATORY;
    } else if (structureRoll < 0.25) {
      narrativeType = STRUCTURE_TYPES.CASTLE_RUINS;
    }
  } else if (biome === BIOMES.FOREST || biome === BIOMES.TAIGA || biome === BIOMES.CHERRY_GROVE) {
    if (structureRoll < 0.1) {
      narrativeType = STRUCTURE_TYPES.MINESHAFT;
    } else if (structureRoll < 0.15) {
      narrativeType = STRUCTURE_TYPES.LIBRARY;
    }
  }

  // INT-003: Generate narrative metadata and attach to chunk
  if (narrativeType) {
    const narrative = generateNarrativeStructure(narrativeType, chunk.cx, chunk.cz, worldSeed);
    if (!chunk.narrativeStructures) chunk.narrativeStructures = [];
    chunk.narrativeStructures.push({
      ...narrative,
      worldX,
      worldZ,
      worldY: surfaceY + WORLD_MIN_Y + 1,
    });
  }
}

function placeVillageHouse(chunk, x, y, z, rng) {
  const w = 5 + Math.floor(rng.next() * 2);
  const h = 3;
  const d = 4 + Math.floor(rng.next() * 2);

  // Foundation + walls
  for (let dx = 0; dx < w; dx++) {
    for (let dz = 0; dz < d; dz++) {
      for (let dy = 0; dy < h; dy++) {
        if (dx === 0 || dx === w - 1 || dz === 0 || dz === d - 1) {
          setBlockSafe(chunk, x + dx - Math.floor(w / 2), y + dy, z + dz - Math.floor(d / 2), MC_BLOCKS.PLANKS);
        } else if (dy === 0) {
          setBlockSafe(chunk, x + dx - Math.floor(w / 2), y + dy, z + dz - Math.floor(d / 2), MC_BLOCKS.PLANKS);
        }
      }
    }
  }

  // Door
  setBlockSafe(chunk, x, y + 1, z - Math.floor(d / 2), BLOCK.AIR);
  setBlockSafe(chunk, x, y, z - Math.floor(d / 2), BLOCK.AIR);

  // Windows
  setBlockSafe(chunk, x - Math.floor(w / 2), y + 1, z, MC_BLOCKS.GLASS);
  setBlockSafe(chunk, x + Math.floor(w / 2), y + 1, z, MC_BLOCKS.GLASS);

  // Roof
  for (let dx = -1; dx < w + 1; dx++) {
    for (let dz = -1; dz < d + 1; dz++) {
      setBlockSafe(chunk, x + dx - Math.floor(w / 2), y + h, z + dz - Math.floor(d / 2), MC_BLOCKS.COBBLESTONE);
    }
  }
  // Roof peak
  for (let dx = 0; dx < w; dx++) {
    setBlockSafe(chunk, x + dx - Math.floor(w / 2), y + h + 1, z - Math.floor(d / 2), MC_BLOCKS.COBBLESTONE);
    setBlockSafe(chunk, x + dx - Math.floor(w / 2), y + h + 1, z + Math.floor(d / 2) - 1, MC_BLOCKS.COBBLESTONE);
  }
}

function placeWell(chunk, x, y, z) {
  const radius = 2;
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      const dist = Math.abs(dx) + Math.abs(dz);
      if (dist <= radius) {
        if (dist < radius) {
          setBlockSafe(chunk, x + dx, y, z + dz, BLOCK.WATER, true);
        } else {
          setBlockSafe(chunk, x + dx, y, z + dz, MC_BLOCKS.COBBLESTONE, true);
          setBlockSafe(chunk, x + dx, y + 1, z + dz, MC_BLOCKS.COBBLESTONE, true);
          setBlockSafe(chunk, x + dx, y + 2, z + dz, MC_BLOCKS.COBBLESTONE, true);
        }
      }
    }
  }
}

function placeDesertTemple(chunk, x, y, z) {
  // Pyramid base 7x7
  for (let level = 0; level < 4; level++) {
    const size = 7 - level * 2;
    for (let dx = 0; dx < size; dx++) {
      for (let dz = 0; dz < size; dz++) {
        setBlockSafe(chunk, x + dx - Math.floor(size / 2), y + level, z + dz - Math.floor(size / 2), MC_BLOCKS.SANDSTONE);
      }
    }
  }
  // Top
  setBlockSafe(chunk, x, y + 4, z, MC_BLOCKS.SANDSTONE);
  setBlockSafe(chunk, x, y + 5, z, MC_BLOCKS.SANDSTONE);
}

function placeJungleTemple(chunk, x, y, z) {
  const w = 7, d = 7, h = 5;
  for (let dx = 0; dx < w; dx++) {
    for (let dz = 0; dz < d; dz++) {
      for (let dy = 0; dy < h; dy++) {
        if (dx === 0 || dx === w - 1 || dz === 0 || dz === d - 1 || dy === 0 || dy === h - 1) {
          setBlockSafe(chunk, x + dx - 3, y + dy, z + dz - 3, MC_BLOCKS.MOSSY_COBBLE);
        }
      }
    }
  }
  // Entrance
  setBlockSafe(chunk, x, y + 1, z - 3, BLOCK.AIR);
  setBlockSafe(chunk, x, y + 2, z - 3, BLOCK.AIR);
}

function placeOceanMonument(chunk, x, y, z) {
  const w = 7, d = 7, h = 4;
  for (let dx = 0; dx < w; dx++) {
    for (let dz = 0; dz < d; dz++) {
      for (let dy = 0; dy < h; dy++) {
        if (dx === 0 || dx === w - 1 || dz === 0 || dz === d - 1 || dy === 0 || dy === h - 1) {
          setBlockSafe(chunk, x + dx - 3, y + dy, z + dz - 3, MC_BLOCKS.COBBLESTONE);
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
// Full chunk generation pipeline with features
// ═══════════════════════════════════════════════════════════

export function generateChunkWithFeatures(chunk, world) {
  if (world.dimension === 'nether') {
    if (!chunk.generated) _generateNetherChunk(chunk, world);
    return;
  }
  chunk.generate();

  // PRD P-02: Apply hydrology block modifications (rivers, lakes, waterfalls)
  const hierarchy = world.generator?.hierarchy;
  if (hierarchy && hierarchy.hydrology) {
    const ctx = hierarchy.getChunkContext(chunk.cx, chunk.cz);
    if (ctx && ctx.hydroData) {
      const getBlock = (x, y, z) => {
        if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return 0;
        if (y < 0 || y >= CHUNK_HEIGHT) return 0;
        return chunk.blocks[x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE];
      };
      const setBlock = (x, y, z, block) => {
        if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return;
        if (y < 0 || y >= CHUNK_HEIGHT) return;
        chunk.blocks[x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE] = block;
      };
      hierarchy.hydrology.applyToChunk(chunk, ctx.hydroData, getBlock, setBlock);
    }
  }

  generateOres(chunk, world);
  generateTrees(chunk, world);
  generateDecoration(chunk, world);
  generateStructures(chunk, world);
  // Update maxContentY after features (trees/decoration may add blocks above surface)
  _updateContentYRange(chunk);
}

// Quick scan above stored maxContentY to find any feature-added blocks.
// Bounded to FEATURE_HEIGHT_MARGIN above the prior surface: trees/decoration/
// structures never place blocks taller than that, so scanning further up to
// CHUNK_HEIGHT (384) was pure wasted work on every single chunk generated.
const FEATURE_HEIGHT_MARGIN = 64;
function _updateContentYRange(chunk) {
  if (chunk.maxContentY === undefined) return;
  const stride = CHUNK_SIZE * CHUNK_SIZE;
  const startY = chunk.maxContentY + 1;
  const endY = Math.min(CHUNK_HEIGHT, startY + FEATURE_HEIGHT_MARGIN);
  let newMax = chunk.maxContentY;
  for (let y = startY; y < endY; y++) {
    const base = y * stride;
    for (let i = 0; i < stride; i++) {
      if (chunk.blocks[base + i] !== 0) { newMax = y; break; }
    }
  }
  chunk.maxContentY = newMax;
}

// v7.0: Hierarchical chunk generation with features using ChunkContext
export function generateChunkHierarchical(chunk, world, context) {
  if (!context) {
    generateChunkWithFeatures(chunk, world);
    return;
  }

  // Base terrain generation (v6.0 still handles block placement)
  chunk.generate();

  // PRD P-02: Apply hydrology block modifications (rivers, lakes, waterfalls)
  if (context.hydroData) {
    const getBlock = (x, y, z) => {
      if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return 0;
      if (y < 0 || y >= CHUNK_HEIGHT) return 0;
      return chunk.blocks[x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE];
    };
    const setBlock = (x, y, z, block) => {
      if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return;
      if (y < 0 || y >= CHUNK_HEIGHT) return;
      chunk.blocks[x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE] = block;
    };
    // Use the hydrology instance from the hierarchy generator
    const hydrology = world.generator?.hierarchy?.hydrology;
    if (hydrology) {
      hydrology.applyToChunk(chunk, context.hydroData, getBlock, setBlock);
    }
  }

  // v7.0: Use context for feature placement
  // Features use hierarchy data for coherent distribution
  generateOres(chunk, world);

  // Trees: use ecosystem/tree density from context
  // SPEC-111: Apply scene tree density modifier
  if (context.region && context.region.treeDensity > 0.05) {
    const sceneTreeMod = context.scene ? context.scene.treeDensityMod : 1.0;
    if (context.region.treeDensity * sceneTreeMod > 0.05) {
      generateTrees(chunk, world, sceneTreeMod);
    }
  }

  // Decoration: use zone microDetail multiplier
  // SPEC-111: Apply scene flower density modifier
  const sceneFlowerMod = context.scene ? context.scene.flowerDensityMod : 1.0;
  generateDecoration(chunk, world, sceneFlowerMod);

  // Structures: use contextual placement rules
  generateStructures(chunk, world);
  _updateContentYRange(chunk);
}

function _generateNetherChunk(chunk, world) {
  const gen = world.netherGenerator || new NetherGenerator();
  const data = gen.generateChunk(chunk.cx, chunk.cz);
  const size = data.size;
  const height = data.height;
  for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++) {
      for (let y = 0; y < height && y < CHUNK_HEIGHT; y++) {
        const idx = x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
        chunk.blocks[idx] = data.blocks[x + z * size + y * size * size];
      }
    }
  }
  chunk.generated = true;
}

// Extend VoxelChunk with setBlock for gameplay
VoxelChunk.prototype.setBlock = function(x, y, z, block) {
  if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return;
  if (y < 0 || y >= CHUNK_HEIGHT) return;
  const idx = x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
  this.blocks[idx] = block;
};

// Extend VoxelChunk to support extended block types
const originalBlockTypeToId = VoxelChunk.prototype.blockTypeToId;
VoxelChunk.prototype.blockTypeToId = function(type) {
  const extended = {
    'air': 0, 'stone': 1, 'grass': 2, 'dirt': 3, 'sand': 4,
    'water': 5, 'lava': 6, 'snow': 7, 'mud': 8,
    'oak_log': 9, 'oak_leaves': 10, 'birch_log': 11, 'birch_leaves': 12,
    'spruce_log': 13, 'spruce_leaves': 14, 'jungle_log': 15, 'jungle_leaves': 16,
    'coal_ore': 17, 'iron_ore': 18, 'gold_ore': 19, 'diamond_ore': 20,
    'cobblestone': 21, 'planks': 22, 'glass': 23, 'bricks': 24,
    'torch': 25, 'lantern': 26, 'cactus': 27, 'flower_red': 28,
    'flower_yellow': 29, 'tall_grass': 30, 'fern': 31, 'dead_bush': 32,
    'mossy_cobble': 33, 'sandstone': 34, 'gravel': 35, 'clay': 36,
    'obsidian': 37, 'bedrock': 38, 'snow_block': 39, 'ice': 40,
    'packed_ice': 41, 'mycelium': 42, 'moss': 43, 'bamboo': 44,
    'granite': 45, 'andesite': 46, 'diorite': 47,
    'bookshelf': 48, 'pumpkin': 49, 'melon': 50,
    'crafting_table': 51, 'stick': 52, 'furnace': 53,
    'netherrack': 110, 'nether_brick': 111, 'soul_sand': 112,
    'glowstone': 113, 'nether_quartz_ore': 114, 'lava_nether': 115,
    'portal': 116, 'quartz': 117, 'blaze_rod': 118, 'nether_wart': 119,
    'redstone_dust': 120, 'redstone_torch': 121, 'lever': 122,
    'piston': 123, 'redstone_lamp': 124, 'redstone_repeater': 125,
    'brewing_stand': 126, 'glass_bottle': 127, 'cauldron': 128,
    'water_bottle': 129, 'awkward_potion': 130, 'potion_speed': 131,
    'potion_strength': 132, 'potion_healing': 133, 'potion_night_vision': 134,
    'potion_fire_resistance': 135, 'potion_regeneration': 136,
    'splash_potion_healing': 137, 'potion_water_breathing': 138,
    'blaze_powder': 139, 'sugar': 140,
    'shield': 151, 'banner': 152,
    'anvil': 153,
    'map': 154, 'compass': 155, 'cartography_table': 156,
  };
  return extended[type] ?? 0;
};
