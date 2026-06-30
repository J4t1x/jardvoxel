// ═══════════════════════════════════════════════════════════
// JardVoxel 7.0 — Hierarchical World Generation
// Specs: SPEC-100 through SPEC-110
// Architecture: World → Continents → Regions → Zones → Chunks → Microsectors
// ═══════════════════════════════════════════════════════════

import { SimplexNoise, DomainWarper, NOISE_CONFIGS, FastNoiseLite, FN_NOISE_TYPE, FN_CELLULAR_RETURN } from './jardvoxel-survival-noise.js';
import { HydrologySystem } from './jardvoxel-survival-hydrology.js';

// v7.0: Define constants locally to avoid circular dependency with jardvoxel-survival-engine.js
// These are exported for other v7.0 modules to import from here instead of the engine
export const SEA_LEVEL = 63;
export const CHUNK_SIZE = 16;
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
  ZEN_GARDEN: 'zen_garden',
  BAMBOO_GROVE: 'bamboo_grove',
  AURORA_TUNDRA: 'aurora_tundra',
};

// ═══════════════════════════════════════════════════════════
// SPEC-100: World Identity — Level 1
// Defines global planet identity: seed, climate, sea level, continents
// ═══════════════════════════════════════════════════════════

// Edades geológicas basadas en la Tierra (Cenozoico)
const GEOLOGICAL_AGES = {
  PALEOGENE: { name: 'Paleogene', roughnessMultiplier: 1.3, erosionFactor: 0.4, period: '66-23 Ma' },
  NEOGENE: { name: 'Neogene', roughnessMultiplier: 1.1, erosionFactor: 0.6, period: '23-2.6 Ma' },
  QUATERNARY: { name: 'Quaternary', roughnessMultiplier: 1.0, erosionFactor: 0.8, period: '2.6 Ma-present' },
};

// Eventos geológicos reales del Cuaternario (últimos 2.6 millones de años)
const WORLD_HISTORY_EVENTS = [
  { name: 'Pleistocene Glaciation', temperatureBoost: -0.18, volcanicActivity: 0.3, seaLevelShift: -8, vegetationBoost: 0.7, period: '2.6 Ma-11.7 ka' },
  { name: 'Last Glacial Maximum', temperatureBoost: -0.25, volcanicActivity: 0.2, seaLevelShift: -12, vegetationBoost: 0.6, period: '26.5-19 ka' },
  { name: 'Holocene Optimum', temperatureBoost: 0.08, volcanicActivity: 0.4, seaLevelShift: 2, vegetationBoost: 1.2, period: '9-5 ka' },
  { name: 'Younger Dryas', temperatureBoost: -0.15, volcanicActivity: 0.3, seaLevelShift: -3, vegetationBoost: 0.8, period: '12.9-11.7 ka' },
  { name: 'Eemian Interglacial', temperatureBoost: 0.12, volcanicActivity: 0.35, seaLevelShift: 6, vegetationBoost: 1.3, period: '130-115 ka' },
  { name: 'Toba Supereruption', temperatureBoost: -0.1, volcanicActivity: 0.9, seaLevelShift: 0, vegetationBoost: 0.5, oreAbundance: 1.4, period: '74 ka' },
  { name: 'Alpine Orogeny', temperatureBoost: 0.0, volcanicActivity: 0.6, seaLevelShift: 0, oreAbundance: 1.3, period: '65-2.6 Ma' },
  { name: 'Anthropocene', temperatureBoost: 0.15, volcanicActivity: 0.4, seaLevelShift: 1, vegetationBoost: 0.9, period: '1950-present' },
];

export class WorldIdentity {
  constructor(seed, options = {}) {
    this.seed = seed;

    // PRNG for deterministic world properties
    const prng = new WorldPRNG(seed);

    // Global parameters (basados en la Tierra real)
    this.seaLevel = options.seaLevel ?? SEA_LEVEL;
    this.geologicalAge = options.geologicalAge ?? this._pickAge(prng);
    
    // Temperatura global: variación realista ±2°C (vs actual +1.1°C desde pre-industrial)
    this.climateOffset = options.climateOffset ?? (prng.next() - 0.5) * 0.15;
    
    // Cobertura oceánica: 71% (Tierra real) ±5%
    this.oceanCoverage = options.oceanCoverage ?? 0.68 + prng.next() * 0.06;
    
    // Continentes: 7 (Tierra real) ±2
    this.continentCount = options.continentCount ?? 5 + Math.floor(prng.next() * 5);
    
    // Rotación axial (inclinación): 23.5° (Tierra) ±3°
    this.axialTilt = options.axialTilt ?? 20.5 + prng.next() * 6;
    
    // Excentricidad orbital: 0.0167 (Tierra) ±0.01
    this.orbitalEccentricity = options.orbitalEccentricity ?? 0.01 + prng.next() * 0.02;

    // World history — 2-4 eventos geológicos (más realista para Cuaternario)
    const eventCount = 2 + Math.floor(prng.next() * 3);
    this.worldHistory = [];
    const usedEvents = new Set();
    for (let i = 0; i < eventCount; i++) {
      let eventIdx;
      let attempts = 0;
      // Evitar duplicados
      do {
        eventIdx = Math.floor(prng.next() * WORLD_HISTORY_EVENTS.length);
        attempts++;
      } while (usedEvents.has(eventIdx) && attempts < 20);
      
      usedEvents.add(eventIdx);
      const event = { ...WORLD_HISTORY_EVENTS[eventIdx] };
      this.worldHistory.push(event);
    }

    // Apply history effects
    this._appliedTempBoost = 0;
    this._appliedSeaShift = 0;
    this._appliedVolcanic = 0.3;
    this._appliedVegetation = 1.0;
    this._appliedOre = 1.0;
    for (const event of this.worldHistory) {
      if (event.temperatureBoost) this._appliedTempBoost += event.temperatureBoost;
      if (event.seaLevelShift) this._appliedSeaShift += event.seaLevelShift;
      if (event.volcanicActivity) this._appliedVolcanic = event.volcanicActivity;
      if (event.vegetationBoost) this._appliedVegetation = event.vegetationBoost;
      if (event.oreAbundance) this._appliedOre = event.oreAbundance;
    }

    this.effectiveSeaLevel = this.seaLevel + this._appliedSeaShift;

    // Continent map noise — very low frequency for continent-scale features
    this.continentNoise = new SimplexNoise(seed + 10000);
    this.continentWarper = new DomainWarper(seed + 10001);

    // Continent threshold derived from ocean coverage
    // Higher oceanCoverage → higher threshold → more ocean
    this.continentThreshold = (this.oceanCoverage - 0.5) * 1.6;

    // Cache
    this._continentCache = new Map();
    this._continentDataCache = [];
  }

