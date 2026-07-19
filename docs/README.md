# JardVoxel — Documentacion del Proyecto

Mundo voxel 3D con generacion procedural de terreno, sistema de ruido Simplex v6.0, 19 biomas con blending suave, ciclo dia/noche con 8 fases circadianas, sistema wellness completo (musica ambient, komorebi, meditacion, diario, mundo vivo, resonancia), perfil geografico de Patagonia, world identity realista basado en Tierra, touch controls para mobile, y mas.

**Version actual:** v8.0.0 — Zen Unified (29 Junio 2026)

## Estructura de Archivos

```
jardvoxel/
├── index.html                    # Menu principal (selector de modo)
├── jardvoxel.html                # Juego clasico (Open World)
├── jardvoxel-survival.html       # Juego survival completo (4994 lineas)
├── jardvoxel-zen.html            # Juego Zen Garden (wellness, 390 lineas + core)
├── logo.png                      # Logo del juego
├── core/                         # Motor modular (74 archivos JS)
│   ├── jardvoxel-engine.js       # Motor base (terreno, chunks, greedy meshing)
│   ├── jardvoxel-worker.js       # Web Worker base
│   ├── jardvoxel-survival-engine.js  # Motor survival (biomas, ruido, pipeline)
│   ├── jardvoxel-survival-noise.js   # Sistema ruido v6.0 (Simplex, Warping, Splines, Blending)
│   ├── jardvoxel-survival-mesher.js  # Mesher (greedy meshing, AO, water)
│   ├── jardvoxel-survival-gameplay.js # World, PlayerController, Inventory, DayNight, Audio
│   ├── jardvoxel-survival-features.js # Arboles, ores, estructuras, decoracion
│   ├── jardvoxel-survival-crafting.js # CraftingManager
│   ├── jardvoxel-survival-save.js  # SaveManager (IndexedDB)
│   ├── jardvoxel-survival-particles.js # ParticleSystem
│   ├── jardvoxel-survival-mobs.js  # MobManager (pasivos + hostiles)
│   ├── jardvoxel-survival-health.js # HealthHungerSystem
│   ├── jardvoxel-survival-furnace.js # FurnaceManager
│   ├── jardvoxel-survival-weather.js # WeatherManager
│   ├── jardvoxel-survival-tools.js # EquipmentManager, ToolItem, Armor
│   ├── jardvoxel-survival-enchanting.js # XPManager, EnchantManager
│   ├── jardvoxel-survival-villagers.js # VillagerManager, TradingManager
│   ├── jardvoxel-survival-fishing.js # FishingManager
│   ├── jardvoxel-survival-nether.js # PortalManager, NetherGenerator
│   ├── jardvoxel-survival-redstone.js # RedstoneManager
│   ├── jardvoxel-survival-chilltune.js # ChillTuneEngine (musica ambient deep space)
│   ├── jardvoxel-survival-brewing.js # BrewingManager
│   ├── jardvoxel-survival-shields.js # ShieldManager
│   ├── jardvoxel-survival-achievements.js # AchievementManager
│   ├── jardvoxel-survival-anvil.js # AnvilManager
│   ├── jardvoxel-survival-map.js   # MapManager, cartografia
│   ├── jardvoxel-survival-postprocessing.js # Postprocessing (bloom, tonemapping)
│   ├── jardvoxel-survival-shadow.js # ShadowManager
│   ├── jardvoxel-survival-fog.js   # VolumetricFog
│   ├── jardvoxel-survival-water.js # WaterMaterialManager
│   ├── jardvoxel-survival-interior-lighting.js # InteriorLightingManager
│   ├── jardvoxel-survival-ambient-particles.js # AmbientParticleSystem
│   ├── jardvoxel-survival-forest-canopy.js # ForestCanopyManager
│   ├── jardvoxel-survival-character.js # CharacterGenerator + CharacterAnimator
│   ├── jardvoxel-survival-thirdperson.js # ThirdPersonCamera
│   ├── jardvoxel-survival-ui.js    # UIManager
│   ├── jardvoxel-survival-biome-identity.js # BiomeIdentityManager
│   ├── jardvoxel-survival-ambient-sound.js # AmbientSoundManager
│   ├── jardvoxel-survival-komorebi.js # KomorebiSystem (luz filtrada)
│   ├── jardvoxel-survival-resonance.js # ResonanceSystem (tracking comportamiento)
│   ├── jardvoxel-survival-meditation-spaces.js # MeditationSpaceGenerator (6 tipos)
│   ├── jardvoxel-survival-living-world.js # LivingWorldSystem
│   ├── jardvoxel-survival-journal.js # ExplorationJournal
│   ├── jardvoxel-survival-narrative-structures.js # NarrativeStructures
│   ├── jardvoxel-survival-lore.js # LoreGenerator
│   ├── jardvoxel-survival-civilizations.js # CivilizationSystem
│   ├── jardvoxel-survival-npc-memory.js # NPCMemorySystem
│   ├── jardvoxel-survival-conversation.js # ConversationSystem
│   ├── jardvoxel-survival-quests.js # QuestManager
│   ├── jardvoxel-survival-events.js # EventManager
│   ├── jardvoxel-survival-ai-client.js # AIClient (WebSocket)
│   ├── jardvoxel-survival-hydrology.js # HydrologySystem
│   ├── jardvoxel-survival-tree-personality.js # TreePersonalitySystem
│   ├── jardvoxel-survival-voronoi.js # VoronoiBiomes
│   ├── jardvoxel-survival-poisson.js # PoissonVegetation
│   ├── jardvoxel-survival-instanced.js # InstancedRenderer
│   ├── jardvoxel-survival-microsectors.js # MicrosectorSystem
│   ├── jardvoxel-survival-worker-pool.js # WorkerPool (multi-worker)
│   ├── jardvoxel-survival-worker.js # Web Worker survival
│   ├── jardvoxel-survival-world-hierarchy.js # WorldHierarchy (continent/region/zone)
│   ├── jardvoxel-survival-landmarks.js # LandmarkGenerator
│   ├── jardvoxel-survival-ecosystems.js # EcosystemSystem
│   ├── jardvoxel-survival-contextual.js # ContextualGenerator
│   ├── jardvoxel-survival-layers.js # LayerSystem
│   ├── jardvoxel-patagonia.js      # Perfil geografico Patagonia (43°S-56°S)
│   ├── jardvoxel-zen-game.js       # ZenGame class (logica Zen Garden)
│   ├── jardvoxel-zen-touch.js      # TouchControls para mobile
│   └── blocks-registry.js          # 157 bloques (colores, hardness, nombres)
├── ai-server/                     # Servidor IA para NPCs (Ollama)
│   ├── server.js                  # Express + WebSocket server
│   ├── llm-interface.js           # Interface a Ollama/cloud APIs
│   ├── state-manager.js           # Estado de NPCs y quests
│   ├── harness/                   # LLM Testing Harness (24 items)
│   └── package.json
├── tests/                         # Suite de tests (33 archivos)
│   ├── setup.js                   # Mocks: localStorage, indexedDB, Three.js
│   ├── mocks/three.js             # Mock minimal de Three.js
│   └── *.test.js                  # 33 archivos de test
├── package.json                   # Config npm (vitest + jsdom + ai-server)
├── vitest.config.js               # Config Vitest con alias Three.js mock
├── vercel.json                    # Deploy config (COOP/COEP headers)
└── docs/
    ├── README.md                  # Este archivo (indice de documentacion)
    ├── prd/                       # Product Requirements Documents (16 PRDs)
    │   ├── PRD-JARDVOXEL-5.0.md
    │   ├── PRD-JARDVOXEL-5.0-INTEGRATION.md
    │   ├── PRD-JARDVOXEL-5.0-INTEGRATION-GAPS.md
    │   ├── PRD-JARDVOXEL-7.0-HIERARCHICAL.md
    │   ├── PRD-JARDVOXEL-ORGANIC-TERRAIN.md
    │   ├── PRD-JARDVOXEL-ZEN-UNIFIED.md
    │   ├── PRD-JARDVOXEL-SURVIVAL-OPTIMIZATION.md
    │   ├── PRD-NOISE-GENERATION-6.0.md
    │   ├── PRD-CHILLTUNE-MUSIC.md
    │   ├── PRD-TOUCH-JOYSTICK.md
    │   ├── PRD-MOBILE-MENU.md
    │   ├── PRD-PROCEDURAL-BODY.md
    │   ├── PRD-LLM-HARNESS.md
    │   ├── PRD-CHUNK-OPTIMIZATION.md
    │   ├── PRD-PERFORMANCE-OPTIMIZATION.md
    │   └── PRD-AI-SERVER-TEST-RACE-CONDITION.md
    ├── technical/                 # Documentacion tecnica (19 docs)
    │   ├── ARCHITECTURE.md
    │   ├── WORLD-GENERATION.md
    │   ├── WORLD-IDENTITY-REALISM.md
    │   ├── BLOCKS.md
    │   ├── CONTROLS.md
    │   ├── CHANGELOG.md
    │   ├── BUGS-FOUND.md
    │   ├── BUGFIX-WATER-MANAGER.md
    │   ├── BUGFIXES-COMPLETE.md
    │   ├── REFACTOR-CORE.md
    │   ├── REFACTOR-SUMMARY.md
    │   ├── IMPROVEMENTS-ROADMAP.md
    │   ├── TESTING.md
    │   ├── NOISE-SYSTEM-6.0.md
    │   ├── ZEN-IMPLEMENTATION-STATUS.md
    │   ├── SPEC-099-WELLNESS-SYSTEM.md
    │   ├── SPEC-BIOME-OVERHAUL.md
    │   ├── WELLNESS-IMPLEMENTATION-PLAN.md
    │   └── WELLNESS-EXECUTIVE-SUMMARY.md
    └── specs/
        ├── completed/             # 29 specs completadas
        └── pending/               # 1 spec pendiente (SPEC-124)
```

