import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ConversationManager,
  CONVERSATION_STATES,
  FALLBACK_TEMPLATES,
  MAX_RESPONSE_LINES,
  MAX_OPTIONS,
  TYPEWRITER_SPEED,
} from '../core/jardvoxel-survival-conversation.js';
import { NPCMemorySystem } from '../core/jardvoxel-survival-npc-memory.js';

describe('Natural Conversation System — SPEC-087', () => {
  let npcMemory;
  let conv;

  beforeEach(() => {
    npcMemory = new NPCMemorySystem(12345);
    npcMemory.createNPC('npc_1', {
      name: 'Tharmond',
      profession: 'merchant',
      personality: 'friendly',
      backstory: 'A retired adventurer.',
    });
    npcMemory.setMood('npc_1', 'happy');
    conv = new ConversationManager({ npcMemory });
  });

  describe('ConversationManager Lifecycle', () => {
    it('should start in IDLE state', () => {
      expect(conv.getState()).toBe(CONVERSATION_STATES.IDLE);
    });

    it('should not have active conversation initially', () => {
      expect(conv.isConversationActive()).toBe(false);
      expect(conv.getActiveConversation()).toBeNull();
    });

    it('should start conversation with valid NPC', () => {
      const result = conv.startConversation('npc_1', {
        biome: 'forest',
        time: 0.5,
        weather: 'clear',
      });
      expect(result).not.toBeNull();
      expect(result.npcId).toBe('npc_1');
      expect(result.npc.identity.name).toBe('Tharmond');
      expect(conv.isConversationActive()).toBe(true);
      expect(conv.getState()).toBe(CONVERSATION_STATES.WAITING_FOR_AI);
    });

    it('should return null for non-existent NPC', () => {
      const result = conv.startConversation('npc_nonexistent');
      expect(result).toBeNull();
    });

    it('should not start if conversation already active', () => {
      conv.startConversation('npc_1');
      const second = conv.startConversation('npc_1');
      expect(second).toBeNull();
    });

    it('should close conversation cleanly', () => {
      conv.startConversation('npc_1');
      conv.closeConversation();
      expect(conv.getState()).toBe(CONVERSATION_STATES.CLOSED);
      expect(conv.isConversationActive()).toBe(false);
      expect(conv.getActiveConversation()).toBeNull();
    });
  });

  describe('Context Assembly', () => {
    it('should assemble context from provided data', () => {
      const result = conv.startConversation('npc_1', {
        biome: 'desert',
        time: 0.3,
        weather: 'sandstorm',
        nearbyStructures: ['temple', 'village'],
        activeQuests: ['quest_1'],
        playerActions: ['mined_block', 'killed_mob'],
      });
      expect(result.context.biome).toBe('desert');
      expect(result.context.weather).toBe('sandstorm');
      expect(result.context.nearbyStructures).toEqual(['temple', 'village']);
      expect(result.context.activeQuests).toEqual(['quest_1']);
      expect(result.context.playerActions).toEqual(['mined_block', 'killed_mob']);
    });

    it('should use default context values', () => {
      const result = conv.startConversation('npc_1');
      expect(result.context.biome).toBe('plains');
      expect(result.context.time).toBe(0);
      expect(result.context.weather).toBe('clear');
      expect(result.context.nearbyStructures).toEqual([]);
    });
  });

  describe('Fallback Templates', () => {
    it('should have templates for all 5 personalities', () => {
      const personalities = ['friendly', 'grumpy', 'mysterious', 'cheerful', 'stoic'];
      for (const p of personalities) {
        expect(FALLBACK_TEMPLATES[p]).toBeDefined();
      }
    });

    it('should have templates for all 5 moods per personality', () => {
      const moods = ['happy', 'sad', 'angry', 'scared', 'neutral'];
      for (const mood of moods) {
        expect(FALLBACK_TEMPLATES.friendly[mood]).toBeDefined();
        expect(FALLBACK_TEMPLATES.friendly[mood].length).toBeGreaterThanOrEqual(3);
      }
    });

    it('should have 20+ total templates', () => {
      let total = 0;
      for (const personality of Object.values(FALLBACK_TEMPLATES)) {
        for (const mood of Object.values(personality)) {
          total += mood.length;
        }
      }
      expect(total).toBeGreaterThanOrEqual(20);
    });

    it('should generate fallback response without AI client', async () => {
      conv.startConversation('npc_1');
      const result = await conv.generateResponse();
      expect(result).not.toBeNull();
      expect(result.response).toBeTruthy();
      expect(result.response.length).toBeGreaterThan(0);
      expect(result.options.length).toBeGreaterThan(0);
      expect(result.options.length).toBeLessThanOrEqual(MAX_OPTIONS);
    });

    it('should use personality-appropriate template', async () => {
      npcMemory.createNPC('npc_grumpy', {
        name: 'Borwick',
        personality: 'grumpy',
      });
      npcMemory.setMood('npc_grumpy', 'neutral');
      conv.startConversation('npc_grumpy');
      const result = await conv.generateResponse();
      const grumpyTemplates = FALLBACK_TEMPLATES.grumpy.neutral;
      expect(grumpyTemplates).toContain(result.response);
    });

    it('should vary response by day hash', async () => {
      // Same NPC, same mood — hash + day should produce consistent result per day
      conv.startConversation('npc_1');
      const result1 = await conv.generateResponse();
      conv.closeConversation();

      conv.startConversation('npc_1');
      const result2 = await conv.generateResponse();
      // Same day, same NPC → same template
      expect(result1.response).toBe(result2.response);
    });
  });

  describe('AI Server Integration', () => {
    it('should use AI client when connected', async () => {
      const mockAIClient = {
        isConnected: () => true,
        requestNPCDialogue: vi.fn().mockResolvedValue({
          type: 'npc_response',
          text: 'Greetings, traveler! The forest whispers of your deeds.',
          options: ['Tell me more.', 'I need help.', 'Goodbye.'],
          relationshipChange: 2,
        }),
      };
      conv = new ConversationManager({ npcMemory, aiClient: mockAIClient });
      conv.startConversation('npc_1', { biome: 'forest' });
      const result = await conv.generateResponse();

      expect(mockAIClient.requestNPCDialogue).toHaveBeenCalled();
      expect(result.response).toBe('Greetings, traveler! The forest whispers of your deeds.');
      expect(result.options).toEqual(['Tell me more.', 'I need help.', 'Goodbye.']);
      expect(result.relationshipChange).toBe(2);
    });

    it('should apply relationship change from AI response', async () => {
      const initialRel = npcMemory.getRelationship('npc_1');
      const mockAIClient = {
        isConnected: () => true,
        requestNPCDialogue: vi.fn().mockResolvedValue({
          type: 'npc_response',
          text: 'You are a true friend.',
          options: ['Thanks!', 'Bye.'],
          relationshipChange: 10,
        }),
      };
      conv = new ConversationManager({ npcMemory, aiClient: mockAIClient });
      conv.startConversation('npc_1');
      await conv.generateResponse();
      expect(npcMemory.getRelationship('npc_1')).toBe(initialRel + 10);
    });

    it('should fallback when AI returns fallback type', async () => {
      const mockAIClient = {
        isConnected: () => true,
        requestNPCDialogue: vi.fn().mockResolvedValue({
          type: 'fallback',
          reason: 'llm_unavailable',
        }),
      };
      conv = new ConversationManager({ npcMemory, aiClient: mockAIClient });
      conv.startConversation('npc_1');
      const result = await conv.generateResponse();
      // Should use fallback templates
      const friendlyHappy = FALLBACK_TEMPLATES.friendly.happy;
      expect(friendlyHappy).toContain(result.response);
    });

    it('should fallback when AI client throws', async () => {
      const mockAIClient = {
        isConnected: () => true,
        requestNPCDialogue: vi.fn().mockRejectedValue(new Error('network')),
      };
      conv = new ConversationManager({ npcMemory, aiClient: mockAIClient });
      conv.startConversation('npc_1');
      const result = await conv.generateResponse();
      expect(result).not.toBeNull();
      expect(result.response).toBeTruthy();
    });

    it('should fallback when AI client not connected', async () => {
      const mockAIClient = {
        isConnected: () => false,
        requestNPCDialogue: vi.fn(),
      };
      conv = new ConversationManager({ npcMemory, aiClient: mockAIClient });
      conv.startConversation('npc_1');
      const result = await conv.generateResponse();
      expect(mockAIClient.requestNPCDialogue).not.toHaveBeenCalled();
      expect(result.response).toBeTruthy();
    });
  });

  describe('Typewriter Effect', () => {
    it('should start typewriter on response', async () => {
      vi.useFakeTimers();
      conv.startConversation('npc_1');
      await conv.generateResponse();
      expect(conv.getTypewriterProgress()).toBe(0);
      vi.advanceTimersByTime(TYPEWRITER_SPEED * 5);
      expect(conv.getTypewriterProgress()).toBe(5);
      vi.useRealTimers();
      conv.closeConversation();
    });

    it('should skip typewriter', async () => {
      conv.startConversation('npc_1');
      await conv.generateResponse();
      conv.skipTypewriter();
      expect(conv.getTypewriterProgress()).toBe(conv.getActiveConversation().response.length);
      expect(conv.getState()).toBe(CONVERSATION_STATES.SHOWING_OPTIONS);
      conv.closeConversation();
    });

    it('should emit typewriter progress events', async () => {
      vi.useFakeTimers();
      const progressEvents = [];
      conv.on('typewriter_progress', (data) => progressEvents.push(data));
      conv.startConversation('npc_1');
      await conv.generateResponse();
      vi.advanceTimersByTime(TYPEWRITER_SPEED * 3);
      expect(progressEvents.length).toBeGreaterThanOrEqual(3);
      expect(progressEvents[0].partial).toBeTruthy();
      vi.useRealTimers();
      conv.closeConversation();
    });
  });

  describe('Option Selection', () => {
    it('should select a valid option', async () => {
      conv.startConversation('npc_1');
      await conv.generateResponse();
      conv.skipTypewriter();
      const option = conv.selectOption(0);
      expect(option).not.toBeNull();
      expect(typeof option).toBe('string');
    });

    it('should return null for invalid option index', async () => {
      conv.startConversation('npc_1');
      await conv.generateResponse();
      conv.skipTypewriter();
      expect(conv.selectOption(-1)).toBeNull();
      expect(conv.selectOption(99)).toBeNull();
    });

    it('should record interaction in NPC memory on option select', async () => {
      conv.startConversation('npc_1');
      await conv.generateResponse();
      conv.skipTypewriter();
      conv.selectOption(0);
      const npc = npcMemory.getNPC('npc_1');
      expect(npc.memory.playerInteractions.length).toBeGreaterThan(0);
      expect(npc.memory.playerInteractions[0].type).toBe('conversation');
    });

    it('should emit option_selected event', async () => {
      let emitted = null;
      conv.on('option_selected', (data) => { emitted = data; });
      conv.startConversation('npc_1');
      await conv.generateResponse();
      conv.skipTypewriter();
      conv.selectOption(0);
      expect(emitted).not.toBeNull();
      expect(emitted.npcId).toBe('npc_1');
      expect(emitted.index).toBe(0);
    });

    it('should trigger quest when help-related option selected', async () => {
      let questTriggered = null;
      conv.on('quest_triggered', (data) => { questTriggered = data; });
      conv.startConversation('npc_1');
      await conv.generateResponse();
      conv.skipTypewriter();
      // Manually set options to include a quest trigger
      conv.getActiveConversation().options = ['I heard you might need help with something...'];
      conv.selectOption(0);
      expect(questTriggered).not.toBeNull();
      expect(questTriggered.npcId).toBe('npc_1');
    });
  });

  describe('Response Formatting', () => {
    it('should limit response to MAX_RESPONSE_LINES', async () => {
      const mockAIClient = {
        isConnected: () => true,
        requestNPCDialogue: vi.fn().mockResolvedValue({
          type: 'npc_response',
          text: 'First sentence. Second sentence. Third sentence. Fourth sentence.',
          options: ['OK.'],
        }),
      };
      conv = new ConversationManager({ npcMemory, aiClient: mockAIClient });
      conv.startConversation('npc_1');
      const result = await conv.generateResponse();
      const sentences = result.response.split('. ').filter(s => s.trim());
      expect(sentences.length).toBeLessThanOrEqual(MAX_RESPONSE_LINES);
    });

    it('should limit options to MAX_OPTIONS', async () => {
      const mockAIClient = {
        isConnected: () => true,
        requestNPCDialogue: vi.fn().mockResolvedValue({
          type: 'npc_response',
          text: 'Hello!',
          options: ['One', 'Two', 'Three', 'Four', 'Five', 'Six'],
        }),
      };
      conv = new ConversationManager({ npcMemory, aiClient: mockAIClient });
      conv.startConversation('npc_1');
      const result = await conv.generateResponse();
      expect(result.options.length).toBeLessThanOrEqual(MAX_OPTIONS);
    });

    it('should generate fallback options when AI provides none', async () => {
      const mockAIClient = {
        isConnected: () => true,
        requestNPCDialogue: vi.fn().mockResolvedValue({
          type: 'npc_response',
          text: 'Hello there.',
          options: [],
        }),
      };
      conv = new ConversationManager({ npcMemory, aiClient: mockAIClient });
      conv.startConversation('npc_1');
      const result = await conv.generateResponse();
      expect(result.options.length).toBeGreaterThan(0);
      expect(result.options.length).toBeLessThanOrEqual(MAX_OPTIONS);
    });
  });

  describe('Scroll Detection', () => {
    it('should detect long responses need scroll', async () => {
      const longText = 'This is a very long response. ' + 'A'.repeat(250);
      const mockAIClient = {
        isConnected: () => true,
        requestNPCDialogue: vi.fn().mockResolvedValue({
          type: 'npc_response',
          text: longText,
          options: ['OK.'],
        }),
      };
      conv = new ConversationManager({ npcMemory, aiClient: mockAIClient });
      conv.startConversation('npc_1');
      await conv.generateResponse();
      expect(conv.needsScroll()).toBe(true);
    });

    it('should not need scroll for short responses', async () => {
      conv.startConversation('npc_1');
      await conv.generateResponse();
      expect(conv.needsScroll()).toBe(false);
    });
  });

  describe('Event System', () => {
    it('should emit conversation_started event', () => {
      let emitted = null;
      conv.on('conversation_started', (data) => { emitted = data; });
      conv.startConversation('npc_1');
      expect(emitted).not.toBeNull();
      expect(emitted.npcId).toBe('npc_1');
    });

    it('should emit conversation_ended event on close', () => {
      let emitted = null;
      conv.on('conversation_ended', (data) => { emitted = data; });
      conv.startConversation('npc_1');
      conv.closeConversation();
      expect(emitted).not.toBeNull();
    });

    it('should support off() to remove handler', () => {
      const handler = vi.fn();
      conv.on('test', handler);
      conv.off('test', handler);
      conv._emit('test', {});
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Serialization', () => {
    it('should serialize conversation history', async () => {
      conv.startConversation('npc_1');
      await conv.generateResponse();
      conv.closeConversation();
      const data = conv.serialize();
      expect(data.history).toBeDefined();
      expect(data.history.length).toBeGreaterThan(0);
      expect(data.history[0].npcId).toBe('npc_1');
    });

    it('should deserialize conversation history', () => {
      const history = [{ npcId: 'npc_1', text: 'Hello', timestamp: 12345 }];
      conv.deserialize({ history });
      expect(conv.getConversationHistory().length).toBe(1);
      expect(conv.getConversationHistory()[0].text).toBe('Hello');
    });

    it('should handle null deserialize', () => {
      expect(() => conv.deserialize(null)).not.toThrow();
    });
  });

  describe('Quest Trigger Detection', () => {
    it('should detect help-related options as quest triggers', async () => {
      let questTriggered = null;
      conv.on('quest_triggered', (data) => { questTriggered = data; });
      conv.startConversation('npc_1');
      await conv.generateResponse();
      conv.skipTypewriter();
      conv.getActiveConversation().options = ['Is there anything I can do for you?'];
      conv.selectOption(0);
      expect(questTriggered).not.toBeNull();
    });

    it('should not trigger quest for normal options', async () => {
      let questTriggered = null;
      conv.on('quest_triggered', (data) => { questTriggered = data; });
      conv.startConversation('npc_1');
      await conv.generateResponse();
      conv.skipTypewriter();
      conv.getActiveConversation().options = ['Tell me about the weather.'];
      conv.selectOption(0);
      expect(questTriggered).toBeNull();
    });
  });
});
