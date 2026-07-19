# JardVoxel — Roadmap de Mejoras

**Fecha**: 2026-06-25  
**Autor**: ja  
**Estado**: Completado ✅  
**Total specs**: 42 (SPEC-025 a SPEC-066) — todas completadas  
**Bug audit**: 10/10 bugs resueltos (BUG-001 a BUG-010)  
**Version actual**: v4.2.0

---

## Resumen Ejecutivo

Roadmap de mejoras para JardVoxel organizado en 5 fases priorizadas por impacto visual / experiencia de juego vs esfuerzo. El desarrollo se ejecuta con el Jard Dev Harness (`/cascade-dev` o `@jard-code`).

### Áreas de mejora

| Área | Estado actual | Objetivo |
|------|---------------|----------|
| Experiencia de juego | Inventario, minado, natación, audio, UI, herramientas, encantamientos | ✅ Completado |
| Bloques | 157 tipos con colores, hardness, AO, patrones | ✅ Completado |
| Cielo | Sol, luna, estrellas, nubes, gradiente, atardeceres | ✅ Completado |
| Agua | Olas animadas, profundidad, fresnel, flujo | ✅ Completado |
| Estructuras | 14 tipos con detalle arquitectónico | ✅ Completado |
| Performance | Greedy meshing, Web Worker, LOD, frustum culling | ✅ Completado |
| Mobs | Pasivos + hostiles con IA, drops, combate | ✅ Completado |
| Survival | Salud/hambre, clima, hornos, agricultura, camas | ✅ Completado |
| Herramientas/Armadura | 16 herramientas + 4 armaduras con durabilidad | ✅ Completado |
| Encantamientos | XP, niveles, mesa encantamiento, 5 encantamientos | ✅ Completado |
| Aldeanos | 4 profesiones con trading UI | ✅ Completado |
| Pesca | Caña, bobber animado, tabla de capturas | ✅ Completado |
| Nether | Dimension alternativa con 10 bloques nuevos | ✅ Completado |
| Redstone | 6 bloques, propagacion BFS, piston, lamp | ✅ Completado |
| Musica | ChillTune 8-bit procedural, 7 estados | ✅ Completado |
| Pociones | Brewing 3-stage, 7 efectos, splash potions | ✅ Completado |
| Escudos | ShieldItem, blocking cone, shield bash | ✅ Completado |
| Logros | 30 logros en 8 categorias con toast | ✅ Completado |
| Yunque | Reparacion, combinacion, renombrado | ✅ Completado |
| Mapas | MapManager 4 tiers, compass, cartography | ✅ Completado |

---

## Fases

### Fase 1 — Visual Foundations (Alto impacto, esfuerzo medio)

**Specs**: SPEC-025, SPEC-026, SPEC-027  
**Estimación**: 17 horas  
**Impacto visual**: Alto

Mejoras que transforman la apariencia del juego con menor esfuerzo:

| Spec | Título | Horas |
|------|--------|-------|
| SPEC-025 | Mesher Visual Enhancement (AO + Color Variation) | 6h |
| SPEC-026 | Sky Overhaul (Sol, Luna, Estrellas, Gradiente) | 6h |
| SPEC-027 | Water Animation (Olas + Profundidad) | 5h |

**Mejoras incluidas:**

- **Ambient Occlusion**: oscurecer vértices con más vecinos sólidos
- **Variación de color por posición**: `hash(x,y,z) * ±5%` para textura orgánica
- **Grass block diferenciado**: top=verde brillante, sides=tierra con borde verde, bottom=tierra
- **Patrones de ore en vertex colors**: vetas del mineral sobre fondo de stone
- **Sol visible**: mesh emisivo amarilla que rota con dayTime
- **Luna visible**: esfera grisácea opuesta al sol
- **Campo de estrellas**: ~800 puntos (THREE.Points), visibles de noche
- **Gradiente de cielo vertical**: horizonte más claro, cenit más oscuro
- **Colores de atardecer/amanecer**: tonos naranjas/rosados en transiciones
- **Olas animadas**: sin/cos vertex displacement en superficie del agua
- **Color por profundidad**: turquesa claro en orillas, azul oscuro en profundidad
- **Fresnel effect**: más reflectante en ángulos rasantes
- **Línea de costa**: transición suave agua-arena

