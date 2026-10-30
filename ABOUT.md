# Sobre o Mint Install Pro (Rust Nativo)

O **Mint Install Pro** é um gerenciador e instalador de aplicativos moderno e de alta performance desenvolvido por **Yuri Schmaltz** para Linux Mint e distribuições Debian/Ubuntu-like.

Esta versão representa a evolução arquitetural completa do projeto: o backend monolítico anterior em Python foi totalmente reescrito em **Rust nativo**, utilizando **GTK4**, **WebKit6**, **Tokio** e **Axum**, mantendo a identidade visual refinada inspirada no Linux Mint e no tema Mint-Y Dark.

---

## Funcionalidades Principais

- **Catálogo Abrangente & Resiliente**:
  - Mais de 1.800 aplicativos catalogados com categorias intuitivas, ícones dedicados e busca em tempo real.
  - Suporte híbrido ao catálogo: leitura dinâmica em disco ou fallback embarcado diretamente no binário compilado.
  - Suporte à busca online de pacotes modernos diretamente no Flathub.
- **Gerenciamento Híbrido Completo**:
  - Gerenciamento unificado de pacotes de sistema (**APT**) e sandboxed (**Flatpak / Flathub**).
  - Inventário e execução direta de **AppImages** locais detectados no sistema (`~/Applications`, `~/.local/bin`, `/opt`).
  - Instalador rápido de pacotes Debian locais (`.deb`).
- **Operações Seguras e em Lote (Batch)**:
  - Seleção múltipla para instalação e remoção de vários programas em uma única fila sequencial.
  - Autorização administrativa unificada por lote via `pkexec`.
  - **Proteção Ativa do Sistema**: Bloqueio preventivo e automático de desinstalação de pacotes essenciais (`libc6`, `systemd`, `apt`, `dpkg`, etc.) e componentes da interface gráfica (`cinnamon`, `muffin`, `lightdm`, `xorg`).
- **Ferramentas de Manutenção Avançada**:
  - Central de repositórios: Adição e remoção de PPAs e remotos Flatpak.
  - Gerenciador seguro de chaves GPG confiáveis em `/etc/apt/keyrings`.
  - Limpeza de sistema: Remoção de dependências órfãs (`apt autoremove`) e runtimes Flatpak não utilizados.
  - Criação rápida de pontos de restauração (snapshots) via **Timeshift**.
  - Verificação de dependências (`apt-cache depends` e `rdepends`).
  - Histórico de operações persistente e notificações desktop nativas (`notify-send`).

---

## Arquitetura da Versão Rust

| Camada | Tecnologia / Implementação |
|---|---|
| **Janela & WebView Nativo** | Rust, GTK4 (`gtk4`), WebKitGTK 6.0 (`webkit6`), janela de proporção fixa com aceleração gráfica |
| **Backend & Servidor Local** | Rust assíncrono, Tokio, Axum, Serde JSON (execução no mesmo processo do app) |
| **Interface do Usuário** | React 18, Tailwind CSS, Vite (empacotada em `dist/`) |
| **Segurança & Pacotes** | Validação estrita de identificadores, sanitização contra command injection e lista de pacotes protegidos |
| **Distribuição** | Pacote Debian autônomo (`.deb`) com metadados para o instalador oficial e integração com menu iniciar |

---

## Créditos e Licença

Desenvolvido por **Yuri Schmaltz** (<yuri.schmaltz@gmail.com>).  
Copyright © 2026. Todos os direitos reservados.  
Distribuído sob a licença [MIT](https://opensource.org/licenses/MIT).

