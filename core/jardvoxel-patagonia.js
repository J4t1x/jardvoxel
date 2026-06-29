// ═══════════════════════════════════════════════════════════
// JardVoxel Patagonia — Real World Profile
// Configures the existing engine to generate Patagonia-like terrain
// Based on real geography: 43°S to 56°S, Andes → Steppe → Atlantic
// ═══════════════════════════════════════════════════════════

import { SimplexNoise, DomainWarper } from './jardvoxel-survival-noise.js';
import { BIOMES, SEA_LEVEL, CHUNK_SIZE, WORLD_MIN_Y } from './jardvoxel-survival-engine.js';

// ── Patagonia Geography Constants ──────────────────────────
// World coordinates map to real geography:
// X axis = Longitude (west→east): Andes (-2000) → Steppe (0) → Atlantic (+2000)
// Z axis = Latitude (north→south): 43°S (-2000) → 56°S (+2000)
// Y axis = Elevation: sea level = 63, Andes peaks up to ~200

export const PATAGONIA = {
  // Fixed seed that produces a good Patagonia-like continent shape
  SEED: 142857,

  // Geographic bounds (in world blocks)
  ANDES_PEAK_X: -1200,      // X where Andes peaks are highest
  ANDES_BASE_X: -400,       // X where Andes foothills start
  STEPPE_CENTER_X: 200,     // X of central steppe (pampas)
  ATLANTIC_COAST_X: 1400,   // X where Atlantic coast begins
  OCEAN_EAST_X: 1800,       // X of deep Atlantic

  NORTH_Z: -1800,           // Z of northern Patagonia (43°S)
  SOUTH_Z: 1800,            // Z of southern Patagonia (56°S)
  TIERRA_DEL_FUEGO_Z: 2200, // Z of Tierra del Fuego

  // Elevation targets (in blocks above sea level)
  ANDES_MAX_HEIGHT: 130,    // ~4000m real (Cerro Fitz Roy ~3405m, Monte San Valentín ~4058m)
  STEPPE_HEIGHT: 12,        // ~300m real (patagonian steppe is flat, well above sea level)
  ATLANTIC_COAST_HEIGHT: -3,// Sea level

  // Climate
  NORTH_TEMP: 0.45,         // Northern Patagonia: temperate-cold
  SOUTH_TEMP: -0.35,        // Southern Patagonia: sub-Antarctic
  ANDES_TEMP_DROP: -0.4,    // Temperature drop at high elevation
  STEPPE_ARIDITY: -0.3,     // Steppe is dry (rain shadow from Andes)
  WEST_COAST_HUMIDITY: 0.7, // Pacific coast is very humid
};

// ── Biome names for Patagonia ──────────────────────────────
export const PATAGONIA_BIOME_NAMES = {
  [BIOMES.OCEAN]: 'Océano Pacífico',
  [BIOMES.DEEP_OCEAN]: 'Océano Profundo',
  [BIOMES.BEACH]: 'Costa',
  [BIOMES.PLAINS]: 'Estepa Patagónica',
  [BIOMES.FOREST]: 'Bosque Subantártico',
  [BIOMES.JUNGLE]: 'Selva Valdiviana',
  [BIOMES.DESERT]: 'Estepa Árida',
  [BIOMES.SAVANNA]: 'Pampa Seca',
  [BIOMES.TAIGA]: 'Bosque Magallánico',
  [BIOMES.SNOWY_PLAINS]: 'Tundra Magallánica',
  [BIOMES.MOUNTAINS]: 'Cordillera de los Andes',
  [BIOMES.SNOWY_PEAKS]: 'Picos Nevados',
  [BIOMES.STONY_PEAKS]: 'Cumbres Rocosas',
  [BIOMES.MEADOW]: 'Pradera Andina',
  [BIOMES.CHERRY_GROVE]: 'Bosque de Lenga',
  [BIOMES.SWAMP]: 'Humedal Patagónico',
  [BIOMES.RIVER]: 'Río Glacial',
  [BIOMES.MYSTIC_GROVE]: 'Bosque de Arrayanes',
  [BIOMES.AUTUMN_FOREST]: 'Bosque de Ñire',
  [BIOMES.ZEN_GARDEN]: 'Mirador Patagónico',
  [BIOMES.BAMBOO_GROVE]: 'Cañaveral Subantártico',
  [BIOMES.AURORA_TUNDRA]: 'Tundra Austral',
};

