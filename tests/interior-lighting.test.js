import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { InteriorLightingManager, LIGHT_TYPES, LIGHT_CONFIG } from '../core/jardvoxel-survival-interior-lighting.js';

describe('InteriorLightingManager', () => {
  let scene, dayNight;

  beforeEach(() => {
    scene = new THREE.Scene();
    dayNight = {
      time: 0.3,
      ambientLight: new THREE.AmbientLight(0xffffff, 0.4),
      sunLight: new THREE.DirectionalLight(0xffffff, 0.8),
    };
  });

  it('should create with light pool of 8', () => {
    const ilm = new InteriorLightingManager(scene, dayNight);
    const pool = ilm.getLightPool();
    expect(pool.length).toBe(8);
    pool.forEach(pl => {
      expect(pl.light).toBeTruthy();
      expect(pl.active).toBe(false);
    });
    ilm.dispose();
  });

  it('should start not interior', () => {
    const ilm = new InteriorLightingManager(scene, dayNight);
    expect(ilm.isInterior()).toBe(false);
    expect(ilm.getInteriorFactor()).toBe(0);
    ilm.dispose();
  });

  it('should detect interior when block is above head', () => {
    const ilm = new InteriorLightingManager(scene, dayNight);
    const world = {
      getBlock: (x, y, z) => {
        if (y >= 5 && y <= 8) return 1;
        return 0;
      },
    };
    ilm.detectInterior(world, 0, 0, 0);
    expect(ilm.isInterior()).toBe(true);
    ilm.dispose();
  });

  it('should not detect interior when no block above', () => {
    const ilm = new InteriorLightingManager(scene, dayNight);
    const world = {
      getBlock: () => 0,
    };
    ilm.detectInterior(world, 0, 0, 0);
    expect(ilm.isInterior()).toBe(false);
    ilm.dispose();
  });

  it('should ignore water blocks above head', () => {
    const ilm = new InteriorLightingManager(scene, dayNight);
    const world = {
      getBlock: (x, y, z) => {
        if (y >= 3) return 11;
        return 0;
      },
    };
    ilm.detectInterior(world, 0, 0, 0);
    expect(ilm.isInterior()).toBe(false);
    ilm.dispose();
  });

  it('should detect window light from glass blocks', () => {
    const ilm = new InteriorLightingManager(scene, dayNight);
    const world = {
      getBlock: (x, y, z) => {
        if (y === 4 && x === 0 && z === 0) return 1;
        if (y === 4 && (x === 1 || x === -1)) return 23;
        return 0;
      },
    };
    ilm.detectInterior(world, 0, 0, 0);
    expect(ilm.isInterior()).toBe(true);
    expect(ilm.getWindowLightFactor()).toBeGreaterThan(0);
    ilm.dispose();
  });

  it('should smooth transition interior factor', () => {
    const ilm = new InteriorLightingManager(scene, dayNight);
    const world = {
      getBlock: (x, y, z) => y >= 3 ? 1 : 0,
    };
    ilm.detectInterior(world, 0, 0, 0);
    expect(ilm.getInteriorFactor()).toBe(0);
    ilm.update(0.1, world, { x: 0, y: 0, z: 0 }, true);
    expect(ilm.getInteriorFactor()).toBeGreaterThan(0);
    expect(ilm.getInteriorFactor()).toBeLessThan(1);
    ilm.update(2.0, world, { x: 0, y: 0, z: 0 }, true);
    expect(ilm.getInteriorFactor()).toBeCloseTo(1, 1);
    ilm.dispose();
  });

  it('should scan light sources nearby', () => {
    const ilm = new InteriorLightingManager(scene, dayNight);
    const world = {
      getBlock: (x, y, z) => {
        if (x === 2 && y === 0 && z === 0) return 25;
        if (x === 0 && y === 0 && z === 2) return 26;
        return 0;
      },
    };
    const sources = ilm.scanLightSources(world, 0, 0, 0);
    expect(sources.length).toBeGreaterThanOrEqual(2);
    expect(sources.some(s => s.type === LIGHT_TYPES.TORCH)).toBe(true);
    expect(sources.some(s => s.type === LIGHT_TYPES.LANTERN)).toBe(true);
    ilm.dispose();
  });

  it('should update light pool with sources', () => {
    const ilm = new InteriorLightingManager(scene, dayNight);
    const sources = [
      { x: 1, y: 1, z: 1, dist: 1.7, type: LIGHT_TYPES.TORCH, block: 25 },
      { x: 3, y: 0, z: 0, dist: 3, type: LIGHT_TYPES.LANTERN, block: 26 },
    ];
    ilm.updateLightPool(sources);
    const pool = ilm.getLightPool();
    expect(pool[0].active).toBe(true);
    expect(pool[1].active).toBe(true);
    expect(pool[0].light.visible).toBe(true);
    ilm.dispose();
  });

  it('should prioritize torch over lantern by distance', () => {
    const ilm = new InteriorLightingManager(scene, dayNight);
    const sources = [
      { x: 5, y: 0, z: 0, dist: 5, type: LIGHT_TYPES.TORCH, block: 25 },
      { x: 1, y: 0, z: 0, dist: 1, type: LIGHT_TYPES.LANTERN, block: 26 },
    ];
    ilm.updateLightPool(sources);
    const pool = ilm.getLightPool();
    const activeLights = pool.filter(p => p.active);
    expect(activeLights.length).toBe(2);
    ilm.dispose();
  });

  it('should fade out lights when no sources', () => {
    const ilm = new InteriorLightingManager(scene, dayNight);
    const sources = [
      { x: 1, y: 1, z: 1, dist: 1.7, type: LIGHT_TYPES.TORCH, block: 25 },
    ];
    ilm.updateLightPool(sources);
    expect(ilm.getLightPool()[0].active).toBe(true);
    ilm.updateLightPool([]);
    const pool = ilm.getLightPool();
    expect(pool[0].fadeIn).toBeLessThan(1);
    ilm.dispose();
  });

  it('should reduce ambient light when interior', () => {
    const ilm = new InteriorLightingManager(scene, dayNight);
    const world = {
      getBlock: (x, y, z) => y >= 3 ? 1 : 0,
    };
    ilm.update(2.0, world, { x: 0, y: 0, z: 0 }, true);
    const ambient = dayNight.ambientLight.intensity;
    const base = ilm._getBaseAmbientIntensity();
    expect(ambient).toBeLessThan(base);
    ilm.dispose();
  });

  it('should export LIGHT_TYPES and LIGHT_CONFIG', () => {
    expect(LIGHT_TYPES.TORCH).toBeDefined();
    expect(LIGHT_TYPES.CAMPFIRE).toBeDefined();
    expect(LIGHT_TYPES.LANTERN).toBeDefined();
    expect(LIGHT_TYPES.LAVA).toBeDefined();
    expect(LIGHT_TYPES.VILLAGE_CAMPFIRE).toBeDefined();
    expect(LIGHT_CONFIG.torch.color).toBe(0xFFA040);
    expect(LIGHT_CONFIG.torch.intensity).toBe(1.5);
    expect(LIGHT_CONFIG.campfire.intensity).toBe(2.5);
    expect(LIGHT_CONFIG.lantern.intensity).toBe(1.0);
  });

  it('should dispose properly', () => {
    const ilm = new InteriorLightingManager(scene, dayNight);
    ilm.dispose();
    expect(ilm.getLightPool().length).toBe(0);
  });

  it('should not crash with null dayNight', () => {
    const ilm = new InteriorLightingManager(scene, null);
    expect(() => ilm.update(0.1, { getBlock: () => 0 }, { x: 0, y: 0, z: 0 }, true)).not.toThrow();
    ilm.dispose();
  });
});
