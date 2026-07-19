# JardVoxel 5.0 — PRD: Gaps de Integración Post-Audit

**Fecha**: 2026-06-29
**Autor**: ja
**Estado**: ✅ Completado (v7.1.0 — SPEC-073, 19 Julio 2026)
**Versión objetivo**: v5.0.0-RC4
**Documento base**: `PRD-JARDVOXEL-5.0.md`, `PRD-JARDVOXEL-5.0-INTEGRATION.md`
**Aplicación**: `jardvoxel-survival.html` + `core/jardvoxel-survival-*.js`

---

## Resumen Ejecutivo

El PRD de Integración 5.0 (INT-001 a INT-008) está marcado como completado. Un audit del código revela que **la mayoría de los sistemas están correctamente cableados** al game loop, pero persisten **8 gaps funcionales** que impiden que el "Mundo Vivo" opere al 100%.

Este PRD cubre las brechas detectadas en el audit post-integración, ordenadas por prioridad. No se re-implementan módulos — se completan conexiones faltantes y se corrigen omisiones en el cableado del game loop.

### Tabla de Gaps

| ID | Gap | Severidad | Módulos | Esfuerzo |
|----|-----|-----------|---------|----------|
| GAP-001 | Quest Progress Tracking no funciona | 🔴 CRÍTICA | `quests`, `gameplay` | 30 min |
| GAP-002 | Event Manager sin sync AI | 🟡 ALTA | `events`, `ai-client` | 1h |
| GAP-003 | Quests solo vía conversación NPC | 🟡 ALTA | `quests`, `events`, `narrative-structures` | 1h |
| GAP-004 | AI Client sin sync de estado del mundo | 🟢 MEDIA | `ai-client` | 20 min |
| GAP-005 | NPC Memory sin representación visual | 🟢 MEDIA | `npc-memory`, `villagers`, `character` | 2h |
| GAP-006 | Civilization structures no se generan físicamente | 🟢 MEDIA | `civilizations`, `features` | 3h |
| GAP-007 | Conversation Manager sin scroll | 🔵 BAJA | `conversation`, `ui` | 15 min |
| GAP-008 | Lore Generator uso limitado | 🔵 BAJA | `lore` | 30 min |

**Esfuerzo total estimado**: ~8.5 horas

---

## GAP-001: Quest Progress Tracking no funciona

**Prioridad**: 🔴 CRÍTICA
**Estimación**: 30 min
**Dependencias**: Ninguna
**Bloquea a**: GAP-003

### Problema

`QuestManager.updateProgress()` **nunca se llama** en el game loop. Las quests se pueden aceptar (vía conversación NPC) y se muestran en el quest tracker UI, pero:

- Los objetivos `collect` (recolectar bloques) nunca incrementan su contador
- Los objetivos `kill` (matar mobs) nunca se registran
- Los objetivos `visit`/`explore` (visitar ubicaciones) nunca se verifican
- Los objetivos `discover` (descubrir estructuras) nunca se marcan
- **Las quests son imposible de completar**

### Análisis del código

`_breakBlock()` en `jardvoxel-survival.html:2848-2977` maneja:
- Rotura de bloques (línea 2944: `this.inventory.addBlock(target.block)`) — sin tracking de quest
- Muerte de mobs (línea 2895: `this.mobManager.killMob(mob)`) — sin tracking de quest

El update loop (líneas 3900-4577) no verifica objetivos `visit`/`explore`.

### Solución

#### 1. Tracking de `collect` en `_breakBlock()`

Insertar después de `this.inventory.addBlock(target.block)` (línea 2944):

```javascript
// GAP-001: Track quest collect objectives
if (this.questManager) {
  const activeQuests = this.questManager.getActiveQuests();
  for (const quest of activeQuests) {
    for (let i = 0; i < quest.objectives.length; i++) {
      const obj = quest.objectives[i];
      if (obj.type === 'collect' && target.block === obj.item) {
        this.questManager.updateProgress(quest.id, i, 1);
      }
    }
  }
}
```

