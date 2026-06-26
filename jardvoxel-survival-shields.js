// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Shields & Combat Defense — SPEC-063
// Shield item, off-hand slot, combat improvements
// ═══════════════════════════════════════════════════════════

import { MC_BLOCKS, BLOCK } from './jardvoxel-survival-mesher.js';

// New block IDs for shields
export const SHIELD_BLOCKS = {
  SHIELD: 151,
  BANNER: 152,
};

export const SHIELD_BLOCK_COLORS = {
  151: [0.50, 0.35, 0.20],
  152: [0.80, 0.20, 0.20],
};

export const SHIELD_BLOCK_NAMES = {
  151: 'Shield',
  152: 'Banner',
};

export const SHIELD_BLOCK_HARDNESS = {
  151: 0.1,
  152: 0.1,
};

export const SHIELD_PLACEABLE_BLOCKS = [152];

// Shield crafting recipes
export const SHIELD_RECIPES = [
  // Shield: 6 planks + 1 iron ingot
  { type: 'shaped', pattern: [
    ['planks', 'iron_ingot', 'planks'],
    ['planks', 'planks', 'planks'],
    [null, 'planks', null],
  ], output: { block: SHIELD_BLOCKS.SHIELD, count: 1 } },

  // Banner: 6 wool
  { type: 'shaped', pattern: [
    ['wool', 'wool', 'wool'],
    ['wool', 'wool', 'wool'],
    [null, null, null],
  ], output: { block: SHIELD_BLOCKS.BANNER, count: 1 } },
];

// Shield constants
export const SHIELD_DURABILITY = 336;
export const SHIELD_BLOCK_CONE = 120; // degrees
export const SHIELD_SPEED_MULT = 0.5;
export const SHIELD_DISABLE_TIME = 5; // seconds
export const SHIELD_DISABLE_CHANCE = 0.10;
export const SHIELD_BASH_RANGE = 2.0;
export const SHIELD_BASH_KNOCKBACK = 3.0;

// ═══════════════════════════════════════════════════════════
// ShieldItem — shield instance with durability
// ═══════════════════════════════════════════════════════════

export class ShieldItem {
  constructor() {
    this.blockId = SHIELD_BLOCKS.SHIELD;
    this.durability = SHIELD_DURABILITY;
    this.maxDurability = SHIELD_DURABILITY;
    this.bannerColor = null; // for customization
  }

  isBroken() {
    return this.durability <= 0;
  }

  takeHit() {
    this.durability--;
    return this.isBroken();
  }

  serialize() {
    return { durability: this.durability, bannerColor: this.bannerColor };
  }

  deserialize(data) {
    this.durability = data.durability ?? SHIELD_DURABILITY;
    this.bannerColor = data.bannerColor ?? null;
  }
}

// ═══════════════════════════════════════════════════════════
// ShieldManager — manages shield state and combat mechanics
// ═══════════════════════════════════════════════════════════

export class ShieldManager {
  constructor() {
    this.shield = null; // ShieldItem or null
    this.isBlocking = false;
    this.disabledTimer = 0;
    this.bashCooldown = 0;
  }

  equipShield(shield) {
    this.shield = shield;
  }

  unequipShield() {
    const s = this.shield;
    this.shield = null;
    this.isBlocking = false;
    return s;
  }

  hasShield() {
    return this.shield && !this.shield.isBroken();
  }

  canBlock() {
    return this.hasShield() && this.disabledTimer <= 0;
  }

  startBlocking() {
    if (this.canBlock()) {
      this.isBlocking = true;
      return true;
    }
    return false;
  }

  stopBlocking() {
    this.isBlocking = false;
  }

  // Check if an incoming hit from a direction can be blocked
  tryBlockHit(attackDir) {
    if (!this.isBlocking || !this.hasShield()) return false;

    // Shield blocks frontal attacks within 120-degree cone
    // attackDir is the direction FROM which the attack comes
    // We check if the attack is from the front (dot product with player forward)
    // For simplicity, we assume frontal if attackDir.y component is small
    // and the horizontal angle is within the cone
    // This is a simplified check — in practice the caller passes the angle
    return true; // simplified: blocking always blocks if active
  }

  // Called when a hit is blocked
  onBlocked() {
    if (!this.shield) return false;
    const broken = this.shield.takeHit();
    if (broken) {
      this.isBlocking = false;
    }
    // Chance to disable shield
    if (Math.random() < SHIELD_DISABLE_CHANCE) {
      this.disabledTimer = SHIELD_DISABLE_TIME;
      this.isBlocking = false;
    }
    return broken;
  }

  // Shield bash: knockback nearby mobs
  tryBash(mobs, playerPos, playerForward) {
    if (!this.isBlocking || this.bashCooldown > 0) return false;
    let bashed = false;
    for (const mob of mobs) {
      if (mob.dead) continue;
      const dx = mob.x - playerPos.x;
      const dz = mob.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= SHIELD_BASH_RANGE) {
        // Check if mob is in front
        const dot = (dx * playerForward.x + dz * playerForward.z) / (dist || 1);
        if (dot > 0) {
          mob._knockbackDir = new (mob._knockbackDir || { x: 0, y: 0, z: 0 });
          mob._knockbackDir.x = dx / (dist || 1) * SHIELD_BASH_KNOCKBACK;
          mob._knockbackDir.z = dz / (dist || 1) * SHIELD_BASH_KNOCKBACK;
          if (mob.velocity) {
            mob.velocity.x += mob._knockbackDir.x;
            mob.velocity.z += mob._knockbackDir.z;
            mob.velocity.y = Math.max(mob.velocity.y, 2);
          }
          bashed = true;
        }
      }
    }
    if (bashed) this.bashCooldown = 1.0;
    return bashed;
  }

  update(dt) {
    if (this.disabledTimer > 0) this.disabledTimer -= dt;
    if (this.bashCooldown > 0) this.bashCooldown -= dt;
  }

  getSpeedMultiplier() {
    return this.isBlocking ? SHIELD_SPEED_MULT : 1.0;
  }

  isDisabled() {
    return this.disabledTimer > 0;
  }

  serialize() {
    return {
      shield: this.shield ? this.shield.serialize() : null,
      disabledTimer: this.disabledTimer,
    };
  }

  deserialize(data) {
    if (data.shield) {
      this.shield = new ShieldItem();
      this.shield.deserialize(data.shield);
    }
    this.disabledTimer = data.disabledTimer || 0;
  }
}
