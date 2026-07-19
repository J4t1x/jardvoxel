# PRD: Sistema de Musica 8-bit Dinamica Relajante para JardVoxel

## Documento de Requisitos de Producto

**Proyecto:** JardVoxel Survival  
**Fecha:** 2026-06-25  
**Autor:** Jard  
**Estado:** ✅ Completado (v4.2.0 SPEC-057 + v5.0.0 SPEC-083)  
**Espec:** SPEC-035  

---

## 1. Vision

Implementar un sistema de musica ambiental 8-bit (chiptune) procedural y dinamico para JardVoxel que genere sensaciones de **calma, tranquilidad y relajacion profunda** en el jugador. El sistema se inspira en la arquitectura del chiptune engine de `jardfruit-cocktail.html` pero invierte completamente el proposito emocional: donde jardfruit usa musica energetica y tensa para maximizar excitacion de casino, JardVoxel usara musica envolvente y serena para inducir un estado meditativo mientras el jugador explora, construye y sobrevive.

### Diferencia Clave con JardFruit

| Aspecto | JardFruit (referencia) | JardVoxel (este PRD) |
|---|---|---|
| Emocion objetivo | Excitacion, tension, euforia | Calma, tranquilidad, flujo meditativo |
| BPM base | 90-180 (energetico) | 55-75 (lento, respiratorio) |
| Capas activas | 4 (bass + 2 pulse + noise) | 3 (drone + melody + arpeggios) |
| Cambio de track | Por evento discrete (spin, win, fever) | Por intensidad continua (explorando vs construyendo vs combate) |
| Transiciones | Cortes abruptos con fade rapido | Crossfade lento (3-8s) sin cortes |
| Harmonia | Mayor/menor dinamico | Modal (dorio, eolio, lidio) — sin disonancia |
| Ruido (noise) | Percusion ritmica constante | Solo para texturas ambientales (ola, viento) |

---

## 2. Objetivos

### 2.1 Objetivos de Producto

1. **Sistema de musica procedural 8-bit** que sintetice tracks en tiempo real usando Web Audio API (oscilladores + filtros + LFOs)
2. **Dinamica adaptativa** que ajuste la musica segun la accion del jugador de forma continua y sin cortes
3. **Sensacion relajante** lograda mediante BPM lento, harmonias modales, transiciones suaves y dinamicas reducidas
4. **Integracion con GameAudio existente** sin romper los SFX actuales (break, place, jump, land, splash, cave)
5. **Controles de UI** para volumen de musica independiente de SFX

### 2.2 Objetivos Tecnicos

1. **Cero dependencias externas** — solo Web Audio API, sin archivos de audio, sin librerias
2. **Bajo impacto en performance** — max 3 oscilladores activos simultaneamente, scheduling eficiente
3. **Compatible con mobile** — AudioContext se inicializa on user gesture (pointer lock)
4. **Persistencia de settings** — volumen de musica guardado en localStorage como los demas settings

### 2.3 No-Goals

- NO usar archivos de audio externos (.mp3, .ogg, .wav)
- NO implementar un editor de musica o secuenciador visible
- NO agregar voces o samples de instrumentos reales
- NO usar musica que genere tension o urgencia (excepto combate, y aun asi sutil)

---

## 3. Estados Musicales Dinamicos

El sistema detecta el "estado de juego" del jugador y ajusta la musica continuamente. No son cortes discretos como en jardfruit — son **transiciones con crossfade** entre estados.

### 3.1 Mapa de Estados

```
                    ┌──────────────┐
                    │   EXPLORING  │ ← estado default
                    │  (calma base) │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ BUILDING │ │ MINING   │ │  COMBAT  │
        │(creativo)│ │(subterr.)│ │(tension  │
        │          │ │          │ │ sutil)   │
        └──────────┘ └──────────┘ └──────────┘
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │   DAY    │ │   NIGHT  │ │ UNDERWATER│
        │ (claro)  │ │ (oscuro) │ │ (acuatico)│
        └──────────┘ └──────────┘ └──────────┘
```

### 3.2 Definicion de Estados

