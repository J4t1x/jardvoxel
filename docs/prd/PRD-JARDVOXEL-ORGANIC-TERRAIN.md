# PRD: JardVoxel Organic Terrain Engine

**Versión:** 1.0  
**Fecha:** 2026-06-29  
**Estado:** Draft  
**Baseline:** JardVoxel v7.0 (SPEC-100 a SPEC-110 completadas)

---

## 1. Contexto

JardVoxel v7.0 cuenta con generación jerárquica completa (World → Continents → Regions → Zones → Chunks → Microsectors), sistema de 9 capas, ecosistemas, landmarks y LOD streaming. Sin embargo, el terreno aún se percibe como "cubos apilados" debido a 5 carencias totales y 4 implementaciones parciales identificadas en la evaluación del motor actual.

Este PRD cubre **exclusivamente lo que falta implementar**.

---

## 2. Objetivos

- Eliminar la apariencia de montañas formadas por cubos apilados
- Crear paisajes con continuidad geográfica
- Mejorar la naturalidad del terreno
- Aumentar el nivel de detalle sin afectar el rendimiento
- Mantener compatibilidad con el sistema procedural actual (v7.0)

---

## 3. Inventario de Gaps

### 3.1 Faltantes (no existen en el código)

| ID | Item | Impacto | Esfuerzo |
|----|------|---------|----------|
| G-01 | Voronoi/Delaunay para regiones de bioma | Alto | 4h |
| G-02 | FastNoise Lite (multi-noise types) | Medio | 4h |
| G-03 | Cellular Noise | Medio | 3h |
| G-04 | Poisson Disk Sampling | Alto | 3h |
| G-05 | Instanced Rendering (THREE.InstancedMesh) | Alto | 6h |

### 3.2 Parciales (existe pero no funciona completo)

| ID | Item | Problema | Esfuerzo |
|----|------|----------|----------|
| P-01 | Ridged Noise | `noiseType: 'ridged'` definido en REGION_PROPERTIES pero ignorado en `_computeHeightMap()` | 2h |
| P-02 | Sistema Hidrológico | Ríos son bandas de ruido, no cursos que siguen pendiente | 8h |
| P-03 | Clima Procedural | No hay viento, rain shadow ni proximidad oceánica en clima dinámico | 4h |
| P-04 | Web Workers múltiples | Solo 1 worker para chunk gen, no especializados por tarea | 4h |

**Total estimado:** ~38 horas

---

## 4. Especificaciones por Item

### P-01: Ridged Noise — Fix de Implementación

**Archivo afectado:** `core/jardvoxel-survival-world-hierarchy.js`

**Problema:**
`REGION_PROPERTIES` define `noiseType: 'ridged'` para `MOUNTAIN_RANGE` y `VOLCANIC`, pero `_computeHeightMap()` (línea 796-845) siempre usa `this.terrainNoise.fbm2D()` estándar sin consultar `region.noiseType`.

**Solución:**
1. Agregar método `ridgedFbm2D(x, z, octaves, persistence, lacunarity, scale)` a `SimplexNoise` en `jardvoxel-survival-noise.js`
   - Fórmula: `ridged = 1 - abs(fbm2D(...))`, con elevación al cuadrado para crestas más pronunciadas
2. Agregar métodos `billowyFbm2D()` (`abs(fbm)`) y `steppedFbm2D()` (`floor(fbm * steps) / steps`) para los otros noiseTypes
3. Modificar `_computeHeightMap()` para seleccionar la función de ruido según `region.noiseType`

**Noise types a implementar:**
| noiseType | Fórmula | Uso |
|-----------|---------|-----|
| `flat` | `fbm2D` estándar | Plains, Tundra, Ocean |
| `ridged` | `1 - abs(fbm2D)`² | Mountain Range, Volcanic |
| `billowy` | `abs(fbm2D)` | Forest, Jungle |
| `stepped` | `floor(fbm2D * N) / N` | Plateau |
| `dunes` | `fbm2D` con octaves altas | Desert |

