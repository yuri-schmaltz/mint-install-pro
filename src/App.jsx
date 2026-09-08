import React, { useState, useEffect, useMemo } from 'react';
import HeaderBar from './components/HeaderBar';
import CategoryNav from './components/CategoryNav';
import AppGrid from './components/AppGrid';
import LandingPage from './components/LandingPage';
import AppDetailsModal from './components/AppDetailsModal';
import BatchActionBar from './components/BatchActionBar';
import BatchActionModal from './components/BatchActionModal';
import SettingsModal from './components/SettingsModal';
import { categoriesList } from './data/categoriesList';
import { searchFlathub } from './services/flathubApi';
import { loadFullCatalog, prefetchCatalog, getCachedIndex } from './services/catalog';
import { useInstalledMap } from './hooks/useInstalledMap';

const SETTINGS_KEY = 'mint_settings_v1';

// Heurística única para detectar Flatpak. Usada em App.jsx e packageManager.js.
// Resolve-se por `app.isFlatpak` (campo pré-computado em catalogIndex) com
// fallback nos campos legados (kind/packageType/category).
function isFlatpakApp(app) {
  if (!app) return false;
  if (app.isFlatpak !== undefined) return app.isFlatpak;
  if (app.isApt !== undefined) return !app.isApt;
  if (app.kind === 'flatpak') return true;
  if (app.kind === 'apt') return false;
  if (app.packageType?.toLowerCase().includes('flatpak')) return true;
  if (app.packageType?.toLowerCase().includes('apt')) return false;
  if (app.category === 'flatpak') return true;
  if (app.category === 'all' || app.category === 'picks') return false;
  if (app.id && app.id.includes('.') && /^[a-zA-Z0-9_\-]+(\.[a-zA-Z0-9_\-]+)+$/.test(app.id)) return true;
  return false;
}

const defaultSettings = {
  searchInSummary: true,
  searchInDescription: true,
  searchInCategoryOnly: false,
  enableFlathubLive: true,
  allowUnverifiedFlatpaks: false,
  packageTypePreference: 'all', // 'all' | 'flatpak' | 'apt'
  confirmBatchAction: true,
  isDefaultPackageManager: true
};

