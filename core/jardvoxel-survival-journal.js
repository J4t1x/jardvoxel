// ═══════════════════════════════════════════════════════════
// SPEC-099: Exploration Journal
// Automatically records memorable moments and player statistics.
// Persists to localStorage. Provides a rich narrative log of
// the player's journey through the world.
// ═══════════════════════════════════════════════════════════

const STORAGE_KEY = 'jardvoxel-journal';
const MAX_ENTRIES = 200;

// Entry types
const ENTRY_TYPES = {
  BIOME_DISCOVERY:    'biome_discovery',
  MEDITATION_SPACE:   'meditation_space',
  RESONANCE_LEVEL:    'resonance_level',
  KOMOREBI_MOMENT:    'komorebi_moment',
  LIVING_WORLD:       'living_world',
  MILESTONE:          'milestone',
  SUNRISE:            'sunrise',
  SUNSET:             'sunset',
  FIRST_BLOCK:        'first_block',
  TREE_PLANTED:       'tree_planted',
  FISH_CAUGHT:        'fish_caught',
  // SPEC-113: Archipelago entries
  GARDEN_DISCOVERY:   'garden_discovery',
  RESTORATION_POINT:  'restoration_point',
  GARDEN_RESTORED:    'garden_restored',
  // SPEC-LANDMARKS/SPEC-089: landmark + narrative structure + world-event entries
  LANDMARK:           'landmark',
  NARRATIVE_STRUCTURE: 'narrative_structure',
  WORLD_EVENT:        'world_event',
  QUEST:              'quest',
  CUSTOM:             'custom',
};

export class ExplorationJournal {
  constructor() {
    this._entries = [];
    this._stats = {
      blocksPlaced: 0,
      blocksBroken: 0,
      distanceTraveled: 0,
      biomesDiscovered: 0,
      meditationSpacesFound: 0,
      treesPlanted: 0,
      fishCaught: 0,
      timePlayed: 0,
      highestResonance: 0,
      // SPEC-113: Archipelago stats
      gardensDiscovered: 0,
      restorationPointsActivated: 0,
      gardensRestored: 0,
      // SPEC-LANDMARKS/SPEC-089: landmark + world-event discovery stats
      landmarksFound: 0,
      worldEventsWitnessed: 0,
    };
    this._lastPlayerPos = null;
  }

  // Add a journal entry
  addEntry(type, title, description, metadata = {}) {
    const entry = {
      id: Date.now() + Math.random(),
      type,
      title,
      description,
      metadata,
      timestamp: Date.now(),
    };
    this._entries.push(entry);
    if (this._entries.length > MAX_ENTRIES) {
      this._entries.shift();
    }
    return entry;
  }

  // Track player movement for distance stat
  trackMovement(playerPos) {
    if (this._lastPlayerPos) {
      const dx = playerPos.x - this._lastPlayerPos.x;
      const dy = playerPos.y - this._lastPlayerPos.y;
      const dz = playerPos.z - this._lastPlayerPos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > 0.1) {
        this._stats.distanceTraveled += dist;
      }
    }
    this._lastPlayerPos = { x: playerPos.x, y: playerPos.y, z: playerPos.z };
  }

  // Update play time
  updateTime(dt) {
    this._stats.timePlayed += dt;
  }

  // Track stats
  incrementStat(stat, amount = 1) {
    if (this._stats[stat] !== undefined) {
      this._stats[stat] += amount;
      // SPEC-073 Gap 8: Auto-detect milestones when stats cross thresholds
      this._checkMilestones(stat);
    }
  }

  setStat(stat, value) {
    if (this._stats[stat] !== undefined) {
      if (stat === 'highestResonance') {
        this._stats[stat] = Math.max(this._stats[stat], value);
      } else {
        this._stats[stat] = value;
      }
      // SPEC-073 Gap 8: Auto-detect milestones
      this._checkMilestones(stat);
    }
  }

  // SPEC-073 Gap 8: Automatic milestone detection based on stat thresholds
  _checkMilestones(stat) {
    if (!this._milestoneThresholds) {
      this._milestoneThresholds = {
        blocksPlaced: [10, 50, 100, 500, 1000],
        blocksMined: [10, 50, 100, 500, 1000],
        treesPlanted: [1, 5, 10, 25, 50],
        distanceTraveled: [100, 500, 1000, 5000, 10000],
        highestResonance: [10, 25, 50, 100],
        timePlayed: [60, 300, 600, 1800, 3600], // 1m, 5m, 10m, 30m, 1h
      };
      this._milestonesReached = new Set();
    }
    const thresholds = this._milestoneThresholds[stat];
    if (!thresholds) return;
    const value = this._stats[stat];
    for (const threshold of thresholds) {
      const key = `${stat}_${threshold}`;
      if (value >= threshold && !this._milestonesReached.has(key)) {
        this._milestonesReached.add(key);
        this.addEntry('milestone', `Milestone: ${stat} ${threshold}`, 
          `Reached ${threshold} ${stat}!`, { stat, threshold });
      }
    }
  }

  // Get recent entries
  getEntries(limit = 20) {
    return this._entries.slice(-limit).reverse();
  }

  // Get entries by type
  getEntriesByType(type, limit = 10) {
    return this._entries.filter(e => e.type === type).slice(-limit).reverse();
  }

  // Get stats summary
  getStats() {
    return { ...this._stats };
  }

  // Get formatted play time
  getFormattedPlayTime() {
    const seconds = Math.floor(this._stats.timePlayed);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  // Search entries
  search(query) {
    const q = query.toLowerCase();
    return this._entries.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
    ).reverse();
  }

  // Serialize
  serialize() {
    return {
      entries: this._entries,
      stats: this._stats,
    };
  }

  // Deserialize
  deserialize(data) {
    if (data) {
      this._entries = data.entries || [];
      this._stats = { ...this._stats, ...(data.stats || {}) };
    }
  }

  // Save is handled by ZenGame main save system — no independent localStorage

  // Load is handled by ZenGame main save system — no independent localStorage

  // Clear journal
  clear() {
    this._entries = [];
    this._stats = {
      blocksPlaced: 0,
      blocksBroken: 0,
      distanceTraveled: 0,
      biomesDiscovered: 0,
      meditationSpacesFound: 0,
      treesPlanted: 0,
      fishCaught: 0,
      timePlayed: 0,
      highestResonance: 0,
      gardensDiscovered: 0,
      restorationPointsActivated: 0,
      gardensRestored: 0,
    };
    this._save = () => {};
  }
}

export { ENTRY_TYPES };
