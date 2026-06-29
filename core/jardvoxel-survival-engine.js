// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Engine — Full World Generation Pipeline
// Based on Voxel Wiki: https://voxel-wiki.dev/w/World_generation
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// PRNG — Xorshift128+ (seeded, reproducible)
// ═══════════════════════════════════════════════════════════
export class PRNG {
  constructor(seed) {
    let s = seed | 0 || 1;
    this.a = s; 
    this.b = s ^ 0x6D2B79F5;
    this.c = s ^ 0xB5297A4D; 
    this.d = s ^ 0x4B5A3D7C;
  }
  next() {
    const t = this.a << 11;
    this.a = this.b; 
    this.b = this.c; 
    this.c = this.d;
    this.d = this.d ^ (this.d >>> 19) ^ (t ^ (t >>> 8));
    return (this.d >>> 0) / 4294967296;
  }
}

// ═══════════════════════════════════════════════════════════
// 3D Perlin Noise — For terrain, caves, aquifers
// ═══════════════════════════════════════════════════════════
export class PerlinNoise3D {
  constructor(seed) {
    const prng = new PRNG(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(prng.next() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    this.perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }
  
  fade(t) { 
    return t * t * t * (t * (t * 6 - 15) + 10); 
  }
  
  lerp(a, b, t) { 
    return a + t * (b - a); 
  }
  
  grad3(h, x, y, z) {
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }
  
  noise3D(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);
    
    const A = this.perm[X] + Y;
    const AA = this.perm[A] + Z;
    const AB = this.perm[A + 1] + Z;
    const B = this.perm[X + 1] + Y;
    const BA = this.perm[B] + Z;
    const BB = this.perm[B + 1] + Z;
    
    return this.lerp(
      this.lerp(
        this.lerp(this.grad3(this.perm[AA], x, y, z), this.grad3(this.perm[BA], x - 1, y, z), u),
        this.lerp(this.grad3(this.perm[AB], x, y - 1, z), this.grad3(this.perm[BB], x - 1, y - 1, z), u),
        v
      ),
      this.lerp(
        this.lerp(this.grad3(this.perm[AA + 1], x, y, z - 1), this.grad3(this.perm[BA + 1], x - 1, y, z - 1), u),
        this.lerp(this.grad3(this.perm[AB + 1], x, y - 1, z - 1), this.grad3(this.perm[BB + 1], x - 1, y - 1, z - 1), u),
        v
      ),
      w
    );
  }
  
  grad2(h, x, y) {
    const u = (h & 1) ? -x : x;
    const v = (h & 2) ? -y : y;
    return u + v;
  }
  
  noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    const u = this.fade(x);
    const v = this.fade(y);
    
    const A = this.perm[X] + Y;
    const B = this.perm[X + 1] + Y;
    
    return this.lerp(
      this.lerp(this.grad2(this.perm[A], x, y), this.grad2(this.perm[B], x - 1, y), u),
      this.lerp(this.grad2(this.perm[A + 1], x, y - 1), this.grad2(this.perm[B + 1], x - 1, y - 1), u),
      v
    );
  }
  
  fbm3D(x, y, z, octaves, persistence, lacunarity, scale) {
    let total = 0;
    let freq = scale;
    let amp = 1;
    let maxVal = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise3D(x * freq, y * freq, z * freq) * amp;
      maxVal += amp;
      amp *= persistence;
      freq *= lacunarity;
    }
    return total / maxVal;
  }
  
  fbm2D(x, y, octaves, persistence, lacunarity, scale) {
    let total = 0;
    let freq = scale;
    let amp = 1;
    let maxVal = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * freq, y * freq) * amp;
      maxVal += amp;
      amp *= persistence;
      freq *= lacunarity;
    }
    return total / maxVal;
  }
}

// ═══════════════════════════════════════════════════════════
// Spline Interpolation — For continentalness, erosion, PV
// ═══════════════════════════════════════════════════════════
export class Spline {
  constructor(points) {
    // points: [{x, y}, ...]
    this.points = points.sort((a, b) => a.x - b.x);
  }
  
