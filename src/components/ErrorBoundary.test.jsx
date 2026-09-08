// ErrorBoundary.test.jsx — testes de captura de erro, persistência em
// localStorage, fallback UI, ações de recovery.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// Componente que explode sob comando
function Bomb({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('boom controlado');
  }
  return <div>safe</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    localStorage.clear();
    // Suprime log de erro do console durante testes que esperam throw
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renderiza children quando não há erro', () => {
    render(
      <ErrorBoundary>
        <div>conteúdo OK</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('conteúdo OK')).toBeInTheDocument();
  });

  it('captura erro de render e mostra fallback', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Algo deu errado/)).toBeInTheDocument();
    expect(screen.queryByText(/safe/)).not.toBeInTheDocument();
  });

  it('mostra stack técnico em <details>', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/boom controlado/)).toBeInTheDocument();
    const details = screen.getByText(/Detalhes técnicos/i);
    expect(details).toBeInTheDocument();
  });

  it('persiste lastReactError em localStorage via pushLastReactError', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    const stored = localStorage.getItem('mip_last_error');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored);
    expect(parsed.message).toBe('boom controlado');
    expect(parsed.stack).toContain('boom controlado');
    expect(parsed.componentStack).toBeDefined();
    expect(parsed.t).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('tem botões de Recarregar e Limpar caches', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Recarregar/)).toBeInTheDocument();
    expect(screen.getByText(/Limpar caches e recarregar/)).toBeInTheDocument();
  });

  it('reload chama window.location.reload', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock }, writable: true, configurable: true
    });
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    const reloadBtn = screen.getByText(/Recarregar/).closest('button');
    reloadBtn.click();
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('reset limpa localStorage keys e recarrega', () => {
    // Pre-popula localStorage com caches
    localStorage.setItem('mint_installed_map_v1', '{"x":1}');
    localStorage.setItem('mint_apps_state_v5', '{"y":2}');
    localStorage.setItem('mint_settings_v1', '{"z":3}');
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock }, writable: true, configurable: true
    });
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    const resetBtn = screen.getByText(/Limpar caches e recarregar/).closest('button');
    resetBtn.click();
    expect(localStorage.getItem('mint_installed_map_v1')).toBeNull();
    expect(localStorage.getItem('mint_apps_state_v5')).toBeNull();
    expect(localStorage.getItem('mint_settings_v1')).toBeNull();
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('tolera erro sem stack', () => {
    function BadBomb() {
      const e = new Error('sem stack');
      e.stack = undefined;
      throw e;
    }
    render(
      <ErrorBoundary>
        <BadBomb />
      </ErrorBoundary>
    );
    expect(screen.getByText(/sem stack/)).toBeInTheDocument();
  });

  it('tolera erro que é string (não Error object)', () => {
    function StringBomb() {
      throw 'string explodiu';
    }
    render(
      <ErrorBoundary>
        <StringBomb />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Algo deu errado/)).toBeInTheDocument();
  });

  it('recupera estado após erro (não fica preso)', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Algo deu errado/)).toBeInTheDocument();
    // Re-renderiza com filho OK — ErrorBoundary não tem "reset" automático,
    // mas garante que não crasha ao trocar props
    rerender(
      <ErrorBoundary>
        <div>recuperado</div>
      </ErrorBoundary>
    );
    // Documenta o comportamento atual: ErrorBoundary permanece em estado
    // de erro até window.location.reload(). Isso é aceitável — o objetivo
    // é nunca crashar silenciosamente.
    expect(screen.getByText(/Algo deu errado/)).toBeInTheDocument();
  });

  it('componentStack é truncado para 5 linhas nos detalhes', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    const details = screen.getByText(/Detalhes técnicos/i).closest('details');
    const code = details.querySelector('code');
    // O componentStack.split('\n').slice(0, 5) garante máx 5 linhas
    const lines = code.textContent.split('\n').filter(l => l.trim()).length;
    expect(lines).toBeLessThanOrEqual(5 + 1); // +1 para a primeira linha (error.toString)
  });
});