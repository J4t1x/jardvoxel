# JardVoxel — PRD: Mobile Playability + Game Menu

**Fecha**: 2026-06-25  
**Autor**: ja  
**Estado**: ✅ Completado (v5.0.0 — SPEC-062 + SPEC-063)  
**Version objetivo**: v5.0.0  
**Specs**: SPEC-062 (Touch Controls), SPEC-063 (Game Menu)

---

## Resumen Ejecutivo

JardVoxel Survival actualmente funciona solo con teclado+mouse en desktop. En dispositivos moviles (celulares/tablets) el juego es injugable: no hay controles touch, no hay menu de configuracion accesible, y la UI no esta optimizada para pantallas tactiles.

Este PRD define dos mejoras complementarias:

1. **Controles touch completos** — Joysticks virtuales + botones de accion + auto-deteccion mobile (SPEC-062, ya documentado en `PRD-TOUCH-JOYSTICK.md`)
2. **Menu de juego** — Pantalla de menu principal con opciones configurables accesible desde pause screen y durante el juego (SPEC-063, nuevo)

### Tabla de features

| Componente | Descripcion | Spec | Estado |
|-----------|-------------|------|--------|
| Joystick izquierdo (movimiento) | Virtual stick analogico para WASD | SPEC-062 | Pendiente |
| Joystick derecho (camara) | Virtual stick para yaw/pitch | SPEC-062 | Pendiente |
| Botones touch (saltar/romper/colocar/sprint/inv) | Botones circulares tactiles | SPEC-062 | Pendiente |
| Auto-deteccion mobile | Activar touch automaticamente | SPEC-062 | Pendiente |
| Menu principal | Pantalla con botones: Jugar, Opciones, Creditos | SPEC-063 | Pendiente |
| Menu de opciones | Tabs: Graficos, Audio, Controles, Gameplay | SPEC-063 | Pendiente |
| Opciones de graficos | Render distance, FOV, clouds, fog, shadows | SPEC-063 | Pendiente |
| Opciones de audio | Volumen master, efectos, ambiente | SPEC-063 | Pendiente |
| Opciones de controles | Sensibilidad, invert Y, dead zone, toggle joysticks | SPEC-063 | Pendiente |
| Opciones de gameplay | Dificultad, auto-save interval, show FPS, show coords | SPEC-063 | Pendiente |
| UI responsive | HUD adaptativo para pantallas pequenas | SPEC-063 | Pendiente |
| Persistencia de settings | Guardar/cargar en localStorage | SPEC-063 | Pendiente |

---

## SPEC-062: Touch Joystick Controls

> **Nota**: Esta spec ya esta completamente documentada en [`PRD-TOUCH-JOYSTICK.md`](./PRD-TOUCH-JOYSTICK.md). Se incluye aqui como referencia resumida.

**Prioridad**: Alta  
**Estimacion**: 5h  
**Dependencias**: Ninguna

### Resumen

- Clase `TouchJoystick` con zona tactil + knob visual + output analogico `{ x, y }`
- Joystick izquierdo → movimiento (mapea a WASD con intensidad proporcional)
- Joystick derecho → camara (yaw/pitch con sensibilidad configurable)
- 5 botones touch: Saltar, Romper, Colocar, Sprint, Inventario
- Toggle con tecla `J` para testing en desktop
- Auto-deteccion de touch devices al cargar
- Game loop modificado para funcionar sin `pointerLock` cuando touch esta activo
- `PlayerController.update()` modificado para aceptar `touchInput` analogico
- Persistencia en `localStorage` (`jardvoxel_touch_controls`)

### Criterios de aceptacion clave

- Jugable en celular sin teclado ni mouse
- Multi-touch: mover + mirar simultaneamente (2 dedos)
- 60fps con touch controls activos
- Auto-deteccion mobile al cargar
- Toggle con tecla J para desktop testing

### Archivos a modificar

