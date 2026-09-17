# VeloMedia DOOH — Relatório de Remediação de Segurança & Auditoria V02

**Data da Auditoria:** 17 de Setembro de 2026  
**Auditor Responsável:** Equipe de Segurança & Arquitetura SaaS / IoT VeloMedia  
**Classificação:** Confidencial / Engenharia  

---

## 1. Sumário Executivo & Diagnóstico Inicial

A auditoria de segurança realizada no código da V02 identificou vulnerabilidades críticas que impediam a operação em produção. Este documento cataloga todos os riscos encontrados, o plano de remediação implementado e a matriz de testes de validação.

### Matriz de Vulnerabilidades e Riscos

| ID | Componente | Severidade | Vulnerabilidade | Risco | Remediação Aplicada |
|---|---|---|---|---|---|
| **SEC-01** | `server/auth.ts` | **CRÍTICA** | `resolveTenant` retornava `'org_sp_matriz'` para requisições anônimas | Vazamento massivo de dados multi-tenant sem autenticação | Remoção do fallback anônimo; exigência estrita de sessão ativa em todas as rotas privadas (`401`). |
| **SEC-02** | `server/api.ts` | **ALTA** | Login retornava `token` no corpo JSON | Exposição do token a XSS no frontend | Sessão exclusiva via Cookie `HttpOnly`, `Secure` e `SameSite=Lax`. Remoção do token da resposta JSON. |
| **SEC-03** | `server.ts` | **ALTA** | CORS permissivo `origin: true` com credenciais | Requisições maliciosas entre origens (CSRF) | Allowlist restrita via `CORS_ALLOWED_ORIGINS`, rejeição em produção para origens desconhecidas. |
| **SEC-04** | `server/storage.ts` | **CRÍTICA** | Operações CRUD não verificavam `organizationId` do recurso | Um tenant podia alterar ou excluir dispositivos e motoristas de outro tenant | Checagem forçada de tenant em `getById`, `save`, `update` e `delete`; retorno `404` para recursos cross-tenant. |
| **SEC-05** | `server/crypto.ts` | **ALTA** | Segredos de fallback hardcoded no código fonte | Comprometimento criptográfico geral se `.env` ausente | Falha estrita na inicialização (`fail-safe exit`) em produção se variáveis de ambiente estiverem ausentes. |
| **SEC-06** | `server/auth.ts` | **CRÍTICA** | Autenticação de tablet baseada apenas no header `x-device-id` | Falsificação de telemetria e PoP por qualquer cliente | Autenticação criptográfica de dispositivo via HMAC-SHA256 (com timestamp, nonce anti-replay e segredo único do dispositivo). |
| **SEC-07** | `server/api.ts` | **CRÍTICA** | Proof of Play assinado pelo servidor se cliente enviasse sem assinatura | Forja de impressões publicitárias e fraude financeira | Rejeição de PoP sem assinatura válida do dispositivo; validação de replay de `nonce` e `eventId`. |
| **SEC-08** | `server/storage.ts` | **MÉDIA** | Arquivo `velomedia_store.json` concorrente com flag `isSaving` que descartava alterações | Perda de dados sob concorrência e uso de arquivo em produção | Bloqueio de JSON em produção (`NODE_ENV=production`) exigindo PostgreSQL; escrita atômica em desenvolvimento. |
| **SEC-09** | `server/billing.ts` | **ALTA** | Gateway simulado gerava PIX com `Math.random()` e URL externa pública | Falsa liquidação financeira e vazamento de dados | Exibição explícita de `payment_provider_not_configured` quando não há gateway real; geração de TXID seguro (`crypto.randomBytes`). |
| **SEC-10** | `public/sw.js` & `manifest.json` | **MÉDIA** | SW referenciando `/src/main.tsx` e ícones PNG inexistentes | Falha do PWA Kiosk em produção e falha de cache offline | Correção dos paths do Service Worker e geração de ícones PNG padronizados 192x192 e 512x512. |
| **SEC-11** | `src/data/mockData.ts` | **MÉDIA** | Presença de CNPJs, nomes e telefones com formato real | Não conformidade com a LGPD e exposição pública | Anonimização completa para domínios `@example.invalid`, CNPJs de teste e identificadores de demonstração. |
| **SEC-12** | `src/App.tsx` | **ALTA** | Mutação otimista sem rollback e autorização via URL `?role=driver` | Bypass de autorização no frontend e dessincronização | Remoção de autorização por URL, tratamento robusto de erros e rollback de estado. |

---

## 2. Detalhamento Técnico das Correções

### 2.1 Autenticação e Gestão de Sessões
- Criados middlewares dedicados:
  - `requireUserAuth`: Exige cookie de sessão assinado e válido.
  - `requireDeviceAuth`: Exige assinatura HMAC do tablet com validação de timestamp (< 5 min) e nonce inédito.
  - `requireUserOrDeviceAuth`: Permite ingestão de telemetria mista ou endpoints compartilhados.
  - `requireRole(...)`: Impede escalonamento de privilégios entre operadores e administradores.
- Adicionado endpoint `POST /api/v1/auth/logout` que revoga ativamente o token na base de dados e limpa os cookies.
- Rate limiting com mitigação contra ataques de força bruta no endpoint `POST /api/v1/auth/login`.

### 2.2 Isolamento Multi-Tenant em Camada de Dados
- Todos os métodos de consulta e escrita em `storage.ts` exigem o parâmetro `organizationId` (salvo consultas exclusivas de `super_admin` / `platform_admin` devidamente auditadas).
- Métodos modificados:
  - `getDriverById(id, orgId)`
  - `saveDriver(driver, orgId)`
  - `deleteDriver(id, orgId)`
  - `getDeviceById(id, orgId)`
  - `saveDevice(device, orgId)`
  - `deleteDevice(id, orgId)`
  - `getCampaignById(id, orgId)`
  - `saveCampaign(campaign, orgId)`
  - `getGeoFenceById(id, orgId)`
  - `getAdvertiserById(id, orgId)`
  - `getInvoiceById(id, orgId)`
- Qualquer tentativa de acesso a ID existente em outro tenant resulta em `404 Not Found`.

### 2.3 Criptografia de Dispositivo e Proof-of-Play (Anti-Replay)
- Cada tablet recebe um segredo único (`deviceSecret`) durante o processo de pareamento.
- O payload de PoP deve ser assinado pelo dispositivo antes do envio.
- O servidor valida:
  1. Integridade: `HMAC-SHA256(canonicalPayload, deviceSecret) === providedSignature`.
  2. Unicidade de Evento: `eventId` nunca processado anteriormente.
  3. Unicidade de Nonce: `nonce` nunca processado anteriormente.
  4. Janela Temporal: `|now - endedAt| <= 300 segundos`.
  5. Pertencimento: Dispositivo vinculado à mesma organização da campanha.

---

## 3. Matriz de Testes Automatizados

Os testes automatizados em `tests/` cobrem:
1. `tests/auth_tenant.test.ts`: Testes de 401 anônimo, isolamento cross-tenant e RBAC.
2. `tests/device_auth.test.ts`: Autenticação criptográfica de tablet, anti-replay e rejeição de assinaturas adulteradas.
3. `tests/pop_verification.test.ts`: Validação de Proof of Play, rejeição de payloads forjados e idempotência.
4. `tests/billing_security.test.ts`: Adapters PIX, status de provedor não configurado e verificação de webhooks.
