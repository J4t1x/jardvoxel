// ═══════════════════════════════════════════════════════════
// JardVoxel 7.0 — 9-Layer Progressive Chunk Generation
// SPEC-106: Each layer loads independently as player explores
// ═══════════════════════════════════════════════════════════

import { BIOMES, ZONE_TYPES } from './jardvoxel-survival-world-hierarchy.js';
import { PoissonDiskSampler } from './jardvoxel-survival-poisson.js';
import { FastNoiseLite, FN_NOISE_TYPE, FN_CELLULAR_RETURN } from './jardvoxel-survival-noise.js';

// Load priority tiers
const LOAD_PRIORITY = {
  IMMEDIATE: 0,   // Always loaded on chunk gen
  HIGH: 1,        // Loaded when chunk enters render distance
  MEDIUM: 2,      // Loaded when player within 5 chunks
  LOW: 3,         // Loaded only when player within 2 chunks
};

// ═══════════════════════════════════════════════════════════
// Base Layer class
// ═══════════════════════════════════════════════════════════

class BaseLayer {
  constructor(id, name, priority) {
    this.id = id;
    this.name = name;
    this.priority = priority;
    this.enabled = true;
  }

  generate(chunk, context, helpers) {}
  isRequired() { return this.priority === LOAD_PRIORITY.IMMEDIATE; }
}

// ═══════════════════════════════════════════════════════════
// Layer 1: Terrain Base
// ═══════════════════════════════════════════════════════════

class TerrainLayer extends BaseLayer {
  constructor() {
    super(1, 'terrain', LOAD_PRIORITY.IMMEDIATE);
  }

  generate(chunk, context, helpers) {
    const { heightMap, waterLevel, continent } = context;
    const { setBlock, getBlock } = helpers;
    const size = 16;

    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        const height = Math.floor(heightMap[x + z * size]);
        const isOcean = continent.isOcean;

        for (let y = 0; y <= Math.max(height, waterLevel); y++) {
          if (y <= height) {
            // Solid terrain
            if (y === height) {
              setBlock(x, y, z, this._getSurfaceBlock(context, y));
            } else if (y > height - 4) {
              setBlock(x, y, z, this._getSubsurfaceBlock(context, y, height));
            } else {
              setBlock(x, y, z, 'stone');
            }
          } else if (y <= waterLevel && y > height) {
            setBlock(x, y, z, 'water');
          }
        }
      }
    }
  }

  _getSurfaceBlock(context, y) {
    const biome = this._primaryBiome(context.biomeWeights);
    const { waterLevel } = context;

    if (y < waterLevel - 8) return 'stone';
    if (y < waterLevel) return 'sand';

    switch (biome) {
      case BIOMES.DESERT: case BIOMES.BEACH: return 'sand';
      case BIOMES.SNOWY_PLAINS: case BIOMES.SNOWY_PEAKS: case BIOMES.AURORA_TUNDRA: return 'snow';
      case BIOMES.STONY_PEAKS: return 'calcite';
      case BIOMES.MOUNTAINS: return 'stone';
      case BIOMES.SWAMP: return 'mud';
      case BIOMES.SAVANNA: return 'coarse_dirt';
      case BIOMES.MYSTIC_GROVE: return 'mycelium';
      case BIOMES.ZEN_GARDEN: return 'sand';
      default: return 'grass';
    }
  }

  _getSubsurfaceBlock(context, y, surfaceY) {
    const biome = this._primaryBiome(context.biomeWeights);
    const depth = surfaceY - y;

    switch (biome) {
      case BIOMES.DESERT: case BIOMES.BEACH:
        return depth <= 3 ? 'sand' : 'sandstone';
      case BIOMES.STONY_PEAKS: case BIOMES.MOUNTAINS:
        return 'stone';
      case BIOMES.SNOWY_PLAINS: case BIOMES.SNOWY_PEAKS:
        return depth <= 2 ? 'snow_block' : 'stone';
      case BIOMES.SWAMP:
        return depth <= 2 ? 'mud' : 'dirt';
      default:
        return depth <= 3 ? 'dirt' : 'stone';
    }
  }

  _primaryBiome(weights) {
    let max = 0, primary = BIOMES.PLAINS;
    for (const [b, w] of weights) { if (w > max) { max = w; primary = b; } }
    return primary;
  }
}

