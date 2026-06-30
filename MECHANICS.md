# Mechanics Catalog — Jard Games

Catálogo completo de mecánicas implementadas y disponibles para nuevos juegos.

---

## 1. Combo System

**Dopamina por encadenamiento rápido.**

- Ventana de combo: 1.5s entre toques
- Combo incrementa con cada toque dentro de la ventana
- Al romper la ventana: combo = 1
- Escalado de intensidad de música según combo (4 niveles)
- Display visual: "🔥 Combo x5!" en bottom-center

```js
if (ahora - ultimoTouch < 1500) {
  combo++;
  if (combo >= 2) { mostrarCombo(combo); playCombo(combo); }
} else {
  combo = 1;
  decaerStreak();
}
ultimoTouch = ahora;
```

**Parámetros ajustables:** `ventanaCombo` (ms), `comboMinimoDisplay` (n)

---

## 2. Streak Meter

**Barra que se llena con combos sostenidos.**

- Capacidad: 0-100
- Ganancia por combo: `+8 + combo * 2`
- Decaimiento al perder combo: `-15`
- Al llenarse (100): activa **x2 bonus automático** por 4s
- Visual: barra horizontal en header con gradiente rosa→dorado
- Estado full: animación pulsante dorada

**Parámetros ajustables:** `streakMax`, `gananciaBase`, `gananciaPorCombo`, `decaimiento`, `duracionBoost`

---

## 3. Critical Hits

**Golpes críticos aleatorios con multiplicador.**

- Probabilidad base: 8% + 3% por fase
- Bonus para entidades raras: +10%
- Multiplicadores: x2 (50%), x3 (33%), x5 (17%)
- Visual: texto "CRIT x5!" dorado que vola hacia arriba
- Audio: tono agudo distintivo (1568Hz)

```js
function intentarCrit(tipo) {
  const baseChance = 0.08 + faseActual * 0.03;
  const critChance = tipo === 'raro' ? baseChance + 0.1 : baseChance;
  if (Math.random() < critChance) {
    const multipliers = [2, 2, 2, 3, 3, 5];
    return multipliers[Math.floor(Math.random() * multipliers.length)];
  }
  return 1;
}
```

**Parámetros ajustables:** `baseChance`, `bonusPorFase`, `bonusTipoRaro`, `multiplicadores[]`

---

## 4. Power-Ups

**5 power-ups con efectos temporales.**

| ID | Emoji | Nombre | Duración | Efecto |
|----|-------|--------|----------|--------|
| doble | ⚡ | x2 Puntos | 8s | Multiplicador boost = 2 |
| slowmo | 🐌 | Cámara Lenta | 6s | Velocidad de entidades × 0.3 |
| magnet | 🧲 | Imán | 5s | Atracción al centro del área |
| freeze | ❄️ | Congela | 4s | Velocidad = 0 (entidades estáticas) |
| frenzy | 🔥 | Frenesí | 5s | Spawn masivo + x3 puntos |

- Spawn chance: 8% + 3% por fase (después del 3er target)
- Aparecen como iconos flotantes (5s de vida)
- Solo uno activo a la vez
- Visual: badge en bottom-left + cambio de filter CSS
- Audio: doble tono ascendente (1047Hz → 1319Hz)

**Parámetros ajustables:** `chanceBase`, `bonusPorFase`, `duracionPorTipo[]`, `maxActivos`

---

## 5. Phase System

**4 fases dinámicas que escalan dificultad.**

| Fase | Nombre | Intervalo | Vida | Max entidades | Comportamientos | Rush chance |
|------|--------|-----------|------|---------------|-----------------|-------------|
| 0 | 🌸 Primavera | 1600ms | 3500ms | 3 | drift | 0% |
| 1 | 🔥 Pasión | 1200ms | 2800ms | 4 | drift, zigzag, pulsante | 15% |
| 2 | 💫 Torbellino | 900ms | 2200ms | 5 | + orbital, fugitivo | 25% |
| 3 | 🌟 Éxtasis | 700ms | 1800ms | 6 | + mini | 35% |

