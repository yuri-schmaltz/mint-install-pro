#!/usr/bin/env python3
import os
import shutil
import glob
import apt

# Map of category names to human readable labels
CATEGORIES = {
    "accessories": "Acessórios",
    "internet": "Internet",
    "sound-video": "Som e Vídeo",
    "graphics": "Gráficos",
    "games": "Jogos",
    "system": "Ferramentas do Sistema",
    "picks": "Destaques"
}

# The 21 apps from user's screenshot for Accessories
EXACT_ACCESSORIES = [
  {"id": "synapse", "name": "Synapse", "summary": "Lançador de arquivos semântico", "rating": 4.9, "installed": False},
  {"id": "dconf-editor", "name": "Dconf-editor", "summary": "Sistema de armazenamento de...", "rating": 4.8, "installed": False},
  {"id": "grep", "name": "Grep", "summary": "Grep, egrep e fgrep da GNU", "rating": 4.8, "installed": True},
  {"id": "mediainfo-gui", "name": "Mediainfo-gui", "summary": "Graphical utility for reading in...", "rating": 4.8, "installed": False},
  {"id": "artha", "name": "Artha", "summary": "Thesaurus off-line útil baseado...", "rating": 4.7, "installed": False},
  {"id": "doublecmd-gtk", "name": "Doublecmd-gtk", "summary": "Twin-panel (commander-style)...", "rating": 4.7, "installed": False},
  {"id": "htop", "name": "Htop", "summary": "Visualizador de processos inte...", "rating": 4.7, "installed": False},
  {"id": "p7zip-full", "name": "P7zip-full", "summary": "Pacote de transição", "rating": 4.7, "installed": True},
  {"id": "unzip", "name": "Unzip", "summary": "Desarquivador para arquivos .zip", "rating": 4.7, "installed": True},
  {"id": "fdupes", "name": "Fdupes", "summary": "Identifica arquivos duplicados...", "rating": 4.6, "installed": True},
  {"id": "gtkhash", "name": "Gtkhash", "summary": "Utilitário GTK+ para calcular c...", "rating": 4.6, "installed": False},
  {"id": "keepassxc", "name": "Keepassxc", "summary": "Gerenciador de senhas interpl...", "rating": 4.6, "installed": False},
  {"id": "mc", "name": "Mc", "summary": "Midnight Commander - um pod...", "rating": 4.6, "installed": False},
  {"id": "p7zip", "name": "P7zip", "summary": "Pacote de transição", "rating": 4.6, "installed": True},
  {"id": "sshfs", "name": "Sshfs", "summary": "Sistema de arquivos cliente ba...", "rating": 4.6, "installed": False},
  {"id": "devede", "name": "Devede", "summary": "Aplicação simples para criar D...", "rating": 4.5, "installed": False},
  {"id": "kupfer", "name": "Kupfer", "summary": "Lançador/invocador de área d...", "rating": 4.5, "installed": False},
  {"id": "unrar", "name": "Unrar", "summary": "Unarchiver for .rar files (non-f...", "rating": 4.5, "installed": False},
  {"id": "goldendict", "name": "Goldendict", "summary": "Dicionário rico com suporte a ...", "rating": 4.5, "installed": False},
  {"id": "hplip-gui", "name": "Hplip-gui", "summary": "Utilitário de impressão e digitalização HP", "rating": 4.5, "installed": False},
  {"id": "krename", "name": "Krename", "summary": "Poderoso renomeador de arquivos em lote", "rating": 4.5, "installed": True}
]

