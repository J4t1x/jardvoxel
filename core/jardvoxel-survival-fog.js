// ═══════════════════════════════════════════════════════════
// SPEC-071: Volumetric Fog
// FogExp2 with biome-based density, height variation,
// time-of-day color matching, and cave fog detection.
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';

export const BIOME_FOG_DENSITY = {
  desert: 0.0010,
  forest: 0.0018,
  ocean: 0.0014,
  cave: 0.035,
  plains: 0.0010,
  mountains: 0.0006,
  swamp: 0.0096,
  beach: 0.0012,
  taiga: 0.0018,
  snowy_plains: 0.0012,
  snowy_peaks: 0.0005,
  stony_peaks: 0.0006,
  meadow: 0.0010,
  jungle: 0.0024,
  savanna: 0.0010,
  cherry_grove: 0.0012,
  river: 0.0014,
  deep_ocean: 0.0018,
  mystic_grove: 0.0018,
  autumn_forest: 0.0018,
  default: 0.0010,
};

// SPEC-BIOME-OVERHAUL: Biome-specific fog colors
const BIOME_FOG_COLORS = {
  ocean: 0x6A98C8,
  deep_ocean: 0x4A78A8,
  beach: 0xC8E0F0,
  plains: 0xB8D8E0,
  forest: 0x88B098,
  jungle: 0x98C8B0,
  desert: 0xF0D8A0,
  savanna: 0xE0D8A0,
  taiga: 0x98B0C8,
  snowy_plains: 0xE0E8F0,
  snowy_peaks: 0xD8E8F0,
  stony_peaks: 0xB0B8C8,
  mountains: 0x98A8B8,
  meadow: 0xC0E0E8,
  cherry_grove: 0xE8B8D0,
  swamp: 0x788878,
  river: 0x98C0D8,
  mystic_grove: 0x9088B8,
  autumn_forest: 0xC8A878,
  default: 0xA8C8E0,
};

const TIME_COLORS = {
  dawn: { color: new THREE.Color(0xFFC8A0), density: 0.0010 },
  day: { color: new THREE.Color(0xA8C8E0), density: 0.0006 },
  sunset: { color: new THREE.Color(0xFFB890), density: 0.0012 },
  night: { color: new THREE.Color(0x1A1A3A), density: 0.0012 },
};

const CAVE_FOG_COLOR = new THREE.Color(0x050505);
const MAX_HEIGHT = 128;
const HEIGHT_FACTOR = 0.7;

export class VolumetricFog {
  constructor(scene) {
    this.scene = scene;
    this._enabled = true;
    this._currentBiome = null;
    this._targetDensity = 0.0008;
    this._currentDensity = 0.0008;
    this._targetColor = new THREE.Color(0xA8C8E0);
    this._currentColor = new THREE.Color(0xA8C8E0);
    this._isCave = false;
    this._underwaterFog = null;
    this._normalFog = null;
    this._lerpSpeed = 3.0;

    this._init();
  }

  _init() {
    this._normalFog = new THREE.FogExp2(0xA8C8E0, 0.0010);
    this._underwaterFog = new THREE.FogExp2(0x1A5078, 0.07);
    this.scene.fog = this._normalFog;
  }

  setBiome(biomeName) {
    if (biomeName === this._currentBiome) return;
    this._currentBiome = biomeName;
    const key = biomeName ? biomeName.toLowerCase().replace(/[^a-z_]/g, '').replace(/\s+/g, '_') : 'default';
    this._targetDensity = BIOME_FOG_DENSITY[key] ?? BIOME_FOG_DENSITY.default;
    // SPEC-112: Apply ocean density modifier if set
    if (this._oceanDensityMod) {
      this._targetDensity *= this._oceanDensityMod;
    }
    // SPEC-BIOME-OVERHAUL: Set biome-specific fog color
    if (!this._isCave) {
      const fogColor = BIOME_FOG_COLORS[key] ?? BIOME_FOG_COLORS.default;
      this._biomeColor = new THREE.Color(fogColor);
      // SPEC-112: Apply ocean color shift if set
      if (this._oceanColorShift) {
        this._biomeColor.offsetHSL(0, 0, this._oceanColorShift);
      }
    }
  }

  // SPEC-112: Set ocean density modifier (called by OceanSystem)
  setOceanDensityMod(mod) {
    this._oceanDensityMod = mod;
  }

