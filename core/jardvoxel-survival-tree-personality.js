// ═══════════════════════════════════════════════════════════
// SPEC-077: Tree Personality System
// Parametric tree generation with age, health, and variation.
// 10 tree types with unique silhouettes.
// ═══════════════════════════════════════════════════════════

import { MC_BLOCKS, BLOCK, TREE_DETAIL_BLOCKS, VEGETATION_BLOCKS } from './blocks-registry.js';
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

function placeBranch(chunk, x, y, z, dx, dz, length, logBlock) {
  for (let i = 1; i <= length; i++) {
    setBlockSafe(chunk, x + dx * i, y, z + dz * i, logBlock);
  }
  setBlockSafe(chunk, x + dx * length, y + 1, z + dz * length, logBlock);
}

function placeRoots(chunk, x, y, z, rng) {
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  for (const [dx, dz] of dirs) {
    if (rng.next() < 0.55) {
      setBlockSafe(chunk, x + dx, y, z + dz, TREE_DETAIL_BLOCKS.ROOT);
      if (rng.next() < 0.3 && y > 0) {
        setBlockSafe(chunk, x + dx, y - 1, z + dz, TREE_DETAIL_BLOCKS.ROOT);
      }
    }
  }
}

function placeLeafLayer(chunk, x, y, z, radius, leafBlock, rng, leafChance, gapChance) {
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      if (Math.abs(dx) + Math.abs(dz) > radius + 1) continue;
      if (dx === 0 && dz === 0) continue;
      if (rng.next() < gapChance) continue;
      if (rng.next() < leafChance) {
        setBlockSafe(chunk, x + dx, y, z + dz, leafBlock);
      }
    }
  }
}

function placeOak(chunk, x, y, z, params) {
  const ageMult = getAgeMultiplier(params.age);
  const leafChance = getHealthLeafChance(params.health);
  const height = Math.floor((4 + Math.floor(params.rng.next() * 3)) * ageMult);
  const isOld = params.age === AGE_LEVELS.OLD;
  const logBlock = MC_BLOCKS.OAK_LOG;
  const leafBlock = params.health === HEALTH_LEVELS.DEAD ? null :
    isOld ? TREE_DETAIL_BLOCKS.DARK_OAK_LEAVES : MC_BLOCKS.OAK_LEAVES;

  if (isOld) placeRoots(chunk, x, y, z, params.rng);

  for (let i = 0; i < height; i++) {
    setBlockSafe(chunk, x, y + i, z, logBlock);
    if (isOld && i < 2) {
      setBlockSafe(chunk, x + 1, y + i, z, logBlock);
      setBlockSafe(chunk, x, y + i, z + 1, logBlock);
    }
  }
  if (!leafBlock) return;

  const top = y + height;
  const crownRadius = Math.floor(2 * ageMult);
  const gapChance = params.health === HEALTH_LEVELS.DYING ? 0.3 : 0.12;

  const branchDirs = [[1,0],[-1,0],[0,1],[0,-1]];
  const branchCount = isOld ? 3 : 2;
  for (let b = 0; b < branchCount; b++) {
    const [bdx, bdz] = branchDirs[Math.floor(params.rng.next() * 4)];
    const bY = top - 1 - Math.floor(params.rng.next() * 2);
    const bLen = 1 + Math.floor(params.rng.next() * 2);
    placeBranch(chunk, x, bY, z, bdx, bdz, bLen, logBlock);
    placeLeafLayer(chunk, x + bdx * bLen, bY + 1, z + bdz * bLen, 1, leafBlock, params.rng, leafChance, gapChance);
  }

  placeLeafLayer(chunk, x, top - 1, z, crownRadius, leafBlock, params.rng, leafChance, gapChance);
  placeLeafLayer(chunk, x, top, z, crownRadius, leafBlock, params.rng, leafChance, gapChance);
  placeLeafLayer(chunk, x, top + 1, z, Math.max(1, crownRadius - 1), leafBlock, params.rng, leafChance, gapChance);
  setBlockSafe(chunk, x, top + 1, z, leafBlock);
}

