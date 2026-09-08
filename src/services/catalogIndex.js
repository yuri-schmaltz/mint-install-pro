// Pré-computa índices de busca a partir do array de apps.
// Chamado UMA vez quando o catálogo lazy carrega, não no hot path de filter.
// Resolve débitos #1 (O(N²) apps.some) e #2 (toLowerCase no hot loop).

/**
 * @typedef {Object} IndexedApp
 * @property {string} id
 * @property {string} name
 * @property {string} _nameLower
 * @property {string} _haystack
 * @property {boolean} isFlatpak
 * @property {boolean} isApt
 * @property {string} category
 */

/**
 * @typedef {Object} CatalogIndex
 * @property {Array<IndexedApp>} apps
 * @property {Map<string, Array<IndexedApp>>} byName - name.toLowerCase() -> apps com esse nome
 * @property {Map<string, number>} countByCategory
 * @property {Map<string, number>} countByKind
 */

/**
 * Enriquece o array de apps com campos pré-computados para busca O(1)/O(N) e
 * constrói índices auxiliares.
 *
 * @param {Array<Object>} rawApps
 * @returns {CatalogIndex}
 */
export function indexCatalog(rawApps) {
  const apps = new Array(rawApps.length);
  const byName = new Map();
  const countByCategory = new Map();
  const countByKind = new Map();

  for (let i = 0; i < rawApps.length; i++) {
    const raw = rawApps[i];
    const nameLower = raw.name.toLowerCase();
    const isFlatpak = !!raw.flathub || (raw.packageType || '').toLowerCase().includes('flatpak');
    const isApt = !isFlatpak;

    // Haystack: todos os campos relevantes já em lowercase, joined uma vez.
    // Custo: ~150KB de memória extra para 1.800 apps. Ganho: zero toLowerCase por keystroke.
    const haystack = (
      nameLower + ' ' +
      (raw.summary || '').toLowerCase() + ' ' +
      (raw.fullSummary || '').toLowerCase() + ' ' +
      (raw.description || '').toLowerCase() + ' ' +
      (raw.categoryLabel || '').toLowerCase() + ' ' +
      (raw.packageType || '').toLowerCase() + ' ' +
      (raw.id || '').toLowerCase()
    );

    const enriched = {
      ...raw,
      _nameLower: nameLower,
      _haystack: haystack,
      isFlatpak,
      isApt
    };
    apps[i] = enriched;

    // Index by name (lower). apps.filter(a => a.name === x) vira byName.get(x).
    const list = byName.get(nameLower);
    if (list) {
      list.push(enriched);
    } else {
      byName.set(nameLower, [enriched]);
    }

    countByCategory.set(raw.category, (countByCategory.get(raw.category) || 0) + 1);
  }

  // countByKind é calculado numa segunda passada para evitar ambiguidade do ternário.
  for (const a of apps) {
    const kind = a.isFlatpak ? 'flatpak' : 'apt';
    countByKind.set(kind, (countByKind.get(kind) || 0) + 1);
  }

  return { apps, byName, countByCategory, countByKind };
}
