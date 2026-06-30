# SPEC-002: Minecraft-Style World Generation

**Proyecto**: jard-games  
**Tipo**: Feature  
**Prioridad**: Alta  
**Estimación**: 8-10 semanas  
**Fecha**: 2026-06-25

---

## Contexto

Implementar sistema de generación de mundo procedural completo basado en Minecraft, con 3D noise, splines, caves, aquifers, biomas y el pipeline de 11 pasos documentado en https://voxel-wiki.dev/w/World_generation

**Referencia**: `docs/MINECRAFT-WORLDGEN.md`

---

## Objetivos

### Core
1. Pipeline completo de generación (11 pasos)
2. 3D voxel engine con greedy meshing
3. 17+ biomas con transiciones suaves
4. 3 tipos de cuevas (cheese, spaghetti, noodle)
5. Sistema de aquifers
6. Structures básicas (árboles, pueblos)

### Performance
- 60 FPS con 8+ chunks visibles
- Generación en worker threads
- Frustum culling
- LOD system

### Gameplay
- Block breaking/placing
- Inventory system
- Crafting básico
- Day/night cycle

---

## Arquitectura

### Archivos

```
jard-games/
├── games/
│   ├── jardvoxel-survival.html          # Main game (nuevo)
│   ├── jardvoxel-survival-engine.js     # Core engine ✅
│   ├── jardvoxel-survival-mesher.js     # Greedy meshing (nuevo)
│   ├── jardvoxel-survival-features.js   # Trees, structures (nuevo)
│   └── jardvoxel-survival-gameplay.js   # Player, inventory (nuevo)
├── docs/
│   └── MINECRAFT-WORLDGEN.md             # Documentación técnica ✅
└── specs/
    └── pending/
        └── SPEC-002-minecraft-worldgen.md # Esta spec
```

### Módulos

#### 1. Core Engine ✅ (Completado)
- `PerlinNoise3D` — 3D Perlin noise
- `Spline` — Cubic hermite interpolation
- `MinecraftWorldGenerator` — Pipeline completo
- `VoxelChunk` — 16x384x16 voxel storage
- `GreedyMesher` — Mesh optimization (básico)

#### 2. Advanced Mesher (Nuevo)
- Full greedy meshing (6 direcciones)
- Face culling
- Ambient occlusion
- Texture atlas support

#### 3. Features Generator (Nuevo)
- Tree generation (4 tipos)
- Flower/grass decoration
- Ore veins
- Village generation
- Temple generation

#### 4. Gameplay System (Nuevo)
- Player controller (first-person)
- Block interaction (break/place)
- Inventory (9 slots hotbar)
- Crafting table
- Basic items

#### 5. Rendering System (Nuevo)
- Frustum culling
- LOD system
- Chunk pooling
- Worker thread generation
- Lighting system

---

## Fases de Implementación

### Fase 1: Core Voxel Engine (2 semanas)

**Objetivos:**
- Full greedy meshing
- Worker threads
- Frustum culling
- Chunk pooling

**Tareas:**

#### T1.1: Full Greedy Meshing
- [ ] Implementar meshing en 6 direcciones
- [ ] Face culling (no renderizar caras ocultas)
- [ ] Ambient occlusion (4 corners)
- [ ] Texture atlas (16x16 bloques)
- **Estimación**: 3 días

#### T1.2: Worker Thread Generation
- [ ] Crear `WorldGenWorker.js`
- [ ] Message passing (main ↔ worker)
- [ ] Queue de chunks pendientes
- [ ] Priority system (chunks cercanos primero)
- **Estimación**: 2 días

#### T1.3: Frustum Culling
- [ ] Calcular frustum de cámara
- [ ] AABB intersection test
- [ ] Solo renderizar chunks visibles
- **Estimación**: 1 día

#### T1.4: Chunk Pooling
- [ ] Pool de chunks reutilizables
- [ ] Evitar GC pauses
- [ ] Metrics (chunks activos, en pool)
- **Estimación**: 1 día

#### T1.5: Incremental Generation
- [ ] Generar chunks por capas (Y)
- [ ] Mostrar superficie primero
- [ ] Background generation de underground
- **Estimación**: 2 días

