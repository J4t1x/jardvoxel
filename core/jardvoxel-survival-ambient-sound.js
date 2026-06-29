// ═══════════════════════════════════════════════════════════
// SPEC-084: Ambient Sound System
// Biome-specific ambient sounds using Web Audio API with
// procedural buffers. 3D positional audio for localized sounds.
// Crossfade between biomes (2s). Volume independent from music.
// ═══════════════════════════════════════════════════════════

// === Biome ambient sound profiles (10 biomes) ===
export const AMBIENT_PROFILES = {
  plains: {
    ambient: [
      { type: 'birds',   count: 3, vol: 0.12, interval: [3, 8] },
      { type: 'wind',    vol: 0.06, continuous: true },
      { type: 'insects', vol: 0.04, continuous: true, filter: 3000 },
    ],
  },
  forest: {
    ambient: [
      { type: 'birds',   count: 5, vol: 0.10, interval: [2, 6] },
      { type: 'leaves',  vol: 0.05, continuous: true, filter: 2000 },
      { type: 'animals', vol: 0.06, interval: [10, 20] },
    ],
  },
  desert: {
    ambient: [
      { type: 'wind',    vol: 0.14, continuous: true, filter: 1200 },
      { type: 'sand',    vol: 0.04, continuous: true, filter: 800 },
      { type: 'hawk',    vol: 0.08, interval: [15, 30] },
    ],
  },
  mountains: {
    ambient: [
      { type: 'wind',    vol: 0.16, continuous: true, filter: 1000 },
      { type: 'eagle',   vol: 0.09, interval: [12, 25] },
      { type: 'rockfall',vol: 0.07, interval: [20, 40] },
    ],
  },
  swamp: {
    ambient: [
      { type: 'frogs',   vol: 0.08, interval: [4, 10] },
      { type: 'insects', vol: 0.06, continuous: true, filter: 2500 },
      { type: 'drip',    vol: 0.05, interval: [2, 5] },
      { type: 'crows',   vol: 0.06, interval: [8, 16] },
    ],
  },
  ocean: {
    ambient: [
      { type: 'waves',   vol: 0.14, continuous: true, filter: 1500 },
      { type: 'seagulls',vol: 0.08, interval: [6, 14] },
      { type: 'underwater', vol: 0.04, continuous: true, filter: 500 },
    ],
  },
  caves: {
    ambient: [
      { type: 'drip',    vol: 0.05, interval: [5, 12] },
      { type: 'chimes',  vol: 0.04, interval: [15, 30] },
      { type: 'glow',    vol: 0.04, interval: [10, 25] },
    ],
  },
  mystic_grove: {
    ambient: [
      { type: 'chimes',  vol: 0.08, interval: [5, 12] },
      { type: 'whispers',vol: 0.04, continuous: true, filter: 1800 },
      { type: 'glow',    vol: 0.05, interval: [4, 10] },
    ],
  },
  village: {
    ambient: [
      { type: 'chatter', vol: 0.07, interval: [5, 12] },
      { type: 'hammer',  vol: 0.06, interval: [8, 16] },
      { type: 'laughter',vol: 0.05, interval: [10, 20] },
      { type: 'fire',    vol: 0.06, continuous: true, filter: 1000 },
    ],
  },
  nether: {
    ambient: [
      { type: 'drone',   vol: 0.06, continuous: true, filter: 600 },
      { type: 'lava',    vol: 0.05, continuous: true, filter: 1000 },
      { type: 'glow',    vol: 0.04, interval: [20, 40] },
    ],
  },
  // SPEC-099: Wellness biomes
  zen_garden: {
    ambient: [
      { type: 'chimes',  vol: 0.06, interval: [8, 16] },
      { type: 'wind',    vol: 0.03, continuous: true, filter: 3000 },
      { type: 'birds',   vol: 0.05, interval: [10, 20] },
    ],
  },
  bamboo_grove: {
    ambient: [
      { type: 'leaves',  vol: 0.06, continuous: true, filter: 2500 },
      { type: 'birds',   vol: 0.07, count: 3, interval: [4, 10] },
      { type: 'wind',    vol: 0.04, continuous: true, filter: 1800 },
    ],
  },
  aurora_tundra: {
    ambient: [
      { type: 'wind',    vol: 0.10, continuous: true, filter: 800 },
      { type: 'owls',    vol: 0.06, interval: [12, 25] },
      { type: 'glow',    vol: 0.05, interval: [8, 16] },
    ],
  },
};

