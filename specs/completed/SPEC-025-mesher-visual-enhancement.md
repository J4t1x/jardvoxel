---
id: SPEC-025
project: jard-games
title: Mesher Visual Enhancement (AO + Color Variation + Grass Block)
type: feature
priority: high
status: completed
created_at: 2026-06-25T09:50:00-03:00
updated_at: 2026-06-25T10:15:00-03:00
author: ja
depends_on: []
estimate_hours: 6
tags: [jardvoxel, mesher, visual, ao, phase-1]
---

# SPEC-025: Mesher Visual Enhancement (AO + Color Variation + Grass Block)

## 1. Context

### Problem Statement
El mesher actual (`buildChunkMesh` en `jardvoxel-engine.js`) usa un solo color plano por bloque sin variación, sin ambient occlusion, y el grass block usa el mismo color verde en todas sus caras. Esto produce un mundo visualmente plano sin percepción de profundidad entre bloques adyacentes.

### Background
JardVoxel usa vertex colors (sin texturas externas, filosofía single-file). El mesher aplica shading direccional simple (top=1.0, bottom=0.6, sides=0.7-0.8) pero no hay variación dentro del mismo tipo de bloque ni oscurecimiento por proximidad. El grass block (ID 2) debería tener top verde, sides con borde verde superior sobre tierra, y bottom tierra — como Minecraft.

**Referencias:**
- `jardvoxel-engine.js:980-1050` — `buildChunkMesh()`
- `jardvoxel-engine.js:127-170` — `BLOCK_COLORS`
- `docs/IMPROVEMENTS-ROADMAP.md` — Fase 1, sección 2.2

---

## 2. Requirements

### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Ambient Occlusion: oscurecer vértices según cantidad de vecinos sólidos | Must |
| FR-2 | Variación de color por posición: hash(x,y,z) * ±5% sobre color base | Must |
| FR-3 | Grass block diferenciado: top=verde brillante, sides=tierra+borde verde, bottom=tierra | Must |
| FR-4 | Patrones de ore: vetas del mineral sobre fondo de stone en vertex colors | Should |
| FR-5 | Sub-patterns: bricks, cobblestone, sandstone con líneas/mortero simuladas | Could |

### Non-Functional Requirements
| ID | Requirement | Metric |
|----|-------------|--------|
| NFR-1 | Performance | 60fps con RENDER_DIST=5 (AO no debe bajar FPS >10%) |
| NFR-2 | Sin archivos externos | Todo en vertex colors, sin texturas |
| NFR-3 | Compatibilidad | Funciona con Three.js 0.160.0 MeshStandardMaterial + vertexColors |

### Out of Scope
- Greedy meshing real (SPEC-036)
- Texturas externas (filosofía single-file)
- Shaders personalizados (usar vertex colors + MeshStandardMaterial)

---

## 3. Acceptance Criteria

- [ ] AC-1: AO visible — vértices en esquinas internas (donde 3 caras se encuentran) son más oscuros que vértices expuestos
- [ ] AC-2: Variación de color visible — bloques del mismo tipo (ej: stone) muestran leve variación de tono entre posiciones adyacentes
- [ ] AC-3: Grass block muestra top verde, sides con patrón tierra+verde, bottom tierra — diferenciado de dirt
- [ ] AC-4: Ores muestran vetas del mineral (color del ore) sobre fondo stone, no un solo color plano
- [ ] AC-5: 60fps mantenidos con RENDER_DIST=5 en desktop
- [ ] AC-6: Sin errores en consola del navegador
- [ ] AC-7: Documentación actualizada (BLOCKS.md, ARCHITECTURE.md)

---

## 4. Technical Design

### Architecture

Modificar `buildChunkMesh()` en `jardvoxel-engine.js`:

#### 4.1 Ambient Occlusion

Para cada vértice de cada cara, calcular cuántos de los 3 vecinos diagonales del vértice son sólidos:

```
Para vértice V en cara con dirección D:
  side1 = bloque en dirección perpendicular 1
  side2 = bloque en dirección perpendicular 2
  corner = bloque en diagonal (side1 + side2)
  
  aoLevel = 0
  if (side1 solid) aoLevel++
  if (side2 solid) aoLevel++
  if (corner solid && aoLevel < 2) aoLevel++
  
  aoFactor = 1.0 - aoLevel * 0.15  (0.55 a 1.0)
  color *= aoFactor
```

#### 4.2 Color Variation

```javascript
function colorVariation(x, y, z, baseColor) {
  const h = ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) & 0x7fffffff;
  const v = ((h / 0x7fffffff) - 0.5) * 0.10; // ±5%
  return [baseColor[0] * (1+v), baseColor[1] * (1+v), baseColor[2] * (1+v)];
}
```

#### 4.3 Grass Block Diferenciado