---

### Fase 2 — Bloques y Vegetación (Alto impacto, esfuerzo medio)

**Specs**: SPEC-028, SPEC-029  
**Estimación**: 9 horas  
**Impacto visual**: Alto

| Spec | Título | Horas |
|------|--------|-------|
| SPEC-028 | Nuevos Bloques (15-20 tipos) | 4h |
| SPEC-029 | Árboles Variados por Bioma | 5h |

**Mejoras incluidas:**

- **15-20 nuevos bloques**: Birch Wood, Spruce Wood, Oak Leaves (dark), Moss, Mycelium, Obsidian, Lapis Ore, Redstone Ore, Emerald Ore, Netherrack, Basalt, Amethyst, Bookshelf, Lantern, Torch, TNT, Sponge, Pumpkin, Melon, Bamboo
- **Bloques emisivos**: Torch y Lantern emiten luz puntual
- **Actualización de transparent blocks set**: nuevos bloques transparentes
- **Árboles por bioma**:
  - **Roble** (forest/plains): tronco 4-5, copa redondeada asimétrica
  - **Jungla** (jungle): tronco 2x2, altura 8-12, copa grande con vines
  - **Abeto/pino** (taiga): tronco alto delgado, copa cónica
  - **Manglar** (mangrove): raíces visibles, copa dispersa
  - **Muerto** (swamp): tronco sin hojas, ramas extendidas
  - **Savanna** (savanna): tronco grueso corto, copa plana ancha

---

### Fase 3 — Estructuras + Nubes (Alto impacto, esfuerzo alto)

**Specs**: SPEC-030, SPEC-031, SPEC-032  
**Estimación**: 18 horas  
**Impacto visual**: Alto

| Spec | Título | Horas |
|------|--------|-------|
| SPEC-030 | Estructuras Detalladas: Village + Temple | 7h |
| SPEC-031 | Estructuras Detalladas: Mineshaft + Monument + Nuevas | 7h |
| SPEC-032 | Nubes Procedurales | 4h |

**Mejoras incluidas:**

- **Village detallada**: casas con puertas, ventanas (glass), chimeneas, techos a dos aguas, caminos de gravel, plaza central con pozo, faroles en postes
- **Temple detallado**: pirámide escalonada mesoamericana, entrada visible, cámara con tesoro, pilares en esquinas, escaleras de acceso
- **Mineshaft detallado**: túneles ramificados, rieles y vagonetas, cofres de loot, soportes con postes+vigas, torches en paredes
- **Monument detallado**: forma de templo marino con cúpula, pilares internos, canales de agua, tamaño 9x9+ con múltiples niveles
- **Nuevas estructuras**:
  - **Shipwreck** (ocean): barco hundido de wood/planks con cofre
  - **Igloo** (tundra/snow): cúpula de snow/ice con cámara subterránea
  - **Desert Well** (desert): pozo de sandstone 3x3 con agua
  - **Ice Spike** (frozen ocean/tundra): pico de packed_ice vertical
  - **Boulder** (mountain): roca grande de granite/diorite/andesite
  - **Swamp Hut** (swamp): cabaña sobre pilotes con mushrooms
  - **Jungle Temple** (jungle): estructura de mossy_cobble con trampas
  - **Ruined Portal** (cualquiera): marco de obsidian con lava
  - **Coral Reef** (ocean cálido): bloques decorativos de coral
  - **Forest Rock** (forest): formación de mossy_stone/moss
- **Nubes procedurales**: capa a Y=50-60 con noise generado en canvas, movimiento con viento, color dinámico (blancas/rosadas/grises)

---

### Fase 4 — Gameplay + Audio + UI (Impacto medio, esfuerzo alto)

