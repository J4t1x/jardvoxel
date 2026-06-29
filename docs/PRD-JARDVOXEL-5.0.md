# PRD: JardVoxel 5.0 — Dirección Artística y Mundo Vivo

**Fecha:** 28 Junio 2026  
**Versión:** 5.0.0  
**Proyecto:** jard-games/jardvoxel  
**Prioridad:** 🔴 CRÍTICA — Major version upgrade  
**Estado:** ✅ Completado (v5.0.0 — 21 specs SPEC-070 a SPEC-090)  
**Versión anterior:** v4.2.0 (42 specs completadas, 157 bloques, 17 biomas)

---

## 1. Executive Summary

JardVoxel 5.0 es una evolución mayor que transforma el motor de un sandbox voxel funcional en una experiencia con identidad propia. La prioridad deja de ser "replicar Minecraft" para convertirse en construir un mundo Cozy Fantasy con atmósfera cinematográfica, biomas reconocibles a distancia, vegetación con personalidad, arquitectura que cuenta historias, y un ecosistema vivo impulsado por IA.

**Tres pilares fundamentales:**

1. **Dirección Artística** — Iluminación cinematográfica, paleta cálida y consistente, estética Cozy Fantasy Low Poly
2. **Mundo Vivo** — NPCs con memoria, conversaciones naturales, misiones dinámicas, eventos emergentes, civilizaciones antiguas
3. **Rendimiento** — Mantener 60 FPS en navegadores modernos con Three.js, greedy meshing, LOD adaptativo, Web Workers, IA desacoplada

---

## 2. Estado Actual (v4.2.0)

### 2.1 Lo que ya existe

| Sistema | Estado | Archivo |
|---------|--------|---------|
| Generación procedural (17 biomas) | ✅ | `jardvoxel-survival-engine.js` |
| Greedy meshing + AO | ✅ | `jardvoxel-survival-mesher.js` |
| Web Worker chunk gen | ✅ | `jardvoxel-survival-worker.js` |
| LOD 5 niveles + frustum culling | ✅ | `jardvoxel-survival-gameplay.js` |
| Sky dome (sol, luna, estrellas) | ✅ | `jardvoxel-survival-gameplay.js` |
| Agua animada (olas, profundidad) | ✅ | `jardvoxel-survival-mesher.js` |
| Nubes procedurales | ✅ | `jardvoxel-survival-gameplay.js` |
| 14 estructuras (villages, temples, etc.) | ✅ | `jardvoxel-survival-features.js` |
| 6 tipos de árboles | ✅ | `jardvoxel-survival-features.js` |
| Mobs pasivos + hostiles | ✅ | `jardvoxel-survival-mobs.js` |
| Aldeanos con 4 profesiones + trading | ✅ | `jardvoxel-survival-villagers.js` |
| ChillTune música procedural (7 estados) | ✅ | `jardvoxel-survival-chilltune.js` |
| Clima (lluvia, nieve, tormenta) | ✅ | `jardvoxel-survival-weather.js` |
| 157 bloques | ✅ | `blocks-registry.js` |
| Tone mapping ACESFilmic | ✅ | `jardvoxel-survival-gameplay.js` |
| PointLight pool (8 luces dinámicas) | ✅ | `jardvoxel-survival-gameplay.js` |
| Sombras PCFSoft 2048x2048 | ✅ | `jardvoxel-survival-gameplay.js` |

### 2.2 Brechas críticas hacia 5.0

| Brecha | Severidad | Descripción |
|--------|-----------|-------------|
| Sin fog volumétrico | 🔴 ALTA | No hay niebla atmosférica 3D, solo fog lineal básico |
| Sin bloom postprocessing | 🔴 ALTA | No hay EffectComposer/UnrealBloomPass |
| Sin water reflections | 🟡 MEDIA | El agua usa MeshLambertMaterial sin reflejos estilizados |
| Árboles sin personalidad suficiente | 🟡 MEDIA | 6 tipos pero formas genéricas, sin variación por edad/tamaño |
| Biomas no diferenciables a distancia | 🟡 MEDIA | Diferencia solo por color, no por silueta/vegetación/fauna |
| Estructuras sin narrativa | 🟡 MEDIA | 14 tipos pero sin historia procedural asociada |
| NPCs sin memoria | 🔴 ALTA | Aldeanos son entidades estáticas sin estado persistente |
| Sin conversaciones naturales | 🔴 ALTA | Trading UI sin diálogo ni interacción social |
| Sin misiones dinámicas | 🔴 ALTA | No existe sistema de quests procedural |
| Sin eventos emergentes | 🔴 ALTA | El mundo es estático, no reacciona al jugador |
| IA desacoplada no implementada | 🔴 ALTA | No hay servidor de IA ni integración con modelos locales |
| Audio sin reacción a bioma | 🟡 MEDIA | ChillTune reacciona a estado de juego pero no a bioma específico |
| UI sin tipografía pixel | 🟡 MEDIA | UI usa CSS default, no pixel font |
| Sin partículas ambientales por bioma | 🟡 MEDIA | Partículas solo para mining/weather, no ambientales |

---

## 3. Visión y Filosofía

### 3.1 Identidad

JardVoxel no busca ser una réplica de Minecraft. Construye una identidad propia como sandbox voxel centrado en la exploración, la creatividad y un mundo vivo impulsado por IA.

### 3.2 Principios de diseño

1. **La atmósfera sobre el realismo** — Priorizar sensación y ambiente sobre detalle geométrico
2. **La iluminación crea profundidad** — En vez de más polígono, usar luz para generar atmósfera
3. **Cada bioma es reconocible** — Silueta, vegetación, sonido y fauna únicos
4. **El mundo reacciona** — No solo se genera al inicio, evoluciona mientras se explora
5. **El mundo es el protagonista** — UI mínima, información contextual únicamente cuando necesaria
6. **Rendimiento primero** — 60 FPS en navegador, IA en servidor independiente

### 3.3 Estilo visual

- Voxel Low Poly
- Cozy Fantasy
- Iluminación cinematográfica
- Colores cálidos y naturales
- Elementos de fantasía sutiles

