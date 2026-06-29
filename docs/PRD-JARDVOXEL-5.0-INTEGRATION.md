# JardVoxel 5.0 — PRD de Integración de Sistemas del Mundo Vivo

**Fecha**: 2026-06-28
**Autor**: ja
**Estado**: ✅ Completado (v5.0.0-RC2 — 8 specs SPEC-INT-001 a INT-008)
**Versión objetivo**: v5.0.0
**Documento base**: `PRD-JARDVOXEL-5.0.md`

---

## Resumen Ejecutivo

El PRD JardVoxel 5.0 definió 21 especificaciones (SPEC-070 a SPEC-090). Al 28 de junio de 2026, **20 de esas specs tienen implementación propia y 731 tests pasan**. Sin embargo, la mitad de los sistemas del pilar **"Mundo Vivo"** aún no están conectados al juego principal: funcionan en aislamiento, pero no modifican la experiencia del jugador.

Este PRD cubre las **brechas críticas de integración** que impiden que JardVoxel 5.0 sea jugable con sus nuevos sistemas. No se re-implementan módulos; se conectan, se orquestan y se hacen observables en `jardvoxel-survival.html`.

### Tabla de brechas críticas

| ID | Brecha | Módulos afectados | Impacto | Estado |
|----|--------|-------------------|---------|--------|
| INT-001 | Atmósfera y sonido no reaccionan al mundo | `ambient-sound`, `biome-identity`, `weather` | Bajo | No integrado |
| INT-002 | ChillTune 2.0 no consume bioma/hora/clima/eventos | `chilltune` | Medio | Parcialmente integrado |
| INT-003 | Estructuras narrativas no reemplazan al generador antiguo | `narrative-structures`, `features.js` | Medio | No integrado |
| INT-004 | AI Server y NPCs no existen en el juego | `ai-server`, `ai-client`, `npc-memory`, `conversation`, `villagers` | Alto | No integrado |
| INT-005 | Quests y eventos emergentes no se generan | `quests`, `events` | Alto | No integrado |
| INT-006 | Civilizaciones antiguas y lore no aparecen en el mundo | `civilizations`, `lore` | Alto | No integrado |
| INT-007 | UI Overhaul 5.0 no reemplaza al HUD actual | `ui-overhaul` | Medio | No integrado |
| INT-008 | Documentación y trazabilidad de specs desactualizadas | `CHANGELOG.md`, `docs/` | Bajo | No integrado |

---

## SPEC-INT-001: Integración de Atmósfera y Sonido

**Prioridad**: Media
**Estimación**: 6h
**Dependencias**: SPEC-075, SPEC-076, SPEC-084
**Bloquea a**: INT-002

### Problema

- `jardvoxel-survival-ambient-sound.js` no se importa ni se instancia en `jardvoxel-survival.html`.
- `BiomeIdentityManager` solo se usa para calcular `treeChance` en `features.js`; no expone su identidad al jugador (nombre, ambiente, descubrimiento).
- `WeatherManager` existe, pero no hay transiciones de sonido ambiental según clima.

### Arquitectura propuesta

```
AtmosphereSystem
├── AmbientSoundManager
│   ├── setBiome(biomeId)
│   ├── setWeather(weatherType)
│   ├── setTimeOfDay(phase)
│   └── setIndoor(boolean)
├── BiomeDiscoveryManager
│   ├── discover(biomeId) → marca en save
│   ├── getBiomeDisplayName(biomeId)
│   └── getBiomeMood(biomeId)
└── GameplayBridge
    ├── onPlayerMove → detecta bioma/hora/clima/altitud
    └── update(dt) → actualiza managers
```

### Cambios en archivos

- `jardvoxel-survival.html`: importar `AmbientSoundManager`, `biomeIdentityManager`.
- `jardvoxel-survival-gameplay.js`: agregar `this.atmosphere` y `this.ambientSound`; actualizar en `update()`.
- `core/jardvoxel-survival-save.js`: persistir `discoveredBiomes` y configuración de volumen ambiental.

### Criterios de aceptación

- [ ] Al entrar a un bioma, el nombre del bioma aparece brevemente en pantalla (toast o HUD).
- [ ] El sonido ambiental cambia entre bosque, desierto, océano, cueva y aldea.
- [ ] La lluvia aumenta el volumen de sonido de agua; la nieve reduce el volumen general.
- [ ] Al entrar bajo tierra, se activa el modo `indoor` con eco/reverb reducido.

---

## SPEC-INT-002: Activación de ChillTune 2.0

**Prioridad**: Media
**Estimación**: 4h
**Dependencias**: INT-001
**Bloquea a**: Ninguna

### Problema

