// ChillTuneEngine — Deep Space Ambient Music Engine for JardVoxel
// SPEC-035: PRD-CHILLTUNE-MUSIC v8.0 — Cinematic Sci-Fi Atmosphere
// Genera musica ambient espacial procedural con pads largos, reverb profundo,
// texturas etéreas y movimiento lento para relajación y focus profundo.

// === Escalas modales (frecuencias en Hz) ===
// v7.0: Escalas suaves y relajantes — sin escalas oscuras
const SCALES = {
  pentatonic:  [293.66, 329.63, 392.00, 440.00, 523.25],           // C major pentatonic — alegre, seguro
  pentatonic_minor: [261.63, 293.66, 329.63, 392.00, 440.00],      // A minor pentatonic — suave, nostálgico (uso mínimo)
  dorian:      [293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25], // D dorian — cálido, jazz
  lydian:      [349.23, 392.00, 440.00, 466.16, 523.25, 587.33, 659.25], // F lydian — brillante, soñador
  ionian:      [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88], // C major — puro, luminoso
  mixolydian:  [293.66, 329.63, 349.23, 392.00, 440.00, 466.16, 523.25], // D mixolydian — folk cálido
};

// === SPEC-083: Biome scale mapping (8 scales) ===
export const BIOME_SCALES = {
  plains:        { scale: 'lydian',          bpm: 36, filterFreq: 2200 },
  forest:        { scale: 'lydian',          bpm: 34, filterFreq: 2000 },
  desert:        { scale: 'lydian',          bpm: 32, filterFreq: 2000 },
  mountains:     { scale: 'lydian',          bpm: 30, filterFreq: 2400 },
  swamp:         { scale: 'lydian',          bpm: 30, filterFreq: 1800 },
  mystic_grove:  { scale: 'lydian',          bpm: 32, filterFreq: 2400 },
  ocean:         { scale: 'lydian',          bpm: 30, filterFreq: 2000 },
  caves:         { scale: 'lydian',          bpm: 28, filterFreq: 1600, drone: true },
  jungle:        { scale: 'lydian',          bpm: 34, filterFreq: 2200 },
  taiga:         { scale: 'lydian',          bpm: 30, filterFreq: 2000 },
  snowy_plains:  { scale: 'lydian',          bpm: 28, filterFreq: 2200 },
  savanna:       { scale: 'lydian',          bpm: 34, filterFreq: 2200 },
  cherry_grove:  { scale: 'lydian',          bpm: 32, filterFreq: 2400 },
  autumn_forest: { scale: 'lydian',          bpm: 32, filterFreq: 2200 },
  beach:         { scale: 'lydian',          bpm: 32, filterFreq: 2200 },
  // SPEC-099: Wellness biomes
  zen_garden:    { scale: 'lydian',          bpm: 26, filterFreq: 2000 },
  bamboo_grove:  { scale: 'lydian',          bpm: 30, filterFreq: 2200 },
  aurora_tundra: { scale: 'lydian',          bpm: 26, filterFreq: 2000 },
};

// === SPEC-099: 8-phase circadian cycle (replaces 4-phase) ===
export const TIME_PHASES = {
  dawn:      { start: 0.20, end: 0.25, bpmMod: -5,  filterMod: -200, brightness: 0.7,  ascending: true },
  morning:   { start: 0.25, end: 0.35, bpmMod: 0,   filterMod: 0,    brightness: 0.9 },
  noon:      { start: 0.35, end: 0.50, bpmMod: 2,   filterMod: 100,  brightness: 1.0 },
  afternoon: { start: 0.50, end: 0.65, bpmMod: 0,   filterMod: 0,    brightness: 0.95 },
  dusk:      { start: 0.65, end: 0.75, bpmMod: -3,  filterMod: -100, brightness: 0.7,  descending: true },
  twilight:  { start: 0.75, end: 0.80, bpmMod: -5,  filterMod: -200, brightness: 0.5 },
  night:     { start: 0.80, end: 0.95, bpmMod: -5,  filterMod: -200, brightness: 0.6,  minimalist: true },
  midnight:  { start: 0.95, end: 0.20, bpmMod: -7,  filterMod: -300, brightness: 0.5,  minimalist: true },
};

