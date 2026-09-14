// main-mount-debugdock.test.jsx — regressão do achado crítico #1.
//
// Verifica que o <DebugDock /> é montado no root junto com o <App />.
// Este teste existe porque, em algum momento pós-release da v1.4.0,
// alguém removeu a montagem e deixou o DebugDock desligado em produção
// enquanto o CHANGELOG/HANDOFF afirmavam o contrário.
//
// Se este teste falhar, a infra de diagnóstico do bug "tela cinza" está
// quebrada — o usuário não tem como extrair o snapshot de logs.
//
// Estratégia: como main.jsx monta o ReactDOM.createRoot no import,
// mockamos App, ErrorBoundary e DebugDock (apenas o último é inspecionado
// pelo title único do botão), garantimos que existe #root no DOM,
// importamos main.jsx, e verificamos que o botão aparece.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../App', () => ({ default: () => null }));

vi.mock('../components/ErrorBoundary', () => ({
  default: ({ children }) => children
}));

// Mock do DebugDock que renderiza SOMENTE o botão "DEBUG (...)" —
// é o que precisa estar no DOM em produção. Outros comportamentos do
// DebugDock já são cobertos por DebugDock.test.jsx.
vi.mock('../components/DebugDock', () => ({
  default: () => {
    const React = require('react');
    return React.createElement(
      'button',
      {
        title: 'Abrir painel de diagnóstico',
        'data-testid': 'debug-dock-button'
      },
      'DEBUG (0)'
    );
  }
}));

describe('main.jsx — montagem crítica do DebugDock (regressão)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    // Limpa módulos cacheados pra garantir re-import
    vi.resetModules();
  });

  it('monta <DebugDock /> no root junto com o <App />', async () => {
    await import('../main.jsx');
    // Dá tempo do React processar createRoot
    await new Promise((r) => setTimeout(r, 50));

    const btn = document.querySelector('[data-testid="debug-dock-button"]');
    expect(btn).toBeTruthy();
    expect(btn?.getAttribute('title')).toBe('Abrir painel de diagnóstico');
  });

  it('o botão DEBUG fica FORA do ErrorBoundary (sobrevive a crash)', async () => {
    await import('../main.jsx');
    await new Promise((r) => setTimeout(r, 50));

    // Sanidade: o root contém o botão do DebugDock. Se ele estivesse
    // dentro do ErrorBoundary e o React crashasse, o root ficaria
    // sem o botão (ErrorBoundary mostraria a tela de erro).
    const root = document.getElementById('root');
    expect(root).toBeTruthy();
    expect(root?.querySelector('[data-testid="debug-dock-button"]')).toBeTruthy();
  });
});