`ChillTuneEngine` exporta `BIOME_SCALES`, `TIME_MODULATION`, `WEATHER_EFFECTS` y `EVENT_STINGERS`, pero `jardvoxel-survival-gameplay.js` solo usa `setState('exploring'|'building'|'mining'...)`.

### Arquitectura propuesta

```
MusicConductor
├── setBiome(biomeId)        → escala + BPM base
├── setTimeOfDay(phase)      → modulación dawn/day/sunset/night
├── setWeather(weather)      → attenuación/percusión
├── playEventStinger(event)  → stingers de descubrimiento/combate/lore
└── update(player, world)      → decide transiciones automáticas
```

### Cambios en archivos

- `core/jardvoxel-survival-gameplay.js`: instanciar `MusicConductor` y llamar `setBiome`, `setTimeOfDay`, `setWeather` en el loop.
- `core/jardvoxel-survival-chilltune.js`: agregar `MusicConductor` wrapper para exponer la API de alto nivel (o extender `ChillTuneEngine`).

### Criterios de aceptación

- [ ] Al cruzar biomas, la música cambia de escala y BPM sin cortes bruscos.
- [ ] Al atardecer, el BPM baja y el brillo se reduce.
- [ ] Al descubrir una estructura antigua, suena un stinger `archaeological`.
- [ ] En combate, la música pasa a estado `combat` y luego vuelve a `exploring` al salir.

---

## SPEC-INT-003: Integración de Estructuras Narrativas

**Prioridad**: Media
**Estimación**: 8h
**Dependencias**: SPEC-080
**Bloquea a**: INT-006

### Problema

`jardvoxel-survival-features.js` genera estructuras con funciones locales (`placeVillageHouse`, `placeDesertTemple`, etc.) que no tienen historia ni identidad. El sistema `NarrativeStructure` (SPEC-080) está implementado pero no se usa.

### Arquitectura propuesta

```
NarrativeStructureGenerator
├── generateStructure(chunk, world, rng)
│   ├── selecciona bioma compatible
│   ├── elige tema: abandoned_village, temple, ruin, watchtower, tomb
│   ├── asigna lore tag vinculado a AncientCivilization
│   └── delega a placeNarrativeStructure(theme)
├── getStructureMetadata(chunkX, chunkZ) → { name, civilization, era, lootHint }
└── registerDiscovery(chunkX, chunkZ) → notifica LoreManager
```

### Cambios en archivos

- `core/jardvoxel-survival-features.js`: reemplazar `generateStructures()` para usar `NarrativeStructureGenerator`.
- `core/jardvoxel-survival-narrative-structures.js`: exportar `generateStructure` y `getStructureMetadata`.
- `core/jardvoxel-survival-save.js`: persistir `discoveredStructures`.

### Criterios de aceptación

- [ ] Al menos 5 temas de estructuras generadas proceduralmente.
- [ ] Cada estructura descubierta muestra un nombre y civilización asociada.
- [ ] Las ruinas y templos tienen loot relacionado con su civilización.
- [ ] El sistema es retrocompatible: las aldeas existentes siguen generándose como fallback.

---

## SPEC-INT-004: Integración de AI Server y NPCs

**Prioridad**: Alta
**Estimación**: 12h
**Dependencias**: SPEC-085, SPEC-086, SPEC-087, SPEC-088
**Bloquea a**: INT-005

### Problema

- `ai-server/` no se arranca como parte del flujo de desarrollo.
- `jardvoxel-survival-ai-client.js` no se importa en el HTML.
- `VillagerManager` es el sistema antiguo; no tiene memoria ni conversaciones naturales.
- `NPCMemorySystem`, `ConversationManager` y `QuestManager` están implementados pero desconectados.

### Arquitectura propuesta

```
LivingWorldSystem
├── AIClient
│   ├── connect() al arrancar (ws://localhost:3001)
│   ├── on('npc_response') → NPC respond
│   └── on('quest_generated') → QuestManager.add
├── NPCManager
│   ├── spawnVillager(worldX, y, z, profession) → NPCMemorySystem.createNPC
│   ├── getNPC(npcId) → NPCMemorySystem.get
│   └── saveAll() → serializa todos los NPCs
├── DialogueUI
│   ├── open(npcId, response, options)
│   └── onSelect(option) → ConversationManager.advance
└── VillagerManagerBridge
    ├── reemplaza el viejo VillagerManager
    └── integra trading con NPCs persistentes
```

### Cambios en archivos

- `jardvoxel-survival.html`: importar `AIClient`, `NPCMemorySystem`, `ConversationManager`, `QuestManager`.
- `jardvoxel-survival-gameplay.js`: instanciar `LivingWorldSystem` y conectar al servidor.
- `package.json`: agregar script `ai-server` para arrancar `node ai-server/server.js`.
- `core/jardvoxel-survival-villagers.js`: deprecar o adaptar para usar `NPCMemorySystem`.

