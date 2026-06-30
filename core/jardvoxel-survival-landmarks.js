// ═══════════════════════════════════════════════════════════
// JardVoxel 7.0 — Landmarks System
// SPEC-108: Unique points of interest per region
// ═══════════════════════════════════════════════════════════

import { REGION_TYPES, CHUNK_SIZE } from './jardvoxel-survival-world-hierarchy.js';

// Landmark types and their valid regions
const LANDMARK_TYPES = {
  ANCIENT_TREE: {
    id: 'ancient_tree',
    name: 'Ancient Tree',
    validRegions: [REGION_TYPES.FOREST, REGION_TYPES.JUNGLE, REGION_TYPES.PLAINS],
    size: 1, // chunks
    moodTag: 'mystical',
  },
  GRAND_WATERFALL: {
    id: 'grand_waterfall',
    name: 'Grand Waterfall',
    validRegions: [REGION_TYPES.MOUNTAIN_RANGE, REGION_TYPES.JUNGLE, REGION_TYPES.PLATEAU],
    size: 2,
    moodTag: 'grand',
  },
  VOLCANO: {
    id: 'volcano',
    name: 'Volcano',
    validRegions: [REGION_TYPES.VOLCANIC, REGION_TYPES.MOUNTAIN_RANGE],
    size: 3,
    moodTag: 'intense',
  },
  CRYSTAL_LAKE: {
    id: 'crystal_lake',
    name: 'Crystal Lake',
    validRegions: [REGION_TYPES.FOREST, REGION_TYPES.PLAINS, REGION_TYPES.TUNDRA, REGION_TYPES.MOUNTAIN_RANGE],
    size: 2,
    moodTag: 'serene',
  },
  CANYON: {
    id: 'canyon',
    name: 'Canyon',
    validRegions: [REGION_TYPES.MOUNTAIN_RANGE, REGION_TYPES.PLATEAU, REGION_TYPES.DESERT],
    size: 4,
    moodTag: 'grand',
  },
  STONE_ARCH: {
    id: 'stone_arch',
    name: 'Stone Arch',
    validRegions: [REGION_TYPES.MOUNTAIN_RANGE, REGION_TYPES.PLATEAU, REGION_TYPES.COAST],
    size: 1,
    moodTag: 'grand',
  },
  RED_FOREST: {
    id: 'red_forest',
    name: 'Red Forest',
    validRegions: [REGION_TYPES.FOREST, REGION_TYPES.JUNGLE],
    size: 2,
    moodTag: 'mysterious',
  },
  ANCIENT_RUINS: {
    id: 'ancient_ruins',
    name: 'Ancient Ruins',
    validRegions: [REGION_TYPES.PLAINS, REGION_TYPES.FOREST, REGION_TYPES.DESERT, REGION_TYPES.JUNGLE, REGION_TYPES.PLATEAU],
    size: 1,
    moodTag: 'mysterious',
  },
  NATURAL_SHRINE: {
    id: 'natural_shrine',
    name: 'Natural Shrine',
    validRegions: [REGION_TYPES.FOREST, REGION_TYPES.MOUNTAIN_RANGE, REGION_TYPES.TUNDRA, REGION_TYPES.JUNGLE],
    size: 1,
    moodTag: 'serene',
  },
};

export class LandmarkSystem {
  constructor(seed) {
    this.seed = seed;
    this.landmarks = new Map(); // key: "cx,cz" → landmark data
    this._regionLandmarks = new Map(); // regionKey → landmark
  }

  // Try to place a landmark in a region
  tryPlaceLandmark(cx, cz, region, zone) {
    const regionKey = this._regionKey(cx, cz, region);

    // Already placed for this region?
    if (this._regionLandmarks.has(regionKey)) {
      return this._regionLandmarks.get(regionKey);
    }

    // Check probability
    const chance = region.landmarkChance || 0.4;
    const hash = this._hash(cx * 17 + 31, cz * 31 + 17);
    if (hash > chance) {
      this._regionLandmarks.set(regionKey, null);
      return null;
    }

    // Pick valid landmark type for this region
    const validTypes = Object.values(LANDMARK_TYPES).filter(lt =>
      lt.validRegions.includes(region.type)
    );
    if (validTypes.length === 0) {
      this._regionLandmarks.set(regionKey, null);
      return null;
    }

    const typeIdx = Math.floor(this._hash(cx + 999, cz + 999) * validTypes.length);
    const landmarkType = validTypes[typeIdx];

    const landmark = {
      type: landmarkType.id,
      name: landmarkType.name,
      cx, cz,
      size: landmarkType.size,
      moodTag: landmarkType.moodTag,
      regionType: region.type,
      zoneType: zone.type,
    };

    this._regionLandmarks.set(regionKey, landmark);
    this.landmarks.set((cx + 32768) * 65536 + (cz + 32768), landmark);
    return landmark;
  }

