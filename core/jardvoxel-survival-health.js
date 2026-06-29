// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Health & Hunger — Survival stats
// SPEC-042: Health & Hunger System
// ═══════════════════════════════════════════════════════════

import { MOB_BLOCK_IDS, FOOD_BLOCKS } from './jardvoxel-survival-mobs.js';

export class HealthHungerSystem {
  constructor() {
    this.maxHealth = 20; // 10 hearts
    this.maxHunger = 20; // 10 drumsticks
    this.maxSaturation = 5;
    this.health = this.maxHealth;
    this.hunger = this.maxHunger;
    this.saturation = this.maxSaturation;
    this.creativeMode = true;
    // Exploration mode: relaxed world — no hunger drain, no damage, no death.
    // Independent of creative/survival toggle so the player can never die.
    // Default false to preserve survival semantics for the core test suite;
    // the game enables it explicitly at init.
    this.explorationMode = false;
    this.foodPoisonTimer = 0;
    this.regenTimer = 0;
    this.starveTimer = 0;
    this.drownTimer = 0;
    this.damageFlash = 0;
    this.dead = false;
    this.deathCause = '';
  }

  setCreativeMode(creative) {
    this.creativeMode = creative;
    if (creative) {
      this.health = this.maxHealth;
      this.hunger = this.maxHunger;
      this.saturation = this.maxSaturation;
    }
  }

  takeDamage(amount, cause = 'unknown') {
    if (this.creativeMode || this.explorationMode || this.dead) return;
    this.health = Math.max(0, this.health - amount);
    this.damageFlash = 0.5;
    if (this.health <= 0) {
      this.dead = true;
      this.deathCause = cause;
    }
  }

  heal(amount) {
    if (this.creativeMode || this.dead) return;
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  eat(blockId) {
    if (this.creativeMode || this.dead) return false;
    const food = FOOD_BLOCKS[blockId];
    if (!food) return false;
    this.hunger = Math.min(this.maxHunger, this.hunger + food.hunger);
    this.saturation = Math.min(this.maxSaturation, this.saturation + food.saturation);
    if (food.poisonChance && Math.random() < food.poisonChance) {
      this.foodPoisonTimer = 30;
    }
    return true;
  }

  isFood(blockId) {
    return !!FOOD_BLOCKS[blockId];
  }

  update(dt, inWater, sprinting, waterBreathing = false) {
    if (this.creativeMode || this.dead) return;
    this.damageFlash = Math.max(0, this.damageFlash - dt);

    // Exploration mode: keep stats topped up, skip hunger/starvation/drowning.
    if (this.explorationMode) {
      this.hunger = this.maxHunger;
      this.saturation = this.maxSaturation;
      if (this.health < this.maxHealth) this.health = this.maxHealth;
      this.drownTimer = 0;
      this.starveTimer = 0;
      return;
    }

    // Food poisoning
    if (this.foodPoisonTimer > 0) {
      this.foodPoisonTimer -= dt;
    }

    // Hunger drain
    const drainRate = sprinting ? 0.5 / 20 : 0.5 / 40; // per second
    const poisonMult = this.foodPoisonTimer > 0 ? 2 : 1;
    this.saturation = Math.max(0, this.saturation - drainRate * poisonMult * dt);
    if (this.saturation <= 0) {
      this.hunger = Math.max(0, this.hunger - drainRate * poisonMult * dt);
    }

    // Health regen
    if (this.hunger >= 18 && this.health < this.maxHealth) {
      this.regenTimer += dt;
      if (this.regenTimer >= 4) {
        this.heal(1);
        this.regenTimer = 0;
      }
    } else {
      this.regenTimer = 0;
    }

    // Starvation
    if (this.hunger <= 0) {
      this.starveTimer += dt;
      if (this.starveTimer >= 4) {
        this.takeDamage(1, 'Starvation');
        this.starveTimer = 0;
      }
    } else {
      this.starveTimer = 0;
    }

    // Drowning
    if (inWater && !waterBreathing) {
      this.drownTimer += dt;
      if (this.drownTimer >= 30) {
        if (Math.floor(this.drownTimer) % 2 === 0) {
          this.takeDamage(1, 'Drowning');
        }
      }
    } else {
      this.drownTimer = 0;
    }
  }

  respawn() {
    this.health = this.maxHealth;
    this.hunger = this.maxHunger;
    this.saturation = this.maxSaturation;
    this.foodPoisonTimer = 0;
    this.damageFlash = 0;
    this.dead = false;
    this.deathCause = '';
  }

  serialize() {
    return {
      health: this.health,
      hunger: this.hunger,
      saturation: this.saturation,
      foodPoisonTimer: this.foodPoisonTimer,
    };
  }

  deserialize(data) {
    if (!data) return;
    this.health = data.health ?? this.maxHealth;
    this.hunger = data.hunger ?? this.maxHunger;
    this.saturation = data.saturation ?? this.maxSaturation;
    this.foodPoisonTimer = data.foodPoisonTimer ?? 0;
  }
}
