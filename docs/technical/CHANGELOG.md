# JardVoxel — Changelog

## v7.0.2 — Hierarchical 7.0 Streaming + Integration ✅ (19 Julio 2026)

### SPEC-084: Hierarchical Streaming + 9 Layers ✅
- **HierarchicalStreaming** (nuevo, `core/jardvoxel-survival-streaming.js`):
  - `prewarm(pcx, pcz, radius)` — pre-calienta caches región/zona (radio clamp [1,32], LRU eviction, max 2048)
  - `setPlayerChunk(cx, cz)` — captura contexto jerárquico del jugador (continentId, regionType, zoneType)
  - `priorityBoost(cx, cz)` — descuento negativo para chunks que comparten contexto: SAME_CONTINENT=0.2, SAME_REGION=0.6, SAME_ZONE=0.4 (máx -1.2)
  - Integrado en `SurvivalWorld._tryAddChunkCandidate()` y bucle de update (refresh + prewarm en chunk-boundary crossing)
- **LayerSystem** (verificado, `core/jardvoxel-survival-layers.js`): 9 capas (terrain, micro_relief, surface_rocks, major_vegetation, minor_vegetation, natural_decoration, fauna, ambient_audio, dynamic_events), 4 tiers LOAD_PRIORITY, API generateAll/generateUpTo/generateLayer/setLayerEnabled/getLayersByPriority/getLayerInfo
- **Tests**: 27 tests en `tests/hierarchical-streaming.test.js`

### SPEC-085: Integration, Migration & Verification ✅
- **Migración HTML**:
  - `jardvoxel-survival.html` — `settings.hierarchicalGeneration: true` + `useHierarchy` pasado a `SurvivalWorld`
  - `jardvoxel-zen.html` — ya migrado (ZenGame activa jerarquía en zen classic)
  - `jardvoxel-zen2.html` — intencionalmente flat (zen2 mode, por diseño)
- **Backward compatibility**: v6.0 chunks cargan, toggle on/off, re-enable funciona
- **Performance**: chunk gen < 50ms, prewarm < 200ms, priorityBoost < 0.1ms/call
- **Tests**: 16 tests en `tests/hierarchical-integration.test.js`
- **PRD 7.0**: ✅ Completado (11/11 specs)

### Métricas finales v7.0
- **+90 tests nuevos** (986 → 1076 passing) en 3 archivos:
  - `tests/world-hierarchy.test.js` — 47 tests (niveles 1-6)
  - `tests/hierarchical-streaming.test.js` — 27 tests (streaming + layers)
  - `tests/hierarchical-integration.test.js` — 16 tests (integración e2e)
- **Sin regresiones**: 6 fallos pre-existentes en `ai-server.test.js` (SPEC-072, no relacionados)
- **Suite total**: 1076/1082 pasando (47/48 archivos)
- **PRD-JARDVOXEL-7.0-HIERARCHICAL.md**: ✅ Completado

---

## v7.0.1 — Hierarchical 7.0 Tests + Microsector Integration (19 Julio 2026)

### SPEC-081: Hierarchical Level 1-2 (World + Continent) ✅
- **Tests** en `tests/world-hierarchy.test.js` (16 tests):
  - WorldIdentity: determinismo, campos requeridos, effectiveSeaLevel, getContinentValue/Id, isOcean, archipelago mode, gradiente latitudinal, getInfo, performance < 1ms
  - ContinentGenerator: propiedades únicas por continente, determinismo, ocean/land props, coherencia (75% vecinos mismo id), bordes orgánicos (blendFactor), integración con HierarchicalChunkGenerator
- Implementación pre-existente (SPEC-100/101) verificada, no modificada.

### SPEC-082: Hierarchical Level 3-4 (Region + Zone) ✅
- **Tests** en `tests/world-hierarchy.test.js` (15 tests):
  - RegionGenerator: tipos válidos (REGION_TYPES), ocean/land, coherencia (40%+ vecinos), cache determinista, performance < 0.5ms
  - ZoneGenerator: tipos válidos (ZONE_TYPES), validez por región (ZONE_VALIDITY), heightAdjustment acotado [-30, 30], cache, performance < 0.5ms
- Implementación pre-existente (SPEC-102/103) verificada, no modificada.

### SPEC-083: Hierarchical Level 5-6 (Chunk + Microsector) ✅
- **Integración Level 6 al pipeline jerárquico**:
  - `HierarchicalChunkGenerator` ahora instancia `MicrosectorGenerator` como `this.microsectorGen`
  - `generateChunkHierarchical()` en `features.js` invoca `microsectorGen.generateMicrosectors()` después de `generateStructures()`, colocando flores/hongos/rocas/musgo/bambú usando `findSurfaceY()` existente
- **Refactor de `microsectors.js`**: `BIOME_DECORATION`, `ZONE_DECORATION_MULT` y `SECTORS_PER_SIDE` convertidos a lazy getters (`getBiomeDecoration()`, `getZoneDecorationMult()`, `sectorsPerSide()`) para resolver dependencia circular (TDZ) con `world-hierarchy.js`
- **Tests** en `tests/world-hierarchy.test.js` (16 tests):
  - HierarchicalChunkGenerator: construcción 6 niveles, contexto completo, heightMap acotado [1, 380], determinismo (cache), getHeightAt, clearCache, compatibilidad con `WorldGenPipeline.enableHierarchy/disableHierarchy`, performance < 50ms
  - MicrosectorGenerator: construcción, getMicroElevation ±2 enteros, placements válidos (12 block types) y dentro del chunk, determinismo, integración end-to-end con `generateChunkHierarchical`, fallback cuando context=null
- **Patrón detectado**: `circular-dep-tdz` — documentado en wiki.

### Métricas
- **+47 tests nuevos** (986 → 1033 passing)
- **Sin regresiones**: 6 fallos pre-existentes en `ai-server.test.js` (SPEC-072, no relacionados)
- **Suite total**: 1033/1039 pasando (45/46 archivos)

---

## v8.0.0 — Zen Unified (29 Junio 2026)

### SPEC-099: Sistema de Bienestar y Relajacion v7.0 ✅
- **ChillTuneEngine** — Musica ambient deep space (Interstellar/Blade Runner style)
  - LFO modula FRECUENCIA (no volumen) — shimmer sutil, no pulsaciones
  - BPM ultra-lentos: 24-40 (contemplation 24, idle 26, caves 28, night 30, exploring 36)
  - Silencio extremo: 75-98% rest probability
  - Solo escala Lydian (F Lydian) para todos los biomas
  - Notas ultra-espaciadas: 16-32 barras intervalo, 24-48 beats duracion
  - Reverb profundo: delay 0.6s, feedback 0.4, filtro 2400 Hz
  - Crossfade 6s entre biomas
  - Master volume 0.18, melodia 0.025-0.03
- **AmbientSoundManager** — Sonidos de bioma 3D posicional
  - 10+ perfiles de bioma con soundscape layers (near/mid/far)
  - Ciclo de fauna: dawn/day/dusk/night
  - Reverberacion natural por bioma
- **BiomeIdentityManager** — Identidad visual, sonido y fauna por bioma
- **KomorebiSystem** — Luz filtrada por canopy, particulas de luz
  - Raycast densidad canopy
  - Efectos de audio/musica komorebi
- **ResonanceSystem** — Tracking de comportamiento del jugador
  - PlayerProfile, analisis de comportamiento
  - Modificadores de generacion, eventos especiales
- **MeditationSpaceGenerator** — 6 tipos de espacios de meditacion
  - Vista, Zen Garden, Cascada, Lago Espejo, Templo, Bamboo Grove
  - Deteccion de descubrimiento, efectos especiales
- **LivingWorldSystem** — Mundo vivo reactivo
  - Arboles → Aves, Restauracion → Biodiversidad
  - Caminos → Aldeanos, Lagos → Peces
- **ExplorationJournal** — Registro automatico de momentos
  - UI con tabs (Biomas, Wellness, Hitos, Stats)
  - Persistencia localStorage

### Zen Implementation — 7 sesiones de fixes (29 Junio 2026)

#### Sesion 1 (12:15) — Fix musica ambient
- LFO: volumen → frecuencia en `jardvoxel-survival-chilltune.js`
- Drone: triangle → sine, volumen constante 0.03
- BPM: 24-40, silencio 75-98%, crossfade 6s
- Solo escala Lydian, reverb profundo

#### Sesion 2 (13:00) — Quick wins batch
- `_addJournalEntry`: ahora llama `journal.addEntry()`
- `_animateWater`: eliminado (dead code)
- `showControlsHint`: toggle añadido + wired en settings
- Indicador de clima: labels en español, se oculta cuando despejado
- WebGL check: test antes de init con mensaje claro

