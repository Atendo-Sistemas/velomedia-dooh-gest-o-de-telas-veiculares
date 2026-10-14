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

A implantação suportada neste repositório é uma única instância Node.js com persistência JSON em disco local. O arquivo deve ficar em um volume persistente e ser incluído em backups. Esta implementação não conecta ao PostgreSQL: `server/db/schema.sql` e `server/repository.ts` ainda não são usados pela API. Não execute múltiplas instâncias nem coloque os dados em um disco efêmero ou compartilhado; o armazenamento JSON síncrono é destinado a instalações pequenas e não oferece alta disponibilidade.

O sistema também não integra um provedor PIX transacional nem concilia pagamentos por webhook. Cobranças são recusadas explicitamente, inclusive se credenciais PIX forem informadas; não use a resposta de cobrança como confirmação de pagamento.

### Instalação

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

   Altere `app.example.com` no Caddyfile para o domínio apontado para a VPS. A configuração do Caddy termina TLS automaticamente. Libere no firewall apenas SSH e HTTP/HTTPS; a aplicação deve permanecer em `127.0.0.1:3000`.

6. Inicie e verifique o serviço:

   ```sh
   sudo systemctl daemon-reload
   sudo systemctl enable --now velomedia
   sudo systemctl status velomedia
   curl --fail http://127.0.0.1:3000/api/health
   ```

   Os logs ficam disponíveis com `sudo journalctl -u velomedia -f`. O primeiro início cria uma organização vazia e o administrador definidos pelas variáveis `INITIAL_*`; essas variáveis não alteram uma instalação que já tenha dados.

### Atualização e backups

Faça backup de `DATA_FILE_PATH` antes de cada atualização. Pare o serviço, atualize o código, execute `npm ci` e `npm run build`, depois inicie o serviço novamente. Teste periodicamente a restauração do backup. A troca da senha inicial no arquivo de ambiente não redefine senhas existentes.

## Comandos

- `npm run dev` — desenvolvimento com Vite.
- `npm run build` — compila o frontend e o servidor.
- `npm start` — inicia o servidor compilado.
- `npm run lint` — valida os tipos TypeScript.
- `npm test` — executa testes automatizados.
