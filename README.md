# VeloMedia DOOH

Painel web e API para gestão de telas veiculares. O frontend e o servidor são compilados para `dist/` e servidos pelo mesmo processo Node.js.

## Desenvolvimento

Requisitos: Node.js 22 ou superior e npm.

```sh
npm ci
npm run dev
```

Sem `DATABASE_URL`, desenvolvimento usa o armazenamento JSON em `data/velomedia_store.json` com dados demonstrativos. Configure `DATABASE_URL` em desenvolvimento para exercitar PostgreSQL. O armazenamento JSON é desabilitado no processo de produção.

## VPS Linux: produção

A produção exige uma `DATABASE_URL` válida para o PostgreSQL; se ela estiver ausente ou inválida, a inicialização é interrompida. A API e a autenticação usam o repositório assíncrono, não o armazenamento JSON síncrono. O esquema relacional existente é instalado na inicialização; em seguida, as migrações SQL são aplicadas em ordem, dentro de transações, e registradas em `schema_migrations`.

A API mantém o formato atual dos objetos de domínio como registros JSONB em `repository_records`, indexados por tipo e organização. Sessões, credenciais de dispositivos, tokens de pareamento, nonces anti-replay, controle de idempotência de webhooks e comandos remotos usam tabelas próprias no PostgreSQL. As operações isoladas por organização consultam e alteram registros usando o ID da organização. O consumo de tokens de pareamento é atômico; a gravação de PoP e anti-replay, assim como os contadores de campanhas, dispositivos e motoristas, ocorre em transações com bloqueio de linhas. O PostgreSQL é a fonte oficial dos dados em produção: faça backup do banco, não de um arquivo JSON da aplicação.

A cobrança PIX de organizações e anunciantes está integrada ao Asaas. No faturamento SaaS, administradores emitem recargas para anunciantes com CPF/CNPJ e contato de cobrança cadastrados; a fatura e o QR Code ficam persistidos por organização, e o crédito pré-pago só é liberado quando o webhook do Asaas confirma o pagamento. Configure as credenciais e o webhook conforme a seção de cobranças abaixo. Repasses PIX a motoristas ainda não estão integrados; a API não deve marcar esses pagamentos como concluídos.

Usuários com perfil de anunciante são vinculados a uma única conta de anunciante pelo painel de usuários. Após autenticar, acessam somente o portal financeiro dessa conta: campanhas e comprovantes de exibição associados, saldo e cobranças. O portal cria faturas persistidas e solicita PIX ao Asaas; uma cobrança só aparece como paga após a confirmação do webhook. Credenciais de anunciante são provisionadas por um administrador e exigem senha inicial de pelo menos 16 caracteres.
O player público por QR Code carrega dados de campanhas próprios para exibição sem uma sessão administrativa. O envio de registros de exibição (Proof of Play) ainda exige uma credencial de dispositivo provisionada e uma requisição assinada; a inicialização pública do quiosque não expõe nem cria essa credencial.

Planos, usuários, motoristas, organizações, anunciantes e logs de auditoria são gerenciados pela API e persistidos no repositório configurado. O painel de superusuário permite criar e editar planos e usuários, consultar logs globais e alterar a própria senha; as operações administrativas são restritas por função. A contratação de plano cria uma fatura PIX e a ativação ocorre após confirmação do pagamento pelo webhook Asaas. Os registros dos usuários e dos logs também são gravados no PostgreSQL em produção.

### Docker Compose

1. Instale o Docker Engine com Compose e o Caddy. Coloque o repositório em `/opt/velomedia`:

   ```sh
   cd /opt/velomedia
   cp .env.example .env
   chmod 600 .env
   ```

2. Configure `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` (com pelo menos 16 caracteres), `WEBHOOK_SECRET` (`openssl rand -hex 32`), `POSTGRES_PASSWORD` e `POSTGRES_APP_PASSWORD` (gere cada uma com `openssl rand -hex 24`) e defina `CORS_ALLOWED_ORIGINS` com a origem HTTPS. O Compose inicializa um usuário administrador do banco e um usuário separado para a aplicação; este último recebe somente as permissões de banco/esquema necessárias às migrações de inicialização. Use credenciais hexadecimais seguras para URLs no formato usado pelo Compose. Defina `APP_HOST_PORT` como uma porta local livre (padrão `3300`); não a exponha publicamente.

3. Inicie e verifique:

   ```sh
   docker compose up -d --build
   docker compose ps
   curl --fail http://127.0.0.1:3300/api/health
   ```

   O PostgreSQL é executado em rede privada, com verificação de disponibilidade e volume nomeado `velomedia_postgres`; a aplicação aguarda o PostgreSQL ficar disponível. A verificação `/api/health` da aplicação também confirma a conexão com o banco. Somente a porta da aplicação é publicada no endereço local (loopback). `docker compose down` mantém o volume. Se precisar dos dados, nunca use `docker compose down -v`.

