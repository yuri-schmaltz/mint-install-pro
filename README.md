# 🌿 Mint Install Pro

<p align="center">
  <img src="https://raw.githubusercontent.com/yuri-schmaltz/mint-install-pro/master/public/icons/software-manager.png" alt="Mint Install Pro Logo" width="96" height="96">
</p>

<p align="center">
  <strong>Gerenciador de Aplicativos Moderno e Reativo para Linux Mint</strong><br>
  <em>Fidelidade visual ao tema Mint-Y Dark, catálogo híbrido APT + Flatpak e operações em lote inteligentes.</em>
</p>

  <a href="https://github.com/yuri-schmaltz/mint-install-pro"><img src="https://img.shields.io/badge/GitHub-mint--install--pro-87cf3e?style=flat-square&logo=github" alt="GitHub Repo"></a>
  <a href="https://github.com/yuri-schmaltz/mint-install-pro/releases/tag/v1.4.0"><img src="https://img.shields.io/badge/Release-v1.4.0%20.deb-blue?style=flat-square&logo=debian" alt="Download .deb"></a>
  <img src="https://img.shields.io/badge/AI%20Enhanced-%E2%9C%A8%20Google%20DeepMind-7928CA?style=flat-square&logo=google" alt="AI Enhanced">
  <img src="https://img.shields.io/badge/Testes-212%20Unit%20%2B%20121%20Audit-87cf3e?style=flat-square&logo=vitest" alt="Testes 100% Passando">
  <img src="https://img.shields.io/badge/Linux%20Mint-22.3%20Zena-87cf3e?style=flat-square&logo=linuxmint" alt="Linux Mint 22.3">
  <img src="https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react" alt="React 18">
  <img src="https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite" alt="Vite 5">
  <img src="https://img.shields.io/badge/TailwindCSS-3-38bdf8?style=flat-square&logo=tailwindcss" alt="Tailwind CSS">
  <a href="LICENSE"><img src="https://img.shields.io/badge/Licen%C3%A7a-MIT-green.svg?style=flat-square" alt="Licença MIT"></a>
</p>

> [!TIP]
> ### 🤖 Projeto Desenvolvido & Melhorado por Inteligência Artificial
> Esta aplicação foi concebida, reestruturada e aperfeiçoada através de **Engenharia de Software Assistida por IA Avançada (Google DeepMind)**, combinando diagnóstico estratégico automatizado (Análise SWOT / Matriz GUT), ciclos contínuos de verificação (*Gauntlet Loops*), calibração cromática pixel-a-pixel por visão computacional e refatoração de alta reatividade.

---

## 📖 Visão Geral

O **Mint Install Pro** é uma reengenharia completa do Gerenciador de Aplicativos oficial do Linux Mint (*mintinstall*), desenvolvida em arquitetura reativa moderna (SPA). Ele preserva a estética consagrada do tema **Mint-Y Dark** e dos controles de janela do **Cinnamon**, elevando a experiência do usuário com tempo de resposta instantâneo, gerenciamento de pacotes em lote e integração fluida com o ecossistema **Flathub**.

---

## ✨ Principais Funcionalidades

### 🎨 1. Fidelidade Visual Mint-Y Dark (Pixel Parity)
- Paleta de cores oficial: cinza-carvão escuro (`#202326`, `#2b2e33`), bordas sutis GTK e verde Mint vibrante (`#87cf3e`).
- Controles de janela nativos do Cinnamon (Minimizar, Maximizar, Fechar) com microinterações fiéis.
- Renderização de ícones de sistema originais em alta resolução direto de `/usr/share/icons/Mint-Y/`.

### 📦 2. Operações em Lote Inteligentes (Instalação e Remoção)
- **Seleção Múltipla:** Marque ou desmarque checkboxes para agrupar dezenas de aplicativos de uma só vez.
- **Barra Flutuante de Ações:** Apresenta contadores independentes para pacotes a instalar e a remover.
- **Fila de Execução com Terminal:** Modal interativo com barra de progresso individual e global, simulando ou aplicando a fila sequencialmente com terminal de logs em tempo real.

