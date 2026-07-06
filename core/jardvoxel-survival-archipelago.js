// ═══════════════════════════════════════════════════════════
// JardVoxel 9.0 — Archipelago World Generation
// SPEC-110: Archipelago World Architecture
// Hierarchy: UniverseIdentity → ArchipelagoGenerator → GardenIdentity
// Reinterprets continents as islands (Gardens) separated by meaningful ocean
// ═══════════════════════════════════════════════════════════

import { SimplexNoise, DomainWarper } from './jardvoxel-survival-noise.js';

// Local BIOMES copy to avoid circular dependency with world-hierarchy.js
const BIOMES = {
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
  ZEN_GARDEN: 'zen_garden',
  BAMBOO_GROVE: 'bamboo_grove',
  AURORA_TUNDRA: 'aurora_tundra',
};

const CHUNK_SIZE = 32;

// ═══════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════

const OCEAN_CHARACTERS = ['calm', 'mystical', 'tempestuous', 'frozen'];
const WORLD_MOODS = ['serene', 'mysterious', 'melancholic', 'vibrant'];
const GARDEN_MOODS = ['serene', 'mysterious', 'grand', 'cozy', 'ancient'];
const RESTORATION_STATES = ['pristine', 'fading', 'dormant', 'forgotten'];

const GARDEN_NAME_PREFIXES = [
  'Ael', 'Bel', 'Cor', 'Dre', 'Eld', 'Fae', 'Gla', 'Hir', 'Ith', 'Jor',
  'Kael', 'Lum', 'Myr', 'Nyx', 'Ory', 'Pyr', 'Quel', 'Ryn', 'Syl', 'Tho',
  'Ul', 'Val', 'Wyn', 'Xan', 'Yth', 'Zor',
];
const GARDEN_NAME_SUFFIXES = [
  'aria', 'enna', 'isil', 'ondar', 'uwen', 'alin', 'eros', 'imar',
  'uval', 'eria', 'oth', 'ynne', 'assil', 'orn', 'alea', 'irien',
];

const DISCOVERY_QUOTES = [
  'Una isla olvidada por el tiempo, esperando ser recordada.',
  'Las olas susurran un nombre que el viento nunca llevó.',
  'Aquí, la naturaleza duerme y sueña con despertar.',
  'Piedras antiguas guardan secretos bajo la hierba.',
  'El silencio de este lugar tiene voz propia.',
  'Un jardín donde el tiempo se detuvo entre las flores.',
  'La niebla revela lo que el corazón ya sabía.',
  'Cada árbol aquí recuerda lo que hemos olvidado.',
  'El océano trajo hasta aquí tus pasos curiosos.',
  'Un rincón del mundo donde la belleza aún respira.',
];

const SIGNATURE_LANDMARKS = {
  forest: 'world_tree',
  mountain: 'sky_pillar',
  coastal: 'stone_archway',
  mystical: 'floating_ruins',
  tundra: 'aurora_monolith',
  desert: 'sun_temple',
  bamboo: 'wind_sanctuary',
};

const GARDEN_CLIMATE_TYPES = ['tropical', 'temperate', 'cold', 'arid', 'mystical'];

const BIOME_BIAS_TABLE = {
  tropical: {
    common: [BIOMES.JUNGLE, BIOMES.BAMBOO_GROVE, BIOMES.BEACH],
    rare: [BIOMES.SNOWY_PLAINS],
    signature: BIOMES.MYSTIC_GROVE,
  },
  temperate: {
    common: [BIOMES.FOREST, BIOMES.PLAINS, BIOMES.MEADOW],
    rare: [BIOMES.DESERT],
    signature: BIOMES.CHERRY_GROVE,
  },
  cold: {
    common: [BIOMES.TAIGA, BIOMES.SNOWY_PLAINS, BIOMES.AURORA_TUNDRA],
    rare: [BIOMES.JUNGLE],
    signature: BIOMES.ZEN_GARDEN,
  },
  arid: {
    common: [BIOMES.DESERT, BIOMES.SAVANNA, BIOMES.STONY_PEAKS],
    rare: [BIOMES.FOREST],
    signature: 'oasis',
  },
  mystical: {
    common: [BIOMES.MYSTIC_GROVE, BIOMES.FOREST, BIOMES.SWAMP],
    rare: [BIOMES.DESERT],
    signature: BIOMES.AUTUMN_FOREST,
  },
};

