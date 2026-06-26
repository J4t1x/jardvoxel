# JardVoxel — Arquitectura del Motor

## Vision General

JardVoxel es un motor voxel 3D construido sobre Three.js. El proyecto se divide en dos motores:

1. **jardvoxel-engine.js** — Motor principal en uso (terreno + gameplay completo)
2. **jardvoxel-survival-engine.js** — Motor alternativo con pipeline de generacion estilo voxel (experimental)

## Arquitectura: jardvoxel-engine.js

### Clases Principales

```
PRNG (Xorshift128+)
  └── PerlinNoise (2D + 3D + fbm)
        └── WorldGenerator
              ├── getHeight(x, z)
              ├── getBiome(x, z, height)
              ├── getBlock(x, y, z)
              ├── isCave(x, y, z)
              ├── isRavine(x, y, z, height)
              ├── getOreAt(x, y, z)
              ├── hasTreeAt(x, z)
              ├── hasCactusAt(x, z)
              ├── hasDeadBushAt(x, z)
              └── getStructureAt(cx, cz)

VoxelChunk (16x64x16 blocks)
  ├── generate()
  ├── getBlock(x, y, z)
  ├── setBlock(x, y, z, block)
  ├── isSolid(x, y, z)          → excluye AIR, WATER, LAVA (BUG-006)
  ├── _placeTree(x, y, z, biome)        → 6 tipos por bioma (SPEC-029)
  │     ├── _placeOakTree()
  │     ├── _placeJungleTree()
  │     ├── _placeSpruceTree()
  │     ├── _placeMangroveTree()
  │     ├── _placeDeadTree()
  │     └── _placeSavannaTree()
  ├── _placeCactus(x, y, z)
  ├── _placeStructure(type, ox, oz)      → 14 tipos (SPEC-030/031)
  │     ├── _placeVillage()              → casas + well + lamp posts + paths
  │     ├── _placeTemple()               → piramide de sandstone
  │     ├── _placeMineshaft()            → tuneles con soportes
  │     ├── _placeMonument()             → templo submarino prismarine
  │     ├── _placeJungleTemple()         → 7x5 mossy cobble
  │     ├── _placeShipwreck()            → casco inclinado
  │     ├── _placeIgloo()                → domo de nieve
  │     ├── _placeDesertWell()           → 3x3 sandstone + agua
  │     ├── _placeIceSpike()             → formacion de packed ice
  │     ├── _placeBoulder()              → roca de granite/andesite/diorite
  │     ├── _placeSwampHut()             → choza sobre pilotes
  │     ├── _placeRuinedPortal()         → portal de obsidian + lava
  │     ├── _placeCoralReef()            → arrecife colorido submarino
  │     └── _placeForestRock()           → roca musgosa
  ├── _placeHouseSmall() / _placeHouseLarge()
  ├── _placeWell() / _placeLampPost() / _placePath()
  └── _setBlockSafe(x, y, z, block, force = false)  → force + _forcePlace flag (BUG-002)

ChunkManager
  ├── generateChunk(cx, cz)     → Web Worker o sync fallback (SPEC-037)
  ├── _buildMeshForChunk(cx, cz, chunk)  → helper compartido (SPEC-037)
  ├── _getLODLevel(cx, cz)     → 0=full+AO, 1=no AO, 2=no AO+no transparent (SPEC-037)
  ├── rebuildChunkMesh(cx, cz)
  ├── unloadChunk(cx, cz)
  ├── update(playerX, playerZ, camera, fps)  → frustum culling + adaptive LOD (SPEC-037)
  ├── updateWaterWaves(dt)                   → animacion de olas (SPEC-027)
  ├── getBlock(wx, wy, wz)
  ├── setBlock(wx, wy, wz, block)
  ├── isSolidAt(wx, wy, wz)
  ├── getChunkCount()         → incluye pendingChunks
  └── dispose()               → terminate worker + cleanup meshes

buildChunkMesh(chunk, world, lodLevel=0)  → { positions, colors, indices }
buildWaterMesh(chunk, world)   → { positions, colors, indices }

Web Worker (jardvoxel-worker.js)
  ├── Recibe { type: 'init', seed } al inicio (BUG-001)
  ├── Recibe { cx, cz } para generar chunks
  ├── Devuelve { cx, cz, blocks: ArrayBuffer } (zero-copy transfer)
  ├── Fallback a sync generation si worker unavailable
  └── pendingChunks Set rastrea chunks en proceso
```