**Specs**: SPEC-033, SPEC-034, SPEC-035  
**Estimación**: 19 horas  
**Impacto visual**: Medio (impacto en experiencia: alto)

| Spec | Título | Horas |
|------|--------|-------|
| SPEC-033 | Gameplay: Inventario + Minado con Progreso | 7h |
| SPEC-034 | Gameplay: Nadar + Físicas + Audio | 7h |
| SPEC-035 | UI/UX: Minimapa, Reloj, Pantalla Muerte | 5h |

**Mejoras incluidas:**

- **Inventario expansible**: tecla E, todos los bloques colocables, scroll/paginación
- **Recoger bloques al romper**: el bloque roto se agrega al inventario
- **Modo creativo vs supervivencia**: toggle con C (infinito vs limitado+salud+hambre)
- **Minado con progreso**: tiempo variable por dureza (stone 1.5s, dirt 0.5s, bedrock infinito)
- **Indicador visual de minado**: overlay de grietas sobre el bloque
- **Nadar**: flotabilidad, velocidad reducida, flotación en agua
- **Daño por caída**: respawn o daño si cae >N bloques sin volar
- **Sprint con stamina**: barra que se regenera, limita tiempo de carrera
- **Crouch** (Ctrl): velocidad reducida, anti-caída de bordes, paso 1 bloque
- **Audio procedural Web Audio API**: romper (pitch por material), colocar, pasos, salto, splash, ambiente cueva
- **Minimapa**: esquina superior derecha, biomas cercanos con colores
- **Reloj/indicador de hora**: fase del día en HUD
- **Pantalla de muerte/respawn**: botón explícito en vez de respawn silencioso
- **Distancia al spawn**: indicador en HUD

---

### Fase 5 — Performance (Impacto medio, esfuerzo alto)

**Specs**: SPEC-036, SPEC-037  
**Estimación**: 15 horas  
**Impacto visual**: Medio (impacto en performance: alto)

| Spec | Título | Horas |
|------|--------|-------|
| SPEC-036 | Greedy Meshing + AO Optimization | 7h |
| SPEC-037 | Web Worker Chunk Generation + LOD | 8h |

**Mejoras incluidas:**

- **Greedy meshing real**: fusionar caras adyacentes del mismo bloque en quads grandes
- **AO computation optimization**: cache de vecinos, cálculo incremental
- **Web Worker para generación**: mover `chunk.generate()` a worker thread
- **LOD por distancia**: chunks lejanos con menos detalle
- **Frustum culling mejorado**: optimización por chunk
- **Tone mapping**: ACESFilmicToneMapping para colores más cinematográficos
- **Luces puntuales**: para torches, lanterns, lava emisiva en cuevas

---

## Dependencias entre fases

```
Fase 1 (SPEC-025, 026, 027) — sin dependencias
    ↓
Fase 2 (SPEC-028, 029) — depende de SPEC-025 (AO + color variation)
    ↓
Fase 3 (SPEC-030, 031, 032) — depende de SPEC-028 (nuevos bloques)
    ↓
Fase 4 (SPEC-033, 034, 035) — depende de SPEC-028 (nuevos bloques)
    ↓
Fase 5 (SPEC-036, 037) — depende de SPEC-025 (AO), SPEC-036 → SPEC-037
```

### Dependencias específicas

| Spec | Depende de |
|------|-----------|
| SPEC-025 | — |
| SPEC-026 | — |
| SPEC-027 | — |
| SPEC-028 | SPEC-025 |
| SPEC-029 | SPEC-028 |
| SPEC-030 | SPEC-028 |
| SPEC-031 | SPEC-028 |
| SPEC-032 | SPEC-026 |
| SPEC-033 | SPEC-028 |
| SPEC-034 | SPEC-033 |
| SPEC-035 | SPEC-026 |
| SPEC-036 | SPEC-025 |
| SPEC-037 | SPEC-036 |

---

## Ejecución con Harness

### Comando principal

