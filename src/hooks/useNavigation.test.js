import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNavigation } from './useNavigation';

describe('useNavigation hook tests', () => {
  it('inicia na landing page com categoria picks', () => {
    const { result } = renderHook(() => useNavigation('picks'));
    expect(result.current.currentView).toBe('landing');
    expect(result.current.selectedCategory).toBe('picks');
    expect(result.current.canGoBack).toBe(false);
    expect(result.current.isLandingVisible).toBe(true);
  });

  it('navega para categoria de lista e atualiza histórico', () => {
    const { result } = renderHook(() => useNavigation('picks'));

    act(() => {
      result.current.selectCategory('internet');
    });

    expect(result.current.currentView).toBe('list');
    expect(result.current.selectedCategory).toBe('internet');
    expect(result.current.canGoBack).toBe(true);
    expect(result.current.isLandingVisible).toBe(false);
    expect(result.current.navHistory).toEqual(['picks', 'internet']);
  });

  it('goBack retorna para a categoria anterior', () => {
    const { result } = renderHook(() => useNavigation('picks'));

    act(() => {
      result.current.selectCategory('internet');
    });
    act(() => {
      result.current.selectCategory('graphics');
    });

    expect(result.current.selectedCategory).toBe('graphics');

    act(() => {
      result.current.goBack();
    });
    expect(result.current.selectedCategory).toBe('internet');
    expect(result.current.currentView).toBe('list');

    act(() => {
      result.current.goBack();
    });
    expect(result.current.selectedCategory).toBe('picks');
    expect(result.current.currentView).toBe('landing');
    expect(result.current.canGoBack).toBe(false);
  });

  it('goToPicks redefine imediatamente para a landing page', () => {
    const { result } = renderHook(() => useNavigation('picks'));

    act(() => {
      result.current.selectCategory('graphics');
    });
    expect(result.current.currentView).toBe('list');

    act(() => {
      result.current.goToPicks();
    });
    expect(result.current.currentView).toBe('landing');
    expect(result.current.selectedCategory).toBe('picks');
  });

  it('setSearch ativa status de busca e permite voltar via goBack', () => {
    const { result } = renderHook(() => useNavigation('picks'));

    act(() => {
      result.current.setSearch(true);
    });
    expect(result.current.canGoBack).toBe(true);
    expect(result.current.isLandingVisible).toBe(false);

    act(() => {
      result.current.goBack();
    });
    expect(result.current.isLandingVisible).toBe(true);
    expect(result.current.canGoBack).toBe(false);
  });
});
