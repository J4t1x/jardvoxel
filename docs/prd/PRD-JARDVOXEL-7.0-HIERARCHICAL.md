# JardVoxel — Arquitectura Jerárquica de Generación Procedural v7.0

**Versión:** 7.0 — Hierarchical World Generation  
**Fecha:** 29 Junio 2026  
**Actualizado:** 19 Julio 2026  
**Estado:** ✅ **Completado** (SPEC-081..085, 2026-07-19)  
**Specs:** SPEC-100 through SPEC-110 (consolidadas en SPEC-081..SPEC-085)  
**Predecessor:** v6.0 (SPEC-091 through SPEC-098) — Simplex Noise + Domain Warping + Coherent Biomes

## Estado de Implementación

| Nivel | Spec Original | Spec Consolidada | Estado |
|-------|---------------|------------------|--------|
| 1 — WorldIdentity | SPEC-100 | SPEC-081 | ✅ Completado (2026-07-19) |
| 2 — ContinentGenerator | SPEC-101 | SPEC-081 | ✅ Completado (2026-07-19) |
| 3 — RegionGenerator | SPEC-102 | SPEC-082 | ✅ Completado (2026-07-19) |
| 4 — ZoneGenerator | SPEC-103 | SPEC-082 | ✅ Completado (2026-07-19) |
| 5 — HierarchicalChunkGenerator | SPEC-104 | SPEC-083 | ✅ Completado (2026-07-19) |
| 6 — MicrosectorGenerator | SPEC-105 | SPEC-083 | ✅ Completado (2026-07-19) |
| 9 capas (WorldLayers) | SPEC-106 | SPEC-084 | ✅ Completado (2026-07-19) |
| HierarchicalStreaming | SPEC-107 | SPEC-084 | ✅ Completado (2026-07-19) |
| Landmarks | SPEC-108 | SPEC-085 | ✅ Completado (2026-07-19) |
| Ecosystems | SPEC-109 | SPEC-085 | ✅ Completado (2026-07-19) |
| Contextual Gen | SPEC-110 | SPEC-085 | ✅ Completado (2026-07-19) |

**Tests:** 90 tests en 3 archivos (`world-hierarchy.test.js` 47, `hierarchical-streaming.test.js` 27, `hierarchical-integration.test.js` 16). Suite total: 1076/1082 pasando (6 fallos pre-existentes en `ai-server.test.js` — SPEC-072, no relacionados).

**Migración HTML:**
- `jardvoxel-survival.html` — ✅ migrado (`hierarchicalGeneration: true` toggle)
- `jardvoxel-zen.html` — ✅ ya migrado (`ZenGame` activa jerarquía en zen classic)
- `jardvoxel-zen2.html` — ✅ intencionalmente flat (zen2 mode, por diseño)

---

## Visión

La generación procedural de JardVoxel evolucionará hacia una arquitectura jerárquica inspirada en procesos geográficos reales. El objetivo es dejar atrás una generación basada exclusivamente en ruido para construir un mundo donde cada elemento exista como consecuencia de procesos naturales ocurridos a diferentes escalas.

Los chunks dejarán de ser la unidad responsable del diseño del mundo y pasarán a ser únicamente la representación física del terreno. Las decisiones sobre geografía, clima, biomas y ecosistemas se tomarán en niveles superiores.

---

## Objetivos

- Separar la generación del mundo en múltiples niveles de responsabilidad
- Mejorar la coherencia visual y geográfica
- Facilitar la incorporación de nuevas mecánicas sin modificar la generación base
- Incrementar el nivel de detalle sin aumentar significativamente el costo computacional
- Optimizar el streaming y la carga de chunks

---

## Arquitectura Jerárquica — 6 Niveles

### Nivel 1 — Mundo (`WorldIdentity`)

Responsable de definir la identidad global del planeta.

**Genera:**
- Semilla principal
- Historia del mundo
- Parámetros climáticos globales
- Nivel del mar
- Edad geológica
- Distribución aproximada de océanos y continentes

**Spec:** SPEC-100  
**Archivo:** `core/jardvoxel-survival-world-hierarchy.js`  
**Clase:** `WorldIdentity`  
**Persistencia:** Permanente durante toda la partida

---

### Nivel 2 — Continentes (`ContinentGenerator`)

Cada continente se genera como una gran unidad geográfica con identidad propia.

**Define:**
- Clima dominante
- Altitud promedio
- Humedad
- Vegetación predominante
- Fauna principal
- Cultura antigua asociada
- Recursos característicos

**Spec:** SPEC-101  
**Escala:** Miles de chunks  
**Cada continente debe sentirse diferente del resto**

