// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Engine — Full World Generation Pipeline
// Based on Voxel Wiki: https://voxel-wiki.dev/w/World_generation
// v6.0: Simplex Noise + Domain Warping + Coherent Biomes
// v7.0: Hierarchical World Generation (World → Continents → Regions → Zones → Chunks → Microsectors)
// ═══════════════════════════════════════════════════════════

import { SimplexNoise, DomainWarper, NOISE_CONFIGS, TerrainSplines, BiomeBlender, BiomeTerrainModulator, FeaturePlacer, FastNoiseLite, FN_NOISE_TYPE, FN_CELLULAR_RETURN } from './jardvoxel-survival-noise.js';
import { HierarchicalChunkGenerator } from './jardvoxel-survival-world-hierarchy.js';
import { VoronoiBiomeMap } from './jardvoxel-survival-voronoi.js';

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
export const CHUNK_SIZE = 32;
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
  // SPEC-099: Wellness biomes
  ZEN_GARDEN: 'zen_garden',
  BAMBOO_GROVE: 'bamboo_grove',
  AURORA_TUNDRA: 'aurora_tundra',
};

export const BIOME_COLORS = {
  [BIOMES.OCEAN]: [0.15, 0.48, 0.72],           // Cerulean Ghibli ocean
  [BIOMES.DEEP_OCEAN]: [0.10, 0.30, 0.58],      // Deep warm blue
  [BIOMES.BEACH]: [0.94, 0.88, 0.65],           // Golden warm beach
  [BIOMES.PLAINS]: [0.50, 0.82, 0.35],          // Warm meadow green
  [BIOMES.FOREST]: [0.30, 0.70, 0.30],          // Rich forest green
  [BIOMES.JUNGLE]: [0.35, 0.85, 0.38],          // Vibrant jungle
  [BIOMES.DESERT]: [0.96, 0.82, 0.48],          // Warm golden desert
  [BIOMES.SAVANNA]: [0.80, 0.78, 0.42],         // Dry warm savanna
  [BIOMES.TAIGA]: [0.35, 0.72, 0.45],           // Cool taiga green
  [BIOMES.SNOWY_PLAINS]: [0.94, 0.96, 0.99],    // Soft snow
  [BIOMES.MOUNTAINS]: [0.55, 0.58, 0.62],       // Cool mountain grey
  [BIOMES.SNOWY_PEAKS]: [0.95, 0.97, 1.0],      // Soft blue-white peaks
  [BIOMES.STONY_PEAKS]: [0.62, 0.64, 0.68],     // Warm stone peaks
  [BIOMES.MEADOW]: [0.55, 0.82, 0.38],          // Vibrant meadow
  [BIOMES.CHERRY_GROVE]: [0.94, 0.60, 0.78],    // Soft cherry blossom
  [BIOMES.SWAMP]: [0.30, 0.58, 0.32],           // Muted swamp green
  [BIOMES.RIVER]: [0.22, 0.52, 0.65],           // Clear river blue
  [BIOMES.MYSTIC_GROVE]: [0.45, 0.35, 0.68],    // Soft mystic purple
  [BIOMES.AUTUMN_FOREST]: [0.88, 0.50, 0.25],   // Warm autumn orange
  // SPEC-099: Wellness biomes - Ghibli zen tones
  [BIOMES.ZEN_GARDEN]: [0.90, 0.84, 0.65],      // Warm beige zen
  [BIOMES.BAMBOO_GROVE]: [0.52, 0.80, 0.42],    // Fresh bamboo green
  [BIOMES.AURORA_TUNDRA]: [0.65, 0.75, 0.92],   // Soft aurora blue
};

