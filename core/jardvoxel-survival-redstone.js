// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Redstone Basics — SPEC-056
// Redstone dust, torch, lever, piston, power propagation
// ═══════════════════════════════════════════════════════════

import { MC_BLOCKS, BLOCK } from './blocks-registry.js';

// New block IDs for redstone
export const REDSTONE_BLOCKS = {
  REDSTONE_DUST: 120,
  REDSTONE_TORCH: 121,
  LEVER: 122,
  PISTON: 123,
  REDSTONE_LAMP: 124,
  REDSTONE_REPEATER: 125,
};

export const REDSTONE_BLOCK_COLORS = {
  120: [0.70, 0.10, 0.10],
  121: [0.90, 0.20, 0.10],
  122: [0.50, 0.35, 0.20],
  123: [0.60, 0.55, 0.45],
  124: [0.85, 0.70, 0.30],
  125: [0.70, 0.15, 0.15],
};

export const REDSTONE_BLOCK_NAMES = {
  120: 'Redstone Dust',
  121: 'Redstone Torch',
  122: 'Lever',
  123: 'Piston',
  124: 'Redstone Lamp',
  125: 'Redstone Repeater',
};

export const REDSTONE_BLOCK_HARDNESS = {
  120: 0.1,
  121: 0.1,
  122: 0.1,
  123: 1.5,
  124: 0.3,
  125: 0.1,
};

export const REDSTONE_PLACEABLE_BLOCKS = [120, 121, 122, 123, 124, 125];

// Redstone crafting recipes
export const REDSTONE_RECIPES = [
  // Redstone Torch: 1 redstone dust + 1 stick
  { type: 'shaped', pattern: [['redstone_dust'], ['stick']], output: { block: 121, count: 1 } },
  // Lever: 1 stick + 1 cobblestone
  { type: 'shaped', pattern: [['stick'], ['cobblestone']], output: { block: 122, count: 1 } },
  // Piston: 3 planks + 4 cobblestone + 1 iron + 1 redstone
  { type: 'shaped', pattern: [
    ['planks', 'planks', 'planks'],
    ['cobblestone', 'iron_ingot', 'cobblestone'],
    ['cobblestone', 'redstone_dust', 'cobblestone'],
  ], output: { block: 123, count: 1 } },
  // Redstone Lamp: 4 redstone + 1 glowstone (simplified: 4 redstone + 1 quartz)
  { type: 'shaped', pattern: [
    ['redstone_dust', 'redstone_dust', 'redstone_dust'],
    ['redstone_dust', 'quartz', 'redstone_dust'],
    ['redstone_dust', 'redstone_dust', 'redstone_dust'],
  ], output: { block: 124, count: 1 } },
];

// Redstone power manager — handles power propagation
export class RedstoneManager {
  constructor(world) {
    this.world = world;
    this.poweredBlocks = new Map(); // key: "x,y,z" → power level (0-15)
    this.updateQueue = [];
    this._litLamps = new Set();
    this._extendedPistons = new Set();
    this._torchPowers = new Map(); // constant power sources
    this._repeaterDelays = new Map(); // key → remaining delay
  }

  // Toggle a lever at position
  toggleLever(x, y, z) {
    const key = `${x},${y},${z}`;
    const isPowered = this.poweredBlocks.has(key);
    if (isPowered) {
      this.poweredBlocks.delete(key);
      this._removePower(x, y, z);
    } else {
      this.poweredBlocks.set(key, 15);
      this._propagatePower(x, y, z, 15);
    }
    this._updateComponentVisuals();
    return !isPowered;
  }

