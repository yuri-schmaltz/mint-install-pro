# Changelog - Mint Install Pro (Rust)

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

## [2.0.0] - 2026-10-30

### Marco da Versão 2.0 (Reescrita Completa em Rust Nativo)
- **Nova Arquitetura de Alta Performance**:
  - Reescrita integral de todo o backend monolítico anterior para Rust nativo.
  - Servidor interno local baseado em **Axum** e **Tokio**, executando de forma assíncrona no mesmo processo do aplicativo.
  - Janela nativa em **GTK4** utilizando **WebKit6**, eliminando overhead de processos externos.
- **Interface e Layout Refinados**:
  - Janela com proporção fixa (`1200x780`) e redimensionamento travado, preservando fielmente o alinhamento e a diagramação visual.
  - Banner dinâmico com apps em destaque, grid de categorias temáticas, carrossel dos mais bem avaliados e modais completos.
- **Segurança Reforçada**:
  - Bloqueio estrito de remoção de componentes essenciais (`assert_safe_apt_removal`), incluindo proteção do `apt`, `systemd`, `libc6`, `dpkg` e ambientes de desktop (`cinnamon`, `muffin`, `lightdm`, `xorg`).
  - Importação segura de chaves GPG sem execução de subshell (`pkexec sh -c`).
  - Sanitização rigorosa de entradas contra command injection em comandos APT e Flatpak.
- **Empacotamento e Integração com o Linux Mint**:
  - Geração do pacote Debian oficial com `Installed-Size` real calculado.
  - Lançador `.desktop` integrado ao menu iniciar com ícones temáticos nos padrões Hicolor (`scalable` e `32x32`).
  - Triggers automáticos de atualização de banco de dados desktop e cache de ícones.

## [0.1.0] - 2026-10-30
- Protótipo inicial da migração para Rust.