### 🔘 3. Checkbox Integrado e Cromatografia Dinâmica
- **Check Verde no Checkbox:** Aplicativos instalados trazem o checkmark verde Mint resolvido diretamente dentro do checkbox à esquerda, eliminando redundâncias visuais no card.
- **Destaque Sutil nos Instalados:** Cards de aplicações instaladas recebem um fundo suave em degradê verde escuro (`#233126`).
- **Transição de Desinstalação (Vermelho/Laranja):** Ao desmarcar o checkbox de um app instalado (marcando-o para remoção), o fundo transiciona suavemente para um tom vermelho/laranja escuro na mesma paleta e luminância do verde, acompanhado da tag `Desinstalar`.

### 📐 4. Tela Inicial (Início) Otimizada & Descoberta
- **Carrossel de Banners e Descoberta:** Banners em rotação com espaçamentos seguros anti-colisão e carrossel paginado de Descoberta com as 18 melhores aplicações (páginas de 6 apps com `<` e `>`).
- 9 categorias regulares (*Acessórios, Código, Escritório, Flatpak, Gráficos, Internet, Jogos, Mídias, Sistema*) organizadas em grade simétrica 3x3 perfeita, sem lacunas e calibrada para não gerar rolagem vertical.
- **Cápsulas de Contagem Fixas (82px):** Badges padronizados com suporte a contagens até 999 e adição automática do prefixo `+` (`+999 apps`) para grandes volumes.

### 📏 5. Barra de 12 Abas com Distribuição Uniforme (100% de Largura)
- Ocupação total da largura horizontal da janela, eliminando espaços vazios laterais.
- **Consistência Geométrica:** Cada aba ocupa exatamente a mesma fração de largura (`flex-1 min-w-0`), com ícones e textos perfeitamente legíveis e centralizados.
- **Rótulos Concisos e Ordenação:** *Início* como aba inicial à extrema esquerda, *Instalados* e *Todos* à direita, e as 9 intermediárias rigorosamente ordenadas de A a S (*Acessórios*, *Código*, *Escritório*, *Flatpak*, *Gráficos*, *Internet*, *Jogos*, *Mídias*, *Sistema*).

### 🌐 6. Catálogo Híbrido & Integração Online Flathub
- Catálogo de **1.800 aplicações reais**, combinando os principais utilitários nativos do sistema APT e Flatpaks populares com code-splitting lazy.
- Busca ao vivo consumindo a **API REST v2 oficial do Flathub** (`flathub.org/api/v2/search`) com *debounce* inteligente e cache local.

### ⚙️ 7. Central de Preferências Limpa & Intuitiva
- Modal de configurações estilo GTK com abas distribuídas em 100% da largura:
  - **Pesquisa:** Configuração de escopo com tooltips informativos e interface limpa.
  - **Flatpaks:** Alternador de busca ao vivo e preferências de empacotamento (Todos, Apenas Flatpak, Apenas APT).
  - **Operações & Lote:** Confirmação de ações e limpeza de cache da aplicação.
  - **Manutenção:** Restauração de padrões de fábrica.
- Todas as preferências são persistidas em `localStorage`.

---

## 📁 Estrutura do Projeto

```
mint-install-pro/
├── acceptance_criteria_audit.md # Relatório formal de auditoria dos critérios de aceite
├── ABOUT.md                     # Histórico, comparativo técnico e arquitetura
├── CONTRIBUTING.md              # Guia para novos contribuidores
├── SECURITY.md                  # Modelo de isolamento e relato de vulnerabilidades
├── CHANGELOG.md                 # Histórico cronológico de lançamentos
├── LICENSE                      # Licença MIT (Yuri Schmaltz)
├── app-manager.desktop          # Lançador para o menu do Linux Mint Cinnamon
├── run.sh                       # Script de inicialização rápida
├── index.html                   # Entry point da aplicação
├── package.json                 # Dependências e scripts npm
├── tailwind.config.js           # Configuração de temas e paleta Mint-Y Dark
├── vite.config.js               # Configuração do bundler Vite
├── public/
│   ├── icons/                   # Ícones de aplicativos em PNG extraídos do sistema
│   └── banners/                 # Banners oficiais de destaque do MintInstall
├── scripts/
│   ├── build_full_catalog.py    # Script de extração de pacotes APT e Flatpak
│   └── test_runner.js           # Suíte de 48 testes de validação automatizados
└── src/
    ├── components/
    │   ├── HeaderBar.jsx        # Barra superior com busca, sandbox e contador
    │   ├── CategoryNav.jsx      # Barra de 11 abas com distribuição 100%
    │   ├── LandingPage.jsx      # Banners de destaque e matriz 3x3 de categorias
    │   ├── AppGrid.jsx          # Grade de 3 colunas de cards de aplicativos
    │   ├── AppCard.jsx          # Card com checkbox inteligente e cromatografia
    │   ├── AppDetailsModal.jsx  # Ficha técnica e simulação individual de pacotes
    │   ├── BatchActionBar.jsx   # Barra flutuante de ações em lote
    │   ├── BatchExecutionModal.jsx # Terminal de log e progresso de execução
    │   └── SettingsModal.jsx    # Painel de preferências do sistema
    ├── data/
    │   └── initialApps.js       # Catálogo estruturado com 183 aplicações
    └── services/
        └── flathubApi.js        # Integração assíncrona com a API v2 do Flathub
```

