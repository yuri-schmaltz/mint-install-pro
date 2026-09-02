import React, { useState } from 'react';
import { Check, Star } from 'lucide-react';

export default function AppCard({ 
  app, 
  onClick, 
  isSelected = false, 
  onToggleSelect 
}) {
  const [imgError, setImgError] = useState(false);

  const isInstalled = !!app.installed;
  const isStagedForUninstall = isInstalled && isSelected;
  const isStagedForInstall = !isInstalled && isSelected;

  // Determine card background and border styling
  let cardClass = 'border-[#2e3238] bg-[#2a2d33] hover:bg-[#32363e]';

  if (isStagedForUninstall) {
    // Marcado para desinstalação (desmarcado o checkbox): fundo vermelho/laranja na mesma paleta e luminância do verde dos instalados
    cardClass = 'bg-gradient-to-r from-[#332220] via-[#3a2522] to-[#332220] border-[#663830] ring-1 ring-amber-600/40 hover:bg-[#3d2724] hover:border-amber-500/60';
  } else if (isStagedForInstall) {
    // Marcado para instalação
    cardClass = 'bg-[#2b3a2e] border-[#87cf3e] ring-1 ring-[#87cf3e]';
  } else if (isInstalled) {
    // Instalado no sistema: fundo sutil verde Mint
    cardClass = 'bg-gradient-to-r from-[#233126] via-[#263529] to-[#243126] border-[#384e36] hover:border-[#87cf3e]/70 hover:bg-[#28392c]';
  }

  // O checkbox aparece marcado se:
  // - Está instalado e NÃO foi desmarcado para remoção
  // - OU não está instalado e foi marcado para instalação
  const isCheckboxChecked = (isInstalled && !isSelected) || isStagedForInstall;

  return (
    <div
      onClick={() => onClick(app)}
      className={`gtk-card group relative flex items-center p-2.5 sm:p-3 rounded-md cursor-pointer select-none transition-all duration-150 h-[74px] ${cardClass}`}
      title={
        isStagedForUninstall
          ? `${app.name}: Desmarcado para desinstalação em lote`
          : `${app.name}: ${app.fullSummary || app.summary}${isInstalled ? ' (Instalado)' : ''}`
      }
    >
      {/* Checkbox: Resolve o check verde de app instalado e a desmarcação para desinstalação */}
      {onToggleSelect && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(app.id);
          }}
          className="mr-2.5 flex items-center justify-center p-0.5 cursor-pointer z-10"
          title={
            isStagedForUninstall
              ? "Desmarcado para desinstalação (clique para cancelar remoção)"
              : isStagedForInstall
                ? "Marcado para instalação (clique para cancelar)"
                : isInstalled
                  ? "Instalado no sistema (clique para desmarcar e desinstalar)"
                  : "Não instalado (clique para marcar e instalar)"
          }
        >
          <div className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-all ${
            isStagedForUninstall
              ? 'border-amber-500/70 bg-amber-950/40 text-amber-400 hover:border-amber-400'
              : isStagedForInstall
                ? 'bg-[#87cf3e] border-[#87cf3e] text-[#132802]'
                : isInstalled
                  ? 'border-[#87cf3e] bg-[#87cf3e]/25 text-[#87cf3e] hover:bg-[#87cf3e]/35'
                  : 'border-[#555a64] bg-[#22252a] hover:border-[#87cf3e]'
          }`}>
            {isCheckboxChecked && (
              <Check className={`w-3.5 h-3.5 stroke-[3] ${isStagedForInstall ? 'text-[#132802]' : 'text-[#87cf3e]'}`} />
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
        <div className="flex items-center space-x-1.5 min-w-0">
          <h3 className="text-[13px] font-semibold text-[#f0f0f0] truncate min-w-0 leading-tight group-hover:text-white">
            {app.name}
          </h3>
          {isStagedForUninstall ? (
            <span className="flex-shrink-0 text-[9.5px] font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-600/50 shadow-xs whitespace-nowrap">
              Desinstalar
            </span>
          ) : isInstalled ? (
            <span className="flex-shrink-0 text-[10px] font-medium text-[#87cf3e]/80">
              •
            </span>
          ) : null}
        </div>
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
