# PRD: JardVoxel 6.0 — Advanced Noise Generation & Coherent Biomes

**Fecha:** 28 Junio 2026  
**Versión:** 6.0.0  
**Proyecto:** jard-games/jardvoxel  
**Prioridad:** 🔴 CRÍTICA — Major version upgrade  
**Estado:** ✅ Completado — SimplexNoise, DomainWarper, BiomeBlender, FastNoiseLite, TerrainSplines, BiomeTerrainModulator, FeaturePlacer todos implementados en `jardvoxel-survival-noise.js` y usados por `WorldGenPipeline` en `jardvoxel-survival-engine.js`.
**Versión anterior:** v5.0.0 (21 specs completadas, sistema de ruido Perlin básico)

---

## 1. Executive Summary

JardVoxel 6.0 revoluciona la generación procedural del mundo mediante la implementación de **Simplex Noise** y técnicas avanzadas de generación multi-octava inspiradas en el sistema de Minecraft 1.18+. El objetivo es crear biomas **coherentes, hermosos y vivos** que transporten al jugador a otro universo, eliminando la aleatoriedad caótica actual y reemplazándola con patrones naturales reconocibles.

**Problema actual:**
- Los mapas generados carecen de coherencia visual
- Transiciones bruscas entre biomas
- Ruido Perlin básico genera patrones repetitivos y predecibles
- Biomas no se sienten "reales" ni "vivos"
- Falta de características geográficas distintivas (cordilleras, valles, mesetas)

**Solución:**
- **Simplex Noise** para mejor rendimiento y patrones más naturales
- **Multi-octave noise** con parámetros calibrados por bioma
- **Domain warping** para romper la regularidad del ruido
- **Spline-based terrain shaping** inspirado en Minecraft
- **Biome blending** suave en fronteras
- **Feature placement** coherente (árboles, rocas, vegetación)

---

## 2. Estado Actual (v5.0.0)

### 2.1 Sistema de ruido actual

| Componente | Implementación | Problema |
|------------|----------------|----------|
| Noise generator | `PerlinNoise3D` | Patrones regulares, artefactos visuales |
| Octaves | 2-4 octaves fijos | No ajustado por tipo de terreno |
| Persistence | 0.5 fijo | No varía según necesidad |
| Lacunarity | 2.0 fijo | Escalado uniforme |
| Biome selection | Temperatura + Humedad | Transiciones bruscas |
| Terrain shaping | Splines básicos | Falta variedad topográfica |
| Cave generation | 3 tipos (cheese, spaghetti, noodle) | Funciona bien, mantener |

### 2.2 Brechas críticas

| Brecha | Severidad | Descripción |
|--------|-----------|-------------|
| Sin Simplex Noise | 🔴 ALTA | Perlin genera artefactos direccionales |
| Sin domain warping | 🔴 ALTA | Patrones demasiado regulares |
| Biome blending inexistente | 🔴 ALTA | Fronteras nítidas entre biomas |
| Octaves no calibrados | 🟡 MEDIA | Mismo ruido para montañas y llanuras |
| Sin erosion simulation | 🟡 MEDIA | Terreno no se ve "desgastado" |
| Feature placement aleatorio | 🟡 MEDIA | Árboles/rocas sin coherencia espacial |

---

## 3. Visión y Filosofía

### 3.1 Principios de diseño

1. **Coherencia sobre aleatoriedad** — Patrones naturales reconocibles
2. **Variedad sin caos** — Cada bioma tiene identidad pero no rompe inmersión
3. **Transiciones suaves** — Biomas se mezclan gradualmente
4. **Escala geográfica** — Montañas son cordilleras, no picos aislados
5. **Realismo estilizado** — No foto-realismo, pero sí lógica natural

### 3.2 Referencias

**Minecraft 1.18+ Noise System:**
- Multi-dimensional noise (continentalness, erosion, peaks/valleys, weirdness)
- Spline-based terrain shaping
- Density functions para 3D terrain
- Aquifer system para cuevas inundadas

