// ═══════════════════════════════════════════════════════════
// JardVoxel 7.0 — Contextual Structure Generation
// SPEC-110: Structures use geographic info for placement
// ═══════════════════════════════════════════════════════════

import { BIOMES, REGION_TYPES, ZONE_TYPES } from './jardvoxel-survival-world-hierarchy.js';

// Structure placement rules
const STRUCTURE_RULES = {
  village: {
    validZones: [ZONE_TYPES.VALLEY, ZONE_TYPES.MEADOW, ZONE_TYPES.CLEARING, ZONE_TYPES.DEFAULT],
    validBiomes: [BIOMES.PLAINS, BIOMES.FOREST, BIOMES.MEADOW],
    minHeight: 63,
    maxHeight: 80,
    requiresWater: true,
    waterRadius: 3, // chunks
    baseProbability: 0.01,
    zoneMultiplier: { [ZONE_TYPES.VALLEY]: 3, [ZONE_TYPES.MEADOW]: 2 },
    flatnessRequired: 5, // max height variance
  },
  temple: {
    validZones: [ZONE_TYPES.HILLS, ZONE_TYPES.CLIFFS, ZONE_TYPES.DEFAULT],
    validBiomes: [BIOMES.MOUNTAINS, BIOMES.STONY_PEAKS, BIOMES.MEADOW, BIOMES.PLAINS, BIOMES.DESERT],
    minHeight: 80,
    maxHeight: 200,
    requiresWater: false,
    baseProbability: 0.005,
    zoneMultiplier: { [ZONE_TYPES.CLIFFS]: 3, [ZONE_TYPES.HILLS]: 2 },
    flatnessRequired: 10,
  },
  port: {
    validZones: [ZONE_TYPES.COASTAL, ZONE_TYPES.DEFAULT],
    validBiomes: [BIOMES.BEACH],
    minHeight: 60,
    maxHeight: 65,
    requiresOcean: true,
    oceanRadius: 2,
    baseProbability: 0.01,
    zoneMultiplier: { [ZONE_TYPES.COASTAL]: 4 },
    flatnessRequired: 4,
  },
  mine: {
    validZones: [ZONE_TYPES.HILLS, ZONE_TYPES.CLIFFS, ZONE_TYPES.DEFAULT],
    validBiomes: [BIOMES.MOUNTAINS, BIOMES.STONY_PEAKS],
    minHeight: 40,
    maxHeight: 70,
    requiresWater: false,
    baseProbability: 0.008,
    zoneMultiplier: {},
    regionMultiplier: { [REGION_TYPES.MOUNTAIN_RANGE]: 5 },
    flatnessRequired: 15,
  },
  ruins: {
    validZones: [ZONE_TYPES.DEFAULT, ZONE_TYPES.HILLS, ZONE_TYPES.CLEARING],
    validBiomes: [BIOMES.PLAINS, BIOMES.FOREST, BIOMES.DESERT, BIOMES.MEADOW, BIOMES.SAVANNA],
    minHeight: 65,
    maxHeight: 90,
    requiresWater: false,
    baseProbability: 0.005,
    zoneMultiplier: {},
    flatnessRequired: 8,
    excludeDenseForest: true,
  },
  watchtower: {
    validZones: [ZONE_TYPES.CLIFFS, ZONE_TYPES.HILLS],
    validBiomes: [BIOMES.MOUNTAINS, BIOMES.STONY_PEAKS, BIOMES.MEADOW],
    minHeight: 85,
    maxHeight: 200,
    requiresWater: false,
    baseProbability: 0.003,
    zoneMultiplier: { [ZONE_TYPES.CLIFFS]: 4 },
    flatnessRequired: 12,
  },
};

export class ContextualStructureSystem {
  constructor(seed) {
    this.seed = seed;
    this.placedStructures = new Map(); // "cx,cz" → structure data
  }

