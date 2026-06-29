# SPEC-092: Domain Warping System

**Proyecto:** jard-games/jardvoxel  
**Prioridad:** 🔴 CRÍTICA  
**Estimación:** 6 horas  
**Dependencias:** SPEC-091 (SimplexNoise)  
**Fase:** 1 — Core Noise  

---

## 1. Objetivo

Implementar sistema de **domain warping** para romper la regularidad del ruido Simplex y generar patrones más orgánicos e irregulares en coastlines, montañas y biomas.

---

## 2. Contexto

**Problema:**
- Simplex Noise genera patrones suaves pero predecibles
- Coastlines son demasiado regulares
- Montañas tienen formas geométricas
- Biomas tienen fronteras artificiales

**Solución:**
- Domain warping: aplicar ruido a las coordenadas antes de samplear el ruido principal
- Múltiples capas de warping para diferentes escalas
- Parámetros configurables por tipo de terreno

---

## 3. Requirements

### 3.1 DomainWarper Class

**Archivo:** `core/jardvoxel-survival-noise.js`

```javascript
class DomainWarper {
  constructor(seed) {
    // Noise layers independientes para X, Y, Z
    this.warpNoiseX = new SimplexNoise(seed + 5000);
    this.warpNoiseY = new SimplexNoise(seed + 5001);
    this.warpNoiseZ = new SimplexNoise(seed + 5002);
    
    // Noise secundario para warp recursivo (opcional)
    this.warpNoiseX2 = new SimplexNoise(seed + 5003);
    this.warpNoiseZ2 = new SimplexNoise(seed + 5004);
  }
  
  /**
   * Warp 2D coordinates
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {number} strength - Warp strength (default: 50)
   * @param {number} scale - Warp frequency (default: 0.003)
   * @param {number} octaves - Warp octaves (default: 3)
   * @returns {{x: number, z: number}} Warped coordinates
   */
  warp2D(x, z, strength = 50, scale = 0.003, octaves = 3) {
    const offsetX = this.warpNoiseX.fbm2D(x, z, octaves, 0.5, 2.0, scale) * strength;
    const offsetZ = this.warpNoiseZ.fbm2D(x, z, octaves, 0.5, 2.0, scale) * strength;
    
    return {
      x: x + offsetX,
      z: z + offsetZ
    };
  }
  
  /**
   * Warp 2D with recursive warping (double warp)
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {number} strength1 - First warp strength
   * @param {number} strength2 - Second warp strength
   * @returns {{x: number, z: number}} Double-warped coordinates
   */
  warp2DRecursive(x, z, strength1 = 50, strength2 = 25) {
    // First warp
    const warp1 = this.warp2D(x, z, strength1, 0.003, 3);
    
    // Second warp using different noise
    const offsetX2 = this.warpNoiseX2.fbm2D(warp1.x, warp1.z, 2, 0.5, 2.0, 0.005) * strength2;
    const offsetZ2 = this.warpNoiseZ2.fbm2D(warp1.x, warp1.z, 2, 0.5, 2.0, 0.005) * strength2;
    
    return {
      x: warp1.x + offsetX2,
      z: warp1.z + offsetZ2
    };
  }
  
  /**
   * Warp 3D coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {number} strength - Warp strength (default: 30)
   * @param {number} scale - Warp frequency (default: 0.01)
   * @param {number} octaves - Warp octaves (default: 2)
   * @returns {{x: number, y: number, z: number}} Warped coordinates
   */
  warp3D(x, y, z, strength = 30, scale = 0.01, octaves = 2) {
    const offsetX = this.warpNoiseX.fbm3D(x, y, z, octaves, 0.5, 2.0, scale) * strength;
    const offsetY = this.warpNoiseY.fbm3D(x, y, z, octaves, 0.5, 2.0, scale) * strength;
    const offsetZ = this.warpNoiseZ.fbm3D(x, y, z, octaves, 0.5, 2.0, scale) * strength;
    
    return {
      x: x + offsetX,
      y: y + offsetY,
      z: z + offsetZ
    };
  }
  
  /**
   * Warp with directional bias (útil para ríos, vientos)
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {number} dirX - Direction X (-1 to 1)
   * @param {number} dirZ - Direction Z (-1 to 1)
   * @param {number} strength - Warp strength
   * @returns {{x: number, z: number}} Directionally warped coordinates
   */
  warp2DDirectional(x, z, dirX, dirZ, strength = 50) {
    const warp = this.warp2D(x, z, strength);
    
    // Add directional bias
    const bias = strength * 0.3;
    warp.x += dirX * bias;
    warp.z += dirZ * bias;
    
    return warp;
  }
}

// Export
window.DomainWarper = DomainWarper;
```

