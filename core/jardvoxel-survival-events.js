// ═══════════════════════════════════════════════════════════
// SPEC-089: Emergent Events System
// 10 event types with triggers, cooldowns, probability checks.
// Max 1 active event. Events last 2-10 minutes. AI integration.
// ═══════════════════════════════════════════════════════════

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
const MAX_ACTIVE_EVENTS = 1;

export const EVENT_TYPES = {
  METEOR_SHOWER: 'meteor_shower',
  MIGRATION: 'migration',
  FESTIVAL: 'festival',
  ECLIPSE: 'eclipse',
  AURORA: 'aurora',
  EARTHQUAKE: 'earthquake',
  TRADER_CARAVAN: 'trader_caravan',
  LOST_TRAVELER: 'lost_traveler',
  ANCIENT_DISCOVERY: 'ancient_discovery',
  LEGEND_REVEAL: 'legend_reveal',
};

const EVENT_CONFIGS = {
  meteor_shower: {
    name: 'Meteor Shower',
    trigger: 'time',
    nightOnly: true,
    probability: 0.08,
    minDuration: 3,
    maxDuration: 8,
    description: 'Rocks fall from the sky with rare minerals',
    effects: ['rare_minerals', 'sky_visual'],
  },
  migration: {
    name: 'Animal Migration',
    trigger: 'world',
    probability: 0.10,
    minDuration: 4,
    maxDuration: 8,
    description: 'A herd of animals crosses the biome',
    effects: ['animal_spawn', 'ambient_sound'],
  },
  festival: {
    name: 'Village Festival',
    trigger: 'npc',
    probability: 0.06,
    minDuration: 5,
    maxDuration: 10,
    description: 'Villagers celebrate with music and food',
    effects: ['music_change', 'free_food', 'villager_gathering'],
  },
  eclipse: {
    name: 'Solar Eclipse',
    trigger: 'time',
    probability: 0.04,
    minDuration: 3,
    maxDuration: 5,
    description: 'Darkness falls during the day',
    effects: ['darkness', 'special_mobs', 'lighting_change'],
  },
  aurora: {
    name: 'Aurora Borealis',
    trigger: 'time',
    nightOnly: true,
    coldBiomesOnly: true,
    probability: 0.07,
    minDuration: 5,
    maxDuration: 10,
    description: 'Colorful lights dance in the night sky',
    effects: ['sky_visual', 'ambient_sound'],
  },
  earthquake: {
    name: 'Earthquake',
    trigger: 'world',
    probability: 0.03,
    minDuration: 1,
    maxDuration: 3,
    description: 'The ground shakes, exposing new caves',
    effects: ['terrain_modification', 'cave_exposure', 'camera_shake'],
  },
  trader_caravan: {
    name: 'Trader Caravan',
    trigger: 'random',
    probability: 0.08,
    minDuration: 5,
    maxDuration: 10,
    description: 'A wandering merchant with rare items',
    effects: ['npc_spawn', 'trading_opportunity'],
  },
  lost_traveler: {
    name: 'Lost Traveler',
    trigger: 'random',
    probability: 0.06,
    minDuration: 4,
    maxDuration: 8,
    description: 'A lost NPC asks for help',
    effects: ['npc_spawn', 'escort_quest'],
  },
  ancient_discovery: {
    name: 'Ancient Discovery',
    trigger: 'player',
    probability: 0.05,
    minDuration: 2,
    maxDuration: 5,
    description: 'A structure emerges from the terrain',
    effects: ['structure_reveal', 'lore_discovery'],
  },
  legend_reveal: {
    name: 'Legend Reveal',
    trigger: 'npc',
    probability: 0.05,
    minDuration: 2,
    maxDuration: 5,
    description: 'An NPC reveals a secret location',
    effects: ['map_marker', 'lore_discovery'],
  },
};

export class EventManager {
  constructor() {
    this._activeEvent = null;
    this._lastEventTime = 0;
    this._eventHistory = [];
    this._checkTimer = null;
    this._eventTimer = null;
    this._handlers = new Map();
    this._running = false;
    this._gameTime = 0;
    this._playerContext = {};
  }

  start() {
    this._running = true;
    this._lastEventTime = Date.now();
    this._scheduleNextCheck();
  }

  stop() {
    this._running = false;
    if (this._checkTimer) { clearTimeout(this._checkTimer); this._checkTimer = null; }
    if (this._eventTimer) { clearTimeout(this._eventTimer); this._eventTimer = null; }
    this._activeEvent = null;
  }

  isRunning() {
    return this._running;
  }

