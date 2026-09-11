import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import HeaderBar from './components/HeaderBar';
import CategoryNav from './components/CategoryNav';
import AppGrid from './components/AppGrid';
import LandingPage from './components/LandingPage';
import BatchActionBar from './components/BatchActionBar';
import ToastContainer from './components/Toast';

// Modais em chunks lazy. Resolve débito #17: cada modal fica em chunk
// próprio (~5-15KB), só baixa quando o usuário abre. Bundle inicial cai
// ~40KB (3 modais x ~13KB médio).
const AppDetailsModal = lazy(() => import('./components/AppDetailsModal'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));

// BatchActionModal fica eager (import direto) — estávamos tendo um problema
// onde o chunk lazy demorava 50-200ms no GTK WebView e, durante esse
// intervalo, o React renderizava um Suspense fallback=null sem overlay
// visível, dando a impressão de "tela cinza vazia" ao usuário. O custo
// de bundle é de ~6KB gzipped (pequeno, vale a previsibilidade).
import BatchActionModal from './components/BatchActionModal';
import { categoriesList } from './data/categoriesList';
import { searchFlathub } from './services/flathubApi';
import { useInstalledMap } from './hooks/useInstalledMap';
import { useCatalog } from './hooks/useCatalog';
import { useFilteredApps } from './hooks/useFilteredApps';
import { useBatchSelection } from './hooks/useBatchSelection';
import { useNavigation } from './hooks/useNavigation';
import { debugLog } from './services/debugLog';

const SETTINGS_KEY = 'mint_settings_v1';

const defaultSettings = {
  searchInSummary: true,
  searchInDescription: true,
  searchInCategoryOnly: false,
  enableFlathubLive: true,
  allowUnverifiedFlatpaks: false,
  packageTypePreference: 'all',
  confirmBatchAction: true,
  isDefaultPackageManager: true
};

