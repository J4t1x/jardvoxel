// ═══════════════════════════════════════════════════════════
// JardVoxel 6.0 — Advanced Noise Generation & Coherent Biomes
// Specs: SPEC-091 through SPEC-098
// Based on: Simplex Noise Demystified (Stefan Gustavson, 2005)
// ═══════════════════════════════════════════════════════════

// Self-contained PRNG (Xorshift128+) — duplicated from engine to avoid circular deps
class PRNG {
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

// Self-contained Spline — duplicated from engine to avoid circular deps
class Spline {
  constructor(points) {
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
        const prev = this.points[i - 1] || p0;
        const next = this.points[i + 2] || p1;
        const m0 = (p1.y - prev.y) / (p1.x - prev.x);
        const m1 = (next.y - p0.y) / (next.x - p0.x);
        const t2 = t * t;
        const t3 = t2 * t;
        return (2 * t3 - 3 * t2 + 1) * p0.y + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * p1.y + (t3 - t2) * m1;
      }
    }
    return 0;
  }
}

// Constants — duplicated from engine to avoid circular deps
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

const BIOME_COLORS = {
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

// ═══════════════════════════════════════════════════════════
// SPEC-091: Simplex Noise Core
// Replaces PerlinNoise3D with O(n²) 3D Simplex Noise
// ═══════════════════════════════════════════════════════════
export class SimplexNoise {
  constructor(seed) {
    this.grad3 = [
      [1,1,0], [-1,1,0], [1,-1,0], [-1,-1,0],
      [1,0,1], [-1,0,1], [1,0,-1], [-1,0,-1],
      [0,1,1], [0,-1,1], [0,1,-1], [0,-1,-1]
    ];

    this.perm = this._generatePermutation(seed);
    this.permMod12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  _generatePermutation(seed) {
    const prng = new PRNG(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(prng.next() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    return perm;
  }

  noise2D(x, y) {
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;

    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);

    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;

    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.permMod12[ii + this.perm[jj]];
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
    const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];

    let n0 = 0, n1 = 0, n2 = 0;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * this._dot2(this.grad3[gi0], x0, y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * this._dot2(this.grad3[gi1], x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * this._dot2(this.grad3[gi2], x2, y2);
    }

    return 70 * (n0 + n1 + n2);
  }

  noise3D(x, y, z) {
    const F3 = 1.0 / 3.0;
    const G3 = 1.0 / 6.0;

    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);

    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;
    const x0 = x - X0;
    const y0 = y - Y0;
    const z0 = z - Z0;

    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
      else if (x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
      else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
    } else {
      if (y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
      else if (x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
      else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
    }

    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3;
    const y2 = y0 - j2 + 2 * G3;
    const z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3;
    const y3 = y0 - 1 + 3 * G3;
    const z3 = z0 - 1 + 3 * G3;

    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const gi0 = this.permMod12[ii + this.perm[jj + this.perm[kk]]];
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]];
    const gi2 = this.permMod12[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]];
    const gi3 = this.permMod12[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]];

    let n0 = 0, n1 = 0, n2 = 0, n3 = 0;

    let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * this._dot3(this.grad3[gi0], x0, y0, z0);
    }

    let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * this._dot3(this.grad3[gi1], x1, y1, z1);
    }

    let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * this._dot3(this.grad3[gi2], x2, y2, z2);
    }

    let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
    if (t3 >= 0) {
      t3 *= t3;
      n3 = t3 * t3 * this._dot3(this.grad3[gi3], x3, y3, z3);
    }

    return 32 * (n0 + n1 + n2 + n3);
  }

  fbm2D(x, y, octaves, persistence, lacunarity, scale) {
    let total = 0;
    let amplitude = 1;
    let frequency = scale;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  fbm3D(x, y, z, octaves, persistence, lacunarity, scale) {
    let total = 0;
    let amplitude = 1;
    let frequency = scale;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  ridgedFbm2D(x, y, octaves, persistence, lacunarity, scale) {
    let total = 0;
    let amplitude = 1;
    let frequency = scale;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      const n = this.noise2D(x * frequency, y * frequency);
      const ridged = 1 - Math.abs(n);
      total += ridged * ridged * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  billowyFbm2D(x, y, octaves, persistence, lacunarity, scale) {
    let total = 0;
    let amplitude = 1;
    let frequency = scale;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      const n = this.noise2D(x * frequency, y * frequency);
      total += Math.abs(n) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  steppedFbm2D(x, y, octaves, persistence, lacunarity, scale, steps = 4) {
    const fbm = this.fbm2D(x, y, octaves, persistence, lacunarity, scale);
    return Math.floor(fbm * steps) / steps;
  }

  dunesFbm2D(x, y, octaves, persistence, lacunarity, scale) {
    let total = 0;
    let amplitude = 1;
    let frequency = scale;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      const n = this.noise2D(x * frequency, y * frequency);
      const dune = Math.sin(n * Math.PI * 2) * 0.5 + 0.5;
      total += dune * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  _dot2(g, x, y) {
    return g[0] * x + g[1] * y;
  }

  _dot3(g, x, y, z) {
    return g[0] * x + g[1] * y + g[2] * z;
  }
}

// ═══════════════════════════════════════════════════════════
// SPEC-092: Domain Warping System
// Breaks regularity of Simplex noise for organic patterns
// ═══════════════════════════════════════════════════════════
export class DomainWarper {
  constructor(seed) {
    this.warpNoiseX = new SimplexNoise(seed + 5000);
    this.warpNoiseY = new SimplexNoise(seed + 5001);
    this.warpNoiseZ = new SimplexNoise(seed + 5002);
    this.warpNoiseX2 = new SimplexNoise(seed + 5003);
    this.warpNoiseZ2 = new SimplexNoise(seed + 5004);
  }

  warp2D(x, z, strength = 50, scale = 0.003, octaves = 3) {
    const offsetX = this.warpNoiseX.fbm2D(x, z, octaves, 0.5, 2.0, scale) * strength;
    const offsetZ = this.warpNoiseZ.fbm2D(x, z, octaves, 0.5, 2.0, scale) * strength;

    return {
      x: x + offsetX,
      z: z + offsetZ
    };
  }

  warp2DRecursive(x, z, strength1 = 50, strength2 = 25) {
    const warp1 = this.warp2D(x, z, strength1, 0.003, 3);

    const offsetX2 = this.warpNoiseX2.fbm2D(warp1.x, warp1.z, 2, 0.5, 2.0, 0.005) * strength2;
    const offsetZ2 = this.warpNoiseZ2.fbm2D(warp1.x, warp1.z, 2, 0.5, 2.0, 0.005) * strength2;

    return {
      x: warp1.x + offsetX2,
      z: warp1.z + offsetZ2
    };
  }

  warp3D(x, y, z, strength = 30, scale = 0.01, octaves = 2) {
    const offsetX = this.warpNoiseX.fbm3D(x, y, z, octaves, 0.5, 2.0, scale) * strength;
    const offsetY = this.warpNoiseY.fbm3D(x, y, z, octaves, 0.5, 2.0, scale) * strength;
    const offsetZ = this.warpNoiseZ.fbm3D(x, y, z, octaves, 0.5, 2.0, scale) * strength;

    return {
      x: x + offsetX,
      y: y + offsetY,
      z: z + offsetZ
    };
  }

  warp2DDirectional(x, z, dirX, dirZ, strength = 50) {
    const warp = this.warp2D(x, z, strength);
    const bias = strength * 0.3;
    warp.x += dirX * bias;
    warp.z += dirZ * bias;
    return warp;
  }
}

// ═══════════════════════════════════════════════════════════
// SPEC-093: Calibrated Noise Parameters
// Per-layer noise configuration replacing fixed parameters
// ═══════════════════════════════════════════════════════════
export const NOISE_CONFIGS = {
  continentalness: {
    octaves: 6,
    persistence: 0.5,
    lacunarity: 2.0,
    // Wavelength ~1/scale in blocks. Was 0.0003 (~3300 block landmasses) —
    // at renderDistance ~14-20 chunks (448-640 blocks) that's only ~15-20%
    // of one land/ocean cycle, so most spawns land near a coastline and the
    // world reads as a small island. Halved to double landmass size.
    scale: 0.00015,
    warpStrength: 160, // SPEC-078: increased 2x for visible organic warping
    warpScale: 0.0015, // halved alongside scale to keep coastline wobble proportional
    warpOctaves: 3,
  },
  erosion: {
    octaves: 5,
    persistence: 0.55,
    lacunarity: 2.2,
    scale: 0.0008,
    warpStrength: 80, // SPEC-078: increased 2x
    warpScale: 0.005,
    warpOctaves: 2,
  },
  peaksValleys: {
    octaves: 4,
    persistence: 0.6,
    lacunarity: 2.5,
    scale: 0.0012,
    warpStrength: 60, // SPEC-078: increased 2x
    warpScale: 0.004,
    warpOctaves: 3,
  },
  weirdness: {
    octaves: 3,
    persistence: 0.5,
    lacunarity: 2.0,
    scale: 0.0015,
    warpStrength: 40, // SPEC-078: increased 2x
    warpScale: 0.006,
    warpOctaves: 2,
  },
  temperature: {
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2.0,
    scale: 0.0005,
    warpStrength: 120, // SPEC-078: increased 2x
    warpScale: 0.003,
    warpOctaves: 4,
  },
  humidity: {
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2.0,
    scale: 0.0005,
    warpStrength: 120, // SPEC-078: increased 2x
    warpScale: 0.003,
    warpOctaves: 4,
  },
  density3D: {
    octaves: 5,
    persistence: 0.5,
    lacunarity: 2.0,
    scale: 0.008,
    warpStrength: 30, // SPEC-078: increased 2x
    warpScale: 0.01,
    warpOctaves: 2,
  },
};

// ═══════════════════════════════════════════════════════════
// SPEC-094: Multi-Spline Terrain Shaping
// Expands spline system for complex terrain modeling
// ═══════════════════════════════════════════════════════════
export class TerrainSplines {
  constructor() {
    this.continentalnessSpline = new Spline([
      { x: -1.0, y: -80 },
      { x: -0.5, y: -40 },
      { x: -0.2, y: -10 },
      { x: 0.0, y: 0 },
      { x: 0.2, y: 15 },
      { x: 0.4, y: 35 },
      { x: 0.6, y: 60 },
      { x: 0.8, y: 100 },
      { x: 1.0, y: 180 },
    ]);

    this.erosionSpline = new Spline([
      { x: -1.0, y: 1.0 },
      { x: -0.5, y: 0.8 },
      { x: 0.0, y: 0.5 },
      { x: 0.5, y: 0.2 },
      { x: 1.0, y: 0.0 },
    ]);

    this.pvSpline = new Spline([
      { x: -1.0, y: -60 },
      { x: -0.5, y: -30 },
      { x: 0.0, y: 0 },
      { x: 0.5, y: 40 },
      { x: 1.0, y: 80 },
    ]);

    this.weirdnessSpline = new Spline([
      { x: -1.0, y: -20 },
      { x: 0.0, y: 0 },
      { x: 1.0, y: 20 },
    ]);
  }

  getHeight(cont, erosion, pv, weirdness) {
    const baseHeight = this.continentalnessSpline.evaluate(cont);
    const erosionFactor = this.erosionSpline.evaluate(erosion);
    const pvOffset = this.pvSpline.evaluate(pv);
    const weirdnessOffset = this.weirdnessSpline.evaluate(weirdness);

    let height = baseHeight;

    if (cont > 0.0) {
      height += pvOffset * erosionFactor;
    }

    height += weirdnessOffset * (1 - Math.abs(erosion));

    return height + SEA_LEVEL;
  }
}

// ═══════════════════════════════════════════════════════════
// SPEC-095: Smooth Biome Transitions (Biome Blending)
// Eliminates sharp borders between biomes
// ═══════════════════════════════════════════════════════════
export class BiomeBlender {
  constructor(worldGen) {
    this.worldGen = worldGen;
    // SPEC-078: Increased from 8 to 16 for smoother 4-8 block transitions
    this.blendRadius = 16;
  }

  getBlendedBiome(x, z) {
    const centerBiome = this.worldGen.getBiome(x, z);

    const samples = [];
    const step = this.blendRadius;
    for (let dx = -step; dx <= step; dx += step) {
      for (let dz = -step; dz <= step; dz += step) {
        const biome = this.worldGen.getBiome(x + dx, z + dz);
        const dist = Math.sqrt(dx * dx + dz * dz);
        const weight = Math.max(0, 1 - dist / (step * 1.5));
        samples.push({ biome, weight });
      }
    }

    const uniqueBiomes = new Set(samples.map(s => s.biome));
    if (uniqueBiomes.size === 1) return { primary: centerBiome, blend: null };

    const biomeWeights = new Map();
    for (const { biome, weight } of samples) {
      biomeWeights.set(biome, (biomeWeights.get(biome) || 0) + weight);
    }

    const totalWeight = Array.from(biomeWeights.values()).reduce((a, b) => a + b, 0);
    for (const [biome, weight] of biomeWeights) {
      biomeWeights.set(biome, weight / totalWeight);
    }

    return { primary: centerBiome, blend: biomeWeights };
  }

  getBlendedColor(x, z) {
    const blended = this.getBlendedBiome(x, z);
    if (!blended.blend) return BIOME_COLORS[blended.primary] || [0.5, 0.5, 0.5];

    let r = 0, g = 0, b = 0;
    for (const [biome, weight] of blended.blend) {
      const color = BIOME_COLORS[biome] || [0.5, 0.5, 0.5];
      r += color[0] * weight;
      g += color[1] * weight;
      b += color[2] * weight;
    }

    return [r, g, b];
  }

  getBlendedSurfaceBlock(x, y, z) {
    const blended = this.getBlendedBiome(x, z);
    if (!blended.blend) {
      return this.worldGen.getSurfaceBlock(blended.primary, y);
    }

    const hash = this._hash(x, z);
    let cumulative = 0;
    for (const [biome, weight] of blended.blend) {
      cumulative += weight;
      if (hash < cumulative) {
        return this.worldGen.getSurfaceBlock(biome, y);
      }
    }

    return this.worldGen.getSurfaceBlock(blended.primary, y);
  }

  _hash(x, z) {
    return ((x * 374761393 + z * 668265263) & 0x7FFFFFFF) / 0x7FFFFFFF;
  }
}

// ═══════════════════════════════════════════════════════════
// SPEC-096: Biome-Specific Terrain Modulation
// Each biome modulates base terrain with specific noise
// ═══════════════════════════════════════════════════════════
export const BIOME_TERRAIN_MODULATION = {
  [BIOMES.PLAINS]: { amplitudeScale: 0.3, frequencyScale: 1.0, octaves: 2 },
  [BIOMES.FOREST]: { amplitudeScale: 0.8, frequencyScale: 1.0, octaves: 3 },
  [BIOMES.MOUNTAINS]: { amplitudeScale: 2.5, frequencyScale: 0.8, octaves: 6 },
  [BIOMES.DESERT]: { amplitudeScale: 0.8, frequencyScale: 1.2, octaves: 3 },
  [BIOMES.JUNGLE]: { amplitudeScale: 1.2, frequencyScale: 1.5, octaves: 4 },
  [BIOMES.OCEAN]: { amplitudeScale: 0.5, frequencyScale: 0.6, octaves: 3 },
  [BIOMES.DEEP_OCEAN]: { amplitudeScale: 0.3, frequencyScale: 0.5, octaves: 2 },
  [BIOMES.SWAMP]: { amplitudeScale: 0.4, frequencyScale: 2.0, octaves: 2 },
  [BIOMES.TAIGA]: { amplitudeScale: 0.7, frequencyScale: 0.9, octaves: 3 },
  [BIOMES.SAVANNA]: { amplitudeScale: 0.5, frequencyScale: 1.1, octaves: 3 },
  [BIOMES.SNOWY_PLAINS]: { amplitudeScale: 0.3, frequencyScale: 1.0, octaves: 2 },
  [BIOMES.SNOWY_PEAKS]: { amplitudeScale: 2.0, frequencyScale: 0.8, octaves: 5 },
  [BIOMES.STONY_PEAKS]: { amplitudeScale: 1.8, frequencyScale: 0.9, octaves: 5 },
  [BIOMES.MEADOW]: { amplitudeScale: 0.5, frequencyScale: 1.0, octaves: 3 },
  [BIOMES.CHERRY_GROVE]: { amplitudeScale: 0.6, frequencyScale: 1.0, octaves: 3 },
  [BIOMES.RIVER]: { amplitudeScale: 0.2, frequencyScale: 0.8, octaves: 2 },
  [BIOMES.BEACH]: { amplitudeScale: 0.2, frequencyScale: 1.0, octaves: 2 },
  [BIOMES.MYSTIC_GROVE]: { amplitudeScale: 1.0, frequencyScale: 1.3, octaves: 4 },
  [BIOMES.AUTUMN_FOREST]: { amplitudeScale: 0.9, frequencyScale: 1.1, octaves: 3 },
};

export class BiomeTerrainModulator {
  constructor(seed) {
    this.modulationNoise = new SimplexNoise(seed + 6000);
  }

  modulate(baseHeight, x, z, biome) {
    const config = BIOME_TERRAIN_MODULATION[biome];
    if (!config) return baseHeight;

    const modulation = this.modulationNoise.fbm2D(
      x,
      z,
      config.octaves,
      0.5,
      2.0,
      0.01 * config.frequencyScale
    );

    return baseHeight + modulation * 10 * config.amplitudeScale;
  }
}

// ═══════════════════════════════════════════════════════════
// SPEC-097: Coherent Feature Distribution
// Trees, rocks, vegetation in natural clusters
// ═══════════════════════════════════════════════════════════
export const BIOME_TREE_CONFIG = {
  [BIOMES.FOREST]: {
    density: 0.12,
    types: [
      { type: 'oak', weight: 0.7 },
      { type: 'birch', weight: 0.2 },
      { type: 'giant_oak', weight: 0.1 },
    ],
  },
  [BIOMES.JUNGLE]: {
    density: 0.18,
    types: [
      { type: 'jungle', weight: 0.8 },
      { type: 'giant_jungle', weight: 0.2 },
    ],
  },
  [BIOMES.TAIGA]: {
    density: 0.10,
    defaultType: 'spruce',
  },
  [BIOMES.PLAINS]: {
    density: 0.02,
    defaultType: 'oak',
  },
  [BIOMES.SWAMP]: {
    density: 0.06,
    defaultType: 'dead',
  },
  [BIOMES.SAVANNA]: {
    density: 0.04,
    defaultType: 'acacia',
  },
  [BIOMES.SNOWY_PLAINS]: {
    density: 0.03,
    defaultType: 'spruce',
  },
  [BIOMES.MEADOW]: {
    density: 0.05,
    types: [
      { type: 'oak', weight: 0.6 },
      { type: 'birch', weight: 0.4 },
    ],
  },
  [BIOMES.CHERRY_GROVE]: {
    density: 0.08,
    defaultType: 'cherry',
  },
  [BIOMES.MYSTIC_GROVE]: {
    density: 0.10,
    defaultType: 'mystic_mushroom',
  },
  [BIOMES.AUTUMN_FOREST]: {
    density: 0.10,
    types: [
      { type: 'autumn_oak', weight: 0.6 },
      { type: 'oak', weight: 0.3 },
      { type: 'birch', weight: 0.1 },
    ],
  },
};

export class FeaturePlacer {
  constructor(seed) {
    this.featureNoise = new SimplexNoise(seed + 7000);
    this.densityNoise = new SimplexNoise(seed + 7001);
    this.clusterNoise = new SimplexNoise(seed + 7002);
    // SPEC-078: Collision tracking — records placed features to prevent overlap
    this._placedFeatures = new Map(); // key: "cx,cz" → { x, z, radius }
    this._collisionRadius = 4; // minimum distance between tree trunks
  }

  shouldPlaceTree(x, z, biome) {
    const config = BIOME_TREE_CONFIG[biome];
    if (!config) return false;

    const cluster = this.clusterNoise.noise2D(x * 0.02, z * 0.02);
    if (cluster < -0.3) return false;

    const density = this.densityNoise.noise2D(x * 0.05, z * 0.05);
    const adjustedDensity = config.density * (0.5 + density * 0.5);

    const feature = this.featureNoise.noise2D(x * 0.1, z * 0.1);

    if (feature <= (1 - adjustedDensity)) return false;

    // SPEC-078: Collision detection — check no existing feature within radius
    if (this._hasNearbyFeature(x, z)) return false;

    return true;
  }

  // SPEC-078: Register a placed feature so future placements avoid it
  registerFeature(x, z, radius = this._collisionRadius) {
    const key = `${Math.floor(x / 16)},${Math.floor(z / 16)}`;
    if (!this._placedFeatures.has(key)) {
      this._placedFeatures.set(key, []);
    }
    this._placedFeatures.get(key).push({ x, z, radius });
  }

  // SPEC-078: Check if any registered feature is within collision radius
  _hasNearbyFeature(x, z) {
    const cx = Math.floor(x / 16);
    const cz = Math.floor(z / 16);
    // Check 3x3 grid of cells around the target
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const key = `${cx + dx},${cz + dz}`;
        const features = this._placedFeatures.get(key);
        if (!features) continue;
        for (const f of features) {
          const distSq = (f.x - x) ** 2 + (f.z - z) ** 2;
          const minDist = f.radius + this._collisionRadius;
          if (distSq < minDist * minDist) return true;
        }
      }
    }
    return false;
  }

  // SPEC-078: Clear collision cache for a chunk (on chunk unload)
  clearChunk(cx, cz) {
    this._placedFeatures.delete(`${cx},${cz}`);
  }

  // SPEC-078: Clear all (on world dispose)
  clearAll() {
    this._placedFeatures.clear();
  }

  getTreeType(x, z, biome) {
    const config = BIOME_TREE_CONFIG[biome];
    if (!config.types) return config.defaultType;

    const typeNoise = this.featureNoise.noise2D(x * 0.03, z * 0.03);
    const normalized = (typeNoise + 1) / 2;

    let cumulative = 0;
    for (const { type, weight } of config.types) {
      cumulative += weight;
      if (normalized < cumulative) return type;
    }

    return config.types[config.types.length - 1].type;
  }

  getTreeVariation(x, z) {
    const sizeNoise = this.featureNoise.noise2D(x * 0.07, z * 0.07);
    const rotationNoise = this.featureNoise.noise2D(x * 0.13, z * 0.13);

    return {
      sizeScale: 0.8 + sizeNoise * 0.4,
      rotation: rotationNoise * Math.PI * 2,
      asymmetry: Math.abs(this.featureNoise.noise2D(x * 0.11, z * 0.11)),
    };
  }
}

// ═══════════════════════════════════════════════════════════
// SPEC-098: Hydraulic Erosion Simulation
// Post-generation erosion for natural terrain
// ═══════════════════════════════════════════════════════════
export class HydraulicErosion {
  constructor(seed) {
    this.rainNoise = new SimplexNoise(seed + 8000);
  }

  erode(heightmap, iterations = 3) {
    const width = heightmap.length;
    const height = heightmap[0].length;

    for (let iter = 0; iter < iterations; iter++) {
      for (let x = 1; x < width - 1; x++) {
        for (let z = 1; z < height - 1; z++) {
          const rainfall = this.rainNoise.noise2D(x * 0.1, z * 0.1);
          if (rainfall < 0.3) continue;

          const current = heightmap[x][z];

          let lowestNeighbor = { x, z, height: current };
          for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
              if (dx === 0 && dz === 0) continue;
              const nx = x + dx;
              const nz = z + dz;
              const nh = heightmap[nx][nz];
              if (nh < lowestNeighbor.height) {
                lowestNeighbor = { x: nx, z: nz, height: nh };
              }
            }
          }

          if (lowestNeighbor.height < current) {
            const diff = current - lowestNeighbor.height;
            const erosionAmount = Math.min(diff * 0.1, 0.5);

            heightmap[x][z] -= erosionAmount;
            heightmap[lowestNeighbor.x][lowestNeighbor.z] += erosionAmount * 0.5;
          }
        }
      }
    }

    return heightmap;
  }
}

