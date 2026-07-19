# SPEC-099: Sistema de Bienestar y Relajación — JardVoxel Zen Garden

**Fecha:** 2026-06-28  
**Autor:** ja  
**Estado:** ✅ Completado  
**Prioridad:** Alta  
**Estimación:** 24 horas  
**Versión:** 7.0.0 — Wellness & Mindfulness Update

---

## 1. Visión Expandida

Transformar JardVoxel desde un sandbox de supervivencia hacia una **experiencia inmersiva de bienestar digital** que combina exploración procedural, música adaptativa, paisaje sonoro 3D y un mundo que responde emocionalmente al jugador. Inspirado en Headspace, Shinrin-yoku (baño de bosque), y principios de diseño japonés (Ma, Wabi-sabi, Komorebi).

### Diferenciador Clave vs Minecraft/Voxel Tradicional

| Aspecto | Tradicional | JardVoxel Zen |
|---------|-------------|---------------|
| Objetivo | Supervivencia, combate | Relajación, contemplación |
| Ritmo | Urgencia, recursos | Pausado, sin presión |
| Progresión | Logros, poder | Descubrimiento, transformación |
| Música | Estática o ausente | Adaptativa 8-bit + 3D soundscape |
| Mundo | Estático | Vivo, resonante, evolutivo |
| UI | Información constante | Minimalista, desaparece |
| Recompensas | Items, XP | Momentos memorables |

---

## 2. Arquitectura del Sistema (7 Capas)

```
CAPA 7: Diario de Exploración (Memoria Emocional)
         ↓
CAPA 6: Sistema de Resonancia (Adaptación Procedural)
         ↓
CAPA 5: Espacios de Meditación (Lugares Contemplativos)
         ↓
CAPA 4: Mundo Vivo (Respuesta Sutil a Acciones)
         ↓
CAPA 3: Paisaje Sonoro 3D ✅ (AmbientSoundManager)
         ↓
CAPA 2: Música Adaptativa ✅ (ChillTuneEngine)
         ↓
CAPA 1: Generación Procedural ✅ (WorldGenPipeline v6.0)
```

---

## 3. Sistemas Existentes a Potenciar

### 3.1 ChillTuneEngine (SPEC-057, SPEC-083) ✅

**Capacidades actuales:**
- 7 estados musicales (exploring, building, mining, combat, night, underwater, idle)
- 15 biomas con escalas modales (BIOME_SCALES)
- 4 fases de tiempo con modulación BPM
- 3 tipos de clima con atenuación
- 7 event stingers
- Crossfade 2s entre biomas

**Mejoras propuestas:**

#### 3.1.1 Modo Contemplación
```javascript
contemplation: {
  bpm: 40,
  scale: 'pentatonic',
  layers: ['drone'],
  droneRoot: 0,
  filterFreq: 600,
  trigger: 'player_still_60s_in_meditation_space'
}
```

#### 3.1.2 Transiciones Komorebi
- Detectar canopy denso sobre jugador
- Filtro highpass sutil (luz filtrada)
- Arpeggios cristalinos esporádicos

#### 3.1.3 Ciclo Circadiano Completo
8 fases: dawn, morning, noon, afternoon, dusk, twilight, night, midnight
- Transiciones graduales de 5 minutos
- BPM sigue curva sinusoidal

#### 3.1.4 Música de Aldea Cálida
- Acordes mayores suaves
- Tempo +5 BPM
- Capa "human warmth"

### 3.2 AmbientSoundManager (SPEC-084) ✅

**Capacidades actuales:**
- 10 perfiles de bioma
- Audio posicional 3D (max 16 fuentes)
- Crossfade 2s
- Modulación por clima/indoor/tiempo
- 23 tipos de sonido procedural

**Mejoras propuestas:**

#### 3.2.1 Soundscape Layers
- **Near (0-16m):** Detalles (hojas, insectos, gotas)
- **Mid (16-64m):** Ambientales (viento, aves, agua)
- **Far (64-128m):** Atmosféricos (truenos, eco montaña)

#### 3.2.2 Sonidos de Transformación
- Plantar árbol → whoosh + chimes
- Restaurar zona → coro de aves (fade in 30s)
- Construir camino → pasos lejanos

