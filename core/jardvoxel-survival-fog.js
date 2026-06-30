// ═══════════════════════════════════════════════════════════
// SPEC-071: Volumetric Fog
// FogExp2 with biome-based density, height variation,
// time-of-day color matching, and cave fog detection.
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';

export const BIOME_FOG_DENSITY = {
  desert: 0.0008,
  forest: 0.0015,
  ocean: 0.0012,
  cave: 0.045,
  plains: 0.0008,
  mountains: 0.0005,
  swamp: 0.008,
  beach: 0.001,
  taiga: 0.0015,
  snowy_plains: 0.001,
  snowy_peaks: 0.0004,
  stony_peaks: 0.0005,
  meadow: 0.0008,
  jungle: 0.002,
  savanna: 0.0008,
  cherry_grove: 0.001,
  river: 0.0012,
  deep_ocean: 0.0015,
  mystic_grove: 0.0015,
  autumn_forest: 0.0015,
  default: 0.0008,
};

// SPEC-BIOME-OVERHAUL: Biome-specific fog colors
const BIOME_FOG_COLORS = {
  ocean: 0x6690C0,
  deep_ocean: 0x4A70A0,
  beach: 0xC0D8F0,
  plains: 0xA0D0E0,
  forest: 0x80A890,
  jungle: 0x90C0A8,
  desert: 0xF0D090,
  savanna: 0xE0D090,
  taiga: 0x90A8C0,
  snowy_plains: 0xE0E8F0,
  snowy_peaks: 0xD8E0EC,
  stony_peaks: 0xB0B8C0,
  mountains: 0xA0B0C0,
  meadow: 0xB0D8E0,
  cherry_grove: 0xE0B0C8,
  swamp: 0x708070,
  river: 0x90B8D0,
  mystic_grove: 0x9080B0,
  autumn_forest: 0xC0A070,
  default: 0x87CEEB,
};

const TIME_COLORS = {
  dawn: { color: new THREE.Color(0xffb07a), density: 0.0008 },
  day: { color: new THREE.Color(0x87ceeb), density: 0.0004 },
  sunset: { color: new THREE.Color(0xff8c5a), density: 0.001 },
  night: { color: new THREE.Color(0x0a0a2a), density: 0.0015 },
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
    this._targetColor = new THREE.Color(0x87ceeb);
    this._currentColor = new THREE.Color(0x87ceeb);
    this._isCave = false;
    this._underwaterFog = null;
    this._normalFog = null;
    this._lerpSpeed = 2.0;

    this._init();
  }

  _init() {
    this._normalFog = new THREE.FogExp2(0x87ceeb, 0.0008);
    this._underwaterFog = new THREE.FogExp2(0x1a4080, 0.08);
    this.scene.fog = this._normalFog;
  }

  setBiome(biomeName) {
    if (biomeName === this._currentBiome) return;
    this._currentBiome = biomeName;
    const key = biomeName ? biomeName.toLowerCase().replace(/[^a-z_]/g, '').replace(/\s+/g, '_') : 'default';
    this._targetDensity = BIOME_FOG_DENSITY[key] ?? BIOME_FOG_DENSITY.default;
    // SPEC-BIOME-OVERHAUL: Set biome-specific fog color
    if (!this._isCave) {
      const fogColor = BIOME_FOG_COLORS[key] ?? BIOME_FOG_COLORS.default;
      this._biomeColor = new THREE.Color(fogColor);
    }
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
      finalDensity *= horizonFactor;
      
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