**Acceptance Criteria:**
- [ ] `ridgedFbm2D` produce crestas visibles (no cúpulas)
- [ ] `billowyFbm2D` produce colinas redondeadas
- [ ] `steppedFbm2D` produce terrazas
- [ ] `_computeHeightMap()` usa `region.noiseType` para seleccionar función
- [ ] Mountains muestran crestas en lugar de cúpulas
- [ ] Mesetas muestran terrazas
- [ ] Sin regresión en biomas planos

---

### G-01: Voronoi/Delaunay para Regiones de Bioma

**Archivos afectados:** `core/jardvoxel-survival-world-hierarchy.js`, `core/jardvoxel-survival-engine.js`

**Problema:**
`getBiome()` en `jardvoxel-survival-engine.js:681-767` asigna biomas por thresholds de noise + temperatura + humedad punto a punto. Los biomas cambian cada pocos chunks sin regiones coherentes.

**Solución:**
1. Implementar Voronoi cells a escala de región (no por bloque)
   - Generar N puntos semilla por continente usando PRNG determinista
   - Cada punto tiene un bioma asignado basado en clima + humedad del continente
   - Para cada posición world (x,z), encontrar la célula Voronoi más cercana
   - Blend suave entre células usando distancia a bordes
2. Implementar Delaunay triangulation para calcular fronteras naturales
3. Tamaño de célula: 200-500 bloques (12-31 chunks) → biomas ocupan centenares de chunks
4. Integrar con `HierarchicalChunkGenerator._computeBiomeWeights()` — usar Voronoi como peso dominante

**Dependencia:** Ninguna (puede usar implementación propia sin librería externa)

**Acceptance Criteria:**
- [ ] Biomas ocupan mínimo 200x200 bloques contiguos
- [ ] Transiciones entre biomas son graduales (blend de 20-40 bloques)
- [ ] Mismo bioma no aparece aislado rodeado de bioma incompatible
- [ ] Desiertos no aparecen al lado de junglas sin transición
- [ ] Determinista: misma seed produce mismo mapa de biomas
- [ ] Cache de células Voronoi para rendimiento

---

### G-02: FastNoise Lite (Multi-Noise Types)

**Archivos afectados:** `core/jardvoxel-survival-noise.js`

**Problema:**
`SimplexNoise` custom implementado solo soporta noise2D/noise3D estándar. No hay OpenSimplex2, Cellular, ni Domain Warp nativo.

**Solución:**
1. Port de FastNoise Lite a JS (es header-only en C, ~500 líneas)
   - OpenSimplex2 (mejor calidad que Simplex actual, menos artefactos de grid)
   - Cellular Noise (F1, F2, F1-F2, F1*F2)
   - Domain Warp nativo (sin necesidad de DomainWarper separado)
   - Value Noise (para variación barata)
2. Mantener API compatible: `noise2D(x, y)`, `noise3D(x, y, z)`, `fbm2D()`, `fbm3D()`
3. Agregar `SetNoiseType()`, `SetCellularDistanceFunction()`, `SetDomainWarpAmp()`
4. DomainWarper existente puede delegar a FastNoise internamente

**Acceptance Criteria:**
- [ ] OpenSimplex2 produce menos artefactos de grid que Simplex actual
- [ ] Cellular Noise genera patrones de células visibles
- [ ] Domain Warp nativo funciona sin DomainWarper separado
- [ ] API backwards-compatible (código existente no se rompe)
- [ ] Rendimiento comparable o mejor que SimplexNoise actual

---

### G-03: Cellular Noise

**Archivo afectado:** `core/jardvoxel-survival-noise.js` (como parte de G-02 o standalone)

**Problema:**
No existe. Las "rocas" y "claros" usan `_hash()` simple con densidad fija, produciendo distribución uniforme.

**Solución:**
1. Implementar Cellular Noise con 4 modos:
   - `F1`: distancia a célula más cercana (para lagos, humedales)
   - `F2`: distancia a segunda célula más cercana
   - `F1-F2`: bordes de células (para grietas, caminos)
   - `F1*F2`: patrones orgánicos (para rocas, claros)
