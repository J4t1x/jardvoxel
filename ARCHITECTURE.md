# Architecture — Jard Games

## Arquitectura Single-File

Cada juego es un único `.html` con tres secciones embebidas:

```
<!DOCTYPE html>
<html>
<head>
  <meta>          ← Configuración mobile/PWA
  <style>         ← Todos los CSS (variables, animaciones, layout, efectos)
</head>
<body>
  <!-- HTML structure (pantallas, HUD, modales) -->
  <script>        ← Toda la lógica del juego
</body>
</html>
```

## Capas del Motor

### Layer 1: Visual Foundation
- **Fondo animado** — Gradient CSS animado + aurora blobs + estrellas + partículas ambiente
- **CSS Variables** — Paleta de colores centralizada en `:root`
- **Safe areas** — `env(safe-area-inset-*)` para notch/Dynamic Island

### Layer 2: Game State
```js
// Variables core
let juegoIniciado = false;
let score = 0;
let combo = 0;
let faseActual = 0;

// Arrays de entidades
let corazonesActivos = [];     // Referencias a elementos DOM
let corazonesFisicos = [];     // Datos de física (x, y, vx, vy, comportamiento)

// Clicker mechanics
let streak = 0;
let multiplicadorGlobal = 1;
let multiplicadorBoost = 1;
let corazonesPerdidos = 0;
let dificultadNivel = 1;
```

### Layer 3: Entity System
Cada entidad (corazón/target) tiene:
- **Elemento DOM** — `<div>` con emoji, clases CSS, event listeners
- **Datos físicos** — `{ el, x, y, vx, vy, comportamiento, faseZigzag, anguloOrbital, centroX, centroY }`
- **Lifecycle** — Spawn → Movement → Hit (click) o Expire (timeout) → Cleanup

### Layer 4: Physics Engine
```
moverCorazones() → requestAnimationFrame loop
  ├── Magnet effect (atracción al centro)
  ├── Behavior modifiers (zigzag, orbital, pulsante)
  ├── Position update (x += vx, y += vy)
  ├── Wall bouncing (rebote en bordes)
  ├── Random direction changes (cada 1-2.5s)
  └── DOM sync (el.style.left/top)
```

### Layer 5: Game Loop
```
iniciarJuego()
  ├── Reset state
  ├── Start spawn interval (setInterval)
  ├── Start physics loop (requestAnimationFrame)
  └── Start music

tocarCorazon()
  ├── Combo system (1.5s window)
  ├── Critical hit check
  ├── Score calculation (base × combo × phase × multiplier × crit)
  ├── Streak update
  ├── Power-up spawn chance
  ├── Visual effects (partículas, ondas, confeti, screen shake)
  ├── Phase progression check
  └── End game check

finJuego()
  ├── Stop intervals
  ├── Stop physics
  ├── Deactivate power-ups
  └── Show final screen
```

### Layer 6: Audio Engine
Web Audio API sintetizado, sin archivos:
```js
const audioCtx = new AudioContext();
function playTono(frecuencia, duracion, tipo, volumen) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = tipo; // 'sine', 'square', 'triangle', 'sawtooth'
  osc.frequency.value = frecuencia;
  gain.gain.setValueAtTime(volumen, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duracion);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + duracion);
}
```

### Layer 7: Haptics
```js
function vibrar(patron) {
  if (navigator.vibrate) navigator.vibrate(patron);
}
```

## Patrones de Diseño

### Entity-Component sin clases
Cada entidad es un objeto plano + un elemento DOM. No hay herencia, solo datos y funciones puras.

### State Machine implícita
```
PANTALLA_INICIO → JUGANDO → (MENSAJE_MODAL) → JUGANDO → FIN_JUEGO → PANTALLA_INICIO
```

### Event-Driven
- Click/touch → `tocarCorazon()`
- Timer → `generarCorazon()`
- RAF → `moverCorazones()`
- Phase change → `actualizarFase()`

### Progressive Difficulty
```
dificultadNivel = 1 + faseActual + floor(corazonesPerdidos / 3)
```
- Fase sube con progreso (0-25% → 25-50% → 50-75% → 75-100%)
- Corazones perdidos aumentan dificultad
- Velocidad de movimiento escala con fase
- Spawn rate aumenta con fase
- Vida de corazones disminuye con fase
