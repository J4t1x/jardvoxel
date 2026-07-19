# JardVoxel — Generacion Procedural de Mundo

**Versión:** 7.0 — Hierarchical World Generation  
**Fecha:** 29 Junio 2026  
**Specs:** SPEC-091 through SPEC-098 (v6.0), SPEC-100 through SPEC-110 (v7.0)  
**PRD:** [PRD-JARDVOXEL-7.0-HIERARCHICAL.md](../prd/PRD-JARDVOXEL-7.0-HIERARCHICAL.md)

---

## Arquitectura Jerárquica v7.0

La generación procedural evoluciona hacia una arquitectura jerárquica inspirada en procesos geográficos reales. Los chunks dejan de ser la unidad responsable del diseño del mundo y pasan a ser únicamente la representación física del terreno.

### 6 Niveles de Jerarquía

| Nivel | Clase | Responsabilidad | Spec |
|-------|-------|-----------------|------|
| 1 — Mundo | `WorldIdentity` | Semilla, clima global, nivel del mar, continentes | SPEC-100 |
| 2 — Continentes | `ContinentGenerator` | Clima, altitud, vegetación, fauna, cultura | SPEC-101 |
| 3 — Regiones | `RegionGenerator` | Cordilleras, llanuras, bosques, desiertos | SPEC-102 |
| 4 — Zonas | `ZoneGenerator` | Lagos, valles, cascadas, claros, humedales | SPEC-103 |
| 5 — Chunks | `HierarchicalChunkGenerator` | Materializa terreno (16x16) | SPEC-104 |
| 6 — Microsectores | `MicrosectorGenerator` | Flores, arbustos, piedras, hongos (4x4) | SPEC-105 |

### 9 Capas de Generación Progresiva

| Capa | Nombre | Prioridad | Spec |
|------|--------|-----------|------|
| 1 | Terreno base | Inmediata | SPEC-106 |
| 2 | Micro relieve | Inmediata | SPEC-106 |
| 3 | Rocas superficiales | Alta | SPEC-106 |
| 4 | Vegetación mayor (árboles) | Alta | SPEC-106 |
| 5 | Vegetación menor (flores) | Media | SPEC-106 |
| 6 | Decoración natural (troncos, musgo) | Media | SPEC-106 |
| 7 | Fauna | Baja | SPEC-106 |
| 8 | Audio ambiental | Baja | SPEC-106 |
| 9 | Eventos dinámicos (mariposas, luciérnagas) | Baja | SPEC-106 |

### Streaming Inteligente (4 Tiers)

| Tier | Distancia | Contenido |
|------|-----------|-----------|
| Cercano | 0-3 chunks | Todas las capas, sombras, fauna |
| Medio | 3-8 chunks | Capas 1-6, árboles simplificados |
| Lejano | 8-14 chunks | Solo geometría básica |
| Horizonte | 14+ chunks | Solo heightmap |

### Sistemas Adicionales

- **Landmarks** (SPEC-108): Árbol milenario, cascada, volcán, lago cristalino, cañón, arco de piedra, bosque rojo, ruinas, santuario
- **Ecosistemas** (SPEC-109): Biomas con reglas ecológicas completas (árboles + arbustos + flores + musgo + hongos + fauna)
- **Generación Contextual** (SPEC-110): Aldeas cerca de ríos, minas en cordilleras, templos en altura, puertos en costas

### Archivos v7.0

| Archivo | Responsabilidad |
|---------|-----------------|
| `core/jardvoxel-survival-world-hierarchy.js` | Niveles 1-5 (World, Continent, Region, Zone, Chunk) |
| `core/jardvoxel-survival-microsectors.js` | Nivel 6 (Microsectores) |
| `core/jardvoxel-survival-layers.js` | Sistema de 9 capas |
| `core/jardvoxel-survival-landmarks.js` | Landmarks |
| `core/jardvoxel-survival-ecosystems.js` | Ecosistemas |
| `core/jardvoxel-survival-contextual.js` | Generación contextual |

### Integración con v6.0