**Sensaciones objetivo:**
- Día: relajante y exploratorio
- Noche: misterioso pero no hostil
- Exploración: sorprendente y descubrimiento constante

---

## 4. Paleta de Colores

### 4.1 Sistema de color unificado

 Implementar un sistema de paleta centralizada que garantice consistencia visual. Cada bioma referencia la paleta, no colores hardcoded.

```
VEGETATION
  ├── Greens:     #4A7C3A → #6B9E5A → #8BBF7A (soft, varied, luminous)
  ├── Forest:     #2D5A1F → #3D6B2A → #4D7C35 (dense, dark, layered)
  ├── Prarie:     #7CB85A → #9FD07A → #B8E08A (bright, open, airy)

EARTH
  ├── Dirt:       #8B6F47 → #A0825A → #B8986A (warm browns)
  ├── Sand:       #E8D08A → #F0DCA0 → #D4B86A (slightly golden)
  ├── Rock:       #6A6A78 → #7A7A88 → #5A5A68 (grey-blue tones)

WATER
  ├── Shallow:    #5AC8E8 → #7AD8F0 (turquoise)
  ├── Deep:       #1A4A7A → #0A2A5A (deep blue)
  ├── River:      #4AB8D8 → #6AC8E0 (crystal clear)

LIGHTING
  ├── Dawn:       #FFB07A → #FF9A5A (warm orange)
  ├── Sunset:     #E85A3A → #C04A2A (reddish)
  ├── Night:      #1A1A3A → #0A0A2A (deep blue)
  ├── Torch:      #FFA040 → #FF8020 (warm glow)
  ├── Village:    #FFC060 → #FFA040 (warm community light)
```

### 4.2 Reglas de paleta

- Una captura de pantalla debe ser identificable como JardVoxel
- Prohibido hardcoded colors en vertex data — usar paleta referenciada por bioma
- Variación ±5% por hash de posición (ya existe, mantener)
- Transiciones suaves entre biomas (blend de paleta en fronteras)

---

## 5. Iluminación Cinematográfica

### 5.1 Postprocessing pipeline (NUEVO)

**Spec:** SPEC-070 — Postprocessing Pipeline

Implementar `EffectComposer` con pass chain:

```
EffectComposer
  ├── RenderPass (escena base)
  ├── SSAOPass (Screen Space Ambient Occlusion) — suave, no ruidoso
  ├── UnrealBloomPass — muy ligero (strength: 0.15, radius: 0.4, threshold: 0.85)
  └── OutputPass (tone mapping + color space)
```

**Acceptance criteria:**
- SSAO visible en esquinas y oquedades
- Bloom sutil en antorchas, lava, glowstone, moon
- Sin artifactos visibles en bordes de chunks
- Performance: <3ms overhead por frame
- Toggle de calidad (Alta/Media/Baja) según FPS

### 5.2 Fog volumétrico (NUEVO)

**Spec:** SPEC-071 — Volumetric Fog

Reemplazar `THREE.Fog` lineal con sistema de fog atmosférico:

```
VolumetricFog
  ├── Density por bioma (bosque denso, desierto claro, océano brumoso)
  ├── Color dinámico según hora del día (gradiente con sky dome)
  ├── Altura variable (fog más denso en valles, despejado en montañas)
  ├── Fog en cuevas (oscuridad con partículas de polvo)
  └── Fog en aldeas (humo de chimeneas, calor de fogatas)
```

**Acceptance criteria:**
- Fog visible en horizonte como capa atmosférica
- Densidad varía por bioma (desierto: 0.1, bosque: 0.3, océano: 0.2, cueva: 0.5)
- Color de fog coincide con gradiente de cielo
- Sin impacto en FPS >5%

### 5.3 Sombras suaves mejoradas

**Spec:** SPEC-072 — Soft Shadow Enhancement

Mejorar sombras existentes (PCFSoft 2048x2048):

- Shadow map 4096x4096 para LOD 0
- Shadow bias ajustado para voxel geometry
- Shadow blur por distancia (nítido cerca, suave lejos)
- Cascaded shadow maps (3 cascadas: cerca/medio/lejos)
- Auto-disable en LOD > 1 (ya existe, mantener)

### 5.4 Water reflections estilizados (NUEVO)

**Spec:** SPEC-073 — Stylized Water Reflections

```
WaterMaterial (custom shader)
  ├── Reflexión estilizada (no realista, sky color + silhouettes)
  ├── Fresnel effect mejorado (ya parcialmente implementado)
  ├── Refracción sutil en orillas
  ├── Caustics en fondo (patrón animado por profundidad)
  └── SSR simplificado (screen space, solo sky + bloques cercanos)
```

### 5.5 Iluminación cálida en interiores (NUEVO)

**Spec:** SPEC-074 — Interior Lighting

- Detectar si jugador está bajo techo (bloque sólido sobre cabeza)
- Reducir luz ambiental, aumentar contraste
- Antorchas/fogatas generan PointLight cálido (ya existe pool de 8)
- Ventanas dejan pasar luz direccional (raycast simplificado)
- Fogatas en aldeas emiten luz visible a distancia

---

## 6. Biomas Diferenciables

### 6.1 Sistema de identidad por bioma (NUEVO)

**Spec:** SPEC-075 — Biome Identity System

Cada bioma debe ser reconocible por silueta, no solo por color. Implementar sistema de "bioma fingerprint":

```
BiomeFingerprint
  ├── treeShape: silhouette profile (oak_round, pine_conical, mangrove_roots, dead_twisted)
  ├── vegetationDensity: sparse / normal / dense / very_dense
  ├── rockType: boulders / scattered / cliffs / none
  ├── climate: temperature + humidity (ya existe, exponer visualmente)
  ├── ambientSound: birds / wind / insects / water / silence / crows
  ├── musicMood: calm / mysterious / warm / eerie / epic
  ├── particles: pollen / snowflakes / leaves / mist / dust / fireflies
  └── fauna: passive_mobs + hostile_mobs específicos por bioma
```