## Documentos

### Core Documentation
| Documento | Descripcion |
|-----------|-------------|
| [ARCHITECTURE.md](./technical/ARCHITECTURE.md) | Arquitectura del motor, clases, pipeline de renderizado |
| [WORLD-GENERATION.md](./technical/WORLD-GENERATION.md) | Generacion procedural v6.0: Simplex, biomas, cuevas, rios |
| [WORLD-IDENTITY-REALISM.md](./technical/WORLD-IDENTITY-REALISM.md) | World identity basado en Tierra real (geologia, clima) |
| [BLOCKS.md](./technical/BLOCKS.md) | Catalogo completo de bloques (157 tipos), colores y nombres |
| [CONTROLS.md](./technical/CONTROLS.md) | Controles de teclado/mouse/touch y mecanicas |
| [CHANGELOG.md](./technical/CHANGELOG.md) | Historial de versiones (v1.0.0 a v8.0.0) |
| [TESTING.md](./technical/TESTING.md) | Suite de tests del core con Vitest |

### Wellness & Zen
| Documento | Descripcion |
|-----------|-------------|
| [ZEN-IMPLEMENTATION-STATUS.md](./technical/ZEN-IMPLEMENTATION-STATUS.md) | Estado de implementacion Zen v8.0.0 (13 fixes aplicados) |
| [PRD-JARDVOXEL-ZEN-UNIFIED.md](./prd/PRD-JARDVOXEL-ZEN-UNIFIED.md) | PRD: Zen Unified v8.0.0 — experiencia wellness pura |
| [SPEC-099-WELLNESS-SYSTEM.md](./technical/SPEC-099-WELLNESS-SYSTEM.md) | SPEC: Sistema de Bienestar y Relajacion v7.0 |
| [WELLNESS-IMPLEMENTATION-PLAN.md](./technical/WELLNESS-IMPLEMENTATION-PLAN.md) | Plan ejecutable wellness 24h (3 dias) |
| [WELLNESS-EXECUTIVE-SUMMARY.md](./technical/WELLNESS-EXECUTIVE-SUMMARY.md) | Resumen ejecutivo wellness |
| [NOISE-SYSTEM-6.0.md](./technical/NOISE-SYSTEM-6.0.md) | Documentacion tecnica del sistema de ruido v6.0 |

