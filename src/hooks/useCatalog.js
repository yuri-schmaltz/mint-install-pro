// Custom hook: encapsula o fetch lazy do catálogo + sync com /api/installed.
// Resolve parte do débito #5 (App.jsx de 539 → ~200 linhas).

import { useState, useEffect } from 'react';
import { loadFullCatalog, prefetchCatalog, getCachedIndex } from '../services/catalog';

const API_INSTALLED_PATH = '/api/installed';

/**
 * Hook que gerencia o ciclo de vida do catálogo (loading + ready + error)
 * e sincroniza com o backend sobre quais Flatpaks estão instalados.
 *
 * @returns {{
 *   catalogIndex: import('../services/catalogIndex.js').CatalogIndex | null,
 *   loading: boolean,
 *   flatpakStatus: 'unknown' | 'available' | 'missing',
 *   installedFlatpaks: string[]
 * }}
 */
export function useCatalog() {
  const [catalogIndex, setCatalogIndex] = useState(() => getCachedIndex());
  const [loading, setLoading] = useState(!catalogIndex);
  const [flatpakStatus, setFlatpakStatus] = useState('unknown');
  const [installedFlatpaks, setInstalledFlatpaks] = useState([]);

  // Carrega o catálogo sob demanda
  useEffect(() => {
    if (catalogIndex) return undefined;
    let cancelled = false;
    loadFullCatalog()
      .then((idx) => {
        if (cancelled) return;
        setCatalogIndex(idx);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Falha ao carregar catálogo:', err);
        if (!cancelled) setLoading(false);
      });
    // Pré-carrega em idle para a próxima render
    prefetchCatalog();
    return () => { cancelled = true; };
  }, [catalogIndex]);

  // Sincroniza com o backend sobre Flatpaks instalados
  useEffect(() => {
    let cancelled = false;
    fetch(API_INSTALLED_PATH)
      .then((res) => {
        if (res.status === 503) {
          setFlatpakStatus('missing');
          return null;
        }
        if (!res.ok) {
          setFlatpakStatus('unknown');
          return null;
        }
        setFlatpakStatus('available');
        return res.json();
      })
      .then((data) => {
        if (cancelled || !data || !Array.isArray(data.flatpaks)) return;
        setInstalledFlatpaks(data.flatpaks);
      })
      .catch(() => {
        if (!cancelled) setFlatpakStatus('unknown');
      });
    return () => { cancelled = true; };
  }, []);

  return { catalogIndex, loading, flatpakStatus, installedFlatpaks };
}
