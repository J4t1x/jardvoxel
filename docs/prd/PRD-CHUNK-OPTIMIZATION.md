# PRD: JardVoxel — Optimización de Generación de Chunks y Calidad Gráfica

**Fecha:** 26 Junio 2026  
**Versión:** 1.0  
**Proyecto:** jard-games/jardvoxel  
**Prioridad:** 🟡 ALTA  
**Aplicación:** Primero `jardvoxel.html`, luego `jardvoxel-survival.html`  
**Estado:** ✅ Completado — View-direction loading, LOD 0-4, procedural details, heightmap occlusion culling implementados en ambos motores

---

## 1. Executive Summary

El motor JardVoxel actual genera y renderiza chunks de manera **radial uniforme** alrededor del jugador, sin distinguir entre lo que el jugador realmente ve y lo que está detrás de él. Esto desperdicia CPU/GPU en chunks que nunca aparecen en pantalla.

**Objetivo:** Optimizar la generación de chunks para priorizar **solo lo que el jugador ve** (frustum + dirección de cámara), mejorar la calidad visual con detalles procedurales por chunk, y aumentar la distancia de render efectiva sin degradar FPS.

---

## 2. Estado Actual

### 2.1 Arquitectura de Rendering — `jardvoxel.html` (funcional)

| Componente | Archivo | Estado |
|---|---|---|
| ChunkManager | `jardvoxel-engine.js:1928-2298` | ✅ Web Worker + frustum culling básico |
| Greedy Mesher | `jardvoxel-engine.js` (buildChunkMesh) | ✅ Greedy meshing con AO |
| LOD | `jardvoxel-engine.js:2042-2050` | ✅ 3 niveles (0=full, 1=no AO, 2=no transparent) |
| Frustum Culling | `jardvoxel-engine.js:2152-2172` | ✅ Básico (containsPoint) |
| Adaptive Render Dist | `jardvoxel-engine.js:2109-2122` | ✅ Basado en FPS |
| Water Mesh | `jardvoxel-engine.js` (buildWaterMesh) | ✅ Con olas animadas |

### 2.2 Arquitectura de Rendering — `jardvoxel-survival.html`

| Componente | Archivo | Estado |
|---|---|---|
| SurvivalWorld | `jardvoxel-survival-gameplay.js:30-295` | ✅ Web Worker + ring generation |
| Mesher | `jardvoxel-survival-mesher.js:103-323` | ✅ Greedy meshing con AO + color variation |
| LOD | `jardvoxel-survival-gameplay.js:152-157` | ✅ 3 niveles (0.6*rd, 0.8*rd) |
| Frustum Culling | ❌ No implementado | — |
| Adaptive Render Dist | `jardvoxel-survival-gameplay.js:240-247` | ✅ Basado en FPS |

### 2.3 Problemas Detectados

#### PROB-001: Generación Radial Uniforme (Sin dirección de cámara)
**Severidad:** 🟡 ALTA  
**Impacto:** ~40% de chunks generados nunca aparecen en pantalla

Ambos motores generan chunks en un **círculo completo** alrededor del jugador:
```javascript
// jardvoxel-engine.js:2126-2136
for (let dx = -renderDist; dx <= renderDist; dx++) {
  for (let dz = -renderDist; dz <= renderDist; dz++) {
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist <= renderDist) { /* generar chunk */ }
  }
}
```

El frustum culling actual **oculta** meshes fuera de vista, pero los chunks **ya están generados y meshed** — el trabajo de CPU ya se hizo. La generación debería omitir chunks detrás del jugador.

#### PROB-002: Sin Occlusion Culling
**Severidad:** 🟡 ALTA  
**Impacto:** Chunks ocultos detrás de montañas/terreno se renderizan

El frustum culling solo verifica si el chunk está dentro del cono de visión, pero no si está **oculto por otro terrain**. Una montaña bloquea visualmente chunks detrás de ella, pero el motor los renderiza igual.

