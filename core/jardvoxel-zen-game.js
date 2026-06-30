// ═══════════════════════════════════════════════════════════
// JardVoxel Zen — Game Logic
// ZenGame class: Patagonia exploration, wellness systems, terrain
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';
import {
  SurvivalWorld, PlayerController, Inventory, DayNightCycle, GameAudio,
} from './jardvoxel-survival-gameplay.js';
import { generateChunkWithFeatures } from './jardvoxel-survival-features.js';
import {
  MC_BLOCKS, BLOCK, TREE_LOG_IDS,
  ALL_BLOCK_COLORS as MC_BLOCK_COLORS,
  ALL_BLOCK_NAMES as MC_BLOCK_NAMES,
  ALL_PLACEABLE_BLOCKS as MC_PLACEABLE_BLOCKS,
} from './blocks-registry.js';
import {
  BIOMES, BIOME_COLORS, WORLD_MIN_Y, SEA_LEVEL, CHUNK_SIZE, CHUNK_HEIGHT,
} from './jardvoxel-survival-engine.js';
import { SaveManager } from './jardvoxel-survival-save.js';
import { ParticleSystem } from './jardvoxel-survival-particles.js';
import { WeatherManager, WEATHER } from './jardvoxel-survival-weather.js';
import { ChillTuneEngine } from './jardvoxel-survival-chilltune.js';
import { PostprocessingManager, QUALITY } from './jardvoxel-survival-postprocessing.js';
import { ShadowManager, SHADOW_QUALITY } from './jardvoxel-survival-shadow.js';
import { VolumetricFog } from './jardvoxel-survival-fog.js';
import { WaterMaterialManager } from './jardvoxel-survival-water.js';
import { InteriorLightingManager } from './jardvoxel-survival-interior-lighting.js';
import { AmbientParticleSystem } from './jardvoxel-survival-ambient-particles.js';
import { ForestCanopyManager } from './jardvoxel-survival-forest-canopy.js';
import { CharacterGenerator, CharacterAnimator } from './jardvoxel-survival-character.js';
import { UIManager, getPixelFontCSS } from './jardvoxel-survival-ui.js';
import { AmbientSoundManager } from './jardvoxel-survival-ambient-sound.js';
import { BiomeIdentityManager } from './jardvoxel-survival-biome-identity.js';
import { KomorebiSystem } from './jardvoxel-survival-komorebi.js';
import { ResonanceSystem } from './jardvoxel-survival-resonance.js';
import { MeditationSpaceGenerator } from './jardvoxel-survival-meditation-spaces.js';
import { LivingWorldSystem } from './jardvoxel-survival-living-world.js';
import { ExplorationJournal, ENTRY_TYPES } from './jardvoxel-survival-journal.js';
import {
  PatagoniaProfile, PATAGONIA, PATAGONIA_BIOME_NAMES, PATAGONIA_AMBIENT_MAP,
  applyPatagoniaToGenerator,
} from './jardvoxel-patagonia.js';
import { TouchControls } from './jardvoxel-zen-touch.js';

const BIOME_NAMES = PATAGONIA_BIOME_NAMES;
const AMBIENT_BIOME_MAP = PATAGONIA_AMBIENT_MAP;

export class ZenGame {
  constructor() {
    this.patagonia = new PatagoniaProfile(PATAGONIA.SEED);
    this.seed = PATAGONIA.SEED;
    this.settings = {
      renderDistance: 8, fov: 75, clouds: true, fog: true, shadows: false,
      toneMapping: true, postprocessing: false, volume: 0.5, sfxVolume: 0.8,
      ambientVolume: 0.3, musicVolume: 0.35, musicEnabled: true,
      sensitivity: 2.0, invertY: false, touchJoysticks: 'auto',
      joystickSize: 120, autoSaveInterval: 60,
      showFPS: true, showCoords: true, showMinimap: true,
      showClock: true, showControlsHint: true,
      ambientSoundEnabled: true,
      komorebiEnabled: true, meditationEnabled: true, livingWorldEnabled: true,
      autoHideUI: true,
      // PRD Organic Terrain toggles
      voronoiBiomes: true, ridgedNoise: true, poissonVeg: true,
      hydrology: true, proceduralClimate: true, instancedRender: true,
      multiWorker: true, cellularNoise: true,
    };
    try {
      const saved = JSON.parse(localStorage.getItem('jardvoxel-zen-settings'));
      if (saved) Object.assign(this.settings, saved);
    } catch (e) {}
    this.settings.renderDistance = Math.min(this.settings.renderDistance, 32);

    this.discoveredBiomes = new Set();
    this.blockModifications = new Map();
    this.chunkModifications = new Map();
    this.saveManager = new SaveManager();
    this.saveLoaded = false;
    this.gameStarted = false;
    this.pointerLocked = false;
    this.inventoryOpen = false;
    this.journalOpen = false;
    this.uiHidden = false;
    this.uiHideTimer = 0;
    this.arrows = [];

    this.initScene();
    this.initWorld();
    this.initPlayer();
    this.initUI();
    this.setupInput();

    this.touchControls = new TouchControls(this);
    this.touchControls.autoDetect();

    this.lastTime = performance.now();
    this.fpsTime = performance.now();
    this.fpsFrames = 0;
    this.fps = 0;
    this.mouseLeftDown = false;
    this.currentDt = 0;
    this.autoSaveTimer = 0;

    this._initSave();
    this.animate();
  }

  async _initSave() {
    try {
      const idbOk = await this.saveManager.init();
      if (idbOk) {
        const worldData = await this.saveManager.loadWorld();
        if (worldData) {
          this._loadFromSaveData(worldData);
          this.saveLoaded = true;
          return;
        }
      }
    } catch (e) { console.warn('[Zen] IndexedDB load failed:', e); }
    this._loadFromLocalStorage();
  }

  _loadFromSaveData(data) {
    if (data.blockMods) this._applyChunkModifications(data.blockMods);
    if (data.resonance) this.resonanceSystem.deserialize(data.resonance);
    if (data.journal) this.journal.deserialize(data.journal);
    if (data.discoveredBiomes) this.discoveredBiomes = new Set(data.discoveredBiomes);
  }

  _loadFromLocalStorage() {
    try {
      const data = localStorage.getItem('jardvoxel-zen-save');
      if (data) {
        const parsed = JSON.parse(data);
        this._loadFromSaveData(parsed);
        this.saveLoaded = true;
      }
    } catch (e) { console.warn('[Zen] Save load failed:', e); }
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.settings.fov, window.innerWidth / window.innerHeight, 0.1, 4000);
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = this.settings.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = this.settings.toneMapping ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    document.body.appendChild(this.renderer.domElement);

    this.fogManager = new VolumetricFog(this.scene);
    this.fogManager.setEnabled(this.settings.fog);

