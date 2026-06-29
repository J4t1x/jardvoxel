// ═══════════════════════════════════════════════════════════
// SPEC-077: Tree Personality System
// Parametric tree generation with age, health, and variation.
// 10 tree types with unique silhouettes.
// ═══════════════════════════════════════════════════════════

import { MC_BLOCKS, BLOCK } from './blocks-registry.js';
import { BIOMES } from './jardvoxel-survival-engine.js';
import { TREE_SHAPES } from './jardvoxel-survival-biome-identity.js';

export const TREE_TYPES = {
  OAK: 'oak',
  PINE: 'pine',
  MANGROVE: 'mangrove',
  DEAD: 'dead',
  ACACIA: 'acacia',
  GIANT: 'giant',
  BIRCH: 'birch',
  CHERRY: 'cherry',
  MYSTIC_MUSHROOM: 'mystic_mushroom',
  AUTUMN_OAK: 'autumn_oak',
  BAMBOO: 'bamboo',
};

export const AGE_LEVELS = {
  YOUNG: 'young',
  MATURE: 'mature',
  OLD: 'old',
};

export const HEALTH_LEVELS = {
  ALIVE: 'alive',
  DYING: 'dying',
  DEAD: 'dead',
};

const BIOME_TREE_MAP = {
  [BIOMES.FOREST]: TREE_TYPES.OAK,
  [BIOMES.PLAINS]: TREE_TYPES.OAK,
  [BIOMES.JUNGLE]: TREE_TYPES.MANGROVE,
  [BIOMES.TAIGA]: TREE_TYPES.PINE,
  [BIOMES.SNOWY_PLAINS]: TREE_TYPES.PINE,
  [BIOMES.MEADOW]: TREE_TYPES.BIRCH,
  [BIOMES.CHERRY_GROVE]: TREE_TYPES.CHERRY,
  [BIOMES.SWAMP]: TREE_TYPES.OAK,
  [BIOMES.SAVANNA]: TREE_TYPES.ACACIA,
  [BIOMES.MYSTIC_GROVE]: TREE_TYPES.MYSTIC_MUSHROOM,
  [BIOMES.AUTUMN_FOREST]: TREE_TYPES.AUTUMN_OAK,
  [BIOMES.MOUNTAINS]: TREE_TYPES.PINE,
  // SPEC-099: Wellness biomes
  [BIOMES.BAMBOO_GROVE]: TREE_TYPES.BAMBOO,
  [BIOMES.AURORA_TUNDRA]: TREE_TYPES.PINE,
  // zen_garden has no trees (TREE_SHAPES.NONE)
};

const GIANT_CHANCE = 0.0008;

function hashPos(x, y, z) {
  return ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
}

function getTreeParams(worldX, worldZ, rng) {
  const hash = hashPos(worldX, 0, worldZ);
  const ageRoll = (hash % 100) / 100;
  const healthRoll = ((hash >> 7) % 100) / 100;
  const variation = ((hash >> 13) % 360) * Math.PI / 180;

  let age = AGE_LEVELS.MATURE;
  if (ageRoll < 0.25) age = AGE_LEVELS.YOUNG;
  else if (ageRoll > 0.75) age = AGE_LEVELS.OLD;

  let health = HEALTH_LEVELS.ALIVE;
  if (healthRoll > 0.92) health = HEALTH_LEVELS.DEAD;
  else if (healthRoll > 0.78) health = HEALTH_LEVELS.DYING;

  return { age, health, variation, rng: rng || { next: () => (hash % 1000) / 1000 } };
}

function getAgeMultiplier(age) {
  switch (age) {
    case AGE_LEVELS.YOUNG: return 0.6;
    case AGE_LEVELS.OLD: return 1.3;
    default: return 1.0;
  }
}

function getHealthLeafChance(health) {
  switch (health) {
    case HEALTH_LEVELS.DEAD: return 0;
    case HEALTH_LEVELS.DYING: return 0.4;
    default: return 1.0;
  }
}

function setBlockSafe(chunk, x, y, z, block) {
  if (x < 0 || x >= 16 || z < 0 || z >= 16) return;
  if (y < 0 || y >= 384) return;
  const idx = x + z * 16 + y * 16 * 16;
  const existing = chunk.blocks[idx];
  if (existing === BLOCK.AIR || existing === BLOCK.WATER) {
    chunk.blocks[idx] = block;
  }
}

