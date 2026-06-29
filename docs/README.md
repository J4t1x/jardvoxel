# JardVoxel — Documentacion del Proyecto

Mundo voxel 3D tipo voxel con generacion procedural de terreno, cuevas, biomas, 6 tipos de arboles, 14 estructuras, 157 bloques, ciclo dia/noche con sol/luna/estrellas, nubes procedurales, inventario, minado con hardness, nado, sprint, audio, mobs hostiles y pasivos, combate cuerpo a cuerpo y a distancia, sistema de salud/hambre, clima, hornos, agricultura, camas, herramientas y armaduras con durabilidad, encantamientos, aldeanos con trading, pesca, dimension Nether, redstone, musica procedural chiptune, pociones brewing, escudos, logros, yunque de reparacion, mapas y cartografia, y mas.

## Estructura de Archivos

```
jardvoxel/
├── jardvoxel.html              # Juego clasico (UI + game loop + controles + audio)
├── jardvoxel-engine.js         # Motor clasico (terreno, chunks, greedy meshing, estructuras)
├── jardvoxel-worker.js         # Web Worker para generacion de chunks off-main-thread
├── jardvoxel-survival.html     # Juego survival (UI + game loop + imports modulares)
├── jardvoxel-survival-engine.js  # Motor survival (pipeline, WorldGen, biomas, chunks)
├── jardvoxel-survival-noise.js   # Sistema de ruido v6.0 (Simplex, Warping, Splines, Blending)
├── jardvoxel-survival-mesher.js  # Mesher (greedy meshing, AO, water, block registry)
├── jardvoxel-survival-gameplay.js # World, PlayerController, Inventory, DayNight, Audio
├── jardvoxel-survival-features.js # Arboles, ores, estructuras, decoracion
├── jardvoxel-survival-worker.js # Web Worker survival (chunk gen off-main-thread)
├── jardvoxel-survival-crafting.js # CraftingManager (shaped + shapeless recipes)
├── jardvoxel-survival-save.js  # SaveManager (IndexedDB, serialize/deserialize)
├── jardvoxel-survival-particles.js # ParticleSystem (mining, placing, weather)
├── jardvoxel-survival-mobs.js  # MobManager (pasivos + hostiles, IA, drops)
├── jardvoxel-survival-health.js # HealthHungerSystem (10 hearts, 10 hunger)
├── jardvoxel-survival-furnace.js # FurnaceManager (smelting, fuel, recipes)
├── jardvoxel-survival-weather.js # WeatherManager (lluvia, nieve, tormenta)
├── jardvoxel-survival-tools.js # EquipmentManager, ToolItem, ARMOR (SPEC-051)
├── jardvoxel-survival-enchanting.js # XPManager, EnchantManager (SPEC-052)
├── jardvoxel-survival-villagers.js # VillagerManager, TradingManager (SPEC-053)
├── jardvoxel-survival-fishing.js # FishingManager (SPEC-054)
├── jardvoxel-survival-nether.js # PortalManager, NetherGenerator (SPEC-055)
├── jardvoxel-survival-redstone.js # RedstoneManager (SPEC-056)
├── jardvoxel-survival-chilltune.js # ChillTuneEngine musica procedural (SPEC-057)
├── jardvoxel-survival-brewing.js # BrewingManager, PotionEffectManager (SPEC-062)
├── jardvoxel-survival-shields.js # ShieldManager, ShieldItem (SPEC-063)
├── jardvoxel-survival-achievements.js # AchievementManager (SPEC-064)
├── jardvoxel-survival-anvil.js # AnvilManager (SPEC-065)
├── jardvoxel-survival-map.js   # MapManager, cartografia (SPEC-066)
├── tests/                        # Suite de tests del core (163 tests)
│   ├── setup.js                  # Mocks: localStorage, indexedDB, Three.js
│   ├── mocks/three.js            # Mock minimal de Three.js
│   ├── blocks-registry.test.js   # 22 tests: BLOCK, MC_BLOCKS, colores, nombres, hardness
│   ├── engine.test.js            # 31 tests: PRNG, PerlinNoise3D, Spline, WorldGen, VoxelChunk, GreedyMesher
│   ├── crafting.test.js          # 12 tests: RECIPES, CraftingManager (shaped/shapeless)
│   ├── health.test.js            # 21 tests: HealthHungerSystem (damage, hunger, regen, drowning)
│   ├── tools.test.js             # 26 tests: ToolItem, EquipmentManager (durability, armor)
│   ├── furnace.test.js           # 17 tests: FurnaceEntity, FurnaceManager (smelting, fuel)
│   ├── achievements.test.js      # 13 tests: ACHIEVEMENTS, AchievementManager
│   ├── gameplay.test.js          # 11 tests: Inventory (hotbar, addBlock, creative/survival)
│   └── save.test.js              # 10 tests: SaveManager (IndexedDB, save/load world/chunks)
├── package.json                  # Config npm (vitest + jsdom devDeps)
├── vitest.config.js              # Config Vitest con alias Three.js mock
└── docs/
    ├── README.md               # Este archivo (indice de documentacion)
    ├── ARCHITECTURE.md         # Arquitectura tecnica del motor
    ├── WORLD-GENERATION.md     # Generacion procedural de terreno y biomas
    ├── BLOCKS.md               # Catalogo de bloques (157 tipos) y materiales
    ├── CONTROLS.md             # Controles y mecanicas de gameplay
    ├── CHANGELOG.md            # Historial de versiones (v1.0.0 a v4.2.0)
    ├── BUGS-FOUND.md           # Audit de bugs (10 bugs encontrados y resueltos)
    ├── IMPROVEMENTS-ROADMAP.md # Roadmap de mejoras (SPEC-025 a SPEC-066)
    ├── PRD-CHILLTUNE-MUSIC.md  # PRD: Sistema de musica 8-bit dinamica
    ├── PRD-TOUCH-JOYSTICK.md   # PRD: Joysticks touch para moviles
    ├── PRD-MOBILE-MENU.md      # PRD: Menu de juego + opciones
    ├── SPEC-099-WELLNESS-SYSTEM.md # SPEC: Sistema de Bienestar y Relajacion v7.0
    ├── WELLNESS-IMPLEMENTATION-PLAN.md # Plan ejecutable 24h (3 dias)
    └── WELLNESS-EXECUTIVE-SUMMARY.md # Resumen ejecutivo visual
```