#### Sesion 3 (13:54) — Gaps restantes
- `_applySettings`: aplica toggles visuales (FPS, coords, minimap, reloj, controles)
- `_applySettings()`: se llama al final de `initUI()` para estado inicial
- Pixel ratio: 1.0 → 1.5 para mayor nitidez en Retina/HiDPI
- Loading screen: contador de progreso animado
- Module errors: detecta errores de import y muestra mensaje especifico

#### Sesion 4 (15:49) — WorldIdentity Realista
- Edades geologicas: Paleogene, Neogene, Quaternary (basado en Cenozoico real)
- 8 eventos historicos reales del Cuaternario
- Parametros terrestres: 68-74% oceano, 5-9 continentes, 20.5-26.5° axial
- Gradiente latitudinal: Ecuador cálido → Polos fríos
- Sistema anti-duplicados: eventos historicos unicos por mundo
- Documentacion: `docs/WORLD-IDENTITY-REALISM.md`

#### Sesion 5 (19:22) — Bug fixes: clouds, canopy fog, fog getter
- Clouds frozen: removida linea que sobreescribia `cloudPlanes = []`
- Canopy fog broken: cambiado `this.fog` → `this.fogManager`
- VolumetricFog: añadido `get fog()` getter para exponer `_normalFog`

### Perfil Patagonia
- `core/jardvoxel-patagonia.js` — Perfil geografico real (43°S-56°S)
- Biomas con nombres locales: Estepa Patagonica, Bosque Subantartico, Selva Valdiviana
- Cordillera de los Andes con picos hasta 130 bloques
- Seed fijo: 142857
- `PatagoniaProfile` class con `applyPatagoniaToGenerator()`

### Zen Garden HTML
- `jardvoxel-zen.html` (390 lineas) — UI wellness minimalista + imports
- `core/jardvoxel-zen-game.js` (1336 lineas) — ZenGame class
  - ~25 imports de core/ (vs 55 del survival)
  - Sin mobs, sin combate, sin muerte, sin hambre
  - Modo creativo: bloques infinitos, break instantaneo
  - Touch controls nativos
  - Settings con tabs: Video, Audio, Controles, Wellness
  - Journal panel (tecla J)
  - Auto-hide UI tras inactividad
- `core/jardvoxel-zen-touch.js` (197 lineas) — TouchJoystick + TouchControls
- `index.html` — Menu principal con selector de modo

### Deploy
- `vercel.json` — COOP/COEP headers para SharedArrayBuffer
- Deploy a Vercel

### Documentacion
- `docs/PRD-JARDVOXEL-ZEN-UNIFIED.md` — PRD Zen v8.0.0 (372 lineas)
- `docs/ZEN-IMPLEMENTATION-STATUS.md` — Estado implementacion (294 lineas)
- `docs/WORLD-IDENTITY-REALISM.md` — World identity realista (212 lineas)
- `REFACTOR-SUMMARY.md` — Refactorizacion visual premium
- `REFACTOR-CORE.md` — Refactorizacion del core
- `BUGFIX-WATER-MANAGER.md` — Bugfix water manager
- `BUGFIXES-COMPLETE.md` — Bugfixes completos

---

## v7.0.0 — World Hierarchy & Organic Terrain (28-29 Junio 2026)

### SPEC-100: World Identity ✅
- `WorldIdentity` class con parametros terrestres realistas
- Edades geologicas, eventos historicos, gradiente latitudinal
- Archivo: `core/jardvoxel-survival-world-hierarchy.js`

### SPEC-101: Continent Generator ✅
- Generacion jerarquica: Continente → Region → Zona → Chunk
- `ContinentGenerator` con Voronoi cells

### SPEC-102: Region Generator ✅
- `RegionGenerator` con bioma blending por region

### SPEC-103: Zone Generator ✅
- `ZoneGenerator` con features locales

### SPEC-104: Hierarchical Chunk ✅
- Chunk generation integrada con jerarquia

### SPEC-105: Microsectors ✅
- `MicrosectorSystem` para detalle fino

### SPEC-106: Layer System ✅
- `LayerSystem` con capas geologicas

### SPEC-107: Streaming ✅
- `StreamingSystem` para carga/descarga dinamica

### SPEC-108: Landmarks ✅
- `LandmarkGenerator` con hitos naturales

### SPEC-109: Ecosystems ✅
- `EcosystemSystem` con flora/fauna interconectada

### SPEC-110: Contextual Generation ✅
- `ContextualGenerator` con generacion adaptativa

### Sistemas Organic Terrain
- `VoronoiBiomes` — Biomas con fronteras Voronoi naturales
- `PoissonVegetation` — Distribucion Poisson de vegetacion
- `HydrologySystem` — Rios, lagos, erosion hidrica
- `InstancedRenderer` — Renderizado instanciado para vegetacion
- `WorkerPool` — Multi-worker para generacion de chunks
- `CellularNoise` — Ruido celular para patrones organicos
- `TreePersonalitySystem` — Personalidad de arboles (21K lineas)
- `MicrosectorSystem` — Sectores micro para detalle

### Nuevos modulos core (v7.0)
- `jardvoxel-survival-world-hierarchy.js` (39K)
- `jardvoxel-survival-hydrology.js` (19K)
- `jardvoxel-survival-tree-personality.js` (21K)
- `jardvoxel-survival-voronoi.js` (7K)
- `jardvoxel-survival-poisson.js` (3K)
- `jardvoxel-survival-instanced.js` (9K)
- `jardvoxel-survival-microsectors.js` (6K)
- `jardvoxel-survival-streaming.js` (4K)
- `jardvoxel-survival-worker-pool.js` (4K)
- `jardvoxel-survival-landmarks.js` (11K)
- `jardvoxel-survival-ecosystems.js` (9K)
- `jardvoxel-survival-contextual.js` (12K)
- `jardvoxel-survival-layers.js` (28K)

---

## v6.0.0 — Advanced Noise Generation & Coherent Biomes (28 Junio 2026)

### SPEC-091: Simplex Noise Core ✅
- **Reemplaza PerlinNoise3D** con SimplexNoise para mejor performance
- `SimplexNoise` class con `noise2D`, `noise3D`, `fbm2D`, `fbm3D`
- Gradientes optimizados (12 vectores para 3D)
- Permutation table seeded con Fisher-Yates shuffle
- Performance: O(n²) en 3D vs O(n³) de Perlin
- Menos artefactos direccionales, patrones más orgánicos
- Archivo: `core/jardvoxel-survival-noise.js` (líneas 88-285)

### SPEC-092: Domain Warping System ✅
- **DomainWarper** class rompe regularidad del ruido
- `warp2D`, `warp3D`, `warp2DRecursive` para distorsión progresiva
- Warp independiente por capa (continentalness: 80, erosion: 40, etc.)
- Coastlines irregulares con bahías y penínsulas naturales
- Montañas con formas orgánicas (no conos perfectos)
- Biomas con fronteras naturales (no líneas rectas)
- Archivo: `core/jardvoxel-survival-noise.js` (líneas 287-341)

### SPEC-093: Calibrated Noise Parameters ✅
- **NOISE_CONFIGS** con parámetros calibrados por capa
- 7 capas: continentalness, erosion, peaksValleys, weirdness, temperature, humidity, density3D
- Cada capa con octaves, persistence, lacunarity, scale optimizados
- Reemplaza parámetros hardcoded por configuración centralizada
- Archivo: `core/jardvoxel-survival-noise.js` (líneas 343-411)

### SPEC-094: Multi-Spline Terrain Shaping ✅
- **TerrainSplines** class para modelado complejo de terreno
- Splines para continentalness, erosion, peaksValleys
- Interpolación suave tipo Minecraft 1.18+ (Hermite splines)
- Rango continentalness: -1.0 (océano profundo) → 1.0 (montañas)
- Rango erosion: -1.0 (valles) → 1.0 (picos)
- Archivo: `core/jardvoxel-survival-noise.js` (líneas 413-470)

### SPEC-095: Smooth Biome Transitions (Biome Blending) ✅
- **BiomeBlender** class elimina fronteras duras entre biomas
- Transiciones suaves de 8-16 bloques
- Cada posición calcula blend de múltiples biomas con pesos
- `getBiomeWeights(x, z)` retorna `{ plains: 0.6, forest: 0.3, meadow: 0.1 }`
- Normalización automática (suma de pesos = 1.0)
- Archivo: `core/jardvoxel-survival-noise.js` (líneas 472-548)

### SPEC-096: Biome-Specific Terrain Modulation ✅
- **BIOME_TERRAIN_MODULATION** config por bioma
- Cada bioma aplica noise adicional para características únicas
- Mountains: ridged noise (crestas pronunciadas, amplitude 35)
- Jungle: billowy noise (colinas redondeadas, amplitude 18)
- Desert: dunes noise (dunas sinuosas, amplitude 12)
- 19 biomas con modulación específica
- Archivo: `core/jardvoxel-survival-noise.js` (líneas 550-596)