// ═══════════════════════════════════════════════════════════
// Layer 2: Micro-relief
// ═══════════════════════════════════════════════════════════

class MicroReliefLayer extends BaseLayer {
  constructor() {
    super(2, 'micro_relief', LOAD_PRIORITY.IMMEDIATE);
  }

  generate(chunk, context, helpers) {
    const { heightMap } = context;
    const { setBlock, getBlock } = helpers;
    const size = 16;

    // Small ±1 block surface variation
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        const baseHeight = Math.floor(heightMap[x + z * size]);
        const noiseVal = this._noise(x + context.ox, z + context.oz);
        const offset = Math.round(noiseVal * 1.5);

        if (offset > 0) {
          // Raise surface
          for (let dy = 0; dy < offset; dy++) {
            const y = baseHeight + 1 + dy;
            if (getBlock(x, y, z) === 0 || getBlock(x, y, z) === 9) { // air or water
              setBlock(x, y, z, this._surfaceBlock(context));
            }
          }
        }
      }
    }
  }

  _noise(x, z) {
    // Simple hash-based noise for micro relief
    const h = Math.sin(x * 0.15 + z * 0.13) * 0.5 + Math.cos(x * 0.09 - z * 0.11) * 0.5;
    return h;
  }

  _surfaceBlock(context) {
    const biome = this._primaryBiome(context.biomeWeights);
    if (biome === BIOMES.DESERT || biome === BIOMES.BEACH) return 'sand';
    if (biome === BIOMES.SNOWY_PLAINS) return 'snow';
    if (biome === BIOMES.MOUNTAINS) return 'stone';
    return 'grass';
  }

  _primaryBiome(weights) {
    let max = 0, primary = BIOMES.PLAINS;
    for (const [b, w] of weights) { if (w > max) { max = w; primary = b; } }
    return primary;
  }
}

// ═══════════════════════════════════════════════════════════
// Layer 3: Surface Rocks
// ═══════════════════════════════════════════════════════════

class SurfaceRocksLayer extends BaseLayer {
  constructor() {
    super(3, 'surface_rocks', LOAD_PRIORITY.HIGH);
    // G-03: Cellular noise F1*F2 for organic rock clustering patterns
    this._cellular = new FastNoiseLite(7777);
    this._cellular.setNoiseType(FN_NOISE_TYPE.CELLULAR);
    this._cellular.setCellularReturnType(FN_CELLULAR_RETURN.F1_TIMES_F2);
  }

  generate(chunk, context, helpers) {
    const { heightMap, zone, ox, oz } = context;
    const { setBlock, getBlock } = helpers;
    const density = (zone.type === ZONE_TYPES.CLIFFS || zone.type === ZONE_TYPES.GORGE) ? 0.15 : 0.04;

    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        // G-03: Use cellular F1*F2 instead of _hash() for organic rock distribution
        const cellValue = this._cellular.cellular2D((ox + x) * 0.08, (oz + z) * 0.08);
        if (cellValue < density) {
          const y = Math.floor(heightMap[x + z * 16]);
          if (getBlock(x, y + 1, z) === 0) { // air above
            setBlock(x, y + 1, z, 'cobblestone');
            if (cellValue < density * 0.4) {
              setBlock(x, y + 2, z, 'cobblestone');
            }
          }
        }
      }
    }
  }

  _hash(x, z) {
    return ((x * 374761393 + z * 668265263) & 0x7FFFFFFF) / 0x7FFFFFFF;
  }
}

// ═══════════════════════════════════════════════════════════
// Layer 4: Major Vegetation (Trees)
// ═══════════════════════════════════════════════════════════

class MajorVegetationLayer extends BaseLayer {
  constructor() {
    super(4, 'major_vegetation', LOAD_PRIORITY.HIGH);
    this._poisson = new PoissonDiskSampler(42);
    this._poissonCache = new Map();
  }