// ── Ambient sound mapping for Patagonia biomes ─────────────
export const PATAGONIA_AMBIENT_MAP = {
  [BIOMES.OCEAN]: 'ocean',
  [BIOMES.DEEP_OCEAN]: 'ocean',
  [BIOMES.BEACH]: 'ocean',
  [BIOMES.PLAINS]: 'plains',
  [BIOMES.MEADOW]: 'plains',
  [BIOMES.FOREST]: 'forest',
  [BIOMES.TAIGA]: 'forest',
  [BIOMES.CHERRY_GROVE]: 'forest',
  [BIOMES.AUTUMN_FOREST]: 'forest',
  [BIOMES.DESERT]: 'desert',
  [BIOMES.SAVANNA]: 'desert',
  [BIOMES.MOUNTAINS]: 'mountains',
  [BIOMES.SNOWY_PEAKS]: 'mountains',
  [BIOMES.STONY_PEAKS]: 'mountains',
  [BIOMES.SNOWY_PLAINS]: 'mountains',
  [BIOMES.SWAMP]: 'swamp',
  [BIOMES.RIVER]: 'ocean',
  [BIOMES.MYSTIC_GROVE]: 'mystic_grove',
  [BIOMES.ZEN_GARDEN]: 'zen_garden',
  [BIOMES.BAMBOO_GROVE]: 'bamboo_grove',
  [BIOMES.AURORA_TUNDRA]: 'aurora_tundra',
};

// ═══════════════════════════════════════════════════════════
// PatagoniaProfile — Wraps WorldGenPipeline with geographic overrides
// ═══════════════════════════════════════════════════════════

export class PatagoniaProfile {
  constructor(seed = PATAGONIA.SEED) {
    this.seed = seed;
    this.geo = PATAGONIA;

    // Directional noise for Andes mountain chain (ridged noise along X axis)
    this.andesNoise = new SimplexNoise(seed + 50000);
    this.andesRidgeNoise = new SimplexNoise(seed + 50001);
    this.andesWarper = new DomainWarper(seed + 50002);

    // Steppe noise (flat with gentle rolling hills)
    this.steppeNoise = new SimplexNoise(seed + 51000);

    // Hill noise — colinas suaves en la estepa
    this.hillNoise = new SimplexNoise(seed + 51001);

    // Cerro noise — cerros aislados medianos
    this.cerroNoise = new SimplexNoise(seed + 51002);
    this.cerroRidgeNoise = new SimplexNoise(seed + 51003);

    // Sierra noise — sierras dispersas (grupos de cerros altos)
    this.sierraNoise = new SimplexNoise(seed + 51004);
    this.sierraRidgeNoise = new SimplexNoise(seed + 51005);

    // Mesa noise — mesetas planas elevadas (típicas de Patagonia)
    this.mesaNoise = new SimplexNoise(seed + 51006);

    // Coastal noise (Atlantic side)
    this.coastNoise = new SimplexNoise(seed + 52000);

    // Fjord noise (Pacific coast — carved valleys)
    this.fjordNoise = new SimplexNoise(seed + 53000);
    this.fjordNoise2 = new SimplexNoise(seed + 53001);

    // Glacier noise (ice fields in the south)
    this.glacierNoise = new SimplexNoise(seed + 54000);

    // Lake noise (Andean foothills — glacial lakes)
    this.lakeNoise = new SimplexNoise(seed + 55000);

    // Temperature is latitude-based (Z axis) + elevation
    this.tempNoise = new SimplexNoise(seed + 56000);

    // Humidity: high on Pacific side, low on steppe (rain shadow)
    this.humidNoise = new SimplexNoise(seed + 57000);

    // Wind noise (Patagonia is famously windy)
    this.windNoise = new SimplexNoise(seed + 58000);

    // Cache
    this._heightCache = new Map();
    this._biomeCache = new Map();
    this._tempCache = new Map();
    this._humidCache = new Map();
  }