// ═══════════════════════════════════════════════════════════
// Local PRNG (same algorithm as WorldPRNG)
// ═══════════════════════════════════════════════════════════

class ArchipelagoPRNG {
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
// UniverseIdentity — Level 0
// Extends WorldIdentity with archipelago parameters
// ═══════════════════════════════════════════════════════════

export class UniverseIdentity {
  constructor(seed, options = {}) {
    this.seed = seed;
    const prng = new ArchipelagoPRNG(seed + 77777);

    this.islandCount = options.islandCount ?? (8 + Math.floor(prng.next() * 8));
    this.oceanCharacter = options.oceanCharacter ?? OCEAN_CHARACTERS[Math.floor(prng.next() * OCEAN_CHARACTERS.length)];
    this.worldMood = options.worldMood ?? WORLD_MOODS[Math.floor(prng.next() * WORLD_MOODS.length)];
    this.islandSpacing = options.islandSpacing ?? (800 + Math.floor(prng.next() * 400));
    this.oceanDepth = options.oceanDepth ?? (40 + Math.floor(prng.next() * 20));
    this.archipelagoName = options.archipelagoName ?? this._generateName(prng);

    this._isArchipelago = true;
  }

  _generateName(prng) {
    const prefix = GARDEN_NAME_PREFIXES[Math.floor(prng.next() * GARDEN_NAME_PREFIXES.length)];
    const suffix = GARDEN_NAME_SUFFIXES[Math.floor(prng.next() * GARDEN_NAME_SUFFIXES.length)];
    return prefix + suffix;
  }

  getInfo() {
    return {
      archipelagoName: this.archipelagoName,
      islandCount: this.islandCount,
      oceanCharacter: this.oceanCharacter,
      worldMood: this.worldMood,
      islandSpacing: this.islandSpacing,
      oceanDepth: this.oceanDepth,
    };
  }
}

// ═══════════════════════════════════════════════════════════
// GardenIdentity — Level 2 (ContinentGenerator evolved)
// Each island is a Garden with unique identity
// ═══════════════════════════════════════════════════════════

export class GardenIdentity {
  constructor(seed, islandIndex, centerX, centerZ, radius) {
    this.gardenId = `garden_${islandIndex}`;
    this.islandIndex = islandIndex;
    this.centerX = centerX;
    this.centerZ = centerZ;
    this.radius = radius;

    const prng = new ArchipelagoPRNG(seed + 50000 + islandIndex * 977);

    this.name = this._generateName(prng);
    this.mood = GARDEN_MOODS[Math.floor(prng.next() * GARDEN_MOODS.length)];
    this.restorationState = RESTORATION_STATES[Math.floor(prng.next() * RESTORATION_STATES.length)];
    this.climateType = GARDEN_CLIMATE_TYPES[Math.floor(prng.next() * GARDEN_CLIMATE_TYPES.length)];
    this.discoveryQuote = DISCOVERY_QUOTES[Math.floor(prng.next() * DISCOVERY_QUOTES.length)];

    // Biome bias based on climate type
    const biasTable = BIOME_BIAS_TABLE[this.climateType] || BIOME_BIAS_TABLE.temperate;
    this.biomeBias = {
      common: biasTable.common,
      rare: biasTable.rare,
      signature: biasTable.signature,
    };

    // Signature landmark based on climate type
    const landmarkKeys = Object.keys(SIGNATURE_LANDMARKS);
    this.signatureLandmark = SIGNATURE_LANDMARKS[this.climateType] || SIGNATURE_LANDMARKS[landmarkKeys[Math.floor(prng.next() * landmarkKeys.length)]];

    // Music theme bias
    this.musicTheme = this._pickMusicTheme(prng);

    // History — 2-3 events
    this.history = this._generateHistory(prng);

    // Endemic species
    this.endemicSpecies = this._generateEndemicSpecies(prng);

    // Signature flora
    this.signatureFlower = this._pickSignatureFlower(prng);
    this.signatureTree = this._pickSignatureTree(prng);

    // Dominant climate (compatible with ContinentGenerator properties)
    this.dominantClimate = (prng.next() - 0.5) * 0.6;
    this.averageAltitude = 0.7 + prng.next() * 0.6;
    this.humidityLevel = (prng.next() - 0.5) * 0.5;
    this.dominantVegetation = this._pickDominantVegetation(prng);
    this.dominantFauna = this._pickFauna(prng);
    this.ancientCulture = this._pickCulture(prng);
    this.characteristicResources = this._pickResources(prng);
    this.regionSeed = seed + 30000 + islandIndex * 311;
  }

