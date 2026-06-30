import Phaser from 'phaser';
import { SCENES } from '@config/phaser.config';
import { COLORS, BET_OPTIONS, BALANCE, RARITY_COLORS } from '@config/balance';
import { REELS_COUNT, ROWS_COUNT, type SymbolConfig } from '@config/symbols';
import { useGameStore } from '@store/gameStore';
import { SaveManager } from '@store/SaveManager';
import { AudioEngine } from '@audio/AudioEngine';
import { RNG } from '@systems/RNG';
import { ReelEngine } from '@systems/ReelEngine';
import { PaylineChecker, type MultiplierParams } from '@systems/PaylineChecker';
import { Economy, type GameState } from '@systems/Economy';
import { AchievementChecker } from '@systems/AchievementChecker';
import { MysteryBox } from '@systems/MysteryBox';
import { FruitGarden } from '@systems/FruitGarden';
import { FruitCatcher } from '@systems/FruitCatcher';
import { TapCombo } from '@systems/TapCombo';
import { ShakeNudge } from '@systems/ShakeNudge';
import { GuideSystem } from '@systems/GuideSystem';
import { NearMissSystem } from '@systems/NearMissSystem';
import { InputManager } from '@systems/InputManager';
import { PerformanceManager } from '@systems/PerformanceManager';
import { ChallengeChecker, type ActiveChallenge } from '@systems/ChallengeChecker';
import { EffectsManager } from '@systems/EffectsManager';

const REEL_W = 140;
const REEL_H = 360;
const SYM_H = REEL_H / ROWS_COUNT;
const REEL_GAP = 12;
const REEL_PAD = 8;

export class SlotScene extends Phaser.Scene {
  private audioEngine: AudioEngine = new AudioEngine();
  private rng: RNG = new RNG();
  private reelEngine: ReelEngine;
  private reelContainers: Phaser.GameObjects.Container[] = [];
  private reelStrips: Phaser.GameObjects.Text[] = [];
  private spinBtn!: Phaser.GameObjects.Text;
  private balanceText!: Phaser.GameObjects.Text;
  private betText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private streakText!: Phaser.GameObjects.Text;
  private jackpotText!: Phaser.GameObjects.Text;
  private feverBanner!: Phaser.GameObjects.Text;
  private freeSpinsBanner!: Phaser.GameObjects.Text;
  private winLineGraphics!: Phaser.GameObjects.Graphics;
  private guideGraphics!: Phaser.GameObjects.Graphics;
  private nudgesUsed: number = 0;
  private nudgeEnabled: boolean = false;
  private fruitGarden: FruitGarden | null = null;
  private fruitCatcher: FruitCatcher | null = null;
  private tapCombo: TapCombo | null = null;
  private shakeNudge: ShakeNudge | null = null;
  private guideSystem: GuideSystem | null = null;
  private nearMissSystem: NearMissSystem | null = null;
  private inputManager: InputManager | null = null;
  private perfManager: PerformanceManager = new PerformanceManager();
  private spinCycleTimer: Phaser.Time.TimerEvent | null = null;
  private reelGlows: (Phaser.GameObjects.Rectangle | null)[] = [];
  private reelStoppedFlags: boolean[] = [];
  private spinBtnTween: Phaser.Tweens.Tween | null = null;
  private reelsContainerGlow: Phaser.GameObjects.Rectangle | null = null;
  private effectsManager: EffectsManager | null = null;
  private spinBtnGlow: Phaser.GameObjects.Rectangle | null = null;
  private betButtons: Map<number, Phaser.GameObjects.Text> = new Map();
  private allInBtn: Phaser.GameObjects.Text | null = null;
  private activeBetBtn: Phaser.GameObjects.Text | null = null;
  private dimOverlay: Phaser.GameObjects.Rectangle | null = null;

  constructor() {
    super({ key: SCENES.SLOT });
    this.reelEngine = new ReelEngine(this.rng);
  }

