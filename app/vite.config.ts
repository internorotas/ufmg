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

      // Registro manual permanece em src/main.tsx.
      injectRegister: null,

      // Fase 3: SW customizado para suportar handlers de push.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        // Inclui JSON para manter dados de linhas/paradas disponíveis offline.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,json}'],
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
    fs: {
      // Permite que o servidor de desenvolvimento acesse o workspace e o
      // node_modules compartilhado na raiz do monorepo. Sem isso, os arquivos
      // do @fontsource/poppins resolvidos via pnpm ficam fora da allow list
      // e retornam 403 no ambiente local.
      allow: ['..', '../..'],
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
