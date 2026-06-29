// ═══════════════════════════════════════════════════════════
// SPEC-099: Meditation Space Generator
// Procedurally generates contemplative areas in the world.
// Detects suitable locations and creates serene spaces with
// natural elements — circles of flowers, water features,
// stone arrangements. Inspired by Japanese zen gardens.
// ═══════════════════════════════════════════════════════════

// Block IDs for decoration
const FLOWER_BLOCKS = [28, 29, 157, 158, 159, 160, 161, 162, 163, 164];
const STONE_BLOCK = 1;
const WATER_BLOCK = 5;
const GRASS_BLOCK = 2;
const MOSS_BLOCK = 43;
const TORCH_BLOCK = 25;
const LANTERN_BLOCK = 26;

// Space types based on biome and terrain
const SPACE_TYPES = {
  zen_garden: {
    name: 'Zen Garden',
    biomes: ['plains', 'meadow', 'forest', 'cherry_grove'],
    minFlatness: 0.85,
    radius: 5,
    elements: ['stone_circle', 'sand_patch', 'lantern'],
  },
  forest_sanctuary: {
    name: 'Forest Sanctuary',
    biomes: ['forest', 'jungle', 'taiga', 'autumn_forest', 'mystic_grove'],
    minFlatness: 0.70,
    radius: 6,
    elements: ['flower_circle', 'moss_patch', 'torch'],
  },
  mountain_retreat: {
    name: 'Mountain Retreat',
    biomes: ['mountains', 'stony_peaks', 'snowy_peaks', 'meadow'],
    minFlatness: 0.75,
    radius: 4,
    elements: ['stone_circle', 'water_feature', 'lantern'],
  },
  waterside_grove: {
    name: 'Waterside Grove',
    biomes: ['beach', 'river', 'swamp', 'ocean'],
    minFlatness: 0.60,
    radius: 5,
    elements: ['flower_circle', 'water_feature', 'torch'],
  },
  desert_oasis: {
    name: 'Desert Oasis',
    biomes: ['desert', 'savanna'],
    minFlatness: 0.80,
    radius: 4,
    elements: ['stone_circle', 'water_feature', 'lantern'],
  },
};

export class MeditationSpaceGenerator {
  constructor() {
    this._discoveredSpaces = new Map();
    this._checkInterval = 5.0;
    this._lastCheckTime = 0;
    this._searchRadius = 32;
    this._onDiscover = null;
    this._chilltune = null;
  }

  setChillTuneEngine(engine) {
    this._chilltune = engine;
  }

  onDiscover(callback) {
    this._onDiscover = callback;
  }

