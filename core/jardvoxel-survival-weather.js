// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Weather System
// SPEC-044: Weather System (rain/snow/lightning)
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';
import { BIOMES } from './jardvoxel-survival-engine.js';
import { SimplexNoise } from './jardvoxel-survival-noise.js';
import { HydrologySystem } from './jardvoxel-survival-hydrology.js';

const WEATHER = {
  CLEAR: 'clear',
  RAIN: 'rain',
  SNOW: 'snow',
  THUNDER: 'thunder',
};

// ═══════════════════════════════════════════════════════════
// PRD P-03: Procedural Climate System
// Deterministic weather based on wind, rain shadow, ocean proximity,
// altitude, and seasons — replaces Math.random() in _pickWeather()
// ═══════════════════════════════════════════════════════════

const SEASONS = {
  SPRING: 0,
  SUMMER: 1,
  AUTUMN: 2,
  WINTER: 3,
};

export class ProceduralClimateSystem {
  constructor(seed) {
    this.seed = seed;
    this._windNoise = new SimplexNoise(seed + 7777);
    this._moistureNoise = new SimplexNoise(seed + 5555);
    this._tempNoise = new SimplexNoise(seed + 3333);
    this._seasonNoise = new SimplexNoise(seed + 9999);
    this._hydrology = new HydrologySystem(seed);

    // Dominant wind direction per continent (deterministic)
    this._windDirections = [];
    const prng = new _ClimateRNG(seed + 8888);
    for (let i = 0; i < 10; i++) {
      this._windDirections.push({
        angle: prng.next() * Math.PI * 2,
        strength: 0.5 + prng.next() * 0.5,
      });
    }

    // Season state (advanced by dayNight cycle)
    this._seasonProgress = 0; // 0-1 over a full year
    this._currentSeason = SEASONS.SPRING;
  }

  // Update season from dayNight time (assumes 1 day = 1/365 year)
  updateSeasons(dayTime) {
    // dayTime is 0-1 representing time of day; we use accumulated time externally
    // This method is called with the fractional year progress
    this._seasonProgress = (this._seasonProgress + 0.0001) % 1;
    this._currentSeason = Math.floor(this._seasonProgress * 4) % 4;
  }

  // Advance season by a delta (called from WeatherManager.update)
  advanceSeason(dt) {
    // 20 min day cycle → 1 day. 365 days = ~122 hours. dt in seconds.
    // One full year = 365 * 1200 seconds. seasonProgress += dt / (365 * 1200)
    this._seasonProgress = (this._seasonProgress + dt / (365 * 1200)) % 1;
    this._currentSeason = Math.floor(this._seasonProgress * 4) % 4;
  }

  getSeason() {
    return this._currentSeason;
  }

  getSeasonName() {
    return ['spring', 'summer', 'autumn', 'winter'][this._currentSeason];
  }

  // Get wind direction at a position (deterministic + seasonal variation)
  getWindDirection(x, z) {
    const continentIdx = Math.floor(this._windNoise.noise2D(x * 0.0001, z * 0.0001) * 5 + 5) % 10;
    const base = this._windDirections[continentIdx];
    // Seasonal variation: shift wind angle by up to ±30°
    const seasonShift = Math.sin(this._seasonProgress * Math.PI * 2) * 0.5;
    const angle = base.angle + seasonShift;
    return {
      x: Math.cos(angle) * base.strength,
      z: Math.sin(angle) * base.strength,
      angle,
      strength: base.strength,
    };
  }

  // Get ocean proximity factor (0 = far from ocean, 1 = at coast)
  getOceanProximity(x, z, world) {
    if (!world || !world.generator) return 0.5;
    // Use getContinentalness from WorldGenPipeline (or getContinentValue from hierarchy)
    let contValue;
    if (world.generator.hierarchy && world.generator.hierarchy.world) {
      contValue = world.generator.hierarchy.world.getContinentValue(x, z);
    } else if (world.generator.getContinentalness) {
      contValue = world.generator.getContinentalness(x, z);
    } else {
      return 0.5;
    }
    const threshold = (world.generator.hierarchy?.world?.continentThreshold) || 0.3;
    if (contValue < 0) return 1.0; // In ocean
    const distFromCoast = Math.abs(contValue - threshold);
    return Math.max(0, 1 - distFromCoast * 3);
  }