## Documentos

| Documento | Descripcion |
|-----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitectura del motor, clases, pipeline de renderizado |
| [WORLD-GENERATION.md](./WORLD-GENERATION.md) | Noise, biomas, cuevas, rios, estructuras, arboles |
| [BLOCKS.md](./BLOCKS.md) | Catalogo completo de bloques (157 tipos), colores y nombres |
| [CONTROLS.md](./CONTROLS.md) | Controles de teclado/mouse y mecanicas de gameplay |
| [CHANGELOG.md](./CHANGELOG.md) | Historial de versiones (v1.0.0 a v4.2.0) |
| [BUGS-FOUND.md](./BUGS-FOUND.md) | Audit de bugs: 10 bugs encontrados y resueltos |
| [IMPROVEMENTS-ROADMAP.md](./IMPROVEMENTS-ROADMAP.md) | Roadmap de mejoras (SPEC-025 a SPEC-066) |
| [PRD-CHILLTUNE-MUSIC.md](./PRD-CHILLTUNE-MUSIC.md) | PRD: Sistema de musica 8-bit dinamica relajante |
| [PRD-TOUCH-JOYSTICK.md](./PRD-TOUCH-JOYSTICK.md) | PRD: Joysticks touch para moviles (pendiente) |
| [PRD-MOBILE-MENU.md](./PRD-MOBILE-MENU.md) | PRD: Menu de juego + opciones (pendiente) |
| [SPEC-099-WELLNESS-SYSTEM.md](./SPEC-099-WELLNESS-SYSTEM.md) | 🆕 SPEC: Sistema de Bienestar y Relajacion v7.0 |
| [WELLNESS-IMPLEMENTATION-PLAN.md](./WELLNESS-IMPLEMENTATION-PLAN.md) | 🆕 Plan ejecutable 24h (3 dias @ 8h/dia) |
| [WELLNESS-EXECUTIVE-SUMMARY.md](./WELLNESS-EXECUTIVE-SUMMARY.md) | 🆕 Resumen ejecutivo visual |
| [TESTING.md](./TESTING.md) | Suite de tests del core: 163 tests con Vitest |

## Stack Tecnologico

- **Three.js 0.160.0** (via CDN, ES Modules + importmap)
- **PointerLockControls** (three/addons)
- **Vanilla JS** (sin frameworks, sin build tools)
- **WebGL** (renderizado 3D con sombras)
- **Vitest 2.1.9** (testing del core, con jsdom + mocks de Three.js/indexedDB)

## Como Jugar

Abrir `jardvoxel.html` en un navegador moderno (Chrome/Firefox/Edge). Click en la pantalla para activar el cursor lock. ESC para pausar.

## Features

### Sistema de Generación v6.0 (SPEC-091 a SPEC-098)
- **Simplex Noise** — Reemplaza Perlin con mejor performance (O(n²) vs O(n³))
- **Domain Warping** — Coastlines irregulares, montañas orgánicas, biomas naturales
- **Terrain Splines** — Modelado complejo inspirado en Minecraft 1.18+
- **Biome Blending** — Transiciones suaves de 8-16 bloques entre biomas
- **Biome Terrain Modulation** — Cada bioma con características únicas (dunas, crestas, colinas)
- **Coherent Feature Placement** — Árboles y features en clusters naturales
- **Hydraulic Erosion** — Erosión post-generación para terreno natural (opcional)

