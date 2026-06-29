# SPEC-INT-002: Activación de ChillTune 2.0

**Proyecto:** jard-games/jardvoxel  
**Prioridad:** Media  
**Estimación:** 4h  
**Dependencias:** INT-001  
**Bloquea a:** Ninguna  
**Estado:** ✅ Completado (v5.0.0-RC2)  

---

## Objetivo

Hacer que `ChillTuneEngine` consuma bioma, hora del día, clima y eventos para generar transiciones musicales suaves en lugar de depender únicamente del estado de juego manual.

## Alcance

- Crear `MusicConductor` wrapper que exponga API de alto nivel: `setBiome`, `setTimeOfDay`, `setWeather`, `playEventStinger`.
- Integrar el conductor en el loop de gameplay para decidir transiciones automáticas.

## Criterios de aceptación

- [ ] Al cruzar biomas, la música cambia de escala y BPM sin cortes bruscos.
- [ ] Al atardecer, el BPM baja y el brillo se reduce.
- [ ] Al descubrir una estructura antigua, suena un stinger `archaeological`.
- [ ] En combate, la música pasa a estado `combat` y luego vuelve a `exploring` al salir.

## Archivos afectados

- `core/jardvoxel-survival-gameplay.js`
- `core/jardvoxel-survival-chilltune.js`

## Notas de implementación

- Extender `ChillTuneEngine` o envolverlo; no romper la API existente (`setState`).
- Las transiciones deben usar crossfade de 3-8s.
- El stinger no debe interrumpir la música base permanentemente.