  // Check if a structure should be placed at chunk coordinates
  tryPlaceStructure(cx, cz, context, heightCheckFn) {
    const key = `${cx},${cz}`;
    if (this.placedStructures.has(key)) return this.placedStructures.get(key);

    const { zone, region, biomeWeights, heightMap, continent } = context;
    const primaryBiome = this._primaryBiome(biomeWeights);

    // Check each structure type
    for (const [structType, rules] of Object.entries(STRUCTURE_RULES)) {
      // Zone check
      if (!rules.validZones.includes(zone.type)) continue;

      // Biome check
      if (!rules.validBiomes.includes(primaryBiome)) continue;

      // Height check
      const avgHeight = this._avgHeight(heightMap);
      if (avgHeight < rules.minHeight || avgHeight > rules.maxHeight) continue;

      // Flatness check
      const heightVariance = this._heightVariance(heightMap);
      if (heightVariance > rules.flatnessRequired) continue;

      // Dense forest exclusion
      if (rules.excludeDenseForest && zone.type === ZONE_TYPES.DENSE_FOREST) continue;

      // Water proximity check
      if (rules.requiresWater && heightCheckFn) {
        const hasWater = heightCheckFn(cx, cz, rules.waterRadius || 3);
        if (!hasWater) continue;
      }

      // Ocean proximity check
      if (rules.requiresOcean && continent) {
        if (!continent.isOcean && !this._nearOcean(cx, cz, rules.oceanRadius || 2)) continue;
      }

      // Probability check
      let prob = rules.baseProbability;
      if (rules.zoneMultiplier && rules.zoneMultiplier[zone.type]) {
        prob *= rules.zoneMultiplier[zone.type];
      }
      if (rules.regionMultiplier && rules.regionMultiplier[region.type]) {
        prob *= rules.regionMultiplier[region.type];
      }

      const hash = this._hash(cx * 31 + 7, cz * 17 + 13);
      if (hash < prob) {
        const structure = {
          type: structType,
          cx, cz,
          biome: primaryBiome,
          zoneType: zone.type,
          regionType: region.type,
          avgHeight,
        };
        this.placedStructures.set(key, structure);
        return structure;
      }
    }

    this.placedStructures.set(key, null);
    return null;
  }

  // Get structure at chunk coordinates
  getStructure(cx, cz) {
    return this.placedStructures.get(`${cx},${cz}`) || null;
  }

  // Generate structure blocks
  generateStructure(chunk, context, helpers) {
    const structure = this.getStructure(context.cx, context.cz);
    if (!structure) return;

    const { setBlock, getBlock } = helpers;
    const { heightMap } = context;

    switch (structure.type) {
      case 'village':
        this._placeVillage(chunk, heightMap, setBlock);
        break;
      case 'temple':
        this._placeTemple(chunk, heightMap, setBlock);
        break;
      case 'port':
        this._placePort(chunk, heightMap, setBlock);
        break;
      case 'mine':
        this._placeMine(chunk, heightMap, setBlock);
        break;
      case 'ruins':
        this._placeRuinsStruct(chunk, heightMap, setBlock);
        break;
      case 'watchtower':
        this._placeWatchtower(chunk, heightMap, setBlock);
        break;
    }
  }

  _placeVillage(chunk, heightMap, setBlock) {
    const cx = 8, cz = 8;
    const y = Math.floor(heightMap[cx + cz * 16]);
    // 2-3 small houses + well
    this._placeHouse(cx - 4, cz - 2, y, setBlock, 5, 4);
    this._placeHouse(cx + 2, cz - 2, y, setBlock, 5, 4);
    this._placeWell(cx - 1, cz + 3, y, setBlock);
    // Paths
    for (let dx = -4; dx <= 4; dx++) {
      setBlock(cx + dx, y, cz, 'gravel');
    }
  }

  _placeHouse(x, z, y, setBlock, w, h) {
    for (let dx = 0; dx < w; dx++) {
      for (let dz = 0; dz < h; dz++) {
        setBlock(x + dx, y, z + dz, 'planks');
        setBlock(x + dx, y + 3, z + dz, 'wood');
        if (dx === 0 || dx === w - 1 || dz === 0 || dz === h - 1) {
          setBlock(x + dx, y + 1, z + dz, 'planks');
          setBlock(x + dx, y + 2, z + dz, 'planks');
        }
      }
    }
    // Door
    setBlock(x + 2, y + 1, z, 'door');
    // Window
    setBlock(x, y + 1, z + 2, 'glass');
  }

  _placeWell(x, z, y, setBlock) {
    for (let dx = 0; dx < 3; dx++) {
      for (let dz = 0; dz < 3; dz++) {
        setBlock(x + dx, y, z + dz, 'cobblestone');
      }
    }
    setBlock(x + 1, y, z + 1, 'water');
    setBlock(x, y + 1, z, 'cobblestone');
    setBlock(x + 2, y + 1, z, 'cobblestone');
    setBlock(x, y + 1, z + 2, 'cobblestone');
    setBlock(x + 2, y + 1, z + 2, 'cobblestone');
  }

  _placeTemple(chunk, heightMap, setBlock) {
    const cx = 8, cz = 8;
    const y = Math.floor(heightMap[cx + cz * 16]);
    // Pyramid 7x7, 4 layers
    for (let layer = 0; layer < 4; layer++) {
      const half = 3 - layer;
      for (let dx = -half; dx <= half; dx++) {
        for (let dz = -half; dz <= half; dz++) {
          setBlock(cx + dx, y + layer, cz + dz, 'sandstone');
        }
      }
    }
    // Inner chamber
    setBlock(cx, y + 1, cz, 'air');
    setBlock(cx, y + 2, cz, 'air');
    setBlock(cx, y + 3, cz, 'torch');
  }