#### 2. Tracking de `kill` en `_breakBlock()` (mob death)

Insertar después de `this.mobManager.killMob(mob)` (línea 2895):

```javascript
// GAP-001: Track quest kill objectives
if (this.questManager) {
  const activeQuests = this.questManager.getActiveQuests();
  for (const quest of activeQuests) {
    for (let i = 0; i < quest.objectives.length; i++) {
      const obj = quest.objectives[i];
      if (obj.type === 'kill' && mob.type === obj.target) {
        this.questManager.updateProgress(quest.id, i, 1);
      }
    }
  }
}
```

#### 3. Tracking de `visit`/`explore` en update loop

Insertar en el update loop, después del structure scan (línea ~4568), con cooldown de 1s:

```javascript
// GAP-001: Track quest visit/explore objectives
if (this.questManager && this._questCheckTimer === undefined) this._questCheckTimer = 0;
if (this.questManager) {
  this._questCheckTimer += dt;
  if (this._questCheckTimer >= 1.0) {
    this._questCheckTimer = 0;
    const activeQuests = this.questManager.getActiveQuests();
    for (const quest of activeQuests) {
      for (let i = 0; i < quest.objectives.length; i++) {
        const obj = quest.objectives[i];
        if (obj.type === 'visit' && obj.location) {
          const dist = Math.sqrt(
            (this.player.position.x - (obj.location.x || 0)) ** 2 +
            (this.player.position.z - (obj.location.z || 0)) ** 2
          );
          if (dist < 16) this.questManager.updateProgress(quest.id, i, 1);
        }
        if (obj.type === 'discover' && this._discoveredStructures) {
          // Check if any recently discovered structure matches
          for (const sId of this._discoveredStructures) {
            if (obj.target && sId.includes(obj.target)) {
              this.questManager.updateProgress(quest.id, i, 1);
              break;
            }
          }
        }
      }
    }
  }
}
```

### Criterios de aceptación

- [ ] Al minar un bloque que es objetivo de una quest activa, el contador incrementa
- [ ] Al matar un mob que es objetivo de una quest activa, el contador incrementa
- [ ] Al llegar a una ubicación objetivo, la quest marca como visitado
- [ ] Al descubrir una estructura objetivo, la quest marca como descubierto
- [ ] Al completar todos los objetivos, la quest se marca como completada
- [ ] El quest tracker UI se actualiza en tiempo real

### Archivos afectados

- `jardvoxel-survival.html` — `_breakBlock()`, update loop

---

## GAP-002: Event Manager sin sync con AI Server

**Prioridad**: 🟡 ALTA
**Estimación**: 1h
**Dependencias**: GAP-004 (recomendado)
**Bloquea a**: Ninguna

### Problema

`EventManager` funciona con eventos probabilísticos locales (`_rollForEvent()`), pero `triggerAIEvent()` nunca se invoca desde el juego. El `AIClient` tiene `requestEvent()` que podría generar eventos dinámicos personalizados por IA, pero no está conectado.

### Solución

#### 1. Enriquecer eventos locales con AI

Cuando `EventManager._startEvent()` active un evento, solicitar al AI server una descripción personalizada:

```javascript
// En el eventManager.on('event_started') handler (línea 1706):
this.eventManager.on('event_started', async (event) => {
  if (this.uiManager) this.uiManager.showToast(`${event.name}: ${event.description}`, 'event');
  this._addJournalEntry('lore', `Event: ${event.name}`, event.description || '...');

  // GAP-002: Request AI-enriched event description
  if (this.aiClient && this.aiClient.isConnected()) {
    try {
      const enriched = await this.aiClient.requestEvent({
        type: event.type,
        biome: this._getCurrentBiomeName(),
        timeOfDay: this.dayNight ? this.dayNight.time : 0.5,
        playerLevel: this.xpManager ? this.xpManager.level : 1,
      });
      if (enriched && enriched.name && enriched.type !== 'fallback') {
        if (this.uiManager) this.uiManager.showToast(`${enriched.name}: ${enriched.description || ''}`, 'event');
        this._addJournalEntry('lore', `Event: ${enriched.name}`, enriched.description || enriched.text || '');
      }
    } catch (e) { /* fallback to local event */ }
  }
});
```

