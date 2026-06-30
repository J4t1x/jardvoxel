// ═══════════════════════════════════════════════════════════
// JardVoxel 7.3 — Hydrology System (PRD P-02)
// Procedural river networks, lakes, valleys, and waterfalls
// Deterministic: same seed → same rivers
// ═══════════════════════════════════════════════════════════

import { SimplexNoise } from './jardvoxel-survival-noise.js';

const CHUNK_SIZE = 16;
const SEA_LEVEL = 63;

// River block IDs (must match engine block types)
const BLOCK_WATER = 5;
const BLOCK_STONE = 1;
const BLOCK_GRASS = 2;
const BLOCK_DIRT = 3;
const BLOCK_SAND = 4;
const BLOCK_GRAVEL = 35;
const BLOCK_CLAY = 36;

// Hydrology constants
const RIVER_SAMPLE_SCALE = 4; // Sample every 4 blocks for flow computation
const MAX_RIVER_WIDTH = 5;
const VALLEY_RADIUS = 12;
const VALLEY_DEPTH_MAX = 8;
const LAKE_MIN_SIZE = 3;
const LAKE_MAX_SIZE = 12;
const WATERFALL_MIN_DROP = 8;

// PRNG — deterministic Xorshift32
class _RNG {
  constructor(seed) {
    this.state = seed | 0 || 1;
  }
  next() {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x | 0;
    return ((this.state >>> 0) / 0xFFFFFFFF);
  }
}

// ═══════════════════════════════════════════════════════════
// HydrologySystem — main class
// Computes river networks from heightmap data and applies
// modifications to chunk heightmaps and block data.
// ═══════════════════════════════════════════════════════════

export class HydrologySystem {
  constructor(seed) {
    this.seed = seed;
    this.enabled = true;
    this._moistureNoise = new SimplexNoise(seed + 5555);
    this._riverNoise = new SimplexNoise(seed + 6666);
    this._flowCache = new Map(); // chunk key → river segments
    this._maxCacheSize = 300;
    this._lakeCache = new Map(); // chunk key → lake info
    this._maxLakeCacheSize = 200;
  }

  // ── Public API ──

  /**
   * Apply hydrology modifications to a chunk's heightmap.
   * Called after _computeHeightMap() but before block placement.
   * Returns modified heightmap + river/lake metadata.
   */
  applyToHeightmap(cx, cz, heightMap, context) {
    if (!this.enabled) return { heightMap, rivers: [], lakes: [], hydroData: null };
    const ox = cx * CHUNK_SIZE;
    const oz = cz * CHUNK_SIZE;
    const key = `${cx},${cz}`;

    // Get river segments passing through this chunk
    const rivers = this._getRiverSegments(cx, cz, context);
    // Get lake info for this chunk
    const lakes = this._getLakeInfo(cx, cz, context);

    const result = {
      heightMap: heightMap,
      rivers: [],
      lakes: [],
      waterfalls: [],
    };

    // Apply river valley carving to heightmap
    if (rivers.length > 0) {
      this._carveRiverValleys(heightMap, rivers, ox, oz);
      result.rivers = rivers;
    }

    // Apply lake depressions
    if (lakes.length > 0) {
      this._carveLakes(heightMap, lakes, ox, oz);
      result.lakes = lakes;
    }

    // Detect waterfalls (height drops along river path)
    if (rivers.length > 0) {
      result.waterfalls = this._detectWaterfalls(heightMap, rivers, ox, oz);
    }

    return result;
  }

  /**
   * Apply hydrology block modifications to a generated chunk.
   * Called after chunk.generate() but before vegetation.
   * Carves river channels, places water, adds riverbed blocks.
   */
  applyToChunk(chunk, hydroData, getBlock, setBlock) {
    if (!hydroData) return;
    const ox = chunk.cx * CHUNK_SIZE;
    const oz = chunk.cz * CHUNK_SIZE;

    // Carve river channels
    for (const river of hydroData.rivers) {
      this._carveRiverBlocks(chunk, river, ox, oz, getBlock, setBlock);
    }

    // Fill lakes with water
    for (const lake of hydroData.lakes) {
      this._fillLakeBlocks(chunk, lake, ox, oz, getBlock, setBlock);
    }

    // Mark waterfall blocks
    for (const wf of hydroData.waterfalls) {
      this._placeWaterfallBlocks(chunk, wf, ox, oz, getBlock, setBlock);
    }
  }

