# MVP Human Readiness P0-C Report

## Status geral

Em 2026-06-12, o Visadocs 360 avancou de MVP tecnicamente avancado para MVP API-ready para piloto humano guiado.

Este checkpoint documenta a validacao end-to-end P0-C executada em producao apos os patches P0-A e P0-B.

## Commits e PRs relevantes

- PR #52 / commit e7a564a: desabilitou POST /api/signup publico com HTTP 410.
- PR #53 / commit a76d974: criou POST /api/users tenant-scoped para criacao segura de ADMIN, RT e OPERADOR.
- Deploy production validado em a76d974, criado em 2026-06-12T17:24:43Z.

## Marker QA

Todos os dados criados no P0-C foram marcados com:

QA-P0C-20260612-143718

Tenant sandbox persistente:

cmqb9we7w0000l5048ovy8k8x

## Escopo validado

O teste P0-C validou, em producao, o fluxo minimo para piloto humano guiado:

- cadastro de farmacia;
- aprovacao de tenant;
- criacao automatica de ADMIN;
- login do ADMIN;
- criacao de RT e OPERADOR via POST /api/users;
- bloqueios de permissao para ADMIN e OPERADOR;
- criacao de item documental;
- criacao de CanonicalIngestionJob e CanonicalDocument;
- geracao de CanonicalChunk;
- idempotencia do chunking com HTTP 409 na segunda chamada;
- retrieval canonico com resultado;
- criacao de minuta POP assistida a partir de fontes canonicas;
- validacao de Pop e AssistedPopDraft em RASCUNHO;
- validacao de history;
- validacao de ApprovedPopVersion = 0.

## Matriz de assercoes

### Publico sem sessao

- POST /api/signup retornou 410.
- POST /api/users retornou 401.
- POST /api/pops/assisted-drafts/from-canonical-sources retornou 401.

### Onboarding de tenant

- POST /api/farmacias/cadastro criou tenant QA em PENDENTE.
- POST /api/farmacias/[id]/aprovar aprovou tenant para ATIVO.
- A aprovacao criou usuario ADMIN com senha temporaria.
- A senha temporaria nao foi impressa em chat/log.

### Usuarios e permissoes

- ADMIN logou com tenantId correto.
- ADMIN criou usuario RT com HTTP 201.
- ADMIN criou usuario OPERADOR com HTTP 201.
- ADMIN tentando criar ADMIN retornou HTTP 403.
- OPERADOR logou com tenantId correto.
- OPERADOR tentando criar usuario retornou HTTP 403.

### Camada canonica

- POST /api/document-library criou item documental com content.
- POST /api/canonical/ingestion-jobs criou CanonicalIngestionJob e CanonicalDocument.
- POST /api/canonical/documents/[id]/chunks criou 1 chunk canonico.
- Segunda chamada de chunking retornou HTTP 409.
- POST /api/canonical/retrievals retornou resultado com retrievalLogId.

### Ponte canonico para minuta POP

- POST /api/pops/assisted-drafts/from-canonical-sources retornou HTTP 201.
- Pop criado com status RASCUNHO.
- AssistedPopDraft criado com status RASCUNHO.
- Fontes canonicas foram associadas a minuta.
- GET /api/pops/assisted-drafts/[id]/history retornou HTTP 200.
- ApprovedPopVersion permaneceu 0.
- Nenhum POP vigente foi criado automaticamente.

## Decisoes de governanca

- Nao foi criado endpoint destrutivo de cleanup.
- Nao houve SQL direto.
- Nao houve Prisma manual, seed ou migracao.
- O tenant sandbox foi mantido em producao para QA recorrente.
- Senhas temporarias foram armazenadas apenas em memoria local do navegador durante o teste e removidas ao final.
- Cookies, tokens e headers Set-Cookie nao foram impressos.

## Status apos P0-C

O MVP esta API-ready para piloto humano guiado.

Ainda nao esta UI-ready para humanos reais nao guiados.

## Pendencias para MVP humano nao guiado

- UI para gestao de usuarios do tenant (criar RT e OPERADOR sem DevTools/API manual).
- UI para preparar item documental e enviar para camada canonica.
- UI para gerar chunks canonicos.
- UI para selecionar chunks/retrieval e criar minuta POP assistida.
- Rate limit/captcha para endpoints publicos.
- Rotacao da credencial de banco exposta antes de qualquer piloto externo.
- Runbook de piloto humano e suporte.

## Veredito

P0-C PASS.

O fluxo essencial de onboarding, usuarios, camada canonica, retrieval e criacao de minuta assistida foi validado em producao sem aprovacao automatica de POP e com ApprovedPopVersion = 0.

O proximo marco do projeto deve transformar o MVP de API-ready para UI-ready.