  _pickAge(prng) {
    const r = prng.next();
    // Distribución más realista: 70% Quaternary (presente), 20% Neogene, 10% Paleogene
    if (r < 0.70) return GEOLOGICAL_AGES.QUATERNARY;
    if (r < 0.90) return GEOLOGICAL_AGES.NEOGENE;
    return GEOLOGICAL_AGES.PALEOGENE;
  }

  // Returns continent value at world position (-1 to 1)
  // < threshold = ocean, >= threshold = land
  getContinentValue(x, z) {
    const cfg = NOISE_CONFIGS.continentalness;
    const warped = this.continentWarper.warp2D(x, z, cfg.warpStrength, cfg.warpScale, cfg.warpOctaves);
    return this.continentNoise.fbm2D(warped.x, warped.z, cfg.octaves, cfg.persistence, cfg.lacunarity, cfg.scale);
  }

  // Returns continent index (0 to continentCount-1) or -1 for ocean
  getContinentId(x, z) {
    const ix = Math.floor(x / 64) & 0xFFFF;
    const iz = Math.floor(z / 64) & 0xFFFF;
    const key = ix * 65536 + iz;
    if (this._continentCache.has(key)) return this._continentCache.get(key);

    const value = this.getContinentValue(x, z);
    let id = -1;
    if (value >= this.continentThreshold) {
      // Assign continent ID based on angle + distance from origin
      const angle = Math.atan2(z, x);
      const normalized = (angle + Math.PI) / (2 * Math.PI);
      id = Math.floor(normalized * this.continentCount) % this.continentCount;
    }

    if (this._continentCache.size > 10000) {
      const firstKey = this._continentCache.keys().next().value;
      this._continentCache.delete(firstKey);
    }
    this._continentCache.set(key, id);
    return id;
  }

  // Returns true if position is ocean
  isOcean(x, z) {
    return this.getContinentId(x, z) === -1;
  }

  // Returns effective temperature at position (with global offset + history + latitude)
  getGlobalTemperature(x, z) {
    // Temperatura base con variación de ruido
    const baseTemp = new SimplexNoise(this.seed + 400).fbm2D(x, z, 4, 0.5, 2.0, 0.0005);
    
    // Gradiente latitudinal realista (Ecuador cálido, polos fríos)
    // Asumimos que z representa latitud (0 = ecuador, ±10000 = polos)
    const latitude = Math.abs(z) / 10000; // Normalizado 0-1
    const latitudeEffect = -0.5 * Math.pow(latitude, 1.5); // Enfriamiento hacia polos
    
    // Efecto de inclinación axial (estaciones)
    const axialEffect = Math.sin(this.axialTilt * Math.PI / 180) * 0.05;
    
    return baseTemp + this.climateOffset + this._appliedTempBoost + latitudeEffect + axialEffect;
  }

  // Get world info for display/debug
  getInfo() {
    return {
      seed: this.seed,
      geologicalAge: `${this.geologicalAge.name} (${this.geologicalAge.period})`,
      climateOffset: `${this.climateOffset > 0 ? '+' : ''}${this.climateOffset.toFixed(2)}°C`,
      oceanCoverage: `${(this.oceanCoverage * 100).toFixed(1)}%`,
      continentCount: this.continentCount,
      seaLevel: `${this.effectiveSeaLevel}m`,
      axialTilt: `${this.axialTilt.toFixed(1)}°`,
      orbitalEccentricity: this.orbitalEccentricity.toFixed(4),
      worldHistory: this.worldHistory.map(e => `${e.name} (${e.period})`),
      vegetationBoost: `${(this._appliedVegetation * 100).toFixed(0)}%`,
      oreAbundance: `${(this._appliedOre * 100).toFixed(0)}%`,
      volcanicActivity: `${(this._appliedVolcanic * 100).toFixed(0)}%`,
    };
  }
}

// ═══════════════════════════════════════════════════════════
// SPEC-101: Continent Generator — Level 2
// Each continent has unique climate, altitude, vegetation, fauna, culture
// ═══════════════════════════════════════════════════════════

