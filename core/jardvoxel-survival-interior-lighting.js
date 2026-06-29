// ═══════════════════════════════════════════════════════════
// SPEC-074: Interior Lighting
// Detects when player is indoors, reduces ambient light,
// manages dynamic light pool with prioritization.
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';

const TORCH_COLOR = 0xFFA040;
const TORCH_INTENSITY = 1.5;
const TORCH_DISTANCE = 8;

const CAMPFIRE_COLOR = 0xFFC060;
const CAMPFIRE_INTENSITY = 2.5;
const CAMPFIRE_DISTANCE = 12;

const LANTERN_COLOR = 0xFFB050;
const LANTERN_INTENSITY = 1.0;
const LANTERN_DISTANCE = 6;

const VILLAGE_CAMPFIRE_DISTANCE = 32;
const INTERIOR_AMBIENT_REDUCTION = 0.4;
const TRANSITION_SPEED = 2.0;
const LIGHT_POOL_SIZE = 8;

export const LIGHT_TYPES = {
  TORCH: 'torch',
  CAMPFIRE: 'campfire',
  LANTERN: 'lantern',
  LAVA: 'lava',
  VILLAGE_CAMPFIRE: 'village_campfire',
};

export const LIGHT_CONFIG = {
  torch: { color: TORCH_COLOR, intensity: TORCH_INTENSITY, distance: TORCH_DISTANCE },
  campfire: { color: CAMPFIRE_COLOR, intensity: CAMPFIRE_INTENSITY, distance: CAMPFIRE_DISTANCE },
  lantern: { color: LANTERN_COLOR, intensity: LANTERN_INTENSITY, distance: LANTERN_DISTANCE },
  lava: { color: 0xFF4400, intensity: 1.5, distance: 8 },
  village_campfire: { color: CAMPFIRE_COLOR, intensity: 2.5, distance: VILLAGE_CAMPFIRE_DISTANCE },
};

export class InteriorLightingManager {
  constructor(scene, dayNight) {
    this.scene = scene;
    this.dayNight = dayNight;
    this._isInterior = false;
    this._interiorFactor = 0;
    this._targetInteriorFactor = 0;
    this._lightPool = [];
    this._scanTimer = 0;
    this._scanInterval = 0.3;
    this._baseAmbientIntensity = 0.4;
    this._windowLightFactor = 0;

    this._init();
  }

  _init() {
    for (let i = 0; i < LIGHT_POOL_SIZE; i++) {
      const light = new THREE.PointLight(TORCH_COLOR, 0, TORCH_DISTANCE, 2);
      light.visible = false;
      this.scene.add(light);
      this._lightPool.push({
        light,
        target: null,
        type: null,
        active: false,
        fadeIn: 0,
      });
    }
  }

  isInterior() {
    return this._isInterior;
  }

  getInteriorFactor() {
    return this._interiorFactor;
  }

  detectInterior(world, playerX, playerY, playerZ) {
    const px = Math.floor(playerX);
    const pz = Math.floor(playerZ);
    const headY = Math.floor(playerY + 1);

    for (let dy = 2; dy <= 5; dy++) {
      const block = world.getBlock(px, headY + dy, pz);
      if (block !== 0 && block !== 11) {
        this._isInterior = true;
        this._targetInteriorFactor = 1.0;
        this._checkWindowLight(world, px, headY, pz);
        return;
      }
    }
    this._isInterior = false;
    this._targetInteriorFactor = 0.0;
    this._windowLightFactor = 0;
  }

  _checkWindowLight(world, px, py, pz) {
    let windowCount = 0;
    const checks = [
      [0, 3, 0], [0, 4, 0], [0, 5, 0],
      [1, 3, 0], [-1, 3, 0],
      [0, 3, 1], [0, 3, -1],
    ];
    for (const [dx, dy, dz] of checks) {
      const block = world.getBlock(px + dx, py + dy, pz + dz);
      if (block === 23) {
        windowCount++;
      }
    }
    this._windowLightFactor = Math.min(1, windowCount * 0.3);
  }

  getWindowLightFactor() {
    return this._windowLightFactor;
  }