function placePine(chunk, x, y, z, params) {
  const ageMult = getAgeMultiplier(params.age);
  const leafChance = getHealthLeafChance(params.health);
  const height = Math.floor((6 + Math.floor(params.rng.next() * 6)) * ageMult);
  const isOld = params.age === AGE_LEVELS.OLD;
  const logBlock = MC_BLOCKS.SPRUCE_LOG;
  const leafBlock = params.health === HEALTH_LEVELS.DEAD ? null : MC_BLOCKS.SPRUCE_LEAVES;

  if (isOld) placeRoots(chunk, x, y, z, params.rng);

  for (let i = 0; i < height; i++) {
    setBlockSafe(chunk, x, y + i, z, logBlock);
  }
  if (!leafBlock) return;

  const layers = Math.floor(5 * ageMult);
  const gapChance = params.health === HEALTH_LEVELS.DYING ? 0.35 : 0.1;
  for (let layer = 0; layer < layers; layer++) {
    const ly = y + height - 1 - layer * 2;
    const radius = layer < 1 ? 1 : layer < 3 ? 2 : 1;
    placeLeafLayer(chunk, x, ly, z, radius, leafBlock, params.rng, leafChance, gapChance);
    if (layer > 0 && layer < layers - 1) {
      const [bdx, bdz] = [[1,0],[-1,0],[0,1],[0,-1]][layer % 4];
      placeBranch(chunk, x, ly, z, bdx, bdz, 1, logBlock);
      setBlockSafe(chunk, x + bdx, ly, z + bdz, leafBlock);
    }
  }
  setBlockSafe(chunk, x, y + height, z, leafBlock);
  setBlockSafe(chunk, x, y + height + 1, z, leafBlock);
}

function placeMangrove(chunk, x, y, z, params) {
  const ageMult = getAgeMultiplier(params.age);
  const leafChance = getHealthLeafChance(params.health);
  const rootHeight = 3 + Math.floor(params.rng.next() * 3);
  const trunkHeight = Math.floor((5 + Math.floor(params.rng.next() * 4)) * ageMult);
  const logBlock = MC_BLOCKS.JUNGLE_LOG;
  const leafBlock = params.health === HEALTH_LEVELS.DEAD ? null : MC_BLOCKS.JUNGLE_LEAVES;

  const rootDirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
  for (let i = 0; i < rootHeight; i++) {
    setBlockSafe(chunk, x, y + i, z, logBlock);
    if (i > 0) {
      setBlockSafe(chunk, x + 1, y + i, z, logBlock);
      setBlockSafe(chunk, x, y + i, z + 1, logBlock);
    }
    if (i < rootHeight - 1) {
      for (const [dx, dz] of rootDirs) {
        if (params.rng.next() < 0.3) {
          setBlockSafe(chunk, x + dx, y + i, z + dz, TREE_DETAIL_BLOCKS.ROOT);
        }
      }
    }
  }
  for (let i = rootHeight; i < rootHeight + trunkHeight; i++) {
    setBlockSafe(chunk, x, y + i, z, logBlock);
  }
  if (!leafBlock) return;

  const top = y + rootHeight + trunkHeight;
  const gapChance = params.health === HEALTH_LEVELS.DYING ? 0.3 : 0.15;
  const branchDirs = [[1,0],[-1,0],[0,1],[0,-1]];
  for (let b = 0; b < 3; b++) {
    const [bdx, bdz] = branchDirs[Math.floor(params.rng.next() * 4)];
    const bY = top - 1 - Math.floor(params.rng.next() * 2);
    placeBranch(chunk, x, bY, z, bdx, bdz, 2 + Math.floor(params.rng.next() * 2), logBlock);
    placeLeafLayer(chunk, x + bdx * 2, bY + 1, z + bdz * 2, 1, leafBlock, params.rng, leafChance, gapChance);
  }
  placeLeafLayer(chunk, x, top - 1, z, 3, leafBlock, params.rng, leafChance, gapChance);
  placeLeafLayer(chunk, x, top, z, 2, leafBlock, params.rng, leafChance, gapChance);
  placeLeafLayer(chunk, x, top + 1, z, 1, leafBlock, params.rng, leafChance, gapChance);
  setBlockSafe(chunk, x, top + 1, z, leafBlock);
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      if (Math.abs(dx) + Math.abs(dz) > 3) continue;
      if (params.rng.next() < 0.2) {
        setBlockSafe(chunk, x + dx, top - 2, z + dz, leafBlock);
      }
    }
  }
}

