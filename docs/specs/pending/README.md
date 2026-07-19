# Specs Pendientes — JardVoxel Zen

## Historial: SPEC-116 a SPEC-123 (Performance + Ghibli) — ✅ resueltas y verificadas, subidas a GitHub

SPEC-116 a SPEC-121 se ejecutaron, se verificó con smoke test en navegador headless real (Playwright + Chromium + Worker real), se encontró un bug crítico (loop infinito en `setToonShading()`), se generaron SPEC-122 (fix) y SPEC-123 (evidencia/tests), se re-verificó el fix en vivo (confirmado: de >60s colgado a 280ms), y todo el conjunto se commiteó y pusheó a `origin/main` (commit `7f3d64a`) el 2026-07-10.

| Spec | Resultado |
|------|-----------|
| SPEC-116 | ✅ Priorización de chunks por dirección de cámara |
| SPEC-117 | ✅ Cola incremental de generación de chunks |
| SPEC-118 | ✅ Generación de features movida al worker |
| SPEC-119 | ✅ Detección de tier de dispositivo mobile |
| SPEC-120 | ✅ StreamingManager confirmado como código muerto, eliminado |
| SPEC-121 | ✅ Material toon-shading Ghibli (tras fix de SPEC-122) |
| SPEC-122 | ✅ Fix del loop infinito en `setToonShading()`, verificado en vivo |
| SPEC-123 | ✅ Tests de regresión + evidencia registrada en las 5 specs anteriores |

Detalle completo de la verificación en las conversaciones previas y en cada `docs/specs/completed/SPEC-11*.md` / `SPEC-12*.md`.

## Nueva: SPEC-124 — Fix race condition en tests de AI Server

| ID | Título | Prioridad | Estimación | Depende de | PRD |
|----|--------|-----------|------------|------------|-----|
| SPEC-124 | Fix Race Condition in AI Server WebSocket Tests | medium | 2h | — | `docs/prd/PRD-AI-SERVER-TEST-RACE-CONDITION.md` |

**Diagnóstico confirmado (no especulativo):** los 6 tests que fallan en `tests/ai-server.test.js` (`describe('AIServer — SPEC-085')`) no reflejan un bug del servidor — es una condición de carrera en el propio archivo de test. Usan `ws.prependOnceListener('message', () => r(messages[messages.length - 1]))`, que se ejecuta *antes* de que el listener original de `connectAndCollect()` empuje el mensaje nuevo al array, así que siempre lee el mensaje anterior (`'ready'`) en vez del real. El archivo ya tiene el helper correcto (`waitForNth()`) pero solo se usa una vez. Verifiqué reescribiendo un test para usar `waitForNth()` — pasó al instante, sin tocar el servidor.

## Comando sugerido

```
/engine-run SPEC-124
```
