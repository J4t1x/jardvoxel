// ═══════════════════════════════════════════════════════════
// JardVoxel 7.1 — Voronoi Biome Map
// PRD G-01: Coherent biome regions using Voronoi cells
// Replaces per-block noise thresholds with large-scale regions
// ═══════════════════════════════════════════════════════════

import { SimplexNoise } from './jardvoxel-survival-noise.js';

const SEA_LEVEL = 63;

const BIOMES = {
  OCEAN: 'ocean', DEEP_OCEAN: 'deep_ocean', BEACH: 'beach',
  PLAINS: 'plains', FOREST: 'forest', JUNGLE: 'jungle',
  DESERT: 'desert', SAVANNA: 'savanna', TAIGA: 'taiga',
  SNOWY_PLAINS: 'snowy_plains', MOUNTAINS: 'mountains',
  SNOWY_PEAKS: 'snowy_peaks', STONY_PEAKS: 'stony_peaks',
  MEADOW: 'meadow', CHERRY_GROVE: 'cherry_grove',
  SWAMP: 'swamp', RIVER: 'river',
  MYSTIC_GROVE: 'mystic_grove', AUTUMN_FOREST: 'autumn_forest',
};

const LAND_BIOMES = [
  BIOMES.PLAINS, BIOMES.FOREST, BIOMES.JUNGLE, BIOMES.DESERT,
  BIOMES.SAVANNA, BIOMES.TAIGA, BIOMES.SNOWY_PLAINS,
  BIOMES.MEADOW, BIOMES.CHERRY_GROVE, BIOMES.SWAMP,
  BIOMES.MYSTIC_GROVE, BIOMES.AUTUMN_FOREST,
];

const CELL_SIZE = 250;
const BLEND_RADIUS = 30;

export class VoronoiBiomeMap {
  constructor(seed) {
    this.seed = seed;
    this.tempNoise = new SimplexNoise(seed + 10000);
    this.humidNoise = new SimplexNoise(seed + 10001);
    this.warpNoise = new SimplexNoise(seed + 10002);
    this._cellCache = new Map();
    this._maxCacheSize = 500;
  }

  _hashCell(cx, cz) {
    const h = ((cx * 374761393 + cz * 668265263) ^ this.seed) & 0x7FFFFFFF;
    return h / 0x7FFFFFFF;
  }

  _getCellSeed(cx, cz) {
    return ((cx * 73856093 ^ cz * 19349663) ^ this.seed) & 0x7FFFFFFF;
  }

  _getCellCenter(cx, cz) {
    const h1 = this._hashCell(cx, cz);
    const h2 = this._hashCell(cx + 7919, cz + 3571);
    return {
      x: cx * CELL_SIZE + h1 * CELL_SIZE * 0.6 + CELL_SIZE * 0.2,
      z: cz * CELL_SIZE + h2 * CELL_SIZE * 0.6 + CELL_SIZE * 0.2,
    };
  }

  _assignBiome(centerX, centerZ) {
    const temp = (this.tempNoise.fbm2D(centerX, centerZ, 4, 0.5, 2.0, 0.0005) + 1) * 0.5;
    const humid = (this.humidNoise.fbm2D(centerX, centerZ, 4, 0.5, 2.0, 0.0005) + 1) * 0.5;

    if (temp < 0.15) return BIOMES.SNOWY_PLAINS;
    if (temp < 0.35) {
      if (humid > 0.6) return BIOMES.TAIGA;
      return BIOMES.SNOWY_PLAINS;
    }
    if (temp > 0.85) {
      if (humid < 0.25) return BIOMES.DESERT;
      if (humid > 0.7) return BIOMES.JUNGLE;
      return BIOMES.SAVANNA;
    }
    if (temp > 0.7) {
      if (humid < 0.3) return BIOMES.SAVANNA;
      if (humid > 0.65) return BIOMES.JUNGLE;
      return BIOMES.FOREST;
    }
    if (humid > 0.7) {
      if (temp > 0.45 && temp < 0.65 && humid > 0.55 && humid < 0.7) return BIOMES.MYSTIC_GROVE;
      return BIOMES.SWAMP;
    }
    if (humid > 0.5) {
      if (temp > 0.4 && temp < 0.55 && humid > 0.4 && humid < 0.6) return BIOMES.AUTUMN_FOREST;
      return BIOMES.FOREST;
    }
    if (humid > 0.35 && temp > 0.4 && temp < 0.6) return BIOMES.MEADOW;
    if (humid > 0.3 && temp > 0.35 && temp < 0.55) return BIOMES.CHERRY_GROVE;
    return BIOMES.PLAINS;
  }