#### PROB-003: Detalle Visual Uniforme (Sin LOD geométrico)
**Severidad:** 🟢 MEDIA  
**Impacto:** Chunks lejanos tienen el mismo detalle que cercanos

El LOD actual solo afecta:
- LOD 0: Full (AO + transparent blocks)
- LOD 1: No AO
- LOD 2: No AO + no transparent blocks

**No reduce geometría.** Un chunk a 80 bloques de distancia tiene los mismos vértices que uno a 5 bloques. Esto limita la distancia de render efectiva.

#### PROB-004: Sin Detalles Procedurales por Chunk
**Severidad:** 🟢 MEDIA  
**Impacto:** Terreno se ve plano y repetitivo

Los chunks actuales tienen:
- Color variation básica (hash3 → ±0.08)
- AO en vértices cercanos
- Bioma-based coloring

**Faltan:** Variación de altura micro-procedural, grietas, desgaste, variación de color por altura, efectos de erosión visual, detalles de superficie (piedras sueltas, parches de tierra, variación de hierba).

#### PROB-005: Distancia de Render Limitada (max 8 chunks)
**Severidad:** 🟢 MEDIA  
**Impacto:** Mundo se ve pequeño, pop-in visible

Con render distance máx 8 (128 bloques), el horizonte está muy cerca. Los jugadores ven el "edge of the world" claramente. Necesitamos render distance efectiva de 16+ chunks con LOD progresivo.

---

## 3. Solución Propuesta

### 3.1 Arquitectura: View-Direction Chunk Loading

```
                    ╱ Front Arc (prioridad 1)
                   ╱  120° cono de visión
              ╱    ╱
            ╱    ╱
          ╱    ╱     ← Cámara mira aquí
        ╱    ╱
      ╱    ╱
    ╱    ╱
   ────●───────  ← Jugador
    ╲    ╲
      ╲    ╲     ← Back (no generar, solo mantener)
        ╲    ╲
          ╲    ╲
            ╲    ╲
              ╲    ╱
                ╱
```

**Estrategia:**
1. **Front Arc (120°):** Generar chunks en cono de visión de cámara con prioridad máxima
2. **Side Arc (60° cada lado):** Generar con prioridad media (chunk visible periféricamente)
3. **Back (60°):** No generar nuevos, mantener existentes hasta unload
4. **Frustum check antes de generar:** Skip chunks que el frustum descarta

### 3.2 LOD Geométrico Progresivo

| Distancia (chunks) | LOD | Geometría | Detalle |
|---|---|---|---|
| 0-3 | LOD 0 | Full greedy mesh + AO | Color variation + procedural details |
| 4-6 | LOD 1 | Greedy mesh sin AO | Color variation básica |
| 7-10 | LOD 2 | Merge 2x2 blocks → 1 quad | Color plano por bioma |
| 11-16 | LOD 3 | Merge 4x4 blocks → 1 quad | Color plano + fog blend |
| 17+ | LOD 4 | Heightmap only (1 quad top) | Silhouette + fog |

### 3.3 Detalles Procedurales por Chunk

Cada chunk cercano (LOD 0) recibirá detalles procedurales:

1. **Micro-height variation:** ±0.15 bloques en superficie usando noise de alta frecuencia
2. **Color variation por altura:** Bloques más altos = más oscuros (sombra natural)
3. **Surface details:**
   - Parches de tierra mezclados con grass (noise-based)
   - Piedras sueltas en superficie (1-3 por chunk, determinísticas)
   - Grietas visuales (color más oscuro en líneas aleatorias)
4. **Erosion visual:** Bordes de acantilados con color desgastado
5. **Moisture variation:** Zonas más verdes/oscuras basadas en humidity noise
6. **Block-edge noise:** Variación sutil en bordes de bioma (mezcla suave)

### 3.4 Occlusion Culling Aproximado (Heightmap-based)

```
Vista lateral:

    Chunk A (montaña)
    ████
    ████      Chunk B (detrás)
    ████      ?????  ← Oculto por A
    ████      ?????  ← Oculto por A
    ████████  ?????  ← Parcialmente oculto
    ████████  ████   ← Visible abajo
```

