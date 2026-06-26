// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Nether Dimension — SPEC-055
// Nether blocks, portal, dimension switching
// ═══════════════════════════════════════════════════════════

import { MC_BLOCKS, BLOCK } from './jardvoxel-survival-mesher.js';

// New block IDs for nether
export const NETHER_BLOCKS = {
  NETHERRACK: 110,
  NETHER_BRICK: 111,
  SOUL_SAND: 112,
  GLOWSTONE: 113,
  NETHER_QUARTZ_ORE: 114,
  LAVA_NETHER: 115,
  OBSIDIAN_PORTAL: 116,
  QUARTZ: 117,
  BLAZE_ROD: 118,
  NETHER_WART: 119,
};

export const NETHER_BLOCK_COLORS = {
  110: [0.35, 0.15, 0.15],
  111: [0.25, 0.10, 0.10],
  112: [0.30, 0.25, 0.15],
  113: [0.90, 0.75, 0.30],
  114: [0.40, 0.35, 0.30],
  115: [0.80, 0.30, 0.10],
  116: [0.20, 0.10, 0.40],
  117: [0.85, 0.85, 0.80],
  118: [0.80, 0.50, 0.15],
  119: [0.60, 0.15, 0.15],
};

export const NETHER_BLOCK_NAMES = {
  110: 'Netherrack',
  111: 'Nether Brick',
  112: 'Soul Sand',
  113: 'Glowstone',
  114: 'Nether Quartz Ore',
  115: 'Lava',
  116: 'Portal',
  117: 'Quartz',
  118: 'Blaze Rod',
  119: 'Nether Wart',
};

export const NETHER_BLOCK_HARDNESS = {
  110: 0.4,
  111: 2.0,
  112: 0.5,
  113: 0.3,
  114: 1.0,
  115: Infinity,
  116: Infinity,
  117: 0.3,
  118: 0.1,
  119: 0.1,
};

export const NETHER_PLACEABLE_BLOCKS = [110, 111, 112, 113, 117];

// Nether crafting recipes
export const NETHER_RECIPES = [
  // Nether Bricks from Netherrack (smelted, but also shapeless for simplicity)
  { type: 'shapeless', ingredients: [110], output: { block: 111, count: 1 } },
  // Glowstone block from 4 glowstone dust (simplified: 1 glowstone = 1 quartz)
  { type: 'shaped', pattern: [['quartz', 'quartz'], ['quartz', 'quartz']], output: { block: 113, count: 1 } },
];

// Nether world generator — simple noise-based terrain
export class NetherGenerator {
  constructor() {
    this.seed = Math.random() * 10000;
  }

  generateChunk(chunkX, chunkZ) {
    const blocks = [];
    const size = 16;
    const height = 64;

    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        // Nether terrain: caves and pillars
        const worldX = chunkX * size + x;
        const worldZ = chunkZ * size + z;

        // Base netherrack floor
        for (let y = 0; y < height; y++) {
          let block = 0; // air

          if (y < 32) {
            block = NETHER_BLOCKS.NETHERRACK;
          } else if (y === 32) {
            // Surface — mix of netherrack and soul sand
            const noise = Math.sin(worldX * 0.3 + this.seed) * Math.cos(worldZ * 0.3) * 0.5 + 0.5;
            block = noise > 0.7 ? NETHER_BLOCKS.SOUL_SAND : NETHER_BLOCKS.NETHERRACK;
          } else if (y > 55) {
            // Ceiling
            block = NETHER_BLOCKS.NETHERRACK;
            const pillarRand = Math.sin(worldX * 5.123 + worldZ * 3.456 + this.seed) * 43758.5453;
            const pr = pillarRand - Math.floor(pillarRand);
            if (pr < 0.01) block = NETHER_BLOCKS.NETHER_BRICK;
          } else {
            // Random quartz ore and glowstone deposits
            const rand = Math.sin(worldX * 12.9898 + worldZ * 78.233 + y * 37.719 + this.seed) * 43758.5453;
            const r = rand - Math.floor(rand);
            if (r < 0.02) block = NETHER_BLOCKS.NETHER_QUARTZ_ORE;
            else if (r < 0.03) block = NETHER_BLOCKS.GLOWSTONE;
            else if (r < 0.04) block = NETHER_BLOCKS.LAVA_NETHER;
            else if (r < 0.045) block = NETHER_BLOCKS.NETHER_WART;
          }

          blocks.push(block);
        }
      }
    }

    return { blocks, size, height };
  }
}