### Arquitectura: jardvoxel.html (Game)

```
Game
  ├── initScene()          → Scene, Camera, Renderer, Fog
  ├── initLights()         → Hemisphere, Ambient, Directional (sun)
  ├── initControls()       → PointerLockControls
  ├── _initBlockHighlight() → EdgesGeometry wireframe
  ├── _buildHotbar()       → UI de inventario
  ├── _buildInventory()    → Inventario completo con paginacion (SPEC-033)
  ├── _setupInput()        → Keyboard + mouse events
  ├── spawnPlayer()        → Buscar terreno sobre agua, pre-generar chunks
  ├── _raycastBlock()      → DDA voxel raycast (max 6 bloques)
  ├── _breakBlock()        → Eliminar bloque mirado (con hardness timer)
  ├── _placeBlock()        → Colocar bloque en cara adyacente
  ├── _checkCollision()    → Collision voxel vs AABB jugador
  ├── updatePhysics(dt)    → Gravedad, movimiento, salto, vuelo, nado (SPEC-034)
  ├── _updateMining(dt)    → Progreso de minado con overlay visual (SPEC-033)
  ├── _updateDayNight(dt)  → Ciclo sol/luna, sky dome, estrellas, fog (SPEC-026)
  ├── _initClouds()        → 3 planos de nubes procedurales (SPEC-032)
  ├── _updateClouds(dt)    → Viento, color dinamico, opacidad
  ├── _initAudio()         → Web Audio API (SPEC-034)
  ├── _playSound(type)     → jump, land, break, place, splash
  ├── _updateMinimap()     → Canvas 120px con biomas y marker (SPEC-035)
  ├── _updateClock()       → Display HH:MM (SPEC-035)
  ├── _die() / _respawn()  → Death screen y respawn (SPEC-035)
  ├── updateHUD()          → FPS, coords, bioma, chunks, stamina
  └── animate()            → Game loop (requestAnimationFrame)
```

## Pipeline de Renderizado

