// ═══════════════════════════════════════════════════════════
// JardVoxel 9.0 — Scene Composition System
// SPEC-111: SceneComposer
// Adds compositional rules between zone generation and chunk generation
// ═══════════════════════════════════════════════════════════

import { SimplexNoise } from './jardvoxel-survival-noise.js';

// Local constants to avoid circular dependency with world-hierarchy.js
const CHUNK_SIZE = 32;
const ZONE_TYPES = {
  LAKE: 'lake',
  VALLEY: 'valley',
  WATERFALL: 'waterfall',
  DENSE_FOREST: 'dense_forest',
  CLEARING: 'clearing',
  HILLS: 'hills',
  CLIFFS: 'cliffs',
  WETLANDS: 'wetlands',
  RIVER_BEND: 'river_bend',
  GORGE: 'gorge',
  MEADOW: 'meadow',
  GROVE: 'grove',
  OCEANIC: 'oceanic',
  COASTAL: 'coastal',
  DEFAULT: 'default',
};

// Mood blending table
const MOOD_BLENDS = {
  'serene+grand': 'majestic serenity',
  'grand+serene': 'majestic serenity',
  'mysterious+cozy': 'hidden sanctuary',
  'cozy+mysterious': 'hidden sanctuary',
  'serene+cozy': 'warm haven',
  'cozy+serene': 'warm haven',
  'mysterious+grand': 'eerie monument',
  'grand+mysterious': 'eerie monument',
  'ancient+serene': 'timeless calm',
  'serene+ancient': 'timeless calm',
  'ancient+mysterious': 'forgotten realm',
  'mysterious+ancient': 'forgotten realm',
  'ancient+grand': 'solemn majesty',
  'grand+ancient': 'solemn majesty',
  'cozy+grand': 'sheltered vista',
  'grand+cozy': 'sheltered vista',
};

// Restoration factor lookup
const RESTORATION_FACTORS = {
  pristine: 1.0,
  fading: 0.7,
  dormant: 0.4,
  forgotten: 0.4,
};

// Mood visual effect table
const MOOD_EFFECTS = {
  serene: { fogDensity: -0.20, lightWarmth: 0.10, particleBias: ['pollen', 'mist'], musicTempo: 'slow' },
  mysterious: { fogDensity: 0.30, lightWarmth: -0.05, particleBias: ['spores', 'fog'], musicTempo: 'minor' },
  grand: { fogDensity: -0.10, lightWarmth: 0.05, particleBias: ['dust', 'leaves'], musicTempo: 'majestic' },
  cozy: { fogDensity: 0.10, lightWarmth: 0.15, particleBias: ['fireflies'], musicTempo: 'gentle' },
  ancient: { fogDensity: 0.20, lightWarmth: 0.0, particleBias: ['falling_leaves'], musicTempo: 'slow_chimes' },
};

export class SceneComposer {
  constructor(seed, archipelago) {
    this.seed = seed;
    this.archipelago = archipelago;
    this._sceneNoise = new SimplexNoise(seed + 66666);
    this._clearingNoise = new SimplexNoise(seed + 66667);
    this._shoreNoise = new SimplexNoise(seed + 66668);

    // LRU cache for SceneContext (max 4000 entries)
    this._cache = new Map();
    this._maxCacheSize = 4000;
  }

  // Get SceneContext for a chunk coordinate
  getSceneContext(cx, cz, region, zone, garden) {
    const key = (cx + 32768) * 65536 + (cz + 32768);
    if (this._cache.has(key)) return this._cache.get(key);

    const ox = cx * CHUNK_SIZE;
    const oz = cz * CHUNK_SIZE;
    const centerX = ox + CHUNK_SIZE / 2;
    const centerZ = oz + CHUNK_SIZE / 2;

    // If no garden (ocean or non-archipelago), return minimal context
    if (!garden) {
      const context = {
        focalPoint: null,
        framing: { leftDensity: 1.0, rightDensity: 1.0, frontDensity: 1.0 },
        sightLine: { dx: 0, dz: 0 },
        treeDensityMod: 1.0,
        flowerDensityMod: 1.0,
        colorMood: 'neutral',
        restorationFactor: 1.0,
        isOcean: true,
      };
      this._cacheSet(key, context);
      return context;
    }

    // Compute focal point — nearest landmark within 200 blocks
    const focalPoint = this._computeFocalPoint(centerX, centerZ, garden);

    // Compute framing based on focal point
    const framing = this._computeFraming(centerX, centerZ, focalPoint);

    // Compute sight line
    const sightLine = this._computeSightLine(centerX, centerZ, focalPoint, garden);

    // Compute clearing pattern
    const clearing = this._computeClearing(cx, cz, zone);

    // Compute color mood by blending garden mood with zone mood
    const zoneMood = zone ? (zone.moodTag || 'peaceful') : 'peaceful';
    const colorMood = this._blendMoods(garden.mood, zoneMood);

    // Compute restoration factor
    const restorationFactor = this._computeRestorationFactor(garden);

    // Compute density modifiers
    let treeDensityMod = 1.0;
    let flowerDensityMod = 1.0;

    // Rule 1: Focal Point Framing — increase density on sides, decrease in path
    if (focalPoint) {
      treeDensityMod *= framing.frontDensity;
    }

    // Rule 2: Clearing Composition — reduce density in clearings
    if (clearing) {
      treeDensityMod *= 0.3;
      flowerDensityMod *= 0.5;
    }

    // Rule 3: Shore Composition — varied density at shores
    const shoreDist = this._computeShoreDistance(centerX, centerZ, garden);
    if (shoreDist < 50) {
      treeDensityMod *= 0.4 + (shoreDist / 50) * 0.6;
      flowerDensityMod *= 0.6;
    }

    // Rule 5: Restoration Visibility — affects flora density
    const restFactor = restorationFactor;
    if (garden.restorationState === 'fading') {
      flowerDensityMod *= 0.7;
    } else if (garden.restorationState === 'dormant') {
      flowerDensityMod *= 0.2;
      treeDensityMod *= 0.3;
    } else if (garden.restorationState === 'forgotten') {
      flowerDensityMod *= 0.3;
      treeDensityMod *= 0.5;
    }

    // Clamp modifiers
    treeDensityMod = Math.max(0.1, Math.min(1.5, treeDensityMod));
    flowerDensityMod = Math.max(0.1, Math.min(1.5, flowerDensityMod));

    const context = {
      focalPoint,
      framing,
      sightLine,
      treeDensityMod,
      flowerDensityMod,
      colorMood,
      restorationFactor: restFactor,
      clearing: clearing,
      shoreDist,
      isOcean: false,
    };

    this._cacheSet(key, context);
    return context;
  }

