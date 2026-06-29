import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  QuestManager,
  QUEST_TYPES,
  QUEST_STATES,
  QUEST_TRIGGERS,
  MAX_ACTIVE_QUESTS,
  DIFFICULTY_LEVELS,
  REWARD_TYPES,
  scaleDifficulty,
  generateRewards,
} from '../core/jardvoxel-survival-quests.js';
import { NPCMemorySystem } from '../core/jardvoxel-survival-npc-memory.js';

describe('Dynamic Quest System — SPEC-088', () => {
  let qm;
  let npcMemory;

  beforeEach(() => {
    npcMemory = new NPCMemorySystem(99999);
    npcMemory.createNPC('npc_1', { name: 'Serwick', profession: 'merchant' });
    qm = new QuestManager({ npcMemory, worldSeed: 42 });
  });

  describe('Quest Types', () => {
    it('should define 7 quest types', () => {
      expect(Object.keys(QUEST_TYPES).length).toBe(7);
      expect(QUEST_TYPES.FETCH).toBe('fetch');
      expect(QUEST_TYPES.EXPLORE).toBe('explore');
      expect(QUEST_TYPES.DEFEAT).toBe('defeat');
      expect(QUEST_TYPES.BUILD).toBe('build');
      expect(QUEST_TYPES.ESCORT).toBe('escort');
      expect(QUEST_TYPES.DELIVER).toBe('deliver');
      expect(QUEST_TYPES.DISCOVER).toBe('discover');
    });

    it('should define 4 quest states', () => {
      expect(Object.keys(QUEST_STATES).length).toBe(4);
      expect(QUEST_STATES.ACTIVE).toBe('active');
      expect(QUEST_STATES.COMPLETED).toBe('completed');
      expect(QUEST_STATES.FAILED).toBe('failed');
      expect(QUEST_STATES.ABANDONED).toBe('abandoned');
    });

    it('should define 4 quest triggers', () => {
      expect(Object.keys(QUEST_TRIGGERS).length).toBe(4);
      expect(QUEST_TRIGGERS.CONVERSATION).toBe('conversation');
      expect(QUEST_TRIGGERS.DISCOVERY).toBe('discovery');
      expect(QUEST_TRIGGERS.EVENT).toBe('event');
      expect(QUEST_TRIGGERS.AI_GENERATED).toBe('ai_generated');
    });
  });

  describe('Quest Creation', () => {
    it('should create a basic fetch quest', () => {
      const quest = qm.createQuest({ type: QUEST_TYPES.FETCH, item: 'wood', npcId: 'npc_1' });
      expect(quest).not.toBeNull();
      expect(quest.type).toBe('fetch');
      expect(quest.state).toBe(QUEST_STATES.ACTIVE);
      expect(quest.objectives.length).toBeGreaterThan(0);
      expect(quest.rewards.length).toBeGreaterThan(0);
      expect(quest.npcId).toBe('npc_1');
    });

    it('should create quest with default type fetch', () => {
      const quest = qm.createQuest({});
      expect(quest.type).toBe('fetch');
    });

    it('should generate default objectives per type', () => {
      const types = Object.values(QUEST_TYPES);
      for (const type of types) {
        const freshQm = new QuestManager();
        const quest = freshQm.createQuest({ type });
        expect(quest.objectives.length).toBeGreaterThan(0);
      }
    });

    it('should generate title from type and config', () => {
      const quest = qm.createQuest({ type: QUEST_TYPES.FETCH, item: 'iron_ingot' });
      expect(quest.title).toContain('Fetch');
      expect(quest.title).toContain('iron_ingot');
    });

    it('should generate description with placeholders replaced', () => {
      const quest = qm.createQuest({
        type: QUEST_TYPES.DEFEAT,
        mob: 'skeleton',
        playerLevel: 5,
      });
      expect(quest.description).toContain('skeleton');
      expect(quest.description).not.toContain('{mob}');
      expect(quest.description).not.toContain('{count}');
    });

    it('should register quest in NPC memory questsGiven', () => {
      qm.createQuest({ npcId: 'npc_1', type: QUEST_TYPES.FETCH });
      const questsGiven = npcMemory.getQuestsGiven('npc_1');
      expect(questsGiven.length).toBe(1);
    });

    it('should emit quest_created event', () => {
      let emitted = null;
      qm.on('quest_created', (q) => { emitted = q; });
      qm.createQuest({ type: QUEST_TYPES.FETCH });
      expect(emitted).not.toBeNull();
      expect(emitted.type).toBe('fetch');
    });

    it('should reject duplicate quest IDs', () => {
      const quest = qm.createQuest({ id: 'unique_1', type: QUEST_TYPES.FETCH });
      expect(quest).not.toBeNull();
      const dup = qm.createQuest({ id: 'unique_1', type: QUEST_TYPES.FETCH });
      expect(dup).toBeNull();
    });
  });

  describe('Difficulty Scaling', () => {
    it('should scale difficulty based on player level', () => {
      expect(scaleDifficulty(1, [])).toBe(DIFFICULTY_LEVELS.TRIVIAL);
      expect(scaleDifficulty(5, [])).toBe(DIFFICULTY_LEVELS.EASY);
      expect(scaleDifficulty(10, [])).toBe(DIFFICULTY_LEVELS.MEDIUM);
      expect(scaleDifficulty(15, [])).toBe(DIFFICULTY_LEVELS.HARD);
      expect(scaleDifficulty(20, [])).toBe(DIFFICULTY_LEVELS.EPIC);
    });

    it('should factor equipment into difficulty', () => {
      const noEquip = scaleDifficulty(3, []);
      const withEquip = scaleDifficulty(3, ['sword', 'helmet', 'boots']);
      expect(withEquip).toBeGreaterThanOrEqual(noEquip);
    });

    it('should generate rewards scaled by difficulty', () => {
      const trivialRewards = generateRewards(DIFFICULTY_LEVELS.TRIVIAL, 'fetch');
      const epicRewards = generateRewards(DIFFICULTY_LEVELS.EPIC, 'fetch');
      const trivialXp = trivialRewards.find(r => r.type === REWARD_TYPES.XP);
      const epicXp = epicRewards.find(r => r.type === REWARD_TYPES.XP);
      expect(epicXp.amount).toBeGreaterThan(trivialXp.amount);
    });

    it('should include item rewards with rarity based on difficulty', () => {
      const easyRewards = generateRewards(DIFFICULTY_LEVELS.EASY, 'fetch');
      const itemReward = easyRewards.find(r => r.type === REWARD_TYPES.ITEMS);
      expect(itemReward).toBeDefined();
      expect(itemReward.rarity).toBe('common');

      const hardRewards = generateRewards(DIFFICULTY_LEVELS.HARD, 'fetch');
      const hardItemReward = hardRewards.find(r => r.type === REWARD_TYPES.ITEMS);
      expect(hardItemReward.rarity).toBe('rare');
    });
  });

  describe('Quest Progress', () => {
    it('should update progress for collect objectives', () => {
      const quest = qm.createQuest({
        type: QUEST_TYPES.FETCH,
        item: 'wood',
        objectives: [{ type: 'collect', item: 'wood', count: 3, current: 0 }],
      });
      qm.updateProgress(quest.id, 0, 1);
      expect(quest.objectives[0].current).toBe(1);
      expect(quest.progress).toBe(0); // 0 of 1 objectives complete
      qm.updateProgress(quest.id, 0, 1);
      qm.updateProgress(quest.id, 0, 1);
      expect(quest.objectives[0].current).toBe(3);
      expect(quest.progress).toBe(1);
      expect(quest.state).toBe(QUEST_STATES.COMPLETED);
    });

    it('should complete quest when all objectives done', () => {
      const quest = qm.createQuest({
        type: QUEST_TYPES.FETCH,
        item: 'wood',
        playerLevel: 1,
      });
      const count = quest.objectives[0].count;
      for (let i = 0; i < count; i++) {
        qm.updateProgress(quest.id, 0, 1);
      }
      expect(quest.state).toBe(QUEST_STATES.COMPLETED);
      expect(quest.progress).toBe(1);
    });

    it('should update explore objectives', () => {
      const quest = qm.createQuest({
        type: QUEST_TYPES.EXPLORE,
        location: 'ancient temple',
      });
      qm.updateProgress(quest.id, 0);
      expect(quest.objectives[0].reached).toBe(true);
      expect(quest.state).toBe(QUEST_STATES.COMPLETED);
    });

    it('should update defeat objectives', () => {
      const quest = qm.createQuest({
        type: QUEST_TYPES.DEFEAT,
        mob: 'zombie',
        playerLevel: 1,
      });
      const count = quest.objectives[0].count;
      for (let i = 0; i < count; i++) {
        qm.updateProgress(quest.id, 0, 1);
      }
      expect(quest.state).toBe(QUEST_STATES.COMPLETED);
    });

    it('should update build objectives with requirements', () => {
      const quest = qm.createQuest({
        type: QUEST_TYPES.BUILD,
        structure: 'house',
        requirements: ['walls', 'roof'],
      });
      qm.updateProgress(quest.id, 0, 'walls');
      expect(quest.objectives[0].completed).toContain('walls');
      expect(quest.state).toBe(QUEST_STATES.ACTIVE);
      qm.updateProgress(quest.id, 0, 'roof');
      expect(quest.state).toBe(QUEST_STATES.COMPLETED);
    });

    it('should update escort objectives', () => {
      const quest = qm.createQuest({
        type: QUEST_TYPES.ESCORT,
        npc: 'traveler',
        destination: 'village',
      });
      qm.updateProgress(quest.id, 0);
      expect(quest.objectives[0].arrived).toBe(true);
      expect(quest.state).toBe(QUEST_STATES.COMPLETED);
    });

    it('should update deliver objectives', () => {
      const quest = qm.createQuest({
        type: QUEST_TYPES.DELIVER,
        item: 'letter',
        fromNpc: 'merchant',
        toNpc: 'scholar',
      });
      qm.updateProgress(quest.id, 0);
      expect(quest.objectives[0].delivered).toBe(true);
      expect(quest.state).toBe(QUEST_STATES.COMPLETED);
    });

    it('should update discover objectives', () => {
      const quest = qm.createQuest({
        type: QUEST_TYPES.DISCOVER,
        structure: 'ruins',
        biome: 'forest',
      });
      qm.updateProgress(quest.id, 0);
      expect(quest.objectives[0].found).toBe(true);
      expect(quest.state).toBe(QUEST_STATES.COMPLETED);
    });

    it('should not update progress on non-active quest', () => {
      const quest = qm.createQuest({ type: QUEST_TYPES.FETCH });
      qm.completeQuest(quest.id);
      const result = qm.updateProgress(quest.id, 0, 1);
      expect(result).toBeNull();
    });

    it('should emit quest_progress event', () => {
      let emitted = null;
      qm.on('quest_progress', (data) => { emitted = data; });
      const quest = qm.createQuest({ type: QUEST_TYPES.FETCH, playerLevel: 1 });
      qm.updateProgress(quest.id, 0, 1);
      expect(emitted).not.toBeNull();
      expect(emitted.quest.id).toBe(quest.id);
    });
  });

  describe('Quest State Management', () => {
    it('should complete a quest', () => {
      const quest = qm.createQuest({ type: QUEST_TYPES.FETCH });
      qm.completeQuest(quest.id);
      expect(quest.state).toBe(QUEST_STATES.COMPLETED);
      expect(quest.completedAt).not.toBeNull();
      expect(qm.getActiveQuests().length).toBe(0);
      expect(qm.getCompletedQuests().length).toBe(1);
    });

    it('should fail a quest with reason', () => {
      const quest = qm.createQuest({ type: QUEST_TYPES.FETCH });
      qm.failQuest(quest.id, 'timeout');
      expect(quest.state).toBe(QUEST_STATES.FAILED);
      expect(quest.failReason).toBe('timeout');
      expect(qm.getFailedQuests().length).toBe(1);
    });

    it('should abandon a quest', () => {
      const quest = qm.createQuest({ type: QUEST_TYPES.FETCH });
      qm.abandonQuest(quest.id);
      expect(quest.state).toBe(QUEST_STATES.ABANDONED);
      expect(qm.getAbandonedQuests().length).toBe(1);
    });

    it('should not complete already completed quest', () => {
      const quest = qm.createQuest({ type: QUEST_TYPES.FETCH });
      qm.completeQuest(quest.id);
      const result = qm.completeQuest(quest.id);
      expect(result).toBeNull();
    });

    it('should not fail non-active quest', () => {
      const quest = qm.createQuest({ type: QUEST_TYPES.FETCH });
      qm.abandonQuest(quest.id);
      const result = qm.failQuest(quest.id);
      expect(result).toBeNull();
    });

    it('should emit quest_completed event', () => {
      let emitted = null;
      qm.on('quest_completed', (q) => { emitted = q; });
      const quest = qm.createQuest({ type: QUEST_TYPES.FETCH });
      qm.completeQuest(quest.id);
      expect(emitted).not.toBeNull();
      expect(emitted.id).toBe(quest.id);
    });

    it('should emit quest_failed event', () => {
      let emitted = null;
      qm.on('quest_failed', (data) => { emitted = data; });
      const quest = qm.createQuest({ type: QUEST_TYPES.FETCH });
      qm.failQuest(quest.id, 'objective_destroyed');
      expect(emitted).not.toBeNull();
      expect(emitted.reason).toBe('objective_destroyed');
    });

    it('should emit quest_abandoned event', () => {
      let emitted = null;
      qm.on('quest_abandoned', (q) => { emitted = q; });
      const quest = qm.createQuest({ type: QUEST_TYPES.FETCH });
      qm.abandonQuest(quest.id);
      expect(emitted).not.toBeNull();
    });
  });

  describe('Active Quest Limit', () => {
    it('should enforce max 5 active quests', () => {
      expect(MAX_ACTIVE_QUESTS).toBe(5);
      for (let i = 0; i < MAX_ACTIVE_QUESTS; i++) {
        qm.createQuest({ type: QUEST_TYPES.FETCH });
      }
      expect(qm.getActiveCount()).toBe(MAX_ACTIVE_QUESTS);
      expect(qm.canAcceptMore()).toBe(false);
    });

    it('should emit quest_limit_reached when exceeding max', () => {
      let emitted = null;
      qm.on('quest_limit_reached', (data) => { emitted = data; });
      for (let i = 0; i <= MAX_ACTIVE_QUESTS; i++) {
        qm.createQuest({ type: QUEST_TYPES.FETCH });
      }
      expect(emitted).not.toBeNull();
      expect(emitted.maxActive).toBe(MAX_ACTIVE_QUESTS);
    });

    it('should allow more quests after completing one', () => {
      for (let i = 0; i < MAX_ACTIVE_QUESTS; i++) {
        qm.createQuest({ type: QUEST_TYPES.FETCH });
      }
      expect(qm.canAcceptMore()).toBe(false);
      const active = qm.getActiveQuests();
      qm.completeQuest(active[0].id);
      expect(qm.canAcceptMore()).toBe(true);
    });
  });

  describe('Quest Queries', () => {
    it('should get quest by ID', () => {
      const quest = qm.createQuest({ type: QUEST_TYPES.FETCH });
      expect(qm.getQuest(quest.id)).toBe(quest);
    });

    it('should return null for non-existent quest', () => {
      expect(qm.getQuest('nonexistent')).toBeNull();
    });

    it('should get visible quests (max 5)', () => {
      for (let i = 0; i < 7; i++) {
        qm.createQuest({ type: QUEST_TYPES.FETCH });
      }
      expect(qm.getVisibleQuests().length).toBeLessThanOrEqual(MAX_ACTIVE_QUESTS);
    });

    it('should get quests by type', () => {
      qm.createQuest({ type: QUEST_TYPES.FETCH });
      qm.createQuest({ type: QUEST_TYPES.DEFEAT });
      qm.createQuest({ type: QUEST_TYPES.FETCH });
      expect(qm.getQuestsByType('fetch').length).toBe(2);
      expect(qm.getQuestsByType('defeat').length).toBe(1);
    });

    it('should get quests by NPC', () => {
      qm.createQuest({ type: QUEST_TYPES.FETCH, npcId: 'npc_1' });
      qm.createQuest({ type: QUEST_TYPES.FETCH });
      expect(qm.getQuestsByNPC('npc_1').length).toBe(1);
    });

    it('should track quest count', () => {
      qm.createQuest({ type: QUEST_TYPES.FETCH });
      qm.createQuest({ type: QUEST_TYPES.DEFEAT });
      expect(qm.getQuestCount()).toBe(2);
    });

    it('should check if quest exists', () => {
      const quest = qm.createQuest({ type: QUEST_TYPES.FETCH });
      expect(qm.hasQuest(quest.id)).toBe(true);
      expect(qm.hasQuest('fake')).toBe(false);
    });
  });

  describe('Map Markers', () => {
    it('should return map markers for active quests', () => {
      qm.createQuest({
        type: QUEST_TYPES.EXPLORE,
        location: 'temple',
        mapMarker: { x: 100, z: 200, label: 'Ancient Temple' },
      });
      const markers = qm.getMapMarkers();
      expect(markers.length).toBe(1);
      expect(markers[0].x).toBe(100);
      expect(markers[0].label).toBe('Ancient Temple');
    });

    it('should not include markers for completed quests', () => {
      const quest = qm.createQuest({
        type: QUEST_TYPES.EXPLORE,
        mapMarker: { x: 50, z: 50 },
      });
      qm.completeQuest(quest.id);
      expect(qm.getMapMarkers().length).toBe(0);
    });
  });

  describe('AI Quest Generation', () => {
    it('should generate AI quest when client connected', async () => {
      const mockAIClient = {
        isConnected: () => true,
        requestQuest: vi.fn().mockResolvedValue({
          type: 'quest_generated',
          quest: {
            type: 'fetch',
            title: 'Rare Herbs',
            description: 'Collect 5 moon herbs from the mystic grove',
            objectives: [{ type: 'collect', item: 'moon_herb', count: 5, current: 0 }],
            rewards: [{ type: 'xp', amount: 200 }],
          },
        }),
      };
      qm = new QuestManager({ npcMemory, aiClient: mockAIClient });
      const quest = await qm.generateAIQuest({ biome: 'mystic_grove', playerLevel: 5 });
      expect(mockAIClient.requestQuest).toHaveBeenCalled();
      expect(quest.title).toBe('Rare Herbs');
      expect(quest.trigger).toBe(QUEST_TRIGGERS.AI_GENERATED);
    });

    it('should fallback to local generation when AI unavailable', async () => {
      const mockAIClient = {
        isConnected: () => true,
        requestQuest: vi.fn().mockResolvedValue({
          type: 'fallback',
          reason: 'llm_unavailable',
        }),
      };
      qm = new QuestManager({ npcMemory, aiClient: mockAIClient });
      const quest = await qm.generateAIQuest({ biome: 'forest' });
      expect(quest).not.toBeNull();
      expect(quest.type).toBe('fetch');
    });

    it('should fallback when AI throws', async () => {
      const mockAIClient = {
        isConnected: () => true,
        requestQuest: vi.fn().mockRejectedValue(new Error('network')),
      };
      qm = new QuestManager({ npcMemory, aiClient: mockAIClient });
      const quest = await qm.generateAIQuest({ biome: 'forest' });
      expect(quest).not.toBeNull();
    });

    it('should fallback when AI client not connected', async () => {
      const mockAIClient = {
        isConnected: () => false,
        requestQuest: vi.fn(),
      };
      qm = new QuestManager({ npcMemory, aiClient: mockAIClient });
      const quest = await qm.generateAIQuest({ biome: 'forest' });
      expect(mockAIClient.requestQuest).not.toHaveBeenCalled();
      expect(quest).not.toBeNull();
    });
  });

  describe('Quest Chains', () => {
    it('should create chain quest from completed parent', () => {
      const parent = qm.createQuest({ type: QUEST_TYPES.FETCH, npcId: 'npc_1' });
      qm.completeQuest(parent.id);
      const chain = qm.createChainQuest(parent.id, { type: QUEST_TYPES.DEFEAT });
      expect(chain).not.toBeNull();
      expect(chain.chainParent).toBe(parent.id);
      expect(chain.npcId).toBe('npc_1');
    });

    it('should not create chain from non-completed parent', () => {
      const parent = qm.createQuest({ type: QUEST_TYPES.FETCH });
      const chain = qm.createChainQuest(parent.id, { type: QUEST_TYPES.DEFEAT });
      expect(chain).toBeNull();
    });

    it('should emit quest_chain_ready on completion of chained quest', () => {
      let emitted = null;
      qm.on('quest_chain_ready', (data) => { emitted = data; });
      const parent = qm.createQuest({ type: QUEST_TYPES.FETCH });
      qm.completeQuest(parent.id);
      const chain = qm.createChainQuest(parent.id, { type: QUEST_TYPES.DEFEAT, playerLevel: 1 });
      qm.completeQuest(chain.id);
      expect(emitted).not.toBeNull();
      expect(emitted.chainParent).toBe(parent.id);
    });
  });

  describe('Time Limits', () => {
    it('should fail quest on timeout', () => {
      const quest = qm.createQuest({
        type: QUEST_TYPES.FETCH,
        timeLimit: 1000, // 1 second
      });
      // Simulate time passing beyond limit
      qm.checkTimeLimits(quest.createdAt + 2000);
      expect(quest.state).toBe(QUEST_STATES.FAILED);
      expect(quest.failReason).toBe('timeout');
    });

    it('should not fail quest within time limit', () => {
      const quest = qm.createQuest({
        type: QUEST_TYPES.FETCH,
        timeLimit: 60000,
      });
      qm.checkTimeLimits(quest.createdAt + 1000);
      expect(quest.state).toBe(QUEST_STATES.ACTIVE);
    });

    it('should not check time limit on non-timed quest', () => {
      const quest = qm.createQuest({ type: QUEST_TYPES.FETCH });
      qm.checkTimeLimits(Date.now() + 999999999);
      expect(quest.state).toBe(QUEST_STATES.ACTIVE);
    });
  });

  describe('Serialization', () => {
    it('should serialize quest state', () => {
      qm.createQuest({ type: QUEST_TYPES.FETCH });
      qm.createQuest({ type: QUEST_TYPES.DEFEAT });
      const data = qm.serialize();
      expect(data.quests.length).toBe(2);
      expect(data.activeQuestIds.length).toBe(2);
      expect(data.worldSeed).toBe(42);
    });

    it('should deserialize quest state', () => {
      qm.createQuest({ type: QUEST_TYPES.FETCH });
      const data = qm.serialize();
      const newQm = new QuestManager();
      newQm.deserialize(data);
      expect(newQm.getQuestCount()).toBe(1);
      expect(newQm.getActiveCount()).toBe(1);
    });

    it('should handle null deserialize', () => {
      expect(() => qm.deserialize(null)).not.toThrow();
    });

    it('should preserve all state categories on serialize/deserialize', () => {
      const q1 = qm.createQuest({ type: QUEST_TYPES.FETCH });
      const q2 = qm.createQuest({ type: QUEST_TYPES.DEFEAT });
      qm.completeQuest(q1.id);
      qm.failQuest(q2.id, 'timeout');
      const data = qm.serialize();
      const newQm = new QuestManager();
      newQm.deserialize(data);
      expect(newQm.getCompletedQuests().length).toBe(1);
      expect(newQm.getFailedQuests().length).toBe(1);
    });
  });

  describe('Event System', () => {
    it('should support on/off for events', () => {
      const handler = vi.fn();
      qm.on('test', handler);
      qm.off('test', handler);
      qm._emit('test', {});
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
