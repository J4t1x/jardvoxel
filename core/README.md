# JardVoxel Core Engine

Motor modular de JardVoxel. Todos los archivos `.js` están centralizados aquí para facilitar la reutilización entre diferentes versiones del juego.

## Estructura

### Motor Base
- **jardvoxel-engine.js** - Motor voxel base (generación de mundo, chunks, bloques)
- **jardvoxel-worker.js** - Web Worker para generación de chunks

### Survival Mode - Módulos Core
- **jardvoxel-survival-engine.js** - Motor de generación procedural (biomas, ruido Perlin)
- **jardvoxel-survival-mesher.js** - Sistema de meshing optimizado (greedy meshing)
- **jardvoxel-survival-gameplay.js** - Lógica principal del juego (mundo, jugador, inventario)
- **jardvoxel-survival-features.js** - Generación de estructuras (árboles, cuevas, minerales)

### Survival Mode - Sistemas de Juego
- **jardvoxel-survival-crafting.js** - Sistema de crafteo
- **jardvoxel-survival-health.js** - Sistema de salud y hambre
- **jardvoxel-survival-save.js** - Sistema de guardado (localStorage)
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
- **jardvoxel-survival-chilltune.js** - Motor de música procedural

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

- **jardvoxel.html** - Open World (solo jardvoxel-engine.js)
- **jardvoxel-survival.html** - Survival completo (todos los módulos)
- **Futuras versiones** - Pueden mezclar y combinar módulos según necesidad

## Mantenimiento

- Todos los archivos `.js` deben estar en esta carpeta
- No hardcodear rutas absolutas
- Usar imports relativos desde la raíz del proyecto: `./core/nombre-archivo.js`
- Mantener módulos independientes y reutilizables