- `jardvoxel-survival.html` — CSS, HTML elements, `TouchJoystick` class, `TouchControls` class, integracion en `setupInput()`, modificacion de `animate()`
- `jardvoxel-survival-gameplay.js` — `PlayerController.update()` para aceptar `touchInput`

---

## SPEC-063: Game Menu + Settings Expansion

**Prioridad**: Alta  
**Estimacion**: 6h  
**Dependencias**: SPEC-062 (touch controls debe estar implementado para opciones de controles touch)  
**Bloquea a**: Ninguna

### Problema

En `jardvoxel-survival.html`:

1. **No hay menu principal** — El juego arranca directamente al mundo. La `#pause-screen` (linea 297) sirve como pantalla inicial y de pausa, pero solo tiene un boton "Continuar" y un panel de settings minimal.

2. **Settings panel muy limitado** — `#settings-panel` (linea 305) solo tiene 4 sliders:
   - Render distance (2-8)
   - FOV (60-110)
   - Sensibilidad (0.5-4)
   - Volumen (0-1)

3. **No hay opciones de gameplay** — No se puede configurar dificultad, intervalo de auto-save, mostrar/ocultar FPS, coordenadas, minimapa, etc.

4. **No hay opciones de controles** — No se puede ajustar dead zone del joystick, invertir eje Y, o activar/desactivar joysticks desde el menu.

5. **UI no responsive** — El HUD usa posiciones fijas en pixeles. En pantallas pequenas (celulares 360-414px de ancho) los elementos se superponen:
   - `#inventory-grid` usa `grid-template-columns: repeat(8, 70px)` = 560px minimo → no cabe en mobile
   - `#info` (esquina sup. izq.) y `#block-info` (esquina sup. der.) se superponen en pantallas <400px
   - `#controls-hint` usa `white-space: nowrap` → overflow horizontal en mobile
   - `#hotbar` con 9 slots de 50px + gaps = ~470px → casi no cabe en mobile

6. **No hay creditos ni info del juego** — No hay pantalla con version, autor, stack tecnologico.

### Arquitectura propuesta

```
Game Menu System
├── MainMenu (pantalla inicial)
│   ├── Titulo: JardVoxel Survival
│   ├── Boton: Jugar (inicia mundo)
│   ├── Boton: Opciones (abre SettingsMenu)
│   ├── Boton: Creditos (abre CreditsScreen)
│   └── Info: Seed, version
├── SettingsMenu (menu de opciones con tabs)
│   ├── Tab: Graficos
│   │   ├── Render distance (slider 2-8)
│   │   ├── FOV (slider 60-110)
│   │   ├── Clouds (toggle on/off)
│   │   ├── Fog (toggle on/off)
│   │   ├── Shadows (toggle on/off)
│   │   └── Tone mapping (toggle on/off)
│   ├── Tab: Audio
│   │   ├── Volumen master (slider 0-1)
│   │   ├── Volumen efectos (slider 0-1)
│   │   ├── Volumen ambiente (slider 0-1)
│   │   └── Mostrar indicador de audio (toggle)
│   ├── Tab: Controles
│   │   ├── Sensibilidad mouse/touch (slider 0.5-4)
│   │   ├── Invertir eje Y (toggle)
│   │   ├── Touch joysticks (toggle — auto-detect / on / off)
│   │   ├── Joystick dead zone (slider 5-30px)
│   │   ├── Joystick size (slider 80-160px)
│   │   └── Button size (slider 50-90px)
│   └── Tab: Gameplay
│       ├── Dificultad (select: Pacifico / Facil / Normal / Dificil)
│       ├── Auto-save interval (slider 0=off / 30s / 60s / 120s / 300s)
│       ├── Mostrar FPS (toggle)
│       ├── Mostrar coordenadas (toggle)
│       ├── Mostrar minimapa (toggle)
│       ├── Mostrar reloj (toggle)
│       └── Mostrar hint de controles (toggle)
├── CreditsScreen
│   ├── Version del juego
│   ├── Tecnologias (Three.js, Web Audio API, Vanilla JS)
│   ├── Autor
│   └── Boton: Volver
└── ResponsiveHUD
    ├── Hotbar adaptable (slots mas pequenos en mobile)
    ├── Info panel colapsable
    ├── Inventory grid responsive (4 columnas en mobile)
    └── Touch-friendly UI elements
```

