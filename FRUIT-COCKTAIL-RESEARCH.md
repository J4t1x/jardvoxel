# Fruit Cocktail Slot — Investigación & Ideas

> Tragamonedas de frutas inspirada en Fruit Cocktail (Igrosoft 2009), adaptada a jard-games como single-file HTML

---

## 1. Resumen del Concepto

Un juego de **tragamonedas (slot) temático de frutas** con moneda virtual, mecánica de giros, líneas de pago bidireccionales, ronda de bonos interactiva y función de riesgo (doble o nada). Todo en un solo archivo HTML, mobile-first, sin dependencias.

**Género:** Slot machine casual (sin dinero real)

---

## 2. Análisis del Juego Original

### Fruit Cocktail (Igrosoft 2009)

| Característica | Detalle |
|----------------|---------|
| Estructura | 5 carretes × 3 filas |
| Líneas de pago | Hasta 9 (configurables: 1, 3, 5, 7, 9) |
| Pago | Bidireccional (izquierda→derecha y derecha→izquierda) |
| RTP | 94.39% (original) |
| Volatilidad | Media |
| Símbolos | 9 total (7 frutas + comodín + bonus) |
| Temática | Frutas retro + cócteles tropicales |

### Símbolos y Pagos (original)

| Símbolo | Emoji | Función | Multiplicador máx |
|---------|-------|---------|-------------------|
| Logotipo Fruit Cocktail | 🍹 | Top prize | x5000 |
| Cóctel (Wild) | 🥃 | Comodín (sustituye todo excepto bonus y logo) | x2000 |
| Fresa (Bonus) | 🍓 | Activa ronda de bonos (3+ en cualquier posición) | — |
| Sandía | 🍉 | Símbolo base | x500 |
| Pera | 🍐 | Símbolo base | x200 |
| Manzana | 🍎 | Símbolo base | x100 |
| Limón | 🍋 | Símbolo base | x50 |
| Albaricoque | 🍑 | Símbolo base | x30 |
| Cerezas | 🍒 | Símbolo base | x20 |

### Mecánicas Clave del Original

1. **Giros configurables** — El jugador elige cuántas líneas activar (1-9)
2. **Pago bidireccional** — Combinaciones pagan izquierda→derecha Y derecha→izquierda
3. **Ronda de Bonos** — 3+ fresas activan mini-juego con carrete central + bordes iluminados
4. **Función de Riesgo (Gamble)** — Doble o nada con cartas (batir al crupier)
5. **Combinaciones parciales** — 3+ símbolos idénticos con hasta 2 símbolos diferentes mezclados

### Ronda de Bonos (detalle)

```
1. 3+ fresas en pantalla → activa bono
2. Número de intentos = número de fresas (3→1, 4→2, 5→3)
3. Pantalla secundaria: carrete central de 3 posiciones
4. Bordes de pantalla tienen símbolos de frutas iluminados secuencialmente
5. Carrete central gira → se detiene → muestra 3 frutas
6. Si fruta iluminada del borde coincide con carrete central → premio (x2 a x100)
7. Si borde ilumina casilla "EXIT" → pierde un intento
8. Sin intentos → fin del bono, premios acumulados al saldo
```

### Función de Riesgo (detalle)

```
1. Tras ganar, jugador puede arriesgar premio
2. Pantalla con 5 cartas: 1 del crupier (visible) + 4 del jugador (boca abajo)
3. Jugador elige 1 carta
4. Si su carta > crupier → premio duplicado (puede repetir)
5. Si su carta < crupier → pierde todo el premio
6. Puede cobrar y salir en cualquier momento
```

---

## 3. Adaptación a Jard-Games

### Reglas del harness que aplican

- **Un archivo = un juego** — HTML + CSS + JS embebido
- **Mobile-first** — Controles táctiles grandes
- **60fps** — `requestAnimationFrame` para animación de carretes
- **Sin dependencias externas** — Todo vanilla JS
- **HUD en bordes** — Centro libre para carretes
- **Web Audio API** — Sonidos sintetizados (no archivos)
- **navigator.vibrate** — Haptics en giros, premios, bonos
- **localStorage** — Guardar saldo, high score, estadísticas

### Diferencias con el original (nuestra versión)

| Aspecto | Original | Nuestra versión |
|---------|----------|-----------------|
| Dinero | Real o virtual de casino | JardCoins (moneda virtual, sin dinero real) |
| Líneas | 1-9 configurables | 5 fijas (simplificación mobile) |
| RTP | 94.39% | ~96% (más generoso = más divertido) |
| Graphics | Gráficos retro pixelados | Emojis + CSS gradients + glow effects |
| Sonido | Archivos de audio | Web Audio API sintetizado |
| Plataforma | Desktop/Físico | Mobile-first web |
| Extra | — | Upgrades, achievements, streak system |

---

## 4. Mecánica Core — "Spin & Win"

### Loop básico (5-8 segundos por giro)

```
1. Jugador ajusta apuesta (botones: 10 / 50 / 100 / ALL)
2. Jugador presiona SPIN (botón grande central)
3. Carretes giran con animación (1.5-2s)
4. Carretes se detienen uno por uno (tensión creciente)
5. Evaluación de líneas de pago
6. Si hay premio: animación de celebración + monedas
7. Si 3+ fresas: activa RONDA DE BONOS
8. Si hay premio: opción de DOBLE O NADA
9. Siguiente giro
```

### Por qué funciona como casual

- **Un toque** para girar (SPIN button)
- **Feedback inmediato** (carretes animados, sonido mecánico)
- **Dopamina** del premio + multiplicador
- **Tensión** de la apuesta (risk/reward)
- **Sorpresa** de la ronda de bonos
- **Decisiones** en doble o nada (agencia del jugador)

---

## 5. Estructura del Juego

### 5.1 — Grid de Carretes

```
    ┌─────┬─────┬─────┬─────┬─────┐
    │ 🍒 │ 🍋 │ 🍎 │ 🍐 │ 🍉 │  ← Fila 1
    ├─────┼─────┼─────┼─────┼─────┤
    │ 🍓 │ 🍹 │ 🍒 │ 🍋 │ 🍎 │  ← Fila 2 (centro)
    ├─────┼─────┼─────┼─────┼─────┤
    │ 🍑 │ 🍉 │ 🍐 │ 🍓 │ 🍋 │  ← Fila 3
    └─────┴─────┴─────┴─────┴─────┘
      R1    R2    R3    R4    R5
```

### 5.2 — Líneas de Pago (5 fijas)

