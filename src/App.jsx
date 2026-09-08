import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useInstalledMap } from './hooks/useInstalledMap';
import { useCatalog } from './hooks/useCatalog';
import { useFilteredApps } from './hooks/useFilteredApps';
import { useBatchSelection } from './hooks/useBatchSelection';
import { useNavigation } from './hooks/useNavigation';

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
    if (catId === 'picks') setInstalledOnly(false);
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
    return cat ? cat.label : 'Destaques';
  }, [selectedCategory, searchQuery, installedOnly]);

  const installedCount = useMemo(
    () => apps.filter((a) => a.installed).length,
    [apps]
  );

  const handleClearCache = useCallback(() => {
    installedMap.clear();
    window.location.reload();
  }, [installedMap]);

  return (
    <div className="w-full h-screen bg-[#26292d] flex flex-col overflow-hidden relative select-none">
      <HeaderBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        canGoBack={canGoBack || !!searchQuery}
        onBack={handleBack}
        installedOnly={installedOnly}
        setInstalledOnly={setInstalledOnly}
        onToggleInstalledOnly={handleToggleInstalledOnly}
        installedCount={installedCount}
        onOpenSettings={() => setIsSettingsOpen(true)}
        flatpakStatus={flatpakStatus}
      />

      <CategoryNav
        categories={categoriesList}
        selectedCategory={searchQuery ? '' : selectedCategory}
        onSelectCategory={handleSelectCategory}
        installedOnly={installedOnly}
        setInstalledOnly={setInstalledOnly}
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
    </div>
  );
}
