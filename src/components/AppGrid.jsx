import React from 'react';
import AppCard from './AppCard';
import { PackageOpen, CheckSquare, Square } from 'lucide-react';

export default function AppGrid({ 
  apps, 
  categoryTitle, 
  searchQuery, 
  installedOnly, 
  onSelectApp,
  selectedAppIds = [],
  onToggleSelectApp,
  onSelectAllVisible,
  isAllVisibleSelected
}) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 bg-[#26292d] relative">
      {/* Category Header with Select All Action */}
      <div className="flex items-center justify-between mb-3.5 pb-1 border-b border-[#32363c]">
        <div className="flex items-baseline space-x-2">
          <h2 className="text-[17px] font-semibold text-[#ffffff] tracking-normal">
            {searchQuery ? `Resultados para "${searchQuery}"` : categoryTitle}
          </h2>
          <span className="text-xs text-[#8e95a0] font-normal">
            ({apps.length} {apps.length === 1 ? 'aplicativo' : 'aplicativos'})
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Select all toggle button */}
          {apps.length > 0 && onSelectAllVisible && (
            <button
              onClick={onSelectAllVisible}
              className="flex items-center space-x-1.5 text-xs text-[#a0a5ad] hover:text-[#87cf3e] transition-colors py-0.5 px-2 rounded hover:bg-[#35393f]"
              title={isAllVisibleSelected ? "Desmarcar todos da lista" : "Marcar todos da lista para instalação/desinstalação em lote"}
            >
              {isAllVisibleSelected ? (
                <CheckSquare className="w-3.5 h-3.5 text-[#87cf3e]" />
              ) : (
                <Square className="w-3.5 h-3.5 text-[#7d828c]" />
              )}
              <span>{isAllVisibleSelected ? "Desmarcar Todos" : "Marcar Todos"}</span>
            </button>
          )}

          {installedOnly && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#55b335]/20 text-[#68cf42] border border-[#55b335]/40">
              Filtro: Somente Instalados
            </span>
          )}
        </div>
      </div>

      {/* Grid of 3 Columns matching Linux Mint Software Manager */}
      {apps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pb-16">
          {apps.map((app) => (
            <AppCard 
              key={app.id} 
              app={app} 
              onClick={onSelectApp}
              isSelected={selectedAppIds.includes(app.id)}
              onToggleSelect={onToggleSelectApp}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-[#8e95a0]">
          <PackageOpen className="w-16 h-16 text-[#4a4f58] mb-3 stroke-[1.2]" />
          <p className="text-sm font-medium text-[#dcdcdc]">Nenhum aplicativo encontrado</p>
          <p className="text-xs text-[#7c828c] mt-1 max-w-sm text-center">
            {searchQuery 
              ? `Nenhum resultado correspondeu à sua pesquisa "${searchQuery}". Tente outros termos.`
              : 'Nenhum aplicativo disponível com os filtros atuais selecionados.'}
          </p>
        </div>
      )}
    </div>
  );
}
