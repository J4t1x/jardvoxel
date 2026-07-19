// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Save/Load — IndexedDB persistence
// SPEC-039: Save/Load System
// ═══════════════════════════════════════════════════════════

const DB_NAME = 'jardvoxel-survival';
const DB_VERSION = 1;
const STORE_WORLD = 'world';
const STORE_CHUNKS = 'chunks';

export class SaveManager {
  // namespace: keeps a game variant's save in its own IndexedDB database.
  // Default '' preserves the original shared 'jardvoxel-survival' DB used by
  // jardvoxel-survival.html and jardvoxel-zen.html today.
  constructor(namespace = '') {
    this.db = null;
    this.autoSaveInterval = null;
    this.lastSaveTime = 0;
    this._dbName = namespace ? `${DB_NAME}-${namespace}` : DB_NAME;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this._dbName, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_WORLD)) {
          db.createObjectStore(STORE_WORLD, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_CHUNKS)) {
          db.createObjectStore(STORE_CHUNKS, { keyPath: 'key' });
        }
      };
      req.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(true);
      };
      req.onerror = () => {
        console.warn('IndexedDB not available, saves disabled');
        resolve(false);
      };
    });
  }

  async saveWorld(worldData) {
    if (!this.db) return false;
    return new Promise((resolve) => {
      const tx = this.db.transaction([STORE_WORLD], 'readwrite');
      const store = tx.objectStore(STORE_WORLD);
      store.put({ id: 'main', ...worldData, savedAt: Date.now() });
      tx.oncomplete = () => { this.lastSaveTime = Date.now(); resolve(true); };
      tx.onerror = (e) => {
        // SPEC-074 Bug #14: Handle QuotaExceededError gracefully
        this._handleQuotaError(e, 'saveWorld');
        resolve(false);
      };
    });
  }

  async loadWorld() {
    if (!this.db) return null;
    return new Promise((resolve) => {
      const tx = this.db.transaction([STORE_WORLD], 'readonly');
      const store = tx.objectStore(STORE_WORLD);
      const req = store.get('main');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async saveChunk(key, modifications) {
    if (!this.db || !modifications || modifications.length === 0) return false;
    return new Promise((resolve) => {
      const tx = this.db.transaction([STORE_CHUNKS], 'readwrite');
      const store = tx.objectStore(STORE_CHUNKS);
      store.put({ key, modifications });
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => {
        // SPEC-074 Bug #14: Handle QuotaExceededError gracefully
        this._handleQuotaError(e, 'saveChunk');
        resolve(false);
      };
    });
  }

  async loadChunk(key) {
    if (!this.db) return null;
    return new Promise((resolve) => {
      const tx = this.db.transaction([STORE_CHUNKS], 'readonly');
      const store = tx.objectStore(STORE_CHUNKS);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async getAllChunkKeys() {
    if (!this.db) return [];
    return new Promise((resolve) => {
      const tx = this.db.transaction([STORE_CHUNKS], 'readonly');
      const store = tx.objectStore(STORE_CHUNKS);
      const req = store.getAllKeys();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  async clearAll() {
    if (!this.db) return false;
    return new Promise((resolve) => {
      const tx = this.db.transaction([STORE_WORLD, STORE_CHUNKS], 'readwrite');
      tx.objectStore(STORE_WORLD).clear();
      tx.objectStore(STORE_CHUNKS).clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }

  // SPEC-074 Bug #14: Handle QuotaExceededError — clear old chunk saves
  // to make space, and warn the user if storage is critically low.
  _handleQuotaError(event, operation) {
    const err = event.target && event.target.error;
    const isQuota = err && (err.name === 'QuotaExceededError' || err.code === 0);
    if (!isQuota) return;
    console.warn(`SaveManager: QuotaExceededError during ${operation}. Attempting to free space...`);
    // Try clearing old chunk saves to free space
    if (this.db) {
      try {
        const tx = this.db.transaction([STORE_CHUNKS], 'readwrite');
        tx.objectStore(STORE_CHUNKS).clear();
        tx.oncomplete = () => console.warn('SaveManager: Cleared chunk saves to free space.');
        tx.onerror = () => console.warn('SaveManager: Failed to clear chunk saves.');
      } catch (e) {
        console.warn('SaveManager: Could not clear chunk saves:', e);
      }
    }
    // Notify the user (if in browser context)
    if (typeof document !== 'undefined') {
      console.warn('SaveManager: Storage quota exceeded. Old chunk data cleared. World save may fail.');
    }
  }

  startAutoSave(getSaveDataFn, intervalMs = 30000) {
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    this.autoSaveInterval = setInterval(async () => {
      const data = getSaveDataFn();
      if (data) await this.saveWorld(data);
    }, intervalMs);
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  hasSave() {
    return this.db !== null;
  }
}