**Acceptance Criteria:**
- ✅ 60 FPS con 12+ chunks (192+ chunks totales)
- ✅ Generación no bloquea render thread
- ✅ Solo chunks visibles se renderizan
- ✅ Memoria estable (no memory leaks)

---

### Fase 2: Features & Structures (3 semanas)

**Objetivos:**
- Árboles procedurales
- Decoración de biomas
- Generación de minerales
- Estructuras (pueblos, templos)

**Tareas:**

#### T2.1: Tree Generation
- [ ] Oak tree (tronco + follaje)
- [ ] Birch tree (alto y delgado)
- [ ] Spruce tree (cónico)
- [ ] Jungle tree (grande, lianas)
- [ ] Placement rules (spacing, bioma)
- **Estimación**: 4 días

#### T2.2: Biome Decoration
- [ ] Grass/flowers en plains
- [ ] Cactus en desert
- [ ] Mushrooms en swamp
- [ ] Snow layers en snowy biomes
- [ ] Lily pads en water
- **Estimación**: 3 días

#### T2.3: Ore Generation
- [ ] Coal ore (Y=0-128, común)
- [ ] Iron ore (Y=-64-72, común)
- [ ] Gold ore (Y=-64-32, raro)
- [ ] Diamond ore (Y=-64-16, muy raro)
- [ ] Vein generation (blob shape)
- **Estimación**: 3 días

#### T2.4: Village Generation
- [ ] Structure templates (casa, pozo, granja)
- [ ] Placement (solo en plains/desert)
- [ ] Path generation
- [ ] Bounding box checks
- **Estimación**: 5 días

#### T2.5: Temple Generation
- [ ] Desert temple
- [ ] Jungle temple
- [ ] Placement rules
- [ ] Loot chests (futuro)
- **Estimación**: 3 días

**Acceptance Criteria:**
- ✅ Árboles generan correctamente en biomas apropiados
- ✅ Minerales distribuidos según altura
- ✅ Pueblos generan en plains/desert sin overlap
- ✅ Templos son raros pero descubribles

---

### Fase 3: Gameplay Systems (3 semanas)

**Objetivos:**
- Block breaking/placing
- Inventory system
- Crafting
- Day/night cycle

**Tareas:**

#### T3.1: Player Controller
- [ ] First-person camera (ya existe, mejorar)
- [ ] Raycast para block targeting
- [ ] Crosshair con block outline
- [ ] Collision con bloques
- **Estimación**: 3 días

#### T3.2: Block Interaction
- [ ] Left click = break block
- [ ] Right click = place block
- [ ] Break animation (cracks)
- [ ] Drop items
- [ ] Update chunk mesh
- **Estimación**: 4 días

#### T3.3: Inventory System
- [ ] 9 slots hotbar
- [ ] 27 slots main inventory
- [ ] Item stacks (max 64)
- [ ] Drag & drop
- [ ] Keyboard shortcuts (1-9)
- **Estimación**: 4 días

#### T3.4: Crafting System
- [ ] Crafting table block
- [ ] 3x3 crafting grid
- [ ] Recipe system (JSON)
- [ ] Shapeless recipes
- [ ] Output preview
- **Estimación**: 5 días

#### T3.5: Day/Night Cycle
- [ ] Sun rotation (24min cycle)
- [ ] Sky color gradient
- [ ] Ambient light change
- [ ] Moon phases (opcional)
- **Estimación**: 2 días

**Acceptance Criteria:**
- ✅ Bloques se rompen y colocan correctamente
- ✅ Inventory persiste items
- ✅ Crafting funciona con recetas básicas
- ✅ Ciclo día/noche visible y fluido

---

### Fase 4: Polish & Optimization (2 semanas)

**Objetivos:**
- Smooth biome transitions
- Better lighting
- Particle effects
- Sound system
- Save/load worlds

**Tareas:**

#### T4.1: Smooth Biome Transitions
- [ ] Interpolate colors entre biomas
- [ ] Blend radius (4-8 bloques)
- [ ] Height smoothing en bordes
- **Estimación**: 3 días

#### T4.2: Lighting System
- [ ] Block light (torches, lava)
- [ ] Sky light (sun)
- [ ] Light propagation (BFS)
- [ ] Smooth lighting (vertex colors)
- **Estimación**: 5 días

#### T4.3: Particle Effects
- [ ] Block break particles
- [ ] Water splash
- [ ] Torch flame
- [ ] Smoke
- **Estimación**: 2 días

