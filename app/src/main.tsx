import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './globals.css';

import { App } from './App';

/**
 * O ponto de entrada da aplicação. Renderiza o componente principal (`App`) dentro do `StrictMode`.
 * O ThemeProvider está dentro do componente App para manter o contexto co-localizado.
 *
 * O registro do Service Worker é gerenciado pelo vite-plugin-pwa (Workbox).
 * O sw.js é gerado automaticamente no build com um precache manifest baseado nos
 * hashes dos assets — a versão muda a cada deploy, garantindo que todos os usuários
 * recebam a versão mais recente sem precisar limpar o cache manualmente.
 */

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemento #root não encontrado para inicializar a aplicação.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