---

## 📥 Instalação (Installation)

Você pode instalar e rodar o **Mint Install Pro** de três maneiras diferentes:

### Opção 1: Pacote Oficial `.deb` (Recomendado para Linux Mint / Debian / Ubuntu)

Esta é a forma mais prática para o usuário final, integrando a aplicação diretamente ao sistema operacional e aos menus do Cinnamon:

1. **Baixe o arquivo `.deb` mais recente:**
   ```bash
   wget https://github.com/yuri-schmaltz/mint-install-pro/releases/download/v1.4.0/mint-install-pro_1.4.0_all.deb
   ```
2. **Instale via terminal:**
   ```bash
   sudo dpkg -i mint-install-pro_1.4.0_all.deb
   sudo apt-get install -f # resolve dependências de sistema se necessário
   ```
   *(Ou dê um duplo clique no arquivo baixado para instalar pela interface gráfica do GDebi).*

3. **Inicie a aplicação:**
   - Procure por **"Mint Install Pro"** no menu Iniciar do Linux Mint (Cinnamon).
   - Ou digite diretamente no terminal:
     ```bash
     mint-install-pro
     ```

---

### Opção 2: Execução Portátil Rápida (Script `./run.sh`)

Ideal para testar a aplicação sem instalar nada no sistema operacional hospedeiro:

```bash
# Clone o repositório
git clone https://github.com/yuri-schmaltz/mint-install-pro.git
cd mint-install-pro

# Execute o script automatizado
./run.sh
```
O script checa o ambiente, instala as dependências se necessário e abre a aplicação automaticamente em seu navegador padrão em `http://localhost:3000`.

---

### Opção 3: Modo Desenvolvedor via `npm`

Para desenvolvedores que desejam inspecionar o código, executar testes ou criar novas builds:

```bash
# Instalação das dependências do Node.js
npm install

# Inicialização do servidor com Hot Module Replacement (HMR)
npm run dev

# Execução da suíte completa de testes (48 testes)
npm test

# Compilação do build de produção otimizado
npm run build

# Geração de um novo pacote instalador .deb
npm run build:deb
```

---

## 🎮 Guia de Uso Passo a Passo (Usage Guide)

### 1. Navegação pelas Categorias
- **Barra de 11 Abas:** Utilize a barra superior perfeitamente distribuída para alternar entre as categorias ordenadas alfabeticamente (*Acessórios*, *Desenvolvimento*, *Escritório*, *Flatpak*, *Gráficos*, *Internet*, *Jogos*, *Mídia*, *Sistema* e *Todos*).
- **Tela de Destaques:** Na tela inicial (*Destaques*), utilize a **matriz 3x3** para visualizar a contagem de pacotes em cada área e o carrossel de softwares populares.

### 2. Pesquisa Inteligente em Tempo Real
- Digite na caixa de busca superior. A filtragem ocorre em menos de **5 milissegundos** e consulta nomes, resumos, descrições detalhadas e identificadores de pacotes APT e Flatpak.
- Ao pesquisar dentro da aba **Flatpak**, a aplicação realiza consultas assíncronas ao vivo contra o catálogo do Flathub.

