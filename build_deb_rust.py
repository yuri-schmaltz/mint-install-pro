#!/usr/bin/env python3
import os
import shutil
import stat
import subprocess
import sys

# Executar a partir do diretório mintinstall_rust
os.chdir(os.path.dirname(os.path.abspath(__file__)))

PACKAGE_NAME = "mintinstall-pro"
VERSION = "2.0.0"
DEB_DIR = f"/tmp/{PACKAGE_NAME}_{VERSION}_amd64"
OUTPUT_DEB = f"{PACKAGE_NAME}_{VERSION}_amd64.deb"

# 1. Compilar binário release Rust
env = os.environ.copy()
env["RUSTUP_HOME"] = "/home/yurix/Documentos/solid_blend/.runtime/rustup"
env["CARGO_HOME"] = "/home/yurix/Documentos/solid_blend/.runtime/cargo"
env["PATH"] = (
    "/home/yurix/Documentos/solid_blend/.runtime/rustup/toolchains/1.99.1-x86_64-unknown-linux-gnu/bin:"
    + env["PATH"]
)
subprocess.run(["cargo", "build", "--release"], check=True, env=env)

# 2. Preparar estrutura do pacote Debian
if os.path.exists(DEB_DIR):
    shutil.rmtree(DEB_DIR)

os.makedirs(f"{DEB_DIR}/DEBIAN", exist_ok=True)
os.makedirs(f"{DEB_DIR}/usr/bin", exist_ok=True)
os.makedirs(f"{DEB_DIR}/usr/share/{PACKAGE_NAME}", exist_ok=True)
os.makedirs(f"{DEB_DIR}/usr/share/applications", exist_ok=True)
os.makedirs(f"{DEB_DIR}/usr/share/icons/hicolor/scalable/apps", exist_ok=True)
os.makedirs(f"{DEB_DIR}/usr/share/icons/hicolor/32x32/apps", exist_ok=True)

# Copiar binário executável
shutil.copy("target/release/mintinstall-pro", f"{DEB_DIR}/usr/bin/{PACKAGE_NAME}")
os.chmod(f"{DEB_DIR}/usr/bin/{PACKAGE_NAME}", 0o755)

# Copiar assets web dist e ícone
src_dist = "dist"
if os.path.exists(src_dist):
    shutil.copytree(src_dist, f"{DEB_DIR}/usr/share/{PACKAGE_NAME}/dist", dirs_exist_ok=True)

if os.path.exists("icon_mip.svg"):
    shutil.copy("icon_mip.svg", f"{DEB_DIR}/usr/share/{PACKAGE_NAME}/icon_mip.svg")
    shutil.copy("icon_mip.svg", f"{DEB_DIR}/usr/share/icons/hicolor/scalable/apps/{PACKAGE_NAME}.svg")

if os.path.exists("dist/favicon-32.png"):
    shutil.copy("dist/favicon-32.png", f"{DEB_DIR}/usr/share/icons/hicolor/32x32/apps/{PACKAGE_NAME}.png")

# 3. Criar lançador Desktop (.desktop)
desktop_entry = f"""[Desktop Entry]
Type=Application
Name=Gerenciador de Aplicativos
GenericName=Gerenciador de Pacotes e Aplicativos
Comment=Instale, gerencie e remova aplicativos APT e Flatpak
Comment[pt_BR]=Instale, gerencie e remova aplicativos APT e Flatpak
Exec={PACKAGE_NAME}
Icon={PACKAGE_NAME}
Terminal=false
Categories=GNOME;GTK;System;Settings;PackageManager;
Keywords=software;package;apt;flatpak;flathub;install;uninstall;programas;loja;
StartupNotify=true
"""

with open(f"{DEB_DIR}/usr/share/applications/{PACKAGE_NAME}.desktop", "w", encoding="utf-8") as f:
    f.write(desktop_entry)

# 4. Calcular tamanho instalado (Installed-Size em KiB)
installed_size_kb = 0
for root, _, files in os.walk(DEB_DIR):
    for f in files:
        if "DEBIAN" not in root:
            fp = os.path.join(root, f)
            installed_size_kb += os.path.getsize(fp) // 1024

# 5. Criar arquivo de controle Debian com descrição completa e metadados oficiais
control = f"""Package: {PACKAGE_NAME}
Version: {VERSION}
Section: admin
Priority: optional
Architecture: amd64
Installed-Size: {installed_size_kb}
Depends: libgtk-4-1, libwebkitgtk-6.0-4
Recommends: flatpak, policykit-1
Maintainer: Yuri Schmaltz <yuri.schmaltz@gmail.com>
Homepage: https://github.com/yuri-schmaltz/mintinstall_pro
Description: Gerenciador de Aplicativos Moderno para Linux Mint (Pro)
 Interface inspirada no Linux Mint com catálogo completo de pacotes APT
 e Flatpak (Flathub), categorias dinâmicas, busca instantânea e carrosséis
 de aplicativos em destaque e mais bem avaliados.
 .
 Recursos inclusos:
  * Motor nativo de alta performance escrito em Rust com GTK4 e WebKit6.
  * Operações em lote (batch) de instalação e desinstalação seguras.
  * Proteção ativa de componentes essenciais e pacotes base do sistema.
  * Gerenciamento de repositórios APT (PPAs) e remotos Flatpak.
  * Gerenciador de chaves GPG confiáveis de repositórios externos.
  * Integração com Snapshots de sistema via Timeshift.
  * Instalação rápida de pacotes Debian (.deb) locais.
  * Histórico de operações persistente e notificações desktop nativas.
"""

with open(f"{DEB_DIR}/DEBIAN/control", "w", encoding="utf-8") as f:
    f.write(control)

# 6. Scripts postinst e postrm para atualizar caches de ícones e desktop
postinst_content = """#!/bin/sh
set -e
if which update-desktop-database >/dev/null 2>&1; then
    update-desktop-database -q /usr/share/applications || true
fi
if which gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache -q /usr/share/icons/hicolor || true
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
if which gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache -q /usr/share/icons/hicolor || true
fi
exit 0
"""
with open(f"{DEB_DIR}/DEBIAN/postrm", "w", encoding="utf-8") as f:
    f.write(postrm_content)
os.chmod(f"{DEB_DIR}/DEBIAN/postrm", 0o755)

# 7. Construir o pacote .deb com dpkg-deb
os.chmod(DEB_DIR, 0o755)
os.chmod(f"{DEB_DIR}/DEBIAN", 0o755)

subprocess.run(["dpkg-deb", "--build", "--root-owner-group", DEB_DIR, OUTPUT_DEB], check=True)
shutil.rmtree(DEB_DIR)

size_mb = os.path.getsize(OUTPUT_DEB) / (1024 * 1024)
print(f"✅ Pacote {OUTPUT_DEB} gerado com sucesso! ({size_mb:.2f} MB)")
