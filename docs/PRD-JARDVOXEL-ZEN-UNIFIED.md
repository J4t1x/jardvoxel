# PRD: JardVoxel Zen — Experiencia Unificada de Bienestar

**Versión:** 8.0.0  
**Fecha:** 2026-06-29  
**Autor:** ja  
**Estado:** Borrador  

---

## 1. Problema

`jardvoxel-survival.html` (4994 líneas) y `jardvoxel.html` (2225 líneas) han crecido demasiado en complejidad. El survival incluye mobs, nether, brewing, enchanting, anvil, shields, fishing, redstone, trading, quests, NPCs, civilizaciones — sistemas que contradicen la filosofía wellness de SPEC-099. El modo open world es simple pero sin los sistemas wellness.

**Necesidad:** Una versión única que integre lo mejor del core motor + todos los sistemas wellness, sin el peso de mecánicas de supervivencia/combate.

---

## 2. Visión

Un único archivo `jardvoxel-zen.html` que ofrezca la experiencia wellness pura: explorar, construir, contemplar. Sin mobs, sin hambre, sin combate, sin muerte. Solo el mundo, la música, y los sistemas de bienestar.

**Tagline:** "Un refugio digital para desconectar del estrés"

---

## 3. Qué Se Quita (Sistemas Eliminados)

| Sistema | Razón |
|---------|-------|
| MobManager | Sin combate, sin enemigos |
| HealthHungerSystem | Sin hambre, sin daño, sin muerte |
| Nether/PortalManager | Sin dimensiones hostiles |
| BrewingManager | Sin pociones |
| Enchanting/XP | Sin progresión de combate |
| AnvilManager | Simplificar crafteo |
| ShieldManager | Sin combate |
| FishingManager | No esencial para wellness |
| RedstoneManager | Complejidad innecesaria |
| VillagerManager/Trading | Sin economía |
| QuestManager | Sin misiones de combate |
| EventManager | Sin eventos hostiles |
| AIClient/NPCMemory/Conversation | Sin NPCs complejos |
| CivilizationSystem | Sin civilizaciones |
| NarrativeStructures/Lore | Simplificar |
| EquipmentManager | Sin herramientas/armadura |
| FurnaceManager | Sin fundición |
| WeatherManager (tormentas) | Solo clima suave |
| DeathScreen | Sin muerte |
| Mining hardness | Construcción libre, sin minado tedioso |

---

## 4. Qué Se Conserva (Core Motor)

### Del motor base (`jardvoxel-survival-engine.js`)
- WorldGenPipeline v6.0 (Simplex Noise, biomas, terrain)
- BIOMES, BIOME_COLORS, WORLD_MIN_Y, SEA_LEVEL
- 19+ biomas incluyendo los 3 wellness (Zen Garden, Bamboo Grove, Aurora Tundra)

### De gameplay (`jardvoxel-survival-gameplay.js`)
- SurvivalWorld (chunk management, mesher, water)
- PlayerController (movimiento, cámara, vuelo creativo)
- Inventory (hotbar, creativo mode)
- DayNightCycle (ciclo sol/luna, sky dome, estrellas)
- GameAudio (Web Audio API básico)

### De features (`jardvoxel-survival-features.js`)
- generateChunkWithFeatures (árboles, vegetación, estructuras pasivas)

### De blocks (`blocks-registry.js`)
- MC_BLOCKS, BLOCK, ALL_BLOCK_COLORS, ALL_BLOCK_NAMES
- ALL_PLACEABLE_BLOCKS (construcción libre)

### De mesher (`jardvoxel-survival-mesher.js`)
- Greedy meshing, water mesh, AO

### De save (`jardvoxel-survival-save.js`)
- SaveManager (persistencia de mundo + wellness)

### De particles (`jardvoxel-survival-particles.js`)
- ParticleSystem (efectos visuales no combate)

### De visual (`jardvoxel-survival-*.js`)
- PostprocessingManager (bloom, tonemapping)
- ShadowManager (sombras suaves)
- VolumetricFog (niebla atmosférica)
- WaterMaterialManager (agua transparente)
- InteriorLightingManager (luz interior cálida)
- AmbientParticleSystem (partículas por bioma)
- ForestCanopyManager (canopy visual)
- CharacterGenerator + CharacterAnimator (cuerpo jugador)
- ThirdPersonCamera (cámara 3ra persona)

### De UI (`jardvoxel-survival-ui.js`)
- UIManager, getPixelFontCSS

### De bioma (`jardvoxel-survival-biome-identity.js`)
- BiomeIdentityManager (identidad visual por bioma)

---

## 5. Qué Se Integra (Sistemas Wellness — SPEC-099)

### 5.1 ChillTuneEngine (`jardvoxel-survival-chilltune.js`)
- 7 estados musicales + modo contemplación
- 15+ biomas con escalas modales
- Ciclo circadiano 8 fases
- Transiciones komorebi
- Crossfade 2s entre biomas

