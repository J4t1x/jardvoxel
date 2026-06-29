// ═══════════════════════════════════════════════════════════
// SPEC-088: Dynamic Quest System
// QuestManager with 7 quest types, difficulty scaling, state
// management (active/completed/failed/abandoned), quest tracker
// (max 5 active), real-time progress, map markers, and AI
// integration for custom quest generation.
// ═══════════════════════════════════════════════════════════

const MAX_ACTIVE_QUESTS = 5;

export const QUEST_TYPES = {
  FETCH: 'fetch',
  EXPLORE: 'explore',
  DEFEAT: 'defeat',
  BUILD: 'build',
  ESCORT: 'escort',
  DELIVER: 'deliver',
  DISCOVER: 'discover',
};

export const QUEST_STATES = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
  ABANDONED: 'abandoned',
};

export const QUEST_TRIGGERS = {
  CONVERSATION: 'conversation',
  DISCOVERY: 'discovery',
  EVENT: 'event',
  AI_GENERATED: 'ai_generated',
};

const QUEST_TYPE_CONFIGS = {
  fetch: {
    name: 'Fetch',
    description: 'Bring {count} {item} from {location}',
    icon: 'package',
    defaultRewards: ['items', 'xp'],
  },
  explore: {
    name: 'Explore',
    description: 'Visit {location}',
    icon: 'compass',
    defaultRewards: ['xp', 'lore'],
  },
  defeat: {
    name: 'Defeat',
    description: 'Defeat {count} {mob}',
    icon: 'sword',
    defaultRewards: ['items', 'xp'],
  },
  build: {
    name: 'Build',
    description: 'Build a {structure} with {requirements}',
    icon: 'hammer',
    defaultRewards: ['xp', 'items'],
  },
  escort: {
    name: 'Escort',
    description: 'Accompany {npc} to {destination}',
    icon: 'shield',
    defaultRewards: ['xp', 'relationship'],
  },
  deliver: {
    name: 'Deliver',
    description: 'Deliver {item} from {npcA} to {npcB}',
    icon: 'mail',
    defaultRewards: ['items', 'relationship'],
  },
  discover: {
    name: 'Discover',
    description: 'Find the {structure} in {biome}',
    icon: 'magnifier',
    defaultRewards: ['lore', 'xp', 'access'],
  },
};

const REWARD_TYPES = {
  ITEMS: 'items',
  XP: 'xp',
  RELATIONSHIP: 'relationship',
  LORE: 'lore',
  ACCESS: 'access',
};

const DIFFICULTY_LEVELS = {
  TRIVIAL: 1,
  EASY: 2,
  MEDIUM: 3,
  HARD: 4,
  EPIC: 5,
};

let questIdCounter = 0;

function generateQuestId() {
  questIdCounter++;
  return `quest_${Date.now()}_${questIdCounter}`;
}

function scaleDifficulty(playerLevel, playerEquipment) {
  const equipScore = Array.isArray(playerEquipment) ? playerEquipment.length : 0;
  const baseLevel = playerLevel || 1;
  const totalScore = baseLevel + Math.floor(equipScore / 3);

  if (totalScore <= 2) return DIFFICULTY_LEVELS.TRIVIAL;
  if (totalScore <= 5) return DIFFICULTY_LEVELS.EASY;
  if (totalScore <= 10) return DIFFICULTY_LEVELS.MEDIUM;
  if (totalScore <= 15) return DIFFICULTY_LEVELS.HARD;
  return DIFFICULTY_LEVELS.EPIC;
}

function generateRewards(difficulty, questType) {
  const config = QUEST_TYPE_CONFIGS[questType] || QUEST_TYPE_CONFIGS.fetch;
  const baseRewards = [...config.defaultRewards];
  const rewards = [];

  const xpBase = difficulty * 50;
  rewards.push({ type: REWARD_TYPES.XP, amount: xpBase });

  for (const rewardType of baseRewards) {
    if (rewardType === REWARD_TYPES.ITEMS) {
      rewards.push({ type: REWARD_TYPES.ITEMS, amount: difficulty * 2, rarity: difficulty >= 4 ? 'rare' : 'common' });
    } else if (rewardType === REWARD_TYPES.RELATIONSHIP) {
      rewards.push({ type: REWARD_TYPES.RELATIONSHIP, amount: difficulty * 5 });
    } else if (rewardType === REWARD_TYPES.LORE) {
      rewards.push({ type: REWARD_TYPES.LORE, count: difficulty });
    } else if (rewardType === REWARD_TYPES.ACCESS) {
      rewards.push({ type: REWARD_TYPES.ACCESS, description: 'Access to hidden area' });
    }
  }

  return rewards;
}