### 3.2 Integration in WorldGenPipeline

**Archivo:** `core/jardvoxel-survival-engine.js`

```javascript
class WorldGenPipeline {
  constructor(seed) {
    this.seed = seed;
    this.simplexNoise = new SimplexNoise(seed);
    this.warper = new DomainWarper(seed);  // NUEVO
    
    // ... resto del código
  }
  
  getContinentalness(x, z) {
    // Aplicar domain warping antes de samplear noise
    const warped = this.warper.warp2D(x, z, 80, 0.003, 3);
    
    return this.simplexNoise.fbm2D(
      warped.x,
      warped.z,
      6,      // octaves
      0.5,    // persistence
      2.0,    // lacunarity
      0.0005  // scale
    );
  }
  
  getErosion(x, z) {
    // Warping más suave para erosion
    const warped = this.warper.warp2D(x, z, 40, 0.005, 2);
    
    return this.simplexNoise.fbm2D(
      warped.x,
      warped.z,
      5,
      0.55,
      2.2,
      0.0008
    );
  }
  
  getPeaksValleys(x, z) {
    // Warping medio para peaks/valleys
    const warped = this.warper.warp2D(x, z, 30, 0.004, 3);
    
    return this.simplexNoise.fbm2D(
      warped.x,
      warped.z,
      4,
      0.6,
      2.5,
      0.0012
    );
  }
  
  getWeirdness(x, z) {
    // Warping ligero para weirdness
    const warped = this.warper.warp2D(x, z, 20, 0.006, 2);
    
    return this.simplexNoise.fbm2D(
      warped.x,
      warped.z,
      3,
      0.5,
      2.0,
      0.0015
    );
  }
  
  getTemperature(x, z) {
    // Warping fuerte para temperature (coastlines irregulares)
    const warped = this.warper.warp2D(x, z, 60, 0.003, 4);
    
    return this.simplexNoise.fbm2D(
      warped.x,
      warped.z,
      4,
      0.5,
      2.0,
      0.0005
    );
  }
  
  getHumidity(x, z) {
    // Warping fuerte para humidity
    const warped = this.warper.warp2D(x, z, 60, 0.003, 4);
    
    return this.simplexNoise.fbm2D(
      warped.x,
      warped.z,
      4,
      0.5,
      2.0,
      0.0005
    );
  }
  
  getDensity3D(x, y, z) {
    // Warping 3D para cuevas
    const warped = this.warper.warp3D(x, y, z, 15, 0.01, 2);
    
    return this.simplexNoise.fbm3D(
      warped.x,
      warped.y,
      warped.z,
      5,
      0.5,
      2.0,
      0.008
    );
  }
}
```

---

## 4. Acceptance Criteria

- [ ] Domain warping elimina grid artifacts del ruido
- [ ] Coastlines son irregulares y naturales (no líneas rectas)
- [ ] Montañas tienen formas orgánicas (no conos perfectos)
- [ ] Biomas tienen fronteras irregulares
- [ ] Performance: <0.2ms overhead por chunk (medido con `Performance.now()`)
- [ ] Warping es reproducible con misma seed
- [ ] Tests unitarios:
  - [ ] `warp2D` retorna coordenadas diferentes a input
  - [ ] `warp2D` con misma seed retorna mismos valores
  - [ ] `warp3D` funciona sin NaN
  - [ ] `warp2DRecursive` genera mayor distorsión que `warp2D`

---

## 5. Testing

**Archivo:** `tests/domain-warping.test.js`

