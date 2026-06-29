// ═══════════════════════════════════════════════════════════
// SPEC-099: Living World System
// The world responds subtly to player actions.
// Planting trees attracts birds. Building near water attracts
// fish. Long-idle areas grow wildflowers. Based on the concept
// of "Wabi-sabi" — beauty in impermanence and natural cycles.
// ═══════════════════════════════════════════════════════════

// Block IDs
const SAPLING_BLOCK = 9; // OAK_LOG used as sapling proxy
const FLOWER_BLOCKS = [28, 29, 157, 158, 159, 160, 161, 162, 163, 164];
const GRASS_BLOCK = 2;
const TALL_GRASS_BLOCK = 30;
const AIR = 0;

// Timers for world events
const EVENT_INTERVALS = {
  birdSpawn:     30,   // check for bird spawns every 30s
  wildflowerGrowth: 120, // wildflowers grow every 2min
  fishAttraction: 60,   // fish attracted to water near builds every 60s
  ambientCreature: 90,  // ambient creatures spawn near peaceful areas
};

export class LivingWorldSystem {
  constructor() {
    this._timers = {
      birdSpawn: 0,
      wildflowerGrowth: 0,
      fishAttraction: 0,
      ambientCreature: 0,
    };
    this._plantedTrees = []; // {x, y, z, plantedAt}
    this._builtAreas = [];   // {x, y, z, blockCount}
    this._idleAreas = new Map(); // key -> {lastVisit, x, z}
    this._onEvent = null;
    this._ambientSound = null;
  }

  setAmbientSoundManager(manager) {
    this._ambientSound = manager;
  }

  onEvent(callback) {
    this._onEvent = callback;
  }

  // Track player-placed blocks
  trackBlockPlace(x, y, z, blockId) {
    // Track tree planting
    if (blockId === 9 || blockId === 11 || blockId === 13 || blockId === 15) {
      // Log/sapling blocks
      this._plantedTrees.push({ x, y, z, plantedAt: Date.now() });
      if (this._plantedTrees.length > 100) this._plantedTrees.shift();
      this._emitEvent('tree_planted', { x, y, z });
    }

    // Track building areas
    this._builtAreas.push({ x, y, z, blockCount: 1, placedAt: Date.now() });
    if (this._builtAreas.length > 200) this._builtAreas.shift();
  }

  // Track player movement for idle area detection
  trackPlayerMovement(playerPos) {
    const cx = Math.floor(playerPos.x / 16) * 16;
    const cz = Math.floor(playerPos.z / 16) * 16;
    const key = `${cx},${cz}`;
    this._idleAreas.set(key, { lastVisit: Date.now(), x: cx, z: cz });

    // Prune old entries
    if (this._idleAreas.size > 500) {
      const oldest = this._idleAreas.keys().next().value;
      this._idleAreas.delete(oldest);
    }
  }

  // Main update — call once per second from game loop
  update(dt, playerPos, world, biome) {
    this.trackPlayerMovement(playerPos);

    // Update timers
    for (const key of Object.keys(this._timers)) {
      this._timers[key] += dt;
    }

    // Bird spawn near planted trees
    if (this._timers.birdSpawn >= EVENT_INTERVALS.birdSpawn) {
      this._timers.birdSpawn = 0;
      this._checkBirdSpawns(playerPos, world);
    }

    // Wildflower growth in idle areas
    if (this._timers.wildflowerGrowth >= EVENT_INTERVALS.wildflowerGrowth) {
      this._timers.wildflowerGrowth = 0;
      this._growWildflowers(playerPos, world);
    }

    // Fish attraction near built areas close to water
    if (this._timers.fishAttraction >= EVENT_INTERVALS.fishAttraction) {
      this._timers.fishAttraction = 0;
      this._checkFishAttraction(playerPos, world);
    }

    // Ambient creatures near peaceful areas
    if (this._timers.ambientCreature >= EVENT_INTERVALS.ambientCreature) {
      this._timers.ambientCreature = 0;
      this._spawnAmbientCreatures(playerPos, biome);
    }
  }

  // Birds are attracted to areas with many planted trees
  _checkBirdSpawns(playerPos, world) {
    const nearbyTrees = this._plantedTrees.filter(t => {
      const dx = t.x - playerPos.x;
      const dz = t.z - playerPos.z;
      return Math.sqrt(dx * dx + dz * dz) < 20;
    });

    if (nearbyTrees.length >= 3) {
      // Play bird sounds via ambient sound manager
      if (this._ambientSound && this._ambientSound.ctx) {
        const count = Math.min(nearbyTrees.length, 5);
        for (let i = 0; i < count; i++) {
          const dist = 5 + Math.random() * 12;
          this._ambientSound._playSoundAtDistance('birds', dist, 0.08);
        }
      }
      this._emitEvent('birds_attracted', { count: nearbyTrees.length });
    }
  }

  // Wildflowers grow in areas the player hasn't visited recently
  _growWildflowers(playerPos, world) {
    if (!world) return;
    const now = Date.now();
    const idleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [key, area] of this._idleAreas) {
      if (now - area.lastVisit > idleThreshold) {
        // Try to grow a wildflower in this area
        const fx = area.x + Math.floor(Math.random() * 16);
        const fz = area.z + Math.floor(Math.random() * 16);

        // Find surface
        for (let y = 100; y > 0; y--) {
          if (world.getBlock(fx, y, fz) === GRASS_BLOCK) {
            if (world.getBlock(fx, y + 1, fz) === AIR) {
              const flower = FLOWER_BLOCKS[Math.floor(Math.random() * FLOWER_BLOCKS.length)];
              world.setBlock(fx, y + 1, fz, flower);
              this._emitEvent('wildflower_grew', { x: fx, y: y + 1, z: fz });
            }
            break;
          }
        }
      }
    }
  }

  // Fish are attracted to water near built structures
  _checkFishAttraction(playerPos, world) {
    if (!world) return;
    const nearbyBuilds = this._builtAreas.filter(b => {
      const dx = b.x - playerPos.x;
      const dz = b.z - playerPos.z;
      return Math.sqrt(dx * dx + dz * dz) < 30;
    });

    if (nearbyBuilds.length >= 5) {
      // Check for water near builds
      for (const build of nearbyBuilds.slice(0, 5)) {
        for (let dy = -3; dy <= 1; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            for (let dz = -3; dz <= 3; dz++) {
              if (world.getBlock(build.x + dx, build.y + dy, build.z + dz) === 5) { // water
                this._emitEvent('fish_attracted', { x: build.x + dx, y: build.y + dy, z: build.z + dz });
                return;
              }
            }
          }
        }
      }
    }
  }

  // Ambient creatures spawn in peaceful biomes
  _spawnAmbientCreatures(playerPos, biome) {
    const peacefulBiomes = ['plains', 'meadow', 'forest', 'cherry_grove', 'meadow', 'autumn_forest'];
    if (!peacefulBiomes.includes(biome)) return;

    if (this._ambientSound && this._ambientSound.ctx) {
      this._ambientSound._playSoundAtDistance('animals', 8 + Math.random() * 10, 0.06);
    }
    this._emitEvent('creature_spawned', { biome });
  }

  _emitEvent(type, data) {
    if (this._onEvent) {
      this._onEvent(type, data);
    }
  }

  serialize() {
    return {
      plantedTrees: this._plantedTrees.slice(-20),
      builtAreas: this._builtAreas.slice(-30),
    };
  }

  deserialize(data) {
    if (data) {
      this._plantedTrees = data.plantedTrees || [];
      this._builtAreas = data.builtAreas || [];
    }
  }
}
