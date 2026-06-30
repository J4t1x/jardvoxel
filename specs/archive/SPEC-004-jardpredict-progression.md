# SPEC-004: JardPredict — Progresión (Niveles, Upgrades, Achievements)

## Descripción
Sistema de progresión para JardPredict: niveles de jugador, upgrades comprables, achievements desbloqueables, daily challenge y leaderboard local.

## Requisitos
- [ ] Sistema de niveles (expTotal acumulada por JardCoins ganados)
- [ ] Nivel 1: 0-500, Nivel 2: 500-2000, Nivel 3: 2000-5000, etc.
- [ ] Cada nivel desbloquea: mayores apuestas máximas, cosméticos básicos
- [ ] Level up: confeti + modal con premio + audio fanfare
- [ ] 7 Upgrades comprables:
  - Lucky Charm (200🪙): +5% prob critical hit
  - Multiplier Boost (500🪙): multiplicador base x1.5 → x2
  - Insurance Discount (300🪙): seguro cuesta 5% en vez de 10%
  - Streak Saver (800🪙): perder no rompe racha 1 vez por sesión
  - Auto-Collect (400🪙): 10% recuperación automática en pérdida
  - Max Bet Unlock (600🪙): apuesta máxima 500
  - Double Prediction (1000🪙): 2 apuestas simultáneas
- [ ] Tienda de upgrades accesible desde HUD (botón 🛒)
- [ ] 8 Achievements:
  - First Win, Hot Streak (5), On Fire (10), High Roller (500+),
  - Comeback (ganar después de 0), All In (all-in win), Perfect Day, Centurion (100 wins)
- [ ] Achievement popup: banner deslizable al desbloquear
- [ ] Daily Challenge: semilla diaria, 1 oportunidad, apuesta fija 100🪙, premio especial
- [ ] Leaderboard local: top 10 scores en localStorage
- [ ] Insurance mechanic: comprar seguro si racha ≥5 (10% apuesta, recupera 50% si pierde)
- [ ] Persistencia completa en localStorage (nivel, upgrades, achievements, daily, leaderboard)

## Criterios de Aceptación
- [ ] Niveles suben correctamente con exp acumulada
- [ ] Level up muestra confeti + modal + audio
- [ ] Todos los upgrades funcionan al comprarlos
- [ ] Upgrades persisten en localStorage
- [ ] Achievements se desbloquean correctamente
- [ ] Achievement popup aparece al desbloquear
- [ ] Daily challenge funciona con semilla diaria
- [ ] Leaderboard guarda y muestra top 10
- [ ] Insurance mechanic operativo
- [ ] Sin errores de consola
- [ ] Save/Load compatible con SPEC-003
