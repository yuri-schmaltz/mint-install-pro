// Teste #1: useInstalledMap persiste no localStorage com debounce
// e propaga mudanças via applyToApps.

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';
import { useInstalledMap } from './useInstalledMap';

describe('useInstalledMap', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('inicializa vazio quando localStorage está vazio', () => {
    const { result } = renderHook(() => useInstalledMap());
    expect(result.current.isInstalled('firefox')).toBeUndefined();
  });

  it('hidrata do localStorage na inicialização', () => {
    localStorage.setItem('mint_installed_map_v1', JSON.stringify({ firefox: true }));
    const { result } = renderHook(() => useInstalledMap());
    expect(result.current.isInstalled('firefox')).toBe(true);
  });

  it('setInstalled atualiza e propaga via applyToApps', () => {
    const { result } = renderHook(() => useInstalledMap());
    act(() => result.current.setInstalled('firefox', true));
    expect(result.current.isInstalled('firefox')).toBe(true);
    const apps = [{ id: 'firefox' }, { id: 'chromium' }];
    const out = result.current.applyToApps(apps);
    expect(out[0].installed).toBe(true);
    expect(out[1].installed).toBe(false);
  });

  it('toggleInstalled alterna o valor', () => {
    const { result } = renderHook(() => useInstalledMap());
    act(() => result.current.toggleInstalled('firefox'));
    expect(result.current.isInstalled('firefox')).toBe(true);
    act(() => result.current.toggleInstalled('firefox'));
    expect(result.current.isInstalled('firefox')).toBeUndefined();
  });

  it('persiste no localStorage após 500ms (debounce)', () => {
    const { result } = renderHook(() => useInstalledMap());
    act(() => result.current.setInstalled('firefox', true));
    // Antes do debounce, ainda não escreveu
    expect(localStorage.getItem('mint_installed_map_v1')).toBeNull();
    act(() => { vi.advanceTimersByTime(500); });
    const stored = JSON.parse(localStorage.getItem('mint_installed_map_v1'));
    expect(stored.firefox).toBe(true);
  });

  it('clear remove do localStorage e zera o map', () => {
    localStorage.setItem('mint_installed_map_v1', JSON.stringify({ firefox: true }));
    const { result } = renderHook(() => useInstalledMap());
    act(() => result.current.clear());
    expect(result.current.isInstalled('firefox')).toBeUndefined();
    expect(localStorage.getItem('mint_installed_map_v1')).toBeNull();
  });

  it('ignora JSON corrompido no localStorage', () => {
    localStorage.setItem('mint_installed_map_v1', '{não é json válido');
    const { result } = renderHook(() => useInstalledMap());
    expect(result.current.isInstalled('firefox')).toBeUndefined();
  });
});