  _generateName(prng) {
    const prefix = GARDEN_NAME_PREFIXES[Math.floor(prng.next() * GARDEN_NAME_PREFIXES.length)];
    const suffix = GARDEN_NAME_SUFFIXES[Math.floor(prng.next() * GARDEN_NAME_SUFFIXES.length)];
    return prefix + suffix;
  }

  _pickMusicTheme(prng) {
    const themes = ['serene', 'mysterious', 'grand', 'cozy', 'ancient'];
    return themes[Math.floor(prng.next() * themes.length)];
  }

  _generateHistory(prng) {
    const eventTypes = [
      { name: 'Great Bloom', desc: 'A period of unprecedented floral growth', era: 'Ancient' },
      { name: 'Silent Winter', desc: 'A century of cold that shaped the landscape', era: 'Middle' },
      { name: 'Tidal Gift', desc: 'The ocean deposited rare stones upon the shore', era: 'Recent' },
      { name: 'Forest Awakening', desc: 'Dormant seeds sprouted after millennia', era: 'Ancient' },
      { name: 'Stone Singing', desc: 'The rocks resonated with harmonic frequencies', era: 'Middle' },
      { name: 'Wind Sculpting', desc: 'Centuries of wind carved the landmarks', era: 'Ancient' },
      { name: 'First Light', desc: 'A celestial event that illuminated the garden', era: 'Recent' },
    ];
    const count = 2 + Math.floor(prng.next() * 2);
    const used = new Set();
    const events = [];
    for (let i = 0; i < count; i++) {
      let idx;
      do { idx = Math.floor(prng.next() * eventTypes.length); } while (used.has(idx));
      used.add(idx);
      events.push({ ...eventTypes[idx] });
    }
    return events;
  }

  _generateEndemicSpecies(prng) {
    const trees = ['crystal_birch', 'amber_oak', 'silver_spruce', 'moon_jungle', 'iron_bamboo'];
    const flowers = ['star_bloom', 'twilight_lily', 'echo_bell', 'dawn_lotus', 'mist_rose'];
    const fauna = ['island_fox', 'glasswing_butterfly', 'tide_hare', 'stone_sparrow', 'lantern_moth'];
    return {
      tree: trees[Math.floor(prng.next() * trees.length)],
      flower: flowers[Math.floor(prng.next() * flowers.length)],
      fauna: fauna[Math.floor(prng.next() * fauna.length)],
    };
  }

  _pickSignatureFlower(prng) {
    const flowers = ['FLOWER_RED', 'FLOWER_YELLOW', 'FLOWER_BLUE', 'FLOWER_PINK', 'FLOWER_PURPLE', 'FLOWER_ORANGE', 'FLOWER_WHITE'];
    return flowers[Math.floor(prng.next() * flowers.length)];
  }

  _pickSignatureTree(prng) {
    const trees = ['OAK_LEAVES', 'BIRCH_LEAVES', 'SPRUCE_LEAVES', 'JUNGLE_LEAVES', 'BAMBOO'];
    return trees[Math.floor(prng.next() * trees.length)];
  }