**Simplex Noise advantages:**
- Menos artefactos direccionales que Perlin
- Mejor rendimiento (O(n²) vs O(n³) en 3D)
- Gradientes más uniformes
- Patrones más "orgánicos"

---

## 4. Arquitectura del Sistema de Ruido

### 4.1 Simplex Noise Implementation

**Spec:** SPEC-091 — Simplex Noise Core

Implementar `SimplexNoise2D` y `SimplexNoise3D` con:

```javascript
class SimplexNoise {
  constructor(seed) {
    // Gradient vectors optimizados
    this.grad3 = [
      [1,1,0], [-1,1,0], [1,-1,0], [-1,-1,0],
      [1,0,1], [-1,0,1], [1,0,-1], [-1,0,-1],
      [0,1,1], [0,-1,1], [0,1,-1], [0,-1,-1]
    ];
    
    // Permutation table seeded
    this.perm = this._generatePermutation(seed);
  }
  
  noise2D(x, y) {
    // Simplex grid skewing
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;
    
    // Skew input space to determine simplex cell
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    
    // Unskew cell origin back to (x,y) space
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;
    
    // Determine which simplex we're in
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    
    // Offsets for corners
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    
    // Calculate contribution from three corners
    let n0 = this._contrib2D(x0, y0, i, j);
    let n1 = this._contrib2D(x1, y1, i + i1, j + j1);
    let n2 = this._contrib2D(x2, y2, i + 1, j + 1);
    
    // Sum contributions and scale to [-1, 1]
    return 70 * (n0 + n1 + n2);
  }
  
  noise3D(x, y, z) {
    // Similar implementation for 3D
    // Skewing factor F3 = 1/3, G3 = 1/6
    // 4 corners instead of 3
    // ...
  }
  
  fbm2D(x, y, octaves, persistence, lacunarity, scale) {
    let total = 0;
    let amplitude = 1;
    let frequency = scale;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    
    return total / maxValue;
  }
  
  fbm3D(x, y, z, octaves, persistence, lacunarity, scale) {
    // Similar for 3D
  }
}
```

**Acceptance criteria:**
- Simplex noise genera valores en rango [-1, 1]
- Sin artefactos direccionales visibles
- Performance: <0.5ms por chunk 16x16x384
- Reproducible con misma seed
- Tests unitarios para casos edge

---

### 4.2 Domain Warping

**Spec:** SPEC-092 — Domain Warping System

Aplicar **domain warping** para romper regularidad del ruido:

```javascript
class DomainWarper {
  constructor(seed) {
    this.warpNoiseX = new SimplexNoise(seed + 5000);
    this.warpNoiseY = new SimplexNoise(seed + 5001);
    this.warpNoiseZ = new SimplexNoise(seed + 5002);
  }
  
  warp2D(x, z, strength = 50) {
    const offsetX = this.warpNoiseX.fbm2D(x, z, 3, 0.5, 2.0, 0.003) * strength;
    const offsetZ = this.warpNoiseY.fbm2D(x, z, 3, 0.5, 2.0, 0.003) * strength;
    return { x: x + offsetX, z: z + offsetZ };
  }
  
  warp3D(x, y, z, strength = 30) {
    const offsetX = this.warpNoiseX.fbm3D(x, y, z, 2, 0.5, 2.0, 0.01) * strength;
    const offsetY = this.warpNoiseY.fbm3D(x, y, z, 2, 0.5, 2.0, 0.01) * strength;
    const offsetZ = this.warpNoiseZ.fbm3D(x, y, z, 2, 0.5, 2.0, 0.01) * strength;
    return { x: x + offsetX, y: y + offsetY, z: z + offsetZ };
  }
}
```

**Uso:**
```javascript
// En WorldGenPipeline.getContinentalness()
const warped = this.warper.warp2D(x, z, 50);
return this.continentalnessNoise.fbm2D(warped.x, warped.z, 4, 0.5, 2.0, 0.0005);
```

