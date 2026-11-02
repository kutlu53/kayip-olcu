import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // Akilli tahtalardaki eski Chromium surumleri icin
  build: { target: 'es2019' },
  server: { host: true }
});