  // Get altitude temperature factor (higher = colder)
  getAltitudeFactor(x, z, world) {
    if (!world || !world.generator) return 0;
    const baseHeight = world.generator.getBaseHeight(x, z);
    const seaLevel = 63;
    // -0.6°C per 100 blocks → normalize to 0-1 range (1 = very cold)
    const altitudeAboveSea = Math.max(0, baseHeight - seaLevel);
    return Math.min(1, altitudeAboveSea / 150);
  }

  // Get rain shadow effect (windward = wet, leeward = dry)
  getRainShadow(x, z, world) {
    const wind = this.getWindDirection(x, z);
    if (!world || !world.generator) return 0.5;

    // Sample terrain height upwind and downwind
    const upwindX = x - wind.x * 50;
    const upwindZ = z - wind.z * 50;
    const downwindX = x + wind.x * 50;
    const downwindZ = z + wind.z * 50;

    const localHeight = world.generator.getBaseHeight(x, z);
    const upwindHeight = world.generator.getBaseHeight(upwindX, upwindZ);
    const downwindHeight = world.generator.getBaseHeight(downwindX, downwindZ);

    // If terrain rises upwind (mountains blocking wind), we're in rain shadow (dry)
    // If terrain falls upwind, we're on windward side (wet)
    const upwindRise = upwindHeight - localHeight;
    if (upwindRise > 20) {
      // Mountains upwind → rain shadow (dry)
      return Math.max(0, 1 - upwindRise / 100);
    }
    // No significant barrier upwind → normal moisture
    return 0.5 + Math.max(0, -upwindRise / 100) * 0.3;
  }

  // Get season modifier for weather
  getSeasonModifier() {
    switch (this._currentSeason) {
      case SEASONS.SPRING: return { rainBoost: 0.15, snowBoost: -0.1, tempShift: 0 };
      case SEASONS.SUMMER: return { rainBoost: -0.1, snowBoost: -0.2, tempShift: 0.15 };
      case SEASONS.AUTUMN: return { rainBoost: 0.05, snowBoost: 0, tempShift: -0.05 };
      case SEASONS.WINTER: return { rainBoost: -0.05, snowBoost: 0.25, tempShift: -0.2 };
      default: return { rainBoost: 0, snowBoost: 0, tempShift: 0 };
    }
  }

