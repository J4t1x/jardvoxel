# JardVoxel — Generacion Procedural de Mundo

## Ruido Perlin

El motor usa **Perlin Noise 2D y 3D** con semilla reproducible (Xorshift128+ PRNG).

### Ruidos del WorldGenerator

| Ruido | Seed offset | Funcion | Escala |
|-------|-------------|---------|--------|
| `heightNoise` | +0 | Altura base del terreno | 0.005 (5 octaves) |
| `detailNoise` | +100 | Detalle fino | 0.02 (3 octaves) |
| `tempNoise` | +200 | Temperatura (biomas) | 0.003 (3 octaves) |
| `humidNoise` | +300 | Humedad (biomas) | 0.003 (3 octaves) |
| `continentalNoise` | +400 | Continentalidad (océano vs tierra) | 0.0008 (4 octaves) |
| `erosionNoise` | +500 | Erosion (plano vs montañoso) | 0.002 (4 octaves) |
| `caveNoise` | +600 | Cuevas spaghetti + cheese | 0.05 / 0.03 |
| `caveNoise2` | +700 | Cuevas spaghetti (2do campo) | 0.08 |
| `oreNoise` | +800 | Distribucion de minerales (legacy) | 0.1 |
| `riverNoise` | +1000 | Rios sinuosos | 0.002 (2 octaves) |
| `ravineNoise` | +1100 | Ravinas (cortes verticales) | 0.02 |
| `densityNoise` | +1300 | 3D overhangs en biomas montañosos | 0.015 (3 octaves) |
| `noodleNoise` | +1400 | Noodle caves (tuneles delgados) | 0.06 (2 octaves) |
| `noodleNoise2` | +1401 | Noodle caves (2do campo offset) | 0.06 (2 octaves) |
| `aquiferNoise` | +1500 | Aquifer: local fluid level por celda 16-block | 0.5 |
| `aquiferBarrier` | +1501 | Aquifer: barrier noise (separa fluido de aire) | 0.04 / 0.06 |
| `carverNoise` | +1600 | Carver: tunel principal sinuoso | 0.015 (3 octaves) |
| `carverNoise2` | +1601 | Carver: tunel secundario (branch) | 0.025 (2 octaves) |
| `oreToggleNoise` | +1700 | Ore veins: tipo de mineral | 0.08 |
| `oreRidgeNoise` | +1701 | Ore veins: skip si > 0.2 | 0.06 |
| `oreGapNoise` | +1702 | Ore veins: densidad ore-to-filler | 0.12 |
| `lavaLakeNoise` | +1800 | Lava lakes en superficie baja | 0.01 |
| `springNoise` | +1801 | Fluid springs en paredes de cuevas | 0.1 |
| `freezeNoise` | +1900 | Freeze top layer (hielo en agua fria) | 0.03 |
| `stoneVarNoise` | +2000 | Stone variants (granite/andesite/diorite) | 0.02 / 0.01 |

## Altura del Terreno

```
getHeight(x, z):
  1. continental = fbm(x, z, 4 octaves, scale 0.0008)
  2. base = fbm(x, z, 5 octaves, scale 0.005)
  3. erosion = fbm(x, z, 4 octaves, scale 0.002)
  4. detail = fbm(x, z, 3 octaves, scale 0.02)
  5. river = fbm(x, z, 2 octaves, scale 0.002)

  Si continental < 0.38:
    h = WATER_LEVEL - 3 + (continental - 0.38) * 60  → Oceano profundo
  Sino:
    h = (continental - 0.38) * 80 + WATER_LEVEL
    h += (base - 0.5) * 20      → variacion de altura
    h += (erosion - 0.5) * 15   → aplanamiento
    h += (detail - 0.5) * 4     → detalle fino
    Si continental > 0.6:
      h += (continental - 0.6)^2 * 120  → montañas

  Si rio cerca (|river - 0.5| < 0.02) y h > WATER_LEVEL - 2:
    h = WATER_LEVEL - 1  → rio al nivel del mar

  Clamp: 1 ≤ h ≤ CHUNK_HEIGHT - 5 (59)
```

## Biomas

16 biomas determinados por temperatura, humedad, altura y continentalidad:

| Bioma | Condicion | Color caracteristico |
|-------|-----------|---------------------|
| Ocean | height < WATER_LEVEL - 2, temp ≥ 0.25 | Azul |
| Frozen Ocean | height < WATER_LEVEL - 2, temp < 0.25 | Azul claro |
| Beach | height < WATER_LEVEL + 2 | Arena |
| River | rio cerca, height ≤ WATER_LEVEL | Arena |
| Snowy Peaks | height > 50 | Nieve |
| Mountain | height > 38 | Roca |
| Tundra | temp < 0.20 | Nieve |
| Taiga | temp < 0.35, humid > 0.40 | Bosque con nieve |
| Desert | temp > 0.70, humid < 0.20 | Arena |
| Badlands | temp > 0.70, humid < 0.20, continental > 0.50 | Arena roja |
| Savanna | temp > 0.65, humid < 0.35 | Tierra seca |
| Jungle | temp > 0.55, humid > 0.60 | Bosque denso |
| Mangrove | humid > 0.70, height ≤ WATER_LEVEL + 3 | Tierra pantanosa |
| Swamp | humid > 0.55, height < WATER_LEVEL + 8 | Pantano |
| Forest | humid > 0.50 | Bosque |
| Plains | default | Pasto |

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