### Requisitos

#### 1. Menu Principal (`#main-menu`)

Reemplaza la `#pause-screen` actual como pantalla inicial. Se muestra al cargar el juego antes de generar el mundo.

- **Titulo**: "JardVoxel Survival" con gradiente `#7C3AED → #00ff88` (mismo estilo que loading screen)
- **Subtitulo**: "Mundo voxel con generacion procedural"
- **Botones**:
  - **Jugar** — Inicia generacion del mundo y entra al juego
  - **Opciones** — Abre `#settings-menu` sin iniciar el juego
  - **Creditos** — Abre `#credits-screen`
- **Info inferior**: Version del juego (ej: `v5.0.0`) y seed actual
- **Estilo**: Fondo `rgba(0,0,0,0.85)`, botones con estilo `#7C3AED` (mismo que pause-screen actual)
- **Responsive**: Centrado vertical y horizontal, botones de minimo 44px de altura (recomendacion mobile)

#### 2. Menu de Opciones (`#settings-menu`)

Panel con tabs para organizar opciones por categoria. Reemplaza el `#settings-panel` actual.

**Estructura HTML:**
```html
<div id="settings-menu">
  <h2>Opciones</h2>
  <div class="settings-tabs">
    <button class="tab-btn active" data-tab="graphics">Graficos</button>
    <button class="tab-btn" data-tab="audio">Audio</button>
    <button class="tab-btn" data-tab="controls">Controles</button>
    <button class="tab-btn" data-tab="gameplay">Gameplay</button>
  </div>
  <div class="tab-content" id="tab-graphics">...</div>
  <div class="tab-content" id="tab-audio">...</div>
  <div class="tab-content" id="tab-controls">...</div>
  <div class="tab-content" id="tab-gameplay">...</div>
  <button id="settings-back">Volver</button>
</div>
```

**CSS:**
- Tabs horizontales con highlight en tab activo
- Contenido de tab: scrollable si excede altura
- Sliders con `accent-color: #7C3AED` (estilo existente)
- Toggles: checkbox estilizado como switch (CSS custom)
- Selects: dropdown nativo con estilo oscuro
- `pointer-events: auto` — debe funcionar con touch
- Max width 500px, centrado
- En mobile: tabs como scroll horizontal si no caben

#### 3. Tab: Graficos

| Opcion | Tipo | Rango | Default | Descripcion |
|---------|------|-------|---------|-------------|
| Render distance | Slider | 2-8 | 3 | Chunks cargados alrededor del jugador |
| FOV | Slider | 60-110 | 75 | Campo de vision en grados |
| Clouds | Toggle | on/off | on | Mostrar/ocultar nubes procedurales |
| Fog | Toggle | on/off | on | Niebla atmosferica |
| Shadows | Toggle | on/off | on | Sombras dinamicas del sol |
| Tone mapping | Toggle | on/off | on | ACESFilmic tone mapping |

**Implementacion:**
- Render distance: ya existe (`this.world.renderDistance`)
- FOV: ya existe (`this.camera.fov`)
- Clouds: `this.dayNight.clouds.visible = !enabled` (ocultar mesh de nubes)
- Fog: `this.scene.fog = enabled ? fog : null`
- Shadows: `this.renderer.shadowMap.enabled = enabled`
- Tone mapping: `this.renderer.toneMapping = enabled ? ACESFilmicToneMapping : NoToneMapping`

#### 4. Tab: Audio

| Opcion | Tipo | Rango | Default | Descripcion |
|---------|------|-------|---------|-------------|
| Volumen master | Slider | 0-1 | 0.5 | Volumen general |
| Volumen efectos | Slider | 0-1 | 0.8 | Romper, colocar, salto, splash |
| Volumen ambiente | Slider | 0-1 | 0.3 | Sonido de cueva, viento |
| Mostrar indicador | Toggle | on/off | off | Icono de audio en HUD |