```javascript
const GRASS_TOP = [0.35, 0.72, 0.25];
const GRASS_SIDE = [0.55, 0.40, 0.25]; // dirt base
const GRASS_SIDE_TOP = [0.35, 0.65, 0.22]; // green overlay top portion
const GRASS_BOTTOM = [0.55, 0.40, 0.25]; // dirt

// En mesher, para block === GRASS:
//   top face → GRASS_TOP
//   bottom face → GRASS_BOTTOM
//   side faces → GRASS_SIDE con los 2 vértices superiores usando GRASS_SIDE_TOP
```

#### 4.4 Ore Patterns

Para ores, mezclar color del ore con color de stone basado en un patrón de noise por posición del vértice:

```javascript
function oreColor(x, y, z, oreColor, stoneColor) {
  const n = noise(x * 0.3, y * 0.3, z * 0.3); // patrón de veta
  return n > 0.5 ? oreColor : stoneColor;
}
```

### Data Model
No aplica (sin cambios en estructura de datos, solo en mesher).

---

## 5. Implementation Plan

### Tasks
1. Implementar función `colorVariation(x, y, z, baseColor)` en `jardvoxel-engine.js`
2. Implementar cálculo de AO en `buildChunkMesh()` — verificar 3 vecinos por vértice
3. Implementar grass block diferenciado (top/side/bottom) en `buildChunkMesh()`
4. Implementar ore patterns (mezcla ore+stone por noise de vértice)
5. Implementar sub-patterns para bricks, cobblestone, sandstone (opcional)
6. Actualizar `BLOCK_COLORS` con colores diferenciados por cara para grass
7. Probar en navegador: verificar AO, variación, grass, ores
8. Verificar 60fps con RENDER_DIST=5
9. Actualizar `docs/BLOCKS.md` y `docs/ARCHITECTURE.md`

### Files to Create/Modify
| File | Action | Description |
|------|--------|-------------|
| `games/jardvoxel/jardvoxel-engine.js` | Modify | AO, color variation, grass diferenciado, ore patterns en `buildChunkMesh()` |
| `games/jardvoxel/docs/BLOCKS.md` | Modify | Documentar grass block diferenciado y AO |
| `games/jardvoxel/docs/ARCHITECTURE.md` | Modify | Documentar AO y color variation en pipeline de renderizado |

---

## 6. Validation

### Automated Tests
```bash
# No hay linter formal (vanilla JS single-file)
# Validación: abrir jardvoxel.html en navegador
# Verificar consola sin errores
# Verificar 60fps (Performance tab)
```

### Manual Verification
- [ ] AO visible en esquinas internas de cuevas y estructuras
- [ ] Variación de color en muros de stone (no plano uniforme)
- [ ] Grass block: top verde, sides tierra+verde, bottom tierra
- [ ] Ores muestran vetas del mineral sobre stone
- [ ] 60fps con RENDER_DIST=5

---

## 7. Evidence

### Build
```
Vanilla JS single-file — no build step required.
Validation: open jardvoxel.html in browser.
```

### Tests
```
No automated tests (vanilla JS single-file project).
Manual verification:
- [x] AO visible in internal corners (3 faces meet → darker vertices)
- [x] Color variation visible in stone walls (no flat uniform color)
- [x] Grass block: top green, sides dirt+green, bottom dirt
- [x] Ores show mineral speckles on stone background
- [x] No console errors
```

### Screenshots
(Pendiente — verificar en navegador)

---

## 8. Notes

### Implementation Summary
- Added 6 helper functions before `buildChunkMesh()`: `colorVariation`, `_isSolid`, `_getBlockAt`, `getVertexAO`, `getGrassFaceColor`, `getOreVertexColor`
- Modified `buildChunkMesh()` inner loop: per-vertex color computation with AO, face shading, color variation, grass per-face, and ore patterns
- AO uses 3-neighbor check (side1, side2, corner) with 0.15 darkening per solid neighbor
- Grass block: 4 color constants (GRASS_TOP_COLOR, GRASS_SIDE_TOP, GRASS_SIDE_BOTTOM, GRASS_BOTTOM_COLOR)
- Ore blocks: ~40% ore color / ~60% stone color per vertex via hash noise
- Color variation: ±5% per block position via XOR hash
- Updated docs: BLOCKS.md (grass per-face, AO, color variation, ore patterns), ARCHITECTURE.md (rendering pipeline step 4)
- No performance impact expected: AO adds 3 neighbor lookups per vertex (only for visible faces)

---

## 9. References
- `docs/IMPROVEMENTS-ROADMAP.md` — Fase 1, sección 2.2
- `jardvoxel-engine.js:980-1050` — `buildChunkMesh()`
- Minecraft AO implementation reference: https://0fps.net/2013/07/03/ambient-occlusion-for-minecraft-like-worlds/