La jerarquía v7.0 es **opt-in**. Se activa con `worldGen.enableHierarchy()` y desactiva con `worldGen.disableHierarchy()`. Cuando está activa, los métodos `getBiomeHierarchical()` y `getChunkContext()` delegan a la jerarquía. Cuando está inactiva, el motor usa el pipeline v6.0 original sin cambios.

---

## Sistema de Ruido v6.0 (Base)

El motor usa **Simplex Noise 2D y 3D** (no Perlin) con semilla reproducible (Xorshift128+ PRNG) y **Domain Warping** para patrones orgánicos.

### Ventajas de Simplex sobre Perlin:
- ✅ Menos artefactos direccionales
- ✅ Mejor performance (O(n²) vs O(n³) en 3D)
- ✅ Gradientes más uniformes
- ✅ Patrones más orgánicos y naturales

### Componentes del Sistema v6.0:

1. **SimplexNoise** (SPEC-091) — Generador de ruido base
2. **DomainWarper** (SPEC-092) — Rompe regularidad del ruido
3. **NOISE_CONFIGS** (SPEC-093) — Parámetros calibrados por capa
4. **TerrainSplines** (SPEC-094) — Modelado complejo de terreno
5. **BiomeBlender** (SPEC-095) — Transiciones suaves entre biomas
6. **BiomeTerrainModulator** (SPEC-096) — Modulación específica por bioma
7. **FeaturePlacer** (SPEC-097) — Distribución coherente de features
8. **HydraulicErosion** (SPEC-098) — Erosión post-generación (opcional)

### Capas de Ruido v6.0 (SPEC-093)

Todas las capas usan **Simplex Noise** con **Domain Warping** aplicado antes del sampling.

| Capa | Warp Strength | Octaves | Persistence | Lacunarity | Scale | Función |
|------|---------------|---------|-------------|------------|-------|---------|
| **Continentalness** | 80 | 6 | 0.5 | 2.0 | 0.0005 | Océano vs tierra |
| **Erosion** | 40 | 5 | 0.55 | 2.2 | 0.0008 | Plano vs montañoso |
| **PeaksValleys** | 30 | 4 | 0.6 | 2.5 | 0.0012 | Picos y valles |
| **Weirdness** | 20 | 3 | 0.5 | 2.0 | 0.0015 | Variación extraña |
| **Temperature** | 60 | 4 | 0.5 | 2.0 | 0.0005 | Temperatura (biomas) |
| **Humidity** | 60 | 4 | 0.5 | 2.0 | 0.0005 | Humedad (biomas) |
| **Density3D** | 15 | 5 | 0.5 | 2.0 | 0.008 | Cuevas y overhangs |

### Domain Warping (SPEC-092)

Cada capa aplica warping antes de samplear el ruido:

```javascript
// Sin warping (v5.0)
const value = noise.fbm2D(x, z, octaves, persistence, lacunarity, scale);

// Con warping (v6.0)
const warped = warper.warp2D(x, z, strength, warpScale, warpOctaves);
const value = noise.fbm2D(warped.x, warped.z, octaves, persistence, lacunarity, scale);
```

**Efectos del warping:**
- Coastlines irregulares con bahías y penínsulas naturales
- Montañas con formas orgánicas (no conos perfectos)
- Biomas con fronteras naturales (no líneas rectas)
- Ríos con curvas naturales
- Cuevas con formas complejas

## Altura del Terreno v6.0 (SPEC-094)

El sistema usa **splines** para modelado complejo de terreno, inspirado en Minecraft 1.18+.

### Pipeline de Generación:

```javascript
getHeight(x, z):
  // 1. Samplear capas de ruido con domain warping
  continental = getContinentalness(x, z)  // con warp strength 80
  erosion = getErosion(x, z)              // con warp strength 40
  peaksValleys = getPeaksValleys(x, z)    // con warp strength 30
  weirdness = getWeirdness(x, z)          // con warp strength 20
  
  // 2. Evaluar splines (interpolación suave)
  baseHeight = continentalnessSpline.evaluate(continental)
  erosionOffset = erosionSpline.evaluate(erosion)
  peaksOffset = peaksValleysSpline.evaluate(peaksValleys)
  
  // 3. Combinar con pesos
  finalHeight = baseHeight + erosionOffset * 0.7 + peaksOffset * 0.5
  
  // 4. Aplicar weirdness (variación extraña)
  finalHeight += weirdness * 8
  
  // 5. Clamp
  finalHeight = clamp(finalHeight, 1, CHUNK_HEIGHT - 5)
```

