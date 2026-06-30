# SPEC-003: JardPredict — Prediction Clicker MVP

## Descripción
Juego prediction clicker donde el jugador predice si la próxima vela de un gráfico será verde (↑) o roja (↓), apuesta JardCoins virtuales, y acumula rachas con multiplicadores crecientes. MVP con modo Classic (Crypto Pulse).

## Requisitos
- [ ] Single-file HTML en `games/jardpredict.html`
- [ ] Gráfico de velas procedural (últimas 5 velas visibles, nueva vela se anima en 2-3s)
- [ ] Sistema de apuestas: 3 botones rápidos (🪙10 / 🪙50 / 🪙100) + All-in
- [ ] Predicción: botones ↑ (verde) y ↓ (rojo)
- [ ] Saldo inicial: 100 JardCoins, guardado en localStorage
- [ ] Multiplicador por racha: x1.5 (1-2), x2 (3-4), x3 (5-6), x5 (7-9), x10 (10+)
- [ ] Bankruptcy protection: saldo 0 → +10 JardCoins gratis
- [ ] HUD: saldo (top-left), nivel/racha (top-center), sonido toggle (top-right)
- [ ] Streak bar en top border
- [ ] Botones de apuesta + ↑/↓ + multiplicador en bottom border
- [ ] Centro libre para gráfico de velas
- [ ] Fondo: gradient animado + aurora blobs + estrellas
- [ ] Glassmorphism en HUD con backdrop-filter
- [ ] Partículas en acierto (explosión radial verde/dorada)
- [ ] Screen shake en racha alta (≥5)
- [ ] Score flotante "+150 🪙" que asciende y desvanece
- [ ] Combo display "🔥 STREAK x5!" en bottom-center
- [ ] Flash verde en acierto, flash rojo en error
- [ ] Audio Web API: playWin, playLoss, playStreak, playBet, playCoin
- [ ] Haptics: acierto 30ms, error [50,30,50], racha 5 [30,20,30,20,50], racha 10 [50,30,50,30,80]
- [ ] Pantalla de game over + restart
- [ ] Paleta: --color-up #00ff88, --color-down #ff3366, --color-gold #ffd700, --color-accent #7c3aed

## Criterios de Aceptación
- [ ] Juego funciona al abrir el .html
- [ ] Mobile-first responsive
- [ ] 60fps en animación de velas
- [ ] Sistema de apuestas funcional (10/50/100/All-in)
- [ ] Predicción ↑/↓ resuelve correctamente
- [ ] Multiplicador por racha escala correctamente
- [ ] Saldo persiste en localStorage
- [ ] HUD distribuido sin superposiciones
- [ ] Audio funcional (win/loss/bet/coin/streak)
- [ ] Vibración funcional (mobile)
- [ ] Bankruptcy protection operativo
- [ ] Sin dependencias externas
