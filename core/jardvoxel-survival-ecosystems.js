// ═══════════════════════════════════════════════════════════
// JardVoxel 7.0 — Ecosystems (Ecological Generation Rules)
// SPEC-109: Biomes evolve into complete ecosystems
// ═══════════════════════════════════════════════════════════

import { BIOMES, ZONE_TYPES } from './jardvoxel-survival-world-hierarchy.js';

// Ecosystem profiles per biome
const ECOSYSTEM_PROFILES = {
  [BIOMES.FOREST]: {
    trees: [
      { type: 'oak', weight: 0.6, minHeight: 4, maxHeight: 6 },
      { type: 'birch', weight: 0.3, minHeight: 5, maxHeight: 7 },
      { type: 'giant_oak', weight: 0.1, minHeight: 8, maxHeight: 12 },
    ],
    shrubs: ['fern', 'tall_grass'],
    flowers: ['flower_red', 'flower_yellow'],
    mushrooms: ['mushroom_brown', 'mushroom_red'],
    moss: true,
    rocks: true,
    fauna: ['bird', 'fox', 'rabbit'],
    water: 'streams',
    clearings: true,
    fallenLogs: true,
    density: 0.12,
  },
  [BIOMES.JUNGLE]: {
    trees: [
      { type: 'jungle', weight: 0.7, minHeight: 8, maxHeight: 12 },
      { type: 'giant_jungle', weight: 0.3, minHeight: 14, maxHeight: 20 },
    ],
    shrubs: ['fern', 'tall_grass'],
    flowers: ['flower_red'],
    mushrooms: ['mushroom_brown'],
    moss: true,
    rocks: false,
    fauna: ['parrot', 'ocelot'],
    water: 'pools',
    clearings: false,
    fallenLogs: true,
    density: 0.18,
  },
  [BIOMES.TAIGA]: {
    trees: [
      { type: 'spruce', weight: 1.0, minHeight: 5, maxHeight: 8 },
    ],
    shrubs: ['fern'],
    flowers: [],
    mushrooms: ['mushroom_brown'],
    moss: true,
    rocks: true,
    fauna: ['wolf', 'rabbit'],
    water: 'none',
    clearings: false,
    fallenLogs: true,
    density: 0.10,
  },
  [BIOMES.DESERT]: {
    trees: [],
    shrubs: ['dead_bush'],
    flowers: [],
    mushrooms: [],
    moss: false,
    rocks: true,
    fauna: [],
    water: 'none',
    clearings: false,
    fallenLogs: false,
    density: 0.01,
  },
  [BIOMES.SWAMP]: {
    trees: [
      { type: 'swamp_oak', weight: 1.0, minHeight: 3, maxHeight: 5 },
    ],
    shrubs: ['fern'],
    flowers: ['flower_red'],
    mushrooms: ['mushroom_brown', 'mushroom_red'],
    moss: true,
    rocks: true,
    fauna: ['frog'],
    water: 'puddles',
    clearings: false,
    fallenLogs: true,
    density: 0.06,
  },
  [BIOMES.PLAINS]: {
    trees: [
      { type: 'oak', weight: 1.0, minHeight: 4, maxHeight: 5 },
    ],
    shrubs: ['tall_grass'],
    flowers: ['flower_red', 'flower_yellow'],
    mushrooms: [],
    moss: false,
    rocks: false,
    fauna: ['rabbit', 'horse'],
    water: 'none',
    clearings: true,
    fallenLogs: false,
    density: 0.02,
  },
  [BIOMES.MEADOW]: {
    trees: [
      { type: 'oak', weight: 0.5, minHeight: 4, maxHeight: 6 },
      { type: 'birch', weight: 0.5, minHeight: 5, maxHeight: 7 },
    ],
    shrubs: ['tall_grass', 'fern'],
    flowers: ['flower_red', 'flower_yellow'],
    mushrooms: [],
    moss: false,
    rocks: false,
    fauna: ['butterfly', 'bee'],
    water: 'none',
    clearings: true,
    fallenLogs: false,
    density: 0.05,
  },
  [BIOMES.CHERRY_GROVE]: {
    trees: [
      { type: 'cherry', weight: 1.0, minHeight: 4, maxHeight: 6 },
    ],
    shrubs: ['tall_grass'],
    flowers: ['flower_red'],
    mushrooms: [],
    moss: false,
    rocks: false,
    fauna: ['bee'],
    water: 'none',
    clearings: true,
    fallenLogs: false,
    density: 0.08,
  },
  [BIOMES.AUTUMN_FOREST]: {
    trees: [
      { type: 'autumn_oak', weight: 0.6, minHeight: 4, maxHeight: 7 },
      { type: 'oak', weight: 0.3, minHeight: 4, maxHeight: 6 },
      { type: 'birch', weight: 0.1, minHeight: 5, maxHeight: 7 },
    ],
    shrubs: ['fern', 'tall_grass'],
    flowers: ['flower_yellow'],
    mushrooms: ['mushroom_brown'],
    moss: true,
    rocks: true,
    fauna: ['bird', 'fox'],
    water: 'streams',
    clearings: true,
    fallenLogs: true,
    density: 0.10,
  },
  [BIOMES.SNOWY_PLAINS]: {
    trees: [
      { type: 'spruce', weight: 1.0, minHeight: 4, maxHeight: 6 },
    ],
    shrubs: [],
    flowers: [],
    mushrooms: [],
    moss: false,
    rocks: false,
    fauna: ['rabbit'],
    water: 'none',
    clearings: false,
    fallenLogs: false,
    density: 0.03,
  },
  [BIOMES.MOUNTAINS]: {
    trees: [],
    shrubs: [],
    flowers: [],
    mushrooms: [],
    moss: false,
    rocks: true,
    fauna: ['goat'],
    water: 'none',
    clearings: false,
    fallenLogs: false,
    density: 0.01,
  },
  [BIOMES.MYSTIC_GROVE]: {
    trees: [
      { type: 'mystic', weight: 1.0, minHeight: 5, maxHeight: 8 },
    ],
    shrubs: ['fern'],
    flowers: ['flower_red'],
    mushrooms: ['mushroom_red'],
    moss: true,
    rocks: false,
    fauna: ['mystic_creature'],
    water: 'pools',
    clearings: true,
    fallenLogs: false,
    density: 0.10,
  },
  [BIOMES.ZEN_GARDEN]: {
    trees: [
      { type: 'cherry', weight: 1.0, minHeight: 3, maxHeight: 5 },
    ],
    shrubs: ['fern'],
    flowers: ['flower_red'],
    mushrooms: [],
    moss: true,
    rocks: true,
    fauna: ['butterfly'],
    water: 'streams',
    clearings: true,
    fallenLogs: false,
    density: 0.06,
  },
  [BIOMES.BAMBOO_GROVE]: {
    trees: [
      { type: 'bamboo', weight: 1.0, minHeight: 6, maxHeight: 10 },
    ],
    shrubs: ['fern', 'tall_grass'],
    flowers: [],
    mushrooms: ['mushroom_brown'],
    moss: true,
    rocks: false,
    fauna: ['panda'],
    water: 'streams',
    clearings: true,
    fallenLogs: false,
    density: 0.15,
  },
  [BIOMES.AURORA_TUNDRA]: {
    trees: [
      { type: 'spruce', weight: 1.0, minHeight: 4, maxHeight: 6 },
    ],
    shrubs: [],
    flowers: [],
    mushrooms: [],
    moss: true,
    rocks: true,
    fauna: ['fox', 'rabbit'],
    water: 'none',
    clearings: false,
    fallenLogs: true,
    density: 0.04,
  },
};