// === Sound type definitions ===
const SOUND_TYPES = {
  birds:     { freqRange: [2000, 5000], durRange: [0.1, 0.3], waveType: 'sine',   filter: 4000 },
  wind:      { freqRange: [200, 600],   durRange: [2, 5],     waveType: 'brown',  filter: 1200 },
  insects:   { freqRange: [3000, 6000], durRange: [0.5, 2],   waveType: 'sawtooth',filter: 3500 },
  leaves:    { freqRange: [400, 1200],  durRange: [1, 3],     waveType: 'triangle',filter: 2000 },
  animals:   { freqRange: [300, 800],   durRange: [0.3, 0.8], waveType: 'sine',   filter: 2000 },
  sand:      { freqRange: [100, 400],   durRange: [1, 3],     waveType: 'brown',  filter: 600 },
  hawk:      { freqRange: [1500, 3000], durRange: [0.3, 0.6], waveType: 'sine',   filter: 3000 },
  eagle:     { freqRange: [1000, 2500], durRange: [0.4, 0.8], waveType: 'sine',   filter: 2500 },
  rockfall:  { freqRange: [80, 300],    durRange: [0.5, 1.5], waveType: 'triangle',filter: 1200 },
  frogs:     { freqRange: [400, 900],   durRange: [0.1, 0.3], waveType: 'sine',   filter: 1800 },
  drip:      { freqRange: [800, 2000],  durRange: [0.05, 0.15],waveType: 'sine',  filter: 3000 },
  crows:     { freqRange: [600, 1200],  durRange: [0.2, 0.5], waveType: 'sine',   filter: 2200 },
  waves:     { freqRange: [100, 500],   durRange: [3, 7],     waveType: 'brown',  filter: 1000 },
  seagulls:  { freqRange: [1200, 2800], durRange: [0.2, 0.5], waveType: 'sine',   filter: 2800 },
  underwater:{ freqRange: [80, 300],    durRange: [2, 5],     waveType: 'sine',   filter: 400 },
  echo:      { freqRange: [300, 800],   durRange: [0.5, 1.5], waveType: 'sine',   filter: 1500, reverb: true },
  creak:     { freqRange: [150, 400],   durRange: [0.3, 0.8], waveType: 'sine',     filter: 1200 },
  chimes:    { freqRange: [1500, 4000], durRange: [0.5, 1.5], waveType: 'sine',   filter: 3500 },
  whispers:  { freqRange: [200, 800],   durRange: [1, 3],     waveType: 'triangle',filter: 1500 },
  glow:      { freqRange: [800, 2000],  durRange: [0.3, 0.8], waveType: 'sine',   filter: 2500 },
  chatter:   { freqRange: [400, 1200],  durRange: [0.3, 0.8], waveType: 'sine',   filter: 2500 },
  hammer:    { freqRange: [200, 600],   durRange: [0.05, 0.15],waveType: 'triangle',filter: 1800 },
  laughter:  { freqRange: [500, 1500],  durRange: [0.3, 0.6], waveType: 'sine',   filter: 2500 },
  fire:      { freqRange: [100, 400],   durRange: [1, 3],     waveType: 'brown',  filter: 1200 },
  drone:     { freqRange: [80, 200],    durRange: [3, 8],     waveType: 'sine',   filter: 500 },
  lava:      { freqRange: [80, 250],    durRange: [1, 3],     waveType: 'brown',  filter: 1000 },
  screams:   { freqRange: [400, 1200],  durRange: [0.3, 0.8], waveType: 'sawtooth',filter: 1800 }, // unused — nether reworked
  // SPEC-099: Fauna cycle sounds
  crickets:  { freqRange: [4000, 6000], durRange: [0.1, 0.3], waveType: 'square', filter: 5000 },
  owls:      { freqRange: [300, 600],   durRange: [0.5, 1.0], waveType: 'sine',   filter: 1000 },
};

