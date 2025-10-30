import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

import { appMetadata } from './src/config/app-metadata';

const buildVersion = process.env.BUILD_VERSION ?? new Date().toISOString();

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['/icons/app-icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/assets/'),
            handler: 'CacheFirst',
            options: {
              cacheName: `shell-assets-${buildVersion}`,
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: new RegExp(
              String.raw`/${appMetadata.offlineSnapshotName}\.json$`,
            ),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: `offline-brief-${buildVersion}`,
              expiration: {
                maxEntries: 1,
              },
            },
          },
        ],
      },
      manifest: {
        name: appMetadata.name,
        short_name: appMetadata.shortName,
        description: appMetadata.description,
        theme_color: appMetadata.themeColor,
        background_color: appMetadata.backgroundColor,
        start_url: '/brief',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icons/app-icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: '/icons/app-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  define: {
    __BUILD_VERSION__: JSON.stringify(buildVersion),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