  // ── River Network Computation ──

  /**
   * Get river segments that pass through a given chunk.
   * Uses a deterministic pseudo-river network based on moisture
   * accumulation and gradient descent from high terrain.
   */
  _getRiverSegments(cx, cz, context) {
    const key = `${cx},${cz}`;
    if (this._flowCache.has(key)) return this._flowCache.get(key);

    const segments = [];
    const ox = cx * CHUNK_SIZE;
    const oz = cz * CHUNK_SIZE;

    // Sample river potential at chunk center
    const centerX = ox + 8;
    const centerZ = oz + 8;

    // River potential: high moisture + low terrain roughness + specific noise pattern
    const moisture = this._moistureNoise.fbm2D(centerX, centerZ, 3, 0.5, 2.0, 0.0008);
    const riverPotential = this._riverNoise.fbm2D(centerX, centerZ, 2, 0.5, 2.0, 0.0003);

    // Rivers form where potential is high and terrain is above sea level
    if (riverPotential > 0.35 && moisture > 0.2) {
      // Determine river direction from gradient (flow downhill)
      const dir = this._computeFlowDirection(centerX, centerZ, context);
      const width = 1 + Math.floor((riverPotential - 0.35) * 10);

      // Trace river path through chunk
      const path = this._traceRiverPath(centerX, centerZ, dir, context);

      segments.push({
        path: path,
        width: Math.min(width, MAX_RIVER_WIDTH),
        sourcePotential: riverPotential,
        direction: dir,
      });
    }

    // Also check neighboring chunks for rivers flowing into this one
    // (simplified: check 4 neighbors)
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx;
      const nz = cz + dz;
      const nKey = `${nx},${nz}`;
      const nCenterX = nx * CHUNK_SIZE + 8;
      const nCenterZ = nz * CHUNK_SIZE + 8;
      const nPotential = this._riverNoise.fbm2D(nCenterX, nCenterZ, 2, 0.5, 2.0, 0.0003);
      if (nPotential > 0.35) {
        const nDir = this._computeFlowDirection(nCenterX, nCenterZ, context);
        // If neighbor river flows toward this chunk, add entry segment
        const flowsToward = (dx === 1 && nDir.x > 0) || (dx === -1 && nDir.x < 0) ||
                           (dz === 1 && nDir.z > 0) || (dz === -1 && nDir.z < 0);
        if (flowsToward) {
          const entryPath = this._traceRiverPath(nCenterX, nCenterZ, nDir, context, centerX, centerZ);
          // Only include segments that enter this chunk
          const inChunkPath = entryPath.filter(p =>
            p.x >= ox && p.x < ox + CHUNK_SIZE && p.z >= oz && p.z < oz + CHUNK_SIZE
          );
          if (inChunkPath.length > 0) {
            segments.push({
              path: inChunkPath,
              width: Math.min(1 + Math.floor((nPotential - 0.35) * 10), MAX_RIVER_WIDTH),
              sourcePotential: nPotential,
              direction: nDir,
              fromNeighbor: true,
            });
          }
        }
      }
    }

