import { useState, useEffect, useRef, useCallback } from 'react';
import { loadFullCatalog, getCachedIndex } from '../services/catalog';

export function useCatalog() {
  const [catalogIndex, setCatalogIndex] = useState(() => getCachedIndex());
  const [loading, setLoading] = useState(!catalogIndex);
  const [catalogError, setCatalogError] = useState('');
  const [installedSnapshot, setInstalledSnapshot] = useState(null);
  const [flatpakStatus, setFlatpakStatus] = useState('unknown');
  const [installedError, setInstalledError] = useState('');
  const requestId = useRef(0);
  const mounted = useRef(false);
  const controller = useRef(null);

  const refreshInstalled = useCallback(async () => {
    const current = ++requestId.current;
    controller.current?.abort();
    const activeController = new AbortController();
    controller.current = activeController;
    const timer = setTimeout(() => activeController.abort(), 15000);
    try {
      const response = await fetch('/api/installed', { signal: controller.current.signal });
      if (!response.ok) throw new Error('Não foi possível consultar os pacotes instalados.');
      const data = await response.json();
      if (!Array.isArray(data.apt) || !Array.isArray(data.flatpaks) ||
          data.aptStatus !== 'available' || !['available', 'missing'].includes(data.flatpakStatus)) {
        throw new Error('A consulta de pacotes está incompleta. Tente atualizar novamente.');
      }
      if (mounted.current && current === requestId.current) {
        setInstalledSnapshot(data);
        setFlatpakStatus(data.flatpakStatus);
        setInstalledError('');
      }
      return data;
    } catch (error) {
      if (mounted.current && current === requestId.current) {
        setFlatpakStatus('unknown');
        setInstalledError(error.name === 'AbortError' ? 'A consulta de pacotes excedeu o tempo limite.' : error.message);
      }
      return null;
    } finally {
      clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (getCachedIndex()) return undefined;
    loadFullCatalog().then(index => {
      if (!cancelled) { setCatalogIndex(index); setLoading(false); }
    }).catch(error => {
      if (!cancelled) { setCatalogError(error.message); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    mounted.current = true;
    refreshInstalled();
    const onFocus = () => refreshInstalled();
    window.addEventListener('focus', onFocus);
    const timer = setInterval(refreshInstalled, 30000);
    return () => {
      mounted.current = false;
      controller.current?.abort();
      window.removeEventListener('focus', onFocus);
      clearInterval(timer);
    };
  }, [refreshInstalled]);

  return { catalogIndex, loading, catalogError, flatpakStatus, installedSnapshot, installedError, refreshInstalled };
}