2. Aplicar en:
   - `SurfaceRocksLayer` — reemplazar `_hash()` con cellular F1*F2
   - `MicrosectorGenerator` — claros de bosque con cellular F1
   - `ZoneGenerator` — detección de lagos y humedales con cellular F1
3. Escala configurable: 0.001-0.01 para features grandes, 0.05-0.1 para detalles

**Acceptance Criteria:**
- [ ] Rocas forman patrones celulares visibles (no uniformes)
- [ ] Claros de bosque tienen bordes orgánicos
- [ ] Lagos tienen formas irregulares naturales
- [ ] Sin impacto significativo en rendimiento (<5% overhead)

---

### G-04: Poisson Disk Sampling

**Archivos afectados:** `core/jardvoxel-survival-layers.js`, `core/jardvoxel-survival-features.js`

**Problema:**
Árboles, flores, piedras usan `_hash()` simple con densidad fija. No hay spacing mínimo garantizado → agrupaciones poco naturales.

**Solución:**
1. Implementar algoritmo de Bridson (Fast Poisson Disk Sampling)
   - Input: región 16x16 (chunk), radio mínimo por tipo de feature
   - Output: lista de posiciones con spacing garantizado
   - Cache por chunk (no recalcular al regenerar)
2. Radios mínimos por tipo:
   | Tipo | Radio Mínimo |
   |------|-------------|
   | Giant tree | 6 bloques |
   | Normal tree | 3 bloques |
   | Bush/shrub | 1.5 bloques |
   | Flower | 0.8 bloques |
   | Rock | 2 bloques |
   | Mushroom | 1 bloque |
3. Reemplazar `_hash()` en `MajorVegetationLayer.generate()` y `MinorVegetationLayer.generate()`
4. Reemplazar `_hash()` en `generateTrees()` de `jardvoxel-survival-features.js`

**Acceptance Criteria:**
- [ ] Ningún árbol aparece a menos de 3 bloques de otro
- [ ] Flores no se agrupan en cuadrados perfectos
- [ ] Piedras tienen spacing natural
- [ ] Densidad respeta el biome density config
- [ ] Determinista: misma seed + chunk produce mismas posiciones
- [ ] Performance: <2ms por chunk para Poisson generation

---

### P-02: Sistema Hidrológico

**Archivos afectados:** nuevo `core/jardvoxel-survival-hydrology.js`, `core/jardvoxel-survival-world-hierarchy.js`

**Problema:**
Los ríos son bandas de ruido detectadas por `pv < -0.5` en `getBiome()`. No siguen pendiente, no se conectan a lagos ni océano, no modelan valles.

**Solución:**
1. Crear `HydrologySystem` class:
   - **Flow Accumulation:** Para cada posición de montaña, calcular dirección de descenso (steepest descent) usando heightmap
   - **River tracing:** Desde nacientes (puntos altos con flow accumulation alta), trazar curso siguiendo pendiente hasta llegar a agua u océano
   - **River carving:** Escavar el terreno a lo largo del curso del río (3-5 bloques de ancho, profundidad gradual)
   - **Valley formation:** Suavizar terreno adyacente al río (valle en V o U según tipo)
   - **Lake filling:** Cuando un río llega a una depresión, llenar como lago
   - **Waterfall detection:** Donde el río tiene un drop > 8 bloques, marcar como cascada
2. Integrar como capa adicional entre `TerrainLayer` y `MicroReliefLayer` (Layer 1.5)
3. Ejecutar a escala de región (no por chunk individual) — precomputar ríos en `getChunkContext()`

**Flujo:**
```
Montañas (heightmap existente)
  ↓ steepest descent
Arroyos (flow accumulation > threshold)
  ↓ seguir pendiente
Ríos (acumular arroyos)
  ↓ llegar a depresión
Lagos (llenar hasta desbordamiento)
  ↓ continuar río
Océano (sea level)
```

**Acceptance Criteria:**
- [ ] Los ríos fluyen cuesta abajo (nunca cuesta arriba)
- [ ] Los ríos se conectan a lagos u océano
- [ ] Los valles se forman alrededor de los ríos
- [ ] Las cascadas aparecen donde hay drops significativos
- [ ] Los ríos tienen ancho variable (arroyos angostos → ríos anchos)
- [ ] Determinista: misma seed produce misma red hidrológica
- [ ] Cache de red hidrológica por región