**Estrategia:** Para cada chunk detrás de otro (en dirección de cámara), comparar heightmap promedio. Si el chunk frontal es significativamente más alto, skip el chunk trasero.

---

## 4. Plan de Implementación

### Fase 1: View-Direction Chunk Loading (jardvoxel.html)
**Duración estimada:** 3-4 horas  
**Prioridad:** 🔴 CRÍTICA

#### TASK-001: Directional Chunk Prioritization
- [ ] Modificar `ChunkManager.update()` para calcular dirección de cámara
- [ ] Implementar front-arc (120°) con prioridad de generación
- [ ] Implementar side-arc (60°) con prioridad media
- [ ] Back chunks: no generar nuevos, mantener existentes
- [ ] Frustum check antes de encolar generación
- [ ] Benchmark: 40% menos chunks generados al mirar en una dirección

#### TASK-002: Smart Generation Queue
- [ ] Reemplazar cola FIFO por priority queue basada en:
  - Distancia al jugador (más cercano = mayor prioridad)
  - Dirección de cámara (front > side > back)
  - Si está en frustum (sí > no)
- [ ] Limitar a 3 chunks/frame (vs 2 actual) gracias al ahorro de back chunks
- [ ] Pre-generar 1 chunk en dirección de movimiento del jugador

#### TASK-003: Increased Render Distance
- [ ] Aumentar render distance max de 8 a 16
- [ ] Implementar fade-in con niebla para chunks lejanos (LOD 3+)
- [ ] Configurar fog dinámico: `fog.near = renderDist * 0.7`, `fog.far = renderDist * 1.2`
- [ ] Settings UI: slider de render distance actualizado (2-16)

**Criterio de éxito:** 60 FPS con render distance 8 mirando en una dirección, chunks lejanos aparecen con fade-in

---

### Fase 2: LOD Geométrico Progresivo (jardvoxel.html)
**Duración estimada:** 4-5 horas  
**Prioridad:** 🟡 ALTA

#### TASK-004: LOD 2 — Block Merging (2x2)
- [ ] En `buildChunkMesh`, cuando `lodLevel >= 2`:
  - Agrupar bloques 2x2 en XZ → 1 block promedio
  - Si todos los bloques en el grupo 2x2 son del mismo tipo → 1 quad grande
  - Si hay mezcla → usar el tipo mayoritario
- [ ] Reducir vértices en ~75% para chunks lejanos
- [ ] Benchmark: meshing time LOD 2 < 50% vs LOD 0

#### TASK-005: LOD 3 — Block Merging (4x4)
- [ ] Agrupar bloques 4x4 en XZ → 1 block promedio
- [ ] Solo renderizar top surface (heightmap simplificado)
- [ ] Color = promedio de bioma colors en el área 4x4
- [ ] Sin caras laterales (solo top)
- [ ] Benchmark: meshing time LOD 3 < 25% vs LOD 0

#### TASK-006: LOD 4 — Heightmap Only
- [ ] Para chunks muy lejanos (dist > 12):
  - 1 quad por columna XZ (16x16 = 256 quads máximo)
  - Altura = max height de la columna
  - Color = bioma color + fog blend
  - Sin caras laterales ni bottom
- [ ] Fog: mezclar color del chunk con color de niebla según distancia
- [ ] Benchmark: LOD 4 < 10% vértices vs LOD 0

#### TASK-007: LOD Transitions Suaves
- [ ] Cuando un chunk pasa de LOD 2 a LOD 1 (jugador se acerca):
  - No saltar de golpe — generar LOD 0 en background
  - Mantener LOD 2 visible hasta que LOD 0 esté listo
  - Swap instantáneo cuando LOD 0 esté disponible
- [ ] Evitar pop-in visual en transiciones

**Criterio de éxito:** Render distance 16 con 60 FPS, transiciones LOD imperceptibles

