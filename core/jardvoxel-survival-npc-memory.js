// ═══════════════════════════════════════════════════════════
// SPEC-086: NPC Memory System
// NPCs with persistent memory: identity, memory (interactions,
// relationship, known facts, preferences, quests), state (mood,
// daily routine, activity, location), and LRU cache.
// ═══════════════════════════════════════════════════════════

import { PRNG } from './jardvoxel-survival-engine.js';

const PROFESSIONS = ['farmer', 'blacksmith', 'merchant', 'scholar', 'guard'];
const PERSONALITIES = ['friendly', 'grumpy', 'mysterious', 'cheerful', 'stoic'];
const MOODS = ['happy', 'sad', 'angry', 'scared', 'neutral'];
const ACTIVITIES = ['mining', 'farming', 'sleeping', 'talking', 'wandering', 'trading', 'fishing', 'guarding'];
const LOCATIONS = ['home', 'workplace', 'wandering', 'market', 'farm'];

const NAME_PARTS = {
  first: ['Thar', 'Mor', 'Kael', 'Ser', 'Bran', 'Lyr', 'Eld', 'Fen', 'Cor', 'Vey', 'Ald', 'Mir', 'Tor', 'Ror', 'Cas', 'Wyn', 'Dun', 'Hal', 'Bel', 'Sor'],
  middle: ['an', 'or', 'ic', 'in', 'ar', 'on', 'ur', 'ir', 'ia', 'el', 'en', 'ys'],
  suffix: ['mund', 'wick', 'dris', 'ven', 'ric', 'dor', 'wyn', 'das', 'rin', 'helm', 'gard', 'mir'],
};

const BACKSTORY_TEMPLATES = [
  'Once a traveler who settled in this village after finding peace.',
  'Born here, never left. Knows every stone and tree.',
  'Came from a distant land seeking a new beginning.',
  'Lost their family to a plague, now devoted to the community.',
  'A former adventurer who retired to a quiet life.',
  'Inherited their profession from their parent.',
  'Was once a scholar before turning to practical work.',
  'A mysterious past they rarely speak about.',
];

const MAX_CACHE_SIZE = 50;

export class NPCMemorySystem {
  constructor(seed) {
    this._rng = new PRNG(seed * 6151 + 11);
    this._npcs = new Map(); // npcId -> NPCMemory
    this._cacheOrder = []; // LRU order
    this._maxCacheSize = MAX_CACHE_SIZE;
  }

  createNPC(npcId, options = {}) {
    const identity = this._generateIdentity(options);
    const memory = {
      id: npcId,
      identity,
      memory: {
        playerInteractions: [],
        relationship: 0,
        knownFacts: new Set(),
        preferences: { liked: [], disliked: [] },
        questsGiven: [],
      },
      state: {
        mood: 'neutral',
        dailyRoutine: this._generateRoutine(identity.profession),
        currentActivity: 'wandering',
        location: 'home',
      },
      createdAt: Date.now(),
      lastAccessed: Date.now(),
    };

    this._addToCache(npcId, memory);
    return memory;
  }

  _generateIdentity(options = {}) {
    const name = options.name || this._generateName();
    const profession = options.profession || PROFESSIONS[Math.floor(this._rng.next() * PROFESSIONS.length)];
    const personality = options.personality || PERSONALITIES[Math.floor(this._rng.next() * PERSONALITIES.length)];
    const backstory = options.backstory || BACKSTORY_TEMPLATES[Math.floor(this._rng.next() * BACKSTORY_TEMPLATES.length)];

    return { name, profession, personality, backstory };
  }

  _generateName() {
    const first = NAME_PARTS.first[Math.floor(this._rng.next() * NAME_PARTS.first.length)];
    const middle = NAME_PARTS.middle[Math.floor(this._rng.next() * NAME_PARTS.middle.length)];
    const suffix = NAME_PARTS.suffix[Math.floor(this._rng.next() * NAME_PARTS.suffix.length)];
    return first + middle + suffix;
  }

