import { useState, useEffect, useCallback, useMemo } from 'react';

// This cache is for export only. Installation state is always read from the OS
// when starting the app; old localStorage flags are not trusted.
const STORAGE_KEY = 'mint_installed_map_v1';

export function useInstalledMap() {
  const [map, setMap] = useState({});
  useEffect(() => {
    const timer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch { /* Cache is optional. */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [map]);

  const isInstalled = useCallback(id => map[id], [map]);
  const setInstalled = useCallback((id, value) => {
    setMap(prev => prev[id] === !!value ? prev : { ...prev, [id]: !!value });
  }, []);
  const toggleInstalled = useCallback(id => {
    setMap(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);
  const replace = useCallback(ids => {
    const next = Object.fromEntries(ids.map(id => [id, true]));
    setMap(prev => Object.keys(prev).length === ids.length && ids.every(id => prev[id]) ? prev : next);
  }, []);
  const applyToApps = useCallback(apps => apps.map(app => ({ ...app, installed: map[app.id] === true })), [map]);
  const clear = useCallback(() => {
    setMap({});
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* Cache is optional. */ }
  }, []);
  return useMemo(() => ({ isInstalled, setInstalled, toggleInstalled, replace, applyToApps, clear, map }),
    [isInstalled, setInstalled, toggleInstalled, replace, applyToApps, clear, map]);
}