function placeOak(chunk, x, y, z, params) {
  const ageMult = getAgeMultiplier(params.age);
  const leafChance = getHealthLeafChance(params.health);
  const height = Math.floor((4 + Math.floor(params.rng.next() * 3)) * ageMult);
  const logBlock = MC_BLOCKS.OAK_LOG;
  const leafBlock = params.health === HEALTH_LEVELS.DEAD ? null : MC_BLOCKS.OAK_LEAVES;

  for (let i = 0; i < height; i++) {
    setBlockSafe(chunk, x, y + i, z, logBlock);
  }
  if (!leafBlock) return;

  const top = y + height;
  const crownRadius = Math.floor(2 * ageMult);
  for (let dx = -crownRadius; dx <= crownRadius; dx++) {
    for (let dz = -crownRadius; dz <= crownRadius; dz++) {
      for (let dy = -1; dy <= 1; dy++) {
        const dist = Math.abs(dx) + Math.abs(dz) + Math.abs(dy);
        if (dist > crownRadius + 1) continue;
        if (dx === 0 && dz === 0 && dy < 1) continue;
        if (params.rng.next() < leafChance) {
          setBlockSafe(chunk, x + dx, top + dy, z + dz, leafBlock);
        }
      }
    }
  }
  setBlockSafe(chunk, x, top + 1, z, leafBlock);
}

function placePine(chunk, x, y, z, params) {
  const ageMult = getAgeMultiplier(params.age);
  const leafChance = getHealthLeafChance(params.health);
  const height = Math.floor((6 + Math.floor(params.rng.next() * 6)) * ageMult);
  const logBlock = MC_BLOCKS.SPRUCE_LOG;
  const leafBlock = params.health === HEALTH_LEVELS.DEAD ? null : MC_BLOCKS.SPRUCE_LEAVES;

  for (let i = 0; i < height; i++) {
    setBlockSafe(chunk, x, y + i, z, logBlock);
  }
  if (!leafBlock) return;

  const layers = Math.floor(4 * ageMult);
  for (let layer = 0; layer < layers; layer++) {
    const ly = y + height - 1 - layer * 2;
    const radius = layer === 0 ? 1 : 2;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        if (Math.abs(dx) + Math.abs(dz) > radius + 1) continue;
        if (dx === 0 && dz === 0) continue;
        if (params.rng.next() < leafChance) {
          setBlockSafe(chunk, x + dx, ly, z + dz, leafBlock);
        }
      }
    }
  }
  setBlockSafe(chunk, x, y + height, z, leafBlock);
}

function placeMangrove(chunk, x, y, z, params) {
  const ageMult = getAgeMultiplier(params.age);
  const leafChance = getHealthLeafChance(params.health);
  const rootHeight = 3 + Math.floor(params.rng.next() * 3);
  const trunkHeight = Math.floor((5 + Math.floor(params.rng.next() * 4)) * ageMult);
  const logBlock = MC_BLOCKS.JUNGLE_LOG;
  const leafBlock = params.health === HEALTH_LEVELS.DEAD ? null : MC_BLOCKS.JUNGLE_LEAVES;

  for (let i = 0; i < rootHeight; i++) {
    setBlockSafe(chunk, x, y + i, z, logBlock);
    if (i > 0) {
      setBlockSafe(chunk, x + 1, y + i, z, logBlock);
      setBlockSafe(chunk, x, y + i, z + 1, logBlock);
    }
  }
  for (let i = rootHeight; i < rootHeight + trunkHeight; i++) {
    setBlockSafe(chunk, x, y + i, z, logBlock);
  }
  if (!leafBlock) return;

  const top = y + rootHeight + trunkHeight;
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      for (let dy = -2; dy <= 1; dy++) {
        const dist = Math.abs(dx) + Math.abs(dz) + Math.abs(dy);
        if (dist > 4) continue;
        if (Math.abs(dx) <= 1 && Math.abs(dz) <= 1 && dy < 1) continue;
        if (params.rng.next() < leafChance) {
          setBlockSafe(chunk, x + dx, top + dy, z + dz, leafBlock);
        }
      }
    }
  }
}

function placeDead(chunk, x, y, z, params) {
  const height = 3 + Math.floor(params.rng.next() * 4);
  for (let i = 0; i < height; i++) {
    setBlockSafe(chunk, x, y + i, z, MC_BLOCKS.OAK_LOG);
  }
  const top = y + height;
  for (let i = 0; i < 3; i++) {
    const dx = Math.floor((params.rng.next() - 0.5) * 4);
    const dy = Math.floor(params.rng.next() * 3);
    const dz = Math.floor((params.rng.next() - 0.5) * 4);
    setBlockSafe(chunk, x + dx, top + dy, z + dz, MC_BLOCKS.OAK_LOG);
  }
}

