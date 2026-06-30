# Prediction Clicker Game — Investigación & Ideas

> Juego móvil clicker donde el usuario predice y apuesta con moneda virtual

---

## 1. Resumen del Concepto

Un juego casual móvil donde el jugador **predice el resultado** de eventos generados proceduralmente (gráficos que suben/bajan, colores, números, direcciones) y **apuesta moneda virtual** sobre su predicción. La mecánica core es **un toque** — simple como un clicker pero con tensión de predicción.

**Género híbrido:** Clicker + Prediction Market + Casual Betting (sin dinero real)

---

## 2. Análisis de Mercado

### Trends 2025-2026
- **Prediction markets** (Polymarket, Kalshi) han explotado — usuarios familiarizados con apostar en resultados
- **Social wagering** en juegos móviles crece: amigos apuestan moneda virtual en resultados de matches
- **Clicker games** valorados en $2.8B (2024), mercado saludable
- **Hyper-casual** sigue dominando: sesiones cortas, "one more try"
- **Tap/swipe mechanics** son el estándar para móvil (Block Swipe, UP or DOWN, Dont Mess Up)

### Referencias Clave
| Juego/App | Mecánica relevante |
|-----------|-------------------|
| Polymarket | Apostar Sí/No en eventos reales |
| UP or DOWN (itch.io) | Predecir si personaje sube o baja |
| Block Swipe | Tap/swipe según instrucción, velocidad creciente |
| Gamblers Table (itch.io) | Clicker + coin flip + upgrades |
| Bitcoin Billionaire | Crypto clicker con upgrades e idle |
| Dont Mess Up | Seguir instrucciones rápido o perder |

### Insight clave
**Nadie ha combinado clicker + prediction betting en un formato casual móvil simple.** El gap del mercado es: la simplicidad de un clicker con la tensión psicológica de una apuesta.

---

## 3. Mecánica Core — "Tap to Predict"

### Loop básico (3 segundos por ronda)
```
1. Aparece un gráfico/objeto en pantalla
2. Jugador decide: ¿Subirá o bajará? (↑ o ↓)
3. Jugador elige cuánto apostar (slider rápido o 3 botones: 10/50/100)
4. Resultado en 2-3 segundos (animación del gráfico)
5. Gana → moneda × multiplicador | Pierde → pierde la apuesta
6. Siguiente ronda inmediatamente
```

### Por qué funciona como clicker
- **Un toque** para predecir (↑/↓)
- **Feedback inmediato** (2-3s por ronda)
- **Dopamina** del acierto + multiplicador
- **Tensión** de la apuesta (risk/reward)
- **Sesiones cortas** (1-5 min perfectas para móvil)

---

## 4. Ideas de Variantes de Predicción

### 4.1 — "Crypto Pulse" (Predicción de gráfico)
```
Pantalla muestra un mini gráfico de velas (generado proceduralmente)
Últimas 5 velas visibles
Jugador predice: ¿Próxima vela verde (↑) o roja (↓)?
Apuesta moneda virtual
Vela se "completa" con animación
Multiplicador según racha de aciertos
```
**Visual:** Gráfico estilo trading con velas verde/roja, glow effects
**Progresión:** Más velas visibles = más información = apuestas más grandes

### 4.2 — "Color Rush" (Predicción de color)
```
Una bolita rebota por la pantalla (como el motor de jard-games)
Antes de que se detenga, jugador predice: ¿Zona roja o zona azul?
Apuesta mientras la bolita se mueve
Bolita se detiene → resultado
Multiplicador según dificultad (más zonas = más riesgo = más premio)
```
**Visual:** Ruleta/círculo con sectores de colores, bolita con física
**Reutiliza:** Motor de física de jard-games (rebotes, velocity)

### 4.3 — "Number Up/Down" (Predicción numérica)
```
Aparece un número grande (ej: 47)
Jugador predice: ¿El próximo será mayor o menor?
Apuesta moneda
Nuevo número aparece con animación (slot machine style)
Acierto → multiplicador creciente
Error → pierde apuesta
```
**Visual:** Números grandes estilo slot machine, animación de "roll"
**Progresión:** Rango de números se amplía (0-100 → 0-1000 → negativos)