  generate(chunk, context, helpers) {
    const { heightMap, biomeWeights, region, zone, ox, oz, vegetationBoost } = context;
    const { setBlock, getBlock } = helpers;

    const primaryBiome = this._primaryBiome(biomeWeights);
    const treeDensity = (region.treeDensity || 0.05) * (vegetationBoost || 1.0);
    const zoneMult = zone.type === ZONE_TYPES.DENSE_FOREST ? 1.5 :
                     zone.type === ZONE_TYPES.CLEARING ? 0.1 :
                     zone.type === ZONE_TYPES.GROVE ? 1.3 : 1.0;
    const effectiveDensity = treeDensity * zoneMult;

    if (effectiveDensity < 0.005) return;

    const minRadius = this._getMinRadius(primaryBiome);
    const targetCount = Math.floor(effectiveDensity * 256);

    const cacheKey = `${ox},${oz}`;
    let points = this._poissonCache.get(cacheKey);
    if (!points) {
      points = this._poisson.sampleChunkWithDensity(16, targetCount, minRadius, ox, oz);
      if (this._poissonCache.size > 200) this._poissonCache.clear();
      this._poissonCache.set(cacheKey, points);
    }

    for (const pt of points) {
      const x = Math.floor(pt.x);
      const z = Math.floor(pt.z);
      if (x < 2 || x > 13 || z < 2 || z > 13) continue;

      const y = Math.floor(heightMap[x + z * 16]);
      if (getBlock(x, y, z) !== 0 && getBlock(x, y + 1, z) === 0) {
        const hash = this._hash(ox + x, oz + z);
        const treeType = this._getTreeType(primaryBiome, hash);
        this._placeTree(x, y + 1, z, treeType, setBlock, hash);
      }
    }
  }

  _getMinRadius(biome) {
    switch (biome) {
      case BIOMES.JUNGLE: return 4;
      case BIOMES.FOREST: return 3;
      case BIOMES.TAIGA: return 3;
      case BIOMES.SWAMP: return 3;
      case BIOMES.MEADOW: return 4;
      case BIOMES.CHERRY_GROVE: return 4;
      case BIOMES.AUTUMN_FOREST: return 3;
      case BIOMES.SAVANNA: return 5;
      case BIOMES.PLAINS: return 6;
      default: return 4;
    }
  }

  _getTreeType(biome, hash) {
    switch (biome) {
      case BIOMES.JUNGLE: return hash < 0.2 ? 'giant_jungle' : 'jungle';
      case BIOMES.TAIGA: return 'spruce';
      case BIOMES.SNOWY_PLAINS: return 'spruce';
      case BIOMES.SAVANNA: return 'acacia';
      case BIOMES.SWAMP: return 'swamp_oak';
      case BIOMES.CHERRY_GROVE: return 'cherry';
      case BIOMES.MYSTIC_GROVE: return 'mystic';
      case BIOMES.AUTUMN_FOREST: return hash < 0.6 ? 'autumn_oak' : 'oak';
      case BIOMES.MEADOW: return hash < 0.5 ? 'oak' : 'birch';
      case BIOMES.FOREST: return hash < 0.7 ? 'oak' : 'birch';
      default: return 'oak';
    }
  }

