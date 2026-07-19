# JardVoxel — Testing del Core

Suite de tests unitarios para los modulos core de JardVoxel usando **Vitest 2.1.9** con entorno **jsdom**.

## Ejecutar

```bash
cd games/jardvoxel
npx vitest run          # ejecutar una vez
npx vitest              # watch mode
npx vitest run --reporter verbose  # salida detallada
```

## Resultado actual

```
Test Files  33 passed (33)
     Tests  163+ passed
  Duration  ~10s
```

## Cobertura por modulo

### Core Tests (9 archivos, 163 tests)

| Archivo | Tests | Modulo | Que se testea |
|---------|-------|--------|---------------|
| `blocks-registry.test.js` | 22 | `blocks-registry.js` | BLOCK, MC_BLOCKS, colores, nombres, hardness, placeable blocks, cross-consistency |
| `engine.test.js` | 31 | `jardvoxel-survival-engine.js` | PRNG (determinismo, rango), PerlinNoise3D (noise2D/3D, fbm), Spline (interpolacion, clamping), WorldGenPipeline, VoxelChunk (generate, getBlock, setBlock, bounds), GreedyMesher |
| `crafting.test.js` | 12 | `jardvoxel-survival-crafting.js` | RECIPES, CraftingManager (shaped, shapeless, normalizacion, consumeGrid) |
| `health.test.js` | 21 | `jardvoxel-survival-health.js` | HealthHungerSystem (damage, heal, eat, creative mode, regen, starvation, drowning, respawn, serialize) |
| `tools.test.js` | 26 | `jardvoxel-survival-tools.js` | ToolItem (durability, mining speed, damage bonus), EquipmentManager (equip/unequip, armor reduction, serialize), helper functions |
| `furnace.test.js` | 17 | `jardvoxel-survival-furnace.js` | SMELTING_RECIPES, FUEL_TYPES, FurnaceEntity (cook, burn, serialize), FurnaceManager (add/remove/update) |
| `achievements.test.js` | 13 | `jardvoxel-survival-achievements.js` | ACHIEVEMENTS, AchievementManager (unlock, stats, auto-unlock, serialize) |
| `gameplay.test.js` | 11 | `jardvoxel-survival-gameplay.js` | Inventory (hotbar, addBlock, removeSelected, creative vs survival) |
| `save.test.js` | 10 | `jardvoxel-survival-save.js` | SaveManager (init, saveWorld/loadWorld, saveChunk/loadChunk, getAllChunkKeys, clearAll, autosave) |

### Extended Tests (24 archivos adicionales)

| Archivo | Modulo testado |
|---------|----------------|
| `noise-system.test.js` | SimplexNoise, DomainWarper, NOISE_CONFIGS, TerrainSplines, BiomeBlender |
| `biome-identity.test.js` | BiomeIdentityManager (identidad visual, sonido, fauna por bioma) |
| `ambient-sound.test.js` | AmbientSoundManager (perfiles, ciclo fauna dawn/day/dusk/night, reverberacion) |
| `ambient-particles.test.js` | AmbientParticleSystem (particulas por bioma) |
| `chilltune2.test.js` | ChillTuneEngine 2.0 (estados, escalas, crossfade, stingers) |
| `conversation.test.js` | ConversationSystem (dialogo natural, contexto, JSON) |
| `quests.test.js` | QuestManager (misiones dinamicas, progreso, completado) |
| `npc-memory.test.js` | NPCMemorySystem (memoria persistente, relaciones) |
| `civilizations.test.js` | CivilizationSystem (civilizaciones antiguas, descubrimiento) |
| `lore.test.js` | LoreGenerator (lore procedural, libros) |
| `narrative-structures.test.js` | NarrativeStructures (estructuras con historia, loot) |
| `events.test.js` | EventManager (eventos emergentes) |
| `fog.test.js` | VolumetricFog (niebla atmosferica, getter .fog) |
| `forest-canopy.test.js` | ForestCanopyManager (canopy visual, fog enhancement) |
| `interior-lighting.test.js` | InteriorLightingManager (luz interior) |
| `postprocessing.test.js` | PostprocessingManager (bloom, tonemapping) |
| `shadow.test.js` | ShadowManager (sombras suaves PCF) |
| `water.test.js` | WaterMaterialManager (agua transparente) |
| `tree-personality.test.js` | TreePersonalitySystem (personalidad de arboles) |
| `ground-vegetation.test.js` | GroundVegetation (vegetacion de suelo) |
| `ui-overhaul.test.js` | UIManager 5.0 (dialogue, quest tracker, journal, toasts) |
| `ai-server.test.js` | AI Server (Ollama integration, LLM interface) |
| `hydrology.test.js` | HydrologySystem (rios, lagos, erosion) |
| `voronoi.test.js` | VoronoiBiomes (fronteras naturales) |

## Configuracion

### vitest.config.js

- **Entorno:** jsdom (DOM simulado)
- **Alias:** `three` y `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js` → `tests/mocks/three.js`
- **Setup:** `tests/setup.js` (mocks globales)

### tests/setup.js

Mocks globales para el entorno Node:

- **localStorage** — Map-based, compatible con API del navegador
- **indexedDB** — Mock completo con `open`, `createObjectStore`, `transaction`, `put`, `get`, `getAllKeys`, `clear`
- **console.warn** — silenciado para reducir ruido

### tests/mocks/three.js

Mock minimal de Three.js con las clases usadas por el core:

- `Vector3` — set, copy, add, multiplyScalar, clone
- `Group` — children, add, remove
- `Mesh` — geometry, material, position
- `Scene` — children, add, remove
- `PerspectiveCamera`, `Raycaster`, `PointLight`, `BoxGeometry`, `MeshLambertMaterial`, `Color`, `MathUtils`

### Dependencias

`node_modules` es un symlink a `jardfruit-pro/node_modules` (compartido, evita duplicar instalacion).

```bash
# Si el symlink se pierde:
ln -sf ../jardfruit-pro/node_modules node_modules
```

## Modulos no testeados (aun)

Los siguientes modulos requieren mocks mas complejos de Three.js o integracion completa:

- `jardvoxel-survival-mobs.js` — requiere mock de Mesh/Geometry + IA
- `jardvoxel-survival-features.js` — requiere WorldGenPipeline + VoxelChunk integrados
- `jardvoxel-survival-mesher.js` — requiere mock de BufferGeometry
- `jardvoxel-survival-weather.js` — requiere Scene + DayNightCycle
- `jardvoxel-survival-particles.js` — requiere Scene + BufferGeometry
- `jardvoxel-survival-character.js` — requiere mock extenso de Three.js
- `jardvoxel-survival-gameplay.js` (SurvivalWorld, PlayerController, DayNightCycle, GameAudio) — requieren Three.js + DOM
- `jardvoxel-zen-game.js` — requiere integracion completa + Three.js
- Modulos world hierarchy: world-hierarchy, landmarks, ecosystems, contextual, layers, streaming, worker-pool, microsectors, instanced, poisson

## Como anadir tests nuevos

1. Crear `tests/[modulo].test.js`
2. Importar desde `../core/[modulo].js`
3. Si el modulo importa `three`, el alias ya esta configurado
4. Si necesita IndexedDB o localStorage, los mocks ya estan en `setup.js`
5. Ejecutar: `npx vitest run tests/[modulo].test.js`
