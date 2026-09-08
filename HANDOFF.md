# mint-install-pro — Handoff de Desenvolvimento

> **Status atual**: 1.3.2 publicada + hotfix 1 mergeado + hotfix 6 (infra diagnóstico) commitado localmente. Bug crítico de "tela cinza" no batch action **ainda NÃO resolvido** — agora com infra completa de DebugDock + emergency log pra capturar o estado em campo.
>
> **Última release publicada**: [v1.3.2](https://github.com/yuri-schmaltz/mint-install-pro/releases/tag/v1.3.2) com `.deb` 1.27 MB.
>
> **Próxima release (hotfix 6)**: branch local pronto, build OK, 121/121 testes, aguarda push + tag + release. **Inclui toda a infra de diagnóstico do handoff (hotfixes 2-5) + 3 fixes preventivos preemptivos** (StrictMode-safe, backdrop-blur-xs→sm, Cache-Control no-store).
>
> **Stack**: React 18 + Vite 5 + Tailwind 3 + Python launcher (GTK WebView via PyGObject) + Debian packaging.

---

## 1. O que é o projeto

`mint-install-pro` é um **gerenciador visual de pacotes** para Linux Mint, com:

- Catálogo reativo de 1.800 apps (APT + Flathub) servido em `public/data/`
- UI GTK-style clone do `mintinstall` oficial do Linux Mint
- Backend Python embarcado no `.deb` (servidor HTTP + endpoints `/api/install` / `/api/uninstall` / `/api/installed`)
- Distribuído como `.deb` instalável em Linux Mint 22.x (Zena)

**Inspiração visual**: clone do `mintinstall` 6.1.4 oficial. Veja em https://github.com/linuxmint/mintinstall.

---

## 2. Histórico até agora

### v1.3.1 (já released)
- GitHub Actions CI
- Badge "Flatpak ausente" no header
- Skeletons de loading
- Deduplicação cross-kind (APT + Flatpak do mesmo app)

### v1.3.2 — Gauntlet loop completo (release atual)

**PR #11** ([1a8ea15](https://github.com/yuri-schmaltz/mint-install-pro/commit/1a8ea15)) — 4 sprints resolveram 17 débitos técnicos:

| Sprint | Foco | Débitos | Mudanças principais |
|---|---|---|---|
| **1** | Performance | #1, #2, #3 | `indexCatalog()` pré-computa `_haystack`/`_nameLower`/`isFlatpak` em O(N). `useInstalledMap` separa `Map<id,bool>` do localStorage (debounce 500ms). `filteredApps` O(N²)→O(N). Bundle 1.2MB→266KB. |
| **2** | Refactor | #5, #6, #7, #8 | 5 custom hooks extraídos (useCatalog, useFilteredApps, useBatchSelection, useNavigation, useInstalledMap). `App.jsx` 539→302 linhas. `git rm scripts/extract_catalog.py`. PropTypes. Lockfile regenerado. |
| **3** | Robustez | #9, #10, #11, #12 | `build_deb.py` try_gtk_webview retorna (ok,reason) + diálogo GTK. `HeaderBar` fallback morto removido. `window.alert()`→`Toast` component. `ErrorBoundary` em `main.jsx`. |
| **4** | UX + Testes | #14, #15, #16, #17 | `npm audit` no CI. Keyboard nav (Tab/Esc/Ctrl+A). Export/Import installedMap. `React.lazy` em 2 modais (bundle -35%). 20 testes vitest com `@testing-library/react` + jsdom. |

**PR #12 (2568885)** — Merge de `sprint/gauntlet-perf` → `master`.

### v1.3.2 hotfix 1 (PR #13, f1d200a) — primeira tentativa de fix
Aplicado após user reportar tela cinza. Tentou 3 fixes:
- `BatchActionModal` → eager import (era lazy)
- `backdrop-blur-xs` → `backdrop-blur-sm` (compat WebKit2)
- `processQueue` ganhou try/catch

**Resultado: NÃO resolveu. A tela cinza persiste.**

### v1.3.2 hotfix 6 (PR #14 — branch local pronto, aguardando push)
**Infraestrutura de diagnóstico completa** + 3 fixes preventivos preemptivos. Resolve débitos #H1-H6 do handoff.

**Mudanças:**
- `src/services/debugLog.js` (NOVO, 108 linhas): logger persistente com ring buffer 200 entradas em `localStorage[mip_debug_log_v1]`. API: `debugLog()`, `getDebugSnapshot()`, `clearDebug()`, `pushEmergencyLog()`, `pushLastReactError()`.
- `src/components/DebugDock.jsx` (NOVO, 160 linhas): dock flutuante canto inferior esquerdo, **fora** da árvore do `<App />`. Botão `DEBUG (N)` sempre visível. Painel com auto-refresh 2s + botão "Copiar JSON".
- `src/main.jsx`: handlers globais `window.onerror` + `unhandledrejection` → `localStorage[mip_emergency_log]`. `<DebugDock />` montado fora do StrictMode/ErrorBoundary.
- `src/App.jsx`: `debugLog('info', 'App', 'Iniciando batch execution', ...)` + `useEffect` de render que loga estado UI completo.
- `src/components/BatchActionModal.jsx`: logs de mount, por item, por result, fatal com stack. **useEffect StrictMode-safe** via `useRef` (deps: `[targetApps, actionType, onComplete]`).
- `src/services/packageManager.js`: logs em executeInstall/Uninstall + status HTTP + fallback simulado.
- `src/components/ErrorBoundary.jsx`: `pushLastReactError()` em `componentDidCatch` → `localStorage[mip_last_error]`.
- `src/components/HeaderBar.jsx`: `backdrop-blur-xs` → `backdrop-blur-sm` no About modal (consistência com hotfix 1).
- `scripts/build_deb.py`: `end_headers()` override → `Cache-Control: no-store, no-cache, must-revalidate` em **toda** resposta. Logs `[mip-http]` e `[mip-launcher]` agora vão pro stderr.

**Validação:**
- 121/121 testes custom runner + 20/20 vitest
- Build OK (3.66s, +0.5 KB bundle)
- Sintaxe Python validada
- `.deb` gerado: 1.27 MB

---

## 3. 🐛 Bug em aberto: tela cinza no batch action

### Sintoma
1. User abre o app
2. Seleciona 1-4 apps instalados
3. Clica "Executar Ações"
4. **A tela fica totalmente cinza** (`#1f2124` body ou `#26292d` App background)
5. Nada acontece, sem modal visível, sem logs no terminal do launcher

### Hipóteses investigadas (e descartadas ou mitigadas)

1. ~~React.lazy demorando pra baixar chunk do BatchActionModal~~ → eager import (hotfix 1)
2. ~~backdrop-blur-xs incompatível com WebKit2~~ → trocado por `bg-black/85` sem blur (hotfix 1)
3. ~~processQueue sem try/catch~~ → adicionado try/catch duplo (hotfix 1)
4. ~~ErrorBoundary não captura~~ → confirmado que captura
5. ~~Cache do WebView servindo bundle antigo~~ → adicionado `Cache-Control: no-store` (hotfix 6)
6. ~~DebugDock escondido quando totalCount===0~~ → sempre visível agora (hotfix 6)
7. ~~StrictMode disparando processQueue 2x~~ → `hasStartedRef` guard (hotfix 6, prevent)
8. ~~Inconsistência de backdrop-blur-xs no About modal~~ → trocado por `sm` (hotfix 6, prevent)

### Instrumentação agora disponível (hotfix 6, MERGEADO localmente)

- `src/services/debugLog.js` — logger com ring buffer no `localStorage[mip_debug_log_v1]`
- `src/components/DebugDock.jsx` — dock flutuante canto inferior esquerdo
- `main.jsx` — `<DebugDock />` **fora** do `<App />` (sobrevive a crash do React)
- `main.jsx` — `window.onerror` + `unhandledrejection` em `localStorage[mip_emergency_log]`
- `ErrorBoundary` — `localStorage[mip_last_error]` com stack trace
- `App.jsx` — `useEffect` que chama `debugLog('debug', 'App', 'App renderizou', ...)` em todo render
- `BatchActionModal` — logs de mount, processQueue, fetch start/OK/not-ok/threw, fatal error
- `packageManager.js` — logs em fetch `/api/install` e `/api/uninstall`
- `build_deb.py` — `print(...file=sys.stderr)` em `do_GET` e `do_POST` do launcher

### Próximo passo concreto (PRIORIDADE 1)

1. ✅ Commit local pronto (branch master com hotfix 6)
2. ⏳ Push + tag `v1.3.2-hotfix6` + release no GitHub
3. ⏳ User instala o hotfix 6 (substitui o 1.27 MB)
4. ⏳ User fecha app completamente + reinstala + abre
5. ⏳ User clica "DEBUG (N)" no canto inferior esquerdo
6. ⏳ User clica "Executar Ações" (com 1 app selecionado)
7. ⏳ User clica "Copiar JSON" no dock + cola o JSON
8. ⏳ Analisar `debugLog` + `emergencyLog` + `lastReactError`
9. ⏳ Identificar root cause (provavelmente: hook que explode quando `batchModal` muda)
10. ⏳ Fix mínimo + commitar

**Hipótese atual forte**: O `<App />` está crashando em render logo após `setBatchModal({...})` ser chamado. Possíveis causas:
- Algum `useMemo` que estoura com deps inválidas
- Algum hook que tenta acessar `null` quando `batchModal` muda
- Algum componente lazy (`AppDetailsModal` ou `SettingsModal`) que falha ao ser renderizado em paralelo
- Suspensense fallback aparecendo sem o modal (race no lazy chunk)

**IMPORTANTE**: Com o DebugDock + emergency log, **qualquer crash** agora deixa rastro persistente. O próximo report do user vai trazer o JSON com `entries` + `emergencyLog` + `lastReactError` — análise deve ser imediata.

---

## 4. Arquitetura

### Frontend

```
src/
├── main.jsx                    # Entry: ReactDOM + ErrorBoundary + DebugDock + emergency log
├── App.jsx                     # 302 linhas, hook composition
├── components/
│   ├── HeaderBar.jsx           # Hamburger menu + About modal + About toggle
│   ├── CategoryNav.jsx         # Tabs horizontais (Destaques, Acessórios, ...)
│   ├── AppGrid.jsx             # Grid de cards com paginação infinita
│   ├── AppCard.jsx             # Card individual (tabIndex=0, keyboard nav)
│   ├── LandingPage.jsx         # Hero carousel + grid de categorias
│   ├── AppDetailsModal.jsx     # Modal de detalhes (LAZY)
│   ├── BatchActionModal.jsx    # Modal de install/uninstall em lote (EAGER)
│   ├── BatchActionBar.jsx      # Footer com "Executar Ações"
│   ├── SettingsModal.jsx       # Modal de settings (LAZY)
│   ├── Toast.jsx               # Toast notif (info/success/error)
│   ├── ErrorBoundary.jsx       # Captura React errors → localStorage
│   └── DebugDock.jsx           # 🚧 NOVO (hotfix): dock de debug
├── hooks/
│   ├── useCatalog.js           # Carrega catalog.json via fetch lazy
│   ├── useFilteredApps.js      # O(N) filter usando catalogIndex.byName + _haystack
│   ├── useBatchSelection.js    # selectedAppIds + selectAll + removeFromSelection
│   ├── useNavigation.js        # currentView (landing/list) + navHistory
│   └── useInstalledMap.js      # Map<id,bool> + localStorage debounced
├── services/
│   ├── catalog.js              # loadFullCatalog() → CatalogIndex
│   ├── catalogIndex.js         # indexCatalog(apps) → {apps, byName, countByCategory, countByKind}
│   ├── flathubApi.js           # fetch /api/installed (com 503 handling)
│   ├── packageManager.js       # executeInstall/Uninstall → fetch /api/*
│   └── debugLog.js             # 🚧 NOVO (hotfix): logger pra localStorage
├── data/
│   └── initialApps.js          # Catálogo fallback embutido (~30KB)
└── data/initialApps.js
```

### Backend (Python no `.deb`)

`scripts/build_deb.py` → gera `r"""..."""` (raw string multi-linha) que vira `/usr/bin/mint-install-pro`:

- **`find_free_port()`** — pega porta TCP livre
- **`run_server(port)`** — `http.server` servindo `dist/` (com `Cache-Control: no-store` no hotfix)
- **`try_gtk_webview(url)`** — abre GTK Window com WebKit2; retorna `(ok, reason)`
- **`show_error_dialog(reason, url)`** — diálogo GTK explicando erro
- **`main()`** — start thread server, GTK WebView, fallback pra `--browser` ou `--force-browser`

Endpoints:
- `GET /api/installed` → `flatpak list --app --columns=application` ou 503
- `POST /api/install` → `pkexec apt-get install` ou `flatpak install --user`
- `POST /api/uninstall` → `pkexec apt-get remove` ou `flatpak uninstall --user`
- Validação estrita de `app_id` (regex APT e FLATPAK) contra Command Injection

### Build pipeline

```
npm run build       # vite build → dist/
npm run build:deb   # npm run build && python3 scripts/build_deb.py
                     # Gera /tmp/mint-install-pro_1.3.2_all/DEBIAN/control
                     # Empacota em mint-install-pro_1.3.2_all.deb
```

`scripts/build_deb.py` é o **único** script que monta o `.deb`. Cuidado com o `r"""..."""` raw string — **docstrings dentro devem usar `'''` (não `"""`)** porque raw strings ainda respeitam o terminador (veja #bug do commit `c140630`).

---

## 5. Convenções importantes

### Conventional Commits
```
perf(catalog): pré-computa índices O(1)
refactor(app): extrai 5 custom hooks
feat(robustness): ErrorBoundary + Toast
test(unit): adiciona @testing-library/react + vitest
chore(release): bump 1.3.1 → 1.3.2
fix(batch): resolve tela cinza ao clicar "Executar Ações"
```

### PAT (Personal Access Token) security
- PAT real **NUNCA** em código ou MEMORY.md
- Usar env var ou `<REDACTED>` em logs
- `git push` com `credential.helper` inline:
  ```bash
  GIT_SSL_NO_VERIFY=true git -c credential.helper='!f() { sleep 1; echo username=$PAT; echo password=$PAT; }; f' push origin <branch>
  ```
- **Auto-revogar PATs <5min após uso** (mas API moderna de revogação requer `client_id` específico que só aparece na UI; marcar pra revogação manual em https://github.com/settings/tokens)

### Branches
- `master` é a branch de release
- Feature branches prefixadas com `sprint/`, `fix/`, `feature/`
- PR via squash merge

### Build conventions
- Eager import: componentes críticos (BatchActionModal)
- Lazy: modais pesados (AppDetailsModal, SettingsModal)
- Suspense fallback SEMPRE visível (nunca `null` — é o que causa "tela cinza")
- `Cache-Control: no-store` em todo response do launcher (hotfix 5)

---

## 6. Comandos úteis

```bash
# Setup
cd /workspace/mint-install-pro
npm install --legacy-peer-deps    # tem peer deps que reclamam

# Dev
npm run dev                       # vite dev server em 127.0.0.1:3000
npm test                          # 121/121 (test runner custom)
npm run test:unit                 # 20/20 vitest com @testing-library/react
npm run build                     # vite build → dist/
npm run build:deb                 # build + .deb

# Inspeção
dpkg-deb -x mint-install-pro_X.Y.Z_all.deb extracted/   # extrai o .deb
ls extracted/usr/share/mint-install-pro/dist/           # vê o bundle

# Git
GIT_SSL_NO_VERIFY=true git fetch origin --prune
git checkout master && git reset --hard origin/master

# Publish
curl -X POST -H "Authorization: token $PAT" \
  https://api.github.com/repos/yuri-schmaltz/mint-install-pro/pulls \
  -d '{"title":"...","head":"...","base":"master","body":"..."}'
curl -X PUT -H "Authorization: token $PAT" \
  https://api.github.com/repos/yuri-schmaltz/mint-install-pro/pulls/N/merge \
  -d '{"commit_title":"...","merge_method":"squash"}'
```

---

## 7. Próximos passos concretos (em ordem)

### Imediato (publicar hotfix 6)
1. ✅ Working tree com hotfix 6 pronto (DebugDock + debugLog + 3 fixes preventivos)
2. ✅ Build OK + 121/121 testes + .deb gerado
3. ⏳ Commit + push + tag v1.3.2-hotfix6 + release no GitHub
4. ⏳ User instala hotfix 6 + reproduz o bug + envia JSON do DebugDock

### Resolver o bug (após hotfix 6 em campo)
1. ⏳ User fecha app completamente + reinstala + abre
2. ⏳ User clica "DEBUG (N)" no canto inferior esquerdo
3. ⏳ User clica "Executar Ações" (com 1 app selecionado)
4. ⏳ User clica "Copiar JSON" no dock + cola o JSON no issue
5. ⏳ Analisar `debugLog` + `emergencyLog` + `lastReactError`
6. ⏳ Identificar root cause
7. ⏳ Fix mínimo + commitar hotfix 7

### Curto prazo
1. PR + nova release v1.3.2 hotfix 7 (após análise do DebugDock JSON)
2. Validar: 121/121 test + 20/20 vitest + reproduzir fix em campo

### Médio prazo (próximas features)
- M1-M14 do Maestro-style sprint UI/UX (análogo ao que rolou em `Maestro 2.1.0`)
  - Job queue global com SSE
  - Prompt autosave + recovery
  - Versioning de generations
  - Quick preview
  - Seed lock
  - Inpaint (M6: parcial regenerate)
  - Visual storyboard
  - Command palette (Cmd+K)
  - Web Workers pra UI não travar
- Migrar `useCatalog` pra usar `loadCatalogIndex()` (8KB) em vez de full catalog (1MB) na primeira render

### Longo prazo
- Multi-repository index (xreader, gimp, darktable, etc) — gerência de forks do user
- Sync automatizado com upstream

---

## 8. Contatos / Links úteis

- **Repo**: https://github.com/yuri-schmaltz/mint-install-pro
- **Release atual**: https://github.com/yuri-schmaltz/mint-install-pro/releases/tag/v1.3.2
- **PRs recentes**: #11 (v1.3.1), #12 (v1.3.2), #13 (hotfix 1)
- **Catálogo upstream**: `public/data/catalog.json` (~1MB) — regenerado por `scripts/build_full_catalog.py`
- **Inspiração UI**: `linuxmint/mintinstall` 6.1.4 (clone visual)

---

## 9. Gotchas conhecidas

1. **`r"""..."""` raw string em `build_deb.py`**: docstrings internas DEVEM usar `'''`. Raw strings ainda respeitam `"""` como terminador.
2. **WebKit2 GTK quirks**: `backdrop-filter` com blur < 4px pode falhar. `overflow-hidden` no body. Service worker/HTTP cache.
3. **StrictMode em dev**: useEffect roda 2x. Em prod, 1x.
4. **Vite tree-shaking**: `DebugDock` foi removido em uma build por ser considerado dead code (não era). Importar explicitamente em `main.jsx` resolve.
5. **React 18 batch update**: setState dentro de `useEffect` é batched. Cuidado com closures stale.
6. **`SimpleHTTPRequestHandler` do Python**: não envia Cache-Control por default. Adicionar manualmente em `end_headers`.

---

## 10. Estado do disco (referência rápida)

```
/workspace/mint-install-pro/
├── src/                         # código fonte
│   ├── services/
│   │   ├── debugLog.js          # NOVO (hotfix 6) — logger persistente
│   │   ├── packageManager.js    # instrumentado
│   │   └── ...
│   ├── components/
│   │   ├── DebugDock.jsx        # NOVO (hotfix 6) — dock flutuante
│   │   ├── BatchActionModal.jsx # StrictMode-safe (hotfix 6)
│   │   ├── HeaderBar.jsx        # backdrop-blur-sm (hotfix 6)
│   │   └── ...
│   ├── main.jsx                 # window.onerror + DebugDock (hotfix 6)
│   └── App.jsx                  # instrumentado
├── public/                      # assets estáticos + catalog.json
├── dist/                        # build de produção (gitignored)
├── scripts/
│   ├── build_deb.py             # Cache-Control no-store + logs (hotfix 6)
│   ├── test_runner.js           # 121 testes custom
│   ├── build_full_catalog.py    # regenera catalog.json
│   └── migrate_catalog.py       # retrofit kind em catálogos legados
├── .github/workflows/ci.yml     # npm audit + test + build
├── vite.config.js               # injeta VITE_APP_VERSION do package.json
├── vitest.config.js             # jsdom + @testing-library
├── package.json                 # v1.3.2, name "mint-install-pro"
├── package-lock.json            # regerado
├── HANDOFF.md                   # ← ESTE ARQUIVO (atualizado pós-hotfix 6)
├── CHANGELOG.md                 # Keep a Changelog format (hotfix 6 adicionado)
├── README.md                    # PT-BR
└── mint-install-pro_1.3.2_all.deb  # 1.27 MB, último build (hotfix 6)
```

**Working tree** (hotfix 6 pronto para commit): 7 modificados + 2 novos:

```
M  scripts/build_deb.py
M  src/App.jsx
M  src/components/BatchActionModal.jsx
M  src/components/ErrorBoundary.jsx
M  src/components/HeaderBar.jsx
M  src/main.jsx
M  src/services/packageManager.js
?? src/components/DebugDock.jsx
?? src/services/debugLog.js
?? HANDOFF.md
```

**Último commit em master**: `f1d200a hotfix: tela cinza no batch action (v1.3.2 hotfix 1)`.

---

## TL;DR

1. **App é um clone do mintinstall 6.1.4 do Linux Mint**, escrito em React+Vite, com backend Python embarcado no `.deb`.
2. **v1.3.2 lançada** com 4 sprints + 1 hotfix. 121 testes passando. 20 testes vitest. Build OK.
3. **🐛 Bug crítico não resolvido**: "tela cinza" ao clicar "Executar Ações". Não consigo reproduzir localmente (sem GTK WebView no sandbox).
4. **Hotfix 6 implementado e validado** (working tree pronto): toda a infra de diagnóstico (DebugDock + debugLog + window.onerror/unhandledrejection + ErrorBoundary log) + 3 fixes preventivos (StrictMode-safe, backdrop-blur-xs→sm, Cache-Control no-store + logs no launcher).
5. **Próximo passo imediato**: commitar + pushar hotfix 6, fazer release `v1.3.2-hotfix6`, user instala e envia JSON do DebugDock, e aí fazer fix cirúrgico hotfix 7.