  _placeTree(x, y, z, type, setBlock, hash) {
    const height = 4 + Math.floor(hash * 3);

    switch (type) {
      case 'oak':
        for (let dy = 0; dy < height; dy++) setBlock(x, y + dy, z, 'wood');
        for (let dx = -2; dx <= 2; dx++)
          for (let dz = -2; dz <= 2; dz++)
            for (let dy = height - 2; dy <= height + 1; dy++) {
              const dist = Math.abs(dx) + Math.abs(dz) + Math.abs(dy - height);
              if (dist <= 3 && !(dx === 0 && dz === 0 && dy < height))
                setBlock(x + dx, y + dy, z + dz, 'leaves');
            }
        break;

      case 'birch':
        for (let dy = 0; dy < height + 1; dy++) setBlock(x, y + dy, z, 'birch_wood');
        for (let dx = -2; dx <= 2; dx++)
          for (let dz = -2; dz <= 2; dz++)
            for (let dy = height - 1; dy <= height + 1; dy++) {
              const dist = Math.abs(dx) + Math.abs(dz) + Math.abs(dy - height);
              if (dist <= 3 && !(dx === 0 && dz === 0 && dy < height))
                setBlock(x + dx, y + dy, z + dz, 'leaves');
            }
        break;

      case 'spruce':
        for (let dy = 0; dy < height + 2; dy++) setBlock(x, y + dy, z, 'spruce_wood');
        // Conical canopy
        for (let layer = 0; layer < 4; layer++) {
          const r = 2 - Math.floor(layer / 2);
          const ly = height - 1 + layer;
          for (let dx = -r; dx <= r; dx++)
            for (let dz = -r; dz <= r; dz++) {
              if (Math.abs(dx) + Math.abs(dz) <= r && !(dx === 0 && dz === 0))
                setBlock(x + dx, y + ly, z + dz, 'leaves_dark');
            }
        }
        break;

      case 'jungle':
        for (let dy = 0; dy < height + 4; dy++) setBlock(x, y + dy, z, 'birch_wood');
        for (let dx = -2; dx <= 2; dx++)
          for (let dz = -2; dz <= 2; dz++)
            for (let dy = height; dy <= height + 3; dy++) {
              const dist = Math.abs(dx) + Math.abs(dz) + Math.abs(dy - height - 1);
              if (dist <= 4) setBlock(x + dx, y + dy, z + dz, 'leaves');
            }
        break;

      case 'cherry':
        for (let dy = 0; dy < height; dy++) setBlock(x, y + dy, z, 'wood');
        for (let dx = -2; dx <= 2; dx++)
          for (let dz = -2; dz <= 2; dz++)
            for (let dy = height - 2; dy <= height; dy++) {
              const dist = Math.abs(dx) + Math.abs(dz) + Math.abs(dy - height + 1);
              if (dist <= 3 && !(dx === 0 && dz === 0 && dy < height))
                setBlock(x + dx, y + dy, z + dz, 'leaves_pink');
            }
        break;

      default:
        // Generic tree (oak-like)
        for (let dy = 0; dy < height; dy++) setBlock(x, y + dy, z, 'wood');
        for (let dx = -2; dx <= 2; dx++)
          for (let dz = -2; dz <= 2; dz++)
            for (let dy = height - 2; dy <= height + 1; dy++) {
              const dist = Math.abs(dx) + Math.abs(dz) + Math.abs(dy - height);
              if (dist <= 3 && !(dx === 0 && dz === 0 && dy < height))
                setBlock(x + dx, y + dy, z + dz, 'leaves');
            }
    }
  }

  _primaryBiome(weights) {
    let max = 0, primary = BIOMES.PLAINS;
    for (const [b, w] of weights) { if (w > max) { max = w; primary = b; } }
    return primary;
  }

  _hash(x, z) {
    return ((x * 374761393 + z * 668265263) & 0x7FFFFFFF) / 0x7FFFFFFF;
  }
}

// ═══════════════════════════════════════════════════════════
// Layer 5: Minor Vegetation (Flowers, Grass, Bushes)
// ═══════════════════════════════════════════════════════════

class MinorVegetationLayer extends BaseLayer {
  constructor() {
    super(5, 'minor_vegetation', LOAD_PRIORITY.MEDIUM);
    this._poisson = new PoissonDiskSampler(137);
    this._poissonCache = new Map();
  }

  generate(chunk, context, helpers) {
    const { heightMap, biomeWeights, zone, ox, oz, vegetationBoost } = context;
    const { setBlock, getBlock } = helpers;

    const primaryBiome = this._primaryBiome(biomeWeights);
    const zoneMult = zone.type === ZONE_TYPES.MEADOW ? 2.5 :
                     zone.type === ZONE_TYPES.CLEARING ? 2.0 :
                     zone.type === ZONE_TYPES.DENSE_FOREST ? 0.3 : 1.0;

    const density = this._getBiomeDensity(primaryBiome) * zoneMult * (vegetationBoost || 1.0);
    if (density < 0.01) return;

    const minRadius = this._getMinRadius(primaryBiome);
    const targetCount = Math.floor(density * 256);

    const cacheKey = `${ox},${oz}`;
    let points = this._poissonCache.get(cacheKey);
    if (!points) {
      points = this._poisson.sampleChunkWithDensity(16, targetCount, minRadius, ox, oz);
      if (this._poissonCache.size > 200) this._poissonCache.clear();
      this._poissonCache.set(cacheKey, points);
    }

    for (const pt of points) {
      const x = Math.floor(pt.x);
      const z = Math.floor(pt.z);
      if (x < 0 || x > 15 || z < 0 || z > 15) continue;

      const y = Math.floor(heightMap[x + z * 16]);
      if (getBlock(x, y + 1, z) === 0 && getBlock(x, y, z) !== 9) {
        const hash = this._hash(ox + x, oz + z);
        const block = this._getVegBlock(primaryBiome, hash);
        if (block) setBlock(x, y + 1, z, block);
      }
    }
  }