export default function App() {
  // Estado de installed (id -> bool) com persistência debounced.
  // Resolve débito #3 (sincronamente gravar 700KB a cada click).
  const installedMap = useInstalledMap();

  // Carrega o catálogo de forma assíncrona (code-split via fetch) e guarda o
  // índice pré-computado (apps + byName + counts). Não mexemos no array puro
  // aqui — derivedApps é derivado de catalogIndex + installedMap.
  const [catalogIndex, setCatalogIndex] = useState(() => getCachedIndex());
  const [catalogLoading, setCatalogLoading] = useState(!catalogIndex);

  useEffect(() => {
    let cancelled = false;
    if (!catalogIndex) {
      loadFullCatalog().then((idx) => {
        if (cancelled) return;
        setCatalogIndex(idx);
        setCatalogLoading(false);
      }).catch((err) => {
        console.error('Falha ao carregar catálogo:', err);
        setCatalogLoading(false);
      });
    }
    prefetchCatalog();
    return () => { cancelled = true; };
  }, [catalogIndex]);

  // App array "vista" — aplica installedMap sobre o catálogo indexado
  const apps = useMemo(() => {
    if (!catalogIndex) return [];
    return installedMap.applyToApps(catalogIndex.apps, false);
  }, [catalogIndex, installedMap]);

  // Settings State
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        delete parsed.associateMimeTypes;
        return { ...defaultSettings, ...parsed };
      }
    } catch (e) {
      console.error('Error loading settings', e);
    }
    return defaultSettings;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Estado da integração com Flatpak: 'unknown' | 'available' | 'missing'
  // 'missing' = backend respondeu 503 (flatpak não está instalado no sistema)
  // 'unknown' = ainda não checou ou erro de rede
  const [flatpakStatus, setFlatpakStatus] = useState('unknown');

  // Sincronizar status real de Flatpaks instalados com o sistema operacional
  useEffect(() => {
    fetch('/api/installed')
      .then((res) => {
        // 503 = flatpak não instalado no sistema (warning explícito do backend)
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
        if (data && Array.isArray(data.flatpaks)) {
          // Sincroniza o installedMap: só atualiza IDs que ainda não foram
          // editados manualmente pelo usuário (chave ausente no map). Preserva
          // edições do usuário (chave presente, valor !== backend).
          for (const appId of data.flatpaks) {
            // setInstalled com no-op quando o estado já bate
            installedMap.setInstalled(appId, true);
          }
        }
      })
      .catch(() => {
        setFlatpakStatus('unknown');
      });
  // installedMap.setInstalled é estável (useCallback), então não precisa estar nas deps.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigation and views - Destaques como aba inicial
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'list'
  const [selectedCategory, setSelectedCategory] = useState('picks');
  const [navHistory, setNavHistory] = useState(['picks']);
  const [searchQuery, setSearchQuery] = useState('');
  const [installedOnly, setInstalledOnly] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  // Live Flathub search state
  const [isSearchingFlathub, setIsSearchingFlathub] = useState(false);

  // Batch selection state
  const [selectedAppIds, setSelectedAppIds] = useState([]);
  const [batchModal, setBatchModal] = useState(null); // { type: 'install' | 'uninstall', apps: [...] } | null

  // Persist settings when changed
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Error saving settings', e);
    }
  };

  const handleResetDefaults = () => {
    handleSaveSettings(defaultSettings);
  };

  const handleClearCache = () => {
    // Limpa o map de instalados e recarrega. useInstalledMap já cuida do
    // localStorage debounced e remove a chave.
    installedMap.clear();
    // Recarrega via JSON lazy
    window.location.reload();
    window.location.reload();
  };

  // Handle category selection
  const handleSelectCategory = (catId) => {
    if (catId === 'picks') {
      setCurrentView('landing');
      setInstalledOnly(false); // Garante que a tela de Destaques seja a LandingPage oficial com banners e matriz 3x3
    } else {
      setCurrentView('list');
    }
    setSelectedCategory(catId);
    setSearchQuery('');
    setNavHistory((prev) => [...prev, catId]);
  };

  // Handle back button navigation
  const handleBack = () => {
    if (searchQuery) {
      setSearchQuery('');
      return;
    }
    if (navHistory.length > 1) {
      const newHistory = [...navHistory];
      newHistory.pop();
      const prev = newHistory[newHistory.length - 1];
      setNavHistory(newHistory);
      if (prev === 'picks') {
        setCurrentView('landing');
        setSelectedCategory('picks');
      } else {
        setCurrentView('list');
        setSelectedCategory(prev);
      }
    }
  };

  const canGoBack = navHistory.length > 1 || searchQuery.length > 0;

  // Single app install/uninstall toggle
  const handleToggleInstall = (appId) => {
    // Usa o installedMap em vez de mutar o array. Como `apps` é derivado
    // (useMemo de catalogIndex + installedMap), o toggle propaga automaticamente.
    const wasInstalled = installedMap.isInstalled(appId);
    installedMap.toggleInstalled(appId);
    // Mantém o selectedApp em sincronia se for o mesmo
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp({ ...selectedApp, installed: !wasInstalled });
    }
  };

  // Live Flathub search
  const handleSearchFlathubLive = async (term) => {
    if (!settings.enableFlathubLive) return;
    const q = term || searchQuery || 'browser';
    setIsSearchingFlathub(true);
    try {
      const hits = await searchFlathub(q);
      if (hits && hits.length > 0) {
        setApps((prevApps) => {
          const existingIds = new Set(prevApps.map((a) => a.id));
          const newApps = hits.filter((h) => !existingIds.has(h.id));
          return [...newApps, ...prevApps];
        });
      }
    } catch (err) {
      console.error('Erro na pesquisa ao vivo do Flathub', err);
    } finally {
      setIsSearchingFlathub(false);
    }
  };

  // Trigger live flathub search automatically when searching in flatpak tab
  useEffect(() => {
    if (settings.enableFlathubLive && selectedCategory === 'flatpak' && searchQuery.trim().length >= 3) {
      const debounceTimer = setTimeout(() => {
        handleSearchFlathubLive(searchQuery);
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [searchQuery, selectedCategory, settings.enableFlathubLive]);

  // Filtered apps based on search, category and preferences
  const filteredApps = useMemo(() => {
    // Pré-condições: usa o índice pré-computado (catalogIndex.byName) para
    // detectar variantes cross-format em O(1) por app, e _haystack para busca
    // sem alocações no hot loop. Resolve débitos #1 (O(N²) → O(N)) e #2
    // (zero toLowerCase por keystroke).
    if (!catalogIndex) return [];
    const byName = catalogIndex.byName;
    const pkgPref = settings.packageTypePreference;
    const hasQuery = !!searchQuery.trim();
    const q = hasQuery ? searchQuery.toLowerCase() : '';
    const restrictCategory = settings.searchInCategoryOnly
      && selectedCategory !== 'all' && selectedCategory !== 'picks';

    const out = [];
    for (let i = 0; i < apps.length; i++) {
      const app = apps[i];

      // Filtro 1: installedOnly
      if (installedOnly && !app.installed) continue;

      // Filtro 2: multi-format preference (cross-format dedup)
      if (pkgPref === 'flatpak' && !app.isFlatpak) {
        const variants = byName.get(app._nameLower) || [];
        const hasFlatpakVariant = variants.some((v) => v.isFlatpak);
        if (hasFlatpakVariant) continue;
      }
      if (pkgPref === 'apt' && app.isFlatpak) {
        const variants = byName.get(app._nameLower) || [];
        const hasAptVariant = variants.some((v) => v.isApt);
        if (hasAptVariant) continue;
      }

      // Filtro 3: busca por query
      if (hasQuery) {
        // Restrição de categoria dentro da busca
        if (restrictCategory) {
          if (selectedCategory === 'flatpak' && !app.isFlatpak) continue;
          if (selectedCategory !== 'flatpak' && app.category !== selectedCategory) continue;
        }
        // Haystack: 1 comparação de substring (todos os campos relevantes já lowercased)
        if (!app._haystack.includes(q)) continue;
      } else {
        // Sem query: filtra por categoria
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

  // Batch selection handlers
  const handleToggleSelectApp = (appId) => {
    setSelectedAppIds((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const isAllVisibleSelected = useMemo(() => {
    if (filteredApps.length === 0) return false;
    return filteredApps.every((a) => selectedAppIds.includes(a.id));
  }, [filteredApps, selectedAppIds]);

  const handleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      // Deselect visible
      const visibleIds = new Set(filteredApps.map((a) => a.id));
      setSelectedAppIds((prev) => prev.filter((id) => !visibleIds.has(id)));
    } else {
      // Select all visible
      const newIds = new Set([...selectedAppIds, ...filteredApps.map((a) => a.id)]);
      setSelectedAppIds(Array.from(newIds));
    }
  };

  const handleClearSelection = () => {
    setSelectedAppIds([]);
  };

  // Batch calculations
  const selectedAppsList = useMemo(() => {
    return apps.filter((a) => selectedAppIds.includes(a.id));
  }, [apps, selectedAppIds]);

  const toInstallApps = useMemo(() => {
    return selectedAppsList.filter((a) => !a.installed);
  }, [selectedAppsList]);

  const toUninstallApps = useMemo(() => {
    return selectedAppsList.filter((a) => a.installed);
  }, [selectedAppsList]);

  const handleStartBatchInstall = () => {
    if (toInstallApps.length === 0) return;
    setBatchModal({ type: 'install', apps: toInstallApps });
  };

  const handleStartBatchUninstall = () => {
    if (toUninstallApps.length === 0) return;
    setBatchModal({ type: 'uninstall', apps: toUninstallApps });
  };

  const handleStartBatchExecution = () => {
    if (selectedAppsList.length === 0) return;
    const appsToProcess = selectedAppsList.map((app) => ({
      ...app,
      batchAction: app.installed ? 'uninstall' : 'install'
    }));
    setBatchModal({ type: 'mixed', apps: appsToProcess });
  };

  const handleBatchComplete = (res, maybeIsInstall) => {
    if (Array.isArray(res)) {
      for (const id of res) {
        installedMap.setInstalled(id, !!maybeIsInstall);
      }
      setSelectedAppIds((prev) => prev.filter((id) => !res.includes(id)));
      return;
    }

    const { installedIds = [], uninstalledIds = [] } = res || {};
    for (const id of installedIds) installedMap.setInstalled(id, true);
    for (const id of uninstalledIds) installedMap.setInstalled(id, false);
    const allAffected = [...installedIds, ...uninstalledIds];
    setSelectedAppIds((prev) => prev.filter((id) => !allAffected.includes(id)));
  };

  // Category Title resolution
  const categoryTitle = useMemo(() => {
    if (searchQuery) return `Resultados da Pesquisa`;
    if (installedOnly) return `Aplicativos Instalados`;
    const cat = categoriesList.find((c) => c.id === selectedCategory);
    return cat ? cat.label : 'Destaques';
  }, [selectedCategory, searchQuery, installedOnly]);

  const handleToggleInstalledOnly = () => {
    const nextVal = !installedOnly;
    setInstalledOnly(nextVal);
    if (nextVal) {
      setCurrentView('list');
      if (selectedCategory === 'picks') {
        setSelectedCategory('all');
      }
    } else {
      if (selectedCategory === 'all' || selectedCategory === 'picks') {
        setCurrentView('landing');
        setSelectedCategory('picks');
      }
    }
  };

  const installedCount = useMemo(() => {
    return apps.filter((a) => a.installed).length;
  }, [apps]);

  return (
    <div className="w-full h-screen bg-[#26292d] flex flex-col overflow-hidden relative select-none">
      {/* Linux Mint GTK HeaderBar */}
        <HeaderBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          canGoBack={canGoBack}
          onBack={handleBack}
          installedOnly={installedOnly}
          setInstalledOnly={setInstalledOnly}
          onToggleInstalledOnly={handleToggleInstalledOnly}
          installedCount={installedCount}
          onOpenSettings={() => setIsSettingsOpen(true)}
          flatpakStatus={flatpakStatus}
        />

        {/* Categories Bar */}
        <CategoryNav
          categories={categoriesList}
          selectedCategory={searchQuery ? '' : selectedCategory}
          onSelectCategory={handleSelectCategory}
          installedOnly={installedOnly}
          setInstalledOnly={setInstalledOnly}
        />

        {/* View Switch: Landing Page or App Grid */}
        {currentView === 'landing' && !searchQuery ? (
          <LandingPage
            onSelectCategory={handleSelectCategory}
            onSelectApp={(app) => setSelectedApp(app)}
            apps={apps}
            isLoading={catalogLoading}
          />
        ) : (
          <AppGrid
            apps={filteredApps}
            categoryTitle={categoryTitle}
            searchQuery={searchQuery}
            installedOnly={installedOnly}
            onSelectApp={(app) => setSelectedApp(app)}
            selectedAppIds={selectedAppIds}
            onToggleSelectApp={handleToggleSelectApp}
            onSelectAllVisible={handleSelectAllVisible}
            isAllVisibleSelected={isAllVisibleSelected}
            selectedCategory={selectedCategory}
            onSearchFlathubLive={handleSearchFlathubLive}
            isSearchingFlathub={isSearchingFlathub}
            isLoading={catalogLoading}
          />
        )}

        {/* Dedicated Batch Action Bar */}
        <BatchActionBar
          selectedCount={selectedAppIds.length}
          toInstallCount={toInstallApps.length}
          toUninstallCount={toUninstallApps.length}
          onExecuteBatch={handleStartBatchExecution}
          onInstallBatch={handleStartBatchExecution}
          onUninstallBatch={handleStartBatchExecution}
          onClearSelection={handleClearSelection}
          onSelectAllVisible={handleSelectAllVisible}
          isAllVisibleSelected={isAllVisibleSelected}
        />

        {/* Single App Details Modal */}
        {selectedApp && (
          <AppDetailsModal
            app={selectedApp}
            onClose={() => setSelectedApp(null)}
            onToggleInstall={handleToggleInstall}
          />
        )}

        {/* Batch Action Modal */}
        {batchModal && (
          <BatchActionModal
            actionType={batchModal.type}
            targetApps={batchModal.apps}
            onClose={() => setBatchModal(null)}
            onComplete={handleBatchComplete}
          />
        )}

        {/* Preferences / Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onResetDefaults={handleResetDefaults}
          onClearCache={handleClearCache}
        />
    </div>
  );
}
