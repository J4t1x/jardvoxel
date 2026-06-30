import { ACHIEVEMENTS_DATA } from '@config/achievements';
import type { GameState } from './Economy';

export class AchievementChecker {
  static check(state: GameState): string[] {
    const unlocked: string[] = [];
    for (const ach of ACHIEVEMENTS_DATA) {
      if (state.achievements.includes(ach.id)) continue;
      if (this.checkSingle(state, ach.id)) unlocked.push(ach.id);
    }
    return unlocked;
  }

  static checkSingle(state: GameState, id: string): boolean {
    const s = state.stats;
    switch (id) {
      case 'firstSpin': return s.totalSpins >= 1;
      case 'firstWin': return s.totalWins >= 1;
      case 'cherryPicker': return state.achievements.includes('cherryPicker');
      case 'wildOne': return state.achievements.includes('wildOne');
      case 'bonusHunter': return s.bonosTriggered >= 1;
      case 'bonusMaster': return state.achievements.includes('bonusMaster');
      case 'gambler': return s.gambleWins + s.gambleLosses >= 10;
      case 'doubleDown': return state.achievements.includes('doubleDown');
      case 'highRoller': return state.achievements.includes('highRoller');
      case 'allIn': return state.achievements.includes('allIn');
      case 'fruitMaster': return s.totalWins >= 100;
      case 'jackpot': return s.jackpots >= 1;
      case 'scatterKing': return s.scatterTriggered >= 1;
      case 'freeSpinMaster': return s.freeSpinsWon >= 50;
      case 'prestige': return s.prestiges >= 1;
      case 'challengeMaster': return (s.challengesCompleted ?? 0) >= 10;
      default: return false;
    }
  }

  static getAchievement(id: string) {
    return ACHIEVEMENTS_DATA.find((a) => a.id === id);
  }
}