---

### Fase 3: Detalles Procedurales (jardvoxel.html)
**Duración estimada:** 3-4 horas  
**Prioridad:** 🟢 MEDIA

#### TASK-008: Micro-Height Variation
- [ ] En `buildChunkMesh`, para LOD 0:
  - Aplicar noise de alta frecuencia (scale 0.1) a top surface
  - ±0.15 bloques de variación
  - Solo en bloques de superficie (top block expuesto)
  - Determinístico por world position (seed-based)

#### TASK-009: Color Variation por Altura
- [ ] Bloques más altos = más oscuros (factor 0.85-1.0)
- [ ] Bloques a nivel del mar = más brillantes (factor 1.0-1.05)
- [ ] Bloques profundos = más oscuros (factor 0.7-0.85)
- [ ] Aplicar como multiplicador de color en mesher

#### TASK-010: Surface Details Procedurales
- [ ] Parches de tierra en grass: noise 0.3 frequency, si noise > 0.6 → dirt patch
- [ ] Piedras sueltas: 1-3 por chunk, posicionadas con hash determinístico
- [ ] Grietas visuales: color más oscuro (×0.7) en líneas siguiendo noise directional
- [ ] Variación de grass color: verde claro/oscuro basado en moisture noise

#### TASK-011: Erosion Visual en Acantilados
- [ ] Detectar bordes verticales (diferencia de altura > 3 bloques entre vecinos)
- [ ] Aplicar color desgastado (marrón/grisáceo) en caras laterales expuestas
- [ ] Grietas horizontales en acantilados (color ×0.6 en bandas cada 2-3 bloques)

#### TASK-012: Bioma Blend en Bordes
- [ ] En bordes de bioma, mezclar colores de biomas adyacentes
- [ ] Usar noise de baja frecuencia para transición suave (no línea dura)
- [ ] Radio de blend: 2-3 bloques

**Criterio de éxito:** Terreno cercano se ve más rico y natural, sin patrón repetitivo visible

---

### Fase 4: Occlusion Culling (jardvoxel.html)
**Duración estimada:** 2-3 horas  
**Prioridad:** 🟢 MEDIA

#### TASK-013: Heightmap-based Occlusion
- [ ] Mantener heightmap promedio por chunk (top Y por columna XZ)
- [ ] Para chunks detrás de otros (en dirección de cámara):
  - Comparar heightmap promedio del chunk frontal vs trasero
  - Si frontal es >5 bloques más alto → skip render del trasero
- [ ] Solo aplicar para chunks a >4 chunks de distancia (no cerca del jugador)

#### TASK-014: Horizon Culling
- [ ] Para chunks muy lejanos (>10 chunks):
  - Calcular ángulo del chunk respecto al horizonte
  - Si chunk está por debajo del horizonte natural (curvatura) → skip
  - Simular curvatura terrestre: y_offset = (dist / 16)^2 * 0.5

**Criterio de éxito:** 15-25% menos chunks renderizados en zonas montañosas

---

### Fase 5: Migración a jardvoxel-survival.html
**Duración estimada:** 4-5 horas  
**Prioridad:** 🟡 ALTA

#### TASK-015: Port View-Direction Loading
- [ ] Aplicar TASK-001 a `SurvivalWorld.update()`
- [ ] Adaptar para ring-based generation existente
- [ ] Mantener compatibilidad con Web Worker

#### TASK-016: Port LOD Geométrico
- [ ] Aplicar TASK-004 a TASK-006 a `buildChunkMesh` en `jardvoxel-survival-mesher.js`
- [ ] Adaptar para bloques MC (blocks-registry.js)
- [ ] Mantener AO para LOD 0, desactivar para LOD 2+

#### TASK-017: Port Detalles Procedurales
- [ ] Aplicar TASK-008 a TASK-012 al mesher survival
- [ ] Adaptar para biomas con splines (WorldGenPipeline)
- [ ] Considerar features existentes (trees, ores, caves)