**Acceptance criteria:**
- Patrones de ruido no muestran grid artifacts
- Coastlines irregulares y naturales
- Montañas con formas orgánicas
- Performance: <0.2ms overhead por chunk

---

### 4.3 Multi-Dimensional Noise Parameters

**Spec:** SPEC-093 — Calibrated Noise Parameters

Reemplazar parámetros fijos con configuración por tipo de terreno:

```javascript
const NOISE_CONFIGS = {
  continentalness: {
    octaves: 6,
    persistence: 0.5,
    lacunarity: 2.0,
    scale: 0.0003,
    warpStrength: 80,
  },
  erosion: {
    octaves: 5,
    persistence: 0.55,
    lacunarity: 2.2,
    scale: 0.0008,
    warpStrength: 40,
  },
  peaksValleys: {
    octaves: 4,
    persistence: 0.6,
    lacunarity: 2.5,
    scale: 0.0012,
    warpStrength: 30,
  },
  weirdness: {
    octaves: 3,
    persistence: 0.5,
    lacunarity: 2.0,
    scale: 0.0015,
    warpStrength: 20,
  },
  temperature: {
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2.0,
    scale: 0.0005,
    warpStrength: 60,
  },
  humidity: {
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2.0,
    scale: 0.0005,
    warpStrength: 60,
  },
  density3D: {
    octaves: 5,
    persistence: 0.5,
    lacunarity: 2.0,
    scale: 0.008,
    warpStrength: 15,
  },
};
```

**Acceptance criteria:**
- Cada noise layer usa configuración calibrada
- Continentalness genera masas de tierra coherentes (>500 bloques)
- Erosion crea variedad entre llanuras y montañas
- PeaksValleys genera cordilleras y valles profundos
- Weirdness añade variación sin romper coherencia

---

### 4.4 Advanced Spline System

**Spec:** SPEC-094 — Multi-Spline Terrain Shaping

Expandir sistema de splines para modelar terreno complejo:

```javascript
class TerrainSplines {
  constructor() {
    // Continentalness → Base height
    this.continentalnessSpline = new Spline([
      { x: -1.0, y: -80 },   // Deep ocean floor
      { x: -0.5, y: -40 },   // Ocean floor
      { x: -0.2, y: -10 },   // Shallow ocean
      { x: 0.0, y: 0 },      // Sea level
      { x: 0.2, y: 15 },     // Coast
      { x: 0.4, y: 35 },     // Inland
      { x: 0.6, y: 60 },     // Hills
      { x: 0.8, y: 100 },    // Mountains base
      { x: 1.0, y: 180 },    // High peaks
    ]);
    
    // Erosion → Terrain smoothness
    this.erosionSpline = new Spline([
      { x: -1.0, y: 1.0 },   // Jagged (full amplitude)
      { x: -0.5, y: 0.8 },
      { x: 0.0, y: 0.5 },
      { x: 0.5, y: 0.2 },
      { x: 1.0, y: 0.0 },    // Flat (no amplitude)
    ]);
    
    // PV → Peak/Valley offset
    this.pvSpline = new Spline([
      { x: -1.0, y: -60 },   // Deep valley
      { x: -0.5, y: -30 },
      { x: 0.0, y: 0 },      // Neutral
      { x: 0.5, y: 40 },
      { x: 1.0, y: 80 },     // High peak
    ]);
    
    // Weirdness → Terrain variation
    this.weirdnessSpline = new Spline([
      { x: -1.0, y: -20 },
      { x: 0.0, y: 0 },
      { x: 1.0, y: 20 },
    ]);
  }
  
  getHeight(cont, erosion, pv, weirdness) {
    const baseHeight = this.continentalnessSpline.evaluate(cont);
    const erosionFactor = this.erosionSpline.evaluate(erosion);
    const pvOffset = this.pvSpline.evaluate(pv);
    const weirdnessOffset = this.weirdnessSpline.evaluate(weirdness);
    
    // Combine splines
    let height = baseHeight;
    
    // Apply PV only on land
    if (cont > 0.0) {
      height += pvOffset * erosionFactor;
    }
    
    // Apply weirdness for variation
    height += weirdnessOffset * (1 - Math.abs(erosion));
    
    return height + SEA_LEVEL;
  }
}
```

