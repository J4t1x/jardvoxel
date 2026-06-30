# SPEC-011: Free Spins & Scatter System

## Objetivo
Implementar el sistema de Free Spins (giros gratis) con multiplicador x2, activado por 3+ scatters 🌟 o 3+ wilds 🍹 en el slot jardfruit-pro.

## Estado Actual
- `GameState` en `Economy.ts` tiene campos `freeSpins`, `freeSpinsMult` — **implementado y funcional**
- `PaylineChecker` detecta scatters y wilds, retorna `freeSpinsTriggered`, `scatterWin`, `scatters`, `wildCount`
- `SlotScene` tiene lógica completa de free spins con trigger visuals
- Banner visual de free spins con animación de entrada
- Highlight de scatters con pulse animation
- Stats tracking: `scatterTriggered`, `freeSpinsWon`
- SFX `freeSpins` añadido a AudioEngine

## Requisitos

### Trigger Logic
- [x] 3+ scatters 🌟 activan free spins: `5 + scattersCount` giros gratis
- [x] 3+ wilds 🍹 (sin scatters) activan free spins: 5 giros gratis
- [x] Multiplicador x2 aplicado a todos los premios durante free spins
- [x] Free spins no descuentan saldo del jugador
- [x] Free spins pueden re-trigger dentro de free spins (acumulativos)

### PaylineChecker
- [x] Retornar `scatterWin` (premio del scatter) además de `freeSpinsTriggered`
- [x] Contar scatters y wilds en el grid completo (no solo paylines)
- [x] Scatter paga en cualquier posición (no necesita línea)

### SlotScene
- [x] Detectar `freeSpinsTriggered` del resultado de `evaluate()`
- [x] Llamar `triggerFreeSpinsVisuals(scatters, wildCount)` que:
  - Suma giros a `gameState.freeSpins` via `Economy.triggerFreeSpins()`
  - Muestra banner animado "🎰 FREE SPINS: N (x2)"
  - Reproduce SFX de freeSpins
  - Flash púrpura
- [x] Antes de cada spin, verificar `freeSpins > 0`:
  - Decrementar `freeSpins`
  - No descontar saldo
  - Actualizar banner
- [x] Auto-spin encadenado: después de free spin, si quedan, auto-ejecutar el siguiente
- [x] Free spins trigger también en spins sin línea ganadora (bug fix)

### UI: Free Spins Banner
- [x] Banner fijo en pantalla durante free spins
- [x] Muestra: "🎰 FREE SPINS: N (x2)"
- [x] Animación de entrada (scale 0→1 con Back.easeOut)
- [x] Visible solo cuando `freeSpins > 0`

### Scatter Highlight
- [x] Highlight visual en símbolos scatter del grid
- [x] Pulse animation (scale 1.4 yoyo x4)
- [x] Duración: ~2.4s después del spin

### Stats
- [x] `stats.scatterTriggered` incrementado al activar
- [x] `stats.freeSpinsWon` incrementado con la cantidad ganada
- [x] Achievement `scatterKing` desbloqueado al primer trigger
- [x] Achievement `freeSpinMaster` desbloqueado a 50 free spins ganados

## Criterios de Aceptación
- [x] 3+ scatters activan free spins correctamente
- [x] 3+ wilds activan free spins correctamente
- [x] Multiplicador x2 aplicado durante free spins
- [x] Free spins no descuentan saldo
- [x] Banner visible con contador correcto
- [x] Auto-encadenado de free spins funcional
- [x] Scatter highlight visual operativo
- [x] Stats y achievements registrados
- [x] Build sin errores
- [x] Tipos TypeScript correctos

## Archivos a Modificar
- `src/systems/PaylineChecker.ts` — scatter/win counting, freeSpinsTriggered
- `src/scenes/SlotScene.ts` — trigger logic, free spin flow, banner
- `src/systems/Economy.ts` — helper functions si necesarias
- `src/config/balance.ts` — ya tiene `freeSpinsMultiplier` y `freeSpinsBaseCount`

## Estimación
~3 horas
