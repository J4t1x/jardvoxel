// ═══════════════════════════════════════════════════════════
// SPEC-071: Volumetric Fog
// FogExp2 with biome-based density, height variation,
// time-of-day color matching, and cave fog detection.
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';

export const BIOME_FOG_DENSITY = {
  desert: 0.008,
  forest: 0.025,
  ocean: 0.018,
  cave: 0.045,
  plains: 0.012,
  mountains: 0.004,
  swamp: 0.035,
  beach: 0.015,
  taiga: 0.022,
  snowy_plains: 0.014,
  snowy_peaks: 0.003,
  stony_peaks: 0.004,
  meadow: 0.010,
  jungle: 0.028,
  savanna: 0.008,
  cherry_grove: 0.012,
  river: 0.016,
  deep_ocean: 0.020,
  default: 0.015,
};

const TIME_COLORS = {
  dawn: { color: new THREE.Color(0xffb07a), density: 0.018 },
  day: { color: new THREE.Color(0x87ceeb), density: 0.012 },
  sunset: { color: new THREE.Color(0xff8c5a), density: 0.020 },
  night: { color: new THREE.Color(0x0a0a2a), density: 0.025 },
};

const CAVE_FOG_COLOR = new THREE.Color(0x050505);
const MAX_HEIGHT = 128;
const HEIGHT_FACTOR = 0.7;

export class VolumetricFog {
  constructor(scene) {
    this.scene = scene;
    this._enabled = true;
    this._currentBiome = null;
    this._targetDensity = 0.015;
    this._currentDensity = 0.015;
    this._targetColor = new THREE.Color(0x87ceeb);
    this._currentColor = new THREE.Color(0x87ceeb);
    this._isCave = false;
    this._underwaterFog = null;
    this._normalFog = null;
    this._lerpSpeed = 2.0;

    this._init();
  }

  _init() {
    this._normalFog = new THREE.FogExp2(0x87ceeb, 0.015);
    this._underwaterFog = new THREE.FogExp2(0x1a4080, 0.08);
    this.scene.fog = this._normalFog;
  }

  setBiome(biomeName) {
    if (biomeName === this._currentBiome) return;
    this._currentBiome = biomeName;
    const key = biomeName ? biomeName.toLowerCase().replace(/[^a-z_]/g, '').replace(/\s+/g, '_') : 'default';
    this._targetDensity = BIOME_FOG_DENSITY[key] ?? BIOME_FOG_DENSITY.default;
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

    this._targetColor.copy(phase.color);
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
      finalDensity = this._targetDensity * heightMultiplier;
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
    // FogExp2 doesn't use near/far, but we can adjust density
    // based on render distance to keep fog proportional
    const baseFactor = 5 / Math.max(1, chunks);
    // This is a soft hint - actual density is still biome-driven
  }

  dispose() {
    this.scene.fog = null;
    this._normalFog = null;
    this._underwaterFog = null;
  }
}
