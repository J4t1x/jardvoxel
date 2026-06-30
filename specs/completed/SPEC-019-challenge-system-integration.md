# SPEC-019: Challenge System Integration

## Objetivo
Conectar el sistema de retos diarios (ChallengeChecker) con el gameplay. Actualmente ChallengeChecker existe pero nunca se invoca: los retos no se generan, el progreso no se rastrea, y las recompensas no se reclaman.

## Estado Actual
- `ChallengeChecker.checkDaily()` existe pero NUNCA se llama
- `ChallengeChecker.checkCompletion()` existe pero NUNCA se llama
- `ChallengeChecker.getProgress()` existe pero NUNCA se llama
- `state.challenges` siempre es `[]` (vacío)
- `state.challengesDate` siempre es `null`
- InfoScene muestra "No hay retos activos" siempre
- `state.stats.challengesCompleted` siempre es 0

## Requisitos

### FR-1: Generación diaria de retos
- Al iniciar el juego (BootScene), generar 3 retos del pool si no existen para hoy
- Guardar en `state.challenges` y `state.challengesDate`

### FR-2: Tracking de progreso durante spins
- Después de cada spin, llamar `ChallengeChecker.checkCompletion()`
- Actualizar `state.challenges` con el resultado
- Persistir con `SaveManager.save()`

### FR-3: Reclamación de recompensas
- En InfoScene challenges tab, agregar botón "Reclamar" para retos completados y no reclamados
- Al reclamar: sumar recompensa al saldo, marcar `claimed: true`
- Incrementar `stats.challengesCompleted`

### FR-4: Actualización visual de progreso
- InfoScene debe mostrar progreso real usando `ChallengeChecker.getProgress()`
- Retos completados muestran check verde
- Retos reclamados muestran "Reclamado"

## Criterios de Aceptación
- [ ] BootScene genera 3 retos diarios si no existen
- [ ] SlotScene actualiza progreso de retos después de cada spin
- [ ] InfoScene muestra progreso real de cada reto
- [ ] InfoScene permite reclamar recompensas de retos completados
- [ ] `state.stats.challengesCompleted` se incrementa al reclamar
- [ ] Retos se reinician cada día (nueva fecha → nuevos retos)
- [ ] `npm run build` sin errores
- [ ] `npm run test` sin errores

## Archivos a Modificar
- `src/scenes/BootScene.ts` — generar retos diarios
- `src/scenes/SlotScene.ts` — tracking de progreso post-spin
- `src/scenes/InfoScene.ts` — UI de reclamación + progreso real

## Estimación
~2 horas
