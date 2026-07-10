// ═══════════════════════════════════════════════════════════
// SPEC-121: Ghibli-Style Toon Material
// Posterized lighting using THREE.MeshToonMaterial + gradient map.
// Zero extra render passes — works with postprocessing: false.
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';

/**
 * Creates a small 1D gradient texture for MeshToonMaterial.
 * Each pixel is a discrete brightness band — NearestFilter gives
 * the hard posterized steps characteristic of cel-shading.
 *
 * @param {number} steps - Number of brightness bands (3-4 typical)
 * @returns {THREE.DataTexture}
 */
export function createToonGradientMap(steps = 4) {
  const data = new Uint8Array(steps);
  for (let i = 0; i < steps; i++) {
    data[i] = Math.round((i / (steps - 1)) * 255);
  }
  const texture = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a MeshToonMaterial configured for the voxel terrain.
 * Preserves the existing vertex-color pipeline (block palette +
 * jitter + face shade + AO from the mesher) as the input color.
 *
 * @param {object} [opts]
 * @param {number} [opts.steps=4] - Discrete lighting bands
 * @returns {THREE.MeshToonMaterial}
 */
export function createToonTerrainMaterial(opts = {}) {
  const steps = opts.steps ?? 4;
  const gradientMap = createToonGradientMap(steps);
  return new THREE.MeshToonMaterial({
    vertexColors: true,
    gradientMap,
    side: THREE.FrontSide,
  });
}

/**
 * Disposes a toon material and its gradient map texture.
 * Safe to call on any material — checks for gradientMap presence.
 *
 * @param {THREE.Material} material
 */
export function disposeToonMaterial(material) {
  if (!material) return;
  if (material.gradientMap) {
    material.gradientMap.dispose();
  }
  material.dispose();
}