  _placePort(chunk, heightMap, setBlock) {
    const cx = 8, cz = 8;
    const y = Math.floor(heightMap[cx + cz * 16]);
    // Dock extending toward water
    for (let dz = 0; dz < 8; dz++) {
      setBlock(cx - 1, y, cz + dz, 'planks');
      setBlock(cx, y, cz + dz, 'planks');
      setBlock(cx + 1, y, cz + dz, 'planks');
    }
    // Posts
    setBlock(cx - 1, y + 1, cz, 'wood');
    setBlock(cx + 1, y + 1, cz, 'wood');
    setBlock(cx - 1, y + 1, cz + 7, 'wood');
    setBlock(cx + 1, y + 1, cz + 7, 'wood');
  }

  _placeMine(chunk, heightMap, setBlock) {
    const cx = 8, cz = 8;
    const y = Math.floor(heightMap[cx + cz * 16]);
    // Mine entrance
    for (let dy = 0; dy < 4; dy++) {
      setBlock(cx - 1, y + dy, cz, 'air');
      setBlock(cx, y + dy, cz, 'air');
      setBlock(cx + 1, y + dy, cz, 'air');
    }
    // Support frame
    setBlock(cx - 2, y, cz, 'wood');
    setBlock(cx + 2, y, cz, 'wood');
    setBlock(cx - 2, y + 4, cz, 'wood');
    setBlock(cx + 2, y + 4, cz, 'wood');
    setBlock(cx - 1, y + 4, cz, 'wood');
    setBlock(cx, y + 4, cz, 'wood');
    setBlock(cx + 1, y + 4, cz, 'wood');
    // Tunnel
    for (let dz = 1; dz < 8; dz++) {
      for (let dy = 0; dy < 4; dy++) {
        setBlock(cx, y + dy, cz + dz, 'air');
      }
      setBlock(cx - 1, y, cz + dz, 'wood');
      setBlock(cx + 1, y, cz + dz, 'wood');
    }
  }

  _placeRuinsStruct(chunk, heightMap, setBlock) {
    const cx = 8, cz = 8;
    const y = Math.floor(heightMap[cx + cz * 16]);
    // Broken walls
    const walls = [
      { x: cx - 3, z: cz - 3, len: 6, dir: 'x', broken: [2, 4] },
      { x: cx - 3, z: cz + 3, len: 6, dir: 'x', broken: [1, 3] },
      { x: cx - 3, z: cz - 3, len: 6, dir: 'z', broken: [3] },
      { x: cx + 3, z: cz - 3, len: 6, dir: 'z', broken: [2, 5] },
    ];
    for (const wall of walls) {
      for (let i = 0; i < wall.len; i++) {
        if (wall.broken.includes(i)) continue;
        const wx = wall.dir === 'x' ? wall.x + i : wall.x;
        const wz = wall.dir === 'z' ? wall.z + i : wall.z;
        setBlock(wx, y, wz, 'stone_bricks');
        setBlock(wx, y + 1, wz, 'stone_bricks');
        if (i % 2 === 0) setBlock(wx, y + 2, wz, 'stone_bricks');
      }
    }
    // Floor
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        setBlock(cx + dx, y, cz + dz, 'stone_bricks');
      }
    }
  }

  _placeWatchtower(chunk, heightMap, setBlock) {
    const cx = 8, cz = 8;
    const y = Math.floor(heightMap[cx + cz * 16]);
    // Tower 5x5, height 12
    for (let dy = 0; dy < 12; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          if (Math.abs(dx) === 2 || Math.abs(dz) === 2) {
            setBlock(cx + dx, y + dy, cz + dz, 'stone');
          }
        }
      }
    }
    // Top platform
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        setBlock(cx + dx, y + 12, cz + dz, 'planks');
      }
    }
    // Lantern
    setBlock(cx, y + 13, cz, 'lantern');
  }

  _primaryBiome(weights) {
    let max = 0, primary = BIOMES.PLAINS;
    for (const [b, w] of weights) { if (w > max) { max = w; primary = b; } }
    return primary;
  }

  _avgHeight(heightMap) {
    let sum = 0;
    for (let i = 0; i < heightMap.length; i++) sum += heightMap[i];
    return sum / heightMap.length;
  }

  _heightVariance(heightMap) {
    const avg = this._avgHeight(heightMap);
    let sumSq = 0;
    for (let i = 0; i < heightMap.length; i++) {
      sumSq += (heightMap[i] - avg) ** 2;
    }
    return Math.sqrt(sumSq / heightMap.length);
  }

  _nearOcean(cx, cz, radius) {
    // Check if ocean is within radius chunks
    // This is a simplified check — in practice would sample continent map
    const ox = cx * 16;
    const oz = cz * 16;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const value = this._hash(ox + dx * 16, oz + dz * 16);
        if (value < 0.3) return true; // Simplified ocean check
      }
    }
    return false;
  }

  _hash(x, z) {
    return ((x * 374761393 + z * 668265263) & 0x7FFFFFFF) / 0x7FFFFFFF;
  }
}
