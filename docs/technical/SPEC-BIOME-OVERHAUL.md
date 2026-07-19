# SPEC-BIOME-OVERHAUL: Biomas Coherentes y Realistas

**Versión:** 1.0  
**Fecha:** 28 Junio 2026  
**Prioridad:** Alta  
**Estimación:** 8 horas

## Problema Actual

Los mundos generados carecen de coherencia visual:
- ❌ Bloques monocromáticos (todo gris/marrón)
- ❌ Biomas sin identidad visual clara
- ❌ Cielo plano sin atmósfera
- ❌ Falta de variación de bloques por bioma
- ❌ Transiciones abruptas entre biomas
- ❌ Iluminación uniforme sin variación por bioma

## Objetivos

1. **Paleta de colores vibrante** — Colores saturados y diferenciados por bioma
2. **Identidad visual por bioma** — Cada bioma debe ser reconocible instantáneamente
3. **Cielo atmosférico** — Gradientes dinámicos, nubes volumétricas, niebla por bioma
4. **Bloques específicos por bioma** — Cada bioma usa bloques únicos
5. **Transiciones suaves** — Blend gradual entre biomas (8-16 bloques)
6. **Iluminación contextual** — Tinte de luz según bioma (cálido/frío)

## Diseño de Biomas

### 1. Ocean (Océano)
**Identidad:** Azul profundo, misterioso, submarino

**Bloques:**
- Superficie: WATER (azul profundo `[0.10, 0.35, 0.65]`)
- Fondo: SAND (arena clara `[0.95, 0.88, 0.65]`)
- Decoración: PRISMARINE (turquesa `[0.25, 0.70, 0.65]`), CLAY (gris azulado `[0.60, 0.65, 0.70]`)
- Estructuras: Coral reefs (PRISMARINE + CLAY colorido)

**Cielo:** Azul claro `top: [0.40, 0.70, 0.95]`, `bottom: [0.70, 0.85, 0.98]`  
**Niebla:** Azul claro, distancia media (80-120 bloques)  
**Iluminación:** Tinte azul frío (+10% blue channel)

---

### 2. Beach (Playa)
**Identidad:** Arena dorada, transición tierra-mar

**Bloques:**
- Base: SAND (dorado `[0.95, 0.88, 0.65]`)
- Decoración: Conchas (CALCITE `[0.90, 0.88, 0.85]`), GRAVEL (gris `[0.55, 0.52, 0.48]`)

**Cielo:** Azul brillante `top: [0.35, 0.65, 0.95]`, `bottom: [0.85, 0.90, 0.98]`  
**Niebla:** Clara, distancia larga (100-140 bloques)  
**Iluminación:** Neutral, alta intensidad

---

### 3. Plains (Llanuras)
**Identidad:** Verde vibrante, flores coloridas, pastoral

**Bloques:**
- Base: GRASS (verde brillante `[0.40, 0.80, 0.30]`)
- Subsuelo: DIRT (marrón `[0.60, 0.45, 0.28]`)
- Vegetación: TALL_GRASS (verde claro `[0.45, 0.75, 0.35]`), FLOWER_RED (rojo `[0.90, 0.30, 0.25]`), FLOWER_YELLOW (amarillo `[0.95, 0.85, 0.25]`)
- Árboles: OAK (tronco marrón, hojas verde oscuro)

**Cielo:** Verde-azul `top: [0.45, 0.75, 0.90]`, `bottom: [0.75, 0.88, 0.95]`  
**Niebla:** Verde suave, distancia larga (120-160 bloques)  
**Iluminación:** Cálida (+5% red/green)

---

### 4. Forest (Bosque)
**Identidad:** Verde oscuro, denso, sombreado

**Bloques:**
- Base: GRASS (verde oscuro `[0.30, 0.65, 0.25]`)
- Subsuelo: COARSE_DIRT (marrón oscuro `[0.45, 0.35, 0.20]`)
- Árboles: OAK (denso), BIRCH_WOOD (blanco `[0.85, 0.82, 0.68]`)
- Vegetación: FERN (verde oscuro `[0.25, 0.50, 0.20]`), MOSS (musgo `[0.30, 0.55, 0.25]`)
- Decoración: MOSSY_COBBLE (piedra musgosa `[0.40, 0.50, 0.35]`)

