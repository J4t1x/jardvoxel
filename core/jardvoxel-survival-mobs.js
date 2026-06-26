// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Mobs — Passive + Hostile mobs with AI
// SPEC-041: Passive Mobs | SPEC-045: Hostile Mobs + Combat
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';
import { BLOCK } from './jardvoxel-survival-mesher.js';
import { BIOMES } from './jardvoxel-survival-engine.js';

// Mob types configuration
const MOB_TYPES = {
  COW: {
    id: 'cow', name: 'Cow', health: 10, width: 0.9, height: 1.4,
    speed: 0.7, fleeSpeed: 1.8,
    colors: { body: 0x4a3020, head: 0x3a2515, legs: 0x2a1a0a, spots: 0xf0f0f0 },
    drops: [{ block: 54, count: 1 }, { block: 55, count: 1 }], // leather=54, beef=55
    biomes: [BIOMES.PLAINS, BIOMES.SAVANNA, BIOMES.MEADOW],
  },
  PIG: {
    id: 'pig', name: 'Pig', health: 10, width: 0.9, height: 0.9,
    speed: 0.8, fleeSpeed: 1.6,
    colors: { body: 0xe8a0a8, head: 0xe8a0a8, legs: 0xd09098, spots: 0xf0c0c8 },
    drops: [{ block: 56, count: 1 }], // porkchop=56
    biomes: [BIOMES.PLAINS, BIOMES.FOREST, BIOMES.SAVANNA],
  },
  CHICKEN: {
    id: 'chicken', name: 'Chicken', health: 6, width: 0.6, height: 0.8,
    speed: 0.6, fleeSpeed: 1.4,
    colors: { body: 0xf0f0f0, head: 0xf0f0f0, legs: 0xe04030, spots: 0xe04030 },
    drops: [{ block: 57, count: 1 }, { block: 58, count: 1 }], // feather=57, chicken=58
    biomes: [BIOMES.PLAINS, BIOMES.FOREST, BIOMES.JUNGLE],
    canFly: true,
  },
  SHEEP: {
    id: 'sheep', name: 'Sheep', health: 8, width: 0.9, height: 1.3,
    speed: 0.7, fleeSpeed: 1.5,
    colors: { body: 0xe8e8e8, head: 0xe8e8e8, legs: 0xd0d0d0, spots: 0xd8c8c8 },
    drops: [{ block: 59, count: 1 }, { block: 60, count: 1 }], // wool=59, mutton=60
    biomes: [BIOMES.PLAINS, BIOMES.MEADOW, BIOMES.SAVANNA],
  },
};

// Food block IDs (for SPEC-042 integration)
export const FOOD_BLOCKS = {
  55: { name: 'Raw Beef', hunger: 3, saturation: 1.8, cooked: 61 },
  56: { name: 'Raw Porkchop', hunger: 3, saturation: 1.8, cooked: 62 },
  58: { name: 'Raw Chicken', hunger: 2, saturation: 1.2, cooked: 63, poisonChance: 0.3 },
  60: { name: 'Raw Mutton', hunger: 2, saturation: 1.2, cooked: 64 },
  61: { name: 'Cooked Beef', hunger: 6, saturation: 3.2 },
  62: { name: 'Cooked Porkchop', hunger: 6, saturation: 3.2 },
  63: { name: 'Cooked Chicken', hunger: 5, saturation: 2.4 },
  64: { name: 'Cooked Mutton', hunger: 6, saturation: 3.2 },
  79: { name: 'Bread', hunger: 5, saturation: 2.6 },
};

// New block IDs for mob drops and food
export const MOB_BLOCK_IDS = {
  LEATHER: 54, RAW_BEEF: 55, RAW_PORKCHOP: 56, FEATHER: 57, RAW_CHICKEN: 58,
  WOOL: 59, RAW_MUTTON: 60, COOKED_BEEF: 61, COOKED_PORKCHOP: 62,
  COOKED_CHICKEN: 63, COOKED_MUTTON: 64,
  ROTTEN_FLESH: 67, BONES: 68, ARROW: 69, GUNPOWDER: 70, STRING: 71,
};

