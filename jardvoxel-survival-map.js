// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Map & Cartography — SPEC-066
// Map item, compass, cartography table, map rendering
// ═══════════════════════════════════════════════════════════

import { MC_BLOCKS, BLOCK, MC_BLOCK_COLORS } from './jardvoxel-survival-mesher.js';

// New block IDs
export const MAP_BLOCKS = {
  MAP: 154,
  COMPASS: 155,
  CARTOGRAPHY_TABLE: 156,
};

export const MAP_BLOCK_COLORS = {
  154: [0.85, 0.80, 0.60],
  155: [0.80, 0.80, 0.85],
  156: [0.65, 0.45, 0.25],
};

export const MAP_BLOCK_NAMES = {
  154: 'Map',
  155: 'Compass',
  156: 'Cartography Table',
};

export const MAP_BLOCK_HARDNESS = {
  154: 0.1,
  155: 0.1,
  156: 1.0,
};

export const MAP_PLACEABLE_BLOCKS = [156];

// Non-placeable items that should appear in creative inventory
export const MAP_ITEMS = [154, 155];

// Crafting recipes
export const MAP_RECIPES = [
  // Compass: 4 iron ingots in cross + redstone center
  { type: 'shaped', pattern: [
    [null, 'iron_ingot', null],
    ['iron_ingot', 'redstone_dust', 'iron_ingot'],
    [null, 'iron_ingot', null],
  ], output: { block: MAP_BLOCKS.COMPASS, count: 1 } },
  // Map: 8 paper + 1 compass
  { type: 'shaped', pattern: [
    ['paper', 'paper', 'paper'],
    ['paper', 'compass', 'paper'],
    ['paper', 'paper', 'paper'],
  ], output: { block: MAP_BLOCKS.MAP, count: 1 } },
  // Cartography table: 4 planks + 2 paper
  { type: 'shaped', pattern: [
    ['paper', 'paper'],
    ['planks', 'planks'],
    ['planks', 'planks'],
  ], output: { block: MAP_BLOCKS.CARTOGRAPHY_TABLE, count: 1 } },
];

// Map tier sizes (blocks covered)
export const MAP_TIER_SIZES = [128, 256, 512, 1024];

// Block color mapping for map rendering (simplified)
const BLOCK_MAP_COLORS = {
  [BLOCK.GRASS]: [0x4a, 0x8a, 0x3a],
  [BLOCK.STONE]: [0x80, 0x80, 0x80],
  [BLOCK.DIRT]: [0x6a, 0x4a, 0x2a],
  [BLOCK.SAND]: [0xe0, 0xd0, 0x80],
  [BLOCK.WATER]: [0x20, 0x40, 0xa0],
  [BLOCK.SNOW]: [0xf0, 0xf0, 0xff],
  [BLOCK.LAVA]: [0xff, 0x40, 0x00],
  [MC_BLOCKS.OAK_LOG]: [0x6a, 0x4a, 0x2a],
  [MC_BLOCKS.OAK_LEAVES]: [0x3a, 0x6a, 0x2a],
  [MC_BLOCKS.BIRCH_LOG]: [0xd0, 0xc0, 0xa0],
  [MC_BLOCKS.BIRCH_LEAVES]: [0x5a, 0x8a, 0x3a],
  [MC_BLOCKS.SPRUCE_LOG]: [0x4a, 0x3a, 0x2a],
  [MC_BLOCKS.SPRUCE_LEAVES]: [0x2a, 0x5a, 0x3a],
  [MC_BLOCKS.JUNGLE_LOG]: [0x6a, 0x4a, 0x2a],
  [MC_BLOCKS.JUNGLE_LEAVES]: [0x3a, 0x7a, 0x2a],
  [MC_BLOCKS.PLANKS]: [0xb0, 0x90, 0x60],
  [MC_BLOCKS.COBBLESTONE]: [0x70, 0x70, 0x70],
  [MC_BLOCKS.GLASS]: [0xa0, 0xc0, 0xe0],
  [MC_BLOCKS.BRICKS]: [0x80, 0x40, 0x30],
  [MC_BLOCKS.SANDSTONE]: [0xd0, 0xc0, 0x80],
  [MC_BLOCKS.OBSIDIAN]: [0x1a, 0x1a, 0x2a],
  [MC_BLOCKS.IRON_ORE]: [0xa0, 0xa0, 0xa0],
  [MC_BLOCKS.COAL_ORE]: [0x50, 0x50, 0x50],
  [MC_BLOCKS.DIAMOND_ORE]: [0x40, 0xc0, 0xc0],
  [MC_BLOCKS.GOLD_ORE]: [0xd0, 0xb0, 0x20],
  [MC_BLOCKS.GRAVEL]: [0x70, 0x60, 0x60],
  [MC_BLOCKS.TORCH]: [0xff, 0xc0, 0x40],
  [MC_BLOCKS.ICE]: [0x80, 0xb0, 0xe0],
  [MC_BLOCKS.GRANITE]: [0x90, 0x60, 0x50],
  [MC_BLOCKS.ANDESITE]: [0x70, 0x70, 0x78],
  [MC_BLOCKS.DIORITE]: [0xa0, 0xa0, 0xa8],
};

// ═══════════════════════════════════════════════════════════
// MapManager — manages map data, rendering, and exploration
// ═══════════════════════════════════════════════════════════