  // SPEC-112: Set ocean color shift (called by OceanSystem)
  setOceanColorShift(shift) {
    this._oceanColorShift = shift;
  }

  setCave(isCave) {
    this._isCave = isCave;
    if (isCave) {
      this._targetDensity = BIOME_FOG_DENSITY.cave;
      this._targetColor.copy(CAVE_FOG_COLOR);
    }
  }

  setTimeOfDay(timeOfDay) {
    if (this._isCave) return;

    let phase;
    if (timeOfDay < 0.22 || timeOfDay > 0.78) {
      phase = TIME_COLORS.night;
    } else if (timeOfDay < 0.32) {
      phase = TIME_COLORS.dawn;
    } else if (timeOfDay < 0.68) {
      phase = TIME_COLORS.day;
    } else {
      phase = TIME_COLORS.sunset;
    }

    // SPEC-BIOME-OVERHAUL: Blend time-of-day color with biome fog color
    if (this._biomeColor) {
      this._targetColor.copy(this._biomeColor).lerp(phase.color, 0.4);
    } else {
      this._targetColor.copy(phase.color);
    }
    if (!this._isCave) {
      this._targetDensity = Math.max(this._targetDensity, phase.density);
    }
  }

  setUnderwater(isUnderwater) {
    if (isUnderwater) {
      this.scene.fog = this._underwaterFog;
    } else {
      this.scene.fog = this._normalFog;
    }
  }

  setEnabled(enabled) {
    this._enabled = enabled;
    if (enabled) {
      this.scene.fog = this._normalFog;
    } else {
      this.scene.fog = null;
    }
  }

  isEnabled() {
    return this._enabled;
  }

  update(dt, playerY, timeOfDay) {
    if (!this._enabled) return;
    if (!this.scene.fog || this.scene.fog === this._underwaterFog) return;

    if (!this._isCave) {
      this.setTimeOfDay(timeOfDay);
    }

    let finalDensity;
    if (!this._isCave) {
      const normalizedHeight = Math.max(0, Math.min(1, playerY / MAX_HEIGHT));
      const heightMultiplier = 1 - normalizedHeight * HEIGHT_FACTOR;
      
      // Altitude-based fog boost: when flying high (>80 blocks), increase fog density
      // to hide chunk boundaries and unloaded terrain at distance
      let altitudeBoost = 1.0;
      if (playerY > 80) {
        const altitudeFactor = Math.min(1, (playerY - 80) / 120); // 0 to 1 as height goes 80->200
        altitudeBoost = 1.0 + altitudeFactor * 5.0; // Up to 6x density at high altitude
      }
      
      finalDensity = this._targetDensity * heightMultiplier * altitudeBoost * (this._rdDensityMultiplier ?? 1);
      
      // Horizon blending: increase fog exponentially at distance for smooth skydome transition
      // This creates the illusion of infinite world by fading terrain into sky
      const horizonFactor = Math.pow(this._rdDensityMultiplier || 1, 2);
      // DistantTerrainRing: boost fog at horizon to blend fake terrain with sky
      const horizonBoost = 1.0 + (1.0 - (this._rdDensityMultiplier || 1)) * 0.8;
      finalDensity *= horizonFactor * horizonBoost;
      
      // Reduce fog density near camera to avoid hiding terrain
      // Apply a falloff based on render distance - less fog closer to player
      if (this._rdDensityMultiplier) {
        // When render distance is reduced due to low FPS, reduce fog proportionally
        // to prevent fog from hiding the limited visible terrain
        finalDensity *= Math.max(0.5, this._rdDensityMultiplier);
      }
    } else {
      finalDensity = this._targetDensity;
    }

    const lerpFactor = Math.min(1, dt * this._lerpSpeed);
    this._currentDensity += (finalDensity - this._currentDensity) * lerpFactor;
    this._currentColor.lerp(this._targetColor, lerpFactor);

    this._normalFog.density = this._currentDensity;
    this._normalFog.color.copy(this._currentColor);
  }

  setRenderDistance(chunks) {
    this._rdDensityMultiplier = Math.min(1, 32 / Math.max(1, chunks));
  }

  get fog() {
    return this._normalFog;
  }

  dispose() {
    this.scene.fog = null;
    this._normalFog = null;
    this._underwaterFog = null;
  }
}