#### TASK-018: Port Occlusion Culling
- [ ] Aplicar TASK-013 a TASK-014 a SurvivalWorld
- [ ] Agregar frustum culling (no implementado en survival)

#### TASK-019: Survival-specific Optimizations
- [ ] Render distance max 16 en settings
- [ ] Fog dinámico para LOD lejano
- [ ] Mantener compatibilidad con nether dimension (render distance reducida)

**Criterio de éxito:** jardvoxel-survival.html con paridad visual de jardvoxel.html + mejoras

---

## 5. Arquitectura Técnica

### 5.1 View-Direction Algorithm

```javascript
// Pseudocódigo — nuevo ChunkManager.update()
update(playerX, playerZ, camera, fps) {
  const pcx = Math.floor(playerX / CHUNK_SIZE);
  const pcz = Math.floor(playerZ / CHUNK_SIZE);
  
  // Dirección de cámara (yaw)
  const cameraYaw = Math.atan2(camera.direction.x, camera.direction.z);
  
  // Adaptive render distance
  const renderDist = this._adaptiveRender(renderDist, fps);
  
  // Priority queue: front > side > back
  const queue = [];
  
  for (let dx = -renderDist; dx <= renderDist; dx++) {
    for (let dz = -renderDist; dz <= renderDist; dz++) {
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > renderDist) continue;
      
      // Ángulo del chunk respecto al jugador
      const chunkAngle = Math.atan2(dx, dz);
      let angleDiff = Math.abs(chunkAngle - cameraYaw);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      
      // Clasificar por arco
      let priority;
      if (angleDiff < Math.PI / 3) {        // 60° front
        priority = 0; // highest
      } else if (angleDiff < Math.PI / 2) { // 30° side
        priority = 1;
      } else if (angleDiff < Math.PI) {     // 90° back
        priority = 2; // lowest — skip if not already loaded
      }
      
      // Frustum check
      if (priority > 0 && !this._inFrustum(cx, cz, camera)) continue;
      
      const cx = pcx + dx, cz = pcz + dz;
      if (!this.chunks.has(key) && !this.pendingChunks.has(key)) {
        queue.push({ cx, cz, dist, priority });
      }
    }
  }
  
  // Sort: priority ASC, then dist ASC
  queue.sort((a, b) => a.priority - b.priority || a.dist - b.dist);
  
  // Generate up to 3 per frame (more budget since back chunks skipped)
  for (let i = 0; i < Math.min(3, queue.length); i++) {
    this.generateChunk(queue[i].cx, queue[i].cz);
  }
}
```

### 5.2 LOD Geométrico — Block Merging

```javascript
// Pseudocódigo — LOD 2 (2x2 merge) en buildChunkMesh
function buildChunkMesh(chunk, world, lodLevel) {
  const mergeSize = lodLevel >= 3 ? 4 : lodLevel >= 2 ? 2 : 1;
  
  if (mergeSize === 1) {
    // LOD 0/1: meshing normal (actual)
    return greedyMesh(chunk, world, lodLevel);
  }
  
  // LOD 2+: merged meshing
  for (let bx = 0; bx < CHUNK_SIZE; bx += mergeSize) {
    for (let bz = 0; bz < CHUNK_SIZE; bz += mergeSize) {
      // Encontrar top block promedio del área mergeSize×mergeSize
      let topY = -1;
      let blockType = 0;
      let heightSum = 0;
      
      for (let mx = 0; mx < mergeSize; mx++) {
        for (let mz = 0; mz < mergeSize; mz++) {
          // Find top solid block in column
          // ...
        }
      }
      
      // 1 quad para toda el área mergeSize×mergeSize
      // Color = promedio de bioma colors
    }
  }
}
```

### 5.3 Detalles Procedurales