```
1. WorldGenerator.getHeight(x, z)
     └── PerlinNoise.fbm() × 4 noises (continental, base, erosion, detail)
     └── River noise (winding rivers)

2. WorldGenerator.getBlock(x, y, z)
     ├── getHeight() → altura del terreno
     ├── getBiome() → tipo de bioma
     ├── isCave() → aire subterraneo (spaghetti + cheese caves)
     ├── isRavine() → cortes verticales
     ├── getOreAt() → minerales por profundidad
     └── Asignar bloque (grass, dirt, stone, sand, water, lava, etc.)

3. VoxelChunk.generate()
     ├── Llenar blocks[16×64×16] con getBlock()
     ├── Colocar arboles (hasTreeAt → _placeTree → 6 tipos por bioma)
     │     ├── Oak (plains/forest) — copa redondeada asimetrica
     │     ├── Jungle (jungle) — tronco 2x2, altura 8-12
     │     ├── Spruce (taiga/snow) — copa conica
     │     ├── Mangrove (mangrove) — raices visibles
     │     ├── Dead (badlands/savanna) — sin hojas, ramas
     │     └── Savanna (savanna) — tronco grueso, copa plana
     ├── Colocar cactus (hasCactusAt → _placeCactus)
     ├── Colocar dead bushes
     ├── Colocar vegetacion (tall grass, flowers, ferns)
     └── Colocar estructuras (getStructureAt → 14 tipos)

4. buildChunkMesh(chunk, world, lodLevel)
     ├── Face culling: solo caras expuestas a aire/agua
     ├── Cross-chunk boundary check: skip same-chunk AIR→solid duplicate faces (BUG-005)
     ├── Real greedy meshing (SPEC-036): merge adjacent same-block faces into larger quads
     │     ├── Mask-based: scan slices perpendicular to each face direction
     │     ├── Merge runs in u/v axes for same block type
     │     ├── ~30-50% less vertices vs per-face approach
     │     └── Winding order corrected per face direction (CCW from outside)
     ├── LOD levels (SPEC-037):
     │     ├── LOD 0 (dist ≤ 3): full detail + AO
     │     ├── LOD 1 (dist ≤ 5): no AO
     │     └── LOD 2 (dist > 5): no AO + skip transparent faces
     ├── Color por bloque + shading direccional (top=1.0, bottom=0.6, sides=0.7-0.8)
     ├── Ambient Occlusion: oscurece vertices segun vecinos solidos (0.55-1.0, solo LOD 0)
     ├── Color variation: ±5% por posicion hash(x,y,z) evita colores planos
     ├── Grass per-face: top=verde, sides=tierra+verde, bottom=tierra
     ├── Ore patterns: vetas de mineral sobre stone (noise por vertex)
     └── Transparent blocks (glass, leaves) render faces adyacentes a diferentes bloques

5. buildWaterMesh(chunk, world)
     ├── Solo cara superior del agua (y + 0.9)
     ├── Color por profundidad (shallow turquesa → deep azul)
     ├── Shoreline boost (+0.12) si bloque inferior es sand/sandstone
     ├── waveOffsets almacenados para animación
     └── Material: opacity 0.72, metalness 0.3, emissive 0x112244

6. ChunkManager.update(playerX, playerZ, camera, fps)
     ├── Generar chunks cercanos (max 2 por frame, ordenados por distancia)
     ├── Web Worker: chunks enviados a worker, pendingChunks rastrea respuestas
     ├── LOD por distancia: LOD 0 (≤3 chunks), LOD 1 (≤5), LOD 2 (>5) (SPEC-037)
     ├── Descargar chunks lejanos (> adaptiveRenderDist + 1)
     ├── Adaptive render distance: FPS <30 → dist 3, FPS >55 → dist 5
     ├── Frustum culling: hide meshes outside camera view (skip close chunks)
     ├── Shadows disabled for LOD > 0 chunks
     └── RENDER_DIST = 5 chunks (radio ~80 bloques)

7. ChunkManager.updateWaterWaves(dt)
     ├── Sin(x*0.3 + t*1.5) * 0.08 + Sin(z*0.2 + t*1.2) * 0.06
     ├── Vertex Y displacement por frame
     └── computeVertexNormals() para iluminación correcta
```

## Constantes del Mundo

| Constante | Valor | Descripcion |
|-----------|-------|-------------|
| `CHUNK_SIZE` | 16 | Bloques por lado (X, Z) |
| `CHUNK_HEIGHT` | 64 | Altura maxima (Y) |
| `WATER_LEVEL` | 20 | Nivel del mar |
| `RENDER_DIST` | 5 | Radio de chunks a generar |
| `WORLD_MIN_Y` | 0 | Altura minima del mundo |

## Motor Alternativo: jardvoxel-survival-engine.js

Pipeline de generacion basado en Voxel Wiki:

```
1. Continentalness → Spline → altura base
2. Erosion → Spline → factor de aplanamiento
3. Weirdness → PV (peaks & valleys)
4. getBaseHeight() → combina splines + rivers
5. getDensity(x, y, z) → 3D noise + height bias
6. applyCaves() → cheese + spaghetti + noodle caves
7. getBlockType() → solid/water/air + aquifer
8. getBiome() → temperatura + humedad + altura
```

Diferencias clave vs motor principal:
- Altura mundial: 384 (vs 64)
- Nivel del mar: 63 (vs 20)
- Usa splines cubic hermite para terrain shaping
- Sistema de acuiferos (aquifers) para agua subterranea
- 17 biomas (vs 16)
- GreedyMesher simplificado (solo superficie superior)
- `noise2D`/`fbm2D` dedicados para 2D noise (BUG-010)
- `_getSplineParams` cache para evitar redundancia en getBiome (BUG-010)
- No incluye gameplay (sin player, sin controles)

## Sistema de Cielo (SPEC-026)

