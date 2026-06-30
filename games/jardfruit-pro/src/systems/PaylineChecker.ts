import { LINEAS, LINEA_EXTRA, type PaylinePosition } from '@config/paylines';
import { SIMBOLOS, type SymbolConfig } from '@config/symbols';

export interface LineResult {
  lineaIndex: number;
  linea: PaylinePosition[];
  simbolo: SymbolConfig;
  cantidad: number;
  direccion: 'ltr' | 'rtl';
  mult: number;
  premio: number;
}

export interface SpinResult {
  resultados: LineResult[];
  premioTotal: number;
  tieneWild: boolean;
  tieneCerezas: boolean;
  jackpot: boolean;
  fresasCount: number;
  scatters: number;
  scatterWin: number;
  freeSpinsTriggered: boolean;
  wildCount: number;
}

export interface MultiplierParams {
  multiplierBoost: boolean;
  doubleWild: boolean;
  fruitFever: boolean;
  goldenHourMult: number;
  freeSpins: number;
  freeSpinsMult: number;
  prestigeMult: number;
  tapCombo: number;
  tapFrenzy: boolean;
}

export class PaylineChecker {
  static getActiveLines(extraLine: boolean): PaylinePosition[][] {
    return extraLine ? [...LINEAS, LINEA_EXTRA] : LINEAS;
  }

  static evalLine(
    sims: SymbolConfig[],
    dir: 'ltr' | 'rtl',
    params: MultiplierParams,
  ): { simbolo: SymbolConfig; cantidad: number; direccion: 'ltr' | 'rtl'; mult: number; wildUsed: boolean } | null {
    const ord = dir === 'ltr' ? [0, 1, 2, 3, 4] : [4, 3, 2, 1, 0];
    let consec = 1;
    let first = sims[ord[0]];
    if (first.bonus || first.scatter) return null;
    let wildUsed = !!first.wild;

    for (let i = 1; i < 5; i++) {
      const cur = sims[ord[i]];
      if (cur.bonus || cur.scatter) break;
      if (cur.nombre === first.nombre || cur.wild || first.wild) {
        consec++;
        if (cur.wild) wildUsed = true;
        if (first.wild && !cur.wild) first = cur;
      } else break;
    }

    if (consec >= 3) {
      let m = first.mult[consec] ?? 0;
      if (params.multiplierBoost) m = Math.floor(m * 1.2);
      if (params.doubleWild && wildUsed) m *= 2;
      if (params.fruitFever) m *= 2;
      if (params.goldenHourMult > 0) m *= params.goldenHourMult;
      if (params.freeSpins > 0) m *= params.freeSpinsMult;
      m = Math.floor(m * params.prestigeMult);
      return { simbolo: first, cantidad: consec, direccion: dir, mult: m, wildUsed };
    }
    return null;
  }

  static evaluate(
    carretes: SymbolConfig[][],
    apuesta: number,
    extraLine: boolean,
    params: MultiplierParams,
  ): SpinResult {
    const lineas = this.getActiveLines(extraLine);
    const resultados: LineResult[] = [];
    let premioTotal = 0;
    let tieneWild = false;
    let tieneCerezas = false;
    let jackpot = false;

    for (let i = 0; i < lineas.length; i++) {
      const sims = lineas[i].map(([r, f]) => carretes[r][f]);
      for (const dir of ['ltr', 'rtl'] as const) {
        const res = this.evalLine(sims, dir, params);
        if (res) {
          const premio = apuesta * res.mult;
          premioTotal += premio;
          resultados.push({ lineaIndex: i, linea: lineas[i], ...res, premio });
          if (res.simbolo.wild || res.wildUsed) tieneWild = true;
          if (res.simbolo.nombre === 'cereza' && res.cantidad >= 3) tieneCerezas = true;
          if (res.simbolo.wild && res.cantidad >= 5) jackpot = true;
        }
      }
    }

    if (premioTotal > 0 && params.tapCombo > 5) {
      let pct = 0;
      const max = params.tapFrenzy ? 0.25 : 0.15;
      if (params.tapCombo <= 10) pct = 0.05;
      else if (params.tapCombo <= 20) pct = 0.1;
      else pct = max;
      premioTotal = Math.floor(premioTotal * (1 + pct));
    }

    let fresas = 0;
    let scatters = 0;
    let wildCount = 0;
    for (let r = 0; r < 5; r++) {
      for (let f = 0; f < 3; f++) {
        if (carretes[r][f].bonus) fresas++;
        if (carretes[r][f].scatter) scatters++;
        if (carretes[r][f].wild) wildCount++;
      }
    }

    let scatterWin = 0;
    let freeSpinsTriggered = false;
    if (scatters >= 3) {
      const sm = SIMBOLOS.find((s) => s.scatter)!;
      scatterWin = apuesta * (sm.mult[scatters] ?? sm.mult[3]);
      freeSpinsTriggered = true;
    }
    if (wildCount >= 3 && !freeSpinsTriggered) {
      freeSpinsTriggered = true;
    }

    return {
      resultados,
      premioTotal,
      tieneWild,
      tieneCerezas,
      jackpot,
      fresasCount: fresas,
      scatters,
      scatterWin,
      freeSpinsTriggered,
      wildCount,
    };
  }

  static detectNearMiss(
    carretes: SymbolConfig[][],
    extraLine: boolean,
  ): { simbolo: SymbolConfig; cantidad: number; linea: PaylinePosition[]; posicion: number } | null {
    const lineas = this.getActiveLines(extraLine);
    for (const linea of lineas) {
      const sims = linea.map(([r, f]) => carretes[r][f]);
      for (const dir of ['ltr', 'rtl'] as const) {
        const ord = dir === 'ltr' ? [0, 1, 2, 3, 4] : [4, 3, 2, 1, 0];
        let consec = 1;
        let first = sims[ord[0]];
        if (first.bonus || first.scatter) continue;
        for (let i = 1; i < 5; i++) {
          const cur = sims[ord[i]];
          if (cur.bonus || cur.scatter) break;
          if (cur.nombre === first.nombre || cur.wild || first.wild) {
            consec++;
            if (first.wild && !cur.wild) first = cur;
          } else break;
        }
        if (consec === 4) return { simbolo: first, cantidad: 4, linea, posicion: ord[4] };
      }
    }
    return null;
  }

  static checkAnticipation(carretes: SymbolConfig[][]): boolean {
    for (let fila = 0; fila < 3; fila++) {
      const syms = [carretes[0][fila], carretes[1][fila], carretes[2][fila], carretes[3][fila]];
      const counts: Record<string, number> = {};
      for (const s of syms) counts[s.nombre] = (counts[s.nombre] ?? 0) + 1;
      for (const n in counts) if (counts[n] >= 3) return true;
    }
    return false;
  }
}