EXTRA_APPS = [
    # Internet
    {"id": "firefox", "name": "Firefox", "summary": "Navegador Web seguro e flexível", "category": "internet", "rating": 4.9},
    {"id": "thunderbird", "name": "Thunderbird", "summary": "Cliente completo de e-mail e notícias", "category": "internet", "rating": 4.7},
    {"id": "filezilla", "name": "FileZilla", "summary": "Cliente FTP, FTPS e SFTP gráfico", "category": "internet", "rating": 4.8},
    {"id": "transmission-gtk", "name": "Transmission", "summary": "Cliente BitTorrent leve e rápido", "category": "internet", "rating": 4.8},
    {"id": "hexchat", "name": "HexChat", "summary": "Cliente de IRC amigável e expansível", "category": "internet", "rating": 4.6},
    {"id": "chromium-browser", "name": "Chromium", "summary": "Navegador web de código aberto", "category": "internet", "rating": 4.7},
    
    # Sound & Video
    {"id": "vlc", "name": "VLC Media Player", "summary": "Reprodutor multimídia universal", "category": "sound-video", "rating": 4.9},
    {"id": "audacity", "name": "Audacity", "summary": "Editor e gravador de áudio multipista", "category": "sound-video", "rating": 4.8},
    {"id": "celluloid", "name": "Celluloid", "summary": "Interface GTK+ moderna para o mpv", "category": "sound-video", "rating": 4.8},
    {"id": "kdenlive", "name": "Kdenlive", "summary": "Editor de vídeo não-linear profissional", "category": "sound-video", "rating": 4.7},
    {"id": "handbrake", "name": "HandBrake", "summary": "Conversor e codificador de vídeos versátil", "category": "sound-video", "rating": 4.8},
    {"id": "rhythmbox", "name": "Rhythmbox", "summary": "Organizador e reprodutor de músicas", "category": "sound-video", "rating": 4.6},
    
    # Graphics
    {"id": "gimp", "name": "GIMP", "summary": "Manipulador e editor avançado de imagens", "category": "graphics", "rating": 4.8},
    {"id": "inkscape", "name": "Inkscape", "summary": "Editor gráfico vetorial profissional", "category": "graphics", "rating": 4.9},
    {"id": "blender", "name": "Blender", "summary": "Suíte 3D de modelagem, animação e render", "category": "graphics", "rating": 4.9},
    {"id": "krita", "name": "Krita", "summary": "Pintura digital e ilustração artística", "category": "graphics", "rating": 4.8},
    {"id": "darktable", "name": "Darktable", "summary": "Fluxo de fotografia e revelação RAW", "category": "graphics", "rating": 4.7},
    {"id": "shotwell", "name": "Shotwell", "summary": "Organizador de fotos digitais", "category": "graphics", "rating": 4.6},
    
    # Games
    {"id": "steam-installer", "name": "Steam", "summary": "A plataforma definitiva de jogos", "category": "games", "rating": 4.9},
    {"id": "lutris", "name": "Lutris", "summary": "Plataforma aberta de gerenciamento de jogos", "category": "games", "rating": 4.8},
    {"id": "supertuxkart", "name": "SuperTuxKart", "summary": "Jogo de corrida de karts 3D arcade", "category": "games", "rating": 4.7},
    {"id": "minetest", "name": "Minetest", "summary": "Mundo voxel aberto de sobrevivência", "category": "games", "rating": 4.6},
    
    # System Tools
    {"id": "gparted", "name": "GParted", "summary": "Editor gráfico de partições de disco", "category": "system", "rating": 4.9},
    {"id": "timeshift", "name": "Timeshift", "summary": "Restauração e snapshots do sistema", "category": "system", "rating": 4.9},
    {"id": "synaptic", "name": "Synaptic", "summary": "Gerenciador avançado de pacotes APT", "category": "system", "rating": 4.8},
    {"id": "baobab", "name": "Analisador de Disco", "summary": "Inspeção de uso de espaço de armazenamento", "category": "system", "rating": 4.7},
    {"id": "bleachbit", "name": "BleachBit", "summary": "Liberador de espaço e proteção de privacidade", "category": "system", "rating": 4.7},
    
    # Picks (Destaques)
    {"id": "vlc", "name": "VLC", "summary": "Reprodutor multimídia completo", "category": "picks", "rating": 4.9},
    {"id": "gimp", "name": "GIMP", "summary": "Criação e edição gráfica", "category": "picks", "rating": 4.8},
    {"id": "inkscape", "name": "Inkscape", "summary": "Desenho vetorial profissional", "category": "picks", "rating": 4.9},
    {"id": "blender", "name": "Blender", "summary": "Modelagem 3D", "category": "picks", "rating": 4.9},
    {"id": "timeshift", "name": "Timeshift", "summary": "Snapshots do sistema", "category": "picks", "rating": 4.9}
]

def find_system_icon(pkg_id):
    search_dirs = [
        "/usr/share/linuxmint/mintinstall/featured",
        "/usr/share/icons/Mint-Y/apps/96",
        "/usr/share/icons/Mint-L/apps/96",
        "/usr/share/icons/hicolor/scalable/apps",
        "/usr/share/icons/hicolor/96x96/apps",
        "/usr/share/icons/Papirus-Light/96x96/apps",
        "/usr/share/pixmaps"
    ]
    
    # Direct icon match
    for sdir in search_dirs:
        for ext in [".svg", ".png"]:
            p = os.path.join(sdir, f"{pkg_id}{ext}")
            if os.path.exists(p):
                return p
    
    # Generic package icon fallback
    pkg_generic = "/usr/share/icons/Mint-Y/mimetypes/64/package-x-generic.png"
    if os.path.exists(pkg_generic):
        return pkg_generic
    return None

