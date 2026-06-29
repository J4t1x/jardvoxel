# SPEC-INT-007: UI Overhaul 5.0

**Proyecto:** jard-games/jardvoxel  
**Prioridad:** Media  
**Estimación:** 12h  
**Dependencias:** SPEC-082  
**Bloquea a:** INT-004, INT-005, INT-006  
**Estado:** ✅ Completado (v5.0.0-RC2)  

---

## Objetivo

Reemplazar el HUD hardcodeado en `jardvoxel-survival.html` por `UIManager` 5.0, que soporte diálogo, journal, quest tracker y notificaciones de eventos de forma responsive.

## Alcance

- Importar `jardvoxel-survival-ui.js` en el juego principal.
- Crear `UIManager` con HUD, paneles de diálogo, quest tracker, journal, inventario, menú de pausa y settings.
- Reemplazar contenedores hardcodeados del HTML por contenedores controlados por `UIManager`.
- Delegar toda la UI a `UIManager` desde `gameplay.js`.

## Criterios de aceptación

- [ ] El HUD nuevo es responsive y funciona en móvil y desktop.
- [ ] Aparece un panel de diálogo al interactuar con NPCs.
- [ ] Existe un journal (`J`) con civilizaciones y lore descubiertos.
- [ ] El tracker de quests muestra objetivos actualizados en tiempo real.
- [ ] Las notificaciones de eventos no bloquean el centro de la pantalla.

## Archivos afectados

- `jardvoxel-survival.html`
- `core/jardvoxel-survival-gameplay.js`
- `core/jardvoxel-survival-ui.js`

## Notas de implementación

- Mantener touch controls existentes.
- El HUD debe ser minimalista; la información contextual aparece solo cuando es necesaria.
- Probar en viewport móvil (<600px) y desktop.