### Splines Definidos (SPEC-094):

**Continentalness Spline:**
- `-1.0 → 32` (océano profundo)
- `-0.2 → 58` (costa)
- `0.0 → 63` (nivel del mar)
- `0.3 → 75` (tierras bajas)
- `0.6 → 95` (tierras altas)
- `1.0 → 120` (montañas)

**Erosion Spline:**
- `-1.0 → -15` (muy erosionado, valles)
- `-0.5 → -8`
- `0.0 → 0` (neutral)
- `0.5 → 10`
- `1.0 → 25` (poco erosionado, picos)

**Peaks/Valleys Spline:**
- `-1.0 → -20` (valles profundos)
- `-0.3 → -5`
- `0.0 → 0` (neutral)
- `0.3 → 8`
- `1.0 → 30` (picos altos)

## Biomas v6.0 (SPEC-095, SPEC-096)

19 biomas con **transiciones suaves** (8-16 bloques) usando BiomeBlender.

### Sistema de Blending (SPEC-095):

En lugar de fronteras duras, cada posición calcula un **blend de múltiples biomas**:

```javascript
getBiomeAt(x, z):
  // 1. Samplear capas con warping
  temp = getTemperature(x, z)      // warp strength 60
  humid = getHumidity(x, z)        // warp strength 60
  height = getHeight(x, z)
  continental = getContinentalness(x, z)
  
  // 2. Calcular distancias a todos los biomas
  biomeWeights = {}
  for (biome in BIOMES) {
    distance = calculateBiomeDistance(temp, humid, height, continental, biome)
    weight = max(0, 1 - distance / BLEND_RADIUS)  // BLEND_RADIUS = 12
    if (weight > 0) biomeWeights[biome] = weight
  }
  
  // 3. Normalizar pesos (suma = 1.0)
  totalWeight = sum(biomeWeights.values)
  for (biome in biomeWeights) {
    biomeWeights[biome] /= totalWeight
  }
  
  return biomeWeights  // { plains: 0.6, forest: 0.3, meadow: 0.1 }
```

### Biomas Disponibles:

| Bioma | Condiciones | Modulación de Terreno (SPEC-096) |
|-------|-------------|----------------------------------|
| **Ocean** | height < 58, temp ≥ 0.25 | Suavizado (-5 a -15) |
| **Deep Ocean** | height < 45 | Suavizado fuerte (-10 a -25) |
| **Beach** | height 58-65 | Aplanado (±2) |
| **Plains** | temp 0.3-0.7, humid 0.3-0.6 | Suave ondulación (±3) |
| **Forest** | temp 0.3-0.6, humid 0.5-0.8 | Colinas suaves (+5 a +15) |
| **Jungle** | temp > 0.6, humid > 0.7 | Colinas pronunciadas (+10 a +25) |
| **Desert** | temp > 0.7, humid < 0.3 | Dunas (+8 a +20) |
| **Savanna** | temp 0.6-0.8, humid 0.2-0.4 | Mesetas (+5 a +12) |
| **Taiga** | temp 0.2-0.4, humid > 0.4 | Colinas boscosas (+8 a +18) |
| **Snowy Plains** | temp < 0.25, height < 75 | Plano nevado (±2) |
| **Mountains** | height > 85 | Picos extremos (+20 a +50) |
| **Snowy Peaks** | height > 95, temp < 0.3 | Picos nevados (+25 a +60) |
| **Stony Peaks** | height > 90, temp > 0.3 | Picos rocosos (+20 a +45) |
| **Meadow** | height 70-85, humid > 0.5 | Praderas onduladas (+3 a +8) |
| **Cherry Grove** | temp 0.4-0.6, humid 0.6-0.8 | Colinas florales (+5 a +12) |
| **Swamp** | humid > 0.7, height 60-68 | Pantanoso (-2 a +3) |
| **River** | Detectado por noise especial | Cauce (-5 a -10) |
| **Mystic Grove** | Raro, weirdness > 0.7 | Formaciones extrañas (+10 a +30) |
| **Autumn Forest** | temp 0.4-0.6, humid 0.4-0.6 | Colinas otoñales (+6 a +14) |

