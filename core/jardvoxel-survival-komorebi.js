// ═══════════════════════════════════════════════════════════
// SPEC-099: Komorebi System — 木漏れ日
// "Light filtering through leaves" — dappled light patterns
// and canopy detection for immersive forest atmosphere.
// Integrates with ChillTuneEngine (musical arpeggios) and
// AmbientSoundManager (leaf rustle layering).
// ═══════════════════════════════════════════════════════════

// Canopy density thresholds per biome
const BIOME_CANOPY_DENSITY = {
  forest:        0.75,
  jungle:        0.90,
  taiga:         0.65,
  cherry_grove:  0.70,
  autumn_forest: 0.68,
  mystic_grove:  0.80,
  plains:        0.10,
  meadow:        0.15,
  desert:        0.00,
  savanna:       0.20,
  mountains:     0.05,
  snowy_plains:  0.05,
  swamp:         0.45,
  ocean:         0.00,
  caves:         0.00,
  nether:        0.00,
  village:       0.30,
  // SPEC-099: Wellness biomes
  zen_garden:    0.05,
  bamboo_grove:  0.75,
  aurora_tundra: 0.10,
};

// Leaf block IDs for canopy detection
const LEAF_BLOCKS = new Set([
  10,  // OAK_LEAVES
  12,  // BIRCH_LEAVES
  14,  // SPRUCE_LEAVES
  16,  // JUNGLE_LEAVES
]);

export class KomorebiSystem {
  constructor() {
    this._active = false;
    this._canopyDensity = 0;
    this._lastCheckTime = 0;
    this._checkInterval = 2.0; // seconds between canopy checks
    this._chilltune = null;
    this._ambientSound = null;
    this._particleTimer = null;
    this._currentBiome = null;
    // SPEC-073 Gap 7: Visual feedback — light ray intensity for dappled light
    this._lightIntensity = 0;
    this._targetLightIntensity = 0;
  }

  // Inject dependencies
  setChillTuneEngine(engine) {
    this._chilltune = engine;
  }

  setAmbientSoundManager(manager) {
    this._ambientSound = manager;
  }

  // Main update — call once per second from game loop
  update(playerPos, world, biome, dt) {
    this._currentBiome = biome;
    const now = performance.now() / 1000;
    if (now - this._lastCheckTime < this._checkInterval) return;
    this._lastCheckTime = now;

    // Calculate canopy density around player
    const density = this._calculateCanopyDensity(playerPos, world);
    this._canopyDensity = density;

    // Determine if komorebi should be active
    const threshold = (BIOME_CANOPY_DENSITY[biome] || 0) * 0.5;
    const shouldBeActive = density > threshold && density > 0.3;

    if (shouldBeActive && !this._active) {
      this._activate();
    } else if (!shouldBeActive && this._active) {
      this._deactivate();
    }
  }

  // Scan blocks above player for leaves
  _calculateCanopyDensity(playerPos, world) {
    if (!world) return 0;
    const px = Math.floor(playerPos.x);
    const py = Math.floor(playerPos.y);
    const pz = Math.floor(playerPos.z);

    let leafCount = 0;
    let totalChecks = 0;
    const radius = 3;
    const heightRange = 8; // check up to 8 blocks above

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        for (let dy = 2; dy <= heightRange; dy++) {
          const block = world.getBlock(px + dx, py + dy, pz + dz);
          if (block !== undefined && block !== 0) {
            totalChecks++;
            if (LEAF_BLOCKS.has(block)) {
              leafCount++;
            }
          }
        }
      }
    }

    return totalChecks > 0 ? leafCount / totalChecks : 0;
  }

  _activate() {
    this._active = true;
    // SPEC-073 Gap 7: Set target light intensity for visual dappled light feedback
    this._targetLightIntensity = 0.6 + this._canopyDensity * 0.4;
    if (this._chilltune) {
      this._chilltune.setKomorebi(true);
    }
    // Start leaf rustle enhancement via ambient sound
    if (this._ambientSound && this._ambientSound.ctx) {
      this._playLeafRustle();
    }
  }

  _deactivate() {
    this._active = false;
    // SPEC-073 Gap 7: Fade out light intensity
    this._targetLightIntensity = 0;
    if (this._chilltune) {
      this._chilltune.setKomorebi(false);
    }
    if (this._particleTimer) {
      clearTimeout(this._particleTimer);
      this._particleTimer = null;
    }
  }

  // SPEC-073 Gap 7: Get current visual light intensity (for renderer to use)
  getLightIntensity() {
    return this._lightIntensity;
  }

  // SPEC-073 Gap 7: Update light intensity interpolation (call from game loop)
  updateLightIntensity(dt) {
    const speed = 2.0; // fade speed
    if (this._lightIntensity < this._targetLightIntensity) {
      this._lightIntensity = Math.min(this._targetLightIntensity, this._lightIntensity + speed * dt);
    } else if (this._lightIntensity > this._targetLightIntensity) {
      this._lightIntensity = Math.max(this._targetLightIntensity, this._lightIntensity - speed * dt);
    }
  }

  // Periodic leaf rustle sounds while under canopy
  _playLeafRustle() {
    if (!this._active || !this._ambientSound || !this._ambientSound.ctx) return;
    const delay = 5000 + Math.random() * 8000; // 5-13s
    this._particleTimer = setTimeout(() => {
      if (this._active && this._ambientSound && this._ambientSound.ctx) {
        this._ambientSound._playSoundAtDistance('leaves', 3 + Math.random() * 6, 0.06);
      }
      this._playLeafRustle();
    }, delay);
  }

  isActive() {
    return this._active;
  }

  getCanopyDensity() {
    return this._canopyDensity;
  }

  destroy() {
    this._deactivate();
  }
}
