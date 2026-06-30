import { BALANCE } from '@config/balance';
import type { GameState } from './Economy';

export class DailyLogin {
  static check(state: GameState): { state: GameState; reward: number; streak: number } {
    const today = new Date().toDateString();
    if (state.ultimoLogin === today) return { state, reward: 0, streak: state.loginStreak };

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const newStreak = state.ultimoLogin === yesterday ? state.loginStreak + 1 : 1;
    const reward = BALANCE.dailyLoginRewards[Math.min(newStreak - 1, 6)];

    return {
      state: {
        ...state,
        loginStreak: newStreak,
        ultimoLogin: today,
        saldo: state.saldo + reward,
      },
      reward,
      streak: newStreak,
    };
  }
}
