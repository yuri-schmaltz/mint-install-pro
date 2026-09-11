import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBatchSelection } from './useBatchSelection';

describe('useBatchSelection hook tests', () => {
  const mockVisibleApps = [
    { id: 'vlc', name: 'VLC', installed: false },
    { id: 'gimp', name: 'GIMP', installed: true },
    { id: 'inkscape', name: 'Inkscape', installed: false }
  ];

  it('inicia com seleção vazia', () => {
    const { result } = renderHook(() => useBatchSelection(mockVisibleApps));
    expect(result.current.selectedAppIds).toEqual([]);
    expect(result.current.selectedAppsList).toEqual([]);
    expect(result.current.toInstallApps).toEqual([]);
    expect(result.current.toUninstallApps).toEqual([]);
    expect(result.current.isAllVisibleSelected).toBe(false);
  });

  it('toggleApp adiciona e remove item da seleção', () => {
    const { result } = renderHook(() => useBatchSelection(mockVisibleApps));
    
    act(() => {
      result.current.toggleApp('vlc');
    });
    expect(result.current.selectedAppIds).toEqual(['vlc']);
    expect(result.current.toInstallApps).toHaveLength(1);
    expect(result.current.toInstallApps[0].id).toBe('vlc');

    act(() => {
      result.current.toggleApp('gimp');
    });
    expect(result.current.selectedAppIds).toEqual(['vlc', 'gimp']);
    expect(result.current.toUninstallApps).toHaveLength(1);
    expect(result.current.toUninstallApps[0].id).toBe('gimp');

    act(() => {
      result.current.toggleApp('vlc');
    });
    expect(result.current.selectedAppIds).toEqual(['gimp']);
  });

  it('selectAllVisible alterna entre selecionar todos os visíveis e desmarcar todos', () => {
    const { result } = renderHook(() => useBatchSelection(mockVisibleApps));

    act(() => {
      result.current.selectAllVisible();
    });
    expect(result.current.selectedAppIds).toEqual(['vlc', 'gimp', 'inkscape']);
    expect(result.current.isAllVisibleSelected).toBe(true);

    act(() => {
      result.current.selectAllVisible();
    });
    expect(result.current.selectedAppIds).toEqual([]);
    expect(result.current.isAllVisibleSelected).toBe(false);
  });

  it('removeFromSelection remove IDs específicos após conclusão do lote', () => {
    const { result } = renderHook(() => useBatchSelection(mockVisibleApps));

    act(() => {
      result.current.selectAllVisible();
    });
    expect(result.current.selectedAppIds).toHaveLength(3);

    act(() => {
      result.current.removeFromSelection(['vlc', 'inkscape']);
    });
    expect(result.current.selectedAppIds).toEqual(['gimp']);
  });

  it('clearSelection limpa todos os selecionados', () => {
    const { result } = renderHook(() => useBatchSelection(mockVisibleApps));

    act(() => {
      result.current.toggleApp('vlc');
    });
    expect(result.current.selectedAppIds).toHaveLength(1);

    act(() => {
      result.current.clearSelection();
    });
    expect(result.current.selectedAppIds).toEqual([]);
  });
});