  _getMinRadius(biome) {
    switch (biome) {
      case BIOMES.MEADOW: return 1.5;
      case BIOMES.CHERRY_GROVE: return 1.5;
      case BIOMES.JUNGLE: return 1.0;
      case BIOMES.FOREST: return 1.2;
      case BIOMES.PLAINS: return 1.8;
      case BIOMES.SWAMP: return 1.2;
      case BIOMES.AUTUMN_FOREST: return 1.2;
      case BIOMES.SAVANNA: return 2.0;
      case BIOMES.DESERT: return 2.5;
      default: return 1.5;
    }
  }

  _getBiomeDensity(biome) {
    switch (biome) {
      case BIOMES.MEADOW: return 0.25;
      case BIOMES.CHERRY_GROVE: return 0.20;
      case BIOMES.JUNGLE: return 0.15;
      case BIOMES.FOREST: return 0.10;
      case BIOMES.PLAINS: return 0.08;
      case BIOMES.SWAMP: return 0.12;
      case BIOMES.AUTUMN_FOREST: return 0.10;
      case BIOMES.SAVANNA: return 0.04;
      case BIOMES.DESERT: return 0.02;
      default: return 0.05;
    }
  }

  _getVegBlock(biome, hash) {
    const r = hash * 10;
    switch (biome) {
      case BIOMES.DESERT: return 'dead_bush';
      case BIOMES.JUNGLE: return r < 5 ? 'fern' : 'tall_grass';
      case BIOMES.TAIGA: return 'fern';
      case BIOMES.SWAMP: return r < 3 ? 'fern' : 'tall_grass';
      case BIOMES.MEADOW: return r < 3 ? 'flower_red' : r < 5 ? 'flower_yellow' : 'tall_grass';
      case BIOMES.CHERRY_GROVE: return r < 4 ? 'flower_red' : 'tall_grass';
      case BIOMES.PLAINS: return r < 2 ? 'flower_red' : r < 4 ? 'flower_yellow' : 'tall_grass';
      default: return r < 3 ? 'flower_red' : 'tall_grass';
    }
  }

  _primaryBiome(weights) {
    let max = 0, primary = BIOMES.PLAINS;
    for (const [b, w] of weights) { if (w > max) { max = w; primary = b; } }
    return primary;
  }

  _hash(x, z) {
    return ((x * 374761393 + z * 668265263) & 0x7FFFFFFF) / 0x7FFFFFFF;
  }
}

// ═══════════════════════════════════════════════════════════
// Layer 6: Natural Decoration (Logs, Moss, Mushrooms, Stones)
// ═══════════════════════════════════════════════════════════

class NaturalDecorationLayer extends BaseLayer {
  constructor() {
    super(6, 'natural_decoration', LOAD_PRIORITY.MEDIUM);
  }

  generate(chunk, context, helpers) {
    const { heightMap, biomeWeights, zone, ox, oz } = context;
    const { setBlock, getBlock } = helpers;

    const primaryBiome = this._primaryBiome(biomeWeights);
    const isForest = [BIOMES.FOREST, BIOMES.AUTUMN_FOREST, BIOMES.JUNGLE, BIOMES.TAIGA].includes(primaryBiome);
    const density = isForest ? 0.03 : 0.005;

    for (let x = 1; x < 15; x++) {
      for (let z = 1; z < 15; z++) {
        const hash = this._hash(ox + x, oz + z);
        if (hash < density) {
          const y = Math.floor(heightMap[x + z * 16]);
          if (getBlock(x, y + 1, z) === 0) {
            // Fallen log (horizontal, 2-3 blocks)
            const logLen = 2 + Math.floor(hash * 2);
            const direction = hash > 0.5 ? 'x' : 'z';
            for (let i = 0; i < logLen; i++) {
              const lx = direction === 'x' ? x + i : x;
              const lz = direction === 'z' ? z + i : z;
              if (lx < 16 && lz < 16 && getBlock(lx, y + 1, lz) === 0) {
                setBlock(lx, y + 1, lz, 'wood');
              }
            }
          }
        }
      }
    }

    // Mushrooms in dark/forest areas
    if (isForest || zone.type === ZONE_TYPES.WETLANDS) {
      for (let x = 0; x < 16; x++) {
        for (let z = 0; z < 16; z++) {
          const hash = this._hash(ox + x + 999, oz + z + 999);
          if (hash < 0.02) {
            const y = Math.floor(heightMap[x + z * 16]);
            if (getBlock(x, y + 1, z) === 0 && getBlock(x, y, z) !== 0) {
              setBlock(x, y + 1, z, hash < 0.01 ? 'mushroom_brown' : 'mushroom_red');
            }
          }
        }
      }
    }
  }