```
Línea 1: ───── Fila superior (R1-R2-R3-R4-R5 fila 1)
Línea 2: ───── Fila central (R1-R2-R3-R4-R5 fila 2)
Línea 3: ───── Fila inferior (R1-R2-R3-R4-R5 fila 3)
Línea 4: ─V─── Diagonal descendente (R1-fila1 → R5-fila3)
Línea 5: ─^─── Diagonal ascendente (R1-fila3 → R5-fila1)
```

### 5.3 — Tabla de Pagos (nuestra versión)

| Símbolo | Emoji | x3 | x4 | x5 | Función especial |
|---------|-------|-----|-----|-----|------------------|
| 🍹 Cóctel | 🍹 | x50 | x200 | x1000 | WILD — sustituye cualquier fruta |
| 🍓 Fresa | 🍓 | — | — | — | BONUS — 3+ activa ronda de bonos |
| 🍉 Sandía | 🍉 | x20 | x50 | x200 | — |
| 🍐 Pera | 🍐 | x10 | x25 | x100 | — |
| 🍎 Manzana | 🍎 | x5 | x15 | x50 | — |
| 🍋 Limón | 🍋 | x3 | x10 | x30 | — |
| 🍑 Durazno | 🍑 | x2 | x8 | x20 | — |
| 🍒 Cerezas | 🍒 | x2 | x5 | x10 | — |

### 5.4 — Pago Bidireccional

Las combinaciones pagan en **ambas direcciones**:
- Izquierda → Derecha (tradicional)
- Derecha → Izquierda (doble chance)

Esto significa que con 5 carretes, una línea puede generar **2 pagos** si tiene combinaciones en ambos sentidos.

---

## 6. Ronda de Bonos — "Fresa Bonus"

### Activación
- 3+ fresas (🍓) en cualquier posición de los carretes
- Número de intentos = número de fresas (3→1, 4→2, 5→3)

### Pantalla de Bonos

```
┌──────────────────────────────────────┐
│  🍉   🍐   🍎   🍋   🍑   🍒  EXIT │ ← Borde iluminado (secuencial)
│                                      │
│         ┌─────┬─────┬─────┐          │
│         │ 🍎 │ 🍉 │ 🍐 │          │ ← Carrete central (3 posiciones)
│         └─────┴─────┴─────┘          │
│                                      │
│  Intentos: ⭐⭐⭐  Premios: 🪙 340   │
└──────────────────────────────────────┘
```

### Mecánica del bono

```
1. Borde ilumina un símbolo secuencialmente (rápido, ~200ms por símbolo)
2. Carrete central gira y se detiene mostrando 3 frutas
3. Si la fruta iluminada del borde coincide con alguna del carrete:
   → Premio = apuesta × multiplicador del símbolo
4. Si el borde ilumina "EXIT":
   → Pierde 1 intento
5. Repite hasta quedarse sin intentos
6. Premios acumulados se suman al saldo
```

### Multiplicadores del bono

| Símbolo del borde | Multiplicador |
|-------------------|---------------|
| 🍒 Cerezas | x2 |
| 🍑 Durazno | x5 |
| 🍋 Limón | x10 |
| 🍎 Manzana | x20 |
| 🍐 Pera | x30 |
| 🍉 Sandía | x50 |
| EXIT | Pierde intento |

---

## 7. Función de Riesgo — "Doble o Nada"

### Activación
- Solo después de un giro ganador
- Jugador decide: cobrar o arriesgar

### Mecánica

```
1. Pantalla secundaria con 5 cartas
2. Carta del crupier (visible) — valor 2-14 (2-Ace)
3. 4 cartas del jugador (boca abajo)
4. Jugador toca una carta
5. Si carta jugador > carta crupier:
   → Premio × 2
   → Puede repetir o cobrar
6. Si carta jugador ≤ carta crupier:
   → Pierde todo el premio
7. Empate = pierde (ventaja casa)
```

### Visual

```
┌──────────────────────────────────────┐
│           DOBLE O NADA               │
│                                      │
│    [🂠 Crupier: 7♥]                  │
│                                      │
│   [🂠]  [🂠]  [🂠]  [🂠]              │
│    1     2     3     4               │
│                                      │
│  Premio actual: 🪙 200               │
│  [COBRAR]         [ARRIESGAR]        │
└──────────────────────────────────────┘
```

### Límite de rondas de riesgo
- Máximo 5 rondas consecutivas (premio máx ×32)
- Después de 5 aciertos, auto-cobra

---

## 8. Sistema de Apuestas

### Moneda: JardCoins (🪙)

### Flujo de apuesta

```
1. Saldo inicial: 1000 JardCoins
2. Antes de cada giro, ajustar apuesta:
   - Botones rápidos: 🪙10 / 🪙50 / 🪙100 / 🪙500
   - ALL IN: apostar todo el saldo
3. Presionar SPIN
4. Apuesta se descuenta del saldo
5. Si hay premio: apuesta × multiplicador se suma al saldo
6. Si no hay premio: apuesta perdida
```

### Cálculo de premio por línea

```
premioLínea = apuesta × multiplicadorSímbolo × cantidadCoincidencias
premioTotal = suma(premioLínea) para cada línea activa
```

### Ejemplo

```
Apuesta: 50 🪙
Línea 2 (centro): 🍒 🍒 🍒 🍋 🍐
→ 3 cerezas izquierda→derecha: 50 × 2 = 100 🪙
→ No hay combinación derecha→izquierda
Premio línea 2: 100 🪙

Línea 4 (diagonal): 🍉 🍹 🍉 🍉 🍎
→ Wild sustituye → 4 sandías: 50 × 50 = 2500 🪙
Premio línea 4: 2500 🪙

Premio total: 2600 🪙
```

### Bankruptcy protection
- Si saldo llega a 0 → regala 50 🪙 gratis
- Free money no cuenta para high score

---

## 9. Sistemas de Progresión

### 9.1 — Niveles de jugador

| Nivel | JardCoins ganados total | Desbloquea |
|-------|------------------------|------------|
| 1 | 0 - 5,000 | Básico |
| 2 | 5,000 - 20,000 | Apuesta máx 500 |
| 3 | 20,000 - 50,000 | +1 línea extra |
| 4 | 50,000 - 100,000 | Auto-spin (10 giros) |
| 5 | 100,000+ | Turbo mode (giros x2 velocidad) |

### 9.2 — Upgrades comprables

| Upgrade | Costo | Efecto |
|---------|-------|--------|
| Lucky Straw | 500 🪙 | +5% chance de fresa bonus |
| Multiplier Boost | 1000 🪙 | Multiplicadores base +20% |
| Insurance | 800 🪙 | En doble o nada, empate = recuperar (no perder) |
| Streak Saver | 1500 🪙 | Primer loss del bono no cuenta (1 vez por bono) |
| Auto-Spin x10 | 2000 🪙 | 10 giros automáticos |
| Turbo Mode | 3000 🪙 | Giros 2x más rápidos |
| Extra Line | 5000 🪙 | Desbloquea línea 6 (zigzag) |
| Double Wild | 8000 🪙 | Wild cuenta como x2 en combinaciones |