export class WorldGenPipeline {
  constructor(seed) {
    this.seed = seed;
    
    // v6.0: Simplex Noise replaces PerlinNoise3D
    this.densityNoise = new SimplexNoise(seed);
    
    // 2D Noises for spline parameters (Simplex)
    this.continentalnessNoise = new SimplexNoise(seed + 100);
    this.erosionNoise = new SimplexNoise(seed + 200);
    this.weirdnessNoise = new SimplexNoise(seed + 300);
    
    // Temperature & Humidity for biomes
    this.temperatureNoise = new SimplexNoise(seed + 400);
    this.humidityNoise = new SimplexNoise(seed + 500);
    
    // Cave noises
    this.cheeseNoise = new SimplexNoise(seed + 600);
    this.spaghettiNoise = new SimplexNoise(seed + 700);
    this.noodleNoise = new SimplexNoise(seed + 800);
    
    // Aquifer noises
    this.aquiferNoise = new SimplexNoise(seed + 900);
    this.barrierNoise = new SimplexNoise(seed + 1000);
    
    // v6.0: Domain Warper for organic patterns
    this.warper = new DomainWarper(seed);
    
    // v6.0: Advanced terrain splines
    this.terrainSplines = new TerrainSplines();
    
    // v6.0: Biome blender for smooth transitions
    this.biomeBlender = new BiomeBlender(this);
    
    // v6.0: Biome terrain modulator
    this.biomeModulator = new BiomeTerrainModulator(seed);
    
    // v6.0: Feature placer for coherent distribution
    this.featurePlacer = new FeaturePlacer(seed);
    
    // Legacy splines (kept for backward compat)
    this.continentalnessSpline = new Spline([
      {x: -1.0, y: -0.5},
      {x: -0.2, y: 0.0},
      {x: 0.0, y: 0.1},
      {x: 0.3, y: 0.3},
      {x: 0.6, y: 0.6},
      {x: 1.0, y: 1.0},
    ]);
    
    this.erosionSpline = new Spline([
      {x: -1.0, y: 1.0},
      {x: -0.5, y: 0.7},
      {x: 0.0, y: 0.3},
      {x: 0.5, y: 0.1},
      {x: 1.0, y: 0.0},
    ]);
    
    // v7.0: Hierarchical world generation (optional, initialized on demand)
    this.hierarchy = null;
    this._useHierarchy = false;

    // v7.1: Voronoi biome map for coherent biome regions
    this._voronoiBiomes = new VoronoiBiomeMap(seed);
    this._useVoronoiBiomes = true;
    this._useCellularNoise = true;
    // PRD G-03: Cellular noise for organic terrain patterns
    this._cellularNoise = new FastNoiseLite(seed + 12345);
    this._cellularNoise.setNoiseType(FN_NOISE_TYPE.CELLULAR);
    this._cellularNoise.setCellularReturnType(FN_CELLULAR_RETURN.F1_TIMES_F2);

    // Cache
    this.cache = new Map();
    this.cacheSize = 50000;
    this._biomeCache = new Map();
  }

  // v7.0: Enable hierarchical world generation
  enableHierarchy() {
    if (!this.hierarchy) {
      this.hierarchy = new HierarchicalChunkGenerator(this.seed);
    }
    this._useHierarchy = true;
    return this.hierarchy;
  }

  // v7.0: Disable hierarchical generation (fallback to v6.0)
  disableHierarchy() {
    this._useHierarchy = false;
  }

  // v7.0: Get hierarchical chunk context (delegates to HierarchicalChunkGenerator)
  getChunkContext(cx, cz) {
    if (!this._useHierarchy) return null;
    return this.hierarchy.getChunkContext(cx, cz);
  }

  // v7.0: Get biome from hierarchy if enabled, otherwise v6.0 method
  getBiomeHierarchical(x, z) {
    if (!this._useHierarchy) return this.getBiome(x, z);
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    return this.hierarchy.getPrimaryBiome(cx, cz);
  }

  // v7.0: Get world info from hierarchy
  getWorldInfo() {
    if (!this.hierarchy) return null;
    return this.hierarchy.getWorldInfo();
  }
  
  _cacheKey(x, y, z) {
    // Numeric key: pack x,z into 21 bits each, y into 20 bits
    const ix = Math.floor(x) & 0x1FFFFF;
    const iz = Math.floor(z) & 0x1FFFFF;
    const iy = Math.floor(y) & 0xFFFFF;
    return ix * 4194304 + iz * 1048576 + iy;
  }
  
  // Step 1: Calculate continentalness (land vs ocean) — v6.0 with domain warping
  getContinentalness(x, z) {
    const cfg = NOISE_CONFIGS.continentalness;
    const warped = this.warper.warp2D(x, z, cfg.warpStrength, cfg.warpScale, cfg.warpOctaves);
    return this.continentalnessNoise.fbm2D(warped.x, warped.z, cfg.octaves, cfg.persistence, cfg.lacunarity, cfg.scale);
  }
  
