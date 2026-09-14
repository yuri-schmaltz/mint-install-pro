// main.jsx — entry point. Renderiza <App /> dentro de <ErrorBoundary>.
//
// O DebugDock foi removido da tela principal em v1.5.1 após o usuário
// reportar que atrapalhava a UI. A infraestrutura de diagnóstico
// (debugLog + emergency handlers + ErrorBoundary.pushLastReactError)
// continua ativa e persiste em localStorage — basta montar o <DebugDock />
// manualmente em debug builds pra ter acesso ao snapshot.
//
// Handlers globais (window.onerror + unhandledrejection) capturam erros
// que ErrorBoundary não pega (setTimeout, promise, async event handler).
// Persistem em localStorage[mip_emergency_log] pra análise posterior.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { debugLog, pushEmergencyLog } from './services/debugLog';
import './index.css';

// === Handlers de emergência (sempre registram, mesmo antes do React) ===

window.addEventListener('error', (event) => {
  pushEmergencyLog('window.error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  });
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  pushEmergencyLog('unhandledrejection', {
    message: reason?.message || String(reason),
    stack: reason?.stack,
    name: reason?.name
  });
});

debugLog('info', 'main', 'Inicializando Mint Install Pro', {
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a',
  href: typeof window !== 'undefined' ? window.location.href : 'n/a'
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