### 9.3 — Achievements

| Achievement | Condición | Premio |
|-------------|-----------|--------|
| First Spin | Primer giro | 10 🪙 |
| First Win | Primer premio | 50 🪙 |
| Cherry Picker | 3 cerezas en línea | 100 🪙 |
| Wild One | Wild en combinación ganadora | 100 🪙 |
| Bonus Hunter | Activar ronda de bonos | 200 🪙 |
| Bonus Master | Ganar 1000+ en bono | 500 🪙 |
| Gambler | Usar doble o nada 10 veces | 200 🪙 |
| Double Down | Ganar 5 rondas de riesgo seguidas | 500 🪙 |
| High Roller | Apostar 500+ en un giro | 300 🪙 |
| All In | Hacer ALL IN y ganar | 1000 🪙 |
| Fruit Master | 100 giros ganados | 1000 🪙 |
| Jackpot | 5 🍹 en una línea | 5000 🪙 |

### 9.4 — Estadísticas persistentes (localStorage)

```js
stats = {
  totalSpins: 0,
  totalWins: 0,
  totalBet: 0,
  totalWon: 0,
  biggestWin: 0,
  bonosTriggered: 0,
  gambleWins: 0,
  gambleLosses: 0,
  bestStreak: 0,
  jackpots: 0,
}
```

---

## 10. Modos de Juego

### 10.1 — Classic Mode (Endless)
- Giro tras giro sin límite
- Objetivo: acumular JardCoins + subir de nivel
- Sin game over (bankruptcy protection activa)

### 10.2 — Rush Mode (60 segundos)
- 60 segundos, todos los giros que puedas
- Multiplicadores x2 en todo
- Auto-spin forzado
- Objetivo: maximizar ganancias en tiempo limitado

### 10.3 — Survival Mode
- Empiezas con 500 🪙
- Sin bankruptcy protection
- Apuesta mínima sube cada 10 giros
- ¿Hasta dónde llegas?

### 10.4 — Daily Challenge
- Semilla diaria (misma secuencia para todos)
- 20 giros con apuesta fija de 100 🪙
- Leaderboard local
- Premio: multiplicador especial + cosmético

---

## 11. Mecánicas Clicker Integradas

El slot no es pasivo — se fusiona con mecánicas clicker para mantener al jugador **activamente tocando** entre giros y durante giros. Esto convierte el "esperar y ver" en "tocar y ganar".

### 11.1 — Tap to Nudge (Tocar para empujar carrete)

Durante el giro, el jugador puede **tocar un carrete individual** para frenarlo antes. Esto da agencia sobre cuándo se detiene cada carrete.

```
1. SPIN inicia → 5 carretes giran
2. Jugador puede tocar cualquier carrete para detenerlo antes
3. Carretes no tocados se detienen solos secuencialmente
4. Si detiene un carrete y forma parte de una línea ganadora → "Nudge Bonus"
```

**Nudge Bonus:** Si el jugador detiene un carrete y forma parte de una línea ganadora que no se habría formado con el resultado natural → +50% premio en esa línea.

**Skill aparente:** El jugador siente que su timing importa (aunque el resultado ya está determinado al iniciar el giro, el nudge solo afecta el display timing).

### 11.2 — Fruit Garden (Idle Tapper entre giros)

Entre giros, frutas pequeñas aparecen flotando en el área de juego. El jugador las toca para ganar **JardCoins extra**.

```
- Cada 3 segundos, 1-3 frutas flotantes aparecen
- Tocar una fruta = +1 a +5 JardCoins (según tipo)
- Fruta dorada rara (5%) = +50 JardCoins
- Frutas duran 5 segundos antes de desaparecer
- No interrumpen el flujo de giros
- Solo aparecen cuando no hay carretes girando
```

**Visual:** Frutas pequeñas (32px) flotando con `requestAnimationFrame`, rebotes suaves, glow effect.

**Progresión:** Upgrades aumentan la frecuencia y valor de frutas flotantes.

### 11.3 — Tap Combo Multiplier (Ritmo de toque)

Mientras los carretes giran, el jugador puede **tocar rápidamente** la pantalla para cargar un multiplicador de tap combo.

```
1. SPIN presionado → carretes giran (1.5-2s)
2. Durante el giro, cada toque en pantalla suma al tap combo
3. Tap combo display visible: "🫳 x12"
4. Al detenerse los carretes:
   - Tap combo 1-5: sin bonus
   - Tap combo 6-10: +5% premio total
   - Tap combo 11-20: +10% premio total
   - Tap combo 21+: +15% premio total
5. Si no hay premio → tap combo se pierde
```

**Por qué funciona:** Da al jugador algo que hacer durante el giro en vez de solo esperar. La dopamina del tap rápido + el premio amplificado = doble recompensa.

**Visual:** Contador de tap combo en bottom-center con animación de punch en cada toque. Screen pulse sutil cada 5 toques.

### 11.4 — Fruit Catcher (Mini-clicker entre giros)

Tras cada giro (ganador o no), 3 frutas caen desde arriba durante 2 segundos. El jugador las toca al vuelo para atraparlas.

```
- 3 frutas caen desde arriba tras cada giro
- Tocar fruta = +2-10 JardCoins
- Atrapar las 3 = "Perfect Catch!" +20 JardCoins bonus
- No atrapar ninguna = sin penalización
- Duración: 2 segundos
- Se puede skip tocando SPIN inmediatamente
```

**Visual:** Frutas cayendo con gravedad simulada, partículas al atrapar, texto "Perfect Catch!" dorado.

### 11.5 — Shake to Nudge (Sacudir para empujar)

Si el jugador sacude el teléfono (o toca rápidamente 5x) después de un giro perdedor, puede activar un **Reel Nudge** que desplaza un carrete una posición.

```
1. Giro perdedor → "¡Casi!" aparece
2. Ventana de 3 segundos para sacudir/tocar 5x
3. Si activa a tiempo → 1 carrete aleatorio se desplaza 1 posición
4. Re-evaluación de líneas
5. Si ahora hay premio → "NUDGE WIN!" con celebración
6. Máximo 1 nudge por giro (upgrade puede aumentar a 2)
```

**Por qué funciona:** Convierte la frustración de perder en una oportunidad de redención activa. El jugador siente que "casi ganó" y puede hacer algo al respecto.

### 11.6 — Clicker Upgrades (Mejoras de toque)

Upgrades específicos para las mecánicas clicker:

| Upgrade | Costo | Efecto |
|---------|-------|--------|
| Golden Touch | 600 🪙 | Frutas flotantes valen x2 |
| Fruit Magnet | 1200 🪙 | Frutas flotantes se acercan al dedo |
| Catch Master | 800 🪙 | Fruit Catcher da x3 en vez de x2-10 |
| Nudge Pro | 2000 🪙 | 2 nudges por giro en vez de 1 |
| Tap Frenzy | 1500 🪙 | Tap combo bonus máximo sube a +25% |
| Auto-Catcher | 3000 🪙 | Atrapa frutas automáticamente |
| Fruit Sprinkler | 2500 🪙 | 5 frutas flotantes en vez de 3 |

### 11.7 — Integración con el Loop del Slot

```
GIRO TRADICIONAL:
  SPIN → esperar 2s → resultado → esperar → SPIN

GIRO CON CLICKER:
  SPIN → tap combo durante giro → frutas flotantes →
  resultado → fruit catcher → (si pierde) shake nudge →
  frutas flotantes → SPIN

Tiempo activo del jugador: 100% (siempre hay algo que tocar)
Tiempo pasivo: 0% (nunca solo esperar)
```

**Métrica clave:** El jugador nunca está esperando pasivamente. Siempre hay algo que tocar, atrapar, o acumular entre giros.

---

## 12. Mecánicas de Retención y Engagement

Mantener al jugador regresando sesión tras sesión. Estas mecánicas operan a nivel meta-juego, no dentro de un giro individual.

### 12.1 — Daily Login Bonus (Escalera)

```
Día 1: 50 🪙
Día 2: 75 🪙
Día 3: 100 🪙 + 1 fruta dorada flotante garantizada
Día 4: 150 🪙
Día 5: 200 🪙 + multiplicador x1.5 por 1 hora
Día 6: 300 🪙
Día 7: 500 🪙 + Mystery Box gratis

Si pierdes un día → vuelve a Día 1
Streak máximo visible en HUD: "🔥 Login streak: 5 días"
```

### 12.2 — Spin Streak Rewards (Giros consecutivos)

```
Cada 10 giros consecutivos (sin salir del juego):
  10 giros: +50 🪙 bonus
  25 giros: +100 🪙 + highlight dorado
  50 giros: +250 🪙 + 1 Mystery Box
  100 giros: +500 🪙 + Achievement "Centurion"
  200 giros: +1000 🪙 + Achievement "Marathon"

Contador visible: "🎯 Spin streak: 23"
Se resetea al salir del juego o cambiar modo
```

### 12.3 — Near-Miss Highlight ("¡Casi!")

Cuando un giro está a 1 símbolo de una combinación grande, el juego lo resalta:

```
- Si 4 de 5 símbolos coinciden → "¡CASI! 4/5 🍉"
- Si el 5to carrete tenía el símbolo adyacente → "¡A 1 de JACKPOT!"
- Carrete "casi" parpadea dorado por 1s
- Pequeño consuelo: +5 🪙 de "casi prize"
- Activa ventana de Shake to Nudge (sección 11.5)
```

**Por qué funciona:** Los near-misses activan el mismo circuito de dopamina que las victorias reales. El cerebro interpreta "casi gané" como "estoy cerca de ganar", aumentando la motivación para el siguiente giro.

### 12.4 — Mystery Box (Caja misteriosa)

```
- Drop chance: 5% por giro ganador
- También garantizada cada 50 giros
- Al abrir: animación de caja abriéndose
- Contenido aleatorio:
  40% → 50-200 🪙
  25% → Multiplicador x2 por 5 giros
  20% → Upgrade gratis (aleatorio)
  10% → 500-1000 🪙
  4% → Golden Hour (todo x3 por 1 minuto)
  1% → Mega Jackpot (5000 🪙)
```

**Visual:** Caja dorada con brillo pulsante, animación de apertura con confeti.

### 12.5 — Missions / Challenges (Misiones diarias)

```
3 misiones activas simultáneas, rotan cada 24h:

Ejemplos:
- "Gira 20 veces" → 100 🪙
- "Obtén 3 🍒 en una línea" → 150 🪙
- "Activa la ronda de bonos" → 200 🪙
- "Gana 1000 🪙 en total" → 250 🪙
- "Usa doble o nada 3 veces" → 150 🪙
- "Atrapa 30 frutas en Fruit Catcher" → 100 🪙
- "Logra un tap combo de 15+" → 200 🪙
- "Completa todas las misiones" → 500 🪙 bonus
```

**Visual:** Panel de misiones deslizable desde la izquierda, progreso en barras circulares.

### 12.6 — Fruit Fever Mode (Fiebre de frutas)

```
Activación: Tras 5 giros ganadores consecutivos
Duración: 10 giros o hasta perder 2 seguidos
Efectos durante Fruit Fever:
  - Todos los multiplicadores x2
  - Frutas flotantes x3 valor
  - Más probabilidad de wild (+3%)
  - Más probabilidad de bonus (+2%)
  - Música cambia a modo "frenesí" (tempo x1.5)
  - Fondo cambia a rojo/dorado pulsante
  - Cada giro tiene garantizado mínimo x2 premio

Visual: Banner "🔥 FRUIT FEVER 🔥" en top-center
Audio: Música acelera + capa de drums más intensa
```

### 12.7 — Progressive Unlocks (Desbloqueos progresivos)

```
Nivel 1: Slots básico (5 líneas, 8 símbolos)
Nivel 2: + Línea 6 (zigzag)
Nivel 3: + Fruit Catcher mini-game
Nivel 4: + Auto-spin (10 giros)
Nivel 5: + Turbo mode
Nivel 6: + Línea 7 (W extendida)
Nivel 7: + Mystery Box system
Nivel 8: + Fruit Fever mode
Nivel 9: + Daily missions
Nivel 10: + Progressive jackpot activo
```

Cada unlock se muestra con animación de "NEW!" y tutorial breve.

### 12.8 — Notification Reminders (Recordatorios)

```
- Tras 1 hora sin jugar: "¡Tu daily challenge te espera! 🍓"
- Tras 24h sin jugar: "¡Mystery Box gratis disponible! 🎁"
- Login streak en riesgo: "¡No pierdas tu racha de X días! 🔥"
- Nuevo contenido: "¡Nuevo modo desbloqueado! 🎰"

Implementación: localStorage timestamp + check on load
```

---

## 13. Música 8-bit Adaptativa (Chiptune)

Música estilo NES/Famicom sintetizada en tiempo real con Web Audio API. **Sin archivos de audio** — todo generado con osciladores, noise y envelopes.

### 13.1 — Chiptune Engine