```
SkyDome (ShaderMaterial, BackSide, r=500)
  ├── Gradiente vertical: topColor ↔ bottomColor
  ├── Interpolación: day → sunset → night
  ├── Sigue al jugador (position.copy)
  └── Fog color = bottomColor

Sun (MeshBasicMaterial, r=8, emisivo amarillo)
  ├── Halo glow (r=14, opacity 0.25, BackSide)
  ├── Posición sigue ángulo de dayTime
  └── Visible cuando sunY > -0.05

Moon (MeshBasicMaterial, r=5, gris)
  ├── Opuesta al sol
  └── Visible cuando sunY < 0.05

Stars (THREE.Points, ~800 puntos)
  ├── Hemiesfera superior (r=450)
  ├── Opacity = max(0, 1 - dayFactor * 2.5)
  └── Rotación lenta (0.005 rad/s)
```

## Sistema de Agua Animada (SPEC-027)

```
buildWaterMesh
  ├── Color por profundidad (shallow → deep)
  ├── Shoreline boost (+0.12 si sand debajo)
  ├── waveOffsets: posiciones base para animación
  └── Material: opacity 0.72, metalness 0.3, emissive 0x112244

updateWaterWaves(dt)
  ├── wave = sin(x*0.3 + t*1.5) * 0.08 + sin(z*0.2 + t*1.2) * 0.06
  ├── Y vertex displacement por frame
  └── computeVertexNormals() cada frame
```

## Sistema de Nubes Procedurales (SPEC-032)

```
_initClouds()
  ├── Canvas 256x256 con multi-octave noise (sines)
  ├── Threshold > 0.55 para forma de nube
  ├── CanvasTexture con RepeatWrapping
  ├── 3 planos (PlaneGeometry 800x800) a alturas 55, 58, 61
  ├── Material: transparent, opacity 0.5-0.6, depthWrite false
  └── Rotacion -PI/2 (horizontales)

_updateClouds(dt)
  ├── Seguir al jugador (position.x/z = camera)
  ├── Wind: texture offset.x += dt * 0.005 * (1 + i*0.3)
  ├── Color dinamico: blanco → rosa sunset → gris noche
  └── Opacidad: (0.5 - i*0.1) * (0.3 + dayFactor * 0.7)
```

## Sistema de Audio (SPEC-034)

```
_initAudio()
  └── AudioContext (Web Audio API)

_playSound(type)
  ├── jump   → sine 300→500Hz, 0.15s
  ├── land   → sine 150→80Hz, 0.12s
  ├── break  → square 200→100Hz, 0.10s
  ├── place  → square 400→300Hz, 0.08s
  └── splash → sawtooth 100→200Hz, 0.25s
```

## Gameplay Systems (SPEC-033/034/035)

### Inventario
- Panel con grid de todos los bloques colocables
- Click asigna bloque al slot seleccionado del hotbar
- Toggle con tecla E

### Mining con Progreso
- Tiempo de minado = BLOCK_HARDNESS[block] segundos
- Overlay visual de crack sobre el bloque
- Modo Creativo: minado instantaneo

### Fisica Avanzada
- Nado: flotabilidad en agua, velocidad reducida
- Fall damage: muerte si caida > N bloques sin volar
- Sprint con stamina: barra que se regenera
- Crouch (Ctrl): velocidad reducida, anti-caida

### UI/UX
- Minimapa 120px: biomas con colores, marker de jugador + direccion
- Clock: display HH:MM basado en dayTime
- Death screen: causa de muerte + boton respawn
- Mode indicator: Creativo/Survival

## Renderizado Avanzado (SPEC-036/037)

### Real Greedy Meshing (SPEC-036)
- Merge adjacent same-block faces into larger quads via mask-based scanning
- Scan slices perpendicular to each face direction (6 directions)
- Merge runs in u/v axes for same block type
- ~30-50% reduction in vertex count vs per-face approach
- Winding order corrected per face direction (CCW from outside)

### Tone Mapping (SPEC-036)
- ACESFilmic tone mapping para rango cinematografico de color
- `renderer.toneMapping = THREE.ACESFilmicToneMapping`

