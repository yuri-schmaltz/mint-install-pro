import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Sparkles, 
  Wrench, 
  Globe, 
  Film, 
  Image, 
  Gamepad2, 
  Cpu, 
  Check,
  Download
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
  { id: "internet", label: "Internet", desc: "Navegadores, clientes de e-mail e mensageiros", icon: Globe, color: "from-blue-800/40 to-blue-950/60" },
  { id: "sound-video", label: "Som e Vídeo", desc: "Reprodutores, editores e gravadores de mídia", icon: Film, color: "from-purple-800/40 to-purple-950/60" },
  { id: "graphics", label: "Gráficos", desc: "Modelagem 3D, pintura digital e fotografia", icon: Image, color: "from-amber-800/40 to-amber-950/60" },
  { id: "games", label: "Jogos", desc: "Ação, estratégia, simuladores e arcades", icon: Gamepad2, color: "from-rose-800/40 to-rose-950/60" },
  { id: "system", label: "Ferramentas do Sistema", desc: "Monitoramento de disco, snapshots e particionador", icon: Cpu, color: "from-teal-800/40 to-teal-950/60" }
];

export default function LandingPage({ onSelectCategory, onSelectApp, apps }) {
  const [currentBanner, setCurrentBanner] = useState(0);

  // Automatic banner slide every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const banner = banners[currentBanner];

  // Top rated apps
  const topRatedApps = apps
    .filter((a) => a.rating >= 4.7)
    .slice(0, 6);

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 bg-[#26292d] space-y-6">
      
      {/* Featured Banner Hero */}
      <div className="relative rounded-lg overflow-hidden shadow-xl border border-[#3b3f46] h-52 sm:h-60 transition-all duration-300">
        <div 
          className="absolute inset-0 transition-all duration-500 flex items-center justify-between p-6 sm:p-8"
          style={{ background: banner.bg }}
        >
          {/* Banner Text & Action */}
          <div className="max-w-md z-10 space-y-2">
            <span className="inline-flex items-center text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-black/30 text-white backdrop-blur-xs">
              <Sparkles className="w-3 h-3 mr-1 text-[#87cf3e]" /> Em Destaque
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">
              {banner.name}
            </h2>
            <p className="text-xs sm:text-sm text-white/90 drop-shadow-sm line-clamp-2">
              {banner.subtitle}
            </p>
            <div className="pt-2 flex items-center space-x-3">
              <button
                onClick={() => {
                  const targetApp = apps.find(a => a.id === banner.id || a.name.toLowerCase().includes(banner.name.toLowerCase()));
                  if (targetApp) onSelectApp(targetApp);
                }}
                className="px-4 py-1.5 rounded bg-white text-zinc-900 hover:bg-zinc-100 font-bold text-xs transition-transform active:scale-95 shadow-md flex items-center space-x-1.5"
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
          <div className="hidden sm:flex items-center justify-center h-full max-w-[200px] z-10 drop-shadow-2xl">
            <img 
              src={banner.svg} 
              alt={banner.name} 
              className="max-h-36 max-w-full object-contain filter drop-shadow-lg transition-transform duration-300 hover:scale-105" 
            />
          </div>
        </div>

        {/* Carousel controls */}
        <button
          onClick={() => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors z-20"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => setCurrentBanner((prev) => (prev + 1) % banners.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors z-20"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5 z-20">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentBanner(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentBanner ? 'bg-white w-5' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Category Tiles Grid */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#9aa0a6] mb-3">
          Categorias de Aplicativos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoryCards.map((cat) => {
            const Icon = cat.icon;
            const count = apps.filter(a => a.category === cat.id).length;
            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`gtk-card p-3.5 rounded-lg cursor-pointer flex items-center justify-between group hover:border-[#87cf3e]/50 transition-all bg-gradient-to-br ${cat.color}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-md bg-black/20 flex items-center justify-center border border-white/10 group-hover:bg-[#87cf3e]/20 transition-colors">
                    <Icon className="w-5 h-5 text-[#87cf3e]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-[#87cf3e] transition-colors">
                      {cat.label}
                    </h4>
                    <p className="text-[11px] text-[#9ca3af] line-clamp-1">
                      {cat.desc}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-[#87cf3e] px-2 py-0.5 rounded-full bg-black/30 border border-[#87cf3e]/20">
                  {count} apps
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Popular / Top Rated Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#9aa0a6]">
            Mais Bem Avaliados
          </h3>
          <button
            onClick={() => onSelectCategory('all')}
            className="text-xs text-[#87cf3e] hover:underline font-medium"
          >
            Ver todos ({apps.length})
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {topRatedApps.map((app) => (
            <AppCard key={app.id} app={app} onClick={onSelectApp} />
          ))}
        </div>
      </div>

    </div>
  );
}