### Criterios de aceptación

- [ ] Al iniciar el juego, se intenta conectar con el AI Server.
- [ ] Si el servidor no está disponible, los NPCs funcionan con respuestas locales de fallback.
- [ ] Al interactuar con un aldeano, aparece diálogo con 3-4 opciones de respuesta.
- [ ] Los NPCs recuerdan interacciones previas (nombres, quests, reputación).
- [ ] El jugador puede aceptar una quest generada dinámicamente por un NPC.

---

## SPEC-INT-005: Integración de Quests y Eventos Emergentes

**Prioridad**: Alta
**Estimación**: 10h
**Dependencias**: INT-004
**Bloquea a**: Ninguna

### Problema

- `QuestManager` y `EventManager` tienen tests, pero no hay loop que los active.
- No hay notificaciones de eventos en el HUD.
- Las quests no se guardan en el save.

### Arquitectura propuesta

```
WorldDirector
├── QuestManager
│   ├── onNPCDialogue(questOffer) → muestra oferta
│   ├── onPlayerAction(action, target) → verifica progreso
│   └── completeQuest(questId) → rewards
├── EventManager
│   ├── rollEvent(world, player) → cada 5-15 minutos
│   ├── applyEvent(event) → modifica clima, spawns, NPCs
│   └── notifyPlayer(event) → toast en HUD
└── SaveBridge
    └── persist quests activas, completadas y eventos en curso
```

### Cambios en archivos

- `jardvoxel-survival-gameplay.js`: instanciar `WorldDirector` y llamar `update()` en el loop.
- `core/jardvoxel-survival-save.js`: guardar `activeQuests`, `completedQuests`, `activeEvents`.
- `core/jardvoxel-survival-ui.js` (o HUD actual): mostrar notificaciones de eventos y tracker de quests.

### Criterios de aceptación

- [ ] Un NPC puede ofrecer una quest basada en el contexto del jugador.
- [ ] El tracker de quests muestra objetivos y progreso.
- [ ] Eventos emergentes (tormenta, invasión, mercado ambulante, etc.) aparecen como notificaciones.
- [ ] Al completar una quest, se otorgan recompensas y se actualiza la relación con el NPC.

---

## SPEC-INT-006: Integración de Civilizaciones Antiguas y Lore

**Prioridad**: Alta
**Estimación**: 10h
**Dependencias**: INT-003
**Bloquea a**: Ninguna

### Problema

- `AncientCivilizationManager` y `LoreGenerator` están implementados pero no generan contenido jugable.
- No hay relación entre estructuras, civilizaciones y lore.

### Arquitectura propuesta

```
MythologySystem
├── AncientCivilizationManager
│   ├── generateWorldCivilizations(seed) → 3-5 civilizaciones únicas
│   └── getCivilizationForStructure(structureId) → civilization
├── LoreGenerator
│   ├── generateForDiscovery(type, context) → texto de lore
│   └── onBookFound(bookId) → añade entrada al journal
├── ArchaeologyJournal
│   ├── addEntry(entry)
│   └── getEntriesByCivilization(civId)
└── WorldConnection
    └── cada estructura narrativa se vincula a una civilización y genera lore al descubrirse
```

### Cambios en archivos

- `core/jardvoxel-survival-features.js`: al generar estructura narrativa, asignar civilización y lore.
- `jardvoxel-survival-gameplay.js`: instanciar `MythologySystem` y propagar descubrimientos.
- `core/jardvoxel-survival-save.js`: persistir `civilizations`, `loreJournal`, `discoveredStructures`.

### Criterios de aceptación

- [ ] Cada mundo genera 3-5 civilizaciones antiguas con nombres, eras y culturas únicas.
- [ ] Descubrir una estructura antigua genera una entrada de lore en el journal.
- [ ] Los libros encontrados en ruinas añaden fragmentos de historia procedimental.
- [ ] El jugador puede abrir un journal (`J`) con todas las civilizaciones y lore descubiertos.

---

## SPEC-INT-007: UI Overhaul 5.0

**Prioridad**: Media
**Estimación**: 12h
**Dependencias**: SPEC-082
**Bloquea a**: INT-004, INT-005, INT-006

### Problema

- `jardvoxel-survival-ui.js` no se importa en `jardvoxel-survival.html`.
- El HUD actual está hardcodeado en HTML/CSS y no es responsive.
- No hay UI para diálogo, journal, quests, ni notificaciones de eventos.

### Arquitectura propuesta

