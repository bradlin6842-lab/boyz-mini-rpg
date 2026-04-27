import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      phaser: fileURLToPath(new URL('./src/shims/phaser.ts', import.meta.url))
    }
  },
  server: {
    port: 5173,
    host: true
  }
});