  scanLightSources(world, playerX, playerY, playerZ) {
    const px = Math.floor(playerX);
    const py = Math.floor(playerY);
    const pz = Math.floor(playerZ);
    const range = 16;

    const sources = [];
    const torchId = 25, lanternId = 26, lavaId = 6;

    for (let dx = -range; dx <= range; dx += 2) {
      for (let dy = -range; dy <= range; dy += 2) {
        for (let dz = -range; dz <= range; dz += 2) {
          const wx = px + dx;
          const wy = py + dy;
          const wz = pz + dz;
          const block = world.getBlock(wx, wy, wz);
          if (block === torchId || block === lanternId || block === lavaId) {
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist <= range) {
              let type = LIGHT_TYPES.TORCH;
              if (block === lanternId) type = LIGHT_TYPES.LANTERN;
              else if (block === lavaId) type = LIGHT_TYPES.LAVA;
              sources.push({ x: wx + 0.5, y: wy + 0.5, z: wz + 0.5, dist, type, block });
            }
          }
        }
      }
    }

    sources.sort((a, b) => a.dist - b.dist);
    return sources.slice(0, LIGHT_POOL_SIZE);
  }

  updateLightPool(sources) {
    const priority = {
      [LIGHT_TYPES.LAVA]: 0,
      [LIGHT_TYPES.CAMPFIRE]: 1,
      [LIGHT_TYPES.VILLAGE_CAMPFIRE]: 2,
      [LIGHT_TYPES.TORCH]: 3,
      [LIGHT_TYPES.LANTERN]: 4,
    };

    sources.sort((a, b) => {
      const pa = priority[a.type] ?? 5;
      const pb = priority[b.type] ?? 5;
      if (pa !== pb) return pa - pb;
      return a.dist - b.dist;
    });

    for (let i = 0; i < this._lightPool.length; i++) {
      const pl = this._lightPool[i];
      if (i < sources.length) {
        const src = sources[i];
        const config = LIGHT_CONFIG[src.type] || LIGHT_CONFIG.torch;
        pl.light.position.set(src.x, src.y, src.z);
        pl.light.color.setHex(config.color);
        pl.targetIntensity = config.intensity;
        pl.light.distance = config.distance;
        pl.type = src.type;
        pl.active = true;
        pl.fadeIn = Math.min(1, pl.fadeIn + 0.1);
        pl.light.intensity = pl.targetIntensity * pl.fadeIn;
        pl.light.visible = true;
      } else {
        pl.fadeIn = Math.max(0, pl.fadeIn - 0.1);
        pl.light.intensity = (pl.targetIntensity || 0) * pl.fadeIn;
        if (pl.fadeIn <= 0) {
          pl.light.visible = false;
          pl.active = false;
          pl.target = null;
          pl.type = null;
        }
      }
    }
  }

  update(dt, world, playerPos, isOutside) {
    this._scanTimer += dt;
    if (this._scanTimer >= this._scanInterval) {
      this._scanTimer = 0;
      this.detectInterior(world, playerPos.x, playerPos.y, playerPos.z);
      const sources = this.scanLightSources(world, playerPos.x, playerPos.y, playerPos.z);
      this.updateLightPool(sources);
    }

    const lerpFactor = Math.min(1, dt * TRANSITION_SPEED);
    this._interiorFactor += (this._targetInteriorFactor - this._interiorFactor) * lerpFactor;

    if (this.dayNight && this.dayNight.ambientLight) {
      const baseIntensity = this._getBaseAmbientIntensity();
      const reduced = baseIntensity * (1 - INTERIOR_AMBIENT_REDUCTION * this._interiorFactor);
      const windowBoost = this._windowLightFactor * 0.15 * this._interiorFactor;
      this.dayNight.ambientLight.intensity = reduced + windowBoost;
    }

    if (this.dayNight && this.dayNight.sunLight) {
      const sunBase = this.dayNight.sunLight.intensity;
      const sunReduction = 1 - this._interiorFactor * 0.5 + this._windowLightFactor * 0.3 * this._interiorFactor;
      this.dayNight.sunLight.intensity = sunBase * sunReduction;
    }
  }

  _getBaseAmbientIntensity() {
    if (!this.dayNight) return this._baseAmbientIntensity;
    const angle = this.dayNight.time * Math.PI * 2;
    const dayFactor = Math.max(0, Math.sin(angle));
    const nightFactor = Math.max(0, -Math.sin(angle));
    return 0.15 + dayFactor * 0.35 + nightFactor * 0.05;
  }

  setBaseAmbientIntensity(intensity) {
    this._baseAmbientIntensity = intensity;
  }

  dispose() {
    for (const pl of this._lightPool) {
      this.scene.remove(pl.light);
    }
    this._lightPool = [];
  }

  getLightPool() {
    return this._lightPool;
  }
}
