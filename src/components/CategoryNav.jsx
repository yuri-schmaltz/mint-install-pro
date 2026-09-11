import React from 'react';
import PropTypes from 'prop-types';
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
  Sparkles,
  CheckCircle2
};

// IDs especiais que NÃO são categorias de catálogo e usam renderização própria
const SPECIAL_TAB_IDS = new Set(['installed']);

/**
 * Barra de abas de navegação.
 *
 * - `categories` lista todas as abas (incluindo "installed").
 * - Abas com `id === 'installed'` recebem renderização dedicada:
 *   mostram um badge com a contagem de instalados (movido do HeaderBar)
 *   e ativam o filtro `installedOnly` ao serem clicadas.
 * - Demais abas são categorias comuns (picks, all, development, etc.).
 *
 * Props:
 *  - categories, selectedCategory, onSelectCategory
 *  - installedOnly, onToggleInstalledOnly, installedCount
 */
export default function CategoryNav({
  categories,
  selectedCategory,
  onSelectCategory,
  installedOnly,
  onToggleInstalledOnly,
  installedCount = 0
}) {
  return (
    <nav className="bg-[#202326] border-b border-[#2d3036] px-1.5 sm:px-2.5 py-1.5 flex items-center w-full gap-0.5 sm:gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-[11px] sm:text-xs select-none">
      {categories.map((cat) => {
        // === Aba especial: "Instalados" ===
        if (SPECIAL_TAB_IDS.has(cat.id)) {
          return (
            <InstalledTab
              key={cat.id}
              installedCount={installedCount}
              isActive={installedOnly}
              onClick={onToggleInstalledOnly}
              title={cat.label}
            />
          );
        }

        const IconComponent = iconMap[cat.icon] || Grid;
        // Quando o filtro "Instalados" está ativo, a aba Instalados é a
        // selecionada — as demais abas perdem o destaque para evitar
        // destaque duplo (Instalados + Todos).
        const isSelected = !installedOnly && selectedCategory === cat.id;

        const flexClass = 'flex-1 min-w-0';

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`${flexClass} flex items-center justify-center space-x-1 py-1 px-1 sm:px-1.5 rounded-md transition-colors whitespace-nowrap text-center ${
              isSelected
                ? 'bg-[#35393f] text-white font-medium shadow-xs border border-[#444a53]'
                : 'text-[#9ca3af] hover:text-[#e4e4e4] hover:bg-[#2a2d33]'
            }`}
            title={cat.label}
          >
            <IconComponent
              className={`w-3.5 h-3.5 flex-shrink-0 ${
                isSelected
                  ? cat.id === 'flatpak'
                    ? 'text-sky-400'
                    : 'text-[#87cf3e]'
                  : 'text-[#7d828c]'
              }`}
            />
            <span className="truncate">{cat.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/**
 * Aba dedicada "Instalados".
 * Mostra o ícone, rótulo e badge com contagem (movido do HeaderBar).
 * Ativa/desativa o filtro `installedOnly` ao clicar.
 */
function InstalledTab({ installedCount = 0, isActive, onClick, title }) {
  const countLabel = installedCount === 1 ? 'app' : 'apps';

  return (
    <button
      onClick={onClick}
      title={
        isActive
          ? 'Mostrar todos os aplicativos'
          : `Filtrar apenas instalados (${installedCount} ${countLabel})`
      }
      className={`flex-1 min-w-0 flex items-center justify-center space-x-1 py-1 px-1 sm:px-1.5 rounded-md transition-colors whitespace-nowrap text-center border ${
        isActive
          ? 'bg-[#35393f] text-white font-medium shadow-xs border-[#444a53]'
          : 'text-[#9ca3af] hover:text-[#e4e4e4] hover:bg-[#2a2d33] border-transparent'
      }`}
    >
      <CheckCircle2
        className={`w-3.5 h-3.5 flex-shrink-0 ${
          isActive ? 'text-[#87cf3e]' : 'text-[#7d828c]'
        }`}
      />
      <span className="truncate">{title}</span>
    </button>
  );
}

InstalledTab.propTypes = {
  installedCount: PropTypes.number,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired
};

CategoryNav.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired
    })
  ).isRequired,
  selectedCategory: PropTypes.string.isRequired,
  onSelectCategory: PropTypes.func.isRequired,
  installedOnly: PropTypes.bool.isRequired,
  onToggleInstalledOnly: PropTypes.func.isRequired,
  installedCount: PropTypes.number
};

