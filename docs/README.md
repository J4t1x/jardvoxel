# JardVoxel — Documentacion del Proyecto

Mundo voxel 3D tipo voxel con generacion procedural de terreno, cuevas, biomas, 6 tipos de arboles, 14 estructuras, 157 bloques, ciclo dia/noche con sol/luna/estrellas, nubes procedurales, inventario, minado con hardness, nado, sprint, audio, mobs hostiles y pasivos, combate cuerpo a cuerpo y a distancia, sistema de salud/hambre, clima, hornos, agricultura, camas, herramientas y armaduras con durabilidad, encantamientos, aldeanos con trading, pesca, dimension Nether, redstone, musica procedural chiptune, pociones brewing, escudos, logros, yunque de reparacion, mapas y cartografia, y mas.

## Estructura de Archivos

```
jardvoxel/
├── jardvoxel.html              # Juego clasico (UI + game loop + controles + audio)
├── jardvoxel-engine.js         # Motor clasico (terreno, chunks, greedy meshing, estructuras)
├── jardvoxel-worker.js         # Web Worker para generacion de chunks off-main-thread
├── jardvoxel-survival.html     # Juego survival (UI + game loop + imports modulares)
├── jardvoxel-survival-engine.js  # Motor survival (pipeline, noise, biomas, chunks)
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
    └── PRD-MOBILE-MENU.md      # PRD: Menu de juego + opciones
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

## Stack Tecnologico

- **Three.js 0.160.0** (via CDN, ES Modules + importmap)
- **PointerLockControls** (three/addons)
- **Vanilla JS** (sin frameworks, sin build tools)
- **WebGL** (renderizado 3D con sombras)

## Como Jugar

Abrir `jardvoxel.html` en un navegador moderno (Chrome/Firefox/Edge). Click en la pantalla para activar el cursor lock. ESC para pausar.

## Features

- **157 bloques** con colores, hardness, transparencia y emisivos
- **16 biomas** con temperatura, humedad y altura
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

## Estado

- **Version:** 4.2.0
- **Estado:** Jugable con gameplay completo + mobs + combate + herramientas + encantamientos + aldeanos + pesca + nether + redstone + musica + pociones + escudos + logros + yunque + mapas
- **Dependencias:** Three.js (CDN)
- **Tamaño:** ~500KB total (28 archivos JS + 2 HTML + docs)
- **Specs completadas:** SPEC-025 a SPEC-066 (42 specs)
- **Bugs resueltos:** 10/10 (BUG-001 a BUG-010)
- **PRDs pendientes:** Touch Joystick (SPEC-062 mobile), Game Menu (SPEC-063 mobile)