  _generateRoutine(profession) {
    const routines = {
      farmer: [
        { start: 6, end: 12, activity: 'farming', location: 'farm' },
        { start: 12, end: 13, activity: 'wandering', location: 'home' },
        { start: 13, end: 18, activity: 'farming', location: 'farm' },
        { start: 18, end: 22, activity: 'trading', location: 'market' },
        { start: 22, end: 6, activity: 'sleeping', location: 'home' },
      ],
      blacksmith: [
        { start: 7, end: 12, activity: 'mining', location: 'workplace' },
        { start: 12, end: 13, activity: 'wandering', location: 'home' },
        { start: 13, end: 19, activity: 'mining', location: 'workplace' },
        { start: 19, end: 22, activity: 'trading', location: 'market' },
        { start: 22, end: 7, activity: 'sleeping', location: 'home' },
      ],
      merchant: [
        { start: 8, end: 18, activity: 'trading', location: 'market' },
        { start: 18, end: 22, activity: 'wandering', location: 'home' },
        { start: 22, end: 8, activity: 'sleeping', location: 'home' },
      ],
      scholar: [
        { start: 8, end: 12, activity: 'wandering', location: 'workplace' },
        { start: 12, end: 13, activity: 'wandering', location: 'home' },
        { start: 13, end: 20, activity: 'wandering', location: 'workplace' },
        { start: 20, end: 23, activity: 'trading', location: 'market' },
        { start: 23, end: 8, activity: 'sleeping', location: 'home' },
      ],
      guard: [
        { start: 6, end: 14, activity: 'guarding', location: 'workplace' },
        { start: 14, end: 18, activity: 'wandering', location: 'home' },
        { start: 18, end: 6, activity: 'guarding', location: 'workplace' },
      ],
    };
    return routines[profession] || routines.farmer;
  }

  // === Cache Management (LRU) ===

  _addToCache(npcId, memory) {
    if (this._npcs.has(npcId)) {
      this._touchCache(npcId);
      return;
    }
    if (this._npcs.size >= this._maxCacheSize) {
      this._evictOldest();
    }
    this._npcs.set(npcId, memory);
    this._cacheOrder.push(npcId);
  }

  _touchCache(npcId) {
    const idx = this._cacheOrder.indexOf(npcId);
    if (idx >= 0) {
      this._cacheOrder.splice(idx, 1);
      this._cacheOrder.push(npcId);
    }
  }

  _evictOldest() {
    const oldestId = this._cacheOrder.shift();
    if (oldestId) {
      this._npcs.delete(oldestId);
    }
  }

  getNPC(npcId) {
    const npc = this._npcs.get(npcId);
    if (npc) {
      npc.lastAccessed = Date.now();
      this._touchCache(npcId);
      return npc;
    }
    return null;
  }

  hasNPC(npcId) {
    return this._npcs.has(npcId);
  }

  getCacheSize() {
    return this._npcs.size;
  }

  getMaxCacheSize() {
    return this._maxCacheSize;
  }

  // === Memory Operations ===

  recordInteraction(npcId, interaction) {
    const npc = this.getNPC(npcId);
    if (!npc) return false;

    npc.memory.playerInteractions.push({
      timestamp: Date.now(),
      ...interaction,
    });

    // Keep last 100 interactions
    if (npc.memory.playerInteractions.length > 100) {
      npc.memory.playerInteractions = npc.memory.playerInteractions.slice(-100);
    }

    // Adjust relationship based on interaction type
    if (interaction.type === 'gift' || interaction.type === 'help') {
      this.adjustRelationship(npcId, 5);
    } else if (interaction.type === 'insult' || interaction.type === 'attack') {
      this.adjustRelationship(npcId, -10);
    } else if (interaction.type === 'trade') {
      this.adjustRelationship(npcId, 1);
    }

    // Update mood based on interaction
    this._updateMoodFromInteraction(npc, interaction);

    return true;
  }

  adjustRelationship(npcId, delta) {
    const npc = this.getNPC(npcId);
    if (!npc) return false;

    npc.memory.relationship = Math.max(-100, Math.min(100, npc.memory.relationship + delta));
    return true;
  }

  getRelationship(npcId) {
    const npc = this.getNPC(npcId);
    return npc ? npc.memory.relationship : 0;
  }

  getRelationshipLevel(npcId) {
    const rel = this.getRelationship(npcId);
    if (rel <= -50) return 'hostile';
    if (rel < -10) return 'unfriendly';
    if (rel <= 10) return 'neutral';
    if (rel < 50) return 'friendly';
    return 'trusted';
  }

