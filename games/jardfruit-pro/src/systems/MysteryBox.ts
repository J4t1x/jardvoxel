import { BALANCE } from '@config/balance';
import type { GameState } from './Economy';

export interface MysteryBoxResult {
  type: 'coins' | 'fever' | 'upgrade' | 'bigCoins' | 'goldenHour' | 'megaJackpot';
  text: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  amount: number;
  upgradeKey?: string;
}

export class MysteryBox {
  static roll(state: GameState): MysteryBoxResult {
    const roll = Math.random();
    if (roll < 0.4) {
      const c = 50 + Math.floor(Math.random() * 151);
      return { type: 'coins', text: `+${c} 🪙`, icon: '🪙', rarity: 'common', amount: c };
    } else if (roll < 0.65) {
      return {
        type: 'fever',
        text: `Multiplicador x2 por ${BALANCE.feverSpins / 2} giros`,
        icon: '🔥',
        rarity: 'rare',
        amount: 0,
      };
    } else if (roll < 0.85) {
      const available = Object.keys(state.upgrades).filter((k) => !state.upgrades[k]);
      if (available.length > 0) {
        const key = available[Math.floor(Math.random() * available.length)];
        return { type: 'upgrade', text: `Upgrade: ${key}!`, icon: '⚙️', rarity: 'epic', amount: 0, upgradeKey: key };
      }
      return { type: 'coins', text: '+200 🪙', icon: '🪙', rarity: 'common', amount: 200 };
    } else if (roll < 0.95) {
      const c = 500 + Math.floor(Math.random() * 501);
      return { type: 'bigCoins', text: `+${c} 🪙`, icon: '💰', rarity: 'legendary', amount: c };
    } else if (roll < 0.99) {
      return {
        type: 'goldenHour',
        text: `GOLDEN HOUR! Todo x${BALANCE.goldenHourMultiplier} por ${BALANCE.goldenHourSpins} giros`,
        icon: '🌟',
        rarity: 'legendary',
        amount: 0,
      };
    } else {
      return { type: 'megaJackpot', text: 'MEGA JACKPOT! +5000 🪙', icon: '💎', rarity: 'mythic', amount: 5000 };
    }
  }

  static shouldTrigger(): boolean {
    return Math.random() < BALANCE.mysteryBoxChance;
  }
}
