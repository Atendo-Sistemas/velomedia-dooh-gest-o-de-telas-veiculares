# Gaps de Produção & Plano de Remediação — VeloMedia DOOH

Este documento lista as fragilidades, riscos e débitos técnicos identificados na análise do protótipo inicial, acompanhados das medidas de remediação implementadas.

---

## 1. Gaps Identificados

| ID | Área | Fragilidade Encontrada no Protótipo | Risco em Produção | Status & Remediação |
|---|---|---|---|---|
| **GAP-01** | **Persistência** | Dados mantidos em memória via `useState` e constantes estáticas `INITIAL_*`. | Reiniciar o container ou atualizar a página em nova sessão resetava o estado. | **Resolvido:** Criação de camada de repositório server-side (`server/storage.ts`) com schema completo e persistência estruturada em disco/banco relacional. |
| **GAP-02** | **Criptografia PoP** | Função `generateProofOfPlayHash` gerava hash não-padrão truncado terminando em `...d9a`. | Fraude de anunciantes; impossibilidade de auditoria real de impressões publicitárias. | **Resolvido:** Substituição completa por HMAC-SHA256 real com chave secreta por dispositivo, nonce anti-replay e endpoint `/api/v1/proof-of-play/verify`. |
| **GAP-03** | **Segurança & Auth** | Autenticação puramente cosmética via URL params (`?role=driver`, `?role=advertiser`) e sem validação server-side. | Qualquer usuário pode acessar o painel SaaS Master alterando a URL. | **Resolvido:** Implementação de autenticação com senhas protegidas por hash forte com salt (PBKDF2/SHA-256), sessões HttpOnly e middleware RBAC no backend. |
| **GAP-04** | **Multi-Tenancy** | O frontend alternava de organização via estado de React `currentOrgId` sem validação do servidor. | Vazamento de dados entre empresas parceiras e anunciantes concorrentes. | **Resolvido:** O servidor valida o `organizationId` a partir da sessão segura; consultas filtram estritamente por tenant. |
| **GAP-05** | **Pareamento de Telas** | Pareamento gerava IDs manuais no cliente sem credencial de dispositivo nem ciclo de expiração. | Clonagem de dispositivos e injeção de impressões falsas. | **Resolvido:** Fluxo seguro de pareamento com token numérico de uso único e expiração (15 minutos), gerando segredo criptográfico do dispositivo. |
| **GAP-06** | **Telemetria & IoT** | Simulador em loop via `setInterval` e `Math.random()` rodava incondicionalmente no cliente. | Dados operacionais fictícios confundidos com veículos reais. | **Resolvido:** Ingestão real via endpoints `/api/v1/telemetry/heartbeat` e `/api/v1/telemetry/events`, com flag explícita isolando qualquer simulação de desenvolvimento. |
| **GAP-07** | **Billing & PIX** | Faturamento apenas visual com botões sem efeito transacional. | Falha no ciclo financeiro e conciliação de receitas/repasses. | **Resolvido:** Camada `PaymentGatewayAdapter` com suporte a faturas, QR Code PIX dinâmico com payload EMV padrão BCB e webhooks com assinatura secreta. |
| **GAP-08** | **Privacidade / LGPD** | Telefones, CPFs e nomes mockados expostos no código-fonte cliente. | Risco regulatório e de vazamento em pacotes públicos. | **Resolvido:** Higienização de dados para formato anônimo de teste de desenvolvimento e políticas documentadas de exclusão e retenção. |

---

## 2. Plano de Execução & Mitigações

1. **Backend Server (`server.ts`):** Servir tanto a API `/api/v1/*` quanto o Vite em modo middleware.
2. **Camada de Domínio e Validação:** Utilização de `zod` para checagem de tipos e sanitização contra injeções.
3. **Player Offline-First:** Armazenar playlist e fila de envio no cache local com retry exponencial.
4. **Testes Automatizados:** Testes unitários e de integração validando HMAC, isolamento multi-tenant e cálculo de comissões.
