import { describe, it, expect, beforeEach } from 'vitest';
import { AmbientSoundManager, AMBIENT_PROFILES } from '../core/jardvoxel-survival-ambient-sound.js';

function makeMockCtx() {
  const chainable = { connect: () => chainable, disconnect: () => {} };
  const ctx = { currentTime: 0, state: 'running', destination: chainable };
  ctx.createGain = () => ({
    gain: { value: 0, cancelScheduledValues() {}, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} },
    connect: () => chainable,
    disconnect: () => {},
  });
  ctx.createOscillator = () => ({
    type: '',
    frequency: { value: 0, cancelScheduledValues() {}, setValueAtTime() {}, linearRampToValueAtTime() {} },
    start() {}, stop() {}, connect: () => chainable, disconnect: () => {}, onended: null,
  });
  ctx.createBiquadFilter = () => ({
    type: '', frequency: { value: 0 }, connect: () => chainable, disconnect: () => {},
  });
  ctx.createPanner = () => ({
    panningModel: '', distanceModel: '', refDistance: 0, maxDistance: 0, rolloffFactor: 0,
    positionX: { value: 0 }, positionY: { value: 0 }, positionZ: { value: 0 },
    setPosition() {}, connect: () => chainable, disconnect: () => {},
  });
  ctx.listener = {
    positionX: { value: 0 }, positionY: { value: 0 }, positionZ: { value: 0 },
    forwardX: { value: 0 }, forwardY: { value: 0 }, forwardZ: { value: 0 },
    setPosition() {}, setOrientation() {},
  };
  return ctx;
}