  // Propagate power through redstone dust
  _propagatePower(x, y, z, power) {
    if (power <= 0) return;
    const queue = [{ x, y, z, power }];
    const visited = new Set();

    while (queue.length > 0) {
      const { x: cx, y: cy, z: cz, power: cp } = queue.shift();
      const key = `${cx},${cy},${cz}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (cp <= 0) continue;
      this.poweredBlocks.set(key, cp);

      // Check neighbors for redstone dust
      const neighbors = [
        { dx: 1, dy: 0, dz: 0 }, { dx: -1, dy: 0, dz: 0 },
        { dx: 0, dy: 0, dz: 1 }, { dx: 0, dy: 0, dz: -1 },
        { dx: 0, dy: 1, dz: 0 }, { dx: 0, dy: -1, dz: 0 },
      ];

      for (const n of neighbors) {
        const nx = cx + n.dx;
        const ny = cy + n.dy;
        const nz = cz + n.dz;
        const block = this.world.getBlock(nx, ny, nz);
        if (block === REDSTONE_BLOCKS.REDSTONE_DUST) {
          const nkey = `${nx},${ny},${nz}`;
          if (!visited.has(nkey)) {
            queue.push({ x: nx, y: ny, z: nz, power: cp - 1 });
          }
        }
      }
    }
  }

  // Remove power from a network
  _removePower(x, y, z) {
    // Clear all powered blocks then re-apply torch powers
    this.poweredBlocks.clear();
    for (const [tkey, power] of this._torchPowers) {
      const [tx, ty, tz] = tkey.split(',').map(Number);
      this.poweredBlocks.set(tkey, power);
      this._propagatePower(tx, ty, tz, power);
    }
  }

  // Register a redstone torch as constant power source
  addTorch(x, y, z) {
    const key = `${x},${y},${z}`;
    this._torchPowers.set(key, 15);
    this.poweredBlocks.set(key, 15);
    this._propagatePower(x, y, z, 15);
    this._updateComponentVisuals();
  }

  // Remove a redstone torch
  removeTorch(x, y, z) {
    const key = `${x},${y},${z}`;
    this._torchPowers.delete(key);
    this.poweredBlocks.delete(key);
    this._removePower(x, y, z);
  }

  // Check if a block is powered
  isPowered(x, y, z) {
    // Check the block itself and all 6 neighbors
    const key = `${x},${y},${z}`;
    if (this.poweredBlocks.has(key)) return true;

    const neighbors = [
      { dx: 1, dy: 0, dz: 0 }, { dx: -1, dy: 0, dz: 0 },
      { dx: 0, dy: 0, dz: 1 }, { dx: 0, dy: 0, dz: -1 },
      { dx: 0, dy: 1, dz: 0 }, { dx: 0, dy: -1, dz: 0 },
    ];
    for (const n of neighbors) {
      const nkey = `${x + n.dx},${y + n.dy},${z + n.dz}`;
      if (this.poweredBlocks.has(nkey)) return true;
    }
    return false;
  }

  // Get power level at position
  getPower(x, y, z) {
    return this.poweredBlocks.get(`${x},${y},${z}`) || 0;
  }

  // Update redstone components each frame
  update(dt, world) {
    // Process repeater delays
    for (const [key, delay] of this._repeaterDelays) {
      const newDelay = delay - dt;
      if (newDelay <= 0) {
        const [x, y, z] = key.split(',').map(Number);
        this._repeaterDelays.delete(key);
        this.poweredBlocks.set(key, 15);
        this._propagatePower(x, y, z, 15);
      } else {
        this._repeaterDelays.set(key, newDelay);
      }
    }

    // Update lamps — toggle lit state based on power
    for (const [key, power] of this.poweredBlocks) {
      const [x, y, z] = key.split(',').map(Number);
      const block = world.getBlock(x, y, z);
      if (block === REDSTONE_BLOCKS.REDSTONE_LAMP && power > 0) {
        this._litLamps.add(key);
      }
    }
    // Check all lit lamps — if no longer powered, unlit
    for (const key of this._litLamps) {
      if (!this.poweredBlocks.has(key)) {
        this._litLamps.delete(key);
      }
    }
    // Update pistons — push blocks when powered
    for (const [key, power] of this.poweredBlocks) {
      if (power <= 0) continue;
      const [x, y, z] = key.split(',').map(Number);
      const block = world.getBlock(x, y, z);
      if (block === REDSTONE_BLOCKS.PISTON && !this._extendedPistons.has(key)) {
        this._extendedPistons.add(key);
        // Push block above the piston
        const above = world.getBlock(x, y + 1, z);
        if (above !== 0 && above !== 5 && above !== REDSTONE_BLOCKS.PISTON) {
          const twoAbove = world.getBlock(x, y + 2, z);
          if (twoAbove === 0) {
            world.setBlock(x, y + 2, z, above);
            world.setBlock(x, y + 1, z, 0);
          }
        }
      }
    }
    // Retract pistons that lost power
    for (const key of this._extendedPistons) {
      if (!this.poweredBlocks.has(key)) {
        this._extendedPistons.delete(key);
      }
    }
  }

  isLampLit(x, y, z) {
    return this._litLamps.has(`${x},${y},${z}`);
  }

  isPistonExtended(x, y, z) {
    return this._extendedPistons.has(`${x},${y},${z}`);
  }

  // Get dust power level for visual brightness (0-1)
  getDustBrightness(x, y, z) {
    const power = this.poweredBlocks.get(`${x},${y},${z}`) || 0;
    return power / 15;
  }

  // Trigger a repeater at position (adds delay)
  triggerRepeater(x, y, z) {
    const key = `${x},${y},${z}`;
    this._repeaterDelays.set(key, 0.1); // 1 tick = 0.1s
  }

  // Rebuild meshes for chunks containing changed redstone components
  _updateComponentVisuals() {
    // The mesher checks isLampLit/getDustBrightness at render time
    // so we just need to ensure chunk meshes are rebuilt
    // This is called after power state changes
  }
}