```js
// Motor de música 8-bit con Web Audio API
// 4 canales (como NES): 2 pulse + 1 triangle + 1 noise

const chiptune = {
  ctx: null,
  masterGain: null,
  channels: {
    pulse1: null,   // Melodía principal (square wave)
    pulse2: null,   // Armonía/contramelodía (square wave)
    triangle: null, // Bajo (triangle wave)
    noise: null,    // Percusión (white noise)
  },
  bpm: 120,
  currentTrack: null,
  layer: 0, // 0-3, se activa progresivamente
};
```

### 13.2 — Tracks por Estado de Juego

| Estado | Track | BPM | Característica |
|--------|-------|-----|---------------|
| Menú/Inicio | "Fruit Lounge" | 90 | Relajado, melodía simple, solo pulse1 + triangle |
| Spinning | "Spin Drive" | 140 | Energético, pulse1 + pulse2 + triangle |
| Win (pequeño) | "Win Jingle" | 120 | Arpeggio ascendente corto (2s) |
| Win (grande) | "Big Win Fanfare" | 140 | Arpeggio + drums + triangle sweep (4s) |
| Bonus Round | "Bonus Fever" | 160 | Rápido, pulsante, 4 capas activas |
| Gamble | "Gamble Tension" | 100 | Tensión, drone + pulse staccato |
| Fruit Fever | "Fever Mode" | 180 | Frenético, tempo x1.5, drums intensos |
| Jackpot | "Jackpot Symphony" | 160 | Fanfare épica 8-bit, todas las capas |
| Idle (30s) | "Silent Groove" | 80 | Solo triangle lento, ambiente minimal |

### 13.3 — Layer System (Build-up progresivo)

La música se construye capa por capa según el engagement del jugador:

```
Layer 0: Solo triangle (bajo) — menú, idle
Layer 1: + pulse1 (melodía) — primer giro
Layer 2: + pulse2 (armonía) — tras 3 giros ganadores
Layer 3: + noise (drums) — tras streak de 5+ o Fruit Fever

Cada capa se activa con fade-in (0.5s)
Al perder streak: capas se desactivan con fade-out (1s)
```

### 13.4 — Tempo Dinámico

```
BPM base por track:
  Menú: 90 BPM
  Spinning: 140 BPM
  Bonus: 160 BPM
  Fruit Fever: 180 BPM

Modificadores de tempo:
  + Tap combo alto (>15): +10 BPM temporal
  + Streak 5+: +5 BPM
  + Streak 10+: +10 BPM
  + Turbo mode: x1.5 BPM
  + Rush mode (60s): +20 BPM
  + Shake nudge disponible: -5 BPM (tensión)

Tempo máximo: 200 BPM (todo se vuelve frenético)
```

### 13.5 — SFX 8-bit (Efectos de sonido)

Todos los SFX son generados con osciladores, manteniendo la estética 8-bit:

```js
const SFX_8BIT = {
  spin: { type: 'square', freq: 200, freqEnd: 100, duration: 0.3, volume: 0.1 },
  reelStop: { type: 'square', freq: 600, duration: 0.05, volume: 0.15 },
  win: { type: 'square', notes: [523, 659, 784], duration: 0.15, volume: 0.12 },
  bigWin: { type: 'square', notes: [523, 659, 784, 1047, 1319], duration: 0.12, volume: 0.15 },
  bonus: { type: 'triangle', notes: [440, 554, 659, 880], duration: 0.2, volume: 0.15 },
  coin: { type: 'square', freq: 1319, duration: 0.08, volume: 0.1 },
  tapFruit: { type: 'square', freq: 880, duration: 0.04, volume: 0.08 },
  nudge: { type: 'sawtooth', freq: 150, freqEnd: 300, duration: 0.2, volume: 0.1 },
  gambleCard: { type: 'square', freq: 400, duration: 0.1, volume: 0.1 },
  gambleWin: { type: 'square', notes: [659, 880], duration: 0.15, volume: 0.12 },
  gambleLoss: { type: 'sawtooth', freq: 220, freqEnd: 55, duration: 0.4, volume: 0.12 },
  jackpot: { type: 'square', notes: [523, 659, 784, 1047, 1319, 1568, 2093], duration: 0.1, volume: 0.18 },
  nearMiss: { type: 'triangle', freq: 300, freqEnd: 400, duration: 0.3, volume: 0.08 },
  feverMode: { type: 'square', notes: [440, 554, 659, 880, 1108], duration: 0.1, volume: 0.15 },
  layerUp: { type: 'triangle', freq: 660, duration: 0.1, volume: 0.1 },
};
```

### 13.6 — Patrones Musicales (Notas)

#### Track: "Fruit Lounge" (Menú — 90 BPM, Layer 0-1)

```
Triangle (bajo):
  A2 A2 | A2 E2 | A2 A2 | E2 E2 | repeat

Pulse1 (melodía, activa en Layer 1):
  E5 C5 A4 C5 | E5 E5 D5 C5 | D5 B4 G4 B4 | D5 D5 C5 B4 | repeat
```

#### Track: "Spin Drive" (Giros — 140 BPM, Layer 1-3)

```
Triangle (bajo):
  A2 A2 E2 E2 | A2 A2 E2 E2 | F2 F2 C2 C2 | G2 G2 D2 D2 | repeat

Pulse1 (melodía):
  A4 C5 E5 C5 | A4 C5 E5 C5 | F4 A4 C5 A4 | G4 B4 D5 B4 | repeat

Pulse2 (armonía, activa en Layer 2):
  E4 E4 E4 E4 | E4 E4 E4 E4 | F4 F4 F4 F4 | D4 D4 D4 D4 | repeat

Noise (drums, activa en Layer 3):
  K---K---K---K--- | K---K---K---K--- | (K = kick, --- = silence)
```

#### Track: "Bonus Fever" (Ronda de bonos — 160 BPM, todas las capas)

```
Triangle:
  A2 A2 A2 A2 | E2 E2 E2 E2 | F2 F2 F2 F2 | E2 E2 E2 E2 | repeat

Pulse1:
  E5 E5 E5 E5 | E5 D5 C5 D5 | C5 C5 C5 C5 | C5 B4 A4 B4 | repeat

Pulse2:
  A4 A4 C5 C5 | E4 E4 G4 G4 | F4 F4 A4 A4 | E4 E4 G4 G4 | repeat

Noise:
  K-S-K-S-K-S-K-S | K-S-K-S-K-S-K-S | (S = snare)
```

#### Track: "Fever Mode" (Fruit Fever — 180 BPM, frenético)