### PRDs
| Documento | Descripcion |
|-----------|-------------|
| [PRD-JARDVOXEL-5.0.md](./prd/PRD-JARDVOXEL-5.0.md) | PRD: Living World v5.0 (21 specs) |
| [PRD-JARDVOXEL-5.0-INTEGRATION.md](./prd/PRD-JARDVOXEL-5.0-INTEGRATION.md) | PRD: Integracion v5.0 (8 specs) |
| [PRD-JARDVOXEL-5.0-INTEGRATION-GAPS.md](./prd/PRD-JARDVOXEL-5.0-INTEGRATION-GAPS.md) | PRD: Gaps de integracion v5.0 |
| [PRD-JARDVOXEL-7.0-HIERARCHICAL.md](./prd/PRD-JARDVOXEL-7.0-HIERARCHICAL.md) | PRD: World Hierarchy v7.0 (continent/region/zone) |
| [PRD-JARDVOXEL-ORGANIC-TERRAIN.md](./prd/PRD-JARDVOXEL-ORGANIC-TERRAIN.md) | PRD: Terreno organico (Voronoi, Poisson, hydrology) |
| [PRD-NOISE-GENERATION-6.0.md](./prd/PRD-NOISE-GENERATION-6.0.md) | PRD: Noise Generation v6.0 (8 specs) |
| [PRD-CHILLTUNE-MUSIC.md](./prd/PRD-CHILLTUNE-MUSIC.md) | PRD: Musica procedural 8-bit dinamica |
| [PRD-TOUCH-JOYSTICK.md](./prd/PRD-TOUCH-JOYSTICK.md) | PRD: Joysticks touch para moviles |
| [PRD-MOBILE-MENU.md](./prd/PRD-MOBILE-MENU.md) | PRD: Menu de juego + opciones |
| [PRD-PROCEDURAL-BODY.md](./prd/PRD-PROCEDURAL-BODY.md) | PRD: Cuerpo procedural + 3ra persona |
| [PRD-LLM-HARNESS.md](./prd/PRD-LLM-HARNESS.md) | PRD: LLM Testing Harness (5 specs) |
| [PRD-CHUNK-OPTIMIZATION.md](./prd/PRD-CHUNK-OPTIMIZATION.md) | PRD: Optimizacion de chunks |
| [PRD-JARDVOXEL-SURVIVAL-OPTIMIZATION.md](./prd/PRD-JARDVOXEL-SURVIVAL-OPTIMIZATION.md) | PRD: Optimizacion survival |
| [PRD-PERFORMANCE-OPTIMIZATION.md](./prd/PRD-PERFORMANCE-OPTIMIZATION.md) | PRD: Optimizacion performance Zen |
| [PRD-AI-SERVER-TEST-RACE-CONDITION.md](./prd/PRD-AI-SERVER-TEST-RACE-CONDITION.md) | PRD: Fix race condition tests AI server |

