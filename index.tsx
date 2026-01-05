
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Registro do Service Worker otimizado para ambientes de sandbox
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Usamos caminho relativo para evitar erro de origin mismatch em iframes
    navigator.serviceWorker.register('sw.js', { scope: './' })
      .then(registration => {
        console.log('SW ativo no escopo:', registration.scope);
      })
      .catch(error => {
        // Silenciamos o erro de origem se estivermos em ambiente de desenvolvimento restrito
        if (!window.location.host.includes('localhost')) {
          console.warn('Service Worker não suportado neste ambiente de preview (Sandbox).');
        } else {
          console.error('Falha ao registrar SW:', error);
        }
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
