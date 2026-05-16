import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const repoName = process.env.GITHUB_REPOSITORY
  ? '/' + process.env.GITHUB_REPOSITORY.split('/')[1] + '/'
  : '/'

export default defineConfig({
  base: repoName,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: "Bheem's Daily Tracker 🐾",
        short_name: 'Bheem',
        description: "Track Bheem's food, activities, health & more",
        theme_color: '#0053e2',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: repoName,
        start_url: repoName,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.github\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'github-api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 300 } }
          }
        ]
      }
    })
  ]
})