### Bug Audit & Refactor
| Documento | Descripcion |
|-----------|-------------|
| [BUGS-FOUND.md](./technical/BUGS-FOUND.md) | Audit de bugs: 10 bugs encontrados y resueltos |
| [BUGFIX-WATER-MANAGER.md](./technical/BUGFIX-WATER-MANAGER.md) | Bugfix water manager |
| [BUGFIXES-COMPLETE.md](./technical/BUGFIXES-COMPLETE.md) | Bugfixes completos |
| [REFACTOR-CORE.md](./technical/REFACTOR-CORE.md) | Refactor del core |
| [REFACTOR-SUMMARY.md](./technical/REFACTOR-SUMMARY.md) | Resumen del refactor |
| [IMPROVEMENTS-ROADMAP.md](./technical/IMPROVEMENTS-ROADMAP.md) | Roadmap de mejoras (SPEC-025 a SPEC-066) |
| [SPEC-BIOME-OVERHAUL.md](./technical/SPEC-BIOME-OVERHAUL.md) | SPEC: Biome Overhaul |

## Stack Tecnologico

- **Three.js 0.160.0** (via CDN, ES Modules + importmap)
- **PointerLockControls** (three/addons)
- **Vanilla JS** (sin frameworks, sin build tools)
- **WebGL** (renderizado 3D con sombras)
- **Vitest 2.1.9** (testing del core, con jsdom + mocks de Three.js/indexedDB)