#### T4.4: Sound System
- [ ] Block break sounds
- [ ] Footstep sounds
- [ ] Ambient sounds (birds, water)
- [ ] Music (background)
- **Estimación**: 2 días

#### T4.5: Save/Load System
- [ ] IndexedDB storage
- [ ] Chunk serialization
- [ ] Player state (position, inventory)
- [ ] World metadata (seed, name)
- **Estimación**: 3 días

**Acceptance Criteria:**
- ✅ Biomas transicionan suavemente
- ✅ Lighting realista y performante
- ✅ Particles añaden feedback visual
- ✅ Sounds mejoran inmersión
- ✅ Mundos se guardan y cargan correctamente

---

## Especificaciones Técnicas

### World Parameters

```javascript
const WORLD_CONFIG = {
  HEIGHT: 384,           // -64 to 320
  MIN_Y: -64,
  MAX_Y: 320,
  SEA_LEVEL: 63,
  CHUNK_SIZE: 16,
  CHUNK_HEIGHT: 384,
  RENDER_DISTANCE: 8,    // chunks
  SIMULATION_DISTANCE: 4, // chunks
};
```

### Block Types

```javascript
const BLOCKS = {
  AIR: 0,
  STONE: 1,
  GRASS: 2,
  DIRT: 3,
  SAND: 4,
  WATER: 5,
  LAVA: 6,
  SNOW: 7,
  MUD: 8,
  OAK_LOG: 9,
  OAK_LEAVES: 10,
  BIRCH_LOG: 11,
  BIRCH_LEAVES: 12,
  SPRUCE_LOG: 13,
  SPRUCE_LEAVES: 14,
  JUNGLE_LOG: 15,
  JUNGLE_LEAVES: 16,
  COAL_ORE: 17,
  IRON_ORE: 18,
  GOLD_ORE: 19,
  DIAMOND_ORE: 20,
  // ... más bloques
};
```

### Noise Parameters

```javascript
const NOISE_CONFIG = {
  continentalness: { octaves: 4, persistence: 0.5, lacunarity: 2.0, scale: 0.0005 },
  erosion:         { octaves: 4, persistence: 0.5, lacunarity: 2.0, scale: 0.001 },
  weirdness:       { octaves: 4, persistence: 0.5, lacunarity: 2.0, scale: 0.0015 },
  temperature:     { octaves: 3, persistence: 0.5, lacunarity: 2.0, scale: 0.002 },
  humidity:        { octaves: 3, persistence: 0.5, lacunarity: 2.0, scale: 0.002 },
  density:         { octaves: 4, persistence: 0.5, lacunarity: 2.0, scale: 0.01 },
  caves: {
    cheese:    { octaves: 3, persistence: 0.5, lacunarity: 2.0, scale: 0.02, threshold: 0.6 },
    spaghetti: { octaves: 2, persistence: 0.5, lacunarity: 2.0, scale: 0.05, thickness: 0.1 },
    noodle:    { octaves: 2, persistence: 0.5, lacunarity: 2.0, scale: 0.08, thickness: 0.05 },
  },
  aquifer:         { octaves: 2, persistence: 0.5, lacunarity: 2.0, scale: 0.03 },
};
```

### Performance Targets

| Métrica | Target | Crítico |
|---------|--------|---------|
| FPS | 60 | 30 |
| Chunk gen time | <50ms | <200ms |
| Mesh gen time | <20ms | <100ms |
| Memory usage | <500MB | <1GB |
| Chunks loaded | 169 (13x13) | 81 (9x9) |
| Draw calls | <100 | <300 |

---

## Testing

### Unit Tests

```javascript
describe('MinecraftWorldGenerator', () => {
  it('should generate consistent terrain with same seed', () => {
    const gen1 = new MinecraftWorldGenerator(12345);
    const gen2 = new MinecraftWorldGenerator(12345);
    expect(gen1.getDensity(0, 64, 0)).toBe(gen2.getDensity(0, 64, 0));
  });
  
  it('should place ocean biomes in low continentalness areas', () => {
    const gen = new MinecraftWorldGenerator(12345);
    // Mock continentalness to return -0.5
    const biome = gen.getBiome(0, 0);
    expect([BIOMES.OCEAN, BIOMES.DEEP_OCEAN]).toContain(biome);
  });
  
  it('should generate caves only underground', () => {
    const gen = new MinecraftWorldGenerator(12345);
    const surfaceDensity = gen.getDensity(0, 100, 0);
    const undergroundDensity = gen.getDensity(0, 20, 0);
    // Surface should be solid or air, underground can have caves
    expect(surfaceDensity).toBeDefined();
  });
});
```