    if (this._flowCache.size >= this._maxCacheSize) {
      const firstKey = this._flowCache.keys().next().value;
      this._flowCache.delete(firstKey);
    }
    this._flowCache.set(key, segments);
    return segments;
  }

  /**
   * Compute flow direction at a point using height gradient.
   * Returns normalized direction vector {x, z} pointing downhill.
   */
  _computeFlowDirection(x, z, context) {
    // Sample heights at 4 neighbors using the height estimate
    const hN = this._sampleHeight(x, z - RIVER_SAMPLE_SCALE, context);
    const hS = this._sampleHeight(x, z + RIVER_SAMPLE_SCALE, context);
    const hE = this._sampleHeight(x + RIVER_SAMPLE_SCALE, z, context);
    const hW = this._sampleHeight(x - RIVER_SAMPLE_SCALE, z, context);

    const dx = (hE - hW) / (2 * RIVER_SAMPLE_SCALE);
    const dz = (hS - hN) / (2 * RIVER_SAMPLE_SCALE);

    // Flow downhill (negative gradient)
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.001) {
      // Flat area: use river noise for direction
      const angle = this._riverNoise.noise2D(x * 0.001, z * 0.001) * Math.PI * 2;
      return { x: Math.cos(angle), z: Math.sin(angle) };
    }

    return { x: -dx / len, z: -dz / len };
  }

  /**
   * Sample approximate height at a world position.
   * Uses context heightmap if available, otherwise estimates from terrain.
   */
  _sampleHeight(x, z, context) {
    // Use the HierarchicalChunkGenerator's height estimate if available
    if (context && context.generator && context.region) {
      const region = context.region;
      const zone = context.zone;
      const continentProps = context.continent || context.generator.continentGen.getContinentProperties(x, z);
      return context.generator._estimateHeightAt(x, z, region, zone, continentProps);
    }
    // Fallback: use noise-based estimate
    if (context && context.region) {
      const baseHeight = context.heightMap 
        ? context.heightMap[8 + 8 * CHUNK_SIZE] 
        : SEA_LEVEL;
      return baseHeight + this._moistureNoise.noise2D(x * 0.01, z * 0.01) * 10;
    }
    return SEA_LEVEL;
  }

  /**
   * Trace a river path from a starting point in a flow direction.
   * Returns array of {x, z, height} points.
   */
  _traceRiverPath(startX, startZ, dir, context, targetX, targetZ) {
    const path = [];
    let x = startX;
    let z = startZ;
    const maxSteps = 32;
    const stepSize = 2;

    for (let i = 0; i < maxSteps; i++) {
      const h = this._sampleHeight(x, z, context);
      path.push({ x, z, height: h });

      // Stop if we hit sea level (river ends in ocean/lake)
      if (h <= SEA_LEVEL + 1) break;

      // Stop if we reach target (for cross-chunk tracing)
      if (targetX !== undefined) {
        const dist = Math.sqrt((x - targetX) ** 2 + (z - targetZ) ** 2);
        if (dist < 4) break;
      }

      // Recompute direction periodically (every 4 steps for performance)
      if (i % 4 === 0) {
        dir = this._computeFlowDirection(x, z, context);
      }

      x += dir.x * stepSize;
      z += dir.z * stepSize;
    }

    return path;
  }

  // ── Lake Computation ──

  _getLakeInfo(cx, cz, context) {
    const key = `${cx},${cz}`;
    if (this._lakeCache.has(key)) return this._lakeCache.get(key);

    const lakes = [];
    const ox = cx * CHUNK_SIZE;
    const oz = cz * CHUNK_SIZE;

    // Lake potential: low-lying areas with high moisture
    const lakeNoise = this._moistureNoise.fbm2D(ox + 8, oz + 8, 2, 0.5, 2.0, 0.001);
    const depressionNoise = this._riverNoise.fbm2D(ox + 8, oz + 8, 1, 0.5, 2.0, 0.002);

    if (lakeNoise > 0.45 && depressionNoise < -0.2) {
      // Check if terrain is suitable (low-lying, above sea level)
      const centerHeight = this._sampleHeight(ox + 8, oz + 8, context);
      if (centerHeight > SEA_LEVEL + 2 && centerHeight < SEA_LEVEL + 30) {
        const size = LAKE_MIN_SIZE + Math.floor((lakeNoise - 0.45) * (LAKE_MAX_SIZE - LAKE_MIN_SIZE) * 3);
        lakes.push({
          centerX: ox + 8,
          centerZ: oz + 8,
          radius: Math.min(size, LAKE_MAX_SIZE),
          waterLevel: centerHeight - 1,
        });
      }
    }

    if (this._lakeCache.size >= this._maxLakeCacheSize) {
      const firstKey = this._lakeCache.keys().next().value;
      this._lakeCache.delete(firstKey);
    }
    this._lakeCache.set(key, lakes);
    return lakes;
  }

  // ── Heightmap Modifications ──

  _carveRiverValleys(heightMap, rivers, ox, oz) {
    for (const river of rivers) {
      for (const pt of river.path) {
        // Convert world coords to local chunk coords
        const lx = Math.floor(pt.x - ox);
        const lz = Math.floor(pt.z - oz);
        if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE) continue;

        const riverHeight = pt.height;
        const width = river.width;

        // Carve valley: lower terrain around river path
        for (let dx = -VALLEY_RADIUS; dx <= VALLEY_RADIUS; dx++) {
          for (let dz = -VALLEY_RADIUS; dz <= VALLEY_RADIUS; dz++) {
            const tx = lx + dx;
            const tz = lz + dz;
            if (tx < 0 || tx >= CHUNK_SIZE || tz < 0 || tz >= CHUNK_SIZE) continue;

            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist > VALLEY_RADIUS) continue;

            const idx = tx + tz * CHUNK_SIZE;
            const currentHeight = heightMap[idx];

            // Only carve land above sea level
            if (currentHeight <= SEA_LEVEL) continue;

            // Valley profile: smooth depression centered on river
            const valleyFactor = 1 - (dist / VALLEY_RADIUS);
            const valleyDepth = valleyFactor * valleyFactor * VALLEY_DEPTH_MAX;
            heightMap[idx] = Math.max(SEA_LEVEL - 1, currentHeight - valleyDepth);

            // River channel: carve deeper in the center
            if (dist < width) {
              const channelFactor = 1 - (dist / width);
              const channelDepth = channelFactor * 3;
              heightMap[idx] = Math.max(SEA_LEVEL - 2, heightMap[idx] - channelDepth);
            }
          }
        }
      }
    }
  }

  _carveLakes(heightMap, lakes, ox, oz) {
    for (const lake of lakes) {
      const lx = Math.floor(lake.centerX - ox);
      const lz = Math.floor(lake.centerZ - oz);

      for (let dx = -lake.radius; dx <= lake.radius; dx++) {
        for (let dz = -lake.radius; dz <= lake.radius; dz++) {
          const tx = lx + dx;
          const tz = lz + dz;
          if (tx < 0 || tx >= CHUNK_SIZE || tz < 0 || tz >= CHUNK_SIZE) continue;

          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > lake.radius) continue;

          const idx = tx + tz * CHUNK_SIZE;
          // Depression for lake: lower terrain to water level
          const lakeFactor = 1 - (dist / lake.radius);
          const targetHeight = lake.waterLevel - lakeFactor * 2;
          if (heightMap[idx] > targetHeight) {
            heightMap[idx] = targetHeight;
          }
        }
      }
    }
  }

  _detectWaterfalls(heightMap, rivers, ox, oz) {
    const waterfalls = [];
    for (const river of rivers) {
      for (let i = 1; i < river.path.length; i++) {
        const prev = river.path[i - 1];
        const curr = river.path[i];
        const drop = prev.height - curr.height;
        if (drop >= WATERFALL_MIN_DROP) {
          // Check that this point is within chunk bounds
          const lx = Math.floor(curr.x - ox);
          const lz = Math.floor(curr.z - oz);
          if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE) {
            waterfalls.push({
              x: lx,
              z: lz,
              worldX: curr.x,
              worldZ: curr.z,
              drop: drop,
              topHeight: Math.floor(prev.height),
              bottomHeight: Math.floor(curr.height),
            });
          }
        }
      }
    }
    return waterfalls;
  }

  // ── Block Modifications ──

  _carveRiverBlocks(chunk, river, ox, oz, getBlock, setBlock) {
    for (const pt of river.path) {
      const lx = Math.floor(pt.x - ox);
      const lz = Math.floor(pt.z - oz);
      if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE) continue;

      const width = river.width;
      const waterY = Math.floor(pt.height);

      for (let dx = -width; dx <= width; dx++) {
        for (let dz = -width; dz <= width; dz++) {
          const tx = lx + dx;
          const tz = lz + dz;
          if (tx < 0 || tx >= CHUNK_SIZE || tz < 0 || tz >= CHUNK_SIZE) continue;

          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > width) continue;

          // Place water in river channel
          for (let y = waterY; y >= waterY - 2; y--) {
            if (y >= 0 && y < 384) {
              const existing = getBlock(tx, y, tz);
              if (existing !== 0 && existing !== BLOCK_WATER) {
                // Replace with water up to waterY, riverbed below
                if (y === waterY - 2) {
                  setBlock(tx, y, tz, BLOCK_GRAVEL);
                } else if (y === waterY - 1) {
                  setBlock(tx, y, tz, BLOCK_CLAY);
                } else {
                  setBlock(tx, y, tz, BLOCK_WATER);
                }
              } else if (existing === 0 && y === waterY) {
                setBlock(tx, y, tz, BLOCK_WATER);
              }
            }
          }

          // Clear blocks above water (air)
          for (let y = waterY + 1; y < waterY + 4; y++) {
            if (y >= 0 && y < 384) {
              if (getBlock(tx, y, tz) !== 0) {
                setBlock(tx, y, tz, 0);
              }
            }
          }
        }
      }
    }
  }

  _fillLakeBlocks(chunk, lake, ox, oz, getBlock, setBlock) {
    const lx = Math.floor(lake.centerX - ox);
    const lz = Math.floor(lake.centerZ - oz);
    const waterY = Math.floor(lake.waterLevel);

    for (let dx = -lake.radius; dx <= lake.radius; dx++) {
      for (let dz = -lake.radius; dz <= lake.radius; dz++) {
        const tx = lx + dx;
        const tz = lz + dz;
        if (tx < 0 || tx >= CHUNK_SIZE || tz < 0 || tz >= CHUNK_SIZE) continue;

        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > lake.radius) continue;

        // Fill with water from waterY down to floor
        for (let y = waterY; y >= waterY - 5; y--) {
          if (y >= 0 && y < 384) {
            const existing = getBlock(tx, y, tz);
            if (existing === 0) {
              setBlock(tx, y, tz, BLOCK_WATER);
            } else if (y === waterY - 5) {
              // Lake floor: sand/clay
              if (existing !== BLOCK_WATER) {
                setBlock(tx, y, tz, BLOCK_SAND);
              }
            }
          }
        }

        // Clear above water
        for (let y = waterY + 1; y < waterY + 3; y++) {
          if (y >= 0 && y < 384) {
            if (getBlock(tx, y, tz) !== 0) {
              setBlock(tx, y, tz, 0);
            }
          }
        }
      }
    }
  }

  _placeWaterfallBlocks(chunk, wf, ox, oz, getBlock, setBlock) {
    // Place stone/cliff blocks around waterfall drop
    for (let y = wf.bottomHeight; y <= wf.topHeight; y++) {
      if (y >= 0 && y < 384) {
        // Keep the cliff face as stone
        const existing = getBlock(wf.x, y, wf.z);
        if (existing === 0 || existing === BLOCK_WATER) {
          // Leave water flowing where river was, stone for cliff
          if (y < wf.topHeight - 1) {
            setBlock(wf.x, y, wf.z, BLOCK_STONE);
          }
        }
        // Add water at top edge
        if (y === wf.topHeight) {
          setBlock(wf.x, y, wf.z, BLOCK_WATER);
        }
      }
    }
  }

  // ── Utility ──

  clearCache() {
    this._flowCache.clear();
    this._lakeCache.clear();
  }

  // Check if a position is near a river (for biome assignment)
  isNearRiver(x, z, context) {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const rivers = this._getRiverSegments(cx, cz, context);
    for (const river of rivers) {
      for (const pt of river.path) {
        const dist = Math.sqrt((pt.x - x) ** 2 + (pt.z - z) ** 2);
        if (dist < river.width + VALLEY_RADIUS * 0.5) return true;
      }
    }
    return false;
  }

  // Get moisture level at a position (for climate system integration)
  getMoisture(x, z) {
    return this._moistureNoise.fbm2D(x, z, 3, 0.5, 2.0, 0.0008);
  }
}
