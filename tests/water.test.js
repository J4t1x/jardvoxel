import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { WaterMaterialManager, WATER_COLORS, REFLECTION_RT_SIZE, REFLECTION_UPDATE_INTERVAL } from '../core/jardvoxel-survival-water.js';

describe('WaterMaterialManager', () => {
  let renderer, scene, camera;

  beforeEach(() => {
    renderer = new THREE.WebGLRenderer();
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 500);
  });

  it('should create a WaterMaterialManager with shader material', () => {
    const wmm = new WaterMaterialManager(renderer, scene, camera);
    expect(wmm.material).toBeTruthy();
    expect(wmm.material.uniforms).toBeTruthy();
    expect(wmm.material.uniforms.uTime).toBeDefined();
    expect(wmm.material.uniforms.uSkyColor).toBeDefined();
    expect(wmm.material.uniforms.uSunDirection).toBeDefined();
    expect(wmm.material.uniforms.uCameraPos).toBeDefined();
    expect(wmm.material.uniforms.uShallowColor).toBeDefined();
    expect(wmm.material.uniforms.uDeepColor).toBeDefined();
    expect(wmm.material.uniforms.uReflectionMap).toBeDefined();
    expect(wmm.material.uniforms.uReflectionStrength).toBeDefined();
    wmm.dispose();
  });

  it('should create reflection render target at correct size', () => {
    const wmm = new WaterMaterialManager(renderer, scene, camera);
    expect(wmm.reflectionRT).toBeTruthy();
    expect(wmm.reflectionRT.width).toBe(REFLECTION_RT_SIZE);
    expect(wmm.reflectionRT.height).toBe(REFLECTION_RT_SIZE);
    wmm.dispose();
  });

  it('should be transparent with depthWrite disabled', () => {
    const wmm = new WaterMaterialManager(renderer, scene, camera);
    expect(wmm.material.transparent).toBe(true);
    expect(wmm.material.depthWrite).toBe(false);
    wmm.dispose();
  });

  it('should update uTime on update()', () => {
    const wmm = new WaterMaterialManager(renderer, scene, camera);
    const initialTime = wmm.material.uniforms.uTime.value;
    wmm.update(0.016, null, null, null);
    expect(wmm.material.uniforms.uTime.value).toBeGreaterThan(initialTime);
    wmm.dispose();
  });

  it('should update camera position uniform', () => {
    const wmm = new WaterMaterialManager(renderer, scene, camera);
    const pos = new THREE.Vector3(10, 20, 30);
    wmm.update(0.016, pos, null, null);
    expect(wmm.material.uniforms.uCameraPos.value.x).toBe(10);
    expect(wmm.material.uniforms.uCameraPos.value.y).toBe(20);
    expect(wmm.material.uniforms.uCameraPos.value.z).toBe(30);
    wmm.dispose();
  });

  it('should update sky color', () => {
    const wmm = new WaterMaterialManager(renderer, scene, camera);
    const skyColor = new THREE.Color(0xff7a3d);
    wmm.update(0.016, null, skyColor, null);
    expect(wmm.material.uniforms.uSkyColor.value.hex).toBe(skyColor.hex);
    wmm.dispose();
  });

  it('should update sun direction', () => {
    const wmm = new WaterMaterialManager(renderer, scene, camera);
    const sunDir = new THREE.Vector3(1, 1, 0);
    wmm.update(0.016, null, null, sunDir);
    expect(wmm.material.uniforms.uSunDirection.value.x).toBeCloseTo(1 / Math.sqrt(2), 3);
    expect(wmm.material.uniforms.uSunDirection.value.y).toBeCloseTo(1 / Math.sqrt(2), 3);
    wmm.dispose();
  });

  it('should set water colors', () => {
    const wmm = new WaterMaterialManager(renderer, scene, camera);
    wmm.setWaterColors(0x5ac8e8, 0x1a4a7a);
    expect(wmm.material.uniforms.uShallowColor.value.hex).toBe(0x5ac8e8);
    expect(wmm.material.uniforms.uDeepColor.value.hex).toBe(0x1a4a7a);
    wmm.dispose();
  });

  it('should set reflection strength', () => {
    const wmm = new WaterMaterialManager(renderer, scene, camera);
    wmm.setReflectionStrength(0.8);
    expect(wmm.material.uniforms.uReflectionStrength.value).toBe(0.8);
    wmm.dispose();
  });

  it('should update reflection every N frames', () => {
    const wmm = new WaterMaterialManager(renderer, scene, camera);
    let renderCalls = 0;
    const origRender = renderer.render.bind(renderer);
    renderer.render = () => { renderCalls++; };
    for (let i = 0; i < REFLECTION_UPDATE_INTERVAL; i++) {
      wmm.update(0.016, null, null, null);
    }
    expect(renderCalls).toBeGreaterThanOrEqual(1);
    renderer.render = origRender;
    wmm.dispose();
  });

  it('should not crash when reflection RT is null after dispose', () => {
    const wmm = new WaterMaterialManager(renderer, scene, camera);
    wmm.dispose();
    expect(() => wmm.update(0.016, null, null, null)).not.toThrow();
  });

  it('should export WATER_COLORS with expected entries', () => {
    expect(WATER_COLORS.shallow).toBeDefined();
    expect(WATER_COLORS.deep).toBeDefined();
    expect(WATER_COLORS.river).toBeDefined();
    expect(WATER_COLORS.ocean_shallow).toBeDefined();
    expect(WATER_COLORS.ocean_deep).toBeDefined();
  });

  it('should dispose material and render target', () => {
    const wmm = new WaterMaterialManager(renderer, scene, camera);
    const mat = wmm.material;
    const rt = wmm.reflectionRT;
    wmm.dispose();
    expect(mat.disposed).toBe(true);
    expect(rt.disposed).toBe(true);
    expect(wmm.material).toBeNull();
    expect(wmm.reflectionRT).toBeNull();
  });

  it('should have vertex and fragment shaders', () => {
    const wmm = new WaterMaterialManager(renderer, scene, camera);
    expect(wmm.material.vertexShader).toContain('uTime');
    expect(wmm.material.vertexShader).toContain('uCameraPos');
    expect(wmm.material.fragmentShader).toContain('fresnel');
    expect(wmm.material.fragmentShader).toContain('caustics');
    expect(wmm.material.fragmentShader).toContain('uReflectionMap');
    wmm.dispose();
  });
});
