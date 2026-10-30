# Mint Install Pro

Gerenciador e instalador avançado de aplicativos para Linux Mint e distribuições Debian/Ubuntu-like, reescrito totalmente em Rust nativo utilizando GTK4, WebKit6 e Axum.

Para mais detalhes sobre a concepção e arquitetura do projeto, consulte o arquivo [ABOUT.md](ABOUT.md).

## Destaques da Versão Rust
- **Interface Gráfica Refinada**: Experiência visual nativa com layout de proporção fixa, carrosséis em destaque, grid de categorias e modais completos.
- **Backend Rust Integrado**: Servidor local em Axum/Tokio incorporado no mesmo processo do executável, dispensando daemons externos e dependências de runtime Python/Node.
- **Catálogo Resiliente**: Busca catálogo no sistema de arquivos ou utiliza o catálogo JSON embarcado diretamente no binário (`include_str!`).
- **Segurança APT Reforçada**: Verificação e bloqueio preventivo de componentes essenciais e pacotes base do sistema antes de qualquer remoção (`assert_safe_apt_removal`).
- **Gerenciamento Completo**:
  - Suporte híbrido APT e Flatpak (Flathub).
  - Operações em lote (instalação e desinstalação sequencial protegida com uma única autorização por lote).
  - Verificação de atualizações (`apt` e `flatpak`).
  - Histórico de operações persistente e notificações desktop via `notify-send`.
  - Preferências do usuário persistidas em JSON.
  - Exportação e importação de listas de backup.
  - Inventário e execução de AppImages locais.
  - Ferramentas de sistema: Limpeza de pacotes órfãos, Repositórios/PPAs, Chaves GPG seguras, Snapshots Timeshift, Instalação por ID e `.deb` local.

## Compilação e Desenvolvimento

### Pré-requisitos
- Toolchain Rust (edição 2021)
- Bibliotecas GTK4 de desenvolvimento (`libgtk-4-dev`)

### Compilando em modo Debug
```bash
cargo build
```

### Executando os Testes
```bash
cargo test
```

### Verificação de Código e Formatação
```bash
cargo clippy --all-targets -- -D warnings
cargo fmt -- --check
```

### Compilando Binário Release
```bash
cargo build --release
```
O binário será gerado em `target/release/mintinstall_rust`.

## Geração do Pacote Debian (.deb)
Para gerar o instalador `.deb` autônomo:
```bash
python3 build_deb_rust.py
```
O pacote `mintinstall-rust_0.1.0_amd64.deb` será gerado na raiz do diretório.

Para instalar no sistema:
```bash
sudo dpkg -i mintinstall-rust_0.1.0_amd64.deb
sudo apt-get install -f # se houver dependências pendentes
```

