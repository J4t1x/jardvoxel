# Jard Games — Reglas del Harness

## Stack
- **Single-file HTML** — Un archivo `.html` por juego, sin dependencias externas
- **CSS embebido** — `<style>` dentro de `<head>`
- **JS embebido** — `<script>` al final de `<body>`
- **Sin frameworks** — Vanilla JS, sin React/Vue/Angular
- **Sin build tools** — No npm, no webpack, no vite
- **Sin CDNs** — Todo autocontenido

## Estructura de Archivos
```
jard-games/
├── games/           → Juegos terminados (.html)
├── templates/       → Templates reutilizables
├── specs/           → Specs SDD (pending, in-progress, completed)
└── .devin/rules/    → Este archivo
```

## Reglas de Desarrollo

### R1: Un archivo = un juego
- Cada juego vive en `games/[nombre].html`
- No separar CSS/JS en archivos externos
- Autocontenido: abrir el `.html` en cualquier navegador = jugar

### R2: Mobile-first
- `viewport` meta tag con `user-scalable=no`
- `env(safe-area-inset-*)` para notch
- Touch events como interacción primaria
- Mínimo 44px de área táctil

### R3: Performance
- `requestAnimationFrame` para movimiento (nunca `setInterval` para animación)
- CSS animations solo para efectos no posicionales (escala, opacidad, rotación)
- Limpiar DOM elements con `setTimeout(() => el.remove(), ...)`
- Máximo 6 entidades simultáneas en pantalla
- Partículas: 8-14 por evento, eliminar en 1s

### R4: Máximo impacto visual
- Fondo: gradient animado + 3 aurora blobs con `blur(80px)` + estrellas
- Glassmorphism en HUD: `backdrop-filter: blur(10px)` + fondo semi-transparente
- Glow effects: `filter: drop-shadow(0 0 Npx color)`
- CSS variables para paleta centralizada
- Mínimo 3 capas de profundidad visual (fondo → entidades → HUD)

### R5: Mecánicas clicker
- Todo juego debe incluir: combo system, streak meter, critical hits, power-ups
- Dificultad progresiva: fases + indicador visual
- Feedback multinivel: visual + audio + háptico
- Ver `MECHANICS.md` para catálogo completo

### R6: HUD distribution
- Indicadores en bordes, centro libre para gameplay
- Una función por zona (top-left, top-center, top-right, bottom-left, bottom-center, bottom-right)
- `pointer-events: none` en HUD no interactivo
- Ver `INDICATORS.md` para distribución canónica

### R7: Audio sin archivos
- Web Audio API sintetizado
- `AudioContext` + `OscillatorNode` + `GainNode`
- Función `playTono(freq, dur, type, vol)` reutilizable
- Sin archivos .mp3, .wav, .ogg

### R8: Hápticos
- `navigator.vibrate()` en eventos clave
- Patrones distintos por tipo de evento

## SDD Workflow

### Crear nueva spec
```
specs/pending/SPEC-XXX-[nombre-juego].md
```

### Template de spec
```markdown
# SPEC-XXX: [Nombre del juego]

## Descripción
Breve descripción del juego y su mecánica principal.

## Requisitos
- [ ] Mecánica principal: [descripción]
- [ ] Tema visual: [descripción]
- [ ] Emojis: [lista]
- [ ] Total entidades: N
- [ ] Fases: N
- [ ] Power-ups: [lista o "estándar"]
- [ ] Mensaje final: [texto]

## Criterios de Aceptación
- [ ] Juego funciona al abrir el .html
- [ ] Mobile-first responsive
- [ ] 60fps en movimiento
- [ ] Todas las mecánicas clicker operativas
- [ ] HUD distribuido sin superposiciones
- [ ] Audio funcional
- [ ] Vibración funcional (mobile)
```

## Detección de Proyecto
```
jard-games detectado por:
1. Argumento: /cascade-dev jard-games
2. Archivo abierto en games/ o templates/
3. Spec activa en specs/
```

## Commits
```
feat(jard-games): añadir juego [nombre]
fix(jard-games): corregir [bug] en [juego]
refactor(jard-games): optimizar [aspecto] en [juego]
docs(jard-games): actualizar [documento]
```
