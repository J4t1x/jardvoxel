# Minecraft World Generation — Implementación Completa

## Fecha: 25 Junio 2026

## Referencia
- **Voxel Wiki**: https://voxel-wiki.dev/w/World_generation
- **Implementación**: `jardvoxel-survival-engine.js`

---

## Pipeline de Generación (11 Pasos)

### 1. **empty** — Chunk no cargado
Estado inicial, chunk no existe en memoria.

### 2. **structure_starts** — Puntos de inicio de estructuras
Calcula posiciones iniciales para estructuras (pueblos, templos, etc.)
- **Estado**: Pendiente de implementar
- **Prioridad**: Media

### 3. **structure_references** — Referencias a estructuras cercanas
Almacena referencias a chunks vecinos con estructuras.
- **Estado**: Pendiente de implementar
- **Prioridad**: Media

### 4. **biomes** ✅ — Determinación de biomas
Calcula y almacena biomas sin generar terreno.

**Implementado:**
```javascript
getBiome(x, z) {
  const cont = getContinentalness(x, z);
  const erosion = getErosion(x, z);
  const weirdness = getWeirdness(x, z);
  const temp = temperatureNoise.fbm3D(x, 0, z, ...);
  const humid = humidityNoise.fbm3D(x, 0, z, ...);
  
  // 17 biomas diferentes basados en parámetros
  return biome;
}
```

**Biomas (17 tipos):**
- Ocean, Deep Ocean, Beach, River
- Plains, Forest, Jungle, Desert, Savanna, Taiga, Swamp
- Snowy Plains, Mountains, Snowy Peaks, Stony Peaks, Meadow, Cherry Grove

### 5. **noise** ✅ — Forma base del terreno
Genera forma base usando 3D Perlin Noise + Splines.

**Implementado:**
```javascript
getDensity(x, y, z) {
  const baseHeight = getBaseHeight(x, z);
  const heightBias = (baseHeight - y) * 0.05;
  const noise3D = densityNoise.fbm3D(x, y, z, 4, 0.5, 2.0, 0.01);
  
  let density = noise3D + heightBias;
  density = applyCaves(x, y, z, density);
  
  return density; // > 0 = solid, <= 0 = air
}
```

**Parámetros Clave:**
- **Continentalness**: Distingue océano vs tierra
- **Erosion**: Controla planitud (alto = plano, bajo = irregular)
- **Weirdness**: Genera picos y valles
- **PV (Peaks & Valleys)**: Derivado de weirdness

**Splines:**
```javascript
continentalnessSpline = [
  {x: -1.0, y: -0.5}, // Océano profundo
  {x: -0.2, y: 0.0},  // Océano
  {x: 0.0, y: 0.1},   // Costa
  {x: 0.3, y: 0.3},   // Tierra interior
  {x: 0.6, y: 0.6},   // Base montañas
  {x: 1.0, y: 1.0},   // Montañas altas
];

erosionSpline = [
  {x: -1.0, y: 1.0},  // Irregular
  {x: 1.0, y: 0.0},   // Plano
];
```

### 6. **surface** ✅ — Reemplazo de superficie
Reemplaza bloques de superficie según bioma.

**Implementado:**
```javascript
getSurfaceBlock(biome, y) {
  switch (biome) {
    case DESERT: return 'sand';
    case BEACH: return 'sand';
    case SNOWY_PLAINS: return 'snow';
    case STONY_PEAKS: return 'stone';
    case SWAMP: return 'mud';
    default: return 'grass';
  }
}
```

### 7. **carvers** ✅ — Cuevas procedurales
Talla cuevas usando 3D noise.

**Implementado:**

**Cheese Caves** (cámaras grandes):
```javascript
const cheese = cheeseNoise.fbm3D(x, y, z, 3, 0.5, 2.0, 0.02);
if (cheese > 0.6) density = -1; // Air
```

**Spaghetti Caves** (túneles largos):
```javascript
const spaghetti = spaghettiNoise.fbm3D(x, y, z, 2, 0.5, 2.0, 0.05);
if (Math.abs(spaghetti) < 0.1) density = -1; // Air
```

**Noodle Caves** (túneles delgados):
```javascript
const noodle = noodleNoise.fbm3D(x, y, z, 2, 0.5, 2.0, 0.08);
if (Math.abs(noodle) < 0.05) density = -1; // Air
```

### 8. **features** — Decoración (árboles, flores, etc.)
Coloca features y piezas de estructuras.
- **Estado**: Pendiente de implementar
- **Prioridad**: Alta

### 9. **initialize_light** — Inicialización de iluminación
Identifica fuentes de luz.
- **Estado**: Pendiente de implementar
- **Prioridad**: Baja (Three.js maneja iluminación)

### 10. **light** — Cálculo de niveles de luz
Calcula propagación de luz.
- **Estado**: Pendiente de implementar
- **Prioridad**: Baja