| Estado | Trigger | BPM | Escala | Capas | Caracteristica |
|---|---|---|---|---|---|
| **exploring** | Default, jugador moviendose en superficie | 60 | Dorio (D) | drone + melody | Melodia lenta espaciada, drone suave |
| **building** | Jugador coloca bloques consecutivamente (>3 en 10s) | 65 | Lidio (F) | drone + melody + arpeggios | Arpegios ascendentes suaves, sensacion creativa |
| **mining** | Jugador bajo tierra (y < 40) o rompiendo bloques | 55 | Eolio (A) | drone + melody | Notas mas graves, resonancia larga, eco |
| **combat** | Mob hostil a menos de 10 bloques | 70 | Friio (E) | drone + melody + pulse sutil | Pulse muy suave, melodias mas cortas, leve tension |
| **night** | dayTime > 0.75 o < 0.25 | 50 | Eolio (A) | drone + melody | Todo mas lento y grave, drone mas prominente |
| **underwater** | Jugador con cabeza bajo agua | 52 | Dorio (D) | drone + melody + filter sweep | Filtro lowpass pronunciado, sensacion acuatica |
| **idle** | Sin input por >30s | 45 | Pentatonica (D) | drone solo | Melodia se desvanece, solo drone ambiental |

### 3.3 Transiciones

- **Crossfade duration:** 3-8 segundos segun contraste entre estados
- **Pitch glide:** Las notas no saltan — usan `linearRampToValueAtTime` para glissando suave
- **Layer fade-in/out:** Las capas se agregan/quitan con fade de 2s, nunca cortes
- **BPM transitions:** El BPM cambia gradualmente con `linearRamp` sobre 4s, nunca saltos

---

## 4. Arquitectura Tecnica

### 4.1 Estructura de Archivos

```
jardvoxel/
├── jardvoxel-survival-gameplay.js    ← GameAudio existente (SFX) — sin cambios
├── jardvoxel-survival-chilltune.js   ← NUEVO: ChillTuneEngine (musica)
├── jardvoxel-survival.html           ← Modificado: import + init + UI controls
```

### 4.2 ChillTuneEngine — Diseño de Clase

```javascript
class ChillTuneEngine {
  constructor() {
    this.ctx = null;           // AudioContext compartido con GameAudio
    this.masterGain = null;    // Gain global de musica
    this.enabled = true;
    this.volume = 0.35;        // volumen default mas bajo que SFX
    this.currentState = 'exploring';
    this.targetState = 'exploring';
    this.tracks = {};          // definiciones de tracks por estado
    this.activeLayers = [];    // oscilladores activos
    this.scheduler = null;     // timer del scheduler
    this.lfos = {};            // LFOs para modulacion lenta
    this.crossfadeTime = 5;    // segundos de crossfade
    this.currentBPM = 60;
    this.targetBPM = 60;
  }

  // === Lifecycle ===
  init(ctx, masterGain)        // recibe AudioContext de GameAudio
  start()                      // inicia scheduler
  stop()                       // detiene todo con fade
  destroy()                    // limpia oscilladores y timers

  // === State Management ===
  setState(newState)           // cambia estado con crossfade
  updateGameContext(data)      // recibe info del juego (posicion, hora, mobs)
  _detectState(context)        // logica de deteccion automatica

  // === Music Generation ===
  _getScale(state)             // retorna array de frecuencias de la escala
  _getChord(root, scale, degree)  // genera acorde modal
  _playNote(freq, time, dur, type, vol, filterFreq)
  _playDrone(freq, vol)        // nota sostenida con LFO de volumen
  _playArpeggio(notes, time, interval, dur, vol)
  _scheduleNote(bar, time)     // scheduler por barra
  _schedulerLoop()             // loop con lookahead

  // === Transitions ===
  _crossfadeToState(newState)  // fade out capas viejas, fade in nuevas
  _rampBPM(targetBPM, duration)
  _fadeLayer(layer, targetVol, duration)

  // === Controls ===
  setVolume(v)
  setEnabled(b)
  toggle()                     // on/off rapido
}
```

### 4.3 Comparticion de AudioContext

El `ChillTuneEngine` **no crea su propio AudioContext**. En su lugar, recibe el AudioContext ya inicializado por `GameAudio`:

```javascript
// En jardvoxel-survival.html, despues de init:
this.audio = new GameAudio();
this.audio.init();
this.chilltune = new ChillTuneEngine();
this.chilltune.init(this.audio.ctx, this.audio.masterGain);
this.chilltune.start();
```

Esto asegura:
- Un solo AudioContext (mejor performance)
- User gesture ya manejado por GameAudio.init()
- Volumenes independientes (masterGain de musica separado de SFX)

### 4.4 Scheduler con Lookahead

Igual que jardfruit, usa el patron de **scheduler con lookahead** para timing preciso:

```javascript
_schedulerLoop() {
  while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAhead) {
    this._scheduleNote(this.currentBar, this.nextNoteTime);
    this.nextNoteTime += 60.0 / this.currentBPM * 0.25; // 16th notes
    this.currentBar++;
  }
  this.schedulerTimer = setTimeout(() => this._schedulerLoop(), this.lookahead);
}
```

**Parametros:**
- `scheduleAhead`: 0.15s (un poco mas que jardfruit para margen en mobile)
- `lookahead`: 30ms (relajado, no necesita tanta precision)

---

## 5. Diseno Sonoro

### 5.1 Escalas Modales (Frecuencias en Hz)

```javascript
const SCALES = {
  dorian:   [293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25], // D dorian
  aeolian:  [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 415.30], // A aeolian
  lydian:   [349.23, 392.00, 440.00, 466.16, 523.25, 587.33, 659.25], // F lydian
  phrygian: [164.81, 174.61, 196.00, 220.00, 246.94, 261.63, 329.63], // E phrygian
  pentatonic: [293.66, 329.63, 392.00, 440.00, 523.25],               // D pentatonic
};
```

### 5.2 Capas Sonoras

#### Capa 1: Drone (siempre activo)
- **Oscillator type:** triangle (suave, sin armonicos agresivos)
- **Frecuencia:** nota root de la escala, 1-2 octavas abajo
- **Volumen:** 0.06-0.10 (muy suave)
- **Modulacion:** LFO de volumen a 0.1-0.3 Hz (respiracion lenta)
- **Filtro:** lowpass a 400Hz para quitar armonicos altos
- **Duracion:** sostenido continuo, se re-inicia cada 8-16 barras

#### Capa 2: Melody (activa en exploring, building, mining, combat, night)
- **Oscillator type:** sine (mas puro y suave que square)
- **Frecuencia:** notas de la escala modal, seleccionadas con probabilidad
- **Volumen:** 0.04-0.08
- **Patron:** no es una melodia fija — notas aleatorias de la escala con probabilidad ponderada:
  - 60% nota larga (2-4 barras)
  - 25% nota media (1 barra)
  - 15% silencio (espacio para respirar)
- **Filtro:** lowpass a 2000Hz
- **Reverb:** simulado con delay node + feedback (0.3, 0.4s delay)

#### Capa 3: Arpeggios (activa en building, underwater)
- **Oscillator type:** triangle
- **Frecuencia:** acordes de 3-4 notas de la escala, tocadas en arpegio ascendente
- **Volumen:** 0.03-0.05
- **Patron:** cada 4-8 barras, arpegio lento de 3-4 notas
- **Filtro:** lowpass a 1500Hz con LFO de filter cutoff (efecto acuatico/etereo)

### 5.3 Generacion Procedural de Melodias

A diferencia de jardfruit que usa arrays fijos de notas, JardVoxel genera melodias proceduralmente:

```javascript
_generateMelodyNote(scale, barIndex, state) {
  // Probabilidad de silencio (espacio negativo = relajacion)
  if (Math.random() < this._getRestProbability(state)) return 0;

  // Seleccion de nota con pesos (notas cercanas = mas probables)
  const weights = [3, 2, 4, 2, 3, 1, 2]; // grado 3 (quinta) mas probable
  const degree = this._weightedRandom(weights);
  const octave = Math.random() < 0.3 ? 1 : 0; // 30% probabilidad de octava arriba

  return scale[degree] * (octave ? 2 : 1);
}
```

### 5.4 Efectos

#### Reverb Simulado (Convolution innecesario — usar delay)
```javascript
_createReverb() {
  const delay = this.ctx.createDelay(1.0);
  delay.delayTime.value = 0.4;
  const feedback = this.ctx.createGain();
  feedback.gain.value = 0.3;
  const filter = this.ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1200;
  delay.connect(filter).connect(feedback).connect(delay);
  return delay;
}
```

#### LFO de Volumen (efecto respiracion)
```javascript
_createBreathLFO(freq, depth, target) {
  const lfo = this.ctx.createOscillator();
  lfo.frequency.value = freq; // 0.1-0.3 Hz
  const lfoGain = this.ctx.createGain();
  lfoGain.gain.value = depth;
  lfo.connect(lfoGain).connect(target.gain);
  lfo.start();
  return lfo;
}
```

---

## 6. Deteccion de Estado de Juego

### 6.1 Datos de Entrada

