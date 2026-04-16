import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { ghPages } from 'vite-plugin-gh-pages';
import { VitePWA } from 'vite-plugin-pwa';
import packageJson from '../package.json';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ghPages(),
    VitePWA({
      // O novo SW é instalado e ativado automaticamente em background.
      // Quando o Workbox detecta que o sw.js mudou (hash novo a cada build),
      // o novo SW toma controle sem interação do usuário.
      registerType: 'autoUpdate',

      // Injeta automaticamente o script de registro do SW no index.html.
      // O registro acontece silenciosamente ao carregar a página.
      injectRegister: 'auto',

      // Workbox gera o sw.js automaticamente com precache manifest baseado nos
      // hashes do build — zero manutenção manual de versão.
      strategies: 'generateSW',

      workbox: {
        // Precacheia todos os assets estáticos gerados pelo build
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],

        // SPA fallback: todas as navegações servem o index.html
        navigateFallback: '/ufmg/index.html',

        // Não intercepta requests para os dados JSON nem para o manifesto PWA.
        // O manifesto é fetchado pelo browser como navigate request em alguns browsers
        // (Chrome); sem esta exclusão o SW retornaria index.html no lugar do JSON,
        // causando "Manifest: Line 1, column 1, Syntax error".
        navigateFallbackDenylist: [/^\/ufmg\/data\//, /\/site\.webmanifest$/],

        // Ativa imediatamente ao instalar (sem esperar fechar todas as abas)
        skipWaiting: true,

        // Toma controle de todas as abas abertas assim que ativa
        clientsClaim: true,

        runtimeCaching: [
          {
            // Dados JSON: stale-while-revalidate
            // Serve do cache imediatamente e atualiza em background
            urlPattern: /\/ufmg\/data\/.+\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'interno-rotas-data',
            },
          },
        ],
      },

      // Não sobrescreve o site.webmanifest existente em public/
      manifest: false,
    }),
  ],
  base: '/ufmg/',
  resolve: {
    alias: {
      // Deve corresponder ao paths em tsconfig.json e tsconfig.app.json
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    },
    fs: {
      // Permite que o servidor de desenvolvimento acesse node_modules do workspace
      // raiz (pnpm usa symlinks que resolvem para fora do diretório app/).
      allow: ['..'],
    },
  },
  preview: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    },
  },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Leaflet e dependências de mapa — chunk separado, muda raramente
          if (id.includes('leaflet')) {
            return 'vendor-leaflet';
          }

          // React core — chunk separado para cache independente
          if (id.includes('react') || id.includes('scheduler')) {
            return 'vendor-react';
          }

          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }

          if (id.includes('date-fns')) {
            return 'vendor-date';
          }

          return 'vendor-misc';
        },
      },
    },
  },
});