    this.postprocessing = new PostprocessingManager(this.renderer, this.scene, this.camera);
    this.postprocessing.setEnabled(this.settings.postprocessing);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      if (this.postprocessing) this.postprocessing.resize(window.innerWidth, window.innerHeight);
      if (this.world && this.world.waterMaterialManager) this.world.waterMaterialManager.resize(window.innerWidth, window.innerHeight);
    });
  }

  initWorld() {
    this.world = new SurvivalWorld(this.scene, this.seed, this.settings.renderDistance, true, true);

    // ── Adaptive render distance ──
    this.world._adaptiveEnabled = true;
    this.world._targetRenderDist = this.settings.renderDistance;
    this.world._minRenderDist = 6;
    this.world._initialLoadBurst = 6;

    // ── Patch generator with Patagonia geographic profile ──
    applyPatagoniaToGenerator(this.world.generator, this.patagonia);

    this.dayNight = new DayNightCycle(this.scene);
    for (const cp of this.dayNight.cloudPlanes) cp.mesh.visible = this.settings.clouds;

    this.shadowManager = new ShadowManager(this.renderer, this.dayNight.sunLight, this.camera);
    this.shadowManager.setQuality(SHADOW_QUALITY.MEDIUM);
    this.shadowManager.setEnabled(this.settings.shadows);

    this.world.waterMaterialManager = new WaterMaterialManager(this.renderer, this.scene, this.camera);
    this.interiorLighting = new InteriorLightingManager(this.scene);
    this.ambientParticles = new AmbientParticleSystem(this.scene);
    this.forestCanopy = new ForestCanopyManager(this.scene);

    this.weatherManager = new WeatherManager(this.scene, this.dayNight, this.seed);
    this.weatherManager.setWeather('clear', { x: 0, y: 0, z: 0 }, this.world);
    this._applyTerrainSettings();

    this.world.onChunkUnload = (key, chunk) => {
      const mods = this.chunkModifications.get(key);
      if (mods && mods.length > 0 && this.saveManager && this.saveManager.hasSave()) {
        this.saveManager.saveChunk(key, mods);
      }
    };
    this.world.onChunkGenerated = (cx, cz) => {
      const key = this.world._chunkKey(cx, cz);
      if (this.chunkModifications.has(key)) {
        const mods = this.chunkModifications.get(key);
        for (const m of mods) {
          this.world.setBlock(cx * CHUNK_SIZE + m.lx, WORLD_MIN_Y + m.ly, cz * CHUNK_SIZE + m.lz, m.block);
        }
      } else if (this.saveManager && this.saveManager.hasSave()) {
        this.saveManager.loadChunk(key).then(saved => {
          if (saved && saved.modifications) {
            for (const m of saved.modifications) {
              this.world.setBlock(cx * CHUNK_SIZE + m.lx, WORLD_MIN_Y + m.ly, cz * CHUNK_SIZE + m.lz, m.block);
            }
            this.chunkModifications.set(key, saved.modifications);
          }
        }).catch(() => {});
      }
    };
  }

  initPlayer() {
    this.player = new PlayerController(this.camera, this.world);
    this.player.flying = true;

    // ── Override spawn to use Patagonia coordinates ────────
    const spawn = this.patagonia.getSpawnPoint();
    this.player.spawn = function() {
      const sx = spawn.x, sz = spawn.z;
      for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
        const block = this.world.getBlock(Math.floor(sx), WORLD_MIN_Y + y, Math.floor(sz));
        if (block !== BLOCK.AIR && block !== BLOCK.WATER) {
          this.position.set(sx + 0.5, WORLD_MIN_Y + y + 2, sz + 0.5);
          this.camera.position.copy(this.position);
          return;
        }
      }
      this.position.set(sx + 0.5, spawn.y, sz + 0.5);
      this.camera.position.copy(this.position);
    };
    this.player.spawn();

    this.inventory = new Inventory();
    this.inventory.creativeMode = true;

    this.audio = new GameAudio();
    this.audio.setVolume(this.settings.volume);

    this.chilltune = new ChillTuneEngine();
    this.chilltune.setVolume(this.settings.musicVolume);

    this.particles = new ParticleSystem(this.scene);

    this._lightSources = new Map();
    this._lightSourceTimer = 0;

    this.character = new CharacterGenerator();
    this.characterAnimator = new CharacterAnimator(this.character, this.player);
    if (this.character.group) this.scene.add(this.character.group);

    this.uiManager = new UIManager();
    this.biomeIdentityManager = new BiomeIdentityManager();

    this.ambientSoundManager = new AmbientSoundManager();

    this.komorebiSystem = new KomorebiSystem(this.scene);
    this.komorebiSystem.setChillTuneEngine(this.chilltune);
    this.komorebiSystem.setAmbientSoundManager(this.ambientSoundManager);

    this.resonanceSystem = new ResonanceSystem();

    this.meditationSpaceGenerator = new MeditationSpaceGenerator(this.scene);
    this.meditationSpaceGenerator.setChillTuneEngine(this.chilltune);
    this.meditationSpaceGenerator.onDiscover = (space) => {
      if (this.journal) {
        this.journal.addEntry(ENTRY_TYPES.MEDITATION_SPACE, `Espacio: ${space.type}`, `Descubriste un espacio de meditacion tipo ${space.type}.`);
        this.journal.incrementStat('meditationSpacesFound');
      }
      if (this.uiManager) this.uiManager.showToast(`Espacio de meditacion: ${space.type}`, 'wellness');
      if (this.chilltune && this.chilltune.playStinger) this.chilltune.playStinger('new_biome');
      this._showMeditationOverlay();
    };

    this.livingWorldSystem = new LivingWorldSystem(this.scene);

    this.journal = new ExplorationJournal();
    this.journal.setStat('highestResonance', 0);

    this._generateSpawnChunkAsync();
  }

  async _generateSpawnChunkAsync() {
    if (this.world._initWorker) {
      try { await this.world._initWorker(); } catch(e) {}
    }
    const sx = Math.floor(this.player.position.x / CHUNK_SIZE);
    const sz = Math.floor(this.player.position.z / CHUNK_SIZE);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        this.world.generateChunk(sx + dx, sz + dz);
      }
    }
    this.player.spawn();
    this.world.update(this.player.position.x, this.player.position.z, 60, this.camera);
  }

  initUI() {
    this.blockHighlight = new THREE.Mesh(
      new THREE.BoxGeometry(1.02, 1.02, 1.02),
      new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true, transparent: true, opacity: 0.3 })
    );
    this.blockHighlight.visible = false;
    this.scene.add(this.blockHighlight);

    this._buildHotbar();
    this._updateHotbar();
    this._initSettings();
    this._initJournalTabs();
    this._applySettings();

    const pauseScreen = document.getElementById('pause-screen');
    const resumeBtn = document.getElementById('resume-btn');
    const fullscreenBtn = document.getElementById('pause-fullscreen-btn');
    const journalBtn = document.getElementById('journal-btn');
    const optionsBtn = document.getElementById('pause-options-btn');
    const menuBtn = document.getElementById('pause-menu-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const settingsBack = document.getElementById('settings-back');
    const invCloseBtn = document.getElementById('inv-close-btn');
    const journalClose = document.getElementById('journal-close');

    resumeBtn.onclick = () => this._resume();
    fullscreenBtn.onclick = () => this._toggleFullscreen();
    journalBtn.onclick = () => {
      pauseScreen.style.display = 'none';
      document.getElementById('journal-panel').classList.add('show');
      this.journalOpen = true;
      this._renderJournal();
    };
    optionsBtn.onclick = () => {
      pauseScreen.style.display = 'none';
      settingsMenu.classList.add('show');
    };
    menuBtn.onclick = () => {
      if (!confirm('¿Eliminar el mundo y volver al menú?')) return;
      this._dispose();
      try { localStorage.removeItem('jardvoxel-zen-save'); } catch(e) {}
      if (this.saveManager) this.saveManager.clearAll();
      location.reload();
    };
    settingsBack.onclick = () => {
      settingsMenu.classList.remove('show');
      pauseScreen.style.display = 'flex';
    };
    invCloseBtn.onclick = () => {
      this.inventoryOpen = false;
      document.getElementById('inventory-panel').classList.remove('show');
      if (!(this.touchControls && this.touchControls.enabled)) document.body.requestPointerLock();
    };
    journalClose.onclick = () => {
      document.getElementById('journal-panel').classList.remove('show');
      this.journalOpen = false;
      pauseScreen.style.display = 'flex';
    };

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === document.body;
      if (this.pointerLocked && !this.gameStarted) {
        this._initAudio();
        this.gameStarted = true;
        pauseScreen.style.display = 'none';
        if (this.chilltune) this.chilltune.start();
      }
      if (!this.pointerLocked && this.gameStarted && !this.inventoryOpen && !this.journalOpen) {
        pauseScreen.style.display = 'flex';
      }
    });

    document.body.addEventListener('click', () => {
      if (!this.gameStarted && !this.inventoryOpen && !this.journalOpen) {
        if (!(this.touchControls && this.touchControls.enabled)) {
          document.body.requestPointerLock();
        } else {
          this._initAudio();
          this.gameStarted = true;
          pauseScreen.style.display = 'none';
          if (this.chilltune) this.chilltune.start();
        }
      }
    });

    window.addEventListener('beforeunload', () => this._saveNow());
    window.addEventListener('pagehide', () => this._saveNow());

    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this._paused = true;
      if (this._animId) cancelAnimationFrame(this._animId);
      const overlay = document.getElementById('loading-overlay');
      if (overlay) { overlay.textContent = 'Reconectando...'; overlay.classList.add('show'); }
    }, false);

    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      this._paused = false;
      this.lastTime = performance.now();
      const overlay = document.getElementById('loading-overlay');
      if (overlay) overlay.classList.remove('show');
      this.animate();
    }, false);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this._paused = true;
        if (this.chilltune) this.chilltune.stop();
        this._saveNow();
      } else {
        this._paused = false;
        this.lastTime = performance.now();
        if (this.chilltune && this.gameStarted && this.settings.musicEnabled) this.chilltune.start();
      }
    });

    document.getElementById('pause-seed').textContent = this.seed;
  }

  _initAudio() {
    if (!this.audio.ctx) {
      this.audio.init();
    }
    if (this.audio.ctx && this.chilltune && !this.chilltune.ctx) {
      this.chilltune.init(this.audio.ctx, this.audio.masterGain);
    }
  }

  _resume() {
    document.getElementById('pause-screen').style.display = 'none';
    if (!(this.touchControls && this.touchControls.enabled)) {
      document.body.requestPointerLock();
    }
  }

  _toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  _initSettings() {
    const wireSlider = (id, key, fmt, cb) => {
      const el = document.getElementById(id);
      const val = document.getElementById(id + '-val');
      if (!el) return;
      el.value = this.settings[key];
      if (val) val.textContent = fmt ? fmt(this.settings[key]) : this.settings[key];
      el.addEventListener('input', () => {
        this.settings[key] = parseFloat(el.value);
        if (val) val.textContent = fmt ? fmt(this.settings[key]) : this.settings[key];
        this._applySettings(); this._saveSettings();
        if (cb) cb(this.settings[key]);
      });
    };
    const wireToggle = (id, key, cb) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.toggle('on', this.settings[key]);
      el.addEventListener('click', () => {
        this.settings[key] = !this.settings[key];
        el.classList.toggle('on', this.settings[key]);
        this._applySettings(); this._saveSettings();
        if (cb) cb(this.settings[key]);
      });
    };
    const wireSelect = (id, key, cb) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = String(this.settings[key]);
      el.addEventListener('change', () => {
        this.settings[key] = isNaN(parseFloat(el.value)) ? el.value : parseFloat(el.value);
        this._applySettings(); this._saveSettings();
        if (cb) cb(this.settings[key]);
      });
    };

    wireSlider('setting-render-dist', 'renderDistance', v => v + '', (v) => { const clamped = Math.min(v, 32); if (this.world) { this.world.renderDistance = clamped; this.world._targetRenderDist = clamped; } });
    wireSlider('setting-fov', 'fov', v => v + '', (v) => { this.camera.fov = v; this.camera.updateProjectionMatrix(); });
    wireSlider('setting-volume', 'volume', v => Math.round(v * 100) + '%', (v) => { if (this.audio) this.audio.setVolume(v); });
    wireSlider('setting-sfx-volume', 'sfxVolume', v => Math.round(v * 100) + '%', (v) => { if (this.audio) this.audio.sfxVolume = v; });
    wireSlider('setting-ambient-volume', 'ambientVolume', v => Math.round(v * 100) + '%', (v) => {
      if (this.ambientSoundManager) { this.ambientSoundManager.setVolume(v); this.ambientSoundManager.setEnabled(this.settings.ambientSoundEnabled); }
    });
    wireSlider('setting-music-volume', 'musicVolume', v => Math.round(v * 100) + '%', (v) => { if (this.chilltune) this.chilltune.setVolume(v); });
    wireSlider('setting-sensitivity', 'sensitivity', v => v.toFixed(1));
    wireSlider('setting-joystick-size', 'joystickSize', v => v + 'px');

    wireToggle('setting-clouds', 'clouds', (v) => {
      if (this.dayNight && this.dayNight.cloudPlanes) for (const cp of this.dayNight.cloudPlanes) cp.mesh.visible = v;
    });
    wireToggle('setting-fog', 'fog', (v) => { if (this.fogManager) this.fogManager.setEnabled(v); });
    wireToggle('setting-shadows', 'shadows', (v) => {
      this.renderer.shadowMap.enabled = v;
      if (this.shadowManager) this.shadowManager.setEnabled(v);
    });
    wireToggle('setting-tone-mapping', 'toneMapping', (v) => {
      this.renderer.toneMapping = v ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
    });
    wireToggle('setting-postprocessing', 'postprocessing', (v) => { if (this.postprocessing) this.postprocessing.setEnabled(v); });
    wireToggle('setting-music-enabled', 'musicEnabled', (v) => { if (v) { this._initAudio(); this.chilltune.start(); } else this.chilltune.stop(); });
    wireToggle('setting-ambient-sound', 'ambientSoundEnabled', (v) => {
      if (this.ambientSoundManager) { this.ambientSoundManager.setEnabled(v); }
    });
    wireToggle('setting-invert-y', 'invertY');
    wireToggle('setting-komorebi', 'komorebiEnabled');
    wireToggle('setting-meditation', 'meditationEnabled');
    wireToggle('setting-living-world', 'livingWorldEnabled');
    wireToggle('setting-auto-hide-ui', 'autoHideUI');
    wireToggle('setting-show-fps', 'showFPS', (v) => { document.getElementById('fps').parentElement.style.display = v ? 'inline' : 'none'; });
    wireToggle('setting-show-coords', 'showCoords', (v) => { document.getElementById('coords').parentElement.style.display = v ? 'inline' : 'none'; });
    wireToggle('setting-show-minimap', 'showMinimap', (v) => { document.getElementById('minimap').style.display = v ? 'block' : 'none'; });
    wireToggle('setting-show-clock', 'showClock', (v) => { document.getElementById('clock').style.display = v ? 'block' : 'none'; });
    wireToggle('setting-show-controls-hint', 'showControlsHint', (v) => { document.getElementById('controls-hint').style.display = v ? 'block' : 'none'; });

    // ── PRD Organic Terrain toggles ──
    wireToggle('setting-voronoi-biomes', 'voronoiBiomes', (v) => {
      if (this.world && this.world.generator) this.world.generator._useVoronoiBiomes = v;
    });
    wireToggle('setting-ridged-noise', 'ridgedNoise', (v) => {
      if (this.world && this.world.generator && this.world.generator.hierarchy) {
        this.world.generator.hierarchy._useRidgedNoise = v;
      }
    });
    wireToggle('setting-poisson-veg', 'poissonVeg', (v) => {
      if (this.world) this.world._poissonEnabled = v;
    });
    wireToggle('setting-hydrology', 'hydrology', (v) => {
      if (this.world && this.world.generator && this.world.generator.hierarchy && this.world.generator.hierarchy.hydrology) {
        this.world.generator.hierarchy.hydrology.enabled = v;
      }
    });
    wireToggle('setting-procedural-climate', 'proceduralClimate', (v) => {
      if (this.weatherManager) this.weatherManager._useProceduralClimate = v;
    });
    wireToggle('setting-instanced-render', 'instancedRender', (v) => {
      if (this.world && this.world._instancedRenderer) this.world._instancedRenderer.setEnabled(v);
    });
    wireToggle('setting-multi-worker', 'multiWorker', (v) => {
      if (this.world) this.world._useWorkerPool = v && !!this.world._workerPool;
    });
    wireToggle('setting-cellular-noise', 'cellularNoise', (v) => {
      if (this.world && this.world.generator) this.world.generator._useCellularNoise = v;
    });

    const regenBtn = document.getElementById('terrain-regen-btn');
    if (regenBtn) regenBtn.onclick = () => this._regenerateTerrain();

    wireSelect('setting-touch-joysticks', 'touchJoysticks', (v) => {
      if (!this.touchControls) return;
      if (v === 'on') { this.touchControls.enable(); }
      else if (v === 'off') { this.touchControls.disable(); }
      else { this.touchControls.autoDetect(); }
    });
    wireSelect('setting-autosave', 'autoSaveInterval');

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('show'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('show');
      };
    });
  }

  _applySettings() {
    if (this.world) { this.world.renderDistance = this.settings.renderDistance; this.world._targetRenderDist = this.settings.renderDistance; }
    if (this.camera) { this.camera.fov = this.settings.fov; this.camera.updateProjectionMatrix(); }
    if (this.scene) { if (this.fogManager) { this.fogManager.setEnabled(this.settings.fog); this.fogManager.setRenderDistance(this.settings.renderDistance); } }
    if (this.renderer) {
      this.renderer.shadowMap.enabled = this.settings.shadows;
      this.renderer.toneMapping = this.settings.toneMapping ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
    }
    if (this.shadowManager) this.shadowManager.setEnabled(this.settings.shadows);
    if (this.postprocessing) this.postprocessing.setEnabled(this.settings.postprocessing);
    if (this.audio) { this.audio.setVolume(this.settings.volume); this.audio.sfxVolume = this.settings.sfxVolume; }
    if (this.chilltune) this.chilltune.setVolume(this.settings.musicVolume);
    if (this.ambientSoundManager) { this.ambientSoundManager.setVolume(this.settings.ambientVolume); this.ambientSoundManager.setEnabled(this.settings.ambientSoundEnabled); }
    if (this.touchControls) this.touchControls.lookSensitivity = this.settings.sensitivity;
    document.documentElement.style.setProperty('--joystick-size', this.settings.joystickSize + 'px');
    const fpsEl = document.getElementById('fps');
    if (fpsEl) fpsEl.parentElement.style.display = this.settings.showFPS ? 'inline' : 'none';
    const coordsEl = document.getElementById('coords');
    if (coordsEl) coordsEl.parentElement.style.display = this.settings.showCoords ? 'inline' : 'none';
    const minimapEl = document.getElementById('minimap');
    if (minimapEl) minimapEl.style.display = this.settings.showMinimap ? 'block' : 'none';
    const clockEl = document.getElementById('clock');
    if (clockEl) clockEl.style.display = this.settings.showClock ? 'block' : 'none';
    const controlsHintEl = document.getElementById('controls-hint');
    if (controlsHintEl) controlsHintEl.style.display = this.settings.showControlsHint ? 'block' : 'none';
  }

  _applyTerrainSettings() {
    if (!this.world || !this.world.generator) return;
    const gen = this.world.generator;
    gen._useVoronoiBiomes = this.settings.voronoiBiomes;
    gen._useCellularNoise = this.settings.cellularNoise;
    if (gen.hierarchy) {
      gen.hierarchy._useRidgedNoise = this.settings.ridgedNoise;
      gen.hierarchy._useCellularNoise = this.settings.cellularNoise;
      if (gen.hierarchy.hydrology) gen.hierarchy.hydrology.enabled = this.settings.hydrology;
    }
    this.world._poissonEnabled = this.settings.poissonVeg;
    if (this.world._instancedRenderer) this.world._instancedRenderer.setEnabled(this.settings.instancedRender);
    if (this.weatherManager) this.weatherManager._useProceduralClimate = this.settings.proceduralClimate;
    if (this.world._workerPool) this.world._useWorkerPool = this.settings.multiWorker;
    else this.world._useWorkerPool = false;
    // Broadcast terrain settings to worker pool so workers stay in sync
    this.world.broadcastTerrainSettings({
      voronoiBiomes: this.settings.voronoiBiomes,
      cellularNoise: this.settings.cellularNoise,
      ridgedNoise: this.settings.ridgedNoise,
      hydrology: this.settings.hydrology,
    });
  }

  _regenerateTerrain() {
    if (!this.world) return;
    this._applyTerrainSettings();
    const px = this.player.position.x;
    const pz = this.player.position.z;
    this.world.clearAllChunks();
    if (this.world.generator) this.world.generator.clearCache();
    const sx = Math.floor(px / CHUNK_SIZE);
    const sz = Math.floor(pz / CHUNK_SIZE);
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        this.world.generateChunk(sx + dx, sz + dz);
      }
    }
    this._applyChunkModifications(Array.from(this.blockModifications.entries()));
    this.world.update(px, pz, 60, this.camera);
    if (this.uiManager) this.uiManager.showToast('Terreno regenerado', 'info');
  }

  _saveSettings() {
    try { localStorage.setItem('jardvoxel-zen-settings', JSON.stringify(this.settings)); } catch (e) {}
  }

  _initSave() { /* replaced by async _initSave above */ }

  _getSaveData() {
    return {
      seed: this.seed,
      blockMods: Array.from(this.blockModifications.entries()),
      resonance: this.resonanceSystem.serialize(),
      journal: this.journal.serialize(),
      discoveredBiomes: Array.from(this.discoveredBiomes),
    };
  }

  async _saveNow() {
    const data = this._getSaveData();
    try {
      if (this.saveManager && this.saveManager.hasSave()) {
        await this.saveManager.saveWorld(data);
      }
      localStorage.setItem('jardvoxel-zen-save', JSON.stringify(data));
    } catch (e) { console.warn('[Zen] Save failed:', e); }
  }

  _applyChunkModifications(mods) {
    for (const [key, blockId] of mods) {
      const parts = key.split(',');
      const x = parseInt(parts[0]), y = parseInt(parts[1]), z = parseInt(parts[2]);
      if (isNaN(x) || isNaN(y) || isNaN(z)) {
        const oldX = Math.floor(key / 1048576) - 512;
        const oldY = Math.floor(key / 1024) % 1024 - 128;
        const oldZ = key % 1024 - 512;
        this.world.setBlock(oldX, oldY, oldZ, blockId);
        this.blockModifications.set(`${oldX},${oldY},${oldZ}`, blockId);
        continue;
      }
      this.world.setBlock(x, y, z, blockId);
      this.blockModifications.set(key, blockId);
    }
  }

  _trackBlockMod(x, y, z, blockId) {
    const key = `${x},${y},${z}`;
    this.blockModifications.set(key, blockId);
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const chunkKey = this.world._chunkKey(cx, cz);
    if (!this.chunkModifications.has(chunkKey)) {
      this.chunkModifications.set(chunkKey, []);
    }
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = y - WORLD_MIN_Y;
    this.chunkModifications.get(chunkKey).push({ lx, ly, lz, block: blockId });
  }

  setupInput() {
    this.keys = {};

    document.addEventListener('keydown', (e) => {
      this.keys[e.code.toLowerCase().replace('key', '')] = true;
      this.keys[e.code] = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.shift = true;
      if (e.code === 'Space') this.keys.space = true;
      if (this.chilltune) this.chilltune.trackInput();
      if (this.resonanceSystem) this.resonanceSystem.track('exploration', 0.1);
      this._revealUI();

      if (!this.gameStarted) return;

      if (e.code >= 'Digit1' && e.code <= 'Digit9') {
        const slot = parseInt(e.code.replace('Digit', '')) - 1;
        this.inventory.setSelected(slot);
        this._updateHotbar();
      }
      if (e.code === 'KeyF') { this.player.flying = !this.player.flying; this.player.velocity.set(0, 0, 0); }
      if (e.code === 'KeyJ') { this._toggleJournal(); }
      if (e.code === 'KeyV') { this.player.toggleView(); }
      if (e.code === 'KeyE') { this._toggleInventory(); }
      if (e.code === 'Escape') {
        if (this.inventoryOpen) { this._toggleInventory(); return; }
        if (this.journalOpen) { this._toggleJournal(); return; }
        if (this.gameStarted) {
          if (this.pointerLocked) document.exitPointerLock();
          else this._resume();
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code.toLowerCase().replace('key', '')] = false;
      this.keys[e.code] = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.shift = false;
      if (e.code === 'Space') this.keys.space = false;
    });

    document.addEventListener('mousedown', (e) => {
      if (!this.pointerLocked && !(this.touchControls && this.touchControls.enabled)) return;
      this._revealUI();
      if (this.chilltune) this.chilltune.trackInput();
      if (this.resonanceSystem) this.resonanceSystem.track('exploration', 0.1);
      if (e.button === 0) { this.mouseLeftDown = true; this._breakBlock(); }
      else if (e.button === 2) { this._placeBlock(); }
    });

    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseLeftDown = false;
    });

    document.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('mousemove', (e) => {
      if (!this.pointerLocked) return;
      this._revealUI();
      const sens = this.settings ? this.settings.sensitivity * 0.001 : 0.002;
      this.player.yaw -= e.movementX * sens;
      const invertY = this.settings && this.settings.invertY ? 1 : -1;
      this.player.pitch += e.movementY * sens * invertY;
      this.player.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.player.pitch));
    });
  }

  _toggleInventory() {
    this.inventoryOpen = !this.inventoryOpen;
    const panel = document.getElementById('inventory-panel');
    if (this.inventoryOpen) {
      panel.classList.add('show');
      this._buildInventoryGrid();
      if (this.pointerLocked) document.exitPointerLock();
    } else {
      panel.classList.remove('show');
      if (!(this.touchControls && this.touchControls.enabled)) document.body.requestPointerLock();
    }
  }

  _toggleJournal() {
    this.journalOpen = !this.journalOpen;
    const panel = document.getElementById('journal-panel');
    if (this.journalOpen) {
      panel.classList.add('show');
      this._renderJournal();
      if (this.pointerLocked) document.exitPointerLock();
    } else {
      panel.classList.remove('show');
      if (!(this.touchControls && this.touchControls.enabled)) document.body.requestPointerLock();
    }
  }

  _breakBlock() {
    const target = this._cachedRaycast && (performance.now() - (this._cachedRaycastTime || 0) < 200) ? this._cachedRaycast : this.player.raycast(5);
    if (!target) return;
    this.world.setBlock(target.x, target.y, target.z, BLOCK.AIR);
    this._trackBlockMod(target.x, target.y, target.z, BLOCK.AIR);
    this._trackLightSource(target.x, target.y, target.z, BLOCK.AIR);
    this.particles.spawnBlockBreak(target.x, target.y, target.z, target.block);
    this.audio.playBreak(target.block);
    if (this.chilltune) this.chilltune.trackBlockBreak();
    if (this.resonanceSystem) this.resonanceSystem.track('mining');
    if (this.journal) this.journal.incrementStat('blocksBroken');
  }

  _placeBlock() {
    const target = this._cachedRaycast && (performance.now() - (this._cachedRaycastTime || 0) < 200) ? this._cachedRaycast : this.player.raycast(5);
    if (!target) return;
    const item = this.inventory.getSelected();
    if (!item) return;
    const px = target.x + target.face.dx;
    const py = target.y + target.face.dy;
    const pz = target.z + target.face.dz;
    const playerX = Math.floor(this.player.position.x);
    const playerY = Math.floor(this.player.position.y);
    const playerZ = Math.floor(this.player.position.z);
    if (px === playerX && (py === playerY || py === playerY - 1) && pz === playerZ) return;
    const existingBlock = this.world.getBlock(px, py, pz);
    if (existingBlock !== BLOCK.AIR && existingBlock !== BLOCK.WATER) return;
    this.world.setBlock(px, py, pz, item.block);
    this._trackBlockMod(px, py, pz, item.block);
    this._trackLightSource(px, py, pz, item.block);
    this.particles.spawnBlockPlace(px, py, pz, item.block);
    this.audio.playPlace();
    if (this.chilltune) this.chilltune.trackBlockPlace();
    if (this.resonanceSystem) this.resonanceSystem.track('building');
    if (this.livingWorldSystem && this.settings.livingWorldEnabled) this.livingWorldSystem.trackBlockPlace(px, py, pz, item.block);
    if (this.journal) {
      this.journal.incrementStat('blocksPlaced');
      if (this.journal.getStats().blocksPlaced === 1) {
        this.journal.addEntry(ENTRY_TYPES.FIRST_BLOCK, 'Primer bloque', 'Colocaste tu primer bloque en el mundo.');
      }
      if (TREE_LOG_IDS.includes(item.block)) {
        this.journal.addEntry(ENTRY_TYPES.TREE_PLANTED, 'Arbol plantado', `Plantaste un arbol en (${px}, ${py}, ${pz}).`);
      }
    }
  }

  _buildHotbar() {
    const hotbar = document.getElementById('hotbar');
    hotbar.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const slot = document.createElement('div');
      slot.className = 'hotbar-slot' + (i === this.inventory.selectedSlot ? ' active' : '');
      slot.dataset.slot = i;
      const num = document.createElement('span');
      num.className = 'slot-num'; num.textContent = (i + 1).toString();
      slot.appendChild(num);
      const item = this.inventory.hotbar[i];
      if (item) {
        const colorDiv = document.createElement('div');
        colorDiv.className = 'slot-block';
        const c = MC_BLOCK_COLORS[item.block] || [0.5, 0.5, 0.5];
        colorDiv.style.background = `rgb(${Math.floor(c[0]*255)},${Math.floor(c[1]*255)},${Math.floor(c[2]*255)})`;
        slot.appendChild(colorDiv);
        const name = document.createElement('span');
        name.className = 'slot-name'; name.textContent = MC_BLOCK_NAMES[item.block] || '?';
        slot.appendChild(name);
      }
      slot.addEventListener('click', (e) => { e.stopPropagation(); this.inventory.setSelected(i); this._updateHotbar(); });
      hotbar.appendChild(slot);
    }
  }

  _updateHotbar() {
    const slots = document.querySelectorAll('.hotbar-slot');
    slots.forEach((s, i) => s.classList.toggle('active', i === this.inventory.selectedSlot));
    const item = this.inventory.getSelected();
    document.getElementById('selected-block').textContent = item ? (MC_BLOCK_NAMES[item.block] || '?') : '--';
  }

  _buildInventoryGrid() {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';
    MC_PLACEABLE_BLOCKS.forEach((blockId) => {
      const item = document.createElement('div');
      item.className = 'inv-item';
      const colorDiv = document.createElement('div');
      colorDiv.className = 'inv-item-color';
      const c = MC_BLOCK_COLORS[blockId] || [0.5, 0.5, 0.5];
      colorDiv.style.background = `rgb(${Math.floor(c[0]*255)},${Math.floor(c[1]*255)},${Math.floor(c[2]*255)})`;
      item.appendChild(colorDiv);
      const name = document.createElement('span');
      name.className = 'inv-item-name'; name.textContent = MC_BLOCK_NAMES[blockId] || '?';
      item.appendChild(name);
      item.addEventListener('click', () => {
        this.inventory.addToHotbar(this.inventory.selectedSlot, blockId);
        this._buildHotbar(); this._updateHotbar();
      });
      item.addEventListener('touchstart', (e) => { e.preventDefault(); this.inventory.addToHotbar(this.inventory.selectedSlot, blockId); this._buildHotbar(); this._updateHotbar(); }, { passive: false });
      grid.appendChild(item);
    });
  }

  _cacheHUD() {
    this._hudEls = {
      fps: document.getElementById('fps'),
      coords: document.getElementById('coords'),
      biome: document.getElementById('biome'),
      chunks: document.getElementById('chunks'),
      lookingAt: document.getElementById('looking-at'),
      clock: document.getElementById('clock'),
      weather: document.getElementById('weather-indicator'),
    };
  }
  updateHUD() {
    if (!this._hudEls) this._cacheHUD();
    const h = this._hudEls;
    if (h.fps) h.fps.textContent = this.fps;
    const p = this.player.position;
    if (h.coords) h.coords.textContent = `${Math.floor(p.x)}, ${Math.floor(p.y)}, ${Math.floor(p.z)}`;
    if (h.biome) {
      const biome = this._frame ? this._frame.biome : this.world.generator.getBiome(Math.floor(p.x), Math.floor(p.z));
      h.biome.textContent = BIOME_NAMES[biome] || biome;
    }
    if (h.chunks) h.chunks.textContent = this.world.getLoadedChunkCount();
    if (h.lookingAt) {
      const target = this._cachedRaycast;
      h.lookingAt.textContent = target ? (MC_BLOCK_NAMES[target.block] || `ID:${target.block}`) : '--';
    }
    if (h.clock) h.clock.textContent = this.dayNight.getTimeString();
    if (h.weather && this.weatherManager) {
      const w = this.weatherManager.getCurrentWeather();
      const labels = { clear: '', rain: 'Lluvia', snow: 'Nieve', thunder: 'Tormenta' };
      const label = labels[w] || '';
      h.weather.textContent = label;
      h.weather.style.display = label ? 'block' : 'none';
    }
  }

  _revealUI() {
    if (!this.settings.autoHideUI) return;
    this.uiHidden = false;
    this.uiHideTimer = 0;
    const hud = document.getElementById('hud');
    if (hud) hud.classList.remove('hidden');
    const touch = document.getElementById('touch-controls');
    if (touch) touch.classList.remove('hidden');
    const minimap = document.getElementById('minimap');
    if (minimap) minimap.style.display = '';
    const clock = document.getElementById('clock');
    if (clock) clock.style.display = '';
    const biome = document.getElementById('biome-indicator');
    if (biome) biome.style.display = '';
  }

  _checkUIHide(dt) {
    if (!this.settings.autoHideUI) return;
    if (this.uiHidden) return;
    const moving = this.keys && (this.keys.w || this.keys.a || this.keys.s || this.keys.d || this.keys.space || this.keys.shift);
    if (!moving && !this.mouseLeftDown && this.pointerLocked) {
      this.uiHideTimer += dt;
      if (this.uiHideTimer > 10) {
        this.uiHidden = true;
        const hud = document.getElementById('hud');
        if (hud) hud.classList.add('hidden');
        const touch = document.getElementById('touch-controls');
        if (touch) touch.classList.add('hidden');
        const minimap = document.getElementById('minimap');
        if (minimap) minimap.style.display = 'none';
        const clock = document.getElementById('clock');
        if (clock) clock.style.display = 'none';
        const biome = document.getElementById('biome-indicator');
        if (biome) biome.style.display = 'none';
      }
    } else {
      this._revealUI();
    }
  }

  _showMeditationOverlay() {
    const overlay = document.getElementById('meditation-overlay');
    overlay.classList.add('show');
    setTimeout(() => overlay.classList.remove('show'), 5000);
  }

  _renderToasts() {
    if (!this.uiManager) return;
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toasts = this.uiManager.getActiveToasts();
    const currentIds = toasts.map(t => t.id).join(',');
    if (currentIds === this._lastToastIds) return;
    this._lastToastIds = currentIds;
    container.innerHTML = '';
    for (const t of toasts) {
      const el = document.createElement('div');
      el.className = `toast ${t.type || 'info'} show`;
      el.textContent = t.message;
      container.appendChild(el);
    }
  }

  _renderBiomeIndicator() {
    if (!this.uiManager) return;
    const el = document.getElementById('biome-indicator');
    if (!el) return;
    const result = this.uiManager.updateBiomeIndicator(this.currentDt || 0.016);
    if (result.visible) { el.textContent = result.biome || ''; el.classList.add('show'); }
    else el.classList.remove('show');
  }

  _addJournalEntry(type, title, text) {
    if (this.journal) this.journal.addEntry(type, title, text);
    if (this.uiManager) this.uiManager.showToast(title, type === 'biome' ? 'discovery' : 'wellness');
  }

  _dispose() {
    if (this._disposed) return;
    this._disposed = true;
    if (this._animId) cancelAnimationFrame(this._animId);
    if (this.chilltune) { try { this.chilltune.destroy(); } catch(e) {} }
    if (this.audio) { try { this.audio.dispose(); } catch(e) {} }
    if (this.world) { try { this.world.dispose(); } catch(e) {} }
    if (this.dayNight) { try { this.dayNight.dispose(); } catch(e) {} }
    if (this.player && this.player.body) {
      this.player.body.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) { if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose()); else obj.material.dispose(); }
      });
      if (this.scene) this.scene.remove(this.player.body);
    }
    if (this.forestCanopy) { try { this.forestCanopy.dispose(); } catch(e) {} }
    if (this.character) { try { this.character.dispose(); } catch(e) {} }
    if (this.saveManager) { try { this.saveManager.stopAutoSave(); } catch(e) {} }
    if (this.renderer) { try { this.renderer.dispose(); } catch(e) {} }
    this.blockModifications.clear();
    this.chunkModifications.clear();
    this._lightSources.clear();
  }

  _renderJournal() {
    const content = document.getElementById('journal-content');
    if (!content) return;
    const filter = this._journalFilter || 'wellness';

    if (filter === 'stats') {
      if (this.journal) {
        const stats = this.journal.getStats();
        content.innerHTML = '<div class="journal-stats">' +
          this._renderStatRow('Bloques colocados', stats.blocksPlaced) +
          this._renderStatRow('Bloques rotos', stats.blocksBroken) +
          this._renderStatRow('Distancia recorrida', Math.floor(stats.distanceTraveled) + ' m') +
          this._renderStatRow('Biomas descubiertos', stats.biomesDiscovered) +
          this._renderStatRow('Espacios de meditacion', stats.meditationSpacesFound) +
          this._renderStatRow('Arboles plantados', stats.treesPlanted) +
          this._renderStatRow('Tiempo jugado', this.journal.getFormattedPlayTime()) +
          this._renderStatRow('Resonancia maxima', stats.highestResonance) +
          '</div>';
      } else content.innerHTML = '<div class="journal-empty">Stats no disponibles.</div>';
      return;
    }

    if (filter === 'milestones') {
      if (this.journal) {
        const firstBlock = this.journal.getEntriesByType('first_block', 1);
        const firstMeditation = this.journal.getEntriesByType('meditation_space', 1);
        const firstTree = this.journal.getEntriesByType('tree_planted', 1);
        const firstSunrise = this.journal.getEntriesByType('sunrise', 1);
        const firstSunset = this.journal.getEntriesByType('sunset', 1);
        const firstResonance = this.journal.getEntriesByType('resonance_level', 1);
        const firstKomorebi = this.journal.getEntriesByType('komorebi_moment', 1);
        const firstLivingWorld = this.journal.getEntriesByType('living_world', 1);
        const milestoneDefs = [
          { icon: '🧱', text: 'Primer bloque colocado', entry: firstBlock[0] },
          { icon: '🧘', text: 'Primer espacio de meditacion', entry: firstMeditation[0] },
          { icon: '🌱', text: 'Primer arbol plantado', entry: firstTree[0] },
          { icon: '🌅', text: 'Primer amanecer observado', entry: firstSunrise[0] },
          { icon: '🌇', text: 'Primer atardecer observado', entry: firstSunset[0] },
          { icon: '🎵', text: 'Primer nivel de resonancia', entry: firstResonance[0] },
          { icon: '🍃', text: 'Primer momento komorebi', entry: firstKomorebi[0] },
          { icon: '🦋', text: 'Primera reaccion del mundo vivo', entry: firstLivingWorld[0] },
        ];
        content.innerHTML = '';
        for (const m of milestoneDefs) {
          const el = document.createElement('div');
          el.className = 'journal-milestone' + (m.entry ? '' : ' locked');
          const dateStr = m.entry ? new Date(m.entry.timestamp).toLocaleDateString() : '—';
          el.innerHTML = `<span class="milestone-icon">${m.icon}</span><span class="milestone-text">${m.text}</span><span class="milestone-date">${dateStr}</span>`;
          content.appendChild(el);
        }
      } else content.innerHTML = '<div class="journal-empty">Hitos no disponibles.</div>';
      return;
    }

    if (filter === 'wellness') {
      if (this.journal) {
        const entries = this.journal.getEntries(50);
        if (entries.length === 0) {
          content.innerHTML = '<div class="journal-empty">No hay entradas wellness aun. Explora, medita, planta arboles.</div>';
          return;
        }
        content.innerHTML = '';
        for (const entry of entries) {
          const el = document.createElement('div');
          el.className = 'journal-entry';
          const date = new Date(entry.timestamp).toLocaleString();
          el.innerHTML = `<div class="entry-title"><span class="entry-type ${entry.type}">${entry.type}</span>${entry.title}</div><div class="entry-text">${entry.description} <span style="color:#555;font-size:0.65rem">${date}</span></div>`;
          content.appendChild(el);
        }
      } else content.innerHTML = '<div class="journal-empty">Diario wellness no disponible.</div>';
      return;
    }
  }

  _renderStatRow(label, value) {
    return `<div class="journal-stat-row"><span class="stat-label">${label}</span><span class="stat-value">${value}</span></div>`;
  }

  _journalFilter = 'wellness';

  _initJournalTabs() {
    const tabs = document.querySelectorAll('.journal-tab');
    tabs.forEach(tab => {
      tab.onclick = () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._journalFilter = tab.dataset.jtab;
        this._renderJournal();
      };
    });
  }

  _updatePointLights(dt) {
    if (!this._pointLights) {
      this._pointLights = [];
      for (let i = 0; i < 4; i++) {
        const light = new THREE.PointLight(0xffaa44, 0, 8, 2);
        this.scene.add(light);
        this._pointLights.push({ light, active: false });
      }
    }
    this._lightSourceTimer += dt;
    if (this._lightSourceTimer < 1.0) return;
    this._lightSourceTimer = 0;
    const px = this.player.position.x, py = this.player.position.y, pz = this.player.position.z;
    const range = 16;
    const torchId = 25, lanternId = 26, lavaId = 6;
    const found = [];
    for (const [key, src] of this._lightSources) {
      const dx = src.x - px, dy = src.y - py, dz = src.z - pz;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (dist <= range) found.push({ x: src.x, y: src.y, z: src.z, dist, block: src.block });
    }
    found.sort((a, b) => a.dist - b.dist);
    for (let i = 0; i < this._pointLights.length; i++) {
      const pl = this._pointLights[i];
      if (i < found.length) {
        pl.light.position.set(found[i].x, found[i].y, found[i].z);
        const isLava = found[i].block === lavaId;
        pl.light.color.setHex(isLava ? 0xff4400 : 0xffaa44);
        pl.light.intensity = isLava ? 1.5 : 1.0;
      } else pl.light.intensity = 0;
    }
  }

  _trackLightSource(x, y, z, blockId) {
    const torchId = 25, lanternId = 26, lavaId = 6;
    if (blockId === torchId || blockId === lanternId || blockId === lavaId) {
      this._lightSources.set(`${x},${y},${z}`, { x: x + 0.5, y: y + 0.5, z: z + 0.5, block: blockId });
    } else {
      this._lightSources.delete(`${x},${y},${z}`);
    }
  }

  _renderMinimap() {
    if (!this.settings.showMinimap) return;
    if (!this._minimapTimer) this._minimapTimer = 0;
    this._minimapTimer += this.currentDt;
    if (this._minimapTimer < 1.0) return;
    this._minimapTimer = 0;
    const canvas = document.getElementById('minimap');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 120, radius = size / 2, range = 30;
    const px = this.player.position.x, pz = this.player.position.z;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(radius, radius, radius - 1, 0, Math.PI * 2);
    ctx.clip();
    const biomeColors = { ocean: '#2880B8', deep_ocean: '#1A4878', beach: '#D8C868', plains: '#4A9A3A', forest: '#308A30', jungle: '#28A040', desert: '#D8B060', savanna: '#C0A050', taiga: '#5088A0', snowy_plains: '#E0E8F0', mountains: '#808890', snowy_peaks: '#E0E8F5', stony_peaks: '#909098', meadow: '#60B040', cherry_grove: '#E090B0', swamp: '#506050', river: '#4080B0', mystic_grove: '#7050C0', autumn_forest: '#C08040', zen_garden: '#C0D0E0', bamboo_grove: '#80C090', aurora_tundra: '#A0C0E8' };
    const blockColors = { 0: '#1A1A3A', 1: '#8294A0', 2: '#4A9A3A', 3: '#6A4820', 4: '#D8C868', 5: '#2880B8', 6: '#E05028', 7: '#E8F0F8', 8: '#4A3520', 9: '#5A8A30', 10: '#E0E8F0', 11: '#A08060', 12: '#C0A060', 13: '#3A6A20', 14: '#806040', 15: '#4A7A30', 16: '#E0D0A0', 17: '#A0A0A0', 18: '#B09070', 19: '#D0D0D0', 20: '#E0E8F0', 21: '#80C090', 22: '#C0D0E0', 23: '#A0C0E8', 24: '#909098', 25: '#FFAA44', 26: '#FFCC66' };
    const step = 4;
    for (let dx = -radius; dx < radius; dx += step) {
      for (let dz = -radius; dz < radius; dz += step) {
        const wx = Math.floor(px + (dx / radius) * range);
        const wz = Math.floor(pz + (dz / radius) * range);
        const topBlock = this.world.getTopBlockAt(wx, wz);
        if (topBlock && topBlock !== 0) {
          ctx.fillStyle = blockColors[topBlock] || '#6A7888';
        } else {
          const biome = this.world.generator.getBiome(wx, wz);
          ctx.fillStyle = biomeColors[biome] || '#6A7888';
        }
        ctx.fillRect(dx + radius, dz + radius, step, step);
      }
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    const yaw = this.player.yaw;
    ctx.moveTo(radius + Math.sin(yaw) * 8, radius + Math.cos(yaw) * 8);
    ctx.lineTo(radius - Math.sin(yaw) * 4 + Math.cos(yaw) * 3, radius - Math.cos(yaw) * 4 - Math.sin(yaw) * 3);
    ctx.lineTo(radius - Math.sin(yaw) * 4 - Math.cos(yaw) * 3, radius - Math.cos(yaw) * 4 + Math.sin(yaw) * 3);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.currentDt = dt;

    // ── Per-frame cached values (eliminate redundant lookups) ──
    if (this.player && this.world) {
      const px = Math.floor(this.player.position.x);
      const py = Math.floor(this.player.position.y);
      const pz = Math.floor(this.player.position.z);
      if (!this._frame) this._frame = { px: 0, py: 0, pz: 0, biome: null, headBlock: 0, eyeBlock: 0, camDir: null };
      this._frame.px = px;
      this._frame.py = py;
      this._frame.pz = pz;
      this._frame.biome = this.world.getBiome(px, pz);
      this._frame.headBlock = this.world.getBlock(px, py + 2, pz);
      this._frame.eyeBlock = this.world.getBlock(px, Math.floor(this.player.position.y + 1.5), pz);
      this._frame.camDir = null;
    }

    this.fpsFrames++;
    if (now - this.fpsTime > 500) {
      this.fps = Math.round(this.fpsFrames * 1000 / (now - this.fpsTime));
      this.fpsFrames = 0; this.fpsTime = now;
    }

    // SPEC-PERF-002: Guard — skip system updates if _frame not ready
    if (!this._frame) {
      if (this.postprocessing && this.postprocessing.isEnabled()) {
        this.postprocessing.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }
      return;
    }
    this.dayNight.setBiome(this._frame.biome);

    if (this.gameStarted && !this._paused && (this.pointerLocked || (this.touchControls && this.touchControls.enabled))) {
      const touchInput = this.touchControls ? this.touchControls.getMoveInput() : null;
      if (this.touchControls) this.touchControls.updateLook(dt);
      this.player.update(dt, this.keys, touchInput);
      this.world.update(this.player.position.x, this.player.position.z, this.fps, this.camera, dt);

      if (this.settings.autoSaveInterval > 0) {
        this.autoSaveTimer += dt;
        if (this.autoSaveTimer >= this.settings.autoSaveInterval) {
          this.autoSaveTimer = 0;
          const indicator = document.getElementById('save-indicator');
          if (indicator) indicator.classList.add('show');
          this._saveNow();
          setTimeout(() => { if (indicator) indicator.classList.remove('show'); }, 1000);
        }
      }

      if (this.player.justJumped) { this.audio.playJump(); this.player.justJumped = false; }
      if (this.player.justLanded) { this.audio.playLand(); this.player.justLanded = false; }
      if (this.player.justSplashed) { this.audio.playSplash(); this.player.justSplashed = false; }

      this._updatePointLights(dt);

      // Throttle raycast for block highlight (every 0.1s)
      this._raycastTimer = (this._raycastTimer || 0) + dt;
      if (this._raycastTimer >= 0.1) {
        this._raycastTimer = 0;
        this._cachedRaycast = this.player.raycast(5);
      }
      const target = this._cachedRaycast;
      if (target) {
        this.blockHighlight.visible = true;
        this.blockHighlight.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);
      } else this.blockHighlight.visible = false;

      const eyeBlock = this._frame.eyeBlock;
      const underwater = eyeBlock === BLOCK.WATER;
      const overlay = document.getElementById('underwater-overlay');
      if (underwater) {
        overlay.style.opacity = '1';
        if (this.fogManager) this.fogManager.setUnderwater(true);
      } else {
        overlay.style.opacity = '0';
        if (this.fogManager) this.fogManager.setUnderwater(false);
      }

      if (this.mouseLeftDown) this._breakBlock();
    }

    if (this.player) {
      this.player._mining = !!(this.mouseLeftDown || (this.touchControls && this.touchControls.breaking)) && !this.inventoryOpen && !this.journalOpen;
    }

    // Day/night
    {
      this.dayNight.setBiome(this._frame.biome);
    }
    this.dayNight.update(dt, this.player.position);

    if (this.shadowManager) {
      if (!this._tmpCamDir) this._tmpCamDir = new THREE.Vector3();
      this._tmpCamDir.set(0, 0, 0);
      this.camera.getWorldDirection(this._tmpCamDir);
      this.shadowManager.update(this.player.position, this._tmpCamDir);
    }

    if (this.fogManager) {
      const biomeName = BIOME_NAMES[this._frame.biome] || 'default';
      this.fogManager.setBiome(biomeName);
      this.fogManager.setCave(this._frame.headBlock !== BLOCK.AIR && this._frame.headBlock !== BLOCK.WATER);
      this.fogManager.update(dt, this.player.position.y, this.dayNight.time);
    }

    if (this.world.waterMaterialManager) {
      const skyColor = this.dayNight.skyDome ? this.dayNight.skyDome.material.uniforms.bottomColor.value : null;
      if (!this._tmpSunDir) this._tmpSunDir = new THREE.Vector3();
      this._tmpSunDir.copy(this.dayNight.sunLight.position).normalize();
      this.world.waterMaterialManager.update(dt, this.camera.position, skyColor, this._tmpSunDir);
    }

    if (this.interiorLighting) this.interiorLighting.update(dt, this.world, this.player.position, !this.player.inWater);

    if (this.ambientParticles) {
      const dayFactor = Math.max(0, Math.sin(this.dayNight.time * Math.PI * 2));
      this.ambientParticles.setNight(dayFactor < 0.15);
      const apBiome = this._frame.biome;
      this.ambientParticles.setCave(this._frame.headBlock !== BLOCK.AIR && this._frame.headBlock !== BLOCK.WATER);
      this.ambientParticles.setBiome(apBiome);
      this.ambientParticles.update(dt, this.player.position, dayFactor);
    }

    if (this.forestCanopy) this.forestCanopy.update(dt, this.world, this.player.position, this.dayNight, this.fogManager);

    if (this.particles) this.particles.update(dt);

    if (this.weatherManager) this.weatherManager.update(dt, this.player.position, this.world);

    this._hudTimer = (this._hudTimer || 0) + dt;
    if (this._hudTimer >= 0.2) {
      this._hudTimer = 0;
      this.updateHUD();
    }
    this._checkUIHide(dt);

    // Hide loading
    if (this.world.getLoadedChunkCount() > 0) {
      const loading = document.getElementById('loading');
      if (loading && loading.style.opacity !== '0') {
        loading.style.opacity = '0';
        setTimeout(() => { if (loading) loading.style.display = 'none'; }, 1000);
      }
    }

    this._renderMinimap();

    // ChillTune adaptive music
    if (this.chilltune && this.gameStarted) {
      this._chilltuneTimer = (this._chilltuneTimer || 0) + dt;
      if (this._chilltuneTimer >= 1.0) {
        this._chilltuneTimer = 0;
        const ctBiomeKey = AMBIENT_BIOME_MAP[this._frame.biome] || 'plains';
        const ctInCave = this.player.position.y < 35 && this._frame.headBlock !== BLOCK.AIR && this._frame.headBlock !== BLOCK.WATER;
        if (ctInCave) ctBiomeKey = 'caves';
        const ctWeather = this.weatherManager ? this.weatherManager.getCurrentWeather() : 'clear';
        this.chilltune.tickExtended(
          this.player.position, this.dayNight ? this.dayNight.time : 0.5,
          0, this.player.inWater, ctBiomeKey, ctWeather, false, ctInCave
        );
      }
    }

    // UI manager
    if (this.uiManager && this.gameStarted) {
      const biomeName = BIOME_NAMES[this._frame.biome] || 'Unknown';
      if (biomeName !== this._lastBiomeName) {
        this._lastBiomeName = biomeName;
        this.uiManager.showBiomeIndicator(biomeName);
      }
      this.uiManager.updateBiomeIndicator(dt);
      this.uiManager.updateToasts(dt);
      this._renderToasts();
      this._renderBiomeIndicator();
    }

    // Ambient sound
    if (this.ambientSoundManager && this.gameStarted && this.audio && this.audio.ctx) {
      if (!this.ambientSoundManager.ctx) {
        this.ambientSoundManager.init(this.audio.ctx, this.audio.masterGain);
      }
      const px = this._frame.px;
      const py = this._frame.py;
      const pz = this._frame.pz;
      let ambientKey = AMBIENT_BIOME_MAP[this._frame.biome] || 'plains';
      const isIndoor = py < 35 && this._frame.headBlock !== BLOCK.AIR && this._frame.headBlock !== BLOCK.WATER;
      if (isIndoor) ambientKey = 'caves';
      this.ambientSoundManager.setBiome(ambientKey);
      this.ambientSoundManager.setIndoor(isIndoor);
      const currentWeather = this.weatherManager ? this.weatherManager.getCurrentWeather() : 'clear';
      this.ambientSoundManager.setWeather(currentWeather);
      const dayTime = this.dayNight ? this.dayNight.time : 0.5;
      let timePhase = 'day';
      if (dayTime < 0.2 || dayTime > 0.8) timePhase = 'night';
      else if (dayTime < 0.3) timePhase = 'dawn';
      else if (dayTime > 0.7) timePhase = 'sunset';
      this.ambientSoundManager.setTimeOfDay(timePhase);

      // Biome discovery
      if (this._frame.biome && this.biomeIdentityManager && this.biomeIdentityManager.hasFingerprint(this._frame.biome)) {
        if (!this.discoveredBiomes.has(this._frame.biome)) {
          this.discoveredBiomes.add(this._frame.biome);
          const displayName = BIOME_NAMES[this._frame.biome] || this._frame.biome;
          if (this.uiManager) this.uiManager.showToast(`Descubrimiento: ${displayName}`, 'discovery');
          if (this.journal) this.journal.addEntry(ENTRY_TYPES.BIOME_DISCOVERY, `Bioma: ${displayName}`, `Descubriste el bioma ${displayName}.`);
          if (this.chilltune && this.chilltune.playStinger) this.chilltune.playStinger('new_biome');
        }
      }

      this.ambientSoundManager.updateListener(
        this.player.position.x, this.player.position.y, this.player.position.z,
        this._tmpCamDir ? this._tmpCamDir.x : 0, this._tmpCamDir ? this._tmpCamDir.z : 0
      );
    }

    // Wellness systems
    if (this.gameStarted) {
      const wellnessBiomeKey = AMBIENT_BIOME_MAP[this._frame.biome] || 'plains';

      // Komorebi
      if (this.komorebiSystem && this.settings.komorebiEnabled) {
        this.komorebiSystem.update(this.player.position, this.world, wellnessBiomeKey, dt);
        if (this.komorebiSystem.isActive() && !this._komorebiLogged) {
          if (this.journal) this.journal.addEntry(ENTRY_TYPES.KOMOREBI_MOMENT, 'Komorebi', 'La luz filtra entre las hojas sobre ti.');
          this._komorebiLogged = true;
        } else if (this.komorebiSystem && !this.komorebiSystem.isActive() && this._komorebiLogged) {
          this._komorebiLogged = false;
        }
      }

      // Resonance
      this.resonanceSystem.update(dt);
      if (this.journal) this.journal.setStat('highestResonance', this.resonanceSystem.score);

      // Sunrise/sunset journal
      if (this.chilltune) {
        const phase = this.chilltune.currentTimePhase;
        if (this._lastWellnessPhase !== phase) {
          if (phase === 'dawn') {
            if (this.journal) this.journal.addEntry(ENTRY_TYPES.SUNRISE, 'Amanecer', 'Contemplaste el amanecer.');
            if (this.resonanceSystem) this.resonanceSystem.track('meditation', 5);
          } else if (phase === 'dusk') {
            if (this.journal) this.journal.addEntry(ENTRY_TYPES.SUNSET, 'Atardecer', 'El sol se pone sobre el horizonte.');
            if (this.resonanceSystem) this.resonanceSystem.track('meditation', 5);
          }
          this._lastWellnessPhase = phase;
        }
      }

      // Meditation spaces
      if (this.meditationSpaceGenerator && this.settings.meditationEnabled) {
        this.meditationSpaceGenerator.update(this.player.position, this.world, wellnessBiomeKey, this.world.worldGen, dt);
      }

      // Living world
      if (this.livingWorldSystem && this.settings.livingWorldEnabled) {
        this.livingWorldSystem.update(dt, this.player.position, this.world, wellnessBiomeKey);
      }

      // Journal tracking
      this.journal.trackMovement(this.player.position);
      this.journal.updateTime(dt);
      this.journal.setStat('biomesDiscovered', this.discoveredBiomes.size);

      // Fauna cycle
      if (this.ambientSoundManager && this.ambientSoundManager.ctx) {
        const faunaPhase = this.chilltune ? this.chilltune.currentTimePhase : 'day';
        if (this._lastFaunaPhase !== faunaPhase) {
          this._lastFaunaPhase = faunaPhase;
          this.ambientSoundManager._updateFaunaCycle(faunaPhase);
        }
      }
    }

    // Render
    if (this.postprocessing && this.postprocessing.isEnabled()) {
      this.postprocessing.update(dt, this.fps || 60);
      this.postprocessing.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