### SPEC-097: Coherent Feature Distribution ✅
- **FeaturePlacer** class para distribución natural de features
- Árboles en clusters naturales (no grid uniforme)
- `BIOME_TREE_CONFIG` con densidad y clustering por bioma
- Jungle: 12% densidad, cluster radius 8, min cluster size 3
- Forest: 8% densidad, cluster radius 6, min cluster size 2
- Plains: 2% densidad, árboles solitarios
- Archivo: `core/jardvoxel-survival-noise.js` (líneas 598-711)

### SPEC-098: Hydraulic Erosion Simulation ✅
- **HydraulicErosion** class para erosión post-generación
- Simulación de agua erosionando terreno
- Parámetros: iterations, erosionRate, evaporationRate, sedimentCapacity
- Genera valles naturales, cañones, cauces de ríos
- Opcional (puede ser costoso en performance)
- Archivo: `core/jardvoxel-survival-noise.js` (líneas 713-760)

### Integración en WorldGenPipeline
- `jardvoxel-survival-engine.js` importa todos los componentes v6.0
- `import { SimplexNoise, DomainWarper, NOISE_CONFIGS, TerrainSplines, BiomeBlender, BiomeTerrainModulator, FeaturePlacer } from './jardvoxel-survival-noise.js'`
- Reemplaza llamadas a PerlinNoise3D por SimplexNoise
- Aplica domain warping antes de samplear cada capa
- Evalúa splines para altura final
- Calcula biome weights con BiomeBlender
- Aplica modulación de terreno por bioma

### Impacto Visual
- ✅ Coastlines irregulares y naturales (bahías, penínsulas, islas)
- ✅ Montañas orgánicas con formas complejas
- ✅ Biomas con transiciones suaves (no líneas rectas)
- ✅ Terreno coherente y natural
- ✅ Features (árboles) en clusters realistas
- ✅ Performance mejorado (Simplex O(n²) vs Perlin O(n³))

### Documentación Actualizada
- `docs/WORLD-GENERATION.md` — Sistema v6.0 completo
- `docs/README.md` — Estado v6.0, 74 specs completadas
- `docs/PRD-NOISE-GENERATION-6.0.md` — PRD original (849 líneas)

---

## v5.0.0-RC3 — LLM Testing Harness (SPEC-H001 through H005)

### SPEC-H005: Fix _buildPrompt + AI Server Integration
- **Bug H-007 fixed:** `_buildPrompt` is now task-aware — no more "max 2 sentences" for JSON tasks
  - NPC dialogue: asks for JSON with text + options
  - Quests/Events: asks for ONLY valid JSON
  - Lore: asks for narrative text (max 3 sentences)
- **Bug H-008 fixed:** Eliminated context duplication in NPC dialogue and quest/event prompts
  - Context passed once via context object, not in prompt text
- `LLMInterface.setModel(model)` added for runtime model switching
- `generate()` accepts `options` parameter with `taskType` and `numPredict`
- `_buildSystemPrompt` is now task-aware for cloud API fallback
- `ai-server/package.json`: Added `test:llm` and `test:llm:benchmark` scripts

### SPEC-H001: Core Test Runner + Hard Gates
- `harness/runner.js` — PEV orchestrator with CLI (Plan → Execute → Verify)
- `harness/config.js` — Models, gates, thresholds, banned patterns, tone keywords
- `harness/prompt-builder.js` — Task-specific optimized prompts (independent from `_buildPrompt`)
- 40 test cases (10 per task × 4 tasks): NPC dialogue, quest, event, lore
- 6 hard gates: json-validator, token-counter, latency-checker, options-checker, repeat-detector, tone-checker
- `harness/reporters/` — JSON and Markdown report generation
- Results persisted to `harness/state/results/` with timestamp
- CLI: `node harness/runner.js --model gemma3:1b [--task <task>] [--num-predict <n>]`
- CLI: `node harness/runner.js --benchmark --models m1,m2,m3`
- Throttle of 2s between requests respected
- Ollama availability check before running
- Re-plan recommendation if fail rate > 30%

### SPEC-H003: Comparative Benchmark + Model Ranker
- `harness/reporters/comparative.js` — Benchmark runner, model ranker, comparative report
- Weighted scoring: 50% hard gates, 20% JSON validity, 15% latency, 15% options
- Per-task pass rates and best model per task
- Fallback order recommendation (best → worst)
- Comparative matrix in Markdown with per-task breakdown
- Results saved as `benchmark-{timestamp}.json` and `.md`
- CLI: `node harness/runner.js --benchmark --models gemma3:1b,qwen2.5:3b,gemma3:4b`

### SPEC-H002: Inferential Judges (LLM-as-Judge)
- `harness/judges/judge-engine.js` — 4 judges: creativity, coherence, engagement, lore accuracy
- Uses a more capable model (e.g. qwen2.5:3b) to evaluate smaller models
- Score 1-5 per criterion with justification
- Batch judging with throttle respect
- Aggregate scores: average per criterion + overall
- JSON parsing with fallback number extraction
- CLI: `node harness/runner.js --model gemma3:1b --judge qwen2.5:3b`

### SPEC-H004: Feedback Loop + Pattern Detector
- `harness/feedback-loop.js` — Pattern detection, degradation tracking, auto-switch recommendations
- Loads historical results (last 5 runs) from `harness/state/results/`
- Detects recurring gate failures (≥3x = pattern, ≥5x = critical, ≥10x = systemic)
- Detects tone violations (≥2x) and low judge scores (≥3x)
- Model degradation: quality drop >20% between runs triggers switch recommendation
- Auto-switch: pass rate <50% triggers immediate fallback recommendation
- Patterns saved to `harness/state/patterns.json`
- Decisions saved to `harness/state/decisions.json`
- CLI: `node harness/runner.js --model gemma3:1b --feedback`

## v5.0.0-RC2 — Living World Integration Complete

### SPEC-INT-001: Atmosphere & Sound Integration
- Added `setTimeOfDay(phase)` to `AmbientSoundManager` for day/night volume modulation
- Time phases: dawn (0.7x), day (1.0x), sunset (0.8x), night (0.5x)
- Integrated into game loop with `dayNight.time` → phase mapping

### SPEC-INT-002: ChillTune 2.0 Activation
- Upgraded `chilltune.tick()` → `chilltune.tickExtended()` with full context
- Passes: biome, weather, time phase, village proximity, cave status, combat
- Added `playStinger('new_biome')` on biome discovery
- Added `playStinger('structure_discover')` on structure discovery

### SPEC-INT-007: UI Overhaul 5.0
- Added DOM elements: dialogue panel, quest tracker, journal, toast container, biome indicator
- CSS styling for all new UI components with smooth transitions
- Rendering methods: `_renderToasts`, `_renderBiomeIndicator`, `_renderQuestTracker`, `_renderDialoguePanel`
- Journal system with tabbed filtering (all, biome, structure, civilization, lore)
- Keybind: `L` to toggle journal, `ESC` to close
- Journal entries saved/loaded with game state
- Biome discovery adds journal entry automatically

### SPEC-INT-003: Narrative Structures Integration
- `generateStructures` now maps biome+roll to `STRUCTURE_TYPES` and calls `generateNarrativeStructure`
- Narrative metadata attached to chunks via `chunk.narrativeStructures`
- Structure proximity detection in game loop (1s scan interval, 16-block radius)
- Discovery triggers: toast, journal entry, stinger
- Discovered structures saved/loaded with game state
- Extended biome coverage: mountains, forest, taiga, cherry grove structures

### SPEC-INT-004: AI Server & NPC Integration
- NPC memory entries auto-created on first villager encounter
- `npcMemory.createNPC()` called with villager name, biome, profession
- Conversation system wired to dialogue panel (INT-007 DOM)
- Trade UI only opens as fallback when conversation system unavailable
- Added `npm run ai-server` and `npm run ai-server:dev` scripts
- Journal entry added on NPC first encounter

### SPEC-INT-005: Quest Tracker & Event Notifications
- Quest tracker DOM renders active quests with progress bars
- Quest creation/completion/failure events emit toasts and journal entries
- Event manager notifications (start/end) emit toasts and journal entries
- Quest progress updated in real-time from `questManager.getActiveQuests()`

### SPEC-INT-006: Civilization Linkage & Lore Discovery
- Structure discovery checks nearby civilization structures (50-block radius)
- `civilizationSystem.discoverStructure()` called on proximity match
- Civilization lore added to journal on discovery
- Book generation via `loreGenerator.generateBook()` for structures with books
- Journal entries categorized: biome, structure, civilization, lore