  // Step 2: Calculate erosion (flat vs jagged) — v6.0 with domain warping
  getErosion(x, z) {
    const cfg = NOISE_CONFIGS.erosion;
    const warped = this.warper.warp2D(x, z, cfg.warpStrength, cfg.warpScale, cfg.warpOctaves);
    return this.erosionNoise.fbm2D(warped.x, warped.z, cfg.octaves, cfg.persistence, cfg.lacunarity, cfg.scale);
  }
  
  // Step 3: Calculate weirdness (peaks vs valleys) — v6.0 with domain warping
  getWeirdness(x, z) {
    const cfg = NOISE_CONFIGS.weirdness;
    const warped = this.warper.warp2D(x, z, cfg.warpStrength, cfg.warpScale, cfg.warpOctaves);
    return this.weirdnessNoise.fbm2D(warped.x, warped.z, cfg.octaves, cfg.persistence, cfg.lacunarity, cfg.scale);
  }
  
  // v6.0: Calculate peaks/valleys with calibrated config
  getPeaksValleys(x, z) {
    const cfg = NOISE_CONFIGS.peaksValleys;
    const warped = this.warper.warp2D(x, z, cfg.warpStrength, cfg.warpScale, cfg.warpOctaves);
    return this.weirdnessNoise.fbm2D(warped.x, warped.z, cfg.octaves, cfg.persistence, cfg.lacunarity, cfg.scale);
  }
  
  // v6.0: Temperature with domain warping
  getTemperature(x, z) {
    const cfg = NOISE_CONFIGS.temperature;
    const warped = this.warper.warp2D(x, z, cfg.warpStrength, cfg.warpScale, cfg.warpOctaves);
    return this.temperatureNoise.fbm2D(warped.x, warped.z, cfg.octaves, cfg.persistence, cfg.lacunarity, cfg.scale);
  }
  
