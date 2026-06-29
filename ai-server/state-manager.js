// ═══════════════════════════════════════════════════════════
// SPEC-085: AI Server — State Manager
// Persistent state for NPC memory, quests, events.
// Uses JSON file persistence (portable, no external deps).
// ═══════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const STATE_FILE = join(DATA_DIR, 'state.json');

export class StateManager {
  constructor() {
    this._state = {
      npcs: {},
      quests: {},
      events: [],
      lore: [],
      civilizations: [],
      worldSeed: null,
    };
    this._dirty = false;
    this._saveTimer = null;
  }

  init() {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    this._load();
  }

  _load() {
    if (existsSync(STATE_FILE)) {
      try {
        const data = readFileSync(STATE_FILE, 'utf-8');
        this._state = JSON.parse(data);
      } catch (e) {
        // Corrupt file — start fresh
        this._state = { npcs: {}, quests: {}, events: [], lore: [], civilizations: [], worldSeed: null };
      }
    }
  }

  _scheduleSave() {
    this._dirty = true;
    if (this._saveTimer) return;
    this._saveTimer = setTimeout(() => {
      this._save();
      this._saveTimer = null;
    }, 1000);
  }

  _save() {
    if (!this._dirty) return;
    try {
      writeFileSync(STATE_FILE, JSON.stringify(this._state, null, 2));
      this._dirty = false;
    } catch (e) {
      // Non-fatal — will retry on next schedule
    }
  }

  flush() {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
    }
    this._save();
  }

  // === NPC Memory ===

  getNPC(npcId) {
    return this._state.npcs[npcId] || null;
  }

  setNPC(npcId, data) {
    this._state.npcs[npcId] = data;
    this._scheduleSave();
  }

  updateNPC(npcId, updates) {
    if (!this._state.npcs[npcId]) return null;
    Object.assign(this._state.npcs[npcId], updates);
    this._scheduleSave();
    return this._state.npcs[npcId];
  }

  getAllNPCs() {
    return Object.values(this._state.npcs);
  }

  // === Quests ===

  getQuest(questId) {
    return this._state.quests[questId] || null;
  }

  setQuest(questId, data) {
    this._state.quests[questId] = data;
    this._scheduleSave();
  }

  getAllQuests() {
    return Object.values(this._state.quests);
  }

  // === Events ===

  addEvent(event) {
    this._state.events.push(event);
    if (this._state.events.length > 100) {
      this._state.events = this._state.events.slice(-100);
    }
    this._scheduleSave();
  }

  getEvents() {
    return this._state.events;
  }

  // === Lore ===

  addLore(lore) {
    this._state.lore.push(lore);
    this._scheduleSave();
  }

  getLore() {
    return this._state.lore;
  }

  // === Civilizations ===

  setCivilizations(civs) {
    this._state.civilizations = civs;
    this._scheduleSave();
  }

  getCivilizations() {
    return this._state.civilizations;
  }

  // === World ===

  setWorldSeed(seed) {
    this._state.worldSeed = seed;
    this._scheduleSave();
  }

  getWorldSeed() {
    return this._state.worldSeed;
  }

  // === Reset ===

  clear() {
    this._state = { npcs: {}, quests: {}, events: [], lore: [], civilizations: [], worldSeed: null };
    this._scheduleSave();
  }
}
