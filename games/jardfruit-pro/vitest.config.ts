import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@config': path.resolve(__dirname, 'src/config'),
      '@systems': path.resolve(__dirname, 'src/systems'),
      '@scenes': path.resolve(__dirname, 'src/scenes'),
      '@audio': path.resolve(__dirname, 'src/audio'),
      '@store': path.resolve(__dirname, 'src/store'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