// Hostile mob types (SPEC-045)
const HOSTILE_MOB_TYPES = {
  ZOMBIE: {
    id: 'zombie', name: 'Zombie', health: 20, width: 0.6, height: 1.8,
    speed: 1.8, hostile: true, damage: 4,
    colors: { body: 0x2a6a2a, head: 0x2a6a2a, legs: 0x204020, spots: 0x1a3a1a },
    drops: [{ block: 67, count: 1 }], // rotten flesh
    burnsInDaylight: true,
  },
  SKELETON: {
    id: 'skeleton', name: 'Skeleton', health: 20, width: 0.6, height: 1.8,
    speed: 1.8, hostile: true, damage: 3, ranged: true,
    colors: { body: 0xc8c8c0, head: 0xd0d0c8, legs: 0xb0b0a8, spots: 0xa0a098 },
    drops: [{ block: 68, count: 2 }, { block: 69, count: 2 }], // bones + arrows
    burnsInDaylight: true,
  },
  CREEPER: {
    id: 'creeper', name: 'Creeper', health: 20, width: 0.6, height: 1.7,
    speed: 1.8, hostile: true, damage: 12, explodes: true,
    colors: { body: 0x3a8a3a, head: 0x3a8a3a, legs: 0x2a6a2a, spots: 0x1a4a1a },
    drops: [{ block: 70, count: 1 }], // gunpowder
    burnsInDaylight: false,
  },
  SPIDER: {
    id: 'spider', name: 'Spider', health: 16, width: 1.0, height: 0.8,
    speed: 2.5, hostile: true, damage: 3, canLeap: true,
    colors: { body: 0x2a1a1a, head: 0x3a2a2a, legs: 0x1a0a0a, spots: 0x4a3a3a },
    drops: [{ block: 71, count: 2 }], // string
    burnsInDaylight: false,
    neutralInDaylight: true,
  },
};

// ═══════════════════════════════════════════════════════════
// Mob Entity — individual animal
// ═══════════════════════════════════════════════════════════

class Mob {
  constructor(type, x, y, z) {
    const cfg = MOB_TYPES[type] || HOSTILE_MOB_TYPES[type];
    this.type = type;
    this.config = cfg;
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3();
    this.health = cfg.health;
    this.maxHealth = cfg.health;
    this.width = cfg.width;
    this.height = cfg.height;
    this.state = 'idle'; // idle, wander, flee, chase, attack
    this.stateTimer = Math.random() * 3;
    this.wanderDir = new THREE.Vector3(0, 0, 0);
    this.bobPhase = Math.random() * Math.PI * 2;
    this.hitFlash = 0;
    this.dead = false;
    this.mesh = null;
    this.age = 0;
    this.hostile = !!cfg.hostile;
    this.attackCooldown = 0;
    this.fuseTimer = 0;
    this.exploded = false;
    this.burning = 0;
    this._buildMesh();
  }

  _buildMesh() {
    const cfg = this.config;
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(cfg.width, cfg.height * 0.5, cfg.width * 1.4);
    const bodyMat = new THREE.MeshLambertMaterial({ color: cfg.colors.body });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = cfg.height * 0.45;
    group.add(body);

    // Head
    const headSize = cfg.width * 0.6;
    const headGeo = new THREE.BoxGeometry(headSize, headSize, headSize);
    const headMat = new THREE.MeshLambertMaterial({ color: cfg.colors.head });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, cfg.height * 0.65, cfg.width * 0.8);
    head.name = 'head';
    group.add(head);