### Core Features
- **157 bloques** con colores, hardness, transparencia y emisivos
- **19 biomas** con temperatura, humedad, altura y transiciones suaves
- **6 tipos de arboles** por bioma (Oak, Jungle, Spruce, Mangrove, Dead, Savanna)
- **14 estructuras** (village, temple, mineshaft, monument, jungle temple, shipwreck, igloo, etc.)
- **Cuevas**: spaghetti, cheese, noodle, carver tunnels, ravines
- **Aquifer system** con agua/lava subterranea
- **Ciclo dia/noche** con sol, luna, estrellas, sky dome gradiente y atardecer
- **Nubes procedurales** con viento y color dinamico
- **Inventario completo** (tecla E) con 100+ bloques colocables y items
- **Minado con hardness** (tecla C para Creative/Survival)
- **Fisica**: nado, sprint con stamina, crouch, fall damage
- **Audio**: Web Audio API (jump, land, break, place, splash) con control de volumen
- **UI**: minimapa, clock, death screen, mode indicator, settings panel, weather indicator
- **Mobs pasivos**: Cow, Pig, Chicken, Sheep con drops y spawning por bioma
- **Mobs hostiles**: Zombie, Skeleton, Creeper, Spider con IA de combate y spawning nocturno
- **Combate**: cuerpo a cuerpo con cooldown, arcos y flechas con draw mechanic, knockback
- **Salud/Hambre**: 10 hearts, 10 hunger drums, starvation, regeneracion
- **Clima**: lluvia, nieve, tormenta con rayos, fog dinamico
- **Agricultura**: trigo, semillas, azada, farmland, crecimiento con agua
- **Camas**: dormir, saltar noche, establecer spawn point
- **Fog submarino**: overlay azul y fog denso bajo el agua
- **Settings panel**: distancia de render, FOV, sensibilidad, volumen (persistente)
- **Performance**: real greedy meshing, frustum culling, adaptive LOD (3 levels), AO cache, web worker chunk generation, tone mapping, point light pool, chunk throttling
- **Herramientas y armaduras**: 16 herramientas (4 tipos × 4 materiales) + 4 piezas de armadura de hierro con durabilidad
- **Encantamientos**: XP orbs, niveles, mesa de encantamiento, 5 encantamientos
- **Aldeanos**: 4 profesiones (Farmer, Butcher, Blacksmith, Librarian) con trading UI
- **Pesca**: caña de pescar, bobber animado, tabla de capturas ponderada
- **Nether**: dimension alternativa con 10 bloques nuevos, portal, netherrack terrain
- **Redstone**: 6 bloques redstone, propagacion de potencia BFS, lever, piston, lamp
- **Musica procedural**: ChillTune engine 8-bit con 7 estados dinamicos y escalas modales
- **Pociones**: brewing 3-stage, 7 efectos de pocion, splash potions
- **Escudos**: ShieldItem con durabilidad, blocking cone, shield bash, banner customization
- **Logros**: 30 logros en 8 categorias con toast notifications y persistencia
- **Yunque**: reparacion de herramientas, combinacion de encantamientos, renombrado
- **Mapas y cartografia**: MapManager con 4 tiers, compass, cartography table
- **Particulas**: efectos de minado, colocacion, clima
- **Bug audit**: 10 bugs encontrados y resueltos (3 critical, 3 moderate, 4 minor)

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
| **Total** | **163** | **9 modulos core** |

### Configuracion

- `vitest.config.js` — alias de `three` y CDN de Three.js a mock local
- `tests/setup.js` — mocks globales de `localStorage`, `indexedDB`, `console.warn`
- `tests/mocks/three.js` — mock minimal de Three.js (Vector3, Group, Mesh, Scene, etc.)
- `node_modules` — symlink a `jardfruit-pro/node_modules` (dependencias compartidas)

## Estado

- **Version:** 6.0.0 — Advanced Noise Generation & Coherent Biomes
- **Fecha:** 28 Junio 2026
- **Estado:** Jugable con gameplay completo + sistema de generación v6.0 + core test suite (163 tests)
- **Dependencias:** Three.js (CDN), Vitest (dev)
- **Tamaño:** ~550KB total (29 archivos JS + 2 HTML + docs + tests)
- **Specs completadas:** SPEC-025 a SPEC-098 (74 specs)
  - **v6.0 Noise System:** SPEC-091 a SPEC-098 (8 specs)
  - **v5.0 Living World:** SPEC-070 a SPEC-090 (21 specs)
  - **v4.x Core Features:** SPEC-025 a SPEC-067 (43 specs)
- **Bugs resueltos:** 10/10 (BUG-001 a BUG-010)
- **Tests core:** 163 tests en 9 archivos (Vitest + jsdom)
- **PRDs completados:** Noise Generation 6.0, JardVoxel 5.0, ChillTune Music
- **PRDs pendientes:** Touch Joystick (mobile), Game Menu (mobile)
