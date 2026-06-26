// ChillTuneEngine — Sistema de musica 8-bit dinamica relajante para JardVoxel
// SPEC-035: PRD-CHILLTUNE-MUSIC
// Genera musica procedural chiptune con escalas modales, transiciones suaves y
// deteccion automatica de estado de juego para inducir calma y tranquilidad.

// === Escalas modales (frecuencias en Hz) ===
const SCALES = {
  dorian:     [293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25],
  aeolian:    [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 415.30],
  lydian:     [349.23, 392.00, 440.00, 466.16, 523.25, 587.33, 659.25],
  phrygian:   [164.81, 174.61, 196.00, 220.00, 246.94, 261.63, 329.63],
  pentatonic: [293.66, 329.63, 392.00, 440.00, 523.25],
};

// === Configuracion de estados musicales ===
const STATE_CONFIG = {
  exploring:  { bpm: 60, scale: 'dorian',     layers: ['drone', 'melody'],              droneRoot: 0, filterFreq: 2000 },
  building:   { bpm: 65, scale: 'lydian',     layers: ['drone', 'melody', 'arpeggio'],  droneRoot: 0, filterFreq: 1800 },
  mining:     { bpm: 55, scale: 'aeolian',    layers: ['drone', 'melody'],              droneRoot: 0, filterFreq: 1200 },
  combat:     { bpm: 70, scale: 'phrygian',   layers: ['drone', 'melody', 'pulse'],     droneRoot: 0, filterFreq: 2200 },
  night:      { bpm: 50, scale: 'aeolian',    layers: ['drone', 'melody'],              droneRoot: 0, filterFreq: 1000 },
  underwater: { bpm: 52, scale: 'dorian',     layers: ['drone', 'melody', 'arpeggio'],  droneRoot: 0, filterFreq: 600  },
  idle:       { bpm: 45, scale: 'pentatonic', layers: ['drone'],                        droneRoot: 0, filterFreq: 800  },
};

// Pesos para seleccion de grado en la escala (grado 3 = quinta, mas probable)
const DEGREE_WEIGHTS = [3, 2, 4, 2, 3, 1, 2];

export class ChillTuneEngine {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.reverbNode = null;
    this.enabled = true;
    this.volume = 0.35;

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

    this.crossfadeDuration = 5;
    this.lastStateChange = 0;
    this.melodyRestCounter = 0;

    this.gameContext = {
      playerY: 64, playerMoving: false, playerInWater: false,
      dayTime: 0.5, nearbyHostiles: 0,
      blocksPlacedRecently: 0, blocksBrokenRecently: 0,
      idleTime: 0,
    };

    this._updateTimer = 0;
    this._blockPlaceTracker = [];
    this._blockBreakTracker = [];
    this._lastInputTime = performance.now();
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
    this.lastStateChange = this.ctx.currentTime;
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
    if (ctx.nearbyHostiles > 0 && ctx.nearbyHostiles <= 3) return 'combat';
    if (ctx.playerInWater) return 'underwater';
    if (ctx.idleTime > 30) return 'idle';
    if (ctx.dayTime > 0.75 || ctx.dayTime < 0.25) return 'night';
    if (ctx.playerY < 40) return 'mining';
    if (ctx.blocksPlacedRecently > 3) return 'building';
    return 'exploring';
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
    let restProb = 0.15;
    if (state === 'idle') restProb = 0.8;
    else if (state === 'night') restProb = 0.35;
    else if (state === 'mining') restProb = 0.25;
    else if (state === 'exploring') restProb = 0.2;

    if (Math.random() < restProb) return 0;

    // Forzar descanso cada 4-8 notas para respiracion natural
    this.melodyRestCounter++;
    if (this.melodyRestCounter >= 4 + Math.floor(Math.random() * 4)) {
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
    const rootFreq = scale[cfg.droneRoot] * 0.25; // 2 octavas abajo

    this.droneOsc = this.ctx.createOscillator();
    this.droneGain = this.ctx.createGain();
    const droneFilter = this.ctx.createBiquadFilter();

    this.droneOsc.type = 'triangle';
    this.droneOsc.frequency.value = rootFreq;

    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 400;

    this.droneGain.gain.value = 0;

    this.droneOsc.connect(droneFilter).connect(this.droneGain).connect(this.musicGain);
    this.droneOsc.start();

    // LFO de volumen (efecto respiracion)
    this.droneLFO = this.ctx.createOscillator();
    this.droneLFO.type = 'sine';
    this.droneLFO.frequency.value = 0.15; // ~6.6s per cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.03;
    this.droneLFO.connect(lfoGain).connect(this.droneGain.gain);
    this.droneLFO.start();

    // Fade in drone
    const now = this.ctx.currentTime;
    this.droneGain.gain.setValueAtTime(0, now);
    this.droneGain.gain.linearRampToValueAtTime(0.08, now + 4);
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
    const rootFreq = scale[cfg.droneRoot] * 0.25;
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
      // Tocar melodia cada 2-4 barras para espacio
      const melodyInterval = this.currentState === 'idle' ? 8 : (this.currentState === 'night' ? 6 : 4);
      if (bar % melodyInterval === 0) {
        const noteFreq = this._generateMelodyNote();
        if (noteFreq > 0) {
          const dur = bl * (this.currentState === 'idle' ? 16 : (this.currentState === 'night' ? 12 : 8));
          const vol = this.currentState === 'combat' ? 0.06 : 0.05;
          this._playNote(noteFreq, time, dur, 'sine', vol, cfg.filterFreq, true);
        }
      }
    }

    // Arpeggio: cada 8-16 barras
    if (layers.includes('arpeggio')) {
      const arpInterval = this.currentState === 'underwater' ? 8 : 12;
      if (bar % arpInterval === 0 && Math.random() < 0.6) {
        this._playArpeggio(time, 0.035);
      }
    }

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
    delay.delayTime.value = 0.4;
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.3;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;
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
}