  // Get landmark at or near a position
  getLandmark(cx, cz) {
    return this.landmarks.get((cx + 32768) * 65536 + (cz + 32768)) || null;
  }

  // Get all landmarks within radius
  getLandmarksInRadius(cx, cz, radius) {
    const result = [];
    for (const landmark of this.landmarks.values()) {
      const dx = landmark.cx - cx;
      const dz = landmark.cz - cz;
      if (Math.sqrt(dx * dx + dz * dz) <= radius) {
        result.push(landmark);
      }
    }
    return result;
  }

  // Generate landmark blocks in a chunk
  generateLandmarkBlocks(chunk, context, helpers) {
    const landmark = this.getLandmark(context.cx, context.cz);
    if (!landmark) return;

    const { setBlock, getBlock } = helpers;
    const { heightMap } = context;

    switch (landmark.type) {
      case 'ancient_tree':
        this._placeAncientTree(chunk, heightMap, setBlock);
        break;
      case 'grand_waterfall':
        this._placeWaterfall(chunk, heightMap, context.waterLevel, setBlock);
        break;
      case 'volcano':
        this._placeVolcano(chunk, heightMap, setBlock);
        break;
      case 'crystal_lake':
        this._placeCrystalLake(chunk, heightMap, context.waterLevel, setBlock);
        break;
      case 'stone_arch':
        this._placeStoneArch(chunk, heightMap, setBlock);
        break;
      case 'ancient_ruins':
        this._placeRuins(chunk, heightMap, setBlock);
        break;
      case 'natural_shrine':
        this._placeShrine(chunk, heightMap, setBlock);
        break;
      case 'red_forest':
        this._placeRedForest(chunk, heightMap, setBlock);
        break;
      case 'canyon':
        this._placeCanyon(chunk, heightMap, setBlock);
        break;
    }
  }