## Como Jugar

Abrir `index.html` en un navegador moderno (Chrome/Firefox/Edge). Seleccionar modo Zen Garden. Click en la pantalla para activar el cursor lock. ESC para pausar. Touch controls auto-detectados en moviles.

## Modos de Juego

### Zen Garden (v8.0.0) — Recomendado
- **Archivo:** `jardvoxel-zen.html` + `core/jardvoxel-zen-game.js`
- **Filosofia:** Exploracion contemplativa, sin combate, sin muerte
- Sistemas wellness: ChillTune ambient, komorebi, meditacion, diario, mundo vivo, resonancia
- Perfil geografico: Patagonia (43°S-56°S, Andes → Steppe → Atlantic)
- World identity realista basado en Tierra (edades geologicas, eventos del Cuaternario)
- Touch controls nativos para mobile
- UI minimalista con auto-hide

### Survival (v6.0.0)
- **Archivo:** `jardvoxel-survival.html` (4994 lineas)
- Gameplay completo: mobs, combate, hambre, encantamientos, Nether, redstone, pociones
- 55 modulos importados

### Open World (v4.2.0)
- **Archivo:** `jardvoxel.html`
- Modo creativo simple, sin sistemas survival

## Features

### Sistema de Generacion v6.0 (SPEC-091 a SPEC-098)
- **Simplex Noise** — Reemplaza Perlin con mejor performance (O(n²) vs O(n³))
- **Domain Warping** — Coastlines irregulares, montañas organicas, biomas naturales
- **Terrain Splines** — Modelado complejo inspirado en Minecraft 1.18+
- **Biome Blending** — Transiciones suaves de 8-16 bloques entre biomas
- **Biome Terrain Modulation** — Cada bioma con caracteristicas unicas (dunas, crestas, colinas)
- **Coherent Feature Placement** — Arboles y features en clusters naturales
- **Hydraulic Erosion** — Erosion post-generacion para terreno natural (opcional)

### World Identity v7.0 Realista
- Edades geologicas: Paleogene, Neogene, Quaternary
- 8 eventos historicos reales del Cuaternario (Pleistocene Glaciation, Last Glacial Maximum, etc.)
- Parametros terrestres: 71% oceano, 7 continentes, 23.5° inclinacion axial
- Gradiente latitudinal realista (Ecuador → Polos)

### Perfil Patagonia
- Geografia real: 43°S a 56°S, Andes → Steppe → Atlantico
- Biomas con nombres locales: Estepa Patagonica, Bosque Subantartico, Selva Valdiviana
- Cordillera de los Andes con picos hasta 130 bloques
- Seed fijo: 142857