```bash
# Ejecutar una spec específica
/cascade-dev SPEC-025

# Ejecutar todas las specs en loop (orden por dependencias)
/cascade-dev --loop

# Ejecutar con skill jard-code (paralelización + caching)
@jard-code SPEC-025
```

### Orden de ejecución recomendado

1. **SPEC-025** (AO + color variation) — foundation visual
2. **SPEC-026** (sky overhaul) — independiente, alto impacto
3. **SPEC-027** (water animation) — independiente, alto impacto
4. **SPEC-028** (nuevos bloques) — depende de 025
5. **SPEC-029** (árboles variados) — depende de 028
6. **SPEC-030** (village + temple) — depende de 028
7. **SPEC-031** (mineshaft + monument + nuevas) — depende de 028
8. **SPEC-032** (nubes) — depende de 026
9. **SPEC-033** (inventario + minado) — depende de 028
10. **SPEC-034** (nadar + físicas + audio) — depende de 033
11. **SPEC-035** (UI/UX) — depende de 026
12. **SPEC-036** (greedy meshing) — depende de 025
13. **SPEC-037** (web worker + LOD) — depende de 036

### Validación por spec

Cada spec debe pasar:
- **Lint**: sin errores de sintaxis (vanilla JS, sin linter formal → validación manual)
- **Build**: abrir `jardvoxel.html` en navegador sin errores de consola
- **Performance**: 60fps target con RENDER_DIST=5
- **Visual**: verificación manual de la mejora implementada

---

## Catálogo completo de mejoras

### 1. Experiencia de Juego

#### 1.1 Gameplay core
- [ ] Inventario expansible (tecla E, todos los bloques colocables)
- [ ] Recoger bloques al romper (agregar al inventario)
- [ ] Modo creativo vs supervivencia (toggle C)
- [ ] Velocidad de romper variable (tiempo por dureza)
- [ ] Indicador visual de progreso de minado (grietas)

#### 1.2 Física y movimiento
- [ ] Nadar en agua (flotabilidad, velocidad reducida)
- [ ] Daño por caída
- [ ] Sprint con stamina (barra regenerativa)
- [ ] Crouch (Ctrl) — velocidad reducida, anti-caída, paso 1 bloque

#### 1.3 Audio
- [ ] Sonidos procedurales Web Audio API (romper, colocar, pasos, salto, splash, cueva)

#### 1.4 UI/UX
- [ ] Minimapa (biomas cercanos con colores)
- [ ] Reloj/indicador de hora en HUD
- [ ] Coordenadas de spawn + distancia
- [ ] Pantalla de muerte/respawn con botón explícito

### 2. Bloques con Diseños Detallados

#### 2.1 Nuevos bloques (20)
- [ ] Oak Leaves (dark) — verde oscuro
- [ ] Birch Wood — blanco
- [ ] Spruce Wood — marrón oscuro
- [ ] Moss — verde musgo (cuevas/pantanos)
- [ ] Mycelium — gris-violeta (swamp)
- [ ] Obsidian — negro azulado (cerca de lava)
- [ ] Lapis Ore — azul con vetas
- [ ] Redstone Ore — rojo oscuro
- [ ] Emerald Ore — verde brillante (montañas, raro)
- [ ] Netherrack — rojo oscuro (lava lakes)
- [ ] Basalt — negro (cuevas profundas)
- [ ] Amethyst — púrpura (cuevas raras)
- [ ] Bookshelf — planks + líneas (villages)
- [ ] Lantern — amarillo cálido (emite luz)
- [ ] Torch — naranja (emite luz, colocable)
- [ ] TNT — rojo (bloque especial)
- [ ] Sponge — amarillo (absorbe agua)
- [ ] Pumpkin — naranja (vegetación autumn)
- [ ] Melon — verde claro (vegetación jungle)
- [ ] Bamboo — verde claro delgado (jungle)

#### 2.2 Diseños más detallados (sin texturas externas)
- [ ] Variación de color por noise (hash(x,y,z) * ±5%)
- [ ] Color por cara diferenciado (grass: top/side/bottom)
- [ ] Patrones procedurales en vertex colors (ores con vetas)
- [ ] AO (Ambient Occlusion) aproximado
- [ ] Sub-patterns (bricks, cobblestone, sandstone con líneas/mortero)