  getBiomeAt(x, z) {
    const warped = this._warp(x, z);

    const cx = Math.floor(warped.x / CELL_SIZE);
    const cz = Math.floor(warped.z / CELL_SIZE);

    let nearestCell = null;
    let nearestDist = Infinity;
    let secondDist = Infinity;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const cellX = cx + dx;
        const cellZ = cz + dz;
        const center = this._getCellCenter(cellX, cellZ);
        const ddx = center.x - warped.x;
        const ddz = center.z - warped.z;
        const dist = ddx * ddx + ddz * ddz;

        if (dist < nearestDist) {
          secondDist = nearestDist;
          nearestDist = dist;
          nearestCell = { cx: cellX, cz: cellZ, center, dist };
        } else if (dist < secondDist) {
          secondDist = dist;
        }
      }
    }

    if (!nearestCell) return BIOMES.PLAINS;

    const cacheKey = `${nearestCell.cx},${nearestCell.cz}`;
    let biome = this._cellCache.get(cacheKey);
    if (!biome) {
      biome = this._assignBiome(nearestCell.center.x, nearestCell.center.z);
      if (this._cellCache.size > this._maxCacheSize) this._cellCache.clear();
      this._cellCache.set(cacheKey, biome);
    }

    return biome;
  }

  getBiomeWithBlend(x, z, getBaseHeight, getContinent) {
    const warped = this._warp(x, z);

    const cx = Math.floor(warped.x / CELL_SIZE);
    const cz = Math.floor(warped.z / CELL_SIZE);

    const cells = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const cellX = cx + dx;
        const cellZ = cz + dz;
        const center = this._getCellCenter(cellX, cellZ);
        const ddx = center.x - warped.x;
        const ddz = center.z - warped.z;
        const dist = Math.sqrt(ddx * ddx + ddz * ddz);
        cells.push({ cx: cellX, cz: cellZ, center, dist });
      }
    }
    cells.sort((a, b) => a.dist - b.dist);

    const nearest = cells[0];
    if (!nearest) return BIOMES.PLAINS;

    const cont = getContinent ? getContinent(x, z) : 0;
    if (cont < -0.3) return BIOMES.DEEP_OCEAN;
    if (cont < 0.0) return BIOMES.OCEAN;

    const baseHeight = getBaseHeight ? getBaseHeight(x, z) : SEA_LEVEL + 20;
    if (baseHeight < SEA_LEVEL + 3) return BIOMES.BEACH;

    if (baseHeight > SEA_LEVEL + 100) {
      const temp = (this.tempNoise.fbm2D(x, z, 4, 0.5, 2.0, 0.0005) + 1) * 0.5;
      if (temp < 0.2) return BIOMES.SNOWY_PEAKS;
      return BIOMES.MOUNTAINS;
    }
    if (baseHeight > SEA_LEVEL + 60) {
      const temp = (this.tempNoise.fbm2D(x, z, 4, 0.5, 2.0, 0.0005) + 1) * 0.5;
      if (temp < 0.3) return BIOMES.SNOWY_PLAINS;
      return BIOMES.MEADOW;
    }

    const cacheKey = `${nearest.cx},${nearest.cz}`;
    let nearestBiome = this._cellCache.get(cacheKey);
    if (!nearestBiome) {
      nearestBiome = this._assignBiome(nearest.center.x, nearest.center.z);
      if (this._cellCache.size > this._maxCacheSize) this._cellCache.clear();
      this._cellCache.set(cacheKey, nearestBiome);
    }

    if (cells.length > 1) {
      const blendDist = cells[1].dist - nearest.dist;
      if (blendDist < BLEND_RADIUS) {
        const blendKey = `${cells[1].cx},${cells[1].cz}`;
        let secondBiome = this._cellCache.get(blendKey);
        if (!secondBiome) {
          secondBiome = this._assignBiome(cells[1].center.x, cells[1].center.z);
          this._cellCache.set(blendKey, secondBiome);
        }
        const t = blendDist / BLEND_RADIUS;
        const hash = this._hashCell(Math.floor(x), Math.floor(z));
        return hash < t ? nearestBiome : secondBiome;
      }
    }

    return nearestBiome;
  }

  _warp(x, z) {
    const wx = this.warpNoise.fbm2D(x, z, 2, 0.5, 2.0, 0.001) * 40;
    const wz = this.warpNoise.fbm2D(x + 500, z + 500, 2, 0.5, 2.0, 0.001) * 40;
    return { x: x + wx, z: z + wz };
  }

  clearCache() {
    this._cellCache.clear();
  }
}