def main():
    print("Inicializando cache APT do Linux Mint...")
    apt_cache = apt.Cache()
    
    os.makedirs("public/icons", exist_ok=True)
    
    apps_list = []
    
    # 1. Process 21 Accessories
    for acc in EXACT_ACCESSORIES:
        pkg_id = acc["id"]
        icon_path = f"/icons/{pkg_id}.png"
        if os.path.exists(f"public/icons/{pkg_id}.svg"):
            icon_path = f"/icons/{pkg_id}.svg"
        
        # APT lookup for metadata
        desc = "Utilitário do sistema Linux Mint"
        version = "1.0.0"
        size = "1.2 MB"
        installed = acc["installed"]
        
        if pkg_id in apt_cache:
            p = apt_cache[pkg_id]
            desc = p.candidate.description if p.candidate else desc
            version = p.candidate.version if p.candidate else version
            if p.candidate and p.candidate.size:
                size = f"{round(p.candidate.size / (1024*1024), 1)} MB" if p.candidate.size > 1024*1024 else f"{round(p.candidate.size / 1024)} KB"
            if p.is_installed:
                installed = True
        
        apps_list.append({
            "id": pkg_id,
            "name": acc["name"],
            "summary": acc["summary"],
            "fullSummary": acc["summary"],
            "description": desc[:300] + "..." if len(desc) > 300 else desc,
            "category": "accessories",
            "categoryLabel": "Acessórios",
            "rating": acc["rating"],
            "installed": installed,
            "version": version,
            "size": size,
            "packageType": "Pacote do Sistema (APT)",
            "icon": icon_path,
            "fallbackIcon": "📦",
            "developer": "Equipe Linux Mint / Debian",
            "license": "Open Source"
        })
        
    # 2. Process Extra Apps for other categories
    for extra in EXTRA_APPS:
        pkg_id = extra["id"]
        cat = extra["category"]
        
        # Check icon
        target_icon = None
        for ext in [".svg", ".png"]:
            if os.path.exists(f"public/icons/{pkg_id}{ext}"):
                target_icon = f"/icons/{pkg_id}{ext}"
                break
        
        if not target_icon:
            sys_icon = find_system_icon(pkg_id)
            if sys_icon:
                ext = os.path.splitext(sys_icon)[1]
                dest = f"public/icons/{pkg_id}{ext}"
                shutil.copyfile(sys_icon, dest)
                target_icon = f"/icons/{pkg_id}{ext}"
            else:
                target_icon = "/icons/grep.png"
                
        desc = "Software nativo para Linux"
        version = "1.0.0"
        size = "5.0 MB"
        installed = False
        
        if pkg_id in apt_cache:
            p = apt_cache[pkg_id]
            desc = p.candidate.description if p.candidate else desc
            version = p.candidate.version if p.candidate else version
            if p.candidate and p.candidate.size:
                size = f"{round(p.candidate.size / (1024*1024), 1)} MB" if p.candidate.size > 1024*1024 else f"{round(p.candidate.size / 1024)} KB"
            installed = p.is_installed
            
        apps_list.append({
            "id": f"{pkg_id}_{cat}" if any(a["id"] == pkg_id for a in apps_list) else pkg_id,
            "name": extra["name"],
            "summary": extra["summary"],
            "fullSummary": extra["summary"],
            "description": desc[:300] + "..." if len(desc) > 300 else desc,
            "category": cat,
            "categoryLabel": CATEGORIES.get(cat, cat.capitalize()),
            "rating": extra["rating"],
            "installed": installed,
            "version": version,
            "size": size,
            "packageType": "Pacote do Sistema (APT)",
            "icon": target_icon,
            "fallbackIcon": "📦",
            "developer": "Comunidade Open Source",
            "license": "GPL / MIT"
        })
        
    print(f"Total de aplicativos processados: {len(apps_list)}")
    
    # Output to initialApps.js
    import json
    js_content = f"""// Catálogo gerado e alimentado a partir do Linux Mint 22.3 (APT Cache & System Icons)
export const initialApps = {json.dumps(apps_list, indent=2, ensure_ascii=False)};

export const categoriesList = [
  {{ id: "all", label: "Todos os Aplicativos", icon: "Grid" }},
  {{ id: "accessories", label: "Acessórios", icon: "Wrench" }},
  {{ id: "internet", label: "Internet", icon: "Globe" }},
  {{ id: "sound-video", label: "Som e Vídeo", icon: "Film" }},
  {{ id: "graphics", label: "Gráficos", icon: "Image" }},
  {{ id: "games", label: "Jogos", icon: "Gamepad2" }},
  {{ id: "system", label: "Ferramentas do Sistema", icon: "Cpu" }},
  {{ id: "picks", label: "Destaques", icon: "Sparkles" }},
];
"""
    with open("src/data/initialApps.js", "w", encoding="utf-8") as f:
        f.write(js_content)
    print("src/data/initialApps.js atualizado com sucesso!")

if __name__ == "__main__":
    main()