function placeDead(chunk, x, y, z, params) {
  const height = 3 + Math.floor(params.rng.next() * 4);
  const logBlock = MC_BLOCKS.OAK_LOG;
  for (let i = 0; i < height; i++) {
    setBlockSafe(chunk, x, y + i, z, logBlock);
  }
  const top = y + height;
  const branchDirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
  for (let i = 0; i < 4; i++) {
    const [dx, dz] = branchDirs[Math.floor(params.rng.next() * branchDirs.length)];
    const bLen = 1 + Math.floor(params.rng.next() * 3);
    const bY = top - 1 + Math.floor(params.rng.next() * 2);
    placeBranch(chunk, x, bY, z, dx, dz, bLen, logBlock);
    if (params.rng.next() < 0.4) {
      const ndx = dx + (params.rng.next() < 0.5 ? 1 : -1);
      setBlockSafe(chunk, x + ndx, bY + 1, z + dz * bLen, logBlock);
    }
  }
  if (params.rng.next() < 0.3) {
    setBlockSafe(chunk, x + 1, y, z, TREE_DETAIL_BLOCKS.ROOT);
    setBlockSafe(chunk, x - 1, y, z, TREE_DETAIL_BLOCKS.ROOT);
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
  const gapChance = 0.15;
  const branchDirs = [[1,0],[-1,0],[0,1],[0,-1]];
  for (let b = 0; b < 2; b++) {
    const [bdx, bdz] = branchDirs[Math.floor(params.rng.next() * 4)];
    placeBranch(chunk, x, top - 1, z, bdx, bdz, 2 + Math.floor(params.rng.next() * 2), logBlock);
    placeLeafLayer(chunk, x + bdx * 2, top, z + bdz * 2, 1, leafBlock, params.rng, leafChance, gapChance);
  }
  placeLeafLayer(chunk, x, top, z, crownRadius, leafBlock, params.rng, leafChance, gapChance);
  placeLeafLayer(chunk, x, top + 1, z, Math.max(1, crownRadius - 1), leafBlock, params.rng, leafChance, gapChance);
  setBlockSafe(chunk, x, top + 1, z, leafBlock);
}

function placeGiant(chunk, x, y, z, params) {
  const height = 20 + Math.floor(params.rng.next() * 10);
  const logBlock = MC_BLOCKS.OAK_LOG;
  const leafBlock = TREE_DETAIL_BLOCKS.DARK_OAK_LEAVES;
  const trunkW = 4;
  for (let i = 0; i < height; i++) {
    for (let dx = 0; dx < trunkW; dx++) {
      for (let dz = 0; dz < trunkW; dz++) {
        setBlockSafe(chunk, x + dx, y + i, z + dz, logBlock);
      }
    }
    if (i < 3) placeRoots(chunk, x + 1, y + i, z + 1, params.rng);
  }
  const top = y + height;
  const crownRadius = 5;
  const gapChance = 0.1;
  const branchDirs = [[1,0],[-1,0],[0,1],[0,-1]];
  for (let b = 0; b < 4; b++) {
    const [bdx, bdz] = branchDirs[b];
    const bY = top - 2 + Math.floor(params.rng.next() * 3);
    const bLen = 3 + Math.floor(params.rng.next() * 3);
    placeBranch(chunk, x + 1, bY, z + 1, bdx, bdz, bLen, logBlock);
    placeLeafLayer(chunk, x + 1 + bdx * bLen, bY + 1, z + 1 + bdz * bLen, 2, leafBlock, params.rng, 1.0, gapChance);
  }
  for (let dy = -2; dy <= 3; dy++) {
    const r = dy < 0 ? crownRadius : dy > 1 ? 2 : crownRadius - 1;
    placeLeafLayer(chunk, x + 1, top + dy, z + 1, r, leafBlock, params.rng, 1.0, gapChance);
  }
  setBlockSafe(chunk, x + 1, top + 3, z + 1, leafBlock);
}

function placeBirch(chunk, x, y, z, params) {
  const ageMult = getAgeMultiplier(params.age);
  const leafChance = getHealthLeafChance(params.health);
  const height = Math.floor((5 + Math.floor(params.rng.next() * 3)) * ageMult);
  const isOld = params.age === AGE_LEVELS.OLD;
  const logBlock = MC_BLOCKS.BIRCH_LOG;
  const leafBlock = params.health === HEALTH_LEVELS.DEAD ? null : MC_BLOCKS.BIRCH_LEAVES;

  if (isOld) placeRoots(chunk, x, y, z, params.rng);

  for (let i = 0; i < height; i++) {
    setBlockSafe(chunk, x, y + i, z, logBlock);
  }
  if (!leafBlock) return;

  const top = y + height;
  const gapChance = params.health === HEALTH_LEVELS.DYING ? 0.3 : 0.1;
  const branchDirs = [[1,0],[-1,0],[0,1],[0,-1]];
  for (let b = 0; b < 2; b++) {
    const [bdx, bdz] = branchDirs[Math.floor(params.rng.next() * 4)];
    const bY = top - 1;
    placeBranch(chunk, x, bY, z, bdx, bdz, 1 + Math.floor(params.rng.next() * 2), logBlock);
  }
  placeLeafLayer(chunk, x, top - 1, z, 1, leafBlock, params.rng, leafChance, gapChance);
  placeLeafLayer(chunk, x, top, z, 1, leafBlock, params.rng, leafChance, gapChance);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (Math.abs(dx) + Math.abs(dz) > 1) continue;
      if (dx === 0 && dz === 0) continue;
      if (params.rng.next() < leafChance) {
        setBlockSafe(chunk, x + dx, top + 1, z + dz, leafBlock);
      }
    }
  }
  setBlockSafe(chunk, x, top + 1, z, leafBlock);
}

