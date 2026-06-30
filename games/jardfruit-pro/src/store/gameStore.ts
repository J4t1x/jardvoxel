import { create } from 'zustand';
import { createInitialState, type GameState } from '@systems/Economy';

interface GameStore extends GameState {
  set: (partial: Partial<GameState>) => void;
  reset: () => void;
  patch: (fn: (state: GameState) => GameState) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  ...createInitialState(),
  set: (partial) => set(partial as Partial<GameStore>),
  reset: () => set({ ...createInitialState() }),
  patch: (fn) => set((prev) => fn(prev as GameState) as Partial<GameStore>),
}));