// Portal manager — handles portal creation and dimension switching
export class PortalManager {
  constructor() {
    this.portals = [];
    this.inNether = false;
    this.dimension = 'overworld';
    this.netherGenerator = new NetherGenerator();
    this._portalCooldown = 0;
  }

  // Check if an obsidian frame is a valid portal (simplified: 4x4 or 4x5 obsidian frame)
  checkPortalFrame(world, x, y, z) {
    // Simplified: just check if player placed obsidian in a 2x3 vertical frame
    // For now, any obsidian block right-clicked with flint/steel equivalent activates
    return true;
  }

  // Activate portal at position — fill interior with portal blocks
  activatePortal(world, x, y, z) {
    // Find a vertical obsidian frame near the clicked block
    // Check for 2x3 interior (4x5 frame) or 2x2 interior (4x4 frame)
    const directions = [
      { dx: 0, dz: 1 }, { dx: 1, dz: 0 }, { dx: 0, dz: -1 }, { dx: -1, dz: 0 },
    ];

    for (const dir of directions) {
      // Try to find a frame in this orientation
      const frame = this._findFrame(world, x, y, z, dir);
      if (frame) {
        // Fill interior with portal blocks
        for (const pos of frame.interior) {
          world.setBlock(pos.x, pos.y, pos.z, NETHER_BLOCKS.OBSIDIAN_PORTAL);
        }
        this.portals.push({
          x, y, z,
          dimension: this.inNether ? 'overworld' : 'nether',
          interior: frame.interior,
        });
        return true;
      }
    }
    // Fallback: just place a single portal block
    world.setBlock(x, y, z, NETHER_BLOCKS.OBSIDIAN_PORTAL);
    this.portals.push({ x, y, z, dimension: this.inNether ? 'overworld' : 'nether' });
    return true;
  }

  _findFrame(world, x, y, z, dir) {
    // Look for a 2-wide x 3-tall interior bounded by obsidian
    for (let h = 3; h <= 4; h++) {
      for (let w = 2; w <= 2; w++) {
        const interior = [];
        let valid = true;
        for (let dx = 0; dx < w; dx++) {
          for (let dy = 0; dy < h; dy++) {
            const bx = x + dir.dx * dx;
            const by = y + dy;
            const bz = z + dir.dz * dx;
            const block = world.getBlock(bx, by, bz);
            if (dy === 0 || dy === h - 1 || dx === 0 || dx === w - 1) {
              // Should be obsidian border
              if (block !== MC_BLOCKS.OBSIDIAN && block !== NETHER_BLOCKS.OBSIDIAN_PORTAL) {
                // Check if it's air for interior
                if (dx > 0 && dx < w - 1 && dy > 0 && dy < h - 1) {
                  if (block === 0) interior.push({ x: bx, y: by, z: bz });
                  else { valid = false; break; }
                } else {
                  valid = false; break;
                }
              }
            } else {
              if (block === 0) interior.push({ x: bx, y: by, z: bz });
              else { valid = false; break; }
            }
          }
          if (!valid) break;
        }
        if (valid && interior.length > 0) return { interior };
      }
    }
    return null;
  }

  // Check if player is standing in a portal block
  isInPortal(playerPos) {
    const px = Math.floor(playerPos.x);
    const py = Math.floor(playerPos.y);
    const pz = Math.floor(playerPos.z);
    for (const portal of this.portals) {
      for (const pos of (portal.interior || [{ x: portal.x, y: portal.y, z: portal.z }])) {
        if (pos.x === px && pos.y === py && pos.z === pz) return true;
      }
    }
    return false;
  }

  // Switch dimension
  switchDimension() {
    this.inNether = !this.inNether;
    this.dimension = this.inNether ? 'nether' : 'overworld';
    return this.inNether;
  }

  // Get the appropriate generator for current dimension
  getGenerator() {
    return this.inNether ? this.netherGenerator : null;
  }

  update(dt) {
    if (this._portalCooldown > 0) this._portalCooldown -= dt;
  }
}
