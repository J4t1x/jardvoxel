export interface AchievementConfig {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  premio: number;
}

export const ACHIEVEMENTS_DATA: AchievementConfig[] = [
  { id: 'firstSpin', emoji: '🎰', name: 'First Spin', desc: 'Primer giro', premio: 10 },
  { id: 'firstWin', emoji: '🎉', name: 'First Win', desc: 'Primer premio', premio: 50 },
  { id: 'cherryPicker', emoji: '🍒', name: 'Cherry Picker', desc: '3 cerezas en línea', premio: 100 },
  { id: 'wildOne', emoji: '🍹', name: 'Wild One', desc: 'Wild en combinación ganadora', premio: 100 },
  { id: 'bonusHunter', emoji: '🍓', name: 'Bonus Hunter', desc: 'Activar ronda de bonos', premio: 200 },
  { id: 'bonusMaster', emoji: '🏆', name: 'Bonus Master', desc: 'Ganar 1000+ en bono', premio: 500 },
  { id: 'gambler', emoji: '🃏', name: 'Gambler', desc: 'Usar doble o nada 10 veces', premio: 200 },
  { id: 'doubleDown', emoji: '⚡', name: 'Double Down', desc: 'Ganar 5 rondas de riesgo seguidas', premio: 500 },
  { id: 'highRoller', emoji: '💰', name: 'High Roller', desc: 'Apostar 500+ en un giro', premio: 300 },
  { id: 'allIn', emoji: '🤑', name: 'All In', desc: 'Hacer ALL IN y ganar', premio: 1000 },
  { id: 'fruitMaster', emoji: '👑', name: 'Fruit Master', desc: '100 giros ganados', premio: 1000 },
  { id: 'jackpot', emoji: '💎', name: 'Jackpot', desc: '5 🍹 en una línea', premio: 5000 },
  { id: 'scatterKing', emoji: '🌟', name: 'Scatter King', desc: 'Activar 3+ scatters', premio: 300 },
  { id: 'freeSpinMaster', emoji: '🎰', name: 'Free Spin Master', desc: 'Ganar 50 free spins', premio: 800 },
  { id: 'prestige', emoji: '⭐', name: 'Prestigio', desc: 'Hacer prestigio por primera vez', premio: 2000 },
  { id: 'challengeMaster', emoji: '🎯', name: 'Challenge Master', desc: 'Completar 10 retos diarios', premio: 1000 },
];