El `ChillTuneEngine.updateGameContext(data)` recibe un objeto con:

```javascript
{
  playerY: number,          // posicion Y del jugador
  playerMoving: boolean,    // si se esta moviendo
  playerInWater: boolean,   // si esta bajo agua
  dayTime: number,          // 0-1 (0=medianoche, 0.5=mediodia)
  nearbyHostiles: number,   // cantidad de mobs hostiles cercanos
  blocksPlacedRecently: number,  // bloques colocados en ultimos 10s
  blocksBrokenRecently: number,  // bloques rotos en ultimos 10s
  idleTime: number,         // segundos sin input
}
```

### 6.2 Logica de Deteccion

```javascript
_detectState(ctx) {
  // Prioridad: combate > underwater > idle > night > mining > building > exploring

  if (ctx.nearbyHostiles > 0 && ctx.nearbyHostiles <= 3) return 'combat';
  if (ctx.playerInWater) return 'underwater';
  if (ctx.idleTime > 30) return 'idle';
  if (ctx.dayTime > 0.75 || ctx.dayTime < 0.25) return 'night';
  if (ctx.playerY < 40) return 'mining';
  if (ctx.blocksPlacedRecently > 3) return 'building';
  return 'exploring';
}
```

### 6.3 Frecuencia de Update

- `updateGameContext()` se llama **una vez por segundo** desde el game loop
- El estado se re-evalua cada call pero solo cambia si el resultado es diferente al actual
- La transicion (crossfade) se inicia solo en cambio de estado

---

## 7. Integracion con UI

### 7.1 Settings Panel Existente

El settings panel de jardvoxel-survival.html ya tiene una pestana "Audio" con:
- Volumen master
- Volumen SFX
- Volumen ambient

### 7.2 Cambios en UI

Agregar a la pestana "Audio":

```html
<div class="setting-row">
  <label>Musica</label>
  <input type="range" id="setting-music-volume" min="0" max="1" step="0.05" value="0.35">
  <span id="setting-music-volume-val">35%</span>
</div>
<div class="setting-row">
  <label>Musica dinamica</label>
  <input type="checkbox" id="setting-music-enabled" checked>
</div>
```

### 7.3 Settings Persistidos

```javascript
// En _saveSettings() y _loadSettings():
this.settings.musicVolume = 0.35;    // default
this.settings.musicEnabled = true;   // default
```

---

## 8. Acceptance Criteria

### 8.1 Funcionales

- [ ] **AC-01:** Al iniciar el juego (pointer lock), la musica comienza con fade-in de 3s
- [ ] **AC-02:** Al pausar (pointer unlock), la musica hace fade-out de 2s
- [ ] **AC-03:** El estado "exploring" reproduce drone + melodia en escala dorica a 60 BPM
- [ ] **AC-04:** El estado "building" agrega arpegios en escala lidia a 65 BPM con crossfade de 4s
- [ ] **AC-05:** El estado "mining" cambia a escala eolia a 55 BPM con notas mas graves
- [ ] **AC-06:** El estado "combat" cambia a escala frigia a 70 BPM con pulse sutil
- [ ] **AC-07:** El estado "night" reduce BPM a 50 y hace drone mas prominente
- [ ] **AC-08:** El estado "underwater" aplica filtro lowpass pronunciado
- [ ] **AC-09:** El estado "idle" desvanece melodia dejando solo drone despues de 30s sin input
- [ ] **AC-10:** Las transiciones entre estados usan crossfade de 3-8s sin cortes audibles
- [ ] **AC-11:** El volumen de musica es independiente del volumen de SFX
- [ ] **AC-12:** El toggle de musica en settings la activa/desactiva con fade
- [ ] **AC-13:** Los settings de musica se persisten en localStorage

### 8.2 Tecnicos

- [ ] **AC-14:** Maximo 3 oscilladores activos simultaneamente (drone + melody + arpeggio/pulse)
- [ ] **AC-15:** No se crean nuevos AudioContext — se reutiliza el de GameAudio
- [ ] **AC-16:** El scheduler usa lookahead con setTimeout (no requestAnimationFrame)
- [ ] **AC-17:** Al destruir el engine, todos los oscilladores y timers se limpian
- [ ] **AC-18:** Funciona en mobile (AudioContext resume on user gesture)
- [ ] **AC-19:** No hay clicks/pops audibles al iniciar/detener notas (usar gain ramps)
- [ ] **AC-20:** El archivo `jardvoxel-survival-chilltune.js` es un ES module exportable

