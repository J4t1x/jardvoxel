// ═══════════════════════════════════════════════════════════
// SPEC-075: Biome Identity System
// Each biome gets a fingerprint defining its visual identity:
// tree shape, vegetation density, rock type, climate, sounds,
// music mood, particles, and fauna.
// ═══════════════════════════════════════════════════════════

export const TREE_SHAPES = {
  OAK_ROUND: 'oak_round',
  PINE_CONICAL: 'pine_conical',
  MANGROVE_ROOTS: 'mangrove_roots',
  DEAD_TWISTED: 'dead_twisted',
  ACACIA_FLAT: 'acacia_flat',
  CHERRY_SPHERE: 'cherry_sphere',
  MYSTIC_MUSHROOM: 'mystic_mushroom',
  AUTUMN_OAK: 'autumn_oak',
  BAMBOO_STALKS: 'bamboo_stalks',
  NONE: 'none',
};

export const VEGETATION_DENSITY = {
  SPARSE: 'sparse',
  NORMAL: 'normal',
  DENSE: 'dense',
  VERY_DENSE: 'very_dense',
};

export const ROCK_TYPES = {
  BOULDERS: 'boulders',
  SCATTERED: 'scattered',
  CLIFFS: 'cliffs',
  NONE: 'none',
};

export const AMBIENT_SOUNDS = {
  BIRDS: 'birds',
  WIND: 'wind',
  INSECTS: 'insects',
  WATER: 'water',
  SILENCE: 'silence',
  CROWS: 'crows',
  MYSTIC_HUM: 'mystic_hum',
  LEAVES_RUSTLING: 'leaves_rustling',
};

export const MUSIC_MOODS = {
  CALM: 'calm',
  MYSTERIOUS: 'mysterious',
  WARM: 'warm',
  EERIE: 'eerie',
  EPIC: 'epic',
  MELANCHOLIC: 'melancholic',
  MAGICAL: 'magical',
};

export const BIOME_PARTICLES = {
  POLLEN: 'pollen',
  SNOWFLAKES: 'snowflakes',
  LEAVES: 'leaves',
  MIST: 'mist',
  DUST: 'dust',
  FIREFLIES: 'fireflies',
  SPORES: 'spores',
  FALLING_LEAVES: 'falling_leaves',
  PETALS: 'petals',
  NONE: 'none',
};