**Implementacion:**
- Volumen master: ya existe (`this.audio.setVolume()`)
- Volumen efectos: `this.audio.sfxVolume = val` (nuevo, multiplicador en `playBreak/playPlace/playJump`)
- Volumen ambiente: `this.audio.ambientVolume = val` (nuevo, para sonidos ambientales futuros)
- Guardar en `localStorage` dentro de `jardvoxel-settings`

#### 5. Tab: Controles

| Opcion | Tipo | Rango | Default | Descripcion |
|---------|------|-------|---------|-------------|
| Sensibilidad | Slider | 0.5-4 | 2.0 | Sensibilidad de mouse/touch look |
| Invertir eje Y | Toggle | on/off | off | Invertir pitch (mirar arriba = arrastrar abajo) |
| Touch joysticks | Select | Auto / On / Off | Auto | Activar joysticks touch |
| Joystick dead zone | Slider | 5-30px | 10 | Radio minimo del joystick |
| Joystick size | Slider | 80-160px | 120 | Diametro del joystick base |
| Button size | Slider | 50-90px | 70 | Tamano de botones touch |

**Implementacion:**
- Sensibilidad: ya existe. Aplica a mouse look y joystick look
- Invertir Y: `this.player.pitch += e.movementY * sens` en vez de `-=`
- Touch joysticks: 
  - Auto: `('ontouchstart' in window) || (navigator.maxTouchPoints > 0)`
  - On: forzar activacion
  - Off: forzar desactivacion
- Dead zone: `this.touchControls.deadZone = val`
- Joystick size: CSS variable `--joystick-size` en `.joystick-base`
- Button size: CSS variable `--touch-btn-size` en `.touch-btn`

#### 6. Tab: Gameplay

| Opcion | Tipo | Rango | Default | Descripcion |
|---------|------|-------|---------|-------------|
| Dificultad | Select | Pacifico/Facil/Normal/Dificil | Normal | Danio de mobs, frecuencia de spawn, hambre |
| Auto-save | Select | Off/30s/60s/120s/300s | 60s | Intervalo de guardado automatico |
| Mostrar FPS | Toggle | on/off | on | Contador de FPS en HUD |
| Mostrar coords | Toggle | on/off | on | Coordenadas XYZ en HUD |
| Mostrar minimapa | Toggle | on/off | on | Minimapa en esquina sup. der. |
| Mostrar reloj | Toggle | on/off | on | Reloj en HUD |
| Mostrar hint | Toggle | on/off | on | Hint de controles abajo |

**Implementacion dificulty:**
```javascript
const DIFFICULTY = {
  peaceful: { mobDamage: 0, mobSpawnRate: 0, hungerDrain: 0 },
  easy:     { mobDamage: 0.5, mobSpawnRate: 0.5, hungerDrain: 0.5 },
  normal:   { mobDamage: 1.0, mobSpawnRate: 1.0, hungerDrain: 1.0 },
  hard:     { mobDamage: 1.5, mobSpawnRate: 1.5, hungerDrain: 1.5 },
};
```

**Implementacion auto-save:**
- `this.autoSaveInterval = val * 1000` (ms)
- En `animate()`: acumular dt y llamar `this.saveManager.save()` cuando se alcance el intervalo
- Si `val === 0`: desactivar auto-save

**Implementacion toggles HUD:**
- FPS: `document.getElementById('info').style.display = show ? 'block' : 'none'` (o mostrar/ocultar solo la linea de FPS)
- Coords: similar, toggle de la linea XYZ
- Minimapa: `document.getElementById('minimap').style.display`
- Reloj: `document.getElementById('clock').style.display`
- Hint: `document.getElementById('controls-hint').style.display`

#### 7. Pantalla de Creditos (`#credits-screen`)

