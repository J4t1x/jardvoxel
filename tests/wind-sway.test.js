import { describe, it, expect } from 'vitest';
import { InstancedFeatureRenderer } from '../core/jardvoxel-survival-instanced.js';
import { MC_BLOCKS } from '../core/blocks-registry.js';

// Minimal scene stub — these tests only exercise material creation, not
// buildForChunk (which needs a full VoxelChunk + real InstancedMesh).
const fakeScene = { add() {}, remove() {} };

describe('Grass wind sway (Zen2)', () => {
  it('is off by default — survival/zen materials unchanged', () => {
    const renderer = new InstancedFeatureRenderer(fakeScene);
    const mat = renderer._getMaterial(MC_BLOCKS.TALL_GRASS);
    expect(mat.onBeforeCompile).toBeUndefined();
  });

  it('injects onBeforeCompile + a distinct program cache key when enabled', () => {
    const renderer = new InstancedFeatureRenderer(fakeScene, { windSway: true });
    const mat = renderer._getMaterial(MC_BLOCKS.TALL_GRASS);
    expect(typeof mat.onBeforeCompile).toBe('function');
    expect(typeof mat.customProgramCacheKey).toBe('function');
    expect(mat.customProgramCacheKey()).toBe('jardvoxel-windsway-v1');
  });

  it('shares one material (and one wind-sway hook) across all instances of a block type', () => {
    const renderer = new InstancedFeatureRenderer(fakeScene, { windSway: true });
    const matA = renderer._getMaterial(MC_BLOCKS.TALL_GRASS);
    const matB = renderer._getMaterial(MC_BLOCKS.TALL_GRASS);
    expect(matA).toBe(matB);
  });

  it('update(dt) advances the shared wind clock only when enabled', () => {
    const on = new InstancedFeatureRenderer(fakeScene, { windSway: true });
    on.update(0.5);
    on.update(0.25);
    expect(on._windUniforms.uTime.value).toBeCloseTo(0.75);

    const off = new InstancedFeatureRenderer(fakeScene);
    off.update(0.5);
    expect(off._windUniforms.uTime.value).toBe(0);
  });

  it('vertex shader injection pins the root and sways the tip via #include <begin_vertex>', () => {
    const renderer = new InstancedFeatureRenderer(fakeScene, { windSway: true });
    const mat = renderer._getMaterial(MC_BLOCKS.TALL_GRASS);
    const shader = { vertexShader: '#include <common>\nvoid main() {\n#include <begin_vertex>\n}', uniforms: {} };
    mat.onBeforeCompile(shader);
    expect(shader.vertexShader).toContain('uniform float uTime');
    expect(shader.vertexShader).toContain('swayWeight = position.y');
    expect(shader.uniforms.uTime).toBe(renderer._windUniforms.uTime);
    expect(shader.uniforms.uWindDir).toBe(renderer._windUniforms.uWindDir);
  });
});
