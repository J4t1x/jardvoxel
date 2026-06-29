import { describe, it, expect } from 'vitest';
import { SaveManager } from '../core/jardvoxel-survival-save.js';

describe('SaveManager', () => {
  it('starts with null db', () => {
    const sm = new SaveManager();
    expect(sm.db).toBeNull();
    expect(sm.hasSave()).toBe(false);
  });

  it('init opens indexedDB', async () => {
    const sm = new SaveManager();
    const result = await sm.init();
    expect(result).toBe(true);
    expect(sm.db).not.toBeNull();
    expect(sm.hasSave()).toBe(true);
  });

  it('saveWorld and loadWorld round-trip', async () => {
    const sm = new SaveManager();
    await sm.init();
    const data = { seed: 42, time: 100, player: { x: 1, y: 2, z: 3 } };
    const saved = await sm.saveWorld(data);
    expect(saved).toBe(true);
    const loaded = await sm.loadWorld();
    expect(loaded).not.toBeNull();
    expect(loaded.seed).toBe(42);
    expect(loaded.time).toBe(100);
    expect(loaded.savedAt).toBeDefined();
  });

  it('saveChunk and loadChunk round-trip', async () => {
    const sm = new SaveManager();
    await sm.init();
    const mods = [{ x: 1, y: 2, z: 3, block: 5 }];
    const saved = await sm.saveChunk('0,0', mods);
    expect(saved).toBe(true);
    const loaded = await sm.loadChunk('0,0');
    expect(loaded).not.toBeNull();
    expect(loaded.modifications).toEqual(mods);
  });

  it('saveChunk returns false for empty modifications', async () => {
    const sm = new SaveManager();
    await sm.init();
    expect(await sm.saveChunk('0,0', [])).toBe(false);
    expect(await sm.saveChunk('0,0', null)).toBe(false);
  });

  it('getAllChunkKeys returns saved keys', async () => {
    const sm = new SaveManager();
    await sm.init();
    await sm.saveChunk('1,0', [{ x: 0, y: 0, z: 0, block: 1 }]);
    await sm.saveChunk('0,1', [{ x: 0, y: 0, z: 0, block: 2 }]);
    const keys = await sm.getAllChunkKeys();
    expect(keys).toContain('1,0');
    expect(keys).toContain('0,1');
  });

  it('clearAll removes all data', async () => {
    const sm = new SaveManager();
    await sm.init();
    await sm.saveWorld({ seed: 1 });
    await sm.saveChunk('0,0', [{ x: 0, y: 0, z: 0, block: 1 }]);
    await sm.clearAll();
    expect(await sm.loadWorld()).toBeNull();
    expect(await sm.loadChunk('0,0')).toBeNull();
  });

  it('startAutoSave and stopAutoSave', () => {
    const sm = new SaveManager();
    sm.startAutoSave(() => ({ seed: 1 }), 1000);
    expect(sm.autoSaveInterval).not.toBeNull();
    sm.stopAutoSave();
    expect(sm.autoSaveInterval).toBeNull();
  });

  it('saveWorld returns false without db', async () => {
    const sm = new SaveManager();
    expect(await sm.saveWorld({})).toBe(false);
  });

  it('loadWorld returns null without db', async () => {
    const sm = new SaveManager();
    expect(await sm.loadWorld()).toBeNull();
  });
});