### Test Results
- All 731 existing tests pass (no regressions)
- No new tests required — integration is wiring-only, modules already tested

## v5.0.0-RC1 — 28 Junio 2026 — Integration PRD (PRD-JARDVOXEL-5.0-INTEGRATION)

### SPEC-INT-008: Documentación y Registro de Specs
- Creada carpeta `docs/specs/pending/` con 8 specs de integración:
  - SPEC-INT-001 — Integración de Atmósfera y Sonido (6h)
  - SPEC-INT-002 — Activación de ChillTune 2.0 (4h)
  - SPEC-INT-003 — Integración de Estructuras Narrativas (8h)
  - SPEC-INT-004 — Integración de AI Server y NPCs (12h)
  - SPEC-INT-005 — Integración de Quests y Eventos Emergentes (10h)
  - SPEC-INT-006 — Integración de Civilizaciones Antiguas y Lore (10h)
  - SPEC-INT-007 — UI Overhaul 5.0 (12h)
  - SPEC-INT-008 — Documentación y Registro de Specs (4h)
- Creada carpeta `docs/specs/completed/` con índice de SPEC-070 a SPEC-090.
- Actualizado `core/README.md` con sección "Living World".
- Aprobado `docs/PRD-JARDVOXEL-5.0-INTEGRATION.md` (estado: Aprobado).

### Plan de implementación de integración
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

## v5.1.0 — 27 Junio 2026 — Core Test Suite (163 tests)

### Testing del Core Engine
- **Vitest 2.1.9** + jsdom como framework de testing
- **163 tests** en **9 archivos** cubriendo los modulos core:
  - `blocks-registry.test.js` (22 tests) — BLOCK, MC_BLOCKS, colores, nombres, hardness, placeable blocks
  - `engine.test.js` (31 tests) — PRNG, PerlinNoise3D, Spline, WorldGenPipeline, VoxelChunk, GreedyMesher
  - `crafting.test.js` (12 tests) — RECIPES, CraftingManager (shaped/shapeless, normalizacion)
  - `health.test.js` (21 tests) — HealthHungerSystem (damage, hunger, regen, drowning, starvation, serialize)
  - `tools.test.js` (26 tests) — ToolItem, EquipmentManager (durability, mining speed, armor reduction)
  - `furnace.test.js` (17 tests) — FurnaceEntity, FurnaceManager (smelting, fuel, cook time)
  - `achievements.test.js` (13 tests) — ACHIEVEMENTS, AchievementManager (unlock, stats, serialize)
  - `gameplay.test.js` (11 tests) — Inventory (hotbar, addBlock, creative/survival)
  - `save.test.js` (10 tests) — SaveManager (IndexedDB, save/load world/chunks, autosave)
- **Mocks:** Three.js (Vector3, Group, Mesh, Scene, etc.), localStorage, indexedDB
- **Config:** `vitest.config.js` con alias de Three.js, `tests/setup.js` con mocks globales
- **Dependencias:** symlink a `jardfruit-pro/node_modules` (vitest + jsdom compartidos)
- Nuevo archivo: `docs/TESTING.md` con documentacion completa de la suite
- Actualizado: `docs/README.md` (estructura, stack, seccion de testing, version)
- Actualizado: `core/README.md` (seccion de testing)

## v5.0.2 — 26 Junio 2026 — Procedural Player Body (SPEC-067)

### SPEC-067: Procedural Player Body with Third-Person View
- **CharacterGenerator**: generates unique humanoid body from seed using PRNG (Xorshift128+)
  - 12 skin tones, 9 hair colors, 6 eye colors, 10 shirt colors, 8 pants colors, 5 shoe colors
  - 6 hair styles: bald, short, long, mohawk, bun, crew
  - 3 body types: slim, normal, stocky (varying torso/arm/leg width)
  - Accessories: glasses (30%), hat (20%), cape (15%) with flutter animation
  - Facial features: eyes, eyebrows, optional beard (35%)
  - ~37 million unique combinations
- **CharacterAnimator**: walk cycle (sinusoidal arm/leg swing), idle breathing, mining arm swing, cape flutter
- **ThirdPersonCamera**: camera behind player at 3.5 blocks distance, collision-aware (raycast against solid blocks), smooth lerp
- **PlayerController integration**: `initBody()`, `toggleView()`, `_mining` flag for arm animation
- **View toggle**: press `V` to switch between first-person (head hidden) and third-person (full body visible)
- **Save/Load**: `characterSeed` persisted in savegame, body regenerated on load
- **Controls hint** updated to include `V vista`
- New files: `core/jardvoxel-survival-character.js` (~330 lines), `core/jardvoxel-survival-thirdperson.js` (~80 lines)
- Modified: `core/jardvoxel-survival-gameplay.js` (imports + PlayerController), `jardvoxel-survival.html` (import, initBody, V key, mining sync, save/load)
- PRD: `docs/PRD-PROCEDURAL-BODY.md`

## v5.0.1 — 26 Junio 2026 — Mobile Menu System for jardvoxel.html (SPEC-063)

### SPEC-063: Game Menu + Settings Expansion — jardvoxel.html
- **Main Menu** (`#main-menu`): pantalla inicial con título gradient, 3 botones (Jugar, Opciones, Créditos), versión + seed
- **Settings Menu** (`#settings-menu`) con 4 tabs funcionales:
  - **Gráficos**: render distance (2-8), FOV (60-110), clouds toggle, fog toggle, shadows toggle, tone mapping toggle
  - **Audio**: volumen master (0-1), volumen efectos (0-1), volumen ambiente (0-1)
  - **Controles**: sensibilidad (0.5-4), invertir eje Y toggle
  - **Gameplay**: dificultad (Pacífico/Fácil/Normal/Difícil), auto-save (off/30s/60s/120s/300s), mostrar FPS/coords/minimapa/reloj/hint toggles
- **Credits Screen** (`#credits-screen`): versión, tecnologías (Three.js r160, Web Audio API, Vanilla JS, Web Workers), características, desarrollo
- **Pause Screen** actualizado: 3 botones (Continuar, Opciones, Menú Principal) con confirmación al salir
- **Settings object** expandido de 4 a 20+ opciones, persistido en `localStorage` (`jardvoxel-settings`)
- Todos los settings aplican en tiempo real (sliders con evento `input`)
- **CSS**: `.toggle-switch` (custom CSS switch), `.settings-tabs`, `.tab-btn`, `.tab-content`, `.setting-row`
- **Responsive HUD**:
  - Mobile (<600px): hotbar 38px, nombres ocultos, inventario 4 columnas, minimap 80px, tabs scroll horizontal
  - Tablet (600-1024px): hotbar 44px, inventario 6 columnas
- Todos los botones mínimo 44px touch area, `touch-action: manipulation`
- Navegación fluida: main-menu → settings → volver, pause → settings → volver, main-menu ← pause con confirmación
- `_initMenuSystem()`, `_wireUpSettings()`, `_applyAllSettings()`, `_applyHUDVisibility()`, `_loadSettings()`, `_saveSettings()`
- `initControls()` modificado: pause screen solo se muestra si `gameStarted === true`
- Init flow: loading → main-menu (en vez de pause-screen directo)

## v5.0.0 — Touch Controls, Main Menu, Settings Expansion, Credits, Responsive HUD

### SPEC-062: Touch Joystick Controls
- **TouchJoystick** class: floating virtual joystick with zone-based touch area, knob visual, normalized output `{ x, y }`
- Left joystick → movement (maps to WASD with proportional intensity)
- Right joystick → camera look (yaw/pitch with configurable sensitivity)
- 5 touch buttons: Jump (↑), Break (⛏), Place (+), Sprint (>>), Inventory (INV)
- Multi-touch support: move + look simultaneously (2 fingers)
- Toggle with key `J` for desktop testing
- Auto-detection of touch devices (`'ontouchstart' in window` or `navigator.maxTouchPoints > 0`)
- Dead zone (10px default) to prevent drift
- Toast notification on toggle ("Joysticks: ON/OFF")
- Persistence in `localStorage` (`jardvoxel_touch_controls`)
- Viewport meta updated: `maximum-scale=1.0, user-scalable=no, viewport-fit=cover`
- Game loop modified to allow updates without `pointerLock` when touch is active
- `PlayerController.update()` modified to accept analog `touchInput` parameter
- CSS: `.joystick-base` (120px), `.joystick-knob` (60px), `.touch-btn` (70px), all with `touch-action: none`
- Responsive touch button sizes for mobile (< 600px): 60px jump/break/place, 52px sprint/inv