### PointLight Pool (SPEC-036)
- 8 dynamic PointLights para torches/lanterns cerca del jugador (≤12 bloques)
- Lights sorted by distance, solo los 8 mas cercanos activados
- Pool reutilizado al moverse el jugador

### Web Worker Chunk Generation (SPEC-037)
- `jardvoxel-worker.js` (module worker) genera chunks off-main-thread
- Zero-copy transfer de ArrayBuffer (blocks) al main thread
- `pendingChunks` Set rastrea chunks en proceso
- Fallback a sync generation si worker unavailable
- Worker recibe seed via `postMessage({ type: 'init', seed })` (BUG-001)

### LOD by Distance (SPEC-037)
- LOD 0 (dist ≤ 3 chunks): full detail + AO + shadows
- LOD 1 (dist ≤ 5 chunks): no AO, shadows disabled
- LOD 2 (dist > 5 chunks): no AO + skip transparent faces, shadows disabled

## Rendimiento

- **Chunk generation:** ~5-15ms por chunk (offloaded to Web Worker)
- **Max 2 chunks/frame** para evitar stutter
- **Height cache:** 50,000 entradas (LRU eviction)
- **Density cache (survival engine):** 50,000 entradas
- **Face culling:** Solo caras expuestas se renderizan
- **Real greedy meshing:** Merge adjacent faces, ~30-50% less vertices (SPEC-036)
- **Frustum culling:** Chunks fuera de vista ocultos (SPEC-037)
- **Adaptive LOD:** Render distance ajusta segun FPS (3-5 chunks)
- **LOD by distance:** 3 levels (full → no AO → no AO+no transparent) (SPEC-037)
- **AO cache:** Vertex AO cacheado por chunk, skipped at LOD > 0 (SPEC-036)
- **Web Worker:** Chunk generation offloaded, zero-copy transfer (SPEC-037)
- **Tone mapping:** ACESFilmic para color cinematografico (SPEC-036)
- **PointLight pool:** 8 dynamic lights for torches/lanterns (SPEC-036)
- **Sombras:** PCFSoftShadowMap 2048x2048 (disabled for LOD > 0)
- **Pixel ratio:** Limitado a 2x (retina)

## Survival Variant — Survival Systems (SPEC-041 to SPEC-044)

### Passive Mobs (SPEC-041)
```
jardvoxel-survival-mobs.js
  ├── Mob (entity class)
  │     ├── AI states: idle, wander, flee
  │     ├── Types: cow, pig, sheep, chicken (biome-dependent)
  │     ├── Health, damage, hit flash, death animation
  │     ├── Gravity + collision with world blocks
  │     ├── Bobbing animation (y-offset sin wave)
  │     └── Drops: leather, raw beef, feathers, wool, etc.
  ├── MobManager
  │     ├── Spawn near player (biome-aware, max 15 mobs)
  │     ├── Despawn when > 40 blocks from player
  │     ├── hitTest(ray origin, dir, maxDist) → combat
  │     ├── killMob(mob) → drops array
  │     └── serialize/deserialize for save system
  └── MOB_BLOCK_IDS, FOOD_BLOCKS (shared exports)
```

### Health & Hunger System (SPEC-042)
```
jardvoxel-survival-health.js
  ├── HealthHungerSystem
  │     ├── 20 HP (10 hearts), 20 hunger (10 drumsticks)
  │     ├── Saturation buffer (max 5)
  │     ├── Hunger drain: sprint 2x, food poisoning 2x
  │     ├── Health regen: hunger >= 18 → +1 HP / 4s
  │     ├── Starvation: hunger = 0 → -1 HP / 4s
  │     ├── Drowning: in water 30s → -1 HP / 2s
  │     ├── Fall damage: > 3 blocks → (distance - 3) HP
  │     ├── Food items: raw/cooked meats, poison chance
  │     ├── Creative mode: immune to all damage
  │     └── Death screen + respawn
  └── HUD: hearts, drumsticks, damage flash overlay
```