### 4.4 — "Arrow Flow" (Predicción de dirección)
```
Flechas aparecen rápidamente en pantalla (↑ ↓ ← →)
Jugador debe predecir la SIGUIENTE flecha antes de que aparezca
Apuesta moneda en su predicción
Si acierta: moneda × multiplicador
Si falla: pierde apuesta + combo se rompe
Velocidad aumenta progresivamente
```
**Visual:** Flechas estilo DDR/osu, glow effects, screen shake en combo
**Reutiliza:** Combo system y streak meter de jard-games

### 4.5 — "Hot or Cold" (Predicción de temperatura)
```
Un termómetro animado sube y baja aleatoriamente
Jugador apuesta: ¿En 3 segundos estará más caliente o más frío?
Termómetro sigue moviéndose durante la apuesta
Resultado al cumplirse el tiempo
Multiplicador según qué tan extremo sea el cambio
```
**Visual:** Termómetro con gradiente azul→rojo, partículas de calor/frío
**Tensión:** El jugador ve el movimiento en tiempo real mientras espera

### 4.6 — "Coin Flip Rush" (Clicker + Coin Flip)
```
Moneda gigante en pantalla
Jugador tap = lanzar moneda
Antes de lanzar, predice: ¿Cara o cruz?
Apuesta moneda virtual
Moneda gira con animación 3D (CSS transform)
Acierto → x2 multiplicador + streak
Error → pierde apuesta
Combo de aciertos seguidos → multiplicador creciente (x2, x3, x5, x10)
```
**Visual:** Moneda 3D con CSS transforms, partículas doradas en acierto
**Simplicidad:** La predicción más básica posible — 50/50 con tensión

### 4.7 — "Trend Hunter" (Predicción de tendencia)
```
Mini gráfico de líneas en pantalla
Línea se dibuja en tiempo real (como heartbeat/ECG)
Jugador debe predecir: ¿La línea terminará arriba o abajo del punto actual?
Tiene 3 segundos para decidir y apostar
Línea sigue dibujándose
Resultado al cortar el tiempo
```
**Visual:** Línea neon estilo Tron, glow effect, grid de fondo
**Skill:** Detectar patrones en el ruido aleatorio (parece skill pero es azar con sesgos)

### 4.8 — "Speed Dice" (Predicción de dado)
```
3 dados girando en pantalla
Jugador predice: ¿Suma será mayor o menor que X?
Apuesta moneda
Dados se detienen uno por uno con animación
Tensión crece con cada dado que se detiene
Multiplicador según margen de acierto
```
**Visual:** Dados 3D CSS, screen shake al detenerse cada dado
**Tensión:** Cada dado que se detiene cambia las probabilidades en tiempo real

---

## 5. Sistema de Apuestas (Moneda Virtual)

### Moneda del juego: "JardCoins" (🪙)

### Flujo de apuesta
```
1. Jugador tiene saldo de JardCoins (empieza con 100)
2. Cada ronda elige cuánto apostar:
   - Quick bet: 3 botones (🪙10 / 🪙50 / 🪙100)
   - All-in: Botón especial (todo el saldo)
3. Predice resultado (↑/↓ o equivalente)
4. Resultado:
   - Acierto: apuesta × multiplicador (según racha)
   - Error: pierde la apuesta
5. Saldo se actualiza con animación
```

### Multiplicador por racha (streak)
| Racha | Multiplicador | Visual |
|-------|---------------|--------|
| 1-2 | x1.5 | Texto blanco |
| 3-4 | x2 | Texto amarillo |
| 5-6 | x3 | Texto naranja + glow |
| 7-9 | x5 | Texto rojo + screen shake |
| 10+ | x10 | Texto dorado + confeti + frenzy |

### Mecánica de "Insurance" (Seguro)
- Si el jugador tiene racha ≥5, puede comprar seguro (10% de la apuesta)
- Si pierde, recupera el 50% de la apuesta
- Si gana, el seguro se pierde
- **Estrategia:** ¿Garantizar ganancias o arriesgar más?

