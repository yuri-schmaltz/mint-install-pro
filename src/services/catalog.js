// Carregador lazy do catálogo de apps. Carrega o JSON sob demanda, pré-computa
// índices de busca (O(1) por nome, _haystack em lowercase) e cacheia em memória.
//
// Estratégia: fetch() direto a /data/catalog.json. Sem fallback estático
// para evitar que o Vite faça modulepreload do array de 1MB no carregamento
// inicial da página.

import { indexCatalog } from './catalogIndex.js';

let _indexed = null;       // { apps, byName, countByCategory, countByKind }
let _lightIndex = null;    // { total, byCategory, byKind, featured } — usado pela LandingPage
let _fullPromise = null;
let _lightIndexPromise = null;

/**
 * Carrega o catálogo completo + pré-computa índices. Idempotente.
 * Retorna `{ apps, byName, countByCategory, countByKind }`.
 *
 * @returns {Promise<import('./catalogIndex.js').CatalogIndex>}
 */
export async function loadFullCatalog() {
  if (_indexed) return _indexed;
  if (_fullPromise) return _fullPromise;
  _fullPromise = fetch('/data/catalog.json')
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((rawApps) => {
      _indexed = indexCatalog(rawApps);
      return _indexed;
    })
    .catch((err) => {
      console.error('[catalog] Falha ao carregar catálogo:', err.message);
      _indexed = { apps: [], byName: new Map(), countByCategory: new Map(), countByKind: new Map() };
      return _indexed;
    });
  return _fullPromise;
}

/**
 * Carrega o índice LEVE (8 KB) usado pela LandingPage. Se falhar, calcula
 * a partir do catálogo completo (já pré-computado).
 */
export async function loadCatalogIndex() {
  if (_lightIndex) return _lightIndex;
  if (_lightIndexPromise) return _lightIndexPromise;
  _lightIndexPromise = fetch('/data/catalog-index.json')
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .then(async (data) => {
      if (data) {
        _lightIndex = data;
        return data;
      }
      // Fallback: deriva do catálogo completo
      const full = await loadFullCatalog();
      const apps = full.apps;
      _lightIndex = {
        total: apps.length,
        byCategory: Object.fromEntries(full.countByCategory),
        byKind: Object.fromEntries(full.countByKind),
        featured: [...apps].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6)
      };
      return _lightIndex;
    });
  return _lightIndexPromise;
}

/**
 * Pré-carregamento: chama no boot da app para o JSON estar pronto
 * quando o usuário sair da LandingPage. Não bloqueia a render inicial.
 */
export function prefetchCatalog() {
  if (typeof window === 'undefined') return;
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => loadFullCatalog(), { timeout: 1500 });
  } else {
    setTimeout(() => loadFullCatalog(), 100);
  }
}

/**
 * Acesso SÍNCRONO ao catálogo em cache. Retorna o array puro (sem índices).
 * Útil para componentes que assumem que o catálogo já está em memória.
 * Retorna `null` se ainda não carregou.
 */
export function getCachedCatalog() {
  return _indexed ? _indexed.apps : null;
}

/**
 * Acesso SÍNCRONO ao índice completo (apps + byName + counts).
 */
export function getCachedIndex() {
  return _indexed;
}

/**
 * Invalida o cache. Usado por "Limpar cache" e em testes.
 */
export function invalidateCatalog() {
  _indexed = null;
  _lightIndex = null;
  _fullPromise = null;
  _lightIndexPromise = null;
}
