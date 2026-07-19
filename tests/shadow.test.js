import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { ShadowManager, SHADOW_QUALITY } from '../core/jardvoxel-survival-shadow.js';

describe('ShadowManager', () => {
  let renderer, sunLight, camera;

  beforeEach(() => {
    renderer = new THREE.WebGLRenderer();
    sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 500);
  });

  it('should initialize with MEDIUM quality by default (SPEC-075: performance)', () => {
    const sm = new ShadowManager(renderer, sunLight, camera);
    expect(sm.quality).toBe(SHADOW_QUALITY.MEDIUM);
  });

  it('should set PCFSoftShadowMap type', () => {
    const sm = new ShadowManager(renderer, sunLight, camera);
    expect(renderer.shadowMap.type).toBe(THREE.PCFSoftShadowMap);
  });

  it('should create 3 cascades for HIGH quality', () => {
    const sm = new ShadowManager(renderer, sunLight, camera);
    sm.setQuality(SHADOW_QUALITY.HIGH);
    expect(sm.cascades.length).toBe(3);
  });

  it('should create 1 cascade (single shadow) for MEDIUM quality', () => {
    const sm = new ShadowManager(renderer, sunLight, camera);
    sm.setQuality(SHADOW_QUALITY.MEDIUM);
    expect(sm.cascades.length).toBe(0);
    expect(sunLight.castShadow).toBe(true);
  });

  it('should disable shadows when setEnabled(false)', () => {
    const sm = new ShadowManager(renderer, sunLight, camera);
    sm.setEnabled(false);
    expect(sm._enabled).toBe(false);
    expect(renderer.shadowMap.enabled).toBe(false);
  });

  it('should re-enable shadows when setEnabled(true)', () => {
    const sm = new ShadowManager(renderer, sunLight, camera);
    sm.setEnabled(false);
    sm.setEnabled(true);
    expect(sm._enabled).toBe(true);
    expect(renderer.shadowMap.enabled).toBe(true);
  });

  it('should have correct shadow bias for voxel geometry', () => {
    const sm = new ShadowManager(renderer, sunLight, camera);
    sm.setQuality(SHADOW_QUALITY.MEDIUM);
    expect(sunLight.shadow.bias).toBe(-0.0005);
    expect(sunLight.shadow.normalBias).toBe(0.05);
  });

  it('should have correct shadow map size for HIGH quality', () => {
    const sm = new ShadowManager(renderer, sunLight, camera);
    sm.setQuality(SHADOW_QUALITY.HIGH);
    expect(sm.cascades[0].shadow.mapSize.x).toBe(2048);
  });

  it('should have correct shadow map size for MEDIUM quality', () => {
    const sm = new ShadowManager(renderer, sunLight, camera);
    sm.setQuality(SHADOW_QUALITY.MEDIUM);
    expect(sunLight.shadow.mapSize.x).toBe(1024);
  });

  it('should have correct shadow map size for LOW quality', () => {
    const sm = new ShadowManager(renderer, sunLight, camera);
    sm.setQuality(SHADOW_QUALITY.LOW);
    expect(sunLight.shadow.mapSize.x).toBe(512);
  });

  it('should update shadow positions based on player position', () => {
    const sm = new ShadowManager(renderer, sunLight, camera);
    sm.setQuality(SHADOW_QUALITY.MEDIUM);
    const playerPos = new THREE.Vector3(100, 64, 200);
    const camDir = new THREE.Vector3(1, 0, 0);
    sm.update(playerPos, camDir);
    expect(sunLight.target.position.x).toBe(100);
    expect(sunLight.target.position.z).toBe(200);
  });

  it('should add cascades to scene', () => {
    const sm = new ShadowManager(renderer, sunLight, camera);
    sm.setQuality(SHADOW_QUALITY.HIGH);
    const scene = new THREE.Scene();
    sm.addToScene(scene);
    expect(scene.children.length).toBeGreaterThanOrEqual(6);
  });

  it('should remove cascades from scene', () => {
    const sm = new ShadowManager(renderer, sunLight, camera);
    sm.setQuality(SHADOW_QUALITY.HIGH);
    const scene = new THREE.Scene();
    sm.addToScene(scene);
    const countBefore = scene.children.length;
    sm.removeFromScene(scene);
    expect(scene.children.length).toBeLessThan(countBefore);
  });

  it('should dispose properly', () => {
    const sm = new ShadowManager(renderer, sunLight, camera);
    sm.dispose();
    expect(sm.cascades.length).toBe(0);
  });
});
