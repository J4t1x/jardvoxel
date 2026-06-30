// ═══════════════════════════════════════════════════════════
// SPEC-076: Biome Ambient Particles
// Ambient particle systems per biome using THREE.Points.
// Includes pollen, snowflakes, fireflies, dust, spores,
// falling leaves, petals, bioluminescence, dust motes.
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';
import { BIOME_FINGERPRINTS, BIOME_PARTICLES } from './jardvoxel-survival-biome-identity.js';

const PARTICLE_RADIUS = 32;
const MAX_PARTICLES = 130;

const PARTICLE_CONFIGS = {
  pollen: {
    color: 0xF2D048,
    size: 0.18,
    gravity: -0.02,
    windFactor: 0.4,
    count: 60,
    nightOnly: false,
    dayOnly: false,
  },
  snowflakes: {
    color: 0xF0F5FF,
    size: 0.22,
    gravity: -0.5,
    windFactor: 0.5,
    count: 100,
    nightOnly: false,
    dayOnly: false,
  },
  leaves: {
    color: 0x5A9832,
    size: 0.3,
    gravity: -0.1,
    windFactor: 0.8,
    count: 80,
    nightOnly: false,
    dayOnly: false,
  },
  falling_leaves: {
    color: 0xE06028,
    size: 0.32,
    gravity: -0.1,
    windFactor: 0.8,
    count: 90,
    nightOnly: false,
    dayOnly: false,
  },
  mist: {
    color: 0xC8D0D8,
    size: 0.8,
    gravity: 0.01,
    windFactor: 0.2,
    count: 45,
    nightOnly: false,
    dayOnly: false,
  },
  dust: {
    color: 0xD8B878,
    size: 0.14,
    gravity: -0.01,
    windFactor: 0.6,
    count: 60,
    nightOnly: false,
    dayOnly: false,
  },
  fireflies: {
    color: 0xF2D848,
    size: 0.28,
    gravity: 0,
    windFactor: 0.1,
    count: 50,
    nightOnly: true,
    dayOnly: false,
  },
  spores: {
    color: 0x9848D8,
    size: 0.2,
    gravity: -0.03,
    windFactor: 0.3,
    count: 70,
    nightOnly: false,
    dayOnly: false,
  },
  petals: {
    color: 0xF0A8B8,
    size: 0.28,
    gravity: -0.08,
    windFactor: 0.8,
    count: 80,
    nightOnly: false,
    dayOnly: false,
  },
  bioluminescence: {
    color: 0x48B0E0,
    size: 0.3,
    gravity: 0,
    windFactor: 0.05,
    count: 60,
    nightOnly: true,
    dayOnly: false,
  },
  none: {
    color: 0xffffff,
    size: 0.1,
    gravity: 0,
    windFactor: 0,
    count: 0,
    nightOnly: false,
    dayOnly: false,
  },
};

const CAVE_PARTICLE_TYPE = 'dust_motes';
const CAVE_CONFIG = {
  color: 0x989088,
  size: 0.12,
  gravity: 0,
  windFactor: 0.05,
  count: 30,
  nightOnly: false,
  dayOnly: false,
};

