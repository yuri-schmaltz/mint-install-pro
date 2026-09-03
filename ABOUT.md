# Sobre o Mint Install Pro (About)

## 🌿 Origem e Propósito

O **Mint Install Pro** nasceu como uma reengenharia moderna do tradicional **Gerenciador de Aplicativos do Linux Mint** (*mintinstall*). O objetivo principal foi preservar a essência visual e a identidade icônica do ecossistema Linux Mint (Cinnamon e tema Mint-Y Dark), ao mesmo tempo em que supera limitações históricas de desempenho, reatividade e flexibilidade funcional.

---

## ⚖️ Comparativo: MintInstall Clássico vs. Mint Install Pro

| Aspecto | MintInstall Tradicional (`/usr/lib/linuxmint/mintinstall`) | Mint Install Pro (Esta Aplicação) |
|---|---|---|
| **Arquitetura** | Monolítico em Python 3 / PyGObject / GTK3 (~134 KB em um único arquivo) | SPA desacoplada moderna em React 18, Vite e Tailwind CSS |
| **Tempo de Resposta (Busca)** | Síncrono no loop principal (GTK MainLoop), sujeito a travamentos durante consultas pesadas | Reativo e assíncrono (< 5ms de latência), com *debounce* e filtragem imediata em memória |
| **Ações em Lote** | Ausente (operações estritamente individuais de instalação/desinstalação) | **Suporte completo a lote**: marcação múltipla com contadores independentes e fila de execução |
| **Feedback Visual de Estado** | Ícones estáticos e checkmarks isolados | **Cromatografia dinâmica**: check verde no checkbox para instalados, transição para vermelho/laranja escuro ao desmarcar para remoção |
| **Navegação & Ergonomia** | 8 categorias originais em lista assimétrica; abas fixas | **11 abas com distribuição uniforme (100% de largura)**, 9 categorias em matriz 3x3 simétrica e ordenação alfabética estrita |
| **Contadores de Categorias** | Números dinâmicos sem limitação visual de quebra | **Cápsulas fixas de 82px** com suporte inteligente a contagem até 999 e transbordo `+999 apps` |
| **Conectividade Flathub** | Consulta Flatpak via chamadas síncronas locais de subprocessos | Integração híbrida: lê Flatpaks locais e consulta ao vivo a **API REST v2 oficial do Flathub** |
| **Segurança & Execução** | Execução direta sem sanitização rigorosa de argumentos | **Arquitetura blindada nativa**: whitelist regex contra Argument Injection (CWE-88), delimitador `--`, loopback estrito (127.0.0.1) e mutex de processos |

---

## 🏛️ Arquitetura do Sistema

O projeto segue princípios de engenharia limpa e separação de preocupações:

```
src/
├── components/
│   ├── HeaderBar.jsx          # Barra superior GTK: controle de janela, busca, contador e menu
│   ├── CategoryNav.jsx        # Barra de 11 abas: distribuição uniforme e ordenação alfabética estrita
│   ├── LandingPage.jsx        # Tela de Destaques: carrossel de banners e matriz 3x3 de categorias
│   ├── AppGrid.jsx            # Grade responsiva de 3 colunas de cards com paginação dinâmica
│   ├── AppCard.jsx            # Card individual memoizado: checkbox, transição cromática e rating
│   ├── AppDetailsModal.jsx    # Modal de detalhes técnicos, screenshots, permissões e dependências
│   ├── BatchActionBar.jsx     # Barra de rodapé dedicada com botão unificado "Executar Ações"
│   ├── BatchActionModal.jsx   # Terminal de progresso e execução real de pacotes APT/Flatpak
│   └── SettingsModal.jsx      # Central de preferências persistidas em localStorage
├── data/
│   └── initialApps.js         # Catálogo de 1.800 aplicações estruturadas
└── services/
    ├── flathubApi.js          # Cliente HTTP para a API REST v2 do Flathub
    └── packageManager.js      # Despachador seguro de comandos reais APT e Flatpak
```

---

## 🧠 Filosofia de Design: *Mint-Y Dark Reimagined*

1. **Pixel Parity**: Cada detalhe visual — desde o raio de curvatura de 3px dos checkboxes até os gradientes escuros e bordas de destaque em verde Mint (`#87cf3e`) — foi calibrado diretamente a partir de capturas de tela oficiais do Linux Mint 22.3 (Zena).
2. **Cromatografia Funcional**: As cores não são meramente decorativas; transmitem estado de forma imediata. O verde indica saúde e presença no sistema; a transição para vermelho/laranja escuro ao desmarcar o checkbox sinaliza uma intenção de remoção antes da confirmação irreversível.
3. **Equilíbrio Espacial**: A introdução das categorias *Desenvolvimento* e *Escritório* harmonizou a tela inicial em uma grade perfeita de 3x3 sem espaços vagos, enquanto a expansão da barra de navegação para 100% da largura horizontal equilibra a janela em qualquer monitor.

---

## 👨‍💻 Autor e Licença

Desenvolvido por **Yuri Schmaltz** (2026).  
Distribuído sob a licença **MIT**.
