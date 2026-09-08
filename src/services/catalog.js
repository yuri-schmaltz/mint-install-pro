// Carregador lazy do catálogo de apps. Carrega o JSON sob demanda (código-split
// automático pelo Vite), cacheia em memória e expõe tanto a lista completa
// quanto um índice leve para a LandingPage.
//
// Estratégia: fetch() direto a /data/catalog.json. Sem fallback estático
// para evitar que o Vite faça modulepreload do array de 1MB no carregamento
// inicial da página.

let _full = null;
let _index = null;
let _fullPromise = null;
let _indexPromise = null;

export async function loadFullCatalog() {
  if (_full) return _full;
  if (_fullPromise) return _fullPromise;
  _fullPromise = fetch('/data/catalog.json')
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((data) => {
      _full = data;
      return data;
    })
    .catch((err) => {
      console.error('[catalog] Falha ao carregar catálogo:', err.message);
      _full = [];
      return _full;
    });
  return _fullPromise;
}

export async function loadCatalogIndex() {
  if (_index) return _index;
  if (_indexPromise) return _indexPromise;
  _indexPromise = fetch('/data/catalog-index.json')
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  _index = await _indexPromise;
  if (!_index) {
    // Fallback: calcula índice a partir do array completo
    const full = await loadFullCatalog();
    _index = {
      total: full.length,
      byCategory: {},
      byKind: { apt: 0, flatpak: 0 },
      featured: [...full].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6)
    };
    for (const a of full) {
      _index.byCategory[a.category] = (_index.byCategory[a.category] || 0) + 1;
      _index.byKind[a.kind] = (_index.byKind[a.kind] || 0) + 1;
    }
  }
  return _index;
}

// Pré-carregamento: chama no boot da app para o JSON estar pronto
// quando o usuário sair da LandingPage. Não bloqueia a render inicial.
export function prefetchCatalog() {
  if (typeof window === 'undefined') return;
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => loadFullCatalog(), { timeout: 1500 });
  } else {
    setTimeout(() => loadFullCatalog(), 100);
  }
}

// Acesso síncrono ao cache (após loadFullCatalog). Útil para componentes
// que assumem que o catálogo já está em memória.
export function getCachedCatalog() {
  return _full;
}
