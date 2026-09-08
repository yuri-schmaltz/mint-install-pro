// DebugDock.test.jsx — testes de render, comportamento e acessibilidade
// do dock de diagnóstico. Cobre: visibilidade do botão, abertura/fechamento
// do painel, leitura do snapshot, copy/clear, auto-refresh.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

// Mock lucide-react (SVGs não rodam bem em jsdom)
vi.mock('lucide-react', () => ({
  Bug: () => null,
  Copy: () => null,
  Check: () => null,
  Trash2: () => null,
  X: () => null
}));

import DebugDock from './DebugDock';

// Mock navigator.clipboard pra testes determinísticos
const mockWriteText = vi.fn(() => Promise.resolve());
beforeEach(() => {
  mockWriteText.mockClear();
  if (typeof navigator !== 'undefined') {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true
    });
    // Spy em window.alert pra adversarial test
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  }
  // Limpa localStorage rigorosamente
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
});

afterEach(() => {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
});

describe('DebugDock', () => {
  // Helper: getByTitle é mais robusto que getByRole porque o accessible
  // name do botão vem do textContent "DEBUG (N)" e queremos achar pelo title
  const openButton = () => screen.getByTitle('Abrir painel de diagnóstico');

  describe('botão fixo (sempre visível)', () => {
    it('renderiza botão DEBUG com contador de entries', () => {
      render(<DebugDock />);
      const btn = openButton();
      expect(btn).toBeInTheDocument();
      expect(btn.textContent).toMatch(/DEBUG \(0\)/);
    });

    it('botão tem z-index alto (sobrevive a overlays)', () => {
      render(<DebugDock />);
      const btn = openButton();
      expect(btn.style.zIndex).toBe('9999');
      expect(btn.style.position).toBe('fixed');
    });

    it('botão tem position fixed bottom-left (canto inferior esquerdo)', () => {
      render(<DebugDock />);
      const btn = openButton();
      expect(btn.style.position).toBe('fixed');
      expect(btn.style.bottom).toBe('12px');
      expect(btn.style.left).toBe('12px');
    });
  });

  describe('abrir/fechar painel', () => {
    it('não renderiza painel inicialmente', () => {
      render(<DebugDock />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('abre painel ao clicar no botão', () => {
      render(<DebugDock />);
      fireEvent.click(openButton());
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('fecha painel ao clicar no X', () => {
      render(<DebugDock />);
      fireEvent.click(openButton());
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      fireEvent.click(screen.getByTitle('Fechar'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('atualiza contador no botão após abrir painel (se houver logs)', async () => {
      localStorage.setItem('mip_debug_log_v1', JSON.stringify([
        { t: '2026-01-01T00:00:00Z', lvl: 'info', cmp: 'Test', msg: 'pre', data: null }
      ]));
      render(<DebugDock />);
      const btn = openButton();
      fireEvent.click(btn);
      // Re-render após click mostra o snapshot
      expect(btn.textContent).toMatch(/DEBUG \(1\)/);
    });
  });

  describe('painel: contadores e estado', () => {
    it('mostra entries/emergency/reactError como 0 quando vazio', () => {
      render(<DebugDock />);
      fireEvent.click(openButton());
      const dialog = screen.getByRole('dialog');
      expect(dialog.textContent).toMatch(/entries: 0/);
      expect(dialog.textContent).toMatch(/emergency: 0/);
      expect(dialog.textContent).toMatch(/reactError: n\u00e3o/);
    });

    it('mostra reactError: sim quando há lastReactError', () => {
      localStorage.setItem('mip_last_error', JSON.stringify({
        t: '2026-01-01', message: 'crash', stack: '...', componentStack: '...'
      }));
      render(<DebugDock />);
      fireEvent.click(openButton());
      const dialog = screen.getByRole('dialog');
      expect(dialog.textContent).toMatch(/reactError: sim/);
      expect(dialog.textContent).toMatch(/crash/);
    });

    it('mostra emergency log (últimas 3)', () => {
      const arr = [];
      for (let i = 0; i < 5; i++) {
        arr.push({ t: '2026-01-01', kind: 'window.error', info: { message: `err ${i}` } });
      }
      localStorage.setItem('mip_emergency_log', JSON.stringify(arr));
      render(<DebugDock />);
      fireEvent.click(openButton());
      const dialog = screen.getByRole('dialog');
      expect(dialog.textContent).toMatch(/err 2/);
      expect(dialog.textContent).toMatch(/err 3/);
      expect(dialog.textContent).toMatch(/err 4/);
      expect(dialog.textContent).not.toMatch(/err 0/);
      expect(dialog.textContent).not.toMatch(/err 1/);
    });
  });

  describe('botão Copiar JSON', () => {
    it('chama navigator.clipboard.writeText com o snapshot serializado', async () => {
      render(<DebugDock />);
      fireEvent.click(openButton());
      const copyBtn = screen.getByRole('button', { name: /Copiar JSON/i });
      await act(async () => {
        fireEvent.click(copyBtn);
      });
      expect(mockWriteText).toHaveBeenCalledTimes(1);
      const payload = mockWriteText.mock.calls[0][0];
      expect(() => JSON.parse(payload)).not.toThrow();
      expect(JSON.parse(payload)).toHaveProperty('entries');
      expect(JSON.parse(payload)).toHaveProperty('emergencyLog');
      expect(JSON.parse(payload)).toHaveProperty('lastReactError');
    });

    it('mostra feedback visual "Copiado!" após copiar', async () => {
      render(<DebugDock />);
      fireEvent.click(openButton());
      const copyBtn = screen.getByRole('button', { name: /Copiar JSON/i });
      await act(async () => {
        fireEvent.click(copyBtn);
      });
      expect(screen.getByText(/Copiado!/)).toBeInTheDocument();
    });

    it('cai pra fallback execCommand se clipboard API indisponível', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined, writable: true, configurable: true
      });
      const execCommandMock = vi.fn(() => true);
      document.execCommand = execCommandMock;
      const originalCreate = document.createElement.bind(document);
      const createElementMock = vi.fn((tag) => {
        const el = originalCreate(tag);
        if (tag === 'textarea') {
          el.select = vi.fn();
        }
        return el;
      });
      document.createElement = createElementMock;

      render(<DebugDock />);
      fireEvent.click(openButton());
      const copyBtn = screen.getByRole('button', { name: /Copiar JSON/i });
      await act(async () => {
        fireEvent.click(copyBtn);
      });
      // execCommand foi chamado OU o textarea fallback foi criado
      expect(execCommandMock.mock.calls.length + createElementMock.mock.calls.filter(c => c[0] === 'textarea').length).toBeGreaterThan(0);
      document.createElement = originalCreate;
    });
  });

  describe('botão Limpar', () => {
    it('limpa todos os logs ao clicar', () => {
      localStorage.setItem('mip_debug_log_v1', JSON.stringify([
        { t: 't', lvl: 'info', cmp: 'X', msg: 'msg', data: null }
      ]));
      localStorage.setItem('mip_emergency_log', JSON.stringify([
        { t: 't', kind: 'k', info: {} }
      ]));
      localStorage.setItem('mip_last_error', JSON.stringify({ message: 'x' }));

      render(<DebugDock />);
      fireEvent.click(openButton());
      fireEvent.click(screen.getByRole('button', { name: /Limpar/i }));

      expect(localStorage.getItem('mip_debug_log_v1')).toBeNull();
      expect(localStorage.getItem('mip_emergency_log')).toBeNull();
      expect(localStorage.getItem('mip_last_error')).toBeNull();
    });
  });

  describe('auto-refresh', () => {
    it('mostra contador de refresh incrementando', () => {
      vi.useFakeTimers();
      render(<DebugDock />);
      fireEvent.click(openButton());
      const dialog = screen.getByRole('dialog');
      expect(dialog.textContent).toMatch(/refresh #0/);
      act(() => { vi.advanceTimersByTime(2000); });
      expect(dialog.textContent).toMatch(/refresh #1/);
      act(() => { vi.advanceTimersByTime(2000); });
      expect(dialog.textContent).toMatch(/refresh #2/);
      vi.useRealTimers();
    });

    it('para o timer quando painel é fechado', () => {
      // Verifica via DOM behavior: o timer de auto-refresh para quando
      // o painel é fechado (cleanup do useEffect chama clearInterval).
      // Indiretamente: avançamos 20s com painel fechado, depois reabrimos
      // e verificamos que ainda está em #2 (não foi para #12).
      vi.useFakeTimers();
      render(<DebugDock />);
      fireEvent.click(openButton());
      const dialog = screen.getByRole('dialog');
      expect(dialog.textContent).toMatch(/refresh #0/);
      act(() => { vi.advanceTimersByTime(4000); });
      expect(dialog.textContent).toMatch(/refresh #2/);
      // Fecha painel — timer deveria parar
      fireEvent.click(screen.getByTitle('Fechar'));
      // Avança muito tempo
      act(() => { vi.advanceTimersByTime(20000); });
      // Reabre
      fireEvent.click(openButton());
      const dialog2 = screen.getByRole('dialog');
      // refresh não deve ter passado de #2 (timer antigo parou)
      // novo useEffect cria novo setInterval, mas o contador de tick
      // é resetado pelo useEffect cleanup + useEffect re-fire? Não,
      // o state refreshTick persiste. Mas o setInterval antigo foi
      // limpo, então o contador não incrementou mais.
      // Verifica que NÃO está em refresh #12 (que seria se timer continuasse)
      expect(dialog2.textContent).not.toMatch(/refresh #(?:[3-9]|[1-9]\d|\d{3,})/);
      vi.useRealTimers();
    });
  });

  describe('A11y: aria-labels e roles', () => {
    it('painel tem aria-label "Painel de diagnóstico"', () => {
      render(<DebugDock />);
      fireEvent.click(openButton());
      expect(screen.getByRole('dialog', { name: /Painel de diagnóstico/i }))
        .toBeInTheDocument();
    });

    it('botão tem title descritivo', () => {
      render(<DebugDock />);
      const btn = openButton();
      expect(btn.getAttribute('title')).toBe('Abrir painel de diagnóstico');
    });
  });

  describe('adversarial: snapshot com dados hostis', () => {
    it('renderiza msg com HTML sem executar (escape do React)', () => {
      localStorage.setItem('mip_debug_log_v1', JSON.stringify([{
        t: '2026-01-01T00:00:00Z',
        lvl: 'info',
        cmp: 'XSS',
        msg: '<img src=x onerror=alert(1)>',
        data: null
      }]));
      render(<DebugDock />);
      fireEvent.click(openButton());
      // React escapa automaticamente — texto aparece como string, não como HTML
      const dialog = screen.getByRole('dialog');
      expect(dialog.textContent).toContain('<img src=x onerror=alert(1)>');
      expect(window.alert).not.toHaveBeenCalled();
    });
  });
});