export const BIOME_FINGERPRINTS = {
  ocean: {
    treeShape: TREE_SHAPES.NONE,
    vegetationDensity: VEGETATION_DENSITY.SPARSE,
    rockType: ROCK_TYPES.NONE,
    temperature: 0.3,
    humidity: 0.9,
    ambientSound: AMBIENT_SOUNDS.WATER,
    musicMood: MUSIC_MOODS.CALM,
    particles: BIOME_PARTICLES.NONE,
    fauna: { passive: ['fish'], hostile: ['drowned'] },
  },
  deep_ocean: {
    treeShape: TREE_SHAPES.NONE,
    vegetationDensity: VEGETATION_DENSITY.SPARSE,
    rockType: ROCK_TYPES.NONE,
    temperature: 0.2,
    humidity: 0.95,
    ambientSound: AMBIENT_SOUNDS.WATER,
    musicMood: MUSIC_MOODS.MYSTERIOUS,
    particles: BIOME_PARTICLES.NONE,
    fauna: { passive: ['fish'], hostile: ['drowned', 'guardian'] },
  },
  beach: {
    treeShape: TREE_SHAPES.NONE,
    vegetationDensity: VEGETATION_DENSITY.SPARSE,
    rockType: ROCK_TYPES.SCATTERED,
    temperature: 0.6,
    humidity: 0.5,
    ambientSound: AMBIENT_SOUNDS.WATER,
    musicMood: MUSIC_MOODS.CALM,
    particles: BIOME_PARTICLES.NONE,
    fauna: { passive: [], hostile: [] },
  },
  plains: {
    treeShape: TREE_SHAPES.OAK_ROUND,
    vegetationDensity: VEGETATION_DENSITY.SPARSE,
    rockType: ROCK_TYPES.NONE,
    temperature: 0.6,
    humidity: 0.4,
    ambientSound: AMBIENT_SOUNDS.BIRDS,
    musicMood: MUSIC_MOODS.CALM,
    particles: BIOME_PARTICLES.POLLEN,
    fauna: { passive: ['cow', 'sheep', 'pig', 'chicken'], hostile: ['zombie', 'skeleton'] },
  },
  forest: {
    treeShape: TREE_SHAPES.OAK_ROUND,
    vegetationDensity: VEGETATION_DENSITY.DENSE,
    rockType: ROCK_TYPES.SCATTERED,
    temperature: 0.5,
    humidity: 0.7,
    ambientSound: AMBIENT_SOUNDS.BIRDS,
    musicMood: MUSIC_MOODS.WARM,
    particles: BIOME_PARTICLES.FIREFLIES,
    fauna: { passive: ['cow', 'sheep', 'pig', 'chicken'], hostile: ['zombie', 'skeleton', 'spider'] },
  },
  jungle: {
    treeShape: TREE_SHAPES.MANGROVE_ROOTS,
    vegetationDensity: VEGETATION_DENSITY.VERY_DENSE,
    rockType: ROCK_TYPES.SCATTERED,
    temperature: 0.9,
    humidity: 0.9,
    ambientSound: AMBIENT_SOUNDS.INSECTS,
    musicMood: MUSIC_MOODS.WARM,
    particles: BIOME_PARTICLES.LEAVES,
    fauna: { passive: ['parrot', 'ocelot'], hostile: ['zombie', 'skeleton', 'creeper'] },
  },
  desert: {
    treeShape: TREE_SHAPES.DEAD_TWISTED,
    vegetationDensity: VEGETATION_DENSITY.SPARSE,
    rockType: ROCK_TYPES.SCATTERED,
    temperature: 1.0,
    humidity: 0.1,
    ambientSound: AMBIENT_SOUNDS.WIND,
    musicMood: MUSIC_MOODS.EERIE,
    particles: BIOME_PARTICLES.DUST,
    fauna: { passive: [], hostile: ['zombie', 'skeleton', 'husk'] },
  },
  savanna: {
    treeShape: TREE_SHAPES.ACACIA_FLAT,
    vegetationDensity: VEGETATION_DENSITY.SPARSE,
    rockType: ROCK_TYPES.BOULDERS,
    temperature: 0.85,
    humidity: 0.2,
    ambientSound: AMBIENT_SOUNDS.INSECTS,
    musicMood: MUSIC_MOODS.WARM,
    particles: BIOME_PARTICLES.DUST,
    fauna: { passive: ['cow', 'sheep'], hostile: ['zombie', 'skeleton'] },
  },
  taiga: {
    treeShape: TREE_SHAPES.PINE_CONICAL,
    vegetationDensity: VEGETATION_DENSITY.NORMAL,
    rockType: ROCK_TYPES.SCATTERED,
    temperature: 0.3,
    humidity: 0.6,
    ambientSound: AMBIENT_SOUNDS.WIND,
    musicMood: MUSIC_MOODS.CALM,
    particles: BIOME_PARTICLES.SNOWFLAKES,
    fauna: { passive: ['wolf', 'fox'], hostile: ['zombie', 'skeleton', 'stray'] },
  },
  snowy_plains: {
    treeShape: TREE_SHAPES.PINE_CONICAL,
    vegetationDensity: VEGETATION_DENSITY.SPARSE,
    rockType: ROCK_TYPES.NONE,
    temperature: 0.1,
    humidity: 0.5,
    ambientSound: AMBIENT_SOUNDS.WIND,
    musicMood: MUSIC_MOODS.EERIE,
    particles: BIOME_PARTICLES.SNOWFLAKES,
    fauna: { passive: ['fox', 'rabbit'], hostile: ['zombie', 'skeleton', 'stray'] },
  },
  mountains: {
    treeShape: TREE_SHAPES.PINE_CONICAL,
    vegetationDensity: VEGETATION_DENSITY.SPARSE,
    rockType: ROCK_TYPES.CLIFFS,
    temperature: 0.4,
    humidity: 0.5,
    ambientSound: AMBIENT_SOUNDS.WIND,
    musicMood: MUSIC_MOODS.EPIC,
    particles: BIOME_PARTICLES.NONE,
    fauna: { passive: ['goat'], hostile: ['zombie', 'skeleton'] },
  },
  snowy_peaks: {
    treeShape: TREE_SHAPES.NONE,
    vegetationDensity: VEGETATION_DENSITY.SPARSE,
    rockType: ROCK_TYPES.CLIFFS,
    temperature: 0.0,
    humidity: 0.4,
    ambientSound: AMBIENT_SOUNDS.WIND,
    musicMood: MUSIC_MOODS.EPIC,
    particles: BIOME_PARTICLES.SNOWFLAKES,
    fauna: { passive: ['goat'], hostile: ['skeleton', 'stray'] },
  },
  stony_peaks: {
    treeShape: TREE_SHAPES.NONE,
    vegetationDensity: VEGETATION_DENSITY.SPARSE,
    rockType: ROCK_TYPES.CLIFFS,
    temperature: 0.5,
    humidity: 0.3,
    ambientSound: AMBIENT_SOUNDS.WIND,
    musicMood: MUSIC_MOODS.EPIC,
    particles: BIOME_PARTICLES.DUST,
    fauna: { passive: ['goat'], hostile: ['skeleton'] },
  },
  meadow: {
    treeShape: TREE_SHAPES.OAK_ROUND,
    vegetationDensity: VEGETATION_DENSITY.NORMAL,
    rockType: ROCK_TYPES.NONE,
    temperature: 0.5,
    humidity: 0.6,
    ambientSound: AMBIENT_SOUNDS.BIRDS,
    musicMood: MUSIC_MOODS.CALM,
    particles: BIOME_PARTICLES.POLLEN,
    fauna: { passive: ['cow', 'sheep', 'horse'], hostile: ['zombie', 'skeleton'] },
  },
  cherry_grove: {
    treeShape: TREE_SHAPES.CHERRY_SPHERE,
    vegetationDensity: VEGETATION_DENSITY.NORMAL,
    rockType: ROCK_TYPES.NONE,
    temperature: 0.55,
    humidity: 0.65,
    ambientSound: AMBIENT_SOUNDS.BIRDS,
    musicMood: MUSIC_MOODS.WARM,
    particles: BIOME_PARTICLES.PETALS,
    fauna: { passive: ['bee', 'rabbit'], hostile: ['zombie', 'skeleton'] },
  },
  swamp: {
    treeShape: TREE_SHAPES.OAK_ROUND,
    vegetationDensity: VEGETATION_DENSITY.DENSE,
    rockType: ROCK_TYPES.SCATTERED,
    temperature: 0.5,
    humidity: 0.9,
    ambientSound: AMBIENT_SOUNDS.INSECTS,
    musicMood: MUSIC_MOODS.EERIE,
    particles: BIOME_PARTICLES.FIREFLIES,
    fauna: { passive: ['frog'], hostile: ['zombie', 'skeleton', 'witch', 'slime'] },
  },
  river: {
    treeShape: TREE_SHAPES.OAK_ROUND,
    vegetationDensity: VEGETATION_DENSITY.SPARSE,
    rockType: ROCK_TYPES.SCATTERED,
    temperature: 0.5,
    humidity: 0.8,
    ambientSound: AMBIENT_SOUNDS.WATER,
    musicMood: MUSIC_MOODS.CALM,
    particles: BIOME_PARTICLES.NONE,
    fauna: { passive: ['fish'], hostile: ['zombie', 'skeleton'] },
  },
  mystic_grove: {
    treeShape: TREE_SHAPES.MYSTIC_MUSHROOM,
    vegetationDensity: VEGETATION_DENSITY.DENSE,
    rockType: ROCK_TYPES.SCATTERED,
    temperature: 0.5,
    humidity: 0.7,
    ambientSound: AMBIENT_SOUNDS.MYSTIC_HUM,
    musicMood: MUSIC_MOODS.MAGICAL,
    particles: BIOME_PARTICLES.SPORES,
    fauna: { passive: ['axolotl', 'allay'], hostile: ['zombie', 'skeleton'] },
  },
  autumn_forest: {
    treeShape: TREE_SHAPES.AUTUMN_OAK,
    vegetationDensity: VEGETATION_DENSITY.DENSE,
    rockType: ROCK_TYPES.SCATTERED,
    temperature: 0.45,
    humidity: 0.55,
    ambientSound: AMBIENT_SOUNDS.LEAVES_RUSTLING,
    musicMood: MUSIC_MOODS.MELANCHOLIC,
    particles: BIOME_PARTICLES.FALLING_LEAVES,
    fauna: { passive: ['fox', 'rabbit', 'deer'], hostile: ['zombie', 'skeleton', 'spider'] },
  },
  // SPEC-099: Wellness biomes
  zen_garden: {
    treeShape: TREE_SHAPES.NONE,
    vegetationDensity: VEGETATION_DENSITY.SPARSE,
    rockType: ROCK_TYPES.SCATTERED,
    temperature: 0.5,
    humidity: 0.55,
    ambientSound: AMBIENT_SOUNDS.WIND,
    musicMood: MUSIC_MOODS.CALM,
    particles: BIOME_PARTICLES.MIST,
    fauna: { passive: ['rabbit'], hostile: [] },
  },
  bamboo_grove: {
    treeShape: TREE_SHAPES.BAMBOO_STALKS,
    vegetationDensity: VEGETATION_DENSITY.VERY_DENSE,
    rockType: ROCK_TYPES.NONE,
    temperature: 0.7,
    humidity: 0.75,
    ambientSound: AMBIENT_SOUNDS.LEAVES_RUSTLING,
    musicMood: MUSIC_MOODS.CALM,
    particles: BIOME_PARTICLES.LEAVES,
    fauna: { passive: ['panda', 'rabbit'], hostile: [] },
  },
  aurora_tundra: {
    treeShape: TREE_SHAPES.PINE_CONICAL,
    vegetationDensity: VEGETATION_DENSITY.SPARSE,
    rockType: ROCK_TYPES.SCATTERED,
    temperature: 0.1,
    humidity: 0.45,
    ambientSound: AMBIENT_SOUNDS.WIND,
    musicMood: MUSIC_MOODS.MAGICAL,
    particles: BIOME_PARTICLES.BIOLUMINESCENCE,
    fauna: { passive: ['fox', 'rabbit'], hostile: [] },
  },
};

