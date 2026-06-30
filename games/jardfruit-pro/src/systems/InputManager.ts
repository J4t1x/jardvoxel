export class InputManager {
  private scene: Phaser.Scene;
  private keyboard: Phaser.Input.Keyboard.KeyboardPlugin | null;
  private onSpin: () => void;
  private onBet: (amount: number) => void;
  private onEsc: () => void;
  private isFullscreen: boolean = false;
  private musicWasPlaying: boolean = false;
  private onPauseMusic: () => void;
  private onResumeMusic: () => void;

  constructor(
    scene: Phaser.Scene,
    callbacks: {
      onSpin: () => void;
      onBet: (amount: number) => void;
      onEsc: () => void;
      onPauseMusic: () => void;
      onResumeMusic: () => void;
    },
  ) {
    this.scene = scene;
    this.keyboard = scene.input.keyboard;
    this.onSpin = callbacks.onSpin;
    this.onBet = callbacks.onBet;
    this.onEsc = callbacks.onEsc;
    this.onPauseMusic = callbacks.onPauseMusic;
    this.onResumeMusic = callbacks.onResumeMusic;
  }

  init(): void {
    if (!this.keyboard) return;

    this.keyboard.on('keydown-SPACE', (event: KeyboardEvent) => {
      event.preventDefault();
      this.onSpin();
    });

    this.keyboard.on('keydown-ONE', () => this.onBet(10));
    this.keyboard.on('keydown-TWO', () => this.onBet(50));
    this.keyboard.on('keydown-THREE', () => this.onBet(100));
    this.keyboard.on('keydown-FOUR', () => this.onBet(500));
    this.keyboard.on('keydown-FIVE', () => this.onBet(-1));

    this.keyboard.on('keydown-ESC', () => {
      if (this.isFullscreen) {
        this.exitFullscreen();
      } else {
        this.onEsc();
      }
    });

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('popstate', this.handlePopState);

    window.addEventListener('resize', this.handleResize);
  }

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.musicWasPlaying = true;
      this.onPauseMusic();
    } else if (this.musicWasPlaying) {
      this.onResumeMusic();
      this.musicWasPlaying = false;
    }
  };

  private handlePopState = (): void => {
    if (this.isFullscreen) {
      this.exitFullscreen();
    }
  };

  private resizeTimer: ReturnType<typeof setTimeout> | null = null;
  private handleResize = (): void => {
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      this.scene.scale.refresh();
    }, 200);
  };

  enterFullscreen(): void {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen();
    }
    this.isFullscreen = true;
    history.pushState({ fullscreen: true }, '');
  }

  exitFullscreen(): void {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    }
    this.isFullscreen = false;
  }

  toggleFullscreen(): void {
    if (this.isFullscreen) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  getIsFullscreen(): boolean {
    return this.isFullscreen;
  }

  destroy(): void {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('popstate', this.handlePopState);
    window.removeEventListener('resize', this.handleResize);
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
  }
}