---

### Nivel 3 — Regiones (`RegionGenerator`)

Cada continente se divide en grandes regiones naturales.

**Tipos:**
- Cordilleras
- Llanuras
- Bosques
- Pantanos
- Mesetas
- Costas
- Desiertos

**Spec:** SPEC-102  
**Escala:** Cientos de chunks  
**Determinan el carácter del paisaje**

---

### Nivel 4 — Zonas (`ZoneGenerator`)

Cada región se subdivide en zonas de menor escala.

**Tipos:**
- Lagos
- Valles
- Cascadas
- Bosques densos
- Claros
- Colinas
- Acantilados
- Humedales

**Spec:** SPEC-103  
**Escala:** Decenas de chunks  
**Aquí aparecen los elementos que el jugador percibe como lugares únicos**

---

### Nivel 5 — Chunks (`HierarchicalChunkGenerator`)

Los chunks reducen su responsabilidad.

**Tamaño:** `16 x 16 bloques`  
**Función:** Únicamente construir el terreno correspondiente a la información entregada por los niveles superiores

**El chunk deja de decidir:**
- Biomas
- Clima
- Grandes accidentes geográficos

**Solo materializa dicha información**

**Spec:** SPEC-104

---

### Nivel 6 — Microsectores (`MicrosectorGenerator`)

Cada chunk se dividirá internamente en pequeñas áreas.

```
Chunk 16x16
  ↓
4 sectores de 8x8
  ↓
16 sectores de 4x4
```

**Cada microsector decide:**
- Flores
- Arbustos
- Piedras
- Hongos
- Musgo
- Ramas
- Hojas
- Pequeños desniveles

**Spec:** SPEC-105

---

## Sistema de Capas (9 Capas)

La generación del chunk se realizará por etapas independientes.

| Capa | Nombre | Contenido | Spec |
|------|--------|-----------|------|
| 1 | Terreno base | Stone, dirt, grass, sand, water | SPEC-106 |
| 2 | Micro relieve | Pequeñas irregularidades | SPEC-106 |
| 3 | Rocas superficiales | Rocks, boulders | SPEC-106 |
| 4 | Vegetación mayor | Árboles | SPEC-106 |
| 5 | Vegetación menor | Flores, hierbas, arbustos | SPEC-106 |
| 6 | Decoración natural | Troncos, musgo, hongos, piedras | SPEC-106 |
| 7 | Fauna | Mobs, animales | SPEC-106 |
| 8 | Audio ambiental | Sonidos por bioma | SPEC-106 |
| 9 | Eventos dinámicos | Mariposas, luciérnagas, hojas cayendo, nieblas | SPEC-106 |

Cada capa podrá cargarse de manera progresiva mientras el jugador explora.

---

## Streaming Inteligente

| Nivel | Distancia | Contenido |
|-------|-----------|-----------|
| Cercano | 0-3 chunks | Terreno completo, vegetación, fauna, sombras |
| Distancia media | 3-8 chunks | Terreno, árboles simplificados, sin fauna |
| Distancia lejana | 8-14 chunks | Solo geometría básica |
| Horizonte | 14+ chunks | Representación simplificada del relieve |

**Spec:** SPEC-107

---

## Sistema de Landmarks

Cada región podrá contener puntos de interés únicos.

**Ejemplos:**
- Árbol milenario
- Gran cascada
- Volcán
- Lago cristalino
- Cañón
- Arco de piedra
- Bosque rojo
- Ruinas antiguas
- Santuario natural

**Spec:** SPEC-108  
**Función:** Referencias visuales durante la exploración

---

## Ecosistemas

Los biomas evolucionarán hacia ecosistemas completos con reglas ecológicas.

**Ejemplo — Bosque incluye automáticamente:**
- Distintas especies de árboles
- Arbustos
- Flores
- Musgo
- Hongos
- Rocas
- Insectos
- Aves
- Pequeños riachuelos
- Claros naturales

**Spec:** SPEC-109

---

## Generación Contextual

Las estructuras utilizan información geográfica para decidir su ubicación.

| Estructura | Ubicación |
|------------|-----------|
| Aldeas | Cerca de ríos, lagos, praderas, tierras fértiles |
| Minas | Próximas a cordilleras |
| Templos | En lugares elevados |
| Puertos | Cerca de bahías |

**Spec:** SPEC-110

---

## Beneficios Técnicos

- Mayor modularidad del motor procedural
- Mejor paralelización de la generación
- Streaming más eficiente
- Menor impacto en FPS
- Facilidad para incorporar nuevos biomas
- Mejor distribución de estructuras
- Mejor reutilización de algoritmos
- Escalabilidad para futuras dimensiones

