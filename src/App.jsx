import React, { useState, useEffect, useMemo } from 'react';
import HeaderBar from './components/HeaderBar';
import CategoryNav from './components/CategoryNav';
import AppGrid from './components/AppGrid';
import LandingPage from './components/LandingPage';
import AppDetailsModal from './components/AppDetailsModal';
import BatchActionBar from './components/BatchActionBar';
import BatchActionModal from './components/BatchActionModal';
import SettingsModal from './components/SettingsModal';
import { initialApps, categoriesList } from './data/initialApps';
import { searchFlathub } from './services/flathubApi';

const STORAGE_KEY = 'mint_apps_state_v5';
const SETTINGS_KEY = 'mint_settings_v1';

const defaultSettings = {
  searchInSummary: true,
  searchInDescription: true,
  searchInCategoryOnly: false,
  enableFlathubLive: true,
  allowUnverifiedFlatpaks: false,
  packageTypePreference: 'all', // 'all' | 'flatpak' | 'apt'
  simulationMode: true,
  confirmBatchAction: true,
  isDefaultPackageManager: true,
  associateMimeTypes: true
};

export default function App() {
  // Load persisted apps or use comprehensive initialApps
  const [apps, setApps] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= initialApps.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading saved apps state', e);
    }
    return initialApps;
  });

  // Settings State
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error loading settings', e);
    }
    return defaultSettings;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sincronizar status real de Flatpaks instalados com o sistema operacional
  useEffect(() => {
    fetch('/api/installed')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.flatpaks)) {
          const installedSet = new Set(data.flatpaks);
          setApps((prevApps) =>
            prevApps.map((app) => {
              const isFlatpak =
                app.packageType?.toLowerCase().includes('flatpak') ||
                app.category === 'flatpak' ||
                (app.id && app.id.includes('.'));
              if (isFlatpak) {
                return { ...app, installed: installedSet.has(app.id) };
              }
              return app;
            })
          );
        }
      })
      .catch(() => {});
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

  // Persist apps when state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    } catch (e) {
      console.error('Error saving apps state', e);
    }
  }, [apps]);

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
    localStorage.removeItem(STORAGE_KEY);
    setApps(initialApps);
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
    setApps((prevApps) =>
      prevApps.map((a) => {
        if (a.id === appId) {
          const updated = { ...a, installed: !a.installed };
          if (selectedApp && selectedApp.id === appId) {
            setSelectedApp(updated);
          }
          return updated;
        }
        return a;
      })
    );
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
    return apps.filter((app) => {
      // Installed filter
      if (installedOnly && !app.installed) return false;

      // Multi-format preference filter
      if (settings.packageTypePreference === 'flatpak' && !app.flathub && !app.packageType?.includes('Flatpak')) {
        const hasFlatpakVariant = apps.some(a => (a.flathub || a.packageType?.includes('Flatpak')) && a.name.toLowerCase() === app.name.toLowerCase());
        if (hasFlatpakVariant) return false;
      }
      if (settings.packageTypePreference === 'apt' && (app.flathub || app.packageType?.includes('Flatpak'))) {
        const hasAptVariant = apps.some(a => !a.flathub && a.packageType?.includes('APT') && a.name.toLowerCase() === app.name.toLowerCase());
        if (hasAptVariant) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        
        // Check category restriction preference
        if (settings.searchInCategoryOnly && selectedCategory !== 'all' && selectedCategory !== 'picks') {
          if (selectedCategory === 'flatpak' && !app.flathub && !app.packageType?.includes('Flatpak')) return false;
          if (selectedCategory !== 'flatpak' && app.category !== selectedCategory) return false;
        }

        const matchesName = app.name.toLowerCase().includes(q);
        const matchesSummary = settings.searchInSummary && (
          (app.summary || '').toLowerCase().includes(q) || 
          (app.fullSummary || '').toLowerCase().includes(q)
        );
        const matchesDesc = settings.searchInDescription && (app.description || '').toLowerCase().includes(q);
        const matchesCategory = (app.categoryLabel || '').toLowerCase().includes(q);
        const matchesType = (app.packageType || '').toLowerCase().includes(q);
        const matchesId = (app.id || '').toLowerCase().includes(q);
        
        return matchesName || matchesSummary || matchesDesc || matchesCategory || matchesType || matchesId;
      }

      // "all" tab presents ALL applications available in the platform
      if (selectedCategory === 'all') {
        return true;
      }

      // "flatpak" tab presents all Flatpaks from Flathub
      if (selectedCategory === 'flatpak') {
        return app.category === 'flatpak' || app.flathub || app.packageType?.includes('Flatpak');
      }

      // Specific Category filter
      if (selectedCategory && selectedCategory !== 'picks') {
        return app.category === selectedCategory;
      }

      return true;
    });
  }, [apps, searchQuery, selectedCategory, installedOnly, settings]);

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
      setApps((prevApps) =>
        prevApps.map((a) => (res.includes(a.id) ? { ...a, installed: maybeIsInstall } : a))
      );
      setSelectedAppIds((prev) => prev.filter((id) => !res.includes(id)));
      return;
    }

    const { installedIds = [], uninstalledIds = [] } = res || {};
    setApps((prevApps) =>
      prevApps.map((a) => {
        if (installedIds.includes(a.id)) return { ...a, installed: true };
        if (uninstalledIds.includes(a.id)) return { ...a, installed: false };
        return a;
      })
    );
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
          simulationMode={settings.simulationMode}
          setSimulationMode={(val) => handleSaveSettings({ ...settings, simulationMode: val })}
          onOpenSettings={() => setIsSettingsOpen(true)}
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
            simulationMode={settings.simulationMode}
          />
        )}

        {/* Batch Action Modal */}
        {batchModal && (
          <BatchActionModal
            actionType={batchModal.type}
            targetApps={batchModal.apps}
            onClose={() => setBatchModal(null)}
            onComplete={handleBatchComplete}
            simulationMode={settings.simulationMode}
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
