import Phaser from 'phaser';
import { SCENES } from '@config/phaser.config';
import { COLORS, BALANCE } from '@config/balance';
import { useGameStore } from '@store/gameStore';
import { SaveManager } from '@store/SaveManager';
import { AudioEngine } from '@audio/AudioEngine';
import { Economy } from '@systems/Economy';
import { SIMBOLOS } from '@config/symbols';
import { ACHIEVEMENTS_DATA } from '@config/achievements';
import { UPGRADES_DATA } from '@config/upgrades';
import { ChallengeChecker, type ActiveChallenge } from '@systems/ChallengeChecker';

export type InfoTab = 'deposit' | 'paytable' | 'upgrades' | 'achievements' | 'stats' | 'challenges' | 'settings';

export class InfoScene extends Phaser.Scene {
  private audioEngine: AudioEngine = new AudioEngine();
  private tab: InfoTab = 'deposit';
  private container: Phaser.GameObjects.Container = null!;
  private backdrop: Phaser.GameObjects.Rectangle = null!;

  constructor() {
    super({ key: SCENES.INFO });
  }

  init(data: { tab: InfoTab }): void {
    this.tab = data.tab ?? 'deposit';
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.audioEngine.init();

    this.backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    this.backdrop.setDepth(90);

    this.container = this.add.container(0, 0).setDepth(100);

    const panelW = 900;
    const panelH = 600;
    const panelX = (width - panelW) / 2;
    const panelY = (height - panelH) / 2;

    const panel = this.add.rectangle(width / 2, height / 2, panelW, panelH, Phaser.Display.Color.HexStringToColor(COLORS.surface).color, 0.95);
    panel.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.gold).color);
    this.container.add(panel);

    const title = this.add.text(width / 2, panelY + 30, this.getTitle(), {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '24px',
      color: COLORS.gold,
    }).setOrigin(0.5);
    this.container.add(title);

    const closeBtn = this.add.text(panelX + panelW - 30, panelY + 30, '✕', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: COLORS.red,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.close());
    this.container.add(closeBtn);

    this.input.keyboard?.on('keydown-ESC', () => this.close());

    const contentY = panelY + 70;
    const contentH = panelH - 90;

    switch (this.tab) {
      case 'deposit': this.renderDeposit(panelX, contentY, panelW, contentH); break;
      case 'paytable': this.renderPaytable(panelX, contentY, panelW, contentH); break;
      case 'upgrades': this.renderUpgrades(panelX, contentY, panelW, contentH); break;
      case 'achievements': this.renderAchievements(panelX, contentY, panelW, contentH); break;
      case 'stats': this.renderStats(panelX, contentY, panelW, contentH); break;
      case 'challenges': this.renderChallenges(panelX, contentY, panelW, contentH); break;
      case 'settings': this.renderSettings(panelX, contentY, panelW, contentH); break;
    }
  }

  private getTitle(): string {
    const titles: Record<InfoTab, string> = {
      deposit: '💰 Cargar Saldo',
      paytable: '📋 Tabla de Pagos',
      upgrades: '🛒 Tienda de Upgrades',
      achievements: '🏆 Logros',
      stats: '📊 Estadísticas',
      challenges: '🎯 Retos Diarios',
      settings: '⚙️ Configuración',
    };
    return titles[this.tab];
  }

  private renderDeposit(panelX: number, y: number, _w: number, _h: number): void {
    const state = useGameStore.getState();
    const balanceText = this.add.text(this.cameras.main.width / 2, y + 10, `Saldo actual: ${state.saldo.toLocaleString()} 🪙`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: COLORS.green,
    }).setOrigin(0.5);
    this.container.add(balanceText);

    const packs = BALANCE.depositPacks;
    let px = panelX + 40;
    const py = y + 60;
    for (const pack of packs) {
      const cardW = 120;
      const cardH = 100;
      const card = this.add.rectangle(px + cardW / 2, py + cardH / 2, cardW, cardH,
        pack.popular ? Phaser.Display.Color.HexStringToColor(COLORS.gold).color : Phaser.Display.Color.HexStringToColor(COLORS.reel).color,
        0.9);
      card.setStrokeStyle(2, pack.popular ? Phaser.Display.Color.HexStringToColor(COLORS.purple).color : Phaser.Display.Color.HexStringToColor(COLORS.surface).color);
      this.container.add(card);

      const icon = this.add.text(px + cardW / 2, py + 15, pack.icon, { fontSize: '28px' }).setOrigin(0.5);
      this.container.add(icon);

      const label = this.add.text(px + cardW / 2, py + 50, pack.label, {
        fontFamily: 'Arial Black, sans-serif', fontSize: '16px', color: COLORS.text,
      }).setOrigin(0.5);
      this.container.add(label);

      if (pack.bonus > 0) {
        const bonus = this.add.text(px + cardW / 2, py + 70, `+${pack.bonus} bonus`, {
          fontFamily: 'Arial, sans-serif', fontSize: '12px', color: COLORS.green,
        }).setOrigin(0.5);
        this.container.add(bonus);
      }

      if (pack.popular) {
        const star = this.add.text(px + cardW / 2, py - 5, '⭐ POPULAR', {
          fontFamily: 'Arial, sans-serif', fontSize: '10px', color: COLORS.purple,
        }).setOrigin(0.5);
        this.container.add(star);
      }

      card.setInteractive({ useHandCursor: true });
      card.on('pointerdown', () => this.doDeposit(pack.amount + pack.bonus));

      px += cardW + 20;
    }

    const info = this.add.text(this.cameras.main.width / 2, py + 130, 'ℹ️ Modo demo — montos virtuales', {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: COLORS.muted,
    }).setOrigin(0.5);
    this.container.add(info);

    const customLabel = this.add.text(this.cameras.main.width / 2, py + 165, 'Monto personalizado:', {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: COLORS.text,
    }).setOrigin(0.5);
    this.container.add(customLabel);

    const inputBg = this.add.rectangle(this.cameras.main.width / 2 - 60, py + 195, 200, 32,
      Phaser.Display.Color.HexStringToColor(COLORS.reel).color, 0.9);
    inputBg.setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(COLORS.gold).color);
    this.container.add(inputBg);

    const inputText = this.add.text(this.cameras.main.width / 2 - 150, py + 188, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: COLORS.text,
    });
    this.container.add(inputText);

    const cursor = this.add.text(this.cameras.main.width / 2 - 150, py + 188, '|', {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: COLORS.gold,
    }).setVisible(false);
    this.container.add(cursor);

    let customAmount = '';
    let inputActive = false;
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (!inputActive) return;
      if (event.key === 'Backspace') {
        customAmount = customAmount.slice(0, -1);
      } else if (event.key === 'Enter') {
        inputActive = false;
        cursor.setVisible(false);
        const val = parseInt(customAmount, 10);
        if (val >= 1 && val <= 999999) {
          this.doDeposit(val);
        }
      } else if (/^[0-9]$/.test(event.key) && customAmount.length < 6) {
        customAmount += event.key;
      }
      inputText.setText(customAmount);
    });
    inputBg.setInteractive({ useHandCursor: true });
    inputBg.on('pointerdown', () => {
      inputActive = true;
      cursor.setVisible(true);
    });

    const loadBtn = this.add.text(this.cameras.main.width / 2 + 60, py + 188, 'Cargar', {
      fontFamily: 'Arial, sans-serif', fontSize: '14px',
      color: COLORS.text, backgroundColor: COLORS.green,
      padding: { x: 16, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    loadBtn.on('pointerdown', () => {
      const val = parseInt(customAmount, 10);
      if (val >= 1 && val <= 999999) {
        inputActive = false;
        cursor.setVisible(false);
        this.doDeposit(val);
      }
    });
    this.container.add(loadBtn);
  }

  private doDeposit(amount: number): void {
    const s = useGameStore.getState();
    const newState = {
      ...s,
      saldo: s.saldo + amount,
      stats: { ...s.stats, totalDeposited: s.stats.totalDeposited + amount },
    };
    useGameStore.getState().set(newState);
    SaveManager.save(newState);
    this.audioEngine.sfx('coin');
    this.audioEngine.vibrate([30, 20, 30]);
    this.showToast(`+${amount.toLocaleString()} 🪙 cargados!`);
    this.scene.restart();
  }

  private renderPaytable(panelX: number, y: number, _w: number, _h: number): void {
    let cx = panelX + 30;
    let cy = y + 10;
    for (const sym of SIMBOLOS) {
      const cardW = 130;
      const cardH = 110;
      const card = this.add.rectangle(cx + cardW / 2, cy + cardH / 2, cardW, cardH,
        Phaser.Display.Color.HexStringToColor(COLORS.reel).color, 0.9);
      card.setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(COLORS.surface).color);
      this.container.add(card);

      const emoji = this.add.text(cx + cardW / 2, cy + 15, sym.emoji, { fontSize: '32px' }).setOrigin(0.5);
      this.container.add(emoji);

      const name = this.add.text(cx + cardW / 2, cy + 50, sym.nombre, {
        fontFamily: 'Arial, sans-serif', fontSize: '12px', color: COLORS.text,
      }).setOrigin(0.5);
      this.container.add(name);

      const mults = Object.entries(sym.mult).map(([k, v]) => `x${k}:${v}`).join(' ');
      const multText = this.add.text(cx + cardW / 2, cy + 75, mults, {
        fontFamily: 'Arial, sans-serif', fontSize: '10px', color: COLORS.gold,
      }).setOrigin(0.5);
      this.container.add(multText);

      let tag = '';
      if (sym.wild) tag = 'WILD';
      else if (sym.scatter) tag = 'SCATTER';
      else if (sym.bonus) tag = 'BONUS';
      if (tag) {
        const tagText = this.add.text(cx + cardW / 2, cy + 95, tag, {
          fontFamily: 'Arial Black, sans-serif', fontSize: '9px', color: COLORS.purple,
        }).setOrigin(0.5);
        this.container.add(tagText);
      }

      cx += cardW + 10;
      if (cx > panelX + 800) {
        cx = panelX + 30;
        cy += cardH + 10;
      }
    }
  }

  private renderUpgrades(panelX: number, y: number, _w: number, _h: number): void {
    const state = useGameStore.getState();
    let uy = y + 10;
    for (const upg of UPGRADES_DATA) {
      const purchased = !!state.upgrades[upg.key as keyof typeof state.upgrades];
      const affordable = state.saldo >= upg.costo && !purchased;

      const row = this.add.rectangle(panelX + 400, uy + 18, 820, 36,
        Phaser.Display.Color.HexStringToColor(COLORS.reel).color, 0.8);
      this.container.add(row);

      const icon = this.add.text(panelX + 20, uy + 8, upg.icon, { fontSize: '20px' });
      this.container.add(icon);

      const name = this.add.text(panelX + 55, uy + 5, upg.name, {
        fontFamily: 'Arial, sans-serif', fontSize: '14px', color: COLORS.text,
      });
      this.container.add(name);

      const desc = this.add.text(panelX + 55, uy + 22, upg.desc, {
        fontFamily: 'Arial, sans-serif', fontSize: '11px', color: COLORS.muted,
      });
      this.container.add(desc);

      if (purchased) {
        const check = this.add.text(panelX + 760, uy + 8, '✓', {
          fontFamily: 'Arial Black, sans-serif', fontSize: '18px', color: COLORS.green,
        }).setOrigin(0.5);
        this.container.add(check);
      } else {
        const price = this.add.text(panelX + 720, uy + 12, `${upg.costo}🪙`, {
          fontFamily: 'Arial, sans-serif', fontSize: '13px',
          color: affordable ? COLORS.green : COLORS.red,
        }).setOrigin(0.5);
        this.container.add(price);

        if (affordable) {
          const buyBtn = this.add.text(panelX + 800, uy + 12, 'Comprar', {
            fontFamily: 'Arial, sans-serif', fontSize: '12px',
            color: COLORS.text, backgroundColor: COLORS.green,
            padding: { x: 10, y: 4 },
          }).setOrigin(0.5).setInteractive({ useHandCursor: true });
          buyBtn.on('pointerdown', () => this.buyUpgrade(upg.key));
          this.container.add(buyBtn);
        }
      }

      uy += 40;
    }
  }

  private buyUpgrade(key: string): void {
    const s = useGameStore.getState();
    const upg = UPGRADES_DATA.find((u) => u.key === key);
    if (!upg || s.saldo < upg.costo) return;
    const newState = {
      ...s,
      saldo: s.saldo - upg.costo,
      upgrades: { ...s.upgrades, [key]: true },
    };
    useGameStore.getState().set(newState);
    SaveManager.save(newState);
    this.audioEngine.sfx('coin');
    this.audioEngine.vibrate(30);
    this.showToast(`${upg.icon} ${upg.name} comprado!`);
    this.scene.restart();
  }

  private renderAchievements(panelX: number, y: number, _w: number, _h: number): void {
    const state = useGameStore.getState();
    let ay = y + 10;
    for (const ach of ACHIEVEMENTS_DATA) {
      const unlocked = state.achievements.includes(ach.id);

      const row = this.add.rectangle(panelX + 400, ay + 18, 820, 36,
        Phaser.Display.Color.HexStringToColor(COLORS.reel).color, 0.8);
      this.container.add(row);

      const emoji = this.add.text(panelX + 20, ay + 8, unlocked ? ach.emoji : '🔒', { fontSize: '20px' });
      this.container.add(emoji);

      const name = this.add.text(panelX + 55, ay + 5, ach.name, {
        fontFamily: 'Arial, sans-serif', fontSize: '14px',
        color: unlocked ? COLORS.gold : COLORS.muted,
      });
      this.container.add(name);

      const desc = this.add.text(panelX + 55, ay + 22, ach.desc, {
        fontFamily: 'Arial, sans-serif', fontSize: '11px', color: COLORS.muted,
      });
      this.container.add(desc);

      const reward = this.add.text(panelX + 760, ay + 12, `${ach.premio}🪙`, {
        fontFamily: 'Arial, sans-serif', fontSize: '13px',
        color: unlocked ? COLORS.green : COLORS.muted,
      }).setOrigin(0.5);
      this.container.add(reward);

      ay += 40;
    }
  }

  private renderStats(panelX: number, y: number, _w: number, _h: number): void {
    const s = useGameStore.getState();
    const rtp = s.stats.totalBet > 0
      ? ((s.stats.totalWon / s.stats.totalBet) * 100).toFixed(1)
      : '0.0';

    const sections: { title: string; items: [string, string][] }[] = [
      {
        title: '📈 Resumen',
        items: [
          ['Saldo', `${s.saldo.toLocaleString()} 🪙`],
          ['High Score', `${s.highScore.toLocaleString()} 🪙`],
          ['Nivel', `${s.nivel}`],
          ['EXP Total', `${s.expTotal.toLocaleString()}`],
          ['Prestigio', `${s.prestigio} (x${s.prestigeMult.toFixed(1)})`],
        ],
      },
      {
        title: '🎰 Giros',
        items: [
          ['Total giros', `${s.stats.totalSpins}`],
          ['Premios', `${s.stats.totalWins}`],
          ['Apostado', `${s.stats.totalBet.toLocaleString()}`],
          ['Ganado', `${s.stats.totalWon.toLocaleString()}`],
          ['RTP', `${rtp}%`],
        ],
      },
      {
        title: '🎲 Bonos & Gamble',
        items: [
          ['Bonos jugados', `${s.stats.bonosTriggered}`],
          ['Gamble W/L', `${s.stats.gambleWins}/${s.stats.gambleLosses}`],
          ['Jackpots', `${s.stats.jackpots}`],
          ['Mayor premio', `${s.stats.biggestWin.toLocaleString()}`],
          ['Mejor racha', `${s.stats.bestStreak}`],
        ],
      },
      {
        title: '✨ Features',
        items: [
          ['Scatters', `${s.stats.scatterTriggered}`],
          ['Free spins', `${s.stats.freeSpinsWon}`],
          ['Prestigios', `${s.stats.prestiges}`],
          ['Frutas atrapadas', `${s.stats.fruitsCaught}`],
          ['Login streak', `${s.loginStreak} días`],
        ],
      },
    ];

    let sy = y + 10;
    for (const section of sections) {
      const title = this.add.text(panelX + 20, sy, section.title, {
        fontFamily: 'Arial Black, sans-serif', fontSize: '16px', color: COLORS.gold,
      });
      this.container.add(title);
      sy += 25;

      for (const [label, value] of section.items) {
        const l = this.add.text(panelX + 30, sy, label, {
          fontFamily: 'Arial, sans-serif', fontSize: '13px', color: COLORS.muted,
        });
        this.container.add(l);

        const v = this.add.text(panelX + 400, sy, value, {
          fontFamily: 'Arial, sans-serif', fontSize: '13px', color: COLORS.text,
        });
        this.container.add(v);
        sy += 20;
      }
      sy += 10;
    }

    if (Economy.canPrestige(s)) {
      const prestigeBtn = this.add.text(this.cameras.main.width / 2, sy + 20, '⭐ PRESTIGIO ⭐', {
        fontFamily: 'Arial Black, sans-serif', fontSize: '18px',
        color: COLORS.text, backgroundColor: COLORS.purple,
        padding: { x: 24, y: 10 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      prestigeBtn.on('pointerdown', () => {
        const cur = useGameStore.getState();
        const updated = Economy.doPrestige(cur);
        useGameStore.getState().set(updated);
        SaveManager.save(updated);
        this.audioEngine.sfx('prestige');
        this.audioEngine.vibrate([50, 30, 50, 30, 50, 30, 100]);
        this.scene.restart();
      });
      this.container.add(prestigeBtn);
    }
  }

  private renderChallenges(panelX: number, y: number, _w: number, _h: number): void {
    const s = useGameStore.getState();
    const challenges = (s.challenges || []) as ActiveChallenge[];

    if (challenges.length === 0) {
      const empty = this.add.text(this.cameras.main.width / 2, y + 50, 'No hay retos activos. Vuelve más tarde.', {
        fontFamily: 'Arial, sans-serif', fontSize: '16px', color: COLORS.muted,
      }).setOrigin(0.5);
      this.container.add(empty);
      return;
    }

    let cy = y + 10;
    for (const ch of challenges) {
      const row = this.add.rectangle(panelX + 400, cy + 30, 820, 60,
        Phaser.Display.Color.HexStringToColor(COLORS.reel).color, 0.8);
      this.container.add(row);

      const icon = this.add.text(panelX + 20, cy + 10, ch.icon, { fontSize: '24px' });
      this.container.add(icon);

      const name = this.add.text(panelX + 60, cy + 5, ch.name, {
        fontFamily: 'Arial, sans-serif', fontSize: '14px', color: COLORS.text,
      });
      this.container.add(name);

      const desc = this.add.text(panelX + 60, cy + 25, ch.desc, {
        fontFamily: 'Arial, sans-serif', fontSize: '11px', color: COLORS.muted,
      });
      this.container.add(desc);

      const progressPct = ChallengeChecker.getProgress(s, ch);
      const barW = 200;
      const barBg = this.add.rectangle(panelX + 500, cy + 20, barW, 8, Phaser.Display.Color.HexStringToColor(COLORS.surface).color);
      this.container.add(barBg);

      const barFill = this.add.rectangle(panelX + 500 - barW / 2, cy + 20, barW * (progressPct / 100), 8,
        ch.completed ? Phaser.Display.Color.HexStringToColor(COLORS.green).color : Phaser.Display.Color.HexStringToColor(COLORS.gold).color,
      ).setOrigin(0, 0.5);
      this.container.add(barFill);

      const progressText = this.add.text(panelX + 500, cy + 35, `${Math.floor(progressPct)}%`, {
        fontFamily: 'Arial, sans-serif', fontSize: '11px', color: COLORS.muted,
      }).setOrigin(0.5);
      this.container.add(progressText);

      const reward = this.add.text(panelX + 750, cy + 20, `${ch.reward}🪙`, {
        fontFamily: 'Arial, sans-serif', fontSize: '14px', color: COLORS.green,
      }).setOrigin(0.5);
      this.container.add(reward);

      if (ch.claimed) {
        const claimed = this.add.text(panelX + 800, cy + 20, '✅', { fontSize: '20px' }).setOrigin(0.5);
        this.container.add(claimed);
      } else if (ch.completed) {
        const claimBtn = this.add.text(panelX + 800, cy + 20, 'Reclamar', {
          fontFamily: 'Arial, sans-serif', fontSize: '12px',
          color: COLORS.text, backgroundColor: COLORS.green,
          padding: { x: 10, y: 4 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        claimBtn.on('pointerdown', () => this.claimChallenge(ch));
        this.container.add(claimBtn);
      } else {
        const pending = this.add.text(panelX + 800, cy + 20, '⏳', { fontSize: '20px' }).setOrigin(0.5);
        this.container.add(pending);
      }

      cy += 70;
    }
  }

  private claimChallenge(ch: ActiveChallenge): void {
    const s = useGameStore.getState();
    const updated = (s.challenges as ActiveChallenge[]).map((c) =>
      c.id === ch.id ? { ...c, claimed: true } : c,
    );
    const newState = {
      ...s,
      saldo: s.saldo + ch.reward,
      challenges: updated,
      stats: { ...s.stats, challengesCompleted: s.stats.challengesCompleted + 1 },
    };
    useGameStore.getState().set(newState);
    SaveManager.save(newState);
    this.audioEngine.sfx('coin');
    this.audioEngine.vibrate([30, 20, 30]);
    this.showToast(`${ch.icon} ${ch.reward}🪙 reclamados!`);
    this.scene.restart();
  }

  private renderSettings(panelX: number, y: number, _w: number, _h: number): void {
    const s = useGameStore.getState();
    const cx = this.cameras.main.width / 2;

    const volLabel = this.add.text(panelX + 20, y + 10, '🔊 Volumen', {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: COLORS.text,
    });
    this.container.add(volLabel);

    const volValue = this.add.text(panelX + 700, y + 10, `${s.volume}`, {
      fontFamily: 'Arial Black, sans-serif', fontSize: '16px', color: COLORS.gold,
    }).setOrigin(0.5);
    this.container.add(volValue);

    const barW = 500;
    const barBg = this.add.rectangle(cx, y + 45, barW, 16, Phaser.Display.Color.HexStringToColor(COLORS.reel).color);
    barBg.setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(COLORS.surface).color);
    this.container.add(barBg);

    const barFill = this.add.rectangle(cx - barW / 2, y + 45, barW * (s.volume / 100), 16,
      Phaser.Display.Color.HexStringToColor(COLORS.gold).color,
    ).setOrigin(0, 0.5);
    this.container.add(barFill);

    const minusBtn = this.add.text(panelX + 40, y + 45, '−', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '24px', color: COLORS.text,
      backgroundColor: COLORS.surface, padding: { x: 12, y: 4 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    minusBtn.on('pointerdown', () => this.changeVolume(-10));
    this.container.add(minusBtn);

    const plusBtn = this.add.text(panelX + 760, y + 45, '+', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '24px', color: COLORS.text,
      backgroundColor: COLORS.surface, padding: { x: 12, y: 4 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    plusBtn.on('pointerdown', () => this.changeVolume(10));
    this.container.add(plusBtn);

    const audioLabel = this.add.text(panelX + 20, y + 90, '🎵 Audio', {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: COLORS.text,
    });
    this.container.add(audioLabel);

    const audioEnabled = s.volume > 0;
    const audioBtn = this.add.text(panelX + 700, y + 95, audioEnabled ? 'ON ✅' : 'OFF ❌', {
      fontFamily: 'Arial, sans-serif', fontSize: '14px',
      color: COLORS.text, backgroundColor: audioEnabled ? COLORS.green : COLORS.red,
      padding: { x: 16, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    audioBtn.on('pointerdown', () => this.toggleAudio());
    this.container.add(audioBtn);

    const resetLabel = this.add.text(panelX + 20, y + 150, '⚠️ Resetear progreso', {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: COLORS.red,
    });
    this.container.add(resetLabel);

    const resetWarning = this.add.text(panelX + 20, y + 175,
      'Esto borrará todo tu progreso, saldo, upgrades y logros. Irreversible.', {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', color: COLORS.muted,
    });
    this.container.add(resetWarning);

    let confirmStage = 0;
    const resetBtn = this.add.text(panelX + 700, y + 185, 'Resetear', {
      fontFamily: 'Arial, sans-serif', fontSize: '14px',
      color: COLORS.text, backgroundColor: COLORS.red,
      padding: { x: 16, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    resetBtn.on('pointerdown', () => {
      if (confirmStage === 0) {
        confirmStage = 1;
        resetBtn.setText('¿Seguro? Toca otra vez');
        resetBtn.setStyle({ backgroundColor: COLORS.gold });
      } else {
        this.doReset();
      }
    });
    this.container.add(resetBtn);
  }

  private changeVolume(delta: number): void {
    const s = useGameStore.getState();
    const newVol = Math.max(0, Math.min(100, s.volume + delta));
    useGameStore.getState().set({ volume: newVol });
    SaveManager.save(useGameStore.getState());
    this.audioEngine.setVolume(newVol);
    if (newVol > 0) this.audioEngine.sfx('coin');
    this.scene.restart();
  }

  private toggleAudio(): void {
    const s = useGameStore.getState();
    const newVol = s.volume > 0 ? 0 : 70;
    useGameStore.getState().set({ volume: newVol });
    SaveManager.save(useGameStore.getState());
    this.audioEngine.setVolume(newVol);
    if (newVol > 0) {
      this.audioEngine.setEnabled(true);
      this.audioEngine.sfx('coin');
    } else {
      this.audioEngine.setEnabled(false);
    }
    this.scene.restart();
  }

  private doReset(): void {
    SaveManager.clear();
    useGameStore.getState().reset();
    this.audioEngine.sfx('gambleLoss');
    this.scene.stop();
    this.scene.stop(SCENES.SLOT);
    this.scene.start(SCENES.MENU);
  }

  private showToast(msg: string): void {
    const { width, height } = this.cameras.main;
    const toast = this.add.text(width / 2, height - 60, msg, {
      fontFamily: 'Arial Black, sans-serif', fontSize: '16px',
      color: COLORS.gold, backgroundColor: '#000000aa',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(110).setScale(0);

    this.tweens.add({
      targets: toast,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 1000,
      onComplete: () => toast.destroy(),
    });
  }

  private close(): void {
    this.audioEngine.destroy();
    this.scene.stop();
    this.scene.resume(SCENES.SLOT);
  }

  shutdown(): void {
    this.audioEngine.destroy();
  }
}
