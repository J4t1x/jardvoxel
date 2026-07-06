import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { VolumetricFog, BIOME_FOG_DENSITY } from '../core/jardvoxel-survival-fog.js';

describe('VolumetricFog', () => {
  let scene;

  beforeEach(() => {
    scene = new THREE.Scene();
  });

  it('should initialize with FogExp2', () => {
    const fog = new VolumetricFog(scene);
    expect(scene.fog).toBeTruthy();
    expect(scene.fog.isFogExp2).toBe(true);
  });

  it('should set biome density for desert (low)', () => {
    const fog = new VolumetricFog(scene);
    fog.setBiome('Desert');
    fog.update(0.1, 64, 0.5);
    expect(scene.fog.density).toBeLessThan(0.015);
  });

  it('should set biome density for forest (higher)', () => {
    const fog = new VolumetricFog(scene);
    fog.setBiome('Forest');
    fog.update(1.0, 64, 0.5);
    expect(scene.fog.density).toBeGreaterThan(0.001);
  });

  it('should set cave fog with high density and dark color', () => {
    const fog = new VolumetricFog(scene);
    fog.setCave(true);
    fog.update(1.0, 64, 0.5);
    expect(scene.fog.density).toBeGreaterThan(0.03);
  });

  it('should clear cave fog when setCave(false)', () => {
    const fog = new VolumetricFog(scene);
    fog.setCave(true);
    fog.update(1.0, 64, 0.5);
    fog.setCave(false);
    fog.setBiome('Plains');
    fog.update(1.0, 64, 0.5);
    expect(scene.fog.density).toBeLessThan(0.02);
  });

  it('should reduce density at higher altitude (below boost threshold)', () => {
    const fog = new VolumetricFog(scene);
    fog.setBiome('Plains');
    fog.update(1.0, 64, 0.5);
    const densityAt64 = scene.fog.density;
    fog.update(1.0, 75, 0.5);
    const densityAt75 = scene.fog.density;
    expect(densityAt75).toBeLessThan(densityAt64);
  });

  it('should set underwater fog', () => {
    const fog = new VolumetricFog(scene);
    fog.setUnderwater(true);
    expect(scene.fog.isFogExp2).toBe(true);
    expect(scene.fog.density).toBeGreaterThan(0.05);
  });

  it('should restore normal fog from underwater', () => {
    const fog = new VolumetricFog(scene);
    fog.setUnderwater(true);
    fog.setUnderwater(false);
    expect(scene.fog.density).toBeLessThan(0.05);
  });

  it('should disable fog', () => {
    const fog = new VolumetricFog(scene);
    fog.setEnabled(false);
    expect(scene.fog).toBeNull();
  });

  it('should re-enable fog', () => {
    const fog = new VolumetricFog(scene);
    fog.setEnabled(false);
    fog.setEnabled(true);
    expect(scene.fog).toBeTruthy();
    expect(scene.fog.isFogExp2).toBe(true);
  });

  it('should not update when disabled', () => {
    const fog = new VolumetricFog(scene);
    fog.setEnabled(false);
    fog.setBiome('Forest');
    fog.update(0.1, 64, 0.5);
    expect(scene.fog).toBeNull();
  });

  it('should change color based on time of day', () => {
    const fog = new VolumetricFog(scene);
    fog.setBiome('Plains');
    fog.update(1.0, 64, 0.5); // day
    const dayColor = scene.fog.color.hex;
    fog.update(1.0, 64, 0.1); // night
    const nightColor = scene.fog.color.hex;
    expect(dayColor).not.toBe(nightColor);
  });

  it('should have biome density map with expected biomes', () => {
    expect(BIOME_FOG_DENSITY.desert).toBeDefined();
    expect(BIOME_FOG_DENSITY.forest).toBeDefined();
    expect(BIOME_FOG_DENSITY.cave).toBeDefined();
    expect(BIOME_FOG_DENSITY.cave).toBeGreaterThan(BIOME_FOG_DENSITY.desert);
  });

  it('should use default density for unknown biome', () => {
    const fog = new VolumetricFog(scene);
    fog.setBiome('UnknownBiome');
    fog.update(0.1, 64, 0.5);
    expect(scene.fog.density).toBeGreaterThan(0);
  });

  it('should dispose properly', () => {
    const fog = new VolumetricFog(scene);
    fog.dispose();
    expect(scene.fog).toBeNull();
  });
});
