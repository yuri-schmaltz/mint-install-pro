#!/usr/bin/env python3
import os
import shutil
import subprocess
import stat

VERSION = "1.3.2"
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
launcher_content = r"""#!/usr/bin/env python3
import sys
import os
import threading
import http.server
import socketserver
import socket
import webbrowser
import time
import json
import subprocess

import re

APP_DIR = "/usr/share/mint-install-pro"
APT_PKG_REGEX = re.compile(r'^[a-z0-9][a-z0-9+\.\-]{1,63}$')
FLATPAK_ID_REGEX = re.compile(r'^[a-zA-Z0-9_\-]+(\.[a-zA-Z0-9_\-]+)+$')
is_processing_lock = threading.Lock()

def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

def run_server(port):
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            # Redireciona logs HTTP pra stderr pra facilitar debug em campo
            try:
                sys.stderr.write("[mip-http] %s - %s\n" % (self.address_string(), format % args))
            except Exception:
                pass

        def end_headers(self):
            # No-store em TUDO: garante que WebView nunca sirva bundle antigo
            # após upgrade do .deb (hotfix 5 do handoff).
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            super().end_headers()

        def do_GET(self):
            # Acesso restrito a loopback local
            client_ip = self.client_address[0] if self.client_address else ''
            if self.path.startswith('/api/') and client_ip not in ('127.0.0.1', '::1', 'localhost'):
                self.send_error(403, "Acesso negado: apenas chamadas locais permitidas")
                return

            if self.path == '/api/installed':
                try:
                    fp = subprocess.check_output(['flatpak', 'list', '--app', '--columns=application'], text=True)
                    flatpaks = [x.strip() for x in fp.strip().splitlines() if x.strip()]
                except Exception:
                    flatpaks = []
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'flatpaks': flatpaks}).encode('utf-8'))
                return
            super().do_GET()

        def do_POST(self):
            client_ip = self.client_address[0] if self.client_address else ''
            if self.path.startswith('/api/') and client_ip not in ('127.0.0.1', '::1', 'localhost'):
                self.send_error(403, "Acesso negado: apenas chamadas locais permitidas")
                return

            if self.path in ('/api/install', '/api/uninstall'):
                length = int(self.headers.get('Content-Length', 0))
                try:
                    body = json.loads(self.rfile.read(length).decode('utf-8') or '{}')
                except Exception:
                    self.send_error(400, "JSON invalido")
                    return

                app_id = str(body.get('id', '')).strip()
                pkg_type = str(body.get('packageType', ''))
                is_flatpak = 'flatpak' in pkg_type.lower() or '.' in app_id
                is_install = self.path == '/api/install'

                # Validacao estrita contra Argument Injection
                if not app_id or app_id.startswith('-'):
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': False, 'error': 'Identificador de pacote invalido'}).encode('utf-8'))
                    return

                if is_flatpak and not FLATPAK_ID_REGEX.match(app_id):
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': False, 'error': 'Identificador Flatpak com formato invalido'}).encode('utf-8'))
                    return

                if not is_flatpak and not APT_PKG_REGEX.match(app_id):
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': False, 'error': 'Identificador APT com formato invalido'}).encode('utf-8'))
                    return

                if not is_processing_lock.acquire(blocking=False):
                    self.send_response(429)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': False, 'error': 'Outra operacao ja esta em processamento'}).encode('utf-8'))
                    return

                try:
                    if is_flatpak:
                        if is_install:
                            cmd = ['flatpak', 'install', '--user', '-y', '--noninteractive', 'flathub', '--', app_id]
                        else:
                            cmd = ['flatpak', 'uninstall', '--user', '-y', '--noninteractive', '--', app_id]
                    else:
                        if is_install:
                            cmd = ['pkexec', 'apt-get', 'install', '-y', '--', app_id]
                        else:
                            cmd = ['pkexec', 'apt-get', 'remove', '-y', '--', app_id]

                    try:
                        sys.stderr.write("[mip-launcher] executando: %s\n" % ' '.join(cmd))
                    except Exception:
                        pass

                    proc = subprocess.run(
                        cmd,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.STDOUT,
                        text=True,
                        timeout=300,
                        env={**os.environ, 'DEBIAN_FRONTEND': 'noninteractive'}
                    )
                    success = proc.returncode == 0
                    out = proc.stdout
                    try:
                        sys.stderr.write("[mip-launcher] resultado rc=%d success=%s\n" % (proc.returncode, success))
                    except Exception:
                        pass
                except Exception as e:
                    success = False
                    out = str(e)
                    try:
                        sys.stderr.write("[mip-launcher] ERRO executando: %s\n" % e)
                    except Exception:
                        pass
                finally:
                    is_processing_lock.release()

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': success, 'output': out[-1000:] if out else ''}).encode('utf-8'))
                return
            self.send_error(404)
            
    os.chdir(APP_DIR)
    with socketserver.TCPServer(("127.0.0.1", port), QuietHandler) as httpd:
        httpd.serve_forever()

def try_gtk_webview(url):
    '''
    Tenta abrir a URL num WebView GTK nativo. Retorna (ok, motivo_falha).
    Resolve débito #9: ao invés de cair silenciosamente pra webbrowser,
    retorna o motivo para que main() possa mostrar diálogo informativo.
    '''
    try:
        import gi
        gi.require_version('Gtk', '3.0')
    except (ImportError, ValueError) as e:
        return False, f"PyGObject não instalado: {e}"
    try:
        try:
            gi.require_version('WebKit2', '4.1')
        except ValueError:
            gi.require_version('WebKit2', '4.0')
    except ValueError as e:
        return False, f"Nenhum binding WebKit2 GTK disponível: {e}"
    try:
        from gi.repository import Gtk, WebKit2, Gdk
    except Exception as e:
        return False, f"Falha ao importar Gtk/WebKit2: {e}"
    try:
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
        return True, None
    except Exception as e:
        return False, f"Erro ao abrir WebView: {e}"


def show_error_dialog(reason, url):
    '''
    Mostra um diálogo GTK modal explicando que o app precisa de WebKit2
    para rodar. Resolve débito #9: falha alto em vez de cair pro browser.
    '''
    try:
        import gi
        gi.require_version('Gtk', '3.0')
        from gi.repository import Gtk
        dialog = Gtk.MessageDialog(
            type=Gtk.MessageType.ERROR,
            buttons=Gtk.ButtonsType.OK,
            message_format="Mint Install Pro não pôde iniciar"
        )
        dialog.format_secondary_text(
            f"{reason}\n\n"
            "O Mint Install Pro precisa das bibliotecas GTK WebKit2 para abrir como aplicativo nativo.\n\n"
            "Instale-as com:\n"
            "  sudo apt install gir1.2-gtk-3.0 gir1.2-webkit2-4.1\n\n"
            f"Como alternativa, abra manualmente no navegador:\n  {url}"
        )
        dialog.run()
        dialog.destroy()
    except Exception:
        # Se nem o GTK pra diálogo tá disponível, cai pro stderr
        print(f"[mint-install-pro] ERRO: {reason}", file=sys.stderr)
        print(f"[mint-install-pro] URL: {url}", file=sys.stderr)


def main():
    port = find_free_port()
    t = threading.Thread(target=run_server, args=(port,), daemon=True)
    t.start()
    url = f"http://127.0.0.1:{port}"
    time.sleep(0.3)

    if "--browser" not in sys.argv:
        ok, reason = try_gtk_webview(url)
        if ok:
            return
        # Falhou — mostra erro explícito. --force-browser pula o diálogo.
        if "--force-browser" in sys.argv:
            webbrowser.open(url)
        else:
            show_error_dialog(reason, url)
            sys.exit(1)

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
Exec=mint-install-pro
Icon=mint-install-pro
Terminal=false
Type=Application
Categories=GNOME;GTK;System;Settings;PackageManager;
Keywords=package;apt;software;install;uninstall;flatpak;flathub;
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
