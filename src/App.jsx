import React, { useState, useEffect, useMemo } from 'react';
import HeaderBar from './components/HeaderBar';
import CategoryNav from './components/CategoryNav';
import AppGrid from './components/AppGrid';
import LandingPage from './components/LandingPage';
import AppDetailsModal from './components/AppDetailsModal';
import BatchActionBar from './components/BatchActionBar';
import BatchActionModal from './components/BatchActionModal';
import { initialApps, categoriesList } from './data/initialApps';

const STORAGE_KEY = 'mint_apps_state_v1';

export default function App() {
  // Load persisted apps or use initialApps
  const [apps, setApps] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading saved apps state', e);
    }
    return initialApps;
  });

  // Navigation and views
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'landing'
  const [selectedCategory, setSelectedCategory] = useState('accessories');
  const [navHistory, setNavHistory] = useState(['landing', 'accessories']);
  const [searchQuery, setSearchQuery] = useState('');
  const [installedOnly, setInstalledOnly] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [simulationMode, setSimulationMode] = useState(true);

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

  // Handle category selection
  const handleSelectCategory = (catId) => {
    setCurrentView('list');
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
      if (prev === 'landing') {
        setCurrentView('landing');
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

  // Filtered apps based on search, category and installed filter
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      // Installed filter
      if (installedOnly && !app.installed) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = app.name.toLowerCase().includes(q);
        const matchesSummary = (app.summary || '').toLowerCase().includes(q);
        const matchesFullSummary = (app.fullSummary || '').toLowerCase().includes(q);
        const matchesDesc = (app.description || '').toLowerCase().includes(q);
        const matchesCategory = (app.categoryLabel || '').toLowerCase().includes(q);
        return matchesName || matchesSummary || matchesFullSummary || matchesDesc || matchesCategory;
      }

      // Category filter (if not "all")
      if (selectedCategory && selectedCategory !== 'all') {
        return app.category === selectedCategory;
      }

      return true;
    });
  }, [apps, searchQuery, selectedCategory, installedOnly]);

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

  const handleBatchComplete = (affectedIds, isInstall) => {
    setApps((prevApps) =>
      prevApps.map((a) => {
        if (affectedIds.includes(a.id)) {
          return { ...a, installed: isInstall };
        }
        return a;
      })
    );
    // Remove completed from selection
    setSelectedAppIds((prev) => prev.filter((id) => !affectedIds.includes(id)));
  };

  // Category Title resolution
  const categoryTitle = useMemo(() => {
    if (searchQuery) return `Resultados da Pesquisa`;
    const cat = categoriesList.find((c) => c.id === selectedCategory);
    return cat ? cat.label : 'Acessórios';
  }, [selectedCategory, searchQuery]);

  const installedCount = useMemo(() => {
    return apps.filter((a) => a.installed).length;
  }, [apps]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#181a1d] p-0 sm:p-3 md:p-6 overflow-hidden">
      {/* Main GTK Window Frame simulating Linux Mint Cinnamon */}
      <div className="w-full max-w-6xl h-screen sm:h-[88vh] bg-[#26292d] rounded-none sm:rounded-lg border border-[#3b3f46] shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Linux Mint GTK HeaderBar */}
        <HeaderBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          canGoBack={canGoBack}
          onBack={handleBack}
          installedOnly={installedOnly}
          setInstalledOnly={setInstalledOnly}
          installedCount={installedCount}
          simulationMode={simulationMode}
          setSimulationMode={setSimulationMode}
        />

        {/* Categories Bar */}
        <CategoryNav
          categories={categoriesList}
          selectedCategory={currentView === 'landing' && !searchQuery ? '' : selectedCategory}
          onSelectCategory={handleSelectCategory}
          installedOnly={installedOnly}
          setInstalledOnly={setInstalledOnly}
        />

        {/* View Switch: Landing Page or App Grid */}
        {currentView === 'landing' && !searchQuery && !installedOnly ? (
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
          />
        )}

        {/* Floating Batch Action Bar */}
        <BatchActionBar
          selectedCount={selectedAppIds.length}
          toInstallCount={toInstallApps.length}
          toUninstallCount={toUninstallApps.length}
          onInstallBatch={handleStartBatchInstall}
          onUninstallBatch={handleStartBatchUninstall}
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
            simulationMode={simulationMode}
          />
        )}

        {/* Batch Action Modal */}
        {batchModal && (
          <BatchActionModal
            actionType={batchModal.type}
            targetApps={batchModal.apps}
            onClose={() => setBatchModal(null)}
            onComplete={handleBatchComplete}
            simulationMode={simulationMode}
          />
        )}

      </div>
    </div>
  );
}
