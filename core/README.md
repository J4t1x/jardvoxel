# JardVoxel Core Engine

Motor modular de JardVoxel. Todos los archivos `.js` estan centralizados aqui para facilitar la reutilizacion entre diferentes versiones del juego.

**Version actual:** v8.0.0 — Zen Unified
**Total modulos:** 74 archivos JS

## Estructura

### Motor Base
- **jardvoxel-engine.js** - Motor voxel base (generación de mundo, chunks, bloques)
- **jardvoxel-worker.js** - Web Worker para generación de chunks

### Survival Mode - Módulos Core
- **jardvoxel-survival-engine.js** - Motor de generación procedural (biomas, ruido, pipeline v6.0)
- **jardvoxel-survival-noise.js** - Sistema de ruido v6.0 (SimplexNoise, DomainWarper, TerrainSplines, BiomeBlender)
- **jardvoxel-survival-mesher.js** - Sistema de meshing optimizado (greedy meshing, AO, water)
- **jardvoxel-survival-gameplay.js** - Lógica principal del juego (mundo, jugador, inventario, dia/noche, audio)
- **jardvoxel-survival-features.js** - Generación de estructuras (árboles, cuevas, minerales, decoración)
- **blocks-registry.js** - Catalogo de 157 bloques (colores, hardness, nombres, transparencia)

### Survival Mode - Sistemas de Juego
- **jardvoxel-survival-crafting.js** - Sistema de crafteo
- **jardvoxel-survival-health.js** - Sistema de salud y hambre
- **jardvoxel-survival-save.js** - Sistema de guardado (IndexedDB)
- **jardvoxel-survival-particles.js** - Sistema de partículas

### Survival Mode - Características Avanzadas
- **jardvoxel-survival-mobs.js** - Sistema de mobs (zombies, esqueletos, creepers)
- **jardvoxel-survival-furnace.js** - Sistema de hornos y fundición
- **jardvoxel-survival-weather.js** - Sistema de clima (lluvia, nieve, tormentas)
- **jardvoxel-survival-tools.js** - Sistema de herramientas y armaduras
- **jardvoxel-survival-enchanting.js** - Sistema de encantamientos y XP
- **jardvoxel-survival-villagers.js** - Sistema de aldeanos y comercio
- **jardvoxel-survival-fishing.js** - Sistema de pesca
- **jardvoxel-survival-nether.js** - Generación del Nether y portales
- **jardvoxel-survival-redstone.js** - Sistema de redstone
- **jardvoxel-survival-brewing.js** - Sistema de pociones y efectos
- **jardvoxel-survival-shields.js** - Sistema de escudos
- **jardvoxel-survival-achievements.js** - Sistema de logros
- **jardvoxel-survival-anvil.js** - Sistema de yunques
- **jardvoxel-survival-map.js** - Sistema de mapas
- **jardvoxel-survival-chilltune.js** - Motor de musica (ambient deep space + chiptune 7 estados)

### Survival Mode - Living World (v5.0)
- **jardvoxel-survival-biome-identity.js** - Identidad visual, sonido y fauna por bioma
- **jardvoxel-survival-ambient-particles.js** - Partículas ambientales por bioma
- **jardvoxel-survival-ambient-sound.js** - Sonido ambiental procedural por bioma
- **jardvoxel-survival-narrative-structures.js** - Estructuras con historia y loot procedural
- **jardvoxel-survival-lore.js** - Generador de lore procedural
- **jardvoxel-survival-civilizations.js** - Civilizaciones antiguas del mundo
- **jardvoxel-survival-npc-memory.js** - Memoria persistente de NPCs
- **jardvoxel-survival-conversation.js** - Conversaciones naturales con NPCs
- **jardvoxel-survival-quests.js** - Sistema de misiones dinámicas
- **jardvoxel-survival-events.js** - Eventos emergentes del mundo
- **jardvoxel-survival-ai-client.js** - Cliente WebSocket para el AI Server
- **ai-server/server.js** - Servidor de IA desacoplado para NPCs y quests (Ollama)

### Survival Mode - Sistemas Visuales (v5.0)
- **jardvoxel-survival-postprocessing.js** - Postprocessing (bloom, tonemapping ACES)
- **jardvoxel-survival-shadow.js** - ShadowManager (sombras suaves PCF)
- **jardvoxel-survival-fog.js** - VolumetricFog (niebla atmosferica)
- **jardvoxel-survival-water.js** - WaterMaterialManager (agua transparente)
- **jardvoxel-survival-interior-lighting.js** - InteriorLightingManager (luz interior)
- **jardvoxel-survival-character.js** - CharacterGenerator + CharacterAnimator (37M combinaciones)
- **jardvoxel-survival-thirdperson.js** - ThirdPersonCamera (camara con colision)
- **jardvoxel-survival-ui.js** - UIManager 5.0 (dialogue, quest tracker, journal, toasts)