#### 2.3 Árboles más variados
- [ ] Roble (forest/plains) — copa redondeada asimétrica
- [ ] Jungla (jungle) — tronco 2x2, altura 8-12, vines
- [ ] Abeto/pino (taiga) — copa cónica
- [ ] Manglar (mangrove) — raíces visibles, copa dispersa
- [ ] Muerto (swamp) — sin hojas, ramas extendidas
- [ ] Savanna (savanna) — tronco grueso, copa plana

### 3. Cielo

#### 3.1 Sol y Luna
- [ ] Mesh de sol (esfera emisiva amarilla)
- [ ] Mesh de luna (esfera grisácea)
- [ ] Glow/halo del sol (sprite semi-transparente)

#### 3.2 Estrellas
- [ ] Campo de estrellas (~800 puntos THREE.Points)
- [ ] Fade in/out con dayFactor
- [ ] Vía láctea sutil (banda más densa)

#### 3.3 Nubes
- [ ] Capa de nubes procedurales (noise en canvas)
- [ ] Movimiento con viento
- [ ] Color dinámico (blancas/rosadas/grises)
- [ ] Nubes volumétricas simples (múltiples planos)

#### 3.4 Gradiente de cielo
- [ ] Gradiente vertical (horizonte claro, cenit oscuro)
- [ ] Colores de atardecer/amanecer (naranja/rosado)
- [ ] Niebla atmosférica alineada con horizonte

#### 3.5 Ciclo día/noche mejorado
- [ ] Duración configurable (tecla debug)
- [ ] Fases visuales (dawn, morning, noon, afternoon, dusk, twilight, night)
- [ ] Sombras dinámicas (largas al amanecer/atardecer)

### 4. Agua

#### 4.1 Animación de olas
- [ ] Olas con sin/cos en vertex position Y
- [ ] Crestas blancas en máximos de ola

#### 4.2 Material mejorado
- [ ] Transparencia gradual (profundidad)
- [ ] Color por profundidad (turquesa → azul oscuro)
- [ ] Reflexión simple (envMap o fake)
- [ ] Fresnel effect (reflectante en rasantes)

#### 4.3 Flujo
- [ ] Dirección de flujo visual en ríos
- [ ] Corrientes que afectan al jugador

#### 4.4 Efectos de superficie
- [ ] Línea de costa (transición agua-arena)
- [ ] Hielo flotante en frozen_ocean
- [ ] Goteo/partículas en cuevas con aquifer

#### 4.5 Agua subterránea
- [ ] Color diferente para agua de cueva
- [ ] Tinte verdoso en swamp, azulado en stone

### 5. Estructuras

#### 5.1 Village (mejorar existente)
- [ ] Casas con detalle (puertas, ventanas, chimeneas, techos a dos aguas)
- [ ] Caminos de gravel/cobblestone
- [ ] Plaza central (pozo de agua o farol)
- [ ] Vallas alrededor de casas
- [ ] 3-4 plantillas de casas distintas
- [ ] Faroles en postes (iluminación nocturna)

#### 5.2 Temple (mejorar existente)
- [ ] Entrada visible
- [ ] Cámara con tesoro + trampas
- [ ] Pirámide escalonada mesoamericana
- [ ] Pilares decorativos en esquinas
- [ ] Escaleras de acceso entre capas
- [ ] Bandera/estandarte en la cima

#### 5.3 Mineshaft (mejorar existente)
- [ ] Túneles ramificados (2-3 bifurcaciones)
- [ ] Rieles y vagonetas decorativas
- [ ] Cofres de loot con minerales
- [ ] Soportes detallados (postes + viga superior)
- [ ] Torches en paredes cada N bloques
- [ ] Conexión con cuevas naturales

