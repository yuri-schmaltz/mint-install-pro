# Linux Mint App Manager (Clone)

Clone moderno e interativo do Gerenciador de Aplicativos oficial do Linux Mint (*MintInstall*), desenvolvido com fidelidade visual ao tema *Mint-Y Dark*.

## 📊 Diagnóstico e Planejamento

- **Análise SWOT:** Consulte o documento completo em `swot_analysis.md`
- **Relatório de Ações com Achados:** Consulte o roadmap priorizado em `action_plan_report.md`

---

## 🎯 Resumo da Análise SWOT

| Forças (Strengths) | Fraquezas (Weaknesses) |
|---|---|
| • Hospedado nativamente no Linux Mint 22.3<br>• Acesso ao código-fonte oficial em `/usr/lib/linuxmint/mintinstall/`<br>• Assets e ícones SVG oficiais presentes no sistema | • Cold start (início sem código inicial)<br>• Código legado do Mint em monolito de 134KB em Python/GTK3 síncrono<br>• Risco de bloqueio de travas APT |
| **Oportunidades (Opportunities)** | **Ameaças (Threats)** |
| • UI reativa ultra-rápida (tempo de resposta < 16ms)<br>• Arquitetura desacoplada (Frontend moderno + API)<br>• Modo Simulação / Sandbox seguro para testes sem risco ao SO | • Risco de quebra de pacotes vitais do sistema se executado `apt` sem salvaguardas<br>• Concorrência com outras ferramentas de atualização do SO |

---

## 🗺️ Roadmap de Ações Prioritárias (GUT)

1. **[P1] Fundação e Setup:** Inicialização do repositório e stack reativa moderna (Vite + React + Tailwind).
2. **[P1] UI Parity (Mint-Y Dark):** Criação da HeaderBar GTK, Grid de 3 colunas e cards de aplicativos com notas, estrelas e status de instalação.
3. **[P2] Busca e Interatividade:** Filtro em tempo real (< 5ms) e Modal de Detalhes com simulação de instalação/remoção.
4. **[P2] Dados Nativos:** Integração com os dados oficiais de categorias e ícones do Linux Mint.
5. **[P3] Conectividade e Empacotamento:** Modo seguro de isolamento e script de inicialização facilitado.
