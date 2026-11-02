import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  // Akilli tahtalardaki eski Chromium surumleri icin
  build: { target: 'es2019' },
  server: { host: true },
  plugins: [
    // Cevrim disi calisma: tum dosyalar ilk acilista onbellege alinir (CLAUDE.md §0)
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Kayıp Ölçü',
        short_name: 'Kayıp Ölçü',
        description: '9. sınıf fizik "Kuvvet ve Hareket" ünitesi için hikâye odaklı oyun',
        lang: 'tr',
        start_url: './',
        scope: './',
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#05070D',
        theme_color: '#05070D',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      }
    })
  ]
});