### 5.2 AmbientSoundManager (`jardvoxel-survival-ambient-sound.js`)
- 10+ perfiles de bioma
- Audio posicional 3D
- Soundscape layers (near/mid/far)
- Ciclo de fauna (dawn/day/dusk/night)
- Reverberación natural por bioma

### 5.3 KomorebiSystem (`jardvoxel-survival-komorebi.js`)
- Raycast de densidad de canopy
- Partículas de luz
- Efectos de audio/música

### 5.4 ResonanceSystem (`jardvoxel-survival-resonance.js`)
- PlayerProfile tracking
- Análisis de comportamiento
- Modificadores de generación
- Eventos especiales

### 5.5 MeditationSpaceGenerator (`jardvoxel-survival-meditation-spaces.js`)
- 6 tipos: Vista, Zen Garden, Cascada, Lago Espejo, Templo, Bamboo Grove
- Detección de descubrimiento
- Efectos especiales

### 5.6 LivingWorldSystem (`jardvoxel-survival-living-world.js`)
- Árboles → Aves
- Restauración → Biodiversidad
- Caminos → Aldeanos
- Lagos → Peces

### 5.7 ExplorationJournal (`jardvoxel-survival-journal.js`)
- Registro automático de momentos
- UI con tabs (Biomas, Wellness, Hitos, Stats)
- Persistencia localStorage

---

## 6. Diseño UI/UX Wellness

### Principios
- **Ma (espacio negativo):** UI minimalista, desaparece tras inactividad
- **Kanso (simplicidad):** Solo información esencial
- **Komorebi:** Luz filtrada como tema visual

### Elementos UI
- **Loading screen:** Gradiente suave verde/violeta, spinner breathing
- **HUD:** FPS + coords + bioma (auto-hide tras 10s inactividad)
- **Hotbar:** 9 slots, modo creativo (recursos infinitos)
- **Reloj:** Esquina superior derecha, formato día/noche
- **Minimapa:** Circular, esquina superior derecha
- **Pause screen:** Opciones: Continuar, Settings, Diario (J)
- **Settings:** Tabs: Video, Audio, Controles, Wellness
- **Journal panel:** Tecla J, tabs: Biomas, Wellness, Hitos, Stats
- **Notificaciones:** Toast sutiles para descubrimientos

### Paleta de colores
- Fondo: `#0a1a12` → `#0d1a2a` (gradiente noche wellness)
- Acento primario: `#7C3AED` (violeta)
- Acento secundario: `#00ff88` (verde zen)
- Texto: `#d0d0d8` (gris claro)
- Texto secundario: `#8888aa` (gris azulado)

### Auto-hide UI
- HUD desaparece tras 10s sin movimiento
- Reaparece al mover mouse/tecla
- En espacios de meditación: UI completamente oculta
- Solo queda crosshair sutil

---

## 7. Mecánicas de Juego

### 7.1 Movimiento
- WASD + mouse (PointerLock) en desktop
- Touch joysticks en mobile
- Vuelo creativo (doble tap espacio)
- Sin daño por caída, sin agua ahogando
- Sprint suave (Shift)

### 7.2 Construcción
- Modo creativo: bloques infinitos
- Sin minado con hardness timer — break instantáneo
- Place/break con click izquierdo/derecho
- Inventario completo accesible (E)
- Hotbar con 9 slots
- Sin herramientas, sin armadura

### 7.3 Día/Noche
- Ciclo de 20 minutos (configurable)
- 8 fases: dawn, morning, noon, afternoon, dusk, twilight, night, midnight
- Estrellas nocturnas
- Niebla atmosférica dinámica
- Sin mobs nocturnos

### 7.4 Clima
- Solo lluvia suave y nieve ligera
- Sin tormentas, sin rayos
- Transiciones graduales

### 7.5 Agua
- Animación de olas
- Transparencia
- Sin nado con oxígeno — flotación automática
- Buceo libre sin límite

---

## 8. Arquitectura Técnica

### Imports (estimado ~20 módulos)
```
three
core/jardvoxel-survival-gameplay.js (World, Player, Inventory, DayNight, Audio)
core/jardvoxel-survival-features.js
core/blocks-registry.js
core/jardvoxel-survival-engine.js
core/jardvoxel-survival-mesher.js
core/jardvoxel-survival-save.js
core/jardvoxel-survival-particles.js
core/jardvoxel-survival-chilltune.js
core/jardvoxel-survival-ambient-sound.js
core/jardvoxel-survival-biome-identity.js
core/jardvoxel-survival-ambient-particles.js
core/jardvoxel-survival-forest-canopy.js
core/jardvoxel-survival-character.js
core/jardvoxel-survival-thirdperson.js
core/jardvoxel-survival-ui.js
core/jardvoxel-survival-postprocessing.js
core/jardvoxel-survival-shadow.js
core/jardvoxel-survival-fog.js
core/jardvoxel-survival-water.js
core/jardvoxel-survival-interior-lighting.js
core/jardvoxel-survival-komorebi.js
core/jardvoxel-survival-resonance.js
core/jardvoxel-survival-meditation-spaces.js
core/jardvoxel-survival-living-world.js
core/jardvoxel-survival-journal.js
```