#### 2. Eventos AI-triggered por contexto

Añadir en el update loop, cada 30s, verificar si el AI server puede sugerir un evento:

```javascript
// GAP-002: AI-triggered events
if (this.aiClient && this.aiClient.isConnected() && this.eventManager && !this.eventManager.hasActiveEvent()) {
  this._aiEventTimer = (this._aiEventTimer || 0) + dt;
  if (this._aiEventTimer >= 30) {
    this._aiEventTimer = 0;
    this.aiClient.requestEvent({
      biome: this._getCurrentBiomeName(),
      timeOfDay: this.dayNight ? this.dayNight.time : 0.5,
      playerLevel: this.xpManager ? this.xpManager.level : 1,
      weather: this.weatherManager ? this.weatherManager.getCurrentWeather() : 'clear',
    }).then((response) => {
      if (response && response.type !== 'fallback' && response.name) {
        this.eventManager.triggerAIEvent(response);
      }
    });
  }
}
```

### Criterios de aceptación

- [ ] Al activarse un evento local, el AI server enriquece la descripción si está conectado
- [ ] Cada 30s, si no hay evento activo y el AI server está conectado, se solicita un evento AI
- [ ] Si el AI server no está conectado, los eventos locales funcionan normalmente (fallback)
- [ ] Los eventos AI aparecen en el journal con su descripción enriquecida

### Archivos afectados

- `jardvoxel-survival.html` — event handlers, update loop

---

## GAP-003: Quests solo vía conversación NPC

**Prioridad**: 🟡 ALTA
**Estimación**: 1h
**Dependencias**: GAP-001
**Bloquea a**: Ninguna

### Problema

Las quests solo se crean cuando un NPC las triggera en diálogo (`conversationManager.on('quest_triggered')`). No hay generación automática basada en:

- Subida de nivel del jugador
- Descubrimiento de estructuras antiguas
- Activación de eventos emergentes
- Proximidad a civilizaciones

### Solución

#### 1. Quests por descubrimiento de estructuras

En el structure scan (línea ~4530), después de descubrir una estructura:

```javascript
// GAP-003: Auto-generate quest on structure discovery
if (this.questManager && this.questManager.canAcceptMore()) {
  this.questManager.createQuest({
    type: QUEST_TYPES.EXPLORE,
    trigger: 'structure_discovery',
    structure: ns.type,
    location: { x: ns.worldX, z: ns.worldZ },
    playerLevel: this.xpManager ? this.xpManager.level : 1,
  });
}
```

#### 2. Quests por subida de nivel

En el XP update (línea ~4198), detectar level up:

```javascript
// GAP-003: Auto-generate quest on level up
if (this.xpManager && this.xpManager._lastLevel !== this.xpManager.level) {
  if (this.xpManager._lastLevel !== undefined && this.xpManager.level > this.xpManager._lastLevel) {
    if (this.questManager && this.questManager.canAcceptMore()) {
      this.questManager.createQuest({
        type: QUEST_TYPES.FETCH,
        trigger: 'level_up',
        playerLevel: this.xpManager.level,
        item: 'wood',
      });
    }
  }
  this.xpManager._lastLevel = this.xpManager.level;
}
```

#### 3. Quests por eventos emergentes

En el `eventManager.on('event_started')` handler:

```javascript
// GAP-003: Auto-generate quest on emergent event
if (this.questManager && this.questManager.canAcceptMore()) {
  const questType = event.type === 'meteor_shower' ? QUEST_TYPES.COLLECT :
                    event.type === 'wandering_trader' ? QUEST_TYPES.ESCORT :
                    QUEST_TYPES.FETCH;
  this.questManager.createQuest({
    type: questType,
    trigger: 'emergent_event',
    target: event.type,
    playerLevel: this.xpManager ? this.xpManager.level : 1,
  });
}
```

### Criterios de aceptación