```html
<div id="credits-screen">
  <h2>JardVoxel Survival</h2>
  <p class="version">v5.0.0</p>
  <div class="credits-content">
    <h3>Tecnologias</h3>
    <ul>
      <li>Three.js r160 — Renderizado 3D WebGL</li>
      <li>Web Audio API — Audio procedural sintetizado</li>
      <li>Vanilla JS — Sin frameworks, sin build tools</li>
      <li>Web Workers — Generacion de chunks en background</li>
    </ul>
    <h3>Caracteristicas</h3>
    <ul>
      <li>17 biomas con generacion procedural</li>
      <li>60+ tipos de bloques</li>
      <li>Ciclo dia/noche con sol, luna, estrellas, nubes</li>
      <li>Agua animada con olas y profundidad</li>
      <li>Mobs hostiles y pasivos</li>
      <li>Crafting, furnace, encantamientos</li>
      <li>Villagers con trading</li>
      <li>Pesca, agricultura, redstone</li>
      <li>Nether dimension</li>
      <li>Controles touch para mobile</li>
    </ul>
    <h3>Desarrollo</h3>
    <p>Jard Dev Harness — SDD + automatizacion</p>
  </div>
  <button id="credits-back">Volver</button>
</div>
```

#### 8. HUD Responsive

Adaptar el HUD para pantallas pequenas (mobile/tablet):

**CSS media queries:**

```css
/* Mobile: pantallas < 600px de ancho */
@media (max-width: 600px) {
  /* Hotbar: slots mas pequenos */
  .hotbar-slot { width: 38px; height: 38px; }
  .hotbar-slot .slot-block { width: 22px; height: 22px; }
  .hotbar-slot .slot-name { display: none; } /* ocultar nombres en mobile */
  .hotbar-slot .slot-num { font-size: 0.45rem; }
  .hotbar-slot .slot-count { font-size: 0.55rem; }

  /* Info panel: mas compacto */
  #info { font-size: 0.65rem; padding: 6px 8px; }
  #block-info { font-size: 0.65rem; padding: 6px 8px; }

  /* Controls hint: oculto en mobile (los controles son visuales) */
  #controls-hint { display: none; }

  /* Minimap: mas pequeno */
  #minimap { width: 80px; height: 80px; }

  /* Inventory grid: 4 columnas en mobile */
  #inventory-grid {
    grid-template-columns: repeat(4, 60px);
    max-height: 50vh;
  }
  .inv-item { width: 60px; height: 60px; }
  .inv-item-color { width: 28px; height: 28px; }

  /* Crafting: mas compacto */
  .craft-slot { width: 40px; height: 40px; }
  .craft-slot .craft-color { width: 22px; height: 22px; }

  /* Settings menu: full width en mobile */
  #settings-menu { min-width: unset; width: 90vw; max-width: 400px; }

  /* Settings tabs: scroll horizontal */
  .settings-tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .tab-btn { white-space: nowrap; flex-shrink: 0; }

  /* Font sizes generales reducidos */
  #pause-screen h2 { font-size: 1.4rem; }
  #settings-menu h2 { font-size: 1.4rem; }
}

/* Tablet: pantallas 600-1024px */
@media (min-width: 600px) and (max-width: 1024px) {
  .hotbar-slot { width: 44px; height: 44px; }
  #inventory-grid {
    grid-template-columns: repeat(6, 65px);
  }
}
```

**Touch-friendly UI:**
- Todos los elementos interactivos deben tener minimo 44x44px de area touch (recomendacion Apple/Google)
- `touch-action: manipulation` en botones para eliminar delay de 300ms
- `user-select: none` en toda la UI del juego

#### 9. Persistencia de Settings

Expandir el objeto `this.settings` actual:

```javascript
// ANTES (4 opciones):
this.settings = {
  renderDistance: 3,
  fov: 75,
  sensitivity: 2.0,
  volume: 0.5,
};

// DESPUES (20+ opciones):
this.settings = {
  // Graficos
  renderDistance: 3,
  fov: 75,
  clouds: true,
  fog: true,
  shadows: true,
  toneMapping: true,
  // Audio
  volume: 0.5,          // master
  sfxVolume: 0.8,       // efectos
  ambientVolume: 0.3,   // ambiente
  showAudioIndicator: false,
  // Controles
  sensitivity: 2.0,
  invertY: false,
  touchJoysticks: 'auto', // 'auto' | 'on' | 'off'
  joystickDeadZone: 10,
  joystickSize: 120,
  buttonSize: 70,
  // Gameplay
  difficulty: 'normal',   // 'peaceful' | 'easy' | 'normal' | 'hard'
  autoSaveInterval: 60,   // segundos, 0 = off
  showFPS: true,
  showCoords: true,
  showMinimap: true,
  showClock: true,
  showControlsHint: true,
};
```

Guardar en `localStorage` key `jardvoxel-settings` (ya existe, solo expandir el objeto).

#### 10. Integracion con Pause Screen

La `#pause-screen` actual se mantiene pero se modifica:

- Al presionar ESC durante el juego → pausa + muestra pause-screen
- Pause screen ahora tiene 3 botones: **Continuar**, **Opciones**, **Menu Principal**
- **Continuar** → reanuda el juego (pointer lock)
- **Opciones** → abre `#settings-menu` (mismo menu que main menu, pero con contexto de pausa)
- **Menu Principal** → vuelve a `#main-menu` (con confirmacion si hay progreso sin guardar)

#### 11. Flujo de navegacion

```
[Al cargar]
  → #main-menu
    → Jugar → Genera mundo → Game loop
    → Opciones → #settings-menu
      → Volver → #main-menu
    → Creditos → #credits-screen
      → Volver → #main-menu

[Durante el juego]
  → ESC → #pause-screen
    → Continuar → Reanuda juego
    → Opciones → #settings-menu
      → Volver → #pause-screen
    → Menu Principal → #main-menu (confirmar si hay cambios sin guardar)
```

### Criterios de aceptacion

**Menu Principal:**
- [ ] Al cargar el juego, se muestra `#main-menu` antes de generar el mundo
- [ ] Boton "Jugar" inicia la generacion del mundo y entra al juego
- [ ] Boton "Opciones" abre el menu de opciones sin iniciar el juego
- [ ] Boton "Creditos" muestra la pantalla de creditos
- [ ] Se muestra la version del juego y seed

**Menu de Opciones:**
- [ ] 4 tabs funcionales: Graficos, Audio, Controles, Gameplay
- [ ] Tab Graficos: render distance, FOV, clouds, fog, shadows, tone mapping — todos funcionales
- [ ] Tab Audio: volumen master, efectos, ambiente — todos funcionales
- [ ] Tab Controles: sensibilidad, invert Y, touch joysticks (auto/on/off), dead zone, joystick size, button size
- [ ] Tab Gameplay: dificultad, auto-save, mostrar FPS/coords/minimapa/reloj/hint
- [ ] Todos los cambios se aplican en tiempo real (no requiere reiniciar)
- [ ] Todos los cambios se persisten en localStorage
- [ ] Al volver, las opciones se mantienen

**Pause Screen:**
- [ ] ESC durante el juego abre pause screen con 3 botones
- [ ] "Continuar" reanuda el juego
- [ ] "Opciones" abre settings menu desde pausa
- [ ] "Menu Principal" vuelve al menu con confirmacion

**HUD Responsive:**
- [ ] En pantallas < 600px, el hotbar cabe sin overflow
- [ ] En mobile, el inventario muestra 4 columnas (no 8)
- [ ] En mobile, los nombres de items del hotbar se ocultan
- [ ] En mobile, el hint de controles se oculta
- [ ] En tablet (600-1024px), el inventario muestra 6 columnas
- [ ] Todos los botones tienen minimo 44px de area touch
- [ ] No hay overflow horizontal en ninguna pantalla

