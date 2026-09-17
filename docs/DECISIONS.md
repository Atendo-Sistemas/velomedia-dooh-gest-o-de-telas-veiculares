# Registros de Decisão Arquitetural (ADR) — VeloMedia DOOH

## ADR-001: Arquitetura Full-Stack Integrada (Express + Vite)
- **Status:** Aceito.
- **Contexto:** A plataforma precisa de uma API HTTP/REST protegida com autenticação server-side, cookies seguros e endpoints para dispositivos IoT, mantendo compatibilidade com a infraestrutura do AI Studio (Cloud Run, porta 3000 única).
- **Decisão:** Unificar o backend Express e o frontend Vite no arquivo `server.ts`. Em desenvolvimento, o Express utiliza `vite.middlewares`. Em produção, os arquivos estáticos compilados em `dist/` são servidos pelo Express e a API atende em `/api/v1/*`.
- **Alternativas Rejeitadas:** Criar dois processos em portas distintas (incompatível com o proxy reverso do Cloud Run que só expõe a porta 3000).

## ADR-002: Algoritmo de Assinatura para Proof of Play (HMAC-SHA256)
- **Status:** Aceito.
- **Contexto:** Anunciantes pagam por impressões auditadas. A função anterior de hash (`Math.abs(hash)... ...d9a`) não oferecia integridade nem autenticidade.
- **Decisão:** Cada dispositivo pareado recebe uma chave secreta (`deviceSecret`). Toda exibição gera um evento assinado com HMAC-SHA256 concatenando `eventId`, `deviceId`, `campaignId`, `startedAt`, `endedAt` e `nonce`. O backend recalcula e valida a assinatura antes de contabilizar faturamento ou repasse.
- **Alternativas Rejeitadas:** Assinatura assimétrica RSA/ECDSA no browser (overhead de processamento desnecessário para tablets veiculares de baixo custo; HMAC é eficiente e seguro com segredo compartilhado).

## ADR-003: Persistência Estruturada e Isolamento Multi-Tenant
- **Status:** Aceito.
- **Contexto:** A aplicação precisa persistir organizações, usuários, telas, campanhas, geofences, motoristas e faturas sem perder dados entre recargas ou reinicializações.
- **Decisão:** Implementar um motor de persistência relacional/estruturado com schema tipado e validação de tenant (`organizationId`) estrita em todas as operações de leitura e escrita. O tenant do operador é derivado da sessão autenticada.
- **Alternativas Rejeitadas:** Armazenar dados no `localStorage` do navegador do operador (inseguro e não colaborativo entre múltiplos administradores).

## ADR-004: Fila Local de PoP com Política Anti-Replay
- **Status:** Aceito.
- **Contexto:** Veículos transitam por túneis e áreas com sinal 4G/5G oscilante. O player não pode perder registros de exibição de anúncios.
- **Decisão:** O player armazena eventos na fila local com UUID e nonce único. Ao restabelecer a conexão, envia os logs em lote. O servidor descarta logs duplicados pelo `eventId` e rejeita eventos com timestamps anteriores a 7 dias.
- **Alternativas Rejeitadas:** Descartar impressões quando offline (prejuízo grave a anunciantes e motoristas parceiros).

## ADR-005: Integração de Pagamento & PIX com Adaptador Abstrato
- **Status:** Aceito.
- **Contexto:** O sistema precisa emitir cobranças e permitir repasses aos motoristas via PIX sem acoplamento a um provedor proprietário único.
- **Decisão:** Criar a interface `PaymentGatewayAdapter` com implementação completa para PIX (geração de payload EMV / BR Code e webhook com validação de HMAC) e modo de homologação/mock com dados auditáveis para desenvolvimento.
- **Alternativas Rejeitadas:** Implementar chamadas diretas a uma API bancária específica sem camada de abstração.
