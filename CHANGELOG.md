# Histórico de Alterações (Changelog)

Todas as alterações notáveis do projeto **Mint Install Pro** são documentadas neste arquivo, seguindo as diretrizes do [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e aderindo ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [1.3.0] - 2026-09-02

### Adicionado
- **Catálogo Oficial Expandido (1.800 Aplicativos)**: Extração direta dos caches de produção do Linux Mint (`pkginfo.json` e `reviews.json`), fornecendo exatamente 200 aplicativos por categoria (Acessórios, Desenvolvimento, Escritório, Gráficos, Internet, Jogos, Mídia e Sistema) ordenados por pontuação real da comunidade.
- **200 Flatpaks Mais Baixados do Flathub**: Integração de 200 aplicativos populares do Flathub com métricas de downloads mensais e ratings de favoritos.
- **Ícones Oficiais da Aplicação Legada**: Adoção do vetor SVG escalável (`mintinstall.svg`) e renderizações rasterizadas em alta definição do tema oficial Mint-Y.
- **Gerenciador Padrão do Sistema (XDG MIME)**: Opção no painel de Preferências e no pacote `.deb` para associar esquemas `appstream://`, `apt://` e pacotes `.deb`/`.flatpakref`.
- **Rolagem Contínua (Infinite Scroll)**: Auto-carregamento dinâmico de novos aplicativos à medida que o usuário rola a lista, dispensando cliques manuais.
- **Suíte de Testes Expandida**: 69 testes unitários e de conformidade visual/estrutural aprovados com 100% de sucesso.

### Modificado
- **Interface Edge-to-Edge**: Remoção de molduras redundantes e controles de janela duplicados, permitindo que a aplicação ocupe 100% da janela nativa do Cinnamon.
- **Separação Destaques x Instalados**: Correção do filtro de visualização para que a aba "Destaques" retorne de forma confiável à Landing Page.
- **Correção de Truncamento no AppCard**: O badge "Desinstalar" agora mantém largura estática visível mesmo para apps com nomes longos.

---

## [1.2.0] - 2026-09-02

### Adicionado
- **Cromatografia Dinâmica de Desinstalação**: Transição automática para fundo vermelho/laranja escuro na mesma paleta do verde Mint ao desmarcar um aplicativo instalado no checkbox.
- **Check Verde Integrado**: O status de instalado agora é exibido e resolvido diretamente no interior do checkbox de seleção à esquerda.
- **Distribuição Uniforme da Barra de Abas (100%)**: Todas as 11 abas agora se estendem uniformemente pela largura da janela com tamanhos proporcionais (`flex-1`) e conteúdo centralizado.
- **Badge de Contagem de Instalados**: Reposicionado no HeaderBar para o lado direito, entre "Sandbox Seguro" e o menu hambúrguer, adotando a geometria em cápsula fixa de 26px e suporte a overflow `+999`.
- **Rótulos Concisos**: Redefinição dos nomes das abas para *Sistema*, *Flatpak*, *Mídia* e *Todos*, eliminando barras de rolagem horizontais.

---

## [1.1.0] - 2026-09-02

### Adicionado
- **Matriz 3x3 de Categorias**: Criação das novas categorias *Desenvolvimento* e *Escritório*, totalizando 9 categorias regulares dispostas em grid simétrico.
- **Contadores de Tamanho Fixo com Overflow (+999)**: Padronização das cápsulas de contagem para `w-[82px] h-[26px]` com prefixo `+` para contagens superiores a 999.
- **Central de Preferências Modular (`SettingsModal.jsx`)**: Modal GTK nativo no menu hambúrguer com 4 abas para controle de busca, Flatpaks, sandbox e manutenção de cache.
- **Ordenação Alfabética Estrita**: Aba *Destaques* como padrão inicial à extrema esquerda, *Todos* à extrema direita e as 9 intermediárias em ordem alfabética estrita.

---

## [1.0.0] - 2026-09-02

### Adicionado
- **Lançamento Inicial**: Clone de alta fidelidade do Gerenciador de Aplicativos oficial do Linux Mint (MintInstall).
- **UI Parity Mint-Y Dark**: Controles de janela Cinnamon, tipografia Ubuntu, paleta de cinzas carvão e acentos em verde Mint.
- **Catálogo Híbrido Expandido**: 183 aplicações integrando repositórios locais APT e catálogo oficial do Flathub.
- **Busca em Tempo Real no Flathub**: Conectividade via API REST v2 do Flathub com debounce e cache local.
- **Operações em Lote**: Instalação e desinstalação sequenciais com barra flutuante e terminal de simulação.
- **Suíte de Testes Automatizados**: 48 testes unitários e de conformidade no `scripts/test_runner.js`.