  evaluate(x) {
    if (x <= this.points[0].x) return this.points[0].y;
    if (x >= this.points[this.points.length - 1].x) return this.points[this.points.length - 1].y;
    
    for (let i = 0; i < this.points.length - 1; i++) {
      const p0 = this.points[i];
      const p1 = this.points[i + 1];
      if (x >= p0.x && x <= p1.x) {
        const t = (x - p0.x) / (p1.x - p0.x);
        // Compute tangents from neighboring points
        const prev = this.points[i - 1] || p0;
        const next = this.points[i + 2] || p1;
        const m0 = (p1.y - prev.y) / (p1.x - prev.x);
        const m1 = (next.y - p0.y) / (next.x - p0.x);
        // Cubic hermite interpolation
        const t2 = t * t;
        const t3 = t2 * t;
        return (2 * t3 - 3 * t2 + 1) * p0.y + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * p1.y + (t3 - t2) * m1;
      }
    }
    return 0;
  }
}

// ═══════════════════════════════════════════════════════════
// World Generator — Full Pipeline
// ═══════════════════════════════════════════════════════════
export const WORLD_HEIGHT = 384; // -64 to 320
export const WORLD_MIN_Y = -64;
export const SEA_LEVEL = 63;
export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 384;

export const BIOMES = {
  OCEAN: 'ocean',
  DEEP_OCEAN: 'deep_ocean',
  BEACH: 'beach',
  PLAINS: 'plains',
  FOREST: 'forest',
  JUNGLE: 'jungle',
  DESERT: 'desert',
  SAVANNA: 'savanna',
  TAIGA: 'taiga',
  SNOWY_PLAINS: 'snowy_plains',
  MOUNTAINS: 'mountains',
  SNOWY_PEAKS: 'snowy_peaks',
  STONY_PEAKS: 'stony_peaks',
  MEADOW: 'meadow',
  CHERRY_GROVE: 'cherry_grove',
  SWAMP: 'swamp',
  RIVER: 'river',
  MYSTIC_GROVE: 'mystic_grove',
  AUTUMN_FOREST: 'autumn_forest',
};

export const BIOME_COLORS = {
  [BIOMES.OCEAN]: [0.15, 0.35, 0.65],
  [BIOMES.DEEP_OCEAN]: [0.1, 0.25, 0.55],
  [BIOMES.BEACH]: [0.93, 0.83, 0.55],
  [BIOMES.PLAINS]: [0.35, 0.72, 0.25],
  [BIOMES.FOREST]: [0.15, 0.45, 0.15],
  [BIOMES.JUNGLE]: [0.1, 0.52, 0.1],
  [BIOMES.DESERT]: [0.92, 0.75, 0.35],
  [BIOMES.SAVANNA]: [0.75, 0.65, 0.35],
  [BIOMES.TAIGA]: [0.25, 0.55, 0.35],
  [BIOMES.SNOWY_PLAINS]: [0.92, 0.92, 0.96],
  [BIOMES.MOUNTAINS]: [0.55, 0.5, 0.45],
  [BIOMES.SNOWY_PEAKS]: [0.95, 0.95, 0.98],
  [BIOMES.STONY_PEAKS]: [0.45, 0.45, 0.45],
  [BIOMES.MEADOW]: [0.45, 0.75, 0.35],
  [BIOMES.CHERRY_GROVE]: [0.85, 0.55, 0.75],
  [BIOMES.SWAMP]: [0.35, 0.45, 0.25],
  [BIOMES.RIVER]: [0.25, 0.45, 0.75],
  [BIOMES.MYSTIC_GROVE]: [0.35, 0.25, 0.55],
  [BIOMES.AUTUMN_FOREST]: [0.65, 0.35, 0.15],
};

