# SPEC-012: Progressive Jackpot & Prestige System

## Objetivo
Implementar el Jackpot Progresivo (acumula 2% de cada apuesta, se gana con 5 wilds en línea) y el sistema de Prestigio (reset por multiplicador permanente).

## Estado Actual
- `GameState` tiene `jackpotProgresivo`, `prestigio`, `prestigeMult` — **implementado y funcional**
- `PaylineChecker` detecta 5 wilds y retorna `jackpot: true`
- `Economy.deductBet()` contribuye 2% al jackpot progresivo
- `Economy.applyJackpot()` suma jackpot al saldo y resetea
- `Economy.canPrestige()` y `Economy.doPrestige()` implementados con stats tracking
- `prestigeMult` aplicado a todos los multiplicadores en `PaylineChecker.evalLine()`
- HUD muestra jackpot en tiempo real
- MenuScene tiene botón de prestigio + info + efectos visuales
- SlotScene tiene jackpot effects (screen shake, golden flash, confetti, zoom)
- SFX `jackpot` y `prestige` añadidos a AudioEngine

## Requisitos

### Jackpot Progresivo
- [x] Inicializar en `BALANCE.startingJackpot` (5000)
- [x] Cada apuesta contribuye `apuesta * jackpotContributionRate` (2%) al jackpot
- [x] Display en HUD: "💎 Jackpot: X" actualizado en tiempo real
- [x] Trigger: 5 wilds 🍹 en una línea = ganar jackpot completo
- [x] Al ganar: reset jackpot a 5000, sumar al saldo
- [x] Efectos visuales: jackpot zoom, confetti, flash dorado, screen shake
- [x] SFX jackpot (secuencia ascendente de 8 notas)
- [x] Vibración pattern: [50,30,50,30,50,30,100]
- [x] Screen shake
- [x] Achievement `jackpot` desbloqueado
- [x] `stats.jackpots` incrementado

### Prestigio
- [x] Requisito: Nivel 5 + 100,000 EXP
- [x] Función `canPrestige()` que verifica requisitos
- [x] Función `doPrestige()` que:
  - Incrementa `prestigio`
  - Calcula `prestigeMult = 1 + prestigio * 0.5`
  - Resetea: saldo=1000, nivel=1, expTotal=0, upgrades={}, achievements=[]
  - Resetea: spinStreak=0, winStreak=0, jackpotProgresivo=5000
  - Incrementa `stats.prestiges`
  - Guarda estado
- [x] Efectos visuales: confetti, flash púrpura, banner animado
- [x] SFX prestige + vibración pattern largo
- [x] Banner: "⭐ PRESTIGIO N! xM permanente ⭐"
- [x] Achievement `prestige` desbloqueado
- [x] `stats.prestiges` incrementado
- [x] `prestigeMult` aplicado a todos los multiplicadores en `PaylineChecker`

### UI
- [x] Jackpot display en HUD top
- [x] Botón de prestigio en MenuScene (cuando `canPrestige()`)
- [x] Info de prestigio actual en MenuScene

## Criterios de Aceptación
- [x] Jackpot acumula 2% de cada apuesta
- [x] Jackpot se reinicia al ganarse
- [x] 5 wilds en línea = jackpot win
- [x] Prestigio requiere Nivel 5 + 100k EXP
- [x] Prestigio resetea progreso y da multiplicador permanente
- [x] Multiplicador de prestigio aplicado a todos los premios
- [x] Efectos visuales y audio funcionales
- [x] Stats y achievements registrados
- [x] Build sin errores

## Archivos a Modificar
- `src/systems/PaylineChecker.ts` — aplicar `prestigeMult`, detectar jackpot
- `src/systems/Economy.ts` — `winProgressiveJackpot()`, `canPrestige()`, `doPrestige()`
- `src/scenes/SlotScene.ts` — jackpot trigger, HUD update, prestige UI
- `src/config/balance.ts` — ya tiene constantes necesarias

## Estimación
~3 horas