```
Triangle:
  A2-A2-A2-A2-A2-A2-A2-A2 | (8 notas por compás, double time)

Pulse1:
  E5-D5-E5-D5-E5-D5-E5-D5 | (staccato rápido)

Pulse2:
  A4-A4-C5-C5-E4-E4-G4-G4 |

Noise:
  KSKSKSKSKSKSKSKS | (drum roll continuo)
```

### 13.7 — Implementación del Sequencer

```js
const sequencer = {
  currentTrack: null,
  currentBar: 0,
  nextNoteTime: 0,
  scheduleAheadTime: 0.1,
  lookahead: 25,
  timerID: null,
};

function scheduler() {
  while (sequencer.nextNoteTime < chiptune.ctx.currentTime + sequencer.scheduleAheadTime) {
    scheduleNote(sequencer.currentBar, sequencer.nextNoteTime);
    nextNote();
  }
  sequencer.timerID = setTimeout(scheduler, sequencer.lookahead);
}

function nextNote() {
  const secondsPerBeat = 60.0 / chiptune.bpm;
  sequencer.nextNoteTime += secondsPerBeat * 4;
  sequencer.currentBar = (sequencer.currentBar + 1) % 4;
}

function startMusic(trackName) {
  if (chiptune.ctx.state === 'suspended') chiptune.ctx.resume();
  sequencer.currentTrack = trackName;
  sequencer.currentBar = 0;
  sequencer.nextNoteTime = chiptune.ctx.currentTime + 0.1;
  scheduler();
}

function stopMusic() {
  clearTimeout(sequencer.timerID);
  sequencer.currentTrack = null;
}
```

### 13.8 — Transiciones Musicales Adaptativas

```
Estado: Menú → Spin
  Track: "Fruit Lounge" → "Spin Drive"
  Transición: fade out 0.3s + fade in 0.3s
  Layer: mantiene layer actual

Estado: Spin → Win
  Track: "Spin Drive" pausa → "Win Jingle" (2s) → vuelve a "Spin Drive"
  Layer: +1 temporal durante jingle

Estado: Spin → Bonus
  Track: "Spin Drive" → "Bonus Fever"
  Transición: drum fill (0.5s) + cambio instantáneo
  Layer: fuerza Layer 3 (todas activas)

Estado: Spin → Fruit Fever
  Track: "Spin Drive" → "Fever Mode"
  Transición: aceleración gradual de BPM (140→180 en 2s)
  Layer: fuerza Layer 3

Estado: Cualquier → Jackpot
  Track: Todo para → "Jackpot Symphony" (5s) → vuelve al track anterior
  Layer: máximo

Estado: Idle (sin tocar 30s)
  Track: baja a Layer 0 (solo triangle)
  BPM: baja a 90
  Música minimal hasta próxima interacción
```

---

## 14. Diseño Visual

### Paleta de colores

```css
:root {
  --color-bg: #0d0d1a;
  --color-surface: #1a1a2e;
  --color-reel: #16213e;
  --color-gold: #ffd700;
  --color-red: #ff3366;
  --color-green: #00ff88;
  --color-purple: #7c3aed;
  --color-text: #ffffff;
  --color-muted: #8888aa;
  --color-cherry: #ff1744;
  --color-lemon: #ffeb3b;
  --color-watermelon: #4caf50;
  --color-strawberry: #e91e63;
  --color-cocktail: #ff9800;
}
```

### HUD Layout (siguiendo INDICATORS.md)

```
┌──────────────────────────────────────────────┐
│  [SALDO 🪙]     [NIVEL]          [SONIDO]    │ ← Top border
│                                               │
│  ┌─────┬─────┬─────┬─────┬─────┐             │
│  │ 🍒 │ 🍋 │ 🍎 │ 🍐 │ 🍉 │             │
│  ├─────┼─────┼─────┼─────┼─────┤             │
│  │ 🍓 │ 🍹 │ 🍒 │ 🍋 │ 🍎 │             │
│  ├─────┼─────┼─────┼─────┼─────┤             │
│  │ 🍑 │ 🍉 │ 🍐 │ 🍓 │ 🍋 │             │
│  └─────┴─────┴─────┴─────┴─────┘             │
│                                               │
│  [APUESTA: 50]    [SPIN]    [AUTO] [TURBO]   │ ← Bottom border
│  [10] [50] [100] [500] [ALL]                 │
└──────────────────────────────────────────────┘
```

### Animación de carretes

```js
// Cada carrete es un strip vertical que se desplaza
// Animación: translateY con easing (desaceleración)
// Duración: 1.5-2s con stagger entre carretes (100ms)

reel.animate([
  { transform: 'translateY(0)' },
  { transform: `translateY(-${stripHeight * spins}px)` }
], {
  duration: 1500 + reelIndex * 100,
  easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  fill: 'forwards'
});
```

### Efectos visuales

| Evento | Efecto | Duración |
|--------|--------|----------|
| Giro | Carretes desplazándose + sonido mecánico | 1.5-2s |
| Carrete se detiene | Pequeño bounce + click sound | 0.2s |
| Línea ganadora | Glow + highlight de símbolos + línea trazada | 1s |
| Premio pequeño | Score flotante "+100 🪙" | 1s |
| Premio grande | Confeti + screen shake + monedas lluvia | 2s |
| Bonus activado | Flash dorado + transición a pantalla bono | 1s |
| Doble o nada | Transición carta + flip animation | 0.5s |
| Jackpot (5 wilds) | Fuegos artificiales + frenzy + todo dorado | 3s |

### Audio (Web Audio API)

| Función | Frecuencia | Tipo | Descripción |
|---------|-----------|------|-------------|
| playSpin | 200→100Hz | sawtooth | Sonido mecánico de giro |
| playReelStop | 600Hz | square | Click de carrete deteniéndose |
| playWin | 523+659+784Hz | sine | Arpeggio de premio |
| playBigWin | 523+659+784+1047+1319Hz | sine | Premio grande |
| playBonus | 440+554+659Hz | triangle | Activación de bono |
| playGamble | 800Hz | square | Doble o nada |
| playGambleWin | 659+880Hz | sine | Carta ganadora |
| playGambleLoss | 220+110Hz | sawtooth | Carta perdedora |
| playCoin | 1319Hz | sine | Moneda |
| playJackpot | 523+659+784+1047+1319+1568Hz | sine | Jackpot fanfare |

### Haptics

| Evento | Patrón |
|--------|--------|
| SPIN | 50ms |
| Carrete se detiene | 20ms (cada uno) |
| Premio | [30, 20, 30] |
| Premio grande | [50, 30, 50, 30, 80] |
| Bonus activado | [100, 50, 100] |
| Doble o nada win | [30, 20, 50] |
| Doble o nada loss | [100] |
| Jackpot | [50, 30, 50, 30, 50, 30, 100] |

---

## 15. Arquitectura Técnica

### Estructura de datos