**Cielo:** Verde oscuro `top: [0.35, 0.60, 0.75]`, `bottom: [0.60, 0.75, 0.80]`  
**Niebla:** Verde oscuro, distancia corta (60-100 bloques)  
**Iluminación:** Tinte verde (+8% green, -5% red)

---

### 5. Desert (Desierto)
**Identidad:** Amarillo-naranja, árido, caluroso

**Bloques:**
- Base: SAND (amarillo intenso `[0.98, 0.88, 0.55]`)
- Dunas: RED_SAND (naranja `[0.85, 0.50, 0.25]`)
- Estructuras: SANDSTONE (beige `[0.92, 0.82, 0.55]`)
- Vegetación: CACTUS (verde seco `[0.35, 0.60, 0.30]`), DEAD_BUSH (marrón seco `[0.55, 0.40, 0.25]`)

**Cielo:** Amarillo-naranja `top: [0.85, 0.70, 0.50]`, `bottom: [0.98, 0.85, 0.60]`  
**Niebla:** Amarilla (sandstorm), distancia media (80-120 bloques)  
**Iluminación:** Cálida intensa (+15% red/yellow)

---

### 6. Jungle (Jungla)
**Identidad:** Verde exuberante, húmedo, denso

**Bloques:**
- Base: GRASS (verde vibrante `[0.35, 0.85, 0.30]`)
- Subsuelo: DIRT (marrón húmedo `[0.50, 0.38, 0.22]`)
- Árboles: Jungle trees (tronco 2x2 BIRCH_WOOD, hojas densas)
- Vegetación: FERN (abundante), BAMBOO (verde bambú `[0.60, 0.80, 0.30]`), MELON (verde melón `[0.60, 0.85, 0.35]`)
- Decoración: MOSSY_STONE, vines

**Cielo:** Verde húmedo `top: [0.40, 0.70, 0.65]`, `bottom: [0.65, 0.85, 0.75]`  
**Niebla:** Verde húmedo, distancia corta (50-90 bloques)  
**Iluminación:** Tinte verde-azul (+10% green, +5% blue)

---

### 7. Taiga (Taiga)
**Identidad:** Verde-azul frío, coníferas, nieve ligera

**Bloques:**
- Base: GRASS (verde frío `[0.35, 0.70, 0.40]`)
- Subsuelo: COARSE_DIRT
- Árboles: SPRUCE (tronco oscuro `[0.28, 0.20, 0.14]`, hojas verde oscuro)
- Nieve: SNOW (blanco `[0.95, 0.95, 0.98]`) en capas
- Decoración: FERN, POWDER_SNOW

**Cielo:** Azul frío `top: [0.30, 0.55, 0.75]`, `bottom: [0.70, 0.80, 0.90]`  
**Niebla:** Azul frío, distancia media (70-110 bloques)  
**Iluminación:** Fría (+10% blue, -5% red)

---

### 8. Snowy Peaks (Picos Nevados)
**Identidad:** Blanco brillante, montañas, frío extremo

**Bloques:**
- Base: SNOW_BLOCK (blanco puro `[0.98, 0.98, 1.0]`)
- Roca: STONE (gris claro `[0.60, 0.60, 0.65]`), CALCITE (blanco `[0.92, 0.92, 0.90]`)
- Hielo: ICE (azul hielo `[0.70, 0.88, 0.98]`), PACKED_ICE (azul oscuro `[0.60, 0.82, 0.95]`)

**Cielo:** Blanco-azul `top: [0.85, 0.90, 0.98]`, `bottom: [0.95, 0.97, 1.0]`  
**Niebla:** Blanca (blizzard), distancia corta (40-80 bloques)  
**Iluminación:** Muy fría (+15% blue, -10% red)

---

### 9. Savanna (Sabana)
**Identidad:** Amarillo-verde seco, árboles acacia, cálido

**Bloques:**
- Base: GRASS (amarillo-verde `[0.70, 0.75, 0.35]`)
- Subsuelo: COARSE_DIRT (rojo-marrón `[0.65, 0.40, 0.25]`)
- Árboles: Acacia (tronco gris, copa plana)
- Vegetación: TALL_GRASS (seco), DEAD_BUSH

**Cielo:** Amarillo cálido `top: [0.75, 0.70, 0.50]`, `bottom: [0.90, 0.85, 0.65]`  
**Niebla:** Amarilla, distancia larga (100-140 bloques)  
**Iluminación:** Cálida (+10% red/yellow)