**Acceptance criteria:**
- Océanos profundos consistentes (<-40 bloques)
- Costas suaves y naturales
- Montañas forman cordilleras (no picos aislados)
- Valles profundos entre montañas
- Llanuras extensas y planas

---

## 5. Biome System Overhaul

### 5.1 Biome Blending

**Spec:** SPEC-095 — Smooth Biome Transitions

Implementar blending suave en fronteras de biomas:

```javascript
class BiomeBlender {
  constructor(worldGen) {
    this.worldGen = worldGen;
    this.blendRadius = 8; // bloques
  }
  
  getBlendedBiome(x, z) {
    const centerBiome = this.worldGen.getBiome(x, z);
    
    // Sample biomes en grid 3x3
    const samples = [];
    const step = this.blendRadius;
    for (let dx = -step; dx <= step; dx += step) {
      for (let dz = -step; dz <= step; dz += step) {
        const biome = this.worldGen.getBiome(x + dx, z + dz);
        const dist = Math.sqrt(dx * dx + dz * dz);
        const weight = Math.max(0, 1 - dist / (step * 1.5));
        samples.push({ biome, weight });
      }
    }
    
    // Si todos los samples son el mismo bioma, retornar directo
    const uniqueBiomes = new Set(samples.map(s => s.biome));
    if (uniqueBiomes.size === 1) return centerBiome;
    
    // Calcular blend weights
    const biomeWeights = new Map();
    for (const { biome, weight } of samples) {
      biomeWeights.set(biome, (biomeWeights.get(biome) || 0) + weight);
    }
    
    // Normalizar
    const totalWeight = Array.from(biomeWeights.values()).reduce((a, b) => a + b, 0);
    for (const [biome, weight] of biomeWeights) {
      biomeWeights.set(biome, weight / totalWeight);
    }
    
    return { primary: centerBiome, blend: biomeWeights };
  }
  
  getBlendedColor(x, z) {
    const blended = this.getBlendedBiome(x, z);
    if (!blended.blend) return BIOME_COLORS[blended];
    
    let r = 0, g = 0, b = 0;
    for (const [biome, weight] of blended.blend) {
      const color = BIOME_COLORS[biome];
      r += color[0] * weight;
      g += color[1] * weight;
      b += color[2] * weight;
    }
    
    return [r, g, b];
  }
  
  getBlendedSurfaceBlock(x, y, z) {
    const blended = this.getBlendedBiome(x, z);
    if (!blended.blend) {
      return this.worldGen.getSurfaceBlock(blended, y);
    }
    
    // Usar noise para seleccionar bloque según blend weights
    const hash = this._hash(x, z);
    let cumulative = 0;
    for (const [biome, weight] of blended.blend) {
      cumulative += weight;
      if (hash < cumulative) {
        return this.worldGen.getSurfaceBlock(biome, y);
      }
    }
    
    return this.worldGen.getSurfaceBlock(blended.primary, y);
  }
  
  _hash(x, z) {
    return ((x * 374761393 + z * 668265263) & 0x7FFFFFFF) / 0x7FFFFFFF;
  }
}
```

**Acceptance criteria:**
- Transiciones suaves entre biomas (8-16 bloques)
- Sin fronteras nítidas visibles
- Colores se mezclan gradualmente
- Bloques de superficie se mezclan (ej: arena → pasto)
- Performance: <1ms overhead por chunk

---

### 5.2 Biome-Specific Noise Modulation

**Spec:** SPEC-096 — Biome Terrain Modulation

Cada bioma modula el terreno base con ruido específico:

```javascript
const BIOME_TERRAIN_MODULATION = {
  [BIOMES.PLAINS]: {
    amplitudeScale: 0.3,  // Muy plano
    frequencyScale: 1.0,
    octaves: 2,
  },
  [BIOMES.MOUNTAINS]: {
    amplitudeScale: 2.5,  // Muy montañoso
    frequencyScale: 0.8,
    octaves: 6,
  },
  [BIOMES.DESERT]: {
    amplitudeScale: 0.8,  // Dunas suaves
    frequencyScale: 1.2,
    octaves: 3,
  },
  [BIOMES.JUNGLE]: {
    amplitudeScale: 1.2,  // Colinas medianas
    frequencyScale: 1.5,
    octaves: 4,
  },
  [BIOMES.OCEAN]: {
    amplitudeScale: 0.5,  // Fondo marino suave
    frequencyScale: 0.6,
    octaves: 3,
  },
  [BIOMES.SWAMP]: {
    amplitudeScale: 0.4,  // Muy plano con charcos
    frequencyScale: 2.0,
    octaves: 2,
  },
  // ... resto de biomas
};

class BiomeTerrainModulator {
  constructor(seed) {
    this.modulationNoise = new SimplexNoise(seed + 6000);
  }
  
  modulate(baseHeight, x, z, biome) {
    const config = BIOME_TERRAIN_MODULATION[biome];
    if (!config) return baseHeight;
    
    const modulation = this.modulationNoise.fbm2D(
      x,
      z,
      config.octaves,
      0.5,
      2.0,
      0.01 * config.frequencyScale
    );
    
    return baseHeight + modulation * 10 * config.amplitudeScale;
  }
}
```

**Acceptance criteria:**
- Plains son extensas y planas
- Mountains tienen picos pronunciados
- Desert tiene dunas onduladas
- Jungle tiene colinas irregulares
- Ocean floor es suave
- Swamp es plano con micro-elevaciones

---

### 5.3 Feature Placement Coherence

**Spec:** SPEC-097 — Coherent Feature Distribution

Mejorar distribución de árboles, rocas y vegetación:

```javascript
class FeaturePlacer {
  constructor(seed) {
    this.featureNoise = new SimplexNoise(seed + 7000);
    this.densityNoise = new SimplexNoise(seed + 7001);
    this.clusterNoise = new SimplexNoise(seed + 7002);
  }
  
  shouldPlaceTree(x, z, biome) {
    const config = BIOME_TREE_CONFIG[biome];
    if (!config) return false;
    
    // Cluster noise: árboles en grupos
    const cluster = this.clusterNoise.noise2D(x * 0.02, z * 0.02);
    if (cluster < -0.3) return false; // Área sin árboles
    
    // Density noise: varía densidad localmente
    const density = this.densityNoise.noise2D(x * 0.05, z * 0.05);
    const adjustedDensity = config.density * (0.5 + density * 0.5);
    
    // Feature noise: posición específica
    const feature = this.featureNoise.noise2D(x * 0.1, z * 0.1);
    
    return feature > (1 - adjustedDensity);
  }
  
  getTreeType(x, z, biome) {
    const config = BIOME_TREE_CONFIG[biome];
    if (!config.types) return config.defaultType;
    
    // Usar noise para seleccionar tipo
    const typeNoise = this.featureNoise.noise2D(x * 0.03, z * 0.03);
    const normalized = (typeNoise + 1) / 2; // [0, 1]
    
    let cumulative = 0;
    for (const { type, weight } of config.types) {
      cumulative += weight;
      if (normalized < cumulative) return type;
    }
    
    return config.defaultType;
  }
  
  getTreeVariation(x, z) {
    // Variación de tamaño, rotación, etc.
    const sizeNoise = this.featureNoise.noise2D(x * 0.07, z * 0.07);
    const rotationNoise = this.featureNoise.noise2D(x * 0.13, z * 0.13);
    
    return {
      sizeScale: 0.8 + sizeNoise * 0.4,  // [0.4, 1.2]
      rotation: rotationNoise * Math.PI * 2,
      asymmetry: Math.abs(this.featureNoise.noise2D(x * 0.11, z * 0.11)),
    };
  }
}

const BIOME_TREE_CONFIG = {
  [BIOMES.FOREST]: {
    density: 0.12,
    types: [
      { type: 'oak', weight: 0.7 },
      { type: 'birch', weight: 0.2 },
      { type: 'giant_oak', weight: 0.1 },
    ],
  },
  [BIOMES.JUNGLE]: {
    density: 0.18,
    types: [
      { type: 'jungle', weight: 0.8 },
      { type: 'giant_jungle', weight: 0.2 },
    ],
  },
  [BIOMES.TAIGA]: {
    density: 0.10,
    defaultType: 'spruce',
  },
  [BIOMES.PLAINS]: {
    density: 0.02,
    defaultType: 'oak',
  },
  // ... resto de biomas
};
```

