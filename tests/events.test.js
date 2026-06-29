import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  EventManager,
  EVENT_TYPES,
  EVENT_CONFIGS,
  CHECK_INTERVAL_MS,
  COOLDOWN_MS,
  MAX_ACTIVE_EVENTS,
} from '../core/jardvoxel-survival-events.js';

describe('Emergent Events System — SPEC-089', () => {
  let manager;

  beforeEach(() => {
    manager = new EventManager();
  });

  describe('Event Types', () => {
    it('should define 10 event types', () => {
      expect(Object.keys(EVENT_TYPES).length).toBe(10);
    });

    it('should have meteor_shower', () => {
      expect(EVENT_TYPES.METEOR_SHOWER).toBe('meteor_shower');
      expect(EVENT_CONFIGS.meteor_shower).toBeDefined();
    });

    it('should have migration', () => {
      expect(EVENT_TYPES.MIGRATION).toBe('migration');
      expect(EVENT_CONFIGS.migration).toBeDefined();
    });

    it('should have festival', () => {
      expect(EVENT_TYPES.FESTIVAL).toBe('festival');
      expect(EVENT_CONFIGS.festival).toBeDefined();
    });

    it('should have eclipse', () => {
      expect(EVENT_TYPES.ECLIPSE).toBe('eclipse');
      expect(EVENT_CONFIGS.eclipse).toBeDefined();
    });

    it('should have aurora', () => {
      expect(EVENT_TYPES.AURORA).toBe('aurora');
      expect(EVENT_CONFIGS.aurora).toBeDefined();
    });

    it('should have earthquake', () => {
      expect(EVENT_TYPES.EARTHQUAKE).toBe('earthquake');
      expect(EVENT_CONFIGS.earthquake).toBeDefined();
    });

    it('should have trader_caravan', () => {
      expect(EVENT_TYPES.TRADER_CARAVAN).toBe('trader_caravan');
      expect(EVENT_CONFIGS.trader_caravan).toBeDefined();
    });

    it('should have lost_traveler', () => {
      expect(EVENT_TYPES.LOST_TRAVELER).toBe('lost_traveler');
      expect(EVENT_CONFIGS.lost_traveler).toBeDefined();
    });

    it('should have ancient_discovery', () => {
      expect(EVENT_TYPES.ANCIENT_DISCOVERY).toBe('ancient_discovery');
      expect(EVENT_CONFIGS.ancient_discovery).toBeDefined();
    });

    it('should have legend_reveal', () => {
      expect(EVENT_TYPES.LEGEND_REVEAL).toBe('legend_reveal');
      expect(EVENT_CONFIGS.legend_reveal).toBeDefined();
    });
  });

  describe('Event Config', () => {
    it('should have probability for each event', () => {
      for (const config of Object.values(EVENT_CONFIGS)) {
        expect(config.probability).toBeGreaterThan(0);
        expect(config.probability).toBeLessThanOrEqual(1);
      }
    });

    it('should have duration range (2-10 min) for each event', () => {
      for (const config of Object.values(EVENT_CONFIGS)) {
        expect(config.minDuration).toBeGreaterThanOrEqual(1);
        expect(config.maxDuration).toBeLessThanOrEqual(10);
      }
    });

    it('should have description for each event', () => {
      for (const config of Object.values(EVENT_CONFIGS)) {
        expect(config.description).toBeTruthy();
      }
    });

    it('should have effects array for each event', () => {
      for (const config of Object.values(EVENT_CONFIGS)) {
        expect(Array.isArray(config.effects)).toBe(true);
        expect(config.effects.length).toBeGreaterThan(0);
      }
    });

    it('should mark night-only events', () => {
      expect(EVENT_CONFIGS.meteor_shower.nightOnly).toBe(true);
      expect(EVENT_CONFIGS.aurora.nightOnly).toBe(true);
    });

    it('should mark cold-biome-only for aurora', () => {
      expect(EVENT_CONFIGS.aurora.coldBiomesOnly).toBe(true);
    });
  });

  describe('Lifecycle', () => {
    it('should start not running', () => {
      expect(manager.isRunning()).toBe(false);
    });

    it('should start without crash', () => {
      expect(() => manager.start()).not.toThrow();
      expect(manager.isRunning()).toBe(true);
    });

    it('should stop without crash', () => {
      manager.start();
      expect(() => manager.stop()).not.toThrow();
      expect(manager.isRunning()).toBe(false);
    });
  });

  describe('Event Triggering', () => {
    it('should not trigger event when not running', () => {
      expect(manager.checkEvents()).toBeNull();
    });

    it('should not trigger event when on cooldown', () => {
      manager.start();
      // Just started, so on cooldown
      expect(manager.checkEvents()).toBeNull();
    });

    it('should not trigger when event already active', () => {
      manager.start();
      manager.forceEvent(EVENT_TYPES.METEOR_SHOWER);
      expect(manager.checkEvents()).toBeNull();
    });

    it('should force event', () => {
      manager.forceEvent(EVENT_TYPES.FESTIVAL);
      expect(manager.hasActiveEvent()).toBe(true);
      expect(manager.getActiveEvent().type).toBe('festival');
    });

    it('should not force event when one is active', () => {
      manager.forceEvent(EVENT_TYPES.FESTIVAL);
      expect(manager.forceEvent(EVENT_TYPES.ECLIPSE)).toBe(false);
    });

    it('should reject unknown event type', () => {
      expect(manager.forceEvent('nonexistent')).toBe(false);
    });

    it('should end active event', () => {
      manager.forceEvent(EVENT_TYPES.FESTIVAL);
      manager.endActiveEvent();
      expect(manager.hasActiveEvent()).toBe(false);
    });

    it('should record ended event in history', () => {
      manager.forceEvent(EVENT_TYPES.FESTIVAL);
      manager.endActiveEvent();
      expect(manager.getEventHistory().length).toBe(1);
      expect(manager.getEventHistory()[0].type).toBe('festival');
    });
  });

  describe('Cooldown', () => {
    it('should have 30 min cooldown', () => {
      expect(COOLDOWN_MS).toBe(30 * 60 * 1000);
      expect(manager.getCooldownMs()).toBe(COOLDOWN_MS);
    });

    it('should be on cooldown after event ends', () => {
      manager.forceEvent(EVENT_TYPES.FESTIVAL);
      manager.endActiveEvent();
      expect(manager.isOnCooldown()).toBe(true);
    });

    it('should not be on cooldown if no event has occurred', () => {
      // Override lastEventTime to past
      manager._lastEventTime = Date.now() - COOLDOWN_MS - 1000;
      expect(manager.isOnCooldown()).toBe(false);
    });
  });

  describe('Max Active Events', () => {
    it('should allow max 1 active event', () => {
      expect(MAX_ACTIVE_EVENTS).toBe(1);
      expect(manager.getMaxActiveEvents()).toBe(1);
    });
  });

  describe('Check Interval', () => {
    it('should check every 5 minutes', () => {
      expect(CHECK_INTERVAL_MS).toBe(5 * 60 * 1000);
      expect(manager.getCheckInterval()).toBe(CHECK_INTERVAL_MS);
    });
  });

  describe('Event Handlers', () => {
    it('should emit event_started', () => {
      let received = null;
      manager.on('event_started', (e) => { received = e; });
      manager.forceEvent(EVENT_TYPES.METEOR_SHOWER);
      expect(received).not.toBeNull();
      expect(received.type).toBe('meteor_shower');
    });

    it('should emit event_ended', () => {
      let received = null;
      manager.on('event_ended', (e) => { received = e; });
      manager.forceEvent(EVENT_TYPES.FESTIVAL);
      manager.endActiveEvent();
      expect(received).not.toBeNull();
      expect(received.type).toBe('festival');
    });

    it('should unregister handler with off', () => {
      const handler = vi.fn();
      manager.on('event_started', handler);
      manager.off('event_started', handler);
      manager.forceEvent(EVENT_TYPES.FESTIVAL);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('AI Integration', () => {
    it('should trigger AI-generated event', () => {
      const result = manager.triggerAIEvent({
        type: 'custom_invasion',
        name: 'Skeleton Invasion',
        description: 'Skeletons attack the village!',
        effects: ['combat', 'npc_spawn'],
        duration: 7,
      });
      expect(result).toBe(true);
      expect(manager.getActiveEvent().aiGenerated).toBe(true);
      expect(manager.getActiveEvent().type).toBe('custom_invasion');
    });

    it('should not trigger AI event when one is active', () => {
      manager.forceEvent(EVENT_TYPES.FESTIVAL);
      expect(manager.triggerAIEvent({ type: 'custom' })).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize', () => {
      manager.forceEvent(EVENT_TYPES.FESTIVAL);
      manager.endActiveEvent();

      const data = manager.serialize();
      const newManager = new EventManager();
      newManager.deserialize(data);

      expect(newManager.getEventHistory().length).toBe(1);
      expect(newManager.getEventHistory()[0].type).toBe('festival');
    });
  });

  describe('Player Context', () => {
    it('should set player context', () => {
      manager.setPlayerContext({ biome: 'taiga', dayTime: 0.1 });
      expect(manager._playerContext.biome).toBe('taiga');
    });

    it('should not trigger aurora in non-cold biome', () => {
      manager.setPlayerContext({ biome: 'desert', dayTime: 0.1 });
      // Mock: bypass cooldown
      manager._lastEventTime = Date.now() - COOLDOWN_MS - 1000;
      // Run many checks to see if aurora triggers (it shouldn't in desert)
      let auroraTriggered = false;
      for (let i = 0; i < 100; i++) {
        const result = manager._rollForEvent();
        if (result === 'aurora') { auroraTriggered = true; break; }
        if (result) { manager.endActiveEvent(); manager._lastEventTime = Date.now() - COOLDOWN_MS - 1000; }
      }
      expect(auroraTriggered).toBe(false);
    });
  });
});