---

### 10. Swamp (Pantano)
**Identidad:** Verde oscuro-marrón, húmedo, misterioso

**Bloques:**
- Base: GRASS (verde oscuro `[0.25, 0.55, 0.25]`)
- Agua: WATER (verde turbio `[0.20, 0.45, 0.35]`)
- Árboles: OAK (con vines), MANGROVE (raíces visibles)
- Vegetación: FERN, MOSS, MYCELIUM (gris-púrpura `[0.60, 0.55, 0.62]`)

**Cielo:** Verde-gris `top: [0.35, 0.50, 0.45]`, `bottom: [0.55, 0.65, 0.60]`  
**Niebla:** Verde oscuro, distancia muy corta (40-70 bloques)  
**Iluminación:** Tinte verde oscuro (+5% green, -10% brightness)

---

### 11. Badlands (Tierras Baldías)
**Identidad:** Rojo-naranja, terracota, cañones

**Bloques:**
- Base: RED_SAND (rojo `[0.85, 0.45, 0.22]`)
- Capas: TERRACOTTA (naranja `[0.75, 0.50, 0.35]`), RED_SAND, CLAY (bandas de color)
- Roca: STONE (gris rojizo `[0.60, 0.50, 0.45]`)
- Vegetación: CACTUS, DEAD_BUSH (escaso)

**Cielo:** Rojo-naranja `top: [0.80, 0.50, 0.35]`, `bottom: [0.95, 0.70, 0.50]`  
**Niebla:** Roja, distancia media (70-110 bloques)  
**Iluminación:** Cálida intensa (+20% red, +10% yellow)

---

### 12. Mountain (Montaña)
**Identidad:** Gris piedra, picos rocosos, imponente

**Bloques:**
- Base: STONE (gris `[0.55, 0.55, 0.58]`)
- Variantes: GRANITE (rojo-gris `[0.68, 0.45, 0.40]`), ANDESITE (gris oscuro `[0.58, 0.58, 0.62]`), DIORITE (blanco-gris `[0.82, 0.80, 0.78]`)
- Nieve: SNOW (en picos altos)
- Vegetación: Escasa (MOSS en grietas)

**Cielo:** Gris-azul `top: [0.50, 0.60, 0.75]`, `bottom: [0.70, 0.75, 0.85]`  
**Niebla:** Gris, distancia media (80-120 bloques)  
**Iluminación:** Neutral, alta intensidad

---

## Implementación Técnica

### 1. Actualizar BLOCK_COLORS

```javascript
// Colores vibrantes y saturados
export const BLOCK_COLORS = {
  // Ocean
  [BLOCKS.WATER]: [0.10, 0.35, 0.65],  // Azul profundo
  [BLOCKS.PRISMARINE]: [0.25, 0.70, 0.65],  // Turquesa
  
  // Beach
  [BLOCKS.SAND]: [0.95, 0.88, 0.65],  // Dorado
  
  // Plains
  [BLOCKS.GRASS]: [0.40, 0.80, 0.30],  // Verde brillante
  [BLOCKS.DIRT]: [0.60, 0.45, 0.28],  // Marrón
  [BLOCKS.TALL_GRASS]: [0.45, 0.75, 0.35],  // Verde claro
  [BLOCKS.FLOWER_RED]: [0.90, 0.30, 0.25],  // Rojo vibrante
  [BLOCKS.FLOWER_YELLOW]: [0.95, 0.85, 0.25],  // Amarillo brillante
  
  // Forest
  [BLOCKS.LEAVES]: [0.20, 0.55, 0.20],  // Verde oscuro
  [BLOCKS.MOSS]: [0.30, 0.55, 0.25],  // Musgo
  [BLOCKS.FERN]: [0.25, 0.50, 0.20],  // Verde oscuro
  [BLOCKS.MOSSY_COBBLE]: [0.40, 0.50, 0.35],  // Piedra musgosa
  
  // Desert
  [BLOCKS.RED_SAND]: [0.85, 0.50, 0.25],  // Naranja
  [BLOCKS.SANDSTONE]: [0.92, 0.82, 0.55],  // Beige
  [BLOCKS.CACTUS]: [0.35, 0.60, 0.30],  // Verde seco
  [BLOCKS.DEAD_BUSH]: [0.55, 0.40, 0.25],  // Marrón seco
  
  // Jungle
  [BLOCKS.BAMBOO]: [0.60, 0.80, 0.30],  // Verde bambú
  [BLOCKS.MELON]: [0.60, 0.85, 0.35],  // Verde melón
  
  // Taiga/Snow
  [BLOCKS.SPRUCE_WOOD]: [0.28, 0.20, 0.14],  // Marrón oscuro
  [BLOCKS.SNOW]: [0.95, 0.95, 0.98],  // Blanco
  [BLOCKS.SNOW_BLOCK]: [0.98, 0.98, 1.0],  // Blanco puro
  [BLOCKS.ICE]: [0.70, 0.88, 0.98],  // Azul hielo
  [BLOCKS.PACKED_ICE]: [0.60, 0.82, 0.95],  // Azul oscuro
  
  // Badlands
  [BLOCKS.TERRACOTTA]: [0.75, 0.50, 0.35],  // Naranja terracota
  
  // Mountain
  [BLOCKS.STONE]: [0.55, 0.55, 0.58],  // Gris
  [BLOCKS.GRANITE]: [0.68, 0.45, 0.40],  // Rojo-gris
  [BLOCKS.ANDESITE]: [0.58, 0.58, 0.62],  // Gris oscuro
  [BLOCKS.DIORITE]: [0.82, 0.80, 0.78],  // Blanco-gris
  
  // Swamp
  [BLOCKS.MYCELIUM]: [0.60, 0.55, 0.62],  // Gris-púrpura
};
```