export class EcosystemSystem {
  constructor(seed) {
    this.seed = seed;
  }

  // Get ecosystem profile for a biome
  getEcosystem(biome, zoneType) {
    const profile = ECOSYSTEM_PROFILES[biome] || ECOSYSTEM_PROFILES[BIOMES.PLAINS];

    // Zone modifications
    let modified = { ...profile };

    if (zoneType === ZONE_TYPES.DENSE_FOREST) {
      modified.density = profile.density * 1.5;
    } else if (zoneType === ZONE_TYPES.CLEARING) {
      modified.density = profile.density * 0.1;
      modified.clearings = true;
    } else if (zoneType === ZONE_TYPES.WETLANDS) {
      modified.water = 'puddles';
      modified.density = profile.density * 0.7;
    } else if (zoneType === ZONE_TYPES.LAKE) {
      modified.density = profile.density * 0.2;
    }

    return modified;
  }

  // Check if a position should have a tree (ecological rules)
  shouldHaveTree(x, z, biome, zoneType, clusterNoise) {
    const eco = this.getEcosystem(biome, zoneType);
    if (eco.trees.length === 0) return false;

    // Clearing check: no trees in clearings
    if (eco.clearings && clusterNoise < -0.5) return false;

    // Tree clustering: trees grow in groves
    if (clusterNoise < -0.3) return false;

    return true;
  }

