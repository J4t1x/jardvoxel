import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { PostprocessingManager, QUALITY } from '../core/jardvoxel-survival-postprocessing.js';

describe('PostprocessingManager', () => {
  let renderer, scene, camera;

  beforeEach(() => {
    renderer = new THREE.WebGLRenderer();
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 500);
  });

  it('should initialize with HIGH quality by default', () => {
    const pm = new PostprocessingManager(renderer, scene, camera);
    expect(pm.quality).toBe(QUALITY.HIGH);
    expect(pm.composer).toBeTruthy();
    expect(pm.ssaoPass).toBeTruthy();
    expect(pm.bloomPass).toBeTruthy();
    expect(pm.outputPass).toBeTruthy();
  });

  it('should set quality to MEDIUM (disables SSAO, keeps Bloom)', () => {
    const pm = new PostprocessingManager(renderer, scene, camera);
    pm.setQuality(QUALITY.MEDIUM);
    expect(pm.quality).toBe(QUALITY.MEDIUM);
    expect(pm.ssaoPass.enabled).toBe(false);
    expect(pm.bloomPass.enabled).toBe(true);
  });

  it('should set quality to LOW (disables all postprocessing)', () => {
    const pm = new PostprocessingManager(renderer, scene, camera);
    pm.setQuality(QUALITY.LOW);
    expect(pm.quality).toBe(QUALITY.LOW);
    expect(pm.ssaoPass.enabled).toBe(false);
    expect(pm.bloomPass.enabled).toBe(false);
  });

  it('should use composer.render() when enabled', () => {
    const pm = new PostprocessingManager(renderer, scene, camera);
    let called = false;
    pm.composer.render = () => { called = true; };
    pm.render();
    expect(called).toBe(true);
  });

  it('should fall back to renderer.render() when disabled', () => {
    const pm = new PostprocessingManager(renderer, scene, camera);
    let rendererCalled = false;
    renderer.render = () => { rendererCalled = true; };
    let composerCalled = false;
    pm.composer.render = () => { composerCalled = true; };
    pm.setEnabled(false);
    pm.render();
    expect(rendererCalled).toBe(true);
    expect(composerCalled).toBe(false);
  });

  it('should auto-downgrade quality when FPS drops below 45', () => {
    const pm = new PostprocessingManager(renderer, scene, camera);
    expect(pm.quality).toBe(QUALITY.HIGH);
    for (let i = 0; i < 5; i++) {
      pm.update(1.0, 40);
    }
    expect(pm.quality).toBe(QUALITY.MEDIUM);
  });

  it('should auto-downgrade MEDIUM to LOW when FPS drops below 30', () => {
    const pm = new PostprocessingManager(renderer, scene, camera);
    pm.setQuality(QUALITY.MEDIUM);
    for (let i = 0; i < 5; i++) {
      pm.update(1.0, 25);
    }
    expect(pm.quality).toBe(QUALITY.LOW);
  });

  it('should auto-upgrade LOW to MEDIUM when FPS recovers above 55', () => {
    const pm = new PostprocessingManager(renderer, scene, camera);
    pm.setQuality(QUALITY.LOW);
    for (let i = 0; i < 5; i++) {
      pm.update(1.0, 60);
    }
    expect(pm.quality).toBe(QUALITY.MEDIUM);
  });

  it('should auto-upgrade MEDIUM to HIGH when FPS recovers above 55', () => {
    const pm = new PostprocessingManager(renderer, scene, camera);
    pm.setQuality(QUALITY.MEDIUM);
    for (let i = 0; i < 5; i++) {
      pm.update(1.0, 60);
    }
    expect(pm.quality).toBe(QUALITY.HIGH);
  });

  it('should handle resize', () => {
    const pm = new PostprocessingManager(renderer, scene, camera);
    let composerSize = null, ssaoSize = null, bloomSize = null;
    pm.composer.setSize = (w, h) => { composerSize = [w, h]; };
    pm.ssaoPass.setSize = (w, h) => { ssaoSize = [w, h]; };
    pm.bloomPass.setSize = (w, h) => { bloomSize = [w, h]; };
    pm.resize(1920, 1080);
    expect(composerSize).toEqual([1920, 1080]);
    expect(ssaoSize).toEqual([1920, 1080]);
    expect(bloomSize).toEqual([1920, 1080]);
  });

  it('should dispose properly', () => {
    const pm = new PostprocessingManager(renderer, scene, camera);
    pm.dispose();
    expect(pm.composer).toBeNull();
  });

  it('should have correct bloom parameters for HIGH quality', () => {
    const pm = new PostprocessingManager(renderer, scene, camera);
    pm.setQuality(QUALITY.HIGH);
    expect(pm.bloomPass.strength).toBe(0.15);
    expect(pm.bloomPass.radius).toBe(0.4);
    expect(pm.bloomPass.threshold).toBe(0.85);
  });

  it('should have SSAO enabled only at HIGH quality', () => {
    const pm = new PostprocessingManager(renderer, scene, camera);
    expect(pm.ssaoPass.enabled).toBe(true);
    pm.setQuality(QUALITY.MEDIUM);
    expect(pm.ssaoPass.enabled).toBe(false);
    pm.setQuality(QUALITY.HIGH);
    expect(pm.ssaoPass.enabled).toBe(true);
  });

  it('should not auto-switch when disabled', () => {
    const pm = new PostprocessingManager(renderer, scene, camera);
    pm.setEnabled(false);
    for (let i = 0; i < 5; i++) {
      pm.update(1.0, 20);
    }
    expect(pm.quality).toBe(QUALITY.HIGH);
  });
});