### 2. Sistema de Cielo por Bioma

```javascript
// En WorldGenerator
getBiomeSkyColors(biome) {
  const skyConfigs = {
    ocean: {
      dayTop: new THREE.Color(0x6680F0),
      dayBottom: new THREE.Color(0xB0D8F8),
      sunsetTop: new THREE.Color(0x4A5080),
      sunsetBottom: new THREE.Color(0xFF9A6D),
      nightTop: new THREE.Color(0x050510),
      nightBottom: new THREE.Color(0x0A1A30),
    },
    desert: {
      dayTop: new THREE.Color(0xD9B380),
      dayBottom: new THREE.Color(0xFAD999),
      sunsetTop: new THREE.Color(0xD98050),
      sunsetBottom: new THREE.Color(0xFFB070),
      nightTop: new THREE.Color(0x1A0A05),
      nightBottom: new THREE.Color(0x3A2010),
    },
    forest: {
      dayTop: new THREE.Color(0x5AC0E0),
      dayBottom: new THREE.Color(0xC0E0F0),
      sunsetTop: new THREE.Color(0x4A6080),
      sunsetBottom: new THREE.Color(0xFF8A5D),
      nightTop: new THREE.Color(0x050510),
      nightBottom: new THREE.Color(0x0A1520),
    },
    snow: {
      dayTop: new THREE.Color(0xD8E8FA),
      dayBottom: new THREE.Color(0xF0F8FF),
      sunsetTop: new THREE.Color(0xA0B0C0),
      sunsetBottom: new THREE.Color(0xFFB8A0),
      nightTop: new THREE.Color(0x0A0F15),
      nightBottom: new THREE.Color(0x1A2530),
    },
    jungle: {
      dayTop: new THREE.Color(0x66B2A8),
      dayBottom: new THREE.Color(0xA8D8C0),
      sunsetTop: new THREE.Color(0x4A7070),
      sunsetBottom: new THREE.Color(0xFF9A7D),
      nightTop: new THREE.Color(0x050A08),
      nightBottom: new THREE.Color(0x0F1A15),
    },
    badlands: {
      dayTop: new THREE.Color(0xCC8058),
      dayBottom: new THREE.Color(0xF2B280),
      sunsetTop: new THREE.Color(0xA05030),
      sunsetBottom: new THREE.Color(0xFF9050),
      nightTop: new THREE.Color(0x150805),
      nightBottom: new THREE.Color(0x2A1510),
    },
    // Default (plains)
    default: {
      dayTop: new THREE.Color(0x72C0E8),
      dayBottom: new THREE.Color(0xC0E0F8),
      sunsetTop: new THREE.Color(0x4A5080),
      sunsetBottom: new THREE.Color(0xFF9A6D),
      nightTop: new THREE.Color(0x050510),
      nightBottom: new THREE.Color(0x0A1520),
    },
  };
  
  return skyConfigs[biome] || skyConfigs.default;
}
```