const CULTURE_TYPES = ['ancient_norse', 'desert_nomads', 'forest_folk', 'mountain_clans', 'coastal_merchants', 'jungle_tribes', 'plains_riders', 'mystics'];
const FAUNA_TYPES = ['forest_animals', 'desert_creatures', 'tundra_beasts', 'jungle_wildlife', 'plains_herds', 'mountain_goats', 'coastal_birds', 'mystic_creatures'];

export class ContinentGenerator {
  constructor(worldIdentity) {
    this.world = worldIdentity;
    this.continents = [];
    this._boundaryNoise = new SimplexNoise(worldIdentity.seed + 11000);
    this._boundaryWarper = new DomainWarper(worldIdentity.seed + 11001);

    // Generate continent properties
    for (let i = 0; i < worldIdentity.continentCount; i++) {
      const prng = new WorldPRNG(worldIdentity.seed + 20000 + i * 137);
      const climateRoll = prng.next();
      const altRoll = prng.next();
      const humidRoll = prng.next();
      const vegRoll = prng.next();
      const cultureRoll = Math.floor(prng.next() * CULTURE_TYPES.length);
      const faunaRoll = Math.floor(prng.next() * FAUNA_TYPES.length);

      this.continents.push({
        id: i,
        dominantClimate: (climateRoll - 0.5) * 0.6, // -0.3 to +0.3 temp offset
        averageAltitude: 0.7 + altRoll * 0.6, // 0.7 to 1.3 multiplier
        humidityLevel: (humidRoll - 0.5) * 0.5, // -0.25 to +0.25
        dominantVegetation: this._pickVegetation(vegRoll, climateRoll, humidRoll),
        dominantFauna: FAUNA_TYPES[faunaRoll],
        ancientCulture: CULTURE_TYPES[cultureRoll],
        characteristicResources: this._pickResources(prng),
        // Sub-seeds for region generation
        regionSeed: worldIdentity.seed + 30000 + i * 311,
      });
    }
  }