### Survival Mode - World Hierarchy & Organic Terrain (v7.0)
- **jardvoxel-survival-world-hierarchy.js** - WorldIdentity, ContinentGenerator, RegionGenerator, ZoneGenerator
- **jardvoxel-survival-hydrology.js** - HydrologySystem (rios, lagos, erosion hidrica)
- **jardvoxel-survival-tree-personality.js** - TreePersonalitySystem (personalidad de arboles)
- **jardvoxel-survival-voronoi.js** - VoronoiBiomes (fronteras de biomas naturales)
- **jardvoxel-survival-poisson.js** - PoissonVegetation (distribucion Poisson)
- **jardvoxel-survival-instanced.js** - InstancedRenderer (renderizado instanciado)
- **jardvoxel-survival-microsectors.js** - MicrosectorSystem (detalle fino)
- **jardvoxel-survival-streaming.js** - StreamingSystem (carga/descarga dinamica)
- **jardvoxel-survival-worker-pool.js** - WorkerPool (multi-worker chunk generation)
- **jardvoxel-survival-landmarks.js** - LandmarkGenerator (hitos naturales)
- **jardvoxel-survival-ecosystems.js** - EcosystemSystem (flora/fauna interconectada)
- **jardvoxel-survival-contextual.js** - ContextualGenerator (generacion adaptativa)
- **jardvoxel-survival-layers.js** - LayerSystem (capas geologicas)

### Survival Mode - Sistemas Wellness (v7.0-v8.0, SPEC-099)
- **jardvoxel-survival-komorebi.js** - KomorebiSystem (luz filtrada por canopy)
- **jardvoxel-survival-resonance.js** - ResonanceSystem (tracking de comportamiento)
- **jardvoxel-survival-meditation-spaces.js** - MeditationSpaceGenerator (6 tipos de espacios)
- **jardvoxel-survival-living-world.js** - LivingWorldSystem (mundo vivo reactivo)
- **jardvoxel-survival-journal.js** - ExplorationJournal (registro automatico de momentos)

### Zen Garden (v8.0.0)
- **jardvoxel-zen-game.js** - ZenGame class (logica Zen Garden, ~25 imports de core/)
- **jardvoxel-zen-touch.js** - TouchJoystick + TouchControls para mobile

### Perfil Geografico
- **jardvoxel-patagonia.js** - Perfil Patagonia (43S-56S, Andes -> Steppe -> Atlantic, seed 142857)

### Survival Mode - Workers
- **jardvoxel-survival-worker.js** - Web Worker para generación de chunks en survival

## Uso

Importar módulos desde archivos HTML:

```javascript
// Modo Open World
import { WorldGenerator, ChunkManager } from './core/jardvoxel-engine.js';

// Modo Survival
import { SurvivalWorld, PlayerController } from './core/jardvoxel-survival-gameplay.js';
import { CraftingManager } from './core/jardvoxel-survival-crafting.js';
// ... otros módulos según necesidad
```

## Versiones

Cada versión de JardVoxel puede importar solo los módulos que necesite:

- **index.html** - Menu principal (selector de modo)
- **jardvoxel.html** - Open World (solo jardvoxel-engine.js)
- **jardvoxel-survival.html** - Survival completo (55 modulos)
- **jardvoxel-zen.html** - Zen Garden (~25 modulos, sin combate/mobs/hambre)

## Testing

La carpeta `tests/` (en la raiz del proyecto) contiene la suite de tests unitarios del core.

- **Framework:** Vitest 2.1.9 + jsdom
- **163+ tests** en **33 archivos** cubriendo core + wellness + living world
- **Mocks:** Three.js, localStorage, indexedDB
- Ver `docs/TESTING.md` para detalle completo

```bash
cd games/jardvoxel
npx vitest run
```

## Mantenimiento

- Todos los archivos `.js` deben estar en esta carpeta
- No hardcodear rutas absolutas
- Usar imports relativos desde la raíz del proyecto: `./core/nombre-archivo.js`
- Mantener módulos independientes y reutilizables
- Todo nuevo modulo debe tener su archivo de test correspondiente en `tests/`