**Creditos:**
- [ ] Muestra version, tecnologias, caracteristicas, autor
- [ ] Boton "Volver" regresa al menu anterior

**Persistencia:**
- [ ] Objeto settings expandido con 20+ opciones
- [ ] Settings se cargan al iniciar el juego
- [ ] Settings se guardan al cambiar cualquier opcion
- [ ] Settings persisten entre sesiones

### Archivos a modificar

- **`jardvoxel-survival.html`** — Principal archivo a modificar:
  - CSS: nuevos estilos para `#main-menu`, `#settings-menu`, `#credits-screen`, `.settings-tabs`, `.tab-content`, toggles, media queries responsive
  - HTML: nuevos elementos `#main-menu`, `#settings-menu`, `#credits-screen`, modificacion de `#pause-screen`
  - JS: 
    - `_initSettings()` — expandir objeto settings, wire up nuevos controles
    - `_applySettings()` — aplicar todas las opciones
    - `_saveSettings()` — guardar objeto expandido
    - Nuevo: `_initMainMenu()`, `_initSettingsMenu()`, `_initCreditsScreen()`
    - Nuevo: `_applyGraphicsSettings()`, `_applyAudioSettings()`, `_applyControlSettings()`, `_applyGameplaySettings()`
    - Modificar: `setupInput()` — ESC ahora abre pause-screen con 3 botones
    - Modificar: flujo de inicio — mostrar main-menu antes de generar mundo

### Consideraciones tecnicas

1. **No romper flujo existente**: El juego actualmente arranca generando el mundo inmediatamente. El main menu debe postergar la generacion hasta que se presione "Jugar".
2. **Settings en tiempo real**: La mayoria de opciones deben aplicar instantaneamente (sliders con evento `input`). Las que requieren regenerar chunks (render distance) ya funcionan asi.
3. **Mobile first**: El menu debe ser completamente navegable con touch. Todos los botones minimo 44px.
4. **Performance**: Aplicar opciones graficas (shadows off, fog off, clouds off) puede mejorar FPS en mobile. Esto es importante para dispositivos de gama baja.
5. **Dificultad**: Cambiar dificultad durante el juego debe ajustar parametros de mobs y hambre en tiempo real, no requiere reiniciar.
6. **Auto-save**: Si se cambia el intervalo durante el juego, el timer se reinicia con el nuevo valor.
7. **Confirmacion al salir**: Si hay cambios sin guardar al volver al menu principal, mostrar confirmacion: "Progreso no guardado. Continuar?"
8. **CSS variables**: Usar `--joystick-size` y `--touch-btn-size` para que las opciones de controles modifiquen el tamano dinamicamente sin recargar.

### Plan de implementacion

