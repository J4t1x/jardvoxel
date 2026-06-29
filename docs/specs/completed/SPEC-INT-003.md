# SPEC-INT-003: Integración de Estructuras Narrativas

**Proyecto:** jard-games/jardvoxel  
**Prioridad:** Media  
**Estimación:** 8h  
**Dependencias:** SPEC-080  
**Bloquea a:** INT-006  
**Estado:** ✅ Completado (v5.0.0-RC2)  

---

## Objetivo

Reemplazar el generador de estructuras actual por `NarrativeStructureGenerator` para que cada estructura tenga historia, identidad y loot vinculado a civilizaciones antiguas.

## Alcance

- Crear `NarrativeStructureGenerator` que seleccione tema compatible con el bioma y asigne lore/civilización.
- Reemplazar `generateStructures()` en `features.js` usando el nuevo generador.
- Mantener aldeas existentes como fallback retrocompatible.

## Criterios de aceptación

- [ ] Al menos 5 temas de estructuras generadas proceduralmente.
- [ ] Cada estructura descubierta muestra un nombre y civilización asociada.
- [ ] Las ruinas y templos tienen loot relacionado con su civilización.
- [ ] El sistema es retrocompatible: las aldeas existentes siguen generándose como fallback.

## Archivos afectados

- `core/jardvoxel-survival-features.js`
- `core/jardvoxel-survival-narrative-structures.js`
- `core/jardvoxel-survival-save.js`

## Notas de implementación

- Usar `generateStructureHistory()` para asignar lore al generar.
- `discoveredStructures` debe guardarse por coordenadas de chunk.
- El fallback debe activarse si el generador narrativo no encuentra tema válido.
