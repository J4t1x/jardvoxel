import { BALANCE } from '@config/balance';

export interface GambleCardResult {
  playerValue: number;
  dealerValue: number;
  outcome: 'win' | 'lose' | 'tie';
  multiplier: number;
}

export class GambleRound {
  static generateDealerValue(): number {
    return 2 + Math.floor(Math.random() * 13);
  }

  static generatePlayerValue(): number {
    return 2 + Math.floor(Math.random() * 13);
  }

  static evaluate(
    playerValue: number,
    dealerValue: number,
    hasInsurance: boolean,
  ): GambleCardResult {
    if (playerValue > dealerValue) {
      return { playerValue, dealerValue, outcome: 'win', multiplier: 2 };
    } else if (playerValue === dealerValue) {
      if (hasInsurance) {
        return { playerValue, dealerValue, outcome: 'win', multiplier: 1 };
      }
      return { playerValue, dealerValue, outcome: 'lose', multiplier: 0 };
    } else {
      return { playerValue, dealerValue, outcome: 'lose', multiplier: 0 };
    }
  }

  static cardEmoji(v: number): string {
    if (v <= 10) return v.toString();
    return ({ 11: 'J', 12: 'Q', 13: 'K', 14: 'A' } as Record<number, string>)[v];
  }

  static randomSuit(): string {
    return ['♥', '♦', '♠', '♣'][Math.floor(Math.random() * 4)];
  }

  static get maxRounds(): number {
    return BALANCE.gambleMaxRounds;
  }
}