```js
let gameState = {
  saldo: 1000,
  nivel: 1,
  expTotal: 0,
  apuestaActual: 50,
  modoJuego: 'classic',
  autoSpin: false,
  turboMode: false,
  enBono: false,
  enGamble: false,
  bonoIntentos: 0,
  gambleRondas: 0,
  gamblePremioAcumulado: 0,
  carretes: [[], [], [], [], []], // 5 carretes × 3 símbolos
  lineaGanadora: null,
  upgrades: {
    luckyStraw: false,
    multiplierBoost: false,
    insurance: false,
    streakSaver: false,
    autoSpin: false,
    turboMode: false,
    extraLine: false,
    doubleWild: false,
  },
  achievements: [],
  stats: {
    totalSpins: 0,
    totalWins: 0,
    totalBet: 0,
    totalWon: 0,
    biggestWin: 0,
    bonosTriggered: 0,
    gambleWins: 0,
    gambleLosses: 0,
    bestStreak: 0,
    jackpots: 0,
  },
  highScore: 0,
};
```

### Símbolos y probabilidades

```js
const SIMBOLOS = [
  { emoji: '🍒', nombre: 'cereza', peso: 25, mult: { 3: 2, 4: 5, 5: 10 } },
  { emoji: '🍑', nombre: 'durazno', peso: 20, mult: { 3: 2, 4: 8, 5: 20 } },
  { emoji: '🍋', nombre: 'limon', peso: 18, mult: { 3: 3, 4: 10, 5: 30 } },
  { emoji: '🍎', nombre: 'manzana', peso: 15, mult: { 3: 5, 4: 15, 5: 50 } },
  { emoji: '🍐', nombre: 'pera', peso: 10, mult: { 3: 10, 4: 25, 5: 100 } },
  { emoji: '🍉', nombre: 'sandia', peso: 7, mult: { 3: 20, 4: 50, 5: 200 } },
  { emoji: '🍹', nombre: 'wild', peso: 3, mult: { 3: 50, 4: 200, 5: 1000 }, wild: true },
  { emoji: '🍓', nombre: 'bonus', peso: 2, bonus: true },
];

// Peso total = 100, cada carrete genera un símbolo según peso
function generarSimbolo() {
  const total = SIMBOLOS.reduce((s, sym) => s + sym.peso, 0);
  let r = Math.random() * total;
  for (const sym of SIMBOLOS) {
    r -= sym.peso;
    if (r <= 0) return sym;
  }
  return SIMBOLOS[0];
}
```

### Líneas de pago

```js
const LINEAS = [
  // Cada línea es un array de [carrete, fila]
  [[0,0],[1,0],[2,0],[3,0],[4,0]], // Línea 1: fila superior
  [[0,1],[1,1],[2,1],[3,1],[4,1]], // Línea 2: fila central
  [[0,2],[1,2],[2,2],[3,2],[4,2]], // Línea 3: fila inferior
  [[0,0],[1,1],[2,2],[3,1],[4,0]], // Línea 4: V invertida
  [[0,2],[1,1],[2,0],[3,1],[4,2]], // Línea 5: V
];
```

### Evaluación de líneas

```js
function evaluarLinea(simbolos, direccion = 'ltr') {
  // direccion: 'ltr' = izquierda→derecha, 'rtl' = derecha→izquierda
  const orden = direccion === 'ltr' ? [0,1,2,3,4] : [4,3,2,1,0];
  let consecutivos = 1;
  let primerSimbolo = simbolos[orden[0]];

  // Wild cuenta como cualquier símbolo
  for (let i = 1; i < 5; i++) {
    const actual = simbolos[orden[i]];
    if (actual.nombre === primerSimbolo.nombre || actual.wild || primerSimbolo.wild) {
      consecutivos++;
      if (primerSimbolo.wild && !actual.wild) primerSimbolo = actual;
    } else break;
  }

  if (consecutivos >= 3) {
    return { simbolo: primerSimbolo, cantidad: consecutivos, direccion };
  }
  return null;
}
```

### Guardado en localStorage

```js
function guardarEstado() {
  localStorage.setItem('jard-fruitcocktail-save', JSON.stringify(gameState));
}

function cargarEstado() {
  const saved = localStorage.getItem('jard-fruitcocktail-save');
  if (saved) gameState = { ...gameState, ...JSON.parse(saved) };
}
```

---

## 16. Ideas de Variantes y Diferenciadores

### 16.1 — "Fruit Frenzy Mode"
- Cada 50 giros, modo frenzy por 10 giros
- Todos los multiplicadores x3
- Más probabilidad de wilds y bonus
- Visual: fondo cambia a dorado/rojo, carretes con glow

### 16.2 — "Mega Fresa"
- Símbolo especial raro (1% probabilidad)
- Fresa gigante que ocupa 2×2 posiciones
- Garantiza activación de bono

### 16.3 — "Cascading Reels"
- Tras un premio, los símbolos ganadores explotan
- Nuevos símbolos caen desde arriba
- Puede generar premios encadenados (combo)
- Multiplicador creciente por cada cascada: x1, x2, x3...

### 16.4 — "Fruit Collection"
- Coleccionable: cada fruta única ganada se agrega a una colección
- Completar la colección (7 frutas) → premio de 5000 🪙
- Visual: estantería con frutas recolectadas

### 16.5 — "Lucky Streak"
- Tras 3 giros ganadores seguidos:
  - Glow dorado en carretes
  - +5% probabilidad de wild
  - Multiplicador +10%
- Se rompe al perder un giro
- Visual: contador de streak en HUD

### 16.6 — "Mini-Games" (adicionales al bono principal)

#### "Fruit Picker"
- Pantalla con 9 frutas boca abajo
- Jugador toca 3 para revelar
- Cada fruta tiene un multiplicador oculto
- Premio = apuesta × suma de multiplicadores

#### "Cocktail Mixer"
- Jugador arrastra ingredientes a un vaso
- Cada ingrediente tiene un valor
- Combinación correcta = premio máximo
- Visual: vaso que se llena con líquido de colores

### 16.7 — "Daily Fruit"
- Cada día, una fruta es la "Lucky Fruit"
- Si aparece 3+ veces en un giro → premio x5 extra
- Cambia cada 24h
- Visual: banner superior con la fruta del día

### 16.8 — "Progressive Jackpot"
- Jackpot que acumula 1% de todas las apuestas
- Se gana con 5 🍹 en línea central
- Muestra contador en tiempo real
- Visual: contador dorado pulsante en HUD

---

## 17. Roadmap de Implementación