  addKnownFact(npcId, factId) {
    const npc = this.getNPC(npcId);
    if (!npc) return false;
    npc.memory.knownFacts.add(factId);
    return true;
  }

  knowsFact(npcId, factId) {
    const npc = this.getNPC(npcId);
    if (!npc) return false;
    return npc.memory.knownFacts.has(factId);
  }

  setPreference(npcId, item, liked = true) {
    const npc = this.getNPC(npcId);
    if (!npc) return false;
    if (liked) {
      if (!npc.memory.preferences.liked.includes(item)) {
        npc.memory.preferences.liked.push(item);
      }
    } else {
      if (!npc.memory.preferences.disliked.includes(item)) {
        npc.memory.preferences.disliked.push(item);
      }
    }
    return true;
  }

  addQuestGiven(npcId, questId) {
    const npc = this.getNPC(npcId);
    if (!npc) return false;
    npc.memory.questsGiven.push(questId);
    return true;
  }

  getQuestsGiven(npcId) {
    const npc = this.getNPC(npcId);
    return npc ? npc.memory.questsGiven : [];
  }

  // === State Management ===

  setMood(npcId, mood) {
    const npc = this.getNPC(npcId);
    if (!npc || !MOODS.includes(mood)) return false;
    npc.state.mood = mood;
    return true;
  }

  getMood(npcId) {
    const npc = this.getNPC(npcId);
    return npc ? npc.state.mood : 'neutral';
  }

  updateActivity(npcId, hour) {
    const npc = this.getNPC(npcId);
    if (!npc) return false;

    const routine = npc.state.dailyRoutine;
    for (const slot of routine) {
      if (slot.start <= slot.end) {
        if (hour >= slot.start && hour < slot.end) {
          npc.state.currentActivity = slot.activity;
          npc.state.location = slot.location;
          return true;
        }
      } else {
        // Wraps midnight
        if (hour >= slot.start || hour < slot.end) {
          npc.state.currentActivity = slot.activity;
          npc.state.location = slot.location;
          return true;
        }
      }
    }
    return false;
  }

  getActivity(npcId) {
    const npc = this.getNPC(npcId);
    return npc ? npc.state.currentActivity : 'wandering';
  }

  getLocation(npcId) {
    const npc = this.getNPC(npcId);
    return npc ? npc.state.location : 'home';
  }

  _updateMoodFromInteraction(npc, interaction) {
    if (interaction.type === 'gift' || interaction.type === 'help') {
      npc.state.mood = 'happy';
    } else if (interaction.type === 'insult' || interaction.type === 'attack') {
      npc.state.mood = 'angry';
    } else if (interaction.type === 'scare') {
      npc.state.mood = 'scared';
    }
  }

  // === Serialization ===

  serializeNPC(npcId) {
    const npc = this.getNPC(npcId);
    if (!npc) return null;
    return {
      ...npc,
      memory: {
        ...npc.memory,
        knownFacts: Array.from(npc.memory.knownFacts),
      },
    };
  }

  deserializeNPC(data) {
    if (!data || !data.id) return null;
    const memory = {
      ...data,
      memory: {
        ...data.memory,
        knownFacts: new Set(data.memory.knownFacts || []),
      },
    };
    this._addToCache(data.id, memory);
    return memory;
  }

  serializeAll() {
    const result = [];
    for (const [id, npc] of this._npcs) {
      result.push(this.serializeNPC(id));
    }
    return result;
  }

  deserializeAll(data) {
    if (!data) return;
    this._npcs.clear();
    this._cacheOrder = [];
    for (const npcData of data) {
      this.deserializeNPC(npcData);
    }
  }

  // === Query helpers ===

  getAllNPCIds() {
    return Array.from(this._npcs.keys());
  }

  getNPCsByProfession(profession) {
    const result = [];
    for (const npc of this._npcs.values()) {
      if (npc.identity.profession === profession) {
        result.push(npc);
      }
    }
    return result;
  }

  getNPCsByMood(mood) {
    const result = [];
    for (const npc of this._npcs.values()) {
      if (npc.state.mood === mood) {
        result.push(npc);
      }
    }
    return result;
  }
}

// === Constants export for testing ===
export { PROFESSIONS, PERSONALITIES, MOODS, ACTIVITIES, MAX_CACHE_SIZE };