### Furnace & Smelting (SPEC-043)
```
jardvoxel-survival-furnace.js
  ├── SMELTING_RECIPES: ore→ingot, sand→glass, raw→cooked food
  ├── FUEL_TYPES: logs, planks, sticks, coal ore
  ├── FurnaceEntity
  │     ├── Input slot, fuel slot, output slot
  │     ├── Burn time (seconds), cook time (seconds)
  │     ├── tick(dt): consume fuel, cook input, produce output
  │     └── PointLight when burning (orange, range 8)
  ├── FurnaceManager
  │     ├── Map of placed furnaces by position key
  │     ├── addFurnace/removeFurnace on block place/break
  │     ├── update(dt): tick all furnaces, manage lights
  │     └── serialize/deserialize
  └── UI: right-click furnace → panel with 3 slots + flame indicator
```

### Weather System (SPEC-044)
```
jardvoxel-survival-weather.js
  ├── WeatherManager
  │     ├── States: clear, rain, snow, thunder
  │     ├── Biome-aware: snow biomes → snow, others → rain/thunder
  │     ├── Duration: 60-300s per weather cycle
  │     ├── Rain particles: 800 points, fast vertical velocity
  │     ├── Snow particles: 800 points, slow + drift velocity
  │     ├── Lightning: ambient flash during thunder (double flash)
  │     ├── Scene fog/background color changes per weather
  │     └── HUD indicator: rain/snow/thunder icons
  └── Particle system follows player position
```

### New Block IDs (SPEC-041/042/043)
```
54: Leather        55: Raw Beef       56: Raw Porkchop
57: Feather        58: Raw Chicken    59: Wool
60: Raw Mutton     61: Cooked Beef    62: Cooked Porkchop
63: Cooked Chicken 64: Cooked Mutton  65: Iron Ingot
66: Gold Ingot
```

## Survival Systems v4.1.0 (SPEC-051 to SPEC-056)

### Tools & Armor (SPEC-051)
```
jardvoxel-survival-tools.js
  ├── ToolItem
  │     ├── blockId, durability, maxDurability, enchantments
  │     ├── Tool types: pickaxe, axe, shovel, sword
  │     ├── Material tiers: wood (60), stone (130), iron (250), diamond (1560)
  │     ├── Mining speed multiplier (2x-10x) when correct tool matches block
  │     ├── Sword damage bonus by material (1-8)
  │     ├── takeDamage() on use, isBroken()
  │     └── serialize/deserialize
  ├── EquipmentManager
  │     ├── Equipped tool slot + 4 armor slots (helmet, chest, legs, boots)
  │     ├── Armor damage reduction: 8%+12%+10%+4% (max 80% total)
  │     ├── Durability consumption on mine and player hit
  │     └── serialize/deserialize
  ├── TOOL_MAP: blockId → { type, material }
  ├── ARMOR_MAP: blockId → slot
  └── ARMOR_SLOTS: ['helmet', 'chestplate', 'leggings', 'boots']
```

### Experience & Enchanting (SPEC-052)
```
jardvoxel-survival-enchanting.js
  ├── XPManager
  │     ├── XP orbs with gravity + float-to-player (3 blocks)
  │     ├── Level system: cost = (level+1) × 10
  │     ├── XP drops: coal(1), iron(2), gold(3), diamond(5)
  │     └── serialize/deserialize
  ├── EnchantManager
  │     ├── 3 random options per roll at enchanting table
  │     ├── 5 enchantments: Efficiency, Unbreaking, Sharpness, Protection, Fortune
  │     └── One enchantment per item (simplified)
  └── Blocks: Enchanting Table(100), Lapis Block(101), Book(102)
```

### Villager NPCs & Trading (SPEC-053)
```
jardvoxel-survival-villagers.js
  ├── Villager
  │     ├── Wandering AI, gravity, collision
  │     ├── 4 professions: Farmer, Butcher, Blacksmith, Librarian
  │     ├── Box-based 3D model (body, head, hat)
  │     └── Profession colors + hat colors
  ├── VillagerManager
  │     ├── Spawn, update loop, nearby detection
  │     └── serialize/deserialize
  ├── TradingManager
  │     ├── Trade UI with give/receive system
  │     ├── Trade execution with inventory check
  │     └── Profession-specific trade definitions
  └── Items: Emerald(103), Villager Spawn Egg(104)
```

