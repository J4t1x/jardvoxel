export interface SymbolConfig {
  emoji: string;
  nombre: string;
  peso: number;
  mult: Record<number, number>;
  wild?: boolean;
  scatter?: boolean;
  bonus?: boolean;
}

export const SIMBOLOS: SymbolConfig[] = [
  { emoji: '🍒', nombre: 'cereza', peso: 25, mult: { 3: 2, 4: 5, 5: 10 } },
  { emoji: '🍑', nombre: 'durazno', peso: 20, mult: { 3: 2, 4: 8, 5: 20 } },
  { emoji: '🍋', nombre: 'limon', peso: 18, mult: { 3: 3, 4: 10, 5: 30 } },
  { emoji: '🍎', nombre: 'manzana', peso: 15, mult: { 3: 5, 4: 15, 5: 50 } },
  { emoji: '🍐', nombre: 'pera', peso: 10, mult: { 3: 10, 4: 25, 5: 100 } },
  { emoji: '🍉', nombre: 'sandia', peso: 7, mult: { 3: 20, 4: 50, 5: 200 } },
  { emoji: '🍹', nombre: 'wild', peso: 3, mult: { 3: 50, 4: 200, 5: 1000 }, wild: true },
  { emoji: '🌟', nombre: 'scatter', peso: 3, mult: { 3: 5, 4: 15, 5: 50 }, scatter: true },
  { emoji: '🍓', nombre: 'bonus', peso: 2, mult: {}, bonus: true },
];

export const BONUS_MULT: Record<string, number> = {
  '🍒': 2, '🍑': 5, '🍋': 10, '🍎': 20, '🍐': 30, '🍉': 50, EXIT: 0,
};

export const BONUS_SYMS = ['🍒', '🍑', '🍋', '🍎', '🍐', '🍉'];

export const REELS_COUNT = 5;
export const ROWS_COUNT = 3;