### 6.2 Biomas nuevos o mejorados

| Bioma | Cambio | Descripción |
|-------|--------|-------------|
| Plains | Mejorar | Praderas luminosas con flores silvestres, mariposas |
| Forest | Mejorar | Bosques densos con dosel, diferentes alturas de árboles |
| Taiga | Mejorar | Pinos altos y delgados, nieve en suelo, lobos |
| Jungle | Mejorar | Densidad extrema, manglares con raíces, cascadas |
| Desert | Mejorar | Dunas, oasis raros, ruinas enterradas |
| Savanna | Mejorar | Árboles planos (acacia), fauna diversa |
| Swamp | Mejorar | Niebla persistente, árboles muertos, luciérnagas |
| Mountains | Mejorar | Riscos, nieve en picos, águilas |
| Cherry Grove | Mejorar | Pétalos cayendo, árboles rosados |
| Ocean | Mejorar | Arrecifes de coral, kelp, bioluminiscencia nocturna |
| **Mystic Grove** | NUEVO | Bosque mágico con hongos gigantes, partículas brillantes |
| **Autumn Forest** | NUEVO | Hojas naranjas/rojas, caída de hojas, atmósfera melancólica |

### 6.3 Partículas ambientales por bioma (NUEVO)

**Spec:** SPEC-076 — Biome Ambient Particles

```
BiomeParticleSystem
  ├── Plains: pollen (amarillo, lento, 50 partículas)
  ├── Forest: leaves falling (verde/amarillo, 80 partículas)
  ├── Taiga: snowflakes (blanco, 100 partículas)
  ├── Swamp: fireflies (verde-amarillo, brillante, 40 partículas)
  ├── Desert: dust (arena, 60 partículas)
  ├── Mystic Grove: glowing spores (púrpura, 70 partículas)
  ├── Autumn Forest: falling leaves (naranja/rojo, 90 partículas)
  ├── Cherry Grove: petals (rosa, 80 partículas)
  ├── Ocean (night): bioluminescence (azul, 60 partículas)
  └── Caves: dust motes (gris, 30 partículas)
```

---

## 7. Vegetación con Personalidad

### 7.1 Árboles mejorados (NUEVO)

**Spec:** SPEC-077 — Tree Personality System

Reemplazar los 6 tipos actuales con sistema paramétrico:

```
TreeGenerator
  ├── Oak: tronco grueso 3-5m, copa redondeada asimétrica, edad variable (joven/viejo)
  ├── Pine: tronco delgado 5-12m, copa cónica con ramas en espiral
  ├── Mangrove: raíces visibles (3-5 bloques), tronco inclinado, copa dispersa
  ├── Dead: sin hojas, ramas retorcidas, corteza oscura
  ├── Savanna (Acacia): tronco grueso corto, copa plana ancha
  ├── Giant (raro <0.1%): tronco 4x4, altura 20-30m, copa masiva
  ├── Birch: tronco blanco delgado, copa pequeña redondeada
  ├── Cherry: tronco delgado, copa rosada esférica
  ├── Mystic Mushroom: hongo gigante 8-15m, sombrero colorido
  └── Autumn Oak: como oak pero hojas naranjas/rojas
```

**Parámetros por árbol:**
- `age`: joven (más pequeño, copa ligera) → viejo (más grande, copa densa)
- `health`: vivo (hojas llenas) → moribundo (hojas dispersas) → muerto (sin hojas)
- `variation`: rotación aleatoria, asimetría de copa, número de ramas

### 7.2 Vegetación de suelo (NUEVO)

**Spec:** SPEC-078 — Ground Vegetation

```
GroundVegetation
  ├── Tall grass (ya existe, mejorar con sway animation)
  ├── Flowers (8 tipos por bioma, ya parcialmente implementado)
  ├── Ferns (bosques densos)
  ├── Mushrooms (bosques oscuros + mystic grove)
  ├── Berry bushes (comestibles, decoración)
  ├── Vines (cuevas, árboles jungle)
  ├── Lily pads (swamp, agua quieta)
  ├── Dead bushes (desierto, badlands)
  └── Coral fans (océano, arrecifes)
```

### 7.3 Bosques densos con dosel (NUEVO)

**Spec:** SPEC-079 — Forest Canopy System

- Árboles en bosques generan copas que se solapan formando dosel
- Bajo el dosel: luz reducida, fog ligero, partículas de polvo
- Diferentes alturas de árboles crean perfil irregular del bosque
- Senderos naturales entre árboles (espacios sin vegetación)

---

## 8. Arquitectura con Historia

### 8.1 Estructuras narrativas (NUEVO)

**Spec:** SPEC-080 — Narrative Structures

Reemplazar las 14 estructuras actuales con sistema que genera historia procedural:

