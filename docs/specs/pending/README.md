# Specs Pendientes — JardVoxel Zen: Performance + Ghibli

## Estado: SPEC-116 a SPEC-121 ejecutadas, verificación completa el 2026-07-10

Se verificó la implementación real (no solo `vitest`) con un smoke test en navegador headless (Playwright + Chromium real, sirviendo el juego con `no_cache_server.py`, cargando el mundo, generando chunks vía Worker real). Resultado:

| Spec | Resultado | Detalle |
|------|-----------|---------|
| SPEC-116 | ✅ Correcta | `chunkGenPriority()` implementada y testeada (8 tests) |
| SPEC-117 | ✅ Correcta | Cola incremental + delta-ring scan, muy bien testeada (19 tests) |
| SPEC-118 | ✅ Correcta | Features movidas al worker, sin dependencias cross-chunk ni DOM. Verificado en vivo: 11 chunks cargaron sin errores. Sin tests automatizados. |
| SPEC-119 | ✅ Correcta | Detección de tier + defaults + label en HTML, respeta settings guardados. Sin tests automatizados. |
| SPEC-120 | ✅ Correcta, bien ejecutada | Confirmé por grep independiente que `StreamingManager` nunca se instanció en producción — el riesgo de regresión que sospeché inicialmente (bias oceánico de archipiélago) resultó ser código ya muerto antes del cambio. Docs corregidas correctamente. |
| SPEC-121 | ❌ **Bug crítico + incompleta** | `setToonShading()` tiene un **loop infinito** confirmado en vivo (cuelga el juego permanentemente al invocarlo — probado con solo 11 chunks, >60s sin responder). Además, la feature nunca se conectó a un toggle real en la UI — hoy es inalcanzable para un jugador, lo cual accidentalmente "protegía" de este bug. |

**Hallazgo transversal:** las 6 specs se movieron a `completed/` con todos los checkboxes de Acceptance Criteria sin marcar y sin evidencia registrada de las verificaciones manuales que cada spec pedía (profiling, comparación con seed fija, QA visual). Eso es exactamente lo que dejó pasar el bug de SPEC-121 sin detectar.

## Specs nuevas generadas por esta verificación

| ID | Título | Prioridad | Estimación | Depende de |
|----|--------|-----------|------------|------------|
| SPEC-122 | Fix Infinite Loop in setToonShading() + Wire Toon Shading to Settings UI | **critical** | 3h | — |
| SPEC-123 | Close Verification Evidence Gap on SPEC-116/117/118/119/121 | medium | 4h | SPEC-122 |

**Total:** 7h

## Orden recomendado

1. **SPEC-122 primero** — es un bug de congelamiento total de página, aunque hoy inalcanzable por UI, cualquier futuro intento de conectar el toggle (incluyendo SPEC-123 al re-verificar) lo dispararía.
2. **SPEC-123** — cierra la deuda de evidencia/tests una vez que 122 esté resuelto, para que la re-verificación de SPEC-121 sea contra código ya arreglado.

## Comando sugerido

```
/engine-run SPEC-122
```

## Nota sobre hallazgos descartados

Inicialmente sospeché que SPEC-120 había introducido una regresión real (eliminar el bias oceánico de `StreamingManager` usado en modo archipiélago, que está activo por defecto en Zen). Verifiqué con `git grep` que `_streamingManager`/`StreamingManager` nunca se instanció fuera de los tests — la llamada `setArchipelago()` en `zen-game.js` estaba guardada por un `if` que siempre era `false`. No era una regresión: era código ya muerto antes del cambio. Lo documento para que quede claro que se investigó y se descartó, no que se pasó por alto.