```javascript
// Micro-height variation en mesher (LOD 0)
function getMicroHeightOffset(worldX, worldZ, seed) {
  // High-frequency noise for surface variation
  const n = perlinNoise2D(worldX * 0.1, worldZ * 0.1, seed + 9999);
  return (n - 0.5) * 0.3; // ±0.15 blocks
}

// Color variation por altura
function getAltitudeColorMultiplier(worldY) {
  if (worldY > 200) return 0.85;  // Montañas más oscuras
  if (worldY > 100) return 0.92;
  if (worldY > 63) return 1.0;    // Nivel del mar
  return 0.75;                     // Profundidad
}

// Surface details: dirt patches
function isDirtPatch(worldX, worldZ, seed) {
  const n = perlinNoise2D(worldX * 0.3, worldZ * 0.3, seed + 7777);
  return n > 0.6; // ~25% de superficie tiene dirt patches
}

// Erosion visual en acantilados
function getErosionColor(faceDir, heightDiff, baseColor) {
  if (faceDir[1] === 0 && heightDiff > 3) {
    // Cara lateral con gran diferencia de altura = acantilado
    return [baseColor[0] * 0.7, baseColor[1] * 0.65, baseColor[2] * 0.6];
  }
  return baseColor;
}
```

### 5.4 Heightmap-based Occlusion

```javascript
// Mantener heightmap por chunk
class ChunkHeightmap {
  constructor(chunk) {
    this.maxY = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
          if (chunk.getBlock(x, y, z) !== BLOCKS.AIR) {
            this.maxY[x + z * CHUNK_SIZE] = y;
            break;
          }
        }
      }
    }
  }
  
  getAverageHeight() {
    let sum = 0;
    for (let i = 0; i < this.maxY.length; i++) sum += this.maxY[i];
    return sum / this.maxY.length;
  }
}

// En update(), para chunks detrás de otros:
function isOccluded(chunkA, chunkB, cameraDir) {
  // Si chunkA está entre cámara y chunkB
  const avgHeightA = chunkA.heightmap.getAverageHeight();
  const avgHeightB = chunkB.heightmap.getAverageHeight();
  return avgHeightA > avgHeightB + 5; // A oculta B si es 5+ bloques más alto
}
```

---

## 6. Métricas de Éxito

### 6.1 Performance Targets

| Métrica | Actual | Target | Método |
|---|---|---|---|
| Chunks generados/frame | 2 (radial) | 3 (directional) | View-direction loading |
| Chunks renderizados | 100% frustum | 75-85% frustum | Occlusion culling |
| Render distance max | 8 chunks | 16 chunks | LOD progresivo |
| FPS (render dist 8) | 60 | 60 | Mantener con más distancia |
| FPS (render dist 16) | N/A | 45-60 | LOD + occlusion |
| Vértices chunk lejano (LOD 4) | = LOD 0 | <10% LOD 0 | Block merging |
| Chunk gen time (LOD 2) | = LOD 0 | <50% LOD 0 | Block merging |

### 6.2 Visual Quality Targets

| Métrica | Actual | Target |
|---|---|---|
| Micro-height variation | 0 | ±0.15 blocks |
| Color variation por altura | No | Sí (3 niveles) |
| Dirt patches en grass | No | ~25% superficie |
| Erosion en acantilados | No | Sí (color desgastado) |
| Bioma blend en bordes | Línea dura | Transición suave 2-3 bloques |
| Pop-in en LOD transitions | N/A | Imperceptible |
| Fog en horizonte | Estático | Dinámico con render distance |

### 6.3 Funcionalidad

- [ ] Render distance configurable hasta 16
- [ ] Dirección de cámara prioriza generación
- [ ] Chunks lejanos aparecen con fade-in (niebla)
- [ ] LOD transitions sin pop-in visible
- [ ] Detalles procedurales visibles en chunks cercanos
- [ ] Occlusion culling en zonas montañosas
- [ ] Sin regresión en jardvoxel-survival.html

---

## 7. Archivos a Modificar

### jardvoxel.html (Fase 1-4)