export default function App() {
  // === Catalog + flatpak integration ===
  const { catalogIndex, loading: catalogLoading, flatpakStatus, installedFlatpaks } = useCatalog();

  // === Installed state with debounced localStorage ===
  const installedMap = useInstalledMap();

  // Aplica os installed flags do backend assim que chegarem (sem override do
  // estado manual do usuário).
  useEffect(() => {
    if (installedFlatpaks.length === 0) return;
    for (const id of installedFlatpaks) {
      installedMap.setInstalled(id, true);
    }
    // installedMap.setInstalled é estável via useCallback
  }, [installedFlatpaks, installedMap]);

  // App array derivado de catalogIndex + installedMap
  const apps = useMemo(() => {
    if (!catalogIndex) return [];
    return installedMap.applyToApps(catalogIndex.apps, false);
  }, [catalogIndex, installedMap]);

  // === Settings (localStorage) ===
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

  const handleSaveSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Error saving settings', e);
    }
  }, []);

  const handleResetDefaults = useCallback(() => {
    handleSaveSettings(defaultSettings);
  }, [handleSaveSettings]);

  // === UI state: search, installedOnly, selectedApp, isSettingsOpen ===
  const [searchQuery, setSearchQuery] = useState('');
  const [installedOnly, setInstalledOnly] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // === Navigation (currentView, selectedCategory, navHistory) ===
  const nav = useNavigation('picks');
  const { selectedCategory, canGoBack } = nav;

  // Quando searchQuery muda, marca search como ativo no nav (afeta isLandingVisible)
  useEffect(() => {
    nav.setSearch(!!searchQuery.trim());
  }, [searchQuery, nav]);

  // === Live Flathub search ===
  const [isSearchingFlathub, setIsSearchingFlathub] = useState(false);
  const handleSearchFlathubLive = useCallback(async (term) => {
    if (!settings.enableFlathubLive) return;
    const q = term || searchQuery || 'browser';
    setIsSearchingFlathub(true);
    try {
      await searchFlathub(q);
      // Não modificamos o array de apps — hits do Flathub vivem só durante a busca.
      // Para integrar ao array, seria necessário recriar o catalogIndex, mas isso
      // invalida os índices pré-computados. Por ora, o banner no AppGrid já
      // informa que a busca é online.
    } catch (err) {
      console.error('Erro na pesquisa ao vivo do Flathub', err);
    } finally {
      setIsSearchingFlathub(false);
    }
  }, [settings.enableFlathubLive, searchQuery]);

  useEffect(() => {
    if (settings.enableFlathubLive && selectedCategory === 'flatpak' && searchQuery.trim().length >= 3) {
      const debounceTimer = setTimeout(() => handleSearchFlathubLive(searchQuery), 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [searchQuery, selectedCategory, settings.enableFlathubLive, handleSearchFlathubLive]);

  // === Filtered apps (uses catalogIndex byName + _haystack) ===
  const filteredApps = useFilteredApps(apps, catalogIndex, {
    searchQuery, selectedCategory, installedOnly, settings
  });

  // === Batch selection ===
  const batch = useBatchSelection(filteredApps);
  const {
    selectedAppIds, toInstallApps, toUninstallApps,
    isAllVisibleSelected, toggleApp: handleToggleSelectApp,
    selectAllVisible: handleSelectAllVisible, clearSelection: handleClearSelection,
    removeFromSelection
  } = batch;

  // === Handlers composing the hooks ===
  const handleToggleInstall = useCallback((appId) => {
    const wasInstalled = installedMap.isInstalled(appId);
    installedMap.toggleInstalled(appId);
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp({ ...selectedApp, installed: !wasInstalled });
    }
  }, [installedMap, selectedApp]);

  const [batchModal, setBatchModal] = useState(null);
  const handleStartBatchExecution = useCallback(() => {
    const all = batch.selectedAppsList;
    if (all.length === 0) return;
    const appsToProcess = all.map((app) => ({
      ...app,
      batchAction: app.installed ? 'uninstall' : 'install'
    }));
    debugLog('info', 'App', 'Iniciando batch execution', {
      total: appsToProcess.length,
      ids: appsToProcess.map((a) => a.id)
    });
    setBatchModal({ type: 'mixed', apps: appsToProcess });
  }, [batch.selectedAppsList]);

  const handleBatchComplete = useCallback((res, maybeIsInstall) => {
    if (Array.isArray(res)) {
      for (const id of res) installedMap.setInstalled(id, !!maybeIsInstall);
      removeFromSelection(res);
      return;
    }
    const { installedIds = [], uninstalledIds = [] } = res || {};
    for (const id of installedIds) installedMap.setInstalled(id, true);
    for (const id of uninstalledIds) installedMap.setInstalled(id, false);
    removeFromSelection([...installedIds, ...uninstalledIds]);
  }, [installedMap, removeFromSelection]);

  // === Toggles composed ===
  const handleToggleInstalledOnly = useCallback(() => {
    setSearchQuery('');
    setInstalledOnly((prev) => {
      const next = !prev;
      if (next) {
        nav.goToPicks();
        nav.selectCategory('all');
      } else if (selectedCategory === 'all' || selectedCategory === 'picks') {
        nav.goToPicks();
      }
      return next;
    });
  }, [nav, selectedCategory]);

  const handleSelectCategory = useCallback((catId) => {
    setSearchQuery('');
    nav.selectCategory(catId);
    setInstalledOnly(false);
  }, [nav]);

  const handleBack = useCallback(() => {
    if (searchQuery) {
      setSearchQuery('');
      return;
    }
    nav.goBack();
  }, [nav, searchQuery]);

  // === Derived UI values ===
  const categoryTitle = useMemo(() => {
    if (searchQuery) return 'Resultados da Pesquisa';
    if (installedOnly) return 'Aplicativos Instalados';
    const cat = categoriesList.find((c) => c.id === selectedCategory);
    return cat ? cat.label : 'Início';
  }, [selectedCategory, searchQuery, installedOnly]);

  const installedCount = useMemo(
    () => apps.filter((a) => a.installed).length,
    [apps]
  );

  // Log estruturado de mudanças de UI state — útil pra debug remoto
  useEffect(() => {
    debugLog('debug', 'App', 'render', {
      selectedCategory,
      installedOnly,
      searchQuery: searchQuery ? searchQuery.slice(0, 30) : '',
      selectedCount: selectedAppIds.length,
      batchModal: batchModal ? { type: batchModal.type, count: batchModal.apps.length } : null,
      catalogLoading,
      catalogCount: catalogIndex?.apps?.length ?? 0
    });
  });

  const handleClearCache = useCallback(() => {
    installedMap.clear();
    window.location.reload();
  }, [installedMap]);

  // === Keyboard shortcuts globais (resolve débito #15) ===
  useEffect(() => {
    const onKey = (e) => {
      // Esc fecha modais OU limpa seleção
      if (e.key === 'Escape') {
        if (selectedApp) {
          setSelectedApp(null);
          e.preventDefault();
          return;
        }
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          e.preventDefault();
          return;
        }
        if (batchModal) {
          // Não fechamos batch mid-flight (precisa terminar); só limpa seleção
          if (selectedAppIds.length > 0) {
            handleClearSelection();
            e.preventDefault();
          }
          return;
        }
        if (selectedAppIds.length > 0) {
          handleClearSelection();
          e.preventDefault();
        }
        return;
      }
      // Ctrl+A (ou Cmd+A no Mac): seleciona todos os visíveis
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !searchQuery) {
        // Não intercepta se o foco está num input/textarea
        const tag = e.target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (filteredApps.length > 0) {
          handleSelectAllVisible();
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    selectedApp, isSettingsOpen, batchModal, selectedAppIds,
    handleClearSelection, handleSelectAllVisible, searchQuery, filteredApps
  ]);

  return (
    <div className="w-full h-screen bg-[#26292d] flex flex-col overflow-hidden relative select-none">
      <HeaderBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        canGoBack={canGoBack || !!searchQuery}
        onBack={handleBack}
        onOpenSettings={() => setIsSettingsOpen(true)}
        flatpakStatus={flatpakStatus}
      />

      <CategoryNav
        categories={categoriesList}
        selectedCategory={searchQuery ? '' : selectedCategory}
        onSelectCategory={handleSelectCategory}
        installedOnly={installedOnly}
        onToggleInstalledOnly={handleToggleInstalledOnly}
        installedCount={installedCount}
      />

      {nav.isLandingVisible ? (
        <LandingPage
          onSelectCategory={handleSelectCategory}
          onSelectApp={setSelectedApp}
          apps={apps}
          isLoading={catalogLoading}
        />
      ) : (
        <AppGrid
          apps={filteredApps}
          categoryTitle={categoryTitle}
          searchQuery={searchQuery}
          installedOnly={installedOnly}
          onSelectApp={setSelectedApp}
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

      <Suspense fallback={
        // Fallback visual enquanto o chunk lazy do modal baixa.
        // Era null antes, o que dava a impressão de "tela cinza" no
        // GTK WebView (50-200ms de download). Agora mostra overlay + spinner.
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-[#2a2d32] border border-[#3c4149] rounded-lg px-6 py-4 flex items-center space-x-3 shadow-2xl">
            <div className="w-4 h-4 border-2 border-[#87cf3e] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[#e0e0e0]">Carregando...</span>
          </div>
        </div>
      }>
        {selectedApp && (
          <AppDetailsModal
            app={selectedApp}
            onClose={() => setSelectedApp(null)}
            onToggleInstall={handleToggleInstall}
          />
        )}

        {batchModal && (
          <BatchActionModal
            actionType={batchModal.type}
            targetApps={batchModal.apps}
            onClose={() => setBatchModal(null)}
            onComplete={handleBatchComplete}
          />
        )}

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onResetDefaults={handleResetDefaults}
          onClearCache={handleClearCache}
        />
      </Suspense>

      <ToastContainer />
    </div>
  );
}
