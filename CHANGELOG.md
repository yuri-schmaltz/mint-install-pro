# Histórico de Alterações (Changelog)

Todas as alterações notáveis do projeto **Mint Install Pro** são documentadas neste arquivo, seguindo as diretrizes do [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e aderindo ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [1.3.1] - 2026-09-07

### Corrigido (round 2)
- **Frontend ignorava HTTP 503 do `/api/installed`**: o backend passou a distinguir "flatpak ausente" de "flatpak instalado mas sem apps" via status 503 + warning, mas o `App.jsx` engolia o status code. Agora `App.jsx` tem estado `flatpakStatus` ('unknown' | 'available' | 'missing') que dispara o badge "Flatpak ausente" no header.
- **Deduplicação cross-kind silenciosa em `build_full_catalog.py`**: o gerador usava `seen_ids = set()` que descartava apps onde um APT e um Flatpak compartilhavam o mesmo id (ex: 'firefox' nos dois lados). Refatorado para `seen_pairs = set()` de tuplas `(id, kind)`. Agora ambos coexistem no catálogo quando há overlap.
- **UX ruim durante o fetch lazy do catálogo**: com o code-split (round 1), o usuário via "Ver todos (0)" e grid vazio durante o fetch. Adicionado estado `catalogLoading` + skeletons animados em `LandingPage` (banner + matriz 3x3 com 9 placeholders) e `AppGrid` (9 cards placeholder com shimmer). Mensagem "Carregando destaques..." no centro do banner skeleton.
- **`build_full_catalog.py` não injetava `kind`**: o gerador criava apps sem a tag, dependendo do `migrate_catalog.py` como passo separado. Agora injeta `kind: 'apt' | 'flatpak'` direto na geração, então `migrate_catalog.py` vira puro retrofit para catálogos legados.

### Adicionado (round 2)
- **Badge "Flatpak ausente" no `HeaderBar`**: cápsula amber `AlertTriangle + "Flatpak ausente"` exibida entre o contador de instalados e o menu hambúrguer, apenas quando `flatpakStatus === 'missing'`. `hidden sm:flex` pra não poluir mobile.
- **Loading state propagado**: `App.jsx` → `LandingPage` e `AppGrid` via prop `isLoading`. Skeleton com `animate-pulse` no padrão Mint-Y Dark.
- **`loadCatalogIndex()` importado** em `App.jsx` (preparado para fase futura que vai usar o índice leve de 8 KB em vez do array completo de 1 MB na primeira render).

### Modificado (round 2)
- **`App.jsx`**: extraído o estado de loading do catálogo e de status do flatpak em hooks dedicados. Adicionado `loadCatalogIndex` ao import do `services/catalog.js`.
- **`LandingPage.jsx`**: aceita `isLoading` e renderiza early return com skeleton (não renderiza o grid de verdade durante o loading para evitar flash de empty state → grid).
- **`AppGrid.jsx`**: aceita `isLoading` e renderiza 9 cards placeholder com `key="skel-${i}"` para evitar colisão com IDs reais.

### Infraestrutura (round 2)
- Suíte de testes ampliada de **100 para 118 asserções** (+18):
  - Test 17: Loading state + tratamento de flatpak ausente (13 asserções).
  - Test 19: Deduplicação cross-kind no `build_full_catalog.py` (5 asserções).
- 5 commits adicionais no stack PR-ready (12 no total desde 1.3.0).

---

## [1.3.1] - 2026-09-05

### Corrigido
- **Crash no terminal de progresso em lote**: `BatchActionModal.jsx` referenciava `isInstall` (variável inexistente), quebrando a barra de progresso em **qualquer execução em lote** (install, uninstall ou misto). A barra agora deriva de `actionType` e usa cor verde para a ação predominante, com fallback para rosa em desinstalações puras.
- **Import órfão de `Play` em `BatchActionModal.jsx`**: o ícone era usado no header do modal mas o import havia sido removido em algum refactor anterior. Adicionado de volta junto com a limpeza de `AlertCircle` e `CheckCircle2` que eram importados sem uso.
- **Versão hardcoded "6.1.4" no modal "Sobre"**: substituída por `APP_VERSION` dinâmico injetado pelo Vite a partir de `package.json`. Atualizar a versão agora é uma linha em `package.json`, sem caça a strings hardcoded.
- **Falsa "Flatpak vazia" quando flatpak não está instalado**: o endpoint `/api/installed` retornava silenciosamente `flatpaks: []` em qualquer erro, confundindo o usuário. Agora distingue `ENOENT` (Flatpak não instalado) via status HTTP 503 com mensagem explícita, e trata erros de execução reais como "sem apps Flatpaks instalados".
- **Heurística frouxa de "é Flatpak"**: a função `isFlatpakApp()` agora é centralizada em `App.jsx` e considera o campo explícito `kind` (novo) antes de cair no fallback heurístico. Adicionada em todos os pontos onde era duplicada (App.jsx, packageManager.js, flathubApi.js).
- **Fallback de ícone inconsistente no Flathub**: `searchFlathub` usava `/flatpak-icon.svg` e `getPopularFlathub` usava `/icons/software-manager.png`. Agora ambos usam a constante `FALLBACK_FLATPAK_ICON`.

### Adicionado
- **Tag explícita `kind` em todos os 1.800 apps** do catálogo: `'apt'` ou `'flatpak'`, decidida por heurística determinística + reescrita idempotente via `scripts/migrate_catalog.py`. Elimina ambiguidade e permite que `isFlatpakApp()` seja uma simples comparação de string.
- **Code-split do catálogo (carregamento lazy)**:
  - `src/data/initialApps.js` (32k linhas) deixa de ser importado estaticamente pelo `App.jsx`.
  - Catálogo agora é carregado como `public/data/catalog.json` (1.07 MB minificado) via `fetch()` em `services/catalog.js`.
  - Pré-carregamento via `requestIdleCallback` em background para a próxima navegação.
  - Bundle inicial cai de **1.2 MB para 220 KB** (gzipped: de 244 KB para 73 KB).
  - `categoriesList` extraído para `src/data/categoriesList.js` (59 linhas) e re-exportado de `initialApps.js` para compat com o test runner.
  - `catalog-index.json` (8 KB) carrega primeiro, com contagens por categoria e featured top-6, para a `LandingPage` renderizar sem o array completo.
- **GitHub Actions CI** em `.github/workflows/ci.yml`:
  - Job `test-and-build` em matrix Node 18/20/22 + Ubuntu (5 combinações).
  - Job `deb-package` em Ubuntu 22.04 com `dpkg-dev` e `python3` para empacotar o `.deb`.
  - Job `lint` que re-roda `migrate_catalog.py` e falha se `public/data/` divergir do commit.
  - Artifacts de `dist/` e `*.deb` upados para inspeção.
- **Módulo `src/services/catalog.js`**: nova API de carregamento lazy com cache em memória, fallback automático e helper `prefetchCatalog()`.
- **`isFlatpakApp(app)`** centralizado em `App.jsx` e usado em todos os pontos onde a detecção era duplicada.

### Modificado
- **`vite.config.js`**: injeta `import.meta.env.VITE_APP_VERSION` a partir de `package.json` automaticamente (mais um motivo pra manter a versão sincronizada em um só lugar).
- **`App.jsx`**: estado inicial de `apps` agora é array vazio; o useEffect dispara o fetch lazy e faz merge com o `localStorage` (preserva edições manuais de `installed`).

### Infraestrutura
- Bumped versão: 1.3.0 → 1.3.1.
- Suíte de testes ampliada de **81 para 99 asserções** cobrindo:
  - Existência e consistência da tag `kind` em todos os apps.
  - Code-split do catálogo (JSON lazy presente e menor que o .js).
  - Bug fixes da 1.3.0→1.3.1 como regression tests.
  - Centralização da heurística `isFlatpakApp`.
- Scripts auxiliares: `scripts/migrate_catalog.py` (idempotente, regenera `initialApps.js` + `catalog.json` + `catalog-index.json`).

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
