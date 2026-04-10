import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { ghPages } from 'vite-plugin-gh-pages';
import packageJson from '../package.json';

export default defineConfig({
  plugins: [react(), tailwindcss(), ghPages()],
  base: '/ufmg/',
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
