// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Villager NPCs & Trading — SPEC-053
// Villager entities, trading system, trades UI
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';
import { MC_BLOCKS } from './blocks-registry.js';

// New block IDs for villager-related items
export const VILLAGER_BLOCKS = {
  EMERALD: 103,
  VILLAGER_SPAWN_EGG: 104,
};

export const VILLAGER_BLOCK_COLORS = {
  103: [0.10, 0.80, 0.50],
  104: [0.90, 0.70, 0.30],
};

export const VILLAGER_BLOCK_NAMES = {
  103: 'Emerald',
  104: 'Villager Spawn Egg',
};

export const VILLAGER_BLOCK_HARDNESS = {
  103: 0.2,
  104: 0.1,
};

export const VILLAGER_PLACEABLE_BLOCKS = [103];

// Villager professions
export const VILLAGER_PROFESSIONS = {
  FARMER: { id: 'farmer', name: 'Agricultor', color: 0x8b4513, hatColor: 0xdeb887 },
  BUTCHER: { id: 'butcher', name: 'Carnicero', color: 0xdc143c, hatColor: 0xffffff },
  BLACKSMITH: { id: 'blacksmith', name: 'Herrero', color: 0x696969, hatColor: 0x2f4f4f },
  LIBRARIAN: { id: 'librarian', name: 'Bibliotecario', color: 0xffffff, hatColor: 0x0000ff },
};

// Trade definitions per profession
export const TRADES = {
  farmer: [
    { give: [76, 20], receive: { block: 103, count: 1 } }, // 20 wheat → 1 emerald
    { give: [103, 1], receive: { block: 79, count: 3 } },       // 1 emerald → 3 bread
    { give: [75, 10], receive: { block: 103, count: 1 } },
  ],
  butcher: [
    { give: [55, 10], receive: { block: 103, count: 1 } },
    { give: [103, 1], receive: { block: 61, count: 5 } },
    { give: [56, 10], receive: { block: 103, count: 1 } },
  ],
  blacksmith: [
    { give: [65, 4], receive: { block: 103, count: 1 } },
    { give: [103, 3], receive: { block: 65, count: 2 } },
    { give: [20, 2], receive: { block: 103, count: 5 } },
  ],
  librarian: [
    { give: [102, 1], receive: { block: 103, count: 1 } }, // book → emerald
    { give: [103, 1], receive: { block: 102, count: 1 } }, // emerald → book
  ],
};

export class Villager {
  constructor(x, y, z, professionId) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.professionId = professionId;
    this.profession = VILLAGER_PROFESSIONS[professionId.toUpperCase()] || VILLAGER_PROFESSIONS.FARMER;
    this.trades = TRADES[professionId] || TRADES.farmer;
    this.tradeIndex = 0;
    this.mesh = null;
    this.wanderTarget = null;
    this.wanderTimer = 0;
    this.velocity = { x: 0, y: 0, z: 0 };
    this.onGround = false;
  }

  update(dt, world) {
    // Simple wandering AI
    this.wanderTimer -= dt;
    if (this.wanderTimer <= 0) {
      this.wanderTimer = 3 + Math.random() * 4;
      const angle = Math.random() * Math.PI * 2;
      const dist = 2 + Math.random() * 4;
      this.wanderTarget = {
        x: this.x + Math.cos(angle) * dist,
        z: this.z + Math.sin(angle) * dist,
      };
    }

    if (this.wanderTarget) {
      const dx = this.wanderTarget.x - this.x;
      const dz = this.wanderTarget.z - this.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0.5) {
        const speed = 1.5;
        this.velocity.x = (dx / dist) * speed;
        this.velocity.z = (dz / dist) * speed;
      } else {
        this.velocity.x = 0;
        this.velocity.z = 0;
      }
    }

    // Gravity
    this.velocity.y -= 20 * dt;

    // Apply movement with simple collision
    const newX = this.x + this.velocity.x * dt;
    const newY = this.y + this.velocity.y * dt;
    const newZ = this.z + this.velocity.z * dt;

    // Ground check
    const groundBlock = world.getBlock(Math.floor(this.x), Math.floor(this.y - 0.1), Math.floor(this.z));
    if (groundBlock !== 0 && groundBlock !== 5) {
      if (this.velocity.y < 0) {
        this.velocity.y = 0;
        this.onGround = true;
      }
    } else {
      this.onGround = false;
    }

    // Horizontal collision
    const xBlock = world.getBlock(Math.floor(newX), Math.floor(this.y), Math.floor(this.z));
    if (xBlock === 0 || xBlock === 5) this.x = newX;
    else this.velocity.x = 0;

    const zBlock = world.getBlock(Math.floor(this.x), Math.floor(this.y), Math.floor(newZ));
    if (zBlock === 0 || zBlock === 5) this.z = newZ;
    else this.velocity.z = 0;

    if (!this.onGround) this.y = newY;

    // Update mesh
    if (this.mesh) {
      this.mesh.position.set(this.x, this.y, this.z);
    }
  }

  createMesh(THREE) {
    const group = new THREE.Group();
    // Body
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.8, 0.3);
    const bodyMat = new THREE.MeshLambertMaterial({ color: this.profession.color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.4;
    group.add(body);
    // Head
    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xffdab9 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.0;
    group.add(head);
    // Hat
    const hatGeo = new THREE.BoxGeometry(0.42, 0.15, 0.42);
    const hatMat = new THREE.MeshLambertMaterial({ color: this.profession.hatColor });
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 1.25;
    group.add(hat);

    group.position.set(this.x, this.y, this.z);
    this.mesh = group;
    return group;
  }

  getNextTrade() {
    const trade = this.trades[this.tradeIndex];
    this.tradeIndex = (this.tradeIndex + 1) % this.trades.length;
    return trade;
  }

  getAllTrades() {
    return this.trades;
  }
}