export class QuestManager {
  constructor(options = {}) {
    this._aiClient = options.aiClient || null;
    this._npcMemory = options.npcMemory || null;
    this._quests = new Map();
    this._activeQuestIds = [];
    this._completedQuestIds = [];
    this._failedQuestIds = [];
    this._abandonedQuestIds = [];
    this._uniqueQuests = new Set();
    this._handlers = new Map();
    this._worldSeed = options.worldSeed || 0;
  }

  createQuest(config = {}) {
    const type = config.type || QUEST_TYPES.FETCH;
    const typeConfig = QUEST_TYPE_CONFIGS[type];
    if (!typeConfig) return null;

    const id = config.id || generateQuestId();
    if (this._uniqueQuests.has(id)) return null;

    const playerLevel = config.playerLevel || 1;
    const playerEquipment = config.playerEquipment || [];
    const difficulty = config.difficulty || scaleDifficulty(playerLevel, playerEquipment);

    const objectives = config.objectives || this._generateDefaultObjectives(type, config, difficulty);
    const rewards = config.rewards || generateRewards(difficulty, type);

    const quest = {
      id,
      type,
      title: config.title || this._generateTitle(type, config),
      description: config.description || this._generateDescription(type, config, difficulty),
      objectives,
      rewards,
      difficulty,
      trigger: config.trigger || QUEST_TRIGGERS.CONVERSATION,
      npcId: config.npcId || null,
      worldSeed: this._worldSeed,
      state: QUEST_STATES.ACTIVE,
      progress: 0,
      createdAt: Date.now(),
      completedAt: null,
      failedAt: null,
      abandonedAt: null,
      timeLimit: config.timeLimit || null,
      mapMarker: config.mapMarker || null,
      chainParent: config.chainParent || null,
    };

    this._quests.set(id, quest);
    this._uniqueQuests.add(id);
    this._activeQuestIds.push(id);

    if (this._activeQuestIds.length > MAX_ACTIVE_QUESTS) {
      this._emit('quest_limit_reached', {
        activeCount: this._activeQuestIds.length,
        maxActive: MAX_ACTIVE_QUESTS,
      });
    }

    if (quest.npcId && this._npcMemory) {
      this._npcMemory.addQuestGiven(quest.npcId, id);
    }

    this._emit('quest_created', quest);
    return quest;
  }

  _generateDefaultObjectives(type, config, difficulty) {
    switch (type) {
      case QUEST_TYPES.FETCH:
        return [{ type: 'collect', item: config.item || 'wood', count: difficulty * 3, current: 0 }];
      case QUEST_TYPES.EXPLORE:
        return [{ type: 'visit', location: config.location || 'ancient temple', reached: false }];
      case QUEST_TYPES.DEFEAT:
        return [{ type: 'kill', mob: config.mob || 'zombie', count: difficulty * 2, current: 0 }];
      case QUEST_TYPES.BUILD:
        return [{ type: 'construct', structure: config.structure || 'house', requirements: config.requirements || ['walls', 'roof'], completed: [] }];
      case QUEST_TYPES.ESCORT:
        return [{ type: 'escort', npc: config.npc || 'traveler', destination: config.destination || 'village', arrived: false }];
      case QUEST_TYPES.DELIVER:
        return [{ type: 'deliver', item: config.item || 'letter', fromNpc: config.fromNpc || 'merchant', toNpc: config.toNpc || 'scholar', delivered: false }];
      case QUEST_TYPES.DISCOVER:
        return [{ type: 'discover', structure: config.structure || 'ruins', biome: config.biome || 'forest', found: false }];
      default:
        return [{ type: 'generic', description: 'Complete the task', done: false }];
    }
  }

  _generateTitle(type, config) {
    const typeConfig = QUEST_TYPE_CONFIGS[type];
    const name = typeConfig.name;
    if (config.target) return `${name}: ${config.target}`;
    if (config.item) return `${name}: ${config.item}`;
    if (config.location) return `${name}: ${config.location}`;
    if (config.structure) return `${name}: ${config.structure}`;
    return `${name} Quest`;
  }

  _generateDescription(type, config, difficulty) {
    const typeConfig = QUEST_TYPE_CONFIGS[type];
    let desc = typeConfig.description;
    desc = desc.replace('{count}', difficulty * 3);
    desc = desc.replace('{item}', config.item || 'supplies');
    desc = desc.replace('{location}', config.location || 'the marked area');
    desc = desc.replace('{mob}', config.mob || 'enemies');
    desc = desc.replace('{structure}', config.structure || 'the structure');
    desc = desc.replace('{requirements}', config.requirements ? config.requirements.join(', ') : 'basic materials');
    desc = desc.replace('{npc}', config.npc || 'the traveler');
    desc = desc.replace('{destination}', config.destination || 'the safe location');
    desc = desc.replace('{npcA}', config.fromNpc || 'the sender');
    desc = desc.replace('{npcB}', config.toNpc || 'the recipient');
    desc = desc.replace('{biome}', config.biome || 'the wilderness');
    return desc;
  }

