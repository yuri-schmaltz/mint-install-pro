import React, { useState } from 'react';
import { Check, Star } from 'lucide-react';

export default function AppCard({ 
  app, 
  onClick, 
  isSelected = false, 
  onToggleSelect 
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      onClick={() => onClick(app)}
      className={`gtk-card group relative flex items-center p-2.5 sm:p-3 rounded-md cursor-pointer select-none transition-all duration-150 h-[74px] ${
        isSelected 
          ? 'ring-1 ring-[#87cf3e] border-[#87cf3e] bg-[#344037]' 
          : app.installed
            ? 'bg-gradient-to-r from-[#233126] via-[#263529] to-[#243126] border-[#384e36] hover:border-[#87cf3e]/70 hover:bg-[#28392c]'
            : 'border-[#2e3238] bg-[#2a2d33] hover:bg-[#32363e]'
      }`}
      title={`${app.name}: ${app.fullSummary || app.summary}${app.installed ? ' (Instalado)' : ''}`}
    >
      {/* Checkbox: Resolve o check verde de app instalado e seleção em lote */}
      {onToggleSelect && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(app.id);
          }}
          className="mr-2.5 flex items-center justify-center p-0.5 cursor-pointer z-10"
          title={
            isSelected 
              ? (app.installed ? "Marcado para desinstalação em lote" : "Marcado para instalação em lote")
              : (app.installed ? "Instalado no sistema (clique para marcar ação em lote)" : "Não instalado (clique para marcar para instalação)")
          }
        >
          <div className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-[#87cf3e] border-[#87cf3e] text-[#132802]'
              : app.installed
                ? 'border-[#87cf3e] bg-[#87cf3e]/25 text-[#87cf3e] hover:bg-[#87cf3e]/35'
                : 'border-[#555a64] bg-[#22252a] hover:border-[#87cf3e]'
          }`}>
            {(isSelected || app.installed) && (
              <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? 'text-[#132802]' : 'text-[#87cf3e]'}`} />
            )}
          </div>
        </div>
      )}

      {/* App Icon */}
      <div className="w-11 h-11 flex-shrink-0 flex items-center justify-center mr-2.5 rounded bg-black/15 overflow-hidden">
        {!imgError && app.icon ? (
          <img
            src={app.icon}
            alt={app.name}
            onError={() => setImgError(true)}
            className="w-10 h-10 object-contain drop-shadow-sm transition-transform duration-150 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center text-lg bg-[#2a2d32] text-[#87cf3e] font-bold rounded">
            {app.fallbackIcon || app.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* App Info (Name and Summary) */}
      <div className="flex-1 min-w-0 pr-8">
        <h3 className="text-[13px] font-semibold text-[#f0f0f0] truncate leading-tight group-hover:text-white flex items-center space-x-1.5">
          <span>{app.name}</span>
          {app.installed && (
            <span className="text-[10px] font-medium text-[#87cf3e]/80">
              •
            </span>
          )}
        </h3>
        <p className="text-[11.5px] text-[#9ca3af] truncate mt-1 leading-tight font-normal">
          {app.summary}
        </p>
      </div>

      {/* Bottom-Right: Rating and Star */}
      <div className="absolute bottom-2 right-3 flex items-center space-x-1 text-[#b3b8c2]">
        <span className="text-[11px] font-medium tracking-tight">
          {app.rating ? app.rating.toFixed(1) : '4.5'}
        </span>
        <Star className="w-3 h-3 fill-[#c4c8d0] text-[#c4c8d0]" />
      </div>
    </div>
  );
}
