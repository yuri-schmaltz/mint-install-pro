# Política de Segurança (Security Policy)

A segurança do sistema operacional hospedeiro é um pilar fundamental no desenvolvimento do **Mint Install Pro**.

---

## 🛡️ Modelo de Isolamento e Sandbox

A aplicação implementa por padrão o **Modo Sandbox Seguro**:

1. **Simulação Não Destrutiva**:
   - Por padrão, o alternador **Sandbox Seguro** no HeaderBar permanece ativo.
   - Nesse modo, qualquer ação de instalação, atualização ou remoção em lote é executada em um ambiente de terminal simulado interativo.
   - Nenhuma chamada `pkexec`, `apt-get remove` ou `flatpak uninstall` destrutiva é executada na raiz do sistema operacional sem consentimento explícito.
2. **Proteção Contra Travas do APT**:
   - O sistema evita concorrência desordenada em arquivos de bloqueio do APT (`/var/lib/dpkg/lock-frontend`).
3. **Flathub Verification**:
   - Pacotes Flatpak consultados via API externa trazem metadados e badges de verificação de desenvolvedor oficial conforme catalogado no Flathub.

---

## 🔒 Notificação de Vulnerabilidades

Caso você descubra uma vulnerabilidade de segurança:

1. **Não abra uma issue pública** detalhando a exploração.
2. Envie um e-mail com os detalhes técnicos e passos para reprodução para o mantenedor do repositório:
   - **Responsável:** Yuri Schmaltz
   - **GitHub:** [@yuri-schmaltz](https://github.com/yuri-schmaltz)
3. Você receberá uma resposta em até 48 horas com uma avaliação inicial e o cronograma de correção.
