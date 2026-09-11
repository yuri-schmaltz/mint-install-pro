import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Wrench, 
  Globe, 
  Film, 
  Image, 
  Gamepad2, 
  Cpu, 
  Boxes,
  Code,
  Briefcase
} from 'lucide-react';
import AppCard from './AppCard';

const banners = [
  {
    id: "vlc",
    name: "VLC Media Player",
    subtitle: "O reprodutor multimídia livre e definitivo",
    svg: "/featured/vlc.svg",
    bg: "linear-gradient(135deg, #e67e00, #f59e0b)",
    textColor: "#ffffff",
    rating: 4.9,
    category: "sound-video"
  },
  {
    id: "blender",
    name: "Blender",
    subtitle: "Criação 3D profissional, renderização e efeitos visuais",
    svg: "/featured/blender.svg",
    bg: "linear-gradient(45deg, #ea580c, #f97316)",
    textColor: "#ffffff",
    rating: 4.9,
    category: "graphics"
  },
  {
    id: "gimp",
    name: "GIMP",
    subtitle: "Poderoso editor de imagens e fotos digitais",
    svg: "/featured/gimp.svg",
    bg: "linear-gradient(135deg, #ca8a04, #eab308)",
    textColor: "#ffffff",
    rating: 4.8,
    category: "graphics"
  },
  {
    id: "inkscape",
    name: "Inkscape",
    subtitle: "Ilustração e editor gráfico vetorial avançado",
    svg: "/featured/inkscape.svg",
    bg: "linear-gradient(135deg, #334155, #475569)",
    textColor: "#ffffff",
    rating: 4.9,
    category: "graphics"
  },
  {
    id: "steam-installer",
    name: "Steam",
    subtitle: "Milhares de jogos nativos para Linux",
    svg: "/featured/steam-installer.svg",
    bg: "linear-gradient(to right, #0f172a, #1e293b, #0f172a)",
    textColor: "#ffffff",
    rating: 4.9,
    category: "games"
  }
];

const categoryCards = [
  { id: "accessories", label: "Acessórios", desc: "Utilitários essenciais e ferramentas do dia a dia", icon: Wrench, color: "from-emerald-800/40 to-emerald-950/60" },
  { id: "development", label: "Código", desc: "IDEs, editores de código e ferramentas de programação", icon: Code, color: "from-indigo-800/40 to-indigo-950/60" },
  { id: "office", label: "Escritório", desc: "Suíte de documentos, planilhas, PDFs e anotações", icon: Briefcase, color: "from-amber-800/40 to-amber-950/60" },
  { id: "flatpak", label: "Flatpak", desc: "Milhares de softwares modernos e populares do Flathub", icon: Boxes, color: "from-sky-900/50 to-blue-950/70" },
  { id: "graphics", label: "Gráficos", desc: "Modelagem 3D, pintura digital e fotografia", icon: Image, color: "from-orange-800/40 to-orange-950/60" },
  { id: "internet", label: "Internet", desc: "Navegadores, clientes de e-mail e mensageiros", icon: Globe, color: "from-blue-800/40 to-blue-950/60" },
  { id: "games", label: "Jogos", desc: "Ação, estratégia, simuladores e arcades", icon: Gamepad2, color: "from-rose-800/40 to-rose-950/60" },
  { id: "sound-video", label: "Mídias", desc: "Reprodutores, editores e gravadores de mídia", icon: Film, color: "from-purple-800/40 to-purple-950/60" },
  { id: "system", label: "Sistema", desc: "Monitoramento de disco, snapshots e particionador", icon: Cpu, color: "from-teal-800/40 to-teal-950/60" }
];

