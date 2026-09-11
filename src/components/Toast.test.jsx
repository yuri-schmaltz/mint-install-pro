import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';
import ToastContainer, { pushToast } from './Toast';

describe('Toast notification system tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exibe mensagem empurrada via pushToast e auto-descarta após duration', () => {
    render(<ToastContainer />);

    act(() => {
      pushToast('Operação realizada com sucesso!', 'success', 2000);
    });

    expect(screen.getByText('Operação realizada com sucesso!')).toBeInTheDocument();

    // Avança tempo para expirar
    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(screen.queryByText('Operação realizada com sucesso!')).not.toBeInTheDocument();
  });

  it('permite fechar toast manualmente clicando no botão fechar', () => {
    render(<ToastContainer />);

    act(() => {
      pushToast('Mensagem de aviso importante', 'error', 5000);
    });

    expect(screen.getByText('Mensagem de aviso importante')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button');
    act(() => {
      fireEvent.click(closeBtn);
    });

    expect(screen.queryByText('Mensagem de aviso importante')).not.toBeInTheDocument();
  });
});