#### 3.2.3 Reverberación Natural
- Cuevas: 2-4s decay
- Bosques: 0.5-1s difuso
- Montañas: Eco 200-500ms
- Océano: 1-2s húmedo

#### 3.2.4 Ciclo de Fauna
- Dawn: Coro de aves (5-10 fuentes)
- Day: Aves dispersas + insectos
- Dusk: Grillos fade in
- Night: Búhos, grillos, viento

### 3.3 WorldGenPipeline v6.0 ✅

**Mejoras propuestas:**

#### 3.3.1 Espacios Sagrados
- Miradores naturales (PV > 0.7)
- Jardines ocultos (clearings circulares)
- Cascadas (cliff + water)
- Lagos contemplativos
- Templos antiguos

#### 3.3.2 Biomas de Bienestar (3 nuevos)
```javascript
BAMBOO_FOREST: {
  scale: 'pentatonic',
  ambient: ['wind_chimes', 'bamboo_rustle', 'stream'],
  mood: 'zen'
},
CHERRY_BLOSSOM_GROVE: {
  scale: 'lydian',
  ambient: ['petals_falling', 'soft_breeze', 'bells'],
  mood: 'serene'
},
MOSS_GARDEN: {
  scale: 'dorian',
  ambient: ['water_drip', 'stone_echo', 'whispers'],
  mood: 'contemplative'
}
```

#### 3.3.3 Sistema Komorebi
- Detectar densidad de canopy
- Raycast hacia arriba cada 0.5s
- Si >60% bloqueado → efecto komorebi
- Partículas de luz en rayos de sol

---

## 4. Nuevos Sistemas

### 4.1 Sistema de Resonancia

**Archivo:** `jardvoxel-survival-resonance.js`

**Objetivo:** El mundo aprende del jugador y adapta la generación.

**Perfil del jugador:**
```javascript
playerProfile: {
  prefersHeights: 0,      // -1 (cuevas) a 1 (montañas)
  prefersWater: 0,        // -1 (tierra) a 1 (agua)
  prefersForests: 0,      // -1 (abierto) a 1 (denso)
  prefersIsolation: 0,    // -1 (social) a 1 (solitario)
  
  explorationRadius: 0,
  buildingFrequency: 0,
  contemplationTime: 0,
  
  biomesPreferred: [],
  sunrisesWatched: 0,
  sunsetsWatched: 0,
  lakesDiscovered: 0,
  peaksClimbed: 0
}
```

**Modificadores de mundo:**
- Si prefiere bosques → +30% densidad árboles
- Si contemplativo (>5 min/hora quieto) → +40% meadows, +20% lagos
- Si prefiere alturas → +20% altura montañas

**Eventos de resonancia:**
- 5+ amaneceres → generar mirador especial
- 10+ minutos contemplación → jardín oculto
- 20+ árboles plantados → bosque sagrado

### 4.2 Espacios de Meditación

**Archivo:** `jardvoxel-survival-meditation-spaces.js`

**6 tipos de espacios:**

#### 4.2.1 Mirador Natural (Sunrise Vista)
- **Generación:** Pico PV > 0.7, vista 360°
- **Features:** Piedra plana, árbol solitario
- **Audio:** Viento suave, eco montaña
- **Música:** Modo contemplación si quieto >30s
- **Efecto:** UI desaparece, solo cielo

#### 4.2.2 Jardín Zen (Rock Garden)
- **Generación:** Clearing circular en forest
- **Features:** Rocas en patrón, grava, bambú perimetral
- **Audio:** Wind chimes, bambú, agua lejana
- **Música:** Pentatónica, BPM 45
- **Efecto:** Partículas de polen

#### 4.2.3 Cascada Oculta (Waterfall Grotto)
- **Generación:** Cliff + river + cave
- **Features:** Cortina de agua, pool, musgo
- **Audio:** Agua 3D, eco de cueva
- **Música:** Arpeggios acuáticos
- **Efecto:** Niebla, arcoíris

#### 4.2.4 Lago Espejo (Mirror Lake)
- **Generación:** Agua rodeada de árboles
- **Features:** Superficie plana, reflejo cielo
- **Audio:** Silencio, aves lejanas
- **Música:** Drone suave, melodía cada 30s
- **Efecto:** Reflejo tiempo real