function placeAcacia(chunk, x, y, z, params) {
  const ageMult = getAgeMultiplier(params.age);
  const leafChance = getHealthLeafChance(params.health);
  const height = Math.floor((3 + Math.floor(params.rng.next() * 2)) * ageMult);
  const logBlock = MC_BLOCKS.OAK_LOG;
  const leafBlock = params.health === HEALTH_LEVELS.DEAD ? null : MC_BLOCKS.OAK_LEAVES;

  for (let i = 0; i < height; i++) {
    setBlockSafe(chunk, x, y + i, z, logBlock);
  }
  if (!leafBlock) return;

  const top = y + height;
  const crownRadius = Math.floor(3 * ageMult);
  for (let dx = -crownRadius; dx <= crownRadius; dx++) {
    for (let dz = -crownRadius; dz <= crownRadius; dz++) {
      if (Math.abs(dx) + Math.abs(dz) > crownRadius + 1) continue;
      if (dx === 0 && dz === 0) continue;
      if (params.rng.next() < leafChance) {
        setBlockSafe(chunk, x + dx, top, z + dz, leafBlock);
        setBlockSafe(chunk, x + dx, top + 1, z + dz, leafBlock);
      }
    }
  }
}

function placeGiant(chunk, x, y, z, params) {
  const height = 20 + Math.floor(params.rng.next() * 10);
  for (let i = 0; i < height; i++) {
    for (let dx = 0; dx < 4; dx++) {
      for (let dz = 0; dz < 4; dz++) {
        setBlockSafe(chunk, x + dx, y + i, z + dz, MC_BLOCKS.OAK_LOG);
      }
    }
  }
  const top = y + height;
  const crownRadius = 5;
  for (let dx = -crownRadius; dx <= crownRadius + 3; dx++) {
    for (let dz = -crownRadius; dz <= crownRadius + 3; dz++) {
      for (let dy = -2; dy <= 3; dy++) {
        const dist = Math.abs(dx) + Math.abs(dz) + Math.abs(dy);
        if (dist > crownRadius + 3) continue;
        setBlockSafe(chunk, x + dx, top + dy, z + dz, MC_BLOCKS.OAK_LEAVES);
      }
    }
  }
}

function placeBirch(chunk, x, y, z, params) {
  const ageMult = getAgeMultiplier(params.age);
  const leafChance = getHealthLeafChance(params.health);
  const height = Math.floor((5 + Math.floor(params.rng.next() * 3)) * ageMult);
  const logBlock = MC_BLOCKS.BIRCH_LOG;
  const leafBlock = params.health === HEALTH_LEVELS.DEAD ? null : MC_BLOCKS.BIRCH_LEAVES;

  for (let i = 0; i < height; i++) {
    setBlockSafe(chunk, x, y + i, z, logBlock);
  }
  if (!leafBlock) return;

  const top = y + height;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dy = 0; dy <= 2; dy++) {
        if (Math.abs(dx) + Math.abs(dz) > 1 && dy < 2) continue;
        if (dx === 0 && dz === 0) continue;
        if (params.rng.next() < leafChance) {
          setBlockSafe(chunk, x + dx, top + dy - 1, z + dz, leafBlock);
        }
      }
    }
  }
  setBlockSafe(chunk, x, top + 1, z, leafBlock);
}

function placeCherry(chunk, x, y, z, params) {
  const ageMult = getAgeMultiplier(params.age);
  const leafChance = getHealthLeafChance(params.health);
  const height = Math.floor((4 + Math.floor(params.rng.next() * 2)) * ageMult);

  for (let i = 0; i < height; i++) {
    setBlockSafe(chunk, x, y + i, z, MC_BLOCKS.OAK_LOG);
  }
  if (params.health === HEALTH_LEVELS.DEAD) return;

  const top = y + height;
  const crownRadius = Math.floor(2 * ageMult);
  for (let dx = -crownRadius; dx <= crownRadius; dx++) {
    for (let dz = -crownRadius; dz <= crownRadius; dz++) {
      for (let dy = 0; dy <= crownRadius; dy++) {
        const dist = Math.sqrt(dx * dx + dz * dz + dy * dy);
        if (dist > crownRadius) continue;
        if (dx === 0 && dz === 0 && dy === 0) continue;
        if (params.rng.next() < leafChance) {
          setBlockSafe(chunk, x + dx, top + dy, z + dz, MC_BLOCKS.OAK_LEAVES);
        }
      }
    }
  }
}