  updateProgress(questId, objectiveIndex, value) {
    const quest = this._quests.get(questId);
    if (!quest || quest.state !== QUEST_STATES.ACTIVE) return null;

    const objective = quest.objectives[objectiveIndex];
    if (!objective) return null;

    if (objective.type === 'collect' || objective.type === 'kill') {
      objective.current = Math.min(objective.count, (objective.current || 0) + (value || 1));
    } else if (objective.type === 'visit' || objective.type === 'escort') {
      objective.reached = true;
      objective.arrived = true;
    } else if (objective.type === 'deliver') {
      objective.delivered = true;
    } else if (objective.type === 'discover') {
      objective.found = true;
    } else if (objective.type === 'construct') {
      if (typeof value === 'string' && objective.requirements.includes(value)) {
        if (!objective.completed.includes(value)) {
          objective.completed.push(value);
        }
      }
    } else {
      objective.done = true;
    }

    const progress = this._calculateProgress(quest);
    quest.progress = progress;

    this._emit('quest_progress', { quest, progress, objectiveIndex });

    if (progress >= 1) {
      this.completeQuest(questId);
    }

    return quest;
  }

  _calculateProgress(quest) {
    const objectives = quest.objectives;
    let total = objectives.length;
    let completed = 0;

    for (const obj of objectives) {
      if (obj.type === 'collect' || obj.type === 'kill') {
        if (obj.current >= obj.count) completed++;
      } else if (obj.type === 'visit' || obj.type === 'escort') {
        if (obj.reached || obj.arrived) completed++;
      } else if (obj.type === 'deliver') {
        if (obj.delivered) completed++;
      } else if (obj.type === 'discover') {
        if (obj.found) completed++;
      } else if (obj.type === 'construct') {
        if (obj.completed.length >= obj.requirements.length) completed++;
      } else {
        if (obj.done) completed++;
      }
    }

    return completed / total;
  }

  completeQuest(questId) {
    const quest = this._quests.get(questId);
    if (!quest || quest.state !== QUEST_STATES.ACTIVE) return null;

    quest.state = QUEST_STATES.COMPLETED;
    quest.completedAt = Date.now();
    quest.progress = 1;

    const idx = this._activeQuestIds.indexOf(questId);
    if (idx >= 0) this._activeQuestIds.splice(idx, 1);
    this._completedQuestIds.push(questId);

    this._emit('quest_completed', quest);

    if (quest.chainParent) {
      this._emit('quest_chain_ready', {
        completedQuest: quest,
        chainParent: quest.chainParent,
      });
    }

    return quest;
  }

  failQuest(questId, reason = 'timeout') {
    const quest = this._quests.get(questId);
    if (!quest || quest.state !== QUEST_STATES.ACTIVE) return null;

    quest.state = QUEST_STATES.FAILED;
    quest.failedAt = Date.now();
    quest.failReason = reason;

    const idx = this._activeQuestIds.indexOf(questId);
    if (idx >= 0) this._activeQuestIds.splice(idx, 1);
    this._failedQuestIds.push(questId);

    this._emit('quest_failed', { quest, reason });
    return quest;
  }

  abandonQuest(questId) {
    const quest = this._quests.get(questId);
    if (!quest || quest.state !== QUEST_STATES.ACTIVE) return null;

    quest.state = QUEST_STATES.ABANDONED;
    quest.abandonedAt = Date.now();

    const idx = this._activeQuestIds.indexOf(questId);
    if (idx >= 0) this._activeQuestIds.splice(idx, 1);
    this._abandonedQuestIds.push(questId);

    this._emit('quest_abandoned', quest);
    return quest;
  }

  getQuest(questId) {
    return this._quests.get(questId) || null;
  }

  getActiveQuests() {
    return this._activeQuestIds.map(id => this._quests.get(id)).filter(Boolean);
  }

  getCompletedQuests() {
    return this._completedQuestIds.map(id => this._quests.get(id)).filter(Boolean);
  }

  getFailedQuests() {
    return this._failedQuestIds.map(id => this._quests.get(id)).filter(Boolean);
  }

  getAbandonedQuests() {
    return this._abandonedQuestIds.map(id => this._quests.get(id)).filter(Boolean);
  }

  getVisibleQuests() {
    return this.getActiveQuests().slice(0, MAX_ACTIVE_QUESTS);
  }

  getQuestCount() {
    return this._quests.size;
  }

  getActiveCount() {
    return this._activeQuestIds.length;
  }