  // ── Temperature: based on latitude (Z) + elevation ───────
  getTemperature(x, z) {
    const key = Math.floor(x) * 100000 + Math.floor(z);
    if (this._tempCache.has(key)) return this._tempCache.get(key);

    // Linear latitude gradient: north = warmer, south = colder
    const latNorm = (z - this.geo.NORTH_Z) / (this.geo.SOUTH_Z - this.geo.NORTH_Z);
    const latTemp = this.geo.NORTH_TEMP + latNorm * (this.geo.SOUTH_TEMP - this.geo.NORTH_TEMP);

    // Local variation
    const localVar = this.tempNoise.fbm2D(x, z, 3, 0.5, 2.0, 0.001) * 0.1;

    // Elevation drop (Andes are colder)
    const height = this.getHeight(x, z);
    const elevDrop = Math.max(0, (height - SEA_LEVEL - 30) / 100) * this.geo.ANDES_TEMP_DROP;

    const temp = latTemp + localVar + elevDrop;
    this._tempCache.set(key, temp);
    return temp;
  }

  // ── Humidity: rain shadow from Andes ─────────────────────
  getHumidity(x, z) {
    const key = Math.floor(x) * 100000 + Math.floor(z);
    if (this._humidCache.has(key)) return this._humidCache.get(key);

    // West of Andes = humid (Pacific storms)
    // East of Andes = dry (rain shadow)
    const andesDist = (x - this.geo.ANDES_BASE_X) / 800; // -1 = deep west, +1 = deep east
    let humid;

    if (andesDist < -0.3) {
      // Pacific coast — very humid
      humid = this.geo.WEST_COAST_HUMIDITY + this.humidNoise.fbm2D(x, z, 2, 0.5, 2.0, 0.002) * 0.15;
    } else if (andesDist > 0.2) {
      // Steppe — dry (rain shadow)
      humid = this.geo.STEPPE_ARIDITY + this.humidNoise.fbm2D(x, z, 2, 0.5, 2.0, 0.002) * 0.2;
    } else {
      // Transition zone (Andean foothills)
      const t = (andesDist + 0.3) / 0.5; // 0 to 1
      humid = this.geo.WEST_COAST_HUMIDITY * (1 - t) + this.geo.STEPPE_ARIDITY * t;
      humid += this.humidNoise.fbm2D(x, z, 2, 0.5, 2.0, 0.002) * 0.1;
    }

    // South is slightly more humid (sub-Antarctic)
    const latNorm = (z - this.geo.NORTH_Z) / (this.geo.SOUTH_Z - this.geo.NORTH_Z);
    humid += latNorm * 0.15;

    this._humidCache.set(key, humid);
    return humid;
  }

