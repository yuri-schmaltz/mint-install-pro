import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Check,
  Loader2,
  Package,
  Download,
  Trash2,
  Play,
  Terminal
} from 'lucide-react';
import { executeInstall, executeUninstall } from '../services/packageManager';
import { debugLog } from '../services/debugLog';

export default function BatchActionModal({
  actionType, // 'install' | 'uninstall' | 'mixed'
  targetApps,
  onClose,
  onComplete
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

  // Ref pra tracking de "primeira execução" (StrictMode-safe)
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Idempotência: em StrictMode dev, useEffect roda 2x. Sem esta guarda,
    // processQueue() dispararia duas vezes, gerando logs duplicados e
    // (mais grave) contadores de installedMap inflados.
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    let isCancelled = false;

    debugLog('info', 'BatchActionModal', 'mount, iniciando processQueue', {
      total: targetApps.length,
      type: actionType
    });

    const processQueue = async () => {
      try {
        setLogs(prev => [...prev, `[SISTEMA] Iniciando fila de operações em lote (${targetApps.length} pacotes)...`]);

        const successfullyInstalled = [];
        const successfullyUninstalled = [];

        for (let i = 0; i < targetApps.length; i++) {
          if (isCancelled) break;
          const currentApp = targetApps[i];
          const currentAction = currentApp.batchAction || (currentApp.installed ? 'uninstall' : 'install');
          setCurrentIndex(i);
          debugLog('debug', 'BatchActionModal', `processando ${currentApp.id}`, { i, action: currentAction });

          // Update to processing
          setAppStatuses(prev =>
            prev.map((item, idx) => idx === i ? { ...item, status: 'processing' } : item)
          );

          let res;
          try {
            if (currentAction === 'install') {
              res = await executeInstall(currentApp, (msg) => {
                if (!isCancelled) setLogs(prev => [...prev, msg]);
              });
              debugLog('debug', 'BatchActionModal', `install result ${currentApp.id}`, {
                ok: res?.success, simulated: res?.simulated
              });
            } else {
              res = await executeUninstall(currentApp, (msg) => {
                if (!isCancelled) setLogs(prev => [...prev, msg]);
              });
              debugLog('debug', 'BatchActionModal', `uninstall result ${currentApp.id}`, {
                ok: res?.success, simulated: res?.simulated
              });
            }
          } catch (opErr) {
            // Defesa: se executeInstall/Uninstall rejeitar (raro, mas pode
            // acontecer com timeout de rede ou backend caído), loga e segue
            // para o próximo. Não derruba a fila inteira.
            debugLog('error', 'BatchActionModal', `op threw para ${currentApp.id}`, {
              msg: String(opErr.message || opErr)
            });
            if (!isCancelled) {
              setLogs(prev => [...prev, `[ERRO] ${currentApp.name}: ${String(opErr.message || opErr)}`]);
            }
            res = { success: false, output: String(opErr.message || opErr) };
          }

          if (!isCancelled) {
            if (currentAction === 'install') {
              if (res && res.success) {
                successfullyInstalled.push(currentApp.id);
                setLogs(prev => [...prev, `[SUCESSO] ${currentApp.name} instalado no sistema!`]);
              } else {
                setLogs(prev => [...prev, `[AVISO] ${currentApp.name}: ${(res && res.output) || 'Concluído com aviso'}`]);
              }
            } else {
              // uninstall: só conta como sucesso se res.success for explicitamente true
              if (res && res.success) {
                successfullyUninstalled.push(currentApp.id);
                setLogs(prev => [...prev, `[SUCESSO] ${currentApp.name} removido do sistema!`]);
              } else {
                setLogs(prev => [...prev, `[AVISO] ${currentApp.name}: ${(res && res.output) || 'Concluído com aviso'}`]);
              }
            }

            // Mark as done
            setAppStatuses(prev =>
              prev.map((item, idx) => idx === i ? { ...item, status: 'done' } : item)
            );
          }
        }

        if (!isCancelled) {
          setLogs(prev => [...prev, `[SISTEMA] Todas as operações em lote foram concluídas!`]);
          setIsFinished(true);
          debugLog('info', 'BatchActionModal', 'queue completa', {
            installed: successfullyInstalled.length,
            uninstalled: successfullyUninstalled.length
          });
          onComplete({ installedIds: successfullyInstalled, uninstalledIds: successfullyUninstalled });
        }
      } catch (fatalErr) {
        // Última rede de segurança: se algo muito errado acontecer (ex: bug
        // no setState que causa loop infinito), pelo menos o modal fica em
        // estado de erro visível ao usuário em vez de tela cinza.
        debugLog('error', 'BatchActionModal', 'FATAL na fila', {
          msg: String(fatalErr.message || fatalErr),
          stack: String(fatalErr.stack || '').slice(0, 800)
        });
        // console.error removido: debugLog('error', ...) já espelha no console
        // em dev, evitando ruído duplicado. Em prod, persiste no DebugDock.
        if (!isCancelled) {
          setLogs(prev => [...prev, `[ERRO FATAL] ${String(fatalErr.message || fatalErr)}`]);
          setIsFinished(true);
        }
      }
    };

    processQueue();

    return () => {
      isCancelled = true;
    };
  }, [targetApps, actionType, onComplete]);

  const total = targetApps.length;
  const completedCount = appStatuses.filter(s => s.status === 'done').length;
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // Determina a cor da barra: instalação (verde), desinstalação (rosa), mista usa verde (ação predominante no Mint)
  const progressBarColor =
    actionType === 'uninstall'
      ? 'bg-rose-500'
      : 'bg-[#87cf3e]';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
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
                className={`h-full transition-all duration-300 rounded-full ${progressBarColor}`}
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

BatchActionModal.propTypes = {
  actionType: PropTypes.oneOf(['install', 'uninstall', 'mixed']).isRequired,
  targetApps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    icon: PropTypes.string,
    installed: PropTypes.bool,
    batchAction: PropTypes.string
  })).isRequired,
  onClose: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired
};
