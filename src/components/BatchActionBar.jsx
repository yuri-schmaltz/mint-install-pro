import React from 'react';
import PropTypes from 'prop-types';
import { Play, X, CheckSquare } from 'lucide-react';

export default function BatchActionBar({
  selectedCount,
  toInstallCount,
  toUninstallCount,
  onExecuteBatch = null,
  onInstallBatch = null,
  onUninstallBatch = null,
  onClearSelection,
  onSelectAllVisible,
  isAllVisibleSelected
}) {
  if (selectedCount === 0) return null;

  const handleAction = onExecuteBatch || onInstallBatch || onUninstallBatch;

  return (
    <div className="flex-shrink-0 w-full bg-[#1b1e22] border-t border-[#363a43] px-5 py-2.5 z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.35)] animate-in slide-in-from-bottom-2 duration-150">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs w-full">
        
        {/* Selection Info */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-[#282b31] px-2.5 py-1.5 rounded border border-[#383d46]">
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

          {/* Single Unified Action Button */}
          <button
            onClick={handleAction}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded bg-[#87cf3e] hover:bg-[#97df4e] text-[#132802] font-bold transition-transform active:scale-95 shadow-md"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Executar Ações</span>
          </button>

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

BatchActionBar.propTypes = {
  selectedCount: PropTypes.number.isRequired,
  toInstallCount: PropTypes.number.isRequired,
  toUninstallCount: PropTypes.number.isRequired,
  onExecuteBatch: PropTypes.func,
  onInstallBatch: PropTypes.func,
  onUninstallBatch: PropTypes.func,
  onClearSelection: PropTypes.func.isRequired,
  onSelectAllVisible: PropTypes.func.isRequired,
  isAllVisibleSelected: PropTypes.bool.isRequired
};

