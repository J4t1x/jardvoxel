# Jard Games

Laboratorio de juegos HTML single-file. Cada juego es un único archivo `.html` autocontenido, sin dependencias externas, sin build tools, sin npm.

## Filosofía

- **Un archivo = un juego** — HTML + CSS + JS en un solo `.html`
- **Cero dependencias** — Sin frameworks, sin CDNs, sin npm
- **Mobile-first** — Diseñado para táctil, funciona en cualquier pantalla
- **60fps** — Animaciones con `requestAnimationFrame`, sin transiciones CSS para movimiento
- **Máximo impacto visual** — Fondos animados, partículas, shaderes CSS, blur, glow

## Estructura

```
jard-games/
├── README.md              ← Este archivo
├── ARCHITECTURE.md        → Arquitectura del motor y patrones
├── MECHANICS.md           → Catálogo de mecánicas clicker/arcade
├── INDICATORS.md          → Guía de distribución de HUD/indicadores
├── GAME-ENGINE.md         → Documentación del motor reutilizable
├── templates/
│   └── game-template.html → Template base con todas las mecánicas
├── specs/
│   ├── pending/           → Specs por implementar
│   ├── in-progress/       → Specs en desarrollo
│   └── completed/         → Specs completadas
├── games/
│   ├── jardfruit-pro/     → Slot machine profesional (Phaser 3 + TypeScript)
│   │   ├── src/
│   │   │   ├── scenes/    → Boot, Menu, Slot, Bonus, Gamble, Mystery, Info, Tutorial
│   │   │   ├── systems/   → RNG, ReelEngine, PaylineChecker, Economy, AudioEngine, etc.
│   │   │   ├── config/    → Balance, symbols, paylines, achievements, upgrades, challenges
│   │   │   ├── store/     → gameStore (Zustand) + SaveManager (localStorage)
│   │   │   └── audio/     → AudioEngine (Web Audio API sintetizado)
│   │   ├── tests/        → 74 tests (Vitest)
│   │   └── package.json
│   ├── jardfruit-cocktail.html
│   └── jardpredict.html
└── .devin/
    └── rules/
        └── jard-games.md  → Reglas del harness para este proyecto
```

## Juegos

| Juego | Archivo | Estado | Descripción |
|-------|---------|--------|-------------|
| JardFruit Pro | `games/jardfruit-pro/` | ✅ | Slot machine profesional (Phaser 3 + TypeScript + Vite + PWA) con 5 carretes, 3 filas, bonus round, gamble, mystery box, free spins, jackpot progresivo, achievements, challenges, upgrades, daily login, settings |
| JardFruit Cocktail | `games/jardfruit-cocktail.html` | ✅ | Slot machine clicker single-file con frutas, free spins, jackpot progresivo |
| JardPredict | `games/jardpredict.html` | ✅ | Prediction clicker: predice ↑/↓, apuesta JardCoins, 9 modos, progresión, achievements, PWA |

> El juego "Para Constanza" vive en `coniapp/docs/para-constanza.html` y no se incluye aquí.

## JardFruit Pro — Stack TypeScript

El juego más avanzado del laboratorio, construido con stack profesional:

- **Phaser 3.87** — Game engine (5 reels, 3 rows, 5 paylines)
- **TypeScript 5.7** — Type safety
- **Vite 6** — Build tool + dev server
- **Zustand 5** — State management
- **Vitest** — Testing (74 tests)
- **vite-plugin-pwa** — PWA con service worker

### Sistemas implementados
- RNG con lucky straw upgrade
- ReelEngine con spin stagger + anticipation
- PaylineChecker con 5 líneas + extra line upgrade
- Economy: bets, wins, losses, jackpot, prestige, bankruptcy protection
- Bonus Round (3 fresas+) con illuminación circular
- Gamble (doble o nada) con crupier
- Mystery Box con 5 rarezas
- Free Spins (scatter) con multiplicador
- Fruit Garden + Fruit Catcher minijuegos
- Tap Combo + Shake Nudge
- Guide System + Near Miss System
- Daily Login Rewards + Challenge System
- Achievement Checker (15 logros)
- Upgrades (8 mejoras comprables)
- Settings panel (volumen, audio, reset)
- Performance Manager (mobile detection + perf mode)
- Input Manager (keyboard, fullscreen, visibility)

```bash
cd games/jardfruit-pro
npm install
npm run dev      # Desarrollo
npm run build    # Producción
npm run test     # Tests
npm run lint     # ESLint
```

## Motor Reutilizable (HTML Single-File)

El template `templates/game-template.html` incluye todas las mecánicas probadas:

- Sistema de fases dinámicas con progresión
- Motor de movimiento físico (velocity, bouncing, direction changes)
- Comportamientos especiales (zigzag, orbital, pulsante, fugitivo, mini, gigante)
- Streak meter con boost automático
- Critical hits con multiplicadores x2/x3/x5
- 5 power-ups (doble, slow-mo, magnet, freeze, frenzy)
- Combo system con escalado de intensidad
- Sistema de partículas y efectos visuales
- Audio Web API (tonos sintetizados, sin archivos externos)
- Vibración háptica
- Indicador de dificultad progresiva
- HUD distribuido por bordes (sin superposiciones)

## Workflow con Harness

```
/cascade-dev jard-games     → Desarrollo automatizado de specs
/jard-code                  → Loop de desarrollo optimizado
```

Ver `.devin/rules/jard-games.md` para reglas específicas.

## Crear un Nuevo Juego

1. Copiar `templates/game-template.html` a `games/[nombre].html`
2. Personalizar tema, colores, emojis, textos
3. Ajustar parámetros de mecánicas (velocidades, probabilidades, duraciones)
4. Crear spec en `specs/pending/SPEC-XXX-[nombre].md`
5. Ejecutar `/cascade-dev jard-games` o desarrollar manualmente