export class WorldGenPipeline {
  constructor(seed) {
    this.seed = seed;
    
    // 3D Noise for terrain density
    this.densityNoise = new PerlinNoise3D(seed);
    
    // 2D Noises for spline parameters
    this.continentalnessNoise = new PerlinNoise3D(seed + 100);
    this.erosionNoise = new PerlinNoise3D(seed + 200);
    this.weirdnessNoise = new PerlinNoise3D(seed + 300);
    
    // Temperature & Humidity for biomes
    this.temperatureNoise = new PerlinNoise3D(seed + 400);
    this.humidityNoise = new PerlinNoise3D(seed + 500);
    
    // Cave noises
    this.cheeseNoise = new PerlinNoise3D(seed + 600);
    this.spaghettiNoise = new PerlinNoise3D(seed + 700);
    this.noodleNoise = new PerlinNoise3D(seed + 800);
    
    // Aquifer noises
    this.aquiferNoise = new PerlinNoise3D(seed + 900);
    this.barrierNoise = new PerlinNoise3D(seed + 1000);
    
    // Splines for terrain shaping (simplified worldgen splines)
    this.continentalnessSpline = new Spline([
      {x: -1.0, y: -0.5}, // Deep ocean
      {x: -0.2, y: 0.0},  // Ocean
      {x: 0.0, y: 0.1},   // Coast
      {x: 0.3, y: 0.3},   // Inland
      {x: 0.6, y: 0.6},   // Mountains base
      {x: 1.0, y: 1.0},   // High mountains
    ]);
    
    this.erosionSpline = new Spline([
      {x: -1.0, y: 1.0},  // Jagged
      {x: -0.5, y: 0.7},
      {x: 0.0, y: 0.3},
      {x: 0.5, y: 0.1},
      {x: 1.0, y: 0.0},   // Flat
    ]);
    
    // Cache
    this.cache = new Map();
    this.cacheSize = 50000;
    this._biomeCache = new Map();
  }
  
  _cacheKey(x, y, z) {
    // Numeric key: pack x,z into 21 bits each, y into 20 bits
    const ix = Math.floor(x) & 0x1FFFFF;
    const iz = Math.floor(z) & 0x1FFFFF;
    const iy = Math.floor(y) & 0xFFFFF;
    return ix * 4194304 + iz * 1048576 + iy;
  }
  
  // Step 1: Calculate continentalness (land vs ocean)
  getContinentalness(x, z) {
    return this.continentalnessNoise.fbm2D(x, z, 4, 0.5, 2.0, 0.0005);
  }
  
  // Step 2: Calculate erosion (flat vs jagged)
  getErosion(x, z) {
    return this.erosionNoise.fbm2D(x, z, 4, 0.5, 2.0, 0.001);
  }
  
  // Step 3: Calculate weirdness (peaks vs valleys)
  getWeirdness(x, z) {
    return this.weirdnessNoise.fbm2D(x, z, 4, 0.5, 2.0, 0.0015);
  }
  
  // Cached spline params for getBiome optimization
  _getSplineParams(x, z) {
    const ix = Math.floor(x) & 0x1FFFFF;
    const iz = Math.floor(z) & 0x1FFFFF;
    const key = ix * 4194304 + iz;
    if (this._splineParamsCache && this._splineParamsCache.has(key)) {
      return this._splineParamsCache.get(key);
    }
    const cont = this.getContinentalness(x, z);
    const erosion = this.getErosion(x, z);
    const weirdness = this.getWeirdness(x, z);
    const pv = this.getPV(weirdness);
    const params = { cont, erosion, weirdness, pv };
    if (!this._splineParamsCache) this._splineParamsCache = new Map();
    if (this._splineParamsCache.size > 50000) {
      const firstKey = this._splineParamsCache.keys().next().value;
      this._splineParamsCache.delete(firstKey);
    }
    this._splineParamsCache.set(key, params);
    return params;
  }
  
  // Step 4: Calculate PV (peaks and valleys)
  getPV(weirdness) {
    return weirdness; // Simplified: positive = peaks, negative = valleys
  }
  
  // Step 5: Calculate base height using splines (cached per x,z)
  getBaseHeight(x, z) {
    const ix = Math.floor(x) & 0x1FFFFF;
    const iz = Math.floor(z) & 0x1FFFFF;
    const key = ix * 4194304 + iz;
    if (this._heightCache && this._heightCache.has(key)) {
      return this._heightCache.get(key);
    }
    const { cont, erosion, weirdness, pv } = this._getSplineParams(x, z);
    
    // Apply splines
    const contHeight = this.continentalnessSpline.evaluate(cont);
    const erosionFactor = this.erosionSpline.evaluate(erosion);
    
    // Base height calculation
    let baseHeight = SEA_LEVEL + contHeight * 150;
    
    // Erosion flattens terrain
    baseHeight *= (1 - erosionFactor * 0.5);
    
    // PV adds peaks and valleys
    if (cont > 0.3) { // Only on land
      baseHeight += pv * 40 * (1 - erosionFactor);
    }
    
    // Rivers in valleys
    if (pv < -0.5 && cont > -0.2 && cont < 0.5) {
      baseHeight = Math.min(baseHeight, SEA_LEVEL - 2);
    }
    
    if (!this._heightCache) this._heightCache = new Map();
    if (this._heightCache.size > 50000) {
      const firstKey = this._heightCache.keys().next().value;
      this._heightCache.delete(firstKey);
    }
    this._heightCache.set(key, baseHeight);
    return baseHeight;
  }
  