### Modulación de Terreno por Bioma (SPEC-096):

Cada bioma aplica un **noise adicional** para crear características únicas:

```javascript
BIOME_TERRAIN_MODULATION = {
  mountains: {
    scale: 0.008,
    octaves: 4,
    amplitude: 35,
    type: 'ridged'  // Crestas pronunciadas
  },
  jungle: {
    scale: 0.012,
    octaves: 3,
    amplitude: 18,
    type: 'billowy'  // Colinas redondeadas
  },
  desert: {
    scale: 0.015,
    octaves: 2,
    amplitude: 12,
    type: 'dunes'  // Dunas sinuosas
  }
  // ... etc
}
```

## Cuevas

### Spaghetti Caves (tuneles)
```
|caveNoise.fbm3D(x, y, z, 2 oct, scale 0.05)| < 0.08
AND
|caveNoise2.fbm3D(x, y, z, 2 oct, scale 0.08)| < 0.08
```
Dos campos de ruido cercanos a cero crean tuneles intersectantes.

### Cheese Caves (camaras grandes)
```
caveNoise.fbm3D(x, y*0.5, z, 3 oct, scale 0.03) > 0.55
```
Camara esferica subterranea.

### Noodle Caves (tuneles delgados sinuosos)
```
|noodleNoise.fbm3D(x, y*1.5, z, 2 oct, scale 0.06)| < 0.05
AND
|noodleNoise2.fbm3D(x*1.3, y*1.5, z*1.3, 2 oct, scale 0.06)| < 0.05
```
Tuneles mas delgados (1-3 bloques) y sinuosos, con dos noises offset.

### Reglas especiales
- Aquifer system determina fluido (agua/lava/aire) en cavidades
- `y ≤ WATER_LEVEL` bajo oceano → Agua
- `y < 3` o `y > CHUNK_HEIGHT - 10` → no se generan cuevas

## Ravinas

Cortes verticales estrechos:
```
|ravineNoise.noise2D(x*0.02, z*0.02) - 0.5| < 0.03
AND
ravineNoise.fbm3D(x, y*2, z, 3 oct, scale 0.02) ∈ [-0.1, 0.15]
```

## Carver Caves (tuneles ramificados)

Sistema distinto a noise caves, genera tuneles a gran escala:

### Main tunnel
```
|carverNoise.fbm3D(x, y*0.7, z, 3 oct, scale 0.015)| < 0.04
```
Tunel horizontal sinuoso con variacion vertical.

### Branch tunnel
```
|carverNoise2.fbm3D(x*1.5, y*1.2, z*1.5, 2 oct, scale 0.025)| < 0.03
```
Tunel secundario mas delgado, direccion diferente.

## Overhangs (3D Density)

En biomas montañosos (mountain, snow, badlands), bloques solidos sobre el heightmap:
```
densityNoise.fbm3D(x, y, z, 3 oct, scale 0.015) > 0.12 + heightBias * 0.35
```
Donde `heightBias = (y - height) / 18`. Genera acantilados y overhangs naturales.

## Aquifer System

Controla fluidos en cavidades subterraneas (caves, carvers, ravines):

1. **Barrier noise**: `aquiferBarrier.noise3D(x*0.04, y*0.06, z*0.04)`
   - Si > 0.3 → aire (barrera)
2. **Local fluid level**: `aquiferNoise.noise2D(cellX*0.5, cellZ*0.5)`
   - Celdas de 16×16 bloques
   - Nivel local: `WATER_LEVEL - 8 + noise * 12`