export default function LandingPage({ onSelectCategory, onSelectApp, apps, isLoading = false }) {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [currentFeaturedPage, setCurrentFeaturedPage] = useState(0);

  // Automatic banner slide every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const banner = banners[currentBanner];

  // Top rated apps (up to 18 apps ordered by rating)
  const topRatedApps = [...apps]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 18);

  const PAGE_SIZE = 6;
  const totalPages = Math.max(1, Math.ceil(topRatedApps.length / PAGE_SIZE));
  const activePage = Math.min(currentFeaturedPage, totalPages - 1);
  const pageApps = topRatedApps.slice(activePage * PAGE_SIZE, (activePage + 1) * PAGE_SIZE);

  const handlePrevPage = () => {
    setCurrentFeaturedPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNextPage = () => {
    setCurrentFeaturedPage((prev) => (prev + 1) % totalPages);
  };

  // Skeleton visível enquanto o catálogo lazy não chega
  if (isLoading) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 bg-[#26292d] space-y-6">
        {/* Banner skeleton */}
        <div className="rounded-lg border border-[#3b3f46] h-52 sm:h-60 bg-[#2a2d33] animate-pulse flex items-center justify-center">
          <span className="text-[#5f6570] text-xs">Carregando destaques...</span>
        </div>
        {/* Grid 3x3 skeleton */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#9aa0a6] mb-3">
            Categorias de Aplicativos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="h-[68px] rounded-lg bg-[#2a2d33] border border-[#32363c] animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 bg-[#26292d] space-y-3.5 flex flex-col justify-between">
      
      {/* Featured Banner Hero */}
      <div className="relative rounded-lg overflow-hidden shadow-lg border border-[#3b3f46] h-44 sm:h-48 transition-all duration-300 flex-shrink-0">
        <div 
          className="absolute inset-0 transition-all duration-500 flex items-center justify-between pl-12 pr-12 sm:pl-14 sm:pr-14 py-4 sm:py-5"
          style={{ background: banner.bg }}
        >
          {/* Banner Text & Action */}
          <div className="max-w-md z-10 space-y-1.5 min-w-0 pr-4">
            <span className="inline-flex items-center text-[10.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-black/30 text-white backdrop-blur-sm">
              <Sparkles className="w-3 h-3 mr-1 text-[#87cf3e]" /> Em Destaque
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white drop-shadow-md leading-tight">
              {banner.name}
            </h2>
            <p className="text-xs sm:text-[13px] text-white/90 drop-shadow-sm line-clamp-1 sm:line-clamp-2">
              {banner.subtitle}
            </p>
            <div className="pt-1.5 flex items-center space-x-3">
              <button
                onClick={() => {
                  const targetApp = apps.find(a => a.id === banner.id || a.name.toLowerCase().includes(banner.name.toLowerCase()));
                  if (targetApp) onSelectApp(targetApp);
                }}
                className="px-3.5 py-1.5 rounded bg-white text-zinc-900 hover:bg-zinc-100 font-bold text-xs transition-transform active:scale-95 shadow-md flex items-center space-x-1"
              >
                <span>Ver Aplicativo</span>
              </button>
              <button
                onClick={() => onSelectCategory(banner.category)}
                className="px-3 py-1.5 rounded bg-black/25 hover:bg-black/40 text-white font-medium text-xs border border-white/20 transition-colors"
              >
                Ver Categoria
              </button>
            </div>
          </div>

          {/* Banner SVG Logo */}
          <div className="hidden sm:flex items-center justify-center h-full max-w-[150px] z-10 drop-shadow-2xl flex-shrink-0">
            <img 
              src={banner.svg} 
              alt={banner.name} 
              className="max-h-28 max-w-full object-contain filter drop-shadow-lg transition-transform duration-300 hover:scale-105" 
            />
          </div>
        </div>

        {/* Carousel controls */}
        <button
          onClick={() => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors z-20 shadow-md"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setCurrentBanner((prev) => (prev + 1) % banners.length)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors z-20 shadow-md"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5 z-20">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentBanner(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentBanner ? 'bg-white w-5' : 'bg-white/40 w-1.5'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Category Tiles Grid */}
      <div className="flex-shrink-0">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#9aa0a6] mb-2">
          Categorias de Aplicativos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
          {categoryCards.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`gtk-card p-2.5 sm:p-3 rounded-lg cursor-pointer flex items-center justify-between group hover:border-[#87cf3e]/50 transition-all bg-gradient-to-br ${cat.color}`}
              >
                {/* Left: Icon + Text */}
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-md bg-black/25 flex items-center justify-center border border-white/10 group-hover:bg-[#87cf3e]/20 transition-colors flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#87cf3e]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[12.5px] font-semibold text-white group-hover:text-[#87cf3e] transition-colors truncate">
                      {cat.label}
                    </h4>
                    <p className="text-[11px] text-[#9ca3af] truncate mt-0.5">
                      {cat.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Popular / Top Rated Section — Carousel de Descoberta */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#9aa0a6]">
              Mais Bem Avaliados
            </h3>
            {totalPages > 1 && (
              <span className="text-[10.5px] text-[#717680] font-medium bg-[#1e2024] px-1.5 py-0.2 rounded border border-[#32363d]">
                {activePage + 1} / {totalPages}
              </span>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handlePrevPage}
                aria-label="Página anterior"
                className="p-1 rounded bg-[#2c3036] hover:bg-[#383d45] text-[#b3b8c2] hover:text-white border border-[#3b3f46] transition-colors active:scale-95"
                title="Página anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextPage}
                aria-label="Próxima página"
                className="p-1 rounded bg-[#2c3036] hover:bg-[#383d45] text-[#b3b8c2] hover:text-white border border-[#3b3f46] transition-colors active:scale-95"
                title="Próxima página"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5 transition-all duration-200">
          {pageApps.map((app) => (
            <AppCard key={app.id} app={app} onClick={onSelectApp} compact />
          ))}
        </div>
      </div>

    </div>
  );
}