---

## Beneficios para el Jugador

- Mundo mucho más natural y coherente
- Montañas con continuidad
- Ríos con recorridos lógicos
- Bosques que evolucionan como ecosistemas
- Aldeas con sentido geográfico
- Paisajes que invitan a detenerse y contemplar

Cada región cuenta una historia mediante su relieve, vegetación y clima, reforzando la identidad de JardVoxel como un **sandbox procedural de exploración, contemplación y bienestar**.

---

## Especificaciones Técnicas

### Archivos Nuevos

| Archivo | Responsabilidad | Spec |
|---------|-----------------|------|
| `core/jardvoxel-survival-world-hierarchy.js` | Niveles 1-4 (World, Continent, Region, Zone) | SPEC-100 to SPEC-103 |
| `core/jardvoxel-survival-microsectors.js` | Nivel 6 (Microsectors) | SPEC-105 |
| `core/jardvoxel-survival-layers.js` | Sistema de 9 capas | SPEC-106 |
| `core/jardvoxel-survival-streaming.js` | Streaming inteligente | SPEC-107 |
| `core/jardvoxel-survival-landmarks.js` | Landmarks | SPEC-108 |
| `core/jardvoxel-survival-ecosystems.js` | Ecosistemas | SPEC-109 |
| `core/jardvoxel-survival-contextual.js` | Generación contextual | SPEC-110 |

### Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `core/jardvoxel-survival-engine.js` | `WorldGenPipeline` delega a jerarquía |
| `core/jardvoxel-survival-features.js` | Features usan contexto jerárquico |
| `core/jardvoxel-engine.js` | `ChunkManager` usa streaming inteligente |
| `core/jardvoxel-survival-worker.js` | Worker inicializa jerarquía |

### Dependencias

- Mantiene compatibilidad con v6.0 (SimplexNoise, DomainWarper, TerrainSplines)
- Los niveles superiores usan ruido existente para definir fronteras
- Los chunks consumen datos pre-calculados de niveles superiores

---

## Fases de Implementación

| Fase | Specs | Tiempo Est. | Estado |
|------|-------|-------------|--------|
| 1 — Core Hierarchy | SPEC-100 to SPEC-103 | 4h | ✅ Completado (SPEC-081 + SPEC-082, 2026-07-19) |
| 2 — Chunk Refactor | SPEC-104 to SPEC-105 | 3h | ✅ Completado (SPEC-083, 2026-07-19) |
| 3 — Layer System | SPEC-106 | 3h | ✅ Completado (SPEC-084, 2026-07-19) |
| 4 — Streaming | SPEC-107 | 2h | ✅ Completado (SPEC-084, 2026-07-19) |
| 5 — Landmarks + Ecosystems | SPEC-108 to SPEC-109 | 3h | ✅ Completado (SPEC-085, 2026-07-19) |
| 6 — Contextual Gen | SPEC-110 | 2h | ✅ Completado (SPEC-085, 2026-07-19) |
| 7 — Integration + Docs | — | 2h | ✅ Completado (SPEC-085, 2026-07-19) |
| **Total** | **11 specs** | **~19h** | **✅ 11/11 specs completadas** |

### Notas de Implementación (2026-07-19)

- **SPEC-081/082/083** se enfocaron en verificación + tests de código pre-existente (niveles 1-6 ya implementados en SPEC-100..105 originales).
- **SPEC-083** añadió integración faltante: `MicrosectorGenerator` ahora es instanciado por `HierarchicalChunkGenerator` e invocado desde `generateChunkHierarchical()` en `features.js`.
- **SPEC-084** implementó `HierarchicalStreaming` (nuevo módulo `jardvoxel-survival-streaming.js`): pre-warm de caches región/zona + priorityBoost por contexto compartido. Integrado en `SurvivalWorld._tryAddChunkCandidate()` y bucle de update. `LayerSystem` (9 capas) verificado con tests.
- **SPEC-085** migró `jardvoxel-survival.html` (toggle `hierarchicalGeneration`), verificó backward compatibility (v6.0 chunks cargan, toggle on/off, re-enable), performance (< 50ms chunk gen, < 200ms prewarm, < 0.1ms priorityBoost), y coherencia (3x3 grid → 1-5 regiones).
- **Patrón detectado**: `circular-dep-tdz` — resuelto con lazy getters en `microsectors.js` (`getBiomeDecoration()`, `getZoneDecorationMult()`, `sectorsPerSide()`).
- **Deuda restante**: 6 fallos en `ai-server.test.js` (SPEC-072, no relacionados con jerarquía).
- **PRD 7.0**: ✅ Completado.
