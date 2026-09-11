import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  loadFullCatalog,
  loadCatalogIndex,
  prefetchCatalog,
  getCachedCatalog,
  getCachedIndex,
  invalidateCatalog
} from './catalog';

describe('catalog service tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    invalidateCatalog();
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('loadFullCatalog', () => {
    it('carrega catalog.json, indexa e retorna estrutura esperada', async () => {
      const mockRawApps = [
        { id: 'vlc', name: 'VLC Media Player', kind: 'apt', packageType: 'APT (Debian)', category: 'sound-video', summary: 'Reprodutor multimídia' },
        { id: 'org.blender.Blender', name: 'Blender', kind: 'flatpak', packageType: 'Flatpak (Flathub)', category: 'graphics', summary: '3D Studio', flathub: true }
      ];

      globalThis.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('/data/catalog.json')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => mockRawApps
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      const indexed = await loadFullCatalog();
      expect(indexed.apps).toHaveLength(2);
      expect(indexed.byName.has('vlc media player')).toBe(true);
      expect(indexed.countByKind.get('apt')).toBe(1);
      expect(indexed.countByKind.get('flatpak')).toBe(1);

      // Idempotência: chamadas subsequentes usam o cache
      const cached = await loadFullCatalog();
      expect(cached).toBe(indexed);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      // Funções síncronas
      expect(getCachedCatalog()).toBe(indexed.apps);
      expect(getCachedIndex()).toBe(indexed);
    });

    it('em caso de falha no fetch, retorna índice vazio seguro em vez de crashar', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      });

      const indexed = await loadFullCatalog();
      expect(indexed.apps).toEqual([]);
      expect(indexed.byName.size).toBe(0);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('loadCatalogIndex', () => {
    it('carrega index leve se disponível', async () => {
      const mockLight = {
        total: 10,
        byCategory: { internet: 5, graphics: 5 },
        byKind: { apt: 8, flatpak: 2 },
        featured: []
      };

      globalThis.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('/data/catalog-index.json')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockLight
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      const light = await loadCatalogIndex();
      expect(light).toEqual(mockLight);
    });

    it('se index leve falhar (ex: 404), deriva dinamicamente do catálogo completo', async () => {
      const mockRawApps = [
        { id: 'app1', name: 'App 1', kind: 'apt', packageType: 'APT', category: 'internet', rating: 4.8 },
        { id: 'app2', name: 'App 2', kind: 'flatpak', packageType: 'Flatpak', category: 'internet', rating: 4.2, flathub: true }
      ];

      globalThis.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('/data/catalog-index.json')) {
          return Promise.resolve({ ok: false, status: 404 });
        }
        if (url.includes('/data/catalog.json')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => mockRawApps
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      const light = await loadCatalogIndex();
      expect(light.total).toBe(2);
      expect(light.featured).toHaveLength(2);
      expect(light.featured[0].id).toBe('app1');
    });
  });

  describe('prefetchCatalog', () => {
    it('usa requestIdleCallback quando suportado', () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => []
      });
      const idleSpy = vi.fn((cb) => cb());
      window.requestIdleCallback = idleSpy;

      prefetchCatalog();
      expect(idleSpy).toHaveBeenCalled();
    });

    it('usa setTimeout como fallback se requestIdleCallback não existir', () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => []
      });
      const originalIdle = window.requestIdleCallback;
      delete window.requestIdleCallback;
      const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');

      prefetchCatalog();
      expect(timeoutSpy).toHaveBeenCalled();

      if (originalIdle) window.requestIdleCallback = originalIdle;
    });
  });
});
