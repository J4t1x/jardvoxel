type TrackName = 'lounge' | 'lounge2' | 'lounge3' | 'spin' | 'spin2' | 'spin3' | 'win' | 'tense' | 'bonus' | 'gamble' | 'fever';

interface TrackData {
  bpm: number;
  triangle: number[];
  pulse1: number[];
  pulse2: number[];
  noise: number[];
}

const TRACKS: Record<string, TrackData> = {
  lounge: { bpm: 90, triangle: [110, 110, 110, 82, 110, 110, 82, 82], pulse1: [330, 262, 220, 262, 330, 330, 294, 262, 294, 247, 196, 247, 294, 294, 262, 247], pulse2: [], noise: [] },
  lounge2: { bpm: 95, triangle: [98, 98, 98, 110, 98, 98, 110, 130, 98, 98, 98, 110, 87, 87, 82, 82], pulse1: [294, 247, 220, 247, 294, 294, 262, 220, 262, 220, 196, 220, 262, 262, 247, 220], pulse2: [], noise: [] },
  lounge3: { bpm: 100, triangle: [82, 82, 87, 87, 98, 98, 110, 110, 87, 87, 82, 82, 73, 73, 82, 82], pulse1: [220, 196, 247, 196, 220, 220, 262, 196, 247, 220, 196, 247, 220, 220, 196, 175], pulse2: [165, 165, 175, 175, 165, 165, 147, 147, 175, 175, 165, 165, 131, 131, 147, 147], noise: [] },
  spin: { bpm: 140, triangle: [110, 110, 82, 82, 110, 110, 82, 82, 98, 98, 65, 65, 98, 98, 73, 73], pulse1: [220, 262, 330, 262, 220, 262, 330, 262, 196, 220, 262, 220, 196, 247, 294, 247], pulse2: [165, 165, 165, 165, 165, 165, 165, 165, 175, 175, 175, 175, 147, 147, 147, 147], noise: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] },
  spin2: { bpm: 150, triangle: [110, 98, 110, 82, 110, 98, 110, 82, 123, 110, 123, 98, 123, 110, 98, 82], pulse1: [262, 294, 330, 294, 262, 294, 330, 294, 220, 247, 262, 247, 220, 247, 262, 247], pulse2: [165, 165, 175, 175, 165, 165, 147, 147, 175, 175, 165, 165, 147, 147, 131, 131], noise: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] },
  spin3: { bpm: 160, triangle: [82, 110, 82, 98, 82, 110, 82, 98, 87, 110, 87, 123, 87, 110, 98, 123], pulse1: [330, 294, 262, 294, 330, 330, 262, 220, 294, 262, 220, 262, 294, 294, 247, 220], pulse2: [220, 220, 262, 262, 196, 196, 220, 220, 247, 247, 220, 220, 196, 196, 175, 175], noise: [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1] },
  win: { bpm: 130, triangle: [110, 110, 0, 110, 82, 82, 0, 82, 98, 98, 0, 98, 110, 110, 0, 130], pulse1: [330, 392, 440, 392, 330, 392, 440, 392, 294, 330, 392, 330, 294, 330, 392, 440], pulse2: [220, 220, 262, 262, 196, 196, 220, 220, 247, 247, 294, 294, 262, 262, 330, 330], noise: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] },
  tense: { bpm: 110, triangle: [73, 73, 73, 73, 82, 82, 82, 82, 73, 73, 73, 73, 65, 65, 65, 65], pulse1: [196, 196, 220, 220, 196, 196, 175, 175, 196, 196, 220, 220, 165, 165, 147, 147], pulse2: [147, 147, 131, 131, 147, 147, 165, 165, 131, 131, 147, 147, 110, 110, 98, 98], noise: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1] },
  bonus: { bpm: 160, triangle: [110, 110, 110, 110, 82, 82, 82, 82, 98, 98, 98, 98, 82, 82, 82, 82], pulse1: [330, 330, 330, 330, 330, 294, 262, 294, 262, 262, 262, 262, 262, 247, 220, 247], pulse2: [220, 220, 262, 262, 165, 165, 196, 196, 175, 175, 220, 220, 165, 165, 196, 196], noise: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] },
  gamble: { bpm: 100, triangle: [110, 110, 110, 110, 82, 82, 82, 82], pulse1: [220, 220, 220, 220, 262, 262, 262, 262], pulse2: [], noise: [] },
  fever: { bpm: 180, triangle: [110, 110, 110, 110, 110, 110, 110, 110], pulse1: [330, 294, 330, 294, 330, 294, 330, 294], pulse2: [220, 220, 262, 262, 165, 165, 196, 196], noise: [1, 1, 1, 1, 1, 1, 1, 1] },
};

