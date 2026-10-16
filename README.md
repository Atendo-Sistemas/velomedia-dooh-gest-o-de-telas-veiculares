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

Production requires a valid PostgreSQL `DATABASE_URL`; startup fails closed if it is missing or invalid. The API and auth use the asynchronous repository, not the synchronous JSON store. The existing relational schema is installed at startup, then ordered SQL migrations are applied transactionally and recorded in `schema_migrations`.

The API preserves its existing domain object shapes as JSONB records in `repository_records`, indexed by type and tenant. Sessions, device credentials, pairing tokens, replay nonces, webhook idempotency and remote commands use dedicated PostgreSQL tables. Tenant-scoped operations query and mutate records with their organization ID. Pairing-token consumption is atomic; PoP/replay insertion and campaign/device/driver counters run in a database transaction with row locks. PostgreSQL is the production source of truth; back up the database, not an app JSON file.

PIX provider integration, real payment webhooks and driver payouts are not implemented. The API rejects these operations rather than claiming a payment was processed.

### Docker Compose

1. Install Docker Engine with Compose and Caddy. Put the repository at `/opt/velomedia`:

   ```sh
   cd /opt/velomedia
   cp .env.example .env
   chmod 600 .env
   ```

2. Set `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` (at least 16 characters), `WEBHOOK_SECRET` (`openssl rand -hex 32`), `POSTGRES_PASSWORD` (`openssl rand -hex 24`), and `CORS_ALLOWED_ORIGINS` to the HTTPS origin. Use a URL-safe hex DB password for Compose's generated URL. Set `APP_HOST_PORT` to a free local port (default `3300`); do not expose it publicly.

3. Start and verify:

   ```sh
   docker compose up -d --build
   docker compose ps
   curl --fail http://127.0.0.1:3300/api/health
   ```

   PostgreSQL runs privately with a readiness health check and named volume `velomedia_postgres`; the app waits for PostgreSQL to be healthy. Only the app port is published on loopback. `docker compose down` retains the volume. Never use `docker compose down -v` if you need the data.

4. Configure the real domain in `deploy/Caddyfile.docker`; keep the `reverse_proxy` target on the matching loopback port. Point DNS to the VPS, configure the shared reverse proxy without replacing other sites, and allow only SSH/HTTP/HTTPS through the firewall.

5. Review `docker compose logs -f app`. Startup applies pending schema migrations and creates the configured initial admin only when needed. Existing super-admin password hashes are retained; changing `INITIAL_ADMIN_PASSWORD` does not reset an existing password.

### Migrate an existing JSON VPS

First stop the old app, take a protected backup/copy of its JSON store, create an **empty** PostgreSQL database, and configure `DATABASE_URL`, `INITIAL_ADMIN_EMAIL`, and `INITIAL_ADMIN_PASSWORD`. Run the one-time importer from the repository root:

```sh
npx tsx server/db/import-json.ts /secure/path/velomedia_store.json
```

The importer rejects non-empty repository/session/security tables, imports the existing users with their password hashes (plus active sessions and device security state), and leaves the source file untouched. It runs migrations before importing and then performs the normal super-admin bootstrap without replacing an imported password hash. Verify record counts and sign-in before directing traffic to the new app. Keep the JSON backup until a PostgreSQL backup has been restored and checked.

### systemd with a separately managed PostgreSQL server

Install Node.js 22+, PostgreSQL, Caddy and a non-login `velomedia` service user. Install dependencies and build as documented below. Copy `.env.example` to `/etc/velomedia/velomedia.env`, set `DATABASE_URL` to the PostgreSQL connection string, configure the initial admin, webhook secret and HTTPS CORS origin, then restrict the file to root and the service group (`0640`). Set `PGSSL=true` where the database provider requires TLS. Install `deploy/velomedia.service` and `deploy/Caddyfile`; configure the real hostname and start with:

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now velomedia
sudo systemctl status velomedia
```

`DATABASE_URL` credentials must be URL-encoded. Permit network access to PostgreSQL only from the app host and use a least-privilege database role.

### Updates and backups

Take and test PostgreSQL backups regularly. Before updating, back up the database, stop the app, update code, run `npm ci` and `npm run build`, then start the app and review logs. Migrations are transactional and run at startup. Test restoring backups separately from routine upgrades.

## Commands

- `npm run dev` — development server with Vite.
- `npm run build` — compiles the frontend and server.
- `npm start` — starts the compiled server.
- `npm run lint` — validates TypeScript.
- `npm test` — runs automated tests.
