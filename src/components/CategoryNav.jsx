import React from 'react';
import { 
  Grid, 
  Wrench, 
  Globe, 
  Film, 
  Image, 
  Gamepad2, 
  Cpu, 
  Sparkles,
  Boxes,
  Code,
  Briefcase,
  CheckCircle2
} from 'lucide-react';

const iconMap = {
  Grid,
  Boxes,
  Wrench,
  Code,
  Briefcase,
  Globe,
  Film,
  Image,
  Gamepad2,
  Cpu,
  Sparkles
};

export default function CategoryNav({ 
  categories, 
  selectedCategory, 
  onSelectCategory,
  installedOnly,
  setInstalledOnly 
}) {
  return (
    <nav className="bg-[#202326] border-b border-[#2d3036] px-2 sm:px-3 py-1.5 flex items-center w-full gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-xs select-none">
      {categories.map((cat) => {
        const IconComponent = iconMap[cat.icon] || Grid;
        const isSelected = selectedCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex-1 min-w-[64px] sm:min-w-0 flex items-center justify-center space-x-1 sm:space-x-1.5 py-1 px-1 rounded-md transition-colors whitespace-nowrap text-center ${
              isSelected
                ? 'bg-[#35393f] text-white font-medium shadow-xs border border-[#444a53]'
                : 'text-[#9ca3af] hover:text-[#e4e4e4] hover:bg-[#2a2d33]'
            }`}
            title={cat.label}
          >
            <IconComponent className={`w-3.5 h-3.5 flex-shrink-0 ${
              isSelected 
                ? cat.id === 'flatpak' ? 'text-sky-400' : 'text-[#87cf3e]' 
                : 'text-[#7d828c]'
            }`} />
            <span className="truncate">{cat.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
