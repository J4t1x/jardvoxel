export interface UpgradeConfig {
  key: string;
  name: string;
  desc: string;
  costo: number;
  icon: string;
}

export const UPGRADES_DATA: UpgradeConfig[] = [
  { key: 'luckyStraw', name: 'Lucky Straw', desc: '+5% chance de fresa bonus', costo: 500, icon: '🍓' },
  { key: 'multiplierBoost', name: 'Multiplier Boost', desc: 'Multiplicadores base +20%', costo: 1000, icon: '⚡' },
  { key: 'insurance', name: 'Insurance', desc: 'Doble o nada: empate = recuperar', costo: 800, icon: '🛡️' },
  { key: 'streakSaver', name: 'Streak Saver', desc: 'Primer loss del bono no cuenta', costo: 1500, icon: '💝' },
  { key: 'autoSpin', name: 'Auto-Spin x10', desc: '10 giros automáticos', costo: 2000, icon: '🔄' },
  { key: 'turboMode', name: 'Turbo Mode', desc: 'Giros 2x más rápidos', costo: 3000, icon: '💨' },
  { key: 'extraLine', name: 'Extra Line', desc: 'Desbloquea línea 6 (zigzag)', costo: 5000, icon: '📐' },
  { key: 'doubleWild', name: 'Double Wild', desc: 'Wild cuenta como x2', costo: 8000, icon: '🍹' },
  { key: 'goldenTouch', name: 'Golden Touch', desc: 'Frutas flotantes valen x2', costo: 600, icon: '✨' },
  { key: 'fruitMagnet', name: 'Fruit Magnet', desc: 'Frutas flotantes se acercan', costo: 1200, icon: '🧲' },
  { key: 'catchMaster', name: 'Catch Master', desc: 'Fruit Catcher da x3', costo: 800, icon: '🎯' },
  { key: 'nudgePro', name: 'Nudge Pro', desc: '2 nudges por giro', costo: 2000, icon: '👆' },
  { key: 'tapFrenzy', name: 'Tap Frenzy', desc: 'Tap combo bonus máx +25%', costo: 1500, icon: '🔥' },
  { key: 'autoCatcher', name: 'Auto-Catcher', desc: 'Atrapa frutas automáticamente', costo: 3000, icon: '🤖' },
  { key: 'fruitSprinkler', name: 'Fruit Sprinkler', desc: '5 frutas flotantes vs 3', costo: 2500, icon: '🌈' },
];

export type UpgradeKey = typeof UPGRADES_DATA[number]['key'];