  canAcceptMore() {
    return this._activeQuestIds.length < MAX_ACTIVE_QUESTS;
  }

  getMaxActiveQuests() {
    return MAX_ACTIVE_QUESTS;
  }

  isUnique(questId) {
    return !this._uniqueQuests.has(questId);
  }

  hasQuest(questId) {
    return this._quests.has(questId);
  }

  getQuestsByType(type) {
    const result = [];
    for (const quest of this._quests.values()) {
      if (quest.type === type) result.push(quest);
    }
    return result;
  }

  getQuestsByNPC(npcId) {
    const result = [];
    for (const quest of this._quests.values()) {
      if (quest.npcId === npcId) result.push(quest);
    }
    return result;
  }

  getMapMarkers() {
    const markers = [];
    for (const quest of this.getActiveQuests()) {
      if (quest.mapMarker) {
        markers.push({
          questId: quest.id,
          ...quest.mapMarker,
        });
      }
    }
    return markers;
  }

  async generateAIQuest(context = {}) {
    if (!this._aiClient || !this._aiClient.isConnected()) {
      return this.createQuest({
        ...context,
        trigger: QUEST_TRIGGERS.CONVERSATION,
      });
    }

    try {
      const response = await this._aiClient.requestQuest(context);
      if (response.type === 'fallback' || !response.quest) {
        return this.createQuest({
          ...context,
          trigger: QUEST_TRIGGERS.CONVERSATION,
        });
      }

      const aiQuest = response.quest;
      return this.createQuest({
        id: aiQuest.id || generateQuestId(),
        type: aiQuest.type || QUEST_TYPES.FETCH,
        title: aiQuest.title,
        description: aiQuest.description,
        objectives: aiQuest.objectives,
        rewards: aiQuest.rewards,
        trigger: QUEST_TRIGGERS.AI_GENERATED,
        npcId: context.npcId || null,
        playerLevel: context.playerLevel,
        playerEquipment: context.playerEquipment,
        mapMarker: aiQuest.mapMarker || null,
      });
    } catch (e) {
      return this.createQuest({
        ...context,
        trigger: QUEST_TRIGGERS.CONVERSATION,
      });
    }
  }

  createChainQuest(parentQuestId, config = {}) {
    const parent = this._quests.get(parentQuestId);
    if (!parent || parent.state !== QUEST_STATES.COMPLETED) return null;

    return this.createQuest({
      ...config,
      chainParent: parentQuestId,
      npcId: parent.npcId,
    });
  }

  checkTimeLimits(currentTime) {
    for (const questId of [...this._activeQuestIds]) {
      const quest = this._quests.get(questId);
      if (quest && quest.timeLimit && currentTime - quest.createdAt > quest.timeLimit) {
        this.failQuest(questId, 'timeout');
      }
    }
  }

  on(event, handler) {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, []);
    }
    this._handlers.get(event).push(handler);
  }

  off(event, handler) {
    const handlers = this._handlers.get(event);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx >= 0) handlers.splice(idx, 1);
    }
  }

  _emit(event, data) {
    const handlers = this._handlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try { handler(data); } catch (e) {}
      }
    }
  }

  serialize() {
    return {
      quests: Array.from(this._quests.values()),
      activeQuestIds: [...this._activeQuestIds],
      completedQuestIds: [...this._completedQuestIds],
      failedQuestIds: [...this._failedQuestIds],
      abandonedQuestIds: [...this._abandonedQuestIds],
      uniqueQuests: Array.from(this._uniqueQuests),
      worldSeed: this._worldSeed,
    };
  }

  deserialize(data) {
    if (!data) return;
    this._quests.clear();
    this._activeQuestIds = [];
    this._completedQuestIds = [];
    this._failedQuestIds = [];
    this._abandonedQuestIds = [];
    this._uniqueQuests = new Set();

    for (const quest of data.quests || []) {
      this._quests.set(quest.id, quest);
      if (quest.state === QUEST_STATES.ACTIVE) this._activeQuestIds.push(quest.id);
      else if (quest.state === QUEST_STATES.COMPLETED) this._completedQuestIds.push(quest.id);
      else if (quest.state === QUEST_STATES.FAILED) this._failedQuestIds.push(quest.id);
      else if (quest.state === QUEST_STATES.ABANDONED) this._abandonedQuestIds.push(quest.id);
    }

    this._uniqueQuests = new Set(data.uniqueQuests || []);
    this._worldSeed = data.worldSeed || 0;
  }
}

export {
  MAX_ACTIVE_QUESTS,
  QUEST_TYPE_CONFIGS,
  REWARD_TYPES,
  DIFFICULTY_LEVELS,
  scaleDifficulty,
  generateRewards,
};