  _cacheSet(key, context) {
    if (this._cache.size >= this._maxCacheSize) {
      const firstKey = this._cache.keys().next().value;
      this._cache.delete(firstKey);
    }
    this._cache.set(key, context);
  }

  // Rule 1: Focal Point — nearest landmark within 200 blocks
  _computeFocalPoint(x, z, garden) {
    // Use garden center as landmark position (signature landmark is at center)
    const dx = garden.centerX - x;
    const dz = garden.centerZ - z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 200 && dist > 5) {
      return {
        type: garden.signatureLandmark,
        direction: { dx: dx / dist, dz: dz / dist },
        distance: dist,
      };
    }
    return null;
  }

  // Rule 1: Framing — tree density on sides of sight line, clear path to landmark
  _computeFraming(x, z, focalPoint) {
    if (!focalPoint) {
      return { leftDensity: 1.0, rightDensity: 1.0, frontDensity: 1.0 };
    }

    const dir = focalPoint.direction;
    // Perpendicular vector for left/right
    const perpX = -dir.dz;
    const perpZ = dir.dx;

    // Use noise to vary density on sides
    const leftNoise = this._sceneNoise.noise2D(x * 0.01 + 1000, z * 0.01) * 0.3;
    const rightNoise = this._sceneNoise.noise2D(x * 0.01 + 2000, z * 0.01) * 0.3;

    return {
      leftDensity: 1.0 + leftNoise + 0.2, // Slightly denser on sides
      rightDensity: 1.0 + rightNoise + 0.2,
      frontDensity: 0.5, // Clearer in the direction of the landmark
    };
  }

  // Sight line — direction the scene "wants" you to look
  _computeSightLine(x, z, focalPoint, garden) {
    if (focalPoint) {
      return { dx: focalPoint.direction.dx, dz: focalPoint.direction.dz };
    }
    // Default: point toward garden center
    const dx = garden.centerX - x;
    const dz = garden.centerZ - z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 0) {
      return { dx: dx / dist, dz: dz / dist };
    }
    return { dx: 0, dz: 1 };
  }

  // Rule 2: Clearing Composition — periodic clearings in forest zones
  _computeClearing(cx, cz, zone) {
    if (!zone) return false;
    const forestTypes = [ZONE_TYPES.DENSE_FOREST, ZONE_TYPES.GROVE];
    if (!forestTypes.includes(zone.type)) return false;

    // Clearing every 4-6 chunks
    const clearingValue = this._clearingNoise.fbm2D(cx * 0.15, cz * 0.15, 1, 0.5, 2.0, 0.5);
    return clearingValue > 0.4;
  }

  // Rule 3: Shore distance from island edge
  _computeShoreDistance(x, z, garden) {
    const dx = x - garden.centerX;
    const dz = z - garden.centerZ;
    const distFromCenter = Math.sqrt(dx * dx + dz * dz);
    return Math.max(0, garden.radius - distFromCenter);
  }

  // Rule 4: Color Mood Blending
  _blendMoods(gardenMood, zoneMood) {
    const key = `${gardenMood}+${zoneMood}`;
    if (MOOD_BLENDS[key]) return MOOD_BLENDS[key];
    // Default: just use garden mood
    return gardenMood;
  }

  // Rule 5: Restoration factor
  _computeRestorationFactor(garden) {
    return RESTORATION_FACTORS[garden.restorationState] ?? 1.0;
  }

  // Get mood effects for a garden
  getMoodEffects(garden) {
    return MOOD_EFFECTS[garden.mood] || MOOD_EFFECTS.serene;
  }
}