### Fase 1 — MVP Core (1-2 días)
- [ ] Grid de 5×3 carretes con animación de giro
- [ ] 8 símbolos con probabilidades ponderadas
- [ ] 5 líneas de pago fijas con evaluación bidireccional
- [ ] Wild (🍹) que sustituye frutas
- [ ] Sistema de apuestas (10/50/100/500/ALL)
- [ ] Saldo + localStorage
- [ ] HUD básico (saldo, apuesta, botón SPIN)
- [ ] Efectos visuales básicos (highlight de línea ganadora, score flotante)
- [ ] **Chiptune engine básico** (triangle + pulse1, track "Spin Drive")
- [ ] SFX 8-bit básicos (spin, reel stop, win, loss, coin)
- [ ] Pantalla de tabla de pagos

### Fase 2 — Clicker + Bono (1-2 días)
- [ ] **Tap to Nudge** (tocar carrete para detener antes)
- [ ] **Tap Combo Multiplier** (tocar rápido durante giro)
- [ ] **Fruit Catcher** (atrapar frutas tras giro)
- [ ] **Fruit Garden** (frutas flotantes entre giros)
- [ ] **Shake to Nudge** (sacudir tras giro perdedor)
- [ ] **Near-Miss Highlight** ("¡Casi!" + consuelo)
- [ ] Ronda de bonos (3+ fresas)
  - [ ] Pantalla secundaria con carrete central
  - [ ] Borde iluminado secuencial
  - [ ] Sistema de intentos
  - [ ] Casilla EXIT
- [ ] Función de doble o nada
  - [ ] Pantalla de cartas
  - [ ] Comparación de valores
  - [ ] Límite de 5 rondas
- [ ] **Música: Layer 2-3** (pulse2 + noise/drums activos por streak)
- [ ] **Música: Track "Bonus Fever"** para ronda de bonos
- [ ] **Música: Track "Gamble Tension"** para doble o nada

### Fase 3 — Retención + Progresión (1-2 días)
- [ ] Sistema de niveles con progressive unlocks
- [ ] Upgrades comprables (incluye clicker upgrades)
- [ ] Achievements
- [ ] Estadísticas persistentes
- [ ] Lucky Streak system
- [ ] **Daily Login Bonus** (escalera de 7 días)
- [ ] **Spin Streak Rewards** (10/25/50/100/200 giros)
- [ ] **Mystery Box** (drop aleatorio + garantizado cada 50 giros)
- [ ] **Daily Missions** (3 misiones rotativas)
- [ ] **Fruit Fever Mode** (5 giros ganadores → frenzy)
- [ ] **Música: Track "Fever Mode"** (180 BPM frenético)
- [ ] **Música: Tempo dinámico** (modifica BPM según streak/turbo)

### Fase 4 — Pulido (1-2 días)
- [ ] Modo Rush (60s) con música acelerada
- [ ] Modo Survival
- [ ] Daily Challenge
- [ ] Cascading reels (opcional)
- [ ] Progressive jackpot
- [ ] **Música: Track "Jackpot Symphony"** para jackpot
- [ ] **Música: Idle detection** (baja a Layer 0 tras 30s sin tocar)
- [ ] **Música: Transiciones adaptativas** (crossfade entre tracks)
- [ ] Cosméticos / temas visuales (incluyen temas musicales alternativos)
- [ ] Haptics completos
- [ ] Notification reminders
- [ ] PWA installable

---

## 18. Idea Recomendada — "JardFruit Cocktail"

### Por qué este enfoque

**Core:** Slot 5×3 con giros, líneas bidireccionales y wild
**Clicker:** Tap to nudge, tap combo, fruit catcher, fruit garden, shake nudge
**Tensión:** Animación de carretes deteniéndose uno por uno + near-miss
**Sorpresa:** Ronda de bonos con carrete central interactivo + mystery box
**Agencia:** Doble o nada + nudge timing + tap combo dan control al jugador
**Dopamina:** Multiplicadores + highlight de líneas + frutas flotantes + perfect catch
**Retención:** Daily login, spin streak, missions, fruit fever, progressive unlocks
**Música:** Chiptune 8-bit adaptativa con 4 capas que se construyen con el streak
**Progresión:** Upgrades + niveles + achievements + estadísticas
**Rejugabilidad:** Modos múltiples + daily challenge + progressive jackpot

### Diferenciador único
**No es un slot pasivo — es un slot-clicker híbrido.** El jugador nunca espera:
1. **Durante el giro:** Tap combo para cargar multiplicador
2. **Tras el giro:** Fruit catcher para atrapar frutas
3. **Entre giros:** Fruit garden para tocar frutas flotantes
4. **Si pierde:** Shake to nudge para redimir
5. **Si gana:** Doble o nada para arriesgar
6. **Meta-juego:** Missions, daily login, streaks, mystery boxes
7. **Música:** 8-bit que se construye capa por capa con tu racha

### Nombre sugerido
**JardFruit** — "Gira. Gana. Brinda." 🍹

### Stack
- Single-file HTML (jard-games)
- Vanilla JS, CSS animations para efectos (no movimiento)
- `requestAnimationFrame` para animación de carretes
- Web Audio API para sonidos sintetizados
- `navigator.vibrate` para haptics
- `localStorage` para guardado

---

## 19. Spec Sugerida

```
SPEC-002: JardFruit — Fruit Cocktail Slot MVP
Prioridad: High
Estimación: 2 días
Modo: Classic (5×3, 5 líneas, bidireccional)
Stack: Single-file HTML (jard-games)
Dependencias: Motor de jard-games (audio, haptics, partículas)
Incluye: Giros, wild, bonus (fresas), doble o nada, apuestas, localStorage
```

---

## 20. Conclusión

Fruit Cocktail es un slot clásico con mecánicas probadas que se adaptan perfectamente al formato jard-games. La fusión con mecánicas clicker y música 8-bit adaptativa lo convierte en algo único:

- **Mecánica simple** — Un botón SPIN, un toque para jugar
- **Clicker híbrido** — Tap combo, fruit catcher, fruit garden, shake nudge
- **Tensión visual** — Carretes deteniéndose + near-miss highlight
- **Recompensa variable** — Multiplicadores + bonos + gamble + mystery box
- **Retención** — Daily login, spin streak, missions, fruit fever
- **Música 8-bit** — Chiptune adaptativo con 4 capas que se construyen con el streak
- **Progresión** — Upgrades, niveles, achievements, progressive unlocks
- **Sesiones cortas** — 1-5 minutos, "one more spin"
- **Rejugabilidad** — Eventos procedurales + modos múltiples + daily challenge
- **Tiempo activo 100%** — El jugador nunca espera pasivamente

Con el motor existente de jard-games (audio, haptics, partículas, efectos visuales), implementar el MVP es factible en 1-2 días como un solo archivo HTML autocontenido.
