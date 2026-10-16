# Arquitetura de Produção — VeloMedia DOOH

## 1. Visão Geral do Sistema

O **VeloMedia DOOH** é uma plataforma SaaS multi-tenant para veiculação de mídia digital out-of-home em telas veiculares (táxis, carros de aplicativo, frotas executivas). A solução engloba:

- **Painel Administrativo & Gestão SaaS:** Cadastro e operação de anunciantes, campanhas, geofences, frotas, motoristas e faturamento.
- **Player Kiosk PWA Veicular:** Aplicação cliente embarcada nos tablets automotivos, desenhada para operação *offline-first*, execução de playlists assinadas, captura de telemetria e registro inviolável de Proof of Play (PoP).
- **Backend API & Ingestão IoT:** Servidor corporativo responsável por autenticação RBAC, isolamento estrito de tenants, distribuição de playlists, ingestão em lote de telemetria e validação criptográfica de PoP.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                 VeloMedia DOOH                                   │
├──────────────────────────────┬───────────────────────────────────────────────────┤
│        Camada Cliente        │                   Camada Servidor                 │
│                              │                                                   │
│  ┌────────────────────────┐  │  ┌──────────────────────────────────────────────┐ │
│  │  Painel Web Operador   │──┼─>│  Express API (v1) - Autenticação & RBAC       │ │
│  │  (React 19 + Tailwind) │  │  │  - Isolamento de Tenant por Sessão           │ │
│  └────────────────────────┘  │  │  - Validação Zod & Middleware de Segurança   │ │
│                              │  └──────────────────────┬───────────────────────┘ │
│  ┌────────────────────────┐  │                         │                         │
│  │  Player Kiosk PWA      │  │  ┌──────────────────────▼───────────────────────┐ │
│  │  - Cache Offline       │──┼─>│  Módulo de Ingestão & Proof of Play          │ │
│  │  - HMAC-SHA256 PoP     │  │  │  - Verificação de Assinatura Criptográfica   │ │
│  │  - Fila Local Retry    │  │  │  - Anti-Replay via Nonce & Timestamps        │ │
│  └────────────────────────┘  │  └──────────────────────┬───────────────────────┘ │
│                              │                         │                         │
│  ┌────────────────────────┐  │  ┌──────────────────────▼───────────────────────┐ │
│  │  Portais Dedicados     │  │  │  Módulo de Faturamento & Repasses            │ │
│  │  - Motorista (PIX)     │──┼─>│  - Split de Comissão (BYOD vs Comodato)      │ │
│  │  - Anunciante (Métricas│  │  │  - Adaptador PIX / Gateways & Webhooks       │ │
│  └────────────────────────┘  │  └──────────────────────────────────────────────┘ │
└──────────────────────────────┴───────────────────────────────────────────────────┘
```

## 2. Componentes Arquiteturais

### 2.1. Backend API (`/api/v1`)
- **Runtime:** Node.js com TypeScript (executado via `tsx` em desenvolvimento e compilado para CJS no build).
- **Framework HTTP:** Express com middlewares de segurança (`cors`, `cookie-parser`, sanitização, headers de proteção).
- **Validação de Contratos:** Esquemas `Zod` rigorosos em todas as rotas de entrada (`POST`, `PUT`, `PATCH`).
- **Autenticação & Sessões:** Cookies `HttpOnly`, `SameSite=Lax`, `Secure` em produção e sessões persistidas em PostgreSQL com expiração de 7 dias.
- **Autorização (RBAC):** Papéis hierárquicos:
  - `platform_admin`: Acesso irrestrito a todos os tenants e faturamento global.
  - `organization_admin`: Gestor da franquia ou operadora local DOOH.
  - `operator`: Operação técnica de telas e campanhas do tenant.
  - `advertiser`: Visualização de campanhas próprias, métricas e faturas.
  - `driver`: Extrato de corridas, saldo e chave PIX para repasse.
  - `device`: Credencial de longa duração gerada pós-pareamento para envio de telemetria e PoP.

### 2.2. Isolamento Multi-Tenant
- O payload JSONB de cada recurso de domínio contém o `organizationId`, acompanhado por uma coluna indexada `organization_id` no envelope PostgreSQL `repository_records`.
- As consultas de recursos incluem o tenant resolvido da sessão; apenas administradores de plataforma podem selecionar outro tenant após validação da organização.
- Para requisições de dispositivos (`device`), a autorização é atrelada à credencial do tablet vinculada à organização no momento do pareamento.

### 2.3. Proof of Play (PoP) Criptográfico
- O protótipo utilizava uma função com `Math.abs(hash)... ...d9a` vulnerável e não verificável.
- Na arquitetura de produção, cada evento de exibição de anúncio gera um payload imutável:
  ```json
  {
    "eventId": "uuid-v4",
    "deviceId": "dev_01",
    "campaignId": "camp_01",
    "creativeId": "media_01",
    "startedAt": "2026-09-17T19:00:00.000Z",
    "endedAt": "2026-09-17T19:00:15.000Z",
    "durationObservedMs": 15000,
    "location": { "lat": -23.5505, "lng": -46.6333 },
    "speedKmH": 28.4,
    "nonce": "c4ca4238a0b923820dcc509a6f75849b",
    "playerVersion": "2.5.0-beta.4",
    "signature": "hmac_sha256_hex_string"
  }
  ```
- O servidor valida:
  1. A chave secreta do dispositivo para recalcular o HMAC.
  2. A janela temporal implementada (timestamp recente; o endpoint PoP rejeita eventos com mais de 10 minutos de diferença do relógio do servidor).
  3. Prevenção de replay attacks (unicidade do `eventId` e do `nonce`).

### 2.4. Player Veicular Offline-First
- **Armazenamento Local:** As mídias (vídeos, banners, vinhetas) e a playlist ativa são cacheadas localmente no navegador/IndexedDB do dispositivo.
- **Fila de PoP Desconectada:** Impressões ocorridas sem conectividade 4G/5G são persistidas em fila local estruturada.
- **Sincronização Resiliente:** Assim que a rede é restabelecida, os logs são enviados em lotes (chunks de 20 eventos) com idempotência garantida.

### 2.5. Billing & Repasse aos Motoristas
- Cálculo automático do split de receita:
  - **BYOD (Hardware do Motorista):** 45% do CPM apurado das impressões ativas na tela.
  - **Comodato (Hardware da Franquia):** 20% do CPM apurado.
- Os contadores de participação são persistidos junto com o PoP. Ainda não há integração transacional PIX, processamento ativo de webhook de pagamento ou execução de repasse; as rotas recusam essas operações.

### 2.6. Persistência PostgreSQL
- Produção exige `DATABASE_URL`; o armazenamento JSON só é instanciado em desenvolvimento.
- A inicialização serializa e aplica o `schema.sql` e migrações SQL versionadas, com registro em `schema_migrations`. As operações async da API e autenticação compartilham o repositório PostgreSQL.
- Dados de domínio usam JSONB em `repository_records` para preservar integralmente os contratos TypeScript atuais. Sessões, credenciais de dispositivo, tokens de pareamento, ledger anti-replay, webhooks e comandos remotos usam tabelas dedicadas. O consumo de token é um único `UPDATE ... RETURNING`; PoP, replay e contadores usam uma transação com bloqueio de linhas.
- `server/db/import-json.ts` importa uma cópia de um armazenamento JSON existente para um banco vazio sem alterar a fonte nem substituir hashes de senha importados.

### 2.7. Bootstrap público do player
- `GET /api/v1/player/:deviceCode` é público e read-only para abrir QR/PWA sem sessão administrativa. Procura o código exato, recusa telas inexistentes/retiradas e carrega campanhas somente do tenant dono da tela.
- Contrato estável (`PublicPlayerBootstrap` em `src/types.ts`): `{ device: { id, code, model, screenPosition, status }, campaigns: [{ id, name, advertiser, creative, schedule: { endDate } }], geoFences: [] }`. Campanhas ativas e elegíveis para a geofence da tela são filtradas no servidor e ordenadas por prioridade; budget/statistics, targeting, tenant columns, and the device location are not returned.
- Não retorna organização, telemetria/localização, placa/motorista, número de série, credenciais, sessões, métricas ou dados de faturamento. Campos de `device` e `campaigns` são projeções explícitas no repositório, para JSON e PostgreSQL.