  // Check if player is currently inside a meditation space
  isPlayerInMeditationSpace(playerPos) {
    for (const [key, space] of this._discoveredSpaces) {
      const dx = playerPos.x - space.cx;
      const dz = playerPos.z - space.cz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= space.radius && Math.abs(playerPos.y - space.cy) < 3) {
        return true;
      }
    }
    return false;
  }

  // Main update — called from game loop
  update(playerPos, world, biome, worldGen, dt) {
    const now = performance.now() / 1000;
    if (now - this._lastCheckTime < this._checkInterval) return;
    this._lastCheckTime = now;

    // Check if player is in a known space
    const inSpace = this.isPlayerInMeditationSpace(playerPos);
    if (this._chilltune) {
      this._chilltune.setInMeditationSpace(inSpace);
    }

    // Search for new meditation space candidates near player
    this._searchForSpaces(playerPos, world, biome, worldGen);
  }

  _searchForSpaces(playerPos, world, biome, worldGen) {
    if (!world || !worldGen) return;

    // Find suitable space type for biome
    const spaceType = this._getSpaceTypeForBiome(biome);
    if (!spaceType) return;

    // Search in a ring around player
    const px = Math.floor(playerPos.x);
    const pz = Math.floor(playerPos.z);
    const searchR = this._searchRadius;

    // Sample a few random points
    for (let attempt = 0; attempt < 3; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 16 + Math.random() * (searchR - 16);
      const cx = px + Math.floor(Math.cos(angle) * dist);
      const cz = pz + Math.floor(Math.sin(angle) * dist);

      const key = `${cx},${cz}`;
      if (this._discoveredSpaces.has(key)) continue;

      // Check flatness
      const flatness = this._checkFlatness(cx, cz, worldGen, spaceType.radius);
      if (flatness >= spaceType.minFlatness) {
        // Generate the space
        this._generateSpace(cx, cz, worldGen, world, spaceType);
      }
    }
  }

  _getSpaceTypeForBiome(biome) {
    for (const space of Object.values(SPACE_TYPES)) {
      if (space.biomes.includes(biome)) return space;
    }
    return null;
  }

  _checkFlatness(cx, cz, worldGen, radius) {
    const baseHeight = worldGen.getBaseHeight(cx, cz);
    let flatCount = 0;
    let totalChecks = 0;

    for (let dx = -radius; dx <= radius; dx += 2) {
      for (let dz = -radius; dz <= radius; dz += 2) {
        const h = worldGen.getBaseHeight(cx + dx, cz + dz);
        if (Math.abs(h - baseHeight) <= 1.5) flatCount++;
        totalChecks++;
      }
    }

    return totalChecks > 0 ? flatCount / totalChecks : 0;
  }

  _generateSpace(cx, cz, worldGen, world, spaceType) {
    const cy = Math.floor(worldGen.getBaseHeight(cx, cz));
    const radius = spaceType.radius;
    const key = `${cx},${cz}`;

    const space = {
      cx, cy, cz,
      radius,
      type: spaceType.name,
      discoveredAt: Date.now(),
    };

    // Decorate based on elements
    for (const element of spaceType.elements) {
      this._placeElement(cx, cy, cz, radius, world, element);
    }

    this._discoveredSpaces.set(key, space);

    if (this._onDiscover) {
      this._onDiscover(space);
    }
  }

  _placeElement(cx, cy, cz, radius, world, element) {
    if (!world) return;

    switch (element) {
      case 'flower_circle': {
        // Ring of flowers around the perimeter
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
          const fx = Math.floor(cx + Math.cos(angle) * radius);
          const fz = Math.floor(cz + Math.sin(angle) * radius);
          const fy = cy + 1;
          if (world.getBlock(fx, fy, fz) === 0) { // air
            const flower = FLOWER_BLOCKS[Math.floor(Math.random() * FLOWER_BLOCKS.length)];
            world.setBlock(fx, fy, fz, flower);
          }
        }
        break;
      }
      case 'stone_circle': {
        // Ring of stones
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
          const sx = Math.floor(cx + Math.cos(angle) * radius);
          const sz = Math.floor(cz + Math.sin(angle) * radius);
          const sy = cy + 1;
          if (world.getBlock(sx, sy, sz) === 0) {
            world.setBlock(sx, sy, sz, STONE_BLOCK);
          }
        }
        break;
      }
      case 'moss_patch': {
        // Moss carpet in center
        for (let dx = -2; dx <= 2; dx++) {
          for (let dz = -2; dz <= 2; dz++) {
            if (Math.abs(dx) + Math.abs(dz) <= 3) {
              const mx = cx + dx;
              const mz = cz + dz;
              if (world.getBlock(mx, cy, mz) === GRASS_BLOCK) {
                world.setBlock(mx, cy, mz, MOSS_BLOCK);
              }
            }
          }
        }
        break;
      }
      case 'sand_patch': {
        // Sand patch in center (zen garden)
        for (let dx = -3; dx <= 3; dx++) {
          for (let dz = -3; dz <= 3; dz++) {
            if (Math.abs(dx) + Math.abs(dz) <= 4) {
              const sx = cx + dx;
              const sz = cz + dz;
              if (world.getBlock(sx, cy, sz) === GRASS_BLOCK) {
                world.setBlock(sx, cy, sz, 4); // sand
              }
            }
          }
        }
        break;
      }
      case 'water_feature': {
        // Small water pool
        world.setBlock(cx, cy, cz, WATER_BLOCK);
        world.setBlock(cx + 1, cy, cz, WATER_BLOCK);
        world.setBlock(cx, cy, cz + 1, WATER_BLOCK);
        world.setBlock(cx - 1, cy, cz, STONE_BLOCK);
        world.setBlock(cx, cy, cz - 1, STONE_BLOCK);
        break;
      }
      case 'lantern': {
        // Place lantern at center
        if (world.getBlock(cx, cy + 1, cz) === 0) {
          world.setBlock(cx, cy + 1, cz, LANTERN_BLOCK);
        }
        break;
      }
      case 'torch': {
        // Place torches at cardinal points
        for (const [dx, dz] of [[0, radius - 1], [0, -(radius - 1)], [radius - 1, 0], [-(radius - 1), 0]]) {
          if (world.getBlock(cx + dx, cy + 1, cz + dz) === 0) {
            world.setBlock(cx + dx, cy + 1, cz + dz, TORCH_BLOCK);
          }
        }
        break;
      }
    }
  }

  getDiscoveredSpaces() {
    return Array.from(this._discoveredSpaces.values());
  }

  serialize() {
    return {
      spaces: this.getDiscoveredSpaces(),
    };
  }

  deserialize(data) {
    if (data && data.spaces) {
      for (const s of data.spaces) {
        this._discoveredSpaces.set(`${s.cx},${s.cz}`, s);
      }
    }
  }
}