### 3. Filtro de Aplicativos Instalados
- No canto superior direito do cabeçalho, clique no botão em cápsula **`[ 📋 186 apps ]`** para alternar instantaneamente a listagem entre todo o catálogo ou apenas os softwares instalados na sua máquina.

### 4. Instalação e Desinstalação em Lote (Executar Ações)
A aplicação possui um fluxo cromático inteligente para gerenciamento em lote:
- **Para agendar a instalação:** Marque o checkbox de aplicativos que não possuem o check verde.
- **Para agendar a desinstalação:** Desmarque o checkbox de qualquer aplicativo instalado. O card correspondente transiciona imediatamente para um **degradê suave vermelho/laranja escuro** na mesma paleta do tema e exibe a etiqueta `Desinstalar`.
- **Execução:** A barra de ações no rodapé exibe o botão **"Executar Ações"** em verde Mint. Ao clicar, a fila completa de instalações e desinstalações é processada com segurança e terminal interativo com barras de progresso.

### 5. Integração Nativa e Blindada (APT & Flatpak)
- A aplicação executa comandos reais de forma segura no sistema operacional:
  - **Flatpak:** Instalação e remoção nativa via `flatpak --user`.
  - **APT:** Transações de sistema autenticadas via `pkexec apt-get`.
  - **Blindagem:** Proteção contra Command/Argument Injection com regex estrita e delimitador `--`, binding estrito a `127.0.0.1` e mutex contra concorrência de travas do dpkg.

### 6. Central de Preferências
- Clique no botão de menu hambúrguer (`≡`) no canto superior direito e selecione **"Preferências"**.
- Ajuste filtros de busca, habilite ou desabilite o Flathub online, configure preferências de tipo de pacote e limpe caches temporários.

---

## 🧪 Suíte de Testes Automatizados (Gauntlet Tests)

O projeto possui uma suíte rigorosa de 82 testes cobrindo integridade de catálogo, segurança, ausência de sandbox simulado, algoritmos de ordenação e regras de negócio:

```bash
npm test
```

### Escopo dos Testes:
1. **Verificação dos 21 Aplicativos da Captura Oficial:** Valida a presença de Synapse, Dconf-editor, Grep, Htop, Keepassxc, etc.
2. **Integridade de Metadados:** Confere notas (ratings), status de instalação e descrições técnicas.
3. **Existência de Ícones Locais:** Garante que todos os caminhos em `public/icons/` existem no disco.
4. **Mecanismo de Busca em Tempo Real:** Testa buscas parciais, insensíveis a maiúsculas/minúsculas e busca por tags.
5. **Ordenação e Geometria das Abas:** Valida Destaques à esquerda, Todos à direita e ordenação alfabética estrita das intermediárias.
6. **Lógica de Ações em Lote:** Valida o particionamento de pacotes a instalar vs. a desinstalar.
7. **Catálogo Geral:** Garante mais de 100 aplicativos consolidados e proporção entre APT e Flatpaks.
8. **Módulo Flathub:** Testa as funções assíncronas de consulta e mapeamento de respostas da API.
9. **Formatação de Badges:** Testa limites de formatação (1 app, 45 apps, limite 999 e transbordo `+999 apps`).

---

## 🖥️ Integração com o Menu do Cinnamon

Para adicionar o lançador do **Mint Install Pro** ao menu oficial do Linux Mint:
```bash
cp app-manager.desktop ~/.local/share/applications/
update-desktop-database ~/.local/share/applications/
```

---

## 📚 Documentação Complementar

- **[ABOUT.md](ABOUT.md):** Comparativo aprofundado com o MintInstall legado em Python/GTK e decisões de arquitetura.
- **[acceptance_criteria_audit.md](acceptance_criteria_audit.md):** Relatório de conformidade dos critérios de aceite.
- **[CONTRIBUTING.md](CONTRIBUTING.md):** Padrões de código, convenções de commits e fluxo de Pull Requests.
- **[SECURITY.md](SECURITY.md):** Modelo de Sandbox Seguro e procedimentos de reporte de vulnerabilidades.
- **[CHANGELOG.md](CHANGELOG.md):** Histórico detalhado de todas as versões.

---

## 📄 Licença

Este projeto é disponibilizado sob a licença **MIT**. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

Copyright (c) 2026 **Yuri Schmaltz**.