### SPEC-063: Game Menu + Settings Expansion
- **Main Menu** (`#main-menu`): title with gradient, 3 buttons (Jugar, Opciones, Creditos), version + seed info
- **Credits Screen** (`#credits-screen`): version, technologies (Three.js r160, Web Audio API, Vanilla JS, Web Workers), features list, development credit
- **Settings Menu** with 4 tabs:
  - **Graficos**: render distance (2-8), FOV (60-110), clouds toggle, fog toggle, shadows toggle, tone mapping toggle
  - **Audio**: master volume, SFX volume, ambient volume, music volume, dynamic music toggle
  - **Controles**: sensitivity (0.5-4), invert Y toggle, touch joysticks (auto/on/off), dead zone (5-30px), joystick size (80-160px), button size (50-90px)
  - **Gameplay**: difficulty (Pacifico/Facil/Normal/Dificil), auto-save (off/30s/60s/120s/300s), show FPS/coords/minimap/clock/hint toggles
- **Pause Screen** updated: 4 buttons (Continuar, Logros, Opciones, Menu Principal)
- Settings object expanded from 4 to 20+ options, persisted in `localStorage` (`jardvoxel-settings`)
- All settings apply in real-time (no restart required)
- CSS: `.settings-tabs`, `.tab-btn`, `.tab-content`, `.toggle-switch` (custom CSS switch), `.setting-select`
- Tab switching with scroll horizontal on mobile

### Responsive HUD
- **Mobile (< 600px)**: hotbar slots 38px, item names hidden, minimap 80px, inventory 4 columns (60px), craft slots 40px, settings 90vw max 400px, tabs scroll horizontal, touch buttons smaller (60px/52px)
- **Tablet (600-1024px)**: hotbar slots 44px, inventory 6 columns (65px)
- All interactive elements minimum 44x44px touch area
- `touch-action: manipulation` on buttons, `user-select: none` on game UI

### Additional HUD Elements
- **Dimension Indicator**: shows Overworld/Nether in top-right area
- **Shield HUD**: durability bar + text when shield equipped
- **Potion Effects HUD**: active potion effect icons with countdown timers
- **Achievement Toast**: slide-in notification from right edge

### Module Architecture (28 JS files)
- `jardvoxel-survival.html` (3887 lines) — main game file, imports 22 modules
- `jardvoxel-survival-engine.js` — world generation core (splines, noise, biomes, caves, aquifers)
- `jardvoxel-survival-mesher.js` — block definitions, colors, names, hardness, greedy meshing
- `jardvoxel-survival-features.js` — trees, structures, vegetation, ore veins
- `jardvoxel-survival-gameplay.js` — player controller, inventory, day/night, audio, physics
- `jardvoxel-survival-crafting.js` — crafting manager (shaped + shapeless recipes)
- `jardvoxel-survival-save.js` — IndexedDB save/load system
- `jardvoxel-survival-particles.js` — particle system (block break, place, walk dust)
- `jardvoxel-survival-mobs.js` — mob manager (passive + hostile mobs, AI, combat)
- `jardvoxel-survival-health.js` — health/hunger system (10 hearts, 10 drums)
- `jardvoxel-survival-furnace.js` — furnace manager (fuel, smelting recipes)
- `jardvoxel-survival-weather.js` — weather manager (rain, snow, thunder, clear)
- `jardvoxel-survival-tools.js` — tools + armor, equipment manager, durability
- `jardvoxel-survival-enchanting.js` — XP manager, enchant manager, XP orbs
- `jardvoxel-survival-villagers.js` — villager NPCs, trading manager, 4 professions
- `jardvoxel-survival-fishing.js` — fishing manager (5-state machine, bobber, catch table)
- `jardvoxel-survival-nether.js` — nether generator, portal manager, nether blocks
- `jardvoxel-survival-redstone.js` — redstone manager (power propagation, BFS, lever, piston)
- `jardvoxel-survival-chilltune.js` — procedural chiptune music engine (527 lines)
- `jardvoxel-survival-brewing.js` — brewing manager, potion effects (484 lines)
- `jardvoxel-survival-shields.js` — shield manager, shield item, blocking mechanics (216 lines)
- `jardvoxel-survival-achievements.js` — achievement manager, 30 achievements (234 lines)
- `jardvoxel-survival-anvil.js` — anvil manager, repair/rename/combine (225 lines)
- `jardvoxel-survival-map.js` — map manager, cartography, compass (277 lines)
- `jardvoxel-survival-worker.js` — web worker for chunk generation
- `jardvoxel-engine.js` — original engine (used by `jardvoxel.html`)
- `jardvoxel-worker.js` — original web worker (used by `jardvoxel.html`)

### PRDs Referenced
- `docs/PRD-TOUCH-JOYSTICK.md` — Touch joystick design (SPEC-062)
- `docs/PRD-MOBILE-MENU.md` — Mobile playability + game menu (SPEC-062 + SPEC-063)

## v4.2.0 — ChillTune Music, Brewing, Shields, Achievements, Anvil, Map & Cartography

### SPEC-057: ChillTune Music Engine
- **ChillTuneEngine**: procedural 8-bit chiptune music using Web Audio API (oscillators + filters + LFOs)
- 5 modal scales: Dorian, Aeolian, Lydian, Phrygian, Pentatonic
- 7 game states with unique musical config: exploring (60 BPM Dorian), building (65 BPM Lydian), mining (55 BPM Aeolian), combat (70 BPM Phrygian), night (50 BPM Aeolian), underwater (52 BPM Dorian), idle (45 BPM Pentatonic)
- 3-layer synthesis: drone (continuous root note with LFO), melody (weighted random degree selection), arpeggio (building state only)
- Smooth crossfade transitions (3-8s) between states — no abrupt cuts
- Reverb node for spatial depth, breath LFO for organic feel
- Scheduler with lookahead (30ms timer, 150ms schedule-ahead)
- Independent music volume control (default 0.35), persisted in localStorage
- Zero external dependencies — pure Web Audio API synthesis
- `jardvoxel-survival-chilltune.js` (527 lines)

### SPEC-062: Brewing & Potions
- 15 new blocks/items (IDs 126-140): Brewing Stand, Glass Bottle, Cauldron, Water Bottle, Awkward Potion, 7 potion types, Splash Potion, Blaze Powder, Sugar
- **BrewingManager**: 3-stage brewing system:
  - Stage 1: Water Bottle + Nether Wart → Awkward Potion
  - Stage 2: Awkward Potion + ingredient → Specific Potion (7 recipes)
  - Stage 3: Potion + Gunpowder → Splash Potion
- **PotionEffectManager**: 7 potion effects with apply/remove/tick callbacks:
  - Speed (180s, +20% movement), Strength (180s, +3 damage), Instant Healing (4 HP), Night Vision (180s), Fire Resistance (180s), Regeneration (45s, 1 HP/s), Water Breathing (180s)
- Brewing Stand crafting: cobblestone + blaze rod
- Cauldron crafting: 7 iron ingots
- Blaze Powder from blaze rods, Sugar from bamboo
- `jardvoxel-survival-brewing.js` (484 lines)

### SPEC-063: Shields & Combat Defense
- 2 new blocks (IDs 151-152): Shield, Banner
- **ShieldItem**: durability tracking (336 max), banner color customization, serialize/deserialize
- **ShieldManager**: blocking mechanics with 120-degree frontal cone, shield disable on axe hit (10% chance, 5s disable), shield bash (2.0 range, 3.0 knockback)
- Speed multiplier 0.5 while blocking
- Shield crafting: 6 planks + 1 iron ingot
- Banner crafting: 6 wool
- `jardvoxel-survival-shields.js` (216 lines)

### SPEC-064: Achievements System
- 30 achievements across 8 categories: Mining (4), Building (3), Combat (4), Exploration (3), Crafting (5), Survival (4), Farming (2), Redstone (2), Brewing (2), Shields (2)
- **AchievementManager**: stat tracking (blocksBroken, blocksPlaced, mobsKilled, distanceTraveled, foodsEaten, cropsHarvested, fishCaught, potionsBrewed, potionsDrunk, hitsBlocked)
- Toast notification queue with slide-in animation
- Achievement persistence via serialize/deserialize for save system
- `jardvoxel-survival-achievements.js` (234 lines)

### SPEC-065: Anvil & Item Repair
- 1 new block (ID 153): Anvil
- **AnvilManager**: 3 operations:
  - Rename: custom name (max 30 chars), 1 XP level cost
  - Material repair: 25% max durability per material unit, XP cost = material count
  - Tool combination: merge durability + 10% bonus, merge enchantments
- Anvil damage states (0-2) with 25 max uses
- Anvil fall damage (2-6 HP) when dropped on entities
- Repair materials: Wood→Planks, Stone→Cobblestone, Iron→Iron Ingot, Diamond→Diamond Ore
- Anvil crafting: 3 iron ingots top + 1 center + 3 bottom (shaped)
- `jardvoxel-survival-anvil.js` (225 lines)