  _primaryBiome(weights) {
    let max = 0, primary = BIOMES.PLAINS;
    for (const [b, w] of weights) { if (w > max) { max = w; primary = b; } }
    return primary;
  }

  _hash(x, z) {
    return ((x * 374761393 + z * 668265263) & 0x7FFFFFFF) / 0x7FFFFFFF;
  }
}

// ═══════════════════════════════════════════════════════════
// Layer 7: Fauna (Mob spawns)
// ═══════════════════════════════════════════════════════════

class FaunaLayer extends BaseLayer {
  constructor() {
    super(7, 'fauna', LOAD_PRIORITY.LOW);
  }

  generate(chunk, context, helpers) {
    // Fauna is handled by existing mob spawn system
    // This layer marks spawn points for the mob system to pick up
    const { heightMap, biomeWeights, zone, ox, oz } = context;
    const primaryBiome = this._primaryBiome(biomeWeights);

    // Store spawn candidates in chunk metadata
    if (!chunk.metadata) chunk.metadata = {};
    if (!chunk.metadata.spawnPoints) chunk.metadata.spawnPoints = [];

    const spawnDensity = this._getSpawnDensity(primaryBiome, zone.type);
    for (let x = 0; x < 16; x += 4) {
      for (let z = 0; z < 16; z += 4) {
        const hash = this._hash(ox + x, oz + z);
        if (hash < spawnDensity) {
          const y = Math.floor(heightMap[x + z * 16]);
          chunk.metadata.spawnPoints.push({
            x: ox + x + 0.5,
            y: y + 1,
            z: oz + z + 0.5,
            biome: primaryBiome,
            zoneType: zone.type,
          });
        }
      }
    }
  }

  _getSpawnDensity(biome, zoneType) {
    if (zoneType === ZONE_TYPES.CLIFFS || zoneType === ZONE_TYPES.GORGE) return 0.01;
    switch (biome) {
      case BIOMES.JUNGLE: return 0.08;
      case BIOMES.FOREST: return 0.05;
      case BIOMES.PLAINS: return 0.04;
      case BIOMES.SWAMP: return 0.06;
      default: return 0.02;
    }
  }

  _primaryBiome(weights) {
    let max = 0, primary = BIOMES.PLAINS;
    for (const [b, w] of weights) { if (w > max) { max = w; primary = b; } }
    return primary;
  }

  _hash(x, z) {
    return ((x * 374761393 + z * 668265263) & 0x7FFFFFFF) / 0x7FFFFFFF;
  }
}

// ═══════════════════════════════════════════════════════════
// Layer 8: Ambient Audio
// ═══════════════════════════════════════════════════════════

class AmbientAudioLayer extends BaseLayer {
  constructor() {
    super(8, 'ambient_audio', LOAD_PRIORITY.LOW);
  }

  generate(chunk, context, helpers) {
    // Store audio profile for ambient sound system to pick up
    if (!chunk.metadata) chunk.metadata = {};
    const primaryBiome = this._primaryBiome(context.biomeWeights);
    chunk.metadata.ambientAudio = {
      biome: primaryBiome,
      zoneType: context.zone.type,
      moodTag: context.zone.moodTag,
    };
  }

  _primaryBiome(weights) {
    let max = 0, primary = BIOMES.PLAINS;
    for (const [b, w] of weights) { if (w > max) { max = w; primary = b; } }
    return primary;
  }
}