  _pickVegetation(vegRoll, climate, humid) {
    if (climate < -0.15) return BIOMES.TAIGA;
    if (climate > 0.2 && humid < 0) return BIOMES.DESERT;
    if (climate > 0.2 && humid > 0.2) return BIOMES.JUNGLE;
    if (humid > 0.15) return BIOMES.FOREST;
    if (vegRoll < 0.4) return BIOMES.PLAINS;
    return BIOMES.MEADOW;
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

  // Get continent properties at world position with smooth blending
  getContinentProperties(x, z) {
    const id = this.world.getContinentId(x, z);
    if (id === -1) {
      // Ocean — return neutral properties
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

    const continent = this.continents[id];

    // Check distance to continent boundary for blending
    const blendFactor = this._getBlendFactor(x, z);

    if (blendFactor >= 1.0) {
      return { ...continent, isOcean: false };
    }

    // Blend with ocean properties at boundaries
    return {
      id: continent.id,
      dominantClimate: continent.dominantClimate * blendFactor,
      averageAltitude: 0.5 + (continent.averageAltitude - 0.5) * blendFactor,
      humidityLevel: continent.humidityLevel * blendFactor,
      dominantVegetation: blendFactor > 0.5 ? continent.dominantVegetation : BIOMES.BEACH,
      dominantFauna: continent.dominantFauna,
      ancientCulture: continent.ancientCulture,
      characteristicResources: continent.characteristicResources,
      isOcean: false,
      blendFactor,
    };
  }

  // Returns 0 at ocean boundary, 1 deep inside continent
  _getBlendFactor(x, z) {
    const value = this.world.getContinentValue(x, z);
    const threshold = this.world.continentThreshold;
    const blendRange = 0.15;
    if (value < threshold) return 0;
    if (value > threshold + blendRange) return 1;
    return (value - threshold) / blendRange;
  }
}

// ═══════════════════════════════════════════════════════════
// SPEC-102: Region Generator — Level 3
// Continents divide into large regions (mountains, plains, forests, etc.)
// ═══════════════════════════════════════════════════════════

export const REGION_TYPES = {
  MOUNTAIN_RANGE: 'mountain_range',
  PLAINS: 'plains',
  FOREST: 'forest',
  SWAMP: 'swamp',
  PLATEAU: 'plateau',
  COAST: 'coast',
  DESERT: 'desert',
  TUNDRA: 'tundra',
  JUNGLE: 'jungle',
  VOLCANIC: 'volcanic',
  OCEAN: 'ocean',
  DEEP_OCEAN: 'deep_ocean',
};

const REGION_PROPERTIES = {
  [REGION_TYPES.MOUNTAIN_RANGE]: {
    heightModifier: { min: 30, max: 80 },
    biomeBias: [BIOMES.MOUNTAINS, BIOMES.SNOWY_PEAKS, BIOMES.STONY_PEAKS],
    treeDensity: 0.3,
    waterFeatures: 0.2,
    landmarkChance: 0.5,
    noiseType: 'ridged',
  },
  [REGION_TYPES.PLAINS]: {
    heightModifier: { min: -5, max: 10 },
    biomeBias: [BIOMES.PLAINS, BIOMES.MEADOW],
    treeDensity: 0.3,
    waterFeatures: 0.4,
    landmarkChance: 0.3,
    noiseType: 'flat',
  },
  [REGION_TYPES.FOREST]: {
    heightModifier: { min: 5, max: 20 },
    biomeBias: [BIOMES.FOREST, BIOMES.AUTUMN_FOREST, BIOMES.CHERRY_GROVE],
    treeDensity: 1.2,
    waterFeatures: 0.5,
    landmarkChance: 0.4,
    noiseType: 'billowy',
  },
  [REGION_TYPES.SWAMP]: {
    heightModifier: { min: -3, max: 5 },
    biomeBias: [BIOMES.SWAMP],
    treeDensity: 0.6,
    waterFeatures: 0.9,
    landmarkChance: 0.3,
    noiseType: 'flat',
  },
  [REGION_TYPES.PLATEAU]: {
    heightModifier: { min: 20, max: 40 },
    biomeBias: [BIOMES.SAVANNA, BIOMES.MEADOW],
    treeDensity: 0.4,
    waterFeatures: 0.2,
    landmarkChance: 0.35,
    noiseType: 'stepped',
  },
  [REGION_TYPES.COAST]: {
    heightModifier: { min: -10, max: 5 },
    biomeBias: [BIOMES.BEACH, BIOMES.OCEAN],
    treeDensity: 0.2,
    waterFeatures: 1.0,
    landmarkChance: 0.4,
    noiseType: 'flat',
  },
  [REGION_TYPES.DESERT]: {
    heightModifier: { min: 0, max: 15 },
    biomeBias: [BIOMES.DESERT],
    treeDensity: 0.1,
    waterFeatures: 0.05,
    landmarkChance: 0.35,
    noiseType: 'dunes',
  },
  [REGION_TYPES.TUNDRA]: {
    heightModifier: { min: -5, max: 15 },
    biomeBias: [BIOMES.SNOWY_PLAINS, BIOMES.AURORA_TUNDRA],
    treeDensity: 0.2,
    waterFeatures: 0.3,
    landmarkChance: 0.4,
    noiseType: 'flat',
  },
  [REGION_TYPES.JUNGLE]: {
    heightModifier: { min: 10, max: 30 },
    biomeBias: [BIOMES.JUNGLE, BIOMES.BAMBOO_GROVE],
    treeDensity: 1.5,
    waterFeatures: 0.7,
    landmarkChance: 0.45,
    noiseType: 'billowy',
  },
  [REGION_TYPES.VOLCANIC]: {
    heightModifier: { min: 40, max: 100 },
    biomeBias: [BIOMES.STONY_PEAKS, BIOMES.MOUNTAINS],
    treeDensity: 0.1,
    waterFeatures: 0.1,
    landmarkChance: 0.6,
    noiseType: 'ridged',
  },
  [REGION_TYPES.OCEAN]: {
    heightModifier: { min: -30, max: -10 },
    biomeBias: [BIOMES.OCEAN],
    treeDensity: 0,
    waterFeatures: 1.0,
    landmarkChance: 0.2,
    noiseType: 'flat',
  },
  [REGION_TYPES.DEEP_OCEAN]: {
    heightModifier: { min: -50, max: -20 },
    biomeBias: [BIOMES.DEEP_OCEAN],
    treeDensity: 0,
    waterFeatures: 1.0,
    landmarkChance: 0.15,
    noiseType: 'flat',
  },
};

export class RegionGenerator {
  constructor(continentGenerator) {
    this.continentGen = continentGenerator;
    this.world = continentGenerator.world;
    this.regionNoise = new SimplexNoise(this.world.seed + 12000);
    this.regionWarper = new DomainWarper(this.world.seed + 12001);
    this.ridgeNoise = new SimplexNoise(this.world.seed + 12002);
    this._cache = new Map();
  }

  getRegion(x, z) {
    const ix = Math.floor(x / 32) & 0xFFFF;
    const iz = Math.floor(z / 32) & 0xFFFF;
    const key = ix * 65536 + iz;
    if (this._cache.has(key)) return this._cache.get(key);

    const continentProps = this.continentGen.getContinentProperties(x, z);

    let regionType;
    if (continentProps.isOcean) {
      // Ocean regions: deep vs shallow based on continent value
      const contValue = this.world.getContinentValue(x, z);
      regionType = contValue < this.world.continentThreshold - 0.2 ? REGION_TYPES.DEEP_OCEAN : REGION_TYPES.OCEAN;
    } else {
      // Land regions: use noise + continent properties to select type
      const warped = this.regionWarper.warp2D(x, z, 40, 0.005, 2);
      const regionValue = this.regionNoise.fbm2D(warped.x, warped.z, 3, 0.5, 2.0, 0.001);
      regionType = this._selectRegionType(regionValue, continentProps, x, z);
    }

    const props = REGION_PROPERTIES[regionType] || REGION_PROPERTIES[REGION_TYPES.PLAINS];
    const continentId = continentProps.id;

    const region = {
      type: regionType,
      heightModifier: props.heightModifier,
      biomeBias: props.biomeBias,
      treeDensity: props.treeDensity * this.world._appliedVegetation,
      waterFeatures: props.waterFeatures,
      landmarkChance: props.landmarkChance,
      noiseType: props.noiseType,
      continentId,
      // Blend continent-level properties into region
      climateOffset: continentProps.dominantClimate,
      altitudeMultiplier: continentProps.averageAltitude,
      humidityOffset: continentProps.humidityLevel,
    };

    if (this._cache.size > 8000) {
      const firstKey = this._cache.keys().next().value;
      this._cache.delete(firstKey);
    }
    this._cache.set(key, region);
    return region;
  }

  _selectRegionType(value, continentProps, x, z) {
    // Value range: -1 to 1
    // Use continent climate to bias selection
    const climate = continentProps.dominantClimate + this.world.climateOffset;
    const humid = continentProps.humidityLevel;

    // Mountain ranges: high positive value + ridged noise check
    const ridge = Math.abs(this.ridgeNoise.noise2D(x * 0.001, z * 0.001));
    if (value > 0.5 && ridge > 0.4) {
      return this.world._appliedVolcanic > 0.5 && value > 0.7 ? REGION_TYPES.VOLCANIC : REGION_TYPES.MOUNTAIN_RANGE;
    }

    // Climate-based regions
    if (climate < -0.15) return REGION_TYPES.TUNDRA;
    if (climate > 0.2 && humid < -0.1) return REGION_TYPES.DESERT;
    if (climate > 0.15 && humid > 0.15) return REGION_TYPES.JUNGLE;

    // Humidity-based
    if (humid > 0.15 && value < -0.2) return REGION_TYPES.SWAMP;
    if (humid > 0.05 && value > 0.1) return REGION_TYPES.FOREST;
    if (value < -0.3) return REGION_TYPES.COAST;
    if (value > 0.3 && value < 0.5) return REGION_TYPES.PLATEAU;
    if (value < 0.1) return REGION_TYPES.PLAINS;

    return REGION_TYPES.PLAINS;
  }
}

// ═══════════════════════════════════════════════════════════
// SPEC-103: Zone Generator — Level 4
// Regions subdivide into zones (lakes, valleys, waterfalls, etc.)
// ═══════════════════════════════════════════════════════════

export const ZONE_TYPES = {
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

const ZONE_PROPERTIES = {
  [ZONE_TYPES.LAKE]: { moodTag: 'serene', microDetail: 1.5, featureList: ['water_body', 'reeds'] },
  [ZONE_TYPES.VALLEY]: { moodTag: 'cozy', microDetail: 1.0, featureList: ['stream', 'flowers'] },
  [ZONE_TYPES.WATERFALL]: { moodTag: 'grand', microDetail: 0.8, featureList: ['waterfall', 'mist'] },
  [ZONE_TYPES.DENSE_FOREST]: { moodTag: 'mysterious', microDetail: 2.0, featureList: ['dense_trees', 'mushrooms', 'moss'] },
  [ZONE_TYPES.CLEARING]: { moodTag: 'serene', microDetail: 1.2, featureList: ['flowers', 'butterflies'] },
  [ZONE_TYPES.HILLS]: { moodTag: 'peaceful', microDetail: 0.8, featureList: ['rolling_terrain', 'scattered_trees'] },
  [ZONE_TYPES.CLIFFS]: { moodTag: 'grand', microDetail: 0.5, featureList: ['rock_formations', 'vista'] },
  [ZONE_TYPES.WETLANDS]: { moodTag: 'mysterious', microDetail: 1.5, featureList: ['shallow_water', 'reeds', 'frogs'] },
  [ZONE_TYPES.RIVER_BEND]: { moodTag: 'peaceful', microDetail: 1.0, featureList: ['river_curve', 'sandbank'] },
  [ZONE_TYPES.GORGE]: { moodTag: 'grand', microDetail: 0.3, featureList: ['deep_cut', 'echo'] },
  [ZONE_TYPES.MEADOW]: { moodTag: 'serene', microDetail: 1.8, featureList: ['wildflowers', 'butterflies', 'bees'] },
  [ZONE_TYPES.GROVE]: { moodTag: 'mysterious', microDetail: 1.5, featureList: ['special_trees', 'clearing'] },
  [ZONE_TYPES.OCEANIC]: { moodTag: 'peaceful', microDetail: 0.3, featureList: ['underwater_features'] },
  [ZONE_TYPES.COASTAL]: { moodTag: 'serene', microDetail: 0.8, featureList: ['beach', 'shells', 'driftwood'] },
  [ZONE_TYPES.DEFAULT]: { moodTag: 'peaceful', microDetail: 1.0, featureList: [] },
};

// Zone type validity per region type
const ZONE_VALIDITY = {
  [REGION_TYPES.MOUNTAIN_RANGE]: [ZONE_TYPES.VALLEY, ZONE_TYPES.CLIFFS, ZONE_TYPES.GORGE, ZONE_TYPES.WATERFALL, ZONE_TYPES.HILLS, ZONE_TYPES.DEFAULT],
  [REGION_TYPES.PLAINS]: [ZONE_TYPES.LAKE, ZONE_TYPES.HILLS, ZONE_TYPES.MEADOW, ZONE_TYPES.CLEARING, ZONE_TYPES.RIVER_BEND, ZONE_TYPES.DEFAULT],
  [REGION_TYPES.FOREST]: [ZONE_TYPES.DENSE_FOREST, ZONE_TYPES.CLEARING, ZONE_TYPES.GROVE, ZONE_TYPES.LAKE, ZONE_TYPES.HILLS, ZONE_TYPES.DEFAULT],
  [REGION_TYPES.SWAMP]: [ZONE_TYPES.WETLANDS, ZONE_TYPES.LAKE, ZONE_TYPES.DEFAULT],
  [REGION_TYPES.PLATEAU]: [ZONE_TYPES.CLIFFS, ZONE_TYPES.MEADOW, ZONE_TYPES.HILLS, ZONE_TYPES.DEFAULT],
  [REGION_TYPES.COAST]: [ZONE_TYPES.COASTAL, ZONE_TYPES.LAKE, ZONE_TYPES.CLIFFS, ZONE_TYPES.DEFAULT],
  [REGION_TYPES.DESERT]: [ZONE_TYPES.HILLS, ZONE_TYPES.CLIFFS, ZONE_TYPES.GORGE, ZONE_TYPES.DEFAULT],
  [REGION_TYPES.TUNDRA]: [ZONE_TYPES.LAKE, ZONE_TYPES.HILLS, ZONE_TYPES.CLEARING, ZONE_TYPES.DEFAULT],
  [REGION_TYPES.JUNGLE]: [ZONE_TYPES.DENSE_FOREST, ZONE_TYPES.LAKE, ZONE_TYPES.WATERFALL, ZONE_TYPES.GROVE, ZONE_TYPES.DEFAULT],
  [REGION_TYPES.VOLCANIC]: [ZONE_TYPES.CLIFFS, ZONE_TYPES.GORGE, ZONE_TYPES.HILLS, ZONE_TYPES.DEFAULT],
  [REGION_TYPES.OCEAN]: [ZONE_TYPES.OCEANIC, ZONE_TYPES.COASTAL, ZONE_TYPES.DEFAULT],
  [REGION_TYPES.DEEP_OCEAN]: [ZONE_TYPES.OCEANIC, ZONE_TYPES.DEFAULT],
};

export class ZoneGenerator {
  constructor(regionGenerator) {
    this.regionGen = regionGenerator;
    this.world = regionGenerator.world;
    this.zoneNoise = new SimplexNoise(this.world.seed + 13000);
    this.zoneWarper = new DomainWarper(this.world.seed + 13001);
    // G-03: Cellular F1 noise for irregular lake/wetland shapes
    this._lakeCellular = new FastNoiseLite(this.world.seed + 13002);
    this._lakeCellular.setNoiseType(FN_NOISE_TYPE.CELLULAR);
    this._lakeCellular.setCellularReturnType(FN_CELLULAR_RETURN.F1);
    this._cache = new Map();
  }

  getZone(x, z) {
    const ix = Math.floor(x / 16) & 0xFFFF;
    const iz = Math.floor(z / 16) & 0xFFFF;
    const key = ix * 65536 + iz;
    if (this._cache.has(key)) return this._cache.get(key);

    const region = this.regionGen.getRegion(x, z);

    // Zone noise at higher frequency than region noise
    const warped = this.zoneWarper.warp2D(x, z, 20, 0.01, 2);
    const zoneValue = this.zoneNoise.fbm2D(warped.x, warped.z, 2, 0.5, 2.0, 0.005);

    const zoneType = this._selectZoneType(zoneValue, region, x, z);
    const props = ZONE_PROPERTIES[zoneType] || ZONE_PROPERTIES[ZONE_TYPES.DEFAULT];

    const zone = {
      type: zoneType,
      moodTag: props.moodTag,
      microDetail: props.microDetail,
      featureList: props.featureList,
      regionType: region.type,
      // Zone-specific modifiers
      heightAdjustment: this._getZoneHeightAdjustment(zoneType, zoneValue),
      decorationMultiplier: props.microDetail,
    };

    if (this._cache.size > 15000) {
      const firstKey = this._cache.keys().next().value;
      this._cache.delete(firstKey);
    }
    this._cache.set(key, zone);
    return zone;
  }

  _selectZoneType(value, region, x, z) {
    const validZones = ZONE_VALIDITY[region.type] || [ZONE_TYPES.DEFAULT];
    if (validZones.length === 1) return validZones[0];

    // Map noise value to zone index
    const normalized = (value + 1) / 2; // 0 to 1
    const idx = Math.floor(normalized * validZones.length) % validZones.length;

    // Special checks
    const selected = validZones[idx];
    if (selected === ZONE_TYPES.WATERFALL) {
      // Only place waterfalls if there's height variation nearby
      const h1 = this._estimateHeight(x, z);
      const h2 = this._estimateHeight(x + 16, z);
      if (Math.abs(h1 - h2) < 10) return ZONE_TYPES.HILLS;
    }
    if (selected === ZONE_TYPES.LAKE && region.type === REGION_TYPES.DESERT) {
      // Oasis — rare but possible
      if (value < 0.7) return ZONE_TYPES.DEFAULT;
    }
    // G-03: Use cellular F1 to give lakes/wetlands irregular natural boundaries
    if (selected === ZONE_TYPES.LAKE || selected === ZONE_TYPES.WETLANDS) {
      const cellF1 = this._lakeCellular.cellular2D(x * 0.005, z * 0.005);
      // Cellular F1 produces irregular shapes — suppress lake/wetland if cell value too high
      if (cellF1 > 0.6) return ZONE_TYPES.DEFAULT;
    }

    return selected;
  }

  _estimateHeight(x, z) {
    // Quick height estimate using existing pipeline
    const cont = this.world.getContinentValue(x, z);
    return cont * 50 + 63;
  }

  _getZoneHeightAdjustment(type, value) {
    switch (type) {
      case ZONE_TYPES.LAKE: return -5;
      case ZONE_TYPES.VALLEY: return -8;
      case ZONE_TYPES.HILLS: return 5 + value * 5;
      case ZONE_TYPES.CLIFFS: return 10;
      case ZONE_TYPES.GORGE: return -15;
      case ZONE_TYPES.WETLANDS: return -2;
      case ZONE_TYPES.CLEARING: return 0;
      default: return 0;
    }
  }
}

// ═══════════════════════════════════════════════════════════
// SPEC-104: Hierarchical Chunk Generator — Level 5
// Chunks materialize terrain from pre-computed hierarchy data
// ═══════════════════════════════════════════════════════════

export class HierarchicalChunkGenerator {
  constructor(seed) {
    this.world = new WorldIdentity(seed);
    this.continentGen = new ContinentGenerator(this.world);
    this.regionGen = new RegionGenerator(this.continentGen);
    this.zoneGen = new ZoneGenerator(this.regionGen);

    // Reuse existing noise for terrain height
    this.terrainNoise = new SimplexNoise(seed + 200);
    this.erosionNoise = new SimplexNoise(seed + 201);
    this.warper = new DomainWarper(seed);

    // PRD P-02: Hydrology system for rivers, lakes, valleys
    this.hydrology = new HydrologySystem(seed);
    this._useRidgedNoise = true;
    // PRD G-03: Cellular noise for organic terrain patterns
    this._cellularNoise = new FastNoiseLite(seed + 12345);
    this._cellularNoise.setNoiseType(FN_NOISE_TYPE.CELLULAR);
    this._cellularNoise.setCellularReturnType(FN_CELLULAR_RETURN.F1_TIMES_F2);
    this._useCellularNoise = true;

    // ChunkContext cache
    this._contextCache = new Map();
    this._maxCacheSize = 500;
  }

  // Get or compute ChunkContext for a chunk coordinate
  getChunkContext(cx, cz) {
    const key = `${cx},${cz}`;
    if (this._contextCache.has(key)) return this._contextCache.get(key);

    const ox = cx * CHUNK_SIZE;
    const oz = cz * CHUNK_SIZE;

    // Sample hierarchy at chunk center
    const centerProps = this.continentGen.getContinentProperties(ox + 8, oz + 8);
    const region = this.regionGen.getRegion(ox + 8, oz + 8);
    const zone = this.zoneGen.getZone(ox + 8, oz + 8);

    // Sample biome weights at center + corners
    const biomeWeights = this._computeBiomeWeights(ox + 8, oz + 8, region, zone, centerProps);

    // Compute 16x16 height map
    const heightMap = this._computeHeightMap(cx, cz, region, zone, centerProps);

    // PRD P-02: Apply hydrology modifications to heightmap (rivers, valleys, lakes)
    const hydroData = this.hydrology.applyToHeightmap(cx, cz, heightMap, {
      generator: this,
      world: this.world,
      region,
      zone,
      heightMap,
    });

    // Local water level (may vary by zone)
    const waterLevel = this.world.effectiveSeaLevel + (zone.type === ZONE_TYPES.LAKE ? 2 : 0);

    const context = {
      cx, cz,
      ox, oz,
      continent: centerProps,
      region,
      zone,
      biomeWeights,
      heightMap,
      hydroData, // PRD P-02: river/lake/waterfall data
      waterLevel,
      // Global modifiers
      vegetationBoost: this.world._appliedVegetation,
      oreAbundance: this.world._appliedOre,
      geologicalAge: this.world.geologicalAge,
    };

    if (this._contextCache.size >= this._maxCacheSize) {
      const firstKey = this._contextCache.keys().next().value;
      this._contextCache.delete(firstKey);
    }
    this._contextCache.set(key, context);
    return context;
  }

  // Compute biome weights for a position using hierarchy data
  _computeBiomeWeights(x, z, region, zone, continentProps) {
    const weights = new Map();
    const temp = this.world.getGlobalTemperature(x, z) + continentProps.dominantClimate;
    const humid = new SimplexNoise(this.world.seed + 500).fbm2D(x, z, 4, 0.5, 2.0, 0.0005) + continentProps.humidityLevel;
    const height = this._estimateHeightAt(x, z, region, zone, continentProps);

    // Region biome bias gets highest weight
    for (const biome of region.biomeBias) {
      weights.set(biome, (weights.get(biome) || 0) + 0.4);
    }

    // Temperature/humidity based biomes
    if (temp < 0.2) weights.set(BIOMES.SNOWY_PLAINS, (weights.get(BIOMES.SNOWY_PLAINS) || 0) + 0.3);
    if (temp > 0.8 && humid < 0.3) weights.set(BIOMES.DESERT, (weights.get(BIOMES.DESERT) || 0) + 0.3);
    if (temp > 0.8 && humid > 0.7) weights.set(BIOMES.JUNGLE, (weights.get(BIOMES.JUNGLE) || 0) + 0.3);
    if (humid > 0.6 && temp > 0.3 && temp < 0.7) weights.set(BIOMES.FOREST, (weights.get(BIOMES.FOREST) || 0) + 0.2);
    if (height > this.world.effectiveSeaLevel + 100) weights.set(BIOMES.MOUNTAINS, (weights.get(BIOMES.MOUNTAINS) || 0) + 0.3);
    if (continentProps.isOcean) {
      weights.clear();
      weights.set(BIOMES.OCEAN, 0.7);
      if (height < this.world.effectiveSeaLevel - 15) weights.set(BIOMES.DEEP_OCEAN, 0.3);
    }

    // Normalize
    let total = 0;
    for (const w of weights.values()) total += w;
    if (total > 0) {
      for (const [k, v] of weights) weights.set(k, v / total);
    } else {
      weights.set(BIOMES.PLAINS, 1.0);
    }

    return weights;
  }

  // Quick height estimate for biome selection
  _estimateHeightAt(x, z, region, zone, continentProps) {
    const contValue = this.world.getContinentValue(x, z);
    let height = this.world.effectiveSeaLevel;

    if (contValue >= this.world.continentThreshold) {
      height += (contValue - this.world.continentThreshold) * 100 * continentProps.averageAltitude;
      height += region.heightModifier.min + (region.heightModifier.max - region.heightModifier.min) * 0.3;
      height += zone.heightAdjustment || 0;
    } else {
      height -= (this.world.continentThreshold - contValue) * 40;
    }

    return height;
  }

  // Compute 16x16 height map for a chunk
  _computeHeightMap(cx, cz, region, zone, continentProps) {
    const heights = new Float32Array(CHUNK_SIZE * CHUNK_SIZE);
    const ox = cx * CHUNK_SIZE;
    const oz = cz * CHUNK_SIZE;
    const seaLevel = this.world.effectiveSeaLevel;
    const ageMult = this.world.geologicalAge.roughnessMultiplier;

    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = ox + lx;
        const wz = oz + lz;

        const contValue = this.world.getContinentValue(wx, wz);
        let height = seaLevel;

        if (contValue >= this.world.continentThreshold) {
          // Land
          const landFactor = (contValue - this.world.continentThreshold) / (1 - this.world.continentThreshold);
          height += landFactor * 60 * continentProps.averageAltitude;

          // Region height modifier with noise (type-aware)
          const warped = this.warper.warp2D(wx, wz, 30, 0.004, 2);
          const noiseType = region.noiseType || 'flat';
          let regionNoise;
          if (!this._useRidgedNoise) {
            regionNoise = this.terrainNoise.fbm2D(warped.x, warped.z, 4, 0.5, 2.0, 0.002);
          } else {
            switch (noiseType) {
              case 'ridged':
                regionNoise = this.terrainNoise.ridgedFbm2D(warped.x, warped.z, 4, 0.5, 2.0, 0.002);
                break;
              case 'billowy':
                regionNoise = this.terrainNoise.billowyFbm2D(warped.x, warped.z, 4, 0.5, 2.0, 0.002);
                break;
              case 'stepped':
                regionNoise = this.terrainNoise.steppedFbm2D(warped.x, warped.z, 4, 0.5, 2.0, 0.002, 5);
                break;
              case 'dunes':
                regionNoise = this.terrainNoise.dunesFbm2D(warped.x, warped.z, 3, 0.5, 2.0, 0.004);
                break;
              default:
                regionNoise = this.terrainNoise.fbm2D(warped.x, warped.z, 4, 0.5, 2.0, 0.002);
            }
          }
          // Normalize all noise types to [-1, 1] range for height mapping
          const normalizedNoise = (this._useRidgedNoise && (noiseType === 'ridged' || noiseType === 'billowy' || noiseType === 'dunes'))
            ? regionNoise * 2 - 1
            : regionNoise;
          const regionHeight = region.heightModifier.min + (region.heightModifier.max - region.heightModifier.min) * (normalizedNoise + 1) * 0.5;
          height += regionHeight * ageMult;

          // Zone height adjustment
          height += zone.heightAdjustment || 0;

          // Erosion detail
          const erosion = this.erosionNoise.fbm2D(wx, wz, 3, 0.55, 2.2, 0.008);
          height += erosion * 8 * this.world.geologicalAge.erosionFactor;

          // Micro relief (±2 blocks)
          const microNoise = this.terrainNoise.noise2D(wx * 0.05, wz * 0.05);
          height += microNoise * 2;

          // PRD G-03: Cellular noise for organic terrain patterns
          if (this._useCellularNoise && this._cellularNoise) {
            const cellVal = this._cellularNoise.cellular2D(wx * 0.01, wz * 0.01);
            height += (cellVal - 0.5) * 4; // ±2 block organic variation
          }
        } else {
          // Ocean
          const oceanDepth = (this.world.continentThreshold - contValue) / (this.world.continentThreshold + 1);
          height -= oceanDepth * 40;
        }

        // Clamp
        height = Math.max(1, Math.min(height, 380));
        heights[lx + lz * CHUNK_SIZE] = height;
      }
    }

    return heights;
  }

  // Get the primary biome for a chunk (from pre-computed weights)
  getPrimaryBiome(cx, cz) {
    const ctx = this.getChunkContext(cx, cz);
    let maxWeight = 0;
    let primaryBiome = BIOMES.PLAINS;
    for (const [biome, weight] of ctx.biomeWeights) {
      if (weight > maxWeight) {
        maxWeight = weight;
        primaryBiome = biome;
      }
    }
    return primaryBiome;
  }

  // Get height at specific block within chunk (from pre-computed heightmap)
  getHeightAt(cx, cz, lx, lz) {
    const ctx = this.getChunkContext(cx, cz);
    return ctx.heightMap[lx + lz * CHUNK_SIZE];
  }

  // Clear caches
  clearCache() {
    this._contextCache.clear();
    this.world._continentCache.clear();
    this.regionGen._cache.clear();
    this.zoneGen._cache.clear();
    if (this.hydrology) this.hydrology.clearCache();
  }

  // Get world info
  getWorldInfo() {
    return this.world.getInfo();
  }
}

// ═══════════════════════════════════════════════════════════
// Utility: World-level PRNG (separate from chunk PRNG)
// ═══════════════════════════════════════════════════════════

class WorldPRNG {
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