// Backward compat alias
export const TIME_MODULATION = TIME_PHASES;

// === SPEC-083: Weather effects (3 types) ===
export const WEATHER_EFFECTS = {
  clear:   { percussion: false, melodyAttenuation: 1.0, silence: false },
  rain:    { percussion: true,  melodyAttenuation: 0.6, silence: false },
  snow:    { percussion: false, melodyAttenuation: 0.3, silence: false, crystalHighs: true },
  thunder: { percussion: false, melodyAttenuation: 0.1, silence: true,  dramaticImpacts: true },
};

// === SPEC-083: Event stingers — Peaceful & Relaxing ===
export const EVENT_STINGERS = {
  structure_discovery: { notes: [349.23, 392.00, 440.00], duration: 1.2, type: 'sine', vol: 0.04 },
  new_biome:           { notes: [293.66, 349.23, 392.00, 440.00], duration: 1.5, type: 'sine', vol: 0.04 },
  combat_enter:        { notes: [392.00, 440.00, 493.88], duration: 0.8, type: 'sine', vol: 0.03 },
  archaeological:      { notes: [349.23, 392.00, 440.00, 523.25], duration: 1.8, type: 'sine', vol: 0.04 },
  npc_death:           { notes: [392.00, 349.23, 329.63], duration: 1.5, type: 'sine', vol: 0.02 },
  legendary:           { notes: [293.66, 329.63, 392.00, 440.00, 523.25], duration: 2.0, type: 'sine', vol: 0.05 },
  village_approach:    { notes: [329.63, 392.00, 440.00], duration: 1.0, type: 'sine', vol: 0.04 },
};

// === Configuracion de estados musicales ===
const STATE_CONFIG = {
  exploring:  { bpm: 36, scale: 'lydian',          layers: ['drone', 'melody'],              droneRoot: 0, filterFreq: 2200 },
  building:   { bpm: 38, scale: 'lydian',          layers: ['drone', 'melody'],              droneRoot: 0, filterFreq: 2200 },
  mining:     { bpm: 34, scale: 'lydian',          layers: ['drone', 'melody'],              droneRoot: 0, filterFreq: 2000 },
  combat:     { bpm: 40, scale: 'lydian',          layers: ['drone', 'melody'],              droneRoot: 0, filterFreq: 2200 },
  night:      { bpm: 30, scale: 'lydian',          layers: ['drone', 'melody'],              droneRoot: 0, filterFreq: 2000 },
  underwater: { bpm: 32, scale: 'lydian',          layers: ['drone', 'melody'],              droneRoot: 0, filterFreq: 1800 },
  idle:       { bpm: 26, scale: 'lydian',          layers: ['drone'],                        droneRoot: 0, filterFreq: 1800 },
  // SPEC-099: Contemplation mode — deep space stillness
  contemplation: { bpm: 24, scale: 'lydian', layers: ['drone'], droneRoot: 0, filterFreq: 1600 },
  // SPEC-112: Ocean music states
  calm_sea:   { bpm: 28, scale: 'lydian', layers: ['drone', 'melody'], droneRoot: 0, filterFreq: 1800 },
  discovery:  { bpm: 34, scale: 'lydian', layers: ['drone', 'melody'], droneRoot: 0, filterFreq: 2400 },
};

// Pesos para seleccion de grado en la escala (grado 3 = quinta, mas probable)
const DEGREE_WEIGHTS = [3, 2, 4, 2, 3, 1, 2];

export class ChillTuneEngine {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.reverbNode = null;
    this.enabled = true;
    this.volume = 0.18;

    this.currentState = 'exploring';
    this.targetState = 'exploring';
    this.currentBPM = 60;
    this.targetBPM = 60;

