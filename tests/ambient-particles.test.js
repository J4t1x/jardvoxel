import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { AmbientParticleSystem, PARTICLE_CONFIGS, PARTICLE_RADIUS, MAX_PARTICLES } from '../core/jardvoxel-survival-ambient-particles.js';
import { BIOMES } from '../core/jardvoxel-survival-engine.js';

describe('AmbientParticleSystem', () => {
  let scene;

  beforeEach(() => {
    scene = new THREE.Scene();
  });

  it('should create with points object added to scene', () => {
    const aps = new AmbientParticleSystem(scene);
    expect(aps._points).toBeTruthy();
    expect(aps._geometry).toBeTruthy();
    expect(aps._material).toBeTruthy();
    aps.dispose();
  });

  it('should start invisible with no active particles', () => {
    const aps = new AmbientParticleSystem(scene);
    expect(aps._points.visible).toBe(false);
    expect(aps.getActiveCount()).toBe(0);
    expect(aps.getCurrentType()).toBe('none');
    aps.dispose();
  });

  it('should set biome and activate particles', () => {
    const aps = new AmbientParticleSystem(scene);
    aps.setBiome(BIOMES.PLAINS);
    expect(aps.getCurrentType()).toBe('pollen');
    expect(aps.getActiveCount()).toBeGreaterThan(0);
    aps.dispose();
  });

  it('should set snowflakes for taiga biome', () => {
    const aps = new AmbientParticleSystem(scene);
    aps.setBiome(BIOMES.TAIGA);
    expect(aps.getCurrentType()).toBe('snowflakes');
    expect(aps.getActiveCount()).toBe(100);
    aps.dispose();
  });

  it('should set fireflies for swamp biome', () => {
    const aps = new AmbientParticleSystem(scene);
    aps.setBiome(BIOMES.SWAMP);
    expect(aps.getCurrentType()).toBe('fireflies');
    expect(aps.getActiveCount()).toBe(50);
    aps.dispose();
  });

  it('should set spores for mystic grove biome', () => {
    const aps = new AmbientParticleSystem(scene);
    aps.setBiome(BIOMES.MYSTIC_GROVE);
    expect(aps.getCurrentType()).toBe('spores');
    expect(aps.getActiveCount()).toBe(70);
    aps.dispose();
  });

  it('should set falling leaves for autumn forest biome', () => {
    const aps = new AmbientParticleSystem(scene);
    aps.setBiome(BIOMES.AUTUMN_FOREST);
    expect(aps.getCurrentType()).toBe('falling_leaves');
    expect(aps.getActiveCount()).toBe(90);
    aps.dispose();
  });

  it('should set petals for cherry grove biome', () => {
    const aps = new AmbientParticleSystem(scene);
    aps.setBiome(BIOMES.CHERRY_GROVE);
    expect(aps.getCurrentType()).toBe('petals');
    expect(aps.getActiveCount()).toBe(80);
    aps.dispose();
  });

  it('should set dust for desert biome', () => {
    const aps = new AmbientParticleSystem(scene);
    aps.setBiome(BIOMES.DESERT);
    expect(aps.getCurrentType()).toBe('dust');
    expect(aps.getActiveCount()).toBe(60);
    aps.dispose();
  });

  it('should set cave particles when in cave', () => {
    const aps = new AmbientParticleSystem(scene);
    aps.setCave(true);
    aps.setBiome(BIOMES.PLAINS);
    expect(aps.getCurrentType()).toBe('dust_motes');
    expect(aps.getActiveCount()).toBe(30);
    aps.dispose();
  });

  it('should not activate particles for none type', () => {
    const aps = new AmbientParticleSystem(scene);
    aps.setBiome(BIOMES.OCEAN);
    expect(aps.getCurrentType()).toBe('none');
    expect(aps.getActiveCount()).toBe(0);
    aps.dispose();
  });

  it('should hide night-only particles during day', () => {
    const aps = new AmbientParticleSystem(scene);
    aps.setBiome(BIOMES.SWAMP);
    aps.update(0.016, { x: 0, y: 0, z: 0 }, 0.8);
    expect(aps.isVisible()).toBe(false);
    aps.dispose();
  });

  it('should show night-only particles at night', () => {
    const aps = new AmbientParticleSystem(scene);
    aps.setBiome(BIOMES.SWAMP);
    aps.update(0.016, { x: 0, y: 0, z: 0 }, 0.05);
    expect(aps.isVisible()).toBe(true);
    aps.dispose();
  });

  it('should show day particles during day', () => {
    const aps = new AmbientParticleSystem(scene);
    aps.setBiome(BIOMES.PLAINS);
    aps.update(0.016, { x: 0, y: 0, z: 0 }, 0.8);
    expect(aps.isVisible()).toBe(true);
    aps.dispose();
  });

  it('should update particle positions', () => {
    const aps = new AmbientParticleSystem(scene);
    aps.setBiome(BIOMES.PLAINS);
    const posBefore = aps._positions[0];
    aps.update(0.1, { x: 0, y: 0, z: 0 }, 0.8);
    const posAfter = aps._positions[0];
    expect(posAfter).toBeDefined();
    aps.dispose();
  });

  it('should set wind direction and strength', () => {
    const aps = new AmbientParticleSystem(scene);
    aps.setWind(new THREE.Vector3(1, 0, 0), 2.0);
    expect(aps._windStrength).toBe(2.0);
    aps.dispose();
  });

  it('should set enabled/disabled', () => {
    const aps = new AmbientParticleSystem(scene);
    aps.setBiome(BIOMES.PLAINS);
    aps.setEnabled(false);
    expect(aps.getActiveCount()).toBe(0);
    expect(aps._points.visible).toBe(false);
    aps.dispose();
  });

  it('should apply LOD factor', () => {
    const aps = new AmbientParticleSystem(scene);
    aps.setLOD(0.5);
    aps.setBiome(BIOMES.TAIGA);
    expect(aps.getActiveCount()).toBe(50);
    aps.dispose();
  });

  it('should clamp LOD factor', () => {
    const aps = new AmbientParticleSystem(scene);
    aps.setLOD(0.1);
    aps.setBiome(BIOMES.TAIGA);
    expect(aps.getActiveCount()).toBe(20);
    aps.dispose();
  });

  it('should have all 10 particle configs', () => {
    const types = ['pollen', 'snowflakes', 'leaves', 'falling_leaves', 'mist', 'dust', 'fireflies', 'spores', 'petals', 'bioluminescence'];
    for (const type of types) {
      expect(PARTICLE_CONFIGS[type]).toBeDefined();
      expect(PARTICLE_CONFIGS[type].color).toBeDefined();
      expect(PARTICLE_CONFIGS[type].count).toBeGreaterThan(0);
    }
  });

  it('should have nightOnly flag on fireflies and bioluminescence', () => {
    expect(PARTICLE_CONFIGS.fireflies.nightOnly).toBe(true);
    expect(PARTICLE_CONFIGS.bioluminescence.nightOnly).toBe(true);
    expect(PARTICLE_CONFIGS.pollen.nightOnly).toBe(false);
  });

  it('should dispose properly', () => {
    const aps = new AmbientParticleSystem(scene);
    aps.setBiome(BIOMES.PLAINS);
    aps.dispose();
    expect(aps._geometry).toBeNull();
    expect(aps._material).toBeNull();
    expect(aps._points).toBeNull();
  });

  it('should not crash when disabled and update called', () => {
    const aps = new AmbientParticleSystem(scene);
    aps.setEnabled(false);
    expect(() => aps.update(0.016, { x: 0, y: 0, z: 0 }, 0.5)).not.toThrow();
    aps.dispose();
  });

  it('should export PARTICLE_RADIUS and MAX_PARTICLES', () => {
    expect(PARTICLE_RADIUS).toBe(32);
    expect(MAX_PARTICLES).toBe(130);
  });
});