  _pickDominantVegetation(prng) {
    const vegRoll = prng.next();
    const climate = this.dominantClimate;
    const humid = this.humidityLevel;
    if (climate < -0.15) return BIOMES.TAIGA;
    if (climate > 0.2 && humid < 0) return BIOMES.DESERT;
    if (climate > 0.2 && humid > 0.2) return BIOMES.JUNGLE;
    if (humid > 0.15) return BIOMES.FOREST;
    if (vegRoll < 0.4) return BIOMES.PLAINS;
    return BIOMES.MEADOW;
  }

  _pickFauna(prng) {
    const types = ['forest_animals', 'coastal_birds', 'jungle_wildlife', 'plains_herds', 'mystic_creatures', 'tundra_beasts'];
    return types[Math.floor(prng.next() * types.length)];
  }

  _pickCulture(prng) {
    const types = ['ancient_norse', 'forest_folk', 'coastal_merchants', 'jungle_tribes', 'mystics', 'plains_riders'];
    return types[Math.floor(prng.next() * types.length)];
  }

  _pickResources(prng) {
    const all = ['iron', 'gold', 'diamond', 'coal', 'copper', 'emerald', 'lapis', 'redstone'];
    const count = 2 + Math.floor(prng.next() * 3);
    const picked = [];
    const available = [...all];
    for (let i = 0; i < count && available.length > 0; i++) {
      const idx = Math.floor(prng.next() * available.length);
      picked.push(available.splice(idx, 1)[0]);
    }
    return picked;
  }

  // Get continent-compatible properties for existing hierarchy
  getContinentProperties(x, z) {
    const dx = x - this.centerX;
    const dz = z - this.centerZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const blendFactor = Math.max(0, 1 - dist / this.radius);

    if (blendFactor <= 0) {
      return {
        id: -1,
        dominantClimate: 0,
        averageAltitude: 0.5,
        humidityLevel: 0,
        dominantVegetation: BIOMES.OCEAN,
        dominantFauna: 'none',
        ancientCulture: 'none',
        characteristicResources: [],
        isOcean: true,
      };
    }

    return {
      id: this.islandIndex,
      dominantClimate: this.dominantClimate * blendFactor,
      averageAltitude: 0.5 + (this.averageAltitude - 0.5) * blendFactor,
      humidityLevel: this.humidityLevel * blendFactor,
      dominantVegetation: blendFactor > 0.5 ? this.dominantVegetation : BIOMES.BEACH,
      dominantFauna: this.dominantFauna,
      ancientCulture: this.ancientCulture,
      characteristicResources: this.characteristicResources,
      isOcean: false,
      blendFactor,
      garden: this,
    };
  }
}

// ═══════════════════════════════════════════════════════════
// ArchipelagoGenerator — Level 1
// Distributes islands using Poisson disk sampling at macro scale
// ═══════════════════════════════════════════════════════════

export class ArchipelagoGenerator {
  constructor(seed, universeIdentity) {
    this.seed = seed;
    this.universe = universeIdentity;
    this.islands = [];
    this._oceanNoise = new SimplexNoise(seed + 88888);
    this._currentNoise = new SimplexNoise(seed + 99999);

    this._generateIslands();
    this._computeTravelRoutes();
  }

  _generateIslands() {
    const prng = new ArchipelagoPRNG(this.seed + 33333);
    const count = this.universe.islandCount;
    const minSpacing = this.universe.islandSpacing;
    const maxRadius = 600;
    const minRadius = 200;

    // Poisson disk sampling at macro scale
    const candidates = [];
    const maxAttempts = 30;
    const worldRange = Math.sqrt(count) * minSpacing * 1.5;

    // Start with first island near origin
    const firstX = (prng.next() - 0.5) * minSpacing;
    const firstZ = (prng.next() - 0.5) * minSpacing;
    const firstRadius = minRadius + Math.floor(prng.next() * (maxRadius - minRadius));
    this.islands.push(this._createGarden(0, firstX, firstZ, firstRadius, prng));

    // Generate remaining islands with Poisson spacing
    for (let i = 1; i < count; i++) {
      let placed = false;
      for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
        const angle = prng.next() * Math.PI * 2;
        const dist = minSpacing + prng.next() * minSpacing * 0.5;
        const refIsland = this.islands[Math.floor(prng.next() * this.islands.length)];
        const x = refIsland.centerX + Math.cos(angle) * dist;
        const z = refIsland.centerZ + Math.sin(angle) * dist;
        const radius = minRadius + Math.floor(prng.next() * (maxRadius - minRadius));

        // Check spacing against all existing islands
        let valid = true;
        for (const existing of this.islands) {
          const dx = x - existing.centerX;
          const dz = z - existing.centerZ;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d < minSpacing) {
            valid = false;
            break;
          }
        }

        if (valid) {
          this.islands.push(this._createGarden(i, x, z, radius, prng));
          placed = true;
        }
      }