- [ ] Al descubrir una estructura antigua, se genera automáticamente una quest de exploración
- [ ] Al subir de nivel, se genera automáticamente una quest de recolección
- [ ] Al activarse un evento emergente, se genera automáticamente una quest contextual
- [ ] Si el jugador tiene el máximo de quests activas, no se generan nuevas
- [ ] Las quests auto-generadas aparecen en el quest tracker UI

### Archivos afectados

- `jardvoxel-survival.html` — structure scan, XP update, event handlers

---

## GAP-004: AI Client sin sync de estado del mundo

**Prioridad**: 🟢 MEDIA
**Estimación**: 20 min
**Dependencias**: Ninguna
**Bloquea a**: GAP-002 (recomendado)

### Problema

`AIClient.syncState()` existe pero nunca se llama. El AI server no recibe información del mundo (bioma, hora, clima, posición, nivel) para generar respuestas contextuales para NPCs, quests y eventos.

### Solución

Añadir en el update loop, con intervalo de 10s:

```javascript
// GAP-004: Sync world state to AI server
if (this.aiClient && this.aiClient.isConnected()) {
  this._aiSyncTimer = (this._aiSyncTimer || 0) + dt;
  if (this._aiSyncTimer >= 10) {
    this._aiSyncTimer = 0;
    this.aiClient.syncState({
      biome: this._getCurrentBiomeName(),
      timeOfDay: this.dayNight ? this.dayNight.time : 0.5,
      weather: this.weatherManager ? this.weatherManager.getCurrentWeather() : 'clear',
      playerLevel: this.xpManager ? this.xpManager.level : 1,
      position: {
        x: Math.floor(this.player.position.x),
        y: Math.floor(this.player.position.y),
        z: Math.floor(this.player.position.z),
      },
      dimension: this.world.dimension || 'overworld',
      activeQuests: this.questManager ? this.questManager.getActiveCount() : 0,
      activeEvent: this.eventManager ? this.eventManager.hasActiveEvent() : false,
    });
  }
}
```

### Criterios de aceptación

- [ ] Cada 10s, si el AI server está conectado, se envía el estado del mundo
- [ ] El estado incluye bioma, hora, clima, posición, nivel, dimensión, quests activas, eventos activos
- [ ] Si el AI server no está conectado, no se intenta el sync (no genera errores)
- [ ] El AI server puede usar este estado para generar respuestas más contextuales

### Archivos afectados

- `jardvoxel-survival.html` — update loop

---

## GAP-005: NPC Memory sin representación visual

**Prioridad**: 🟢 MEDIA
**Estimación**: 2h
**Dependencias**: SPEC-067 (CharacterGenerator)
**Bloquea a**: Ninguna

### Problema

`NPCMemorySystem` gestiona identidad, personalidad y relaciones de NPCs, pero los NPCs no tienen representación visual 3D en el mundo. Las conversaciones se activan por proximidad a villagers del `VillagerManager`, no a NPCs del sistema de memoria.

### Solución

#### 1. Spawn de NPCs visuales

Crear NPCs con `CharacterGenerator` y `CharacterAnimator` (ya importados), posicionados cerca de aldeas:

```javascript
// GAP-005: Spawn NPC with visual representation
_spawnVisualNPC(npcData) {
  if (!this.characterGenerator) return;
  const character = this.characterGenerator.generate(npcData.identity.seed || npcData.id);
  const animator = new CharacterAnimator(character);
  character.position.set(npcData.position.x, npcData.position.y, npcData.position.z);
  this.scene.add(character);
  // Register in villagerManager for proximity detection
  this._npcMeshes = this._npcMeshes || new Map();
  this._npcMeshes.set(npcData.id, { mesh: character, animator, npcData });
}
```

#### 2. Integración con VillagerManager

Cuando un villager se spawnea naturalmente, asignarle un NPC del `NPCMemorySystem`:

```javascript
// En villagerManager.tryNaturalSpawn callback:
if (this.npcMemory && this.npcMemory.getNPCCount() < 10) {
  const npc = this.npcMemory.createNPC({
    position: { x: spawnX, y: spawnY, z: spawnZ },
  });
  this._spawnVisualNPC(npc);
}
```

#### 3. Detección de proximidad

Reemplazar la detección de villager actual con detección de NPC del sistema de memoria:

```javascript
// En el handler de tecla E (interact):
const nearbyNPC = this._getNearbyNPC(5);
if (nearbyNPC) {
  this.conversationManager.startConversation(nearbyNPC.id, context);
}
```

### Criterios de aceptación

- [ ] Los NPCs del `NPCMemorySystem` tienen representación visual 3D
- [ ] Los NPCs se spawnean cerca de aldeas existentes
- [ ] Al acercarse a un NPC visual y presionar E, se inicia una conversación
- [ ] El NPC tiene animaciones idle/walk básicas
- [ ] El NPC persiste entre sesiones (save/load)

### Archivos afectados

- `jardvoxel-survival.html` — NPC spawn, interaction handler
- `core/jardvoxel-survival-npc-memory.js` — `createNPC()`, `getNPCCount()`

---

## GAP-006: Civilization structures no se generan físicamente

**Prioridad**: 🟢 MEDIA
**Estimación**: 3h
**Dependencias**: SPEC-080, SPEC-090
**Bloquea a**: Ninguna

### Problema

`AncientCivilizationSystem.generate()` crea civilizaciones con estructuras (coordenadas, tipo, estado de descubrimiento), pero las estructuras **no se generan físicamente en el mundo voxel**. Solo se descubren por proximidad a `narrativeStructures` del chunk, no por sus propias coordenadas.

### Solución

#### 1. Generar estructuras civiles en chunks

En `generateChunkWithFeatures` o en el callback de chunk generation, verificar si hay estructuras civiles en el chunk:

```javascript
// GAP-006: Generate civilization structures in world
if (this.civilizationSystem) {
  const civs = this.civilizationSystem.getCivilizations();
  for (const civ of civs) {
    for (const structure of civ.structures) {
      const ccx = Math.floor(structure.x / 16);
      const ccz = Math.floor(structure.z / 16);
      if (ccx === chunk.cx && ccz === chunk.cz) {
        // Generate physical structure based on civ.type and structure.type
        this._generateCivStructure(chunk, structure, civ);
      }
    }
  }
}
```

#### 2. Tipos de estructuras por civilización

```javascript
_generateCivStructure(chunk, structure, civ) {
  const baseX = structure.x - chunk.cx * 16;
  const baseZ = structure.z - chunk.cz * 16;
  const baseY = structure.y || this.world.getSurfaceHeight(structure.x, structure.z);

  switch (structure.type) {
    case 'temple':
      // Generate temple ruins (stone, mossy, cracked)
      this._placeTempleRuins(chunk, baseX, baseY, baseZ, civ);
      break;
    case 'monument':
      // Generate monument base
      this._placeMonument(chunk, baseX, baseY, baseZ, civ);
      break;
    case 'village_ruins':
      // Generate ruined village foundations
      this._placeVillageRuins(chunk, baseX, baseY, baseZ, civ);
      break;
    case 'library':
      // Generate library ruins with bookshelves
      this._placeLibraryRuins(chunk, baseX, baseY, baseZ, civ);
      break;
  }
}
```

#### 3. Marcar como descubierto al minar/explorar

El discovery scan existente (línea 4524) ya detecta `narrativeStructures` por proximidad. Añadir detección de estructuras civiles:

```javascript
// GAP-006: Discover civilization structures by proximity
if (this.civilizationSystem) {
  for (const civ of civs) {
    for (let si = 0; si < civ.structures.length; si++) {
      const cs = civ.structures[si];
      if (cs.discovered) continue;
      const dist = Math.sqrt(
        (cs.x - this.player.position.x) ** 2 +
        (cs.z - this.player.position.z) ** 2
      );
      if (dist < 20) {
        const lore = this.civilizationSystem.discoverStructure(civ.id, si);
        // ... existing lore/journal/toast code
      }
    }
  }
}
```