### Estructura del HTML
```
<head>
  <style> (~300 líneas — UI wellness minimalista)
<body>
  <div id="loading">
  <div id="hud"> (info, block-info, crosshair, controls-hint)
  <div id="hotbar">
  <div id="pause-screen">
  <div id="settings-menu">
  <div id="inventory-panel">
  <div id="journal-panel">
  <div id="touch-controls">
  <script type="module"> (~1500 líneas — ZenGame class)
```

### Estimación de tamaño
- CSS: ~300 líneas
- JS (ZenGame class): ~1500 líneas
- Total: ~1800 líneas (vs 4994 del survival)

---

## 9. Diferencias vs Survival

| Aspecto | Survival (4994 líneas) | Zen Unified (~1800 líneas) |
|---------|----------------------|---------------------------|
| Imports | 55 módulos | ~25 módulos |
| Combate | Mobs, escudos, espadas | Ninguno |
| Progresión | XP, encantamientos, logros | Descubrimiento, diario |
| Peligro | Muerte, hambre, lava | Ninguno |
| Economía | Trading, villager | Ninguna |
| Dimensión | Overworld + Nether | Solo Overworld |
| Crafteo | Mesa 2x2 + 3x3 + horno | Solo mesa 3x3 simplificada |
| UI | Densa, permanente | Minimalista, auto-hide |
| Audio | Música + ambient + SFX combate | Música adaptativa + ambient 3D |
| Wellness | Integrado pero sobre capa combat | Centro de la experiencia |

---

## 10. Acceptance Criteria

### Funcionales
- [ ] AC-01: Modo creativo con bloques infinitos
- [ ] AC-02: Sin mobs, sin daño, sin muerte
- [ ] AC-03: Construcción libre (break instantáneo)
- [ ] AC-04: ChillTuneEngine con modo contemplación
- [ ] AC-05: AmbientSoundManager con soundscape 3D
- [ ] AC-06: Komorebi activa bajo canopy denso
- [ ] AC-07: 6 tipos de espacios de meditación generan
- [ ] AC-08: LivingWorld responde a acciones del jugador
- [ ] AC-09: Journal registra momentos automáticamente
- [ ] AC-10: ResonanceSystem adapta generación al perfil
- [ ] AC-11: Save/Load persiste mundo + wellness
- [ ] AC-12: Touch controls funcionan en mobile
- [ ] AC-13: Settings con tabs (Video, Audio, Controls, Wellness)

### Experiencia
- [ ] AC-14: UI desaparece tras 10s de inactividad
- [ ] AC-15: En espacio de meditación, UI completamente oculta
- [ ] AC-16: Sesión de 30 min se siente relajante
- [ ] AC-17: Descubrir espacio genera emoción
- [ ] AC-18: Música no se vuelve repetitiva en 30 min

### Técnicos
- [ ] AC-19: Performance 60fps en desktop
- [ ] AC-20: Performance 30fps en mobile
- [ ] AC-21: Archivo < 2000 líneas
- [ ] AC-22: Compatible con index.html menu

---

## 11. Plan de Implementación

### Fase 1: PRD + HTML base (esta sesión)
1. Crear PRD (este documento)
2. Crear `jardvoxel-zen.html` con:
   - CSS wellness minimalista
   - Imports del core
   - ZenGame class (init, world, player, UI, input, animate)
   - Integración de sistemas wellness
   - Touch controls
   - Settings simplificados
   - Journal panel

### Fase 2: Testing y pulido
1. Probar en navegador desktop
2. Probar en mobile
3. Verificar todos los AC
4. Actualizar index.html

### Fase 3: Deploy
1. Commit a main
2. Tag v8.0.0-zen-unified
3. Deploy a GitHub Pages

---

## 12. Métricas de Éxito

| Métrica | Target |
|---------|--------|
| Líneas de código | < 2000 |
| Imports | ~25 (vs 55) |
| Tiempo de carga | < 3s |
| FPS desktop | 60 |
| FPS mobile | 30 |
| Tamaño archivo | < 100KB |
| Sistemas wellness | 7/7 integrados |
| Sistemas combat | 0 |

---

## 13. Resultado Esperado

Un único archivo `jardvoxel-zen.html` que:
- Carga rápido (menos imports, menos peso)
- Se siente zen desde el primer momento (UI minimalista)
- Integra todos los sistemas wellness sin peso de combate
- Es mantenible (1800 líneas vs 5000)
- Es la experiencia definitiva de JardVoxel

**"Un refugio digital para desconectar del estrés y reconectar contigo mismo"**
