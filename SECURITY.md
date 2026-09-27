# Segurança

O Mint Install Pro executa operações reais de APT e Flatpak. Falhas de rede,
HTTP, autenticação ou comando são apresentadas como falha; não há simulação
implícita de sucesso.

## API local

O desenvolvimento, o preview e o pacote `.deb` usam `scripts/package_backend.py`.
O Vite encaminha `/api/*` para uma instância local desse serviço. No pacote,
o launcher GTK usa o mesmo servidor para a API e os arquivos da interface.

- Bind em `127.0.0.1`; validação de IP de loopback e hostname local.
- POST exige `Origin` igual à origem do `Host` e `Content-Type: application/json`.
- Requisições com origem estrangeira, `Origin: null` ou `Sec-Fetch-Site: cross-site`
  são rejeitadas. O servidor não concede acesso CORS.
- Corpo de POST limitado a 8 KiB e leitura com timeout.
- `packageType` explícito (`apt` ou `flatpak`); IDs validados com `fullmatch`.
- Comandos recebem uma lista de argumentos, sem shell, com `--` antes do ID nas
  operações de instalação e remoção.
- Uma transação por instância do servidor, protegida por lock. Operações externas
  ou outras instâncias continuam sujeitas aos locks próprios do APT/Flatpak.
- APT usa `pkexec apt-get`; o sistema solicita autorização quando necessária.
- Flatpak instala no escopo do usuário. Remoções consultam e removem os escopos
  de usuário e sistema em que o app estiver instalado.
- A lista de instalados vem do `dpkg-query` e de `flatpak list`; flags do catálogo
  e backups importados não comprovam instalação.

A proteção de origem impede que páginas de outras origens usem a API pelo
navegador. Ela não é uma barreira contra processos já executando como o usuário
local, que podem enviar seus próprios cabeçalhos HTTP.

## Verificação

`npm run test:backend` testa a API com executor simulado, inclusive origem,
validação, concorrência, falhas e escopos Flatpak. `npm run test:e2e` verifica
os fluxos de interface em desenvolvimento e produção com transações interceptadas.
Nenhum desses testes instala ou remove pacotes reais.

`npm audit --audit-level=moderate` é uma etapa bloqueante do CI. A ausência de
avisos nessa ferramenta não substitui os testes de comportamento.

## Relato de problemas

Não publique detalhes de exploração em uma issue pública. Entre em contato com
[Yuri Schmaltz](https://github.com/yuri-schmaltz), mantenedor do projeto, para
combinar o envio privado de um relato reproduzível.