```
StructureGenerator
  ├── Village (mejorado)
  │     ├── Layout: casas alrededor de plaza central
  │     ├── Well + fogata comunitaria + caminos
  │     ├── Variación: aldea pesquera / agrícola / minera / comercial
  │     ├── NPCs: 3-8 aldeanos con profesiones
  │     ├── Historia: nombre de aldea, edad, evento memorable
  │     └── Loot: cofres con items relacionados a profesión
  ├── Ancient Temple
  │     ├── Arquitectura: piedra musgosa, escaleras, altar central
  │     ├── Historia: deidad olvidada, ritual, maldición
  │     ├── Loot: items raros + libro procedural con lore
  │     └── Peligro: trampas (piso falso, dardos)
  ├── Abandoned Mineshaft (mejorado)
  │     ├── Túneles con soportes de madera deteriorados
  │     ├── Vagonetas, rieles, cofres con minerales
  │     ├── Historia: qué minaban, por qué abandonaron
  │     └── Peligro: derrumbes, mobs hostiles
  ├── Ruined Tower
  │     ├── 3-5 pisos parcialmente destruidos
  │     ├── Escalera de caracol, vista panorámica desde cima
  │     ├── Historia: quién la construyó, qué guardaba
  │     └── Loot: items mágicos raros
  ├── Library (NUEVO)
  │     ├── Estanterías con libros procedurales
  │     ├── Historia: conocimiento perdido, sabio que la habitó
  │     ├── Loot: libros con lore + recetas únicas
  │     └── Ambiente: luz cálida, polvo, silencio
  ├── Observatory (NUEVO)
  │     ├── Cúpula con telescopio, mapas estelares
  │     ├── Historia: astrónomo que descubrió algo
  │     ├── Loot: mapas + items relacionados con navegación
  │     └── Vista: plataforma elevada con vista del bioma
  ├── Camp (NUEVO)
  │     ├── Tiendas de campaña, fogata, suministros
  │     ├── Historia: exploradores, comerciantes, bandidos
  │     ├── NPCs: 1-3 ocupantes (amistosos o hostiles)
  │     └── Loot: comida, herramientas, mapas
  ├── Castle Ruins (NUEVO)
  │     ├── Murallas parcialmente destruidas, torre del homenaje
  │     ├── Historia: reino caído, batalla, tesoro escondido
  │     ├── Loot: armaduras raras + armas encantadas
  │     └── Peligro: mobs hostiles + trampas
  ├── Archaeological Site (NUEVO)
  │     ├── Excavación parcial, fósiles, artefactos
  │     ├── Historia: civilización antigua, descubrimiento
  │     ├── Loot: artefactos únicos + libros de lore
  │     └── Ambiente: polvo, silencio, misterio
  └── Shipwreck (mejorado)
        ├── Casco inclinado parcialmente enterrado
        ├── Historia: ruta comercial, tormenta, tesoro
        ├── Loot: cofres + mapas del tesoro
        └── Ambiente: madera podrida, agua, peces
```

### 8.2 Sistema de lore procedural (NUEVO)

**Spec:** SPEC-081 — Procedural Lore System

```
LoreGenerator
  ├── NameGenerator: nombres para aldeas, personajes, estructuras
  ├── HistoryGenerator: eventos históricos por estructura
  │     ├── founding_event (qué originó la estructura)
  │     ├── decline_event (por qué fue abandonada/destruida)
  │     └── notable_figure (quién la habitó)
  ├── BookGenerator: libros con texto procedural
  │     ├── Lore books (historia del mundo, leyendas)
  │     ├── Recipe books (recetas de crafteo únicas)
  │     ├── Maps (ubicaciones de tesoros)
  │     └── Journals (diarios de NPCs)
  └── LegendSystem: leyendas que circulan entre NPCs
        ├── Cada mundo genera 5-10 leyendas únicas
        ├── Leyendas referencian ubicaciones reales
        └── NPCs pueden contar leyendas en conversación
```

---

## 9. Interfaz de Usuario

### 9.1 UI overhaul (NUEVO)

**Spec:** SPEC-082 — UI Overhaul 5.0

Principios:
- Tipografía pixel (Press Start 2P o similar via Google Fonts)
- Paneles minimalistas con bordes sutiles
- Animaciones discretas (fade in/out, slide suave)
- Iconografía consistente (set de íconos pixel art)
- Información contextual: solo mostrar cuando sea relevante

```
UIComponents
  ├── HUD minimalista
  │     ├── Hotbar (centro inferior, ya existe, rediseñar)
  │     ├── Health/Hunger (ya existe, rediseñar con pixel art)
  │     ├── Minimapa (esquina superior derecha, ya existe)
  │     ├── Clock (ya existe, rediseñar)
  │     ├── Biome indicator (mostrar al entrar a nuevo bioma, fade out)
  │     └── Compass (mostrar al mirar, fade out)
  ├── Diálogos NPC
  │     ├── Panel inferior con retrato pixel art del NPC
  │     ├── Texto con efecto máquina de escribir
  │     ├── Opciones de respuesta (máximo 4)
  │     └── Cerrar con click/ESC
  ├── Quest tracker
  │     ├── Panel lateral derecho (colapsable)
  │     ├── Máximo 3 quests activas visibles
  │     ├── Progreso con barra pixel art
  │     └── Notificación al completar (toast)
  ├── Inventory rediseñado
  │     ├── Grid con slots pixel art
  │     ├── Tooltips con información contextual
  │     ├── Drag & drop suave
  │     └── Categorías: bloques, items, herramientas, comida
  └── Mapa ampliado
        ├── Pantalla completa al abrir
        ├── Marcadores de estructuras descubiertas
        ├── Leyendas conocidas marcadas
        └── Zoom con scroll
```

### 9.2 Animaciones de UI (NUEVO)

- Hotbar: slide horizontal suave al cambiar slot
- Inventory: fade + scale al abrir/cerrar
- Dialog: slide up desde abajo
- Toast: slide in desde derecha, auto-dismiss 4s
- Quest complete: flash dorado + sonido
- Death screen: fade to oscuro + texto centrado

---

## 10. Audio: ChillTune Evolution

### 10.1 Banda sonora procedural expandida (NUEVO)

**Spec:** SPEC-083 — ChillTune 2.0

Evolución del ChillTuneEngine actual (7 estados) a sistema que reacciona a:

```
ChillTuneEngine 2.0
  ├── Game state (ya existe: exploring, building, mining, combat, night, underwater, idle)
  ├── Bioma (NUEVO)
  │     ├── Plains: melodía alegre, tempo medio, pentatonic
  │     ├── Forest: melodía tranquila, tempo lento, dorian
  │     ├── Desert: melodía misteriosa, escala phrygian, percusión ligera
  │     ├── Mountains: melodía épica, tempo variable, lydian
  │     ├── Swamp: melodía inquietante, cromática, drone bajo
  │     ├── Mystic Grove: melodía mágica, lydian + arpegios brillantes
  │     ├── Ocean: melodía serena, tempo lento, aeolian + oleaje
  │     └── Caves: drone oscuro + ecos, sin melodía clara
  ├── Hora del día (NUEVO)
  │     ├── Dawn: melodía suave ascendente
  │     ├── Day: melodía completa
  │     ├── Sunset: melodía nostálgica descendente
  │     └── Night: melodía minimalista + drone
  ├── Clima (NUEVO)
  │     ├── Rain: percusión de lluvia + melodía atenuada
  │     ├── Snow: silencio + tonos altos cristalinos
  │     └── Thunder: silencios + impactos dramáticos
  ├── Exploración (NUEVO)
  │     ├── Descubrir estructura: fanfarria sutil (3 notas)
  │     ├── Entrar bioma nuevo: transición de escala
  │     └── Cuevas profundas: eco + reverb aumentados
  ├── Combate (ya existe, mejorar)
  │     ├── Transición rápida (1s) a modo tensión
  │     ├── Tempo acelerado
  │     └── Return a estado anterior al terminar
  ├── Aldeas (NUEVO)
  │     ├── Melodía cálida con instrumentos suaves
  │     ├── Tempo alegre al acercarse
  │     └── Silencio al entrar a tienda (intimidad)
  └── Eventos especiales (NUEVO)
        ├── Descubrimiento arqueológico: arpegio místico
        ├── Muerte de NPC: silencio + tono grave
        ├── Evento legendario: fanfarria épica
        └── Noche primera en bioma nuevo: melodía única
```

### 10.2 Sonido ambiental por bioma (NUEVO)

**Spec:** SPEC-084 — Ambient Sound System

```
AmbientSoundManager
  ├── Plains: birds (3 tipos), wind suave, insects
  ├── Forest: birds (5 tipos), leaves rustling, distant animals
  ├── Desert: wind fuerte, sand shifting, occasional hawk
  ├── Mountains: wind fuerte, eagle cry, rock falling
  ├── Swamp: frogs, insects, water dripping, crows
  ├── Ocean: waves, seagulls, underwater muffled
  ├── Caves: dripping water, echoes, rock creaking
  ├── Mystic Grove: chimes, ethereal whispers, glowing sounds
  ├── Village: chatter, hammering, laughter, fire crackling
  └── Nether: ambient drone, lava bubbling, distant screams
```

**Implementación:**
- Web Audio API con buffers pre-generados (procedural, sin archivos)
- 3D positional audio para sonidos localizados
- Crossfade entre biomas (2s)
- Volumen ajustable independiente de música

---

## 11. Mundo Vivo — Sistema de IA

### 11.1 Arquitectura de IA desacoplada (NUEVO)

**Spec:** SPEC-085 — AI Server Architecture

```
┌─────────────────┐     WebSocket      ┌──────────────────┐
│   JardVoxel     │ ◄──────────────► │   AI Server      │
│   (Browser)     │                    │   (Node.js)      │
│                 │                    │                  │
│  Game State ────┼─── JSON ──────────►│  LLM Interface   │
│  NPC Actions ◄──┼─── Commands ──────│  State Manager   │
│  Events ────────┼─── Notifications ─│  Quest Engine     │
│                 │                    │  Lore Generator   │
└─────────────────┘                    └──────────────────┘
                                              │
                                    ┌─────────┴─────────┐
                                    │                   │
                              ┌─────▼─────┐      ┌──────▼──────┐
                              │  Ollama   │      │  Cloud API  │
                              │  (Local)  │      │  (Optional) │
                              │  Apple Si │      │             │
                              └───────────┘      └─────────────┘
```

**Protocolo:**
- WebSocket bidireccional
- Game → AI: estado del mundo, posición del jugador, NPCs cercanos, eventos
- AI → Game: respuestas de NPCs, nuevas quests, eventos generados, lore
- Throttling: máximo 1 request/2s para no sobrecargar LLM
- Fallback: si AI server no disponible, NPCs usan diálogo pre-generado

### 11.2 NPCs con memoria (NUEVO)

**Spec:** SPEC-086 — NPC Memory System

```
NPCMemory
  ├── Identity
  │     ├── name (procedural)
  │     ├── profession (farmer, blacksmith, merchant, scholar, guard)
  │     ├── personality (friendly, grumpy, mysterious, cheerful, stoic)
  │     └── backstory (procedural, 2-3 frases)
  ├── Memory
  │     ├── playerInteractions: Map<timestamp, interaction>
  │     ├── relationship: -100 (hostil) → +100 (amistad)
  │     ├── knownFacts: Set<factId> (cosas que sabe del mundo)
  │     ├── preferences: items que le gustan/disgustan
  │     └── questsGiven: lista de misiones otorgadas
  ├── State
  │     ├── mood (happy, sad, angry, scared, neutral)
  │     ├── dailyRoutine (schedule de actividades)
  │     ├── currentActivity (mining, farming, sleeping, talking)
  │     └── location (home, workplace, wandering)
  └── Persistence
        ├── Serialize to IndexedDB (ya existe SaveManager)
        └── Cargar al restaurar partida
```

### 11.3 Conversaciones naturales (NUEVO)

**Spec:** SPEC-087 — Natural Conversation System

```
ConversationManager
  ├── Trigger: click derecho en NPC (ya existe para trading)
  ├── Context enviado a AI Server:
  │     ├── NPC identity + personality + memory
  │     ├── Player recent actions
  │     ├── Current biome + time + weather
  │     ├── Nearby structures + events
  │     └── Active quests
  ├── AI Server genera:
  │     ├── NPC response (texto, máximo 2 frases)
  │     ├── 3-4 player response options
  │     ├── Relationship change
  │     └── Possible quest trigger
  ├── Fallback (sin AI server):
  │     ├── Template-based responses por personality + mood
  │     ├── 20+ templates por tipo de NPC
  │     └── Variación por hash de nombre + día
  └── UI:
        ├── Panel inferior con retrato pixel art
        ├── Texto con efecto typewriter
        ├── Opciones numeradas (1-4)
        └── Scroll si respuesta larga
```

### 11.4 Misiones dinámicas (NUEVO)

**Spec:** SPEC-088 — Dynamic Quest System