### 11. **spawn** — Generación de mobs
Spawneo de entidades.
- **Estado**: Pendiente de implementar
- **Prioridad**: Baja

### 12. **full** ✅ — Chunk completo
Proto-chunk → Level chunk, listo para jugar.

---

## Sistemas Implementados

### 3D Noise System ✅

**PerlinNoise3D:**
- Implementación clásica de Perlin Noise en 3D
- Seeded para reproducibilidad
- FBM (Fractional Brownian Motion) con octavas

**Uso:**
```javascript
const noise = new PerlinNoise3D(seed);
const value = noise.fbm3D(x, y, z, octaves, persistence, lacunarity, scale);
// value ∈ [-1, 1]
```

### Spline System ✅

**Cubic Hermite Interpolation:**
- Suaviza transiciones entre puntos
- Usado para continentalness y erosion
- Permite control fino de forma del terreno

**Ejemplo:**
```javascript
const spline = new Spline([
  {x: -1.0, y: 0.0},
  {x: 0.0, y: 0.5},
  {x: 1.0, y: 1.0},
]);
const value = spline.evaluate(0.5); // Interpolado suavemente
```

### Aquifer System ✅

**Estados:**
- **Empty**: Siempre aire
- **Flooded**: Agua bajo nivel del mar
- **Local fluid level**: Nivel de agua local

**Implementación:**
```javascript
getAquiferState(x, y, z) {
  if (y < -55) return 'lava'; // Lava profunda
  if (y >= SEA_LEVEL) return 'air';
  
  const aquiferValue = aquiferNoise.fbm3D(x, y, z, 2, 0.5, 2.0, 0.03);
  
  if (aquiferValue < -0.3) return 'air'; // Cueva seca
  if (aquiferValue > 0.3) return 'water'; // Inundado
  
  // Nivel local
  const localLevel = SEA_LEVEL - Math.floor(aquiferValue * 20);
  return y < localLevel ? 'water' : 'air';
}
```

### Voxel Chunk System ✅

**Estructura:**
- Tamaño: 16x384x16 bloques
- Altura: Y=-64 a Y=320 (384 bloques)
- Almacenamiento: Uint8Array (1 byte por bloque)

**Tipos de Bloques:**
```javascript
0: air
1: stone
2: grass
3: dirt
4: sand
5: water
6: lava
7: snow
8: mud
```

### Greedy Meshing ✅

**Optimización:**
- Combina caras adyacentes del mismo tipo
- Reduce draw calls drásticamente
- Actualmente: solo superficie superior (simplificado)

**Próxima mejora:**
- Full greedy meshing en 6 direcciones
- Culling de caras ocultas
- LOD (Level of Detail)

---

## Parámetros de Generación

### Noise Scales

| Noise | Octaves | Persistence | Lacunarity | Scale |
|-------|---------|-------------|------------|-------|
| Continentalness | 4 | 0.5 | 2.0 | 0.0005 |
| Erosion | 4 | 0.5 | 2.0 | 0.001 |
| Weirdness | 4 | 0.5 | 2.0 | 0.0015 |
| Temperature | 3 | 0.5 | 2.0 | 0.002 |
| Humidity | 3 | 0.5 | 2.0 | 0.002 |
| Density (3D) | 4 | 0.5 | 2.0 | 0.01 |
| Cheese Caves | 3 | 0.5 | 2.0 | 0.02 |
| Spaghetti Caves | 2 | 0.5 | 2.0 | 0.05 |
| Noodle Caves | 2 | 0.5 | 2.0 | 0.08 |
| Aquifer | 2 | 0.5 | 2.0 | 0.03 |

### Altura del Mundo

```
Y=320  ┌─────────────┐ Build limit
       │   Sky       │
Y=256  │             │
       │             │
Y=192  │             │
       │  Mountains  │
Y=128  │             │
       │             │
Y=63   ├─────────────┤ Sea level
       │   Land      │
Y=0    │             │
       │             │
Y=-32  │  Caves      │
       │             │
Y=-64  └─────────────┘ Bedrock
```

### Rangos de Altura por Bioma

| Bioma | Altura Típica | Rango |
|-------|---------------|-------|
| Deep Ocean | -20 a -5 | Bajo nivel del mar |
| Ocean | -5 a 0 | Cerca del nivel del mar |
| Beach | 0 a 5 | Nivel del mar |
| River | 0 a 2 | Nivel del mar |
| Plains | 5 a 30 | Tierra baja |
| Forest | 10 a 40 | Tierra media |
| Jungle | 15 a 50 | Tierra media-alta |
| Desert | 5 a 35 | Tierra baja-media |
| Savanna | 10 a 45 | Tierra media |
| Taiga | 15 a 50 | Tierra media-alta |
| Swamp | 0 a 10 | Tierra muy baja |
| Snowy Plains | 20 a 60 | Tierra media-alta |
| Meadow | 60 a 100 | Montañas bajas |
| Mountains | 100 a 150 | Montañas |
| Stony Peaks | 120 a 180 | Montañas altas |
| Snowy Peaks | 150 a 200+ | Picos más altos |

