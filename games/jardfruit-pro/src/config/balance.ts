export interface BalanceConfig {
  startingBalance: number;
  startingJackpot: number;
  jackpotContributionRate: number;
  bankruptcyProtectionAmount: number;
  freeSpinsMultiplier: number;
  freeSpinsBaseCount: number;
  feverSpins: number;
  feverMultiplier: number;
  goldenHourMultiplier: number;
  goldenHourSpins: number;
  mysteryBoxChance: number;
  spinStreakRewards: Record<number, number>;
  dailyLoginRewards: number[];
  depositPacks: { amount: number; bonus: number; icon: string; label: string; popular: boolean }[];
  levels: { n: number; exp: number }[];
  levelUnlocks: Record<number, string>;
  gambleMaxRounds: number;
  gambleAutoCashAtRounds: number;
  nearMissConsolation: number;
  tapComboThreshold: number;
  tapComboMaxBonus: number;
  tapComboFrenzyMaxBonus: number;
}

export const BALANCE: BalanceConfig = {
  startingBalance: 1000,
  startingJackpot: 5000,
  jackpotContributionRate: 0.02,
  bankruptcyProtectionAmount: 50,
  freeSpinsMultiplier: 2,
  freeSpinsBaseCount: 5,
  feverSpins: 10,
  feverMultiplier: 2,
  goldenHourMultiplier: 3,
  goldenHourSpins: 10,
  mysteryBoxChance: 0.05,
  spinStreakRewards: { 10: 50, 25: 100, 50: 250, 100: 500, 200: 1000 },
  dailyLoginRewards: [50, 75, 100, 150, 200, 300, 500],
  depositPacks: [
    { amount: 500, bonus: 0, icon: '🪙', label: '500', popular: false },
    { amount: 1000, bonus: 100, icon: '🪙', label: '1.000', popular: false },
    { amount: 2500, bonus: 500, icon: '💎', label: '2.500', popular: true },
    { amount: 5000, bonus: 1500, icon: '💎', label: '5.000', popular: false },
    { amount: 10000, bonus: 4000, icon: '👑', label: '10.000', popular: false },
    { amount: 25000, bonus: 15000, icon: '👑', label: '25.000', popular: false },
  ],
  levels: [
    { n: 1, exp: 0 },
    { n: 2, exp: 5000 },
    { n: 3, exp: 20000 },
    { n: 4, exp: 50000 },
    { n: 5, exp: 100000 },
  ],
  levelUnlocks: { 2: 'Apuesta máx 500', 3: '+1 línea extra', 4: 'Auto-spin', 5: 'Turbo mode' },
  gambleMaxRounds: 5,
  gambleAutoCashAtRounds: 5,
  nearMissConsolation: 5,
  tapComboThreshold: 5,
  tapComboMaxBonus: 0.15,
  tapComboFrenzyMaxBonus: 0.25,
};

export const BET_OPTIONS = [10, 50, 100, 500];
export const DEFAULT_BET = 50;

export const RARITY_LABELS: Record<string, string> = {
  common: 'COMMON',
  rare: 'RARE',
  epic: 'EPIC',
  legendary: 'LEGENDARY',
  mythic: 'MYTHIC',
};

export const RARITY_COLORS: Record<string, string> = {
  common: '#ffffff',
  rare: '#4fc3f7',
  epic: '#c084fc',
  legendary: '#ffd700',
  mythic: '#ff3366',
};

export const COLORS = {
  bg: '#0d0d1a',
  bgDeep: '#080814',
  surface: '#1a1a2e',
  surfaceLight: '#252542',
  reel: '#16213e',
  reelDark: '#0f1729',
  gold: '#ffd700',
  goldDark: '#b8860b',
  red: '#ff3366',
  green: '#00ff88',
  purple: '#7c3aed',
  purpleLight: '#a855f7',
  text: '#ffffff',
  muted: '#8888aa',
  cherry: '#ff1744',
  lemon: '#ffeb3b',
  watermelon: '#4caf50',
  strawberry: '#e91e63',
  cocktail: '#ff9800',
  neon: '#00e5ff',
  neonPink: '#ff00ff',
  neonGreen: '#39ff14',
  amber: '#ffb300',
  crimson: '#dc143c',
  royal: '#4169e1',
  darkBg: '#0a0a18',
  frameGold: '#c9a227',
  shadow: '#000000',
};