  // ── Height: Andes wall in the west, flat steppe, gentle east ──
  getHeight(x, z) {
    const key = Math.floor(x) * 100000 + Math.floor(z);
    if (this._heightCache.has(key)) return this._heightCache.get(key);

    const latNorm = (z - this.geo.NORTH_Z) / (this.geo.SOUTH_Z - this.geo.NORTH_Z);

    // ── Base continental height: always above sea level ─────
    // The entire continent sits on a platform above sea level
    let height = SEA_LEVEL + 8; // Base land = 8 blocks above water

    // ── Andes Mountain Chain (x: -2200 to 400) ──────────────
    const peakDist = Math.abs(x - this.geo.ANDES_PEAK_X);
    const andesWidth = 1200;
    const andesFalloff = Math.max(0, 1 - peakDist / andesWidth);

    if (andesFalloff > 0) {
      // Ridged noise for sharp mountain peaks
      const warped = this.andesWarper.warp2D(x, z, 60, 0.002, 3);
      const ridgeRaw = this.andesRidgeNoise.fbm2D(warped.x, warped.z, 6, 0.55, 2.2, 0.0015);
      const ridge = 1 - Math.abs(ridgeRaw); // Ridge noise: 0=flat, 1=peak

      let andesHeight = ridge * this.geo.ANDES_MAX_HEIGHT * andesFalloff;

      // Northern Andes are taller (Fitz Roy area), southern are lower
      const latHeightMod = 1.0 - latNorm * 0.4;
      andesHeight *= latHeightMod;

      // Fjord carving on the Pacific side — but never below land base
      if (x < this.geo.ANDES_BASE_X) {
        const fjordN1 = this.fjordNoise.fbm3D(x * 0.003, z * 0.008, 0, 3, 0.5, 2.0, 0.004);
        const fjordN2 = this.fjordNoise2.fbm3D(x * 0.005, z * 0.012, 0, 2, 0.5, 2.0, 0.006);
        if (Math.abs(fjordN1) < 0.04 && Math.abs(fjordN2) < 0.04) {
          andesHeight -= 25; // Reduced from 40 to avoid underwater
        }
      }

      height += Math.max(0, andesHeight);

      // Foothills transition (east side of Andes)
      if (x > this.geo.ANDES_PEAK_X && x < this.geo.ANDES_BASE_X + 600) {
        const foothillFactor = Math.max(0, 1 - (x - this.geo.ANDES_PEAK_X) / 1000);
        const foothillNoise = this.andesNoise.fbm2D(x, z, 2, 0.4, 2.0, 0.004);
        height += foothillNoise * 8 * foothillFactor;
      }
    }

    // ── Patagonian Steppe (x: -200 to 1400) ─────────────────
    // Plains with colinas, cerros, sierras and mesas
    if (x > this.geo.ANDES_BASE_X + 100 && x < this.geo.ATLANTIC_COAST_X + 100) {
      const steppeDist = (x - this.geo.ANDES_BASE_X - 100) / (this.geo.ATLANTIC_COAST_X - this.geo.ANDES_BASE_X - 100);
      // Gentle slope from +12 (near Andes) down to +4 (near coast)
      const slope = (1 - steppeDist) * 8 + 4;
      const baseSteppe = SEA_LEVEL + slope;

      // Colinas: rolling hills suaves (±3-5 blocks, escala media)
      const colinas = this.hillNoise.fbm2D(x, z, 4, 0.45, 2.0, 0.003) * 5;

      // Cerros: cerros aislados medianos (10-25 blocks, escala grande)
      // Usar ridged noise para cimas redondeadas
      const cerroRaw = this.cerroNoise.fbm2D(x, z, 4, 0.5, 2.0, 0.0015);
      const cerroMask = Math.max(0, cerroRaw - 0.3) / 0.7; // Solo en zonas donde noise > 0.3
      const cerroRidge = 1 - Math.abs(this.cerroRidgeNoise.fbm2D(x, z, 2, 0.5, 2.0, 0.004));
      const cerros = cerroMask * cerroRidge * 22;

      // Sierras: grupos de cerros altos (30-60 blocks, escala muy grande)
      // Como Sierra de Tecka, Sierra del Bagual
      const sierraRaw = this.sierraNoise.fbm2D(x, z, 3, 0.5, 2.0, 0.0008);
      const sierraMask = Math.max(0, sierraRaw - 0.35) / 0.65; // Solo en zonas específicas
      const sierraRidge = 1 - Math.abs(this.sierraRidgeNoise.fbm2D(x * 1.5, z * 1.5, 3, 0.55, 2.2, 0.002));
      const sierras = sierraMask * sierraRidge * sierraRidge * 55;

      // Mesas: mesetas planas elevadas (típicas de Patagonia)
      // Plataformas con bordes pronunciados
      const mesaRaw = this.mesaNoise.fbm2D(x, z, 2, 0.5, 2.0, 0.0012);
      const mesaMask = mesaRaw > 0.45 ? 1 : 0;
      // Suavizar bordes de mesas
      const mesaEdge = Math.max(0, Math.min(1, (mesaRaw - 0.35) / 0.15));
      const mesas = mesaMask * mesaEdge * 18;

      // Combinar todo — steppe base + relieve escalonado
      const steppeHeight = baseSteppe + colinas + cerros + sierras + mesas;
      // Blend con max para no hundir la estepa
      height = Math.max(height, steppeHeight);
    }

    // ── Atlantic Coast transition (x: 1300 to 1800) ─────────
    // Gradual slope into the ocean
    if (x > this.geo.ATLANTIC_COAST_X - 100) {
      const coastDist = (x - this.geo.ATLANTIC_COAST_X + 100) / 500;
      const coastNoise = this.coastNoise.fbm2D(x, z, 2, 0.5, 2.0, 0.003) * 3;
      // Start above sea level, slope down into ocean
      const coastHeight = SEA_LEVEL + 6 - coastDist * 15 + coastNoise;
      // Blend: near coast, use coast height; far out, use ocean depth
      if (coastDist < 1.0) {
        height = Math.min(height, coastHeight);
        height = Math.max(height, SEA_LEVEL - 2); // Keep near-shore shallow
      } else {
        // Deep ocean
        height = SEA_LEVEL - 10 - (coastDist - 1) * 20 + coastNoise;
      }
    }

    // ── Pacific Coast (x: < -1800) ──────────────────────────
    // Gradual slope into the Pacific
    if (x < this.geo.ANDES_PEAK_X - 600) {
      const pacificDist = (this.geo.ANDES_PEAK_X - 600 - x) / 500;
      const pacificNoise = this.coastNoise.fbm2D(x + 9999, z, 2, 0.5, 2.0, 0.003) * 3;
      if (pacificDist > 1.0) {
        // Deep ocean
        height = SEA_LEVEL - 10 - (pacificDist - 1) * 20 + pacificNoise;
      } else {
        // Coastal shelf — slope down
        height = Math.min(height, SEA_LEVEL + 4 - pacificDist * 12 + pacificNoise);
      }
    }

    // ── Glacial lakes in Andean foothills ───────────────────
    // Only carve lakes where terrain is high enough to not go underwater
    const lakeN = this.lakeNoise.fbm2D(x, z, 2, 0.5, 2.0, 0.004);
    if (lakeN > 0.6 && x > this.geo.ANDES_PEAK_X && x < this.geo.ANDES_BASE_X + 600 && height > SEA_LEVEL + 15) {
      const lakeDepth = (lakeN - 0.6) * 15;
      height -= lakeDepth;
      height = Math.max(SEA_LEVEL + 2, height); // Lakes are shallow, above sea level
    }

    // ── Southern ice fields (glaciers) ──────────────────────
    if (latNorm > 0.65) {
      const glacierN = this.glacierNoise.fbm2D(x, z, 3, 0.5, 2.0, 0.002);
      const glacierIntensity = (latNorm - 0.65) / 0.35;
      if (glacierN > 0.3 && height > SEA_LEVEL + 10) {
        // Ice fields are flat and high
        const glacierHeight = SEA_LEVEL + 25 + glacierN * 25;
        height = height * (1 - glacierIntensity * 0.7) + glacierHeight * (glacierIntensity * 0.7);
      }
    }

    // ── Clamp ───────────────────────────────────────────────
    height = Math.max(1, Math.min(height, SEA_LEVEL + 200));

    this._heightCache.set(key, height);
    return height;
  }