### Bankruptcy protection
- Si el saldo llega a 0, el jugador recibe 10 JardCoins gratis
- Esto asegura que siempre pueda seguir jugando
- Pero el "free money" no cuenta para el high score

---

## 6. Sistemas de Progresión

### 6.1 — Niveles de jugador
```
Nivel 1: 0-500 JardCoins ganados total
Nivel 2: 500-2000
Nivel 3: 2000-5000
...
Cada nivel desbloquea:
- Nuevos modos de predicción
- Mayores apuestas máximas
- Cosméticos (colores de gráfico, efectos)
```

### 6.2 — Upgrades (estilo clicker)
| Upgrade | Costo | Efecto |
|---------|-------|--------|
| Lucky Charm | 200 | +5% probabilidad de critical hit en apuesta |
| Multiplier Boost | 500 | Multiplicador base x1.5 → x2 |
| Insurance Discount | 300 | Seguro cuesta 5% en vez de 10% |
| Streak Saver | 800 | Perder no rompe racha 1 vez por sesión |
| Auto-Collect | 400 | Moneda perdida se recupera 10% automáticamente |
| Max Bet Unlock | 600 | Permite apostar hasta 500 por ronda |
| Double Prediction | 1000 | Permite 2 apuestas simultáneas en modos con múltiples resultados |

### 6.3 — Daily Challenge
- Semilla diaria compartida (todos ven la misma secuencia)
- Una sola oportunidad
- Apuesta fija de 100 JardCoins
- Leaderboard local (localStorage)
- Premio: multiplicador especial + cosmético

### 6.4 — Achievements
| Achievement | Condición | Premio |
|-------------|-----------|--------|
| First Win | Ganar primera ronda | 50 🪙 |
| Hot Streak | Racha de 5 | 100 🪙 |
| On Fire | Racha de 10 | 500 🪙 |
| High Roller | Apostar 500+ en una ronda | 200 🪙 |
| Comeback | Ganar después de estar en 0 | 300 🪙 |
| All In | Hacer all-in y ganar | 500 🪙 |
| Perfect Day | Daily challenge perfecto | 1000 🪙 |
| Centurion | 100 rondas ganadas | 1000 🪙 |

---

## 7. Modos de Juego

### 7.1 — Classic Mode (Endless)
- Ronda tras ronda sin límite
- Dificultad escala con nivel del jugador
- Objetivo: acumular JardCoins + high score
- Game over solo si el jugador decide parar (o bankruptcy con free money)

### 7.2 — Rush Mode (60 segundos)
- 60 segundos, todas las rondas que puedas
- Apuesta mínima: 50 JardCoins
- Multiplicadores x2 en todo
- Objetivo: maximizar JardCoins en tiempo limitado
- Ideal para sesiones cortas

### 7.3 — Survival Mode
- Empiezas con 100 JardCoins
- Sin free money si llegas a 0
- Cada 5 rondas, apuesta mínima sube
- ¿Hasta dónde llegas?
- Leaderboard local

### 7.4 — Duel Mode (vs IA)
- IA hace predicciones simultáneas
- Quien acierte más en 10 rondas gana
- Apuesta: 200 JardCoins entrada
- Premio: 400 JardCoins si ganas
- La IA tiene "personalidad" (conservadora, agresiva, caótica)

---

## 8. Diseño Visual (alineado con jard-games)

### Paleta de colores
```css
:root {
  --color-bg: #0a0a1a;
  --color-surface: #12122a;
  --color-up: #00ff88;      /* Verde - predicción arriba */
  --color-down: #ff3366;    /* Rojo - predicción abajo */
  --color-gold: #ffd700;    /* Dorado - moneda/premium */
  --color-accent: #7c3aed;  /* Púrpura - UI accent */
  --color-text: #ffffff;
  --color-muted: #8888aa;
}
```