### Sistemas Wellness (SPEC-099, v7.0-v8.0)
- **ChillTuneEngine** — Musica ambient deep space (LFO modula frecuencia, BPM 24-40, silencio 75-98%)
- **AmbientSoundManager** — Sonidos de bioma 3D posicional, ciclo fauna dawn/day/dusk/night
- **KomorebiSystem** — Luz filtrada por canopy, particulas de luz
- **ResonanceSystem** — Tracking de comportamiento del jugador, adapta generacion
- **MeditationSpaceGenerator** — 6 tipos: Vista, Zen Garden, Cascada, Lago Espejo, Templo, Bamboo Grove
- **LivingWorldSystem** — Arboles → Aves, Restauracion → Biodiversidad, Lagos → Peces
- **ExplorationJournal** — Registro automatico de momentos, UI con tabs, persistencia

### Core Features (Survival + Open World)
- **157 bloques** con colores, hardness, transparencia y emisivos
- **19 biomas** con temperatura, humedad, altura y transiciones suaves
- **6 tipos de arboles** por bioma (Oak, Jungle, Spruce, Mangrove, Dead, Savanna)
- **14 estructuras** (village, temple, mineshaft, monument, etc.)
- **Cuevas**: spaghetti, cheese, noodle, carver tunnels, ravines
- **Ciclo dia/noche** con 8 fases circadianas, sol, luna, estrellas, sky dome gradiente
- **Nubes procedurales** con viento y color dinamico
- **Inventario completo** (tecla E) con 100+ bloques colocables
- **Fisica**: nado, sprint con stamina, crouch, vuelo creativo
- **Audio**: Web Audio API con control de volumen
- **Clima**: lluvia, nieve (sin tormentas en Zen)
- **Performance**: greedy meshing, frustum culling, adaptive LOD, web worker chunk generation, tone mapping
- **Touch controls**: joysticks duales + 5 botones, auto-deteccion mobile
- **Personaje procedural**: CharacterGenerator con 37M combinaciones unicas
- **3ra persona**: camara con colision, toggle con V

### Survival Features (no en Zen)
- Mobs pasivos + hostiles con IA, combate, drops
- Salud/hambre, herramientas, armaduras, encantamientos
- Aldeanos con trading, pesca, Nether, redstone
- Pociones brewing, escudos, logros, yunque, mapas
- Musica procedural chiptune (7 estados)

## Testing del Core

La suite de tests usa **Vitest** con entorno **jsdom** y mocks de Three.js e IndexedDB.

### Ejecutar tests

```bash
cd games/jardvoxel
npx vitest run          # una vez
npx vitest              # watch mode
```

### Cobertura