- Progresión basada en `% de progreso` (25%, 50%, 75%)
- Cambio de fase: confeti + cambio de tempo musical + indicador visual
- Rush wave: spawn masivo temporal con aviso "¡RUSH!"

**Parámetros ajustables:** `fases[]`, `umbralCambioFase[]`, `rushChancePorFase[]`

---

## 6. Physics Movement

**Motor de movimiento con velocity vectors.**

Por cada entidad:
- `vx, vy` — Vector de velocidad inicial
- Rebote en bordes (inversión de velocidad + clamp de posición)
- Cambio de dirección aleatorio cada 1-2.5s
- Speed scaling: `baseSpeed * (1 + faseActual * 0.3)`

**Comportamientos especiales:**

| Comportamiento | Descripción | Speed modifier |
|----------------|-------------|----------------|
| drift | Lineal con rebotes | 1.0x |
| zigzag | Oscilación perpendicular sinusoidal | 1.0x |
| orbital | Círculos alrededor de centro móvil | 1.0x |
| pulsante | Velocidad varía con pulso sinusoidal | 0.5x-1.5x |
| fugitivo | Huye del cursor/touch cercano | 1.4x + impulso |
| mini | Tamaño pequeño, más rápido | 1.6x |
| gigante | Tamaño grande, más lento | 0.5x |

**Parámetros ajustables:** `baseSpeed`, `speedPorFase`, `intervaloCambioDireccion`, `speedPorComportamiento[]`

---

## 7. Difficulty Indicator

**Indicador visual de dificultad progresiva.**

- 10 puntos circulares en bottom-right
- Se encienden: rosa (1-7), dorado (8-10)
- Fórmula: `1 + faseActual + floor(perdidos / 3)`
- Texto "Nivel X" alongside

---

## 8. Visual Effects

### Particles
- Explosión radial al tocar (8-14 partículas)
- Emojis variados según tipo de entidad
- Animación CSS con `--dx`, `--dy`, `--rot` custom properties

### Onda expansiva
- Círculo que se expande desde punto de toque
- Color según tipo de entidad

### Confeti
- Lluvia de emojis desde arriba
- Usado en hitos, cambio de fase, power-ups

### Screen shake
- `body.classList.add('shake')` en combos altos (≥4)
- CSS animation con translate

### Score flotante
- Texto "+puntos" que flota y desvanece
- Color según tipo de entidad

### Aurora background
- 3 blobs con `filter: blur(80px)` animados
- Gradient animado en fondo
- Estrellas fijas + corazones flotantes de fondo

---

## 9. Audio System

**Web Audio API sintetizado, sin archivos.**

| Función | Frecuencia | Tipo | Volumen |
|---------|-----------|------|---------|
| playTouch | 800Hz | sine | 0.08 |
| playGolden | 1047+1319+1568Hz | sine arpeggio | 0.1 |
| playCombo(n) | 440 + n*80Hz | triangle | 0.1 |
| playMilestone | 523+659+784Hz | sine arpeggio | 0.12 |
| playCrit | 1568Hz | square | 0.1 |
| playPowerup | 1047→1319Hz | square | 0.12 |

Music layers (4): drums + bass + melody + harmony, activados progresivamente por combo/fase.

---

## 10. Haptics

| Evento | Patrón |
|--------|--------|
| Touch normal | 30ms |
| Touch dorado | [30, 20, 30, 20, 50] |
| Power-up | [20, 30, 20, 30, 40] |
| Milestone | [50, 30, 50, 30, 80] |
| Cambio de fase | [30, 20, 50] |
| Inicio juego | 50ms |

---

## Mecánicas Futuras (No Implementadas)

- **Idle/Passive income** — Entidades que generan puntos automáticamente
- **Prestige system** — Reset con bonus permanente
- **Skill tree** — Desbloqueo de mejoras con puntos
- **Daily challenge** — Semilla diaria con configuración única
- **Leaderboard local** — localStorage con top 10 scores
- **Achievements** — Logros desbloqueables
- **Boss entities** — Entidades grandes con vida múltiple
- **Chain reaction** — Tocar una entidad afecta cercanas
