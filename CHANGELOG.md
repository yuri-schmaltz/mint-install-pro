# Changelog - Mint Install Pro (Rust)

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

## [0.1.0] - 2026-10-30

### Migração Completa para Rust Nativo (100%)
- **Interface Gráfica Virtualizada**:
  - Implementação de `gtk4::ListView` associada a `gio::ListStore` e `SignalListItemFactory` com reciclagem de linha, substituindo o antigo `ListBox`.
  - Filtragem instantânea via `gtk4::CustomFilter` e `gtk4::FilterListModel` para pesquisa textual e categorias.
  - Seleção em lote integrada com atualização dinâmica da barra de ações.
  - Diálogo de detalhes de aplicativos acionado por ativação de linha na `ListView`.
- **Backend Nativo em Rust**:
  - Catálogo de aplicativos híbrido: suporte a leitura local e fallback compilado (`include_str!`).
  - Proteção de segurança (`assert_safe_apt_removal`) integrada às remoções em lote para evitar desinstalação acidental de pacotes essenciais e componentes de sessão.
  - Diálogo e gerenciamento de AppImages locais (`appimage_inventory`).
  - Suporte completo a repositórios APT (PPA) e remotos Flatpak (Flathub user remote check).
  - Gerenciamento de histórico, notificações (`notify-send`) e configurações persistentes.
- **Qualidade e Estabilidade de Código**:
  - Eliminação de todos os warnings do compilador.
  - Clippy com zero alertas (`cargo clippy --all-targets -- -D warnings`).
  - Formatação com `cargo fmt`.
  - Suíte de testes de integração cobrindo backend, inventário, segurança, propriedades do AppItem e filtragem de ListStore.
- **Empacotamento e Distribuição**:
  - Script de empacotamento Debian `build_deb_rust.py` atualizado.
  - Geração de pacote autônomo `mintinstall-rust_0.1.0_amd64.deb`.

