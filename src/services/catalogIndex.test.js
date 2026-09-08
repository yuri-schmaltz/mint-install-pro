// Teste #2: indexCatalog pré-computa _haystack, _nameLower, isFlatpak, isApt
// e constrói o byName Map corretamente.

import { indexCatalog } from './catalogIndex';

const MOCK_APPS = [
  { id: 'firefox', name: 'Firefox', packageType: 'APT (Sistema)', kind: 'apt',
    summary: 'Browser', fullSummary: 'Browser web', description: '',
    category: 'internet', categoryLabel: 'Internet', rating: 4.5 },
  { id: 'org.mozilla.firefox', name: 'Firefox', packageType: 'Flatpak (Flathub)', kind: 'flatpak',
    summary: 'Browser', fullSummary: 'Browser web', description: '',
    category: 'flatpak', categoryLabel: 'Flatpak', rating: 4.5, flathub: true },
  { id: 'vlc', name: 'VLC', packageType: 'APT (Sistema)', kind: 'apt',
    summary: 'Media player', fullSummary: 'Media player', description: 'Plays everything',
    category: 'sound-video', categoryLabel: 'Mídia', rating: 4.8 }
];

describe('indexCatalog', () => {
  it('pré-computa _nameLower e isFlatpak/isApt', () => {
    const idx = indexCatalog(MOCK_APPS);
    expect(idx.apps[0]._nameLower).toBe('firefox');
    expect(idx.apps[0].isFlatpak).toBe(false);
    expect(idx.apps[0].isApt).toBe(true);
    expect(idx.apps[1].isFlatpak).toBe(true);
    expect(idx.apps[1].isApt).toBe(false);
  });

  it('constrói _haystack com tudo em lowercase', () => {
    const idx = indexCatalog(MOCK_APPS);
    const firefox = idx.apps[0];
    expect(firefox._haystack).toBe(firefox._haystack.toLowerCase());
    expect(firefox._haystack).toContain('firefox');
    expect(firefox._haystack).toContain('browser');
    expect(firefox._haystack).toContain('internet');
  });

  it('byName agrupa apps pelo mesmo nome (case-insensitive)', () => {
    const idx = indexCatalog(MOCK_APPS);
    expect(idx.byName.get('firefox').length).toBe(2); // firefox + org.mozilla.firefox
    expect(idx.byName.get('vlc').length).toBe(1);
  });

  it('countByCategory contabiliza corretamente', () => {
    const idx = indexCatalog(MOCK_APPS);
    expect(idx.countByCategory.get('internet')).toBe(1);
    expect(idx.countByCategory.get('flatpak')).toBe(1);
    expect(idx.countByCategory.get('sound-video')).toBe(1);
  });

  it('countByKind separa apt vs flatpak', () => {
    const idx = indexCatalog(MOCK_APPS);
    expect(idx.countByKind.get('apt')).toBe(2);
    expect(idx.countByKind.get('flatpak')).toBe(1);
  });

  it('busca por substring no _haystack funciona', () => {
    const idx = indexCatalog(MOCK_APPS);
    const vlc = idx.apps.find(a => a.id === 'vlc');
    expect(vlc._haystack.includes('media')).toBe(true);
    expect(vlc._haystack.includes('plays')).toBe(true);
  });
});
