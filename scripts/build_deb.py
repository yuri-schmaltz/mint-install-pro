#!/usr/bin/env python3
import os
import shutil
import subprocess
import stat

VERSION = "1.2.0"
PACKAGE_NAME = "mint-install-pro"
DEB_DIR = f"/tmp/{PACKAGE_NAME}_{VERSION}_all"
OUTPUT_DEB = f"{PACKAGE_NAME}_{VERSION}_all.deb"

print(f"📦 Criando pacote Debian para {PACKAGE_NAME} v{VERSION}...")

# Limpar diretório temporário se existir
if os.path.exists(DEB_DIR):
    shutil.rmtree(DEB_DIR)

# Criar estrutura de diretórios do .deb
dirs = [
    f"{DEB_DIR}/DEBIAN",
    f"{DEB_DIR}/usr/bin",
    f"{DEB_DIR}/usr/share/{PACKAGE_NAME}",
    f"{DEB_DIR}/usr/share/applications",
    f"{DEB_DIR}/usr/share/icons/hicolor/96x96/apps",
    f"{DEB_DIR}/usr/share/icons/hicolor/scalable/apps",
]

for d in dirs:
    os.makedirs(d, exist_ok=True)

# 1. Copiar bundle de produção (dist)
dist_dir = "dist"
if not os.path.exists(dist_dir):
    raise RuntimeError("Diretório dist/ não encontrado. Execute 'npm run build' primeiro.")

shutil.copytree(dist_dir, f"{DEB_DIR}/usr/share/{PACKAGE_NAME}", dirs_exist_ok=True)

# 2. Criar script executável /usr/bin/mint-install-pro
launcher_content = """#!/usr/bin/env python3
import sys
import os
import threading
import http.server
import socketserver
import socket
import webbrowser
import time

APP_DIR = "/usr/share/mint-install-pro"

def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

def run_server(port):
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass  # Silenciar logs HTTP padrão
            
    os.chdir(APP_DIR)
    with socketserver.TCPServer(("127.0.0.1", port), QuietHandler) as httpd:
        httpd.serve_forever()

def try_gtk_webview(url):
    try:
        import gi
        gi.require_version('Gtk', '3.0')
        try:
            gi.require_version('WebKit2', '4.1')
        except ValueError:
            gi.require_version('WebKit2', '4.0')
        from gi.repository import Gtk, WebKit2, Gdk

        win = Gtk.Window(title="Gerenciador de Aplicativos")
        win.set_default_size(1200, 780)
        win.set_position(Gtk.WindowPosition.CENTER)
        
        icon_path = "/usr/share/icons/hicolor/96x96/apps/mint-install-pro.png"
        if os.path.exists(icon_path):
            win.set_icon_from_file(icon_path)

        webview = WebKit2.WebView()
        webview.load_uri(url)
        win.add(webview)
        win.connect("destroy", Gtk.main_quit)
        win.show_all()
        Gtk.main()
        return True
    except Exception as e:
        return False

def main():
    port = find_free_port()
    t = threading.Thread(target=run_server, args=(port,), daemon=True)
    t.start()
    url = f"http://127.0.0.1:{port}"
    time.sleep(0.3)

    if "--browser" not in sys.argv:
        if try_gtk_webview(url):
            return

    webbrowser.open(url)
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()
"""

launcher_path = f"{DEB_DIR}/usr/bin/{PACKAGE_NAME}"
with open(launcher_path, "w", encoding="utf-8") as f:
    f.write(launcher_content)

# Dar permissão de execução ao launcher
os.chmod(launcher_path, stat.S_IRWXU | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH)

# 3. Criar arquivo de desktop /usr/share/applications/mint-install-pro.desktop
desktop_content = """[Desktop Entry]
Name=Mint Install Pro
Comment=Gerenciador de Aplicativos Moderno para Linux Mint
Comment[pt_BR]=Gerenciador de Aplicativos Moderno para Linux Mint
Exec=mint-install-pro %U
Icon=mint-install-pro
Terminal=false
Type=Application
Categories=GNOME;GTK;System;Settings;PackageManager;
Keywords=package;apt;software;install;uninstall;flatpak;flathub;
MimeType=x-scheme-handler/appstream;x-scheme-handler/apt;application/vnd.debian.binary-package;application/vnd.flatpak.ref;application/vnd.flatpak.repo;
StartupNotify=true
"""

