export class PerformanceManager {
  private isMobile: boolean = false;
  private perfMode: boolean = false;

  detectMobile(): boolean {
    const ua = navigator.userAgent || '';
    const hasTouch = navigator.maxTouchPoints > 0;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isMobileMedia = window.matchMedia('(max-width: 768px)').matches;
    this.isMobile = isMobileUA || (hasTouch && isMobileMedia);
    return this.isMobile;
  }

  enablePerfMode(): void {
    this.perfMode = true;
    document.body.classList.add('perf-mode');
    const container = document.getElementById('game-container');
    if (container) container.classList.add('perf-mode');
  }

  disablePerfMode(): void {
    this.perfMode = false;
    document.body.classList.remove('perf-mode');
    const container = document.getElementById('game-container');
    if (container) container.classList.remove('perf-mode');
  }

  isPerfMode(): boolean {
    return this.perfMode;
  }

  isMobileDevice(): boolean {
    return this.isMobile;
  }

  autoDetect(): void {
    if (this.detectMobile()) {
      this.enablePerfMode();
    }
  }
}