const CROSSFADE_DURATION = 2; // seconds
const MAX_POINT_SOURCES = 16;

// SPEC-099: Soundscape distance layers
const SOUND_LAYERS = {
  near: { maxDist: 8,  volMod: 1.0, filterFreq: 0    }, // no filter
  mid:  { maxDist: 24, volMod: 0.6, filterFreq: 2000 },
  far:  { maxDist: 64, volMod: 0.3, filterFreq: 800  },
};

// SPEC-099: Biome-specific reverb properties
const BIOME_REVERB = {
  plains:   { decay: 1.2, wet: 0.15, filter: 3000, delay: 0   },
  forest:   { decay: 1.8, wet: 0.20, filter: 2500, delay: 0   },
  desert:   { decay: 2.5, wet: 0.25, filter: 2000, delay: 0   },
  mountains:{ decay: 3.0, wet: 0.30, filter: 1500, delay: 80  }, // directional delay
  swamp:    { decay: 2.0, wet: 0.22, filter: 1800, delay: 0   },
  ocean:    { decay: 1.5, wet: 0.18, filter: 2200, delay: 0   },
  caves:    { decay: 4.0, wet: 0.40, filter: 1200, delay: 0   }, // long echo
  mystic_grove:{ decay: 3.5, wet: 0.35, filter: 2800, delay: 0 },
  village:  { decay: 1.0, wet: 0.12, filter: 3000, delay: 0   },
  nether:   { decay: 3.0, wet: 0.30, filter: 800,  delay: 0   },
  // SPEC-099: Wellness biomes
  zen_garden:    { decay: 2.0, wet: 0.20, filter: 3200, delay: 0 },
  bamboo_grove:  { decay: 1.5, wet: 0.18, filter: 2800, delay: 0 },
  aurora_tundra: { decay: 3.5, wet: 0.28, filter: 1400, delay: 0 },
};

// SPEC-099: Fauna cycle — sounds per day phase
const FAUNA_CYCLE = {
  dawn:      { types: ['birds', 'birds', 'birds'], countMod: 2, volMod: 1.3 },
  morning:   { types: ['birds', 'animals'],         countMod: 1, volMod: 1.0 },
  noon:      { types: ['birds', 'insects'],         countMod: 0, volMod: 0.8 },
  afternoon: { types: ['insects', 'birds'],         countMod: 0, volMod: 0.9 },
  dusk:      { types: ['birds', 'crickets'],        countMod: 1, volMod: 1.1 },
  twilight:  { types: ['crickets', 'owls'],         countMod: 0, volMod: 1.0 },
  night:     { types: ['owls', 'crickets'],         countMod: 0, volMod: 0.7 },
  midnight:  { types: ['owls'],                     countMod: -1, volMod: 0.5 },
};

