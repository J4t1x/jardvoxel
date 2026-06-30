# SPEC-009: JardFruit Cocktail v2 — Verificación y PWA Offline

## Descripción
Verificar que las 15 mejoras de SPEC-002 están implementadas y agregar Service Worker para PWA offline real.

## Requisitos
- [x] Free Spins — implementado (freespins-banner, freeSpins state)
- [x] Jackpot Progresivo — implementado (jackpotProgresivo state)
- [x] Scatter Symbol — implementado (🌟 scatter, scatterTriggered)
- [x] Daily Challenges — implementado (challenges-screen, CHALLENGES array)
- [x] Prestigio — implementado (prestigio, prestigeMult, prestige-btn)
- [x] Achievement Popup — implementado (ach-popup)
- [x] Level Progress Bar — implementado (level-bar, level-bar-fill)
- [x] Volume Control — implementado (volume-slider, volume state)
- [x] Tutorial First-time — implementado (tutorial-overlay, tutorialVisto)
- [x] RTP visible — implementado (getRTP() en stats screen)
- [x] Animated Saldo — implementado (animateSaldo function, saldo-pulse)
- [x] Reel Micro-glow — implementado (.reel-symbol.potential)
- [x] Particle Pooling — implementado (PARTICLE_POOL, MAX_PARTICLES=200)
- [x] PWA Offline — Service Worker inline agregado
- [x] Keyboard Support — implementado (keyboard-hint, keydown handlers)

## Criterios de Aceptación
- [x] Las 15 features de SPEC-002 verificadas en código
- [x] Service Worker registrado para offline mode
- [x] Sin errores de consola
