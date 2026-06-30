# SPEC-005: JardPredict — Modos de Juego Adicionales

## Descripción
Agregar 4 modos de juego adicionales a JardPredict: Color Rush, Number Up/Down, Rush Mode (60s), y Survival Mode. Duel Mode vs IA opcional.

## Requisitos
- [ ] Selector de modo en pantalla de inicio
- [ ] **Color Rush**: Ruleta con sectores de colores, bolita con física rebota, predecir zona roja o azul
- [ ] **Number Up/Down**: Número grande estilo slot machine, predecir mayor/menor, rango amplía con nivel
- [ ] **Rush Mode**: 60 segundos, apuesta mínima 50, multiplicadores x2 en todo, maximizar JardCoins
- [ ] **Survival Mode**: 100 JardCoins iniciales, sin free money, apuesta mínima sube cada 5 rondas
- [ ] **Duel Mode (vs IA)**: IA hace predicciones simultáneas, 10 rondas, entrada 200🪙, premio 400🪙
  - IA con personalidad: conservadora, agresiva, caótica
- [ ] Cada modo mantiene core mechanics (apuesta, racha, multiplicador, audio, haptics)
- [ ] HUD se adapta a cada modo (timer en Rush, ronda counter en Duel, etc.)
- [ ] Game over específico por modo
- [ ] High score separado por modo en localStorage

## Criterios de Aceptación
- [ ] Selector de modo funcional
- [ ] Color Rush: bolita con física, sectores, predicción correcta
- [ ] Number Up/Down: slot machine animation, mayor/menor funcional
- [ ] Rush Mode: timer de 60s, multiplicadores x2, game over al acabar
- [ ] Survival Mode: sin free money, apuesta mínima escala cada 5 rondas
- [ ] Duel Mode: IA predice, 10 rondas, resultado correcto
- [ ] High scores separados por modo
- [ ] Sin errores de consola
- [ ] 60fps en todos los modos
- [ ] Mobile-first en todos los modos