---

### P-03: Clima Procedural Avanzado

**Archivos afectados:** `core/jardvoxel-survival-weather.js`, `core/jardvoxel-survival-world-hierarchy.js`

**Problema:**
`WeatherManager._pickWeather()` usa `Math.random()` + biome simple. No considera viento, altitud, proximidad oceánica ni rain shadow.

**Solución:**
1. Crear `ProceduralClimateSystem`:
   - **Viento:** Dirección dominante por continente (PRNG determinista) + variación estacional
   - **Rain shadow:** Lado de barlovento de cordilleras = húmedo, lado de sotavento = seco
   - **Proximidad oceánica:** Buffer de humedad basado en distancia al océano
   - **Altitud:** Temperatura disminuye con altura (-0.6°C por 100 bloques)
   - **Estaciones:** Modificadas por `axialTilt` y `orbitalEccentricity` ya definidos en WorldIdentity
2. Modificar `WeatherManager._pickWeather()`:
   - Reemplazar `Math.random()` con clima procedural
   - Consultar `ProceduralClimateSystem.getWeather(x, z, time)` en lugar de random
3. Output: tipo de clima + intensidad + duración basada en factores geográficos

**Factores a integrar:**
| Factor | Fuente | Efecto |
|--------|--------|--------|
| Viento | PRNG por continente + estación | Dirección de lluvia |
| Rain shadow | Cordilleras + dirección viento | Lado seco vs húmedo |
| Ocean proximity | `WorldIdentity.isOcean()` distance | Humedad base |
| Altitud | Heightmap | Temperatura local |
| Estación | DayNight cycle + axialTilt | Variación estacional |

**Acceptance Criteria:**
- [ ] Desiertos aparecen en rain shadows de cordilleras
- [ ] Bosques lluviosos aparecen en barlovento de cordilleras costeras
- [ ] Alta altitud tiene menos lluvia y más nieve
- [ ] Costas tienen más humedad que interior
- [ ] Estaciones afectan clima (más lluvia en invierno, más sequía en verano)
- [ ] Transiciones de clima son graduales

---

### P-04: Web Workers Múltiples

**Archivos afectados:** `core/jardvoxel-survival-worker.js`, nuevo `core/jardvoxel-survival-worker-pool.js`

**Problema:**
Solo 1 worker para chunk generation. El plan propone workers especializados por tarea para evitar pausas.

**Solución:**
1. Crear `WorkerPool` class:
   - Pool de N workers (configurable, default: `navigator.hardwareConcurrency - 1`)
   - Queue con prioridad (chunks cercanos primero)
   - Round-robin con affinity (mismo chunk → mismo worker para cache)
2. Workers especializados:
   | Worker | Tarea |
   |--------|-------|
   | Terrain | Layer 1-2 (terrain + micro-relief) |
   | Vegetation | Layer 3-5 (rocks, trees, flowers) |
   | Caves | Cave generation (cheese/spaghetti/noodle) |
   | Structures | Layer 6-7 (decoration, fauna, landmarks) |
   | Climate | Weather + ambient events |
3. Comunicación con `SharedArrayBuffer` si está disponible, fallback a `Transferable` ArrayBuffer
4. Integrar con `StreamingManager` — upgrades de tier disparan tasks al pool

**Acceptance Criteria:**
- [ ] Múltiples chunks se generan en paralelo
- [ ] No hay pausas visibles al moverse (generación async)
- [ ] Pool reutiliza workers (no crea/destruye por chunk)
- [ ] Fallback a single-worker si `hardwareConcurrency` es 1
- [ ] SharedArrayBuffer usado cuando esté disponible
- [ ] Queue con prioridad: chunks cercanos al jugador se generan primero

---

### G-05: Instanced Rendering

**Archivos afectados:** `core/jardvoxel-survival-mesher.js`, `core/jardvoxel-survival-gameplay.js`

