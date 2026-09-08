// Teste #3: useFilteredApps filtra corretamente por busca + categoria
// + installedOnly, com performance O(N) usando os índices pré-computados.

import { renderHook } from '@testing-library/react';
import { useFilteredApps } from './useFilteredApps';
import { indexCatalog } from '../services/catalogIndex';

const RAW = [
  { id: 'firefox', name: 'Firefox', packageType: 'APT', kind: 'apt',
    summary: 'Browser', fullSummary: 'Browser web', description: 'Web',
    category: 'internet', categoryLabel: 'Internet', rating: 4.5 },
  { id: 'chrome', name: 'Chrome', packageType: 'APT', kind: 'apt',
    summary: 'Browser', fullSummary: 'Browser web', description: 'Web',
    category: 'internet', categoryLabel: 'Internet', rating: 4.0 },
  { id: 'vlc', name: 'VLC', packageType: 'APT', kind: 'apt',
    summary: 'Media player', fullSummary: 'Media player', description: 'Plays',
    category: 'sound-video', categoryLabel: 'Mídia', rating: 4.8 },
  { id: 'org.videolan.VLC', name: 'VLC', packageType: 'Flatpak', kind: 'flatpak',
    summary: 'Media player', fullSummary: 'Media player', description: 'Plays',
    category: 'flatpak', categoryLabel: 'Flatpak', rating: 4.7, flathub: true, installed: true }
];

const baseSettings = {
  searchInSummary: true,
  searchInDescription: true,
  searchInCategoryOnly: false,
  packageTypePreference: 'all'
};

describe('useFilteredApps', () => {
  let catalogIndex;
  let apps;

  beforeAll(() => {
    catalogIndex = indexCatalog(RAW);
    apps = catalogIndex.apps;
  });

  it('filtra por categoria (sem query)', () => {
    const { result } = renderHook(() => useFilteredApps(apps, catalogIndex, {
      searchQuery: '', selectedCategory: 'internet', installedOnly: false, settings: baseSettings
    }));
    expect(result.current.map(a => a.id)).toEqual(['firefox', 'chrome']);
  });

  it('filtra por substring no _haystack (case-insensitive)', () => {
    const { result } = renderHook(() => useFilteredApps(apps, catalogIndex, {
      searchQuery: 'BROWSER', selectedCategory: 'all', installedOnly: false, settings: baseSettings
    }));
    expect(result.current.map(a => a.id).sort()).toEqual(['chrome', 'firefox']);
  });

  it('filtra por installedOnly', () => {
    const appsWithInstalled = apps.map(a => ({ ...a, installed: a.id === 'org.videolan.VLC' }));
    const { result } = renderHook(() => useFilteredApps(appsWithInstalled, catalogIndex, {
      searchQuery: '', selectedCategory: 'all', installedOnly: true, settings: baseSettings
    }));
    expect(result.current.map(a => a.id)).toEqual(['org.videolan.VLC']);
  });

  it('multi-format preference: "apt" esconde o flatpak se existe variante apt', () => {
    const { result } = renderHook(() => useFilteredApps(apps, catalogIndex, {
      searchQuery: '', selectedCategory: 'all', installedOnly: false,
      settings: { ...baseSettings, packageTypePreference: 'apt' }
    }));
    const ids = result.current.map(a => a.id);
    expect(ids).toContain('vlc');
    expect(ids).not.toContain('org.videolan.VLC');
  });

  it('multi-format preference: "flatpak" mostra o flatpak, esconde o apt se existe variante flatpak', () => {
    const { result } = renderHook(() => useFilteredApps(apps, catalogIndex, {
      searchQuery: '', selectedCategory: 'all', installedOnly: false,
      settings: { ...baseSettings, packageTypePreference: 'flatpak' }
    }));
    const ids = result.current.map(a => a.id);
    expect(ids).toContain('org.videolan.VLC');
    // vlc APT fica FORA porque tem variante flatpak
    expect(ids).not.toContain('vlc');
  });

  it('selectedCategory = "flatpak" mostra todos os flatpaks', () => {
    const { result } = renderHook(() => useFilteredApps(apps, catalogIndex, {
      searchQuery: '', selectedCategory: 'flatpak', installedOnly: false, settings: baseSettings
    }));
    expect(result.current.map(a => a.id)).toEqual(['org.videolan.VLC']);
  });

  it('retorna [] se catalogIndex é null', () => {
    const { result } = renderHook(() => useFilteredApps([], null, {
      searchQuery: '', selectedCategory: 'all', installedOnly: false, settings: baseSettings
    }));
    expect(result.current).toEqual([]);
  });
});