```javascript
describe('DomainWarper', () => {
  test('warp2D modifies coordinates', () => {
    const warper = new DomainWarper(12345);
    const warped = warper.warp2D(100, 200);
    
    expect(warped.x).not.toBe(100);
    expect(warped.z).not.toBe(200);
  });
  
  test('warp2D is reproducible', () => {
    const warper1 = new DomainWarper(12345);
    const warper2 = new DomainWarper(12345);
    
    const w1 = warper1.warp2D(100, 200);
    const w2 = warper2.warp2D(100, 200);
    
    expect(w1.x).toBe(w2.x);
    expect(w1.z).toBe(w2.z);
  });
  
  test('warp3D does not produce NaN', () => {
    const warper = new DomainWarper(12345);
    
    for (let i = 0; i < 100; i++) {
      const warped = warper.warp3D(
        Math.random() * 1000,
        Math.random() * 1000,
        Math.random() * 1000
      );
      
      expect(isNaN(warped.x)).toBe(false);
      expect(isNaN(warped.y)).toBe(false);
      expect(isNaN(warped.z)).toBe(false);
    }
  });
  
  test('recursive warp produces more distortion', () => {
    const warper = new DomainWarper(12345);
    
    const simple = warper.warp2D(100, 200, 50);
    const recursive = warper.warp2DRecursive(100, 200, 50, 25);
    
    const simpleDist = Math.sqrt((simple.x - 100)**2 + (simple.z - 200)**2);
    const recursiveDist = Math.sqrt((recursive.x - 100)**2 + (recursive.z - 200)**2);
    
    expect(recursiveDist).toBeGreaterThan(simpleDist);
  });
});
```

---

## 6. Visual Validation

Generar 5 mundos con seeds diferentes y validar:

1. **Coastlines:** Deben ser irregulares, con bahías, penínsulas, islas
2. **Montañas:** Formas orgánicas, no conos perfectos
3. **Biomas:** Fronteras naturales, no líneas rectas
4. **Ríos:** Curvas naturales (si se implementan)
5. **Cuevas:** Formas irregulares, no túneles rectos

**Seeds de prueba:** 1, 42, 123, 999, 12345

---

## 7. Performance Benchmarks

```javascript
const warper = new DomainWarper(12345);
const iterations = 10000;

console.time('warp2D');
for (let i = 0; i < iterations; i++) {
  warper.warp2D(i * 0.1, i * 0.1);
}
console.timeEnd('warp2D');
// Target: <10ms para 10k calls

console.time('warp3D');
for (let i = 0; i < iterations; i++) {
  warper.warp3D(i * 0.1, i * 0.1, i * 0.1);
}
console.timeEnd('warp3D');
// Target: <15ms para 10k calls

console.time('chunk with warping');
const noise = new SimplexNoise(12345);
for (let x = 0; x < 16; x++) {
  for (let z = 0; z < 16; z++) {
    const warped = warper.warp2D(x, z);
    noise.fbm2D(warped.x, warped.z, 4, 0.5, 2.0, 0.01);
  }
}
console.timeEnd('chunk with warping');
// Target: <0.2ms overhead vs sin warping
```

---

## 8. Configuration

**Archivo:** `core/jardvoxel-survival-config.js`

```javascript
const WARP_CONFIG = {
  continentalness: {
    strength: 80,
    scale: 0.003,
    octaves: 3
  },
  erosion: {
    strength: 40,
    scale: 0.005,
    octaves: 2
  },
  peaksValleys: {
    strength: 30,
    scale: 0.004,
    octaves: 3
  },
  weirdness: {
    strength: 20,
    scale: 0.006,
    octaves: 2
  },
  temperature: {
    strength: 60,
    scale: 0.003,
    octaves: 4
  },
  humidity: {
    strength: 60,
    scale: 0.003,
    octaves: 4
  },
  density3D: {
    strength: 15,
    scale: 0.01,
    octaves: 2
  }
};
```

---

## 9. Documentation

Actualizar `docs/WORLD-GENERATION.md`:

```markdown
## Domain Warping

Domain warping rompe la regularidad del ruido aplicando ruido a las coordenadas antes de samplear.

### Ejemplo:
```javascript
// Sin warping
const value = noise.fbm2D(x, z, 4, 0.5, 2.0, 0.01);

// Con warping
const warped = warper.warp2D(x, z, 50);
const value = noise.fbm2D(warped.x, warped.z, 4, 0.5, 2.0, 0.01);
```

### Efectos:
- Coastlines irregulares
- Montañas orgánicas
- Biomas con fronteras naturales
- Cuevas con formas complejas
```

---

## 10. Rollback Plan

Si domain warping causa problemas de performance:
- Feature flag:
  ```javascript
  const USE_WARPING = true;
  const warped = USE_WARPING ? this.warper.warp2D(x, z) : {x, z};
  ```
- Reducir `strength` y `octaves` en config
- Aplicar solo a continentalness y temperature (más críticos)

---

**Estimación:** 6 horas  
**Prioridad:** CRÍTICA  
**Bloqueante para:** SPEC-093, SPEC-094, SPEC-095
