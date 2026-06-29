import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
  },
  resolve: {
    alias: [
      { find: 'three/addons/postprocessing/EffectComposer.js', replacement: path.resolve(__dirname, 'tests/mocks/effect-composer.js') },
      { find: 'three/addons/postprocessing/RenderPass.js', replacement: path.resolve(__dirname, 'tests/mocks/render-pass.js') },
      { find: 'three/addons/postprocessing/SSAOPass.js', replacement: path.resolve(__dirname, 'tests/mocks/ssao-pass.js') },
      { find: 'three/addons/postprocessing/UnrealBloomPass.js', replacement: path.resolve(__dirname, 'tests/mocks/unreal-bloom-pass.js') },
      { find: 'three/addons/postprocessing/OutputPass.js', replacement: path.resolve(__dirname, 'tests/mocks/output-pass.js') },
      { find: 'three', replacement: path.resolve(__dirname, 'tests/mocks/three.js') },
      { find: 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js', replacement: path.resolve(__dirname, 'tests/mocks/three.js') },
    ],
  },
});
