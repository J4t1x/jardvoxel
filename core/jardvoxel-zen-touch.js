// ═══════════════════════════════════════════════════════════
// JardVoxel Zen — Touch Controls
// TouchJoystick + TouchControls for mobile exploration
// ═══════════════════════════════════════════════════════════

export class TouchJoystick {
  constructor(zoneEl, side) {
    this.zoneEl = zoneEl; this.side = side; this.touchId = null;
    this.startX = 0; this.startY = 0; this.outputX = 0; this.outputY = 0;
    this.maxRadius = 60; this.deadZone = 10; this.baseEl = null; this.knobEl = null;
    this._createVisuals(); this._bindEvents();
  }
  _createVisuals() {
    this.baseEl = document.createElement('div'); this.baseEl.className = 'joystick-base'; this.baseEl.style.opacity = '0';
    document.getElementById('touch-controls').appendChild(this.baseEl);
    this.knobEl = document.createElement('div'); this.knobEl.className = 'joystick-knob'; this.knobEl.style.opacity = '0';
    document.getElementById('touch-controls').appendChild(this.knobEl);
  }
  _bindEvents() {
    const opts = { passive: false };
    this.zoneEl.addEventListener('touchstart', (e) => this._onStart(e), opts);
    this.zoneEl.addEventListener('touchmove', (e) => this._onMove(e), opts);
    this.zoneEl.addEventListener('touchend', (e) => this._onEnd(e), opts);
    this.zoneEl.addEventListener('touchcancel', (e) => this._onEnd(e), opts);
    this.zoneEl.addEventListener('mousedown', (e) => this._onMouseStart(e));
    this._mouseMoveBound = (e) => this._onMouseMove(e);
    this._mouseEndBound = (e) => this._onMouseEnd(e);
  }
  _onStart(e) {
    e.preventDefault(); if (this.touchId !== null) return;
    for (const touch of e.changedTouches) {
      const rect = this.zoneEl.getBoundingClientRect();
      if (this.side === 'left' && touch.clientX > rect.left + rect.width) continue;
      if (this.side === 'right' && touch.clientX < rect.left) continue;
      this.touchId = touch.identifier; this.startX = touch.clientX; this.startY = touch.clientY;
      this._showVisuals(touch.clientX, touch.clientY); return;
    }
  }
  _onMove(e) {
    e.preventDefault(); if (this.touchId === null) return;
    for (const touch of e.touches) {
      if (touch.identifier !== this.touchId) continue;
      this._updateOutput(touch.clientX, touch.clientY); return;
    }
  }
  _onEnd(e) {
    e.preventDefault(); if (this.touchId === null) return;
    for (const touch of e.changedTouches) {
      if (touch.identifier !== this.touchId) continue;
      this._reset(); return;
    }
  }
  _onMouseStart(e) {
    if (this.touchId !== null) return;
    this.touchId = 'mouse'; this.startX = e.clientX; this.startY = e.clientY;
    this._showVisuals(e.clientX, e.clientY); this._updateOutput(e.clientX, e.clientY);
    document.addEventListener('mousemove', this._mouseMoveBound);
    document.addEventListener('mouseup', this._mouseEndBound);
  }
  _onMouseMove(e) { if (this.touchId === 'mouse') this._updateOutput(e.clientX, e.clientY); }
  _onMouseEnd(e) {
    if (this.touchId !== 'mouse') return; this._reset();
    document.removeEventListener('mousemove', this._mouseMoveBound);
    document.removeEventListener('mouseup', this._mouseEndBound);
  }
  _showVisuals(x, y) {
    this.baseEl.style.left = x + 'px'; this.baseEl.style.top = y + 'px'; this.baseEl.style.opacity = '1';
    this.knobEl.style.left = x + 'px'; this.knobEl.style.top = y + 'px'; this.knobEl.style.opacity = '1';
  }
  _updateOutput(x, y) {
    let dx = x - this.startX, dy = y - this.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < this.deadZone) { this.outputX = 0; this.outputY = 0; }
    else {
      const clampedDist = Math.min(dist, this.maxRadius);
      const ratio = clampedDist / this.maxRadius; const angle = Math.atan2(dy, dx);
      this.outputX = Math.cos(angle) * ratio; this.outputY = Math.sin(angle) * ratio;
    }
    const knobDx = Math.max(-this.maxRadius, Math.min(this.maxRadius, dx));
    const knobDy = Math.max(-this.maxRadius, Math.min(this.maxRadius, dy));
    this.knobEl.style.left = (this.startX + knobDx) + 'px'; this.knobEl.style.top = (this.startY + knobDy) + 'px';
  }
  _reset() {
    this.touchId = null; this.outputX = 0; this.outputY = 0;
    this.baseEl.style.opacity = '0'; this.knobEl.style.opacity = '0';
  }
  getOutput() { return { x: this.outputX, y: this.outputY }; }
}