| Archivo | Cambios |
|---|---|
| `core/jardvoxel-engine.js` | `ChunkManager.update()` — directional loading, priority queue |
| `core/jardvoxel-engine.js` | `buildChunkMesh()` — LOD 2/3/4 block merging |
| `core/jardvoxel-engine.js` | `buildChunkMesh()` — procedural details (LOD 0) |
| `core/jardvoxel-engine.js` | Nueva clase `ChunkHeightmap` para occlusion |
| `core/jardvoxel-engine.js` | `_getLODLevel()` — 5 niveles (0-4) |
| `core/jardvoxel-worker.js` | Sin cambios (worker genera blocks, no mesh) |
| `jardvoxel.html` | Settings: render distance slider 2-16 |
| `jardvoxel.html` | Fog dinámico basado en render distance |

### jardvoxel-survival.html (Fase 5)

| Archivo | Cambios |
|---|---|
| `core/jardvoxel-survival-gameplay.js` | `SurvivalWorld.update()` — directional loading |
| `core/jardvoxel-survival-mesher.js` | `buildChunkMesh()` — LOD 2/3/4 + procedural details |
| `core/jardvoxel-survival-gameplay.js` | Frustum culling (nuevo) |
| `core/jardvoxel-survival-gameplay.js` | Heightmap occlusion |
| `jardvoxel-survival.html` | Settings: render distance slider 2-16 |

---

## 8. Riesgos y Mitigaciones

### RISK-001: Pop-in Visual en LOD Transitions
**Probabilidad:** MEDIA  
**Impacto:** MEDIO

**Mitigación:**
- Doble-buffer: mantener LOD anterior hasta que nuevo esté listo
- Fog blend en chunks lejanos oculta transiciones
- LOD transitions graduales (no saltos bruscos)

### RISK-002: Regresión de FPS con Detalles Procedurales
**Probabilidad:** BAJA  
**Impacto:** ALTO

**Mitigación:**
- Detalles solo en LOD 0 (chunks cercanos, pocos en número)
- Noise cache para evitar recálculo
- Determinístico por posición (no recálculo al re-mesh)

### RISK-003: Occlusion Culling Incorrecto
**Probabilidad:** MEDIA  
**Impacto:** MEDIO

**Mitigación:**
- Solo aplicar a >4 chunks de distancia
- Margen de seguridad (5 bloques de diferencia)
- Fallback: si dudoso, renderizar (preferible render de más a holes)

### RISK-004: Incompatibilidad entre jardvoxel.html y survival
**Probabilidad:** BAJA  
**Impacto:** BAJO

**Mitigación:**
- Implementar primero en jardvoxel.html (arquitectura simple)
- Port incremental a survival (Fase 5 separada)
- Mantener APIs compatibles

---

## 9. Cronograma

```
Fase 1: View-Direction Loading (jardvoxel.html)
├─ TASK-001: Directional prioritization     1h
├─ TASK-002: Smart generation queue          1h
└─ TASK-003: Increased render distance       1h
                                            ──
                                             3h

Fase 2: LOD Geométrico (jardvoxel.html)
├─ TASK-004: LOD 2 (2x2 merge)              1h
├─ TASK-005: LOD 3 (4x4 merge)              1h
├─ TASK-006: LOD 4 (heightmap only)         1h
└─ TASK-007: LOD transitions suaves          1h
                                            ──
                                             4h

Fase 3: Detalles Procedurales (jardvoxel.html)
├─ TASK-008: Micro-height variation         30min
├─ TASK-009: Color variation por altura     30min
├─ TASK-010: Surface details                1h
├─ TASK-011: Erosion visual                 30min
└─ TASK-012: Bioma blend                    30min
                                            ──
                                             3h

Fase 4: Occlusion Culling (jardvoxel.html)
├─ TASK-013: Heightmap occlusion            1h
└─ TASK-014: Horizon culling                1h
                                            ──
                                             2h

Fase 5: Migración a jardvoxel-survival.html
├─ TASK-015: Port view-direction            1h
├─ TASK-016: Port LOD geométrico            1h
├─ TASK-017: Port detalles procedurales     1h
├─ TASK-018: Port occlusion culling         30min
└─ TASK-019: Survival-specific opts          30min
                                            ──
                                             4h

TOTAL: ~16 horas
```

