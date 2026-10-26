import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Percorsi relativi: l'app funziona anche in una sottocartella (es. GitHub Pages)
  base: './',
  // Three.js da solo pesa circa 600 kB: è normale, non serve l'avviso
  build: { chunkSizeWarningLimit: 900 },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icone/apple-touch-icon.png'],
      manifest: {
        name: 'Giardino Bonsai',
        short_name: 'Bonsai',
        description: 'Prenditi cura del tuo bonsai, un giorno alla volta.',
        lang: 'it',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#bfe0ea',
        theme_color: '#bfe0ea',
        icons: [
          { src: 'icone/icona-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icone/icona-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icone/icona-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,woff2}'],
      },
    }),
  ],
});
