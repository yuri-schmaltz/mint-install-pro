// Custom hook: gerencia navegação entre abas + view (landing vs list) + back.

import { useState, useCallback, useMemo } from 'react';

/**
 * @param {string} initialCategory
 * @returns {{
 *   currentView: 'landing'|'list',
 *   selectedCategory: string,
 *   navHistory: string[],
 *   canGoBack: boolean,
 *   selectCategory: (catId: string) => void,
 *   goBack: (onClearSearch?: () => void) => void,
 *   goToPicks: () => void,
 *   isLandingVisible: boolean   // currentView === 'landing' && !searchQuery
 * }}
 */
export function useNavigation(initialCategory = 'picks') {
  const [currentView, setCurrentView] = useState('landing');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [navHistory, setNavHistory] = useState([initialCategory]);
  const [searchActive, setSearchActive] = useState(false);

  const canGoBack = navHistory.length > 1 || searchActive;

  const selectCategory = useCallback((catId) => {
    if (catId === 'picks') {
      setCurrentView('landing');
    } else {
      setCurrentView('list');
    }
    setSelectedCategory(catId);
    setNavHistory((prev) => [...prev, catId]);
    setSearchActive(false);
  }, []);

  const goBack = useCallback(() => {
    if (searchActive) {
      setSearchActive(false);
      return;
    }
    if (navHistory.length > 1) {
      const newHistory = navHistory.slice(0, -1);
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
  }, [navHistory, searchActive]);

  const goToPicks = useCallback(() => {
    setCurrentView('landing');
    setSelectedCategory('picks');
    setSearchActive(false);
  }, []);

  const setSearch = useCallback((active) => {
    setSearchActive(!!active);
  }, []);

  const isLandingVisible = currentView === 'landing' && !searchActive;

  return {
    currentView,
    selectedCategory,
    navHistory,
    canGoBack,
    selectCategory,
    goBack,
    goToPicks,
    setSearch,
    isLandingVisible
  };
}