  // Main method: get deterministic weather at a position
  getWeather(x, z, world, biome) {
    const wind = this.getWindDirection(x, z);
    const oceanProx = this.getOceanProximity(x, z, world);
    const altitude = this.getAltitudeFactor(x, z, world);
    const rainShadow = this.getRainShadow(x, z, world);
    const season = this.getSeasonModifier();
    const moisture = this._hydrology.getMoisture(x, z);

    // Base humidity from ocean proximity + moisture noise + rain shadow
    let humidity = oceanProx * 0.4 + moisture * 0.3 + rainShadow * 0.3;
    humidity = Math.max(0, Math.min(1, humidity + season.rainBoost));

    // Temperature from altitude + season + latitude (simplified)
    let temperature = 1 - altitude * 0.8 + season.tempShift;
    temperature = Math.max(0, Math.min(1, temperature));

    // Weather intensity
    const intensity = humidity * (0.5 + Math.abs(wind.strength) * 0.5);

    // Determine weather type
    let weatherType = WEATHER.CLEAR;
    let duration = 60 + Math.floor(intensity * 120);

    // Snow at high altitude or cold temperature
    if (temperature < 0.25 || altitude > 0.7) {
      weatherType = WEATHER.SNOW;
      duration = 90 + Math.floor(intensity * 150);
    }
    // Rain in humid, temperate areas
    else if (humidity > 0.55) {
      weatherType = WEATHER.RAIN;
      duration = 60 + Math.floor(intensity * 120);
    }
    // Thunder in very humid + warm areas
    else if (humidity > 0.75 && temperature > 0.5) {
      weatherType = WEATHER.THUNDER;
      duration = 45 + Math.floor(intensity * 90);
    }
    // Dry areas = clear
    else if (humidity < 0.2) {
      weatherType = WEATHER.CLEAR;
      duration = 120 + Math.floor((1 - humidity) * 180);
    }
    // Moderate humidity: mostly clear with occasional rain
    else if (humidity > 0.4 && this._moistureNoise.noise2D(x * 0.001, z * 0.001) > 0.3) {
      weatherType = WEATHER.RAIN;
      duration = 45 + Math.floor(intensity * 60);
    }

    // Winter reduces rain, increases snow even at moderate altitude
    if (season.snowBoost > 0 && altitude > 0.3 && weatherType === WEATHER.RAIN) {
      weatherType = WEATHER.SNOW;
    }

    return {
      type: weatherType,
      intensity: Math.max(0.1, Math.min(1, intensity)),
      duration,
      humidity,
      temperature,
      wind: { x: wind.x, z: wind.z, strength: wind.strength },
      season: this.getSeasonName(),
    };
  }
}

// Small deterministic PRNG for climate initialization
class _ClimateRNG {
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
// WeatherManager — now with procedural climate integration
// ═══════════════════════════════════════════════════════════

export class WeatherManager {
  constructor(scene, dayNight, seed = 42) {
    this.scene = scene;
    this.dayNight = dayNight;
    this.currentWeather = WEATHER.CLEAR;
    this.weatherTimer = 0;
    this.nextWeatherCheck = 120; // check every 2 min
    this.minWeatherDuration = 60;
    this.maxWeatherDuration = 300;
    this.lightningTimer = 0;
    this.lightningFlash = null;
    this.particleSystem = null;
    this.maxParticles = 800;
    this.particleVelocity = null;
    this.snowBiomes = new Set([BIOMES.SNOWY_PLAINS, BIOMES.SNOWY_PEAKS, BIOMES.TAIGA]);
    this.fogBackup = null;
    this.bgBackup = null;

    // PRD P-03: Procedural climate system
    this._climate = new ProceduralClimateSystem(seed);
    this._useProceduralClimate = true;
    this._lastWeatherPos = { x: 0, z: 0 };
    this._weatherIntensity = 1;
  }

  _getPlayerBiome(playerPos, world) {
    if (!world || !world.generator) return BIOMES.PLAINS;
    return world.generator.getBiome(Math.floor(playerPos.x), Math.floor(playerPos.z));
  }

  _pickWeather(playerPos, world) {
    const x = Math.floor(playerPos.x);
    const z = Math.floor(playerPos.z);
    const biome = this._getPlayerBiome(playerPos, world);

    if (!this._useProceduralClimate) {
      const r = Math.random();
      if (this.snowBiomes.has(biome)) return r < 0.6 ? WEATHER.SNOW : WEATHER.CLEAR;
      if (r < 0.7) return WEATHER.CLEAR;
      if (r < 0.85) return WEATHER.RAIN;
      return WEATHER.THUNDER;
    }

    // PRD P-03: Use procedural climate system instead of Math.random()
    const climateData = this._climate.getWeather(x, z, world, biome);
    this._weatherIntensity = climateData.intensity;
    this._lastWeatherPos = { x, z };

    // Biome override: snow biomes always lean toward snow
    if (this.snowBiomes.has(biome) && climateData.type === WEATHER.RAIN) {
      return WEATHER.SNOW;
    }

    return climateData.type;
  }

  setWeather(weather, playerPos, world) {
    this._setWeather(weather, playerPos, world);
  }

