import React from 'react';
import { Download, Trash2, X, CheckSquare, Layers } from 'lucide-react';

export default function BatchActionBar({
  selectedCount,
  toInstallCount,
  toUninstallCount,
  onInstallBatch,
  onUninstallBatch,
  onClearSelection,
  onSelectAllVisible,
  isAllVisibleSelected
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="absolute bottom-3 left-4 right-4 z-40 animate-in slide-in-from-bottom-3 duration-200">
      <div className="bg-[#1e2125] border border-[#3b4049] rounded-lg shadow-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Selection Info */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-[#2a2d33] px-2.5 py-1 rounded border border-[#363a42]">
            <CheckSquare className="w-4 h-4 text-[#87cf3e]" />
            <span className="font-bold text-white">
              {selectedCount} {selectedCount === 1 ? 'selecionado' : 'selecionados'}
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-[#9ca3af] text-[11.5px]">
            {toInstallCount > 0 && (
              <span className="text-[#87cf3e]">
                {toInstallCount} para instalar
              </span>
            )}
            {toInstallCount > 0 && toUninstallCount > 0 && <span>•</span>}
            {toUninstallCount > 0 && (
              <span className="text-rose-400">
                {toUninstallCount} para desinstalar
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Select all toggle */}
          <button
            onClick={onSelectAllVisible}
            className="px-2.5 py-1.5 rounded bg-[#2b2e34] hover:bg-[#383c44] text-[#dcdcdc] border border-[#383d47] transition-colors"
          >
            {isAllVisibleSelected ? 'Desmarcar Visíveis' : 'Marcar Todos'}
          </button>

          {/* Batch Install Button */}
          {toInstallCount > 0 && (
            <button
              onClick={onInstallBatch}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded bg-[#87cf3e] hover:bg-[#97df4e] text-[#132802] font-bold transition-transform active:scale-95 shadow-md"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Instalar ({toInstallCount})</span>
            </button>
          )}

          {/* Batch Uninstall Button */}
          {toUninstallCount > 0 && (
            <button
              onClick={onUninstallBatch}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded bg-rose-600/90 hover:bg-rose-600 text-white font-semibold transition-transform active:scale-95 shadow-md border border-rose-500/40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Desinstalar ({toUninstallCount})</span>
            </button>
          )}

          {/* Clear Button */}
          <button
            onClick={onClearSelection}
            title="Limpar seleção"
            className="p-1.5 rounded bg-[#2b2e34] hover:bg-[#383c44] text-[#9ca3af] hover:text-white border border-[#383d47] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