3. **Fluid type**: `y ≤ 8` → Lava, `y > 8` → Agua

## Minerales (Ore Veins)

Sistema de vetas con 3 noises (toggle/ridge/gap):

| Noise | Funcion |
|-------|----------|
| `oreToggleNoise` | Selecciona tipo de mineral |
| `oreRidgeNoise` | Skip si > 0.2 (no hay veta) |
| `oreGapNoise` | Densidad: ore si > 0.55 (10-30% de bloques) |

Distribucion por profundidad:

| Profundidad | Minerales posibles |
|-------------|-------------------|
| y ≤ 14 (deep) | Diamond, Gold, Copper, Iron |
| y ≤ 30 (mid) | Gold, Iron, Copper, Coal |
| y ≤ 52 (shallow) | Iron, Copper, Coal |

## Arboles (SPEC-029)

Determinados por `hasTreeAt(x, z)` usando hash deterministico. **6 tipos de arboles** segun bioma:

| Bioma | Tipo | Densidad | Descripcion |
|-------|------|----------|-------------|
| Jungle | Jungle Tree | 12% | Tronco 2x2, altura 8-12, hojas radio 3 |
| Forest | Oak Tree | 8% | Copa redondeada asimetrica, altura 4-6 |
| Taiga | Spruce Tree | 6% | Copa conica, altura 5-7, LEAVES_DARK |
| Snow | Spruce Tree | 6% | Copa conica con nieve |
| Mangrove | Mangrove Tree | 7% | Raices visibles, tronco inclinado |
| Swamp | Oak Tree | 4% | Tronco corto, hojas colgantes |
| Plains | Oak Tree | 2% | Arbol solitario, copa pequena |
| Savanna | Savanna Tree | 3% | Tronco grueso, copa plana (acacia) |
| Badlands | Dead Tree | 2% | Sin hojas, solo ramas de WOOD |

### Estructura por tipo

- **Oak**: tronco 4-6 WOOD, hojas esfera radio 2 (asimetrica)
- **Jungle**: tronco 2x2 BIRCH_WOOD, altura 8-12, hojas radio 3
- **Spruce**: tronco 5-7 SPRUCE_WOOD, copa conica (hojas decrecientes)
- **Mangrove**: tronco inclinado + raices de WOOD, hojas radio 2
- **Savanna**: tronco grueso 2x1, copa plana ancha
- **Dead**: tronco 3-5 + ramas horizontales, sin hojas

## Cactus

Solo en desert y badlands. Densidad 3%. Altura 1-3 bloques.

## Dead Bush

En desert, badlands y savanna. Densidad 4%.

## Estructuras (SPEC-030/031)

Probabilidad ~1% por chunk. **14 tipos de estructuras** segun bioma:

| Estructura | Bioma | Descripcion |
|------------|-------|-------------|
| Village | Plains, Forest (height 15-45) | 2-4 casas + well + lamp posts + paths |
| Temple | Desert, Badlands | Piramide de sandstone 7x7, 4 capas, camara interior |
| Mineshaft | Subterraneo (height < 20) | Tunel horizontal con soportes de wood |
| Monument | Ocean, Frozen Ocean | Estructura de prismarine hueca bajo agua |
| Jungle Temple | Jungle | Estructura 7x5 de mossy cobble con camara |
| Shipwreck | Beach, Ocean | Casco inclinado de planks/wood, semi-enterrado |
| Igloo | Snow, Tundra | Domo de nieve con interior hueco |
| Desert Well | Desert | Pozo 3x3 de sandstone con agua en centro |
| Ice Spike | Snow, Frozen Ocean | Formacion vertical de packed ice |
| Boulder | Mountain, Forest | Roca esferica de granite/andesite/diorite |
| Swamp Hut | Swamp | Choza de wood sobre pilotes con techo |
| Ruined Portal | Badlands, Savanna | Portal de obsidian con lava alrededor |
| Coral Reef | Ocean (temp > 0.6) | Arrecife colorido submarino de prismarine/clay |
| Forest Rock | Forest, Taiga | Roca musgosa de mossy cobble/stone |

