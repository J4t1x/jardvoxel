# SPEC-091: Simplex Noise Core

**Proyecto:** jard-games/jardvoxel  
**Prioridad:** 🔴 CRÍTICA  
**Estimación:** 8 horas  
**Dependencias:** Ninguna  
**Fase:** 1 — Core Noise  

---

## 1. Objetivo

Implementar `SimplexNoise2D` y `SimplexNoise3D` como reemplazo del sistema de ruido Perlin actual, eliminando artefactos direccionales y mejorando el rendimiento de generación procedural.

---

## 2. Contexto

**Problema actual:**
- `PerlinNoise3D` genera patrones regulares y artefactos direccionales visibles
- Performance O(n³) en 3D es subóptimo
- Gradientes no uniformes causan irregularidades visuales

**Solución:**
- Simplex Noise con O(n²) en 3D
- Gradientes uniformes y patrones más orgánicos
- Implementación optimizada con permutation table seeded

---

## 3. Requirements

### 3.1 SimplexNoise Class

```javascript
class SimplexNoise {
  constructor(seed) {
    // Gradient vectors optimizados (12 vectores para 3D)
    this.grad3 = [
      [1,1,0], [-1,1,0], [1,-1,0], [-1,-1,0],
      [1,0,1], [-1,0,1], [1,0,-1], [-1,0,-1],
      [0,1,1], [0,-1,1], [0,1,-1], [0,-1,-1]
    ];
    
    // Permutation table seeded (256 valores)
    this.perm = this._generatePermutation(seed);
    this.permMod12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      this.permMod12[i] = this.perm[i] % 12;
    }
  }
  
  _generatePermutation(seed) {
    // Seeded random permutation
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    
    // Fisher-Yates shuffle with seeded random
    let rng = seed;
    for (let i = 255; i > 0; i--) {
      rng = (rng * 1664525 + 1013904223) & 0xFFFFFFFF;
      const j = (rng >>> 24) % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    
    // Duplicate for wrapping
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    return perm;
  }
  
  noise2D(x, y) {
    // Simplex grid skewing constants
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
    
    // Work out hashed gradient indices
    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.permMod12[ii + this.perm[jj]];
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
    const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];
    
    // Calculate contribution from three corners
    let n0 = 0, n1 = 0, n2 = 0;
    
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * this._dot2(this.grad3[gi0], x0, y0);
    }
    
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * this._dot2(this.grad3[gi1], x1, y1);
    }
    
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * this._dot2(this.grad3[gi2], x2, y2);
    }
    
    // Sum contributions and scale to [-1, 1]
    return 70 * (n0 + n1 + n2);
  }
  
  noise3D(x, y, z) {
    // Skewing factors for 3D
    const F3 = 1.0 / 3.0;
    const G3 = 1.0 / 6.0;
    
    // Skew input space
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);
    
    // Unskew cell origin
    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;
    const x0 = x - X0;
    const y0 = y - Y0;
    const z0 = z - Z0;
    
    // Determine which simplex we're in (6 cases)
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
      else if (x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
      else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
    } else {
      if (y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
      else if (x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
      else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
    }
    
    // Offsets for corners
    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3;
    const y2 = y0 - j2 + 2 * G3;
    const z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3;
    const y3 = y0 - 1 + 3 * G3;
    const z3 = z0 - 1 + 3 * G3;
    
    // Hashed gradient indices
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const gi0 = this.permMod12[ii + this.perm[jj + this.perm[kk]]];
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]];
    const gi2 = this.permMod12[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]];
    const gi3 = this.permMod12[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]];
    
    // Calculate contributions
    let n0 = 0, n1 = 0, n2 = 0, n3 = 0;
    
    let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * this._dot3(this.grad3[gi0], x0, y0, z0);
    }
    
    let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * this._dot3(this.grad3[gi1], x1, y1, z1);
    }
    
    let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * this._dot3(this.grad3[gi2], x2, y2, z2);
    }
    
    let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
    if (t3 >= 0) {
      t3 *= t3;
      n3 = t3 * t3 * this._dot3(this.grad3[gi3], x3, y3, z3);
    }
    
    // Sum and scale to [-1, 1]
    return 32 * (n0 + n1 + n2 + n3);
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
    let total = 0;
    let amplitude = 1;
    let frequency = scale;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      total += this.noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    
    return total / maxValue;
  }
  
  _dot2(g, x, y) {
    return g[0] * x + g[1] * y;
  }
  
  _dot3(g, x, y, z) {
    return g[0] * x + g[1] * y + g[2] * z;
  }
}
```

### 3.2 Integration

**Archivo:** `core/jardvoxel-survival-noise.js` (nuevo)

**Exportar:**
```javascript
// Export para uso en WorldGenPipeline
window.SimplexNoise = SimplexNoise;
```

**Reemplazar en WorldGenPipeline:**
```javascript
// Antes:
this.perlinNoise = new PerlinNoise3D(seed);

// Después:
this.simplexNoise = new SimplexNoise(seed);
```

---

## 4. Acceptance Criteria

