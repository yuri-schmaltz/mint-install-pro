# 🌿 Mint Install Pro

<p align="center">
  <img src="public/icons/software-manager.png" alt="Mint Install Pro Logo" width="96" height="96">
</p>

<p align="center">
  <strong>Gerenciador de Aplicativos Moderno e Reativo para Linux Mint</strong><br>
  <em>Fidelidade visual ao tema Mint-Y Dark, catálogo híbrido APT + Flatpak e operações em lote inteligentes.</em>
</p>

<p align="center">
  <a href="https://github.com/yuri-schmaltz/mint-install-pro"><img src="https://img.shields.io/badge/GitHub-mint--install--pro-87cf3e?style=flat-square&logo=github" alt="GitHub Repo"></a>
  <a href="https://github.com/yuri-schmaltz/mint-install-pro/releases/tag/v1.2.0"><img src="https://img.shields.io/badge/Release-v1.2.0%20.deb-blue?style=flat-square&logo=debian" alt="Download .deb"></a>
  <img src="https://img.shields.io/badge/Testes-48%20Passando-87cf3e?style=flat-square&logo=vitest" alt="Testes 48/48">
  <img src="https://img.shields.io/badge/Linux%20Mint-22.3%20Zena-87cf3e?style=flat-square&logo=linuxmint" alt="Linux Mint 22.3">
  <img src="https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react" alt="React 18">
  <img src="https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite" alt="Vite 5">
  <img src="https://img.shields.io/badge/TailwindCSS-3-38bdf8?style=flat-square&logo=tailwindcss" alt="Tailwind CSS">
  <a href="LICENSE"><img src="https://img.shields.io/badge/Licen%C3%A7a-MIT-green.svg?style=flat-square" alt="Licença MIT"></a>
</p>

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

### 📐 4. Tela Inicial com Matriz 3x3 Simétrica de Categorias
- 9 categorias regulares (*Acessórios, Desenvolvimento, Escritório, Flatpak, Gráficos, Internet, Jogos, Mídia, Sistema*) organizadas em grade simétrica 3x3 perfeita, sem lacunas.
- **Cápsulas de Contagem Fixas (82px):** Badges padronizados com suporte a contagens até 999 e adição automática do prefixo `+` (`+999 apps`) para grandes volumes.
- **Carrossel de Destaques:** Rotação automática e manual dos banners oficiais do Linux Mint (Blender, LibreOffice, GIMP, VLC, Steam, Inkscape).

### 📏 5. Barra de 11 Abas com Distribuição Uniforme (100% de Largura)
- Ocupação total da largura horizontal da janela, eliminando espaços vazios à direita.
- **Consistência Geométrica:** Cada aba ocupa exatamente a mesma fração de largura (`flex-1 min-w-0`), com ícones e textos perfeitamente centralizados.
- **Ordenação Alfabética Estrita:** *Destaques* como aba inicial à extrema esquerda, *Todos* à extrema direita e as 9 intermediárias rigorosamente ordenadas de A a S.

### 🌐 6. Catálogo Híbrido & Integração Online Flathub
- Catálogo de **183 aplicações reais**, combinando os principais utilitários nativos do sistema APT e Flatpaks populares.
- Busca ao vivo consumindo a **API REST v2 oficial do Flathub** (`flathub.org/api/v2/search`) com *debounce* inteligente e cache local.

### ⚙️ 7. Central de Preferências Modular
- Modal de configurações estilo GTK com 4 abas:
  - **Pesquisa:** Configuração de escopo (título, resumo, descrição, ID do pacote).
  - **Flatpaks:** Alternador de busca ao vivo e preferências de empacotamento (Todos, Apenas Flatpak, Apenas APT).
  - **Segurança & Sandbox:** Modo Simulação Ativo e confirmação de ações em lote.
  - **Manutenção:** Limpeza de cache local e restauração de padrões de fábrica.
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

## 🚀 Como Executar

### 1. Inicialização Rápida
No terminal do seu Linux Mint ou qualquer distribuição Linux:
```bash
./run.sh
```
O script verifica o ambiente, instala as dependências necessárias e abre automaticamente o navegador em `http://localhost:3000`.

### 2. Execução Manual via npm
```bash
# Instalação das dependências
npm install

# Inicialização em modo desenvolvimento
npm run dev

# Build de produção otimizado
npm run build

# Pré-visualização do build de produção
npm run preview
```

---

## 🧪 Suíte de Testes Automatizados (Gauntlet Tests)

O projeto possui uma suíte rigorosa de 48 testes cobrindo integridade de catálogo, algoritmos de ordenação, paridade visual e regras de negócio:

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
