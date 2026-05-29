import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import packageJson from '../package.json';

const buildId = new Date().toISOString();

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // O novo SW é instalado e ativado automaticamente em background.
      // Quando o Workbox detecta que o sw.js mudou (hash novo a cada build),
      // o novo SW toma controle sem interação do usuário.
      registerType: 'autoUpdate',

      // O registro é manual em src/main.tsx via virtual:pwa-register.
      // Em vite-plugin-pwa@1.x, use `false` para impedir a injeção automática
      // de registerSW.js no HTML gerado.
      injectRegister: false,

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

        // Remove caches antigos do Workbox quando a estratégia mudar entre builds.
        cleanupOutdatedCaches: true,
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
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    },
    fs: {
      // Permite que o servidor de desenvolvimento acesse o workspace e o
      // node_modules compartilhado na raiz do monorepo. Sem isso, os arquivos
      // do @fontsource/poppins resolvidos via pnpm ficam fora da allow list
      // e retornam 403 no ambiente local.
      allow: ['..', '../..'],
    },
  },
  preview: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    },
  },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
    'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildId),
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
