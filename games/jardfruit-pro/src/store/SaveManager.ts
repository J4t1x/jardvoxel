import type { GameState } from '@systems/Economy';
import { createInitialState, CURRENT_SAVE_VERSION } from '@systems/Economy';

const SAVE_KEY = 'jardfruit-pro-save';

export class SaveManager {
  static save(state: GameState): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Save failed:', e);
    }
  }

  static load(): GameState {
    try {
      const s = localStorage.getItem(SAVE_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        const initial = createInitialState();
        const version = parsed.saveVersion ?? 0;
        const migrated = SaveManager.migrate(parsed, version);
        return {
          ...initial,
          ...migrated,
          upgrades: { ...initial.upgrades, ...(parsed.upgrades ?? {}) },
          stats: {
            totalSpins: parsed.stats?.totalSpins ?? initial.stats.totalSpins,
            totalWins: parsed.stats?.totalWins ?? initial.stats.totalWins,
            totalBet: parsed.stats?.totalBet ?? initial.stats.totalBet,
            totalWon: parsed.stats?.totalWon ?? initial.stats.totalWon,
            biggestWin: parsed.stats?.biggestWin ?? initial.stats.biggestWin,
            bonosTriggered: parsed.stats?.bonosTriggered ?? initial.stats.bonosTriggered,
            gambleWins: parsed.stats?.gambleWins ?? initial.stats.gambleWins,
            gambleLosses: parsed.stats?.gambleLosses ?? initial.stats.gambleLosses,
            bestStreak: parsed.stats?.bestStreak ?? initial.stats.bestStreak,
            jackpots: parsed.stats?.jackpots ?? initial.stats.jackpots,
            fruitsCaught: parsed.stats?.fruitsCaught ?? initial.stats.fruitsCaught,
            scatterTriggered: parsed.stats?.scatterTriggered ?? initial.stats.scatterTriggered,
            freeSpinsWon: parsed.stats?.freeSpinsWon ?? initial.stats.freeSpinsWon,
            prestiges: parsed.stats?.prestiges ?? initial.stats.prestiges,
            totalDeposited: parsed.stats?.totalDeposited ?? initial.stats.totalDeposited,
            challengesCompleted: parsed.stats?.challengesCompleted ?? initial.stats.challengesCompleted,
          },
          jackpotProgresivo: parsed.jackpotProgresivo ?? initial.jackpotProgresivo,
          prestigeMult: parsed.prestigeMult ?? initial.prestigeMult,
          goldenHourMult: parsed.goldenHourMult ?? initial.goldenHourMult,
          challenges: parsed.challenges ?? initial.challenges,
          volume: migrated.volume ?? initial.volume,
          freeSpinsMult: migrated.freeSpinsMult ?? initial.freeSpinsMult,
          showGuides: migrated.showGuides ?? initial.showGuides,
          saveVersion: CURRENT_SAVE_VERSION,
        };
      }
    } catch (e) {
      console.error('Load failed:', e);
    }
    return createInitialState();
  }

  static clear(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      console.error('Clear failed:', e);
    }
  }

  static exists(): boolean {
    try {
      return localStorage.getItem(SAVE_KEY) !== null;
    } catch {
      return false;
    }
  }

  static migrate(data: any, fromVersion: number): any {
    const migrated = { ...data };
    if (fromVersion < 1) {
      // v0 → v1: add saveVersion field, no breaking changes
      migrated.saveVersion = 1;
    }
    return migrated;
  }
}