```
UIManager 5.0
├── HUD
│   ├── hotbar (reemplaza el actual)
│   ├── crosshair
│   ├── status bars (health, hunger, xp, breath)
│   ├── biome/weather/time indicators
│   └── notification toasts
├── DialoguePanel
├── QuestTracker
├── Journal (Civilizations + Lore)
├── InventoryScreen
├── PauseMenu
├── SettingsPanel
└── TouchControls (ya existente, mantener)
```

### Cambios en archivos

- `jardvoxel-survival.html`: reemplazar HUD hardcodeado por contenedores controlados por `UIManager`.
- `jardvoxel-survival-gameplay.js`: delegar toda la UI a `UIManager`.
- `core/jardvoxel-survival-ui.js`: extender para soportar diálogo, journal, quest tracker y notificaciones.

### Criterios de aceptación

- [ ] El HUD nuevo es responsive y funciona en móvil y desktop.
- [ ] Aparece un panel de diálogo al interactuar con NPCs.
- [ ] Existe un journal (`J`) con civilizaciones y lore descubiertos.
- [ ] El tracker de quests muestra objetivos actualizados en tiempo real.
- [ ] Las notificaciones de eventos no bloquean el centro de la pantalla.

---

## SPEC-INT-008: Documentación y Registro de Specs

**Prioridad**: Baja
**Estimación**: 4h
**Dependencias**: Ninguna
**Bloquea a**: Ninguna

### Problema

- `CHANGELOG.md` no refleja las implementaciones del 28 de junio.
- No hay carpeta `specs/` con las specs del PRD 5.0.
- El `README.md` del core no menciona los nuevos módulos de mundo vivo.

### Cambios en archivos

- `docs/CHANGELOG.md`: agregar versión `v5.0.0-RC1` con el listado de specs implementadas.
- Crear `docs/specs/completed/` y mover/crear resúmenes de SPEC-070 a SPEC-090.
- Actualizar `core/README.md` con la sección "Living World" y los módulos nuevos.
- Agregar `docs/PRD-JARDVOXEL-5.0-INTEGRATION.md` (este documento).

### Criterios de aceptación

- [ ] CHANGELOG actualizado con fechas y specs.
- [ ] Carpetas `docs/specs/completed/` y `docs/specs/pending/` creadas.
- [ ] README del core refleja todos los módulos existentes.
- [ ] Este PRD está aprobado y versionado.

---

## Plan de Implementación

| Fase | Specs | Duración estimada | Entregable |
|------|-------|-------------------|------------|
| 1 | INT-008 | 4h | Documentación y CHANGELOG actualizados |
| 2 | INT-001, INT-002 | 10h | Atmósfera, sonido y música reactivos |
| 3 | INT-007 | 12h | UI Overhaul 5.0 con paneles base |
| 4 | INT-003 | 8h | Estructuras narrativas en generación de mundo |
| 5 | INT-004 | 12h | AI Server conectado y NPCs persistentes |
| 6 | INT-005, INT-006 | 20h | Quests, eventos, civilizaciones y lore |
| 7 | Integración + QA | 10h | Todos los tests pasan, juego estable |
| **Total** | | **~76h** | JardVoxel 5.0 completamente integrado |

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| AI Server no disponible en producción | Alta | Alto | Implementar fallback local con templates para diálogo/quests |
| Performance al añadir NPCs/eventos | Media | Alto | Usar pooling de NPCs, eventos con cooldown, y LOD |
| UI responsive compleja en móvil | Media | Medio | Mantener controles táctiles existentes; probar en dispositivo real |
| Guardado incompatible con saves antiguos | Media | Medio | Agregar migración de save y versionado (saveVersion) |
| Complejidad del WorldDirector | Media | Medio | Dividir en subsistemas con tests unitarios individuales |

---

## Criterios de salida de la versión 5.0.0

- [ ] Todos los módulos del PRD 5.0 están importados y activos en `jardvoxel-survival.html`.
- [ ] 731+ tests pasan y se añaden tests de integración para INT-001 a INT-007.
- [ ] El AI Server arranca con `npm run ai-server` y se conecta desde el navegador.
- [ ] El jugador puede interactuar con NPCs, recibir quests, descubrir civilizaciones y leer lore.
- [ ] El HUD nuevo muestra bioma, clima, hora, quests, notificaciones y journal.
- [ ] El CHANGELOG y el README reflejan el estado final.

---

## Notas de versionado

- Este PRD no reemplaza a `PRD-JARDVOXEL-5.0.md`; lo complementa.
- Cada SPEC-INT-XXX puede convertirse en un documento de spec SDD independiente si se requiere trazabilidad formal.
- La versión objetivo final sigue siendo **v5.0.0**.
