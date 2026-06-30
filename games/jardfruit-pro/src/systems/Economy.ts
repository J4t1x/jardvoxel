import { BALANCE } from '@config/balance';

export const CURRENT_SAVE_VERSION = 1;

export interface GameState {
  saldo: number;
  nivel: number;
  expTotal: number;
  apuestaActual: number;
  modoJuego: 'classic' | 'turbo';
  autoSpin: boolean;
  turboMode: boolean;
  enBono: boolean;
  enGamble: boolean;
  bonoIntentos: number;
  bonoPremios: number;
  gambleRondas: number;
  gamblePremioAcumulado: number;
  girando: boolean;
  tapCombo: number;
  spinStreak: number;
  winStreak: number;
  fruitFever: boolean;
  feverGiros: number;
  goldenHourMult: number;
  mysteryBoxPendiente: boolean;
  loginStreak: number;
  ultimoLogin: string | null;
  jackpotProgresivo: number;
  freeSpins: number;
  freeSpinsMult: number;
  prestigio: number;
  prestigeMult: number;
  challenges: any[];
  challengesDate: string | null;
  tutorialVisto: boolean;
  volume: number;
  upgrades: Record<string, boolean>;
  achievements: string[];
  freeMoney: boolean;
  stats: {
    totalSpins: number;
    totalWins: number;
    totalBet: number;
    totalWon: number;
    biggestWin: number;
    bonosTriggered: number;
    gambleWins: number;
    gambleLosses: number;
    bestStreak: number;
    jackpots: number;
    fruitsCaught: number;
    scatterTriggered: number;
    freeSpinsWon: number;
    prestiges: number;
    totalDeposited: number;
    challengesCompleted: number;
  };
  highScore: number;
  showGuides: boolean;
  saveVersion: number;
}

export function createInitialState(): GameState {
  return {
    saldo: BALANCE.startingBalance,
    nivel: 1,
    expTotal: 0,
    apuestaActual: 50,
    modoJuego: 'classic',
    autoSpin: false,
    turboMode: false,
    enBono: false,
    enGamble: false,
    bonoIntentos: 0,
    bonoPremios: 0,
    gambleRondas: 0,
    gamblePremioAcumulado: 0,
    girando: false,
    tapCombo: 0,
    spinStreak: 0,
    winStreak: 0,
    fruitFever: false,
    feverGiros: 0,
    goldenHourMult: 0,
    mysteryBoxPendiente: false,
    loginStreak: 0,
    ultimoLogin: null,
    jackpotProgresivo: BALANCE.startingJackpot,
    freeSpins: 0,
    freeSpinsMult: BALANCE.freeSpinsMultiplier,
    prestigio: 0,
    prestigeMult: 1,
    challenges: [],
    challengesDate: null,
    tutorialVisto: false,
    volume: 70,
    upgrades: {},
    achievements: [],
    freeMoney: false,
    stats: {
      totalSpins: 0,
      totalWins: 0,
      totalBet: 0,
      totalWon: 0,
      biggestWin: 0,
      bonosTriggered: 0,
      gambleWins: 0,
      gambleLosses: 0,
      bestStreak: 0,
      jackpots: 0,
      fruitsCaught: 0,
      scatterTriggered: 0,
      freeSpinsWon: 0,
      prestiges: 0,
      totalDeposited: 0,
      challengesCompleted: 0,
    },
    highScore: 0,
    showGuides: true,
    saveVersion: CURRENT_SAVE_VERSION,
  };
}

export class Economy {
  static canPrestige(state: GameState): boolean {
    return state.nivel >= 5 && state.expTotal >= 100000;
  }

  static doPrestige(state: GameState): GameState {
    if (!this.canPrestige(state)) return state;
    return {
      ...state,
      prestigio: state.prestigio + 1,
      prestigeMult: 1 + (state.prestigio + 1) * 0.5,
      saldo: BALANCE.startingBalance,
      nivel: 1,
      expTotal: 0,
      upgrades: {},
      achievements: [],
      spinStreak: 0,
      winStreak: 0,
      jackpotProgresivo: BALANCE.startingJackpot,
      stats: {
        ...state.stats,
        prestiges: state.stats.prestiges + 1,
      },
    };
  }

  static getLevel(exp: number): number {
    let n = 1;
    for (const nv of BALANCE.levels) if (exp >= nv.exp) n = nv.n;
    return n;
  }

  static getRTP(state: GameState): number {
    if (state.stats.totalBet === 0) return 0;
    return Math.round((state.stats.totalWon / state.stats.totalBet) * 100);
  }

  static checkSpinStreakReward(spinStreak: number): number {
    return BALANCE.spinStreakRewards[spinStreak] ?? 0;
  }

  static applyBet(state: GameState, bet: number): GameState {
    if (bet > state.saldo) return state;
    return {
      ...state,
      apuestaActual: bet,
    };
  }

  static deductBet(state: GameState, isFreeSpin: boolean): GameState {
    if (isFreeSpin) return state;
    return {
      ...state,
      saldo: state.saldo - state.apuestaActual,
      stats: {
        ...state.stats,
        totalBet: state.stats.totalBet + state.apuestaActual,
      },
      jackpotProgresivo:
        state.jackpotProgresivo + Math.floor(state.apuestaActual * BALANCE.jackpotContributionRate),
    };
  }

  static applyWin(state: GameState, premio: number): GameState {
    const newWinStreak = state.winStreak + 1;
    return {
      ...state,
      saldo: state.saldo + premio,
      winStreak: newWinStreak,
      expTotal: state.expTotal + premio,
      highScore: Math.max(state.highScore, premio),
      stats: {
        ...state.stats,
        totalWon: state.stats.totalWon + premio,
        totalWins: state.stats.totalWins + 1,
        biggestWin: Math.max(state.stats.biggestWin, premio),
        bestStreak: Math.max(state.stats.bestStreak, newWinStreak),
      },
    };
  }

  static applyLoss(state: GameState): GameState {
    return { ...state, winStreak: 0 };
  }

  static applyJackpot(state: GameState): GameState {
    const win = state.jackpotProgresivo;
    return {
      ...state,
      saldo: state.saldo + win,
      jackpotProgresivo: BALANCE.startingJackpot,
      stats: { ...state.stats, jackpots: state.stats.jackpots + 1 },
    };
  }

  static triggerFreeSpins(state: GameState, spins: number, isScatter: boolean): GameState {
    return {
      ...state,
      freeSpins: state.freeSpins + spins,
      stats: {
        ...state.stats,
        freeSpinsWon: state.stats.freeSpinsWon + spins,
        ...(isScatter ? { scatterTriggered: state.stats.scatterTriggered + 1 } : {}),
      },
    };
  }

  static buyUpgrade(state: GameState, key: string, costo: number): GameState {
    if (state.saldo < costo) return state;
    return {
      ...state,
      saldo: state.saldo - costo,
      upgrades: { ...state.upgrades, [key]: true },
    };
  }

  static deposit(state: GameState, total: number): GameState {
    return {
      ...state,
      saldo: state.saldo + total,
      stats: {
        ...state.stats,
        totalDeposited: (state.stats.totalDeposited ?? 0) + total,
      },
    };
  }
}