### 3. Sistema de Niebla por Bioma

```javascript
getBiomeFogConfig(biome, dayFactor) {
  const fogConfigs = {
    ocean: { color: new THREE.Color(0x6690C0), near: 40, far: 100 },
    beach: { color: new THREE.Color(0xC0D8F0), near: 50, far: 140 },
    plains: { color: new THREE.Color(0xA0D0E0), near: 60, far: 160 },
    forest: { color: new THREE.Color(0x80A890), near: 30, far: 80 },
    desert: { color: new THREE.Color(0xF0D090), near: 40, far: 100 },
    jungle: { color: new THREE.Color(0x90C0A8), near: 25, far: 70 },
    taiga: { color: new THREE.Color(0x90A8C0), near: 35, far: 90 },
    snow: { color: new THREE.Color(0xE0E8F0), near: 20, far: 60 },
    savanna: { color: new THREE.Color(0xE0D090), near: 50, far: 130 },
    swamp: { color: new THREE.Color(0x708070), near: 20, far: 50 },
    badlands: { color: new THREE.Color(0xD09060), near: 35, far: 90 },
    mountain: { color: new THREE.Color(0xA0B0C0), near: 40, far: 100 },
  };
  
  const config = fogConfigs[biome] || fogConfigs.plains;
  // Ajustar por hora del día
  config.near *= (0.5 + dayFactor * 0.5);
  config.far *= (0.5 + dayFactor * 0.5);
  
  return config;
}
```

### 4. Iluminación Contextual por Bioma

```javascript
getBiomeLightTint(biome) {
  const tints = {
    ocean: { r: 0.9, g: 0.95, b: 1.1 },  // Azul frío
    desert: { r: 1.15, g: 1.1, b: 0.9 },  // Cálido amarillo
    forest: { r: 0.95, g: 1.08, b: 0.95 },  // Verde suave
    jungle: { r: 0.95, g: 1.1, b: 1.05 },  // Verde-azul
    taiga: { r: 0.95, g: 0.98, b: 1.1 },  // Azul frío
    snow: { r: 0.9, g: 0.95, b: 1.15 },  // Muy frío
    badlands: { r: 1.2, g: 1.1, b: 0.9 },  // Rojo cálido
    swamp: { r: 0.95, g: 1.05, b: 0.95 },  // Verde oscuro
    default: { r: 1.0, g: 1.0, b: 1.0 },  // Neutral
  };
  
  return tints[biome] || tints.default;
}
```

### 5. Bloques Específicos por Bioma

```javascript
// En VoxelChunk.generate()
getSurfaceBlock(biome, height) {
  switch(biome) {
    case 'ocean': return height < WATER_LEVEL ? BLOCKS.SAND : BLOCKS.WATER;
    case 'beach': return BLOCKS.SAND;
    case 'plains': return BLOCKS.GRASS;
    case 'forest': return BLOCKS.GRASS;
    case 'desert': return Math.random() < 0.3 ? BLOCKS.RED_SAND : BLOCKS.SAND;
    case 'jungle': return BLOCKS.GRASS;
    case 'taiga': return Math.random() < 0.4 ? BLOCKS.SNOW : BLOCKS.GRASS;
    case 'snow': return BLOCKS.SNOW_BLOCK;
    case 'savanna': return BLOCKS.GRASS;
    case 'swamp': return BLOCKS.GRASS;
    case 'badlands': return Math.random() < 0.5 ? BLOCKS.TERRACOTTA : BLOCKS.RED_SAND;
    case 'mountain': return height > 45 ? BLOCKS.SNOW : BLOCKS.STONE;
    default: return BLOCKS.GRASS;
  }
}

getSubsurfaceBlock(biome, depth) {
  switch(biome) {
    case 'desert':
    case 'badlands':
      return depth < 3 ? BLOCKS.SANDSTONE : BLOCKS.STONE;
    case 'forest':
    case 'jungle':
      return depth < 2 ? BLOCKS.DIRT : BLOCKS.STONE;
    case 'mountain':
      // Variantes de piedra
      const r = Math.random();
      if (r < 0.2) return BLOCKS.GRANITE;
      if (r < 0.4) return BLOCKS.ANDESITE;
      if (r < 0.6) return BLOCKS.DIORITE;
      return BLOCKS.STONE;
    default:
      return depth < 3 ? BLOCKS.DIRT : BLOCKS.STONE;
  }
}
```

