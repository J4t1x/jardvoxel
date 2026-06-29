import { describe, it, expect, beforeEach } from 'vitest';
import {
  ChillTuneEngine,
  BIOME_SCALES,
  TIME_MODULATION,
  WEATHER_EFFECTS,
  EVENT_STINGERS,
} from '../core/jardvoxel-survival-chilltune.js';

describe('ChillTune 2.0 — SPEC-083', () => {
  let engine;

  function makeMockCtx() {
    const chainable = { connect: () => chainable, disconnect: () => {} };
    const ctx = { currentTime: 0, state: 'running', destination: chainable };
    ctx.createGain = () => ({ gain: { value: 0, cancelScheduledValues() {}, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: () => chainable, disconnect: () => {} });
    ctx.createOscillator = () => ({ type: '', frequency: { value: 0, cancelScheduledValues() {}, setValueAtTime() {}, linearRampToValueAtTime() {} }, start() {}, stop() {}, connect: () => chainable, disconnect: () => {}, onended: null });
    ctx.createBiquadFilter = () => ({ type: '', frequency: { value: 0 }, connect: () => chainable, disconnect: () => {} });
    ctx.createDelay = () => ({ delayTime: { value: 0 }, connect: () => chainable, disconnect: () => {} });
    ctx.resume = () => {};
    return ctx;
  }

  beforeEach(() => {
    engine = new ChillTuneEngine();
  });

  describe('Biome Scales', () => {
    it('should define biome scale mapping for 8+ biomes', () => {
      expect(Object.keys(BIOME_SCALES).length).toBeGreaterThanOrEqual(8);
    });

    it('should have pentatonic for plains', () => {
      expect(BIOME_SCALES.plains.scale).toBe('pentatonic');
    });

    it('should have dorian for forest', () => {
      expect(BIOME_SCALES.forest.scale).toBe('dorian');
    });

    it('should have phrygian for desert', () => {
      expect(BIOME_SCALES.desert.scale).toBe('phrygian');
    });

    it('should have lydian for mountains', () => {
      expect(BIOME_SCALES.mountains.scale).toBe('lydian');
    });

    it('should have chromatic for swamp', () => {
      expect(BIOME_SCALES.swamp.scale).toBe('chromatic');
    });

    it('should have lydian with arpeggios for mystic grove', () => {
      expect(BIOME_SCALES.mystic_grove.scale).toBe('lydian');
      expect(BIOME_SCALES.mystic_grove.arpeggios).toBe(true);
    });

    it('should have aeolian for ocean', () => {
      expect(BIOME_SCALES.ocean.scale).toBe('aeolian');
    });

    it('should have chromatic with drone for caves', () => {
      expect(BIOME_SCALES.caves.scale).toBe('chromatic');
      expect(BIOME_SCALES.caves.drone).toBe(true);
    });

    it('should return biome scale via getBiomeScale', () => {
      expect(engine.getBiomeScale('plains')).toBe('pentatonic');
      expect(engine.getBiomeScale('forest')).toBe('dorian');
      expect(engine.getBiomeScale('nonexistent')).toBeNull();
    });

    it('should update biome and trigger stinger on change', () => {
      engine.enabled = true;
      engine.ctx = makeMockCtx();
      engine.currentBiome = 'plains';
      engine.setBiome('forest');
      expect(engine.currentBiome).toBe('forest');
      expect(engine.previousBiome).toBe('plains');
    });

    it('should not trigger stinger on same biome', () => {
      engine.currentBiome = 'plains';
      const prev = engine.previousBiome;
      engine.setBiome('plains');
      expect(engine.previousBiome).toBe(prev);
    });
  });

  describe('Time of Day Modulation', () => {
    it('should define 4 time phases', () => {
      expect(Object.keys(TIME_MODULATION).length).toBe(4);
      expect(TIME_MODULATION.dawn).toBeDefined();
      expect(TIME_MODULATION.day).toBeDefined();
      expect(TIME_MODULATION.sunset).toBeDefined();
      expect(TIME_MODULATION.night).toBeDefined();
    });

    it('should have ascending flag for dawn', () => {
      expect(TIME_MODULATION.dawn.ascending).toBe(true);
    });

    it('should have descending flag for sunset', () => {
      expect(TIME_MODULATION.sunset.descending).toBe(true);
    });

    it('should have minimalist flag for night', () => {
      expect(TIME_MODULATION.night.minimalist).toBe(true);
    });

    it('should update time phase', () => {
      engine.setTimePhase('dawn');
      expect(engine.currentTimePhase).toBe('dawn');
    });

    it('should not update same time phase', () => {
      engine.currentTimePhase = 'day';
      engine.setTimePhase('day');
      expect(engine.currentTimePhase).toBe('day');
    });
  });

  describe('Weather Effects', () => {
    it('should define 4 weather types (including clear)', () => {
      expect(WEATHER_EFFECTS.clear).toBeDefined();
      expect(WEATHER_EFFECTS.rain).toBeDefined();
      expect(WEATHER_EFFECTS.snow).toBeDefined();
      expect(WEATHER_EFFECTS.thunder).toBeDefined();
    });

    it('should have percussion for rain', () => {
      expect(WEATHER_EFFECTS.rain.percussion).toBe(true);
    });

    it('should have crystal highs for snow', () => {
      expect(WEATHER_EFFECTS.snow.crystalHighs).toBe(true);
    });

    it('should have silence and dramatic impacts for thunder', () => {
      expect(WEATHER_EFFECTS.thunder.silence).toBe(true);
      expect(WEATHER_EFFECTS.thunder.dramaticImpacts).toBe(true);
    });

    it('should attenuate melody for rain', () => {
      expect(WEATHER_EFFECTS.rain.melodyAttenuation).toBeLessThan(1.0);
    });

    it('should update weather', () => {
      engine.setWeather('rain');
      expect(engine.currentWeather).toBe('rain');
    });

    it('should return weather effect', () => {
      engine.setWeather('rain');
      const effect = engine.getWeatherEffect();
      expect(effect.percussion).toBe(true);
    });
  });

  describe('Event Stingers', () => {
    it('should define 7 event stingers', () => {
      expect(Object.keys(EVENT_STINGERS).length).toBe(7);
    });

    it('should have structure discovery fanfare (3 notes)', () => {
      expect(EVENT_STINGERS.structure_discovery.notes.length).toBe(3);
    });

    it('should have new biome stinger (4 notes)', () => {
      expect(EVENT_STINGERS.new_biome.notes.length).toBe(4);
    });

    it('should have combat enter stinger', () => {
      expect(EVENT_STINGERS.combat_enter).toBeDefined();
    });

    it('should have archaeological stinger', () => {
      expect(EVENT_STINGERS.archaeological).toBeDefined();
    });

    it('should have npc death stinger', () => {
      expect(EVENT_STINGERS.npc_death).toBeDefined();
    });

    it('should have legendary stinger', () => {
      expect(EVENT_STINGERS.legendary).toBeDefined();
    });

    it('should have village approach stinger', () => {
      expect(EVENT_STINGERS.village_approach).toBeDefined();
    });

    it('should not crash when playing stinger without ctx', () => {
      expect(() => engine.playStinger('structure_discovery')).not.toThrow();
    });
  });

  describe('Crossfade', () => {
    it('should have 2s crossfade duration', () => {
      expect(engine.crossfadeDuration).toBe(2);
    });
  });

  describe('Combat Transition', () => {
    it('should enter combat state', () => {
      engine.ctx = makeMockCtx();
      engine.currentState = 'exploring';
      engine.enterCombat();
      expect(engine.targetState).toBe('combat');
      expect(engine.previousState).toBe('exploring');
    });

    it('should not re-enter combat if already in combat', () => {
      engine.ctx = makeMockCtx();
      engine.currentState = 'combat';
      engine.targetState = 'combat';
      const prev = engine.previousState;
      engine.enterCombat();
      expect(engine.previousState).toBe(prev);
    });

    it('should exit combat to previous state', () => {
      engine.ctx = makeMockCtx();
      engine.previousState = 'exploring';
      engine.currentState = 'combat';
      engine.targetState = 'combat';
      engine.exitCombat();
      expect(engine.targetState).toBe('exploring');
    });

    it('should auto-exit combat after 10s', () => {
      engine.ctx = makeMockCtx();
      engine.previousState = 'exploring';
      engine.currentState = 'combat';
      engine.targetState = 'combat';
      engine.updateCombat(11);
      expect(engine.targetState).toBe('exploring');
    });

    it('should not auto-exit combat before 10s', () => {
      engine.ctx = makeMockCtx();
      engine.previousState = 'exploring';
      engine.currentState = 'combat';
      engine.targetState = 'combat';
      engine.updateCombat(5);
      expect(engine.targetState).toBe('combat');
    });
  });

  describe('Village Music', () => {
    it('should set near village flag', () => {
      engine.ctx = makeMockCtx();
      engine.setNearVillage(true);
      expect(engine.nearVillage).toBe(true);
    });

    it('should unset near village flag', () => {
      engine.nearVillage = true;
      engine.setNearVillage(false);
      expect(engine.nearVillage).toBe(false);
    });
  });

  describe('Extended Tick', () => {
    it('should not crash with null player position', () => {
      expect(() => engine.tickExtended(null, 0.5, 0, false, 'plains', 'clear', false, false)).not.toThrow();
    });

    it('should update biome via tickExtended', () => {
      engine.ctx = makeMockCtx();
      engine.tickExtended({ y: 64 }, 0.5, 0, false, 'forest', 'clear', false, false);
      expect(engine.currentBiome).toBe('forest');
    });

    it('should update weather via tickExtended', () => {
      engine.tickExtended({ y: 64 }, 0.5, 0, false, null, 'rain', false, false);
      expect(engine.currentWeather).toBe('rain');
    });

    it('should detect night time phase', () => {
      engine.ctx = makeMockCtx();
      engine.tickExtended({ y: 64 }, 0.1, 0, false, null, null, false, false);
      expect(engine.currentTimePhase).toBe('night');
    });

    it('should detect dawn time phase', () => {
      engine.tickExtended({ y: 64 }, 0.25, 0, false, null, null, false, false);
      expect(engine.currentTimePhase).toBe('dawn');
    });

    it('should detect sunset time phase', () => {
      engine.tickExtended({ y: 64 }, 0.75, 0, false, null, null, false, false);
      expect(engine.currentTimePhase).toBe('sunset');
    });

    it('should detect day time phase', () => {
      engine.tickExtended({ y: 64 }, 0.5, 0, false, null, null, false, false);
      expect(engine.currentTimePhase).toBe('day');
    });

    it('should enter combat when hostiles detected', () => {
      engine.ctx = makeMockCtx();
      engine.tickExtended({ y: 64 }, 0.5, 2, false, null, null, false, false);
      expect(engine.targetState).toBe('combat');
    });
  });
});
