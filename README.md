# Mint Install Pro (Rust Nativo)

Gerenciador e instalador avançado de aplicativos para Linux Mint e distribuições Debian/Ubuntu-like, reescrito totalmente em Rust nativo utilizando GTK4.

## Destaques da Versão Rust
- **GTK4 Nativo & Virtualizado**: Renderização moderna com `gtk4::ListView`, `gio::ListStore` e `SignalListItemFactory` com reciclagem de widgets para fluidez mesmo com milhares de itens.
- **Filtros Reativos**: Filtro em tempo real por busca de texto (nome e resumo) e categorização via `gtk4::CustomFilter` e `gtk4::FilterListModel`.
- **Desempenho & Memória**: Consumo mínimo de memória e CPU; tempo de inicialização instantâneo.
- **Catálogo Resiliente**: Busca catálogo no sistema de arquivos ou utiliza o catálogo JSON embarcado diretamente no binário (`include_str!`).
- **Segurança APT Reforçada**: Verificação de componentes protegidos/essenciais do sistema antes de remoções em lote (`assert_safe_apt_removal`).
- **Gerenciamento Completo**:
  - Suporte híbrido APT e Flatpak (Flathub).
  - Operações em lote (instalação e desinstalação sequencial com barra de progresso).
  - Verificação de atualizações (`apt` e `flatpak`).
  - Histórico de operações persistente e notificações desktop via `notify-send`.
  - Preferências do usuário persistidas em JSON.
  - Exportação e importação de listas de backup.
  - Inventário e execução de AppImages locais.
  - Ferramentas de sistema: Limpeza de pacotes órfãos, Repositórios/PPAs, Chaves GPG, Snapshots Timeshift, Instalação avulsa por ID e `.deb` local.

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