### Componentes de Village
- `_placeHouseSmall()`: 5x4 planks, techo de wood, puerta
- `_placeHouseLarge()`: 7x5 planks, techo de wood, ventana de glass
- `_placeWell()`: 3x3 cobblestone con agua en centro
- `_placeLampPost()`: post de wood + lantern en cima
- `_placePath()`: linea de gravel entre estructuras

## Nieve

En biomas frios (tundra, taiga, snow), capa de nieve sobre bloques con 70% de probabilidad (hash deterministico).

## Freeze Top Layer

Hielo en superficie de agua en biomas frios (frozen_ocean, tundra, snow):
```
freezeNoise.noise2D(x*0.03, z*0.03) > -0.2 → ICE en y=WATER_LEVEL
```

## Lava Lakes

En areas muy bajas (height ≤ 10), lava lakes raros:
```
lavaLakeNoise.noise2D(x*0.01, z*0.01) > 0.7 → LAVA en superficie
```

## Fluid Springs

Agua o lava filtrandose desde paredes de cuevas:
```
springNoise.noise3D(x*0.1, y*0.1, z*0.1) > 0.82
→ LAVA si y ≤ 10, WATER si y > 10
```

## Stone Variants

Granito, andesita y diorita distribuidos underground:
```
stoneVarNoise.noise3D(x*0.02, y*0.01, z*0.02)
> 0.5 → GRANITE
< -0.5 → DIORITE
0.2-0.4 → ANDESITE
```

## Vegetacion

| Bloque | Biomas | Densidad |
|--------|--------|----------|
| Tall Grass (42) | Plains, Forest, Savanna | 8% |
| Poppy (40) | Plains, Forest, Savanna | 2-10% |
| Dandelion (41) | Plains, Forest, Savanna | 2% |
| Fern (26) | Jungle, Taiga, Swamp, Mangrove | 6% |
| Tall Grass (humedo) | Jungle, Taiga, Swamp, Mangrove | 2% |
| Dead Bush (27) | Desert, Badlands, Savanna | 4% |
| Bamboo (62) | Jungle | 3% |

Todos los bloques de vegetacion son **no-solidos** (atravesable).

## Ciclo Dia/Noche (SPEC-026)

```
dayTime += dt * 0.005  (ciclo completo ~200 segundos)

angle = dayTime * 2π - π/2
sunY = sin(angle)  → altura del sol
sunX = cos(angle)  → posicion horizontal

dayFactor = clamp(sunY * 1.5 + 0.3, 0, 1)
sunsetFactor = max(0, 1 - |sunY| * 4)  → pico cerca del horizonte
nightFactor = max(0, -sunY * 2)

Sun intensity = dayFactor * 1.2
Hemi intensity = 0.2 + dayFactor * 0.5
Ambient intensity = 0.15 + dayFactor * 0.25

Sky colors (interpolacion day → sunset → night):
  topColor = dayTop.lerp(sunsetTop, sunset).lerp(nightTop, night)
  bottomColor = dayBottom.lerp(sunsetBottom, sunset).lerp(nightBottom, night)

Fog near = 30 + dayFactor * 30
Fog far = 80 + dayFactor * 80

Stars: opacity = max(0, 1 - dayFactor * 2.5), slow rotation
Sun mesh: visible when sunY > -0.05, emissive yellow + glow halo
Moon mesh: visible when sunY < 0.05, grey sphere opposite sun
```

## Nubes Procedurales (SPEC-032)

```
_initClouds():
  Canvas 256x256 con multi-octave noise (sines)
  Threshold > 0.55 → forma de nube
  3 planos (PlaneGeometry 800x800) a alturas 55, 58, 61
  RepeatWrapping con offset aleatorio por plano

_updateClouds(dt):
  Position sigue al jugador
  Wind: texture offset += dt * speed * (1 + i*0.3)
  Color: blanco → rosa sunset → gris noche
  Opacity: (0.5 - i*0.1) * (0.3 + dayFactor * 0.7)
```
