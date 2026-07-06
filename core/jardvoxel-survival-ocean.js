// ═══════════════════════════════════════════════════════════
// JardVoxel 9.0 — Ocean as Transition Space
// SPEC-112: OceanSystem
// Makes ocean between islands a meaningful transition zone
// ═══════════════════════════════════════════════════════════

// Marine life configs per ocean character
const MARINE_LIFE = {
  calm: {
    birds: { type: 'seabird', count: 8, geometry: 'v_shape' },
    creatures: [{ type: 'dolphin', count: 2, geometry: 'simple_geo' }],
    nightOnly: [],
  },
  mystical: {
    birds: { type: 'seabird', count: 6, geometry: 'v_shape' },
    creatures: [{ type: 'sea_turtle', count: 3, geometry: 'simple_geo' }],
    nightOnly: [{ type: 'bioluminescent_plankton', count: 50 }],
  },
  tempestuous: {
    birds: { type: 'storm_petrel', count: 10, geometry: 'v_shape' },
    creatures: [],
    nightOnly: [],
    effects: ['lightning_flashes'],
  },
  frozen: {
    birds: { type: 'penguin', count: 12, geometry: 'simple_geo' },
    creatures: [{ type: 'seal', count: 4, geometry: 'simple_geo' }],
    nightOnly: [],
    effects: ['aurora_borealis'],
  },
};

// Ocean particle configs (use existing AmbientParticleSystem infrastructure)
const OCEAN_PARTICLES = {
  mist_spray: {
    color: 0xC8D8E0,
    size: 0.15,
    gravity: 0.3,
    windFactor: 1.0,
    count: 40,
    nightOnly: false,
    dayOnly: false,
    oceanCharacter: 'tempestuous',
  },
  bioluminescence_ocean: {
    color: 0x40FFC8,
    size: 0.12,
    gravity: 0.0,
    windFactor: 0.1,
    count: 60,
    nightOnly: true,
    dayOnly: false,
    oceanCharacter: 'mystical',
  },
  ice_floe: {
    color: 0xF0F8FF,
    size: 0.4,
    gravity: 0.0,
    windFactor: 0.3,
    count: 30,
    nightOnly: false,
    dayOnly: false,
    oceanCharacter: 'frozen',
  },
  ocean_dust: {
    color: 0xE8E0D0,
    size: 0.2,
    gravity: 0.01,
    windFactor: 0.2,
    count: 35,
    nightOnly: false,
    dayOnly: true,
    oceanCharacter: 'calm',
  },
};

// Music state configs for ocean
const OCEAN_MUSIC_STATES = {
  calm_sea: {
    bpm: 28,
    scale: 'lydian',
    layers: ['drone', 'melody'],
    droneRoot: 0,
    filterFreq: 1800,
    waveAmbiance: true,
  },
  discovery: {
    bpm: 34,
    scale: 'lydian',
    layers: ['drone', 'melody'],
    droneRoot: 0,
    filterFreq: 2400,
    risingMelody: true,
  },
};

export class OceanSystem {
  constructor(archipelago, scene = null) {
    this.archipelago = archipelago;
    this.scene = scene;
    this._enabled = false;
    this._activeParticles = new Map();
    this._activeMarineLife = [];
    this._currentMusicState = null;
    this._lastShoreProximity = 0;
    this._timeOfDay = 0;
    this._lightningTimer = 0;
    this._auroraPhase = 0;
  }

  // Main update loop — called every frame
  update(playerX, playerZ, dt, timeOfDay) {
    this._timeOfDay = timeOfDay;

    const oceanProps = this.archipelago.getOceanProperties(playerX, playerZ);
    const onLand = oceanProps.shoreProximity >= 1.0;

    if (onLand) {
      this._disableEffects();
      return;
    }

    this._enabled = true;
    const character = oceanProps.character;
    const shoreProx = oceanProps.shoreProximity;

    // Update particles based on ocean character
    this._updateParticles(character, timeOfDay, shoreProx);

    // Update marine life
    this._updateMarineLife(character, dt, shoreProx);

    // Update fog
    this._updateFog(shoreProx, character);

    // Update music state
    this._updateMusic(shoreProx, timeOfDay, character);

    // Update ocean currents (visual)
    this._updateCurrents(oceanProps.currentDirection, oceanProps.currentStrength);

    // Special effects
    if (character === 'tempestuous') {
      this._updateLightning(dt);
    }
    if (character === 'frozen') {
      this._updateAurora(dt, timeOfDay);
    }

    this._lastShoreProximity = shoreProx;
  }

  _disableEffects() {
    if (!this._enabled) return;
    this._enabled = false;
    // Despawn marine life
    this._activeMarineLife = [];
    // Clear particles
    this._activeParticles.clear();
  }