### SPEC-066: Map & Cartography
- 3 new blocks (IDs 154-156): Map, Compass, Cartography Table
- **MapManager**: map data with RGBA pixel buffer, 4 tier sizes (128/256/512/1024 blocks)
- Block color mapping for 20+ block types in map rendering
- Exploration tracking: unexplored areas show as black, updates every 4 blocks moved
- Compass crafting: 4 iron ingots + redstone (cross pattern)
- Map crafting: 8 paper + compass
- Cartography Table crafting: 4 planks + 2 paper
- Map upgrade via cartography table (tier scaling)
- `jardvoxel-survival-map.js` (277 lines)

### Bug Fixes
- All 10 bugs from BUGS-FOUND.md audit resolved (3 critical, 3 moderate, 4 minor)
- BUG-001: Worker seed mismatch — fixed with init message pattern
- BUG-002: `_setBlockSafe` force parameter for structure placement
- BUG-003: Survival mode inventory check/decrement on block place
- BUG-004: `blockTypeToId` mud mapping added
- BUG-005: Greedy meshing cross-chunk boundary face optimization
- BUG-006: `VoxelChunk.isSolid` LAVA exclusion
- BUG-007: Spline tangents computed from neighbors
- BUG-008: Flying + ShiftLeft conflict resolved
- BUG-009: Redundant flower check removed
- BUG-010: 2D noise methods added to PerlinNoise3D, biome cache

## v4.1.0 — Tools, Armor, Enchanting, Villagers, Fishing, Nether, Redstone

### SPEC-051: Tools & Armor
- **ToolItem** class with durability tracking, mining speed multiplier, and damage bonus
- 4 tool types (pickaxe, axe, shovel, sword) × 4 material tiers (wood, stone, iron, diamond) = 16 tools (IDs 80-95)
- Tool materials with durability: Wood (60), Stone (130), Iron (250), Diamond (1560)
- Mining speed multiplier when correct tool matches block type (2x-10x)
- Sword damage bonus by material tier (1-8)
- Iron Armor set: Helmet (96), Chestplate (97), Leggings (98), Boots (99)
- **EquipmentManager**: tracks equipped tool and 4 armor slots
- Armor damage reduction: Helmet 8%, Chestplate 12%, Leggings 10%, Boots 4% (max 80% total)
- Durability consumption on block mine and player hit
- Tool/armor serialize/deserialize for save system
- Crafting recipes for all 16 tools + 4 armor pieces (shaped patterns)

### SPEC-052: Experience & Enchanting
- **XPManager**: XP orbs, leveling, orb physics with player attraction
- XP drops from ores: Coal (1), Iron (2), Gold (3), Diamond (5)
- XP orb entities with gravity, float-to-player within 3 blocks, auto-collect at 0.8 blocks
- Level system: XP cost = (level+1) × 10 per level
- New blocks: Enchanting Table (100), Lapis Block (101), Book (102)
- **EnchantManager**: 3 random enchantment options per roll
- 5 enchantments: Efficiency (mining +50%), Unbreaking (durability ×1.5), Sharpness (damage +3), Protection (reduction +10%), Fortune (ore drops +1)
- One enchantment per item (simplified)
- Enchanting Table crafting: obsidian + diamond + book
- Lapis Block crafting: 4 gold ingots (simplified)
- Book crafting: 3 bamboo + leather (shapeless)

### SPEC-053: Villager NPCs & Trading
- **Villager** entity with wandering AI, gravity, collision detection
- 4 professions: Farmer, Butcher, Blacksmith, Librarian — each with unique colors and hat
- Box-based villager models (body, head, hat) with Three.js
- **VillagerManager**: spawning, update loop, nearby villager detection
- **TradingManager**: trade UI with give/receive system
- Trade definitions per profession:
  - Farmer: wheat/seeds → emeralds, emeralds → bread
  - Butcher: raw meat → emeralds, emeralds → cooked meat
  - Blacksmith: iron/diamond → emeralds, emeralds → iron
  - Librarian: books ↔ emeralds
- New items: Emerald (103), Villager Spawn Egg (104)
- Trade execution with inventory check and item removal

### SPEC-054: Fishing System
- **FishingManager** with 5-state machine: Idle → Casting → Waiting → Biting → Reeling
- Raycast to find water block (up to 30 blocks forward)
- Bobber mesh with arc animation on cast, bobbing on water, dip on bite
- Random wait time 3-15 seconds before bite
- 1.5-second bite window to reel — miss if too late
- Weighted catch table: Raw Fish (60%), Pufferfish (15%), Bones (10%), Ink Sac (8%), String (5%), Leather (2%)
- New items: Fishing Rod (105), Raw Fish (106), Cooked Fish (107), Pufferfish (108), Ink Sac (109)
- Fishing Rod crafting: 3 sticks diagonal + 2 string
- Fish cooking recipe: Raw Fish → Cooked Fish in furnace

### SPEC-055: Nether Dimension
- 10 new nether blocks (IDs 110-119): Netherrack, Nether Brick, Soul Sand, Glowstone, Nether Quartz Ore, Lava, Portal, Quartz, Blaze Rod, Nether Wart
- **NetherGenerator**: noise-based terrain with netherrack floor/ceiling, soul sand patches, quartz ore and glowstone deposits, lava pockets
- **PortalManager**: portal location tracking, dimension switching
- Nether crafting: Netherrack → Nether Brick (shapeless), Quartz → Glowstone (shaped)
- Placeable blocks: Netherrack, Nether Brick, Soul Sand, Glowstone, Quartz
- Infinite blocks (Lava, Portal) cannot be mined

### SPEC-056: Redstone Basics
- 6 new redstone blocks (IDs 120-125): Redstone Dust, Redstone Torch, Lever, Piston, Redstone Lamp, Redstone Repeater
- **RedstoneManager**: power propagation system with BFS queue
- Power level 0-15, decrements by 1 per dust block
- Lever toggle: activates/deactivates power network
- 6-directional neighbor checking for dust propagation
- `isPowered()` and `getPower()` queries for lamp/piston activation
- Redstone crafting recipes: Torch (dust + stick), Lever (stick + cobblestone), Piston (planks + cobblestone + iron + dust), Lamp (dust + quartz)

## v4.0.0 — Mobs, Combat, Crafting, Survival, Farming

### SPEC-041: Passive Mobs
- **MobManager** with spawning, despawning, AI states (idle, wander, flee)
- 4 passive mobs: Cow, Pig, Chicken, Sheep with drops and biome spawning
- Mob rendering with Three.js (box-based models with bobbing animation)
- Hit flash, death, and drop system integrated with inventory
- Raycast hit test for mob combat targeting

### SPEC-042: Health & Hunger System
- **HealthHungerSystem** with 10 hearts and 10 hunger drums
- Food items: raw/cooked beef, porkchop, chicken, mutton, bread
- Starvation damage when hunger depleted
- Regeneration when well-fed
- Damage flash overlay, death screen with cause
- Creative mode bypass

### SPEC-043: Furnace + Smelting
- **FurnaceManager** with fuel burning, input/output slots
- Smelting recipes: ores → ingots, raw food → cooked food
- Fuel types: coal, wood, sticks with different burn times
- Furnace UI panel with slot interaction
- Furnace block placement and right-click activation

### SPEC-044: Weather System
- **WeatherManager** with rain, snow, thunder, clear states
- Biome-dependent weather (snow in cold biomes, rain in temperate)
- Rain/snow particle systems
- Lightning strikes during thunder with flash effect
- Fog color/density changes per weather state
- Weather indicator in HUD

### SPEC-045: Hostile Mobs + Combat System
- 4 hostile mob types: Zombie, Skeleton, Creeper, Spider
- Hostile AI states: chase, attack, with pathfinding toward player
- Zombie: melee attack, burns in daylight
- Skeleton: ranged arrow attacks, burns in daylight
- Creeper: explosion with block damage and player knockback
- Spider: leap attack, fast movement, no burning
- Night/underground spawning with dayFactor < 0.3
- Mob drops: Rotten Flesh (67), Bones (68), Arrow (69), Gunpowder (70), String (71)
- Combat: attack cooldown, knockback, player damage callback
- Burning visual effect (orange emissive flicker)

### SPEC-046: Bows + Arrows + Ranged Combat
- Bow block (ID 72) with crafting recipe (sticks in diagonal)
- Arrow crafting recipe (iron + stick + feather → 4 arrows)
- Bow draw mechanic: hold right-click to draw, release to fire
- Draw time affects arrow speed (15-30 blocks/s) and damage (3-6 HP)
- Arrow projectiles with gravity, block collision, and mob hit detection
- Skeleton arrows integrated with player arrow system
- Arrow consumption in survival mode