const LOUNGE_TRACKS: TrackName[] = ['lounge', 'lounge2', 'lounge3'];
const SPIN_TRACKS: TrackName[] = ['spin', 'spin2', 'spin3'];

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;
  private musicEnabled: boolean = true;
  private volume: number = 70;
  private currentTrack: string | null = null;
  private chiptuneTimer: ReturnType<typeof setTimeout> | null = null;
  private seq = { currentBar: 0, nextNoteTime: 0, scheduleAhead: 0.1, lookahead: 25 };
  private loungeIdx = 0;
  private spinIdx = 0;
  private winTrackTimer: ReturnType<typeof setTimeout> | null = null;
  private chiptuneLayer = 0;

  init(): void {
    if (this.ctx) return;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume / 100;
      this.masterGain.connect(this.ctx.destination);
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) {
      console.error('Audio init failed:', e);
    }
  }

  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  setVolume(v: number): void {
    this.volume = v;
    if (this.masterGain) this.masterGain.gain.value = v / 100;
  }

  getVolume(): number {
    return this.volume;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.stopMusic();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (!enabled) this.stopMusic();
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  pickLoungeTrack(): TrackName {
    const idx = this.loungeIdx % LOUNGE_TRACKS.length;
    this.loungeIdx++;
    return LOUNGE_TRACKS[idx];
  }

  pickSpinTrack(): TrackName {
    const idx = this.spinIdx % SPIN_TRACKS.length;
    this.spinIdx++;
    return SPIN_TRACKS[idx];
  }

  private playOscNote(freq: number, time: number, dur: number, type: OscillatorType, vol: number): void {
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(g).connect(this.masterGain);
    osc.start(time);
    osc.stop(time + dur);
  }

  private playTone(freq: number, dur: number, type: OscillatorType = 'sine', vol: number = 0.1): void {
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(g).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + dur);
  }

  private playSweep(f1: number, f2: number, dur: number, type: OscillatorType = 'sawtooth', vol: number = 0.1): void {
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f1, now);
    osc.frequency.exponentialRampToValueAtTime(f2, now + dur);
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(g).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + dur);
  }

  private playNotes(notes: number[], dur: number, type: OscillatorType = 'sine', vol: number = 0.12): void {
    notes.forEach((f, i) => setTimeout(() => this.playTone(f, dur, type, vol), i * dur * 1000));
  }

  private playNoise(time: number, dur: number, vol: number): void {
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    const bs = this.ctx.sampleRate * dur;
    const buf = this.ctx.createBuffer(1, bs, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bs; i++) d[i] = Math.random() * 2 - 1;
    const n = this.ctx.createBufferSource();
    n.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    n.connect(g).connect(this.masterGain);
    n.start(time);
    n.stop(time + dur);
  }

  private scheduleNote(bar: number, time: number): void {
    const tr = TRACKS[this.currentTrack ?? 'lounge'];
    if (!tr) return;
    const bl = 60.0 / tr.bpm / 4;
    if (tr.triangle) {
      const n = tr.triangle[bar % tr.triangle.length];
      if (n > 0) this.playOscNote(n, time, bl * 0.9, 'triangle', 0.14);
    }
    if (tr.pulse1 && this.chiptuneLayer >= 1) {
      const n = tr.pulse1[bar % tr.pulse1.length];
      if (n > 0) this.playOscNote(n, time, bl * 0.8, 'square', 0.1);
    }
    if (tr.pulse2 && this.chiptuneLayer >= 2) {
      const n = tr.pulse2[bar % tr.pulse2.length];
      if (n > 0) this.playOscNote(n, time, bl * 0.7, 'square', 0.08);
    }
    if (tr.noise && this.chiptuneLayer >= 3) {
      if (tr.noise[bar % tr.noise.length]) this.playNoise(time, bl * 0.5, 0.1);
    }
  }

  private chiptuneScheduler = (): void => {
    if (!this.currentTrack || !this.ctx) return;
    while (this.seq.nextNoteTime < this.ctx.currentTime + this.seq.scheduleAhead) {
      this.scheduleNote(this.seq.currentBar, this.seq.nextNoteTime);
      const tr = TRACKS[this.currentTrack];
      if (tr) this.seq.nextNoteTime += (60.0 / tr.bpm) * 0.25;
      this.seq.currentBar++;
    }
    this.chiptuneTimer = setTimeout(this.chiptuneScheduler, this.seq.lookahead);
  };

  startMusic(name: string): void {
    if (!this.ctx || !this.enabled || !this.musicEnabled) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.stopMusic();
    this.currentTrack = name;
    this.seq.currentBar = 0;
    this.seq.nextNoteTime = this.ctx.currentTime + 0.1;
    this.chiptuneScheduler();
  }

  stopMusic(): void {
    if (this.chiptuneTimer) {
      clearTimeout(this.chiptuneTimer);
      this.chiptuneTimer = null;
    }
    this.currentTrack = null;
  }

  setLayer(layer: number): void {
    if (layer !== this.chiptuneLayer) {
      this.chiptuneLayer = layer;
      if (layer > 0) this.sfx('layerUp');
    }
  }

  playWinTrack(): void {
    if (this.winTrackTimer) {
      clearTimeout(this.winTrackTimer);
      this.winTrackTimer = null;
    }
    this.startMusic('win');
    this.winTrackTimer = setTimeout(() => {
      this.winTrackTimer = null;
      this.startMusic(this.pickLoungeTrack());
    }, 3500);
  }

  playTenseTrack(): void {
    if (this.winTrackTimer) {
      clearTimeout(this.winTrackTimer);
      this.winTrackTimer = null;
    }
    this.startMusic('tense');
    setTimeout(() => {
      this.startMusic(this.pickLoungeTrack());
    }, 2500);
  }

  sfx(type: string): void {
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    switch (type) {
      case 'spin':
        this.playSweep(200, 100, 0.3, 'sawtooth', 0.25);
        break;
      case 'reelStop':
        this.playTone(500, 0.05, 'square', 0.35);
        break;
      case 'win':
        this.playNotes([523, 659, 784], 0.15, 'sine', 0.28);
        break;
      case 'bigWin':
        this.playNotes([523, 659, 784, 1047, 1319], 0.12, 'sine', 0.35);
        break;
      case 'jackpot':
        this.playNotes([523, 659, 784, 1047, 1319, 1568, 2093], 0.1, 'square', 0.4);
        break;
      case 'bonus':
        this.playNotes([440, 554, 659, 880], 0.2, 'triangle', 0.35);
        break;
      case 'gambleWin':
        this.playNotes([659, 880], 0.15, 'sine', 0.28);
        break;
      case 'gambleLoss':
        this.playSweep(220, 55, 0.4, 'sawtooth', 0.28);
        break;
      case 'gambleCard':
        this.playTone(400, 0.1, 'square', 0.25);
        break;
      case 'coin':
        this.playTone(1319, 0.08, 'sine', 0.25);
        break;
      case 'nudge':
        this.playSweep(150, 300, 0.2, 'sawtooth', 0.25);
        break;
      case 'nearMiss':
        this.playSweep(300, 400, 0.3, 'triangle', 0.2);
        break;
      case 'feverMode':
        this.playNotes([440, 554, 659, 880, 1108], 0.1, 'square', 0.35);
        break;
      case 'freeSpins':
        this.playNotes([659, 784, 1047, 1319], 0.12, 'triangle', 0.3);
        break;
      case 'prestige':
        this.playNotes([523, 659, 784, 1047, 1319, 1568, 2093], 0.1, 'square', 0.35);
        setTimeout(() => this.playTone(1568, 0.5, 'triangle', 0.3), 700);
        break;
      case 'tapFruit':
        this.playTone(880, 0.04, 'square', 0.2);
        break;
      case 'mysteryCharge':
        this.playSweep(200, 600, 0.4, 'sawtooth', 0.15);
        break;
      case 'mysteryExplode':
        this.playSweep(800, 100, 0.3, 'square', 0.3);
        setTimeout(() => this.playNotes([523, 659, 784, 1047, 1319], 0.08, 'triangle', 0.25), 100);
        break;
      case 'mysteryReveal':
        this.playNotes([784, 988, 1175, 1568], 0.12, 'sine', 0.3);
        break;
      case 'mysteryRevealRare':
        this.playNotes([523, 659, 784, 1047, 1319, 1568], 0.1, 'triangle', 0.32);
        break;
      case 'layerUp':
        this.playTone(660, 0.1, 'triangle', 0.25);
        break;
      default:
        break;
    }
  }

  reelStopSfx(idx: number = 0): void {
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    const freq = 500 + idx * 80;
    this.playTone(freq, 0.05, 'square', 0.35);
    this.playTone(freq * 0.5, 0.08, 'triangle', 0.12);
  }

  vibrate(pattern: number | number[]): void {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  destroy(): void {
    this.stopMusic();
    if (this.winTrackTimer) clearTimeout(this.winTrackTimer);
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