### Integration Tests

```javascript
describe('VoxelChunk', () => {
  it('should generate full chunk without errors', () => {
    const gen = new MinecraftWorldGenerator(12345);
    const chunk = new VoxelChunk(0, 0, gen);
    chunk.generate();
    expect(chunk.generated).toBe(true);
    expect(chunk.blocks.length).toBe(16 * 384 * 16);
  });
  
  it('should mesh chunk without errors', () => {
    const gen = new MinecraftWorldGenerator(12345);
    const chunk = new VoxelChunk(0, 0, gen);
    chunk.generate();
    const mesh = GreedyMesher.mesh(chunk);
    expect(mesh.positions.length).toBeGreaterThan(0);
    expect(mesh.indices.length).toBeGreaterThan(0);
  });
});
```

### Performance Tests

```javascript
describe('Performance', () => {
  it('should generate chunk in <50ms', () => {
    const gen = new MinecraftWorldGenerator(12345);
    const chunk = new VoxelChunk(0, 0, gen);
    const start = performance.now();
    chunk.generate();
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });
  
  it('should mesh chunk in <20ms', () => {
    const gen = new MinecraftWorldGenerator(12345);
    const chunk = new VoxelChunk(0, 0, gen);
    chunk.generate();
    const start = performance.now();
    const mesh = GreedyMesher.mesh(chunk);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(20);
  });
});
```

---

## Dependencias

### Externas
- Three.js 0.160.0 (ya incluido)
- PointerLockControls (ya incluido)

### Internas
- `jardvoxel-survival-engine.js` ✅
- `jardvoxel-survival-mesher.js` (nuevo)
- `jardvoxel-survival-features.js` (nuevo)
- `jardvoxel-survival-gameplay.js` (nuevo)

---

## Riesgos

### Técnicos
- **Performance**: Generación 3D es costosa
  - Mitigación: Worker threads, caching, LOD
- **Memory**: Muchos chunks = mucha RAM
  - Mitigación: Chunk pooling, unload lejanos
- **Complexity**: Sistema muy grande
  - Mitigación: Desarrollo incremental por fases

### Scope
- **Feature creep**: Fácil añadir más features
  - Mitigación: Stick to spec, MVP primero
- **Time**: 8-10 semanas es optimista
  - Mitigación: Priorizar core features

---

## Métricas de Éxito

### Funcionales
- ✅ 17+ biomas distintos
- ✅ Cuevas generan correctamente
- ✅ Árboles y estructuras
- ✅ Block breaking/placing funciona
- ✅ Inventory y crafting operativos

### Performance
- ✅ 60 FPS estables
- ✅ Generación en <50ms/chunk
- ✅ Memoria <500MB
- ✅ Sin stuttering al generar

### UX
- ✅ Controles intuitivos
- ✅ Feedback visual claro
- ✅ Mundos guardables
- ✅ Divertido de explorar

---

## Roadmap

```
Semana 1-2:  Fase 1 - Core Voxel Engine
Semana 3-5:  Fase 2 - Features & Structures
Semana 6-8:  Fase 3 - Gameplay Systems
Semana 9-10: Fase 4 - Polish & Optimization

Total: 10 semanas
```

---

## Referencias

- **Voxel Wiki**: https://voxel-wiki.dev/w/World_generation
- **Documentación**: `docs/MINECRAFT-WORLDGEN.md`
- **Engine**: `games/jardvoxel-survival-engine.js`
- **Perlin Noise**: Ken Perlin (2002) - "Improving Noise"
- **Greedy Meshing**: 0fps.net/2012/06/30/greedy-meshing/

---

## Notas

- Esta spec es ambiciosa pero factible
- Desarrollo incremental es clave
- Cada fase debe ser jugable
- Performance es prioridad #1
- Documentar todo el proceso

---

**Estado**: Pending  
**Asignado a**: @jard-code  
**Última actualización**: 2026-06-25
