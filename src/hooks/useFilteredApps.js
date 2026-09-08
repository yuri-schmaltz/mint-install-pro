// Custom hook: filtra apps por categoria + busca + preferências.
// Usa os índices pré-computados do catalogIndex (byName + _haystack) para
// O(N) por keystroke, sem toLowerCase no hot loop.

import { useMemo } from 'react';

/**
 * @param {Array} apps - apps com .installed aplicado (vindo de useInstalledMap.applyToApps)
 * @param {import('../services/catalogIndex.js').CatalogIndex | null} catalogIndex
 * @param {Object} filters
 * @param {string} filters.searchQuery
 * @param {string} filters.selectedCategory - 'picks'|'all'|category id
 * @param {boolean} filters.installedOnly
 * @param {Object} filters.settings - { searchInSummary, searchInDescription, searchInCategoryOnly, packageTypePreference }
 * @returns {Array} apps filtrados
 */
export function useFilteredApps(apps, catalogIndex, filters) {
  const { searchQuery, selectedCategory, installedOnly, settings } = filters;

  return useMemo(() => {
    if (!catalogIndex) return [];
    const byName = catalogIndex.byName;
    const pkgPref = settings.packageTypePreference;
    const hasQuery = !!searchQuery?.trim();
    const q = hasQuery ? searchQuery.toLowerCase() : '';
    const restrictCategory = settings.searchInCategoryOnly
      && selectedCategory !== 'all' && selectedCategory !== 'picks';

    const out = [];
    for (let i = 0; i < apps.length; i++) {
      const app = apps[i];

      if (installedOnly && !app.installed) continue;

      if (pkgPref === 'flatpak' && !app.isFlatpak) {
        const variants = byName.get(app._nameLower) || [];
        if (variants.some((v) => v.isFlatpak)) continue;
      }
      if (pkgPref === 'apt' && app.isFlatpak) {
        const variants = byName.get(app._nameLower) || [];
        if (variants.some((v) => v.isApt)) continue;
      }

      if (hasQuery) {
        if (restrictCategory) {
          if (selectedCategory === 'flatpak' && !app.isFlatpak) continue;
          if (selectedCategory !== 'flatpak' && app.category !== selectedCategory) continue;
        }
        if (!app._haystack.includes(q)) continue;
      } else {
        if (selectedCategory === 'all') {
          // passa
        } else if (selectedCategory === 'flatpak') {
          if (!app.isFlatpak) continue;
        } else if (selectedCategory && selectedCategory !== 'picks') {
          if (app.category !== selectedCategory) continue;
        }
      }
      out.push(app);
    }
    return out;
  }, [apps, catalogIndex, searchQuery, selectedCategory, installedOnly, settings]);
}