### 8.3 Experiencia

- [ ] **AC-21:** Un jugador de prueba reporta sensacion de calma despues de 5 min de juego
- [ ] **AC-22:** La musica no interfiere con la identificacion de SFX (break, place, etc.)
- [ ] **AC-23:** La musica no se vuelve repetitiva en 15 min de juego continuo
- [ ] **AC-24:** Las transiciones no distraen ni llaman atencion sobre si mismas

---

## 9. Plan de Implementacion

### Fase 1: Estructura Base (2h)
- Crear `jardvoxel-survival-chilltune.js` con clase `ChillTuneEngine`
- Implementar init, start, stop, destroy
- Compartir AudioContext con GameAudio
- Scheduler con lookahead

### Fase 2: Generacion Procedural (2h)
- Definir escalas modales (frecuencias)
- Implementar generacion procedural de melodias con pesos
- Implementar drone con LFO de volumen
- Implementar arpeggios

### Fase 3: Estados Dinamicos (2h)
- Implementar deteccion de estado de juego
- Implementar crossfade entre estados
- Implementar ramp de BPM
- Integrar `updateGameContext()` en game loop

### Fase 4: Efectos y Pulido (1h)
- Reverb simulado con delay
- Filtro lowpass para underwater
- Gain ramps anti-click
- LFO de filter cutoff para arpeggios

### Fase 5: Integracion UI (1h)
- Agregar sliders de musica al settings panel
- Persistir settings
- Toggle on/off
- Integrar init en jardvoxel-survival.html

### Fase 6: Testing y Ajuste (1h)
- Verificar performance (CPU usage)
- Ajustar volumenes relativos
- Ajustar probabilidades de notas
- Verificar transiciones suaves

**Tiempo total estimado:** 9 horas

---

## 10. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigacion |
|---|---|---|---|
| AudioContext bloqueado en mobile | Media | Alto | Init on pointer lock (ya implementado en GameAudio) |
| Performance degradation en mobile | Baja | Medio | Max 3 osc, scheduler 30ms, reverb simple |
| Musica repetitiva | Media | Medio | Generacion procedural con aleatoriedad ponderada |
| Clicks/pops en notas | Media | Bajo | Gain ramps (linearRamp + exponentialRamp) |
| Conflicto con SFX existentes | Baja | Medio | Volumenes independientes, frecuencias separadas |
| AudioContext no reanuda tras tab switch | Media | Medio | Resume en pointerlock change event |

---

## 11. Referencias

- **jardfruit-cocktail.html** — Chiptune engine de referencia (lineas 1175-1356)
  - `TRACKS` object con definiciones de tracks
  - `chiptuneScheduler()` con lookahead pattern
  - `playOscNote()` con gain ramps anti-click
  - `setLayer()` para activar/desactivar capas
  - `startMusic()` / `stopMusic()` lifecycle
- **jardvoxel-survival-gameplay.js** — `GameAudio` class (lineas 775-908)
  - AudioContext init, masterGain, SFX methods
  - Patron a seguir para compartir AudioContext
- **jardvoxel-survival.html** — Settings panel y game loop
  - Tab de audio existente (linea 437)
  - `this.audio.init()` en pointer lock (linea 1361)

---

## 12. Metricas de Exito

| Metrica | Target | Medicion |
|---|---|---|
| Latencia de inicio de musica | < 100ms despues de pointer lock | Performance API |
| CPU overhead | < 3% adicional | Chrome DevTools Performance |
| Oscilladores simultaneos | <= 3 | Contador en runtime |
| Tiempo sin repeticion perceptible | > 15 min | Playtest manual |
| Volumen musica vs SFX | 0.35 vs 0.50 default | Settings values |
| Tamaño del archivo JS | < 8KB | `wc -c` |

---

## 13. Futuras Extensiones (Post-MVP)

- **Sistema de biomas sonoros:** cada bioma (desert, jungle, snow, swamp) con escala/timbre unico
- **Eventos musicales:** pequenas melodias al lograr hitos (encontrar diamante, sobrevivir noche, construir casa)
- **Sistema de dia/noche completo:** transicion gradual de escalas conforme avanza el ciclo
- **Generacion de melodias con Markov chains:** para variacion mas sofisticada
- **Filtros dinamicos segun profundidad:** mas grave y filtrado cuanto mas bajo en el mundo
- **Integracion con weather system:** lluvia agrega capa de noise filtrado, tormenta agrega drone grave
