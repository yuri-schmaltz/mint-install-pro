# Política de Segurança (Security Policy)

A segurança do sistema operacional hospedeiro é um pilar fundamental no desenvolvimento do **Mint Install Pro**.

---

## 🛡️ Arquitetura de Segurança e Blindagem de Execução

O **Mint Install Pro** interage de forma nativa e segura com os subsistemas de gerenciamento de pacotes do Linux Mint (`APT` e `Flatpak`), implementando defesas multicamadas contra vulnerabilidades comuns:

### 1. Prevenção Contra Injeção de Argumentos e Comandos (CWE-88 / CWE-78)
- **Whitelisting Rigoroso por Expressão Regular**:
  - Pacotes APT são validados via regex: `^[a-z0-9][a-z0-9+\.\-]{1,63}$`.
  - Aplicativos Flatpak são validados via regex: `^[a-zA-Z0-9_\-]+(\.[a-zA-Z0-9_\-]+)+$`.
  - Qualquer tentativa de submeter identificadores começando com hífen (`-`), com espaços, metacaracteres shell (`;`, `|`, `&`, `$`, `` ` ``), ou caracteres de travessia de diretório (`..`, `/`) é sumariamente rejeitada com erro `HTTP 400`.
- **Delimitador de Fim de Opções (`--`)**:
  - Todas as chamadas de subprocessos invocam os utilitários do sistema com o separador `--` antes dos nomes de pacotes (ex.: `flatpak install ... -- <appId>` e `apt-get install -y -- <pkgId>`). Isso garante que os utilitários processem os valores estritamente como operandos e nunca como parâmetros de linha de comando.

### 2. Restrição Estrita de Loopback e Proteção CSRF
- **Binding Localhost**: Os servidores de apoio (`vite` e `mint-install-pro` daemon) realizam bind estrito na interface `127.0.0.1`, impedindo acesso ou requisições oriundas de outros dispositivos na rede local (LAN).
- **Validação de IP e Origem**: O middleware de API verifica se o IP de origem pertence ao loopback (`127.0.0.1` / `::1`) e rejeita requisições cross-origin não autorizadas.

### 3. Prevenção de Condições de Corrida e Travas do DPKG (CWE-362)
- **Mutex de Execução**: Um mecanismo de lock atômico garante que apenas uma transação de gerenciamento de pacotes ocorra por vez, evitando erros de concorrência e corrupção de bloqueios em `/var/lib/dpkg/lock-frontend`.

### 4. Execução Não-Interativa e Timeout
- Todas as operações executam com `DEBIAN_FRONTEND=noninteractive` e timeout seguro de 300 segundos, prevenindo bloqueios indefinidos de processos.

---

## 🔒 Notificação de Vulnerabilidades

Caso você descubra uma vulnerabilidade de segurança:

1. **Não abra uma issue pública** detalhando a exploração.
2. Envie um e-mail com os detalhes técnicos e passos para reprodução para o mantenedor do repositório:
   - **Responsável:** Yuri Schmaltz
   - **GitHub:** [@yuri-schmaltz](https://github.com/yuri-schmaltz)
3. Você receberá uma resposta com avaliação inicial e cronograma de correção.
