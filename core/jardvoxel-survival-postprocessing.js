// ═══════════════════════════════════════════════════════════
// SPEC-070: Postprocessing Pipeline (SSAO + Bloom)
// EffectComposer with RenderPass → SSAOPass → UnrealBloomPass → OutputPass
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const QUALITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export class PostprocessingManager {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.composer = null;
    this.renderPass = null;
    this.ssaoPass = null;
    this.bloomPass = null;
    this.outputPass = null;
    this.quality = QUALITY.HIGH;
    this._enabled = true;
    this._fpsHistory = [];
    this._fpsCheckTimer = 0;
    this._size = new THREE.Vector2(
      renderer.domElement.width,
      renderer.domElement.height
    );

    this._init();
  }

  _init() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.setSize(this._size.x, this._size.y);

    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.ssaoPass = new SSAOPass(this.scene, this.camera, this._size.x, this._size.y);
    this.ssaoPass.kernelRadius = 12;
    this.ssaoPass.minDistance = 0.005;
    this.ssaoPass.maxDistance = 0.1;
    this.composer.addPass(this.ssaoPass);

    this.bloomPass = new UnrealBloomPass(
      this._size,
      0.15,
      0.4,
      0.85
    );
    this.composer.addPass(this.bloomPass);

    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);

    this.setQuality(QUALITY.HIGH);
  }

  setQuality(quality) {
    this.quality = quality;
    switch (quality) {
      case QUALITY.HIGH:
        this.ssaoPass.enabled = true;
        this.bloomPass.enabled = true;
        this.bloomPass.strength = 0.15;
        this.bloomPass.radius = 0.4;
        this.bloomPass.threshold = 0.85;
        break;
      case QUALITY.MEDIUM:
        this.ssaoPass.enabled = false;
        this.bloomPass.enabled = true;
        this.bloomPass.strength = 0.12;
        this.bloomPass.radius = 0.4;
        this.bloomPass.threshold = 0.85;
        break;
      case QUALITY.LOW:
        this.ssaoPass.enabled = false;
        this.bloomPass.enabled = false;
        break;
    }
  }

  setEnabled(enabled) {
    this._enabled = enabled;
  }

  isEnabled() {
    return this._enabled;
  }

  render() {
    if (this._enabled && this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  resize(width, height) {
    this._size.set(width, height);
    if (this.composer) {
      this.composer.setSize(width, height);
    }
    if (this.ssaoPass) {
      this.ssaoPass.setSize(width, height);
    }
    if (this.bloomPass) {
      this.bloomPass.setSize(width, height);
    }
  }

  update(dt, fps) {
    if (!this._enabled) return;
    this._fpsCheckTimer += dt;
    if (this._fpsCheckTimer < 1.0) return;
    this._fpsCheckTimer = 0;

    this._fpsHistory.push(fps);
    if (this._fpsHistory.length > 5) this._fpsHistory.shift();

    if (this._fpsHistory.length < 3) return;

    const avgFps = this._fpsHistory.reduce((a, b) => a + b, 0) / this._fpsHistory.length;

    if (avgFps < 45 && this.quality === QUALITY.HIGH) {
      this.setQuality(QUALITY.MEDIUM);
      this._fpsHistory = [];
    } else if (avgFps < 30 && this.quality === QUALITY.MEDIUM) {
      this.setQuality(QUALITY.LOW);
      this._fpsHistory = [];
    } else if (avgFps > 55 && this.quality === QUALITY.LOW) {
      this.setQuality(QUALITY.MEDIUM);
      this._fpsHistory = [];
    } else if (avgFps > 55 && this.quality === QUALITY.MEDIUM) {
      this.setQuality(QUALITY.HIGH);
      this._fpsHistory = [];
    }
  }

  dispose() {
    if (this.ssaoPass) this.ssaoPass.dispose();
    if (this.bloomPass) this.bloomPass.dispose();
    if (this.composer) this.composer.dispose();
    this.composer = null;
  }
}