**Problema:**
No se usa `THREE.InstancedMesh`. Miles de árboles, flores y rocas se renderizan como meshes individuales → bottleneck de draw calls.

**Solución:**
1. Crear `InstancedFeatureRenderer`:
   - Detectar features por tipo (tree, flower, rock, mushroom, bush)
   - Por tipo, crear un `THREE.InstancedMesh` con todas las instancias del chunk
   - Matrices de transformación (posición, rotación, escala) por instancia
   - LOD: reducir instancias en chunks lejanos (random culling preservando densidad visual)
2. Integrar con mesher existente:
   - `buildChunkMesh()` retorna mesh de terreno + lista de features para instancing
   - Features se renderizan con `InstancedMesh` separado del terrain mesh
3. Frustum culling por chunk (no por instancia individual)
4. Dispose de InstancedMesh cuando chunk se descarga

**Tipos a instanciar:**
| Tipo | Bloques típicos | Instancias esperadas/chunk |
|------|----------------|---------------------------|
| Tree | wood + leaves | 5-30 |
| Flower | flower_red, flower_yellow | 10-50 |
| Rock | cobblestone, stone | 3-15 |
| Mushroom | mushroom_brown, mushroom_red | 2-10 |
| Bush | fern, tall_grass | 10-40 |

**Acceptance Criteria:**
- [ ] Draw calls reducidas >80% para vegetación
- [ ] Renderización de 500+ árboles sin impacto visible en FPS
- [ ] Instancias tienen rotación y escala variadas (no idénticas)
- [ ] LOD reduce instancias en chunks lejanos
- [ ] Dispose correcto al descargar chunks (sin memory leaks)
- [ ] Frustum culling funciona a nivel de chunk

---

## 5. Fases de Implementación

### Fase 1: Quick Wins Visuales (9h)
**Mayor impacto visual, menor esfuerzo**

| Item | Esfuerzo | Impacto |
|------|----------|---------|
| P-01: Ridged Noise | 2h | Crestas en montañas |
| G-04: Poisson Disk | 3h | Vegetación natural |
| G-01: Voronoi Biomes | 4h | Regiones coherentes |

**Resultado:** El terreno deja de verse como cubos apilados. Montañas con crestas, biomas en regiones grandes, vegetación con spacing natural.

### Fase 2: Rendimiento (10h)
**Habilitar mayor distancia de visión**

| Item | Esfuerzo | Impacto |
|------|----------|---------|
| G-05: Instanced Rendering | 6h | +500% throughput de vegetación |
| P-04: Multi-Worker | 4h | Generación sin pausas |

**Resultado:** Render distance puede aumentar de 6 a 12+ chunks sin degradación.

### Fase 3: Realismo Geográfico (15h)
**Paisajes con lógica natural**

| Item | Esfuerzo | Impacto |
|------|----------|---------|
| P-02: Sistema Hidrológico | 8h | Ríos que siguen pendiente |
| G-02: FastNoise Lite | 4h | Multi-noise sin artefactos |
| P-03: Clima Procedural | 3h | Rain shadow, estaciones |

**Resultado:** Ríos modelan valles, desiertos aparecen en rain shadows, clima coherente con geografía.

### Fase 4: Detalle Fino (4h)
**Riqueza visual a micro escala**

| Item | Esfuerzo | Impacto |
|------|----------|---------|
| G-03: Cellular Noise | 3h | Patrones orgánicos en rocas/claros |
| Integración final | 1h | Conectar todos los sistemas |

**Resultado:** Patrones celulares en distribución de rocas, claros de bosque con bordes orgánicos.

---

## 6. Dependencias

```
P-01 Ridged Noise ──→ (independiente, fix puntual)
G-02 FastNoise Lite ──→ G-03 Cellular Noise (cellular es parte de FastNoise)
G-01 Voronoi Biomes ──→ (independiente)
G-04 Poisson Disk ──→ (independiente)
P-02 Hydrology ──→ depende de heightmap funcional (P-01 mejora esto)
P-03 Climate ──→ depende de WorldIdentity (ya existe) + region data
P-04 Multi-Worker ──→ (independiente, refactor de infraestructura)
G-05 Instanced Rendering ──→ (independiente, refactor de rendering)
```

