// integration-flow.test.jsx — teste end-to-end do fluxo crítico.
// Validação completa do DebugDock + debugLog em cenários reais.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Bug: () => null,
  Copy: () => null,
  Check: () => null,
  Trash2: () => null,
  X: () => null
}));

import DebugDock from '../components/DebugDock';

describe('fluxo end-to-end do DebugDock', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('happy path: open, ver estado, copiar JSON', async () => {
    localStorage.setItem('mip_debug_log_v1', JSON.stringify([
      { t: '2026-01-01T00:00:00Z', lvl: 'info', cmp: 'App', msg: 'inicializando', data: null }
    ]));

    const writeMock = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeMock },
      writable: true,
      configurable: true
    });

    render(<DebugDock />);
    const btn = screen.getByTitle('Abrir painel de diagnóstico');
    // DebugDock é lazy: só lê o snapshot ao clicar
    expect(btn.textContent).toMatch(/DEBUG \(0\)/);

    fireEvent.click(btn);
    // Após abrir, contador atualiza
    expect(btn.textContent).toMatch(/DEBUG \(1\)/);
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toMatch(/entries: 1/);
    expect(dialog.textContent).toContain('inicializando');

    const copyBtn = screen.getByRole('button', { name: /Copiar JSON/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeMock).toHaveBeenCalledTimes(1);
    const payload = writeMock.mock.calls[0][0];
    const parsed = JSON.parse(payload);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.emergencyLog).toEqual([]);
    expect(parsed.lastReactError).toBeNull();
  });

  it('ring buffer: trunca para 200 mais recentes', () => {
    const arr = [];
    for (let i = 0; i < 250; i++) {
      arr.push({ t: '2026-01-01', lvl: 'info', cmp: 'X', msg: 'e' + i, data: null });
    }
    localStorage.setItem('mip_debug_log_v1', JSON.stringify(arr));

    render(<DebugDock />);
    fireEvent.click(screen.getByTitle('Abrir painel de diagnóstico'));
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain('e249');
    expect(dialog.textContent).not.toContain('e0');
  });

  it('JSON malformado no localStorage: degrada gracefully', () => {
    localStorage.setItem('mip_debug_log_v1', '{corrompido');

    expect(() => render(<DebugDock />)).not.toThrow();
    fireEvent.click(screen.getByTitle('Abrir painel de diagnóstico'));
    expect(screen.getByRole('dialog').textContent).toMatch(/entries: 0/);
  });

  it('botão renderiza mesmo sem dados', () => {
    render(<DebugDock />);
    expect(screen.getByTitle('Abrir painel de diagnóstico')).toBeInTheDocument();
  });

  it('lastReactError aparece quando persistido', () => {
    localStorage.setItem('mip_last_error', JSON.stringify({
      t: '2026-01-01', message: 'react crash', stack: 'stack', componentStack: 'cmp'
    }));

    render(<DebugDock />);
    fireEvent.click(screen.getByTitle('Abrir painel de diagnóstico'));
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toMatch(/reactError: sim/);
    expect(dialog.textContent).toContain('react crash');
  });

  it('emergency log aparece', () => {
    localStorage.setItem('mip_emergency_log', JSON.stringify([
      { t: '2026-01-01', kind: 'window.error', info: { message: 'crash' } }
    ]));

    render(<DebugDock />);
    fireEvent.click(screen.getByTitle('Abrir painel de diagnóstico'));
    expect(screen.getByRole('dialog').textContent).toContain('crash');
  });

  it('botão Limpar apaga todas as chaves mip_*', () => {
    localStorage.setItem('mip_debug_log_v1', '[{"t":"t","lvl":"i","cmp":"x","msg":"m","data":null}]');
    localStorage.setItem('mip_emergency_log', '[{"t":"t","kind":"k","info":{}}]');
    localStorage.setItem('mip_last_error', '{"message":"x"}');

    render(<DebugDock />);
    fireEvent.click(screen.getByTitle('Abrir painel de diagnóstico'));
    fireEvent.click(screen.getByRole('button', { name: /Limpar/i }));

    expect(localStorage.getItem('mip_debug_log_v1')).toBeNull();
    expect(localStorage.getItem('mip_emergency_log')).toBeNull();
    expect(localStorage.getItem('mip_last_error')).toBeNull();
  });
});