  // Step 6: Calculate 3D density (solid vs air)
  getDensity(x, y, z) {
    const key = this._cacheKey(x, y, z);
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const baseHeight = this.getBaseHeight(x, z);
    
    // Height bias (squeezing)
    const heightBias = (baseHeight - y) * 0.05;
    
    // 3D noise for overhangs and caves
    const noise3D = this.densityNoise.fbm3D(x, y, z, 4, 0.5, 2.0, 0.01);
    
    // Combine
    let density = noise3D + heightBias;
    
    // Apply caves
    density = this.applyCaves(x, y, z, density);
    
    // Cache management
    if (this.cache.size > this.cacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, density);
    
    return density;
  }
  
  // Step 7: Apply noise caves (cheese, spaghetti, noodle)
  applyCaves(x, y, z, density) {
    // Only carve caves underground
    if (y > SEA_LEVEL + 20 || y < WORLD_MIN_Y + 5) return density;
    
    // Cheese caves (large chambers)
    const cheese = this.cheeseNoise.fbm3D(x, y, z, 3, 0.5, 2.0, 0.02);
    if (cheese > 0.6) {
      density = -1; // Air
    }
    
    // Spaghetti caves (long tunnels)
    const spaghetti = this.spaghettiNoise.fbm3D(x, y, z, 2, 0.5, 2.0, 0.05);
    if (Math.abs(spaghetti) < 0.1) {
      density = -1; // Air
    }
    
    // Noodle caves (thin tunnels)
    const noodle = this.noodleNoise.fbm3D(x, y, z, 2, 0.5, 2.0, 0.08);
    if (Math.abs(noodle) < 0.05) {
      density = -1; // Air
    }
    
    return density;
  }
  
  // Step 8: Determine block type (air, stone, water, etc.)
  getBlockType(x, y, z) {
    const baseHeight = this.getBaseHeight(x, z);

    // Fast path: well above terrain → air or water (skip density noise)
    if (y > baseHeight + 15) {
      if (y < SEA_LEVEL) {
        const aquifer = this.getAquiferState(x, y, z);
        if (aquifer === 'water') return 'water';
        if (aquifer === 'lava') return 'lava';
      }
      return 'air';
    }

    // Fast path: well below terrain and outside cave range → stone
    if (y < baseHeight - 15 && (y > SEA_LEVEL + 20 || y < WORLD_MIN_Y + 5)) {
      return 'stone';
    }

    // Full calculation for surface band and cave zone
    const density = this.getDensity(x, y, z);

    if (density > 0) {
      // Surface layer: check if block above is air (density <= 0)
      // Use fast check: if y+1 > baseHeight + 15, it's definitely air
      if (y + 1 > baseHeight + 15) {
        const biome = this.getBiome(x, z);
        return this.getSurfaceBlock(biome, y);
      }
      const densityAbove = this.getDensity(x, y + 1, z);
      if (densityAbove <= 0) {
        const biome = this.getBiome(x, z);
        return this.getSurfaceBlock(biome, y);
      }
      return 'stone';
    }

    // Air or water
    if (y < SEA_LEVEL) {
      // Check aquifer
      const aquifer = this.getAquiferState(x, y, z);
      if (aquifer === 'water') return 'water';
      if (aquifer === 'lava') return 'lava';
    }

    return 'air';
  }
  
