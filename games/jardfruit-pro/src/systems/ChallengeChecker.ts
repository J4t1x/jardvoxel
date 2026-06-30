import { CHALLENGES_POOL, type ChallengeConfig } from '@config/challenges';
import type { GameState } from './Economy';

export interface ActiveChallenge extends ChallengeConfig {
  completed: boolean;
  claimed: boolean;
}

export class ChallengeChecker {
  static checkDaily(state: GameState): ActiveChallenge[] {
    const today = new Date().toDateString();
    if (state.challengesDate === today) return state.challenges as ActiveChallenge[];

    const pool = [...CHALLENGES_POOL];
    const picked: ActiveChallenge[] = [];
    for (let i = 0; i < 3 && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push({ ...pool[idx], completed: false, claimed: false });
      pool.splice(idx, 1);
    }
    return picked;
  }

  static checkCompletion(state: GameState, challenges: ActiveChallenge[]): ActiveChallenge[] {
    return challenges.map((ch) => {
      if (ch.completed) return ch;
      const completed = this.checkSingle(state, ch);
      return completed ? { ...ch, completed: true } : ch;
    });
  }

  static checkSingle(state: GameState, ch: ActiveChallenge): boolean {
    const s = state.stats;
    switch (ch.type) {
      case 'winStreak': return state.winStreak >= ch.target;
      case 'bonus': return s.bonosTriggered >= ch.target;
      case 'catch': return s.fruitsCaught >= ch.target;
      case 'spins': return s.totalSpins >= ch.target;
      case 'bigwin': return s.biggestWin >= state.apuestaActual * 10;
      case 'gamble': return s.gambleWins + s.gambleLosses >= ch.target;
      case 'jackpot': return s.jackpots >= ch.target;
      case 'scatter': return s.scatterTriggered >= ch.target;
      case 'level': return state.nivel >= ch.target;
      case 'freespins': return s.freeSpinsWon >= ch.target;
      default: return false;
    }
  }

  static getProgress(state: GameState, ch: ActiveChallenge): number {
    const s = state.stats;
    switch (ch.type) {
      case 'winStreak': return Math.min(100, (state.winStreak / ch.target) * 100);
      case 'bonus': return Math.min(100, (s.bonosTriggered / ch.target) * 100);
      case 'catch': return Math.min(100, (s.fruitsCaught / ch.target) * 100);
      case 'spins': return Math.min(100, (s.totalSpins / ch.target) * 100);
      case 'bigwin':
        return state.stats.biggestWin >= state.apuestaActual * 10
          ? 100
          : Math.min(100, (state.stats.biggestWin / (state.apuestaActual * 10)) * 100);
      case 'gamble': return Math.min(100, ((s.gambleWins + s.gambleLosses) / ch.target) * 100);
      case 'jackpot': return Math.min(100, (s.jackpots / ch.target) * 100);
      case 'scatter': return Math.min(100, (s.scatterTriggered / ch.target) * 100);
      case 'level': return Math.min(100, (state.nivel / ch.target) * 100);
      case 'freespins': return Math.min(100, (s.freeSpinsWon / ch.target) * 100);
      default: return 0;
    }
  }
}
