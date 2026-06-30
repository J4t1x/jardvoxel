export type PaylinePosition = [number, number];

export const LINEAS: PaylinePosition[][] = [
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
  [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]],
  [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]],
  [[0, 0], [1, 1], [2, 2], [3, 1], [4, 0]],
  [[0, 2], [1, 1], [2, 0], [3, 1], [4, 2]],
];

export const LINEA_EXTRA: PaylinePosition[] = [[0, 0], [1, 1], [2, 1], [3, 1], [4, 0]];

export const GUIDE_LINE_COLORS = ['line-h', 'line-h', 'line-h', 'line-d', 'line-d'];
