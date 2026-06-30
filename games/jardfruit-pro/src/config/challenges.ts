export interface ChallengeConfig {
  id: string;
  name: string;
  desc: string;
  icon: string;
  reward: number;
  target: number;
  type: string;
}

export const CHALLENGES_POOL: ChallengeConfig[] = [
  { id: 'win3', name: 'Racha ganadora', desc: 'Gana 3 giros seguidos', icon: '🔥', reward: 100, target: 3, type: 'winStreak' },
  { id: 'bonus1', name: 'Cazador de bonos', desc: 'Activa la ronda de bonos', icon: '🍓', reward: 150, target: 1, type: 'bonus' },
  { id: 'catch10', name: 'Recolector', desc: 'Atrapa 10 frutas flotantes', icon: '🍎', reward: 100, target: 10, type: 'catch' },
  { id: 'spin20', name: 'Girador', desc: 'Da 20 giros en total', icon: '🎰', reward: 120, target: 20, type: 'spins' },
  { id: 'bigwin1', name: 'Gran premio', desc: 'Gana 10x tu apuesta', icon: '🎉', reward: 200, target: 1, type: 'bigwin' },
  { id: 'gamble2', name: 'Apostador', desc: 'Usa doble o nada 2 veces', icon: '🃏', reward: 100, target: 2, type: 'gamble' },
  { id: 'jackpot1', name: 'Jackpoteador', desc: 'Consigue un jackpot', icon: '💎', reward: 500, target: 1, type: 'jackpot' },
  { id: 'scatter3', name: 'Estelar', desc: 'Consigue 3 scatters 🌟', icon: '🌟', reward: 250, target: 1, type: 'scatter' },
  { id: 'level2', name: 'Subida de nivel', desc: 'Alcanza el nivel 2', icon: '📈', reward: 150, target: 2, type: 'level' },
  { id: 'freespin5', name: 'Tiradas gratis', desc: 'Gana 5 free spins', icon: '🎰', reward: 200, target: 5, type: 'freespins' },
];