function placeCherry(chunk, x, y, z, params) {
  const ageMult = getAgeMultiplier(params.age);
  const leafChance = getHealthLeafChance(params.health);
  const height = Math.floor((4 + Math.floor(params.rng.next() * 2)) * ageMult);
  const logBlock = MC_BLOCKS.OAK_LOG;
  const leafBlock = params.health === HEALTH_LEVELS.DEAD ? null : MC_BLOCKS.OAK_LEAVES;

  for (let i = 0; i < height; i++) {
    setBlockSafe(chunk, x, y + i, z, logBlock);
  }
  if (!leafBlock) return;

  const top = y + height;
  const crownRadius = Math.floor(2 * ageMult);
  const gapChance = 0.08;
  const branchDirs = [[1,0],[-1,0],[0,1],[0,-1]];
  for (let b = 0; b < 2; b++) {
    const [bdx, bdz] = branchDirs[Math.floor(params.rng.next() * 4)];
    placeBranch(chunk, x, top - 1, z, bdx, bdz, 1 + Math.floor(params.rng.next() * 2), logBlock);
    placeLeafLayer(chunk, x + bdx, top, z + bdz, 1, leafBlock, params.rng, leafChance, gapChance);
  }
  for (let dy = 0; dy <= crownRadius; dy++) {
    const r = dy === 0 ? crownRadius : Math.max(1, crownRadius - dy);
    placeLeafLayer(chunk, x, top + dy, z, r, leafBlock, params.rng, leafChance, gapChance);
  }
  setBlockSafe(chunk, x, top + crownRadius, z, leafBlock);
  if (params.rng.next() < 0.3) {
    const fx = x + Math.floor((params.rng.next() - 0.5) * 4);
    const fz = z + Math.floor((params.rng.next() - 0.5) * 4);
    setBlockSafe(chunk, fx, top + 1, fz, VEGETATION_BLOCKS.FLOWER_PINK);
  }
}

function placeMysticMushroom(chunk, x, y, z, params) {
  const ageMult = getAgeMultiplier(params.age);
  const height = Math.floor((8 + Math.floor(params.rng.next() * 7)) * ageMult);
  const logBlock = MC_BLOCKS.OAK_LOG;
  const capBlock = MC_BLOCKS.OAK_LEAVES;
  const stemBlock = MC_BLOCKS.SPRUCE_LOG;

  for (let i = 0; i < height; i++) {
    setBlockSafe(chunk, x, y + i, z, stemBlock);
    if (i > height * 0.6 && i % 2 === 0) {
      setBlockSafe(chunk, x + 1, y + i, z, stemBlock);
      setBlockSafe(chunk, x, y + i, z + 1, stemBlock);
    }
  }
  if (params.health === HEALTH_LEVELS.DEAD) return;

  const top = y + height;
  const capRadius = Math.floor(4 * ageMult);
  for (let dx = -capRadius; dx <= capRadius; dx++) {
    for (let dz = -capRadius; dz <= capRadius; dz++) {
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > capRadius) continue;
      setBlockSafe(chunk, x + dx, top, z + dz, capBlock);
      setBlockSafe(chunk, x + dx, top + 1, z + dz, capBlock);
      if (dist > capRadius - 1) {
        setBlockSafe(chunk, x + dx, top - 1, z + dz, capBlock);
      }
    }
  }
  setBlockSafe(chunk, x, top + 2, z, capBlock);
  if (params.rng.next() < 0.4) {
    const sx = x + Math.floor((params.rng.next() - 0.5) * capRadius);
    const sz = z + Math.floor((params.rng.next() - 0.5) * capRadius);
    setBlockSafe(chunk, sx, top - 1, sz, VEGETATION_BLOCKS.MUSHROOM_RED);
  }
}