**Acceptance criteria:**
- Árboles aparecen en clusters naturales
- Densidad varía localmente (clearings y bosques densos)
- Tipo de árbol coherente con bioma
- Variación de tamaño/rotación rompe uniformidad
- Sin árboles flotantes o en agua

---

## 6. Erosion Simulation

**Spec:** SPEC-098 — Hydraulic Erosion Simulation

Aplicar erosión hidráulica post-generación para terreno más natural:

```javascript
class HydraulicErosion {
  constructor(seed) {
    this.rainNoise = new SimplexNoise(seed + 8000);
  }
  
  erode(heightmap, iterations = 3) {
    const width = heightmap.length;
    const height = heightmap[0].length;
    
    for (let iter = 0; iter < iterations; iter++) {
      for (let x = 1; x < width - 1; x++) {
        for (let z = 1; z < height - 1; z++) {
          // Simular gota de lluvia
          const rainfall = this.rainNoise.noise2D(x * 0.1, z * 0.1);
          if (rainfall < 0.3) continue; // No lluvia aquí
          
          const current = heightmap[x][z];
          
          // Encontrar vecino más bajo
          let lowestNeighbor = { x, z, height: current };
          for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
              if (dx === 0 && dz === 0) continue;
              const nx = x + dx;
              const nz = z + dz;
              const nh = heightmap[nx][nz];
              if (nh < lowestNeighbor.height) {
                lowestNeighbor = { x: nx, z: nz, height: nh };
              }
            }
          }
          
          // Si hay pendiente, erosionar
          if (lowestNeighbor.height < current) {
            const diff = current - lowestNeighbor.height;
            const erosionAmount = Math.min(diff * 0.1, 0.5);
            
            heightmap[x][z] -= erosionAmount;
            heightmap[lowestNeighbor.x][lowestNeighbor.z] += erosionAmount * 0.5;
          }
        }
      }
    }
    
    return heightmap;
  }
}
```

**Acceptance criteria:**
- Montañas tienen valles erosionados
- Ríos tallan cañones suaves
- Costas tienen erosión visible
- Performance: <50ms por chunk (ejecutar async)
- Opcional: toggle on/off según performance

---

## 7. Implementation Plan

### 7.1 Fases de implementación

| Fase | Specs | Duración | Prioridad |
|------|-------|----------|-----------|
| **Fase 1: Core Noise** | SPEC-091, SPEC-092 | 2 días | CRÍTICA |
| **Fase 2: Terrain Shaping** | SPEC-093, SPEC-094 | 2 días | CRÍTICA |
| **Fase 3: Biome System** | SPEC-095, SPEC-096 | 3 días | ALTA |
| **Fase 4: Features** | SPEC-097 | 2 días | ALTA |
| **Fase 5: Erosion** | SPEC-098 | 1 día | MEDIA |
| **Fase 6: Testing & Tuning** | — | 2 días | ALTA |

**Total:** 12 días de desarrollo

### 7.2 Orden de ejecución

1. **SPEC-091** — Implementar SimplexNoise2D y SimplexNoise3D
2. **SPEC-092** — Implementar DomainWarper
3. **SPEC-093** — Calibrar parámetros de ruido
4. **SPEC-094** — Expandir sistema de splines
5. **SPEC-095** — Implementar BiomeBlender
6. **SPEC-096** — Implementar BiomeTerrainModulator
7. **SPEC-097** — Implementar FeaturePlacer coherente
8. **SPEC-098** — Implementar HydraulicErosion (opcional)