with open(f"{DEB_DIR}/usr/share/applications/{PACKAGE_NAME}.desktop", "w", encoding="utf-8") as f:
    f.write(desktop_content)

# 4. Copiar ícones
shutil.copy("public/icons/software-manager.png", f"{DEB_DIR}/usr/share/icons/hicolor/96x96/apps/{PACKAGE_NAME}.png")
if os.path.exists("public/mint-logo.svg"):
    shutil.copy("public/mint-logo.svg", f"{DEB_DIR}/usr/share/icons/hicolor/scalable/apps/{PACKAGE_NAME}.svg")

# 5. Criar DEBIAN/control
control_content = f"""Package: {PACKAGE_NAME}
Version: {VERSION}
Section: admin
Priority: optional
Architecture: all
Depends: python3
Recommends: gir1.2-gtk-3.0, gir1.2-webkit2-4.1 | gir1.2-webkit2-4.0
Maintainer: Yuri Schmaltz <yuri.schmaltz@gmail.com>
Homepage: https://github.com/yuri-schmaltz/mint-install-pro
Description: Gerenciador de Aplicativos Moderno para Linux Mint (MintInstall Clone)
 Clone interativo e de alto desempenho do Gerenciador de Aplicativos
 do Linux Mint (MintInstall), com fidelidade ao tema Mint-Y Dark,
 suporte nativo ao Flathub, instalacao/desinstalacao em lote
 e matriz 3x3 com contadores dinamicos de ate +999 aplicativos.
"""

with open(f"{DEB_DIR}/DEBIAN/control", "w", encoding="utf-8") as f:
    f.write(control_content)

# 6. Criar scripts de post-instalação e pós-remoção
postinst_content = """#!/bin/sh
set -e
if which update-desktop-database >/dev/null 2>&1; then
    update-desktop-database -q /usr/share/applications || true
fi
if which gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache -q /usr/share/icons/hicolor || true
fi
if which xdg-mime >/dev/null 2>&1; then
    xdg-mime default mint-install-pro.desktop x-scheme-handler/appstream >/dev/null 2>&1 || true
    xdg-mime default mint-install-pro.desktop x-scheme-handler/apt >/dev/null 2>&1 || true
    xdg-mime default mint-install-pro.desktop application/vnd.debian.binary-package >/dev/null 2>&1 || true
fi
exit 0
"""

with open(f"{DEB_DIR}/DEBIAN/postinst", "w", encoding="utf-8") as f:
    f.write(postinst_content)
os.chmod(f"{DEB_DIR}/DEBIAN/postinst", 0o755)

postrm_content = """#!/bin/sh
set -e
if which update-desktop-database >/dev/null 2>&1; then
    update-desktop-database -q /usr/share/applications || true
fi
exit 0
"""

with open(f"{DEB_DIR}/DEBIAN/postrm", "w", encoding="utf-8") as f:
    f.write(postrm_content)
os.chmod(f"{DEB_DIR}/DEBIAN/postrm", 0o755)

# 7. Empacotar usando dpkg-deb
cmd = ["dpkg-deb", "--build", "--root-owner-group", DEB_DIR, OUTPUT_DEB]
result = subprocess.run(cmd, capture_output=True, text=True)

if result.returncode != 0:
    print(f"❌ Erro ao gerar o .deb:\n{result.stderr}")
    sys.exit(1)

# Limpeza
shutil.rmtree(DEB_DIR)

size_mb = os.path.getsize(OUTPUT_DEB) / (1024 * 1024)
print(f"✅ Pacote {OUTPUT_DEB} gerado com sucesso! ({size_mb:.2f} MB)")