### 6. Nubes Volumétricas Mejoradas

```javascript
_initClouds() {
  // Generar 3 capas de nubes con diferentes densidades
  const cloudLayers = [
    { height: 55, density: 0.55, speed: 0.5, opacity: 0.6 },
    { height: 58, density: 0.50, speed: 0.7, opacity: 0.4 },
    { height: 61, density: 0.45, speed: 0.9, opacity: 0.3 },
  ];
  
  this.cloudMeshes = [];
  
  for (const layer of cloudLayers) {
    const texture = this._generateCloudTexture(layer.density);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: layer.opacity,
      depthWrite: false,
      fog: false,
      side: THREE.DoubleSide,
    });
    
    const geo = new THREE.PlaneGeometry(1000, 1000);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = layer.height;
    mesh.userData.speed = layer.speed;
    
    this.scene.add(mesh);
    this.cloudMeshes.push(mesh);
  }
}

_generateCloudTexture(threshold) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(size, size);
  
  // Multi-octave noise con threshold ajustable
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let n = 0;
      n += Math.sin(x * 0.015 + y * 0.020) * 0.5;
      n += Math.sin(x * 0.030 + y * 0.025) * 0.25;
      n += Math.sin(x * 0.060 + y * 0.050) * 0.125;
      n += Math.sin(x * 0.120 + y * 0.100) * 0.0625;
      n = (n + 1) / 2;
      
      // Forma de nube con bordes suaves
      const alpha = n > threshold ? Math.min(255, (n - threshold) * 500) : 0;
      const idx = (y * size + x) * 4;
      imgData.data[idx] = 255;
      imgData.data[idx + 1] = 255;
      imgData.data[idx + 2] = 255;
      imgData.data[idx + 3] = alpha;
    }
  }
  
  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  
  return texture;
}
```

## Acceptance Criteria

### Visual
- [ ] Cada bioma tiene colores únicos y reconocibles
- [ ] Transiciones suaves entre biomas (8-16 bloques de blend)
- [ ] Cielo cambia según bioma (color, niebla, iluminación)
- [ ] Nubes volumétricas con 3 capas y movimiento independiente
- [ ] Bloques específicos por bioma (no más cubos grises genéricos)

### Técnico
- [ ] `BLOCK_COLORS` actualizado con paleta vibrante
- [ ] `getBiomeSkyColors()` implementado
- [ ] `getBiomeFogConfig()` implementado
- [ ] `getBiomeLightTint()` implementado
- [ ] `getSurfaceBlock()` y `getSubsurfaceBlock()` por bioma
- [ ] Sistema de nubes mejorado con 3 capas

### Performance
- [ ] FPS mantiene 60fps en desktop, 30fps en mobile
- [ ] Niebla adaptativa según bioma (no afecta performance)
- [ ] Nubes optimizadas (3 planos, no partículas)

### UX
- [ ] Biomas reconocibles a primera vista
- [ ] Transiciones no abruptas
- [ ] Atmósfera inmersiva por bioma
- [ ] Cielo dinámico con ciclo día/noche por bioma

## Testing

1. **Test visual por bioma:**
   - Spawn en cada bioma
   - Verificar colores, cielo, niebla
   - Capturar screenshots

2. **Test de transiciones:**
   - Caminar entre biomas
   - Verificar blend gradual (8-16 bloques)
   - No debe haber líneas duras

3. **Test de performance:**
   - FPS en cada bioma
   - Verificar que niebla no degrada performance
   - Nubes deben ser fluidas

4. **Test de ciclo día/noche:**
   - Verificar que cielo cambia correctamente
   - Iluminación contextual funciona
   - Colores de bioma visibles de día y noche

## Notas de Implementación

- **Prioridad 1:** Actualizar `BLOCK_COLORS` con paleta vibrante
- **Prioridad 2:** Implementar sistema de cielo por bioma
- **Prioridad 3:** Bloques específicos por bioma
- **Prioridad 4:** Niebla y iluminación contextual
- **Prioridad 5:** Nubes volumétricas mejoradas

## Referencias

- Minecraft 1.18+ biome system
- No Man's Sky procedural colors
- Valheim biome atmosphere
- Terraria biome visual identity