  _setWeather(weather, playerPos, world) {
    this.currentWeather = weather;

    // PRD P-03: Use climate-based duration instead of Math.random()
    let duration = this.minWeatherDuration;
    if (world && this._climate) {
      const climateData = this._climate.getWeather(
        Math.floor(playerPos.x), Math.floor(playerPos.z), world,
        this._getPlayerBiome(playerPos, world)
      );
      duration = climateData.duration;
    } else {
      duration = this.minWeatherDuration +
        Math.random() * (this.maxWeatherDuration - this.minWeatherDuration);
    }
    this.weatherTimer = duration;

    // SPEC-075 Bug #11: Smooth weather transitions via lerp
    // Store target colors for gradual transition in update()
    const weatherColors = {
      clear:   { bg: 0xA8C8E0, fog: 0xA8C8E0, fogNear: 30, fogFar: 55 },
      rain:    { bg: 0x6a7a8a, fog: 0x6a7a8a, fogNear: 20, fogFar: 40 },
      snow:    { bg: 0xaab0b8, fog: 0xaab0b8, fogNear: 25, fogFar: 45 },
      thunder: { bg: 0x3a3a4a, fog: 0x3a3a4a, fogNear: 15, fogFar: 35 },
    };
    const cfg = weatherColors[weather] || weatherColors.clear;
    this._targetBgColor = new THREE.Color(cfg.bg);
    this._targetFogColor = new THREE.Color(cfg.fog);
    this._targetFogNear = cfg.fogNear;
    this._targetFogFar = cfg.fogFar;
    this._weatherTransitionTime = 0;
    this._weatherTransitionDuration = 3.0; // 3 second fade

    // Particles change immediately (visual feedback)
    if (weather === WEATHER.CLEAR) {
      this._clearParticles();
    } else if (weather === WEATHER.RAIN) {
      this._initRainParticles();
    } else if (weather === WEATHER.SNOW) {
      this._initSnowParticles();
    } else if (weather === WEATHER.THUNDER) {
      this._initRainParticles();
      this.lightningTimer = 5 + Math.random() * 10;
    }
  }

  _initRainParticles() {
    this._clearParticles();
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxParticles * 3);
    const velocities = new Float32Array(this.maxParticles * 3);
    for (let i = 0; i < this.maxParticles; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      velocities[i * 3] = -0.5;
      velocities[i * 3 + 1] = -20 - Math.random() * 10;
      velocities[i * 3 + 2] = 0;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleVelocity = velocities;
    const mat = new THREE.PointsMaterial({
      color: 0x8899aa,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
    });
    this.particleSystem = new THREE.Points(geo, mat);
    this.particleSystem.frustumCulled = false;
    this.scene.add(this.particleSystem);
  }