| Archivo | Tests | Modulo cubierto |
|---------|-------|-----------------|
| `blocks-registry.test.js` | 22 | BLOCK, MC_BLOCKS, colores, nombres, hardness, placeable blocks |
| `engine.test.js` | 31 | PRNG, PerlinNoise3D, Spline, WorldGenPipeline, VoxelChunk, GreedyMesher |
| `crafting.test.js` | 12 | RECIPES, CraftingManager (shaped/shapeless, normalizacion, consume) |
| `health.test.js` | 21 | HealthHungerSystem (damage, hunger, regen, starvation, drowning, serialize) |
| `tools.test.js` | 26 | ToolItem, EquipmentManager (durability, mining speed, armor reduction) |
| `furnace.test.js` | 17 | FurnaceEntity, FurnaceManager (smelting, fuel, cook time, serialize) |
| `achievements.test.js` | 13 | ACHIEVEMENTS, AchievementManager (unlock, stats, serialize) |
| `gameplay.test.js` | 11 | Inventory (hotbar, addBlock, removeSelected, creative/survival) |
| `save.test.js` | 10 | SaveManager (init, saveWorld, saveChunk, loadChunk, clearAll, autosave) |
| `noise-system.test.js` | — | SimplexNoise, DomainWarper, NOISE_CONFIGS, TerrainSplines, BiomeBlender |
| `biome-identity.test.js` | — | BiomeIdentityManager (identidad visual, sonido, fauna por bioma) |
| `ambient-sound.test.js` | — | AmbientSoundManager (perfiles, ciclo fauna, reverberacion) |
| `ambient-particles.test.js` | — | AmbientParticleSystem (particulas por bioma) |
| `chilltune2.test.js` | — | ChillTuneEngine 2.0 (estados, escalas, crossfade, stingers) |
| `conversation.test.js` | — | ConversationSystem (dialogo natural, contexto, JSON) |
| `quests.test.js` | — | QuestManager (misiones dinamicas, progreso, completado) |
| `npc-memory.test.js` | — | NPCMemorySystem (memoria persistente, relaciones) |
| `civilizations.test.js` | — | CivilizationSystem (civilizaciones antiguas, descubrimiento) |
| `lore.test.js` | — | LoreGenerator (lore procedural, libros) |
| `narrative-structures.test.js` | — | NarrativeStructures (estructuras con historia, loot) |
| `events.test.js` | — | EventManager (eventos emergentes) |
| `fog.test.js` | — | VolumetricFog (niebla atmosferica) |
| `forest-canopy.test.js` | — | ForestCanopyManager (canopy visual, fog) |
| `interior-lighting.test.js` | — | InteriorLightingManager (luz interior) |
| `postprocessing.test.js` | — | PostprocessingManager (bloom, tonemapping) |
| `shadow.test.js` | — | ShadowManager (sombras suaves) |
| `water.test.js` | — | WaterMaterialManager (agua transparente) |
| `tree-personality.test.js` | — | TreePersonalitySystem (personalidad de arboles) |
| `ground-vegetation.test.js` | — | GroundVegetation (vegetacion de suelo) |
| `ui-overhaul.test.js` | — | UIManager 5.0 (dialogue, quest tracker, journal, toasts) |
| `ai-server.test.js` | — | AI Server (Ollama integration, LLM interface) |
| `achievements.test.js` | 13 | AchievementManager (unlock, stats, serialize) |
| **Total** | **163+** | **33 archivos de test** |

### Configuracion

- `vitest.config.js` — alias de `three` y CDN de Three.js a mock local
- `tests/setup.js` — mocks globales de `localStorage`, `indexedDB`, `console.warn`
- `tests/mocks/three.js` — mock minimal de Three.js (Vector3, Group, Mesh, Scene, etc.)
- `node_modules` — symlink a `jardfruit-pro/node_modules` (dependencias compartidas)

## Estado

- **Version:** 8.0.0 — Zen Unified
- **Fecha:** 29 Junio 2026
- **Estado:** Jugable — Zen Garden con sistemas wellness completos + survival completo + open world
- **Dependencias:** Three.js (CDN), Vitest (dev), Express + ws (ai-server)
- **Tamaño:** ~1.2MB total (74 archivos JS core + 3 HTML + 33 tests + docs + ai-server)
- **Specs completadas:** 96+ specs total
  - **v8.0 Zen Unified:** SPEC-099 Wellness + Zen implementation (7 sesiones de fixes)
  - **v7.0 World Hierarchy:** SPEC-100 a SPEC-110 (11 specs) + World Identity Realista
  - **v6.0 Noise System:** SPEC-091 a SPEC-098 (8 specs)
  - **v5.0 Living World:** SPEC-070 a SPEC-090 (21 specs) + SPEC-INT-001 a INT-008 (8 specs)
  - **v5.0 LLM Harness:** SPEC-H001 a H005 (5 specs)
  - **v4.x Core Features:** SPEC-025 a SPEC-067 (43 specs)
- **Bugs resueltos:** 10/10 core + 13/13 Zen (BUG-001 a BUG-010 + Zen fixes 1-13)
- **Tests core:** 163+ tests en 33 archivos (Vitest + jsdom)
- **PRDs completados:** 13 PRDs (Zen Unified, Living World, Integration, Hierarchical, Organic Terrain, Noise 6.0, ChillTune, Touch, Mobile Menu, Procedural Body, LLM Harness, Chunk Optimization, Survival Optimization)
- **Deploy:** Vercel (vercel.json con COOP/COEP headers para SharedArrayBuffer)
- **Modo activo:** Zen Garden (index.html → jardvoxel-zen.html)
