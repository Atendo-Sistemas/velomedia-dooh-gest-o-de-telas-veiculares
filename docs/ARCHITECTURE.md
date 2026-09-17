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
- **Autenticação & Sessões:** Cookies `HttpOnly`, `SameSite=Strict`, `Secure` com tokens de sessão assinados e expiração de 24h.
- **Autorização (RBAC):** Papéis hierárquicos:
  - `platform_admin`: Acesso irrestrito a todos os tenants e faturamento global.
  - `organization_admin`: Gestor da franquia ou operadora local DOOH.
  - `operator`: Operação técnica de telas e campanhas do tenant.
  - `advertiser`: Visualização de campanhas próprias, métricas e faturas.
  - `driver`: Extrato de corridas, saldo e chave PIX para repasse.
  - `device`: Credencial de longa duração gerada pós-pareamento para envio de telemetria e PoP.

### 2.2. Isolamento Multi-Tenant
- Todo recurso de dados no repositório (`devices`, `campaigns`, `drivers`, `geofences`, `invoices`) contém a coluna obrigatória `organizationId`.
- As consultas ao banco e endpoints de API **nunca** aceitam `organizationId` cego fornecido pelo cliente. O tenant é resolvido diretamente da sessão autenticada do usuário.
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
    "playerVersion": "2.4.0-prod",
    "signature": "hmac_sha256_hex_string"
  }
  ```
- O servidor valida:
  1. A chave secreta do dispositivo para recalcular o HMAC.
  2. A janela temporal de validade (máximo de 7 dias para envio retroativo de logs acumulados em zonas de sombra sem sinal).
  3. Prevenção de replay attacks (unicidade do `eventId` e do `nonce`).

### 2.4. Player Veicular Offline-First
- **Armazenamento Local:** As mídias (vídeos, banners, vinhetas) e a playlist ativa são cacheadas localmente no navegador/IndexedDB do dispositivo.
- **Fila de PoP Desconectada:** Impressões ocorridas sem conectividade 4G/5G são persistidas em fila local estruturada.
- **Sincronização Resiliente:** Assim que a rede é restabelecida, os logs são enviados em lotes (chunks de 20 eventos) com idempotência garantida.

### 2.5. Billing & Repasse aos Motoristas
- Cálculo automático do split de receita:
  - **BYOD (Hardware do Motorista):** 45% do CPM apurado das impressões ativas na tela.
  - **Comodato (Hardware da Franquia):** 20% do CPM apurado.
- Adaptador de Pagamento / PIX compatível com Banco Central (BR Code EMV) com registro auditável de cobranças e conciliação por webhooks protegidos por assinatura de segredo.
