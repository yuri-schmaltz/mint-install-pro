// DebugDock.jsx — dock flutuante canto inferior esquerdo com snapshot
// dos logs persistidos. Renderizado FORA do <App /> no main.jsx, então
// sobrevive a crash do React (que mata a árvore do App mas não o root).
//
// Mostra:
//  - Botão DEBUG fixo, sempre visível (não some se App travar)
//  - Ao clicar, painel com contagem de logs + botão "Copiar JSON"
//  - JSON do snapshot vai pra clipboard, pronto pra colar no issue/bug report

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Bug, Copy, Check, Trash2, X } from 'lucide-react';
import { getDebugSnapshot, clearDebug } from '../services/debugLog';

export default function DebugDock() {
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [copied, setCopied] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const refreshTimerRef = useRef(null);

  // Auto-refresh a cada 2s enquanto painel aberto, pra capturar logs ao vivo
  useEffect(() => {
    if (!open) return undefined;
    setSnapshot(getDebugSnapshot());
    refreshTimerRef.current = setInterval(() => {
      setSnapshot(getDebugSnapshot());
      setRefreshTick((n) => n + 1);
    }, 2000);
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [open]);

  const handleOpen = useCallback(() => {
    setSnapshot(getDebugSnapshot());
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => setOpen(false), []);

  const handleCopy = useCallback(async () => {
    try {
      const text = JSON.stringify(snapshot ?? getDebugSnapshot(), null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback para WebView antigo sem clipboard API
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('[DebugDock] falha ao copiar:', err);
    }
  }, [snapshot]);

  const handleClear = useCallback(() => {
    clearDebug();
    setSnapshot(getDebugSnapshot());
  }, []);

  const totalLogs = snapshot?.entries?.length ?? 0;
  const emergencyCount = snapshot?.emergencyLog?.length ?? 0;
  const hasReactError = !!snapshot?.lastReactError;

  return (
    <>
      {/* Botão fixo — sempre visível, inclusive quando React crashed */}
      <button
        onClick={handleOpen}
        title="Abrir painel de diagnóstico"
        style={{ position: 'fixed', bottom: 12, left: 12, zIndex: 9999 }}
        className="bg-[#2a2d32] hover:bg-[#35393f] border border-[#3b3f46] text-[#e0e0e0] text-[11px] font-semibold px-3 py-1.5 rounded shadow-lg flex items-center space-x-1.5 transition-colors"
      >
        <Bug className="w-3.5 h-3.5 text-amber-400" />
        <span>DEBUG ({totalLogs})</span>
      </button>

      {/* Painel */}
      {open && (
        <div
          style={{ position: 'fixed', bottom: 50, left: 12, zIndex: 9999 }}
          className="bg-[#1b1c1e] border border-[#3b3f46] rounded-lg shadow-2xl w-[420px] max-h-[70vh] flex flex-col text-[#e0e0e0]"
          role="dialog"
          aria-label="Painel de diagnóstico"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#2b2e33] bg-[#202226] rounded-t-lg">
            <div className="flex items-center space-x-2">
              <Bug className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold">Diagnóstico</span>
              <span className="text-[10px] text-[#7d828a]">auto 2s</span>
            </div>
            <button
              onClick={handleClose}
              title="Fechar"
              className="p-1 rounded hover:bg-[#35393f] text-[#a4a9b2]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-3 space-y-2 overflow-y-auto text-[11px] font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-[#87cf3e]">entries: {totalLogs}</span>
                <span className="text-rose-400">emergency: {emergencyCount}</span>
                <span className={hasReactError ? 'text-rose-400' : 'text-[#7d828a]'}>
                  reactError: {hasReactError ? 'sim' : 'não'}
                </span>
              </div>
              <span className="text-[#7d828a] text-[10px]">refresh #{refreshTick}</span>
            </div>

            {snapshot?.lastReactError && (
              <div className="bg-rose-950/30 border border-rose-500/40 rounded p-2 text-[10px]">
                <div className="font-bold text-rose-300 mb-1">Último erro React:</div>
                <div className="text-rose-200 break-words">{snapshot.lastReactError.message}</div>
                {snapshot.lastReactError.stack && (
                  <pre className="mt-1 text-[9px] text-rose-300/80 whitespace-pre-wrap break-words max-h-24 overflow-y-auto">
                    {snapshot.lastReactError.stack.slice(0, 600)}
                  </pre>
                )}
              </div>
            )}

            {snapshot?.emergencyLog?.length > 0 && (
              <div className="bg-amber-950/30 border border-amber-500/40 rounded p-2 text-[10px]">
                <div className="font-bold text-amber-300 mb-1">Erros não capturados pelo React:</div>
                {snapshot.emergencyLog.slice(-3).map((e, i) => (
                  <div key={i} className="text-amber-200/90 mb-1">
                    <span className="text-amber-400/70">[{e.kind}]</span> {String(e.info?.message || e.info?.filename || e.info || '').slice(0, 200)}
                  </div>
                ))}
              </div>
            )}

            <div>
              <div className="text-[#87cf3e] font-bold mb-1">Últimos 10 logs:</div>
              {(snapshot?.entries ?? []).slice(-10).reverse().map((e, i) => (
                <div key={i} className="flex space-x-1.5 leading-tight py-0.5 border-b border-[#2b2e33]/50">
                  <span className={`flex-shrink-0 ${
                    e.lvl === 'error' ? 'text-rose-400'
                    : e.lvl === 'warn' ? 'text-amber-400'
                    : 'text-[#7d828a]'
                  }`}>[{e.lvl[0].toUpperCase()}]</span>
                  <span className="text-[#a4a9b2] flex-shrink-0">{e.t.slice(11, 19)}</span>
                  <span className="text-[#87cf3e] flex-shrink-0">{e.cmp}</span>
                  <span className="text-[#e0e0e0] break-words">{e.msg}</span>
                </div>
              ))}
              {totalLogs === 0 && (
                <div className="text-[#7d828a] italic">Nenhum log capturado ainda.</div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-[#2b2e33] bg-[#202226] rounded-b-lg">
            <button
              onClick={handleClear}
              title="Limpar todos os logs"
              className="flex items-center space-x-1 px-2 py-1 rounded text-[10px] bg-[#35393f] hover:bg-[#434850] text-[#a4a9b2]"
            >
              <Trash2 className="w-3 h-3" />
              <span>Limpar</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-3 py-1 rounded text-[11px] font-semibold bg-[#87cf3e] hover:bg-[#97df4e] text-[#132802]"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}