    // Legs (4)
    const legGeo = new THREE.BoxGeometry(cfg.width * 0.2, cfg.height * 0.35, cfg.width * 0.2);
    const legMat = new THREE.MeshLambertMaterial({ color: cfg.colors.legs });
    const legPositions = [
      [cfg.width * 0.3, cfg.height * 0.175, cfg.width * 0.5],
      [-cfg.width * 0.3, cfg.height * 0.175, cfg.width * 0.5],
      [cfg.width * 0.3, cfg.height * 0.175, -cfg.width * 0.5],
      [-cfg.width * 0.3, cfg.height * 0.175, -cfg.width * 0.5],
    ];
    this.legs = [];
    for (const [lx, ly, lz] of legPositions) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, ly, lz);
      leg.userData.basePos = { x: lx, y: ly, z: lz };
      group.add(leg);
      this.legs.push(leg);
    }

    // Spots (optional decoration)
    if (cfg.colors.spots && cfg.colors.spots !== cfg.colors.body) {
      const spotGeo = new THREE.BoxGeometry(cfg.width * 0.3, cfg.height * 0.52, cfg.width * 0.3);
      const spotMat = new THREE.MeshLambertMaterial({ color: cfg.colors.spots });
      const spot1 = new THREE.Mesh(spotGeo, spotMat);
      spot1.position.set(cfg.width * 0.2, cfg.height * 0.45, 0);
      group.add(spot1);
      const spot2 = new THREE.Mesh(spotGeo, spotMat);
      spot2.position.set(-cfg.width * 0.15, cfg.height * 0.45, cfg.width * 0.3);
      group.add(spot2);
    }

    this.mesh = group;
    this.mesh.position.copy(this.position);
  }

  takeDamage(amount) {
    this.health -= amount;
    this.hitFlash = 0.3;
    if (this.hostile) {
      this.state = 'chase';
      this.stateTimer = 5;
    } else {
      this.state = 'flee';
      this.stateTimer = 3 + Math.random() * 2;
    }
    // Knockback
    if (this._knockbackDir) {
      this.velocity.x += this._knockbackDir.x * 6;
      this.velocity.z += this._knockbackDir.z * 6;
      this.velocity.y += 3;
    }
    if (this.health <= 0) {
      this.dead = true;
    }
  }

  update(dt, world, playerPos, dayFactor, playerHealth) {
    if (this.dead) return;
    if (this.exploded) return;
    this.age += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    // Burning in daylight
    if (this.config.burnsInDaylight && dayFactor > 0.5 && this.position.y > 40) {
      this.burning += dt;
      if (this.burning > 0.5) {
        this.health -= 2 * dt;
        if (this.health <= 0) {
          this.dead = true;
          return;
        }
      }
    } else {
      this.burning = 0;
    }

    // Hostile AI
    if (this.hostile) {
      const distToPlayer = this.position.distanceTo(playerPos);
      const isNeutral = this.config.neutralInDaylight && dayFactor > 0.5;

      if (isNeutral && this.state !== 'chase') {
        // Spider in daylight: neutral, just wander
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          if (this.state === 'idle') {
            this.state = 'wander';
            this.stateTimer = 2 + Math.random() * 3;
            const angle = Math.random() * Math.PI * 2;
            this.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
          } else {
            this.state = 'idle';
            this.stateTimer = 2 + Math.random() * 3;
          }
        }
        const speed = this.config.speed * 0.5;
        if (this.state === 'wander') {
          this.velocity.x = this.wanderDir.x * speed;
          this.velocity.z = this.wanderDir.z * speed;
        } else {
          this.velocity.x *= 0.8;
          this.velocity.z *= 0.8;
        }
      } else if (distToPlayer < 16) {
        // Chase player
        this.state = 'chase';
        const dir = new THREE.Vector3().subVectors(playerPos, this.position);
        dir.y = 0;
        if (dir.lengthSq() > 0) dir.normalize();

        // Creeper: explode when close
        if (this.config.explodes && distToPlayer < 2.5) {
          this.fuseTimer += dt;
          if (this.fuseTimer > 1.5) {
            this._explode(world, playerPos, playerHealth);
            return;
          }
          // Slow down during fuse
          this.velocity.x *= 0.3;
          this.velocity.z *= 0.3;
        } else {
          this.fuseTimer = 0;
          this.velocity.x = dir.x * this.config.speed;
          this.velocity.z = dir.z * this.config.speed;
        }

        // Attack when in range
        if (distToPlayer < 1.5 && this.attackCooldown <= 0) {
          this.attackCooldown = 1.0;
          if (playerHealth) playerHealth(this.config.damage, this.config.name);
          // Knockback player
          this._knockbackDir = dir.clone().negate();
        }

        // Skeleton: ranged attack
        if (this.config.ranged && distToPlayer < 10 && distToPlayer > 2 && this.attackCooldown <= 0) {
          this.attackCooldown = 2.0;
          // Spawn arrow projectile (returned for game to process)
          this._pendingArrow = {
            origin: this.position.clone().add(new THREE.Vector3(0, 1, 0)),
            dir: dir.clone(),
            damage: this.config.damage,
          };
        }

        // Spider: leap attack
        if (this.config.canLeap && distToPlayer < 4 && distToPlayer > 1.5 && this.attackCooldown <= 0) {
          this.attackCooldown = 1.5;
          this.velocity.y = 6;
          this.velocity.x = dir.x * this.config.speed * 1.5;
          this.velocity.z = dir.z * this.config.speed * 1.5;
        }
      } else {
        // Lost player, wander
        this.state = 'wander';
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          const angle = Math.random() * Math.PI * 2;
          this.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
          this.stateTimer = 2 + Math.random() * 3;
        }
        this.velocity.x = this.wanderDir.x * this.config.speed * 0.5;
        this.velocity.z = this.wanderDir.z * this.config.speed * 0.5;
      }
    } else {
      // Passive AI (existing)
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        if (this.state === 'flee') {
          this.state = 'idle';
          this.stateTimer = 2 + Math.random() * 3;
        } else if (this.state === 'idle') {
          this.state = 'wander';
          this.stateTimer = 2 + Math.random() * 3;
          const angle = Math.random() * Math.PI * 2;
          this.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
        } else {
          this.state = 'idle';
          this.stateTimer = 2 + Math.random() * 3;
        }
      }

      const speed = this.state === 'flee' ? this.config.fleeSpeed : this.config.speed;
      if (this.state === 'wander' || this.state === 'flee') {
        let dir;
        if (this.state === 'flee') {
          dir = new THREE.Vector3().subVectors(this.position, playerPos);
          dir.y = 0;
          if (dir.lengthSq() > 0) dir.normalize();
        } else {
          dir = this.wanderDir;
        }
        this.velocity.x = dir.x * speed;
        this.velocity.z = dir.z * speed;
      } else {
        this.velocity.x *= 0.8;
        this.velocity.z *= 0.8;
      }
    }

    // Gravity
    this.velocity.y -= 24 * dt;

    // Move with collision
    this._moveAxis('x', this.velocity.x * dt, world);
    this._moveAxis('z', this.velocity.z * dt, world);
    this._moveAxis('y', this.velocity.y * dt, world);

    // Face direction
    if (Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.z) > 0.01) {
      const targetRot = Math.atan2(this.velocity.x, this.velocity.z);
      this.mesh.rotation.y += (targetRot - this.mesh.rotation.y) * 0.15;
    }

    // Bob animation
    const moving = Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.z) > 0.1;
    if (moving) {
      this.bobPhase += dt * 8;
      const bob = Math.sin(this.bobPhase) * 0.05;
      this.mesh.position.y = this.position.y + bob;
      // Leg animation
      if (this.legs) {
        for (let i = 0; i < this.legs.length; i++) {
          const phase = this.bobPhase + (i % 2) * Math.PI;
          this.legs[i].position.z = this.legs[i].userData.basePos.z + Math.sin(phase) * 0.1;
        }
      }
    } else {
      this.mesh.position.y = this.position.y;
    }

    // Hit flash + burning visual
    if (this.hitFlash > 0) {
      this.mesh.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.emissive = new THREE.Color(0xff0000);
          child.material.emissiveIntensity = this.hitFlash * 2;
        }
      });
    } else if (this.burning > 0) {
      const flicker = 0.5 + Math.sin(this.age * 20) * 0.3;
      this.mesh.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.emissive = new THREE.Color(0xff4400);
          child.material.emissiveIntensity = flicker;
        }
      });
    } else {
      this.mesh.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.emissive = new THREE.Color(0x000000);
          child.material.emissiveIntensity = 0;
        }
      });
    }

    this.mesh.position.x = this.position.x;
    this.mesh.position.z = this.position.z;
  }

  _moveAxis(axis, amount, world) {
    if (amount === 0) return;
    const pos = this.position.clone();
    pos[axis] += amount;

    const minX = Math.floor(pos.x - this.width * 0.5);
    const maxX = Math.floor(pos.x + this.width * 0.5);
    const minY = Math.floor(pos.y - this.height);
    const maxY = Math.floor(pos.y);
    const minZ = Math.floor(pos.z - this.width * 0.5);
    const maxZ = Math.floor(pos.z + this.width * 0.5);

    let collision = false;
    for (let x = minX; x <= maxX && !collision; x++) {
      for (let y = minY; y <= maxY && !collision; y++) {
        for (let z = minZ; z <= maxZ && !collision; z++) {
          const block = world.getBlock(x, y, z);
          if (block !== BLOCK.AIR && block !== BLOCK.WATER) {
            collision = true;
          }
        }
      }
    }

    if (collision) {
      if (axis === 'y') {
        if (amount < 0) this.velocity.y = 0;
        else this.velocity.y = 0;
      }
    } else {
      this.position[axis] = pos[axis];
    }
  }

  getDrops() {
    const drops = [];
    for (const drop of this.config.drops) {
      const count = drop.count + Math.floor(Math.random() * 2);
      drops.push({ block: drop.block, count });
    }
    return drops;
  }

  _explode(world, playerPos, playerHealth) {
    this.exploded = true;
    this.dead = true;
    const radius = 3;
    const cx = Math.floor(this.position.x);
    const cy = Math.floor(this.position.y);
    const cz = Math.floor(this.position.z);
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dz = -radius; dz <= radius; dz++) {
          const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
          if (d <= radius) {
            const bx = cx + dx, by = cy + dy, bz = cz + dz;
            const block = world.getBlock(bx, by, bz);
            if (block !== 0 && block !== 38) { // not air, not bedrock
              world.setBlock(bx, by, bz, 0);
            }
          }
        }
      }
    }
    // Damage player if close
    const distToPlayer = this.position.distanceTo(playerPos);
    if (distToPlayer < radius + 1 && playerHealth) {
      const dmg = Math.max(1, this.config.damage * (1 - distToPlayer / (radius + 1)));
      playerHealth(Math.floor(dmg), 'Creeper Explosion');
    }
  }

  consumePendingArrow() {
    const arrow = this._pendingArrow;
    this._pendingArrow = null;
    return arrow;
  }

  dispose(scene) {
    if (this.mesh) {
      scene.remove(this.mesh);
      this.mesh.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
      this.mesh = null;
    }
  }
}