---

## 10. Decisiones Técnicas

### DEC-001: ¿View-direction loading vs radial tradicional?
**Decisión:** ✅ View-direction

**Razones:**
- ~40% menos chunks generados (no se generan detrás del jugador)
- Mejor experiencia: chunks aparecen más rápido donde el jugador mira
- Permite mayor render distance con mismo presupuesto de CPU

### DEC-002: ¿Block merging vs heightmap-only para LOD lejano?
**Decisión:** ✅ Ambos (progresivo)

**Razones:**
- LOD 2 (2x2): mantiene algo de detalle, good para media distancia
- LOD 3 (4x4): simplificación agresiva, good para distancia larga
- LOD 4 (heightmap): mínimo vértices, good para horizonte
- Transición gradual mantiene calidad visual

### DEC-003: ¿Detalles procedurales en mesher o en generation?
**Decisión:** ✅ En mesher (visual only)

**Razones:**
- No afecta lógica de juego (colisiones, mining)
- Re-meshing aplica detalles automáticamente
- No requiere regenerar chunks
- Más rápido de implementar

### DEC-004: ¿Occlusion culling con heightmap o con z-buffer?
**Decisión:** ✅ Heightmap-based (aproximado)

**Razones:**
- z-buffer requiere render pass adicional (costoso)
- Heightmap es O(1) por chunk
- Suficiente para voxel terrain (geometría simple)
- Margen de seguridad evita holes visuales

---

## 11. Apéndices

### A. Comparación: Antes vs Después

```
ANTES (radial uniforme):
         ┌─────────────────────┐
         │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
         │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
         │  ▓▓▓▓▓▓●▓▓▓▓▓▓▓▓  │  ← Todos los chunks generados
         │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │    sin importar dirección
         │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
         └─────────────────────┘

DESPUÉS (view-direction + LOD):
         ┌─────────────────────┐
         │     ░░░▒▒▓▓▓▓▒▒░░░  │  ← Front: LOD 0 (full detail)
         │       ░░▒▒▓▓▓▓▒▒░░  │  ← Side: LOD 1-2
         │         ▓▓●▓▓        │  ← Back: no new gen
         │     ░░░░░░░░░░░░░░  │  ← Far: LOD 3-4 (heightmap)
         │   ░░░░░░░░░░░░░░░░  │  ← Horizon: fog blend
         └─────────────────────┘
```

### B. Checklist de Validación

**Pre-Implementación:**
- [ ] Git branch: `feature/chunk-optimization`
- [ ] Backup de jardvoxel.html y jardvoxel-survival.html
- [ ] Documentar FPS actual con render distance 3, 5, 8

**Post-Fase 1:**
- [ ] 40% menos chunks generados al mirar en una dirección
- [ ] Render distance 8 con 60 FPS
- [ ] No holes en mundo al girar cámara rápidamente

**Post-Fase 2:**
- [ ] Render distance 16 con 50+ FPS
- [ ] LOD transitions sin pop-in
- [ ] Chunks lejanos visibles en horizonte (con fog)

**Post-Fase 3:**
- [ ] Micro-height visible en superficie
- [ ] Dirt patches visibles en grass
- [ ] Acantilados con color desgastado
- [ ] Bioma blend suave en bordes

**Post-Fase 4:**
- [ ] Chunks detrás de montañas no se renderizan
- [ ] Sin holes visuales
- [ ] 15-25% menos draw calls en zonas montañosas

**Post-Fase 5:**
- [ ] jardvoxel-survival.html con todas las mejoras
- [ ] Sin regresión en features existentes
- [ ] Nether dimension funciona con render distance reducida

---

**Aprobado por:** ja  
**Fecha de inicio:** 26 Junio 2026  
**Fecha de finalización:** 28 Junio 2026  
**Estado:** ✅ Completado
