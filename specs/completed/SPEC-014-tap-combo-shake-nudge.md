# SPEC-014: Tap Combo & Shake Nudge Systems

## Objetivo
Implementar el sistema de Tap Combo (taps durante spin aumentan bonus de premio) y Shake Nudge (5 taps después de near miss para nudge gratuito).

## Estado Actual
- `TapCombo.ts` implementado: contador visual, partículas, mega combo display, auto-decay
- `ShakeNudge.ts` implementado: detección de 5 taps, nudge gratuito, toast, counter, flash verde
- `SlotScene.ts` integrado: tap combo durante spin, shake nudge tras near miss, reset en spin start
- `PaylineChecker` ya aplica tap combo bonus al premio (6-10: +5%, 11-20: +10%, 21+: +15%/+25%)
- `ReelEngine.nudgeReel()` funcional para shake nudge
- `PaylineChecker.detectNearMiss()` expuesto para activar shake nudge

## Requisitos

### Tap Combo
- [x] Detectar taps/clicks durante spin (cuando `girando === true`)
- [x] Incrementar `tapCombo` en cada tap
- [x] UI: contador flotante "🫳 xN" en posición de tap
- [x] Partículas en posición de tap (cantidad = min(tapCombo, 15))
- [x] Mega combo display a 10x, 20x, 50x taps
- [x] Bonus aplicado al premio si `tapCombo > 5`:
  - 6-10 taps: +5%
  - 11-20 taps: +10%
  - 21+ taps: +15% (o +25% con upgrade `tapFrenzy`)
- [x] Reset `tapCombo` a 0 al inicio de cada spin
- [x] Auto-decay del contador visual a los 500ms sin tap

### Shake Nudge
- [x] Activar después de un near miss (4/5 en línea)
- [x] Toast: "¡Casi! Toca 5x para nudge"
- [x] Ventana de 3 segundos para hacer 5 taps
- [x] Excluir taps en toast
- [x] Al completar 5 taps: nudge gratuito en reel aleatorio
- [x] Nudge genera nuevo símbolo en posición superior del reel
- [x] Re-render del reel después de nudge
- [x] Solo 1 shake nudge por spin
- [x] SFX nudge + vibración + flash verde

### Nudge Normal (ya parcialmente implementado)
- [x] Verificar que nudge durante spin funcione correctamente
- [x] 1 nudge por spin (2 con upgrade `nudgePro`)
- [x] Click en reel individual para nudge
- [x] SFX + vibración + partículas + shake del reel

## Criterios de Aceptación
- [x] Tap combo incrementa al tocar durante spin
- [x] Contador visual "🫳 xN" visible
- [x] Partículas en posición de tap
- [x] Mega combo display a 10/20/50 taps
- [x] Bonus de tap combo aplicado al premio correctamente
- [x] Upgrade tapFrenzy aumenta bonus máx a 25%
- [x] Shake nudge activa después de near miss
- [x] 5 taps en 3s = nudge gratuito
- [x] Nudge re-renderiza reel
- [x] Build sin errores

## Archivos a Crear
- `src/systems/TapCombo.ts` — lógica de combo, bonus calculation
- `src/systems/ShakeNudge.ts` — lógica de detección de 5 taps, nudge execution

## Archivos a Modificar
- `src/scenes/SlotScene.ts` — integrar tap combo y shake nudge
- `src/systems/ReelEngine.ts` — verificar nudgeReel funciona correctamente
- `src/systems/PaylineChecker.ts` — exponer near miss detection
- `src/config/balance.ts` — ya tiene `tapComboThreshold`, `tapComboMaxBonus`, `tapComboFrenzyMaxBonus`

## Estimación
~3 horas