#### 4.2.5 Templo Antiguo (Ancient Shrine)
- **Generación:** Ruinas en mystic_grove
- **Features:** Pilares con musgo, altar, velas
- **Audio:** Campanas, whispers, reverb
- **Música:** Lydian, acordes sostenidos
- **Efecto:** Luz dorada

#### 4.2.6 Bosque de Bambú (Bamboo Grove)
- **Generación:** Cluster denso en jungle
- **Features:** Bambú 8-12 bloques, luz verde
- **Audio:** Bambú crujiendo, stream
- **Música:** Pentatónica, arpeggios
- **Efecto:** Komorebi verde

**Probabilidad:** 1% por chunk
**Descubrimiento:** Mensaje sutil al entrar primera vez

### 4.3 Mundo Vivo

**Archivo:** `jardvoxel-survival-living-world.js`

**4 mecánicas de respuesta:**

#### 4.3.1 Plantar Árboles → Aves
- Después de 5 min → 1-3 aves en árbol
- Audio: Canto aumenta gradualmente
- Visual: Nidos, partículas de hojas

#### 4.3.2 Restaurar Zonas → Biodiversidad
- Después de 10 min → flores, mariposas, abejas
- Audio: Insectos, viento
- Música: Transición a lydian

#### 4.3.3 Construir Caminos → Aldeanos
- Paths >20 bloques → NPCs caminan
- Audio: Pasos, conversaciones
- Visual: Aldeanos animados

#### 4.3.4 Cuidar Lagos → Peces
- Lagos mejorados → peces, plantas, libélulas
- Audio: Burbujas, salpicaduras
- Visual: Agua más clara

### 4.4 Diario de Exploración

**Archivo:** `jardvoxel-survival-journal.js`

**Registro automático de:**
- Primer amanecer observado
- Primer atardecer observado
- Bosque favorito (más tiempo)
- Río descubierto
- Especies encontradas
- Tiempo contemplando
- Espacios de meditación descubiertos
- Árboles plantados
- Zonas restauradas

**UI:** Panel accesible con tecla J
**Formato:** Timeline con screenshots automáticos
**Persistencia:** LocalStorage

---

## 5. Diseño Inspirado en Filosofía Japonesa

### 5.1 Shinrin-yoku (Baño de Bosque)
- Bosques densos con canopy completo
- Luz filtrada (komorebi)
- Sonidos de naturaleza envolventes
- Caminatas lentas recompensadas

### 5.2 Ma (Espacio Negativo)
- Silencios en música (15-80% según estado)
- UI minimalista que desaparece
- Espacios vacíos intencionales
- Pausas entre eventos

### 5.3 Wabi-sabi (Belleza Imperfecta)
- Estructuras en ruinas
- Árboles torcidos, rocas con musgo
- Imperfecciones procedurales
- Envejecimiento natural

### 5.4 Komorebi (Luz entre Árboles)
- Sistema de raycast de luz
- Partículas de polvo en rayos
- Filtro highpass en música
- Arpeggios cristalinos

### 5.5 Kanso (Simplicidad)
- UI limpia, sin clutter
- Mecánicas directas
- Estética minimalista
- Colores naturales

---

## 6. Acceptance Criteria

### Funcionales
- [x] AC-01: Modo contemplación activa en espacios de meditación
- [x] AC-02: Sistema de resonancia detecta preferencias cada 5 min
- [x] AC-03: 6 tipos de espacios de meditación generan correctamente
- [x] AC-04: Plantar árbol genera aves después de 5 min
- [x] AC-05: Restaurar zona genera biodiversidad después de 10 min
- [x] AC-06: Diario registra momentos memorables automáticamente
- [x] AC-07: Komorebi activa bajo canopy denso (>60%)
- [x] AC-08: 3 nuevos biomas wellness generan (Zen Garden, Bamboo Grove, Aurora Tundra)
- [x] AC-09: Ciclo circadiano de 8 fases funciona
- [x] AC-10: Soundscape layers (near/mid/far) implementado