export class BiomeIdentityManager {
  constructor() {
    this._transitionCache = new Map();
  }

  getFingerprint(biome) {
    return BIOME_FINGERPRINTS[biome] || BIOME_FINGERPRINTS.plains;
  }

  getTransitionFingerprint(biomeA, biomeB, blendFactor = 0.5) {
    const fpA = this.getFingerprint(biomeA);
    const fpB = this.getFingerprint(biomeB);
    const t = Math.max(0, Math.min(1, blendFactor));

    return {
      treeShape: t < 0.5 ? fpA.treeShape : fpB.treeShape,
      vegetationDensity: t < 0.5 ? fpA.vegetationDensity : fpB.vegetationDensity,
      rockType: t < 0.5 ? fpA.rockType : fpB.rockType,
      temperature: fpA.temperature * (1 - t) + fpB.temperature * t,
      humidity: fpA.humidity * (1 - t) + fpB.humidity * t,
      ambientSound: t < 0.5 ? fpA.ambientSound : fpB.ambientSound,
      musicMood: t < 0.5 ? fpA.musicMood : fpB.musicMood,
      particles: t < 0.5 ? fpA.particles : fpB.particles,
      fauna: t < 0.5 ? fpA.fauna : fpB.fauna,
      transitionFrom: biomeA,
      transitionTo: biomeB,
      blendFactor: t,
    };
  }