4. Configure o domínio real em `deploy/Caddyfile.docker`; mantenha o destino de `reverse_proxy` na porta loopback correspondente. Aponte o DNS para a VPS, configure o proxy reverso compartilhado sem substituir outros sites e permita somente SSH/HTTP/HTTPS no firewall.

5. Acompanhe `docker compose logs -f app`. Na inicialização, as migrações pendentes do esquema são aplicadas e o administrador inicial configurado é criado somente se necessário. Os hashes de senha de superadministradores existentes são mantidos; alterar `INITIAL_ADMIN_PASSWORD` não redefine uma senha existente.

### Cobranças PIX pelo Asaas

Selecione `PIX_GATEWAY_PROVIDER=asaas`, defina `ASAAS_API_KEY` e configure `ASAAS_ENVIRONMENT` como `sandbox` para testes ou `production` para cobranças reais. Defina `ASAAS_WEBHOOK_TOKEN` como um valor aleatório exclusivo de 32 a 255 caracteres (sem espaços) e cadastre `https://<seu-dominio>/api/v1/webhooks/asaas` no painel Asaas usando o mesmo token. Inscreva-se nos eventos `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED` e `PAYMENT_OVERDUE`; o Asaas envia o token configurado no cabeçalho `asaas-access-token`.

O endpoint de PIX de faturas cria ou reutiliza um cliente Asaas com base no CNPJ da organização e no contato de cobrança, cria ou reutiliza um pagamento PIX usando a fatura como referência externa e retorna o código copia e cola e a imagem do QR Code. O webhook confirma somente pagamentos cujo ID no provedor, referência da fatura e valor correspondam a uma fatura registrada localmente. Teste com credenciais sandbox do Asaas antes de habilitar a produção. Nunca registre chaves de API ou tokens de webhook no repositório.

### Migrar uma VPS existente com armazenamento JSON

Primeiro, pare a aplicação antiga, faça uma cópia protegida do armazenamento JSON, crie um banco PostgreSQL **vazio** e configure `DATABASE_URL`, `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD`. Em uma instalação com systemd diretamente no host, execute o comando a partir da raiz do repositório (com as dependências de desenvolvimento instaladas):

```sh
npx tsx server/db/import-json.ts /secure/path/velomedia_store.json
```

No Docker Compose, primeiro crie a imagem da aplicação e depois execute o importador incluído em um contêiner temporário (a origem é montada como somente leitura):

```sh
docker compose run --rm --user "$(id -u):$(id -g)" \
  -v /secure/path/velomedia_store.json:/migration/source.json:ro \
  --entrypoint node app dist/db-import.cjs /migration/source.json
```

O importador rejeita tabelas de repositório, sessão ou segurança que não estejam vazias, importa os usuários existentes com seus hashes de senha (além das sessões ativas e do estado de segurança dos dispositivos) e não altera o arquivo de origem. Ele executa as migrações antes da importação e, em seguida, realiza a inicialização normal do superadministrador sem substituir hashes de senha importados. Verifique as quantidades de registros e o login antes de direcionar o tráfego para a nova aplicação. Mantenha o backup JSON até que um backup PostgreSQL tenha sido restaurado e validado.

### systemd com servidor PostgreSQL gerenciado separadamente

Instale Node.js 22+, PostgreSQL, Caddy e um usuário de serviço `velomedia` sem permissão de login. Instale as dependências e gere a compilação (`npm ci && npm run build`). Peça ao administrador do banco para instalar previamente `uuid-ossp` e `pgcrypto` e, em seguida, conceder ao usuário da aplicação as permissões de conexão ao banco e de uso/criação do esquema necessárias às migrações versionadas de inicialização. Copie `.env.example` para `/etc/velomedia/velomedia.env`, defina `DATABASE_URL` com a URL de conexão do PostgreSQL e configure o administrador inicial, o segredo de webhook e a origem HTTPS do CORS; depois, restrinja o acesso ao arquivo ao root e ao grupo do serviço (`0640`). Defina `PGSSL=true` quando o provedor do banco exigir TLS. Instale `deploy/velomedia.service` e `deploy/Caddyfile`, configure o nome de domínio real e inicie com:

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now velomedia
sudo systemctl status velomedia
```

As credenciais de `DATABASE_URL` devem estar codificadas para URL. Permita acesso de rede ao PostgreSQL somente a partir do host da aplicação e use uma função de banco com o mínimo de privilégios necessário.

### Atualizações e backups

Faça backups do PostgreSQL regularmente e teste a restauração. Antes de atualizar, faça backup do banco, pare a aplicação, atualize o código, execute `npm ci` e `npm run build`, depois inicie a aplicação e verifique os logs. As migrações são transacionais e executadas na inicialização. Teste a restauração de backups separadamente das atualizações de rotina.

## Commands

- `npm run dev` — inicia o servidor de desenvolvimento com Vite.
- `npm run build` — compila o frontend e o servidor.
- `npm start` — inicia o servidor compilado.
- `npm run lint` — valida o TypeScript.
- `npm test` — executa os testes automatizados.