export class MapManager {
  constructor() {
    this.maps = []; // Array of map data objects
    this.activeMapIndex = 0;
    this.canvas = null;
    this.ctx = null;
    this.lastUpdateX = Infinity;
    this.lastUpdateZ = Infinity;
    this.updateThreshold = 4; // Update every 4 blocks moved
  }

  createMap(centerX, centerZ, tier = 0) {
    const size = MAP_TIER_SIZES[tier] || 128;
    const mapData = {
      pixels: new Uint8ClampedArray(size * size * 4), // RGBA
      centerX: Math.floor(centerX / size) * size,
      centerZ: Math.floor(centerZ / size) * size,
      tier,
      size,
      explored: new Set(), // Track explored chunks
    };
    // Initialize as black (unexplored)
    for (let i = 0; i < mapData.pixels.length; i += 4) {
      mapData.pixels[i] = 0;
      mapData.pixels[i + 1] = 0;
      mapData.pixels[i + 2] = 0;
      mapData.pixels[i + 3] = 255;
    }
    this.maps.push(mapData);
    return this.maps.length - 1;
  }

  getActiveMap() {
    return this.maps[this.activeMapIndex] || null;
  }

  update(playerX, playerZ, world) {
    const map = this.getActiveMap();
    if (!map) return;

    const dx = Math.floor(playerX) - this.lastUpdateX;
    const dz = Math.floor(playerZ) - this.lastUpdateZ;
    if (Math.abs(dx) < this.updateThreshold && Math.abs(dz) < this.updateThreshold) return;

    this.lastUpdateX = Math.floor(playerX);
    this.lastUpdateZ = Math.floor(playerZ);

    // Sample blocks around player in a radius
    const radius = Math.min(32, map.size / 4);
    const px = Math.floor(playerX);
    const pz = Math.floor(playerZ);

    for (let x = px - radius; x <= px + radius; x++) {
      for (let z = pz - radius; z <= pz + radius; z++) {
        // Map world coords to map pixel coords
        const mapX = x - map.centerX;
        const mapZ = z - map.centerZ;
        if (mapX < 0 || mapX >= map.size || mapZ < 0 || mapZ >= map.size) continue;

        // Find top non-air block
        let topBlock = BLOCK.AIR;
        for (let y = 100; y >= 0; y--) {
          const b = world.getBlock(x, y, z);
          if (b !== BLOCK.AIR && b !== BLOCK.WATER) {
            topBlock = b;
            break;
          }
          if (b === BLOCK.WATER) {
            topBlock = BLOCK.WATER;
            // Keep looking for solid below water
          }
        }

        const color = BLOCK_MAP_COLORS[topBlock] || [0x20, 0x20, 0x20];
        const idx = (mapZ * map.size + mapX) * 4;
        map.pixels[idx] = color[0];
        map.pixels[idx + 1] = color[1];
        map.pixels[idx + 2] = color[2];
        map.pixels[idx + 3] = 255;
      }
    }
  }

  renderToCanvas(canvas, playerX, playerZ, playerYaw) {
    const map = this.getActiveMap();
    if (!map || !canvas) return;
    const ctx = canvas.getContext('2d');
    const size = map.size;
    canvas.width = size;
    canvas.height = size;

    // Create ImageData from pixel array
    const imageData = new ImageData(map.pixels, size, size);
    ctx.putImageData(imageData, 0, 0);

    // Draw player marker
    const mapPX = Math.floor(playerX) - map.centerX;
    const mapPZ = Math.floor(playerZ) - map.centerZ;
    if (mapPX >= 0 && mapPX < size && mapPZ >= 0 && mapPZ < size) {
      ctx.save();
      ctx.translate(mapPX, mapPZ);
      ctx.rotate(-playerYaw);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(-3, 3);
      ctx.lineTo(3, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  zoomOut() {
    const map = this.getActiveMap();
    if (!map) return false;
    if (map.tier >= MAP_TIER_SIZES.length - 1) return false;
    map.tier++;
    map.size = MAP_TIER_SIZES[map.tier];
    map.pixels = new Uint8ClampedArray(map.size * map.size * 4);
    for (let i = 0; i < map.pixels.length; i += 4) {
      map.pixels[i] = 0;
      map.pixels[i + 1] = 0;
      map.pixels[i + 2] = 0;
      map.pixels[i + 3] = 255;
    }
    // Re-center on current player position
    return true;
  }

  cloneMap() {
    const map = this.getActiveMap();
    if (!map) return -1;
    const clone = {
      pixels: new Uint8ClampedArray(map.pixels),
      centerX: map.centerX,
      centerZ: map.centerZ,
      tier: map.tier,
      size: map.size,
      explored: new Set(map.explored),
    };
    this.maps.push(clone);
    return this.maps.length - 1;
  }

  serialize() {
    return {
      maps: this.maps.map(m => ({
        pixels: Array.from(m.pixels),
        centerX: m.centerX,
        centerZ: m.centerZ,
        tier: m.tier,
        size: m.size,
        explored: Array.from(m.explored),
      })),
      activeMapIndex: this.activeMapIndex,
    };
  }

  deserialize(data) {
    if (data.maps) {
      this.maps = data.maps.map(m => ({
        pixels: new Uint8ClampedArray(m.pixels),
        centerX: m.centerX,
        centerZ: m.centerZ,
        tier: m.tier,
        size: m.size,
        explored: new Set(m.explored),
      }));
    }
    if (data.activeMapIndex !== undefined) {
      this.activeMapIndex = data.activeMapIndex;
    }
  }
}
