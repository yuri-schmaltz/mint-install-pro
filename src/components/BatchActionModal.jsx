import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Loader2, 
  Package, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  Trash2, 
  Terminal,
  ShieldCheck
} from 'lucide-react';
import { executeInstall, executeUninstall } from '../services/packageManager';

export default function BatchActionModal({ 
  actionType, // 'install' | 'uninstall' | 'mixed'
  targetApps, 
  onClose, 
  onComplete,
  simulationMode 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [appStatuses, setAppStatuses] = useState(() => 
    targetApps.map(app => ({ 
      id: app.id, 
      name: app.name, 
      icon: app.icon, 
      status: 'pending',
      action: app.batchAction || (app.installed ? 'uninstall' : 'install')
    }))
  );
  const [logs, setLogs] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const processQueue = async () => {
      setLogs(prev => [...prev, `[SISTEMA] Iniciando fila de operações em lote (${targetApps.length} pacotes)...`]);

      const successfullyInstalled = [];
      const successfullyUninstalled = [];

      for (let i = 0; i < targetApps.length; i++) {
        if (isCancelled) break;
        const currentApp = targetApps[i];
        const currentAction = currentApp.batchAction || (currentApp.installed ? 'uninstall' : 'install');
        setCurrentIndex(i);

        // Update to processing
        setAppStatuses(prev => 
          prev.map((item, idx) => idx === i ? { ...item, status: 'processing' } : item)
        );

        if (currentAction === 'install') {
          const res = await executeInstall(currentApp, (msg) => {
            if (!isCancelled) setLogs(prev => [...prev, msg]);
          });
          if (!isCancelled) {
            if (res.success) {
              successfullyInstalled.push(currentApp.id);
              setLogs(prev => [...prev, `[SUCESSO] ${currentApp.name} instalado no sistema!`]);
            } else {
              setLogs(prev => [...prev, `[AVISO] ${currentApp.name}: ${res.output || 'Concluído com aviso'}`]);
            }
          }
        } else {
          const res = await executeUninstall(currentApp, (msg) => {
            if (!isCancelled) setLogs(prev => [...prev, msg]);
          });
          if (!isCancelled) {
            successfullyUninstalled.push(currentApp.id);
            setLogs(prev => [...prev, `[SUCESSO] ${currentApp.name} removido do sistema!`]);
          }
        }

        // Mark as done
        if (!isCancelled) {
          setAppStatuses(prev => 
            prev.map((item, idx) => idx === i ? { ...item, status: 'done' } : item)
          );
        }
      }

      if (!isCancelled) {
        setLogs(prev => [...prev, `[SISTEMA] Todas as operações em lote foram concluídas com sucesso!`]);
        setIsFinished(true);
        onComplete({ installedIds: successfullyInstalled, uninstalledIds: successfullyUninstalled });
      }
    };

    processQueue();

    return () => {
      isCancelled = true;
    };
  }, []);

  const total = targetApps.length;
  const completedCount = appStatuses.filter(s => s.status === 'done').length;
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-[#2a2d32] border border-[#3b3f46] rounded-lg max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-[#e0e0e0]">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#202326] border-b border-[#1b1c1e] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            {actionType === 'install' ? (
              <div className="p-1 rounded bg-[#87cf3e]/20 text-[#87cf3e]">
                <Download className="w-4 h-4" />
              </div>
            ) : actionType === 'uninstall' ? (
              <div className="p-1 rounded bg-rose-500/20 text-rose-400">
                <Trash2 className="w-4 h-4" />
              </div>
            ) : (
              <div className="p-1 rounded bg-[#87cf3e]/20 text-[#87cf3e]">
                <Play className="w-4 h-4 fill-current" />
              </div>
            )}
            <h3 className="text-sm font-bold text-white">
              {actionType === 'install' 
                ? 'Instalação em Lote' 
                : actionType === 'uninstall' 
                  ? 'Desinstalação em Lote' 
                  : 'Execução de Ações em Lote'} ({targetApps.length} {targetApps.length === 1 ? 'aplicativo' : 'aplicativos'})
            </h3>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-[#87cf3e] font-semibold bg-[#87cf3e]/10 px-2 py-0.5 rounded border border-[#87cf3e]/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sandbox Seguro</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[#a4a9b2]">
                {isFinished 
                  ? 'Operação finalizada!' 
                  : `Processando item ${Math.min(currentIndex + 1, total)} de ${total}...`}
              </span>
              <span className="font-semibold text-white font-mono">
                {progressPercent}% ({completedCount}/{total})
              </span>
            </div>
            <div className="w-full bg-[#1b1c1e] rounded-full h-2.5 overflow-hidden border border-[#35393f]">
              <div 
                className={`h-full transition-all duration-300 rounded-full ${
                  isInstall ? 'bg-[#87cf3e]' : 'bg-rose-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Apps List Status */}
          <div className="bg-[#202226] border border-[#32363c] rounded-md divide-y divide-[#2a2d33] max-h-48 overflow-y-auto">
            {appStatuses.map((app, index) => (
              <div key={app.id} className="p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-6 h-6 rounded bg-[#2e3136] flex items-center justify-center flex-shrink-0">
                    {app.icon ? (
                      <img src={app.icon} alt={app.name} className="w-5 h-5 object-contain" />
                    ) : (
                      <Package className="w-4 h-4 text-[#8e95a0]" />
                    )}
                  </div>
                  <span className="text-white font-medium truncate">{app.name}</span>
                </div>

                <div>
                  {app.status === 'pending' && (
                    <span className="text-[#7d828a] text-[11px]">Aguardando...</span>
                  )}
                  {app.status === 'processing' && (
                    <span className="inline-flex items-center text-[#87cf3e] text-[11px] font-medium">
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      {app.action === 'install' ? 'Instalando' : 'Removendo'}
                    </span>
                  )}
                  {app.status === 'done' && (
                    <span className="inline-flex items-center text-[#55b335] text-[11px] font-semibold">
                      <Check className="w-3.5 h-3.5 mr-0.5 stroke-[3]" />
                      {app.action === 'install' ? 'Instalado' : 'Removido'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Terminal / Live Logs */}
          <div>
            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[#8e95a0] mb-1 uppercase tracking-wider">
              <Terminal className="w-3 h-3" />
              <span>Saída do Processo (Terminal APT)</span>
            </div>
            <div className="bg-[#161719] border border-[#2b2e33] rounded p-2.5 font-mono text-[11px] text-[#a0a5ad] h-24 overflow-y-auto space-y-0.5">
              {logs.map((log, idx) => (
                <div key={idx} className="leading-tight">
                  <span className="text-[#6ea730]">&gt;</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#202326] border-t border-[#1b1c1e] flex items-center justify-between">
          <span className="text-xs text-[#7d828a]">
            {isFinished ? 'Pronto para uso.' : 'Não feche esta janela durante a execução.'}
          </span>
          <button
            onClick={onClose}
            disabled={!isFinished}
            className={`px-5 py-1.5 rounded text-xs font-semibold transition-all ${
              isFinished
                ? 'bg-[#87cf3e] hover:bg-[#97df4e] text-[#132802] shadow-md cursor-pointer'
                : 'bg-[#35393f] text-[#7d828a] cursor-not-allowed opacity-50'
            }`}
          >
            Concluir
          </button>
        </div>

      </div>
    </div>
  );
}