**Orden óptimo:** P-01 → G-04 → G-01 → G-05 → P-04 → P-02 → G-02 → P-03 → G-03

---

## 7. Constraints Técnicos

- **Sin dependencias externas** (regla de jard-games: un archivo = un juego autocontenido)
  - Voronoi: implementación propia (no d3-delaunay)
  - FastNoise Lite: port manual a JS (no npm package)
  - Poisson Disk: algoritmo de Bridson implementado in-house
- **Mobile-first, 60fps target** — todas las features deben mantener FPS en móvil
- **Determinismo** — misma seed siempre produce mismo mundo
- **Backwards compatible** — v7.0 existente debe seguir funcionando si se desactivan las nuevas features
- **Progressive enhancement** — cada feature se puede activar/desactivar independientemente

---

## 8. Arquitectura de Archivos

```
core/
├── jardvoxel-survival-noise.js          ← + ridgedFbm2D, billowyFbm2D, steppedFbm2D, FastNoise Lite port
├── jardvoxel-survival-world-hierarchy.js ← fix _computeHeightMap noiseType, + VoronoiBiomeMap
├── jardvoxel-survival-layers.js          ← Poisson Disk en MajorVegetationLayer, MinorVegetationLayer
├── jardvoxel-survival-features.js        ← Poisson Disk en generateTrees()
├── jardvoxel-survival-mesher.js          ← + InstancedFeatureRenderer
├── jardvoxel-survival-gameplay.js        ← integrar InstancedFeatureRenderer en SurvivalWorld
├── jardvoxel-survival-weather.js         ← + ProceduralClimateSystem
├── jardvoxel-survival-worker.js          ← refactor a worker especializado
├── jardvoxel-survival-worker-pool.js     ← NUEVO: WorkerPool manager
├── jardvoxel-survival-hydrology.js       ← NUEVO: HydrologySystem
└── jardvoxel-survival-voronoi.js         ← NUEVO: VoronoiBiomeMap (o integrado en world-hierarchy)
```

---

## 9. Criterios de Aceptación Global

- [ ] Las montañas muestran crestas y cordilleras (no cúpulas redondas)
- [ ] Los biomas ocupan regiones de centenares de chunks (no cambian cada 3 chunks)
- [ ] Los árboles no se agrupan en patrones artificiales
- [ ] Los ríos fluyen cuesta abajo desde montañas hasta océano
- [ ] Los desiertos aparecen en rain shadows de cordilleras
- [ ] Render distance puede aumentar sin degradación de FPS
- [ ] No hay pausas visibles al explorar (generación async)
- [ ] Rocas y claros tienen patrones orgánicos
- [ ] Todo es determinista (misma seed = mismo mundo)
- [ ] Cada feature se puede activar/desactivar independientemente
- [ ] Sin dependencias externas (todo vanilla JS)
- [ ] 60fps sostenido en desktop, 30fps mínimo en móvil

---

## 10. Métricas de Éxito

| Métrica | Antes (v7.0) | Target |
|---------|-------------|--------|
| Bioma chunk contiguity | ~3-5 chunks | >50 chunks |
| Draw calls vegetación | ~200-500/chunk | <50/chunk |
| Render distance estable | 6 chunks | 12+ chunks |
| Pausas al explorar | Sí (single worker) | No (multi-worker) |
| River coherence | Bandas de ruido | Flow accumulation |
| Mountain shape | Cúpulas | Crestas |
| Climate logic | Random | Geográfico |

---

## 11. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| FastNoise Lite port introduce bugs | Media | Mantener SimplexNoise como fallback |
| Voronoi performance en mundo infinito | Baja | Cache de células + lazy computation |
| Hydrology system demasiado complejo | Media | Empezar con ríos simples, iterar |
| InstancedMesh no soportado en móvil | Baja | Fallback a meshes individuales |
| Multi-worker SharedArrayBuffer no disponible | Alta | Fallback a Transferable ArrayBuffer |
