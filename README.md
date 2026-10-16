# VeloMedia DOOH

Painel web e API para gestão de telas veiculares. O backend e o frontend são compilados para `dist/` e servidos pelo mesmo processo Node.js.

## Desenvolvimento

Requisitos: Node.js 22 ou superior e npm.

```sh
npm ci
npm run dev
```

Em desenvolvimento, o sistema cria dados demonstrativos em `data/velomedia_store.json`. Não use esses dados nem a senha demonstrativa em produção.

## VPS Linux

A implantação suportada neste repositório é uma única instância Node.js com persistência JSON em disco local, executada diretamente no host ou em Docker Compose. O arquivo deve ficar em armazenamento persistente e ser incluído em backups. Esta implementação não conecta ao PostgreSQL: `server/db/schema.sql` e `server/repository.ts` ainda não são usados pela API. Não execute múltiplas instâncias nem coloque os dados em um disco efêmero ou compartilhado; o armazenamento JSON síncrono é destinado a instalações pequenas e não oferece alta disponibilidade.

O sistema também não integra um provedor PIX transacional nem concilia pagamentos por webhook ou repasses. Cobranças, webhooks de pagamento e repasses são recusados explicitamente, inclusive se credenciais PIX forem informadas; não marque faturas como pagas nem considere um repasse concluído fora de uma integração real.

### Docker Compose (VPS com outros sistemas)

O Compose mantém a aplicação e seus dados isolados em um container e em um volume nomeado. A porta do host é publicada somente em `127.0.0.1`, para que apenas um proxy reverso local possa acessá-la; escolha uma porta livre exclusiva para cada aplicação instalada na VPS.

1. Instale Docker Engine com o plugin Compose e Caddy no host. Disponibilize o repositório em `/opt/velomedia` e prepare a configuração:

   ```sh
   cd /opt/velomedia
   cp .env.example .env
   chmod 600 .env
   ```

2. Configure `INITIAL_ADMIN_EMAIL`, uma senha exclusiva de pelo menos 16 caracteres, `WEBHOOK_SECRET` (gere com `openssl rand -hex 32`) e `CORS_ALLOWED_ORIGINS` com a origem HTTPS do domínio. `APP_HOST_PORT` deve ser uma porta livre no host; use `3300` ou escolha outra. Não publique essa porta na internet.

3. Inicie e confira a aplicação:

   ```sh
   docker compose up -d --build
   docker compose ps
   curl --fail http://127.0.0.1:3300/api/health
   ```

   O container escuta em sua rede privada Docker; o mapeamento para `127.0.0.1` mantém a porta inacessível externamente. O volume `velomedia_data` persiste os dados entre reconstruções e reinicializações. `docker compose down` não remove o volume; não use `docker compose down -v` em uma instalação com dados que deseja preservar. Faça backup periódico do volume e teste sua restauração.

4. Atualize o domínio no arquivo `deploy/Caddyfile.docker`, mantendo `reverse_proxy 127.0.0.1:3300`, e incorpore esse bloco ao Caddyfile compartilhado do host sem substituir os sites dos outros sistemas. Se escolheu outra porta, ajuste os dois locais. Configure DNS para a VPS e libere no firewall apenas SSH e HTTP/HTTPS.

5. Acompanhe a implantação com `docker compose logs -f app`. O primeiro início cria a organização e o super administrador configurados; em armazenamento existente, cria/promove o administrador configurado somente se ainda não houver um super administrador.

O Dockerfile usa uma imagem de runtime sem dependências de desenvolvimento, usuário não-root, sistema de arquivos somente leitura e remove capabilities Linux. A instalação por systemd abaixo continua disponível e usa a porta local configurada no arquivo de ambiente.

### Instalação sem Docker (systemd)

1. Instale Node.js 22 ou superior, Caddy e crie um usuário de serviço sem login interativo chamado `velomedia`.
2. Disponibilize o código em `/opt/velomedia`, instale as dependências e gere os arquivos de produção:

   ```sh
   cd /opt/velomedia
   npm install
   npm run build
   ```

3. Crie os diretórios de estado e configuração:

   ```sh
   sudo install -d -o velomedia -g velomedia /var/lib/velomedia
   sudo install -d -o root -g velomedia -m 0750 /etc/velomedia
   ```

4. Copie `.env.example` para `/etc/velomedia/velomedia.env`. Configure o domínio HTTPS, o e-mail e uma senha exclusiva de pelo menos 16 caracteres. Gere `WEBHOOK_SECRET` com `openssl rand -hex 32`. Restrinja o arquivo de configuração:

   ```sh
   sudo chown root:velomedia /etc/velomedia/velomedia.env
   sudo chmod 0640 /etc/velomedia/velomedia.env
   ```

   `CORS_ALLOWED_ORIGINS` deve conter apenas origens HTTPS completas, separadas por vírgula, sem caminhos ou `*`. `DATA_FILE_PATH` deve apontar para o arquivo dentro de `/var/lib/velomedia`.

5. Instale e ative os arquivos de serviço e proxy:

   ```sh
   sudo cp deploy/velomedia.service /etc/systemd/system/
   sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
   ```

   `app.example.com` é apenas um exemplo: substitua pelo domínio real, com DNS apontado para a VPS, tanto no Caddyfile quanto em `CORS_ALLOWED_ORIGINS`. A configuração do Caddy termina TLS automaticamente. Libere no firewall apenas SSH e HTTP/HTTPS; o serviço fixa `NODE_ENV=production` e mantém a aplicação em `127.0.0.1:3000`. A API rejeita origens não autorizadas em operações que alteram dados e envia cabeçalhos HTTP de segurança.

6. Inicie e verifique o serviço:

   ```sh
   sudo systemctl daemon-reload
   sudo systemctl enable --now velomedia
   sudo systemctl status velomedia
   curl --fail http://127.0.0.1:3000/api/health
   ```

   Os logs ficam disponíveis com `sudo journalctl -u velomedia -f`. O primeiro início cria uma organização vazia e o super administrador definidos pelas variáveis `INITIAL_*`; em uma instalação existente, cria/promove o administrador configurado somente se ainda não houver um super administrador.

### Atualização e backups

Faça backup de `DATA_FILE_PATH` antes de cada atualização. Pare o serviço, atualize o código, execute `npm ci` e `npm run build`, depois inicie o serviço novamente. Teste periodicamente a restauração do backup. A troca da senha inicial no arquivo de ambiente não redefine senhas existentes.

## Comandos

- `npm run dev` — desenvolvimento com Vite.
- `npm run build` — compila o frontend e o servidor.
- `npm start` — inicia o servidor compilado.
- `npm run lint` — valida os tipos TypeScript.
- `npm test` — executa testes automatizados.