### Fishing System (SPEC-054)
```
jardvoxel-survival-fishing.js
  ├── FishingManager
  │     ├── 5-state machine: Idle → Casting → Waiting → Biting → Reeling
  │     ├── Raycast to find water (max 30 blocks)
  │     ├── Bobber mesh: arc cast, bobbing, dip on bite
  │     ├── Random wait 3-15s, 1.5s bite window
  │     └── Weighted catch table: Fish(60%), Pufferfish(15%), Bones(10%), Ink(8%), String(5%), Leather(2%)
  └── Items: Fishing Rod(105), Raw Fish(106), Cooked Fish(107), Pufferfish(108), Ink Sac(109)
```

### Nether Dimension (SPEC-055)
```
jardvoxel-survival-nether.js
  ├── NetherGenerator
  │     ├── Noise-based terrain with netherrack floor/ceiling
  │     ├── Soul sand patches, quartz ore, glowstone deposits
  │     └── Lava pockets
  ├── PortalManager
  │     ├── Portal location tracking
  │     └── Dimension switching (overworld ↔ nether)
  └── Blocks (110-119): Netherrack, Nether Brick, Soul Sand, Glowstone,
      Nether Quartz Ore, Lava, Portal, Quartz, Blaze Rod, Nether Wart
```

### Redstone Basics (SPEC-056)
```
jardvoxel-survival-redstone.js
  ├── RedstoneManager
  │     ├── Power propagation system with BFS queue
  │     ├── Power level 0-15, decrements by 1 per dust block
  │     ├── Lever toggle: activates/deactivates network
  │     ├── 6-directional neighbor checking for dust
  │     ├── isPowered() / getPower() queries
  │     └── Piston activation + lamp toggle
  └── Blocks (120-125): Redstone Dust, Redstone Torch, Lever,
      Piston, Redstone Lamp, Redstone Repeater
```

## Survival Systems v4.2.0 (SPEC-057 to SPEC-066)

### ChillTune Music Engine (SPEC-057)
```
jardvoxel-survival-chilltune.js
  ├── ChillTuneEngine
  │     ├── Procedural 8-bit chiptune via Web Audio API
  │     ├── 5 modal scales: Dorian, Aeolian, Lydian, Phrygian, Pentatonic
  │     ├── 7 game states: exploring, building, mining, combat, night, underwater, idle
  │     ├── 3-layer synthesis: drone (root+LFO), melody (weighted random), arpeggio
  │     ├── Crossfade transitions (3-8s), no abrupt cuts
  │     ├── Reverb node + breath LFO for organic feel
  │     ├── Scheduler: 30ms lookahead timer, 150ms schedule-ahead
  │     ├── Independent music volume (default 0.35), localStorage persistence
  │     └── Zero external dependencies (pure Web Audio API)
  └── State detection: playerY, moving, inWater, inCombat, timeOfDay
```

### Brewing & Potions (SPEC-062)
```
jardvoxel-survival-brewing.js
  ├── BrewingManager
  │     ├── 3-stage brewing: Water Bottle → Awkward Potion → Specific Potion → Splash
  │     ├── 7 stage-2 recipes (Speed, Strength, Healing, Night Vision, Fire Resistance, Regeneration, Water Breathing)
  │     ├── Stage 3: Potion + Gunpowder → Splash Potion
  │     └── Brew time: 20s per stage
  ├── PotionEffectManager
  │     ├── 7 effects with apply/remove/tick callbacks
  │     ├── Speed (180s, +20% speed), Strength (180s, +3 dmg)
  │     ├── Instant Healing (4 HP), Night Vision (180s)
  │     ├── Fire Resistance (180s), Regeneration (45s, 1 HP/s)
  │     └── Water Breathing (180s)
  └── Blocks (126-140): Brewing Stand, Glass Bottle, Cauldron, Water Bottle,
      Awkward Potion, 7 Potions, Splash Potion, Blaze Powder, Sugar
```