      // Fallback: place at random position if Poisson failed
      if (!placed) {
        const angle = prng.next() * Math.PI * 2;
        const dist = minSpacing * (i + 1) * 0.8;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const radius = minRadius + Math.floor(prng.next() * (maxRadius - minRadius));
        this.islands.push(this._createGarden(i, x, z, radius, prng));
      }
    }
  }

  _createGarden(index, x, z, radius, prng) {
    const garden = new GardenIdentity(this.seed, index, x, z, radius);
    return garden;
  }

  _computeTravelRoutes() {
    // Pre-compute optimal travel routes between islands (nearest neighbor graph)
    this._travelRoutes = [];
    for (let i = 0; i < this.islands.length; i++) {
      const routes = [];
      for (let j = 0; j < this.islands.length; j++) {
        if (i === j) continue;
        const dx = this.islands[i].centerX - this.islands[j].centerX;
        const dz = this.islands[i].centerZ - this.islands[j].centerZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        routes.push({ target: j, distance: dist });
      }
      routes.sort((a, b) => a.distance - b.distance);
      this._travelRoutes.push(routes.slice(0, 3));
    }
  }

  // Returns island at position or null (ocean)
  getIslandAt(x, z) {
    for (const island of this.islands) {
      const dx = x - island.centerX;
      const dz = z - island.centerZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < island.radius) {
        return island;
      }
    }
    return null;
  }

  // Returns nearest island for navigation
  getNearestIsland(x, z) {
    let nearest = null;
    let minDist = Infinity;
    for (const island of this.islands) {
      const dx = x - island.centerX;
      const dz = z - island.centerZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < minDist) {
        minDist = dist;
        nearest = island;
      }
    }
    return { island: nearest, distance: minDist };
  }

  // Returns ocean properties at position
  getOceanProperties(x, z) {
    const { island: nearest, distance: nearestDist } = this.getNearestIsland(x, z);
    const island = this.getIslandAt(x, z);

    if (island) {
      return {
        character: this.universe.oceanCharacter,
        depth: 0,
        currentDirection: { dx: 0, dz: 0 },
        currentStrength: 0,
        nearestIsland: nearest,
        distToNearest: 0,
        shoreProximity: 1,
      };
    }

    // Compute shore proximity (0 = far from any island, 1 = at island shore)
    const nearestRadius = nearest ? nearest.radius : 300;
    const shoreProximity = Math.max(0, 1 - (nearestDist - nearestRadius) / 200);

    // Ocean currents flow between islands
    const currentAngle = this._currentNoise.fbm2D(x * 0.001, z * 0.001, 2, 0.5, 2.0, 0.0008) * Math.PI * 2;
    const currentStrength = 0.3 + this._oceanNoise.noise2D(x * 0.002, z * 0.002) * 0.2;

    // Depth based on distance from islands
    const depth = Math.min(this.universe.oceanDepth, this.universe.oceanDepth * (1 - shoreProximity * 0.5));

    return {
      character: this.universe.oceanCharacter,
      depth,
      currentDirection: { dx: Math.cos(currentAngle), dz: Math.sin(currentAngle) },
      currentStrength,
      nearestIsland: nearest,
      distToNearest: nearestDist,
      shoreProximity,
    };
  }

  // Get travel routes from an island
  getTravelRoutes(islandIndex) {
    return this._travelRoutes[islandIndex] || [];
  }

  // Get all islands
  getIslands() {
    return this.islands;
  }

  // Check if position is ocean
  isOcean(x, z) {
    return this.getIslandAt(x, z) === null;
  }
}