  // Step 9: Aquifer system
  getAquiferState(x, y, z) {
    // Below Y=-55 is always lava
    if (y < -55) return 'lava';
    
    // Above sea level is always air
    if (y >= SEA_LEVEL) return 'air';
    
    // Aquifer noise determines state
    const aquiferValue = this.aquiferNoise.fbm3D(x, y, z, 2, 0.5, 2.0, 0.03);
    
    if (aquiferValue < -0.3) return 'air'; // Empty
    if (aquiferValue > 0.3) return 'water'; // Flooded
    
    // Local water level
    const localLevel = SEA_LEVEL - Math.floor(aquiferValue * 20);
    return y < localLevel ? 'water' : 'air';
  }
  
  // Step 10: Get surface block based on biome
  getSurfaceBlock(biome, y) {
    if (y < SEA_LEVEL - 10) return 'stone';
    
    switch (biome) {
      case BIOMES.DESERT: return 'sand';
      case BIOMES.BEACH: return 'sand';
      case BIOMES.SNOWY_PLAINS:
      case BIOMES.SNOWY_PEAKS: return 'snow';
      case BIOMES.STONY_PEAKS: return 'stone';
      case BIOMES.SWAMP: return 'mud';
      default: return 'grass';
    }
  }
  
  // Step 11: Determine biome
  getBiome(x, z) {
    const ix = Math.floor(x) & 0x1FFFFF;
    const iz = Math.floor(z) & 0x1FFFFF;
    const key = ix * 4194304 + iz;
    if (this._biomeCache && this._biomeCache.has(key)) {
      return this._biomeCache.get(key);
    }
    const { cont, erosion, pv } = this._getSplineParams(x, z);
    
    const temp = this.temperatureNoise.fbm2D(x, z, 3, 0.5, 2.0, 0.002);
    const humid = this.humidityNoise.fbm2D(x, z, 3, 0.5, 2.0, 0.002);
    
    const baseHeight = this.getBaseHeight(x, z);
    
    // Ocean biomes
    if (cont < -0.3) return BIOMES.DEEP_OCEAN;
    if (cont < 0.0) return BIOMES.OCEAN;
    if (baseHeight < SEA_LEVEL + 3) return BIOMES.BEACH;
    
    // River
    if (pv < -0.5 && cont > 0.0 && cont < 0.5 && baseHeight < SEA_LEVEL + 2) {
      return BIOMES.RIVER;
    }
    
    // Mountain biomes
    if (baseHeight > SEA_LEVEL + 100) {
      if (temp < 0.2) return BIOMES.SNOWY_PEAKS;
      if (erosion < -0.3) return BIOMES.STONY_PEAKS;
      return BIOMES.MOUNTAINS;
    }
    
    if (baseHeight > SEA_LEVEL + 60) {
      if (temp < 0.3) return BIOMES.SNOWY_PLAINS;
      return BIOMES.MEADOW;
    }
    
    // Temperature-based biomes
    if (temp < 0.2) return BIOMES.SNOWY_PLAINS;
    if (temp < 0.4) return BIOMES.TAIGA;
    
    if (temp > 0.8) {
      if (humid < 0.3) return BIOMES.DESERT;
      if (humid > 0.7) return BIOMES.JUNGLE;
      return BIOMES.SAVANNA;
    }
    
    // Moderate temperature
    if (humid > 0.6) {
      if (weirdness > 0.5 && temp > 0.4 && temp < 0.7) {
        this._biomeCache.set(key, BIOMES.MYSTIC_GROVE);
        return BIOMES.MYSTIC_GROVE;
      }
      this._biomeCache.set(key, BIOMES.FOREST);
      return BIOMES.FOREST;
    }
    if (temp > 0.35 && temp < 0.55 && humid > 0.4 && humid < 0.6 && weirdness < -0.3) {
      this._biomeCache.set(key, BIOMES.AUTUMN_FOREST);
      return BIOMES.AUTUMN_FOREST;
    }
    if (humid < 0.3 && erosion > 0.3) { this._biomeCache.set(key, BIOMES.PLAINS); return BIOMES.PLAINS; }
    if (humid > 0.5) { this._biomeCache.set(key, BIOMES.SWAMP); return BIOMES.SWAMP; }
    
    this._biomeCache.set(key, BIOMES.PLAINS);
    return BIOMES.PLAINS;
  }
  
