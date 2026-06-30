// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from '@store/SaveManager';
import { createInitialState } from '@systems/Economy';

describe('SaveManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return initial state when no save exists', () => {
    const state = SaveManager.load();
    const initial = createInitialState();
    expect(state.saldo).toBe(initial.saldo);
    expect(state.nivel).toBe(initial.nivel);
  });

  it('should save and load state correctly', () => {
    const state = createInitialState();
    state.saldo = 5000;
    state.nivel = 3;
    state.stats.totalSpins = 42;
    SaveManager.save(state);
    const loaded = SaveManager.load();
    expect(loaded.saldo).toBe(5000);
    expect(loaded.nivel).toBe(3);
    expect(loaded.stats.totalSpins).toBe(42);
  });

  it('should detect existing save', () => {
    expect(SaveManager.exists()).toBe(false);
    SaveManager.save(createInitialState());
    expect(SaveManager.exists()).toBe(true);
  });

  it('should clear save', () => {
    SaveManager.save(createInitialState());
    expect(SaveManager.exists()).toBe(true);
    SaveManager.clear();
    expect(SaveManager.exists()).toBe(false);
  });

  it('should merge old save missing new fields with defaults', () => {
    const oldSave = {
      saldo: 9999,
      nivel: 5,
      expTotal: 50000,
      apuestaActual: 100,
      stats: { totalSpins: 10, totalWins: 5 },
    };
    localStorage.setItem('jardfruit-pro-save', JSON.stringify(oldSave));
    const loaded = SaveManager.load();
    expect(loaded.saldo).toBe(9999);
    expect(loaded.nivel).toBe(5);
    expect(loaded.stats.totalSpins).toBe(10);
    expect(loaded.stats.totalWins).toBe(5);
    expect(loaded.stats.totalBet).toBe(0);
    expect(loaded.jackpotProgresivo).toBe(createInitialState().jackpotProgresivo);
    expect(loaded.prestigeMult).toBe(1);
    expect(loaded.volume).toBe(70);
    expect(loaded.showGuides).toBe(true);
  });

  it('should handle corrupted save gracefully', () => {
    localStorage.setItem('jardfruit-pro-save', 'not-json');
    const state = SaveManager.load();
    expect(state.saldo).toBe(createInitialState().saldo);
  });

  it('should migrate old saves without saveVersion to current version', () => {
    const oldSave = {
      saldo: 1000,
      nivel: 2,
      saveVersion: 0,
    };
    localStorage.setItem('jardfruit-pro-save', JSON.stringify(oldSave));
    const loaded = SaveManager.load();
    expect(loaded.saveVersion).toBe(1);
    expect(loaded.saldo).toBe(1000);
    expect(loaded.nivel).toBe(2);
  });

  it('should set saveVersion on new saves', () => {
    const state = createInitialState();
    SaveManager.save(state);
    const raw = localStorage.getItem('jardfruit-pro-save');
    const parsed = JSON.parse(raw!);
    expect(parsed.saveVersion).toBe(1);
  });
});