export class AmbientSoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.enabled = true;
    this.volume = 0.5;

    this.currentBiome = null;
    this.previousBiome = null;
    this.activeSources = [];
    this.continuousNodes = [];
    this.pointSources = [];
    this.scheduledTimers = [];
    this.crossfadeGain = null;
    this.previousGain = null;

    this._crossfadeTimer = null;
    this._listener = null;
    this._playerPos = { x: 0, y: 0, z: 0 };

    // INT-001: weather and indoor modulation multipliers
    this.weatherMultiplier = 1.0;
    this.indoorMultiplier = 1.0;
    this.timeMultiplier = 1.0;

    // SPEC-099: Reverb node for current biome
    this._biomeReverb = null;
    this._reverbWet = null;
    this._reverbDry = null;
    this._currentDayPhase = 'day';

    // 8D audio: noise buffer cache + spatial channel tracking
    this._noiseBufferCache = {};
    this._spatialChannels = [];
  }

  // === 8D Audio: Noise Generation ===

  _getNoiseBuffer(type) {
    if (this._noiseBufferCache[type]) return this._noiseBufferCache[type];
    if (!this.ctx) return null;

    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * 4); // 4s loop
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    } else if (type === 'pink') {
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
      for (let i = 0; i < length; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886*b0 + w*0.0555179;
        b1 = 0.99332*b1 + w*0.0750759;
        b2 = 0.96900*b2 + w*0.1538520;
        b3 = 0.86650*b3 + w*0.3104856;
        b4 = 0.55000*b4 + w*0.5329522;
        b5 = -0.7616*b5 - w*0.0168980;
        data[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11;
        b6 = w*0.115926;
      }
    } else { // brown
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const w = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * w)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }
    }

    this._noiseBufferCache[type] = buffer;
    return buffer;
  }

  // === 8D Audio: Spatial Rotation Panner ===

  _create8DPanner(speed, depth = 0.8) {
    if (!this.ctx) return null;
    try {
      const panner = this.ctx.createStereoPanner();
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = speed;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = depth;
      lfo.connect(lfoGain).connect(panner.pan);
      lfo.start();
      const channel = { panner, lfo, lfoGain };
      this._spatialChannels.push(channel);
      return channel;
    } catch (e) {
      return null;
    }
  }

  _createStaticPanner(panValue = 0) {
    if (!this.ctx) return null;
    try {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = panValue;
      return panner;
    } catch (e) {
      return null;
    }
  }

  // === Lifecycle ===

  init(ctx, masterGain) {
    this.ctx = ctx;
    if (!this.ctx) return;

    this._noiseBufferCache = {}; // reset cache for new context

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.enabled ? this.volume : 0;
    this.masterGain.connect(this.ctx.destination);

    if (masterGain) {
      this.masterGain.connect(masterGain);
    }

    this.crossfadeGain = this.ctx.createGain();
    this.crossfadeGain.gain.value = 1;
    this.crossfadeGain.connect(this.masterGain);

    this.previousGain = this.ctx.createGain();
    this.previousGain.gain.value = 0;
    this.previousGain.connect(this.masterGain);
  }

  setVolume(vol) {
    this.volume = vol;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.enabled ? vol : 0, now + 0.3);
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(enabled ? this.volume : 0, now + 0.3);
    }
    this._updateContinuousVolumes();
  }

  // INT-001: Weather volume modulation
  setWeather(weatherType) {
    switch (weatherType) {
      case 'rain':
      case 'thunder':
        this.weatherMultiplier = 1.2;
        break;
      case 'snow':
        this.weatherMultiplier = 0.6;
        break;
      case 'clear':
      default:
        this.weatherMultiplier = 1.0;
        break;
    }
    this._updateContinuousVolumes();
  }

  // INT-001: Indoor/cave attenuation
  setIndoor(indoor) {
    this.indoorMultiplier = indoor ? 0.6 : 1.0;
    this._updateContinuousVolumes();
  }

  // INT-001: Time-of-day volume modulation
  setTimeOfDay(phase) {
    switch (phase) {
      case 'dawn':
        this.timeMultiplier = 0.7;
        break;
      case 'day':
        this.timeMultiplier = 1.0;
        break;
      case 'sunset':
        this.timeMultiplier = 0.8;
        break;
      case 'night':
        this.timeMultiplier = 0.5;
        break;
      default:
        this.timeMultiplier = 1.0;
    }
    this._updateContinuousVolumes();
  }

  _updateContinuousVolumes() {
    if (!this.ctx) return;
    const active = this.enabled ? 1 : 0;
    const totalMultiplier = this.weatherMultiplier * this.indoorMultiplier * this.timeMultiplier * active;
    for (const node of this.continuousNodes) {
      if (node._gain && node._baseVol !== undefined) {
        try {
          const target = node._baseVol * totalMultiplier;
          node._gain.gain.cancelScheduledValues(this.ctx.currentTime);
          node._gain.gain.setValueAtTime(node._gain.gain.value, this.ctx.currentTime);
          node._gain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.5);
        } catch (e) {}
      }
    }
  }

  // === Biome Management ===

  setBiome(biome) {
    if (biome === this.currentBiome) return;
    const profile = AMBIENT_PROFILES[biome];
    if (!profile) return;

    this.previousBiome = this.currentBiome;
    this.currentBiome = biome;

    // SPEC-099: Apply biome-specific reverb
    if (this.ctx) this._applyBiomeReverb(biome);

    if (this.previousBiome && this.ctx) {
      this._crossfadeToBiome(biome);
    } else {
      this._stopAllSources();
      this._startBiomeSounds(biome, this.crossfadeGain);
    }
  }

  _crossfadeToBiome(newBiome) {
    const now = this.ctx.currentTime;

    // Fade out old sources via previousGain
    this.previousGain.gain.cancelScheduledValues(now);
    this.previousGain.gain.setValueAtTime(1, now);
    this.previousGain.gain.linearRampToValueAtTime(0, now + CROSSFADE_DURATION);

    // Move current sources to previousGain (reconnect output, not source)
    for (const node of this.continuousNodes) {
      try {
        if (node._spatial) {
          node._spatial.panner.disconnect();
          node._spatial.panner.connect(this.previousGain);
        } else if (node._gain) {
          node._gain.disconnect();
          node._gain.connect(this.previousGain);
        }
      } catch (e) {}
    }
    const oldContinuous = this.continuousNodes;
    const oldTimers = this.scheduledTimers;

    // Fade in new sources via crossfadeGain
    this.crossfadeGain.gain.cancelScheduledValues(now);
    this.crossfadeGain.gain.setValueAtTime(0, now);
    this.crossfadeGain.gain.linearRampToValueAtTime(1, now + CROSSFADE_DURATION);

    this.continuousNodes = [];
    this.scheduledTimers = [];
    this._startBiomeSounds(newBiome, this.crossfadeGain);

    // Clean up old after crossfade
    if (this._crossfadeTimer) clearTimeout(this._crossfadeTimer);
    this._crossfadeTimer = setTimeout(() => {
      for (const node of oldContinuous) {
        try { this._stopContinuousNode(node); } catch (e) {}
      }
      for (const timer of oldTimers) {
        clearTimeout(timer);
      }
      this.previousGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }, (CROSSFADE_DURATION + 0.5) * 1000);
  }

  _startBiomeSounds(biome, outputGain) {
    const profile = AMBIENT_PROFILES[biome];
    if (!profile || !this.ctx) return;

    for (const sound of profile.ambient) {
      const def = SOUND_TYPES[sound.type];
      if (!def) continue;

      if (sound.continuous) {
        this._startContinuousSound(sound, def, outputGain);
      } else {
        this._scheduleIntermittentSound(sound, def, outputGain);
      }
    }
  }

  _startContinuousSound(sound, def, outputGain) {
    if (!this.ctx) return;

    const isNoise = def.waveType === 'brown' || sound.type === 'insects' || sound.type === 'whispers';
    let source;

    if (isNoise) {
      source = this.ctx.createBufferSource();
      const noiseType = def.waveType === 'brown' ? 'brown' : (sound.type === 'insects' ? 'white' : 'pink');
      source.buffer = this._getNoiseBuffer(noiseType);
      source.loop = true;
    } else {
      source = this.ctx.createOscillator();
      source.type = def.waveType;
      source.frequency.value = this._randomRange(def.freqRange[0], def.freqRange[1]);
    }

    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = sound.type === 'insects' ? 'bandpass' : 'lowpass';
    filter.frequency.value = sound.filter || def.filter || 2000;
    if (filter.type === 'bandpass') filter.Q.value = 8;

    gain.gain.value = 0;
    const now = this.ctx.currentTime;
    gain.gain.linearRampToValueAtTime(sound.vol, now + CROSSFADE_DURATION);

    // 8D spatial rotation — each source orbits at a unique speed
    const rotSpeed = 0.04 + Math.random() * 0.13;
    const spatial = this._create8DPanner(rotSpeed, 0.85);
    const spatialOut = spatial ? spatial.panner : null;

    if (spatialOut) {
      source.connect(filter).connect(gain).connect(spatialOut).connect(outputGain);
    } else {
      source.connect(filter).connect(gain).connect(outputGain);
    }
    source.start();

    // Amplitude modulation for natural variation on noise sources
    if (isNoise) {
      const ampLfo = this.ctx.createOscillator();
      ampLfo.type = 'sine';
      ampLfo.frequency.value = 0.08 + Math.random() * 0.15;
      const ampLfoGain = this.ctx.createGain();
      ampLfoGain.gain.value = sound.vol * 0.35;
      ampLfo.connect(ampLfoGain).connect(gain.gain);
      ampLfo.start();
      source._ampLfo = ampLfo;
      source._ampLfoGain = ampLfoGain;
    } else {
      // Gentle frequency modulation for tonal sources
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1 + Math.random() * 0.2;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = source.frequency.value * 0.12;
      lfo.connect(lfoGain).connect(source.frequency);
      lfo.start();
      source._lfo = lfo;
    }

    source._gain = gain;
    source._filter = filter;
    source._baseVol = sound.vol;
    source._spatial = spatial;
    this.continuousNodes.push(source);
  }

  _scheduleIntermittentSound(sound, def, outputGain) {
    if (!this.ctx) return;

    const schedule = () => {
      if (!this.ctx || this.currentBiome !== this._getCurrentBiomeForSound(sound)) return;
      this._playOneShot(sound, def, outputGain);
      const interval = this._randomRange(sound.interval[0], sound.interval[1]) * 1000;
      const timer = setTimeout(schedule, interval);
      this.scheduledTimers.push(timer);
    };

    const initialDelay = this._randomRange(sound.interval[0], sound.interval[1]) * 1000;
    const timer = setTimeout(schedule, initialDelay);
    this.scheduledTimers.push(timer);
  }

  _getCurrentBiomeForSound() {
    return this.currentBiome;
  }

  _playOneShot(sound, def, outputGain) {
    if (!this.ctx) return;

    const isNoise = def.waveType === 'brown';
    let source;

    if (isNoise) {
      source = this.ctx.createBufferSource();
      source.buffer = this._getNoiseBuffer('brown');
    } else {
      source = this.ctx.createOscillator();
      source.type = def.waveType;
      source.frequency.value = this._randomRange(def.freqRange[0], def.freqRange[1]);
    }

    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.value = sound.filter || def.filter || 2000;

    const dur = this._randomRange(def.durRange[0], def.durRange[1]);
    const now = this.ctx.currentTime;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(sound.vol, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    // 8D: random static pan for spatial variety on short sounds
    const panValue = (Math.random() * 2 - 1) * 0.7;
    const panner = this._createStaticPanner(panValue);

    if (panner) {
      source.connect(filter).connect(gain).connect(panner).connect(outputGain);
    } else {
      source.connect(filter).connect(gain).connect(outputGain);
    }

    // Add harmonic for richer tonal sounds (birds, chimes, drip, glow)
    let harmonic = null;
    let harmonicGain = null;
    if (!isNoise && (sound.type === 'birds' || sound.type === 'chimes' || sound.type === 'drip' || sound.type === 'glow')) {
      harmonic = this.ctx.createOscillator();
      harmonic.type = 'sine';
      harmonic.frequency.value = source.frequency.value * 2;
      harmonicGain = this.ctx.createGain();
      harmonicGain.gain.setValueAtTime(0, now);
      harmonicGain.gain.linearRampToValueAtTime(sound.vol * 0.3, now + 0.05);
      harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      harmonic.connect(harmonicGain);
      if (panner) harmonicGain.connect(panner);
      else harmonicGain.connect(outputGain);
      harmonic.start(now);
      harmonic.stop(now + dur + 0.1);
    }

    source.start(now);
    source.stop(now + dur + 0.1);

    source.onended = () => {
      try {
        source.disconnect(); gain.disconnect(); filter.disconnect();
        if (panner) panner.disconnect();
        if (harmonic) { harmonic.disconnect(); harmonicGain.disconnect(); }
      } catch (e) {}
    };
  }

  // === 3D Positional Audio ===

  playPointSound(type, x, y, z, vol = 0.1) {
    if (!this.ctx || !this.enabled) return;
    const def = SOUND_TYPES[type];
    if (!def) return;

    // LRU: remove oldest if at max
    if (this.pointSources.length >= MAX_POINT_SOURCES) {
      const old = this.pointSources.shift();
      try { old.stop(); old.disconnect(); } catch (e) {}
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const panner = this.ctx.createPanner();

    osc.type = def.waveType === 'brown' ? 'sine' : def.waveType;
    const freq = this._randomRange(def.freqRange[0], def.freqRange[1]);
    osc.frequency.value = freq;

    filter.type = 'lowpass';
    filter.frequency.value = def.filter || 2000;

    // PannerNode setup
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 32;
    panner.rolloffFactor = 1;
    if (panner.positionX) {
      panner.positionX.value = x;
      panner.positionY.value = y;
      panner.positionZ.value = z;
    } else {
      panner.setPosition(x, y, z);
    }

    const dur = this._randomRange(def.durRange[0], def.durRange[1]);
    const now = this.ctx.currentTime;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter).connect(gain).connect(panner).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + dur + 0.1);

    this.pointSources.push(osc);
    osc.onended = () => {
      const idx = this.pointSources.indexOf(osc);
      if (idx >= 0) this.pointSources.splice(idx, 1);
      try { osc.disconnect(); gain.disconnect(); filter.disconnect(); panner.disconnect(); } catch (e) {}
    };
  }

  updateListener(x, y, z, forwardX, forwardZ) {
    this._playerPos = { x, y, z };
    if (!this.ctx || !this.ctx.listener) return;
    const listener = this.ctx.listener;
    if (listener.positionX) {
      listener.positionX.value = x;
      listener.positionY.value = y;
      listener.positionZ.value = z;
    } else {
      listener.setPosition(x, y, z);
    }
    if (listener.forwardX) {
      listener.forwardX.value = forwardX || 0;
      listener.forwardY.value = 0;
      listener.forwardZ.value = forwardZ || -1;
    }
    if (listener.upX) {
      listener.upX.value = 0;
      listener.upY.value = 1;
      listener.upZ.value = 0;
    }
  }

  // === Cleanup ===

  _stopContinuousNode(node) {
    if (!node) return;
    try {
      if (node._lfo) { node._lfo.stop(); node._lfo.disconnect(); }
      if (node._ampLfo) { node._ampLfo.stop(); node._ampLfo.disconnect(); }
      if (node._ampLfoGain) node._ampLfoGain.disconnect();
      if (node._spatial) {
        node._spatial.lfo.stop();
        node._spatial.lfo.disconnect();
        node._spatial.lfoGain.disconnect();
        node._spatial.panner.disconnect();
        const idx = this._spatialChannels.indexOf(node._spatial);
        if (idx >= 0) this._spatialChannels.splice(idx, 1);
      }
      if (node._gain) node._gain.disconnect();
      if (node._filter) node._filter.disconnect();
      node.stop();
      node.disconnect();
    } catch (e) {}
  }

  _stopAllSources() {
    for (const node of this.continuousNodes) {
      this._stopContinuousNode(node);
    }
    this.continuousNodes = [];

    for (const timer of this.scheduledTimers) {
      clearTimeout(timer);
    }
    this.scheduledTimers = [];

    for (const src of this.pointSources) {
      try { src.stop(); src.disconnect(); } catch (e) {}
    }
    this.pointSources = [];

    if (this._crossfadeTimer) {
      clearTimeout(this._crossfadeTimer);
      this._crossfadeTimer = null;
    }
  }

  destroy() {
    this._stopAllSources();
    // Clean up any remaining spatial channels
    for (const ch of this._spatialChannels) {
      try { ch.lfo.stop(); ch.lfo.disconnect(); ch.lfoGain.disconnect(); ch.panner.disconnect(); } catch (e) {}
    }
    this._spatialChannels = [];
    if (this.masterGain) {
      try { this.masterGain.disconnect(); } catch (e) {}
    }
    if (this.crossfadeGain) {
      try { this.crossfadeGain.disconnect(); } catch (e) {}
    }
    if (this.previousGain) {
      try { this.previousGain.disconnect(); } catch (e) {}
    }
  }

  // === SPEC-099: Soundscape Distance Layers ===

  _playSoundAtDistance(type, distance, vol = 0.1) {
    if (!this.ctx || !this.enabled) return;
    const def = SOUND_TYPES[type];
    if (!def) return;

    // Determine layer
    let layer = SOUND_LAYERS.far;
    if (distance <= SOUND_LAYERS.near.maxDist) layer = SOUND_LAYERS.near;
    else if (distance <= SOUND_LAYERS.mid.maxDist) layer = SOUND_LAYERS.mid;

    const adjustedVol = vol * layer.volMod;
    const filterFreq = layer.filterFreq || def.filter || 2000;

    const isNoise = def.waveType === 'brown' || type === 'insects' || type === 'whispers';
    let source;
    if (isNoise) {
      source = this.ctx.createBufferSource();
      const noiseType = def.waveType === 'brown' ? 'brown' : (type === 'insects' ? 'white' : 'pink');
      source.buffer = this._getNoiseBuffer(noiseType);
    } else {
      source = this.ctx.createOscillator();
      source.type = def.waveType;
      source.frequency.value = this._randomRange(def.freqRange[0], def.freqRange[1]);
    }

    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = type === 'insects' ? 'bandpass' : 'lowpass';
    filter.frequency.value = filterFreq;
    if (filter.type === 'bandpass') filter.Q.value = 8;

    const dur = this._randomRange(def.durRange[0], def.durRange[1]);
    const now = this.ctx.currentTime;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(adjustedVol, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    const output = this._biomeReverb ? this._biomeReverb.input : this.masterGain;
    const panValue = (Math.random() * 2 - 1) * 0.6;
    const panner = this._createStaticPanner(panValue);
    if (panner) {
      source.connect(filter).connect(gain).connect(panner).connect(output);
    } else {
      source.connect(filter).connect(gain).connect(output);
    }
    source.start(now);
    source.stop(now + dur + 0.1);

    source.onended = () => {
      try { source.disconnect(); gain.disconnect(); filter.disconnect(); if (panner) panner.disconnect(); } catch (e) {}
    };
  }

  // === SPEC-099: Natural Reverb per Biome ===

  _createBiomeReverb(biome) {
    const cfg = BIOME_REVERB[biome];
    if (!cfg || !this.ctx) return null;

    // Mountains use delay-based reverb; others use convolver
    if (cfg.delay > 0) {
      const delay = this.ctx.createDelay(1.0);
      delay.delayTime.value = cfg.delay / 1000;
      const feedback = this.ctx.createGain();
      feedback.gain.value = 0.4;
      const wetGain = this.ctx.createGain();
      wetGain.gain.value = cfg.wet;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = cfg.filter;

      delay.connect(filter).connect(feedback).connect(delay);
      delay.connect(wetGain);

      return { input: delay, wet: wetGain, nodes: [delay, feedback, wetGain, filter], type: 'delay' };
    }

    // Convolver-based reverb with synthetic impulse response
    const convolver = this.ctx.createConvolver();
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * cfg.decay);
    const impulse = this.ctx.createBuffer(2, length, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    convolver.buffer = impulse;

    const wetGain = this.ctx.createGain();
    wetGain.gain.value = cfg.wet;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cfg.filter;

    convolver.connect(filter).connect(wetGain);

    return { input: convolver, wet: wetGain, nodes: [convolver, wetGain, filter], type: 'convolver' };
  }

  _applyBiomeReverb(biome) {
    // Remove old reverb
    if (this._biomeReverb) {
      try {
        this._biomeReverb.wet.disconnect();
        for (const n of this._biomeReverb.nodes) { try { n.disconnect(); } catch (e) {} }
      } catch (e) {}
      this._biomeReverb = null;
    }

    // Create new reverb
    const reverb = this._createBiomeReverb(biome);
    if (reverb) {
      reverb.wet.connect(this.masterGain);
      this._biomeReverb = reverb;
    }
  }

  // === SPEC-099: Fauna Cycle ===

  _updateFaunaCycle(phase) {
    this._currentDayPhase = phase;
    const fauna = FAUNA_CYCLE[phase];
    if (!fauna || !this.ctx) return;

    // Play fauna sounds based on phase
    for (const type of fauna.types) {
      const def = SOUND_TYPES[type];
      if (!def) continue;
      const vol = 0.08 * fauna.volMod;
      this._playSoundAtDistance(type, 5 + Math.random() * 15, vol);
    }
  }

  // === Helpers ===

  _randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  getProfile(biome) {
    return AMBIENT_PROFILES[biome] || null;
  }

  getCrossfadeDuration() {
    return CROSSFADE_DURATION;
  }
}
