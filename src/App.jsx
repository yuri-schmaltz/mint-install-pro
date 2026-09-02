import React, { useState, useEffect, useMemo } from 'react';
import HeaderBar from './components/HeaderBar';
import CategoryNav from './components/CategoryNav';
import AppGrid from './components/AppGrid';
import LandingPage from './components/LandingPage';
import AppDetailsModal from './components/AppDetailsModal';
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

  // Start with 'accessories' in the category to match the user's screenshot exactly!
  // But history has 'landing' as root, so Back button '<' works seamlessly.
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'landing'
  const [selectedCategory, setSelectedCategory] = useState('accessories');
  const [navHistory, setNavHistory] = useState(['landing', 'accessories']);
  const [searchQuery, setSearchQuery] = useState('');
  const [installedOnly, setInstalledOnly] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [simulationMode, setSimulationMode] = useState(true);

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

  // Toggle app installation
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
      <div className="w-full max-w-6xl h-screen sm:h-[88vh] bg-[#26292d] rounded-none sm:rounded-lg border border-[#3b3f46] shadow-2xl flex flex-col overflow-hidden">
        
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
          />
        )}

        {/* Modal for App Details */}
        {selectedApp && (
          <AppDetailsModal
            app={selectedApp}
            onClose={() => setSelectedApp(null)}
            onToggleInstall={handleToggleInstall}
            simulationMode={simulationMode}
          />
        )}

      </div>
    </div>
  );
}