  // Get tree type for a position
  getTreeType(x, z, biome, zoneType) {
    const eco = this.getEcosystem(biome, zoneType);
    if (eco.trees.length === 0) return null;

    const hash = this._hash(x, z);
    let cumulative = 0;
    for (const tree of eco.trees) {
      cumulative += tree.weight;
      if (hash < cumulative) return tree;
    }
    return eco.trees[0];
  }

  // Get decoration blocks for a position based on ecosystem
  getDecorations(x, z, biome, zoneType, nearWater) {
    const eco = this.getEcosystem(biome, zoneType);
    const hash = this._hash(x * 7 + 13, z * 13 + 7);
    const decorations = [];

    // Flowers at forest edges and clearings
    if (eco.flowers.length > 0 && (zoneType === ZONE_TYPES.CLEARING || nearWater)) {
      if (hash < 0.15) {
        decorations.push(eco.flowers[Math.floor(hash * 10) % eco.flowers.length]);
      }
    }

    // Shrubs
    if (eco.shrubs.length > 0 && hash < 0.08) {
      decorations.push(eco.shrubs[Math.floor(hash * 10) % eco.shrubs.length]);
    }

    // Mushrooms in dark/forest areas
    if (eco.mushrooms.length > 0 && hash < 0.03) {
      decorations.push(eco.mushrooms[Math.floor(hash * 10) % eco.mushrooms.length]);
    }

    // Moss
    if (eco.moss && hash < 0.05) {
      decorations.push('moss_block');
    }

    // Rocks
    if (eco.rocks && hash < 0.02) {
      decorations.push('cobblestone');
    }

    // Fallen logs
    if (eco.fallenLogs && hash < 0.015) {
      decorations.push('fallen_log');
    }

    return decorations;
  }

  // Get fauna spawn list for biome
  // SPEC-111: restorationFactor scales fauna density (0.4 = sparse, 1.0 = full)
  getFauna(biome, zoneType, restorationFactor = 1.0) {
    const eco = this.getEcosystem(biome, zoneType);
    if (restorationFactor < 1.0) {
      // Filter out some fauna based on restoration factor
      return eco.fauna.filter(() => Math.random() < restorationFactor);
    }
    return eco.fauna;
  }

  // Check if water features should generate
  hasWaterFeatures(biome, zoneType) {
    const eco = this.getEcosystem(biome, zoneType);
    return eco.water !== 'none';
  }

  _hash(x, z) {
    return ((x * 374761393 + z * 668265263) & 0x7FFFFFFF) / 0x7FFFFFFF;
  }
}
