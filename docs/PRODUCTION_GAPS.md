# Gaps de Produção & Plano de Remediação — VeloMedia DOOH

Este documento lista as fragilidades, riscos e débitos técnicos identificados na análise do protótipo inicial, acompanhados das medidas de remediação implementadas.

---

## 1. Lacunas identificadas

| ID | Área | Fragilidade encontrada no protótipo | Risco em produção | Status e correção |
|---|---|---|---|---|
| **GAP-01** | **Persistência** | Dados mantidos em memória via `useState` e constantes estáticas `INITIAL_*`. | Reiniciar o container ou atualizar a página em nova sessão resetava o estado. | **Resolvido para beta VPS:** API/auth async via `VeloRepository`, PostgreSQL obrigatório em produção, migrações versionadas e import explícito de JSON legado. JSON permanece apenas para desenvolvimento. |
| **GAP-02** | **Criptografia PoP** | Função `generateProofOfPlayHash` gerava hash não-padrão truncado terminando em `...d9a`. | Fraude de anunciantes; impossibilidade de auditoria real de impressões publicitárias. | **Resolvido:** Substituição completa por HMAC-SHA256 real com chave secreta por dispositivo, nonce anti-replay e endpoint `/api/v1/proof-of-play/verify`. |
| **GAP-03** | **Segurança e autenticação** | Autenticação puramente cosmética via parâmetros de URL (`?role=driver`, `?role=advertiser`) e sem validação no servidor. | Qualquer usuário pode acessar o painel SaaS Master alterando a URL. | **Resolvido:** Implementação de autenticação com senhas protegidas por hash forte com salt (PBKDF2/SHA-256), sessões HttpOnly e middleware RBAC no backend. |
| **GAP-04** | **Isolamento entre organizações** | O frontend alternava de organização via estado de React `currentOrgId` sem validação do servidor. | Vazamento de dados entre empresas parceiras e anunciantes concorrentes. | **Resolvido:** O servidor valida o `organizationId` a partir da sessão segura; as consultas são filtradas estritamente pela organização. |
| **GAP-05** | **Pareamento de Telas** | Pareamento gerava IDs manuais no cliente sem credencial de dispositivo nem ciclo de expiração. | Clonagem de dispositivos e injeção de impressões falsas. | **Implementado:** Token numérico de uso único, consumo atômico no PostgreSQL e expiração de 10 minutos; gera segredo criptográfico do dispositivo. |
| **GAP-06** | **Telemetria e IoT** | Simulador em loop via `setInterval` e `Math.random()` rodava incondicionalmente no cliente. | Dados operacionais fictícios confundidos com veículos reais. | **Resolvido:** Ingestão real via endpoints `/api/v1/telemetry/heartbeat` e `/api/v1/telemetry/events`, com sinalizador explícito isolando qualquer simulação de desenvolvimento. |
| **GAP-07** | **Faturamento e PIX** | Faturamento apenas visual, com botões sem efeito transacional. | Falha no ciclo financeiro e na conciliação de receitas e repasses. | **Parcial:** Cobranças PIX de organizações e recargas de anunciantes são emitidas pelo Asaas e conciliadas pelo webhook; repasses a motoristas seguem sem integração transacional. |
| **GAP-08** | **Privacidade / LGPD** | Telefones, CPFs e nomes mockados expostos no código-fonte cliente. | Risco regulatório e de vazamento em pacotes públicos. | **Resolvido:** Higienização de dados para formato anônimo de teste de desenvolvimento e políticas documentadas de exclusão e retenção. |

---

## 2. Plano de execução e mitigações

1. **Servidor de backend (`server.ts`):** Servir tanto a API `/api/v1/*` quanto o Vite em modo middleware.
2. **Camada de domínio e validação:** Utilizar `zod` para validação de tipos e sanitização contra injeções.
3. **Player com operação offline prioritária:** Armazenar a playlist e a fila de envio no cache local com novas tentativas em intervalos exponenciais.
4. **Testes automatizados:** Testes unitários e de integração para validar HMAC, isolamento entre organizações e cálculo de comissões.