  // v6.0: Humidity with domain warping
  getHumidity(x, z) {
    const cfg = NOISE_CONFIGS.humidity;
    const warped = this.warper.warp2D(x, z, cfg.warpStrength, cfg.warpScale, cfg.warpOctaves);
    return this.humidityNoise.fbm2D(warped.x, warped.z, cfg.octaves, cfg.persistence, cfg.lacunarity, cfg.scale);
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
  
  // v6.0: Lightweight biome estimate without calling getBaseHeight (breaks circular dep)
  _estimateBiome(cont, erosion, pv, weirdness, temp, humid, baseHeight) {
    if (cont < -0.3) return BIOMES.DEEP_OCEAN;
    if (cont < 0.0) return BIOMES.OCEAN;
    if (baseHeight < SEA_LEVEL + 3) return BIOMES.BEACH;
    if (pv < -0.5 && cont > 0.0 && cont < 0.5 && baseHeight < SEA_LEVEL + 2) return BIOMES.RIVER;
    if (baseHeight > SEA_LEVEL + 100) {
      if (temp < 0.2) return BIOMES.SNOWY_PEAKS;
      if (erosion < -0.3) return BIOMES.STONY_PEAKS;
      return BIOMES.MOUNTAINS;
    }
    if (baseHeight > SEA_LEVEL + 60) {
      if (temp < 0.3) return BIOMES.SNOWY_PLAINS;
      return BIOMES.MEADOW;
    }
    if (temp < 0.2) return BIOMES.SNOWY_PLAINS;
    if (temp < 0.4) return BIOMES.TAIGA;
    if (temp > 0.8) {
      if (humid < 0.3) return BIOMES.DESERT;
      if (humid > 0.7) return BIOMES.JUNGLE;
      return BIOMES.SAVANNA;
    }
    if (humid > 0.6) return BIOMES.FOREST;
    if (humid < 0.3 && erosion > 0.3) return BIOMES.PLAINS;
    if (humid > 0.5) return BIOMES.SWAMP;
    return BIOMES.PLAINS;
  }
  
  // Step 5: Calculate base height using v6.0 TerrainSplines (cached per x,z)
  getBaseHeight(x, z) {
    // v7.0: Use hierarchical heightmap if enabled
    if (this._useHierarchy && this.hierarchy) {
      const cx = Math.floor(x / CHUNK_SIZE);
      const cz = Math.floor(z / CHUNK_SIZE);
      const lx = x - cx * CHUNK_SIZE;
      const lz = z - cz * CHUNK_SIZE;
      return this.hierarchy.getHeightAt(cx, cz, lx, lz);
    }
    const ix = Math.floor(x) & 0x1FFFFF;
    const iz = Math.floor(z) & 0x1FFFFF;
    const key = ix * 4194304 + iz;
    if (this._heightCache && this._heightCache.has(key)) {
      return this._heightCache.get(key);
    }
    const { cont, erosion, weirdness, pv } = this._getSplineParams(x, z);
    
    // v6.0: Use advanced TerrainSplines
    let baseHeight = this.terrainSplines.getHeight(cont, erosion, pv, weirdness);

    // PRD G-03: Cellular noise adds organic micro-patterns to terrain height
    if (this._useCellularNoise && this._cellularNoise) {
      const cellVal = this._cellularNoise.cellular2D(x * 0.01, z * 0.01);
      baseHeight += (cellVal - 0.5) * 4; // ±2 block organic variation
    }

    // v6.0: Apply biome-specific modulation using lightweight biome estimate
    // (avoid calling getBiome which calls getBaseHeight → circular recursion)
    const temp = this.getTemperature(x, z);
    const humid = this.getHumidity(x, z);
    const estimatedBiome = this._estimateBiome(cont, erosion, pv, weirdness, temp, humid, baseHeight);
    baseHeight = this.biomeModulator.modulate(baseHeight, x, z, estimatedBiome);
    
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
  
  // Step 6: Calculate 3D density (solid vs air) — v6.0 with domain warping
  getDensity(x, y, z) {
    const key = this._cacheKey(x, y, z);
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const baseHeight = this.getBaseHeight(x, z);
    
    // Height bias (squeezing)
    const heightBias = (baseHeight - y) * 0.05;
    
    // v6.0: 3D noise with domain warping for organic caves
    const cfg = NOISE_CONFIGS.density3D;
    const warped3D = this.warper.warp3D(x, y, z, cfg.warpStrength, cfg.warpScale, cfg.warpOctaves);
    const noise3D = this.densityNoise.fbm3D(warped3D.x, warped3D.y, warped3D.z, cfg.octaves, cfg.persistence, cfg.lacunarity, cfg.scale);
    
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
      const biome = this.getBiome(x, z);
      // Use fast check: if y+1 > baseHeight + 15, it's definitely air
      if (y + 1 > baseHeight + 15) {
        return this.getSurfaceBlock(biome, y);
      }
      const densityAbove = this.getDensity(x, y + 1, z);
      if (densityAbove <= 0) {
        return this.getSurfaceBlock(biome, y);
      }
      // SPEC-BIOME-OVERHAUL: Use subsurface blocks for layers near surface
      const surfaceY = Math.ceil(baseHeight);
      if (y >= surfaceY - 5) {
        return this.getSubsurfaceBlock(biome, y, surfaceY);
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
  
  // Step 10: Get surface block based on biome — SPEC-BIOME-OVERHAUL
  getSurfaceBlock(biome, y) {
    if (y < SEA_LEVEL - 10) return 'stone';

    switch (biome) {
      case BIOMES.DESERT: return 'sand';
      case BIOMES.BEACH: return 'sand';
      case BIOMES.SNOWY_PLAINS:
      case BIOMES.SNOWY_PEAKS: return 'snow';
      case BIOMES.STONY_PEAKS: return 'calcite';
      case BIOMES.MOUNTAINS: return 'stone';
      case BIOMES.SWAMP: return 'mud';
      case BIOMES.SAVANNA: return 'coarse_dirt';
      case BIOMES.MEADOW: return 'grass';
      case BIOMES.CHERRY_GROVE: return 'grass';
      case BIOMES.MYSTIC_GROVE: return 'mycelium';
      case BIOMES.AUTUMN_FOREST: return 'grass';
      case BIOMES.TAIGA: return 'grass';
      case BIOMES.JUNGLE: return 'grass';
      case BIOMES.FOREST: return 'grass';
      case BIOMES.PLAINS: return 'grass';
      case BIOMES.RIVER: return 'sand';
      // SPEC-099: Wellness biomes
      case BIOMES.ZEN_GARDEN: return 'sand';
      case BIOMES.BAMBOO_GROVE: return 'grass';
      case BIOMES.AURORA_TUNDRA: return 'snow';
      default: return 'grass';
    }
  }

  // SPEC-BIOME-OVERHAUL: Get subsurface block based on biome
  getSubsurfaceBlock(biome, y, surfaceY) {
    const depth = surfaceY - y;
    if (depth <= 0) return this.getSurfaceBlock(biome, y);

    switch (biome) {
      case BIOMES.DESERT:
      case BIOMES.BEACH:
        return depth <= 3 ? 'sand' : 'sandstone';
      case BIOMES.STONY_PEAKS:
      case BIOMES.MOUNTAINS:
        return 'stone';
      case BIOMES.SNOWY_PLAINS:
      case BIOMES.SNOWY_PEAKS:
        return depth <= 2 ? 'snow_block' : 'stone';
      case BIOMES.SWAMP:
        return depth <= 2 ? 'mud' : 'dirt';
      case BIOMES.SAVANNA:
        return depth <= 3 ? 'coarse_dirt' : 'dirt';
      case BIOMES.MYSTIC_GROVE:
        return depth <= 2 ? 'mycelium' : 'dirt';
      default:
        return depth <= 3 ? 'dirt' : 'stone';
    }
  }
  
  // Step 11: Determine biome — v7.1 with Voronoi regions or v6.0 fallback
  getBiome(x, z) {
    // v7.0: Use hierarchical biome if enabled
    if (this._useHierarchy && this.hierarchy) {
      const cx = Math.floor(x / CHUNK_SIZE);
      const cz = Math.floor(z / CHUNK_SIZE);
      return this.hierarchy.getPrimaryBiome(cx, cz);
    }
    const ix = Math.floor(x) & 0x1FFFFF;
    const iz = Math.floor(z) & 0x1FFFFF;
    const key = ix * 4194304 + iz;
    if (this._biomeCache && this._biomeCache.has(key)) {
      return this._biomeCache.get(key);
    }

    // v7.1: Use Voronoi biome map for coherent large-scale regions
    if (this._useVoronoiBiomes && this._voronoiBiomes) {
      const biome = this._voronoiBiomes.getBiomeWithBlend(
        x, z,
        (bx, bz) => this.getBaseHeight(bx, bz),
        (bx, bz) => this.getContinentalness(bx, bz)
      );
      this._biomeCache.set(key, biome);
      return biome;
    }

    // v6.0 fallback: noise-based biome selection
    const { cont, erosion, pv } = this._getSplineParams(x, z);
    
    // v6.0: Use calibrated temperature/humidity with domain warping
    const temp = this.getTemperature(x, z);
    const humid = this.getHumidity(x, z);
    
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

    // SPEC-099: Wellness biomes — rare, require specific conditions
    if (temp > 0.4 && temp < 0.6 && humid > 0.5 && humid < 0.65 && weirdness > 0.3 && cont > 0.2) {
      this._biomeCache.set(key, BIOMES.ZEN_GARDEN);
      return BIOMES.ZEN_GARDEN;
    }
    if (temp > 0.6 && temp < 0.8 && humid > 0.7 && weirdness > 0.4) {
      this._biomeCache.set(key, BIOMES.BAMBOO_GROVE);
      return BIOMES.BAMBOO_GROVE;
    }
    if (temp < 0.15 && humid > 0.4 && weirdness > 0.5 && baseHeight > SEA_LEVEL + 30) {
      this._biomeCache.set(key, BIOMES.AURORA_TUNDRA);
      return BIOMES.AURORA_TUNDRA;
    }

    this._biomeCache.set(key, BIOMES.PLAINS);
    return BIOMES.PLAINS;
  }
  
  clearCache() {
    this.cache.clear();
    if (this._biomeCache) this._biomeCache.clear();
    if (this._splineParamsCache) this._splineParamsCache.clear();
    if (this._voronoiBiomes) this._voronoiBiomes.clearCache();
  }
}

// ═══════════════════════════════════════════════════════════
// Voxel Chunk — 32x384x32 blocks
// ═══════════════════════════════════════════════════════════
const BLOCK_TYPE_TO_ID = {
  air: 0, stone: 1, grass: 2, dirt: 3, sand: 4, water: 5, lava: 6, snow: 7, mud: 8,
  // SPEC-BIOME-OVERHAUL: extended terrain blocks
  red_sand: 171, terracotta: 172, calcite: 173, coarse_dirt: 174,
  snow_block: 39, ice: 40, packed_ice: 41, granite: 45, andesite: 46, diorite: 47,
  sandstone: 34, gravel: 22, clay: 23, mossy_cobble: 19, moss: 43, mycelium: 42,
};

export class VoxelChunk {
  // SPEC-PERF-004: Object pool — reuse chunks to avoid 64KB Uint8Array allocations
  static _pool = [];
  static _poolMax = 64;

  static acquire(cx, cz, worldGen) {
    const chunk = VoxelChunk._pool.pop();
    if (chunk) {
      chunk.cx = cx;
      chunk.cz = cz;
      chunk.worldGen = worldGen;
      chunk.generated = false;
      chunk.blocks.fill(0);
      chunk.minContentY = undefined;
      chunk.maxContentY = undefined;
      return chunk;
    }
    return new VoxelChunk(cx, cz, worldGen);
  }

  static release(chunk) {
    if (VoxelChunk._pool.length < VoxelChunk._poolMax) {
      chunk.worldGen = null;
      VoxelChunk._pool.push(chunk);
    }
  }

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
    const stride = CHUNK_SIZE * CHUNK_SIZE;

    // Track content Y range for meshing optimization (skip full pre-scan)
    let minContentY = CHUNK_HEIGHT;
    let maxContentY = 0;

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const worldX = offsetX + x;
        const worldZ = offsetZ + z;
        const baseHeight = this.worldGen.getBaseHeight(worldX, worldZ);
        const terrainTop = Math.ceil(baseHeight) + NOISE_MARGIN;

        // Calculate Y boundaries in local chunk coordinates
        // Deep stone: y=0 to stoneEndY-1 (no noise needed)
        // Surface band: stoneEndY to surfaceTopY (full noise calculation)
        // Air/water: surfaceTopY+1 to CHUNK_HEIGHT-1
        const stoneEndY = Math.max(0, Math.floor(baseHeight - NOISE_MARGIN - WORLD_MIN_Y));
        const surfaceTopY = Math.min(CHUNK_HEIGHT - 1, Math.ceil(terrainTop - WORLD_MIN_Y));
        const colBase = x + z * CHUNK_SIZE;

        // Bulk fill deep stone — tight loop without if checks
        for (let y = 0; y < stoneEndY; y++) {
          this.blocks[colBase + y * stride] = 1; // stone
        }
        if (stoneEndY > 0) {
          if (0 < minContentY) minContentY = 0;
          if (stoneEndY - 1 > maxContentY) maxContentY = stoneEndY - 1;
        }

        // Surface band — full noise calculation (the only expensive part)
        for (let y = stoneEndY; y <= surfaceTopY; y++) {
          const worldY = WORLD_MIN_Y + y;
          const idx = colBase + y * stride;

          if (worldY > terrainTop) {
            // Above terrain: air or water
            if (worldY < SEA_LEVEL) {
              const aquifer = this.worldGen.getAquiferState(worldX, worldY, worldZ);
              this.blocks[idx] = this.blockTypeToId(aquifer);
              if (this.blocks[idx] !== 0 && y > maxContentY) maxContentY = y;
            } else {
              this.blocks[idx] = 0; // air
            }
            continue;
          }

          const blockType = this.worldGen.getBlockType(worldX, worldY, worldZ);
          this.blocks[idx] = this.blockTypeToId(blockType);
          if (this.blocks[idx] !== 0) {
            if (y < minContentY) minContentY = y;
            if (y > maxContentY) maxContentY = y;
          }
        }

        // Bulk fill air above surface (skip iteration for the majority of the height)
        // Only fill if there's a gap between surfaceTopY+1 and CHUNK_HEIGHT-1
        // Water above terrain was already handled in the surface band loop
      }
    }

    this.minContentY = minContentY;
    this.maxContentY = maxContentY;
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