  // ── Biome selection: Patagonia-specific ──────────────────
  getBiome(x, z) {
    const key = Math.floor(x) * 100000 + Math.floor(z);
    if (this._biomeCache.has(key)) return this._biomeCache.get(key);

    const height = this.getHeight(x, z);
    const temp = this.getTemperature(x, z);
    const humid = this.getHumidity(x, z);
    const latNorm = (z - this.geo.NORTH_Z) / (this.geo.SOUTH_Z - this.geo.NORTH_Z);

    let biome;

    // ── Ocean biomes ────────────────────────────────────────
    if (height < SEA_LEVEL - 15) {
      biome = BIOMES.DEEP_OCEAN;
    } else if (height < SEA_LEVEL) {
      // Frozen ocean in the south
      biome = latNorm > 0.7 ? BIOMES.SNOWY_PLAINS : BIOMES.OCEAN;
    }
    // ── Beach / coast ───────────────────────────────────────
    else if (height < SEA_LEVEL + 3) {
      biome = BIOMES.BEACH;
    }
    // ── High mountains (Andes + Sierras) ─────────────────────
    else if (height > SEA_LEVEL + 80) {
      if (temp < -0.1) biome = BIOMES.SNOWY_PEAKS;
      else if (height > SEA_LEVEL + 110) biome = BIOMES.STONY_PEAKS;
      else biome = BIOMES.MOUNTAINS;
    }
    // ── Mid-elevation: cerros and sierra slopes ─────────────
    else if (height > SEA_LEVEL + 35) {
      if (temp < 0.0) biome = BIOMES.SNOWY_PLAINS;
      else if (humid > 0.4) biome = BIOMES.FOREST;
      else biome = BIOMES.MEADOW;
    }
    // ── Colinas: low hills above plains ──────────────────────
    else if (height > SEA_LEVEL + 18) {
      if (temp < 0.0) biome = BIOMES.SNOWY_PLAINS;
      else if (humid > 0.35) biome = BIOMES.FOREST;
      else if (humid > 0.0) biome = BIOMES.MEADOW;
      else biome = BIOMES.SAVANNA; // Dry hills stay as pampa
    }
    // ── Northern Patagonia (43°S - 47°S) ────────────────────
    else if (latNorm < 0.35) {
      if (x < this.geo.ANDES_BASE_X) {
        // Pacific coast — Valdivian temperate rainforest
        biome = humid > 0.5 ? BIOMES.FOREST : BIOMES.JUNGLE;
      } else if (x < this.geo.ANDES_BASE_X + 400) {
        // Andean foothills — Nothofagus forest
        biome = BIOMES.FOREST;
      } else {
        // Transition steppe — pampa seca or plains
        biome = humid > -0.1 ? BIOMES.PLAINS : BIOMES.SAVANNA;
      }
    }
    // ── Central Patagonia (47°S - 52°S) ─────────────────────
    else if (latNorm < 0.65) {
      if (x < this.geo.ANDES_BASE_X) {
        // Pacific fjords — Magellanic forest
        biome = BIOMES.TAIGA;
      } else if (x < this.geo.ANDES_BASE_X + 400) {
        // Foothills — Lenga/Ñire forest
        biome = temp < 0.1 ? BIOMES.TAIGA : BIOMES.FOREST;
      } else if (x < this.geo.ATLANTIC_COAST_X) {
        // Steppe — arid plains or pampa seca
        biome = humid < -0.2 ? BIOMES.DESERT : (humid < 0.0 ? BIOMES.SAVANNA : BIOMES.PLAINS);
      } else {
        // Atlantic coast
        biome = BIOMES.BEACH;
      }
    }
    // ── Southern Patagonia (52°S - 56°S) ────────────────────
    else {
      if (x < this.geo.ANDES_BASE_X) {
        // Pacific — sub-Antarctic tundra
        biome = BIOMES.AURORA_TUNDRA;
      } else if (x < this.geo.ANDES_BASE_X + 300) {
        // Foothills — Magellanic tundra
        biome = BIOMES.SNOWY_PLAINS;
      } else {
        // Southern steppe / tundra
        biome = temp < -0.2 ? BIOMES.SNOWY_PLAINS : BIOMES.PLAINS;
      }
    }

    // ── Special: Rivers (glacial meltwater) ─────────────────
    // Rivers flow from Andes eastward through the steppe
    const riverN = this.lakeNoise.fbm2D(x + 7777, z, 2, 0.5, 2.0, 0.001);
    if (riverN > 0.62 && x > this.geo.ANDES_BASE_X && x < this.geo.ATLANTIC_COAST_X && height > SEA_LEVEL && height < SEA_LEVEL + 20) {
      biome = BIOMES.RIVER;
    }

    // ── Special: Autumn forest (Ñire forests in fall) ───────
    if (biome === BIOMES.FOREST && latNorm > 0.2 && latNorm < 0.6 && humid > 0.3 && humid < 0.55) {
      const autumnN = this.windNoise.noise2D(x * 0.003, z * 0.003);
      if (autumnN < -0.2) biome = BIOMES.AUTUMN_FOREST;
    }

    // ── Special: Cherry grove (Lenga forests with red foliage) ──
    if (biome === BIOMES.TAIGA && latNorm > 0.3 && latNorm < 0.55 && humid > 0.4) {
      const lengaN = this.windNoise.noise2D(x * 0.005, z * 0.005);
      if (lengaN > 0.3) biome = BIOMES.CHERRY_GROVE;
    }

    // ── Special: Zen garden (scenic viewpoints) ─────────────
    if (biome === BIOMES.MEADOW && height > SEA_LEVEL + 30 && height < SEA_LEVEL + 50) {
      const zenN = this.windNoise.noise2D(x * 0.008, z * 0.008);
      if (zenN > 0.55) biome = BIOMES.ZEN_GARDEN;
    }

    // ── Special: Aurora tundra (far south, clear nights) ────
    if (biome === BIOMES.SNOWY_PLAINS && latNorm > 0.75) {
      const auroraN = this.glacierNoise.noise2D(x * 0.01, z * 0.01);
      if (auroraN > 0.3) biome = BIOMES.AURORA_TUNDRA;
    }

    // ── Special: Swamp (wetlands in steppe depressions) ─────
    if (biome === BIOMES.PLAINS && humid > 0.3 && height < SEA_LEVEL + 8) {
      biome = BIOMES.SWAMP;
    }

    this._biomeCache.set(key, biome);
    return biome;
  }

