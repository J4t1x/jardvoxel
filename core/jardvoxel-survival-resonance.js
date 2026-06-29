// ═══════════════════════════════════════════════════════════
// SPEC-099: Resonance System
// Tracks player behavior patterns and adapts world generation
// and events to create a personalized wellness experience.
// Based on Japanese concept of "Ma" (間) — negative space,
// pauses, and harmony between actions.
// ═══════════════════════════════════════════════════════════

// Behavior tracking weights
const BEHAVIOR_WEIGHTS = {
  exploration: 1.0,
  building:     0.8,
  mining:       0.6,
  combat:      -0.5,  // combat reduces resonance
  meditation:   2.0,  // meditation boosts resonance
  planting:     1.5,  // planting trees boosts resonance
  fishing:      1.2,
  idle:         0.3,
};

// Resonance level thresholds
const RESONANCE_LEVELS = {
  disharmony:  { min: -100, max: 0,   label: 'Disharmony' },
  neutral:     { min: 0,    max: 50,  label: 'Neutral' },
  harmony:     { min: 50,   max: 150, label: 'Harmony' },
  resonance:   { min: 150,  max: 300, label: 'Resonance' },
  transcendence:{ min: 300, max: Infinity, label: 'Transcendence' },
};

export class ResonanceSystem {
  constructor() {
    this.score = 0;
    this.level = 'neutral';
    this._behaviors = {
      exploration: 0,
      building: 0,
      mining: 0,
      combat: 0,
      meditation: 0,
      planting: 0,
      fishing: 0,
      idle: 0,
    };
    this._eventLog = [];
    this._maxEventLog = 50;
    this._lastDecayTime = performance.now();
    this._decayInterval = 60; // decay every 60s
    this._decayRate = 2;      // lose 2 points per minute of inactivity
    this._worldGenInfluence = {
      flowerDensity: 1.0,
      treeDensity: 1.0,
      meditationSpaceChance: 0.0,
      ambientCreatureChance: 1.0,
    };
    this._onLevelChange = null;
  }

  // Track a player behavior event
  track(action, magnitude = 1) {
    const weight = BEHAVIOR_WEIGHTS[action] || 0;
    if (weight === 0) return;

    this._behaviors[action] = (this._behaviors[action] || 0) + magnitude;
    const delta = weight * magnitude;
    this.score += delta;

    // Log event
    this._eventLog.push({
      action,
      magnitude,
      delta,
      timestamp: Date.now(),
    });
    if (this._eventLog.length > this._maxEventLog) {
      this._eventLog.shift();
    }

    this._updateLevel();
    this._updateWorldGenInfluence();
  }

  // Get resonance level from score
  _updateLevel() {
    let newLevel = 'neutral';
    for (const [name, cfg] of Object.entries(RESONANCE_LEVELS)) {
      if (this.score >= cfg.min && this.score < cfg.max) {
        newLevel = name;
        break;
      }
    }

    if (newLevel !== this.level) {
      const oldLevel = this.level;
      this.level = newLevel;
      if (this._onLevelChange) {
        this._onLevelChange(oldLevel, newLevel, this.score);
      }
    }
  }

  // Adapt world generation parameters based on resonance
  _updateWorldGenInfluence() {
    const s = this.score;
    // Higher resonance → more flowers, trees, meditation spaces, creatures
    this._worldGenInfluence = {
      flowerDensity:      1.0 + Math.max(0, s / 200),
      treeDensity:        1.0 + Math.max(0, s / 300),
      meditationSpaceChance: Math.max(0, Math.min(0.15, s / 2000)),
      ambientCreatureChance: 1.0 + Math.max(0, s / 250),
    };
  }

  // Periodic update — call once per second
  update(dt) {
    const now = performance.now();
    const elapsed = (now - this._lastDecayTime) / 1000;
    if (elapsed >= this._decayInterval) {
      this._lastDecayTime = now;
      // Gentle decay toward neutral if no recent activity
      const recentActivity = this._eventLog.filter(
        e => Date.now() - e.timestamp < 60000
      ).length;
      if (recentActivity === 0 && this.score > 0) {
        this.score = Math.max(0, this.score - this._decayRate);
        this._updateLevel();
        this._updateWorldGenInfluence();
      }
    }
  }

  // Get current world gen influence for WorldGenPipeline
  getWorldGenInfluence() {
    return this._worldGenInfluence;
  }

  // Get behavior statistics
  getStats() {
    return {
      score: this.score,
      level: this.level,
      levelLabel: RESONANCE_LEVELS[this.level]?.label || 'Unknown',
      behaviors: { ...this._behaviors },
      recentEvents: this._eventLog.slice(-10),
    };
  }

  // Serialize for save
  serialize() {
    return {
      score: this.score,
      level: this.level,
      behaviors: { ...this._behaviors },
      eventLog: this._eventLog.slice(-20),
    };
  }

  // Load from save
  deserialize(data) {
    if (data) {
      this.score = data.score || 0;
      this.level = data.level || 'neutral';
      this._behaviors = data.behaviors || this._behaviors;
      this._eventLog = data.eventLog || [];
      this._updateWorldGenInfluence();
    }
  }

  onLevelChange(callback) {
    this._onLevelChange = callback;
  }
}