export class AmbientParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this._points = null;
    this._geometry = null;
    this._material = null;
    this._positions = new Float32Array(MAX_PARTICLES * 3);
    this._velocities = new Float32Array(MAX_PARTICLES * 3);
    this._activeCount = 0;
    this._currentType = 'none';
    this._windDir = new THREE.Vector3(1, 0, 0);
    this._windStrength = 0;
    this._isNight = false;
    this._isCave = false;
    this._playerPos = new THREE.Vector3();
    this._enabled = true;
    this._lodFactor = 1.0;
    this._init();
  }

  _init() {
    this._geometry = new THREE.BufferGeometry();
    this._geometry.setAttribute('position', new THREE.Float32BufferAttribute(this._positions, 3));
    this._geometry.setDrawRange(0, 0);

    this._material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.22,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this._points = new THREE.Points(this._geometry, this._material);
    this._points.frustumCulled = false;
    this._points.visible = false;
    this.scene.add(this._points);
  }

  setEnabled(enabled) {
    this._enabled = enabled;
    if (!enabled) {
      this._points.visible = false;
      this._activeCount = 0;
      this._geometry.setDrawRange(0, 0);
    }
  }

  setWind(direction, strength) {
    if (direction) this._windDir.copy(direction).normalize();
    this._windStrength = strength || 0;
  }

  setNight(isNight) {
    this._isNight = isNight;
  }

  setCave(isCave) {
    this._isCave = isCave;
  }

  setLOD(factor) {
    this._lodFactor = Math.max(0.2, Math.min(1, factor));
  }

  setBiome(biome) {
    let particleType = BIOME_PARTICLES.NONE;
    if (biome && BIOME_FINGERPRINTS[biome]) {
      particleType = BIOME_FINGERPRINTS[biome].particles;
    }

    if (this._isCave) {
      particleType = CAVE_PARTICLE_TYPE;
    }

    if (particleType === this._currentType) return;
    this._currentType = particleType;

    const config = this._getConfig(particleType);
    if (!config || config.count === 0) {
      this._activeCount = 0;
      this._points.visible = false;
      return;
    }

    this._material.color.setHex(config.color);
    this._material.size = config.size;
    this._activeCount = Math.floor(config.count * this._lodFactor);
    this._geometry.setDrawRange(0, this._activeCount);
    this._spawnParticles();
  }

  _getConfig(type) {
    if (type === CAVE_PARTICLE_TYPE) return CAVE_CONFIG;
    return PARTICLE_CONFIGS[type] || PARTICLE_CONFIGS.none;
  }

  _spawnParticles() {
    const config = this._getConfig(this._currentType);
    if (!config) return;

    for (let i = 0; i < this._activeCount; i++) {
      const i3 = i * 3;
      this._positions[i3] = this._playerPos.x + (Math.random() - 0.5) * PARTICLE_RADIUS * 2;
      this._positions[i3 + 1] = this._playerPos.y + (Math.random() - 0.5) * PARTICLE_RADIUS;
      this._positions[i3 + 2] = this._playerPos.z + (Math.random() - 0.5) * PARTICLE_RADIUS * 2;

      this._velocities[i3] = (Math.random() - 0.5) * 0.5;
      this._velocities[i3 + 1] = (Math.random() - 0.5) * 0.3 + config.gravity;
      this._velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    this._geometry.attributes.position.needsUpdate = true;
  }

  update(dt, playerPos, dayFactor) {
    if (!this._enabled || this._activeCount === 0) return;

    const config = this._getConfig(this._currentType);
    if (!config || config.count === 0) return;

    if (config.nightOnly && dayFactor > 0.15) {
      this._points.visible = false;
      return;
    }
    if (config.dayOnly && dayFactor < 0.3) {
      this._points.visible = false;
      return;
    }

    this._points.visible = true;
    this._playerPos.copy(playerPos);

    const windX = this._windDir.x * this._windStrength * config.windFactor;
    const windZ = this._windDir.z * this._windStrength * config.windFactor;

    for (let i = 0; i < this._activeCount; i++) {
      const i3 = i * 3;

      this._velocities[i3] += windX * dt;
      this._velocities[i3 + 1] += config.gravity * dt;
      this._velocities[i3 + 2] += windZ * dt;

      this._velocities[i3] *= 0.98;
      this._velocities[i3 + 1] *= 0.98;
      this._velocities[i3 + 2] *= 0.98;

      this._positions[i3] += this._velocities[i3] * dt;
      this._positions[i3 + 1] += this._velocities[i3 + 1] * dt;
      this._positions[i3 + 2] += this._velocities[i3 + 2] * dt;

      const dx = this._positions[i3] - playerPos.x;
      const dy = this._positions[i3 + 1] - playerPos.y;
      const dz = this._positions[i3 + 2] - playerPos.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq > PARTICLE_RADIUS * PARTICLE_RADIUS) {
        this._positions[i3] = playerPos.x + (Math.random() - 0.5) * PARTICLE_RADIUS * 2;
        this._positions[i3 + 1] = playerPos.y + Math.random() * PARTICLE_RADIUS;
        this._positions[i3 + 2] = playerPos.z + (Math.random() - 0.5) * PARTICLE_RADIUS * 2;
        this._velocities[i3] = (Math.random() - 0.5) * 0.5;
        this._velocities[i3 + 1] = (Math.random() - 0.5) * 0.3 + config.gravity;
        this._velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
      }
    }

    this._geometry.attributes.position.needsUpdate = true;
  }

  getActiveCount() {
    return this._activeCount;
  }

  getCurrentType() {
    return this._currentType;
  }

  isVisible() {
    return this._points.visible;
  }

  dispose() {
    if (this._geometry) {
      this._geometry.dispose();
      this._geometry = null;
    }
    if (this._material) {
      this._material.dispose();
      this._material = null;
    }
    if (this._points) {
      this.scene.remove(this._points);
      this._points = null;
    }
  }
}

export { PARTICLE_CONFIGS, PARTICLE_RADIUS, MAX_PARTICLES };