  // ── Get spawn point: central steppe with Andes view to the west ─
  getSpawnPoint() {
    return {
      x: 200,   // Central steppe — flat, well above sea level
      y: SEA_LEVEL + 20,
      z: -400,  // Northern Patagonia (calmer weather)
    };
  }

  // ── Get surface block override for Patagonia biomes ──────
  getSurfaceBlock(biome, y) {
    switch (biome) {
      case BIOMES.DESERT: return 'coarse_dirt'; // Arid steppe
      case BIOMES.SAVANNA: return 'grass'; // Dry pampa — grass with arid tint
      case BIOMES.MEADOW: return 'grass';
      case BIOMES.SNOWY_PLAINS:
      case BIOMES.SNOWY_PEAKS: return 'snow';
      case BIOMES.AURORA_TUNDRA: return 'snow';
      case BIOMES.STONY_PEAKS: return 'calcite'; // Rocky Andean summits
      case BIOMES.MOUNTAINS: return 'stone';
      case BIOMES.TAIGA: return 'grass'; // Magellanic forest floor
      case BIOMES.CHERRY_GROVE: return 'grass'; // Lenga forest floor
      case BIOMES.AUTUMN_FOREST: return 'grass'; // Ñire forest floor
      case BIOMES.SWAMP: return 'mud'; // Wetland
      case BIOMES.RIVER: return 'sand'; // Glacial river bed
      case BIOMES.ZEN_GARDEN: return 'sand'; // Scenic viewpoint
      default: return 'grass';
    }
  }