```
QuestManager
  ├── Quest Generation
  │     ├── Trigger: conversación con NPC, descubrimiento de estructura, evento
  │     ├── Types:
  │     │     ├── Fetch: traer X items de Y lugar
  │     │     ├── Explore: visitar estructura/ubicación específica
  │     │     ├── Defeat: eliminar N mobs de tipo Z
  │     │     ├── Build: construir estructura con requisitos
  │     │     ├── Escort: acompañar NPC a destino
  │     │     ├── Deliver: llevar item de NPC A a NPC B
  │     │     └── Discover: encontrar sitio arqueológico/ruina
  │     ├── Difficulty scaling: basado en nivel del jugador + equipo
  │     └── Rewards: items, XP, relación con NPC, lore, acceso a área nueva
  ├── Quest State
  │     ├── active: en progreso (tracker visible)
  │     ├── completed: finalizada (recompensa entregada)
  │     ├── failed: tiempo agotado o objetivo destruido
  │     └── abandoned: cancelada por jugador
  ├── Quest Tracker UI
  │     ├── Máximo 5 quests activas
  │     ├── Progreso en tiempo real
  │     ├── Notificación al completar objetivo
  │     └── Marker en mapa para ubicaciones
  └── AI Integration
        ├── AI Server puede generar quests custom basadas en contexto
        ├── Quests únicas por mundo (no repetibles)
        └── Quests pueden desencadenar eventos en cadena
```

### 11.5 Eventos emergentes (NUEVO)

**Spec:** SPEC-089 — Emergent Events System

```
EventManager
  ├── Triggers
  │     ├── Time-based: eclipse, meteor shower, aurora boreal
  │     ├── Player-based: entrar a bioma nuevo, construir grande, minar profundo
  │     ├── NPC-based: muerte de NPC, festival, wedding, dispute
  │     ├── World-based: drought, flood, migration, disease
  │     └── Random: low probability, high impact
  ├── Event Types
  │     ├── Meteor Shower: rocas del cielo con minerales raros (noche)
  │     ├── Migration: manada de animales cruza el bioma
  │     ├── Festival: aldeanos celebran, música especial, comida gratis
  │     ├── Eclipse: oscuridad temporal, mobs especiales aparecen
  │     ├── Aurora: luces en cielo nocturno (biomas fríos)
  │     ├── Earthquake: terreno se modifica, nuevas cuevas expuestas
  │     ├── Trader Caravan: comerciante ambulante con items raros
  │     ├── Lost Traveler: NPC pide ayuda, escort quest
  │     ├── Ancient Discovery: estructura emerge del terreno
  │     └── Legend Reveal: NPC cuenta leyenda que revela ubicación secreta
  ├── Implementation
  │     ├── Probability check cada 5 minutos de juego
  │     ├── Cooldown: mínimo 30 min entre eventos
  │     ├── Max 1 evento activo a la vez
  │     ├── Notificación sutil (no intrusiva)
  │     └── Evento dura 2-10 minutos según tipo
  └── AI Integration
        ├── AI Server puede generar eventos custom
        ├── Eventos pueden iniciar quests
        └── Eventos pueden cambiar estado del mundo permanentemente
```

### 11.6 Civilizaciones antiguas y descubrimientos (NUEVO)

**Spec:** SPEC-090 — Ancient Civilizations

```
AncientCivilizationSystem
  ├── Generation
  │     ├── Cada mundo genera 1-3 civilizaciones antiguas
  │     ├── Cada civilización tiene:
  │     │     ├── Name (procedural)
  │     │     ├── Era (age of stone, age of bronze, age of magic)
  │     │     ├── Culture (builders, warriors, scholars, mystics)
  │     │     ├── Decline reason (war, plague, cataclysm, mystery)
  │     │     └── Remnants (estructuras, artefactos, textos)
  │     └── Distribución: estructuras en biomas específicos
  ├── Discovery
  │     ├── Player encuentra ruinas gradualmente
  │     ├── Cada descubrimiento revela parte de la historia
  │     ├── Artefactos pueden combinarse para revelar más lore
  │     └── Libros encontrados cuentan la historia completa
  ├── Archaeological Sites
  │     ├── Excavación parcial en terreno
  │     ├── Fósiles: esqueletos de criaturas extintas
  │     ├── Artefactos: herramientas, armas, ornamentos únicos
  │     ├── Textos: fragmentos de lenguaje antiguo
  │     └── Cada sitio conecta con la civilización que lo creó
  └── Rewards
        ├── Artefactos únicos (no crafteables)
        ├── Conocimiento: recetas antiguas desbloqueables
        ├── Acceso a estructuras ocultas
        └── Lore: historia completa del mundo
```

---

## 12. Filosofía Técnica

### 12.1 Rendimiento

| Métrica | Target | Medición |
|---------|--------|----------|
| FPS (desktop) | 60 | requestAnimationFrame timestamp |
| FPS (laptop) | 45 | Mismo |
| Chunk gen time | <15ms | Performance.now() |
| Mesh build time | <8ms | Performance.now() |
| Memory (chunks) | <200MB | performance.memory |
| AI request latency | <3s | WebSocket round-trip |
| Initial load | <5s | Navigation timing |

### 12.2 Arquitectura técnica

```
JardVoxel 5.0 Architecture
  ├── Rendering (Browser)
  │     ├── Three.js r170+ (WebGL2)
  │     ├── EffectComposer (SSAO + Bloom)
  │     ├── Greedy Meshing (existente, mantener)
  │     ├── LOD 5 niveles (existente, mantener)
  │     ├── Frustum culling (existente, mantener)
  │     ├── Volumetric fog (nuevo)
  │     └── Cascaded shadows (nuevo)
  ├── World Gen (Web Worker)
  │     ├── PerlinNoise 3D (existente)
  │     ├── WorldGenPipeline (existente, extender)
  │     ├── TreeGenerator paramétrico (nuevo)
  │     ├── StructureGenerator narrativo (nuevo)
  │     └── LoreGenerator (nuevo)
  ├── Gameplay (Main thread)
  │     ├── PlayerController (existente, mantener)
  │     ├── Inventory + Crafting (existente, mantener)
  │     ├── Health/Hunger (existente, mantener)
  │     ├── Mob AI (existente, extender)
  │     ├── NPC Memory (nuevo)
  │     ├── Quest Manager (nuevo)
  │     ├── Event Manager (nuevo)
  │     └── Conversation Manager (nuevo)
  ├── Audio (Web Audio API)
  │     ├── ChillTuneEngine 2.0 (extender)
  │     └── AmbientSoundManager (nuevo)
  ├── AI Server (Node.js, independiente)
  │     ├── WebSocket server
  │     ├── LLM Interface (Ollama / Cloud API)
  │     ├── State Manager (NPC memory, quests, events)
  │     ├── Lore Generator
  │     └── Quest Generator
  ├── Save System (IndexedDB, existente)
  │     ├── World state
  │     ├── NPC memories (nuevo)
  │     ├── Quest states (nuevo)
  │     └── Lore discoveries (nuevo)
  └── UI (DOM + Canvas)
        ├── Pixel font (nuevo)
        ├── Rediseño completo (nuevo)
        └── Dialog system (nuevo)
```