#### 5.4 Monument (mejorar existente)
- [ ] Forma de templo marino (cúpula o techo piramidal)
- [ ] Pilares internos decorativos
- [ ] Canales de agua internos
- [ ] Tamaño 9x9+ con múltiples niveles
- [ ] Arco de entrada visible

#### 5.5 Nuevas estructuras (10)
- [ ] Shipwreck (ocean) — barco hundido con cofre
- [ ] Igloo (tundra/snow) — cúpula con cámara subterránea
- [ ] Desert Well (desert) — pozo de sandstone 3x3
- [ ] Ice Spike (frozen ocean/tundra) — pico de packed_ice
- [ ] Boulder (mountain) — roca de granite/diorite/andesite
- [ ] Swamp Hut (swamp) — cabaña sobre pilotes
- [ ] Jungle Temple (jungle) — mossy_cobble con trampas
- [ ] Ruined Portal (cualquiera) — marco de obsidian con lava
- [ ] Coral Reef (ocean cálido) — bloques decorativos de coral
- [ ] Forest Rock (forest) — formación de mossy_stone/moss

### 6. Mejoras Técnicas

#### 6.1 Mesher
- [ ] Greedy meshing real (fusionar caras adyacentes)
- [ ] AO optimization (cache de vecinos)
- [ ] Color variation por posición (hash)

#### 6.2 Iluminación
- [ ] Luces puntuales (torches, lanterns, lava)
- [ ] Lava emisiva (naranja en cuevas)
- [ ] Tone mapping ACESFilmic

#### 6.3 Render distance y performance
- [ ] Frustum culling mejorado
- [ ] LOD por distancia (chunks lejanos menos detalle)
- [ ] Web Worker para generación de chunks

---

## Métricas de éxito

| Métrica | Actual | Objetivo | Estado |
|---------|--------|----------|--------|
| Bloques totales | 157 | 60+ | ✅ Superado |
| Tipos de árboles | 6 | 6 | ✅ |
| Tipos de estructuras | 14 | 14+ | ✅ |
| FPS (RENDER_DIST=5) | ~60 | 60+ | ✅ (greedy meshing + worker) |
| Vertex count por chunk | Reducido | Reducido (greedy meshing) | ✅ |
| Stutter de generación | No (Web Worker) | No (Web Worker) | ✅ |
| Elementos de cielo | Sol + luna + estrellas + nubes + gradiente | Sol + luna + estrellas + nubes + gradiente | ✅ |
| Animación de agua | Olas + profundidad + fresnel | Olas + profundidad + fresnel | ✅ |
| Audio | Web Audio API procedural + ChillTune 8-bit | Web Audio API procedural | ✅ Superado |
| Mecánicas de gameplay | 30+ (tools, armor, enchanting, fishing, nether, redstone, brewing, shields, achievements, anvil, maps) | 10+ | ✅ Superado |
| Tone mapping | ACESFilmic | ACESFilmic | ✅ |
| Point lights | 8 dinámicos (torches/lanterns) | Luces puntuales | ✅ |
| LOD | 3 niveles por distancia | LOD por distancia | ✅ |
| Bug audit | 10/10 resueltos | 0 bugs pendientes | ✅ |
| Worker seed sync | Seed pasada via postMessage | Seed consistente | ✅ (BUG-001) |
| Structure placement | force + _forcePlace flag | Estructuras completas | ✅ (BUG-002) |
| Survival inventory | Decrementa al colocar | Bloques finitos | ✅ (BUG-003) |
| Meshing efficiency | isCrossChunk skip | -30-50% vertices | ✅ (BUG-005) |
| 2D noise optimization | noise2D/fbm2D + cache | Sin waste 3D | ✅ (BUG-010) |
| Módulos JS | 28 archivos modulares | Monolito | ✅ Superado |
| Specs completadas | 42 (SPEC-025 a SPEC-066) | 13 | ✅ Superado |

---

*Documento generado: 2026-06-25*  
*Actualizado: 2026-07-01 — v4.2.0 (SPEC-057 a SPEC-066) completado*  
*Desarrollo: Jard Dev Harness (`/cascade-dev`, `@jard-code`)*