    this.activeOscs = [];
    this.activeGains = [];
    this.droneOsc = null;
    this.droneGain = null;
    this.droneLFO = null;
    this.breathLFO = null;

    this.currentBar = 0;
    this.nextNoteTime = 0;
    this.scheduleAhead = 0.15;
    this.lookahead = 30;
    this.schedulerTimer = null;

    this.crossfadeDuration = 6; // Deep space: 6s crossfade para transiciones suaves
    this.lastStateChange = 0;
    this.melodyRestCounter = 0;

    // SPEC-083: New reactivity fields
    this.currentBiome = null;
    this.previousBiome = null;
    this.currentWeather = 'clear';
    this.currentTimePhase = 'day';
    this.nearVillage = false;
    this.previousState = 'exploring'; // for combat return
    this._combatTimer = 0;
    this._stingerCooldown = 0;

    this.gameContext = {
      playerY: 64, playerMoving: false, playerInWater: false,
      dayTime: 0.5, nearbyHostiles: 0,
      blocksPlacedRecently: 0, blocksBrokenRecently: 0,
      idleTime: 0,
      biome: null, weather: 'clear', timePhase: 'day',
      nearVillage: false, inCave: false,
    };

    this._updateTimer = 0;
    this._blockPlaceTracker = [];
    this._blockBreakTracker = [];
    this._lastInputTime = performance.now();