export class TouchControls {
  constructor(game) {
    this.game = game; this.enabled = false; this.breaking = false;
    this.lookSensitivity = 2.0; this.moveStick = null; this.lookStick = null;
    this._init();
  }
  _init() {
    this.moveStick = new TouchJoystick(document.getElementById('joystick-zone-left'), 'left');
    this.lookStick = new TouchJoystick(document.getElementById('joystick-zone-right'), 'right');
    this._bindButtons();
  }
  _bindButtons() {
    const opts = { passive: false };
    const btnJump = document.getElementById('touch-btn-jump');
    const btnBreak = document.getElementById('touch-btn-break');
    const btnPlace = document.getElementById('touch-btn-place');
    const btnSprint = document.getElementById('touch-btn-sprint');
    const btnInv = document.getElementById('touch-btn-inv');
    const btnFly = document.getElementById('touch-btn-fly');
    const btnNextBlock = document.getElementById('touch-btn-next-block');
    const btnPrevBlock = document.getElementById('touch-btn-prev-block');
    const btnJournal = document.getElementById('touch-btn-journal');

    if (btnJump) {
      btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); this.game.keys.space = true; }, opts);
      btnJump.addEventListener('touchend', (e) => { e.preventDefault(); this.game.keys.space = false; }, opts);
    }
    if (btnBreak) {
      btnBreak.addEventListener('touchstart', (e) => { e.preventDefault(); this.breaking = true; this.game.mouseLeftDown = true; this.game._breakBlock(); }, opts);
      btnBreak.addEventListener('touchend', (e) => { e.preventDefault(); this.breaking = false; this.game.mouseLeftDown = false; }, opts);
    }
    if (btnPlace) {
      btnPlace.addEventListener('touchstart', (e) => { e.preventDefault(); this.game._placeBlock(); }, opts);
    }
    if (btnSprint) {
      btnSprint.addEventListener('touchstart', (e) => { e.preventDefault(); this.game.keys.shift = true; }, opts);
      btnSprint.addEventListener('touchend', (e) => { e.preventDefault(); this.game.keys.shift = false; }, opts);
    }
    if (btnInv) {
      btnInv.addEventListener('touchstart', (e) => { e.preventDefault(); this._toggleInventory(); }, opts);
    }
    if (btnFly) {
      btnFly.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game.player.flying = !this.game.player.flying;
        this.game.player.velocity.set(0, 0, 0);
        btnFly.classList.toggle('active', this.game.player.flying);
        this._showToast(this.game.player.flying ? 'Vuelo: ON' : 'Vuelo: OFF');
      }, opts);
    }
    if (btnNextBlock) {
      btnNextBlock.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const cur = this.game.inventory.selectedSlot;
        this.game.inventory.setSelected((cur + 1) % 9);
        this.game._updateHotbar();
      }, opts);
    }
    if (btnPrevBlock) {
      btnPrevBlock.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const cur = this.game.inventory.selectedSlot;
        this.game.inventory.setSelected((cur - 1 + 9) % 9);
        this.game._updateHotbar();
      }, opts);
    }
    if (btnJournal) {
      btnJournal.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game._toggleJournal();
      }, opts);
    }
  }
  _toggleInventory() {
    this.game.inventoryOpen = !this.game.inventoryOpen;
    const panel = document.getElementById('inventory-panel');
    if (this.game.inventoryOpen) { panel.classList.add('show'); this.game._buildInventoryGrid(); }
    else panel.classList.remove('show');
  }
  toggle() {
    if (this.enabled) this.disable(); else this.enable();
  }
  enable() {
    this.enabled = true;
    const el = document.getElementById('touch-controls');
    if (el) {
      el.classList.add('active');
      if (this.game.pointerLocked) document.exitPointerLock();
      const btnFly = document.getElementById('touch-btn-fly');
      if (btnFly) btnFly.classList.toggle('active', this.game.player.flying);
    }
    try { localStorage.setItem('jardvoxel_touch_controls', '1'); } catch(e) {}
  }
  disable() {
    this.enabled = false;
    const el = document.getElementById('touch-controls');
    if (el) el.classList.remove('active');
    this.game.keys.space = false;
    this.game.keys.shift = false;
    this.game.mouseLeftDown = false;
    this.breaking = false;
    try { localStorage.setItem('jardvoxel_touch_controls', '0'); } catch(e) {}
  }
  _showToast(msg) {
    const toast = document.getElementById('touch-toast');
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.remove('show'), 1500);
  }
  updateLook(dt) {
    if (!this.enabled) return;
    const look = this.lookStick.getOutput();
    if (look.x !== 0 || look.y !== 0) {
      this.game.player.yaw -= look.x * this.lookSensitivity * dt;
      const invertY = (this.game.settings && this.game.settings.invertY) ? 1 : -1;
      this.game.player.pitch += look.y * this.lookSensitivity * dt * invertY;
      this.game.player.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.game.player.pitch));
    }
  }
  getMoveInput() {
    if (!this.enabled) return null;
    const move = this.moveStick.getOutput();
    if (move.x === 0 && move.y === 0) return null;
    return { moveX: move.x, moveY: move.y };
  }
  autoDetect() {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    let saved = null;
    try { saved = localStorage.getItem('jardvoxel_touch_controls'); } catch(e) {}
    if (saved !== null) { if (saved === '1') this.toggle(); }
    else if (isTouch) this.toggle();
  }
}
