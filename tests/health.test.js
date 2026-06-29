import { describe, it, expect, vi } from 'vitest';
import { HealthHungerSystem } from '../core/jardvoxel-survival-health.js';

describe('HealthHungerSystem', () => {
  it('starts at full health and hunger', () => {
    const h = new HealthHungerSystem();
    expect(h.health).toBe(20);
    expect(h.hunger).toBe(20);
    expect(h.saturation).toBe(5);
    expect(h.dead).toBe(false);
  });

  describe('Creative mode', () => {
    it('takeDamage is ignored in creative', () => {
      const h = new HealthHungerSystem();
      h.setCreativeMode(true);
      h.takeDamage(10);
      expect(h.health).toBe(20);
    });

    it('heal is ignored in creative', () => {
      const h = new HealthHungerSystem();
      h.setCreativeMode(true);
      h.health = 10;
      h.heal(5);
      expect(h.health).toBe(10); // unchanged since creative
    });

    it('eat is ignored in creative', () => {
      const h = new HealthHungerSystem();
      h.setCreativeMode(true);
      expect(h.eat(55)).toBe(false);
    });
  });

  describe('Survival mode', () => {
    it('takeDamage reduces health', () => {
      const h = new HealthHungerSystem();
      h.setCreativeMode(false);
      h.takeDamage(5, 'fall');
      expect(h.health).toBe(15);
    });

    it('takeDamage kills at 0 health', () => {
      const h = new HealthHungerSystem();
      h.setCreativeMode(false);
      h.takeDamage(20, 'explosion');
      expect(h.health).toBe(0);
      expect(h.dead).toBe(true);
      expect(h.deathCause).toBe('explosion');
    });

    it('heal restores health up to max', () => {
      const h = new HealthHungerSystem();
      h.setCreativeMode(false);
      h.health = 10;
      h.heal(5);
      expect(h.health).toBe(15);
      h.heal(100);
      expect(h.health).toBe(20);
    });

    it('takeDamage is ignored when dead', () => {
      const h = new HealthHungerSystem();
      h.setCreativeMode(false);
      h.takeDamage(20, 'test');
      expect(h.dead).toBe(true);
      h.takeDamage(5, 'more');
      expect(h.health).toBe(0);
    });
  });

  describe('Eating', () => {
    it('eat restores hunger', () => {
      const h = new HealthHungerSystem();
      h.setCreativeMode(false);
      h.hunger = 10;
      h.eat(55); // raw beef: hunger +3
      expect(h.hunger).toBe(13);
    });

    it('eat does not exceed maxHunger', () => {
      const h = new HealthHungerSystem();
      h.setCreativeMode(false);
      h.hunger = 19;
      h.eat(55);
      expect(h.hunger).toBe(20);
    });

    it('isFood detects food blocks', () => {
      const h = new HealthHungerSystem();
      expect(h.isFood(55)).toBe(true);  // raw beef
      expect(h.isFood(79)).toBe(true);  // bread
      expect(h.isFood(1)).toBe(false);  // stone
    });

    it('returns false for non-food', () => {
      const h = new HealthHungerSystem();
      h.setCreativeMode(false);
      expect(h.eat(1)).toBe(false); // stone is not food
    });
  });

  describe('Update loop', () => {
    it('drains hunger over time', () => {
      const h = new HealthHungerSystem();
      h.setCreativeMode(false);
      const initialHunger = h.hunger;
      h.update(10, false, false);
      expect(h.hunger).toBeLessThanOrEqual(initialHunger);
    });

    it('drains hunger faster when sprinting', () => {
      const h1 = new HealthHungerSystem();
      h1.setCreativeMode(false);
      const h2 = new HealthHungerSystem();
      h2.setCreativeMode(false);
      h1.update(10, false, false);
      h2.update(10, false, true);
      expect(h2.hunger).toBeLessThanOrEqual(h1.hunger);
    });

    it('regenerates health when hunger >= 18', () => {
      const h = new HealthHungerSystem();
      h.setCreativeMode(false);
      h.health = 18;
      h.hunger = 19;
      h.update(5, false, false); // 5s > regenTimer threshold of 4
      expect(h.health).toBe(19);
    });

    it('starvation damages when hunger = 0', () => {
      const h = new HealthHungerSystem();
      h.setCreativeMode(false);
      h.hunger = 0;
      h.saturation = 0;
      h.update(5, false, false); // 5s > starveTimer threshold of 4
      expect(h.health).toBeLessThan(20);
    });

    it('drowning damages in water', () => {
      const h = new HealthHungerSystem();
      h.setCreativeMode(false);
      h.update(32, true, false); // 32s > 30 threshold, Math.floor(32) % 2 === 0
      expect(h.health).toBeLessThan(20);
    });

    it('no drowning with waterBreathing', () => {
      const h = new HealthHungerSystem();
      h.setCreativeMode(false);
      h.update(31, true, false, true); // waterBreathing = true
      expect(h.health).toBe(20);
    });
  });

  describe('Respawn', () => {
    it('resets all stats', () => {
      const h = new HealthHungerSystem();
      h.setCreativeMode(false);
      h.takeDamage(20, 'test');
      expect(h.dead).toBe(true);
      h.respawn();
      expect(h.health).toBe(20);
      expect(h.hunger).toBe(20);
      expect(h.dead).toBe(false);
      expect(h.deathCause).toBe('');
    });
  });

  describe('Serialize/Deserialize', () => {
    it('round-trips correctly', () => {
      const h = new HealthHungerSystem();
      h.setCreativeMode(false);
      h.health = 12;
      h.hunger = 8;
      h.saturation = 2;
      h.foodPoisonTimer = 10;
      const data = h.serialize();
      const h2 = new HealthHungerSystem();
      h2.setCreativeMode(false);
      h2.deserialize(data);
      expect(h2.health).toBe(12);
      expect(h2.hunger).toBe(8);
      expect(h2.saturation).toBe(2);
      expect(h2.foodPoisonTimer).toBe(10);
    });

    it('handles null data', () => {
      const h = new HealthHungerSystem();
      h.deserialize(null);
      expect(h.health).toBe(20);
    });
  });
});