function placeMysticMushroom(chunk, x, y, z, params) {
  const ageMult = getAgeMultiplier(params.age);
  const height = Math.floor((8 + Math.floor(params.rng.next() * 7)) * ageMult);

  for (let i = 0; i < height; i++) {
    setBlockSafe(chunk, x, y + i, z, MC_BLOCKS.OAK_LOG);
  }
  if (params.health === HEALTH_LEVELS.DEAD) return;

  const top = y + height;
  const capRadius = Math.floor(4 * ageMult);
  for (let dx = -capRadius; dx <= capRadius; dx++) {
    for (let dz = -capRadius; dz <= capRadius; dz++) {
      for (let dy = 0; dy <= 2; dy++) {
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > capRadius) continue;
        setBlockSafe(chunk, x + dx, top + dy, z + dz, MC_BLOCKS.OAK_LEAVES);
      }
    }
  }
}

function placeAutumnOak(chunk, x, y, z, params) {
  const ageMult = getAgeMultiplier(params.age);
  const leafChance = getHealthLeafChance(params.health);
  const height = Math.floor((4 + Math.floor(params.rng.next() * 3)) * ageMult);

  for (let i = 0; i < height; i++) {
    setBlockSafe(chunk, x, y + i, z, MC_BLOCKS.OAK_LOG);
  }
  if (params.health === HEALTH_LEVELS.DEAD) return;

  const top = y + height;
  const crownRadius = Math.floor(2 * ageMult);
  for (let dx = -crownRadius; dx <= crownRadius; dx++) {
    for (let dz = -crownRadius; dz <= crownRadius; dz++) {
      for (let dy = -1; dy <= 1; dy++) {
        const dist = Math.abs(dx) + Math.abs(dz) + Math.abs(dy);
        if (dist > crownRadius + 1) continue;
        if (dx === 0 && dz === 0 && dy < 1) continue;
        if (params.rng.next() < leafChance) {
          setBlockSafe(chunk, x + dx, top + dy, z + dz, MC_BLOCKS.OAK_LEAVES);
        }
      }
    }
  }
  setBlockSafe(chunk, x, top + 1, z, MC_BLOCKS.OAK_LEAVES);
}

// SPEC-099: Bamboo stalk generator for bamboo_grove biome
function placeBamboo(chunk, x, y, z, params) {
  const ageMult = getAgeMultiplier(params.age);
  const height = Math.floor((8 + Math.floor(params.rng.next() * 5)) * ageMult);

  for (let i = 0; i < height; i++) {
    setBlockSafe(chunk, x, y + i, z, MC_BLOCKS.OAK_LOG);
  }
  if (params.health === HEALTH_LEVELS.DEAD) return;

  const top = y + height;
  const leafChance = getHealthLeafChance(params.health);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (Math.abs(dx) + Math.abs(dz) > 1) continue;
      if (dx === 0 && dz === 0) continue;
      if (params.rng.next() < leafChance) {
        setBlockSafe(chunk, x + dx, top, z + dz, MC_BLOCKS.OAK_LEAVES);
        setBlockSafe(chunk, x + dx, top + 1, z + dz, MC_BLOCKS.OAK_LEAVES);
      }
    }
  }
  setBlockSafe(chunk, x, top + 1, z, MC_BLOCKS.OAK_LEAVES);
}

const TREE_GENERATORS = {
  [TREE_TYPES.OAK]: placeOak,
  [TREE_TYPES.PINE]: placePine,
  [TREE_TYPES.MANGROVE]: placeMangrove,
  [TREE_TYPES.DEAD]: placeDead,
  [TREE_TYPES.ACACIA]: placeAcacia,
  [TREE_TYPES.GIANT]: placeGiant,
  [TREE_TYPES.BIRCH]: placeBirch,
  [TREE_TYPES.CHERRY]: placeCherry,
  [TREE_TYPES.MYSTIC_MUSHROOM]: placeMysticMushroom,
  [TREE_TYPES.AUTUMN_OAK]: placeAutumnOak,
  [TREE_TYPES.BAMBOO]: placeBamboo,
};

export function getTreeTypeForBiome(biome) {
  return BIOME_TREE_MAP[biome] || null;
}

export function generateTree(chunk, x, y, z, treeType, worldX, worldZ, rng) {
  const params = getTreeParams(worldX, worldZ, rng);

  if (rng.next() < GIANT_CHANCE) {
    treeType = TREE_TYPES.GIANT;
  }

  const generator = TREE_GENERATORS[treeType];
  if (generator) {
    generator(chunk, x, y, z, params);
  }

  return { type: treeType, ...params };
}

export function getTreeParamsForPosition(worldX, worldZ) {
  return getTreeParams(worldX, worldZ, null);
}

export { TREE_GENERATORS, GIANT_CHANCE };