### 7.3 Testing strategy

**Unit tests:**
- SimplexNoise genera valores [-1, 1]
- Domain warping no genera NaN
- Splines interpolan correctamente
- Biome blending suma weights = 1.0

**Visual tests:**
- Generar 10 mundos con seeds diferentes
- Verificar coherencia de biomas
- Medir transiciones suaves
- Validar feature placement

**Performance tests:**
- Chunk generation time <50ms
- Memory usage <300MB para 100 chunks
- No frame drops durante generación

---

## 8. Success Metrics

| Métrica | Target | Medición |
|---------|--------|----------|
| Biome coherence | >90% | Visual inspection de 100 chunks |
| Transition smoothness | 8-16 bloques | Gradient analysis |
| Feature clustering | >70% en grupos | Spatial analysis |
| Chunk gen time | <50ms | Performance.now() |
| Memory usage | <300MB | performance.memory |
| Visual quality | 8/10 | User feedback |

---

## 9. Risks & Mitigations

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Performance degradation | MEDIA | ALTO | Profiling + optimización, cache agresivo |
| Simplex artifacts | BAJA | MEDIO | Extensive testing, fallback a Perlin |
| Biome blending bugs | MEDIA | MEDIO | Unit tests, visual validation |
| Feature placement overlap | MEDIA | BAJO | Collision detection |
| Erosion too slow | ALTA | BAJO | Make optional, async execution |

---

## 10. Future Enhancements (v6.1+)

- **Tectonic plates simulation** para continentes realistas
- **Climate zones** con temperatura/humedad global
- **Seasonal variation** en biomas
- **Volcanic activity** con lava flows
- **Glaciers** en biomas fríos con ice sheets
- **Underground biomes** (crystal caves, mushroom caverns)

---

## 11. References

**Minecraft Wiki:**
- Noise generator: https://minecraft.fandom.com/wiki/Noise_generator (acceso bloqueado, usar conocimiento previo)
- Custom world generation: https://minecraft.fandom.com/wiki/Custom_world_generation
- Biome: https://minecraft.fandom.com/wiki/Biome

**Academic Papers:**
- Simplex Noise Demystified (Stefan Gustavson, 2005)
- Perlin Noise vs Simplex Noise (Ken Perlin, 2001)
- Procedural Terrain Generation (Olsen, 2004)

**Existing Code:**
- `jardvoxel-survival-engine.js` — Current Perlin implementation
- `WORLD-GENERATION.md` — Current system documentation

---

## 12. Acceptance Criteria (Global)

✅ **Simplex Noise implementado** con tests unitarios  
✅ **Domain warping funcional** sin artefactos  
✅ **Biome blending suave** en fronteras  
✅ **Feature placement coherente** con clusters  
✅ **Terrain shaping avanzado** con splines multi-dimensionales  
✅ **Performance mantenido** <50ms por chunk  
✅ **Visual quality** 8/10 según feedback  
✅ **Documentación actualizada** en WORLD-GENERATION.md  
✅ **Tests E2E** generando 10 mundos diferentes  

---

## 13. Comandos

```bash
# Desarrollo con jard-code
@jard-code jardvoxel SPEC-091
@jard-code jardvoxel SPEC-092
# ... etc

# Testing
npm test -- --grep "SimplexNoise"
npm test -- --grep "DomainWarping"
npm test -- --grep "BiomeBlending"

# Visual testing
npm run dev
# Abrir jardvoxel-survival.html
# Generar 10 mundos con seeds: 1, 42, 123, 999, 12345, 67890, 111111, 222222, 333333, 444444
```

---

**Fin del PRD v6.0**

Este PRD establece las bases para transformar JardVoxel en un motor de generación procedural de clase mundial, con biomas coherentes, hermosos y vivos que transporten al jugador a otro universo.