  getBiomeTransition(world, x, z, radius = 8) {
    const centerBiome = world.getBiome(x, z);
    const neighbors = [
      world.getBiome(x + radius, z),
      world.getBiome(x - radius, z),
      world.getBiome(x, z + radius),
      world.getBiome(x, z - radius),
    ];

    for (const neighbor of neighbors) {
      if (neighbor !== centerBiome) {
        const distToBorder = radius;
        const blendFactor = 0.5;
        return this.getTransitionFingerprint(centerBiome, neighbor, blendFactor);
      }
    }
    return this.getFingerprint(centerBiome);
  }

  getTreeShape(biome) {
    return this.getFingerprint(biome).treeShape;
  }

  getVegetationDensity(biome) {
    return this.getFingerprint(biome).vegetationDensity;
  }

  getTreeChance(biome) {
    const fp = this.getFingerprint(biome);
    switch (fp.vegetationDensity) {
      case VEGETATION_DENSITY.VERY_DENSE: return 0.12;
      case VEGETATION_DENSITY.DENSE: return 0.08;
      case VEGETATION_DENSITY.NORMAL: return 0.05;
      case VEGETATION_DENSITY.SPARSE: return 0.02;
      default: return 0.02;
    }
  }

  getParticleType(biome) {
    return this.getFingerprint(biome).particles;
  }

  getMusicMood(biome) {
    return this.getFingerprint(biome).musicMood;
  }

  getAmbientSound(biome) {
    return this.getFingerprint(biome).ambientSound;
  }

  getAllBiomes() {
    return Object.keys(BIOME_FINGERPRINTS);
  }

  hasFingerprint(biome) {
    return biome in BIOME_FINGERPRINTS;
  }
}

export const biomeIdentityManager = new BiomeIdentityManager();
