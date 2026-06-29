// ═══════════════════════════════════════════════════════════
// SPEC-079: Forest Canopy System
// Detects canopy coverage and applies under-canopy effects:
// reduced light, light fog, dust particles.
// ═══════════════════════════════════════════════════════════

const CANOPY_SCAN_RADIUS = 8;
const CANOPY_LIGHT_REDUCTION = 0.30;
const CANOPY_FOG_DENSITY = 0.004;
const CANOPY_PARTICLE_COUNT = 20;

const FOREST_BIOMES = new Set([
  'forest', 'jungle', 'taiga', 'swamp', 'autumn_forest', 'mystic_grove',
]);

export class ForestCanopyManager {
  constructor() {
    this._canopyFactor = 0;
    this._targetFactor = 0;
    this._isUnderCanopy = false;
    this._particleTimer = 0;
  }

  detectCanopy(world, playerX, playerY, playerZ) {
    let canopyBlocks = 0;
    let scanned = 0;

    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = 2; dy <= CANOPY_SCAN_RADIUS; dy++) {
          const block = world.getBlock(
            Math.floor(playerX + dx),
            Math.floor(playerY + dy),
            Math.floor(playerZ + dz)
          );
          scanned++;
          if (block !== 0 && block !== 5) {
            const isLeaf = block === 10 || block === 12 || block === 14 || block === 16;
            if (isLeaf) canopyBlocks++;
          }
        }
      }
    }

    if (scanned === 0) return 0;
    return Math.min(1, canopyBlocks / 15);
  }

  isInForestBiome(biome) {
    return FOREST_BIOMES.has(biome);
  }

  update(dt, world, playerPos, dayNight, fogManager) {
    const px = Math.floor(playerPos.x);
    const py = Math.floor(playerPos.y);
    const pz = Math.floor(playerPos.z);

    const biome = world.getBiome(px, pz);
    if (!this.isInForestBiome(biome)) {
      this._targetFactor = 0;
    } else {
      this._targetFactor = this.detectCanopy(world, px, py, pz);
    }

    const lerpSpeed = 2.0;
    this._canopyFactor += (this._targetFactor - this._canopyFactor) * Math.min(1, dt * lerpSpeed);
    this._isUnderCanopy = this._canopyFactor > 0.3;

    if (dayNight && dayNight.ambientLight) {
      const reduction = this._canopyFactor * CANOPY_LIGHT_REDUCTION;
      const baseIntensity = dayNight.ambientLight.intensity;
      dayNight.ambientLight.intensity = baseIntensity * (1 - reduction);
    }

    if (fogManager && this._isUnderCanopy) {
      if (fogManager.fog) {
        fogManager.fog.density = Math.max(fogManager.fog.density, CANOPY_FOG_DENSITY * this._canopyFactor);
      }
    }

    return this._canopyFactor;
  }

  getCanopyFactor() {
    return this._canopyFactor;
  }

  isUnderCanopy() {
    return this._isUnderCanopy;
  }

  getParticleCount() {
    return this._isUnderCanopy ? CANOPY_PARTICLE_COUNT : 0;
  }

  getLightReduction() {
    return CANOPY_LIGHT_REDUCTION;
  }

  getFogDensity() {
    return CANOPY_FOG_DENSITY;
  }
}

export const FOREST_DENSITY_MULTIPLIER = 1.5;
export const FOREST_PATH_WIDTH = 2;
export const CANOPY_SCAN_RANGE = CANOPY_SCAN_RADIUS;

export function shouldGenerateForestPath(rng, x, z, chunkSize) {
  const pathChance = 0.08;
  if (rng.next() > pathChance) return false;
  const cx = x % chunkSize;
  const cz = z % chunkSize;
  if (cx < 2 || cx >= chunkSize - 2) return false;
  if (cz < 2 || cz >= chunkSize - 2) return false;
  return true;
}

export function getForestTreeChance(baseChance) {
  return baseChance * FOREST_DENSITY_MULTIPLIER;
}

export const forestCanopyManager = new ForestCanopyManager();
