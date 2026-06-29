# SPEC-INT-006: Integración de Civilizaciones Antiguas y Lore

**Proyecto:** jard-games/jardvoxel  
**Prioridad:** Alta  
**Estimación:** 10h  
**Dependencias:** INT-003  
**Bloquea a:** Ninguna  
**Estado:** ✅ Completado (v5.0.0-RC2)  

---

## Objetivo

Vincular `AncientCivilizationManager` y `LoreGenerator` con estructuras narrativas, permitiendo descubrir civilizaciones antiguas y leer lore en un journal.

## Alcance

- Crear `MythologySystem` que genere 3-5 civilizaciones por mundo y asigne cada estructura a una civilización.
- Generar lore al descubrir estructuras y libros.
- Crear `ArchaeologyJournal` accesible con la tecla `J`.
- Persistir `civilizations`, `loreJournal` y `discoveredStructures`.

## Criterios de aceptación

- [ ] Cada mundo genera 3-5 civilizaciones antiguas con nombres, eras y culturas únicas.
- [ ] Descubrir una estructura antigua genera una entrada de lore en el journal.
- [ ] Los libros encontrados en ruinas añaden fragmentos de historia procedimental.
- [ ] El jugador puede abrir un journal (`J`) con todas las civilizaciones y lore descubiertos.

## Archivos afectados

- `core/jardvoxel-survival-features.js`
- `core/jardvoxel-survival-gameplay.js`
- `core/jardvoxel-survival-save.js`
- `core/jardvoxel-survival-ui.js` (journal UI)

## Notas de implementación

- Generar civilizaciones a partir del seed del mundo para consistencia.
- El journal debe ser una capa UI nueva o reutilizar el panel de inventario.
- El lore no debe pausar el juego; mostrar en panel lateral.
