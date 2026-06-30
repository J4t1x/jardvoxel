import { describe, it, expect } from 'vitest';
import { Economy, createInitialState } from '@systems/Economy';
import { BALANCE } from '@config/balance';

describe('Economy', () => {
  it('should create initial state with correct values', () => {
    const state = createInitialState();
    expect(state.saldo).toBe(BALANCE.startingBalance);
    expect(state.nivel).toBe(1);
    expect(state.jackpotProgresivo).toBe(BALANCE.startingJackpot);
    expect(state.prestigeMult).toBe(1);
  });

  it('should deduct bet correctly', () => {
    const state = createInitialState();
    state.apuestaActual = 100;
    const newState = Economy.deductBet(state, false);
    expect(newState.saldo).toBe(state.saldo - 100);
    expect(newState.stats.totalBet).toBe(100);
    expect(newState.jackpotProgresivo).toBeGreaterThan(state.jackpotProgresivo);
  });

  it('should not deduct on free spin', () => {
    const state = createInitialState();
    state.apuestaActual = 100;
    const newState = Economy.deductBet(state, true);
    expect(newState.saldo).toBe(state.saldo);
    expect(newState.stats.totalBet).toBe(0);
  });

  it('should apply win correctly', () => {
    const state = createInitialState();
    const newState = Economy.applyWin(state, 500);
    expect(newState.saldo).toBe(state.saldo + 500);
    expect(newState.winStreak).toBe(state.winStreak + 1);
    expect(newState.stats.totalWins).toBe(1);
    expect(newState.stats.biggestWin).toBe(500);
  });

  it('should apply loss and reset win streak', () => {
    const state = createInitialState();
    state.winStreak = 5;
    const newState = Economy.applyLoss(state);
    expect(newState.winStreak).toBe(0);
  });

  it('should apply jackpot correctly', () => {
    const state = createInitialState();
    const jackpotAmount = state.jackpotProgresivo;
    const newState = Economy.applyJackpot(state);
    expect(newState.saldo).toBe(state.saldo + jackpotAmount);
    expect(newState.jackpotProgresivo).toBe(BALANCE.startingJackpot);
    expect(newState.stats.jackpots).toBe(1);
  });

  it('should buy upgrade when affordable', () => {
    const state = createInitialState();
    state.saldo = 2000;
    const newState = Economy.buyUpgrade(state, 'autoSpin', 2000);
    expect(newState.saldo).toBe(0);
    expect(newState.upgrades.autoSpin).toBe(true);
  });

  it('should not buy upgrade when not affordable', () => {
    const state = createInitialState();
    state.saldo = 100;
    const newState = Economy.buyUpgrade(state, 'autoSpin', 2000);
    expect(newState.saldo).toBe(100);
    expect(newState.upgrades.autoSpin).toBeUndefined();
  });

  it('should calculate RTP correctly', () => {
    const state = createInitialState();
    state.stats.totalBet = 1000;
    state.stats.totalWon = 950;
    expect(Economy.getRTP(state)).toBe(95);
  });

  it('should return 0 RTP when no bets', () => {
    const state = createInitialState();
    expect(Economy.getRTP(state)).toBe(0);
  });

  it('should get correct level from exp', () => {
    expect(Economy.getLevel(0)).toBe(1);
    expect(Economy.getLevel(5000)).toBe(2);
    expect(Economy.getLevel(20000)).toBe(3);
    expect(Economy.getLevel(50000)).toBe(4);
    expect(Economy.getLevel(100000)).toBe(5);
  });

  it('should check prestige eligibility', () => {
    const state = createInitialState();
    expect(Economy.canPrestige(state)).toBe(false);
    state.nivel = 5;
    state.expTotal = 100000;
    expect(Economy.canPrestige(state)).toBe(true);
  });

  it('should apply prestige correctly', () => {
    const state = createInitialState();
    state.nivel = 5;
    state.expTotal = 100000;
    state.prestigio = 0;
    const newState = Economy.doPrestige(state);
    expect(newState.prestigio).toBe(1);
    expect(newState.prestigeMult).toBe(1.5);
    expect(newState.saldo).toBe(BALANCE.startingBalance);
    expect(newState.nivel).toBe(1);
  });

  it('should apply deposit correctly', () => {
    const state = createInitialState();
    const newState = Economy.deposit(state, 1500);
    expect(newState.saldo).toBe(state.saldo + 1500);
    expect(newState.stats.totalDeposited).toBe(1500);
  });

  it('should return correct spin streak reward', () => {
    expect(Economy.checkSpinStreakReward(10)).toBe(50);
    expect(Economy.checkSpinStreakReward(25)).toBe(100);
    expect(Economy.checkSpinStreakReward(50)).toBe(250);
    expect(Economy.checkSpinStreakReward(100)).toBe(500);
    expect(Economy.checkSpinStreakReward(200)).toBe(1000);
    expect(Economy.checkSpinStreakReward(7)).toBe(0);
  });

  it('should trigger free spins with scatter stats', () => {
    const state = createInitialState();
    const spins = BALANCE.freeSpinsBaseCount + 3;
    const newState = Economy.triggerFreeSpins(state, spins, true);
    expect(newState.freeSpins).toBe(spins);
    expect(newState.stats.freeSpinsWon).toBe(spins);
    expect(newState.stats.scatterTriggered).toBe(1);
  });

  it('should trigger free spins with wild stats (no scatter)', () => {
    const state = createInitialState();
    const spins = BALANCE.freeSpinsBaseCount;
    const newState = Economy.triggerFreeSpins(state, spins, false);
    expect(newState.freeSpins).toBe(spins);
    expect(newState.stats.freeSpinsWon).toBe(spins);
    expect(newState.stats.scatterTriggered).toBe(0);
  });

  it('should accumulate free spins on re-trigger', () => {
    const state = createInitialState();
    state.freeSpins = 3;
    const newState = Economy.triggerFreeSpins(state, 5, true);
    expect(newState.freeSpins).toBe(8);
    expect(newState.stats.freeSpinsWon).toBe(5);
  });

  it('should not allow prestige below level 5', () => {
    const state = createInitialState();
    state.nivel = 4;
    state.expTotal = 50000;
    expect(Economy.canPrestige(state)).toBe(false);
  });

  it('should allow prestige at level 5 + 100k exp', () => {
    const state = createInitialState();
    state.nivel = 5;
    state.expTotal = 100000;
    expect(Economy.canPrestige(state)).toBe(true);
  });

  it('should doPrestige and increment stats', () => {
    const state = createInitialState();
    state.nivel = 5;
    state.expTotal = 100000;
    state.prestigio = 0;
    state.stats.prestiges = 0;
    const newState = Economy.doPrestige(state);
    expect(newState.prestigio).toBe(1);
    expect(newState.prestigeMult).toBe(1.5);
    expect(newState.saldo).toBe(BALANCE.startingBalance);
    expect(newState.nivel).toBe(1);
    expect(newState.expTotal).toBe(0);
    expect(newState.upgrades).toEqual({});
    expect(newState.achievements).toEqual([]);
    expect(newState.jackpotProgresivo).toBe(BALANCE.startingJackpot);
    expect(newState.stats.prestiges).toBe(1);
  });

  it('should accumulate prestige multiplier correctly', () => {
    const state = createInitialState();
    state.nivel = 5;
    state.expTotal = 100000;
    state.prestigio = 2;
    const newState = Economy.doPrestige(state);
    expect(newState.prestigio).toBe(3);
    expect(newState.prestigeMult).toBe(2.5);
  });

  it('should apply jackpot and reset', () => {
    const state = createInitialState();
    state.jackpotProgresivo = 15000;
    const newState = Economy.applyJackpot(state);
    expect(newState.saldo).toBe(state.saldo + 15000);
    expect(newState.jackpotProgresivo).toBe(BALANCE.startingJackpot);
    expect(newState.stats.jackpots).toBe(1);
  });
});
