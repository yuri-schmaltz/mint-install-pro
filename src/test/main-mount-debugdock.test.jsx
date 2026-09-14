// main-mount-debugdock.test.jsx — regressão bidirecional do DebugDock.
//
// HISTÓRICO:
//   - v1.3.2 hotfix 6: DebugDock implementado + montado em produção
//   - v1.4.0:           DebugDock removido da tela principal (decisão UX)
//   - v1.4.1:           DebugDock reativado após achado crítico #1 da auditoria
//                       (estava implementado mas não montado — usuário sem
//                       acesso ao snapshot de logs)
//   - v1.5.1:           DebugDock removido novamente por pedido do usuário
//                       (atrapalhava a UI em produção, screenshot anexo)
//
// DECISÃO ATUAL: DebugDock fica REMOVIDO de main.jsx por padrão. A
// infraestrutura de diagnóstico (debugLog + emergency handlers +
// ErrorBoundary.pushLastReactError) continua ativa e persiste em
// localStorage, mas o painel visual está oculto. Para diagnosticar em
// campo, basta adicionar manualmente <DebugDock /> no render() abaixo.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

vi.mock('../App', () => ({ default: () => null }));
vi.mock('../components/ErrorBoundary', () => ({
  default: ({ children }) => children
}));

describe('main.jsx — DebugDock fora da tela principal (v1.5.1+)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    vi.resetModules();
  });

  it('NÃO monta <DebugDock /> no root (removido da UI por UX)', async () => {
    await import('../main.jsx');
    await new Promise((r) => setTimeout(r, 50));

    // Procura por sinais do DebugDock no DOM renderizado.
    const debugBtn = document.querySelector('[title="Abrir painel de diagnóstico"]');
    expect(debugBtn).toBeNull();
    const debugText = document.body.textContent?.match(/DEBUG \(\d+\)/);
    expect(debugText).toBeNull();
  });

  it('NÃO importa o componente DebugDock (mantém bundle menor)', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/main.jsx'),
      'utf-8'
    );
    // Detecta import statement real (não comentário nem string)
    // `import DebugDock from` precisa estar no source (não em comentário // ou /* */)
    const importLines = source
      .split('\n')
      .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
      .join('\n');
    expect(importLines).not.toMatch(/import\s+DebugDock\s+from/);
    // Detecta JSX element real (não dentro de comentário)
    const jsxLines = source
      .split('\n')
      .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
      .join('\n');
    expect(jsxLines).not.toMatch(/<DebugDock\s*\/>/);
  });

  it('infra de logging continua importada (debugLog + pushEmergencyLog)', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/main.jsx'),
      'utf-8'
    );
    // Mantém a infra de diagnóstico funcional para casos extremos
    expect(source).toMatch(/import\s+\{[^}]*debugLog/);
    expect(source).toMatch(/import\s+\{[^}]*pushEmergencyLog/);
    // Handlers globais continuam registrados
    expect(source).toMatch(/window\.addEventListener\('error'/);
    expect(source).toMatch(/window\.addEventListener\('unhandledrejection'/);
  });
});
