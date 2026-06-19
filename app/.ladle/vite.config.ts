import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../src', import.meta.url)),
    },
  },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify('ladle-dev'),
    'import.meta.env.VITE_BUILD_ID': JSON.stringify('ladle'),
    'import.meta.env.VITE_API_VERSION': JSON.stringify('v1'),
    'import.meta.env.VITE_TENANT_SLUG': JSON.stringify('ufmg'),
  },
});