### Criterios de aceptación

- [ ] Las estructuras de civilizaciones se generan físicamente en el mundo voxel
- [ ] Cada tipo de estructura (temple, monument, village_ruins, library) tiene geometría distinta
- [ ] Las estructuras usan bloques coherentes con la civilización (stone, mossy, cracked stone)
- [ ] Al acercarse a una estructura civil, se marca como descubierta y genera lore
- [ ] Las estructuras civiles son visibles en el mundo antes de ser descubiertas

### Archivos afectados

- `jardvoxel-survival.html` — chunk generation callback, structure scan
- `core/jardvoxel-survival-civilizations.js` — estructura de datos de structures
- `core/jardvoxel-survival-features.js` — posible integración en `generateChunkWithFeatures`

---

## GAP-007: Conversation Manager sin scroll

**Prioridad**: 🔵 BAJA
**Estimación**: 15 min
**Dependencias**: Ninguna
**Bloquea a**: Ninguna

### Problema

`ConversationManager.needsScroll()` existe pero no se usa en `_renderDialoguePanel()`. Textos largos de NPCs se cortan en lugar de hacer scroll.

### Solución

En `_renderDialoguePanel()` (línea ~4727), aplicar scroll si el texto excede el threshold:

```javascript
// GAP-007: Scroll long dialogue text
if (this.conversationManager.needsScroll()) {
  const scrollContainer = textEl.parentElement;
  if (scrollContainer) {
    scrollContainer.style.overflowY = 'auto';
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
  }
} else {
  const scrollContainer = textEl.parentElement;
  if (scrollContainer) scrollContainer.style.overflowY = 'hidden';
}
```

### Criterios de aceptación

- [ ] Textos de diálogo largos (>200 chars) hacen scroll vertical
- [ ] El scroll sigue el progreso del typewriter effect
- [ ] Textos cortos no muestran scrollbar

### Archivos afectados

- `jardvoxel-survival.html` — `_renderDialoguePanel()`

---

## GAP-008: Lore Generator uso limitado

**Prioridad**: 🔵 BAJA
**Estimación**: 30 min
**Dependencias**: Ninguna
**Bloquea a**: Ninguna

### Problema

`LoreGenerator` solo genera libros al descubrir estructuras con `ns.books`. No genera:

- Nombre del mundo al iniciar partida
- Historia dinámica del mundo
- Leyendas regionales por bioma
- Entradas de journal iniciales

### Solución

#### 1. Generar nombre e historia del mundo al iniciar

En el constructor o `startGame()`, después de `this.loreGenerator = new LoreGenerator(this.seed)`:

```javascript
// GAP-008: Generate world lore on game start
if (this.loreGenerator) {
  const worldName = this.loreGenerator.generateWorldName();
  const worldHistory = this.loreGenerator.generateHistory();
  this._worldName = worldName;
  this._addJournalEntry('lore', `World: ${worldName}`, worldHistory || `El mundo de ${worldName} tiene una historia antigua y profunda.`);
  if (this.uiManager) this.uiManager.showToast(`Welcome to ${worldName}`, 'info');
}
```

#### 2. Leyendas regionales por bioma

Al descubrir un bioma nuevo (línea ~4374), generar una leyenda:

```javascript
// GAP-008: Generate biome legend on discovery
if (this.loreGenerator) {
  const legend = this.loreGenerator.generateLegend(biomeName.toLowerCase());
  if (legend) {
    this._addJournalEntry('lore', `Legend of ${biomeName}`, legend);
  }
}
```

### Criterios de aceptación

- [ ] Al iniciar partida, se genera un nombre e historia del mundo
- [ ] El nombre del mundo aparece en un toast de bienvenida
- [ ] Al descubrir un bioma nuevo, se genera una leyenda regional
- [ ] Las leyendas e historia aparecen en el journal

### Archivos afectados

- `jardvoxel-survival.html` — constructor/startGame, biome discovery handler
- `core/jardvoxel-survival-lore.js` — verificar métodos `generateWorldName()`, `generateHistory()`, `generateLegend()`