### 12.3 IA desacoplada

- Servidor Node.js independiente (puerto 3001)
- WebSocket para comunicación en tiempo real
- Soporte para Ollama (local, Apple Silicon) y Cloud API (opcional)
- Throttling: máximo 1 request/2s
- Fallback graceful: si server cae, NPCs usan templates
- Estado persistente en servidor (SQLite o JSON)
- Modelos recomendados: Llama 3.2 3B (local), GPT-4o-mini (cloud)

---

## 13. Fases de Implementación

### Fase 1 — Visual Foundations (3 semanas)

**Specs:** SPEC-070 a SPEC-074  
**Estimación:** 60 horas  
**Prioridad:** 🔴 CRÍTICA — Base visual de todo 5.0

| Spec | Título | Horas |
|------|--------|-------|
| SPEC-070 | Postprocessing Pipeline (SSAO + Bloom) | 12h |
| SPEC-071 | Volumetric Fog | 10h |
| SPEC-072 | Soft Shadow Enhancement | 8h |
| SPEC-073 | Stylized Water Reflections | 16h |
| SPEC-074 | Interior Lighting | 14h |

**Acceptance criteria global:**
- Captura de pantalla inmediatamente reconocible como JardVoxel
- 60 FPS mantenidos con postprocessing activo
- Contraste claro entre zonas seguras (cálidas) y peligrosas (oscuras)

---

### Fase 2 — Biomas y Vegetación (3 semanas)

**Specs:** SPEC-075 a SPEC-079  
**Estimación:** 55 horas  
**Prioridad:** 🔴 ALTA — Identidad visual del mundo

| Spec | Título | Horas |
|------|--------|-------|
| SPEC-075 | Biome Identity System | 10h |
| SPEC-076 | Biome Ambient Particles | 8h |
| SPEC-077 | Tree Personality System | 16h |
| SPEC-078 | Ground Vegetation | 10h |
| SPEC-079 | Forest Canopy System | 11h |

**Acceptance criteria global:**
- Cada bioma reconocible por silueta a >100 bloques de distancia
- 2 biomas nuevos (Mystic Grove, Autumn Forest) funcionales
- Partículas ambientales sin impacto >3% FPS

---

### Fase 3 — Arquitectura y Lore (2 semanas)

**Specs:** SPEC-080 a SPEC-081  
**Estimación:** 40 horas  
**Prioridad:** 🟡 MEDIA — Narrativa del mundo

| Spec | Título | Horas |
|------|--------|-------|
| SPEC-080 | Narrative Structures | 24h |
| SPEC-081 | Procedural Lore System | 16h |

**Acceptance criteria global:**
- 4 estructuras nuevas (Library, Observatory, Camp, Castle Ruins, Archaeological Site)
- Cada estructura genera historia procedural única
- Libros con texto procedural legibles en inventario

---

### Fase 4 — UI y Audio (2 semanas)

**Specs:** SPEC-082 a SPEC-084  
**Estimación:** 45 horas  
**Prioridad:** 🟡 MEDIA — Pulido de experiencia

| Spec | Título | Horas |
|------|--------|-------|
| SPEC-082 | UI Overhaul 5.0 | 18h |
| SPEC-083 | ChillTune 2.0 | 15h |
| SPEC-084 | Ambient Sound System | 12h |

**Acceptance criteria global:**
- UI con tipografía pixel, paneles minimalistas
- Música reacciona a bioma + hora + clima + evento
- Sonidos ambientales con crossfade entre biomas

---

### Fase 5 — Mundo Vivo: IA (4 semanas)

**Specs:** SPEC-085 a SPEC-090  
**Estimación:** 100 horas  
**Prioridad:** 🔴 CRÍTICA — Diferenciador clave de JardVoxel

| Spec | Título | Horas |
|------|--------|-------|
| SPEC-085 | AI Server Architecture | 20h |
| SPEC-086 | NPC Memory System | 16h |
| SPEC-087 | Natural Conversation System | 18h |
| SPEC-088 | Dynamic Quest System | 16h |
| SPEC-089 | Emergent Events System | 14h |
| SPEC-090 | Ancient Civilizations | 16h |

**Acceptance criteria global:**
- AI server funcional con Ollama local
- NPCs recuerdan interacciones anteriores
- Conversaciones naturales con opciones de respuesta
- 5+ tipos de quests dinámicas
- Eventos emergentes cada 30-60 min
- 1-3 civilizaciones antiguas por mundo
- Fallback completo sin AI server (templates)

---

## 14. Dependencias y Riesgos

### 14.1 Dependencias técnicas

| Dependencia | Versión | Propósito |
|-------------|---------|-----------|
| Three.js | r170+ | WebGL2, EffectComposer, SSAO, Bloom |
| Ollama | 0.3+ | LLM local para IA |
| Node.js | 20+ | AI server |
| ws | 8+ | WebSocket server |
| Press Start 2P | - | Pixel font (Google Fonts) |