  clearCache() {
    this.cache.clear();
    if (this._biomeCache) this._biomeCache.clear();
    if (this._splineParamsCache) this._splineParamsCache.clear();
  }
}

// ═══════════════════════════════════════════════════════════
// Voxel Chunk — 16x384x16 blocks
// ═══════════════════════════════════════════════════════════
const BLOCK_TYPE_TO_ID = { air: 0, stone: 1, grass: 2, dirt: 3, sand: 4, water: 5, lava: 6, snow: 7, mud: 8 };

export class VoxelChunk {
  constructor(cx, cz, worldGen) {
    this.cx = cx;
    this.cz = cz;
    this.worldGen = worldGen;
    this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
    this.generated = false;
  }
  
  generate() {
    if (this.generated) return;

    const offsetX = this.cx * CHUNK_SIZE;
    const offsetZ = this.cz * CHUNK_SIZE;
    const NOISE_MARGIN = 15;
    const CAVE_TOP = SEA_LEVEL + 20;
    const CAVE_BOTTOM = WORLD_MIN_Y + 5;

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const worldX = offsetX + x;
        const worldZ = offsetZ + z;
        const baseHeight = this.worldGen.getBaseHeight(worldX, worldZ);
        const terrainTop = Math.ceil(baseHeight) + NOISE_MARGIN;

        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          const worldY = WORLD_MIN_Y + y;
          const idx = x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;

          // Fast path: above terrain → air or water
          if (worldY > terrainTop) {
            if (worldY < SEA_LEVEL) {
              const aquifer = this.worldGen.getAquiferState(worldX, worldY, worldZ);
              this.blocks[idx] = this.blockTypeToId(aquifer);
            } else {
              this.blocks[idx] = 0; // air
            }
            continue;
          }

          // Fast path: deep underground, outside cave range → stone
          if (worldY < baseHeight - NOISE_MARGIN && (worldY > CAVE_TOP || worldY < CAVE_BOTTOM)) {
            this.blocks[idx] = 1; // stone
            continue;
          }

          // Full calculation for surface band and cave zone
          const blockType = this.worldGen.getBlockType(worldX, worldY, worldZ);
          this.blocks[idx] = this.blockTypeToId(blockType);
        }
      }
    }

    this.generated = true;
  }
  
  blockTypeToId(type) {
    return BLOCK_TYPE_TO_ID[type] || 0;
  }
  
  getBlock(x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return 0;
    if (y < 0 || y >= CHUNK_HEIGHT) return 0;
    const idx = x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
    return this.blocks[idx];
  }

  setBlock(x, y, z, block) {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return;
    if (y < 0 || y >= CHUNK_HEIGHT) return;
    const idx = x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
    this.blocks[idx] = block;
  }
}

// ═══════════════════════════════════════════════════════════
// Greedy Meshing — Optimize voxel rendering
// ═══════════════════════════════════════════════════════════
export class GreedyMesher {
  static mesh(chunk) {
    const positions = [];
    const colors = [];
    const indices = [];
    let vertexCount = 0;
    
    // Simplified: just render top surface for now
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        // Find top solid block
        let topY = -1;
        for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
          const block = chunk.getBlock(x, y, z);
          if (block > 0 && block !== 5 && block !== 6) { // Not air, water, lava
            topY = y;
            break;
          }
        }
        
        if (topY >= 0) {
          const worldX = chunk.cx * CHUNK_SIZE + x;
          const worldY = WORLD_MIN_Y + topY;
          const worldZ = chunk.cz * CHUNK_SIZE + z;
          
          const biome = chunk.worldGen.getBiome(worldX, worldZ);
          const color = BIOME_COLORS[biome] || [0.5, 0.5, 0.5];
          
          // Create quad
          const x0 = worldX;
          const x1 = worldX + 1;
          const z0 = worldZ;
          const z1 = worldZ + 1;
          const y = worldY + 1;
          
          positions.push(x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1);
          colors.push(...color, ...color, ...color, ...color);
          
          indices.push(
            vertexCount, vertexCount + 1, vertexCount + 2,
            vertexCount, vertexCount + 2, vertexCount + 3
          );
          vertexCount += 4;
        }
      }
    }
    
    return { positions, colors, indices };
  }
}