    // SPEC-099: Komorebi state
    this._komorebiActive = false;
    this._komorebiFilter = null;
    this._komorebiArpTimer = null;
    this._inMeditationSpace = false;
  }

  // === Lifecycle ===

  init(ctx, sfxMasterGain) {
    this.ctx = ctx;
    if (!this.ctx) return;

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.enabled ? this.volume : 0;
    this.musicGain.connect(this.ctx.destination);

    // Reverb simulado con delay + feedback + lowpass
    this.reverbNode = this._createReverb();
    this.reverbNode.connect(this.musicGain);
  }

  start() {
    if (!this.ctx || !this.enabled) return;
    if (this._stopping) {
      setTimeout(() => this.start(), 500);
      return;
    }
    if (this.schedulerTimer) return; // already running
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this._startDrone();
    this.currentBar = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this._schedulerLoop();

    // Fade in
    const now = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setValueAtTime(0, now);
    this.musicGain.gain.linearRampToValueAtTime(this.volume, now + 3);
  }

  stop() {
    if (!this.ctx) return;
    this._stopping = true;
    const now = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
    this.musicGain.gain.linearRampToValueAtTime(0, now + 2);

    this._stopScheduler();
    setTimeout(() => {
      this._stopDrone();
      this._stopAllOscs();
      this._stopping = false;
    }, 2100);
  }

  destroy() {
    this._stopScheduler();
    this._stopDrone();
    this._stopAllOscs();
    this.setKomorebi(false);
    if (this.musicGain) {
      try { this.musicGain.disconnect(); } catch (e) {}
    }
    if (this.reverbNode) {
      try { this.reverbNode.disconnect(); } catch (e) {}
    }
  }

  // === State Management ===

  setState(newState) {
    if (!STATE_CONFIG[newState] || newState === this.targetState) return;
    this.targetState = newState;
    this.lastStateChange = this.ctx ? this.ctx.currentTime : 0;
    this._crossfadeToState(newState);
  }

  updateGameContext(data) {
    Object.assign(this.gameContext, data);
    const detected = this._detectState();
    if (detected !== this.targetState) {
      this.setState(detected);
    }
  }

  _detectState() {
    const ctx = this.gameContext;
    // SPEC-099: Contemplation mode takes priority — 60s idle in meditation space
    if (this._detectContemplation(ctx)) return 'contemplation';
    if (ctx.nearbyHostiles > 0 && ctx.nearbyHostiles <= 3) return 'combat';
    if (ctx.playerInWater) return 'underwater';
    if (ctx.idleTime > 30) return 'idle';
    if (ctx.dayTime > 0.75 || ctx.dayTime < 0.25) return 'night';
    if (ctx.playerY < 40) return 'mining';
    if (ctx.blocksPlacedRecently > 3) return 'building';
    return 'exploring';
  }

  // SPEC-099: Contemplation detection
  _detectContemplation(ctx) {
    return ctx.idleTime > 60 && this._inMeditationSpace;
  }

  // SPEC-099: Set meditation space flag
  setInMeditationSpace(inSpace) {
    this._inMeditationSpace = inSpace;
  }

  // === Music Generation ===

  _getScale() {
    const cfg = STATE_CONFIG[this.currentState];
    return SCALES[cfg.scale] || SCALES.dorian;
  }

  _weightedRandom(weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r < 0) return i;
    }
    return 0;
  }

  _generateMelodyNote() {
    const scale = this._getScale();
    const state = this.currentState;

    // Probabilidad de silencio (espacio negativo = relajacion)
    let restProb = 0.75;
    if (state === 'idle') restProb = 0.96;
    else if (state === 'night') restProb = 0.85;
    else if (state === 'mining') restProb = 0.78;
    else if (state === 'exploring') restProb = 0.75;
    else if (state === 'combat') restProb = 0.65;
    else if (state === 'contemplation') restProb = 0.98;
    else if (state === 'underwater') restProb = 0.82;

    if (Math.random() < restProb) return 0;

    // Forzar descanso cada 2-4 notas para espacios largos (ambient)
    this.melodyRestCounter++;
    if (this.melodyRestCounter >= 2 + Math.floor(Math.random() * 2)) {
      this.melodyRestCounter = 0;
      return 0;
    }

    const weights = DEGREE_WEIGHTS.slice(0, scale.length);
    const degree = this._weightedRandom(weights);
    const octave = Math.random() < 0.3 ? 2 : 1;
    return scale[degree] * octave;
  }

  _getChord(rootIdx) {
    const scale = this._getScale();
    const notes = [];
    const indices = [rootIdx, (rootIdx + 2) % scale.length, (rootIdx + 4) % scale.length];
    for (const idx of indices) {
      notes.push(scale[idx]);
    }
    return notes;
  }

  _playNote(freq, time, dur, type, vol, filterFreq, useReverb) {
    if (!this.ctx || !freq || freq <= 0) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.value = freq;

    filter.type = 'lowpass';
    filter.frequency.value = filterFreq || 2000;

    // Gain ramp anti-click
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.05);
    gain.gain.linearRampToValueAtTime(vol * 0.7, time + dur * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter).connect(gain);
    if (useReverb && this.reverbNode) {
      gain.connect(this.reverbNode);
    }
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + dur + 0.1);

    this.activeOscs.push(osc);
    this.activeGains.push(gain);

    // Cleanup
    osc.onended = () => {
      const oi = this.activeOscs.indexOf(osc);
      if (oi >= 0) this.activeOscs.splice(oi, 1);
      const gi = this.activeGains.indexOf(gain);
      if (gi >= 0) this.activeGains.splice(gi, 1);
      try { osc.disconnect(); gain.disconnect(); filter.disconnect(); } catch (e) {}
    };
  }

  _playArpeggio(time, vol) {
    const scale = this._getScale();
    const rootIdx = Math.floor(Math.random() * (scale.length - 4));
    const chord = this._getChord(rootIdx);
    const cfg = STATE_CONFIG[this.currentState];
    const bl = 60.0 / cfg.bpm / 4;
    const interval = bl * 2; // cada 8th note

    for (let i = 0; i < chord.length; i++) {
      this._playNote(chord[i], time + i * interval, bl * 3, 'triangle', vol, 1500, true);
    }
  }

  // === Drone ===

  _startDrone() {
    if (!this.ctx || this.droneOsc) return;
    const cfg = STATE_CONFIG[this.currentState];
    const scale = SCALES[cfg.scale];
    const rootFreq = scale[cfg.droneRoot] * 0.5; // 1 octava abajo — cálido, no tenebroso

    this.droneOsc = this.ctx.createOscillator();
    this.droneGain = this.ctx.createGain();
    const droneFilter = this.ctx.createBiquadFilter();

    this.droneOsc.type = 'sine';
    this.droneOsc.frequency.value = rootFreq;

    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 800; // Cálido y profundo

    this.droneGain.gain.value = 0;

    this.droneOsc.connect(droneFilter).connect(this.droneGain).connect(this.musicGain);
    this.droneOsc.start();

    // LFO de frecuencia (sutil shimmer espacial, NO volumen)
    this.droneLFO = this.ctx.createOscillator();
    this.droneLFO.type = 'sine';
    this.droneLFO.frequency.value = 0.03; // ~33s per cycle — movimiento glacial
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 2; // ±2Hz shimmer sutil
    this.droneLFO.connect(lfoGain).connect(this.droneOsc.frequency);
    this.droneLFO.start();

    // Fade in drone
    const now = this.ctx.currentTime;
    this.droneGain.gain.setValueAtTime(0, now);
    this.droneGain.gain.linearRampToValueAtTime(0.03, now + 12); // Pad estático y sutil
  }

  _stopDrone() {
    if (this.droneOsc) {
      try {
        const now = this.ctx ? this.ctx.currentTime : 0;
        if (this.droneGain) {
          this.droneGain.gain.cancelScheduledValues(now);
          this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, now);
          this.droneGain.gain.linearRampToValueAtTime(0, now + 2);
        }
        this.droneOsc.stop(now + 2.1);
      } catch (e) {}
      this.droneOsc = null;
    }
    if (this.droneLFO) {
      try { this.droneLFO.stop(); } catch (e) {}
      this.droneLFO = null;
    }
    this.droneGain = null;
  }

  _updateDroneFreq() {
    if (!this.droneOsc || !this.ctx) return;
    const cfg = STATE_CONFIG[this.currentState];
    const scale = SCALES[cfg.scale];
    const rootFreq = scale[cfg.droneRoot] * 0.5; // Una octava abajo — cálido, no sub-grave tenebroso
    const now = this.ctx.currentTime;
    this.droneOsc.frequency.cancelScheduledValues(now);
    this.droneOsc.frequency.setValueAtTime(this.droneOsc.frequency.value, now);
    this.droneOsc.frequency.linearRampToValueAtTime(rootFreq, now + this.crossfadeDuration);
  }

  // === Scheduler ===

  _schedulerLoop() {
    if (!this.ctx) return;
    const cfg = STATE_CONFIG[this.currentState];

    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAhead) {
      this._scheduleNote(this.currentBar, this.nextNoteTime, cfg);
      this.nextNoteTime += 60.0 / this.currentBPM * 0.25; // 16th notes
      this.currentBar++;
    }
    this.schedulerTimer = setTimeout(() => this._schedulerLoop(), this.lookahead);
  }

  _scheduleNote(bar, time, cfg) {
    const bl = 60.0 / this.currentBPM / 4; // duracion de 16th note
    const layers = cfg.layers;
    const scale = SCALES[cfg.scale];

    // Melody: notas en barras pares, espaciadas
    if (layers.includes('melody')) {
      // Tocar melodia cada 16-32 barras para espacios ultra-largos (deep ambient)
      const melodyInterval = this.currentState === 'idle' ? 32 : (this.currentState === 'night' ? 24 : 16);
      if (bar % melodyInterval === 0) {
        const noteFreq = this._generateMelodyNote();
        if (noteFreq > 0) {
          const dur = bl * (this.currentState === 'idle' ? 48 : (this.currentState === 'night' ? 36 : 24));
          const vol = this.currentState === 'combat' ? 0.03 : 0.025;
          this._playNote(noteFreq, time, dur, 'sine', vol, cfg.filterFreq, true);
        }
      }
    }

    // Arpeggio: deshabilitado para ambient puro (solo drone + melody sparse)
    // if (layers.includes('arpeggio')) {
    //   const arpInterval = this.currentState === 'underwater' ? 8 : 12;
    //   if (bar % arpInterval === 0 && Math.random() < 0.6) {
    //     this._playArpeggio(time, 0.035);
    //   }
    // }

    // Pulse sutil para combat (muy suave)
    if (layers.includes('pulse')) {
      if (bar % 4 === 0) {
        const pulseFreq = scale[0] * 0.5;
        this._playNote(pulseFreq, time, bl * 1.5, 'square', 0.02, 800, false);
      }
    }
  }

  _stopScheduler() {
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  // === Transitions ===

  _crossfadeToState(newState) {
    const oldCfg = STATE_CONFIG[this.currentState];
    const newCfg = STATE_CONFIG[newState];
    if (!newCfg) return;

    this.currentState = newState;

    // Ramp BPM
    this._rampBPM(newCfg.bpm, 4);

    // Update drone frequency
    this._updateDroneFreq();

    // Adjust drone filter for underwater
    if (this.droneOsc && this.ctx) {
      // The drone filter is set at creation; for dynamic changes we adjust musicGain chain
      // For simplicity, the filterFreq in config affects new notes
    }
  }

  _rampBPM(targetBPM, duration) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.targetBPM = targetBPM;
    // BPM ramp is handled gradually by adjusting currentBPM over time
    const startBPM = this.currentBPM;
    const steps = 20;
    const stepDuration = duration / steps;
    const bpmStep = (targetBPM - startBPM) / steps;

    for (let i = 1; i <= steps; i++) {
      setTimeout(() => {
        this.currentBPM = startBPM + bpmStep * i;
      }, stepDuration * 1000 * i);
    }
  }

  // === Effects ===

  _createReverb() {
    if (!this.ctx) return null;
    const delay = this.ctx.createDelay(1.0);
    delay.delayTime.value = 0.6;
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.4;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2400;
    delay.connect(filter).connect(feedback).connect(delay);
    // Input is the delay node itself; output also from delay
    return delay;
  }

  // === Cleanup ===

  _stopAllOscs() {
    for (const osc of this.activeOscs) {
      try { osc.stop(); osc.disconnect(); } catch (e) {}
    }
    for (const gain of this.activeGains) {
      try { gain.disconnect(); } catch (e) {}
    }
    this.activeOscs = [];
    this.activeGains = [];
  }

  // === Controls ===

  setVolume(v) {
    this.volume = v;
    if (this.musicGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(this.enabled ? v : 0, now + 0.3);
    }
  }

  setEnabled(b) {
    this.enabled = b;
    if (this.ctx) {
      if (b) {
        this.start();
      } else {
        this.stop();
      }
    }
  }

  toggle() {
    this.setEnabled(!this.enabled);
  }

  // === SPEC-083: Biome Reactivity ===

  setBiome(biome) {
    if (biome === this.currentBiome) return;
    this.previousBiome = this.currentBiome;
    this.currentBiome = biome;

    const biomeCfg = BIOME_SCALES[biome];
    if (biomeCfg) {
      // Apply biome scale and tempo
      const stateCfg = STATE_CONFIG[this.currentState];
      if (stateCfg) {
        stateCfg.scale = biomeCfg.scale;
        stateCfg.filterFreq = biomeCfg.filterFreq;
        this._rampBPM(biomeCfg.bpm + this._getTimeBpmMod(), this.crossfadeDuration);
      }
      this._updateDroneFreq();
    }

    // Trigger new biome stinger if we had a previous biome
    if (this.previousBiome) {
      this.playStinger('new_biome');
    }
  }

  getBiomeScale(biome) {
    const cfg = BIOME_SCALES[biome];
    return cfg ? cfg.scale : null;
  }

  // === SPEC-083: Time of Day Reactivity ===

  setTimePhase(phase) {
    if (phase === this.currentTimePhase) return;
    this.currentTimePhase = phase;
    const mod = TIME_PHASES[phase];
    if (mod) {
      const biomeCfg = BIOME_SCALES[this.currentBiome] || { bpm: 60 };
      this._rampBPM(biomeCfg.bpm + mod.bpmMod, this.crossfadeDuration);
    }
  }

  // SPEC-099: 8-phase circadian update from dayTime (0-1)
  updateTimePhase(dayTime) {
    const phase = this._getPhaseFromTime(dayTime);
    if (phase !== this.currentTimePhase) {
      this.setTimePhase(phase);
    }
  }

  _getPhaseFromTime(dayTime) {
    for (const [name, cfg] of Object.entries(TIME_PHASES)) {
      if (name === 'midnight') {
        // midnight wraps around 0.95-0.20
        if (dayTime >= 0.95 || dayTime < 0.20) return name;
      } else {
        if (dayTime >= cfg.start && dayTime < cfg.end) return name;
      }
    }
    return 'day';
  }

  _getTimeBpmMod() {
    const mod = TIME_PHASES[this.currentTimePhase];
    return mod ? mod.bpmMod : 0;
  }

  _getTimeFilterMod() {
    const mod = TIME_PHASES[this.currentTimePhase];
    return mod ? mod.filterMod : 0;
  }

  // === SPEC-083: Weather Reactivity ===

  setWeather(weather) {
    if (weather === this.currentWeather) return;
    this.currentWeather = weather;
  }

  getWeatherEffect() {
    return WEATHER_EFFECTS[this.currentWeather] || WEATHER_EFFECTS.clear;
  }

  // === SPEC-083: Event Stingers ===

  playStinger(eventName) {
    if (!this.ctx || !this.enabled || !this.ctx.createOscillator) return;
    const stinger = EVENT_STINGERS[eventName];
    if (!stinger) return;
    if (this._stingerCooldown > 0) return;

    this._stingerCooldown = 0.5;
    const now = this.ctx.currentTime;
    const noteDur = stinger.duration / stinger.notes.length;

    for (let i = 0; i < stinger.notes.length; i++) {
      this._playNote(stinger.notes[i], now + i * noteDur, noteDur * 1.5, stinger.type, stinger.vol, 3000, true);
    }
  }

  // === SPEC-083: Village Music ===

  setNearVillage(near) {
    if (near && !this.nearVillage) {
      this.playStinger('village_approach');
    }
    this.nearVillage = near;
    if (near) {
      // Warm melody: boost tempo slightly
      const biomeCfg = BIOME_SCALES[this.currentBiome] || { bpm: 60 };
      this._rampBPM(biomeCfg.bpm + 5, 1);
    }
  }

  // === SPEC-083: Combat Transition ===

  enterCombat() {
    if (this.currentState === 'combat') return;
    this.previousState = this.currentState;
    this.setState('combat');
    this.playStinger('combat_enter');
    this._combatTimer = 0;
  }

  exitCombat() {
    if (this.currentState !== 'combat') return;
    this.setState(this.previousState || 'exploring');
  }

  updateCombat(dt) {
    if (this.currentState !== 'combat') return;
    this._combatTimer += dt;
    // Auto-exit combat after 10s without re-trigger
    if (this._combatTimer > 10) {
      this.exitCombat();
    }
  }

  // === SPEC-083: Extended tick ===

  tickExtended(playerPos, dayTime, nearbyHostiles, inWater, biome, weather, nearVillage, inCave) {
    const now = performance.now();
    const idleTime = (now - this._lastInputTime) / 1000;

    // Update biome
    if (biome && biome !== this.currentBiome) {
      this.setBiome(biome);
    }

    // Update weather
    if (weather && weather !== this.currentWeather) {
      this.setWeather(weather);
    }

    // Update time phase — SPEC-099: 8-phase circadian
    this.updateTimePhase(dayTime);

    // Update village proximity
    this.setNearVillage(nearVillage || false);

    // Combat detection
    if (nearbyHostiles > 0) {
      this.enterCombat();
      this._combatTimer = 0; // reset timer while hostiles present
    }

    // Stinger cooldown
    if (this._stingerCooldown > 0) {
      this._stingerCooldown -= 0.1;
    }

    // Obtener phase actualizado
    const phase = this.currentTimePhase || this._getPhaseFromTime(dayTime);

    this.updateGameContext({
      playerY: playerPos ? playerPos.y : 64,
      playerInWater: inWater || false,
      dayTime: dayTime !== undefined ? dayTime : 0.5,
      nearbyHostiles: nearbyHostiles || 0,
      blocksPlacedRecently: this._blockPlaceTracker.length,
      blocksBrokenRecently: this._blockBreakTracker.length,
      idleTime: idleTime,
      biome: biome || null,
      weather: weather || 'clear',
      timePhase: phase,
      nearVillage: nearVillage || false,
      inCave: inCave || false,
    });
  }

  // === Tracking helpers (called from game) ===

  trackBlockPlace() {
    const now = performance.now();
    this._blockPlaceTracker.push(now);
    this._blockPlaceTracker = this._blockPlaceTracker.filter(t => now - t < 10000);
    this._lastInputTime = now;
  }

  trackBlockBreak() {
    const now = performance.now();
    this._blockBreakTracker.push(now);
    this._blockBreakTracker = this._blockBreakTracker.filter(t => now - t < 10000);
    this._lastInputTime = now;
  }

  trackInput() {
    this._lastInputTime = performance.now();
  }

  // Called once per second from game loop
  tick(playerPos, dayTime, nearbyHostiles, inWater) {
    const now = performance.now();
    const idleTime = (now - this._lastInputTime) / 1000;

    this.updateGameContext({
      playerY: playerPos ? playerPos.y : 64,
      playerInWater: inWater || false,
      dayTime: dayTime !== undefined ? dayTime : 0.5,
      nearbyHostiles: nearbyHostiles || 0,
      blocksPlacedRecently: this._blockPlaceTracker.length,
      blocksBrokenRecently: this._blockBreakTracker.length,
      idleTime: idleTime,
    });
  }

  // === SPEC-099: Komorebi (light through trees) ===

  setKomorebi(active) {
    if (active && !this._komorebiActive) {
      this._komorebiActive = true;
      if (this.ctx && this.musicGain) {
        // Highpass filter for filtered light effect
        this._komorebiFilter = this.ctx.createBiquadFilter();
        this._komorebiFilter.type = 'highpass';
        this._komorebiFilter.frequency.value = 800;
        this._komorebiFilter.connect(this.musicGain);
        // Schedule crystal arpeggios every 20-30s
        this._scheduleKomorebiArpeggio();
      }
    } else if (!active && this._komorebiActive) {
      this._komorebiActive = false;
      if (this._komorebiArpTimer) {
        clearTimeout(this._komorebiArpTimer);
        this._komorebiArpTimer = null;
      }
      if (this._komorebiFilter) {
        try { this._komorebiFilter.disconnect(); } catch (e) {}
        this._komorebiFilter = null;
      }
    }
  }

  _scheduleKomorebiArpeggio() {
    if (!this._komorebiActive || !this.ctx) return;
    const delay = 20000 + Math.random() * 10000; // 20-30s
    this._komorebiArpTimer = setTimeout(() => {
      if (this._komorebiActive && this.ctx) {
        // Crystal arpeggio — high triangle notes
        const scale = SCALES.pentatonic;
        const now = this.ctx.currentTime;
        for (let i = 0; i < 4; i++) {
          const note = scale[Math.floor(Math.random() * scale.length)] * 2;
          this._playNote(note, now + i * 0.15, 0.4, 'triangle', 0.04, 4000, true);
        }
      }
      this._scheduleKomorebiArpeggio();
    }, delay);
  }
}
