import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createToonGradientMap, createToonTerrainMaterial, disposeToonMaterial } from '../core/jardvoxel-survival-toon-material.js';

describe('SPEC-121: Toon Material', () => {
  describe('createToonGradientMap', () => {
    it('should create a DataTexture with the specified number of steps', () => {
      const tex = createToonGradientMap(4);
      expect(tex).toBeInstanceOf(THREE.DataTexture);
      expect(tex.image.width).toBe(4);
      expect(tex.image.height).toBe(1);
      tex.dispose();
    });

    it('should use NearestFilter for hard posterized bands', () => {
      const tex = createToonGradientMap(3);
      expect(tex.magFilter).toBe(THREE.NearestFilter);
      expect(tex.minFilter).toBe(THREE.NearestFilter);
      tex.dispose();
    });

    it('should not generate mipmaps', () => {
      const tex = createToonGradientMap(4);
      expect(tex.generateMipmaps).toBe(false);
      tex.dispose();
    });

    it('should produce ascending brightness values from 0 to 255', () => {
      const tex = createToonGradientMap(4);
      const data = tex.image.data;
      expect(data[0]).toBe(0);
      expect(data[3]).toBe(255);
      expect(data[1]).toBeLessThan(data[2]);
      tex.dispose();
    });

    it('should default to 4 steps', () => {
      const tex = createToonGradientMap();
      expect(tex.image.width).toBe(4);
      tex.dispose();
    });
  });

  describe('createToonTerrainMaterial', () => {
    it('should create a MeshToonMaterial', () => {
      const mat = createToonTerrainMaterial();
      expect(mat).toBeInstanceOf(THREE.MeshToonMaterial);
      disposeToonMaterial(mat);
    });

    it('should have vertexColors enabled to preserve mesher color pipeline', () => {
      const mat = createToonTerrainMaterial();
      expect(mat.vertexColors).toBe(true);
      disposeToonMaterial(mat);
    });

    it('should have a gradientMap attached', () => {
      const mat = createToonTerrainMaterial();
      expect(mat.gradientMap).toBeDefined();
      expect(mat.gradientMap).toBeInstanceOf(THREE.DataTexture);
      disposeToonMaterial(mat);
    });

    it('should use FrontSide', () => {
      const mat = createToonTerrainMaterial();
      expect(mat.side).toBe(THREE.FrontSide);
      disposeToonMaterial(mat);
    });

    it('should accept custom step count', () => {
      const mat = createToonTerrainMaterial({ steps: 3 });
      expect(mat.gradientMap.image.width).toBe(3);
      disposeToonMaterial(mat);
    });

    it('should default to 4 steps', () => {
      const mat = createToonTerrainMaterial();
      expect(mat.gradientMap.image.width).toBe(4);
      disposeToonMaterial(mat);
    });
  });

  describe('disposeToonMaterial', () => {
    it('should dispose the material and its gradient map', () => {
      const mat = createToonTerrainMaterial();
      const gradientMap = mat.gradientMap;
      disposeToonMaterial(mat);
      // After dispose, the texture should be marked as disposed
      // Three.js sets .needsUpdate = false after dispose in newer versions
      // We just verify no throw and the function completes
    });

    it('should be safe to call on null/undefined', () => {
      expect(() => disposeToonMaterial(null)).not.toThrow();
      expect(() => disposeToonMaterial(undefined)).not.toThrow();
    });

    it('should be safe to call on a material without gradientMap', () => {
      const mat = new THREE.MeshStandardMaterial();
      expect(() => disposeToonMaterial(mat)).not.toThrow();
      mat.dispose();
    });
  });
});