### HUD Layout (siguiendo INDICATORS.md)
```
┌──────────────────────────────────────────────┐
│  [SALDO 🪙]           [NIVEL]      [SONIDO]  │ ← Top border
│  [STREAK BAR]                                 │
│                                               │
│                                               │
│         GRÁFICO / OBJETO DE PREDICCIÓN        │
│              (centro libre)                   │
│                                               │
│                                               │
│  [APUESTA]    [↑ UP]  [↓ DOWN]   [MULT]     │ ← Bottom border
└──────────────────────────────────────────────┘
```

### Efectos visuales reutilizables de jard-games
- **Partículas** en acierto (explosión radial verde/dorada)
- **Screen shake** en racha alta (≥5)
- **Confeti** en milestones (nivel up, achievement)
- **Aurora background** con blobs animados
- **Score flotante** "+150 🪙" que asciende y desvanece
- **Combo display** "🔥 STREAK x5!" en bottom-center
- **Glassmorphism** en HUD con `backdrop-filter: blur(10px)`

### Animaciones clave
| Evento | Animación | Duración |
|--------|-----------|----------|
| Predicción correcta | Flash verde + partículas + score flotante | 0.5s |
| Predicción incorrecta | Flash rojo + screen shake leve | 0.3s |
| Racha ≥5 | Glow dorado pulsante en HUD | Continuo |
| Racha ≥10 | Confeti + frenzy mode (fondo cambia) | 3s |
| All-in win | Confeti masivo + fuegos artificiales | 2s |
| Level up | Confeti + modal con premio | 2s |
| Bankruptcy | Pantalla oscura + "Free 10 🪙" con animación | 1.5s |

### Audio (Web Audio API, sintetizado)
| Función | Frecuencia | Tipo | Descripción |
|---------|-----------|------|-------------|
| playWin | 523+659Hz | sine | Acierto (arpeggio ascendente) |
| playLoss | 330+220Hz | sine | Error (descendente) |
| playStreak(n) | 440 + n*60Hz | triangle | Raja creciente |
| playBet | 800Hz | square | Apuesta colocada |
| playCoin | 1319Hz | sine | Moneda ganada |
| playLevelUp | 523+659+784+1047Hz | sine | Level up fanfare |
| playAllIn | 1568Hz | square | All-in tension |

### Haptics
| Evento | Patrón |
|--------|--------|
| Acierto | 30ms |
| Error | [50, 30, 50] |
| Racha 5 | [30, 20, 30, 20, 50] |
| Racha 10 | [50, 30, 50, 30, 80] |
| All-in | [100] |
| Level up | [50, 30, 50, 30, 50, 30, 100] |

---

## 9. Monetización (Opcional — sin dinero real)

### Opciones no intrusivas
- **Banner ads** en pantalla de game over (no durante gameplay)
- **Rewarded video** — ver ad para recibir 50 JardCoins (opcional)
- **Cosméticos** — temas visuales (dark, neon, pastel, retro)
- **Remove ads** — compra única ($1.99)
- **Starter pack** — 500 JardCoins + Lucky Charm upgrade ($0.99)

### Regla de oro
**Nunca pay-to-win.** Todo se puede conseguir jugando. Las compras solo aceleran cosméticos.

---

## 10. Arquitectura Técnica (alineado con jard-games)

### Stack
- **Single-file HTML** — Sin dependencias, sin frameworks
- **Mobile-first** — Diseñado para táctil
- **60fps** — `requestAnimationFrame` para animaciones
- **localStorage** — Guardar saldo, nivel, achievements, high scores
- **Web Audio API** — Audio sintetizado
- **navigator.vibrate** — Haptics

### Estructura de datos
```js
let gameState = {
  saldo: 100,           // JardCoins actuales
  nivel: 1,
  expTotal: 0,          // Para progresión de nivel
  racha: 0,             // Racha actual de aciertos
  rachaMax: 0,          // Racha máxima histórica
  apuestaActual: 0,
  prediccionActual: null, // 'up' | 'down'
  modoJuego: 'classic',   // 'classic' | 'rush' | 'survival' | 'duel'
  upgrades: {
    luckyCharm: false,
    multiplierBoost: false,
    insuranceDiscount: false,
    streakSaver: false,
    autoCollect: false,
    maxBetUnlock: false,
    doublePrediction: false,
  },
  achievements: [],
  highScore: 0,
  dailyChallenge: {
    fecha: null,
    completado: false,
    resultado: null,
  },
};
```

