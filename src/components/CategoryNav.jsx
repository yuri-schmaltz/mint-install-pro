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
    <nav className="bg-[#202326] border-b border-[#2d3036] px-4 py-1.5 flex items-center space-x-1.5 overflow-x-auto text-xs select-none">
      {categories.map((cat) => {
        const IconComponent = iconMap[cat.icon] || Grid;
        const isSelected = selectedCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
              isSelected
                ? 'bg-[#35393f] text-white font-medium shadow-xs border border-[#444a53]'
                : 'text-[#9ca3af] hover:text-[#e4e4e4] hover:bg-[#2a2d33]'
            }`}
          >
            <IconComponent className={`w-3.5 h-3.5 ${
              isSelected 
                ? cat.id === 'flatpak' ? 'text-sky-400' : 'text-[#87cf3e]' 
                : 'text-[#7d828c]'
            }`} />
            <span>{cat.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
