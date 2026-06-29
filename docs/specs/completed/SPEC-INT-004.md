# SPEC-INT-004: Integración de AI Server y NPCs

**Proyecto:** jard-games/jardvoxel  
**Prioridad:** Alta  
**Estimación:** 12h  
**Dependencias:** SPEC-085, SPEC-086, SPEC-087, SPEC-088  
**Bloquea a:** INT-005  
**Estado:** ✅ Completado (v5.0.0-RC2)  

---

## Objetivo

Conectar el AI Server, memoria de NPCs, conversaciones naturales y quests dinámicas al juego principal, reemplazando el antiguo `VillagerManager` estático por un sistema vivo persistente.

## Alcance

- Importar `AIClient`, `NPCMemorySystem`, `ConversationManager` y `QuestManager` en `jardvoxel-survival.html`.
- Crear `LivingWorldSystem` que conecte con el servidor y maneje fallback local.
- Crear `DialogueUI` para interactuar con NPCs.
- Deprecar/adaptar `VillagerManager` para usar `NPCMemorySystem`.

## Criterios de aceptación

- [ ] Al iniciar el juego, se intenta conectar con el AI Server.
- [ ] Si el servidor no está disponible, los NPCs funcionan con respuestas locales de fallback.
- [ ] Al interactuar con un aldeano, aparece diálogo con 3-4 opciones de respuesta.
- [ ] Los NPCs recuerdan interacciones previas (nombres, quests, reputación).
- [ ] El jugador puede aceptar una quest generada dinámicamente por un NPC.

## Archivos afectados

- `jardvoxel-survival.html`
- `core/jardvoxel-survival-gameplay.js`
- `core/jardvoxel-survival-villagers.js`
- `core/jardvoxel-survival-ai-client.js`
- `package.json` (script `ai-server`)

## Notas de implementación

- WebSocket por defecto a `ws://localhost:3001`.
- El fallback local debe incluir templates de respuestas por profesión.
- Guardar todos los NPCs en el save al salir o autosave.