### SPEC-047: Sleep/Bed + Skip Night + Set Spawn
- Bed block (ID 74) with crafting recipe (3 wool + 3 planks)
- Right-click bed to sleep (only at night, dayFactor < 0.3)
- Sleep overlay fade animation (2s)
- Skips to morning (06:00), clears weather
- Sets spawn point at bed location
- Respawn uses bed spawn point if set
- Minor health/hunger restoration on sleep

### SPEC-048: Settings Panel
- In-game settings panel in pause screen
- Render distance slider (2-8 chunks)
- FOV slider (60-110 degrees)
- Mouse sensitivity slider (0.5-4.0)
- Volume slider (0-100%) with masterGain audio control
- Settings persisted to localStorage
- Real-time application of settings changes

### SPEC-049: Underwater Fog + Visibility Overlay
- Eye-level water detection for underwater state
- Blue fog (0x1a4080) with short view distance (0.5-12 blocks)
- Blue overlay div with smooth fade transition
- Fog restoration when surfacing (weather-dependent)

### SPEC-050: Food Farming (Wheat, Seeds, Hoe, Bread)
- New blocks: Wheat Seeds (75), Wheat Crop (76), Farmland (77), Hoe (78), Bread (79)
- Hoe crafting recipe (2 iron + 2 sticks)
- Bread crafting recipe (3 wheat crops)
- Right-click grass/dirt with hoe → tills to farmland
- Right-click farmland with seeds → plants wheat crop
- Right-click wheat crop → harvest (yields wheat + 1-2 seeds)
- Crop growth system: checks every 5s, faster growth near water
- Bread as food item (5 hunger, 2.6 saturation)

### SPEC-038: Crafting System
- **CraftingManager** with shaped and shapeless recipe matching
- 2x2 crafting grid in inventory panel
- 3x3 crafting table block (right-click to open)
- New blocks: Crafting Table (ID 51), Stick (ID 52), Furnace (ID 53)
- Recipes: planks, sticks, crafting table, furnace, cobblestone slab, torch
- Output slot with clickable crafting action
- Grid slot selection + block placement from inventory

### SPEC-039: Save/Load System (IndexedDB)
- **SaveManager** with IndexedDB persistence (world + chunk stores)
- Auto-save every 30s (seed, player position, hotbar, day/time, creative mode)
- Block modification tracking per chunk — persists player builds across sessions
- `onChunkGenerated` callback applies saved modifications to newly loaded chunks
- Save indicator in HUD
- Save on `beforeunload`

### SPEC-040: Particle Effects
- **ParticleSystem** with THREE.Points (200 max particles)
- Block break particles (colored by block, gravity-affected)
- Block place particles (dust effect at base)
- Walk dust, rain, and snow particle spawns available
- Life-based fade and size attenuation

### SPEC-002: Voxel Worldgen — COMPLETED
- Procedural terrain with 17 biomes, 3 cave types, aquifers
- Ore veins, trees (oak/birch/spruce/jungle), decorations, structures
- Web Worker chunk generation with greedy meshing
- Day/night cycle, game audio, inventory, mining, placing

## v3.1.0 — 25 Junio 2026 — Bug Audit & Fixes (10 bugs resueltos)

### Critical Fixes (3)
- **BUG-001: Worker seed mismatch** — Worker ahora recibe seed via `postMessage({ type: 'init', seed })` en vez de hardcoded `42`. Terreno consistente entre main thread y worker.
- **BUG-002: `_setBlockSafe` solo sobrescribia AIR** — Anadido parametro `force` y flag `_forcePlace`. Estructuras (villages, temples, wells, etc.) ahora colocan todos los tipos de bloques correctamente sobre terreno existente.
- **BUG-003: Survival no decrementa inventario** — `_placeBlock` ahora verifica `inventory[blockType]` y decrementa count en modo survival. Bloques finitos en survival.

### Moderate Fixes (3)
- **BUG-004: `blockTypeToId` faltaba 'mud'** — Anadido `'mud': 8` al mapping. Superficies de swamp ya no son air.
- **BUG-005: Duplicate faces en greedy meshing** — Anadido check `isCrossChunk` que skip same-chunk AIR->solid faces. ~30-50% menos vertices en boundaries.
- **BUG-006: `VoxelChunk.isSolid` no excluida LAVA** — Alineado con `ChunkManager.isSolidAt`. Ahora excluye AIR, WATER y LAVA.

### Minor Fixes (4)
- **BUG-007: `Spline.evaluate` tangents en cero** — Tangents ahora calculados desde puntos vecinos (`prev`, `next`). Interpolacion cubic hermite real.
- **BUG-008: ShiftLeft conflict volando** — `baseSpeed` tiene guard `!this.flying`. ShiftLeft solo activa runSpeed cuando no vuela; al volar solo descende.
- **BUG-009: `getVegetationAt` flower check redundante** — Removida linea `r < 0.14` que era unreachable. Logica de vegetacion limpia sin overlap.
- **BUG-010: `PerlinNoise3D` usaba 3D para 2D** — Anadidos metodos `noise2D` y `fbm2D`. Calls de continentalness/erosion/weirdness/temperature/humidity usan `fbm2D`. Cache `_getSplineParams` elimina evaluaciones redundantes en `getBiome`.

## v3.0.0 — 26 Junio 2026 — Blocks, Trees, Structures, Gameplay, Audio, UI, Performance

### SPEC-028: New Blocks (20 bloques, IDs 43-62)
- **Birch Wood** (43), **Spruce Wood** (44), **Dark Oak Leaves** (45)
- **Moss** (46), **Mycelium** (47), **Obsidian** (48)
- **Lapis Ore** (49), **Redstone Ore** (50), **Emerald Ore** (51)
- **Netherrack** (52), **Basalt** (53), **Amethyst** (54)
- **Bookshelf** (55), **Lantern** (56), **Torch** (57)
- **TNT** (58), **Sponge** (59), **Pumpkin** (60)
- **Melon** (61), **Bamboo** (62)
- Bloques emisivos: Torch, Lantern, Lava, Amethyst
- Bloques transparentes expandidos: Dark Oak Leaves, Moss, Torch, Bamboo, Lantern
- Ore blocks expandidos: Lapis, Redstone, Emerald

### SPEC-029: Varied Trees by Biome (6 tipos)
- **Oak Tree**: plains/forest, copa redondeada asimetrica, altura 4-6
- **Jungle Tree**: jungle, tronco 2x2, altura 8-12, hojas radio 3
- **Spruce Tree**: taiga/snow, copa conica, altura 5-7
- **Mangrove Tree**: mangrove, raices visibles, tronco inclinado
- **Dead Tree**: badlands/savanna, sin hojas, solo ramas
- **Savanna Tree**: savanna, tronco grueso, copa plana (acacia)

### SPEC-030/031: Detailed Structures (14 tipos)
- **Village**: casas + well + lamp posts + paths (plains/forest)
- **Temple**: piramide de sandstone 7x7 (desert/badlands)
- **Mineshaft**: tuneles con soportes de wood (subterraneo)
- **Monument**: templo submarino de prismarine (ocean)
- **Jungle Temple**: 7x5 mossy cobble con camara (jungle)
- **Shipwreck**: casco inclinado semi-enterrado (beach/ocean)
- **Igloo**: domo de nieve con interior (snow/tundra)
- **Desert Well**: pozo 3x3 sandstone + agua (desert)
- **Ice Spike**: formacion vertical de packed ice (snow)
- **Boulder**: roca esferica granite/andesite/diorite (mountain/forest)
- **Swamp Hut**: choza sobre pilotes (swamp)
- **Ruined Portal**: portal de obsidian + lava (badlands/savanna)
- **Coral Reef**: arrecife colorido submarino (ocean temp > 0.6)
- **Forest Rock**: roca musgosa (forest/taiga)

### SPEC-032: Procedural Clouds
- Canvas 256x256 con multi-octave noise (sines)
- 3 planos a alturas 55, 58, 61 para efecto volumetrico
- Wind movement via texture offset
- Color dinamico: blanco → rosa sunset → gris noche
- Opacidad variable segun dayFactor

### SPEC-033: Inventory + Mining Progress
- **Inventario completo**: grid con 55+ bloques colocables (tecla E)
- **Block hardness**: tiempo de minado varia por bloque (0.1s - 3.0s)
- **Mining overlay**: visual de crack sobre el bloque durante minado
- **Modo Creative/Survival**: toggle con tecla C
- Creative: minado instantaneo
- Survival: tiempo real segun BLOCK_HARDNESS