// ═══════════════════════════════════════════════════════════
// PRD G-02: FastNoise Lite — OpenSimplex2, Cellular, Value Noise
// Backwards-compatible API with extended noise types
// ═══════════════════════════════════════════════════════════

export const FN_NOISE_TYPE = {
  SIMPLEX: 0,
  OPENSIMPLEX2: 1,
  CELLULAR: 2,
  VALUE: 3,
};

export const FN_CELLULAR_DIST = {
  EUCLIDEAN: 0,
  MANHATTAN: 1,
  HYBRID: 2,
};

export const FN_CELLULAR_RETURN = {
  F1: 0,
  F2: 1,
  F1_MINUS_F2: 2,
  F1_TIMES_F2: 3,
};

// OpenSimplex2 2D implementation (KdotJPG's algorithm)
// Uses permuted gradient table and stretched lattice
class _OpenSimplex2 {
  constructor(seed) {
    this.perm = new Uint8Array(256);
    this.permGrad2D = new Uint8Array(256);
    const prng = new PRNG(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(prng.next() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    const gradients2D = [
      5, 2, 2, 5, -5, 2, -2, 5, 5, -2, 2, -5, -5, -2, -2, -5,
    ];
    for (let i = 0; i < 256; i++) {
      this.perm[i] = p[i];
      this.permGrad2D[i] = gradients2D[p[i] & 7];
    }
  }

  noise2D(x, y) {
    const SQRT3 = 1.7320508075688772;
    const F2 = 0.5 * (SQRT3 - 1);
    const G2 = (3 - SQRT3) / 6;

    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);

    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;

    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    const ii = i & 255;
    const jj = j & 255;

    let n0 = 0, n1 = 0, n2 = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      const gi0 = this.permGrad2D[ii + this.perm[jj]];
      t0 *= t0;
      n0 = t0 * t0 * (gi0 * x0 + (gi0 >> 1) * y0);
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      const gi1 = this.permGrad2D[ii + i1 + this.perm[jj + j1]];
      t1 *= t1;
      n1 = t1 * t1 * (gi1 * x1 + (gi1 >> 1) * y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      const gi2 = this.permGrad2D[ii + 1 + this.perm[jj + 1]];
      t2 *= t2;
      n2 = t2 * t2 * (gi2 * x2 + (gi2 >> 1) * y2);
    }

    return (n0 + n1 + n2) * 99.83685;
  }
}

// Value Noise — cheap variation noise
class _ValueNoise {
  constructor(seed) {
    this.perm = new Uint8Array(512);
    const prng = new PRNG(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(prng.next() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  _val(ix, iz) {
    const h = this.perm[(ix & 255) + this.perm[iz & 255]];
    return (h / 255) * 2 - 1;
  }

  _smooth(t) { return t * t * (3 - 2 * t); }

  noise2D(x, y) {
    const ix = Math.floor(x);
    const iz = Math.floor(y);
    const fx = x - ix;
    const fz = y - iz;
    const sx = this._smooth(fx);
    const sz = this._smooth(fz);
    const v00 = this._val(ix, iz);
    const v10 = this._val(ix + 1, iz);
    const v01 = this._val(ix, iz + 1);
    const v11 = this._val(ix + 1, iz + 1);
    const a = v00 + sx * (v10 - v00);
    const b = v01 + sx * (v11 - v01);
    return a + sz * (b - a);
  }
}

// Cellular (Worley) Noise — F1, F2, F1-F2, F1*F2
class _CellularNoise {
  constructor(seed) {
    this._seed = seed;
    this._distFunc = FN_CELLULAR_DIST.EUCLIDEAN;
    this._returnType = FN_CELLULAR_RETURN.F1;
  }

  setDistanceFunction(d) { this._distFunc = d; }
  setReturnType(r) { this._returnType = r; }

  _hashFloat(ix, iz) {
    const h = ((ix * 374761393 + iz * 668265263) ^ this._seed) & 0x7FFFFFFF;
    return h / 0x7FFFFFFF;
  }

  _dist(dx, dz) {
    if (this._distFunc === FN_CELLULAR_DIST.MANHATTAN) {
      return Math.abs(dx) + Math.abs(dz);
    } else if (this._distFunc === FN_CELLULAR_DIST.HYBRID) {
      return Math.abs(dx) + Math.abs(dz) + Math.sqrt(dx * dx + dz * dz);
    }
    return Math.sqrt(dx * dx + dz * dz);
  }

  noise2D(x, y) {
    const ix = Math.floor(x);
    const iz = Math.floor(y);
    let f1 = Infinity, f2 = Infinity;

    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cx = ix + dx;
        const cz = iz + dz;
        const h1 = this._hashFloat(cx, cz);
        const h2 = this._hashFloat(cx + 999, cz + 999);
        const px = cx + h1;
        const pz = cz + h2;
        const d = this._dist(px - x, pz - y);
        if (d < f1) { f2 = f1; f1 = d; }
        else if (d < f2) { f2 = d; }
      }
    }

    switch (this._returnType) {
      case FN_CELLULAR_RETURN.F1: return f1;
      case FN_CELLULAR_RETURN.F2: return f2;
      case FN_CELLULAR_RETURN.F1_MINUS_F2: return f1 - f2;
      case FN_CELLULAR_RETURN.F1_TIMES_F2: return f1 * f2;
      default: return f1;
    }
  }
}

// FastNoiseLite — unified noise interface with swappable backends
export class FastNoiseLite {
  constructor(seed) {
    this._seed = seed;
    this._noiseType = FN_NOISE_TYPE.OPENSIMPLEX2;
    this._domainWarpAmp = 0;
    this._domainWarpNoise = null;

    this._simplex = new SimplexNoise(seed);
    this._openSimplex = new _OpenSimplex2(seed);
    this._value = new _ValueNoise(seed);
    this._cellular = new _CellularNoise(seed);
  }

