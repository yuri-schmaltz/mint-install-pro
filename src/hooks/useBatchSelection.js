// Custom hook: gerencia seleção em lote (selectedAppIds) + deriva listas
// toInstall/toUninstall + helpers de select-all/deselect.

import { useState, useMemo, useCallback, useRef } from 'react';

/**
 * @param {Array} visibleApps - subset visível (filtrado) que aparece no grid
 * @returns {{
 *   selectedAppIds: string[],
 *   selectedAppsList: Array,           // apps onde id in selectedAppIds
 *   toInstallApps: Array,
 *   toUninstallApps: Array,
 *   isAllVisibleSelected: boolean,
 *   toggleApp: (appId: string) => void,
 *   selectAllVisible: () => void,
 *   clearSelection: () => void,
 *   removeFromSelection: (ids: string[]) => void
 * }}
 */
export function useBatchSelection(visibleApps, allApps = visibleApps, isInstalled) {
  const [selectedAppIds, setSelectedAppIds] = useState([]);
  const selectedCache = useRef(new Map());

  const selectedAppsList = useMemo(() => {
    if (selectedAppIds.length === 0) return [];
    const current = new Map(allApps.map(app => [app.id, app]));
    const selected = selectedAppIds.map(id => current.get(id) || selectedCache.current.get(id)).filter(Boolean);
    selectedCache.current = new Map(selected.map(app => [app.id, app]));
    return isInstalled ? selected.map(app => ({ ...app, installed: isInstalled(app.id) === true })) : selected;
  }, [allApps, selectedAppIds, isInstalled]);

  const toInstallApps = useMemo(
    () => selectedAppsList.filter((a) => !a.installed),
    [selectedAppsList]
  );
  const toUninstallApps = useMemo(
    () => selectedAppsList.filter((a) => a.installed),
    [selectedAppsList]
  );

  const isAllVisibleSelected = useMemo(() => {
    if (visibleApps.length === 0) return false;
    if (selectedAppIds.length === 0) return false;
    const set = new Set(selectedAppIds);
    return visibleApps.every((a) => set.has(a.id));
  }, [visibleApps, selectedAppIds]);

  const toggleApp = useCallback((appId) => {
    setSelectedAppIds((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedAppIds((prev) => {
      const set = new Set(prev);
      if (visibleApps.every((a) => set.has(a.id))) {
        // Deselect all visible
        const visibleIds = new Set(visibleApps.map((a) => a.id));
        return prev.filter((id) => !visibleIds.has(id));
      }
      // Select all visible
      const newIds = new Set([...prev, ...visibleApps.map((a) => a.id)]);
      return Array.from(newIds);
    });
  }, [visibleApps]);

  const clearSelection = useCallback(() => {
    setSelectedAppIds([]);
  }, []);

  const removeFromSelection = useCallback((ids) => {
    if (!ids || ids.length === 0) return;
    const set = new Set(ids);
    setSelectedAppIds((prev) => prev.filter((id) => !set.has(id)));
  }, []);

  return {
    selectedAppIds,
    selectIds: setSelectedAppIds,
    selectedAppsList,
    toInstallApps,
    toUninstallApps,
    isAllVisibleSelected,
    toggleApp,
    selectAllVisible,
    clearSelection,
    removeFromSelection
  };
}
