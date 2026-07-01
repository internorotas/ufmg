import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../src', import.meta.url)),
      'react-map-gl/maplibre': fileURLToPath(
        new URL('../node_modules/react-map-gl/dist/maplibre.js', import.meta.url),
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    fs: {
      // Permite acesso ao workspace raiz (node_modules compartilhado do monorepo)
      // e aos internals do @ladle/react fora da pasta do app.
      allow: ['..', '../..', '../../..'],
    },
  },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify('ladle-dev'),
    'import.meta.env.VITE_BUILD_ID': JSON.stringify('ladle'),
    'import.meta.env.VITE_API_VERSION': JSON.stringify('v1'),
    'import.meta.env.VITE_TENANT_SLUG': JSON.stringify('ufmg'),
  },
});