### 14.2 Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Postprocessing demasiado pesado | Media | Alto | Toggle calidad + LOD-based |
| AI server latency alta | Alta | Medio | Throttling + fallback templates |
| Ollama no disponible en destino | Media | Medio | Cloud API fallback |
| Memoria con NPCs persistentes | Media | Medio | LRU cache + IndexedDB |
| Partículas afectan FPS | Baja | Medio | Pool + LOD-based count |
| Volumetric fog incompatible | Baja | Alto | Fallback a fog lineal |

---

## 15. Métricas de Éxito

### 15.1 Métricas técnicas

- FPS sostenido: 60 (desktop), 45 (laptop)
- Memoria: <300MB con 200 chunks + 50 NPCs
- AI latency: <3s (local), <5s (cloud)
- Initial load: <5s
- Save/Load: <2s

### 15.2 Métricas de experiencia

- **Reconocimiento visual:** Captura identificable como JardVoxel en <2s
- **Inmersión bioma:** Jugador identifica bioma por silueta sin UI
- **Engagement NPCs:** >30% jugadores interactúan con NPCs >3 veces
- **Quest completion:** >50% quests iniciadas se completan
- **Eventos:** >1 evento/hora de juego percibido por jugador
- **Lore discovery:** Jugador encuentra >3 estructuras con historia en primera hora

---

## 16. Especificaciones Técnicas Resumidas

| ID | Título | Fase | Horas |
|----|--------|------|-------|
| SPEC-070 | Postprocessing Pipeline | 1 | 12h |
| SPEC-071 | Volumetric Fog | 1 | 10h |
| SPEC-072 | Soft Shadow Enhancement | 1 | 8h |
| SPEC-073 | Stylized Water Reflections | 1 | 16h |
| SPEC-074 | Interior Lighting | 1 | 14h |
| SPEC-075 | Biome Identity System | 2 | 10h |
| SPEC-076 | Biome Ambient Particles | 2 | 8h |
| SPEC-077 | Tree Personality System | 2 | 16h |
| SPEC-078 | Ground Vegetation | 2 | 10h |
| SPEC-079 | Forest Canopy System | 2 | 11h |
| SPEC-080 | Narrative Structures | 3 | 24h |
| SPEC-081 | Procedural Lore System | 3 | 16h |
| SPEC-082 | UI Overhaul 5.0 | 4 | 18h |
| SPEC-083 | ChillTune 2.0 | 4 | 15h |
| SPEC-084 | Ambient Sound System | 4 | 12h |
| SPEC-085 | AI Server Architecture | 5 | 20h |
| SPEC-086 | NPC Memory System | 5 | 16h |
| SPEC-087 | Natural Conversation System | 5 | 18h |
| SPEC-088 | Dynamic Quest System | 5 | 16h |
| SPEC-089 | Emergent Events System | 5 | 14h |
| SPEC-090 | Ancient Civilizations | 5 | 16h |

**Total:** 21 specs | 300 horas | 14 semanas (5 fases)

---

## 17. Orden de Ejecución Recomendado

```
Fase 1 (Semanas 1-3): Visual Foundations
  SPEC-070 → SPEC-072 → SPEC-071 → SPEC-073 → SPEC-074

Fase 2 (Semanas 4-6): Biomas y Vegetación
  SPEC-075 → SPEC-077 → SPEC-078 → SPEC-079 → SPEC-076

Fase 3 (Semanas 7-8): Arquitectura y Lore
  SPEC-081 → SPEC-080

Fase 4 (Semanas 9-10): UI y Audio
  SPEC-082 → SPEC-083 → SPEC-084

Fase 5 (Semanas 11-14): Mundo Vivo
  SPEC-085 → SPEC-086 → SPEC-087 → SPEC-088 → SPEC-089 → SPEC-090
```

**Ejecución con Jard Dev Harness:**
```bash
@jard-code SPEC-070    # Spec individual
@jard-code --loop      # Loop continuo hasta completar fase
/cascade-dev jardvoxel # Desarrollo automatizado
```

---

## 18. Criterios de Aceptación Global — JardVoxel 5.0

- [ ] Captura de pantalla inmediatamente reconocible como JardVoxel
- [ ] 60 FPS sostenido en desktop con postprocessing activo
- [ ] Cada bioma reconocible por silueta sin necesidad de UI
- [ ] 2 biomas nuevos funcionales (Mystic Grove, Autumn Forest)
- [ ] Árboles con personalidad (10 tipos paramétricos)
- [ ] 5 estructuras nuevas con historia procedural
- [ ] Libros procedurales legibles en inventario
- [ ] UI con tipografía pixel y paneles minimalistas
- [ ] Música reacciona a bioma + hora + clima + evento
- [ ] Sonidos ambientales con crossfade entre biomas
- [ ] AI server funcional con Ollama local
- [ ] NPCs con memoria persistente de interacciones
- [ ] Conversaciones naturales con opciones de respuesta
- [ ] 5+ tipos de quests dinámicas
- [ ] Eventos emergentes cada 30-60 min
- [ ] 1-3 civilizaciones antiguas por mundo
- [ ] Fallback completo sin AI server (templates)
- [ ] Save/Load incluye NPCs, quests, lore, eventos
- [ ] 163+ tests existentes siguen pasando
- [ ] Nuevos tests para sistemas 5.0

---

## 19. Documentación Relacionada

- `docs/ARCHITECTURE.md` — Arquitectura técnica del motor (v4.2.0)
- `docs/IMPROVEMENTS-ROADMAP.md` — Roadmap v4.2.0 (42 specs completadas)
- `docs/PRD-CHILLTUNE-MUSIC.md` — PRD ChillTune v1 (base para SPEC-083)
- `docs/PRD-CHUNK-OPTIMIZATION.md` — PRD optimización de chunks
- `docs/BLOCKS.md` — Catálogo de 157 bloques
- `docs/CHANGELOG.md` — Historial de versiones
- `core/README.md` — Estructura de módulos del core

---

**Fin del PRD — JardVoxel 5.0**  
**Total specs:** 21 (SPEC-070 a SPEC-090)  
**Estimación total:** 300 horas / 14 semanas  
**Versión target:** 5.0.0
