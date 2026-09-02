import React from 'react';
import AppCard from './AppCard';
import { PackageOpen, AlertCircle } from 'lucide-react';

export default function AppGrid({ 
  apps, 
  categoryTitle, 
  searchQuery, 
  installedOnly, 
  onSelectApp 
}) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 bg-[#26292d]">
      {/* Category Header */}
      <div className="flex items-center justify-between mb-3.5 pb-1 border-b border-[#32363c]">
        <div className="flex items-baseline space-x-2">
          <h2 className="text-[17px] font-semibold text-[#ffffff] tracking-normal">
            {searchQuery ? `Resultados para "${searchQuery}"` : categoryTitle}
          </h2>
          <span className="text-xs text-[#8e95a0] font-normal">
            ({apps.length} {apps.length === 1 ? 'aplicativo' : 'aplicativos'})
          </span>
        </div>

        {installedOnly && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#55b335]/20 text-[#68cf42] border border-[#55b335]/40">
            Filtro: Somente Instalados
          </span>
        )}
      </div>

      {/* Grid of 3 Columns matching Linux Mint Software Manager */}
      {apps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {apps.map((app) => (
            <AppCard 
              key={app.id} 
              app={app} 
              onClick={onSelectApp} 
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
