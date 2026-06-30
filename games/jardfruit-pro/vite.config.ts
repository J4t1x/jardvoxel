import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
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
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'JardFruit Cocktail',
        short_name: 'JardFruit',
        start_url: '.',
        display: 'standalone',
        background_color: '#0d0d1a',
        theme_color: '#ffd700',
        icons: [],
      },
    }),
  ],
});