  _placeAncientTree(chunk, heightMap, setBlock) {
    const cx = CHUNK_SIZE / 2, cz = CHUNK_SIZE / 2;
    const y = Math.floor(heightMap[cx + cz * CHUNK_SIZE]);
    // Massive trunk 5x5
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = 0; dy < 25; dy++) {
          setBlock(cx + dx, y + dy, cz + dz, 'wood');
        }
      }
    }
    // Canopy
    for (let dx = -5; dx <= 5; dx++) {
      for (let dz = -5; dz <= 5; dz++) {
        for (let dy = 20; dy <= 30; dy++) {
          const dist = Math.abs(dx) + Math.abs(dz) + Math.abs(dy - 25);
          if (dist <= 8) setBlock(cx + dx, y + dy, cz + dz, 'leaves');
        }
      }
    }
  }

  _placeWaterfall(chunk, heightMap, waterLevel, setBlock) {
    const cx = CHUNK_SIZE / 2, cz = CHUNK_SIZE / 2;
    const topY = Math.floor(heightMap[cx + cz * CHUNK_SIZE]);
    const bottomY = Math.max(waterLevel, topY - 20);
    // Water column
    for (let dy = bottomY; dy <= topY; dy++) {
      setBlock(cx, dy, cz, 'water');
      setBlock(cx + 1, dy, cz, 'water');
    }
    // Pool at base
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        if (Math.abs(dx) + Math.abs(dz) <= 4) {
          setBlock(cx + dx, bottomY, cz + dz, 'water');
        }
      }
    }
  }

  _placeVolcano(chunk, heightMap, setBlock) {
    const cx = CHUNK_SIZE / 2, cz = CHUNK_SIZE / 2;
    const baseY = Math.floor(heightMap[cx + cz * CHUNK_SIZE]);
    // Cone shape
    for (let dy = 0; dy < 30; dy++) {
      const radius = 8 - Math.floor(dy * 0.25);
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (Math.sqrt(dx * dx + dz * dz) <= radius) {
            setBlock(cx + dx, baseY + dy, cz + dz, dy > 25 ? 'lava' : 'stone');
          }
        }
      }
    }
    // Lava lake at top
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        setBlock(cx + dx, baseY + 28, cz + dz, 'lava');
      }
    }
  }

  _placeCrystalLake(chunk, heightMap, waterLevel, setBlock) {
    const cx = CHUNK_SIZE / 2, cz = CHUNK_SIZE / 2;
    const y = Math.floor(heightMap[cx + cz * CHUNK_SIZE]);
    // Shallow lake with crystal (glowstone) floor
    for (let dx = -5; dx <= 5; dx++) {
      for (let dz = -5; dz <= 5; dz++) {
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= 5) {
          setBlock(cx + dx, y - 1, cz + dz, 'glowstone');
          setBlock(cx + dx, y, cz + dz, 'water');
        }
      }
    }
  }

  _placeStoneArch(chunk, heightMap, setBlock) {
    const cx = CHUNK_SIZE / 2, cz = CHUNK_SIZE / 2;
    const y = Math.floor(heightMap[cx + cz * CHUNK_SIZE]);
    // Arch: two pillars + top
    for (let dy = 0; dy < 12; dy++) {
      setBlock(cx - 3, y + dy, cz, 'stone');
      setBlock(cx + 3, y + dy, cz, 'stone');
    }
    for (let dx = -3; dx <= 3; dx++) {
      setBlock(cx + dx, y + 12, cz, 'stone');
      setBlock(cx + dx, y + 13, cz, 'stone');
    }
  }

  _placeRuins(chunk, heightMap, setBlock) {
    const cx = CHUNK_SIZE / 2, cz = CHUNK_SIZE / 2;
    const y = Math.floor(heightMap[cx + cz * CHUNK_SIZE]);
    // Partial stone brick walls
    for (let dx = -3; dx <= 3; dx++) {
      setBlock(cx + dx, y, cz - 3, 'stone_bricks');
      setBlock(cx + dx, y + 1, cz - 3, 'stone_bricks');
      if (dx % 2 === 0) setBlock(cx + dx, y + 2, cz - 3, 'stone_bricks');
    }
    for (let dz = -3; dz <= 3; dz++) {
      setBlock(cx - 3, y, cz + dz, 'stone_bricks');
      setBlock(cx - 3, y + 1, cz + dz, 'stone_bricks');
    }
    // Floor
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        setBlock(cx + dx, y, cz + dz, 'stone_bricks');
      }
    }
  }

  _placeShrine(chunk, heightMap, setBlock) {
    const cx = CHUNK_SIZE / 2, cz = CHUNK_SIZE / 2;
    const y = Math.floor(heightMap[cx + cz * CHUNK_SIZE]);
    // Serene meditation spot: stone platform + lantern
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        setBlock(cx + dx, y, cz + dz, 'smooth_stone');
      }
    }
    setBlock(cx, y + 1, cz, 'lantern');
    // Cherry leaves around
    setBlock(cx - 2, y + 1, cz, 'leaves_pink');
    setBlock(cx + 2, y + 1, cz, 'leaves_pink');
    setBlock(cx, y + 1, cz - 2, 'leaves_pink');
    setBlock(cx, y + 1, cz + 2, 'leaves_pink');
  }

  _placeRedForest(chunk, heightMap, setBlock) {
    // Grove of red-leaved trees
    const h = CHUNK_SIZE / 2;
    const positions = [[h - 4, h - 4], [h + 4, h - 4], [h - 4, h + 4], [h + 4, h + 4], [h, h]];
    for (const [tx, tz] of positions) {
      const y = Math.floor(heightMap[tx + tz * CHUNK_SIZE]);
      for (let dy = 0; dy < 6; dy++) setBlock(tx, y + dy, tz, 'wood');
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          for (let dy = 4; dy <= 7; dy++) {
            if (Math.abs(dx) + Math.abs(dz) + Math.abs(dy - 5) <= 4) {
              setBlock(tx + dx, y + dy, tz + dz, 'red_leaves');
            }
          }
        }
      }
    }
  }

  _placeCanyon(chunk, heightMap, setBlock) {
    // Deep gorge through the chunk
    const cx = 8;
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const y = Math.floor(heightMap[cx + z * CHUNK_SIZE]);
      for (let dy = 0; dy < 20; dy++) {
        setBlock(cx, y - dy, z, 'air');
        setBlock(cx + 1, y - dy, z, 'air');
        // Walls
        if (dy > 2) {
          setBlock(cx - 1, y - dy, z, 'stone');
          setBlock(cx + 2, y - dy, z, 'stone');
        }
      }
    }
  }

  _regionKey(cx, cz, region) {
    // Group chunks into region-sized blocks for landmark placement
    const rx = Math.floor(cx / 8);
    const rz = Math.floor(cz / 8);
    return `${rx},${rz},${region.type}`;
  }

  _hash(x, z) {
    return ((x * 374761393 + z * 668265263) & 0x7FFFFFFF) / 0x7FFFFFFF;
  }
}
