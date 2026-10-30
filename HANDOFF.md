# Handoff: Migração do Mint Install Pro para Rust (GTK4 nativo)

## Estado atual (2026-10-30)
- **Migração Rust:** 100% concluída.
- **Backend:** 100% funcional em Rust nativo.
- **UI nativa:** 100% funcional com `ListView` virtualizada, `gio::ListStore`, `SignalListItemFactory` e `FilterListModel`.
- **Empacotamento:** `.deb` Rust gerado e testado (`mintinstall-rust_0.1.0_amd64.deb`).
- **Testes:** 12 testes de integração passando (9 em `basic.rs` e 3 em `list_and_safety.rs`).
- **Linters / Estilo:** Clippy e `cargo fmt` com 0 avisos/erros.

## Arquitetura

### Diretórios
- `mintinstall_rust/` — projeto Rust oficial (binário nativo GTK4).
- `mintinstall_pro/` — versão legada (React + Python).

### Backend (`src/backend.rs` e `src/lib.rs`)
- `load_catalog()` — carrega catálogo do disco ou utiliza o fallback compilado via `include_str!`.
- `installed_ids()` — inventário de pacotes instalados (APT + Flatpak).
- `run_install(id)` / `run_uninstall(id)` / `run_launch(id)` — execução segura de instalação, remoção e lançamento de aplicativos.
- `count_updates()` — detecção de atualizações pendentes (APT/Flatpak).
- `flathub_user_remote_available()` — verificação de disponibilidade do remoto Flathub para usuário.
- `apt_inventory()` e `assert_safe_apt_removal()` — proteção contra remoção acidental de pacotes essenciais ou componentes gráficos.
- `appimage_inventory()` — detecção e diálogo para execução de AppImages locais.
- `log_history()` / `desktop_notify()` — registro de ações em disco e envio de notificações nativas.
- `load_settings()` / `save_settings()` — persistência de preferências de usuário em JSON.

### UI Virtualizada (`src/main.rs` & `src/list_item.rs`)
- `list_item::AppItem` — GObject subclass (`glib::Object`) com campos de id, nome, resumo, categoria, status de instalação e seleção.
- `ListView` — renderização de lista virtualizada com reciclagem de linha (`SignalListItemFactory`), garantindo 60fps mesmo com milhares de itens.
- `FilterListModel` & `CustomFilter` — filtragem combinada e reativa para campo de busca e seletor de categorias.
- Barra de lote dinâmica para seleção múltipla e execução sequencial protegida com diálogo de progresso.
- Diálogos completos: Detalhes do aplicativo, Atualizações, Histórico, Limpeza, Instalação por ID/nome, Repositórios/PPA, Chaves GPG, Snapshots Timeshift, AppImages, .deb local e Preferências.

### Testes & Qualidade
- `cargo test`: 12 testes integrados cobrindo integridade do catálogo, detecção de Flatpaks, contagem de atualizações, persistência de preferências, checagem de integridade APT e filtragem na store.
- `cargo clippy --all-targets -- -D warnings`: Aprovado.
- `cargo fmt -- --check`: Aprovado.