### Experiencia
- [ ] AC-11: Jugador reporta sensación de calma después de 10 min
- [ ] AC-12: Descubrir espacio de meditación genera emoción
- [ ] AC-13: Mundo se siente "vivo" y responsivo
- [ ] AC-14: Música no se vuelve repetitiva en 30 min
- [ ] AC-15: UI desaparece naturalmente en momentos contemplativos

### Técnicos
- [x] AC-16: Performance <5% overhead adicional
- [x] AC-17: Resonancia analiza sin lag (async)
- [x] AC-18: Espacios persisten en save/load
- [x] AC-19: Diario ocupa <1MB en localStorage
- [x] AC-20: Compatible con mobile (touch gestures)

---

## 7. Plan de Implementación

### Fase 1: Potenciar Existentes (6h) ✅
- ✅ Modo contemplación en ChillTune
- ✅ Ciclo circadiano 8 fases
- ✅ Soundscape layers en Ambient
- ✅ Komorebi system

### Fase 2: Sistema de Resonancia (4h) ✅
- ✅ PlayerProfile tracking
- ✅ Análisis de comportamiento
- ✅ Modificadores de generación
- ✅ Eventos especiales

### Fase 3: Espacios de Meditación (6h) ✅
- ✅ Generador de 6 tipos
- ✅ Detección de descubrimiento
- ✅ Efectos especiales por tipo
- ✅ Integración con música/audio

### Fase 4: Mundo Vivo (4h) ✅
- ✅ 4 mecánicas de respuesta
- ✅ Timers y tracking
- ✅ Efectos visuales/audio
- ✅ Notificaciones sutiles

### Fase 5: Diario de Exploración (2h) ✅
- ✅ UI del diario (8 tabs: Todo, Biomas, Estructuras, Civilizaciones, Lore, Wellness, Hitos, Stats)
- ✅ Registro automático
- ✅ Persistencia (LocalStorage + save/load)

### Fase 6: Biomas Nuevos (2h) ✅
- ✅ Zen Garden (zen_garden)
- ✅ Bamboo Grove (bamboo_grove) — con bamboo tree type + placeBamboo generator
- ✅ Aurora Tundra (aurora_tundra)
- ✅ Biome fingerprints para los 3 biomas wellness

**Total:** 24 horas — completado

---

## 8. Métricas de Éxito

| Métrica | Target | Medición |
|---------|--------|----------|
| Tiempo promedio de sesión | >30 min | Analytics |
| Espacios descubiertos | >3 en 1 hora | Diario |
| Momentos contemplativos | >5 min/sesión | Tracking |
| Satisfacción reportada | >8/10 | Survey |
| Retorno al juego | >60% en 7 días | Analytics |
| Árboles plantados | >10/sesión | Tracking |
| Amaneceres observados | >2/sesión | Tracking |

---

## 9. Archivos a Crear/Modificar

### Nuevos ✅
- `jardvoxel-survival-resonance.js` (300 líneas) ✅
- `jardvoxel-survival-meditation-spaces.js` (400 líneas) ✅
- `jardvoxel-survival-living-world.js` (350 líneas) ✅
- `jardvoxel-survival-journal.js` (250 líneas) ✅
- `jardvoxel-survival-komorebi.js` (150 líneas) ✅

### Modificar ✅
- `jardvoxel-survival-chilltune.js` (+200 líneas) ✅
- `jardvoxel-survival-ambient-sound.js` (+150 líneas) ✅
- `jardvoxel-survival-engine.js` (+100 líneas) ✅
- `jardvoxel-survival-biome-identity.js` (+40 líneas biome fingerprints) ✅
- `jardvoxel-survival-tree-personality.js` (+40 líneas bamboo tree type) ✅
- `jardvoxel-survival-gameplay.js` (+150 líneas) ✅
- `jardvoxel-survival.html` (+120 líneas UI + journal tabs) ✅

**Total:** ~2200 líneas nuevas

---

## 10. Resultado Esperado

JardVoxel se convierte en un **jardín digital vivo** donde:
- La música responde a tu estado emocional
- El mundo aprende de tus preferencias
- Cada sesión genera momentos únicos y memorables
- La exploración es una forma de meditación activa
- El tiempo se siente diferente (más lento, más presente)
- Regresas no por logros, sino por la experiencia

**"Un refugio digital para desconectar del estrés y reconectar contigo mismo"**