- [ ] `SimplexNoise` genera valores en rango [-1, 1] para 2D y 3D
- [ ] Sin artefactos direccionales visibles en heightmap generado
- [ ] Performance: <0.5ms por chunk 16x16x384 (medido con `Performance.now()`)
- [ ] Reproducible: misma seed genera mismo mundo
- [ ] Tests unitarios:
  - [ ] `noise2D(0, 0)` con seed fija retorna valor consistente
  - [ ] `noise3D(0, 0, 0)` con seed fija retorna valor consistente
  - [ ] `fbm2D` con 4 octaves retorna valores [-1, 1]
  - [ ] Permutation table tiene 512 elementos
  - [ ] Diferentes seeds generan diferentes valores

---

## 5. Testing

**Archivo:** `tests/simplex-noise.test.js`

```javascript
describe('SimplexNoise', () => {
  test('generates consistent values with same seed', () => {
    const noise1 = new SimplexNoise(12345);
    const noise2 = new SimplexNoise(12345);
    expect(noise1.noise2D(10, 20)).toBe(noise2.noise2D(10, 20));
  });
  
  test('generates different values with different seeds', () => {
    const noise1 = new SimplexNoise(12345);
    const noise2 = new SimplexNoise(54321);
    expect(noise1.noise2D(10, 20)).not.toBe(noise2.noise2D(10, 20));
  });
  
  test('noise2D returns values in [-1, 1]', () => {
    const noise = new SimplexNoise(12345);
    for (let i = 0; i < 1000; i++) {
      const val = noise.noise2D(Math.random() * 100, Math.random() * 100);
      expect(val).toBeGreaterThanOrEqual(-1);
      expect(val).toBeLessThanOrEqual(1);
    }
  });
  
  test('noise3D returns values in [-1, 1]', () => {
    const noise = new SimplexNoise(12345);
    for (let i = 0; i < 1000; i++) {
      const val = noise.noise3D(
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100
      );
      expect(val).toBeGreaterThanOrEqual(-1);
      expect(val).toBeLessThanOrEqual(1);
    }
  });
  
  test('fbm2D returns normalized values', () => {
    const noise = new SimplexNoise(12345);
    const val = noise.fbm2D(10, 20, 4, 0.5, 2.0, 0.01);
    expect(val).toBeGreaterThanOrEqual(-1);
    expect(val).toBeLessThanOrEqual(1);
  });
});
```

---

## 6. Performance Benchmarks

```javascript
// Benchmark script
const noise = new SimplexNoise(12345);
const iterations = 10000;

console.time('noise2D');
for (let i = 0; i < iterations; i++) {
  noise.noise2D(i * 0.1, i * 0.1);
}
console.timeEnd('noise2D');
// Target: <5ms para 10k calls

console.time('noise3D');
for (let i = 0; i < iterations; i++) {
  noise.noise3D(i * 0.1, i * 0.1, i * 0.1);
}
console.timeEnd('noise3D');
// Target: <10ms para 10k calls

console.time('chunk generation');
for (let x = 0; x < 16; x++) {
  for (let z = 0; z < 16; z++) {
    for (let y = 0; y < 384; y++) {
      noise.noise3D(x * 0.01, y * 0.01, z * 0.01);
    }
  }
}
console.timeEnd('chunk generation');
// Target: <0.5ms
```

---

## 7. Documentation

Actualizar `docs/WORLD-GENERATION.md`:

```markdown
## Noise System

JardVoxel usa **Simplex Noise** (no Perlin) para generación procedural.

### Ventajas de Simplex:
- Menos artefactos direccionales
- Mejor performance (O(n²) vs O(n³) en 3D)
- Gradientes más uniformes
- Patrones más orgánicos

### Uso:
```javascript
const noise = new SimplexNoise(seed);
const value = noise.noise2D(x, z);        // [-1, 1]
const fbm = noise.fbm2D(x, z, 4, 0.5, 2.0, 0.01);  // Multi-octave
```
```

---

## 8. Migration Path

1. Crear `jardvoxel-survival-noise.js` con `SimplexNoise`
2. Incluir en `jardvoxel-survival.html` antes de `jardvoxel-survival-engine.js`
3. Reemplazar `PerlinNoise3D` por `SimplexNoise` en `WorldGenPipeline`
4. Ejecutar tests
5. Generar 10 mundos con seeds diferentes para validar visualmente
6. Medir performance con benchmark
7. Si todo OK: eliminar código de `PerlinNoise3D`

---

## 9. Rollback Plan

Si Simplex causa problemas:
- Revertir a `PerlinNoise3D`
- Mantener `SimplexNoise` como feature flag:
  ```javascript
  const USE_SIMPLEX = false;
  this.noise = USE_SIMPLEX ? new SimplexNoise(seed) : new PerlinNoise3D(seed);
  ```

---

## 10. Referencias

- **Simplex Noise Demystified** (Stefan Gustavson, 2005)
- **Improved Noise** (Ken Perlin, 2002)
- Three.js SimplexNoise implementation
- Minecraft 1.18+ noise system

---

**Estimación:** 8 horas  
**Prioridad:** CRÍTICA  
**Bloqueante para:** SPEC-092, SPEC-093, SPEC-094