  _updateParticles(character, timeOfDay, shoreProx) {
    const isNight = timeOfDay > 0.75 || timeOfDay < 0.20;
    const isDay = !isNight;

    for (const [name, config] of Object.entries(OCEAN_PARTICLES)) {
      if (config.oceanCharacter !== character) {
        this._activeParticles.delete(name);
        continue;
      }
      if (config.nightOnly && !isNight) {
        this._activeParticles.delete(name);
        continue;
      }
      if (config.dayOnly && !isDay) {
        this._activeParticles.delete(name);
        continue;
      }

      // Scale count by shore proximity (fewer particles near shore)
      const scaledCount = Math.floor(config.count * (1.0 - shoreProx * 0.5));
      this._activeParticles.set(name, { ...config, count: scaledCount });
    }
  }

  _updateMarineLife(character, dt, shoreProx) {
    const config = MARINE_LIFE[character];
    if (!config) return;

    // Only spawn marine life in open ocean (not near shore)
    if (shoreProx > 0.5) {
      this._activeMarineLife = [];
      return;
    }

    this._activeMarineLife = [];

    // Birds
    if (config.birds) {
      this._activeMarineLife.push({
        type: config.birds.type,
        count: config.birds.count,
        geometry: config.birds.geometry,
        instanced: true,
      });
    }

    // Creatures
    for (const creature of config.creatures) {
      this._activeMarineLife.push({
        type: creature.type,
        count: creature.count,
        geometry: creature.geometry,
        instanced: false,
      });
    }

    // Night-only creatures
    const isNight = this._timeOfDay > 0.75 || this._timeOfDay < 0.20;
    if (isNight && config.nightOnly) {
      for (const nocturnal of config.nightOnly) {
        this._activeMarineLife.push({
          type: nocturnal.type,
          count: nocturnal.count,
          geometry: 'particle',
          instanced: false,
        });
      }
    }
  }

  _updateFog(shoreProx, character) {
    // Ocean fog density: +30% vs default when in open ocean
    // Fog thins as shoreProximity increases
    const oceanDensityMod = 1.3 - shoreProx * 0.3; // 1.3 at open ocean, 1.0 at shore

    // Fog color shifts toward ocean character
    let fogColorShift = 0;
    if (character === 'mystical') fogColorShift = -0.05; // cooler
    else if (character === 'calm') fogColorShift = 0.05; // warmer
    else if (character === 'frozen') fogColorShift = 0.02; // slightly cooler
    else if (character === 'tempestuous') fogColorShift = -0.02;

    this._fogDensityMod = oceanDensityMod;
    this._fogColorShift = fogColorShift;
  }

  _updateMusic(shoreProx, timeOfDay, character) {
    const isNight = timeOfDay > 0.75 || timeOfDay < 0.20;
    let targetState = null;

    if (shoreProx > 0.8) {
      // At shore — garden's music theme (handled by caller)
      targetState = null;
    } else if (shoreProx > 0.3) {
      // Approaching island
      targetState = 'discovery';
    } else if (isNight) {
      // Open ocean at night — use existing starry_night
      targetState = null; // Let existing system handle night
    } else {
      // Open ocean, day
      targetState = 'calm_sea';
    }

    if (targetState !== this._currentMusicState) {
      this._currentMusicState = targetState;
      // Return state for caller to apply to ChilltuneEngine
      this.pendingMusicState = targetState;
    }
  }

  _updateCurrents(currentDir, currentStrength) {
    // Store for water shader uniform update
    this._currentDirection = currentDir;
    this._currentStrength = currentStrength;
  }

  _updateLightning(dt) {
    this._lightningTimer += dt;
    // Random lightning flash every 15-30 seconds
    if (this._lightningTimer > 15 + Math.random() * 15) {
      this._lightningTimer = 0;
      this._lightningFlash = true;
    } else {
      this._lightningFlash = false;
    }
  }

  _updateAurora(dt, timeOfDay) {
    this._auroraPhase += dt * 0.1;
    // Aurora visible at night in frozen ocean
    const isNight = timeOfDay > 0.75 || timeOfDay < 0.20;
    this._auroraActive = isNight;
  }

  // Get active particle configs for AmbientParticleSystem to consume
  getActiveParticles() {
    return Array.from(this._activeParticles.values());
  }

  // Get active marine life for InstancedFeatureRenderer to consume
  getActiveMarineLife() {
    return this._activeMarineLife;
  }

  // Get fog density modifier
  getFogDensityMod() {
    return this._fogDensityMod || 1.0;
  }

  // Get fog color shift
  getFogColorShift() {
    return this._fogColorShift || 0;
  }

  // Get pending music state for ChilltuneEngine
  getPendingMusicState() {
    const state = this.pendingMusicState;
    this.pendingMusicState = null;
    return state;
  }

  // Get current direction for water shader
  getCurrentDirection() {
    return this._currentDirection || { dx: 0, dz: 0 };
  }

  getCurrentStrength() {
    return this._currentStrength || 0;
  }

  // Check if lightning flash should render
  hasLightningFlash() {
    return this._lightningFlash || false;
  }

  // Check if aurora is active
  isAuroraActive() {
    return this._auroraActive || false;
  }

  getAuroraPhase() {
    return this._auroraPhase;
  }

  isEnabled() {
    return this._enabled;
  }
}

// Export music state configs for ChilltuneEngine to register
export { OCEAN_MUSIC_STATES, OCEAN_PARTICLES, MARINE_LIFE };
