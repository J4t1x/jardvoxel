# Game Engine Documentation — Jard Games

## Overview

El motor de juegos es un sistema basado en patrones (no clases) que opera dentro de un único archivo HTML. No hay imports, no hay módulos, no hay build. Todo vive en un `<script>` al final del `<body>`.

## Core Systems

### 1. Spawn System

```js
function generarEntidad() {
  if (entidadesTocadas >= TOTAL) return;
  const config = fases[faseActual];
  if (entidadesActivas.length >= config.max) return;

  // Seleccionar tipo (raro vs normal)
  const tipo = Math.random() < 0.1 ? 'raro' : 'normal';

  // Seleccionar comportamiento según fase
  const comportamiento = config.comportamientos[
    Math.floor(Math.random() * config.comportamientos.length)
  ];

  // Crear elemento DOM
  const el = document.createElement('div');
  el.className = 'entidad-tocable ' + comportamiento;
  el.textContent = emoji;
  el.style.left = x + 'px';
  el.style.top = y + 'px';

  // Asignar física
  const datos = {
    el, x, y,
    vx: Math.cos(ang) * speed,
    vy: Math.sin(ang) * speed,
    comportamiento,
    // ... datos específicos de comportamiento
  };

  // Event listener
  el.addEventListener('click', () => tocarEntidad(el, datos));

  // Lifecycle: auto-eliminar después de `vida` ms
  setTimeout(() => { /* cleanup si no fue tocada */ }, config.vida);
}
```

### 2. Physics Loop

```js
function moverEntidades() {
  if (!juegoIniciado) return;
  const area = document.getElementById('area-juego');
  const w = area.offsetWidth, h = area.offsetHeight;

  for (let i = 0; i < entidadesFisicas.length; i++) {
    const d = entidadesFisicas[i];
    if (d.el.classList.contains('explotado')) continue;

    // 1. Power-up effects (magnet, freeze, slowmo)
    // 2. Behavior modifiers (zigzag, orbital, pulsante)
    // 3. Position update
    // 4. Wall bouncing
    // 5. Random direction change
    // 6. DOM sync
    d.el.style.left = d.x + 'px';
    d.el.style.top = d.y + 'px';
  }
  animationFrameId = requestAnimationFrame(moverEntidades);
}
```

### 3. Score Calculation Pipeline

```
puntosBase (100 normal, 500 raro)
  + bonusComportamiento (50-200 según tipo)
  × combo (1-N)
  × (1 + faseActual * 0.25)        ← phase bonus
  × multiplicadorGlobal             ← permanent
  × multiplicadorBoost              ← power-up/streak
  × crit (1, 2, 3, o 5)            ← random
  = puntosFinales
```

### 4. Phase Progression

```js
function getFase() {
  const progreso = entidadesTocadas / TOTAL_ENTIDADES;
  if (progreso < 0.25) return 0;
  if (progreso < 0.5) return 1;
  if (progreso < 0.75) return 2;
  return 3;
}
```

### 5. Power-Up System

```js
// Spawn chance check (after each hit)
function maybeSpawnPowerup() {
  if (entidadesTocadas < 3) return;
  const chance = 0.08 + faseActual * 0.03;
  if (Math.random() < chance && !powerupActivo) {
    spawnPowerup();
  }
}

// Activation
function activarPowerup(pw) {
  // Clear previous
  // Apply effect (switch/case)
  // Set timer for deactivation
  // Visual + audio + haptics
}
```

## Customization Points

Al crear un nuevo juego, ajustar:

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `TOTAL_ENTIDADES` | 15 | Total a tocar para ganar |
| `fases[].intervalo` | 700-1600ms | Spawn rate por fase |
| `fases[].vida` | 1800-3500ms | Tiempo de vida de entidad |
| `fases[].max` | 3-6 | Máx entidades simultáneas |
| `baseSpeed` | 0.8-2.0 | Velocidad base de movimiento |
| `comboWindow` | 1500ms | Ventana para mantener combo |
| `streakMax` | 100 | Capacidad del streak meter |
| `critBaseChance` | 0.08 | Probabilidad base de crítico |
| `powerupChance` | 0.08 | Probabilidad de spawn de power-up |
| `corazonesPerdidosPenalty` | 3 | Entidades perdidas por nivel de dificultad |

## Visual Customization

### CSS Variables
```css
:root {
  --color-1: #ff6b9d;    /* Color primario */
  --color-2: #c44dff;    /* Color secundario */
  --color-bg: #1a0a1e;   /* Fondo oscuro */
  --color-accent: #ffd700; /* Dorado/acento */
  --color-text: #fff5f7; /* Texto */
}
```

### Emojis por tipo
```js
const emojis = {
  normal: ['💜', '💕', '💖', '💗'],
  raro: ['💛', '✨', '💫', '⭐'],
  especial: ['👑', '🌹', '🌈'],
};
```

### Background
3 aurora blobs + gradient animado + estrellas + partículas ambiente. Todo CSS, sin imágenes.

## Performance Notes

- **60fps target** — `requestAnimationFrame` para movimiento, CSS animations solo para efectos no posicionales
- **DOM cleanup** — `setTimeout(() => el.remove(), ...)` para todas las entidades temporales
- **Array filtering** — `corazonesActivos.filter(c => c !== corazon)` al tocar/expirar
- **Avoid layout thrash** — Solo escribir `style.left/top`, no leer durante el loop
- **Max entities** — Limitado por `fases[faseActual].max` (3-6)
- **Particle count** — 8-14 por toque, se eliminan en 1s
