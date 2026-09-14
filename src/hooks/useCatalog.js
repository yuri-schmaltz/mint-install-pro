// Custom hook: encapsula o fetch lazy do catálogo + sync com /api/installed.
// Resolve parte do débito #5 (App.jsx de 539 → ~200 linhas).
//
// P2 do gauntlet loop:
// - Re-fetch de /api/installed ao focar a janela + polling de 30s para
//   refletir instalações externas (ex: usuário instala um flatpak pelo
//   terminal enquanto o app está aberto).
// - loadCatalogIndex() no boot (8 KB) em paralelo com loadFullCatalog()
//   (1 MB), preparando terreno pra futuras otimizações da LandingPage.

import { useState, useEffect, useRef } from 'react';
import {
  loadFullCatalog,
  loadCatalogIndex,
  prefetchCatalog,
  getCachedIndex
} from '../services/catalog';

const API_INSTALLED_PATH = '/api/installed';
const POLL_INTERVAL_MS = 30_000;

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
  const flatpaksRef = useRef(installedFlatpaks);

  // Mantém ref sincronizada com state (para o fetch on-focus saber o valor atual)
  flatpaksRef.current = installedFlatpaks;

  // Carrega o catálogo (lazy + idle prefetch)
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

  // Sincroniza com o backend sobre Flatpaks instalados.
  // Implementa 3 triggers:
  //   1) Mount inicial
  //   2) window 'focus' event (user volta pro app via Alt-Tab)
  //   3) Polling a cada 30s (cobre installs via terminal)
  useEffect(() => {
    let cancelled = false;
    let pollTimerId = null;

    const fetchInstalled = () => {
      fetch(API_INSTALLED_PATH)
        .then((res) => {
          if (cancelled) return null;
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
          // Compara com valor anterior para evitar setState redundante
          const current = flatpaksRef.current;
          if (
            current.length === data.flatpaks.length &&
            current.every((id, i) => id === data.flatpaks[i])
          ) {
            return;
          }
          setInstalledFlatpaks(data.flatpaks);
        })
        .catch(() => {
          if (!cancelled) setFlatpakStatus('unknown');
        });
    };

    // 1) Mount inicial
    fetchInstalled();

    // 2) Refetch ao focar a janela
    const onFocus = () => fetchInstalled();
    window.addEventListener('focus', onFocus);

    // 3) Polling de 30s
    pollTimerId = setInterval(fetchInstalled, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      if (pollTimerId) clearInterval(pollTimerId);
    };
  }, []);

  // P2.9: Pré-aquece o índice leve (8 KB) no boot, em paralelo com o catálogo
  // completo. Não bloqueia render: se falhar, loadFullCatalog ainda funciona.
  useEffect(() => {
    loadCatalogIndex().catch((err) => {
      console.warn('[useCatalog] loadCatalogIndex falhou (não-bloqueante):', err);
    });
  }, []);

  return { catalogIndex, loading, flatpakStatus, installedFlatpaks };
}