// ═══════════════════════════════════════════════════════════
// Layer 9: Dynamic Events (Butterflies, Fireflies, Mist)
// ═══════════════════════════════════════════════════════════

class DynamicEventsLayer extends BaseLayer {
  constructor() {
    super(9, 'dynamic_events', LOAD_PRIORITY.LOW);
  }

  generate(chunk, context, helpers) {
    if (!chunk.metadata) chunk.metadata = {};
    const { zone, biomeWeights, heightMap, ox, oz } = context;
    const primaryBiome = this._primaryBiome(biomeWeights);

    const events = [];

    // Butterflies in meadows and clearings
    if (zone.type === ZONE_TYPES.MEADOW || zone.type === ZONE_TYPES.CLEARING ||
        primaryBiome === BIOMES.MEADOW || primaryBiome === BIOMES.CHERRY_GROVE) {
      events.push({ type: 'butterflies', count: 3 + Math.floor(this._hash(ox, oz) * 5) });
    }

    // Fireflies in forests and swamps at night
    if (primaryBiome === BIOMES.FOREST || primaryBiome === BIOMES.SWAMP ||
        primaryBiome === BIOMES.JUNGLE || zone.type === ZONE_TYPES.WETLANDS) {
      events.push({ type: 'fireflies', count: 5 + Math.floor(this._hash(ox + 1, oz + 1) * 8) });
    }

    // Falling leaves in autumn forest
    if (primaryBiome === BIOMES.AUTUMN_FOREST) {
      events.push({ type: 'falling_leaves', count: 4 + Math.floor(this._hash(ox + 2, oz + 2) * 6) });
    }

    // Mist near waterfalls and wetlands
    if (zone.type === ZONE_TYPES.WATERFALL || zone.type === ZONE_TYPES.WETLANDS) {
      events.push({ type: 'mist', density: 0.3 });
    }

    // Aurora in aurora tundra
    if (primaryBiome === BIOMES.AURORA_TUNDRA) {
      events.push({ type: 'aurora', intensity: 0.8 });
    }

    chunk.metadata.dynamicEvents = events;
  }

  _primaryBiome(weights) {
    let max = 0, primary = BIOMES.PLAINS;
    for (const [b, w] of weights) { if (w > max) { max = w; primary = b; } }
    return primary;
  }

  _hash(x, z) {
    return ((x * 374761393 + z * 668265263) & 0x7FFFFFFF) / 0x7FFFFFFF;
  }
}

// ═══════════════════════════════════════════════════════════
// Layer System — Registry and orchestration
// ═══════════════════════════════════════════════════════════

export class LayerSystem {
  constructor() {
    this.layers = [
      new TerrainLayer(),
      new MicroReliefLayer(),
      new SurfaceRocksLayer(),
      new MajorVegetationLayer(),
      new MinorVegetationLayer(),
      new NaturalDecorationLayer(),
      new FaunaLayer(),
      new AmbientAudioLayer(),
      new DynamicEventsLayer(),
    ];
  }

  // Generate all required layers for a chunk
  generateAll(chunk, context, helpers) {
    for (const layer of this.layers) {
      if (!layer.enabled) continue;
      layer.generate(chunk, context, helpers);
    }
  }

  // Generate only layers up to a certain priority
  generateUpTo(chunk, context, helpers, maxPriority) {
    for (const layer of this.layers) {
      if (!layer.enabled) continue;
      if (layer.priority > maxPriority) break;
      layer.generate(chunk, context, helpers);
    }
  }

  // Generate a specific layer
  generateLayer(layerId, chunk, context, helpers) {
    const layer = this.layers.find(l => l.id === layerId);
    if (layer && layer.enabled) layer.generate(chunk, context, helpers);
  }

  // Get layers by priority
  getLayersByPriority(priority) {
    return this.layers.filter(l => l.priority === priority && l.enabled);
  }

  // Enable/disable a layer
  setLayerEnabled(id, enabled) {
    const layer = this.layers.find(l => l.id === id);
    if (layer) layer.enabled = enabled;
  }

  // Get layer info
  getLayerInfo() {
    return this.layers.map(l => ({
      id: l.id,
      name: l.name,
      priority: l.priority,
      required: l.isRequired(),
      enabled: l.enabled,
    }));
  }
}

export { LOAD_PRIORITY };