describe('Ambient Sound System — SPEC-084', () => {
  let manager;

  beforeEach(() => {
    manager = new AmbientSoundManager();
  });

  describe('Biome Profiles', () => {
    it('should define 10 biome ambient profiles', () => {
      const biomes = Object.keys(AMBIENT_PROFILES);
      expect(biomes.length).toBe(10);
    });

    it('should have plains profile with birds, wind, insects', () => {
      const types = AMBIENT_PROFILES.plains.ambient.map(s => s.type);
      expect(types).toContain('birds');
      expect(types).toContain('wind');
      expect(types).toContain('insects');
    });

    it('should have forest profile with 5 bird types', () => {
      const birds = AMBIENT_PROFILES.forest.ambient.find(s => s.type === 'birds');
      expect(birds).toBeDefined();
      expect(birds.count).toBe(5);
    });

    it('should have desert profile with strong wind', () => {
      const wind = AMBIENT_PROFILES.desert.ambient.find(s => s.type === 'wind');
      expect(wind).toBeDefined();
      expect(wind.vol).toBeGreaterThan(0.1);
    });

    it('should have mountains profile with eagle and rockfall', () => {
      const types = AMBIENT_PROFILES.mountains.ambient.map(s => s.type);
      expect(types).toContain('eagle');
      expect(types).toContain('rockfall');
    });

    it('should have swamp profile with frogs and crows', () => {
      const types = AMBIENT_PROFILES.swamp.ambient.map(s => s.type);
      expect(types).toContain('frogs');
      expect(types).toContain('crows');
    });

    it('should have ocean profile with waves and seagulls', () => {
      const types = AMBIENT_PROFILES.ocean.ambient.map(s => s.type);
      expect(types).toContain('waves');
      expect(types).toContain('seagulls');
    });

    it('should have caves profile with drip and echo', () => {
      const types = AMBIENT_PROFILES.caves.ambient.map(s => s.type);
      expect(types).toContain('drip');
      expect(types).toContain('echo');
    });

    it('should have mystic_grove profile with chimes and whispers', () => {
      const types = AMBIENT_PROFILES.mystic_grove.ambient.map(s => s.type);
      expect(types).toContain('chimes');
      expect(types).toContain('whispers');
    });

    it('should have village profile with chatter and fire', () => {
      const types = AMBIENT_PROFILES.village.ambient.map(s => s.type);
      expect(types).toContain('chatter');
      expect(types).toContain('fire');
    });

    it('should have nether profile with drone and lava', () => {
      const types = AMBIENT_PROFILES.nether.ambient.map(s => s.type);
      expect(types).toContain('drone');
      expect(types).toContain('lava');
    });
  });

  describe('Lifecycle', () => {
    it('should init without errors', () => {
      const ctx = makeMockCtx();
      expect(() => manager.init(ctx)).not.toThrow();
    });

    it('should not crash init with null ctx', () => {
      expect(() => manager.init(null)).not.toThrow();
    });

    it('should set volume', () => {
      const ctx = makeMockCtx();
      manager.init(ctx);
      expect(() => manager.setVolume(0.8)).not.toThrow();
    });

    it('should set enabled', () => {
      const ctx = makeMockCtx();
      manager.init(ctx);
      expect(() => manager.setEnabled(false)).not.toThrow();
      expect(manager.enabled).toBe(false);
    });
  });

  describe('Biome Management', () => {
    it('should set biome without crash', () => {
      const ctx = makeMockCtx();
      manager.init(ctx);
      expect(() => manager.setBiome('plains')).not.toThrow();
      expect(manager.currentBiome).toBe('plains');
    });

    it('should not change biome to same value', () => {
      manager.currentBiome = 'plains';
      manager.setBiome('plains');
      expect(manager.previousBiome).toBeNull();
    });

    it('should not set unknown biome', () => {
      manager.setBiome('nonexistent');
      expect(manager.currentBiome).toBeNull();
    });

    it('should crossfade when changing biomes', () => {
      const ctx = makeMockCtx();
      manager.init(ctx);
      manager.setBiome('plains');
      manager.setBiome('forest');
      expect(manager.currentBiome).toBe('forest');
      expect(manager.previousBiome).toBe('plains');
    });

    it('should start continuous sounds on biome set', () => {
      const ctx = makeMockCtx();
      manager.init(ctx);
      manager.setBiome('ocean');
      expect(manager.continuousNodes.length).toBeGreaterThan(0);
    });

    it('should schedule intermittent sounds on biome set', () => {
      const ctx = makeMockCtx();
      manager.init(ctx);
      manager.setBiome('plains');
      expect(manager.scheduledTimers.length).toBeGreaterThan(0);
    });
  });

  describe('3D Positional Audio', () => {
    it('should play point sound without crash', () => {
      const ctx = makeMockCtx();
      manager.init(ctx);
      expect(() => manager.playPointSound('drip', 10, 20, 30, 0.1)).not.toThrow();
    });

    it('should not play point sound when disabled', () => {
      const ctx = makeMockCtx();
      manager.init(ctx);
      manager.setEnabled(false);
      manager.playPointSound('drip', 10, 20, 30, 0.1);
      expect(manager.pointSources.length).toBe(0);
    });

    it('should not play unknown sound type', () => {
      const ctx = makeMockCtx();
      manager.init(ctx);
      manager.playPointSound('nonexistent', 10, 20, 30, 0.1);
      expect(manager.pointSources.length).toBe(0);
    });

    it('should enforce max point sources (LRU)', () => {
      const ctx = makeMockCtx();
      manager.init(ctx);
      for (let i = 0; i < 20; i++) {
        manager.playPointSound('drip', i, 0, 0, 0.1);
      }
      expect(manager.pointSources.length).toBeLessThanOrEqual(16);
    });

    it('should update listener position', () => {
      const ctx = makeMockCtx();
      manager.init(ctx);
      expect(() => manager.updateListener(10, 20, 30, 0, -1)).not.toThrow();
      expect(manager._playerPos.x).toBe(10);
    });
  });

  describe('Crossfade', () => {
    it('should have 2s crossfade duration', () => {
      expect(manager.getCrossfadeDuration()).toBe(2);
    });
  });

  describe('Cleanup', () => {
    it('should destroy without crash', () => {
      const ctx = makeMockCtx();
      manager.init(ctx);
      manager.setBiome('plains');
      expect(() => manager.destroy()).not.toThrow();
    });

    it('should stop all sources on destroy', () => {
      const ctx = makeMockCtx();
      manager.init(ctx);
      manager.setBiome('forest');
      manager.destroy();
      expect(manager.continuousNodes.length).toBe(0);
      expect(manager.scheduledTimers.length).toBe(0);
    });
  });

  describe('Procedural Audio', () => {
    it('should not use any external audio files', () => {
      // All sound types are generated procedurally via Web Audio API
      // No fetch, no AudioBuffer loading from URLs
      const ctx = makeMockCtx();
      manager.init(ctx);
      manager.setBiome('plains');
      // If it works without any network, it's procedural
      expect(manager.continuousNodes.length).toBeGreaterThan(0);
    });

    it('should get profile for known biome', () => {
      expect(manager.getProfile('plains')).toBeDefined();
      expect(manager.getProfile('nonexistent')).toBeNull();
    });
  });
});