  setPlayerContext(context) {
    this._playerContext = context;
  }

  _scheduleNextCheck() {
    if (!this._running) return;
    this._checkTimer = setTimeout(() => {
      this.checkEvents();
      this._scheduleNextCheck();
    }, CHECK_INTERVAL_MS);
  }

  checkEvents() {
    if (!this._running) return null;
    if (this._activeEvent) return null;

    const now = Date.now();
    const elapsed = now - this._lastEventTime;
    if (elapsed < COOLDOWN_MS) return null;

    return this._rollForEvent();
  }

  _rollForEvent() {
    const now = Date.now();
    const ctx = this._playerContext;
    const isNight = ctx.dayTime !== undefined && (ctx.dayTime < 0.25 || ctx.dayTime > 0.75);
    const biome = ctx.biome || 'plains';
    const coldBiomes = ['taiga', 'snowy_plains', 'mountains'];

    for (const [type, config] of Object.entries(EVENT_CONFIGS)) {
      // Check conditions
      if (config.nightOnly && !isNight) continue;
      if (config.coldBiomesOnly && !coldBiomes.includes(biome)) continue;

      // Roll probability
      if (Math.random() < config.probability) {
        this._startEvent(type, config);
        return type;
      }
    }

    return null;
  }

  _startEvent(type, config) {
    const duration = config.minDuration + Math.floor(Math.random() * (config.maxDuration - config.minDuration + 1));
    const durationMs = duration * 60 * 1000;

    this._activeEvent = {
      type,
      name: config.name,
      description: config.description,
      effects: config.effects,
      startTime: Date.now(),
      duration: durationMs,
      endTime: Date.now() + durationMs,
    };

    this._lastEventTime = Date.now();
    this._emit('event_started', this._activeEvent);

    // Auto-end event after duration
    this._eventTimer = setTimeout(() => {
      this._endEvent();
    }, durationMs);
  }

  _endEvent() {
    if (!this._activeEvent) return;
    const event = this._activeEvent;
    this._eventHistory.push(event);
    this._activeEvent = null;
    this._lastEventTime = Date.now();
    this._eventTimer = null;
    this._emit('event_ended', event);
  }

  forceEvent(type) {
    if (this._activeEvent) return false;
    const config = EVENT_CONFIGS[type];
    if (!config) return false;
    this._startEvent(type, config);
    return true;
  }

  endActiveEvent() {
    if (this._eventTimer) {
      clearTimeout(this._eventTimer);
      this._eventTimer = null;
    }
    this._endEvent();
  }

  getActiveEvent() {
    return this._activeEvent;
  }

  hasActiveEvent() {
    return this._activeEvent !== null;
  }

  getEventHistory() {
    return this._eventHistory;
  }

  getCooldownRemaining() {
    if (this._activeEvent) return 0;
    const elapsed = Date.now() - this._lastEventTime;
    return Math.max(0, COOLDOWN_MS - elapsed);
  }

  isOnCooldown() {
    return this.getCooldownRemaining() > 0;
  }

  // === Event Handlers ===

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

  // === AI Integration ===

  triggerAIEvent(eventData) {
    if (this._activeEvent) return false;
    this._activeEvent = {
      type: eventData.type || 'custom',
      name: eventData.name || 'Custom Event',
      description: eventData.description || '',
      effects: eventData.effects || [],
      startTime: Date.now(),
      duration: (eventData.duration || 5) * 60 * 1000,
      endTime: Date.now() + (eventData.duration || 5) * 60 * 1000,
      aiGenerated: true,
    };
    this._lastEventTime = Date.now();
    this._emit('event_started', this._activeEvent);

    this._eventTimer = setTimeout(() => {
      this._endEvent();
    }, this._activeEvent.duration);

    return true;
  }

  // === Serialization ===

  serialize() {
    return {
      activeEvent: this._activeEvent,
      eventHistory: this._eventHistory.slice(-50),
      lastEventTime: this._lastEventTime,
    };
  }

  deserialize(data) {
    if (!data) return;
    this._activeEvent = data.activeEvent || null;
    this._eventHistory = data.eventHistory || [];
    this._lastEventTime = data.lastEventTime || Date.now();
  }

  getCheckInterval() {
    return CHECK_INTERVAL_MS;
  }

  getCooldownMs() {
    return COOLDOWN_MS;
  }

  getMaxActiveEvents() {
    return MAX_ACTIVE_EVENTS;
  }
}

export { CHECK_INTERVAL_MS, COOLDOWN_MS, MAX_ACTIVE_EVENTS, EVENT_CONFIGS };