// ═══════════════════════════════════════════════════════════
// Mob Manager — spawning, despawning, updates
// ═══════════════════════════════════════════════════════════

export class MobManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.mobs = [];
    this.maxMobs = 20;
    this.maxHostileMobs = 8;
    this.maxPerChunk = 4;
    this.spawnTimer = 0;
    this.spawnInterval = 3;
    this.hostileSpawnTimer = 0;
    this.hostileSpawnInterval = 3;
    this.dayFactor = 1;
    this.playerHealthCallback = null;
    this.pendingArrows = [];
  }

  _getBiomeAt(x, z) {
    if (this.world.generator.getBiome) {
      return this.world.generator.getBiome(x, z);
    }
    return BIOMES.PLAINS;
  }

  _trySpawn() {
    if (this.mobs.length >= this.maxMobs) return;

    // Pick random position near player
    const player = this.world._playerChunkX;
    const playerZ = this.world._playerChunkZ;
    if (player === undefined) return;

    const angle = Math.random() * Math.PI * 2;
    const dist = 12 + Math.random() * 16;
    const sx = Math.floor(player * 16 + Math.cos(angle) * dist);
    const sz = Math.floor(playerZ * 16 + Math.sin(angle) * dist);

    // Check biome
    const biome = this._getBiomeAt(sx, sz);

    // Find valid mob types for biome
    const validTypes = [];
    for (const [type, cfg] of Object.entries(MOB_TYPES)) {
      if (cfg.biomes.includes(biome)) {
        validTypes.push(type);
      }
    }
    if (validTypes.length === 0) return;

    // Count mobs in this area
    let nearbyCount = 0;
    for (const mob of this.mobs) {
      const dx = mob.position.x - sx;
      const dz = mob.position.z - sz;
      if (Math.sqrt(dx * dx + dz * dz) < 16) nearbyCount++;
    }
    if (nearbyCount >= this.maxPerChunk) return;

    // Find surface height
    let surfaceY = -1;
    for (let y = 80; y >= 0; y--) {
      const block = this.world.getBlock(sx, y, sz);
      if (block !== BLOCK.AIR && block !== BLOCK.WATER) {
        surfaceY = y + 1;
        break;
      }
    }
    if (surfaceY < 0) return;

    // Don't spawn on water
    const blockBelow = this.world.getBlock(sx, surfaceY - 1, sz);
    if (blockBelow === BLOCK.WATER) return;

    // Spawn mob
    const type = validTypes[Math.floor(Math.random() * validTypes.length)];
    const mob = new Mob(type, sx + 0.5, surfaceY + 1, sz + 0.5);
    this.scene.add(mob.mesh);
    this.mobs.push(mob);
  }

  _trySpawnHostile() {
    // Count hostile mobs
    let hostileCount = 0;
    for (const mob of this.mobs) {
      if (mob.hostile) hostileCount++;
    }
    if (hostileCount >= this.maxHostileMobs) return;

    const player = this.world._playerChunkX;
    const playerZ = this.world._playerChunkZ;
    if (player === undefined) return;

    const angle = Math.random() * Math.PI * 2;
    const dist = 16 + Math.random() * 16;
    const sx = Math.floor(player * 16 + Math.cos(angle) * dist);
    const sz = Math.floor(playerZ * 16 + Math.sin(angle) * dist);

    // Find surface height
    let surfaceY = -1;
    let isUnderground = false;
    for (let y = 80; y >= 0; y--) {
      const block = this.world.getBlock(sx, y, sz);
      if (block !== BLOCK.AIR && block !== BLOCK.WATER) {
        surfaceY = y + 1;
        break;
      }
    }
    if (surfaceY < 0) return;

    // Check if underground (cave spawn) — block above is solid
    const blockAbove = this.world.getBlock(sx, surfaceY + 2, sz);
    if (blockAbove !== BLOCK.AIR && blockAbove !== BLOCK.WATER) {
      isUnderground = true;
    }

    // Don't spawn on water
    const blockBelow = this.world.getBlock(sx, surfaceY - 1, sz);
    if (blockBelow === BLOCK.WATER) return;

    // Spawn conditions: night (dayFactor < 0.3) or underground
    const isNight = this.dayFactor < 0.3;
    if (!isNight && !isUnderground) return;

    // Creepers only spawn on surface at night
    let validTypes = [];
    if (isUnderground) {
      validTypes = ['ZOMBIE', 'SKELETON', 'SPIDER'];
    } else {
      // Night surface: all types except creeper can be underground too
      validTypes = ['ZOMBIE', 'SKELETON', 'CREEPER', 'SPIDER'];
    }
    if (validTypes.length === 0) return;

    const type = validTypes[Math.floor(Math.random() * validTypes.length)];
    const mob = new Mob(type, sx + 0.5, surfaceY + 1, sz + 0.5);
    this.scene.add(mob.mesh);
    this.mobs.push(mob);
  }

  update(dt, playerPos) {
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this._trySpawn();
    }

    this.hostileSpawnTimer += dt;
    if (this.hostileSpawnTimer >= this.hostileSpawnInterval) {
      this.hostileSpawnTimer = 0;
      this._trySpawnHostile();
    }

    // Update mobs
    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const mob = this.mobs[i];
      mob.update(dt, this.world, playerPos, this.dayFactor, this.playerHealthCallback);

      // Collect pending arrows from skeletons
      if (mob._pendingArrow) {
        this.pendingArrows.push(mob.consumePendingArrow());
      }

      // Despawn if too far
      const dx = mob.position.x - playerPos.x;
      const dz = mob.position.z - playerPos.z;
      const distSq = dx * dx + dz * dz;
      if (distSq > 1600) { // 40 blocks
        mob.dispose(this.scene);
        this.mobs.splice(i, 1);
        continue;
      }

      // Hostile mobs despawn at 48+ blocks
      if (mob.hostile && distSq > 2304) { // 48 blocks
        mob.dispose(this.scene);
        this.mobs.splice(i, 1);
        continue;
      }

      // Remove dead mobs
      if (mob.dead) {
        mob.dispose(this.scene);
        this.mobs.splice(i, 1);
        continue;
      }
    }
  }

  // Raycast hit test for combat
  hitTest(origin, dir, maxDist) {
    let closestMob = null;
    let closestDist = maxDist;

    for (const mob of this.mobs) {
      if (mob.dead) continue;
      // Simple sphere intersection
      const toMob = new THREE.Vector3().subVectors(mob.position, origin);
      const proj = toMob.dot(dir);
      if (proj < 0 || proj > closestDist) continue;

      const closestPoint = origin.clone().add(dir.clone().multiplyScalar(proj));
      const distToMob = closestPoint.distanceTo(mob.position);
      if (distToMob < mob.width + 0.3) {
        closestMob = mob;
        closestDist = proj;
      }
    }

    return closestMob;
  }

  // Get drops from a killed mob
  killMob(mob) {
    mob.dead = true;
    return mob.getDrops();
  }

  // Serialize for save
  serialize() {
    return this.mobs.map(m => ({
      type: m.type,
      x: m.position.x, y: m.position.y, z: m.position.z,
      health: m.health,
    }));
  }

  // Deserialize from save
  deserialize(data, scene) {
    for (const m of data) {
      const mob = new Mob(m.type, m.x, m.y, m.z);
      mob.health = m.health;
      scene.add(mob.mesh);
      this.mobs.push(mob);
    }
  }

  dispose() {
    for (const mob of this.mobs) {
      mob.dispose(this.scene);
    }
    this.mobs = [];
  }
}

export { MOB_TYPES, HOSTILE_MOB_TYPES };
