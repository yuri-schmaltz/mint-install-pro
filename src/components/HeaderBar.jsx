import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Search, 
  X, 
  FileCheck, 
  Menu, 
  Minus, 
  Square, 
  X as CloseIcon,
  ShieldCheck,
  RefreshCw,
  Info
} from 'lucide-react';

export default function HeaderBar({ 
  searchQuery, 
  setSearchQuery, 
  canGoBack, 
  onBack, 
  installedOnly, 
  setInstalledOnly,
  installedCount,
  simulationMode,
  setSimulationMode
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  return (
    <header className="bg-[#202326] border-b border-[#1b1c1e] text-[#dcdcdc] px-3 py-2 flex items-center justify-between select-none relative z-30 shadow-md">
      {/* Left controls: Back, Search, Tasks */}
      <div className="flex items-center space-x-2 flex-1 max-w-md">
        <button
          onClick={onBack}
          disabled={!canGoBack}
          title="Voltar"
          className={`p-1.5 rounded bg-[#2b2e33] border border-[#232528] hover:bg-[#383c42] active:bg-[#1e2023] transition-colors ${
            !canGoBack ? 'opacity-40 cursor-not-allowed' : 'opacity-100'
          }`}
        >
          <ChevronLeft className="w-4 h-4 text-[#e0e0e0]" />
        </button>

        {/* Search input styled like MintInstall HeaderBar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-[#8c919a]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar aplicativos..."
            className="w-full pl-8 pr-7 py-1 text-xs rounded-full bg-[#18191c] border border-[#2b2e33] text-[#f0f0f0] placeholder-[#7d828a] focus:outline-none focus:border-[#87cf3e] focus:ring-1 focus:ring-[#87cf3e] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-2 flex items-center text-[#7d828a] hover:text-[#f0f0f0]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Installed apps / tasks filter button */}
        <button
          onClick={() => setInstalledOnly(!installedOnly)}
          title={installedOnly ? "Mostrar todos os aplicativos" : "Mostrar apenas aplicativos instalados"}
          className={`p-1.5 rounded border transition-colors flex items-center space-x-1 text-xs ${
            installedOnly 
              ? 'bg-[#87cf3e]/20 border-[#87cf3e] text-[#87cf3e]' 
              : 'bg-[#2b2e33] border-[#232528] text-[#dcdcdc] hover:bg-[#383c42]'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          {installedCount > 0 && (
            <span className="text-[10px] font-semibold px-1 rounded-full bg-[#35393f] text-[#87cf3e]">
              {installedCount}
            </span>
          )}
        </button>
      </div>

      {/* Center: Window Title */}
      <div className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none hidden sm:block">
        <h1 className="text-sm font-semibold tracking-wide text-[#f2f2f2] drop-shadow-sm">
          Gerenciador de Aplicativos
        </h1>
      </div>

      {/* Right controls: Hamburger menu & Window Buttons */}
      <div className="flex items-center space-x-2">
        {/* Safe Sandbox Indicator */}
        <div 
          onClick={() => setSimulationMode(!simulationMode)}
          title={simulationMode ? "Modo Simulação Ativo (Seguro)" : "Modo Real"}
          className="cursor-pointer hidden lg:flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-[#1a1c1e] border border-[#2b2e33] hover:border-[#87cf3e] transition-all"
        >
          <ShieldCheck className={`w-3.5 h-3.5 ${simulationMode ? 'text-[#87cf3e]' : 'text-amber-400'}`} />
          <span className="text-[#a0a4ab]">
            {simulationMode ? 'Sandbox Seguro' : 'Modo Sistema'}
          </span>
        </div>

        {/* Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            title="Menu"
            className="p-1.5 rounded bg-[#2b2e33] border border-[#232528] hover:bg-[#383c42] active:bg-[#1e2023] transition-colors"
          >
            <Menu className="w-4 h-4 text-[#e0e0e0]" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-52 bg-[#2a2d32] border border-[#1b1c1e] rounded shadow-xl py-1 z-50 text-xs text-[#e4e4e4]">
              <button 
                onClick={() => { setSimulationMode(!simulationMode); setShowMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-[#35393f] flex items-center justify-between"
              >
                <span>Modo Sandbox Seguro</span>
                <span className={`w-2 h-2 rounded-full ${simulationMode ? 'bg-[#87cf3e]' : 'bg-zinc-500'}`} />
              </button>
              <button 
                onClick={() => { window.location.reload(); }}
                className="w-full text-left px-3 py-2 hover:bg-[#35393f] flex items-center space-x-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Atualizar Cache APT</span>
              </button>
              <div className="h-px bg-[#3b3f46] my-1" />
              <button 
                onClick={() => { setShowAbout(true); setShowMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-[#35393f] flex items-center space-x-2"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Sobre o Gerenciador</span>
              </button>
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <div className="h-4 w-px bg-[#3b3f46] mx-1" />

        {/* Window controls (Min, Max, Close) with Mint Cinnamon style */}
        <div className="flex items-center space-x-1.5">
          <button 
            title="Minimizar"
            className="w-4 h-4 rounded-full bg-[#3e4249] hover:bg-[#50555e] flex items-center justify-center transition-colors"
          >
            <Minus className="w-2.5 h-2.5 text-[#dcdcdc]" />
          </button>
          <button 
            title="Maximizar"
            className="w-4 h-4 rounded-full bg-[#3e4249] hover:bg-[#50555e] flex items-center justify-center transition-colors"
          >
            <Square className="w-2 h-2 text-[#dcdcdc]" />
          </button>
          <button 
            title="Fechar"
            className="w-4 h-4 rounded-full bg-[#3e4249] hover:bg-[#e81123] flex items-center justify-center transition-colors group"
          >
            <CloseIcon className="w-2.5 h-2.5 text-[#dcdcdc] group-hover:text-white" />
          </button>
        </div>
      </div>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2d32] border border-[#3b3f46] rounded-lg max-w-sm w-full p-5 shadow-2xl text-center">
            <img src="/mint-logo.svg" alt="Mint Logo" className="w-16 h-16 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white">Gerenciador de Aplicativos</h2>
            <p className="text-xs text-[#87cf3e] font-semibold mt-0.5">Versão 6.1.4 (Clone Mint-Y Dark)</p>
            <p className="text-xs text-[#a4a9b2] mt-3 leading-relaxed">
              Réplica interativa e de alta fidelidade visual do Gerenciador de Aplicativos oficial do Linux Mint (mintinstall), com suporte a catálogo reativo, busca instantânea e modo sandbox seguro.
            </p>
            <button
              onClick={() => setShowAbout(false)}
              className="mt-5 px-5 py-1.5 rounded bg-[#87cf3e] hover:bg-[#97df4e] text-[#1a2e05] font-semibold text-xs transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
