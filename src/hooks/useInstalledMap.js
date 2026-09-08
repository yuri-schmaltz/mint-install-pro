// Custom hook: gerencia o installedMap (id -> bool) persistido em localStorage.
// Substitui o write síncrono de 700KB de JSON.stringify(apps) que acontecia
// a cada mudança de checkbox. Agora persiste só os IDs alterados, debounced
// em 500ms, e mantém o Map em memória para lookups O(1).
//
// Resolve débito #3 do gauntlet loop 1.3.1.

import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'mint_installed_map_v1';
const DEBOUNCE_MS = 500;

function loadInitial() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // Sanity: chaves têm que ser strings, valores booleanos
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed;
  } catch (e) {
    console.warn('[installedMap] localStorage corrompido, ignorando:', e);
    return {};
  }
}

/**
 * Hook para gerenciar o map id -> installed (boolean) com persistência debounced.
 *
 * @returns {{
 *   isInstalled: (id: string) => boolean,
 *   setInstalled: (id: string, value: boolean) => void,
 *   toggleInstalled: (id: string) => void,
 *   applyToApps: (apps: Array) => Array,   // retorna apps com .installed preenchido
 *   clear: () => void
 * }}
 */
export function useInstalledMap() {
  const [map, setMap] = useState(loadInitial);
  const debounceRef = useRef(null);
  const latestMap = useRef(map);

  // Mantém latestMap em sincronia com state (para o debounced writer)
  latestMap.current = map;

  // Persiste com debounce. Só salva o map (nunca o array de apps).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(latestMap.current));
      } catch (e) {
        // QuotaExceededError é possível se o usuário tiver milhares de apps
        // editados; nesse caso logamos e deixamos para próxima mudança.
        console.warn('[installedMap] Falha ao persistir:', e);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [map]);

  const isInstalled = useCallback(
    (id) => (id in map ? !!map[id] : undefined),
    [map]
  );

  const setInstalled = useCallback((id, value) => {
    setMap((prev) => {
      // No-op se o valor já é o mesmo
      if (!!prev[id] === !!value) return prev;
      const next = { ...prev };
      if (value) {
        next[id] = true;
      } else {
        next[id] = false;
      }
      // Limpeza: se for false, deleta a chave (não precisamos guardar false explícito)
      if (!value) delete next[id];
      return next;
    });
  }, []);

  const toggleInstalled = useCallback((id) => {
    setMap((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      return next;
    });
  }, []);

  /**
   * Aplica o map a um array de apps, criando um NOVO array com a propriedade
   * `installed` preenchida. Apps não presentes no map usam `defaultValue`
   * (default: false, exceto para APT onde pode usar o estado atual do app).
   *
   * @param {Array} apps
   * @param {boolean} [defaultValue]
   * @returns {Array} novo array com .installed
   */
  const applyToApps = useCallback(
    (apps, defaultValue = false) => {
      // Single-pass O(N) com lookup O(1) por app
      const result = new Array(apps.length);
      for (let i = 0; i < apps.length; i++) {
        const app = apps[i];
        const overridden = map[app.id];
        result[i] = overridden === undefined
          ? { ...app, installed: app.installed ?? defaultValue }
          : { ...app, installed: !!overridden };
      }
      return result;
    },
    [map]
  );

  const clear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setMap({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('[installedMap] Falha ao limpar:', e);
    }
  }, []);

  return { isInstalled, setInstalled, toggleInstalled, applyToApps, clear, map };
}
