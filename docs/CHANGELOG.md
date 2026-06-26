# JardVoxel — Changelog

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