### Shields & Combat Defense (SPEC-063)
```
jardvoxel-survival-shields.js
  ├── ShieldItem
  │     ├── Durability tracking (336 max)
  │     ├── Banner color customization
  │     └── serialize/deserialize
  ├── ShieldManager
  │     ├── Blocking: 120-degree frontal cone
  │     ├── Shield disable: 10% chance on axe hit, 5s disable
  │     ├── Shield bash: 2.0 range, 3.0 knockback
  │     ├── Speed multiplier 0.5 while blocking
  │     └── tryBlockHit(attackDir) → boolean
  └── Blocks: Shield(151), Banner(152)
```

### Achievements System (SPEC-064)
```
jardvoxel-survival-achievements.js
  ├── AchievementManager
  │     ├── 30 achievements across 8 categories
  │     ├── Categories: mining, building, combat, exploration, crafting, survival, farming, redstone
  │     ├── Stat tracking: blocksBroken, blocksPlaced, mobsKilled, distanceTraveled, foodsEaten, cropsHarvested, fishCaught, potionsBrewed, potionsDrunk, hitsBlocked
  │     ├── Toast notification queue with slide-in animation
  │     ├── unlock(id) → checks criteria, shows toast
  │     └── serialize/deserialize for save system
  └── ACHIEVEMENTS: 30 achievement definitions with icon, name, desc, category
```

### Anvil & Item Repair (SPEC-065)
```
jardvoxel-survival-anvil.js
  ├── AnvilManager
  │     ├── 3 operations: rename, material repair, tool combination
  │     ├── Rename: custom name (max 30 chars), 1 XP level
  │     ├── Material repair: 25% max durability per material unit
  │     ├── Tool combination: merge durability + 10% bonus, merge enchantments
  │     ├── Anvil damage states (0-2), 25 max uses
  │     ├── Fall damage (2-6 HP) when dropped on entities
  │     ├── REPAIR_MATERIALS: wood→planks, stone→cobblestone, iron→iron_ingot, diamond→diamond_ore
  │     └── calculateResult(xpLevel) → output item or null
  └── Block: Anvil(153)
```

### Map & Cartography (SPEC-066)
```
jardvoxel-survival-map.js
  ├── MapManager
  │     ├── Map data: RGBA pixel buffer (Uint8ClampedArray)
  │     ├── 4 tier sizes: 128, 256, 512, 1024 blocks
  │     ├── Block color mapping for 20+ block types
  │     ├── Exploration tracking: unexplored = black, updates every 4 blocks
  │     ├── createMap(centerX, centerZ, tier)
  │     ├── updateFromWorld(world, playerX, playerZ) → render terrain to canvas
  │     └── Map upgrade via cartography table
  ├── Blocks: Map(154), Compass(155), Cartography Table(156)
  └── Crafting: Compass (iron+redstone), Map (paper+compass), Cartography Table (planks+paper)
```

### Module Dependency Graph (v4.2.0)
```
jardvoxel-survival.html
  ├── jardvoxel-survival-gameplay.js
  │     ├── jardvoxel-survival-engine.js
  │     ├── jardvoxel-survival-mesher.js
  │     │     ├── jardvoxel-survival-tools.js
  │     │     ├── jardvoxel-survival-enchanting.js
  │     │     ├── jardvoxel-survival-villagers.js
  │     │     ├── jardvoxel-survival-fishing.js
  │     │     ├── jardvoxel-survival-nether.js
  │     │     ├── jardvoxel-survival-redstone.js
  │     │     ├── jardvoxel-survival-brewing.js → nether.js
  │     │     ├── jardvoxel-survival-shields.js
  │     │     ├── jardvoxel-survival-anvil.js → tools.js
  │     │     └── jardvoxel-survival-map.js
  │     └── jardvoxel-survival-features.js → nether.js
  ├── jardvoxel-survival-crafting.js
  ├── jardvoxel-survival-save.js
  ├── jardvoxel-survival-particles.js
  ├── jardvoxel-survival-mobs.js
  ├── jardvoxel-survival-health.js
  ├── jardvoxel-survival-furnace.js
  ├── jardvoxel-survival-weather.js
  ├── jardvoxel-survival-chilltune.js
  ├── jardvoxel-survival-achievements.js
  └── jardvoxel-survival-worker.js
```