export class VillagerManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.villagers = [];
    this.spawnTimer = 0;
    this.naturalSpawnTimer = 10;
    this._spawnedChunks = new Set();
  }

  spawnVillager(x, y, z, professionId) {
    const professions = Object.keys(VILLAGER_PROFESSIONS);
    const prof = professionId || professions[Math.floor(Math.random() * professions.length)].toLowerCase();
    const villager = new Villager(x, y, z, prof);
    const mesh = villager.createMesh(THREE);
    this.scene.add(mesh);
    this.villagers.push(villager);
    return villager;
  }

  // Try natural spawning near village-like structures (planks/cobblestone buildings)
  tryNaturalSpawn(playerX, playerZ) {
    const cx = Math.floor(playerX / 16);
    const cz = Math.floor(playerZ / 16);
    const key = `${cx},${cz}`;
    if (this._spawnedChunks.has(key)) return;
    this._spawnedChunks.add(key);

    // Check if this chunk has village-like structures (planks nearby)
    let hasVillage = false;
    for (let dx = -8; dx <= 8; dx += 4) {
      for (let dz = -8; dz <= 8; dz += 4) {
        for (let dy = 60; dy < 100; dy++) {
          const block = this.world.getBlock(Math.floor(playerX + dx), dy, Math.floor(playerZ + dz));
          if (block === MC_BLOCKS.PLANKS || block === MC_BLOCKS.COBBLESTONE) {
            hasVillage = true;
            break;
          }
        }
        if (hasVillage) break;
      }
      if (hasVillage) break;
    }

    if (hasVillage && this.villagers.length < 10) {
      // Find surface near player
      const sx = Math.floor(playerX + (Math.random() - 0.5) * 16);
      const sz = Math.floor(playerZ + (Math.random() - 0.5) * 16);
      for (let y = 100; y > 60; y--) {
        const block = this.world.getBlock(sx, y, sz);
        if (block !== 0 && block !== 5) {
          this.spawnVillager(sx + 0.5, y + 1, sz + 0.5);
          break;
        }
      }
    }
  }

  update(dt) {
    this.spawnTimer -= dt;
    // Natural spawn check every 10 seconds
    this.naturalSpawnTimer -= dt;
    if (this.naturalSpawnTimer <= 0) {
      this.naturalSpawnTimer = 10;
    }
    for (const v of this.villagers) {
      v.update(dt, this.world);
    }
  }

  getNearbyVillager(x, y, z, radius = 2) {
    for (const v of this.villagers) {
      const dx = v.x - x;
      const dy = v.y - y;
      const dz = v.z - z;
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < radius) {
        return v;
      }
    }
    return null;
  }

  removeVillager(villager) {
    const idx = this.villagers.indexOf(villager);
    if (idx >= 0) {
      if (villager.mesh) this.scene.remove(villager.mesh);
      this.villagers.splice(idx, 1);
    }
  }
}

// Trading manager
export class TradingManager {
  constructor() {
    this.activeVillager = null;
    this.uiOpen = false;
  }

  open(villager) {
    this.activeVillager = villager;
    this.uiOpen = true;
  }

  close() {
    this.activeVillager = null;
    this.uiOpen = false;
  }

  // Execute a trade — returns true if successful
  executeTrade(trade, inventory) {
    // Check if player has required items
    const [giveBlock, giveCount] = trade.give;
    let available = 0;
    for (let i = 0; i < inventory.hotbar.length; i++) {
      const slot = inventory.hotbar[i];
      if (slot && slot.block === giveBlock) {
        available += slot.count;
      }
    }
    if (available < giveCount) return false;

    // Remove items from inventory
    let remaining = giveCount;
    for (let i = 0; i < inventory.hotbar.length && remaining > 0; i++) {
      const slot = inventory.hotbar[i];
      if (slot && slot.block === giveBlock) {
        const take = Math.min(slot.count, remaining);
        slot.count -= take;
        remaining -= take;
        if (slot.count <= 0) inventory.hotbar[i] = null;
      }
    }

    // Add received items
    for (let i = 0; i < trade.receive.count; i++) {
      inventory.addBlock(trade.receive.block);
    }

    return true;
  }
}
