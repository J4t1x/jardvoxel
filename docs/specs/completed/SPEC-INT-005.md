# SPEC-INT-005: Integración de Quests y Eventos Emergentes

**Proyecto:** jard-games/jardvoxel  
**Prioridad:** Alta  
**Estimación:** 10h  
**Dependencias:** INT-004  
**Bloquea a:** Ninguna  
**Estado:** ✅ Completado (v5.0.0-RC2)  

---

## Objetivo

Activar el loop de quests y eventos emergentes, mostrarlos en el HUD y persistir su estado en el save.

## Alcance

- Crear `WorldDirector` que integre `QuestManager` y `EventManager`.
- Llamar `WorldDirector.update()` en el loop principal.
- Mostrar notificaciones de eventos y tracker de quests en el HUD.
- Persistir `activeQuests`, `completedQuests` y `activeEvents`.

## Criterios de aceptación

- [ ] Un NPC puede ofrecer una quest basada en el contexto del jugador.
- [ ] El tracker de quests muestra objetivos y progreso.
- [ ] Eventos emergentes (tormenta, invasión, mercado ambulante, etc.) aparecen como notificaciones.
- [ ] Al completar una quest, se otorgan recompensas y se actualiza la relación con el NPC.

## Archivos afectados

- `core/jardvoxel-survival-gameplay.js`
- `core/jardvoxel-survival-save.js`
- `core/jardvoxel-survival-ui.js` (o HUD actual)

## Notas de implementación

- Cooldown de eventos: 5-15 minutos entre rolls.
- Las quests deben actualizar progreso ante acciones del jugador (minar, matar, descubrir).
- Notificaciones no deben bloquear el centro de la pantalla.
