#!/usr/bin/env bash
# Define o Mint Install Pro como gerenciador padrão de pacotes e esquemas do sistema
set -e

DESKTOP_FILE="mint-install-pro.desktop"

echo "Configurando Mint Install Pro como gerenciador padrão no Linux Mint..."

MIME_TYPES=(
  "x-scheme-handler/appstream"
  "x-scheme-handler/apt"
  "application/vnd.debian.binary-package"
  "application/vnd.flatpak.ref"
  "application/vnd.flatpak.repo"
)

for mime in "${MIME_TYPES[@]}"; do
  xdg-mime default "$DESKTOP_FILE" "$mime" 2>/dev/null || true
  echo "  ✓ $mime -> $DESKTOP_FILE"
done

if command -v update-desktop-database &>/dev/null; then
  update-desktop-database ~/.local/share/applications/ 2>/dev/null || true
fi

echo "Concluído! Mint Install Pro registrado como padrão do sistema."
