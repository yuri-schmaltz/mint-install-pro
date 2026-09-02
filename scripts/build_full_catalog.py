#!/usr/bin/env python3
import os
import shutil
import glob
import json
import configparser
import urllib.request
import apt
import subprocess

print("Iniciando construção do catálogo completo de aplicativos...")

os.makedirs("public/icons", exist_ok=True)
os.makedirs("src/data", exist_ok=True)

# 1. Obter lista de Flatpaks instalados localmente
installed_flatpaks = set()
try:
    fp_output = subprocess.check_output(["flatpak", "list", "--app", "--columns=application"], text=True)
    for line in fp_output.strip().splitlines():
        if line.strip():
            installed_flatpaks.add(line.strip())
    print(f"Flatpaks instalados encontrados no sistema: {len(installed_flatpaks)}")
except Exception as e:
    print(f"Aviso flatpak list: {e}")

# 2. Inicializar Cache APT
print("Carregando cache APT...")
apt_cache = apt.Cache()

# 3. Os 21 aplicativos exatos de Acessórios da imagem do usuário
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

catalog = []
seen_ids = set()

for acc in EXACT_ACCESSORIES:
    pkg_id = acc["id"]
    seen_ids.add(pkg_id)
    icon_path = f"/icons/{pkg_id}.png"
    if os.path.exists(f"public/icons/{pkg_id}.svg"):
        icon_path = f"/icons/{pkg_id}.svg"
    
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
            
    catalog.append({
        "id": pkg_id,
        "name": acc["name"],
        "summary": acc["summary"],
        "fullSummary": acc["summary"],
        "description": desc[:350] + "..." if len(desc) > 350 else desc,
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

print(f"21 Acessórios base inseridos.")

# 4. Extrair Flatpaks da API Flathub
print("Buscando catálogo de Flatpaks do Flathub...")
try:
    req = urllib.request.Request(
        "https://flathub.org/api/v2/collection/popular?page=1&per_page=50",
        headers={"User-Agent": "Mozilla/5.0"}
    )
    res = urllib.request.urlopen(req, timeout=8).read()
    flathub_data = json.loads(res)
    flathub_hits = flathub_data.get("hits", [])
    print(f"Flathub retornou {len(flathub_hits)} aplicativos populares.")
    
    for hit in flathub_hits:
        app_id = hit.get("app_id") or hit.get("id")
        if not app_id or app_id in seen_ids:
            continue
        seen_ids.add(app_id)
        
        name = hit.get("name", app_id)
        summary = hit.get("summary") or "Aplicativo disponível no Flathub"
        desc = hit.get("description") or summary
        # Clean HTML tags if any in description
        import re
        desc_clean = re.sub(r'<[^>]+>', '', desc)[:350]
        
        icon_url = hit.get("icon")
        # If no icon, try to find in featured
        local_icon = None
        for base in [app_id, name.lower().replace(" ", "-"), name.lower()]:
            if os.path.exists(f"public/featured/{base}.svg"):
                local_icon = f"/featured/{base}.svg"
                break
            if os.path.exists(f"public/icons/{base}.png"):
                local_icon = f"/icons/{base}.png"
                break
                
        is_inst = app_id in installed_flatpaks
        
        # Determine specific secondary category
        cats = hit.get("main_categories") or []
        primary_cat = "flatpak"
        
        catalog.append({
            "id": app_id,
            "name": name,
            "summary": summary[:60] + "..." if len(summary) > 60 else summary,
            "fullSummary": summary,
            "description": desc_clean,
            "category": "flatpak",
            "categoryLabel": "Flatpak",
            "rating": round(4.5 + (hash(app_id) % 5) * 0.1, 1),
            "installed": is_inst,
            "version": "stable",
            "size": "45 MB",
            "packageType": "Flatpak (Flathub)",
            "icon": icon_url or local_icon or "/public/flatpak-icon.svg",
            "fallbackIcon": "📦",
            "developer": hit.get("developer_name") or "Flathub Community",
            "license": hit.get("project_license") or "Open Source",
            "flathub": True
        })
except Exception as e:
    print(f"Erro ao buscar do Flathub: {e}")

# 5. Adicionar aplicações desktop nativas instaladas do sistema
print("Mapeando aplicações de desktop locais (/usr/share/applications/)...")
desktop_files = glob.glob("/usr/share/applications/*.desktop")
category_map = {
    "AudioVideo": ("sound-video", "Som e Vídeo"),
    "Audio": ("sound-video", "Som e Vídeo"),
    "Video": ("sound-video", "Som e Vídeo"),
    "Development": ("system", "Ferramentas do Sistema"),
    "Education": ("accessories", "Acessórios"),
    "Game": ("games", "Jogos"),
    "Graphics": ("graphics", "Gráficos"),
    "Network": ("internet", "Internet"),
    "Office": ("accessories", "Acessórios"),
    "System": ("system", "Ferramentas do Sistema"),
    "Utility": ("accessories", "Acessórios"),
    "Settings": ("system", "Ferramentas do Sistema")
}

for df in desktop_files:
    cp = configparser.ConfigParser(interpolation=None)
    try:
        cp.read(df, encoding="utf-8")
        if "Desktop Entry" in cp:
            entry = cp["Desktop Entry"]
            if entry.get("NoDisplay", "false").lower() == "true" or entry.get("Type") != "Application":
                continue
            name = entry.get("Name")
            if not name:
                continue
            
            pkg_id = os.path.splitext(os.path.basename(df))[0].lower()
            if pkg_id in seen_ids or any(a["name"].lower() == name.lower() for a in catalog):
                continue
            seen_ids.add(pkg_id)
            
            comment = entry.get("Comment") or f"Aplicativo do sistema: {name}"
            raw_cats = entry.get("Categories", "")
            cat_id = "accessories"
            cat_label = "Acessórios"
            for rc, (cid, clbl) in category_map.items():
                if rc in raw_cats:
                    cat_id = cid
                    cat_label = clbl
                    break
                    
            icon_val = entry.get("Icon", "")
            icon_path = None
            if icon_val and os.path.isabs(icon_val) and os.path.exists(icon_val):
                ext = os.path.splitext(icon_val)[1]
                dest = f"public/icons/{pkg_id}{ext}"
                try:
                    shutil.copyfile(icon_val, dest)
                    icon_path = f"/icons/{pkg_id}{ext}"
                except:
                    pass
            elif icon_val:
                for d in ["/usr/share/icons/Mint-Y/apps/96", "/usr/share/icons/Mint-L/apps/96", "/usr/share/icons/hicolor/96x96/apps", "/usr/share/pixmaps"]:
                    for ext in [".png", ".svg"]:
                        candidate = os.path.join(d, f"{icon_val}{ext}")
                        if os.path.exists(candidate):
                            dest = f"public/icons/{pkg_id}{ext}"
                            try:
                                shutil.copyfile(candidate, dest)
                                icon_path = f"/icons/{pkg_id}{ext}"
                                break
                            except:
                                pass
                    if icon_path:
                        break
                        
            catalog.append({
                "id": pkg_id,
                "name": name,
                "summary": comment[:60] + "..." if len(comment) > 60 else comment,
                "fullSummary": comment,
                "description": comment,
                "category": cat_id,
                "categoryLabel": cat_label,
                "rating": round(4.5 + (hash(pkg_id) % 5) * 0.1, 1),
                "installed": True,
                "version": "22.3",
                "size": "8.4 MB",
                "packageType": "Pacote do Sistema (APT)",
                "icon": icon_path or "/icons/grep.png",
                "fallbackIcon": "💻",
                "developer": "Linux Mint / Ubuntu",
                "license": "GPL / Open Source"
            })
    except:
        pass

print(f"Total consolidado no catálogo da plataforma: {len(catalog)} aplicativos!")

# 6. Gravar src/data/initialApps.js
categories_list = [
  {"id": "all", "label": "Todos os Aplicativos", "icon": "Grid"},
  {"id": "flatpak", "label": "Flatpak", "icon": "Boxes"},
  {"id": "accessories", "label": "Acessórios", "icon": "Wrench"},
  {"id": "internet", "label": "Internet", "icon": "Globe"},
  {"id": "sound-video", "label": "Som e Vídeo", "icon": "Film"},
  {"id": "graphics", "label": "Gráficos", "icon": "Image"},
  {"id": "games", "label": "Jogos", "icon": "Gamepad2"},
  {"id": "system", "label": "Ferramentas do Sistema", "icon": "Cpu"},
  {"id": "picks", "label": "Destaques", "icon": "Sparkles"}
]

js_content = f"""// Catálogo Completo da Plataforma Linux Mint (APT do Sistema + Flathub Oficial)
export const initialApps = {json.dumps(catalog, indent=2, ensure_ascii=False)};

export const categoriesList = {json.dumps(categories_list, indent=2, ensure_ascii=False)};
"""

with open("src/data/initialApps.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print("src/data/initialApps.js gerado com sucesso!")
