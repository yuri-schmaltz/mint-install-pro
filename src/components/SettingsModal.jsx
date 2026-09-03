import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Search, 
  Boxes, 
  RotateCcw, 
  AlertTriangle,
  Check,
  HardDrive,
  Monitor,
  ChevronDown
} from 'lucide-react';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  onSaveSettings,
  onResetDefaults,
  onClearCache
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'flatpak' | 'security' | 'system'
  const [localSettings, setLocalSettings] = useState(settings);
  const [savedToast, setSavedToast] = useState(false);
  const [defaultApplied, setDefaultApplied] = useState(false);

  const handleChange = (key, value) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onSaveSettings(updated);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-[#2a2d32] border border-[#3c4149] rounded-lg max-w-xl w-full h-[530px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#e0e0e0]">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#202326] border-b border-[#1b1c1e] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1 rounded bg-[#87cf3e]/20 text-[#87cf3e]">
              <Settings className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white">Preferências do Gerenciador</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#35393f] text-[#9ca3af] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#32363c] bg-[#24272b] px-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3.5 py-2.5 flex items-center space-x-1.5 border-b-2 transition-colors ${
              activeTab === 'search'
                ? 'border-[#87cf3e] text-white font-semibold'
                : 'border-transparent text-[#9ca3af] hover:text-[#dcdcdc]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Pesquisa</span>
          </button>

          <button
            onClick={() => setActiveTab('flatpak')}
            className={`px-3.5 py-2.5 flex items-center space-x-1.5 border-b-2 transition-colors ${
              activeTab === 'flatpak'
                ? 'border-[#87cf3e] text-white font-semibold'
                : 'border-transparent text-[#9ca3af] hover:text-[#dcdcdc]'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Flatpaks</span>
          </button>

          <button
            onClick={() => setActiveTab('operations')}
            className={`px-3.5 py-2.5 flex items-center space-x-1.5 border-b-2 transition-colors ${
              activeTab === 'operations'
                ? 'border-[#87cf3e] text-white font-semibold'
                : 'border-transparent text-[#9ca3af] hover:text-[#dcdcdc]'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Operações & Lote</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-3.5 py-2.5 flex items-center space-x-1.5 border-b-2 transition-colors ${
              activeTab === 'system'
                ? 'border-[#87cf3e] text-white font-semibold'
                : 'border-transparent text-[#9ca3af] hover:text-[#dcdcdc]'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Sistema & Padrão</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          
          {/* 1. Opções de Pesquisa */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#87cf3e] mb-2">
                  Opções Gerais de Pesquisa
                </h3>
                <div className="bg-[#202226] border border-[#32363c] rounded-lg divide-y divide-[#2a2d33]">
                  
                  {/* Search in Summary */}
                  <label className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#25282e] transition-colors">
                    <div>
                      <div className="text-white font-medium">Buscar no resumo dos pacotes</div>
                      <div className="text-[11px] text-[#8e95a0]">Localiza correspondências no sumário rápido de cada aplicativo</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.searchInSummary}
                      onChange={(e) => handleChange('searchInSummary', e.target.checked)}
                      className="w-4 h-4 rounded text-[#87cf3e] accent-[#87cf3e] cursor-pointer"
                    />
                  </label>

                  {/* Search in Description */}
                  <label className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#25282e] transition-colors">
                    <div>
                      <div className="text-white font-medium">Buscar na descrição detalhada</div>
                      <div className="text-[11px] text-[#8e95a0]">Varre todo o texto de descrição dos aplicativos durante buscas</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.searchInDescription}
                      onChange={(e) => handleChange('searchInDescription', e.target.checked)}
                      className="w-4 h-4 rounded text-[#87cf3e] accent-[#87cf3e] cursor-pointer"
                    />
                  </label>

                  {/* Search in Category Only */}
                  <label className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#25282e] transition-colors">
                    <div>
                      <div className="text-white font-medium">Limitar busca à categoria selecionada</div>
                      <div className="text-[11px] text-[#8e95a0]">Se desmarcado, a pesquisa procura em todo o catálogo global</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.searchInCategoryOnly}
                      onChange={(e) => handleChange('searchInCategoryOnly', e.target.checked)}
                      className="w-4 h-4 rounded text-[#87cf3e] accent-[#87cf3e] cursor-pointer"
                    />
                  </label>

                </div>
              </div>
            </div>
          )}

          {/* 2. Flatpaks */}
          {activeTab === 'flatpak' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-2">
                  Gerenciamento de Flatpaks & Flathub
                </h3>
                <div className="bg-[#202226] border border-[#32363c] rounded-lg divide-y divide-[#2a2d33]">
                  
                  {/* Enable Live Search */}
                  <label className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#25282e] transition-colors">
                    <div>
                      <div className="text-white font-medium">Busca online ao vivo no Flathub</div>
                      <div className="text-[11px] text-[#8e95a0]">Consulta a API oficial do Flathub em tempo real para novos pacotes</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.enableFlathubLive}
                      onChange={(e) => handleChange('enableFlathubLive', e.target.checked)}
                      className="w-4 h-4 rounded text-sky-400 accent-sky-500 cursor-pointer"
                    />
                  </label>

                  {/* Allow Unverified Flatpaks */}
                  <label className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#25282e] transition-colors">
                    <div>
                      <div className="text-white font-medium flex items-center space-x-1.5">
                        <span>Mostrar Flatpaks não verificados</span>
                        <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/15 px-1.5 rounded border border-amber-500/30">Não recomendado</span>
                      </div>
                      <div className="text-[11px] text-[#8e95a0]">Exibe pacotes mantidos por terceiros não certificados pelos autores originais</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.allowUnverifiedFlatpaks}
                      onChange={(e) => handleChange('allowUnverifiedFlatpaks', e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                    />
                  </label>

                  {/* Multi-format preference */}
                  <div className="p-3.5 space-y-2">
                    <div className="text-white font-medium">Quando um aplicativo existir em múltiplos formatos (APT / Flatpak):</div>
                    <div className="relative">
                      <select
                        value={localSettings.packageTypePreference}
                        onChange={(e) => handleChange('packageTypePreference', e.target.value)}
                        className="w-full appearance-none px-3.5 py-2.5 pr-10 rounded-md bg-[#181a1d] hover:bg-[#202227] border border-[#3e444e] hover:border-[#4d5460] text-white font-medium focus:outline-none focus:border-[#87cf3e] focus:ring-1 focus:ring-[#87cf3e]/50 text-xs cursor-pointer transition-colors shadow-inner"
                      >
                        <option value="all" className="bg-[#181a1d] text-white py-1">Listar todos os formatos (Padrão)</option>
                        <option value="flatpak" className="bg-[#181a1d] text-white py-1">Apenas listar a versão Flatpak</option>
                        <option value="apt" className="bg-[#181a1d] text-white py-1">Apenas listar a versão do sistema (APT)</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#a0a5ad]">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-500/30 text-[11.5px] text-sky-200/80 flex items-start space-x-2">
                <Boxes className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                <span>Os aplicativos Flatpak são executados com isolamento de dependências e independem das versões das bibliotecas do sistema base.</span>
              </div>
            </div>
          )}

          {/* 3. Operações & Lote */}
          {activeTab === 'operations' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#87cf3e] mb-2">
                  Preferências de Execução de Pacotes
                </h3>
                <div className="bg-[#202226] border border-[#32363c] rounded-lg divide-y divide-[#2a2d33]">
                  
                  {/* Confirm Batch Actions */}
                  <label className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#25282e] transition-colors">
                    <div>
                      <div className="text-white font-medium">Confirmar operações em lote</div>
                      <div className="text-[11px] text-[#8e95a0]">Exibe diálogo com contagem de pacotes antes de iniciar instalações ou remoções massivas</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.confirmBatchAction}
                      onChange={(e) => handleChange('confirmBatchAction', e.target.checked)}
                      className="w-4 h-4 rounded text-[#87cf3e] accent-[#87cf3e] cursor-pointer"
                    />
                  </label>

                  {/* Cache clearing */}
                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">Cache da aplicação e índices</div>
                      <div className="text-[11px] text-[#8e95a0]">Limpa metadados e força recarregamento do estado do sistema</div>
                    </div>
                    <button
                      onClick={onClearCache}
                      className="px-3 py-1.5 rounded bg-[#2b2e34] hover:bg-[#383c44] text-[#e0e0e0] border border-[#383d47] font-medium text-xs transition-colors"
                    >
                      Limpar Cache
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* 4. Sistema & Gerenciador Padrão */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              {/* Integração com o Sistema Operacional */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#87cf3e] mb-2 flex items-center space-x-1.5">
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Integração com o Sistema Operacional</span>
                </h3>
                <div className="bg-[#202226] border border-[#32363c] rounded-lg divide-y divide-[#2a2d33]">
                  
                  {/* Default App Manager Option */}
                  <label className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#25282e] transition-colors">
                    <div className="pr-4">
                      <div className="text-white font-medium flex items-center space-x-2">
                        <span>Tornar o Mint Install Pro o gerenciador padrão do sistema</span>
                        {localSettings.isDefaultPackageManager && (
                          <span className="text-[10px] font-bold text-[#87cf3e] bg-[#87cf3e]/15 px-2 py-0.5 rounded-full border border-[#87cf3e]/30">
                            Padrão Ativo
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#8e95a0] mt-0.5">
                        Registra o Mint Install Pro como o manipulador para protocolos <code className="text-[#87cf3e]">appstream://</code> e <code className="text-[#87cf3e]">apt://</code>.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.isDefaultPackageManager !== false}
                      onChange={(e) => {
                        handleChange('isDefaultPackageManager', e.target.checked);
                        if (e.target.checked) {
                          setDefaultApplied(true);
                          setTimeout(() => setDefaultApplied(false), 2500);
                        }
                      }}
                      className="w-4 h-4 rounded text-[#87cf3e] accent-[#87cf3e] cursor-pointer flex-shrink-0"
                    />
                  </label>

                  {/* Action & Command Helper */}
                  <div className="p-3.5 bg-[#1a1c1f] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <div className="text-[11.5px] text-[#cfd3db] font-medium">
                        Associação de Protocolos XDG no Linux Mint:
                      </div>
                      <div className="text-[10px] text-[#8e95a0] mt-0.5">
                        Mapeado para <span className="text-[#e0e0e0] font-mono">mint-install-pro.desktop</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleChange('isDefaultPackageManager', true);
                        setDefaultApplied(true);
                        setTimeout(() => setDefaultApplied(false), 2500);
                      }}
                      className="px-3.5 py-1.5 rounded bg-[#35393f] hover:bg-[#434850] text-[#e0e0e0] font-medium text-xs border border-[#444a53] transition-colors whitespace-nowrap self-start sm:self-center shadow-xs flex items-center space-x-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-[#87cf3e]" />
                      <span>{defaultApplied ? 'Padrão Aplicado!' : 'Definir como Padrão do Sistema'}</span>
                    </button>
                  </div>

                </div>
              </div>

              {/* Manutenção do Cache e Dados */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#87cf3e] mb-2 flex items-center space-x-1.5">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Manutenção do Cache e Dados</span>
                </h3>
                <div className="bg-[#202226] border border-[#32363c] rounded-lg p-4 space-y-3">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">Recarregar Catálogo e Cache</div>
                      <div className="text-[11px] text-[#8e95a0]">Ressincroniza os pacotes e ícones com os arquivos locais do Linux Mint</div>
                    </div>
                    <button
                      onClick={onClearCache}
                      className="px-3 py-1.5 rounded bg-[#35393f] hover:bg-[#434850] text-[#dcdcdc] font-medium border border-[#444a53] transition-colors"
                    >
                      Atualizar Agora
                    </button>
                  </div>

                  <div className="h-px bg-[#2d3137]" />

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">Restaurar Preferências Padrão</div>
                      <div className="text-[11px] text-[#8e95a0]">Restaura todas as configurações para as opções recomendadas</div>
                    </div>
                    <button
                      onClick={onResetDefaults}
                      className="px-3 py-1.5 rounded bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 font-medium border border-rose-700/40 transition-colors flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar</span>
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#202326] border-t border-[#1b1c1e] flex items-center justify-between">
          <div>
            {savedToast && (
              <span className="text-[11px] text-[#87cf3e] font-semibold flex items-center space-x-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                <span>Preferências salvas automaticamente!</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded bg-[#87cf3e] hover:bg-[#97df4e] text-[#132802] font-semibold text-xs transition-colors shadow-md"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
