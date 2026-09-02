import React, { useState } from 'react';
import { Check, Star } from 'lucide-react';

export default function AppCard({ app, onClick }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      onClick={() => onClick(app)}
      className="gtk-card group relative flex items-center p-3 rounded-md cursor-pointer select-none transition-all duration-150 h-[72px]"
      title={`${app.name}: ${app.fullSummary || app.summary}`}
    >
      {/* App Icon */}
      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center mr-3 rounded bg-black/10 overflow-hidden">
        {!imgError && app.icon ? (
          <img
            src={app.icon}
            alt={app.name}
            onError={() => setImgError(true)}
            className="w-11 h-11 object-contain drop-shadow-sm transition-transform duration-150 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-11 h-11 flex items-center justify-center text-xl bg-[#2a2d32] text-[#87cf3e] font-bold rounded">
            {app.fallbackIcon || app.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* App Info (Name and Summary) */}
      <div className="flex-1 min-w-0 pr-12">
        <h3 className="text-[13px] font-semibold text-[#f0f0f0] truncate leading-tight group-hover:text-white">
          {app.name}
        </h3>
        <p className="text-[11.5px] text-[#9ca3af] truncate mt-1 leading-tight font-normal">
          {app.summary}
        </p>
      </div>

      {/* Top-Right: Green Checkmark (Installed Badge) */}
      {app.installed && (
        <div 
          className="absolute top-2.5 right-3 flex items-center justify-center text-[#55b335]"
          title="Instalado no sistema"
        >
          <Check className="w-4 h-4 stroke-[3]" />
        </div>
      )}

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