  create(): void {
    const state = useGameStore.getState();
    this.rng.setLuckyStraw(!!state.upgrades.luckyStraw);
    this.audioEngine.init();
    this.audioEngine.setVolume(state.volume);
    this.audioEngine.startMusic(this.audioEngine.pickLoungeTrack());

    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.effectsManager = new EffectsManager(this);
    this.effectsManager.createAnimatedBackground();
    this.createReels();
    this.createHUD();
    this.createControls();
    this.renderAllReels();
    this.updateHUD();
    this.createSpinBtnGlow();

    this.fruitGarden = new FruitGarden(this, this.audioEngine);
    this.fruitGarden.start();
    this.tapCombo = new TapCombo(this);
    this.shakeNudge = new ShakeNudge(this, this.audioEngine, this.reelEngine);

    const totalW = REELS_COUNT * REEL_W + (REELS_COUNT - 1) * REEL_GAP + REEL_PAD * 2;
    const reelStartX = (this.cameras.main.width - totalW) / 2 + REEL_PAD;
    const reelStartY = 120;
    this.guideSystem = new GuideSystem(this, reelStartX, reelStartY);
    this.guideSystem.init();
    this.nearMissSystem = new NearMissSystem(this, this.audioEngine, reelStartX, reelStartY);

    const curState = useGameStore.getState();
    if (!curState.tutorialVisto && curState.stats.totalSpins === 0) {
      this.scene.launch(SCENES.TUTORIAL);
      this.scene.pause();
    }

    this.perfManager.autoDetect();

    this.inputManager = new InputManager(this, {
      onSpin: () => {
        const s = useGameStore.getState();
        if (!s.girando && !s.enBono && !s.enGamble) this.doSpin();
      },
      onBet: (amount: number) => {
        const s = useGameStore.getState();
        if (s.girando) return;
        const bet = amount === -1 ? s.saldo : amount;
        if (bet <= s.saldo) {
          useGameStore.getState().set({ apuestaActual: bet });
          this.updateHUD();
          this.updateBetHighlight();
        }
      },
      onEsc: () => {
        if (this.inputManager?.getIsFullscreen()) {
          this.inputManager?.exitFullscreen();
        }
      },
      onPauseMusic: () => {
        this.audioEngine.stopMusic();
      },
      onResumeMusic: () => {
        const s = useGameStore.getState();
        if (!s.girando) {
          this.audioEngine.startMusic(this.audioEngine.pickLoungeTrack());
        }
      },
    });
    this.inputManager.init();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const s = useGameStore.getState();
      if (this.shakeNudge?.isActive()) {
        const nudged = this.shakeNudge.onTap(pointer.x, pointer.y);
        if (nudged) return;
      }
      if (s.girando) {
        const newCombo = s.tapCombo + 1;
        useGameStore.getState().set({ tapCombo: newCombo });
        this.tapCombo?.onTap(pointer.x, pointer.y, newCombo);
        if (newCombo === BALANCE.tapComboThreshold) {
          this.effectsManager?.comboMega('🔥 TAP COMBO!');
        } else if (newCombo === BALANCE.tapComboThreshold * 2) {
          this.effectsManager?.comboMega('⚡ TAP FRENZY!');
        }
      }
    });

    this.events.on('resume', () => {
      this.fadeOutDimOverlay();
      this.updateHUD();
    });

    this.updateBetHighlight();
  }

  private createReels(): void {
    const totalW = REELS_COUNT * REEL_W + (REELS_COUNT - 1) * REEL_GAP + REEL_PAD * 2;
    const startX = (this.cameras.main.width - totalW) / 2 + REEL_PAD;
    const startY = 120;

    this.winLineGraphics = this.add.graphics();
    this.winLineGraphics.setDepth(50);
    this.guideGraphics = this.add.graphics();
    this.guideGraphics.setDepth(40);

    const goldColor = Phaser.Display.Color.HexStringToColor(COLORS.gold).color;
    const goldDarkColor = Phaser.Display.Color.HexStringToColor(COLORS.goldDark).color;
    const reelColor = Phaser.Display.Color.HexStringToColor(COLORS.reel).color;
    const reelDarkColor = Phaser.Display.Color.HexStringToColor(COLORS.reelDark).color;
    const surfaceColor = Phaser.Display.Color.HexStringToColor(COLORS.surface).color;

    // Gold bevel frame — outer + inner for 3D depth
    const frameOuter = this.add.rectangle(
      startX + totalW / 2 - REEL_PAD,
      startY + REEL_H / 2,
      totalW - REEL_PAD * 2 + 20,
      REEL_H + 20,
      goldDarkColor,
      0.6,
    );
    frameOuter.setDepth(4);

    const frameBg = this.add.rectangle(
      startX + totalW / 2 - REEL_PAD,
      startY + REEL_H / 2,
      totalW - REEL_PAD * 2 + 16,
      REEL_H + 16,
      surfaceColor,
      0.5,
    );
    frameBg.setStrokeStyle(3, goldColor, 0.4);
    frameBg.setDepth(5);

    // Top highlight bar on frame
    const frameHighlight = this.add.rectangle(
      startX + totalW / 2 - REEL_PAD,
      startY - REEL_H / 2 - 6,
      totalW - REEL_PAD * 2 + 20,
      4,
      0xffffff,
      0.15,
    );
    frameHighlight.setDepth(6);

    for (let i = 0; i < REELS_COUNT; i++) {
      const x = startX + i * (REEL_W + REEL_GAP);

      const bg = this.add.rectangle(x + REEL_W / 2, startY + REEL_H / 2, REEL_W, REEL_H, reelColor, 0.85);
      bg.setStrokeStyle(2, goldColor, 0.15);
      bg.setDepth(10);

      // Top shadow gradient — dark fade from top
      const topGrad = this.add.graphics();
      topGrad.setDepth(11);
      const gradSteps = 12;
      for (let s = 0; s < gradSteps; s++) {
        const t = s / gradSteps;
        const alpha = 0.35 * (1 - t);
        topGrad.fillStyle(reelDarkColor, alpha);
        topGrad.fillRect(x, startY + s * 4, REEL_W, 4);
      }

      // Bottom shadow gradient — dark fade from bottom
      const botGrad = this.add.graphics();
      botGrad.setDepth(11);
      for (let s = 0; s < gradSteps; s++) {
        const t = s / gradSteps;
        const alpha = 0.35 * (1 - t);
        botGrad.fillStyle(reelDarkColor, alpha);
        botGrad.fillRect(x, startY + REEL_H - s * 4 - 4, REEL_W, 4);
      }

      // Inner gold border — top/bottom edges for bevel effect
      const innerTop = this.add.rectangle(x + REEL_W / 2, startY + 2, REEL_W - 4, 3, goldColor, 0.2);
      innerTop.setDepth(12);
      const innerBot = this.add.rectangle(x + REEL_W / 2, startY + REEL_H - 2, REEL_W - 4, 3, 0x000000, 0.3);
      innerBot.setDepth(12);

      const topShine = this.add.rectangle(x + REEL_W / 2, startY + 4, REEL_W - 4, 8, 0xffffff, 0.06);
      topShine.setDepth(13);

      const container = this.add.container(x, startY);
      container.setDepth(20);
      this.reelContainers.push(container);

      for (let j = 0; j < ROWS_COUNT; j++) {
        const sym = this.add.text(REEL_W / 2, j * SYM_H + SYM_H / 2, '?', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '48px',
        }).setOrigin(0.5);
        sym.setShadow(2, 2, '#000000', 2, false, true);
        container.add(sym);
        this.reelStrips.push(sym);
      }

      const reelIdx = i;
      bg.setInteractive();
      bg.on('pointerdown', () => {
        if (this.nudgeEnabled) this.nudgeReel(reelIdx);
      });
    }
  }

  private createSpinBtnGlow(): void {
    const goldColor = Phaser.Display.Color.HexStringToColor(COLORS.gold).color;
    this.spinBtnGlow = this.add.rectangle(
      this.spinBtn.x,
      this.spinBtn.y,
      200,
      70,
      goldColor,
      0.08,
    );
    this.spinBtnGlow.setDepth(19);
    this.spinBtnGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: this.spinBtnGlow,
      alpha: { from: 0.05, to: 0.2 },
      scale: { from: 0.95, to: 1.05 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createHUD(): void {
    const { width } = this.cameras.main;
    const surfaceColor = Phaser.Display.Color.HexStringToColor(COLORS.surface).color;
    const goldColor = Phaser.Display.Color.HexStringToColor(COLORS.gold).color;

    // Left panel — Balance + Level
    const leftPanel = this.add.rectangle(10, 10, 220, 70, surfaceColor, 0.7);
    leftPanel.setOrigin(0, 0);
    leftPanel.setStrokeStyle(1, goldColor, 0.2);
    leftPanel.setDepth(15);

    this.balanceText = this.add.text(20, 18, '', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '24px',
      color: COLORS.gold,
    }).setDepth(16);

    this.levelText = this.add.text(20, 53, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: COLORS.muted,
    }).setDepth(16);

    // Center panel — Jackpot + Bet
    const centerPanel = this.add.rectangle(width / 2, 10, 280, 70, surfaceColor, 0.7);
    centerPanel.setOrigin(0.5, 0);
    centerPanel.setStrokeStyle(1, goldColor, 0.2);
    centerPanel.setDepth(15);

    this.jackpotText = this.add.text(width / 2, 16, '', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '20px',
      color: COLORS.gold,
    }).setOrigin(0.5, 0).setDepth(16);

    this.betText = this.add.text(width / 2, 48, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: COLORS.text,
    }).setOrigin(0.5, 0).setDepth(16);

    // Right panel — Streak
    const rightPanel = this.add.rectangle(width - 10, 10, 200, 70, surfaceColor, 0.7);
    rightPanel.setOrigin(1, 0);
    rightPanel.setStrokeStyle(1, goldColor, 0.2);
    rightPanel.setDepth(15);

    this.streakText = this.add.text(width - 20, 18, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: COLORS.text,
    }).setOrigin(1, 0).setDepth(16);

    // Fever / Free Spins banners (below center panel)
    this.feverBanner = this.add.text(width / 2, 90, '', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '18px',
      color: COLORS.red,
    }).setOrigin(0.5, 0).setVisible(false);

    this.freeSpinsBanner = this.add.text(width / 2, 90, '', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '18px',
      color: COLORS.purple,
    }).setOrigin(0.5, 0).setVisible(false);
  }

  private createControls(): void {
    const { width, height } = this.cameras.main;
    const ctrlY = height - 80;
    const goldColor = Phaser.Display.Color.HexStringToColor(COLORS.gold).color;
    const surfaceColor = Phaser.Display.Color.HexStringToColor(COLORS.surface).color;

    this.spinBtn = this.add.text(width / 2, ctrlY, 'GIRAR', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      backgroundColor: COLORS.green,
      padding: { x: 50, y: 16 },
      shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 6, fill: true },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.spinBtn.on('pointerover', () => {
      if (!useGameStore.getState().girando) {
        this.spinBtn.setScale(1.08);
        this.spinBtn.setStyle({ color: COLORS.gold });
      }
    });
    this.spinBtn.on('pointerout', () => {
      this.spinBtn.setScale(1);
      this.spinBtn.setStyle({ color: '#ffffff' });
    });
    this.spinBtn.on('pointerdown', () => this.doSpin());

    // Bet buttons — larger touch targets + tracking for highlight
    let bx = 50;
    for (const bet of BET_OPTIONS) {
      const btn = this.add.text(bx, ctrlY, `${bet}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: COLORS.text,
        backgroundColor: COLORS.surface,
        padding: { x: 20, y: 12 },
      }).setOrigin(0).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => {
        if (!useGameStore.getState().girando) btn.setStyle({ color: COLORS.gold });
      });
      btn.on('pointerout', () => {
        if (this.activeBetBtn !== btn) btn.setStyle({ color: COLORS.text });
      });
      btn.on('pointerdown', () => {
        const s = useGameStore.getState();
        if (s.girando) return;
        if (bet <= s.saldo) {
          useGameStore.getState().set({ apuestaActual: bet });
          this.updateHUD();
          this.updateBetHighlight();
        } else {
          this.effectsManager?.showToast('Saldo insuficiente para esta apuesta', COLORS.red, 1500);
          this.effectsManager?.shakeButton(btn);
        }
      });
      this.betButtons.set(bet, btn);
      bx += 90;
    }

    this.allInBtn = this.add.text(bx, ctrlY, 'ALL', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: COLORS.text,
      backgroundColor: COLORS.surface,
      padding: { x: 20, y: 12 },
    }).setOrigin(0).setInteractive({ useHandCursor: true });

    this.allInBtn.on('pointerover', () => {
      if (!useGameStore.getState().girando) this.allInBtn!.setStyle({ color: COLORS.gold });
    });
    this.allInBtn.on('pointerout', () => {
      if (this.activeBetBtn !== this.allInBtn) this.allInBtn!.setStyle({ color: COLORS.text });
    });
    this.allInBtn.on('pointerdown', () => {
      const s = useGameStore.getState();
      if (s.girando) return;
      if (s.saldo > 0) {
        useGameStore.getState().set({ apuestaActual: s.saldo });
        this.updateHUD();
        this.updateBetHighlight();
      }
    });

    const autoBtn = this.add.text(width - 200, ctrlY, 'AUTO', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: COLORS.text,
      backgroundColor: COLORS.surface,
      padding: { x: 20, y: 12 },
    }).setOrigin(0).setInteractive({ useHandCursor: true });

    autoBtn.on('pointerover', () => autoBtn.setStyle({ color: COLORS.gold }));
    autoBtn.on('pointerout', () => autoBtn.setStyle({ color: COLORS.text }));
    autoBtn.on('pointerdown', () => {
      const s = useGameStore.getState();
      if (s.girando) return;
      useGameStore.getState().set({ autoSpin: !s.autoSpin });
      this.updateHUD();
      if (!s.autoSpin) this.checkAutoSpin();
    });

    const turboBtn = this.add.text(width - 120, ctrlY, 'TURBO', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: COLORS.text,
      backgroundColor: COLORS.surface,
      padding: { x: 20, y: 12 },
    }).setOrigin(0).setInteractive({ useHandCursor: true });

    turboBtn.on('pointerover', () => turboBtn.setStyle({ color: COLORS.gold }));
    turboBtn.on('pointerout', () => turboBtn.setStyle({ color: COLORS.text }));
    turboBtn.on('pointerdown', () => {
      const s = useGameStore.getState();
      if (s.girando) return;
      useGameStore.getState().set({ turboMode: !s.turboMode });
      this.updateHUD();
    });

    const guideBtn = this.add.text(width - 40, ctrlY, '📐', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: COLORS.text,
      backgroundColor: COLORS.surface,
      padding: { x: 12, y: 10 },
    }).setOrigin(0).setInteractive({ useHandCursor: true });

    guideBtn.on('pointerdown', () => {
      this.guideSystem?.toggle();
    });

    // Menu button — moved to avoid overlap with right HUD panel
    const menuBtn = this.add.text(width - 20, 90, '☰', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: COLORS.text,
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    const menuItems = [
      { label: '💰 Cargar', tab: 'deposit' },
      { label: '📋 Pagos', tab: 'paytable' },
      { label: '🛒 Upgrades', tab: 'upgrades' },
      { label: '🏆 Logros', tab: 'achievements' },
      { label: '📊 Stats', tab: 'stats' },
      { label: '🎯 Retos', tab: 'challenges' },
      { label: '⚙️ Configuración', tab: 'settings' },
      { label: '⛶ Pantalla completa', tab: '__fullscreen__' },
    ];
    let menuOpen = false;
    const menuW = 240;
    const itemH = 44;
    const menuH = menuItems.length * itemH + 16;
    const menuContainer = this.add.container(width - 20, 120).setDepth(95).setVisible(false);

    // Menu background panel
    const menuBg = this.add.rectangle(-menuW / 2, 0, menuW, menuH, surfaceColor, 0.95);
    menuBg.setOrigin(0.5, 0);
    menuBg.setStrokeStyle(2, goldColor, 0.3);
    menuContainer.add(menuBg);

    for (let i = 0; i < menuItems.length; i++) {
      const itemY = 8 + i * itemH;

      // Separator lines between items
      if (i > 0) {
        const sep = this.add.rectangle(-menuW / 2 + 12, itemY, menuW - 24, 1, goldColor, 0.1);
        sep.setOrigin(0, 0.5);
        menuContainer.add(sep);
      }

      const item = this.add.text(-menuW / 2 + 16, itemY + itemH / 2, menuItems[i].label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: COLORS.text,
        padding: { x: 8, y: 6 },
      }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

      // Larger invisible hit area for easier touch
      const hitArea = this.add.rectangle(-menuW / 2, itemY, menuW, itemH, 0x000000, 0);
      hitArea.setOrigin(0, 0).setInteractive({ useHandCursor: true });
      hitArea.on('pointerover', () => item.setStyle({ color: COLORS.gold }));
      hitArea.on('pointerout', () => item.setStyle({ color: COLORS.text }));
      hitArea.on('pointerdown', () => {
        menuContainer.setVisible(false);
        menuOpen = false;
        if (menuItems[i].tab === '__fullscreen__') {
          this.inputManager?.toggleFullscreen();
        } else {
          this.showDimOverlay();
          this.scene.launch(SCENES.INFO, { tab: menuItems[i].tab });
          this.scene.pause();
        }
      });

      menuContainer.add(hitArea);
      menuContainer.add(item);
    }

    menuBtn.on('pointerdown', () => {
      menuOpen = !menuOpen;
      menuContainer.setVisible(menuOpen);
    });
  }

  private renderReel(idx: number): void {
    const reels = this.reelEngine.getReels();
    const container = this.reelContainers[idx];
    if (!reels[idx]) return;

    const texts = container.list as Phaser.GameObjects.Text[];
    for (let j = 0; j < ROWS_COUNT; j++) {
      if (texts[j] && reels[idx][j]) {
        texts[j].setText(reels[idx][j].emoji);
      }
    }
  }

  private renderAllReels(): void {
    for (let i = 0; i < REELS_COUNT; i++) this.renderReel(i);
  }

  private updateHUD(): void {
    const s = useGameStore.getState();
    const prevSaldo = parseInt(this.balanceText.text.replace(/[^0-9]/g, '')) || 0;
    if (prevSaldo > 0 && prevSaldo !== s.saldo) {
      this.effectsManager?.animateBalance(this.balanceText, prevSaldo, s.saldo);
    } else {
      this.balanceText.setText(`🪙 ${s.saldo}`);
    }
    this.levelText.setText(`Nv ${s.nivel} · Exp ${s.expTotal}`);
    this.streakText.setText(`🎯 ${s.spinStreak} · 🔥 ${s.winStreak}`);
    this.jackpotText.setText(`💎 Jackpot: ${s.jackpotProgresivo.toLocaleString()}`);
    this.betText.setText(`Apuesta: ${s.apuestaActual}`);
    this.feverBanner.setVisible(s.fruitFever);
    if (s.fruitFever) this.feverBanner.setText(`🔥 FRUIT FEVER! ${s.feverGiros} giros`);
    this.freeSpinsBanner.setVisible(s.freeSpins > 0);
    if (s.freeSpins > 0) this.freeSpinsBanner.setText(`🎰 Free Spins: ${s.freeSpins} (x${s.freeSpinsMult})`);
  }

  private updateBetHighlight(): void {
    const s = useGameStore.getState();
    const goldColor = Phaser.Display.Color.HexStringToColor(COLORS.gold).color;
    const surfaceColor = Phaser.Display.Color.HexStringToColor(COLORS.surface).color;

    // Reset all bet buttons
    for (const [bet, btn] of this.betButtons) {
      btn.setStyle({ color: COLORS.text, backgroundColor: COLORS.surface });
      btn.setScale(1);
    }
    if (this.allInBtn) {
      this.allInBtn.setStyle({ color: COLORS.text, backgroundColor: COLORS.surface });
      this.allInBtn.setScale(1);
    }

    // Highlight active bet
    const activeBet = s.apuestaActual;
    let activeBtn: Phaser.GameObjects.Text | null = null;

    if (this.betButtons.has(activeBet)) {
      activeBtn = this.betButtons.get(activeBet)!;
    } else if (this.allInBtn && activeBet === s.saldo) {
      activeBtn = this.allInBtn;
    }

    if (activeBtn) {
      activeBtn.setStyle({ color: COLORS.gold, backgroundColor: COLORS.reel });
      activeBtn.setScale(1.1);
      this.activeBetBtn = activeBtn;
    } else {
      this.activeBetBtn = null;
    }
  }

  private showDimOverlay(): void {
    if (this.dimOverlay) {
      this.dimOverlay.destroy();
    }
    const { width, height } = this.cameras.main;
    this.dimOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0);
    this.dimOverlay.setDepth(90);
    this.tweens.add({
      targets: this.dimOverlay,
      alpha: 0.5,
      duration: 200,
      ease: 'Sine.easeOut',
    });
  }

  private fadeOutDimOverlay(): void {
    if (!this.dimOverlay) return;
    const overlay = this.dimOverlay;
    this.dimOverlay = null;
    this.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 200,
      ease: 'Sine.easeOut',
      onComplete: () => overlay.destroy(),
    });
  }

  private getMultiplierParams(): MultiplierParams {
    const s = useGameStore.getState();
    return {
      multiplierBoost: !!s.upgrades.multiplierBoost,
      doubleWild: !!s.upgrades.doubleWild,
      fruitFever: s.fruitFever,
      goldenHourMult: s.goldenHourMult,
      freeSpins: s.freeSpins,
      freeSpinsMult: s.freeSpinsMult,
      prestigeMult: s.prestigeMult,
      tapCombo: s.tapCombo,
      tapFrenzy: !!s.upgrades.tapFrenzy,
    };
  }

  private async doSpin(): Promise<void> {
    const s = useGameStore.getState();
    if (s.girando || s.enBono || s.enGamble) return;

    const isFreeSpin = s.freeSpins > 0;
    if (!isFreeSpin && s.saldo < s.apuestaActual) {
      if (s.saldo <= 0) {
        useGameStore.getState().set({
          saldo: BALANCE.bankruptcyProtectionAmount,
          freeMoney: true,
        });
        this.updateHUD();
        SaveManager.save(useGameStore.getState());
        this.effectsManager?.showToast('💸 Saldo agotado — +50 monedas gratis!', COLORS.green, 2500);
        return;
      }
      this.effectsManager?.showToast('⚠️ Saldo insuficiente', COLORS.red, 1500);
      this.effectsManager?.shakeButton(this.spinBtn);
      return;
    }

    this.audioEngine.init();
    useGameStore.getState().set({
      girando: true,
      tapCombo: 0,
    });
    this.nudgesUsed = 0;

    let newState: GameState = { ...useGameStore.getState() };

    if (isFreeSpin) {
      newState.freeSpins--;
    } else {
      newState = Economy.deductBet(newState, false);
    }

    newState.stats.totalSpins++;
    newState.spinStreak++;
    newState.tapCombo = 0;
    useGameStore.getState().set(newState);
    this.updateHUD();
    this.tapCombo?.reset();
    this.shakeNudge?.reset();
    this.guideSystem?.flashAllLines();

    this.audioEngine.sfx('spin');
    this.audioEngine.vibrate(50);
    this.audioEngine.startMusic(this.audioEngine.pickSpinTrack());

    this.spinBtn.disableInteractive();
    this.spinBtn.setStyle({ backgroundColor: COLORS.muted });
    this.spinBtn.setText('GIRANDO...');

    this.startSpinVisuals();

    const turbo = newState.turboMode ? 0.5 : 1;
    const baseDur = 1500 * turbo;
    const stagger = 100 * turbo;
    const anticipation = false;

    await this.reelEngine.spinAll(baseDur, stagger, anticipation, (reelIdx) => {
      this.onReelStopVisual(reelIdx);
    });

    this.stopSpinVisuals();

    for (let i = 0; i < REELS_COUNT; i++) this.renderReel(i);

    const carretes = this.reelEngine.getGrid();
    const params = this.getMultiplierParams();
    const result = PaylineChecker.evaluate(
      carretes,
      newState.apuestaActual,
      !!newState.upgrades.extraLine,
      params,
    );

    this.spinBtn.setInteractive();
    this.spinBtn.setStyle({ backgroundColor: COLORS.green });
    this.spinBtn.setText('GIRAR');

    if (newState.fruitFever) {
      newState.feverGiros--;
      if (newState.feverGiros <= 0) {
        newState.fruitFever = false;
        newState.goldenHourMult = 0;
        this.effectsManager?.setVignette('normal');
      }
    }
    if (result.scatterWin > 0) {
      newState.saldo += result.scatterWin;
      newState.stats.totalWon += result.scatterWin;
    }

    if (result.resultados.length > 0) {
      const premio = result.premioTotal;
      if (result.jackpot) {
        newState = Economy.applyJackpot(newState);
      }
      newState = Economy.applyWin(newState, premio);
      newState.expTotal += premio;

      newState.nivel = Economy.getLevel(newState.expTotal);

      this.highlightWins(result.resultados);
      if (result.jackpot) {
        this.showJackpotEffects();
      } else {
        this.audioEngine.sfx('bigWin');
        this.audioEngine.vibrate([30, 20, 30]);
        const mult = premio / newState.apuestaActual;
        this.effectsManager?.bigWinBanner(premio, mult);
        this.effectsManager?.flashScreen('green');
        if (mult >= 10) {
          this.effectsManager?.confetti(20);
        }
      }

      if (newState.winStreak >= 5 && !newState.fruitFever) {
        newState.fruitFever = true;
        newState.feverGiros = BALANCE.feverSpins;
        this.audioEngine.sfx('feverMode');
        this.effectsManager?.setVignette('fever');
        this.effectsManager?.flashScreen('red');
      }

      const streakReward = Economy.checkSpinStreakReward(newState.spinStreak);
      if (streakReward > 0) {
        newState.saldo += streakReward;
      }

      if (MysteryBox.shouldTrigger()) {
        newState.mysteryBoxPendiente = true;
      }

      useGameStore.getState().set(newState);
      this.updateHUD();
      SaveManager.save(newState);

      this.time.delayedCall(1000, () => {
        useGameStore.getState().set({ girando: false });
        const current = useGameStore.getState();
        this.updateHUD();
        this.updateChallenges();

        const newAch = AchievementChecker.check(current);
        for (const id of newAch) {
          if (!current.achievements.includes(id)) {
            const ach = AchievementChecker.getAchievement(id);
            if (ach) {
              useGameStore.getState().set({
                achievements: [...current.achievements, id],
                saldo: current.saldo + ach.premio,
              });
              this.showAchievementPopup(ach.emoji, ach.name, ach.premio);
            }
          }
        }

        if (result.fresasCount >= 3) {
          this.showDimOverlay();
          this.scene.launch(SCENES.BONUS, { fresasCount: result.fresasCount });
          this.scene.pause();
        } else if (result.freeSpinsTriggered) {
          this.triggerFreeSpinsVisuals(result.scatters, result.wildCount);
        } else if (current.mysteryBoxPendiente) {
          this.showDimOverlay();
          this.scene.launch(SCENES.MYSTERY);
          this.scene.pause();
        } else if (premio > 0 && !isFreeSpin) {
          this.showDimOverlay();
          this.scene.launch(SCENES.GAMBLE, { premio });
          this.scene.pause();
        } else {
          this.checkAutoSpin();
        }
      });
    } else {
      newState = Economy.applyLoss(newState);
      const nm = PaylineChecker.detectNearMiss(carretes, !!newState.upgrades.extraLine);
      if (nm) {
        this.nearMissSystem?.showNearMiss(carretes, !!newState.upgrades.extraLine);
        this.effectsManager?.flashScreen('purple');
        const breakPos = nm.linea[nm.posicion];
        if (breakPos && this.reelContainers[breakPos[0]]) {
          this.effectsManager?.shakeReel(this.reelContainers[breakPos[0]]);
          const container = this.reelContainers[breakPos[0]];
          const texts = container.list as Phaser.GameObjects.Text[];
          if (texts[breakPos[1]]) {
            this.effectsManager?.nearMissPulse(texts[breakPos[1]]);
          }
        }
      }
      useGameStore.getState().set(newState);
      this.updateHUD();
      SaveManager.save(newState);

      this.time.delayedCall(500, () => {
        useGameStore.getState().set({ girando: false });
        this.updateHUD();
        this.updateChallenges();
        if (result.freeSpinsTriggered) {
          this.triggerFreeSpinsVisuals(result.scatters, result.wildCount);
        } else if (nm && this.shakeNudge?.canActivate(true)) {
          this.shakeNudge.activate(
            () => { this.checkAutoSpin(); },
            (reelIdx: number) => { this.renderReel(reelIdx); },
          );
        } else if (!useGameStore.getState().autoSpin && !result.freeSpinsTriggered) {
          this.startFruitCatcher();
        } else {
          this.checkAutoSpin();
        }
      });
    }

    if (newState.winStreak >= 5) this.audioEngine.setLayer(3);
    else if (newState.winStreak >= 3) this.audioEngine.setLayer(2);
    else this.audioEngine.setLayer(1);

    this.updateHUD();
    SaveManager.save(useGameStore.getState());
  }

  private startSpinVisuals(): void {
    this.reelStoppedFlags = Array(REELS_COUNT).fill(false);
    this.reelGlows = Array(REELS_COUNT).fill(null);

    const goldColor = Phaser.Display.Color.HexStringToColor(COLORS.gold).color;

    // Per-reel glow trail
    for (let i = 0; i < REELS_COUNT; i++) {
      const trail = this.effectsManager?.reelGlowTrail(this.reelContainers[i]);
      if (trail) this.reelGlows[i] = trail;
    }

    // Container glow border during spin
    const totalW = REELS_COUNT * REEL_W + (REELS_COUNT - 1) * REEL_GAP + REEL_PAD * 2;
    const startX = (this.cameras.main.width - totalW) / 2 + REEL_PAD;
    this.reelsContainerGlow = this.add.rectangle(
      startX + totalW / 2 - REEL_PAD,
      120 + REEL_H / 2,
      totalW - REEL_PAD * 2,
      REEL_H + 8,
      goldColor,
      0.08,
    );
    this.reelsContainerGlow.setDepth(8);
    this.reelsContainerGlow.setStrokeStyle(2, goldColor, 0.3);
    this.tweens.add({
      targets: this.reelsContainerGlow,
      alpha: { from: 0.08, to: 0.2 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Per-reel glow + blur-like effect
    for (let i = 0; i < REELS_COUNT; i++) {
      const container = this.reelContainers[i];
      const glow = this.add.rectangle(
        container.x + REEL_W / 2,
        container.y + REEL_H / 2,
        REEL_W,
        REEL_H,
        goldColor,
        0.12,
      );
      glow.setDepth(15);
      this.reelGlows[i] = glow;

      this.tweens.add({
        targets: glow,
        alpha: { from: 0.08, to: 0.25 },
        duration: 350,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Slight horizontal jitter for motion blur effect
      this.tweens.add({
        targets: container,
        x: container.x + 2,
        duration: 50,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Rapid symbol cycling on spinning reels
    this.spinCycleTimer = this.time.addEvent({
      delay: 60,
      loop: true,
      callback: () => {
        for (let i = 0; i < REELS_COUNT; i++) {
          if (this.reelStoppedFlags[i]) continue;
          const container = this.reelContainers[i];
          const texts = container.list as Phaser.GameObjects.Text[];
          for (let j = 0; j < ROWS_COUNT; j++) {
            if (texts[j]) {
              const randomSym = this.rng.generateSymbol();
              texts[j].setText(randomSym.emoji);
              texts[j].setAlpha(0.5 + Math.random() * 0.4);
            }
          }
        }
      },
    });

    // Spin button rotation
    this.spinBtnTween = this.tweens.add({
      targets: this.spinBtn,
      angle: 360,
      duration: 1000,
      repeat: -1,
      ease: 'Linear',
    });
  }

  private onReelStopVisual(reelIdx: number): void {
    this.reelStoppedFlags[reelIdx] = true;

    // Render final symbols
    this.renderReel(reelIdx);

    const container = this.reelContainers[reelIdx];
    const texts = container.list as Phaser.GameObjects.Text[];

    // Reset alpha + symbol entry animation
    for (let j = 0; j < ROWS_COUNT; j++) {
      if (texts[j]) {
        texts[j].setAlpha(1);
        texts[j].setScale(0.5);
        texts[j].setY(j * SYM_H + SYM_H / 2 + 10);
        this.tweens.add({
          targets: texts[j],
          scale: 1,
          y: j * SYM_H + SYM_H / 2,
          duration: 300,
          ease: 'Back.easeOut',
        });
      }
    }

    // Bounce tween on container
    this.tweens.add({
      targets: container,
      scaleY: { from: 0.85, to: 1.05 },
      duration: 250,
      yoyo: true,
      ease: 'Bounce.easeOut',
      onComplete: () => { container.setScale(1, 1); },
    });

    // Reel stop flash
    const goldColor = Phaser.Display.Color.HexStringToColor(COLORS.gold).color;
    const flash = this.add.rectangle(
      container.x + REEL_W / 2,
      container.y + REEL_H / 2,
      REEL_W * 0.8,
      REEL_H * 0.8,
      goldColor,
      0.4,
    );
    flash.setDepth(25);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.2,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });

    // Fade out glow for this reel
    if (this.reelGlows[reelIdx]) {
      this.tweens.add({
        targets: this.reelGlows[reelIdx],
        alpha: 0,
        duration: 300,
        onComplete: () => this.reelGlows[reelIdx]?.destroy(),
      });
    }

    // Audio + haptics — ascending pitch per reel
    this.audioEngine.reelStopSfx(reelIdx);
    this.audioEngine.vibrate(15 + reelIdx * 3);

    // Anticipation: when 4th reel (idx 3) stops, check first 4 for potential big win
    if (reelIdx === 3) {
      const grid = this.reelEngine.getGrid();
      if (this.checkAnticipationFromReels(grid.slice(0, 4))) {
        // Highlight reel 5 (idx 4) with gold glow + pulse
        const reel4Container = this.reelContainers[4];
        const anticipationGlow = this.add.rectangle(
          reel4Container.x + REEL_W / 2,
          reel4Container.y + REEL_H / 2,
          REEL_W + 6,
          REEL_H + 6,
          goldColor,
          0.15,
        );
        anticipationGlow.setDepth(9);
        anticipationGlow.setStrokeStyle(3, goldColor, 0.6);
        this.tweens.add({
          targets: anticipationGlow,
          alpha: { from: 0.1, to: 0.4 },
          duration: 200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        // Store on the glow slot so it gets cleaned up
        this.reelGlows[4] = anticipationGlow;
        // Play tense track
        this.audioEngine.playTenseTrack();
      }
    }
  }

  private stopSpinVisuals(): void {
    if (this.spinCycleTimer) {
      this.spinCycleTimer.remove();
      this.spinCycleTimer = null;
    }

    if (this.spinBtnTween) {
      this.spinBtnTween.stop();
      this.spinBtnTween = null;
      this.spinBtn.setAngle(0);
    }

    // Clean up glows
    for (let i = 0; i < this.reelGlows.length; i++) {
      if (this.reelGlows[i]) {
        this.reelGlows[i]?.destroy();
        this.reelGlows[i] = null;
      }
    }
    this.reelGlows = [];

    // Clean up container glow
    if (this.reelsContainerGlow) {
      this.reelsContainerGlow.destroy();
      this.reelsContainerGlow = null;
    }

    // Reset all containers
    for (let i = 0; i < REELS_COUNT; i++) {
      const container = this.reelContainers[i];
      container.setScale(1, 1);
      // Reset x position (in case jitter left it offset)
      const totalW = REELS_COUNT * REEL_W + (REELS_COUNT - 1) * REEL_GAP + REEL_PAD * 2;
      const startX = (this.cameras.main.width - totalW) / 2 + REEL_PAD;
      container.x = startX + i * (REEL_W + REEL_GAP);
      // Reset symbol alpha
      const texts = container.list as Phaser.GameObjects.Text[];
      for (let j = 0; j < ROWS_COUNT; j++) {
        if (texts[j]) {
          texts[j].setAlpha(1);
          texts[j].setScale(1);
          texts[j].setY(j * SYM_H + SYM_H / 2);
        }
      }
    }
  }

  private checkAnticipationFromReels(reels: SymbolConfig[][]): boolean {
    for (let fila = 0; fila < ROWS_COUNT; fila++) {
      const counts: Record<string, number> = {};
      for (let r = 0; r < reels.length; r++) {
        const sym = reels[r]?.[fila];
        if (sym) {
          counts[sym.nombre] = (counts[sym.nombre] || 0) + 1;
        }
      }
      for (const n in counts) {
        if (counts[n] >= 3) return true;
      }
    }
    return false;
  }

  private highlightWins(resultados: any[]): void {
    this.winLineGraphics.clear();
    const goldColor = Phaser.Display.Color.HexStringToColor(COLORS.gold).color;
    const totalW = REELS_COUNT * REEL_W + (REELS_COUNT - 1) * REEL_GAP + REEL_PAD * 2;
    const startX = (this.cameras.main.width - totalW) / 2 + REEL_PAD;
    const startY = 120;

    for (let ri = 0; ri < resultados.length; ri++) {
      const res = resultados[ri];
      const linePoints: { x: number; y: number }[] = [];
      const winningContainers = new Set<number>();

      for (const [r, f] of res.linea.slice(0, res.cantidad)) {
        const container = this.reelContainers[r];
        if (container) {
          winningContainers.add(r);
          const cx = container.x + REEL_W / 2;
          const cy = container.y + f * SYM_H + SYM_H / 2;
          linePoints.push({ x: cx, y: cy });

          const text = container.list[f] as Phaser.GameObjects.Text;
          if (text) {
            // Determine rarity color based on symbol weight
            const sym = res.simbolo;
            let rarityColor = goldColor;
            if (sym.wild) {
              rarityColor = Phaser.Display.Color.HexStringToColor(RARITY_COLORS.legendary).color;
            } else if (sym.scatter) {
              rarityColor = Phaser.Display.Color.HexStringToColor(RARITY_COLORS.epic).color;
            } else if (sym.peso <= 7) {
              rarityColor = Phaser.Display.Color.HexStringToColor(RARITY_COLORS.rare).color;
            }

            this.tweens.add({
              targets: text,
              scale: 1.35,
              duration: 250,
              yoyo: true,
              repeat: 3,
              ease: 'Sine.easeInOut',
            });
            this.effectsManager?.glowPulse(text, rarityColor, 600);
            this.effectsManager?.particleBurst(cx, cy, 12, {
              colors: [rarityColor, Phaser.Display.Color.HexStringToColor(COLORS.cocktail).color, 0xffffff],
              speed: 6,
              size: 5,
            });
          }
        }
      }

      if (res.premio && res.premio > 0 && linePoints.length > 0) {
        const midIdx = Math.floor(linePoints.length / 2);
        const midPoint = linePoints[midIdx];
        this.effectsManager?.floatingScore(midPoint.x, midPoint.y - 20, `+${res.premio}🪙`);
      }

      for (const r of winningContainers) {
        const container = this.reelContainers[r];
        if (container) {
          this.tweens.add({
            targets: container,
            scaleX: 1.08,
            scaleY: 1.08,
            duration: 200,
            yoyo: true,
            repeat: 2,
          });
        }
      }

      if (linePoints.length >= 2 && this.effectsManager) {
        this.effectsManager.drawWinLine(linePoints, goldColor, ri * 150);
      }
    }

    this.time.delayedCall(3000, () => {
      this.winLineGraphics.clear();
    });
  }

  private showJackpotEffects(): void {
    this.audioEngine.sfx('jackpot');
    this.audioEngine.vibrate([50, 30, 50, 30, 50, 30, 100]);

    this.cameras.main.shake(600, 0.025);
    this.cameras.main.flash(400, 255, 215, 0);

    this.effectsManager?.flashScreen('gold');
    this.effectsManager?.lightning();
    this.effectsManager?.jackpotZoom();
    this.effectsManager?.setVignette('jackpot');
    this.effectsManager?.confetti(30);

    const goldColor = Phaser.Display.Color.HexStringToColor(COLORS.gold).color;

    const flash = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      goldColor,
      0.6,
    );
    flash.setDepth(100);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 1000,
      onComplete: () => flash.destroy(),
    });

    this.effectsManager?.jackpotLightRays();

    this.tweens.add({
      targets: this.jackpotText,
      scale: 2.5,
      duration: 400,
      yoyo: true,
      repeat: 1,
      ease: 'Back.easeOut',
      onComplete: () => this.jackpotText.setScale(1).setOrigin(0.5, 0),
    });

    this.effectsManager?.coinShower(50, 2500);
    this.effectsManager?.radialBurst(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      goldColor,
      400,
    );
  }

  private triggerFreeSpinsVisuals(scatters: number, _wildCount: number): void {
    const current = useGameStore.getState();
    const isScatter = scatters >= 3;
    const spins = isScatter
      ? BALANCE.freeSpinsBaseCount + scatters
      : BALANCE.freeSpinsBaseCount;

    const updated = Economy.triggerFreeSpins(current, spins, isScatter);
    useGameStore.getState().set(updated);
    this.updateHUD();
    SaveManager.save(updated);

    this.audioEngine.sfx('freeSpins');
    this.audioEngine.vibrate([50, 30, 50, 30, 100]);

    this.highlightScatters();
    this.showFreeSpinsBanner(spins);
    this.flashPurple();

    this.time.delayedCall(1500, () => {
      this.checkAutoSpin();
    });
  }

  private highlightScatters(): void {
    const grid = this.reelEngine.getGrid();
    for (let r = 0; r < REELS_COUNT; r++) {
      for (let f = 0; f < ROWS_COUNT; f++) {
        if (grid[r][f].scatter) {
          const container = this.reelContainers[r];
          const text = container.list[f] as Phaser.GameObjects.Text;
          this.tweens.add({
            targets: text,
            scaleX: 1.4,
            scaleY: 1.4,
            duration: 300,
            yoyo: true,
            repeat: 3,
            onComplete: () => text.setScale(1),
          });
        }
      }
    }
  }

  private showFreeSpinsBanner(spins: number): void {
    this.freeSpinsBanner.setText(
      `🎰 FREE SPINS: ${spins} (x${BALANCE.freeSpinsMultiplier})`,
    );
    this.freeSpinsBanner.setVisible(true);
    this.freeSpinsBanner.setScale(0);
    this.freeSpinsBanner.setAlpha(0);
    this.tweens.add({
      targets: this.freeSpinsBanner,
      scale: 1,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });
  }

  private flashPurple(): void {
    const flash = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      Phaser.Display.Color.HexStringToColor(COLORS.purple).color,
      0.4,
    );
    flash.setDepth(100);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 600,
      onComplete: () => flash.destroy(),
    });
  }

  private startFruitCatcher(): void {
    this.fruitCatcher = new FruitCatcher(this, this.audioEngine);
    this.fruitCatcher.start(() => {
      this.fruitCatcher = null;
      this.checkAutoSpin();
    });
  }

  private nudgeReel(idx: number): void {
    if (!this.nudgeEnabled) return;
    this.nudgesUsed++;
    this.nudgeEnabled = false;
    this.reelEngine.nudgeReel(idx);
    this.renderReel(idx);
    this.audioEngine.sfx('nudge');
    this.audioEngine.vibrate(30);

    const maxNudges = useGameStore.getState().upgrades.nudgePro ? 2 : 1;
    if (this.nudgesUsed < maxNudges) {
      this.time.delayedCall(300, () => { this.nudgeEnabled = true; });
    }
  }

  private showAchievementPopup(emoji: string, name: string, premio: number): void {
    const { width } = this.cameras.main;
    const bannerY = -60;
    const finalY = 60;

    const banner = this.add.container(width / 2, bannerY).setDepth(120);

    const bg = this.add.rectangle(0, 0, 400, 50,
      Phaser.Display.Color.HexStringToColor(COLORS.surface).color, 0.95);
    bg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.gold).color);
    banner.add(bg);

    const icon = this.add.text(-170, 0, emoji, { fontSize: '24px' }).setOrigin(0.5);
    banner.add(icon);

    const label = this.add.text(-130, -8, '🏆 Logro desbloqueado!', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '12px', color: COLORS.gold,
    }).setOrigin(0, 0.5);
    banner.add(label);

    const achName = this.add.text(-130, 10, `${name} +${premio}🪙`, {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: COLORS.text,
    }).setOrigin(0, 0.5);
    banner.add(achName);

    this.audioEngine.sfx('coin');
    this.audioEngine.vibrate([30, 20, 30]);

    this.tweens.add({
      targets: banner,
      y: finalY,
      duration: 500,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 2000,
      onComplete: () => banner.destroy(),
    });
  }

  private checkAutoSpin(): void {
    const s = useGameStore.getState();
    if (s.freeSpins > 0) {
      this.time.delayedCall(500, () => {
        const cur = useGameStore.getState();
        if (cur.freeSpins > 0 && !cur.girando && !cur.enBono && !cur.enGamble) this.doSpin();
      });
    } else if (s.autoSpin && s.saldo >= s.apuestaActual) {
      this.time.delayedCall(500, () => {
        const cur = useGameStore.getState();
        if (cur.autoSpin && !cur.girando && !cur.enBono && !cur.enGamble) this.doSpin();
      });
    } else if (s.autoSpin && s.saldo < s.apuestaActual) {
      useGameStore.getState().set({ autoSpin: false });
      this.updateHUD();
    }
  }

  private updateChallenges(): void {
    const s = useGameStore.getState();
    if (!s.challenges || s.challenges.length === 0) return;
    const updated = ChallengeChecker.checkCompletion(s, s.challenges as ActiveChallenge[]);
    if (JSON.stringify(updated) !== JSON.stringify(s.challenges)) {
      useGameStore.getState().set({ challenges: updated });
      SaveManager.save(useGameStore.getState());
    }
  }

  shutdown(): void {
    if (this.fruitGarden) this.fruitGarden.stop();
    if (this.fruitCatcher) this.fruitCatcher.stop();
    if (this.tapCombo) this.tapCombo.destroy();
    if (this.shakeNudge) this.shakeNudge.destroy();
    if (this.guideSystem) this.guideSystem.destroy();
    if (this.nearMissSystem) this.nearMissSystem.destroy();
    if (this.inputManager) this.inputManager.destroy();
    if (this.effectsManager) this.effectsManager.destroy();
    if (this.spinBtnGlow) this.spinBtnGlow.destroy();
    if (this.dimOverlay) this.dimOverlay.destroy();
    this.events.off('resume');
    this.audioEngine.destroy();
  }
}