---

## Performance

### Cache System

**LRU Cache:**
- Tamaño: 50,000 entradas
- Almacena: Valores de densidad 3D
- Hit rate esperado: ~85%

**Gestión:**
```javascript
if (cache.size > cacheSize) {
  const firstKey = cache.keys().next().value;
  cache.delete(firstKey);
}
```

### Optimizaciones Futuras

1. **Worker Threads**
   - Generar chunks en background
   - No bloquear render thread
   - Prioridad: Alta

2. **Chunk Pooling**
   - Reutilizar memoria de chunks
   - Evitar GC pauses
   - Prioridad: Media

3. **Frustum Culling**
   - Solo renderizar chunks visibles
   - Prioridad: Alta

4. **LOD System**
   - Chunks lejanos con menos detalle
   - Prioridad: Media

5. **Incremental Generation**
   - Generar chunks por capas (Y)
   - Mostrar superficie primero
   - Prioridad: Alta

---

## Comparación con Minecraft Real

### Implementado ✅

- [x] 3D Perlin Noise
- [x] Continentalness
- [x] Erosion
- [x] Weirdness / PV
- [x] Splines para terrain shaping
- [x] 17 biomas
- [x] Cheese caves
- [x] Spaghetti caves
- [x] Noodle caves
- [x] Aquifer system
- [x] Surface blocks por bioma
- [x] Voxel chunks (16x384x16)
- [x] Greedy meshing (simplificado)

### Pendiente 🚧

- [ ] Structures (pueblos, templos, etc.)
- [ ] Features (árboles, flores, minerales)
- [ ] Ore veins (vetas de mineral)
- [ ] Lighting system
- [ ] Mob spawning
- [ ] Block updates
- [ ] Redstone
- [ ] Fluids physics
- [ ] Biome transitions suaves
- [ ] Cave decorations (estalactitas, etc.)

### Diferencias con Minecraft

| Feature | Minecraft | JardVoxel |
|---------|-----------|-----------|
| Chunk size | 16x384x16 | 16x384x16 ✅ |
| World height | -64 a 320 | -64 a 320 ✅ |
| Biomes | 60+ | 17 ⚠️ |
| Cave types | 3 | 3 ✅ |
| Structures | 20+ | 0 ❌ |
| Block types | 1000+ | 9 ⚠️ |
| Lighting | Full system | Three.js ⚠️ |
| Physics | Full | Simplified ⚠️ |

---

## Próximos Pasos

### Fase 1: Core Voxel Engine (1-2 semanas)
- [ ] Full greedy meshing (6 direcciones)
- [ ] Frustum culling
- [ ] Worker threads para generación
- [ ] Chunk pooling
- [ ] Incremental generation

### Fase 2: Features & Structures (2-3 semanas)
- [ ] Tree generation (Oak, Birch, Spruce, Jungle)
- [ ] Flower/grass decoration
- [ ] Ore generation (coal, iron, gold, diamond)
- [ ] Village generation
- [ ] Temple generation

### Fase 3: Gameplay (2-3 semanas)
- [ ] Block breaking/placing
- [ ] Inventory system
- [ ] Crafting
- [ ] Basic mobs (passive)
- [ ] Day/night cycle

### Fase 4: Polish (1-2 semanas)
- [ ] Smooth biome transitions
- [ ] Better lighting
- [ ] Particle effects
- [ ] Sound system
- [ ] Save/load worlds

---

## Referencias Técnicas

### Voxel Wiki
- https://voxel-wiki.dev/w/World_generation
- https://voxel-wiki.dev/w/Biome
- https://voxel-wiki.dev/w/Cave
- https://voxel-wiki.dev/w/Density_function
- https://voxel-wiki.dev/w/Noise_settings

### Papers & Resources
- Ken Perlin - "Improving Noise" (2002)
- Inigo Quilez - "Value Noise Derivatives"
- Sebastian Lague - "Procedural Terrain Generation" (YouTube)
- Minecraft 1.18 Technical Details (Mojang)

### Algoritmos
- Perlin Noise 3D
- Fractional Brownian Motion (FBM)
- Cubic Hermite Splines
- Greedy Meshing
- Marching Cubes (futuro)

---

## Conclusión

**Estado Actual**: MVP funcional con generación tipo Minecraft

**Completado**:
- ✅ Pipeline de 11 pasos (4/11 implementados)
- ✅ 3D noise system completo
- ✅ Splines para terrain shaping
- ✅ 17 biomas
- ✅ 3 tipos de cuevas
- ✅ Sistema de aquifers
- ✅ Voxel chunks
- ✅ Greedy meshing básico

**Siguiente Milestone**: Full voxel engine con worker threads y frustum culling

**Tiempo Estimado Total**: 8-10 semanas para Minecraft-like completo