  setNoiseType(type) { this._noiseType = type; }
  setCellularDistanceFunction(d) { this._cellular.setDistanceFunction(d); }
  setCellularReturnType(r) { this._cellular.setReturnType(r); }
  setDomainWarpAmp(amp) {
    this._domainWarpAmp = amp;
    if (amp > 0 && !this._domainWarpNoise) {
      this._domainWarpNoise = new FastNoiseLite(this._seed + 7777);
      this._domainWarpNoise._noiseType = FN_NOISE_TYPE.OPENSIMPLEX2;
    }
  }

  _warp(x, y) {
    if (this._domainWarpAmp <= 0 || !this._domainWarpNoise) return { x, y };
    const wx = this._domainWarpNoise._rawNoise2D(x * 0.01, y * 0.01) * this._domainWarpAmp;
    const wy = this._domainWarpNoise._rawNoise2D((x + 1000) * 0.01, (y + 1000) * 0.01) * this._domainWarpAmp;
    return { x: x + wx, y: y + wy };
  }

  _rawNoise2D(x, y) {
    switch (this._noiseType) {
      case FN_NOISE_TYPE.SIMPLEX: return this._simplex.noise2D(x, y);
      case FN_NOISE_TYPE.OPENSIMPLEX2: return this._openSimplex.noise2D(x, y);
      case FN_NOISE_TYPE.CELLULAR: return this._cellular.noise2D(x, y);
      case FN_NOISE_TYPE.VALUE: return this._value.noise2D(x, y);
      default: return this._openSimplex.noise2D(x, y);
    }
  }

  // Backwards-compatible API
  noise2D(x, y) {
    const w = this._warp(x, y);
    return this._rawNoise2D(w.x, w.y);
  }

  noise3D(x, y, z) {
    return this._simplex.noise3D(x, y, z);
  }

  fbm2D(x, y, octaves, persistence, lacunarity, scale) {
    const w = this._warp(x, y);
    let total = 0, amplitude = 1, frequency = scale, maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this._rawNoise2D(w.x * frequency, w.y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    return total / maxValue;
  }

  fbm3D(x, y, z, octaves, persistence, lacunarity, scale) {
    return this._simplex.fbm3D(x, y, z, octaves, persistence, lacunarity, scale);
  }

  // Cellular-specific access
  cellular2D(x, y) {
    return this._cellular.noise2D(x, y);
  }
}
