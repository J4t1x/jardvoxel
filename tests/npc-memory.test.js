import { describe, it, expect, beforeEach } from 'vitest';
import {
  NPCMemorySystem,
  PROFESSIONS,
  PERSONALITIES,
  MOODS,
  MAX_CACHE_SIZE,
} from '../core/jardvoxel-survival-npc-memory.js';

describe('NPC Memory System — SPEC-086', () => {
  let system;

  beforeEach(() => {
    system = new NPCMemorySystem(12345);
  });

  describe('NPC Identity', () => {
    it('should create NPC with procedural identity', () => {
      const npc = system.createNPC('npc_1');
      expect(npc.identity.name).toBeTruthy();
      expect(npc.identity.profession).toBeTruthy();
      expect(npc.identity.personality).toBeTruthy();
      expect(npc.identity.backstory).toBeTruthy();
    });

    it('should have valid profession', () => {
      const npc = system.createNPC('npc_1');
      expect(PROFESSIONS).toContain(npc.identity.profession);
    });

    it('should have valid personality', () => {
      const npc = system.createNPC('npc_1');
      expect(PERSONALITIES).toContain(npc.identity.personality);
    });

    it('should accept custom identity options', () => {
      const npc = system.createNPC('npc_1', {
        name: 'Thorin',
        profession: 'blacksmith',
        personality: 'grumpy',
        backstory: 'A dwarf who loves gold.',
      });
      expect(npc.identity.name).toBe('Thorin');
      expect(npc.identity.profession).toBe('blacksmith');
      expect(npc.identity.personality).toBe('grumpy');
      expect(npc.identity.backstory).toBe('A dwarf who loves gold.');
    });

    it('should be deterministic with same seed', () => {
      const sys1 = new NPCMemorySystem(999);
      const sys2 = new NPCMemorySystem(999);
      const npc1 = sys1.createNPC('npc_1');
      const npc2 = sys2.createNPC('npc_1');
      expect(npc1.identity.name).toBe(npc2.identity.name);
      expect(npc1.identity.profession).toBe(npc2.identity.profession);
    });
  });

  describe('NPC Memory', () => {
    it('should start with neutral relationship', () => {
      system.createNPC('npc_1');
      expect(system.getRelationship('npc_1')).toBe(0);
    });

    it('should record player interactions', () => {
      system.createNPC('npc_1');
      system.recordInteraction('npc_1', { type: 'trade', detail: 'bought bread' });
      const npc = system.getNPC('npc_1');
      expect(npc.memory.playerInteractions.length).toBe(1);
      expect(npc.memory.playerInteractions[0].type).toBe('trade');
    });

    it('should adjust relationship positively for gifts', () => {
      system.createNPC('npc_1');
      system.recordInteraction('npc_1', { type: 'gift', detail: 'gave flowers' });
      expect(system.getRelationship('npc_1')).toBe(5);
    });

    it('should adjust relationship negatively for insults', () => {
      system.createNPC('npc_1');
      system.recordInteraction('npc_1', { type: 'insult' });
      expect(system.getRelationship('npc_1')).toBe(-10);
    });

    it('should adjust relationship positively for help', () => {
      system.createNPC('npc_1');
      system.recordInteraction('npc_1', { type: 'help' });
      expect(system.getRelationship('npc_1')).toBe(5);
    });

    it('should adjust relationship negatively for attacks', () => {
      system.createNPC('npc_1');
      system.recordInteraction('npc_1', { type: 'attack' });
      expect(system.getRelationship('npc_1')).toBe(-10);
    });

    it('should clamp relationship to -100..100', () => {
      system.createNPC('npc_1');
      for (let i = 0; i < 25; i++) {
        system.recordInteraction('npc_1', { type: 'insult' });
      }
      expect(system.getRelationship('npc_1')).toBe(-100);
    });

    it('should return relationship level', () => {
      system.createNPC('npc_1');
      expect(system.getRelationshipLevel('npc_1')).toBe('neutral');

      system.adjustRelationship('npc_1', 60);
      expect(system.getRelationshipLevel('npc_1')).toBe('trusted');

      system.adjustRelationship('npc_1', -120);
      expect(system.getRelationshipLevel('npc_1')).toBe('hostile');
    });

    it('should track known facts', () => {
      system.createNPC('npc_1');
      expect(system.knowsFact('npc_1', 'dragon_location')).toBe(false);
      system.addKnownFact('npc_1', 'dragon_location');
      expect(system.knowsFact('npc_1', 'dragon_location')).toBe(true);
    });

    it('should track preferences', () => {
      system.createNPC('npc_1');
      system.setPreference('npc_1', 'emerald', true);
      system.setPreference('npc_1', 'rotten_flesh', false);
      const npc = system.getNPC('npc_1');
      expect(npc.memory.preferences.liked).toContain('emerald');
      expect(npc.memory.preferences.disliked).toContain('rotten_flesh');
    });

    it('should track quests given', () => {
      system.createNPC('npc_1');
      system.addQuestGiven('npc_1', 'quest_001');
      expect(system.getQuestsGiven('npc_1')).toContain('quest_001');
    });

    it('should limit interactions to 100', () => {
      system.createNPC('npc_1');
      for (let i = 0; i < 120; i++) {
        system.recordInteraction('npc_1', { type: 'trade' });
      }
      const npc = system.getNPC('npc_1');
      expect(npc.memory.playerInteractions.length).toBe(100);
    });
  });

  describe('NPC State', () => {
    it('should start with neutral mood', () => {
      system.createNPC('npc_1');
      expect(system.getMood('npc_1')).toBe('neutral');
    });

    it('should set valid mood', () => {
      system.createNPC('npc_1');
      system.setMood('npc_1', 'happy');
      expect(system.getMood('npc_1')).toBe('happy');
    });

    it('should reject invalid mood', () => {
      system.createNPC('npc_1');
      expect(system.setMood('npc_1', 'invalid_mood')).toBe(false);
      expect(system.getMood('npc_1')).toBe('neutral');
    });

    it('should update mood from positive interaction', () => {
      system.createNPC('npc_1');
      system.recordInteraction('npc_1', { type: 'gift' });
      expect(system.getMood('npc_1')).toBe('happy');
    });

    it('should update mood from negative interaction', () => {
      system.createNPC('npc_1');
      system.recordInteraction('npc_1', { type: 'insult' });
      expect(system.getMood('npc_1')).toBe('angry');
    });

    it('should have daily routine', () => {
      const npc = system.createNPC('npc_1');
      expect(npc.state.dailyRoutine.length).toBeGreaterThan(0);
    });

    it('should update activity based on hour', () => {
      system.createNPC('npc_1', { profession: 'farmer' });
      system.updateActivity('npc_1', 8); // 6-12 = farming
      expect(system.getActivity('npc_1')).toBe('farming');
      expect(system.getLocation('npc_1')).toBe('farm');
    });

    it('should update activity for sleeping hours', () => {
      system.createNPC('npc_1', { profession: 'farmer' });
      system.updateActivity('npc_1', 23); // 22-6 = sleeping
      expect(system.getActivity('npc_1')).toBe('sleeping');
    });

    it('should have profession-specific routine', () => {
      const farmer = system.createNPC('npc_1', { profession: 'farmer' });
      const guard = system.createNPC('npc_2', { profession: 'guard' });
      expect(farmer.state.dailyRoutine).not.toEqual(guard.state.dailyRoutine);
    });
  });

  describe('LRU Cache', () => {
    it('should have max cache size of 50', () => {
      expect(MAX_CACHE_SIZE).toBe(50);
      expect(system.getMaxCacheSize()).toBe(50);
    });

    it('should track cache size', () => {
      system.createNPC('npc_1');
      system.createNPC('npc_2');
      expect(system.getCacheSize()).toBe(2);
    });

    it('should evict oldest when cache is full', () => {
      for (let i = 0; i < 55; i++) {
        system.createNPC(`npc_${i}`);
      }
      expect(system.getCacheSize()).toBe(50);
      expect(system.hasNPC('npc_0')).toBe(false); // evicted
      expect(system.hasNPC('npc_54')).toBe(true); // newest
    });

    it('should touch cache on access (LRU update)', () => {
      system.createNPC('npc_a');
      system.createNPC('npc_b');

      // Access npc_a to make it recently used
      system.getNPC('npc_a');

      // Fill cache to force eviction (need 49 to exceed max of 50)
      for (let i = 0; i < 49; i++) {
        system.createNPC(`npc_fill_${i}`);
      }
      // npc_b should be evicted (oldest untouched), npc_a should remain
      expect(system.hasNPC('npc_a')).toBe(true);
      expect(system.hasNPC('npc_b')).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should serialize single NPC', () => {
      system.createNPC('npc_1');
      system.recordInteraction('npc_1', { type: 'trade' });
      system.addKnownFact('npc_1', 'secret_map');

      const data = system.serializeNPC('npc_1');
      expect(data.id).toBe('npc_1');
      expect(data.memory.knownFacts).toContain('secret_map');
      expect(Array.isArray(data.memory.knownFacts)).toBe(true);
    });

    it('should deserialize single NPC', () => {
      system.createNPC('npc_1');
      system.addKnownFact('npc_1', 'test_fact');
      const data = system.serializeNPC('npc_1');

      const newSystem = new NPCMemorySystem(12345);
      const npc = newSystem.deserializeNPC(data);
      expect(npc).not.toBeNull();
      expect(newSystem.knowsFact('npc_1', 'test_fact')).toBe(true);
    });

    it('should serialize and deserialize all NPCs', () => {
      system.createNPC('npc_1', { profession: 'farmer' });
      system.createNPC('npc_2', { profession: 'guard' });
      system.recordInteraction('npc_1', { type: 'gift' });

      const data = system.serializeAll();
      const newSystem = new NPCMemorySystem(12345);
      newSystem.deserializeAll(data);

      expect(newSystem.getCacheSize()).toBe(2);
      expect(newSystem.getRelationship('npc_1')).toBe(5);
      expect(newSystem.getRelationship('npc_2')).toBe(0);
    });
  });

  describe('Queries', () => {
    it('should get all NPC IDs', () => {
      system.createNPC('npc_1');
      system.createNPC('npc_2');
      const ids = system.getAllNPCIds();
      expect(ids).toContain('npc_1');
      expect(ids).toContain('npc_2');
    });

    it('should filter NPCs by profession', () => {
      system.createNPC('npc_1', { profession: 'farmer' });
      system.createNPC('npc_2', { profession: 'guard' });
      system.createNPC('npc_3', { profession: 'farmer' });
      const farmers = system.getNPCsByProfession('farmer');
      expect(farmers.length).toBe(2);
    });

    it('should filter NPCs by mood', () => {
      system.createNPC('npc_1');
      system.createNPC('npc_2');
      system.setMood('npc_1', 'happy');
      const happy = system.getNPCsByMood('happy');
      expect(happy.length).toBe(1);
      expect(happy[0].id).toBe('npc_1');
    });

    it('should return null for unknown NPC', () => {
      expect(system.getNPC('nonexistent')).toBeNull();
    });
  });
});
