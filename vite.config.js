import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['mikios-logo.svg', 'favicon.png', 'apple-touch-icon.png', 'og-image.svg', 'robots.txt'],
      manifest: {
        name: 'mikiOS - Smart Restaurant Management',
        short_name: 'mikiOS',
        description: 'Premium QR Menu & Kitchen Operating System',
        theme_color: '#ca8a04',
        icons: [
          {
            src: 'mikios-logo.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'mikios-logo.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\/menu.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'menu-api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\/api\/restaurant.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'restaurant-api-cache',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