function placeAutumnOak(chunk, x, y, z, params) {
  const ageMult = getAgeMultiplier(params.age);
  const leafChance = getHealthLeafChance(params.health);
  const height = Math.floor((4 + Math.floor(params.rng.next() * 3)) * ageMult);
  const isOld = params.age === AGE_LEVELS.OLD;
  const logBlock = MC_BLOCKS.OAK_LOG;

  if (isOld) placeRoots(chunk, x, y, z, params.rng);

  for (let i = 0; i < height; i++) {
    setBlockSafe(chunk, x, y + i, z, logBlock);
  }
  if (params.health === HEALTH_LEVELS.DEAD) return;

  const top = y + height;
  const crownRadius = Math.floor(2 * ageMult);
  const gapChance = params.health === HEALTH_LEVELS.DYING ? 0.35 : 0.12;
  const branchDirs = [[1,0],[-1,0],[0,1],[0,-1]];
  for (let b = 0; b < 2; b++) {
    const [bdx, bdz] = branchDirs[Math.floor(params.rng.next() * 4)];
    const bY = top - 1 - Math.floor(params.rng.next() * 2);
    const bLen = 1 + Math.floor(params.rng.next() * 2);
    placeBranch(chunk, x, bY, z, bdx, bdz, bLen, logBlock);
    const bLeaf = params.rng.next() < 0.5 ? TREE_DETAIL_BLOCKS.AUTUMN_LEAVES_ORANGE : TREE_DETAIL_BLOCKS.AUTUMN_LEAVES_RED;
    placeLeafLayer(chunk, x + bdx * bLen, bY + 1, z + bdz * bLen, 1, bLeaf, params.rng, leafChance, gapChance);
  }
  const autumnLeaves = [MC_BLOCKS.OAK_LEAVES, TREE_DETAIL_BLOCKS.AUTUMN_LEAVES_ORANGE, TREE_DETAIL_BLOCKS.AUTUMN_LEAVES_RED];
  for (let dy = -1; dy <= 1; dy++) {
    const r = dy === 1 ? Math.max(1, crownRadius - 1) : crownRadius;
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (Math.abs(dx) + Math.abs(dz) + Math.abs(dy) > r + 1) continue;
        if (dx === 0 && dz === 0 && dy < 1) continue;
        if (params.rng.next() < gapChance) continue;
        if (params.rng.next() < leafChance) {
          const leaf = autumnLeaves[Math.floor(params.rng.next() * autumnLeaves.length)];
          setBlockSafe(chunk, x + dx, top + dy, z + dz, leaf);
        }
      }
    }
  }
  setBlockSafe(chunk, x, top + 1, z, TREE_DETAIL_BLOCKS.AUTUMN_LEAVES_ORANGE);
}

// SPEC-099: Bamboo stalk generator for bamboo_grove biome
function placeBamboo(chunk, x, y, z, params) {
  const ageMult = getAgeMultiplier(params.age);
  const height = Math.floor((8 + Math.floor(params.rng.next() * 5)) * ageMult);
  const logBlock = MC_BLOCKS.OAK_LOG;
  const leafBlock = MC_BLOCKS.OAK_LEAVES;

  for (let i = 0; i < height; i++) {
    setBlockSafe(chunk, x, y + i, z, logBlock);
    if (i > height * 0.5 && i % 3 === 0) {
      setBlockSafe(chunk, x + 1, y + i, z, logBlock);
    }
  }
  if (params.health === HEALTH_LEVELS.DEAD) return;

  const top = y + height;
  const leafChance = getHealthLeafChance(params.health);
  const gapChance = 0.1;
  placeLeafLayer(chunk, x, top - 1, z, 1, leafBlock, params.rng, leafChance, gapChance);
  placeLeafLayer(chunk, x, top, z, 1, leafBlock, params.rng, leafChance, gapChance);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (Math.abs(dx) + Math.abs(dz) > 1) continue;
      if (dx === 0 && dz === 0) continue;
      if (params.rng.next() < leafChance) {
        setBlockSafe(chunk, x + dx, top + 1, z + dz, leafBlock);
      }
    }
  }
  setBlockSafe(chunk, x, top + 1, z, leafBlock);
  if (params.rng.next() < 0.25) {
    const sx = x + (params.rng.next() < 0.5 ? 1 : -1);
    const sz = z + (params.rng.next() < 0.5 ? 1 : -1);
    setBlockSafe(chunk, sx, y, sz, logBlock);
    for (let i = 0; i < 3 + Math.floor(params.rng.next() * 3); i++) {
      setBlockSafe(chunk, sx, y + i, sz, logBlock);
    }
    setBlockSafe(chunk, sx, y + 3, sz, leafBlock);
  }
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