  // ── Clear caches ─────────────────────────────────────────
  clearCache() {
    this._heightCache.clear();
    this._biomeCache.clear();
    this._tempCache.clear();
    this._humidCache.clear();
  }

  // ── Get world info for UI display ────────────────────────
  getWorldInfo() {
    return {
      name: 'Patagonia',
      region: '43°S - 56°S · Chile & Argentina',
      seed: this.seed,
      climate: 'Temperate to Sub-Antarctic',
      features: [
        'Cordillera de los Andes',
        'Estepa Patagónica',
        'Campos de Hielo Sur',
        'Bosques Subantárticos',
        'Tierra del Fuego',
        'Lagos Glaciares',
      ],
    };
  }
}

// ═══════════════════════════════════════════════════════════
// Shared function: apply Patagonia patches to a WorldGenPipeline
// Used by both main thread and Web Worker
// ═══════════════════════════════════════════════════════════
export function applyPatagoniaToGenerator(gen, pat) {
  gen.cacheSize = 1200000;
  gen._heightCache = new Map();
  gen._heightCache.maxSize = 800000;
  gen.getBaseHeight = (x, z) => pat.getHeight(x, z);
  gen.getBiome = (x, z) => pat.getBiome(x, z);
  gen.getTemperature = (x, z) => pat.getTemperature(x, z);
  gen.getHumidity = (x, z) => pat.getHumidity(x, z);
  gen.getSurfaceBlock = (biome, y) => pat.getSurfaceBlock(biome, y);
  gen.getSubsurfaceBlock = (biome, y, surfaceY) => {
    const depth = surfaceY - y;
    if (depth <= 0) return pat.getSurfaceBlock(biome, y);
    if (depth <= 3) return 'dirt';
    if (biome === BIOMES.DESERT || biome === BIOMES.BEACH) return depth <= 3 ? 'sand' : 'sandstone';
    if (biome === BIOMES.STONY_PEAKS || biome === BIOMES.MOUNTAINS) return 'stone';
    if (biome === BIOMES.SNOWY_PLAINS || biome === BIOMES.SNOWY_PEAKS || biome === BIOMES.AURORA_TUNDRA) return depth <= 2 ? 'snow_block' : 'stone';
    if (biome === BIOMES.SWAMP) return depth <= 2 ? 'mud' : 'dirt';
    if (biome === BIOMES.SAVANNA) return depth <= 3 ? 'dirt' : 'stone';
    return depth <= 3 ? 'dirt' : 'stone';
  };
  gen.getDensity = (x, y, z) => {
    const key = gen._cacheKey(x, y, z);
    if (gen.cache.has(key)) return gen.cache.get(key);
    const baseHeight = gen.getBaseHeight(x, z);
    const heightBias = (baseHeight - y) * 0.12;
    const noise3D = gen.densityNoise.fbm3D(x, y, z, 2, 0.4, 2.0, 0.006) * 0.3;
    let density = noise3D + heightBias;
    if (y < SEA_LEVEL - 10 && y > WORLD_MIN_Y + 10) {
      const cheese = gen.cheeseNoise.fbm3D(x, y, z, 2, 0.5, 2.0, 0.015);
      if (cheese > 0.75) density = -1;
      const spaghetti = gen.spaghettiNoise.fbm3D(x, y, z, 2, 0.5, 2.0, 0.04);
      if (Math.abs(spaghetti) < 0.06) density = -1;
    }
    if (gen.cache.size > gen.cacheSize) {
      const firstKey = gen.cache.keys().next().value;
      gen.cache.delete(firstKey);
    }
    gen.cache.set(key, density);
    return density;
  };
  gen.applyCaves = (x, y, z, density) => density;
}
