import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './globals.css';

import { App } from './App';

/**
 * O ponto de entrada da aplicação. Renderiza o componente principal (`App`) dentro do `StrictMode`.
 * O ThemeProvider está dentro do componente App para manter o contexto co-localizado.
 */
// Registra o Service Worker para caching offline (apenas em produção)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
      })
      .then((reg) => {
        // Detecta quando um novo SW foi instalado e força reload para aplicar o cache limpo.
        // A condição navigator.serviceWorker.controller garante que o reload só ocorre
        // para usuários que já tinham um SW antigo ativo (os afetados pela tela branca).
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                window.location.reload();
              }
            };
          }
        };
      });
  });
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemento #root não encontrado para inicializar a aplicação.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