---

## Plan de Implementación

### Fase 1 — Crítico (30 min)

| Orden | Gap | Esfuerzo | Dependencias |
|-------|-----|----------|--------------|
| 1 | GAP-001: Quest Progress Tracking | 30 min | Ninguna |

### Fase 2 — Alto (2h)

| Orden | Gap | Esfuerzo | Dependencias |
|-------|-----|----------|--------------|
| 2 | GAP-004: AI Client sync state | 20 min | Ninguna |
| 3 | GAP-002: Event Manager + AI | 1h | GAP-004 |
| 4 | GAP-003: Quests auto-generation | 1h | GAP-001 |

### Fase 3 — Medio (5h)

| Orden | Gap | Esfuerzo | Dependencias |
|-------|-----|----------|--------------|
| 5 | GAP-005: NPC visual representation | 2h | SPEC-067 |
| 6 | GAP-006: Civilization physical structures | 3h | SPEC-080, SPEC-090 |

### Fase 4 — Bajo (45 min)

| Orden | Gap | Esfuerzo | Dependencias |
|-------|-----|----------|--------------|
| 7 | GAP-007: Conversation scroll | 15 min | Ninguna |
| 8 | GAP-008: Lore Generator expansion | 30 min | Ninguna |

### Orden recomendado de ejecución

```
GAP-001 → GAP-004 → GAP-002 → GAP-003 → GAP-007 → GAP-008 → GAP-005 → GAP-006
```

**Justificación:**
1. **GAP-001** primero porque es crítico y bloquea GAP-003
2. **GAP-004** antes que GAP-002 porque GAP-002 necesita sync state funcional
3. **GAP-003** después de GAP-001 porque necesita progress tracking funcional
4. **GAP-007** y **GAP-008** son quick wins que se pueden hacer en paralelo
5. **GAP-005** y **GAP-006** son los más complejos, se dejan para el final

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Quest tracking causa lag con muchas quests activas | Baja | Medio | Limitar a MAX_ACTIVE_QUESTS (5), solo iterar quests activas |
| AI Server no disponible | Alta | Bajo | Todos los sistemas AI tienen fallback local |
| Estructuras civiles se generan sobre terrain existente | Media | Medio | Usar `_setBlockSafe` con `force=true` como las estructuras existentes |
| NPCs visuales aumentan poly count | Media | Medio | Limitar a 10 NPCs máx, usar LOD si es necesario |
| Lore generator no tiene métodos esperados | Media | Bajo | Verificar existencia de métodos antes de llamar (defensive coding) |

---

## Criterios de Salida — v5.0.0-RC4

- [ ] GAP-001 completado: Quests se pueden completar minando, matando, visitando y descubriendo
- [ ] GAP-002 completado: Eventos se enriquecen con AI y se generan eventos AI-triggered
- [ ] GAP-003 completado: Quests se generan automáticamente por estructuras, nivel y eventos
- [ ] GAP-004 completado: AI server recibe sync de estado cada 10s
- [ ] GAP-005 completado: NPCs tienen representación visual 3D y se pueden interactuar
- [ ] GAP-006 completado: Estructuras civiles se generan físicamente en el mundo
- [ ] GAP-007 completado: Diálogos largos hacen scroll
- [ ] GAP-008 completado: Mundo tiene nombre, historia y leyendas por bioma
- [ ] Sin regressions en sistemas existentes (specs INT-001 a INT-008 siguen funcionando)
- [ ] `jardvoxel-survival.html` abre sin errores en consola

---

## Notas Técnicas

- Todos los cambios son en `jardvoxel-survival.html` y módulos `core/jardvoxel-survival-*.js`
- No se crean nuevos archivos — se completa el cableado de sistemas existentes
- Todos los sistemas AI deben tener fallback local (funcionar sin AI server)
- Mantener el patrón existente: `if (this.systemName)` guards en todos los updates
- El quest tracking debe ser O(activeQuests × objectives) por frame, no O(allQuests)
