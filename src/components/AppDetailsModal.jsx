import React, { useState } from 'react';
import { 
  X, 
  Star, 
  Check, 
  Download, 
  Trash2, 
  Play, 
  ShieldCheck, 
  Layers, 
  HardDrive, 
  FileCode, 
  ExternalLink,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { executeInstall, executeUninstall } from '../services/packageManager';

export default function AppDetailsModal({ app, onClose, onToggleInstall }) {
  const [installing, setInstalling] = useState(false);
  const [installStep, setInstallStep] = useState('');
  const [progress, setProgress] = useState(0);

  if (!app) return null;

  const handleAction = async () => {
    setInstalling(true);
    const isInstalling = !app.installed;
    
    if (isInstalling) {
      setInstallStep('Iniciando transação e conectando aos repositórios...');
      setProgress(25);
      const res = await executeInstall(app, (msg) => {
        setInstallStep(msg.replace(/^\[.*?\]\s*/, ''));
      });
      setProgress(100);
      setInstalling(false);
      onToggleInstall(app.id);
    } else {
      setInstallStep('Removendo arquivos do pacote do sistema...');
      setProgress(40);
      const res = await executeUninstall(app, (msg) => {
        setInstallStep(msg.replace(/^\[.*?\]\s*/, ''));
      });
      setProgress(100);
      setInstalling(false);
      onToggleInstall(app.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-[#2a2d32] border border-[#383c43] rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#e0e0e0]">
        
        {/* Modal Top Header with Close */}
        <div className="px-5 py-3.5 bg-[#202326] border-b border-[#1b1c1e] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#87cf3e] font-semibold tracking-wide uppercase">
              {app.categoryLabel || 'Aplicativo'}
            </span>
            <span className="text-xs text-[#5f6570]">•</span>
            <span className="text-xs text-[#9aa0a6]">{app.packageType}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#35393f] text-[#9ca3af] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          
          {/* Main Hero Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#35393f]">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-lg bg-[#1e2023] p-1.5 flex items-center justify-center border border-[#35393f] flex-shrink-0">
                {app.icon ? (
                  <img src={app.icon} alt={app.name} className="w-13 h-13 object-contain drop-shadow" />
                ) : (
                  <span className="text-3xl">{app.fallbackIcon || '📦'}</span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <span>{app.name}</span>
                  {app.installed && (
                    <span className="inline-flex items-center text-[11px] font-semibold text-[#55b335] bg-[#55b335]/15 px-2 py-0.5 rounded-full border border-[#55b335]/30">
                      <Check className="w-3 h-3 mr-1" /> Instalado
                    </span>
                  )}
                </h2>
                <p className="text-xs text-[#a4a9b2] mt-0.5">
                  {app.fullSummary || app.summary}
                </p>
                <div className="flex items-center space-x-3 mt-2 text-xs text-[#9aa0a6]">
                  <div className="flex items-center text-[#ffcc00] space-x-1">
                    <span className="font-semibold text-white">{app.rating.toFixed(1)}</span>
                    <Star className="w-3.5 h-3.5 fill-[#ffcc00] text-[#ffcc00]" />
                  </div>
                  <span>•</span>
                  <span>Versão {app.version}</span>
                  <span>•</span>
                  <span>{app.size}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              {installing ? (
                <div className="flex items-center space-x-2 px-4 py-2 rounded bg-[#35393f] text-xs text-[#dcdcdc] border border-[#484d56]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#87cf3e]" />
                  <span>{installStep}</span>
                </div>
              ) : app.installed ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleAction}
                    className="flex items-center space-x-1.5 px-4 py-1.5 rounded text-xs font-semibold bg-[#3c4149] hover:bg-rose-900/60 hover:text-rose-200 text-[#d0d4dc] border border-[#4c525d] transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover</span>
                  </button>
                  <button
                    onClick={() => alert(`Iniciando ${app.name}...`)}
                    className="flex items-center space-x-1.5 px-4 py-1.5 rounded text-xs font-semibold bg-[#87cf3e] hover:bg-[#97df4e] text-[#132802] transition-colors shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Executar</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAction}
                  className="flex items-center space-x-1.5 px-5 py-2 rounded text-xs font-bold bg-[#87cf3e] hover:bg-[#97df4e] text-[#132802] transition-all shadow-md active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Instalar</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar (during install/uninstall) */}
          {installing && (
            <div className="w-full bg-[#1e2023] rounded-full h-2 overflow-hidden border border-[#35393f]">
              <div 
                className="bg-[#87cf3e] h-2 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#9aa0a6] mb-2">
              Descrição
            </h4>
            <p className="text-xs leading-relaxed text-[#c8cbd0] bg-[#24262a] p-3.5 rounded border border-[#303338]">
              {app.description}
            </p>
          </div>

          {/* Package Details Matrix */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#9aa0a6] mb-2">
              Detalhes do Pacote
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-[#24262a] p-2.5 rounded border border-[#303338]">
                <div className="text-[11px] text-[#7d828c]">Nome do Pacote</div>
                <div className="font-mono text-white text-xs mt-0.5">{app.id}</div>
              </div>
              <div className="bg-[#24262a] p-2.5 rounded border border-[#303338]">
                <div className="text-[11px] text-[#7d828c]">Desenvolvedor</div>
                <div className="text-white text-xs mt-0.5 truncate">{app.developer || 'Comunidade'}</div>
              </div>
              <div className="bg-[#24262a] p-2.5 rounded border border-[#303338]">
                <div className="text-[11px] text-[#7d828c]">Licença</div>
                <div className="text-white text-xs mt-0.5">{app.license || 'Open Source'}</div>
              </div>
              <div className="bg-[#24262a] p-2.5 rounded border border-[#303338]">
                <div className="text-[11px] text-[#7d828c]">Tamanho de Download</div>
                <div className="text-white text-xs mt-0.5">{app.size}</div>
              </div>
              <div className="bg-[#24262a] p-2.5 rounded border border-[#303338]">
                <div className="text-[11px] text-[#7d828c]">Arquitetura</div>
                <div className="text-white text-xs mt-0.5">amd64 / x86_64</div>
              </div>
              <div className="bg-[#24262a] p-2.5 rounded border border-[#303338]">
                <div className="text-[11px] text-[#7d828c]">Canal de Distribuição</div>
                <div className="text-white text-xs mt-0.5">Repositórios Linux Mint (APT)</div>
              </div>
            </div>
          </div>

          {/* User Reviews Mock */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#9aa0a6] mb-2">
              Avaliações da Comunidade
            </h4>
            <div className="space-y-2">
              <div className="bg-[#24262a] p-3 rounded border border-[#303338] text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Excelente utilitário</span>
                  <div className="flex items-center text-[#ffcc00]">
                    {'★'.repeat(5)}
                  </div>
                </div>
                <p className="text-[#a4a9b2] mt-1 text-[11.5px]">
                  Funciona de forma perfeita no Linux Mint, integrado ao sistema e com baixíssimo consumo de memória.
                </p>
                <span className="text-[10px] text-[#6d727b] mt-1 block">Usuário verificado do Linux Mint</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#202326] border-t border-[#1b1c1e] flex items-center justify-between text-xs text-[#7d828c]">
          <div className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#87cf3e]" />
            <span>Pacote verificado e assinado pela equipe do Linux Mint</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1 rounded bg-[#35393f] hover:bg-[#434850] text-[#dcdcdc] font-medium transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
