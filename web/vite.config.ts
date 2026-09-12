import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-vite-plugin';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

const backendPort = Number(process.env.HAVIT_E2E_BACKEND_PORT ?? 3000);
const devPort = Number(process.env.HAVIT_E2E_FRONTEND_PORT ?? 5173);

export default defineConfig({
  plugins: [
    tanstackRouter({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
      routeFileIgnorePrefix: "-",
      quoteStyle: "single"
    }),
    vanillaExtractPlugin(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Havit',
        short_name: 'Havit',
        description: '个人与家庭的全资产台账',
        theme_color: '#ad3a25',
        background_color: '#f4f1e9',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'zh-CN',
        icons: [
          {
            src: '/pwa-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: '/pwa-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api/v1/items') ||
              url.pathname.startsWith('/api/v1/locations'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'havit-api-read-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxAgeSeconds: 60 * 60,
                maxEntries: 80,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: '../internal/static/dist',
    emptyOutDir: true,
  },
  server: {
    port: devPort,
    proxy: {
      '/api': `http://localhost:${backendPort}`,
    },
  },
});