### Generación procedural de eventos
```js
function generarEvento(modo) {
  switch(modo) {
    case 'crypto':
      // Generar velas con sesgo aleatorio
      return generarVelas(5, dificultad);
    case 'color':
      // Generar sectores de colores con probabilidades
      return generarRuleta(dificultad);
    case 'number':
      // Generar número y rango
      return generarNumero(rangoActual);
    case 'arrow':
      // Generar secuencia de flechas
      return generarSecuencia(velocidadActual);
  }
}
```

### Guardado en localStorage
```js
function guardarEstado() {
  localStorage.setItem('jard-predict-save', JSON.stringify(gameState));
}

function cargarEstado() {
  const saved = localStorage.getItem('jard-predict-save');
  if (saved) gameState = { ...gameState, ...JSON.parse(saved) };
}
```

---

## 11. Roadmap de Implementación

### Fase 1 — MVP (1-2 días)
- [ ] Modo Classic con "Crypto Pulse" (gráfico de velas)
- [ ] Sistema de apuestas (10/50/100)
- [ ] Multiplicador por racha
- [ ] Saldo + localStorage
- [ ] HUD básico (saldo, racha, botones ↑/↓)
- [ ] Efectos visuales básicos (partículas, score flotante)
- [ ] Audio básico (win/loss)
- [ ] Pantalla de game over + restart

### Fase 2 — Progresión (1-2 días)
- [ ] Sistema de niveles
- [ ] Upgrades comprables
- [ ] Achievements
- [ ] Daily challenge
- [ ] Leaderboard local

### Fase 3 — Más modos (2-3 días)
- [ ] Color Rush (ruleta)
- [ ] Number Up/Down (slot machine)
- [ ] Rush Mode (60s)
- [ ] Survival Mode
- [ ] Duel Mode vs IA

### Fase 4 — Pulido (1-2 días)
- [ ] Cosméticos / temas visuales
- [ ] Animaciones avanzadas (confeti, frenzy, aurora)
- [ ] Haptics completos
- [ ] Música dinámica por racha
- [ ] Tutorial / onboarding
- [ ] PWA installable

---

## 12. Idea Recomendada — "JardPredict"

### Por qué esta combinación
Mezclando las mejores ideas en un solo juego:

**Core:** Crypto Pulse (gráfico de velas) como modo principal
**Apuesta:** 3 botones rápidos (10/50/100) + All-in
**Tensión:** Animación de vela completándose en 2-3s
**Dopamina:** Multiplicador por racha con efectos visuales escalados
**Progresión:** Upgrades + niveles + achievements
**Variedad:** 4 modos de juego (Classic, Rush, Survival, Duel)
**Sesiones:** 1-5 minutos, "one more try"

### Diferenciador único
**No es solo azar — hay skill aparente.** El gráfico muestra velas pasadas, y aunque el resultado es aleatorio, el jugador siente que puede "leer" el patrón. Esto crea la ilusión de control que hace adictivos los prediction markets reales, pero en un entorno seguro y divertido.

### Nombre sugerido
**JardPredict** — "Predice. Apuesta. Gana."

---

## 13. Spec Sugerida

```
SPEC-001: JardPredict — Prediction Clicker MVP
Prioridad: High
Estimación: 2 días
Modo: Classic (Crypto Pulse)
Stack: Single-file HTML (jard-games)
Dependencias: Motor de jard-games (física, partículas, audio, haptics)
```

---

## 14. Conclusión

El concepto de **prediction clicker** llena un gap en el mercado móvil casual:
- **Simplicidad de clicker** (un toque para jugar)
- **Tensión de apuesta** (risk/reward con moneda virtual)
- **Progresión de idle/incremental** (upgrades, niveles)
- **Sesiones cortas** perfectas para móvil
- **Rejugabilidad infinita** (eventos procedurales + modos múltiples)

Con el motor existente de jard-games (física, partículas, audio, haptics, combo system), implementar el MVP es factible en 1-2 días como un solo archivo HTML.