```
Fase 1: Menu Principal + Creditos (1h)
  ├── CSS de #main-menu y #credits-screen
  ├── HTML elements
  ├── JS: _initMainMenu(), _initCreditsScreen()
  ├── Modificar flujo de inicio: mostrar menu antes de generar mundo
  └── Botones: Jugar, Opciones, Creditos

Fase 2: Settings Menu con tabs (1.5h)
  ├── CSS de #settings-menu, .settings-tabs, .tab-content
  ├── HTML: 4 tabs con sus contenidos
  ├── JS: _initSettingsMenu() — tab switching
  ├── Wire up sliders y toggles existentes (render distance, FOV, sens, vol)
  └── Boton "Volver" — navega al menu anterior (main-menu o pause-screen)

Fase 3: Tab Graficos — nuevas opciones (1h)
  ├── Clouds toggle → this.dayNight.clouds.visible
  ├── Fog toggle → this.scene.fog
  ├── Shadows toggle → this.renderer.shadowMap.enabled
  ├── Tone mapping toggle → this.renderer.toneMapping
  └── Persistir en settings

Fase 4: Tab Audio — nuevas opciones (30min)
  ├── SFX volume → this.audio.sfxVolume
  ├── Ambient volume → this.audio.ambientVolume
  ├── Audio indicator toggle
  └── Persistir en settings

Fase 5: Tab Controles — nuevas opciones (1h)
  ├── Invert Y toggle → modificar mousemove handler
  ├── Touch joysticks select (auto/on/off) → touchControls.setEnabled()
  ├── Joystick dead zone → touchControls.deadZone
  ├── Joystick size → CSS variable --joystick-size
  ├── Button size → CSS variable --touch-btn-size
  └── Persistir en settings

Fase 6: Tab Gameplay — nuevas opciones (1h)
  ├── Difficulty select → this.difficultySettings
  ├── Auto-save interval → this.autoSaveInterval
  ├── Show FPS toggle → document.getElementById('info')
  ├── Show coords toggle
  ├── Show minimap toggle
  ├── Show clock toggle
  ├── Show hint toggle
  └── Persistir en settings

Fase 7: HUD Responsive (30min)
  ├── Media queries para < 600px (mobile)
  ├── Media queries para 600-1024px (tablet)
  ├── Hotbar slots mas pequenos en mobile
  ├── Inventory grid: 4 columnas en mobile, 6 en tablet
  ├── Ocultar nombres de items y hint en mobile
  └── Minimap mas pequeno en mobile

Fase 8: Pause Screen + navegacion (30min)
  ├── Modificar #pause-screen: 3 botones (Continuar, Opciones, Menu Principal)
  ├── Navegacion: pause → settings → pause
  ├── Confirmacion al volver al menu principal
  └── Test flujo completo: main-menu → jugar → pausa → opciones → volver

Fase 9: Testing y pulido (30min)
  ├── Test en desktop: navegar menu con mouse
  ├── Test en mobile: navegar menu con touch
  ├── Verificar persistencia de settings
  ├── Verificar que todas las opciones aplican en tiempo real
  └── Verificar responsive en diferentes tamanos de pantalla
```

### Dependencias

```
SPEC-062 (Touch Controls) — sin dependencias
SPEC-063 (Game Menu) — depende de SPEC-062 (tab Controles necesita touch controls implementado)
```

### Ejecucion con Harness

```bash
# Ejecutar specs en orden
/cascade-dev SPEC-062
/cascade-dev SPEC-063

# O ejecutar ambas en loop
/cascade-dev --loop

# Con skill jard-code
@jard-code SPEC-062
@jard-code SPEC-063
```

### Validacion

- **Desktop**: Menu navegable con mouse, todas las opciones funcionan
- **Mobile**: Menu navegable con touch, todas las opciones funcionan, HUD no overflow
- **Persistencia**: Settings se mantienen despues de cerrar y reabrir
- **Responsive**: Probar en 360px, 414px, 768px, 1024px, 1920px
- **Performance**: Shadows off + fog off mejora FPS en mobile

---

## Metricas de exito

| Metrica | Actual | Objetivo |
|---------|--------|----------|
| Controles touch | Ninguno | Joysticks + 5 botones |
| Menu principal | No (arranca directo) | Si, con Jugar/Opciones/Creditos |
| Opciones de settings | 4 (render, FOV, sens, vol) | 20+ (graficos, audio, controles, gameplay) |
| Tabs de settings | 0 | 4 (Graficos, Audio, Controles, Gameplay) |
| HUD responsive | No | Si (mobile < 600px, tablet 600-1024px) |
| Inventory en mobile | 8 columnas (overflow) | 4 columnas (sin overflow) |
| Hotbar en mobile | 470px (overflow en 360px) | ~340px (cabe en 360px) |
| Creditos | No | Si |
| Persistencia | 4 opciones | 20+ opciones |
| Dificultad configurable | No | 4 niveles |
| Auto-save configurable | No | 5 intervalos + off |
| Jugable en mobile | No | Si |
| Area touch minima | N/A | 44x44px en todos los botones |

---

*Documento generado: 2026-06-25*  
*Desarrollo: Jard Dev Harness (`/cascade-dev`, `@jard-code`)*