### SPEC-034: Swimming + Audio + Physics
- **Nado**: flotabilidad en agua, velocidad reducida (3 bloques/seg)
- **Sprint con stamina**: barra que se consume y regenera
- **Crouch** (Ctrl): velocidad reducida, anti-caida
- **Fall damage**: danio por caida, muerte si es fatal
- **Audio Web API**: sonidos sintetizados (jump, land, break, place, splash)
- Splash sound al entrar/salir del agua

### SPEC-035: UI/UX (Minimap + Clock + Death)
- **Minimapa 120px**: canvas con biomas coloreados, marker de jugador + direccion
- **Clock display**: HH:MM basado en dayTime
- **Death screen**: "Has Muerto" + causa de muerte + boton respawn
- **Mode indicator**: Creativo/Survival en esquina inferior izquierda

### SPEC-036: Greedy Meshing + Tone Mapping + Point Lights
- **Real greedy meshing**: merges adjacent same-block faces into larger quads, reducing vertex count significantly
- **ACESFilmic tone mapping**: cinematic color range via `THREE.ACESFilmicToneMapping`
- **PointLight pool**: 8 dynamic point lights for torches/lanterns near player (within 12 blocks)
- Lights sorted by distance, only closest 8 activated
- AO caching preserved, skipped at LOD > 0 for performance

### SPEC-037: Web Worker + LOD + Frustum Culling
- **Web Worker chunk generation**: chunk generation offloaded to `jardvoxel-worker.js` (module worker)
- Zero-copy transfer of `ArrayBuffer` from worker to main thread
- Fallback to sync generation if worker unavailable
- **LOD by distance**: 3 levels (0=full+AO, 1=no AO, 2=no AO+no transparent faces)
- **Frustum culling**: chunks outside camera view hidden (THREE.Frustum)
- Skip frustum check for close chunks (always visible)
- **Adaptive render distance**: FPS <30 → dist 3, FPS >55 → dist 5
- History of 60 frames for smooth transitions
- Shadows disabled for LOD > 0 chunks

## v2.1.0 — 25 Junio 2026 — Sky Overhaul + Water Animation

### SPEC-026: Sky Overhaul
- **Sol visible**: mesh emisivo amarilla (SphereGeometry r=8) con halo glow (r=14, opacity 0.25)
- **Luna visible**: esfera grisácea (r=5) opuesta al sol en el ciclo día/noche
- **Campo de estrellas**: ~800 puntos (THREE.Points) en semiesfera, fade con dayFactor, rotación lenta
- **Gradiente de cielo vertical**: ShaderMaterial con sky dome (SphereGeometry r=500, BackSide), interpolación top/bottom colors
- **Colores de atardecer/amanecer**: interpolación day → sunset (naranja #ff7a3d) → night con sunsetFactor
- **Fog dinámica**: color sigue el horizonte (bottomColor del gradiente)
- **Sky dome sigue al jugador**: position.copy(camera.position) cada frame

### SPEC-027: Water Animation
- **Olas animadas**: dos ondas sine superpuestas (sin(x*0.3 + t*1.5) * 0.08 + sin(z*0.2 + t*1.2) * 0.06)
- **Color por profundidad**: interpolación shallow (turquesa 0.20,0.60,0.65) → deep (azul 0.05,0.20,0.50) según distancia al fondo
- **Línea de costa**: boost de color (+0.12) cuando el bloque debajo es sand/sandstone
- **Material mejorado**: opacity 0.72, roughness 0.15, metalness 0.3 (fresnel-like), emissive 0x112244
- **Wave animation loop**: updateWaterWaves(dt) en ChunkManager, llamado cada frame desde animate()
- **Vertex normals recompute**: computeVertexNormals() cada frame para iluminación correcta de olas

## v2.0.0 — 25 Junio 2026 — World Generation Overhaul

### Motor Principal (jardvoxel-engine.js) — Mejoras de generacion

**3D Noise Terrain (Overhangs)**
- Bloques solidos sobre el heightmap en biomas montañosos (mountain, snow, badlands)
- 3D density noise con height bias para overhangs naturales
- Extension del rango Y en chunks montañosos (+20 bloques)

**Noodle Caves**
- Tercer tipo de cueva: noodle caves (túneles delgados 1-3 bloques)
- Dos noises offset para túneles sinuosos

**Surface Rules Detalladas por Bioma**
- Calcite en stony peaks (height > 55)
- Packed ice en subsurface de snowy peaks
- Taiga ahora usa grass (no snow) en superficie
- Frozen ocean usa packed ice en superficie

**Aquifer System**
- Barrier noise separa celdas de fluido de aire
- Local fluid level varía por celda 16-block
- Lava below Y=8, water above
- Integrado en caves, carvers y ravines

**Carver Caves (Branching Tunnels)**
- Main tunnel: túnel horizontal sinuoso
- Branch tunnel: túnel secundario más delgado
- Distinto de noise caves (spaghetti/cheese/noodle)

**Ore Veins (Toggle / Ridge / Gap)**
- Toggle noise selecciona tipo de mineral por profundidad
- Ridge noise determina si hay veta
- Gap noise controla densidad ore-to-filler (10-30%)
- Nuevo: Copper Ore
- Distribución por capas: deep (diamond/gold/copper/iron), mid (gold/iron/copper/coal), shallow (iron/copper/coal)

**Lava Lakes + Fluid Springs**
- Lava lakes en áreas muy bajas (raro)
- Fluid springs: agua o lava filtrándose desde paredes de cuevas

**Freeze Top Layer**
- Hielo en superficie de agua en biomas fríos (frozen_ocean, tundra, snow)
- Noise-based para cobertura natural

**Stone Variants**
- Granite, Andesite, Diorite underground
- Noise 3D para distribución natural

**Vegetation**
- Tall Grass en plains, forest, savanna
- Poppy (flower_red) y Dandelion (flower_yellow) en plains
- Ferns en jungle, taiga, swamp, mangrove
- Todos son no-sólidos (atravesable)

**Nuevos Bloques (13)**
- ICE, PACKED_ICE, CALCITE, COARSE_DIRT, COPPER_ORE
- POWDER_SNOW, GRANITE, ANDESITE, DIORITE, MOSSY_STONE
- FLOWER_RED, FLOWER_YELLOW, TALL_GRASS

**Mejoras de Gameplay**
- Lava ahora es no-sólida (como agua)
- Vegetación es no-sólida (atravesable)
- Hotbar actualizado: ICE reemplaza SANDSTONE
- Transparent blocks set expandido con flowers, tall grass, ice

## v1.0.0 — 25 Junio 2026

### Motor Principal (jardvoxel-engine.js)
- Generacion procedural de terreno con Perlin Noise (2D + 3D)
- 16 biomas con temperatura y humedad
- Cuevas spaghetti + cheese caves
- Ravinas verticales
- Rios sinuosos al nivel del mar
- 4 tipos de minerales (coal, iron, gold, diamond) por profundidad
- Arboles procedurales con densidad por bioma
- Cactus en desert/badlands
- Dead bushes en desert/badlands/savanna
- 4 tipos de estructuras: village, temple, mineshaft, monument
- Nieve en biomas frios
- Sistema de chunks 16x64x16 con carga/descarga dinamica
- Greedy meshing con face culling
- Mesh separado para agua (opacidad 0.6)
- Shading direccional por cara (top brighter, bottom darker)
- Bloques transparentes (glass, leaves, fern, dead bush)
- Height cache con LRU eviction (50,000 entradas)
- Max 2 chunks generados por frame (anti-stutter)

### Juego (jardvoxel.html)
- PointerLockControls (FPS style)
- Game loop con requestAnimationFrame
- Fisica: gravedad, salto, colisiones voxel vs AABB
- Modo vuelo toggle (tecla F)
- Romper bloques (click izquierdo, DDA raycast)
- Colocar bloques (click derecho, face adyacente)
- Block highlight wireframe
- Hotbar con 9 bloques seleccionables (teclas 1-9)
- HUD: FPS, coords, bioma, chunks, bloque mirado
- Ciclo dia/noche con sol dinamico y sombras
- Pantalla de carga con spinner
- Pantalla de pausa con seed
- Anti-fall: respawn si y < -10

### Motor Alternativo (jardvoxel-survival-engine.js)
- Pipeline de generacion basado en Voxel Wiki
- Splines cubic hermite para continentalness y erosion
- 3D density noise con height bias
- 3 tipos de cuevas: cheese, spaghetti, noodle
- Sistema de aquifers (agua subterranea)
- 17 biomas
- Altura mundial 384 (-64 a 320)
- Nivel del mar 63
- GreedyMesher simplificado (solo superficie)
- Experimental: sin gameplay, solo generacion

### Organizacion
- Proyecto organizado en carpeta `jardvoxel/`
- Documentacion completa en `jardvoxel/docs/`