  _initSnowParticles() {
    this._clearParticles();
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxParticles * 3);
    const velocities = new Float32Array(this.maxParticles * 3);
    for (let i = 0; i < this.maxParticles; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      velocities[i * 3] = (Math.random() - 0.5) * 2;
      velocities[i * 3 + 1] = -3 - Math.random() * 2;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleVelocity = velocities;
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      transparent: true,
      opacity: 0.8,
    });
    this.particleSystem = new THREE.Points(geo, mat);
    this.particleSystem.frustumCulled = false;
    this.scene.add(this.particleSystem);
  }

  _clearParticles() {
    if (this.particleSystem) {
      this.scene.remove(this.particleSystem);
      this.particleSystem.geometry.dispose();
      this.particleSystem.material.dispose();
      this.particleSystem = null;
      this.particleVelocity = null;
    }
    if (this.lightningFlash) {
      this.scene.remove(this.lightningFlash);
      this.lightningFlash = null;
    }
  }

  _updateParticles(dt, playerPos) {
    if (!this.particleSystem || !this.particleVelocity) return;
    const positions = this.particleSystem.geometry.attributes.position.array;
    for (let i = 0; i < this.maxParticles; i++) {
      positions[i * 3] += this.particleVelocity[i * 3] * dt;
      positions[i * 3 + 1] += this.particleVelocity[i * 3 + 1] * dt;
      positions[i * 3 + 2] += this.particleVelocity[i * 3 + 2] * dt;

      // Reset particle if below ground or too far
      if (positions[i * 3 + 1] < playerPos.y - 10) {
        positions[i * 3] = playerPos.x + (Math.random() - 0.5) * 60;
        positions[i * 3 + 1] = playerPos.y + 30 + Math.random() * 10;
        positions[i * 3 + 2] = playerPos.z + (Math.random() - 0.5) * 60;
      }
    }
    this.particleSystem.geometry.attributes.position.needsUpdate = true;
    // Follow player
    this.particleSystem.position.set(0, 0, 0);
  }

  _triggerLightning() {
    // Flash effect
    if (!this.lightningFlash) {
      this.lightningFlash = new THREE.AmbientLight(0xffffff, 2.0);
      this.scene.add(this.lightningFlash);
      setTimeout(() => {
        if (this.lightningFlash) {
          this.scene.remove(this.lightningFlash);
          this.lightningFlash = null;
        }
      }, 150);
      // Second flash
      setTimeout(() => {
        if (this.currentWeather === WEATHER.THUNDER) {
          this.lightningFlash = new THREE.AmbientLight(0xffffff, 1.5);
          this.scene.add(this.lightningFlash);
          setTimeout(() => {
            if (this.lightningFlash) {
              this.scene.remove(this.lightningFlash);
              this.lightningFlash = null;
            }
          }, 100);
        }
      }, 300);
    }
    // Schedule next lightning
    this.lightningTimer = 8 + Math.random() * 20;
  }

  update(dt, playerPos, world) {
    // PRD P-03: Advance seasons
    this._climate.advanceSeason(dt);
    this.weatherTimer -= dt;
    this.nextWeatherCheck -= dt;

    // SPEC-075 Bug #11: Smooth weather color/fog transition
    if (this._targetBgColor && this._weatherTransitionTime < this._weatherTransitionDuration) {
      this._weatherTransitionTime += dt;
      const t = Math.min(1, this._weatherTransitionTime / this._weatherTransitionDuration);
      // Lerp background color
      if (this.scene.background) {
        this.scene.background.lerp(this._targetBgColor, t * 0.1);
      } else {
        this.scene.background = this._targetBgColor.clone();
      }
      // Lerp fog
      if (this.scene.fog) {
        this.scene.fog.color.lerp(this._targetFogColor, t * 0.1);
        this.scene.fog.near += (this._targetFogNear - this.scene.fog.near) * t * 0.1;
        this.scene.fog.far += (this._targetFogFar - this.scene.fog.far) * t * 0.1;
      }
    }

    // Weather transition
    if (this.weatherTimer <= 0) {
      const newWeather = this._pickWeather(playerPos, world);
      if (newWeather !== this.currentWeather) {
        this._setWeather(newWeather, playerPos, world);
      } else {
        this.weatherTimer = this.minWeatherDuration +
          Math.random() * (this.maxWeatherDuration - this.minWeatherDuration);
      }
    }

    // Update particles
    this._updateParticles(dt, playerPos);

    // Lightning during thunder
    if (this.currentWeather === WEATHER.THUNDER) {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this._triggerLightning();
      }
    }
  }

  getCurrentWeather() {
    return this.currentWeather;
  }

  isRaining() {
    return this.currentWeather === WEATHER.RAIN || this.currentWeather === WEATHER.THUNDER;
  }

  isSnowing() {
    return this.currentWeather === WEATHER.SNOW;
  }

  isThundering() {
    return this.currentWeather === WEATHER.THUNDER;
  }

  serialize() {
    return {
      currentWeather: this.currentWeather,
      weatherTimer: this.weatherTimer,
    };
  }

  deserialize(data, playerPos, world) {
    if (!data) return;
    this._setWeather(data.currentWeather, playerPos, world);
    this.weatherTimer = data.weatherTimer || 60;
  }

  dispose() {
    this._clearParticles();
  }
}

export { WEATHER };
